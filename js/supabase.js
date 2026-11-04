// Tiny Supabase client using plain fetch (no library, so no dependency).
// Only the public publishable key lives here; row-level security does the protecting.

export const SUPABASE_URL = "https://bfpjetztwfcwzcjfxakx.supabase.co";
export const SUPABASE_KEY = "sb_publishable_lT9lYQzNJPuR7tL-LR8Wcg_e_wXNg3O";

const STORE = "hmc-session";

export function loadSession() {
  try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; }
}
function saveSession(s) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* private mode: stay logged in for this page only */ }
}
export function signOut() {
  try { localStorage.removeItem(STORE); } catch { /* nothing to clear */ }
}

async function call(path, { method = "GET", body, token, headers = {} } = {}) {
  const res = await fetch(SUPABASE_URL + path, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token ?? SUPABASE_KEY}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.msg || data?.message || data?.error_description || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function toSession(d) {
  return { access_token: d.access_token, refresh_token: d.refresh_token, user_id: d.user?.id, email: d.user?.email };
}

// Emails a login link + a numeric code (its length is a Supabase setting, so no digit count is shown to people). create_user:false keeps it invite-only.
export function sendLoginEmail(email) {
  const redirect = encodeURIComponent(location.origin + location.pathname);
  return call(`/auth/v1/otp?redirect_to=${redirect}`, { method: "POST", body: { email, create_user: false } });
}

export async function verifyCode(email, token) {
  const s = toSession(await call("/auth/v1/verify", { method: "POST", body: { type: "email", email, token } }));
  saveSession(s);
  return s;
}

// When someone clicks the emailed link, Supabase sends them back with the
// session in the URL hash. Pick it up, then clean the URL.
export async function sessionFromLink() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (!p.get("access_token")) return null;
  history.replaceState(null, "", location.pathname + location.search);
  const user = await call("/auth/v1/user", { token: p.get("access_token") });
  const s = { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), user_id: user.id, email: user.email };
  saveSession(s);
  return s;
}

async function refresh(session) {
  const d = await call("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: session.refresh_token } });
  const s = toSession(d);
  saveSession(s);
  return s;
}

// Run an API call as the logged-in person; refresh the login once if it expired.
async function authed(session, path, opts) {
  try {
    return { data: await call(path, { ...opts, token: session.access_token }), session };
  } catch (e) {
    if (e.status !== 401 && e.status !== 403) throw e;
    const fresh = await refresh(session);
    return { data: await call(path, { ...opts, token: fresh.access_token }), session: fresh };
  }
}

export async function fetchMyResponse(session) {
  const { data, session: s } = await authed(session, `/rest/v1/survey_responses?select=display_name,answers&user_id=eq.${session.user_id}`);
  return { row: data[0] ?? null, session: s };
}

export async function saveMyResponse(session, displayName, answers) {
  const { session: s } = await authed(session, "/rest/v1/survey_responses?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: { user_id: session.user_id, display_name: displayName, answers },
  });
  return s;
}
