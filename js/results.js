// Turns survey rows into per-question summaries for the admin page. Pure (no browser code)
// so it can be tested with `node --test`.
import { SURVEY_VERSION } from "./logic.js";

// Only answers saved for the current survey; older versions mean different questions.
export const liveRows = (rows) => rows.filter((r) => r.answers?._v === SURVEY_VERSION);

const clean = (s) => (typeof s === "string" ? s.trim() : "");

// Did this person answer this question at all?
export function hasAnswer(q, a) {
  if (q.type === "multi") return !!a && (a.choices?.length > 0 || clean(a.other) !== "");
  if (q.type === "text3") return Array.isArray(a) && a.some((t) => clean(t));
  return clean(a) !== "";
}

// One question across everyone. Always returns { total } (people who answered), plus:
//   single -> counts: [{ label, count }] in the question's option order
//   multi  -> counts (same) and others: [{ name, text }]
//   text   -> texts: [{ name, text }]
//   text3  -> titles: [{ title, count, names }] most-named first
export function summarize(q, rows) {
  const answered = rows.filter((r) => hasAnswer(q, r.answers?.[q.id]));
  const out = { total: answered.length };

  if (q.type === "single" || q.type === "multi") {
    const tally = new Map(q.options.map((o) => [o, 0]));
    const others = [];
    for (const r of answered) {
      const a = r.answers[q.id];
      for (const c of q.type === "single" ? [a] : a.choices) tally.set(c, (tally.get(c) ?? 0) + 1);
      if (q.type === "multi" && clean(a.other)) others.push({ name: r.display_name, text: clean(a.other) });
    }
    out.counts = [...tally].map(([label, count]) => ({ label, count }));
    if (q.type === "multi") out.others = others;
  } else if (q.type === "text") {
    out.texts = answered.map((r) => ({ name: r.display_name, text: clean(r.answers[q.id]) }));
  } else if (q.type === "text3") {
    const byTitle = new Map();
    for (const r of answered) {
      for (const t of r.answers[q.id].map(clean).filter(Boolean)) {
        const key = t.toLowerCase();
        const e = byTitle.get(key) ?? { title: t, count: 0, names: [] };
        e.count += 1;
        e.names.push(r.display_name);
        byTitle.set(key, e);
      }
    }
    out.titles = [...byTitle.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
  }
  return out;
}

// One person's answer as readable text, or null if they skipped it.
export function describe(q, a) {
  if (!hasAnswer(q, a)) return null;
  if (q.type === "multi") return [...a.choices, ...(clean(a.other) ? [`Other: ${clean(a.other)}`] : [])].join("; ");
  if (q.type === "text3") return a.map(clean).filter(Boolean).join("; ");
  return clean(a);
}
