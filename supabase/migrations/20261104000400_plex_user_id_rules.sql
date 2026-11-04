-- Plex accounts are now linked by the numeric Plex user id (typed in by the owner), falling back to the name.
-- (The plex_user_id column already exists and is empty.)

-- A real Plex id is a positive whole number.
alter table public.plex_accounts
  add constraint plex_accounts_plex_user_id_positive check (plex_user_id is null or plex_user_id > 0);

-- The same member cannot have the same Plex id linked twice (different members may share one account).
create unique index plex_accounts_member_user_id_unique
  on public.plex_accounts (member_id, plex_user_id)
  where plex_user_id is not null;

-- For finding every member linked to an id when a Plex alert comes in.
create index plex_accounts_user_id_idx
  on public.plex_accounts (plex_user_id)
  where plex_user_id is not null;
