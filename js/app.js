// Page controller: login -> survey form -> thank-you. All text is set with
// textContent / DOM nodes (never innerHTML) so typed answers can't inject markup.
import { INTRO, CLOSING, QUESTIONS } from "./questions.js";
import { normalizeAnswers, currentAnswers, toggleChoice, setOther, validate, cleanAnswers } from "./logic.js";
import * as api from "./supabase.js";

const app = document.getElementById("app");
const signoutBtn = document.getElementById("signout");
let session = null;

function h(tag, props = {}, ...kids) {
  const el = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) if (k != null) el.append(k);
  return el;
}
function show(...nodes) { app.replaceChildren(...nodes); window.scrollTo(0, 0); }

signoutBtn.onclick = () => { api.signOut(); session = null; showLogin(); };

// ---------- login ----------
function showLogin(note = "") {
  signoutBtn.hidden = true;
  const email = h("input", { type: "email", required: true, placeholder: "you@example.com", autocomplete: "email" });
  const msg = h("p", { className: "muted", textContent: note });
  const form = h("form", { className: "card" },
    h("p", { textContent: "Enter the email address you were invited with. We'll email you a sign-in link and a 6-digit code." }),
    email, h("button", { type: "submit", textContent: "Email me a sign-in link" }), msg);
  form.onsubmit = async (e) => {
    e.preventDefault();
    msg.className = "muted"; msg.textContent = "Sending…";
    try {
      await api.sendLoginEmail(email.value.trim());
      showCodeEntry(email.value.trim());
    } catch (err) {
      msg.className = "error";
      msg.textContent = "Couldn't send that. Is it the email you were invited with? (" + err.message + ")";
    }
  };
  show(h("h2", { textContent: "Sign in" }), form);
}

function showCodeEntry(email) {
  const code = h("input", { type: "text", inputMode: "numeric", autocomplete: "one-time-code", placeholder: "6-digit code", maxLength: 8 });
  const msg = h("p", { className: "error" });
  const form = h("form", { className: "card" },
    h("p", { textContent: `Check ${email}. Click the link in the email, or type the code here.` }),
    code, h("button", { type: "submit", textContent: "Sign in" }), msg);
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      session = await api.verifyCode(email, code.value.trim());
      await showSurvey();
    } catch (err) { msg.textContent = "That code didn't work: " + err.message; }
  };
  const back = h("button", { type: "button", textContent: "Use a different email", className: "muted" });
  back.onclick = () => showLogin();
  show(h("h2", { textContent: "Check your email" }), form, back);
}

// ---------- survey ----------
function questionNode(q, answers, onChange) {
  const fs = h("fieldset", { className: "card", id: "q" + q.id }, h("legend", { textContent: `${q.id}. ${q.text}` }));
  const rerender = () => fs.replaceWith(questionNode(q, answers, onChange));

  if (q.type === "single") {
    for (const opt of q.options) {
      const r = h("input", { type: "radio", name: "q" + q.id, checked: answers[q.id] === opt });
      r.onchange = () => { answers[q.id] = opt; };
      fs.append(h("label", {}, r, opt));
    }
  } else if (q.type === "multi") {
    for (const opt of q.options) {
      const c = h("input", { type: "checkbox", checked: answers[q.id].choices.includes(opt) });
      c.onchange = () => { answers[q.id] = toggleChoice(q, answers[q.id], opt, c.checked); rerender(); };
      fs.append(h("label", {}, c, opt));
    }
    if (q.other) {
      const t = h("input", { type: "text", placeholder: "Other (type here)", value: answers[q.id].other, maxLength: 200 });
      // Re-render only when typing removes an exclusive option, so the cursor isn't lost otherwise.
      t.oninput = () => {
        const before = answers[q.id].choices.length;
        answers[q.id] = setOther(q, answers[q.id], t.value);
        if (answers[q.id].choices.length !== before) { rerender(); fs.querySelector('input[type=text]')?.focus(); }
      };
      fs.append(t);
    }
  } else if (q.type === "text3") {
    answers[q.id].forEach((v, i) => {
      const t = h("input", { type: "text", placeholder: `Movie ${i + 1}`, value: v, maxLength: 150 });
      t.oninput = () => { answers[q.id][i] = t.value; };
      fs.append(t);
    });
  } else {
    const t = h("textarea", { value: answers[q.id], maxLength: 2000 });
    t.oninput = () => { answers[q.id] = t.value; };
    fs.append(t);
  }
  return fs;
}

async function showSurvey() {
  signoutBtn.hidden = false;
  show(h("p", { textContent: "Loading your answers…" }));
  let row = null;
  try {
    const r = await api.fetchMyResponse(session);
    row = r.row; session = r.session;
  } catch (err) {
    api.signOut(); session = null;
    return showLogin("Your sign-in expired. Please sign in again.");
  }

  const answers = normalizeAnswers(QUESTIONS, currentAnswers(row?.answers));
  const name = h("input", { type: "text", value: row?.display_name ?? "", maxLength: 60, placeholder: "Your name" });
  const error = h("p", { className: "error", role: "alert" });
  const save = h("button", { type: "submit", textContent: row ? "Save my changes" : "Submit my answers" });

  const form = h("form", {},
    h("div", { className: "card" }, INTRO.map((t) => h("p", { textContent: t }))),
    h("div", { className: "card" }, h("label", {}, "Your name (so we know whose answers are whose)", name)),
    QUESTIONS.map((q) => questionNode(q, answers)),
    error, save);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const problems = validate(name.value);
    if (problems.length) {
      error.textContent = problems.map((p) => p.message).join(" ");
      name.scrollIntoView();
      return;
    }
    error.textContent = ""; save.disabled = true; save.textContent = "Saving…";
    try {
      session = await api.saveMyResponse(session, name.value.trim(), cleanAnswers(QUESTIONS, answers));
      showThanks();
    } catch (err) {
      error.textContent = "Couldn't save: " + err.message + ". Your answers are still on this page, so try again.";
      save.disabled = false; save.textContent = "Try again";
    }
  };
  show(h("h2", { textContent: "Hobson Movie Club survey" }), form);
}

function showThanks() {
  const again = h("button", { type: "button", textContent: "Review or change my answers" });
  again.onclick = showSurvey;
  show(h("div", { className: "card" }, CLOSING.map((t) => h("p", { textContent: t }))), again);
}

// ---------- start ----------
(async () => {
  try {
    session = (await api.sessionFromLink()) ?? api.loadSession();
  } catch { session = null; }
  if (session) await showSurvey(); else showLogin();
})();
