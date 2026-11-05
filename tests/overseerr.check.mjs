// Checks the Overseerr status function without deploying it. Run from the repo root:
//   node --experimental-strip-types --no-warnings tests/overseerr.check.mjs
// (Node runs the real supabase/functions/overseerr/index.ts with a stand-in for Deno and a fake Overseerr.)
import assert from "node:assert/strict";

const env = { OVERSEERR_URL: "https://overseerr.example.com/", OVERSEERR_API_KEY: "api-key" };
let handler;
globalThis.Deno = { serve: (fn) => { handler = fn; }, env: { get: (k) => env[k] } };

const calls = [];
let fake = { status: 200, body: {} };
globalThis.fetch = async (url, opts) => {
  calls.push({ url, opts });
  if (fake.throws) throw new Error("offline");
  return new Response(JSON.stringify(fake.body), { status: fake.status });
};

await import(new URL("../supabase/functions/overseerr/index.ts", import.meta.url).href);

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (role) => `h.${b64({ role })}.s`;
const get = (qs, role = "authenticated") => handler(new Request(`https://x/functions/v1/overseerr${qs}`, { headers: { authorization: `Bearer ${jwt(role)}` } }));
const results = [];
const check = (name, ok) => results.push(`${ok ? "PASS" : "FAIL"}  ${name}`);

let r = await get("?id=14160", "anon");
check("the public anon key is refused (401), Overseerr never called", r.status === 401 && calls.length === 0);

r = await get("?id=abc");
check("a bad movie id is a 400, Overseerr never called", r.status === 400 && calls.length === 0);

fake = { status: 200, body: { mediaInfo: { status: 5, plexUrl: "https://app.plex.tv/desktop#!/server/x/details?key=1" } } };
r = await get("?id=14160");
let body = await r.json();
check("available movie returns status and Plex link", r.status === 200 && body.status === "available" && body.plexUrl.startsWith("https://app.plex.tv/"));
check("it calls Overseerr with the API key and no double slash", calls[0].url === "https://overseerr.example.com/api/v1/movie/14160" && calls[0].opts.headers["X-Api-Key"] === "api-key");
check("it only reads (no POST)", !calls[0].opts.method || calls[0].opts.method === "GET");

for (const [n, name] of [[2, "requested"], [3, "processing"], [4, "partial"]]) {
  fake = { status: 200, body: { mediaInfo: { status: n } } };
  body = await (await get("?id=1")).json();
  check(`Overseerr status ${n} becomes "${name}"`, body.status === name && body.plexUrl === null);
}

fake = { status: 200, body: {} };
body = await (await get("?id=1")).json();
check("no mediaInfo means not_requested", body.status === "not_requested");

fake = { status: 200, body: { mediaInfo: { status: 5, plexUrl: "javascript:alert(1)" } } };
body = await (await get("?id=1")).json();
check("a non-http Plex link is dropped", body.plexUrl === null);

fake = { status: 404, body: {} };
check("Overseerr 404 is passed on as 404", (await get("?id=1")).status === 404);

fake = { status: 500, body: {} };
check("Overseerr failing is a 502", (await get("?id=1")).status === 502);

fake = { throws: true };
check("Overseerr unreachable is a clean 502, not a crash", (await get("?id=1")).status === 502);

delete env.OVERSEERR_API_KEY;
check("missing secret is a clear 500", (await get("?id=1")).status === 500);

console.log(results.join("\n"));
assert.ok(!results.some((l) => l.startsWith("FAIL")), "some checks failed");
