-- Survey answers: one row per family member, tied to their login.
-- Answers are stored as JSON keyed by question number (see docs/areas/survey.md)
-- so the questions can change without changing the table.

create table public.survey_responses (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  answers      jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at honest even if the browser sends something else.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger survey_responses_set_updated_at
  before update on public.survey_responses
  for each row execute function public.set_updated_at();

-- Row-level security: a logged-in person can only see and change their own row.
alter table public.survey_responses enable row level security;

create policy "read own response"
  on public.survey_responses for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "insert own response"
  on public.survey_responses for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "update own response"
  on public.survey_responses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- "Automatically expose new tables" is off for this project, so grant access
-- explicitly. Logged-out visitors (anon) get nothing. No delete for anyone.
grant select, insert, update on public.survey_responses to authenticated;
