// Browser side of notifications: what this device can do, and turning them on or off.
import * as api from "./supabase.js";

// The PUBLIC half of the push key pair (safe to share, it is not a secret). Make the pair with
// scripts/make-vapid-keys.mjs. While this is empty, the notifications card stays hidden.
export const VAPID_PUBLIC_KEY = "BGZQTq9c_JYAx5oH5FRt5-S2DxCFz3lFYcVFg3x1-MdMjdzrMbsWHAedkhlA1XJAwzxBNE6st5Ogfe-lxXx-mXs";

// The browser wants the key as bytes, not as base64 text.
export function urlBase64ToUint8Array(b64) {
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// What can this device do? `facts` describes the browser, so this can be tested without one.
//   install-first: an iPhone/iPad browser tab (push only works once added to the home screen)
//   unsupported:   no service workers / push / notifications at all
//   blocked:       the person already said no (only they can undo that, in browser settings)
//   available:     ready to ask
export function pushSupport({ hasServiceWorker, hasPush, hasNotification, permission, isIOS, isStandalone }) {
  if (isIOS && !isStandalone) return "install-first";
  if (!hasServiceWorker || !hasPush || !hasNotification) return "unsupported";
  if (permission === "denied") return "blocked";
  return "available";
}

export function browserFacts() {
  const ua = navigator.userAgent;
  return {
    hasServiceWorker: "serviceWorker" in navigator,
    hasPush: "PushManager" in window,
    hasNotification: "Notification" in window,
    permission: "Notification" in window ? Notification.permission : "denied",
    isIOS: /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    isStandalone: window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
  };
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try { await navigator.serviceWorker.register("sw.js"); } catch { /* notifications just won't be offered */ }
}

export async function currentSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Remember this device in the database. If it is already there, nothing happens (so this is safe to repeat).
export async function saveSubscription(sub) {
  const session = api.loadSession();
  const j = sub.toJSON();
  await api.rest(session, "push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: { user_id: session.user_id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) },
  });
}

export async function enablePush() {
  if (!VAPID_PUBLIC_KEY) throw new Error("Notifications are not set up yet.");
  const reg = await navigator.serviceWorker.ready;
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notifications were not allowed.");
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  await saveSubscription(sub);
  return sub;
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await api.rest(api.loadSession(), `push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE" });
}
