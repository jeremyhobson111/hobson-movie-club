// Run with: node --test tests/results.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "../js/questions.js";
import { SURVEY_VERSION } from "../js/logic.js";
import { liveRows, hasAnswer, summarize, describe } from "../js/results.js";

const q = (id) => QUESTIONS.find((x) => x.id === id);
const row = (name, answers) => ({ display_name: name, answers: { _v: SURVEY_VERSION, ...answers } });

const rows = [
  row("Sam", { 4: "Very open", 1: { choices: ["Comedy", "Drama"], other: "Noir" }, 3: ["Alien", "up", ""], 12: "More pizza" }),
  row("Alex", { 4: "Very open", 1: { choices: ["Comedy"], other: "" }, 3: ["ALIEN", "Heat", "Up"], 12: "  " }),
  row("Dana", { 4: "Not very open (prefer familiar)" }),
];

test("liveRows drops answers saved for another survey version", () => {
  const old = { display_name: "Old", answers: { 4: "Very open" } };
  assert.deepEqual(liveRows([old, rows[0]]), [rows[0]]);
});

test("hasAnswer for each question type", () => {
  assert.equal(hasAnswer(q(4), ""), false);
  assert.equal(hasAnswer(q(4), "Very open"), true);
  assert.equal(hasAnswer(q(1), { choices: [], other: "" }), false);
  assert.equal(hasAnswer(q(1), { choices: [], other: "Noir" }), true);
  assert.equal(hasAnswer(q(3), ["", "", ""]), false);
  assert.equal(hasAnswer(q(12), "   "), false);
});

test("single choice: counts in option order, zeros included", () => {
  const s = summarize(q(4), rows);
  assert.equal(s.total, 3);
  assert.deepEqual(s.counts.map((c) => c.count), [2, 0, 1, 0]);
  assert.equal(s.counts[0].label, "Very open");
});

test("multi choice: counts plus Other text with names", () => {
  const s = summarize(q(1), rows);
  assert.equal(s.total, 2);
  assert.equal(s.counts.find((c) => c.label === "Comedy").count, 2);
  assert.equal(s.counts.find((c) => c.label === "Drama").count, 1);
  assert.deepEqual(s.others, [{ name: "Sam", text: "Noir" }]);
});

test("favorite movies: matches titles ignoring case, most-named first", () => {
  const s = summarize(q(3), rows);
  assert.equal(s.total, 2);
  // The merged title keeps the first person's spelling ("up"), so compare ignoring case.
  assert.deepEqual(s.titles.slice(0, 2).map((t) => [t.title.toLowerCase(), t.count]), [["alien", 2], ["up", 2]]);
  assert.deepEqual(s.titles.find((t) => t.title === "Alien").names, ["Sam", "Alex"]);
});

test("free text skips blanks", () => {
  const s = summarize(q(12), rows);
  assert.equal(s.total, 1);
  assert.deepEqual(s.texts, [{ name: "Sam", text: "More pizza" }]);
});

test("describe gives readable text or null", () => {
  assert.equal(describe(q(1), rows[0].answers[1]), "Comedy; Drama; Other: Noir");
  assert.equal(describe(q(3), rows[0].answers[3]), "Alien; up");
  assert.equal(describe(q(12), "  "), null);
  assert.equal(describe(q(4), undefined), null);
});
