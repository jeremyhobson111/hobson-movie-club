-- Admin access: a short list of people who may see EVERYONE's survey answers.
-- Everyone else still sees only their own row (existing policies are unchanged).

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A logged-in person can see only their own row here. That is how the admin page
-- asks "am I an admin?" without being able to list the other admins.
create policy "see own admin row"
  on public.admins for select to authenticated
  using ((select auth.uid()) = user_id);

-- Read-only through the API. Admins are added by the project owner in the Supabase
-- SQL editor, never from the website, so there are no insert/update/delete grants.
grant select on public.admins to authenticated;

-- Admins may read every survey response (read only: nobody can edit someone else's answers).
-- The subquery runs as the caller, so it only finds a row when the caller is an admin.
create policy "admins read all responses"
  on public.survey_responses for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
