// Member list helpers for the admin page. Pure (no browser code) so they can be tested with `node --test`.
import { SURVEY_VERSION } from "./logic.js";

// Plex names (a username, or a managed user's display name) are matched ignoring case, so store them
// trimmed and without a leading "@". Returns the cleaned name, or null if there is nothing usable.
export function cleanPlexName(input) {
  const name = String(input ?? "").trim().replace(/^@+/, "").trim();
  return name && name.length <= 100 ? name : null;
}

// The numeric Plex user id (shown as "Plex id" on the Plex activity tab). Blank means "no id" (null).
// Anything that is not a whole number of up to 12 digits gives NaN, so the form can refuse it.
export function cleanPlexId(input) {
  const s = String(input ?? "").trim();
  if (s === "") return null;
  return /^\d{1,12}$/.test(s) && Number(s) > 0 ? Number(s) : NaN;
}

// Name to show for a member: an admin-set name, else the name they gave on the survey, else their email.
export function memberLabel(member, surveyName) {
  return member.display_name || surveyName || member.email || "(no name)";
}

const nameKey = (p) => p.plex_name.toLowerCase();
const hasId = (p) => p.plex_user_id != null;

// Two links point at the same Plex account if their ids match; if either has no id, if their names match.
function sameAccount(a, b) {
  return hasId(a) && hasId(b) ? a.plex_user_id === b.plex_user_id : nameKey(a) === nameKey(b);
}

// One row per member for the admin table: label, survey status, and their linked Plex accounts.
// Each account also lists the OTHER members sharing it (couples on one account).
export function memberRows(members, surveyRows, plexAccounts) {
  const survey = new Map(surveyRows.map((r) => [r.user_id, r]));
  const labels = new Map(members.map((m) => [m.user_id, memberLabel(m, survey.get(m.user_id)?.display_name)]));
  return members.map((m) => ({
    member: m,
    label: labels.get(m.user_id),
    answered: survey.get(m.user_id)?.answers?._v === SURVEY_VERSION,
    plex: plexAccounts
      .filter((p) => p.member_id === m.user_id)
      .map((p) => ({
        ...p,
        sharedWith: plexAccounts.filter((o) => o.member_id !== m.user_id && sameAccount(o, p)).map((o) => labels.get(o.member_id)),
      })),
  }));
}

// Does a Plex event come from the account this link points at? A link with an id matches by id only
// (names can repeat or change); a link without one matches by name, ignoring case.
function linkMatches(link, event) {
  return hasId(link) ? link.plex_user_id === event.plex_account_id : nameKey(link) === (event.plex_account_title ?? "").toLowerCase();
}

// Recent Plex events, each with the club members linked to the account that triggered it
// (empty = nobody linked yet). `rows` comes from memberRows().
export function activityRows(events, rows) {
  return events.map((e) => ({
    ...e,
    members: rows.filter((r) => r.plex.some((p) => linkMatches(p, e))).map((r) => r.label),
  }));
}

// Turn the database's "already linked" error into plain words.
export function plexErrorMessage(err) {
  return err?.status === 409 ? "This member already has that Plex account linked (same ID or same name)." : `Couldn't save: ${err?.message ?? "unknown error"}`;
}
