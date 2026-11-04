-- Members: one row per invited person (mirrors the login list, which the website cannot read).
-- Plex accounts: which Plex usernames count as which member (a spouse's account can point
-- to the same member), so "finished watching" alerts can find the right person later.

create table public.members (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  email        text not null default '',
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  created_at   timestamptz not null default now()
);

alter table public.members enable row level security;

-- A person can read their own row; admins can read everyone's.
create policy "read own member row"
  on public.members for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "admins read all members"
  on public.members for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Only admins can rename, and only the display name (column-level grant below).
create policy "admins rename members"
  on public.members for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- No insert or delete through the API: rows appear when someone is invited (trigger below)
-- and disappear if their login is deleted.
grant select on public.members to authenticated;
grant update (display_name) on public.members to authenticated;

-- Add a members row automatically whenever a login is created (invite, first sign-in).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.members (user_id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Only the trigger should ever run this, never the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Everyone already invited gets a row now, with their survey name if they gave one.
insert into public.members (user_id, email, display_name)
select u.id, coalesce(u.email, ''), nullif(left(sr.display_name, 60), '')
from auth.users u
left join public.survey_responses sr on sr.user_id = u.id
on conflict (user_id) do nothing;

-- Plex usernames linked to members. One Plex username can belong to only one member
-- (case does not matter); a member can have several.
create table public.plex_accounts (
  id            bigint generated always as identity primary key,
  member_id     uuid not null references public.members (user_id) on delete cascade,
  plex_username text not null check (char_length(plex_username) between 1 and 100),
  label         text check (label is null or char_length(label) <= 60),
  created_at    timestamptz not null default now()
);

create unique index plex_accounts_username_unique on public.plex_accounts (lower(plex_username));
create index plex_accounts_member_idx on public.plex_accounts (member_id);

alter table public.plex_accounts enable row level security;

-- Admins only, for everything. (Members do not need to see these yet.)
create policy "admins manage plex accounts"
  on public.plex_accounts for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

grant select, insert, update, delete on public.plex_accounts to authenticated;
