// Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "../js/questions.js";
import { normalizeAnswers, toggleChoice, setOther, toggleTop, validate, cleanAnswers } from "../js/logic.js";

const q = (id) => QUESTIONS.find((x) => x.id === id);

test("survey has the 19 questions in order", () => {
  assert.deepEqual(QUESTIONS.map((x) => x.id), Array.from({ length: 19 }, (_, i) => i + 1));
});

test("normalizeAnswers fills an empty row with the right shapes", () => {
  const a = normalizeAnswers(QUESTIONS, null);
  assert.deepEqual(a[1], { choices: [], other: "" });
  assert.deepEqual(a[2], ["", "", ""]);
  assert.deepEqual(a[5], []);
  assert.equal(a[4], "");
});

test("normalizeAnswers keeps saved answers and repairs wrong shapes", () => {
  const a = normalizeAnswers(QUESTIONS, { 4: "Very open", 5: "oops" });
  assert.equal(a[4], "Very open");
  assert.deepEqual(a[5], []);
});

test("'All of the above!' clears the other boxes, and vice versa", () => {
  let a = { choices: ["Sharing our opinions"], other: "" };
  a = toggleChoice(q(11), a, "All of the above!", true);
  assert.deepEqual(a.choices, ["All of the above!"]);
  a = toggleChoice(q(11), a, "Sharing our opinions", true);
  assert.deepEqual(a.choices, ["Sharing our opinions"]);
});

test("'None' on question 3 clears the Other text; typing Other clears 'None'", () => {
  let a = { choices: ["Horror"], other: "Slasher films" };
  a = toggleChoice(q(3), a, "None, I'm open to anything!", true);
  assert.deepEqual(a, { choices: ["None, I'm open to anything!"], other: "" });
  a = setOther(q(3), a, "Mimes");
  assert.deepEqual(a, { choices: [], other: "Mimes" });
});

test("unticking removes the choice", () => {
  const a = toggleChoice(q(16), { choices: ["Best Comedy"], other: "" }, "Best Comedy", false);
  assert.deepEqual(a.choices, []);
});

test("top-3 allows at most three picks", () => {
  let a = [];
  for (const o of ["Hidden Gems", "Classic Movies", "Themed Nights", "Combination"]) a = toggleTop(a, o, true);
  assert.deepEqual(a, ["Hidden Gems", "Classic Movies", "Themed Nights"]);
  assert.deepEqual(toggleTop(a, "Classic Movies", false), ["Hidden Gems", "Themed Nights"]);
});

test("validate: name required, question 5 must be exactly three if touched", () => {
  const base = normalizeAnswers(QUESTIONS, null);
  assert.equal(validate("", base).length, 1);
  assert.equal(validate("Sam", base).length, 0);
  assert.equal(validate("Sam", { ...base, 5: ["a", "b"] })[0].id, 5);
  assert.equal(validate("Sam", { ...base, 5: ["a", "b", "c"] }).length, 0);
});

test("cleanAnswers trims text", () => {
  const a = { ...normalizeAnswers(QUESTIONS, null), 18: "  more pizza ", 2: [" Alien ", "", "Up"] };
  const c = cleanAnswers(QUESTIONS, a);
  assert.equal(c[18], "more pizza");
  assert.deepEqual(c[2], ["Alien", "", "Up"]);
});
