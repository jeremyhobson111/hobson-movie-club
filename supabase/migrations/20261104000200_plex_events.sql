-- Plex activity log, plus a clearer name for linked Plex accounts.

-- Managed Plex users have a display name, not a username, so name the column for what it holds.
-- (The table is new and empty, so this is safe.)
alter table public.plex_accounts rename column plex_username to plex_name;
alter index public.plex_accounts_member_username_unique rename to plex_accounts_member_name_unique;
alter index public.plex_accounts_username_idx rename to plex_accounts_name_idx;

-- The plex.tv user id, filled in when linking from Plex's own user list (a later step).
-- Not used for matching yet: alerts are matched by name until we confirm the ids line up.
alter table public.plex_accounts add column plex_user_id bigint;

-- What Plex told us: one row per movie started or finished, by which Plex account.
-- Written only by the plex-webhook function (service role); admins can read it on the admin page.
create table public.plex_events (
  id                 bigint generated always as identity primary key,
  received_at        timestamptz not null default now(),
  event              text not null,
  plex_account_id    bigint,
  plex_account_title text,
  plex_account_thumb text,
  media_title        text,
  tmdb_id            bigint,
  plex_rating_key    text
);

create index plex_events_received_idx on public.plex_events (received_at desc);

alter table public.plex_events enable row level security;

create policy "admins read plex events"
  on public.plex_events for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Read-only from the website: no insert/update/delete grants.
grant select on public.plex_events to authenticated;
