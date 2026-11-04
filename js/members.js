// Member list helpers for the admin page. Pure (no browser code) so they can be tested with `node --test`.
import { SURVEY_VERSION } from "./logic.js";

// Plex names (a username, or a managed user's display name) are matched ignoring case, so store them
// trimmed and without a leading "@". Returns the cleaned name, or null if there is nothing usable.
export function cleanPlexName(input) {
  const name = String(input ?? "").trim().replace(/^@+/, "").trim();
  return name && name.length <= 100 ? name : null;
}

// Name to show for a member: an admin-set name, else the name they gave on the survey, else their email.
export function memberLabel(member, surveyName) {
  return member.display_name || surveyName || member.email || "(no name)";
}

// One row per member for the admin table: label, survey status, and their linked Plex accounts.
// Each account also lists the OTHER members sharing that username (couples on one account).
export function memberRows(members, surveyRows, plexAccounts) {
  const survey = new Map(surveyRows.map((r) => [r.user_id, r]));
  const labels = new Map(members.map((m) => [m.user_id, memberLabel(m, survey.get(m.user_id)?.display_name)]));
  const key = (p) => p.plex_name.toLowerCase();
  return members.map((m) => ({
    member: m,
    label: labels.get(m.user_id),
    answered: survey.get(m.user_id)?.answers?._v === SURVEY_VERSION,
    plex: plexAccounts
      .filter((p) => p.member_id === m.user_id)
      .map((p) => ({
        ...p,
        sharedWith: plexAccounts.filter((o) => o.member_id !== m.user_id && key(o) === key(p)).map((o) => labels.get(o.member_id)),
      })),
  }));
}

// Recent Plex events, each with the club members whose linked Plex name matches the account that
// triggered it (empty = nobody linked yet). `rows` comes from memberRows().
export function activityRows(events, rows) {
  const byName = new Map();
  for (const r of rows) {
    for (const p of r.plex) {
      const k = p.plex_name.toLowerCase();
      byName.set(k, [...(byName.get(k) ?? []), r.label]);
    }
  }
  return events.map((e) => ({ ...e, members: byName.get((e.plex_account_title ?? "").toLowerCase()) ?? [] }));
}

// Turn the database's "already linked" error into plain words.
export function plexErrorMessage(err) {
  return err?.status === 409 ? "This member already has that Plex name linked." : `Couldn't save: ${err?.message ?? "unknown error"}`;
}
