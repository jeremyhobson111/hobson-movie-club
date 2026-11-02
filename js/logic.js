// Pure survey rules (no browser code) so they can be tested with `node --test`.

export const TOP_N = 3;

// Answer shapes stored in survey_responses.answers, keyed by question id:
//   single -> "label"         multi -> { choices: [...], other: "text" }
//   top3   -> [...]           text  -> "text"        text3 -> ["", "", ""]
export function emptyAnswer(q) {
  switch (q.type) {
    case "multi": return { choices: [], other: "" };
    case "top3": return [];
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

// Tick/untick in a "pick exactly three" question; a fourth tick is ignored.
export function toggleTop(answer, label, checked) {
  const rest = answer.filter((c) => c !== label);
  if (!checked) return rest;
  return rest.length >= TOP_N ? answer : [...rest, label];
}

// Returns a list of { id, message } problems. Everything is optional except a
// name, and question 5 must be exactly three if it is touched at all.
export function validate(displayName, answers) {
  const problems = [];
  const name = displayName.trim();
  if (!name) problems.push({ id: "name", message: "Please enter your name." });
  if (name.length > 60) problems.push({ id: "name", message: "Name must be 60 characters or fewer." });
  const top = answers[5] ?? [];
  if (top.length > 0 && top.length !== TOP_N) {
    problems.push({ id: 5, message: `Question 5: pick exactly ${TOP_N} (you picked ${top.length}).` });
  }
  return problems;
}

// Trim text answers before saving.
export function cleanAnswers(questions, answers) {
  const out = {};
  for (const q of questions) {
    const a = answers[q.id];
    if (q.type === "text") out[q.id] = a.trim();
    else if (q.type === "text3") out[q.id] = a.map((s) => s.trim());
    else if (q.type === "multi") out[q.id] = { choices: a.choices, other: a.other.trim() };
    else out[q.id] = a;
  }
  return out;
}
