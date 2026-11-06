// Checks the invite handler without deploying it. Run from the repo root:
//   node --experimental-strip-types --no-warnings tests/invite.check.mjs
// It runs the real supabase/functions/invite/handler.ts with a fake Supabase.
import assert from "node:assert/strict";
import { makeHandler } from "../supabase/functions/invite/handler.ts";

const jwt = (payload) => `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.s`;
const ADMIN_TOKEN = jwt({ role: "authenticated", sub: "99999999-9999-4999-8999-999999999999" });
const env = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-key", SUPABASE_ANON_KEY: "anon-key" };

let state;
const reset = (over = {}) => { state = { isAdmin: true, inviteStatus: 200, confirmStatus: 200, calls: [], ...over }; };
const fakeFetch = async (url, init = {}) => {
  const u = String(url);
  state.calls.push({ url: u, init });
  if (u.includes("/rest/v1/admins")) return Response.json(state.isAdmin ? [{ user_id: "x" }] : []);
  if (u.includes("/auth/v1/invite")) return state.inviteStatus === 200 ? Response.json({ id: "u-1" }) : new Response("{}", { status: state.inviteStatus });
  if (u.includes("/auth/v1/admin/users/u-1")) return new Response("{}", { status: state.confirmStatus });
  throw new Error("unexpected call " + u);
};
const handler = makeHandler({ env: (k) => env[k], fetch: fakeFetch });
const req = (body, { token = ADMIN_TOKEN, method = "POST" } = {}) =>
  new Request("https://x/functions/v1/invite", {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
const wrote = () => state.calls.filter((c) => c.url.includes("/auth/v1/")).length;

const results = [];
const check = (name, ok) => results.push(`${ok ? "PASS" : "FAIL"}  ${name}`);

reset();
let r = await handler(req({ email: "a@b.com" }, { token: null }));
check("no login is refused (401), nothing created", r.status === 401 && wrote() === 0);

r = await handler(req({ email: "a@b.com" }, { token: jwt({ role: "anon" }) }));
check("the public anon key is refused (401)", r.status === 401 && wrote() === 0);

reset({ isAdmin: false });
r = await handler(req({ email: "a@b.com" }));
check("a signed-in non-admin is refused (403), nothing created", r.status === 403 && wrote() === 0);

reset();
r = await handler(req({ email: "not an email" }));
check("a bad email is a 400, nothing created", r.status === 400 && wrote() === 0);

r = await handler(req({}, { method: "GET" }));
check("GET is a 405", r.status === 405);

reset();
r = await handler(req({ email: "  New.Person@Gmail.com " }));
let body = await r.json();
const invite = state.calls.find((c) => c.url.includes("/auth/v1/invite"));
const confirm = state.calls.find((c) => c.url.includes("/auth/v1/admin/users/u-1"));
check("an admin's invite succeeds", r.status === 200 && body.ok === true && body.email === "new.person@gmail.com");
check("the email is trimmed and lowercased before inviting", JSON.parse(invite.init.body).email === "new.person@gmail.com");
check("the invite link returns to the site", invite.url.includes(encodeURIComponent("https://hobsonmovieclub.com/")));
check("the account is then marked confirmed", confirm.init.method === "PUT" && JSON.parse(confirm.init.body).email_confirm === true);
check("the service key is used for both, never the caller's token", [invite, confirm].every((c) => c.init.headers.Authorization === "Bearer service-key"));

reset({ inviteStatus: 422 });
r = await handler(req({ email: "a@b.com" }));
check("an email that is already a member is a clear 409", r.status === 409 && wrote() === 1);

reset({ inviteStatus: 500 });
r = await handler(req({ email: "a@b.com" }));
check("the invite failing is a 502, never confirmed", r.status === 502 && wrote() === 1);

reset({ confirmStatus: 500 });
r = await handler(req({ email: "a@b.com" }));
check("confirm failing after the invite is reported honestly (502)", r.status === 502 && (await r.json()).error.includes("invite was sent"));

console.log(results.join("\n"));
assert.ok(!results.some((l) => l.startsWith("FAIL")), "some checks failed");
