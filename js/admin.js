// Admin page (owner only). The page only decides what to SHOW; the real protection is in the
// database: only people listed in the `admins` table can read other people's rows or change anything here.
import { h } from "./dom.js";
import * as api from "./supabase.js";
import { QUESTIONS } from "./questions.js";
import { liveRows, summarize, describe } from "./results.js";
import { cleanPlexName, cleanPlexId, memberRows, activityRows, plexErrorMessage } from "./members.js";
import { notificationsView } from "./admin-notify.js";
import { MOCK_ROWS, MOCK_MEMBERS, MOCK_PLEX, MOCK_EVENTS, MOCK_SUBS } from "./admin-mock.js";

const app = document.getElementById("app");
const mock = new URLSearchParams(location.search).has("mock");

const card = (...kids) => h("section", { className: "card" }, ...kids);
const notAllowed = () => app.replaceChildren(card(h("p", { textContent: "Not authorized." })));
const tabRow = (items, current, onPick) => h("div", { className: "tabs" }, items.map(([key, label]) => {
  const b = h("button", { type: "button", textContent: label });
  b.setAttribute("aria-pressed", String(current === key));
  b.onclick = () => onPick(key);
  return b;
}));

// ---------- data: the real database, or in-memory sample data ----------
function realStore(session) {
  const call = async (path, opts) => { const r = await api.rest(session, path, opts); session = r.session; return r.data; };
  return {
    async load() {
      const [members, plex, survey] = await Promise.all([
        call("members?select=user_id,email,display_name&order=created_at"),
        call("plex_accounts?select=id,member_id,plex_name,plex_user_id,label&order=id"),
        call("survey_responses?select=user_id,display_name,answers,updated_at&order=updated_at.desc"),
      ]);
      return { members, plex, survey };
    },
    loadEvents: () => call("plex_events?select=id,received_at,event,plex_account_id,plex_account_title,media_title,tmdb_id&order=received_at.desc&limit=30"),
    // fields: { plex_name, plex_user_id (or null), label (or null) }
    async addPlex(member_id, fields) {
      const rows = await call("plex_accounts", { method: "POST", headers: { Prefer: "return=representation" }, body: { member_id, ...fields } });
      return rows[0];
    },
    // Notifications: which devices have them on, what was sent, and sending a test (the function checks we are an admin).
    async loadPush() {
      const [subs, log] = await Promise.all([
        call("push_subscriptions?select=user_id,user_agent,created_at&order=created_at"),
        call("notification_log?select=id,user_id,kind,title,devices_sent,devices_failed,is_test,sent_at&order=sent_at.desc&limit=20"),
      ]);
      return { subs, log };
    },
    async sendPush(payload) {
      const r = await api.callFunction(session, "send-push", { method: "POST", body: payload });
      session = r.session;
      return r.data;
    },
    removePlex: (id) => call(`plex_accounts?id=eq.${id}`, { method: "DELETE" }),
    renameMember: (user_id, display_name) => call(`members?user_id=eq.${user_id}`, { method: "PATCH", body: { display_name } }),
  };
}

// Behaves like the real database: the page gets its own copy of the data and updates it itself.
function mockStore() {
  const db = { members: structuredClone(MOCK_MEMBERS), plex: structuredClone(MOCK_PLEX), survey: MOCK_ROWS, events: MOCK_EVENTS, subs: structuredClone(MOCK_SUBS), log: [] };
  let nextId = 100;
  return {
    load: async () => ({ members: structuredClone(db.members), plex: structuredClone(db.plex), survey: db.survey }),
    loadEvents: async () => structuredClone(db.events),
    loadPush: async () => ({ subs: structuredClone(db.subs), log: structuredClone(db.log) }),
    // Pretends to be the send-push function: one result per person with devices, the rest skipped.
    async sendPush({ user_ids, everyone, kind, title, body }) {
      if (!title || !body) throw new Error("The title must be 1 to 80 characters.");
      const targets = everyone ? [...new Set(db.subs.map((s) => s.user_id))] : user_ids;
      const results = [], skipped = [];
      for (const id of targets) {
        const n = db.subs.filter((s) => s.user_id === id).length;
        if (!n) { skipped.push(id); continue; }
        results.push({ user_id: id, sent: n, failed: 0, removed: 0 });
        db.log.unshift({ id: db.log.length + 1, user_id: id, kind, title: `Test: ${title}`, devices_sent: n, devices_failed: 0, is_test: true, sent_at: new Date().toISOString() });
      }
      return { results, skipped };
    },
    async addPlex(member_id, fields) {
      // Same rules as the database: once per member by name, and once per member by id.
      const clash = (p) => p.member_id === member_id && (p.plex_name.toLowerCase() === fields.plex_name.toLowerCase() || (fields.plex_user_id != null && p.plex_user_id === fields.plex_user_id));
      if (db.plex.some(clash)) throw Object.assign(new Error("duplicate"), { status: 409 });
      const row = { id: nextId++, member_id, ...fields };
      db.plex.push(row);
      return { ...row };
    },
    async removePlex(id) { db.plex = db.plex.filter((p) => p.id !== id); },
    async renameMember(user_id, name) { db.members.find((m) => m.user_id === user_id).display_name = name; },
  };
}

