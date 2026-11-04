// Member list helpers for the admin page. Pure (no browser code) so they can be tested with `node --test`.
import { SURVEY_VERSION } from "./logic.js";

// Plex usernames are matched ignoring case, so store them trimmed and without a leading "@".
// Returns the cleaned name, or null if there is nothing usable.
export function cleanPlexUsername(input) {
  const name = String(input ?? "").trim().replace(/^@+/, "").trim();
  return name && name.length <= 100 ? name : null;
}

// Name to show for a member: an admin-set name, else the name they gave on the survey, else their email.
export function memberLabel(member, surveyName) {
  return member.display_name || surveyName || member.email || "(no name)";
}

// One row per member for the admin table: label, survey status, and their linked Plex accounts.
export function memberRows(members, surveyRows, plexAccounts) {
  const survey = new Map(surveyRows.map((r) => [r.user_id, r]));
  return members.map((m) => {
    const s = survey.get(m.user_id);
    return {
      member: m,
      label: memberLabel(m, s?.display_name),
      answered: s?.answers?._v === SURVEY_VERSION,
      plex: plexAccounts.filter((p) => p.member_id === m.user_id),
    };
  });
}

// Turn the database's "already linked" error into plain words.
export function plexErrorMessage(err) {
  return err?.status === 409 ? "That Plex username is already linked to a member." : `Couldn't save: ${err?.message ?? "unknown error"}`;
}
