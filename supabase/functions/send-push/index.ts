// Entry point: wires the real push library into the handler (see handler.ts for what it does).
// Secrets (set in the Supabase dashboard, never in the repo): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (a mailto: address). Make the key pair with scripts/make-vapid-keys.mjs.
import webpush from "npm:web-push@3.6.7";
import { makeHandler } from "./handler.ts";

const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
const subject = Deno.env.get("VAPID_SUBJECT");
if (publicKey && privateKey && subject) webpush.setVapidDetails(subject, publicKey, privateKey);

Deno.serve(
  makeHandler({
    env: (name) => Deno.env.get(name),
    send: (sub, payload, opts) => webpush.sendNotification(sub, payload, opts),
    fetch,
  }),
);