// ---------- survey results: by question ----------
function bars(counts, total) {
  return counts.map(({ label, count }) => h("div", { className: "bar-row" },
    h("span", { className: "label", textContent: label }),
    h("div", { className: "bar" }, h("span", { style: `width:${total ? (count / total) * 100 : 0}%` })),
    h("span", { className: "n", textContent: String(count) })));
}

const quote = (name, text) => h("p", { className: "quote" }, text, " ", h("span", { className: "who", textContent: `— ${name}` }));

function questionCard(q, rows) {
  const s = summarize(q, rows);
  const body = [];
  if (s.counts) body.push(...bars(s.counts, s.total));
  if (s.others?.length) body.push(h("p", { className: "who", textContent: "“Other” answers:" }), ...s.others.map((o) => quote(o.name, o.text)));
  if (s.texts) body.push(...s.texts.map((t) => quote(t.name, t.text)));
  if (s.titles) body.push(...s.titles.map((t) => h("p", { className: "quote" }, t.title, " ",
    h("span", { className: "who", textContent: `${t.count > 1 ? `×${t.count} ` : ""}— ${t.names.join(", ")}` }))));
  if (!s.total) body.push(h("p", { className: "who", textContent: "No answers yet." }));
  return card(h("p", { className: "q-title", textContent: `${q.id}. ${q.text}` }),
    h("p", { className: "q-meta", textContent: `${s.total} answered` }), ...body);
}

// ---------- survey results: by person ----------
function personCard(r) {
  const list = h("dl", { className: "person" });
  for (const q of QUESTIONS) {
    const text = describe(q, r.answers[q.id]);
    if (text) list.append(h("dt", { textContent: `${q.id}. ${q.text}` }), h("dd", { textContent: text }));
  }
  const when = r.updated_at ? new Date(r.updated_at).toLocaleString() : "";
  return card(h("p", { className: "q-title", textContent: r.display_name }), h("p", { className: "q-meta", textContent: `Last saved ${when}` }), list);
}

function resultsView(allRows) {
  const rows = liveRows(allRows);
  const hidden = allRows.length - rows.length;
  let view = "question";
  const tabs = h("div");
  const content = h("div");
  const draw = () => {
    tabs.replaceChildren(tabRow([["question", "By question"], ["person", "By person"]], view, (k) => { view = k; draw(); }));
    content.replaceChildren(...(view === "question" ? QUESTIONS.map((q) => questionCard(q, rows)) : rows.map(personCard)));
  };
  draw();
  return h("div", {},
    h("p", { className: "hint", textContent: `${rows.length} ${rows.length === 1 ? "person has" : "people have"} answered the current survey.${hidden ? ` ${hidden} older-survey ${hidden === 1 ? "row is" : "rows are"} hidden.` : ""}` }),
    tabs, content);
}

// ---------- members & Plex accounts ----------
function memberCard(row, store, data, redraw) {
  const msg = h("p", { className: "error" });
  const run = async (fn) => { msg.textContent = ""; try { await fn(); redraw(); } catch (e) { msg.textContent = plexErrorMessage(e); } };

  const accounts = row.plex.map((p) => {
    const rm = h("button", { type: "button", className: "ghost small", textContent: "Remove", ariaLabel: `Remove ${p.plex_name}` });
    rm.onclick = () => run(async () => { await store.removePlex(p.id); data.plex = data.plex.filter((x) => x.id !== p.id); });
    return h("div", { className: "plex-row" }, h("span", {},
      h("strong", { textContent: p.plex_name }),
      // When the name was left blank it is already "Plex ID <n>", so don't repeat the id.
      p.plex_user_id != null && p.plex_name !== `Plex ID ${p.plex_user_id}` ? h("span", { className: "muted", textContent: ` · ID ${p.plex_user_id}` }) : null,
      p.label ? h("span", { className: "muted", textContent: ` · ${p.label}` }) : null,
      p.sharedWith.length ? h("span", { className: "shared", textContent: ` · shared with ${p.sharedWith.join(", ")}` }) : null), rm);
  });

  const idInput = h("input", { type: "text", inputMode: "numeric", placeholder: "Plex ID, e.g. 21722565", maxLength: 12, ariaLabel: "Plex ID" });
  const user = h("input", { type: "text", placeholder: "Plex username or display name", maxLength: 100, ariaLabel: "Plex username or display name" });
  const label = h("input", { type: "text", placeholder: "Note, e.g. spouse's account (optional)", maxLength: 60, ariaLabel: "Note" });
  const add = h("button", { type: "submit", textContent: "Link account" });
  const form = h("form", { className: "plex-add" }, idInput, user, label, add);
  form.onsubmit = (e) => {
    e.preventDefault();
    const id = cleanPlexId(idInput.value);
    if (Number.isNaN(id)) { msg.textContent = "The Plex ID must be a whole number (digits only)."; return; }
    // With an ID the name is just a label, so a blank name is fine; without one the name is how alerts are matched.
    const name = cleanPlexName(user.value) ?? (id != null ? `Plex ID ${id}` : null);
    if (!name) { msg.textContent = "Enter a Plex ID, or a Plex username or display name."; return; }
    run(() => store.addPlex(row.member.user_id, { plex_name: name, plex_user_id: id, label: label.value.trim() || null }).then((r) => data.plex.push(r)));
  };

  const rename = h("button", { type: "button", className: "ghost small", textContent: "Rename" });
  rename.onclick = () => {
    const name = prompt("Display name for this member (leave empty to use their survey name or email):", row.member.display_name ?? "");
    if (name === null) return;
    run(async () => { const v = name.trim().slice(0, 60) || null; await store.renameMember(row.member.user_id, v); row.member.display_name = v; });
  };

  return card(
    h("div", { className: "member-head" }, h("p", { className: "q-title", textContent: row.label }), rename),
    h("p", { className: "q-meta", textContent: `${row.member.email} · Survey: ${row.answered ? "answered" : "not yet"}` }),
    ...(accounts.length ? accounts : [h("p", { className: "who", textContent: "No Plex accounts linked yet." })]),
    form, msg);
}

