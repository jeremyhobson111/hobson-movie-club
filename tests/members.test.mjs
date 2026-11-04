// Run with: node --test tests/members.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { SURVEY_VERSION } from "../js/logic.js";
import { cleanPlexName, memberLabel, memberRows, activityRows, plexErrorMessage } from "../js/members.js";

test("cleanPlexName trims, drops a leading @, keeps display names with spaces, and rejects empty or huge input", () => {
  assert.equal(cleanPlexName("  @SamWatches "), "SamWatches");
  assert.equal(cleanPlexName("sam"), "sam");
  assert.equal(cleanPlexName(" Grandpa Joe "), "Grandpa Joe");
  assert.equal(cleanPlexName("   "), null);
  assert.equal(cleanPlexName("@"), null);
  assert.equal(cleanPlexName(undefined), null);
  assert.equal(cleanPlexName("x".repeat(101)), null);
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
    { id: 1, member_id: "a", plex_name: "alex" },
    { id: 2, member_id: "a", plex_name: "alexs_wife" },
    { id: 3, member_id: "c", plex_name: "ALEX" }, // a couple sharing one account
  ];
  const rows = memberRows(members, survey, plex);
  assert.deepEqual(rows.map((r) => r.label), ["Alex", "Bea", "c@x.co"]);
  assert.deepEqual(rows.map((r) => r.answered), [true, false, false]);
  assert.deepEqual(rows.map((r) => r.plex.length), [2, 0, 1]);
});

test("a Plex username shared by two members lists the other member, ignoring case", () => {
  const members = [
    { user_id: "a", display_name: "Alex", email: "" },
    { user_id: "c", display_name: "Chris", email: "" },
  ];
  const plex = [
    { id: 1, member_id: "a", plex_name: "alex" },
    { id: 2, member_id: "a", plex_name: "alexs_wife" },
    { id: 3, member_id: "c", plex_name: "ALEX" },
  ];
  const [alex, chris] = memberRows(members, [], plex);
  assert.deepEqual(alex.plex.map((p) => p.sharedWith), [["Chris"], []]);
  assert.deepEqual(chris.plex[0].sharedWith, ["Alex"]);
});

test("activityRows shows which members an event belongs to, ignoring case; unlinked accounts get none", () => {
  const members = [
    { user_id: "a", display_name: "Alex", email: "" },
    { user_id: "c", display_name: "Chris", email: "" },
  ];
  const plex = [
    { id: 1, member_id: "a", plex_name: "Family Account" },
    { id: 2, member_id: "c", plex_name: "family account" }, // a couple sharing one account
    { id: 3, member_id: "c", plex_name: "Kids" }, // a managed user, linked by display name
  ];
  const rows = memberRows(members, [], plex);
  const events = [
    { id: 1, plex_account_title: "FAMILY ACCOUNT" },
    { id: 2, plex_account_title: "Kids" },
    { id: 3, plex_account_title: "Stranger" },
    { id: 4, plex_account_title: null },
  ];
  assert.deepEqual(activityRows(events, rows).map((e) => e.members), [["Alex", "Chris"], ["Chris"], [], []]);
});

test("plexErrorMessage explains a duplicate in plain words", () => {
  assert.match(plexErrorMessage({ status: 409 }), /already has that Plex name/);
  assert.match(plexErrorMessage({ status: 500, message: "boom" }), /boom/);
});
