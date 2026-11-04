// Admin page (owner only). The page only decides what to SHOW; the real protection is in the
// database: only people listed in the `admins` table can read other people's survey rows.
import { h } from "./dom.js";
import * as api from "./supabase.js";
import { QUESTIONS } from "./questions.js";
import { liveRows, summarize, describe } from "./results.js";
import { MOCK_ROWS } from "./admin-mock.js";

const app = document.getElementById("app");
const mock = new URLSearchParams(location.search).has("mock");

const card = (...kids) => h("section", { className: "card" }, ...kids);
const notAllowed = () => app.replaceChildren(card(h("p", { textContent: "Not authorized." })));

// ---------- by question ----------
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

// ---------- by person ----------
function personCard(r) {
  const list = h("dl", { className: "person" });
  for (const q of QUESTIONS) {
    const text = describe(q, r.answers[q.id]);
    if (text) list.append(h("dt", { textContent: `${q.id}. ${q.text}` }), h("dd", { textContent: text }));
  }
  const when = r.updated_at ? new Date(r.updated_at).toLocaleString() : "";
  return card(h("p", { className: "q-title", textContent: r.display_name }), h("p", { className: "q-meta", textContent: `Last saved ${when}` }), list);
}

// ---------- page ----------
function showResults(allRows) {
  const rows = liveRows(allRows);
  const hidden = allRows.length - rows.length;
  let view = "question";
  const tabs = h("div", { className: "tabs" });
  const content = h("div");
  const draw = () => {
    tabs.replaceChildren(...[["question", "By question"], ["person", "By person"]].map(([key, label]) => {
      const b = h("button", { type: "button", textContent: label });
      b.setAttribute("aria-pressed", String(view === key));
      b.onclick = () => { view = key; draw(); };
      return b;
    }));
    content.replaceChildren(...(view === "question" ? QUESTIONS.map((q) => questionCard(q, rows)) : rows.map(personCard)));
  };
  draw();
  app.replaceChildren(
    h("h2", { textContent: "Admin" }),
    mock ? h("p", { className: "hint", textContent: "Sample data only." }) : h("p", { className: "hint", textContent: "Only you can see this page's data." }),
    h("h3", { textContent: "Survey results" }),
    h("p", { className: "hint", textContent: `${rows.length} ${rows.length === 1 ? "person has" : "people have"} answered the current survey.${hidden ? ` ${hidden} older-survey ${hidden === 1 ? "row is" : "rows are"} hidden.` : ""}` }),
    tabs, content);
}

(async () => {
  if (mock) return showResults(MOCK_ROWS);
  let session;
  try { session = (await api.sessionFromLink()) ?? api.loadSession(); } catch { session = null; }
  if (!session) {
    app.replaceChildren(card(h("p", { textContent: "Please sign in first, then come back to this page." }), h("a", { href: "./", textContent: "Go to sign in" })));
    return;
  }
  try {
    // Non-admins get an empty list (row-level security); a missing table or any error is treated the same.
    const me = await api.restGet(session, "admins?select=user_id");
    session = me.session;
    if (!me.data?.length) return notAllowed();
    const res = await api.restGet(session, "survey_responses?select=display_name,answers,updated_at&order=updated_at.desc");
    showResults(res.data);
  } catch {
    notAllowed();
  }
})();
