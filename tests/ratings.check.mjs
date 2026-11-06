// Checks the ratings function without deploying it. Run from the repo root:
//   node --experimental-strip-types --no-warnings tests/ratings.check.mjs
// (Node runs the real supabase/functions/ratings/index.ts with a stand-in for Deno and a fake MDBList.)
import assert from "node:assert/strict";

const env = { MDBLIST_API_KEY: "secret-key" };
let handler;
globalThis.Deno = { serve: (fn) => { handler = fn; }, env: { get: (k) => env[k] } };

const calls = [];
let fake = { status: 200, body: {} };
globalThis.fetch = async (url, opts) => {
  calls.push({ url, opts });
  if (fake.throws) throw new Error("offline");
  return new Response(JSON.stringify(fake.body), { status: fake.status });
};

await import(new URL("../supabase/functions/ratings/index.ts", import.meta.url).href);

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (role) => `h.${b64({ role })}.s`;
const get = (qs, role = "authenticated") => handler(new Request(`https://x/functions/v1/ratings${qs}`, { headers: { authorization: `Bearer ${jwt(role)}` } }));
const results = [];
const check = (name, ok) => results.push(`${ok ? "PASS" : "FAIL"}  ${name}`);

let r = await get("?id=496243", "anon");
check("the public anon key is refused (401), MDBList never called", r.status === 401 && calls.length === 0);

r = await get("?id=abc");
check("a bad movie id is a 400, MDBList never called", r.status === 400 && calls.length === 0);

fake = { status: 200, body: { ratings: [
  { source: "imdb", value: 8.5, votes: 1000 },
  { source: "tomatoes", value: 99 },
  { source: "tomatoesaudience", value: 90 },
  { source: "metacritic", value: 96 },
] } };
r = await get("?id=496243");
let body = await r.json();
check("returns IMDb, critic and audience scores", r.status === 200 && body.imdb === 8.5 && body.rtCritic === 99 && body.rtAudience === 90);
check("lists the rating names it received", body.sources.join() === "imdb,tomatoes,tomatoesaudience,metacritic");
check("it asks MDBList by TMDB id with the key, and only reads", calls[0].url === "https://api.mdblist.com/tmdb/movie/496243?apikey=secret-key" && !calls[0].opts.method);

fake = { status: 200, body: { ratings: [{ source: "imdb", value: null }, { source: "tomatoes", value: "88" }] } };
body = await (await get("?id=1")).json();
check("missing scores are null and numeric strings are accepted", body.imdb === null && body.rtCritic === 88 && body.rtAudience === null);

fake = { status: 200, body: {} };
body = await (await get("?id=1")).json();
check("no ratings at all gives all-null, not an error", body.imdb === null && body.rtCritic === null && body.rtAudience === null && body.sources.length === 0);

fake = { status: 404, body: {} };
check("MDBList 404 is passed on as 404", (await get("?id=1")).status === 404);
fake = { status: 429, body: {} };
check("daily limit is a clear 429", (await get("?id=1")).status === 429);
fake = { status: 500, body: {} };
check("MDBList failing is a 502", (await get("?id=1")).status === 502);
fake = { throws: true };
check("MDBList unreachable is a clean 502, not a crash", (await get("?id=1")).status === 502);

delete env.MDBLIST_API_KEY;
check("missing secret is a clear 500", (await get("?id=1")).status === 500);

console.log(results.join("\n"));
assert.ok(!results.some((l) => l.startsWith("FAIL")), "some checks failed");
