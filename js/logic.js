// Pure survey rules (no browser code) so they can be tested with `node --test`.

// Bump when the questions change, so answers saved for an older survey are not
// shown against the new questions (they are replaced on the next save).
export const SURVEY_VERSION = 2;

export function currentAnswers(saved) {
  return saved?._v === SURVEY_VERSION ? saved : null;
}

// Answer shapes stored in survey_responses.answers, keyed by question id:
//   single -> "label"         multi -> { choices: [...], other: "text" }
//   text   -> "text"          text3 -> ["", "", ""]
export function emptyAnswer(q) {
  switch (q.type) {
    case "multi": return { choices: [], other: "" };
    case "text3": return ["", "", ""];
    default: return "";
  }
}

// Fill gaps (new questions, an empty row) so the form can always render.
export function normalizeAnswers(questions, saved) {
  const out = {};
  for (const q of questions) {
    const have = saved?.[q.id];
    const fresh = emptyAnswer(q);
    out[q.id] = have !== undefined && Array.isArray(have) === Array.isArray(fresh) ? have : fresh;
  }
  return out;
}

// Tick/untick a multi-choice option. Picking an exclusive option ("All of the
// above!", "None...") clears everything else; picking anything else clears the
// exclusive option.
export function toggleChoice(q, answer, label, checked) {
  const exclusive = q.exclusive ?? [];
  let choices = answer.choices.filter((c) => c !== label);
  let other = answer.other;
  if (checked) {
    if (exclusive.includes(label)) {
      choices = [label];
      other = "";
    } else {
      choices = choices.filter((c) => !exclusive.includes(c));
      choices.push(label);
    }
  }
  return { choices, other };
}

// Typing in "Other" also drops an exclusive option, since they contradict.
export function setOther(q, answer, text) {
  const exclusive = q.exclusive ?? [];
  const choices = text.trim() ? answer.choices.filter((c) => !exclusive.includes(c)) : answer.choices;
  return { choices, other: text };
}

// Returns a list of { id, message } problems. Everything is optional except a name.
export function validate(displayName) {
  const problems = [];
  const name = displayName.trim();
  if (!name) problems.push({ id: "name", message: "Please enter your name." });
  if (name.length > 60) problems.push({ id: "name", message: "Name must be 60 characters or fewer." });
  return problems;
}

// Trim text answers before saving.
export function cleanAnswers(questions, answers) {
  const out = { _v: SURVEY_VERSION };
  for (const q of questions) {
    const a = answers[q.id];
    if (q.type === "text") out[q.id] = a.trim();
    else if (q.type === "text3") out[q.id] = a.map((s) => s.trim());
    else if (q.type === "multi") out[q.id] = { choices: a.choices, other: a.other.trim() };
    else out[q.id] = a;
  }
  return out;
}
