// Admin page (owner only). The page only decides what to SHOW; the real protection is in the
// database: only people listed in the `admins` table can read other people's rows or change anything here.
import { h } from "./dom.js";
import * as api from "./supabase.js";
import { QUESTIONS } from "./questions.js";
import { liveRows, summarize, describe } from "./results.js";
import { cleanPlexUsername, memberRows, plexErrorMessage } from "./members.js";
import { MOCK_ROWS, MOCK_MEMBERS, MOCK_PLEX } from "./admin-mock.js";

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
        call("plex_accounts?select=id,member_id,plex_username,label&order=id"),
        call("survey_responses?select=user_id,display_name,answers,updated_at&order=updated_at.desc"),
      ]);
      return { members, plex, survey };
    },
    async addPlex(member_id, plex_username, label) {
      const rows = await call("plex_accounts", { method: "POST", headers: { Prefer: "return=representation" }, body: { member_id, plex_username, label } });
      return rows[0];
    },
    removePlex: (id) => call(`plex_accounts?id=eq.${id}`, { method: "DELETE" }),
    renameMember: (user_id, display_name) => call(`members?user_id=eq.${user_id}`, { method: "PATCH", body: { display_name } }),
  };
}

// Behaves like the real database: the page gets its own copy of the data and updates it itself.
function mockStore() {
  const db = { members: structuredClone(MOCK_MEMBERS), plex: structuredClone(MOCK_PLEX), survey: MOCK_ROWS };
  let nextId = 100;
  return {
    load: async () => structuredClone(db),
    async addPlex(member_id, plex_username, label) {
      if (db.plex.some((p) => p.plex_username.toLowerCase() === plex_username.toLowerCase())) throw Object.assign(new Error("duplicate"), { status: 409 });
      const row = { id: nextId++, member_id, plex_username, label };
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
    const rm = h("button", { type: "button", className: "ghost small", textContent: "Remove", ariaLabel: `Remove ${p.plex_username}` });
    rm.onclick = () => run(async () => { await store.removePlex(p.id); data.plex = data.plex.filter((x) => x.id !== p.id); });
    return h("div", { className: "plex-row" }, h("span", {}, h("strong", { textContent: p.plex_username }), p.label ? h("span", { className: "muted", textContent: ` · ${p.label}` }) : null), rm);
  });

  const user = h("input", { type: "text", placeholder: "Plex username", maxLength: 100, ariaLabel: "Plex username" });
  const label = h("input", { type: "text", placeholder: "Note, e.g. spouse's account (optional)", maxLength: 60, ariaLabel: "Note" });
  const add = h("button", { type: "submit", textContent: "Link account" });
  const form = h("form", { className: "plex-add" }, user, label, add);
  form.onsubmit = (e) => {
    e.preventDefault();
    const name = cleanPlexUsername(user.value);
    if (!name) { msg.textContent = "Enter a Plex username."; return; }
    run(() => store.addPlex(row.member.user_id, name, label.value.trim() || null).then((r) => data.plex.push(r)));
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
      h("p", { className: "hint", textContent: `${rows.length} ${rows.length === 1 ? "member" : "members"}. Link every Plex account a member watches on (for example a spouse's), so a finished movie there alerts the right person. Matching ignores upper/lower case.` }),
      ...rows.map((r) => memberCard(r, store, data, redraw)));
  };
  redraw();
  return box;
}

// ---------- page ----------
function showAdmin(store, data) {
  let section = "results";
  const tabs = h("div");
  const body = h("div");
  const views = { results: () => resultsView(data.survey), members: () => membersView(store, data) };
  const draw = () => {
    tabs.replaceChildren(tabRow([["results", "Survey results"], ["members", "Members & Plex"]], section, (k) => { section = k; draw(); }));
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
