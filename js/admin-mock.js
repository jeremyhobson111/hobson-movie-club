// Made-up data so the admin page can be judged without logging in (admin.html?mock=1).
import { SURVEY_VERSION } from "./logic.js";

const v = (user_id, display_name, updated_at, answers) => ({ user_id, display_name, updated_at, answers: { _v: SURVEY_VERSION, ...answers } });

export const MOCK_ROWS = [
  v("u-sam", "Sam", "2026-11-04T10:00:00Z", {
    1: { choices: ["Comedy", "Drama", "Thriller / Suspense"], other: "Noir" }, 3: ["Alien", "Heat", "Up"],
    4: "Very open", 6: "About half the weeks", 7: { choices: ["Not enough time", "I forgot"], other: "" },
    9: "Love it", 10: { choices: ["Bragging rights", "A small cash pot everyone chips into"], other: "" },
    11: "Yes, and I'd like all of them", 12: "Reminders that actually work.",
  }),
  v("u-alex", "Alex", "2026-11-04T11:30:00Z", {
    1: { choices: ["Comedy", "Science Fiction"], other: "" }, 3: ["ALIEN", "Parasite", ""],
    4: "Somewhat open (depending on the description)", 6: "Hardly ever", 7: { choices: ["The movie didn't interest me", "Nothing happened if I skipped it"], other: "" },
    9: "Sounds fun", 10: { choices: ["Nothing, the points are enough"], other: "" }, 11: "Yes, but only a few notifications",
    13: "Let us veto one pick per month.",
  }),
  v("u-dana", "Dana", "2026-11-04T12:15:00Z", { 4: "Very open", 6: "Almost every week", 9: "Don't care either way" }),
  { user_id: "u-old", display_name: "Old-survey row", updated_at: "2026-11-02T09:00:00Z", answers: { 4: "Not very open (prefer familiar)" } },
];

export const MOCK_MEMBERS = [
  { user_id: "u-sam", email: "sam@example.com", display_name: null },
  { user_id: "u-alex", email: "alex@example.com", display_name: "Alex H." },
  { user_id: "u-dana", email: "dana@example.com", display_name: null },
  { user_id: "u-pat", email: "pat@example.com", display_name: null },
];

export const MOCK_PLEX = [
  { id: 1, member_id: "u-alex", plex_username: "alexwatches", label: "Main account" },
  { id: 2, member_id: "u-alex", plex_username: "alexs_spouse", label: "Spouse's account" },
];
