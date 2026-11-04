// Checks the send-push handler without deploying it. Run from the repo root:
//   node --experimental-strip-types --no-warnings tests/send-push.check.mjs
// It runs the real supabase/functions/send-push/handler.ts with a fake push sender and a fake database.
import assert from "node:assert/strict";
import { makeHandler, KINDS } from "../supabase/functions/send-push/handler.ts";

const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";
const ADMIN = "99999999-9999-4999-8999-999999999999";
const jwt = (payload) => `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.s`;
const ADMIN_TOKEN = jwt({ role: "authenticated", sub: ADMIN });

const env = {
  SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-key", SUPABASE_ANON_KEY: "anon-key",
  VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv", VAPID_SUBJECT: "mailto:x@example.com",
};

// ---- a fake database + push service
let state;
const reset = (over = {}) => {
  state = {
    isAdmin: true,
    subs: [
      { id: 1, user_id: U1, endpoint: "https://push.example/a", p256dh: "k1", auth: "a1" },
      { id: 2, user_id: U1, endpoint: "https://push.example/b", p256dh: "k2", auth: "a2" },
    ],
    sendFails: {}, // endpoint -> statusCode
    sent: [], calls: [], logRows: null, logOk: true, deleted: [],
    ...over,
  };
};
const fakeFetch = async (url, init = {}) => {
  state.calls.push({ url: String(url), init });
  const u = String(url);
  if (u.includes("/rest/v1/admins")) return Response.json(state.isAdmin ? [{ user_id: ADMIN }] : []);
  if (u.includes("/rest/v1/push_subscriptions") && (init.method ?? "GET") === "GET") {
    const m = u.match(/user_id=in\.\(([^)]*)\)/);
    const only = m ? m[1].split(",") : null;
    return Response.json(state.subs.filter((s) => !only || only.includes(s.user_id)));
  }
  if (u.includes("/rest/v1/push_subscriptions") && init.method === "DELETE") { state.deleted.push(u.split("id=eq.")[1]); return new Response(null, { status: 204 }); }
  if (u.includes("/rest/v1/notification_log")) { state.logRows = JSON.parse(init.body); return new Response(state.logOk ? "" : "boom", { status: state.logOk ? 201 : 500 }); }
  throw new Error("unexpected call " + u);
};
const send = async (sub, payload) => {
  if (state.sendFails[sub.endpoint]) throw Object.assign(new Error("push failed"), { statusCode: state.sendFails[sub.endpoint] });
  state.sent.push({ sub, payload: JSON.parse(payload) });
};
const handler = makeHandler({ env: (k) => env[k], send, fetch: fakeFetch });
const envMissing = makeHandler({ env: (k) => (k === "VAPID_PRIVATE_KEY" ? undefined : env[k]), send, fetch: fakeFetch });

