-- Supabase's "automatic RLS" option creates this helper. It only runs from an
-- event trigger, so nobody needs to call it through the public API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
