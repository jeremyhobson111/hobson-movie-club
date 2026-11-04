-- The plex-webhook function writes with the service role. This project does not auto-expose new
-- tables, so that role has no access to plex_events until it is granted explicitly.
-- (Insert to log events; select so a later step can look for earlier events before notifying.)
grant select, insert on public.plex_events to service_role;