const req = (body, { token = ADMIN_TOKEN, method = "POST", origin } = {}) =>
  new Request("https://x/functions/v1/send-push", {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(origin ? { origin } : {}), "content-type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
const good = { user_ids: [U1], kind: "review_prompt", title: "How was it?", body: "Tap to review." };

const results = [];
const check = (name, ok) => results.push(`${ok ? "PASS" : "FAIL"}  ${name}`);

reset();
let r = await handler(req(good, { token: null }));
check("no login: 401", r.status === 401 && state.sent.length === 0);

r = await handler(req(good, { token: jwt({ role: "anon" }) }));
check("the public anon key is not a person: 401", r.status === 401);

r = await handler(new Request("https://x/f", { method: "GET", headers: { authorization: `Bearer ${ADMIN_TOKEN}` } }));
check("GET is refused: 405", r.status === 405);

r = await envMissing(req(good));
check("missing push keys: clear 500, nothing sent", r.status === 500 && (await r.json()).error.includes("push keys") && state.sent.length === 0);

reset({ isAdmin: false });
r = await handler(req(good));
check("a signed-in non-admin is refused: 403, nothing sent", r.status === 403 && state.sent.length === 0);
const adminCall = state.calls.find((c) => c.url.includes("/rest/v1/admins"));
check("the admin check uses the caller's own token and the anon key, not the service key", adminCall.init.headers.Authorization === `Bearer ${ADMIN_TOKEN}` && adminCall.init.headers.apikey === "anon-key");

reset();
for (const [name, body] of [
  ["unknown kind", { ...good, kind: "spam" }],
  ["empty title", { ...good, title: "  " }],
  ["title over 80", { ...good, title: "x".repeat(81) }],
  ["message over 200", { ...good, body: "x".repeat(201) }],
  ["no recipients", { ...good, user_ids: [] }],
  ["a bad user id", { ...good, user_ids: ["not-a-uuid"] }],
  ["too many people", { ...good, user_ids: Array.from({ length: 51 }, () => U1) }],
]) {
  r = await handler(req(body));
  check(`bad input is a 400, nothing sent: ${name}`, r.status === 400 && state.sent.length === 0);
}
r = await handler(new Request("https://x/f", { method: "POST", headers: { authorization: `Bearer ${ADMIN_TOKEN}` }, body: "not json" }));
check("a garbage body is a clean 400", r.status === 400);
check("every kind the admin page offers is accepted by the server", ["test", "review_prompt", "reminder_2d", "reminder_1d", "pick_turn", "reviews_revealed"].every((k) => KINDS.includes(k)));

reset();
r = await handler(req({ ...good, user_ids: [U1, U2] }));
let out = await r.json();
check("a person with 2 devices gets 2 pushes; a person with none is skipped", r.status === 200 && state.sent.length === 2 && out.results.length === 1 && out.results[0].sent === 2 && out.skipped[0] === U2);
check("the title is always prefixed 'Test: ' and the payload has the link and tag", state.sent[0].payload.title === "Test: How was it?" && state.sent[0].payload.url === "./" && state.sent[0].payload.tag === "review_prompt");
check("a log row is written, marked as a test", state.logRows.length === 1 && state.logRows[0].is_test === true && state.logRows[0].devices_sent === 2 && state.logRows[0].title === "Test: How was it?");
check("the encryption keys never come back in the response", !JSON.stringify(out).includes("k1") && !JSON.stringify(out).includes("a1"));

reset();
r = await handler(req({ everyone: true, kind: "test", title: "Hi", body: "All." }));
check("'everyone' sends to all devices with no user filter", state.sent.length === 2 && !state.calls.find((c) => c.url.includes("push_subscriptions")).url.includes("user_id=in"));

reset({ sendFails: { "https://push.example/a": 410 } });
r = await handler(req(good));
out = await r.json();
check("a 410 (device gone) removes that device and counts a failure; the other still gets it", state.deleted.join() === "1" && out.results[0].sent === 1 && out.results[0].failed === 1 && out.results[0].removed === 1);

reset({ sendFails: { "https://push.example/a": 500 } });
r = await handler(req(good));
out = await r.json();
check("a temporary failure (500) is counted but the device is kept", state.deleted.length === 0 && out.results[0].failed === 1 && out.results[0].removed === 0);

reset({ logOk: false });
r = await handler(req(good));
check("if writing the log fails, the notifications were still sent and the response is OK", r.status === 200 && state.sent.length === 2);

r = await handler(new Request("https://x/f", { method: "OPTIONS", headers: { origin: "https://hobsonmovieclub.com" } }));
check("CORS preflight from the site is allowed", r.status === 204 && r.headers.get("access-control-allow-origin") === "https://hobsonmovieclub.com");
r = await handler(new Request("https://x/f", { method: "OPTIONS", headers: { origin: "https://evil.example" } }));
check("CORS preflight from another site is not echoed back", r.headers.get("access-control-allow-origin") !== "https://evil.example");

console.log(results.join("\n"));
assert.ok(!results.some((l) => l.startsWith("FAIL")), "some checks failed");
