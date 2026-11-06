// Checks how the tmdb function orders search results, without deploying it. Run from the repo root:
//   node --experimental-strip-types --no-warnings tests/tmdb-search.check.mjs
import assert from "node:assert/strict";

let handler;
globalThis.Deno = { serve: (fn) => { handler = fn; }, env: { get: () => "token" } };

const film = (id, title, vote_count) => ({ id, title, vote_count, release_date: "2019-01-01", overview: "" });
let pages = {};
let failPage2 = false;
globalThis.fetch = async (url) => {
  const page = new URL(url).searchParams.get("page");
  if (page === "2" && failPage2) return new Response("{}", { status: 500 });
  return new Response(JSON.stringify({ results: pages[page] ?? [] }), { status: 200 });
};
await import(new URL("../supabase/functions/tmdb/index.ts", import.meta.url).href);

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const search = async (q) => {
  const res = await handler(new Request(`https://x/functions/v1/tmdb?action=search&q=${q}`, { headers: { authorization: `Bearer h.${b64({ role: "authenticated" })}.s` } }));
  return { status: res.status, body: await res.json() };
};
const results = [];
const check = (name, ok) => results.push(`${ok ? "PASS" : "FAIL"}  ${name}`);

// Page 1 is full of tiny films; the famous one is on page 2 (as it can be in real TMDB results).
pages = {
  1: [film(1, "Paras", 3), film(2, "Paras Ki Kahani", 0), film(3, "The Paras", 12), film(4, "Parasyte: Part 1", 1800)],
  2: [film(5, "Parasite", 21645), film(6, "Parasomnia", 90)],
};
let r = await search("paras");
check("the famous film comes first even when it was on page 2", r.status === 200 && r.body.results[0].title === "Parasite");
check("a title starting with what was typed beats a well-known one that only contains it", r.body.results.findIndex((m) => m.title === "Parasyte: Part 1") < r.body.results.findIndex((m) => m.title === "The Paras"));
check("films nobody rated sink to the bottom", r.body.results.at(-1).title === "Paras Ki Kahani");

pages = { 1: [film(1, "Up", 20000), film(1, "Up", 20000)], 2: [] };
r = await search("up");
check("the same film appearing twice is shown once", r.body.results.length === 1);

pages = { 1: [film(7, "Alien", 15000)], 2: [] };
failPage2 = true;
r = await search("alien");
check("if page 2 fails, page 1 still answers", r.status === 200 && r.body.results[0].title === "Alien");

console.log(results.join("\n"));
assert.ok(!results.some((l) => l.startsWith("FAIL")), "some checks failed");
