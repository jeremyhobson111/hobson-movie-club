// Checks the Plex webhook receiver without deploying it. Run from the repo root:
//   node --experimental-strip-types --no-warnings tests/plex-webhook.check.mjs
// (Node runs the real supabase/functions/plex-webhook/index.ts with a stand-in for Deno and a fake database.)
// Runs supabase/functions/plex-webhook/index.ts under Node with a tiny stand-in for Deno,
// and a fake database call, to check the receiver's behaviour without deploying it.
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const env = { PLEX_WEBHOOK_SECRET: "s3cret-value", SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-key" };
let handler;
globalThis.Deno = { serve: (fn) => { handler = fn; }, env: { get: (k) => env[k] } };

const calls = [];
let dbStatus = 201;
globalThis.fetch = async (url, opts) => { calls.push({ url, opts }); return new Response("", { status: dbStatus }); };

await import(new URL("../supabase/functions/plex-webhook/index.ts", import.meta.url).href);

const payload = (over = {}) => ({
  event: "media.scrobble", user: false, owner: true,
  Account: { id: 481516, thumb: "https://plex.tv/users/abc/avatar", title: "Kid Account" },
  Metadata: { type: "movie", title: "Up", ratingKey: "12345", Guid: [{ id: "imdb://tt1049413" }, { id: "tmdb://14160" }], ...over.Metadata },
  ...over,
});
const multipart = (obj) => { const f = new FormData(); f.set("payload", JSON.stringify(obj)); f.set("thumb", new Blob(["x"])); return f; };
const post = (obj, key = "s3cret-value", body) => handler(new Request(`https://x/functions/v1/plex-webhook?key=${key}`, { method: "POST", body: body ?? multipart(obj) }));
const results = [];
const check = (name, ok) => { results.push(`${ok ? "PASS" : "FAIL"}  ${name}`); };

let r = await post(payload(), "wrong");
check("wrong key is rejected (401), nothing stored", r.status === 401 && calls.length === 0);

r = await handler(new Request("https://x/functions/v1/plex-webhook", { method: "POST", body: multipart(payload()) }));
check("missing key is rejected (401)", r.status === 401 && calls.length === 0);

r = await handler(new Request("https://x/functions/v1/plex-webhook?key=s3cret-value", { method: "GET" }));
check("GET is refused (405)", r.status === 405);

r = await post(payload());
const sent = calls[0] && JSON.parse(calls[0].opts.body);
check("valid movie scrobble is stored with the right fields", r.status === 200 && sent?.event === "media.scrobble" && sent.plex_account_id === 481516 && sent.plex_account_title === "Kid Account" && sent.media_title === "Up" && sent.tmdb_id === 14160 && sent.plex_rating_key === "12345");
check("it writes to plex_events with the service key, not the user's", calls[0].url.endsWith("/rest/v1/plex_events") && calls[0].opts.headers.Authorization === "Bearer service-key");

calls.length = 0;
r = await post(payload({ Metadata: { type: "episode", title: "Pilot" } }));
check("a TV episode is ignored (200, nothing stored)", r.status === 200 && (await r.text()) === "ignored" && calls.length === 0);

r = await post(payload({ event: "library.new" }));
check("other events (library.new) are ignored", (await r.text()) === "ignored" && calls.length === 0);

r = await post(payload({ event: "media.play" }));
check("media.play is stored too", calls.length === 1 && JSON.parse(calls[0].opts.body).event === "media.play");

calls.length = 0;
r = await post(null, "s3cret-value", new Blob(["not json"]));
check("a garbage body is a clean 400, not a crash", r.status === 400 && calls.length === 0);

r = await post(payload({ Metadata: { type: "movie", title: "T".repeat(500), Guid: [{ id: "tmdb://abc" }] } }));
const longRow = JSON.parse(calls.at(-1).opts.body);
check("long titles are cut to 200 chars and a bad tmdb id becomes null", longRow.media_title.length === 200 && longRow.tmdb_id === null);

calls.length = 0; dbStatus = 500;
r = await post(payload());
check("if the database fails, Plex gets a 500 so it retries", r.status === 500);

const jsonBody = new Request("https://x/functions/v1/plex-webhook?key=s3cret-value", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload()) });
dbStatus = 201; calls.length = 0;
r = await handler(jsonBody);
check("a plain JSON body also works", r.status === 200 && calls.length === 1);

console.log(results.join("\n"));
assert.ok(!results.some((l) => l.startsWith("FAIL")), "some checks failed");
