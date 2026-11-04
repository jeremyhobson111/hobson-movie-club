-- Push notifications: each device a member turns notifications on for, and a log of what was sent.

-- One row per device (a browser or installed app). `endpoint` is the push address the browser gives us;
-- p256dh and auth are that device's encryption keys. Members manage only their own rows.
create table public.push_subscriptions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique check (char_length(endpoint) between 1 and 2000),
  p256dh     text not null,
  auth       text not null,
  user_agent text check (user_agent is null or char_length(user_agent) <= 200),
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "members manage own devices"
  on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "admins see all devices"
  on public.push_subscriptions for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Column-level grants keep the encryption keys out of the browser entirely: people (and the admin page)
-- can add a device, see which devices exist, and remove their own, but never read p256dh/auth back.
grant select (id, user_id, endpoint, user_agent, created_at) on public.push_subscriptions to authenticated;
grant insert (user_id, endpoint, p256dh, auth, user_agent) on public.push_subscriptions to authenticated;
grant delete on public.push_subscriptions to authenticated;

-- The send function (service role) needs the keys, and removes devices the push service says are gone.
grant select, delete on public.push_subscriptions to service_role;

-- What was sent to whom. Also the future in-app inbox: members can read their own rows.
-- `dedupe_key` makes automatic reminders once-only: one row per member, kind and key (for example
-- a round id). Test messages leave it empty, so they can be sent repeatedly.
create table public.notification_log (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  kind           text not null check (char_length(kind) between 1 and 40),
  dedupe_key     text check (dedupe_key is null or char_length(dedupe_key) <= 100),
  title          text not null check (char_length(title) <= 120),
  body           text not null check (char_length(body) <= 300),
  is_test        boolean not null default false,
  devices_sent   integer not null default 0,
  devices_failed integer not null default 0,
  sent_at        timestamptz not null default now()
);

create unique index notification_log_once
  on public.notification_log (user_id, kind, dedupe_key)
  where dedupe_key is not null;

create index notification_log_sent_idx on public.notification_log (sent_at desc);

alter table public.notification_log enable row level security;

create policy "read own notifications"
  on public.notification_log for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "admins read all notifications"
  on public.notification_log for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Read-only from the website; only the send function (service role) writes.
grant select on public.notification_log to authenticated;
grant select, insert, update on public.notification_log to service_role;
