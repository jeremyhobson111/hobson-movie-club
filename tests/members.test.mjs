// Run with: node --test tests/members.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { SURVEY_VERSION } from "../js/logic.js";
import { cleanPlexUsername, memberLabel, memberRows, plexErrorMessage } from "../js/members.js";

test("cleanPlexUsername trims, drops a leading @, and rejects empty or huge input", () => {
  assert.equal(cleanPlexUsername("  @SamWatches "), "SamWatches");
  assert.equal(cleanPlexUsername("sam"), "sam");
  assert.equal(cleanPlexUsername("   "), null);
  assert.equal(cleanPlexUsername("@"), null);
  assert.equal(cleanPlexUsername(undefined), null);
  assert.equal(cleanPlexUsername("x".repeat(101)), null);
});

test("memberLabel prefers admin name, then survey name, then email", () => {
  assert.equal(memberLabel({ display_name: "Sam", email: "s@x.co" }, "Samuel"), "Sam");
  assert.equal(memberLabel({ display_name: null, email: "s@x.co" }, "Samuel"), "Samuel");
  assert.equal(memberLabel({ display_name: null, email: "s@x.co" }, undefined), "s@x.co");
  assert.equal(memberLabel({ display_name: null, email: "" }, undefined), "(no name)");
});

test("memberRows joins survey status and Plex accounts per member", () => {
  const members = [
    { user_id: "a", display_name: null, email: "a@x.co" },
    { user_id: "b", display_name: "Bea", email: "b@x.co" },
    { user_id: "c", display_name: null, email: "c@x.co" },
  ];
  const survey = [
    { user_id: "a", display_name: "Alex", answers: { _v: SURVEY_VERSION } },
    { user_id: "b", display_name: "Bea", answers: { _v: 1 } }, // older survey
  ];
  const plex = [
    { id: 1, member_id: "a", plex_username: "alex" },
    { id: 2, member_id: "a", plex_username: "alexs_wife" },
  ];
  const rows = memberRows(members, survey, plex);
  assert.deepEqual(rows.map((r) => r.label), ["Alex", "Bea", "c@x.co"]);
  assert.deepEqual(rows.map((r) => r.answered), [true, false, false]);
  assert.deepEqual(rows.map((r) => r.plex.length), [2, 0, 0]);
});

test("plexErrorMessage explains a duplicate in plain words", () => {
  assert.match(plexErrorMessage({ status: 409 }), /already linked/);
  assert.match(plexErrorMessage({ status: 500, message: "boom" }), /boom/);
});