function membersView(store, data) {
  const box = h("div");
  const redraw = () => {
    const rows = memberRows(data.members, data.survey, data.plex);
    box.replaceChildren(
      h("p", { className: "hint", textContent: `${rows.length} ${rows.length === 1 ? "member" : "members"}. Link every Plex account a member watches on. Best is the Plex ID (the number shown on the Plex activity tab); without one, alerts are matched by the Plex name, ignoring upper/lower case. Two people who share one account each get it linked, and a finished movie there alerts both.` }),
      ...rows.map((r) => memberCard(r, store, data, redraw)));
  };
  redraw();
  return box;
}

// ---------- Plex activity ----------
// Plex also reports stops, but we only keep "started playing" and "finished" (watched past about 90%).
const EVENT_LABEL = { "media.play": "started playing", "media.scrobble": "finished watching" };

function activityView(store, data) {
  const box = h("div", {}, h("p", { className: "muted", textContent: "Loading…" }));
  store.loadEvents().then((events) => {
    const rows = activityRows(events, memberRows(data.members, data.survey, data.plex));
    box.replaceChildren(
      h("p", { className: "hint", textContent: "The last 30 times a movie was started or finished on your Plex server. A “started playing” row stays as it is even if the movie is stopped later; “finished watching” appears once about 90% has been watched. “Not linked” means no member has that Plex ID or name linked yet: copy the Plex ID into that member's card under Members & Plex." }),
      ...(rows.length ? rows.map((e) => card(
        h("p", { className: "q-title", textContent: e.media_title ?? "(unknown movie)" }),
        h("p", { className: "q-meta", textContent: `${EVENT_LABEL[e.event] ?? e.event} · ${new Date(e.received_at).toLocaleString()}` }),
        h("p", {}, h("strong", { textContent: e.plex_account_title ?? "(no name)" }),
          h("span", { className: "muted", textContent: e.plex_account_id != null ? ` · Plex id ${e.plex_account_id}` : "" }),
          " → ", e.members.length ? e.members.join(", ") : h("span", { className: "shared", textContent: "Not linked" }))))
        : [card(h("p", { className: "who", textContent: "Nothing yet. Once the Plex webhook is set up, movies started or finished on your server appear here." }))]));
  }).catch(() => box.replaceChildren(card(h("p", { className: "error", textContent: "Couldn't load Plex activity." }))));
  return box;
}

// ---------- page ----------
function showAdmin(store, data) {
  let section = "results";
  const tabs = h("div");
  const body = h("div");
  const views = {
    results: () => resultsView(data.survey),
    members: () => membersView(store, data),
    activity: () => activityView(store, data),
    notifications: () => notificationsView(store, data),
  };
  const draw = () => {
    tabs.replaceChildren(tabRow([["results", "Survey results"], ["members", "Members & Plex"], ["activity", "Plex activity"], ["notifications", "Notifications"]], section, (k) => { section = k; draw(); }));
    body.replaceChildren(views[section]());
  };
  draw();
  app.replaceChildren(
    h("h2", { textContent: "Admin" }),
    h("p", { className: "hint", textContent: mock ? "Sample data only." : "Only you can see this page's data." }),
    tabs, body);
}

(async () => {
  if (mock) { const s = mockStore(); return showAdmin(s, await s.load()); }
  let session;
  try { session = (await api.sessionFromLink()) ?? api.loadSession(); } catch { session = null; }
  if (!session) {
    app.replaceChildren(card(h("p", { textContent: "Please sign in first, then come back to this page." }), h("a", { href: "./", textContent: "Go to sign in" })));
    return;
  }
  try {
    // Non-admins get an empty list (row-level security); a missing table or any error is treated the same.
    const me = await api.rest(session, "admins?select=user_id");
    session = me.session;
    if (!me.data?.length) return notAllowed();
    const store = realStore(session);
    showAdmin(store, await store.load());
  } catch {
    notAllowed();
  }
})();
