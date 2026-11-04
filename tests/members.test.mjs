// Run with: node --test tests/members.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { SURVEY_VERSION } from "../js/logic.js";
import { cleanPlexName, cleanPlexId, memberLabel, memberRows, activityRows, plexErrorMessage } from "../js/members.js";

test("cleanPlexId: blank means no id, whole numbers are kept, anything else is NaN", () => {
  assert.equal(cleanPlexId(""), null);
  assert.equal(cleanPlexId("   "), null);
  assert.equal(cleanPlexId(undefined), null);
  assert.equal(cleanPlexId(" 21722565 "), 21722565);
  for (const bad of ["abc", "12.5", "-4", "0", "1e6", "1234567890123", "21 722"]) assert.ok(Number.isNaN(cleanPlexId(bad)), bad);
});

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

test("links with a Plex id match events by id only, even if the display name changed or repeats", () => {
  const members = [
    { user_id: "a", display_name: "Alex", email: "" },
    { user_id: "j", display_name: "Jacob's parent", email: "" },
    { user_id: "z", display_name: "Zed", email: "" },
  ];
  const plex = [
    { id: 1, member_id: "j", plex_name: "Jacob", plex_user_id: 21722565 },
    { id: 2, member_id: "a", plex_name: "jacob" }, // name only: matches by name
    { id: 3, member_id: "z", plex_name: "Jacob", plex_user_id: 999 }, // same name, different account
  ];
  const rows = memberRows(members, [], plex);
  const events = [
    { id: 1, plex_account_id: 21722565, plex_account_title: "Jacob" },
    { id: 2, plex_account_id: 21722565, plex_account_title: "Renamed Jacob" }, // renamed in Plex
    { id: 3, plex_account_id: 999, plex_account_title: "Jacob" },
    { id: 4, plex_account_id: 55, plex_account_title: "Jacob" }, // another Jacob nobody linked by id
  ];
  assert.deepEqual(activityRows(events, rows).map((e) => e.members), [
    ["Alex", "Jacob's parent"], // by id, plus the name-only link
    ["Jacob's parent"], // the id still matches after a rename; the name-only link no longer does
    ["Alex", "Zed"],
    ["Alex"], // only the name-only link matches
  ]);
});

test("sharing is detected by id when both links have one, else by name", () => {
  const members = [
    { user_id: "a", display_name: "A", email: "" },
    { user_id: "b", display_name: "B", email: "" },
    { user_id: "c", display_name: "C", email: "" },
  ];
  const plex = [
    { id: 1, member_id: "a", plex_name: "Family", plex_user_id: 10 },
    { id: 2, member_id: "b", plex_name: "family acct", plex_user_id: 10 }, // same id, different spelling
    { id: 3, member_id: "c", plex_name: "Family", plex_user_id: 11 }, // same name, different account
  ];
  const [a, b, c] = memberRows(members, [], plex);
  assert.deepEqual(a.plex[0].sharedWith, ["B"]);
  assert.deepEqual(b.plex[0].sharedWith, ["A"]);
  assert.deepEqual(c.plex[0].sharedWith, []);
});

test("plexErrorMessage explains a duplicate in plain words", () => {
  assert.match(plexErrorMessage({ status: 409 }), /already has that Plex account linked/);
  assert.match(plexErrorMessage({ status: 500, message: "boom" }), /boom/);
});
