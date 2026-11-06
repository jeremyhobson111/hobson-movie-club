// Entry point: wires the handler to Deno (see handler.ts for what it does).
// Uses only Supabase's own built-in secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY),
// so there is nothing new to set up. The invite email itself is the "Invite user" template in the dashboard.
import { makeHandler } from "./handler.ts";

Deno.serve(makeHandler({ env: (name) => Deno.env.get(name), fetch }));
