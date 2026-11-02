// Run with: node --test tests/logic.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "../js/questions.js";
import { normalizeAnswers, currentAnswers, toggleChoice, setOther, validate, cleanAnswers, SURVEY_VERSION } from "../js/logic.js";

const q = (id) => QUESTIONS.find((x) => x.id === id);

test("survey has the 13 questions in order", () => {
  assert.deepEqual(QUESTIONS.map((x) => x.id), Array.from({ length: 13 }, (_, i) => i + 1));
});

test("every choice question has options, and exclusive options exist in the list", () => {
  for (const x of QUESTIONS) {
    if (x.type === "single" || x.type === "multi") assert.ok(x.options.length >= 2, `q${x.id} options`);
    for (const e of x.exclusive ?? []) assert.ok(x.options.includes(e), `q${x.id} exclusive "${e}"`);
  }
});

test("normalizeAnswers fills an empty row with the right shapes", () => {
  const a = normalizeAnswers(QUESTIONS, null);
  assert.deepEqual(a[1], { choices: [], other: "" });
  assert.deepEqual(a[3], ["", "", ""]);
  assert.equal(a[4], "");
});

test("normalizeAnswers keeps saved answers and repairs wrong shapes", () => {
  const a = normalizeAnswers(QUESTIONS, { 4: "Very open", 3: "oops" });
  assert.equal(a[4], "Very open");
  assert.deepEqual(a[3], ["", "", ""]);
});

test("answers saved for an older survey version are ignored", () => {
  assert.equal(currentAnswers({ 1: "old" }), null);
  assert.equal(currentAnswers(null), null);
  const mine = { _v: SURVEY_VERSION, 4: "Very open" };
  assert.equal(currentAnswers(mine), mine);
});

test("'Nothing, the points are enough' clears the other boxes, and vice versa", () => {
  let a = { choices: ["Bragging rights"], other: "A trophy" };
  a = toggleChoice(q(10), a, "Nothing, the points are enough", true);
  assert.deepEqual(a, { choices: ["Nothing, the points are enough"], other: "" });
  a = toggleChoice(q(10), a, "Bragging rights", true);
  assert.deepEqual(a.choices, ["Bragging rights"]);
});

test("'None' on question 2 clears the Other text; typing Other clears 'None'", () => {
  let a = { choices: ["Horror"], other: "Slasher films" };
  a = toggleChoice(q(2), a, "None, I'm open to anything!", true);
  assert.deepEqual(a, { choices: ["None, I'm open to anything!"], other: "" });
  a = setOther(q(2), a, "Mimes");
  assert.deepEqual(a, { choices: [], other: "Mimes" });
});

test("unticking removes the choice", () => {
  const a = toggleChoice(q(5), { choices: ["Rating the movie"], other: "" }, "Rating the movie", false);
  assert.deepEqual(a.choices, []);
});

test("validate: only the name is required", () => {
  assert.equal(validate("").length, 1);
  assert.equal(validate("   ").length, 1);
  assert.equal(validate("Sam").length, 0);
  assert.equal(validate("x".repeat(61)).length, 1);
});

test("cleanAnswers trims text and stamps the survey version", () => {
  const a = { ...normalizeAnswers(QUESTIONS, null), 12: "  more pizza ", 3: [" Alien ", "", "Up"] };
  const c = cleanAnswers(QUESTIONS, a);
  assert.equal(c[12], "more pizza");
  assert.deepEqual(c[3], ["Alien", "", "Up"]);
  assert.equal(c._v, SURVEY_VERSION);
});
