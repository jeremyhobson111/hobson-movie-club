// Run with: node --test tests/push.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { createECDH } from "node:crypto";
import { urlBase64ToUint8Array, pushSupport, VAPID_PUBLIC_KEY } from "../js/push.js";

test("urlBase64ToUint8Array decodes push keys (with and without padding)", () => {
  const bytes = Buffer.from("hello push key!!", "utf8");
  for (const text of [bytes.toString("base64url"), bytes.toString("base64")]) {
    assert.deepEqual([...urlBase64ToUint8Array(text.replace(/=+$/, ""))], [...bytes]);
  }
  // the URL-safe alphabet (- and _) must be handled
  const tricky = Buffer.from([251, 255, 190, 62, 63]);
  assert.deepEqual([...urlBase64ToUint8Array(tricky.toString("base64url"))], [...tricky]);
});

const ok = { hasServiceWorker: true, hasPush: true, hasNotification: true, permission: "default", isIOS: false, isStandalone: false };

test("pushSupport: what each kind of device is told", () => {
  assert.equal(pushSupport(ok), "available");
  assert.equal(pushSupport({ ...ok, permission: "granted" }), "available");
  assert.equal(pushSupport({ ...ok, permission: "denied" }), "blocked");
  assert.equal(pushSupport({ ...ok, hasPush: false }), "unsupported");
  assert.equal(pushSupport({ ...ok, hasServiceWorker: false }), "unsupported");
  assert.equal(pushSupport({ ...ok, hasNotification: false }), "unsupported");
  // iPhone in a normal Safari tab must be told to install first, even though it lacks push there
  assert.equal(pushSupport({ ...ok, isIOS: true, hasPush: false }), "install-first");
  assert.equal(pushSupport({ ...ok, isIOS: true, isStandalone: true }), "available");
});

test("the public push key in js/push.js is a valid P-256 public key (catches a typo or a pasted private key)", () => {
  const bytes = Buffer.from(VAPID_PUBLIC_KEY, "base64url");
  assert.equal(bytes.length, 65);
  assert.equal(bytes[0], 4);
  createECDH("prime256v1").setPrivateKey(Buffer.alloc(32, 1)); // sanity: the curve is available
  assert.doesNotThrow(() => createECDH("prime256v1").constructor.convertKey(bytes, "prime256v1", undefined, undefined, "uncompressed"));
});

test("make-vapid-keys prints a valid public/private pair", () => {
  const out = execFileSync(process.execPath, ["scripts/make-vapid-keys.mjs"], { encoding: "utf8" });
  const keys = out.split("\n").filter((l) => /^[A-Za-z0-9_-]{40,}$/.test(l));
  assert.equal(keys.length, 2);
  assert.equal(Buffer.from(keys[0], "base64url").length, 65); // uncompressed P-256 public key
  assert.equal(Buffer.from(keys[1], "base64url").length, 32); // private key
  assert.ok(Buffer.from(keys[0], "base64url")[0] === 4);
});

// ---- the service worker, run with a fake `self`
function loadWorker() {
  const handlers = {};
  const calls = { shown: [], opened: [], navigated: [], focused: 0, closed: 0 };
  const scope = "https://hobsonmovieclub.com/";
  const self = {
    registration: { scope, showNotification: (title, opts) => { calls.shown.push({ title, opts }); return Promise.resolve(); } },
    clients: { claim: () => Promise.resolve(), openWindow: (u) => { calls.opened.push(u); return Promise.resolve(); }, matchAll: async () => self.__windows ?? [] },
    skipWaiting: () => {},
    addEventListener: (name, fn) => { handlers[name] = fn; },
    __windows: [],
  };
  vm.runInNewContext(readFileSync("sw.js", "utf8"), { self, URL, console });
  const fire = async (name, event) => { const waits = []; handlers[name]({ ...event, waitUntil: (p) => waits.push(p) }); await Promise.all(waits); };
  return { self, calls, fire, handlers };
}

test("service worker: shows a push as a notification with its link and tag", async () => {
  const { calls, fire } = loadWorker();
  await fire("push", { data: { json: () => ({ title: "Test: How was it?", body: "Tap to review.", url: "./", tag: "review_prompt" }) } });
  assert.equal(calls.shown.length, 1);
  assert.equal(calls.shown[0].title, "Test: How was it?");
  assert.equal(calls.shown[0].opts.body, "Tap to review.");
  assert.equal(calls.shown[0].opts.tag, "review_prompt");
  assert.equal(calls.shown[0].opts.data.url, "./");
});

test("service worker: a plain-text or empty push still shows something sensible", async () => {
  const { calls, fire } = loadWorker();
  await fire("push", { data: { json: () => { throw new Error("not json"); }, text: () => "plain words" } });
  await fire("push", { data: null });
  assert.equal(calls.shown[0].title, "Hobson Movie Club");
  assert.equal(calls.shown[0].opts.body, "plain words");
  assert.equal(calls.shown[1].title, "Hobson Movie Club");
});

test("service worker: tapping a notification focuses the open window and goes to the link", async () => {
  const { self, calls, fire } = loadWorker();
  const win = { url: "https://hobsonmovieclub.com/admin.html", focus: () => { calls.focused += 1; }, navigate: (u) => { calls.navigated.push(u); return Promise.resolve(); } };
  self.__windows = [{ url: "https://elsewhere.example/", focus() {}, navigate() {} }, win];
  await fire("notificationclick", { notification: { close: () => { calls.closed += 1; }, data: { url: "./review" } } });
  assert.equal(calls.closed, 1);
  assert.equal(calls.focused, 1);
  assert.deepEqual(calls.navigated, ["https://hobsonmovieclub.com/review"]);
  assert.equal(calls.opened.length, 0);
});

test("service worker: tapping with no open window opens one at the link", async () => {
  const { calls, fire } = loadWorker();
  await fire("notificationclick", { notification: { close() {}, data: { url: "./" } } });
  assert.deepEqual(calls.opened, ["https://hobsonmovieclub.com/"]);
});

test("the manifest is valid JSON with what Chrome needs to offer install", () => {
  const m = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
  assert.equal(m.display, "standalone");
  assert.ok(m.name && m.short_name && m.start_url);
  assert.ok(m.icons.some((i) => i.sizes === "192x192") && m.icons.some((i) => i.sizes === "512x512"));
  for (const i of m.icons) assert.ok(readFileSync(i.src), `icon exists: ${i.src}`);
});
