// Run with: node --test tests/admin-notify.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PRESETS, describeDevice, sendSummary } from "../js/admin-notify.js";

test("describeDevice names the browser and system in plain words", () => {
  assert.equal(describeDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36"), "Chrome on Android");
  assert.equal(describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Edg/130.0 Safari/537.36"), "Edge on Windows");
  assert.equal(describeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1"), "Safari on iPhone/iPad");
  assert.equal(describeDevice("Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0"), "Firefox on Linux");
  assert.equal(describeDevice(""), "Unknown device");
  assert.equal(describeDevice(null), "Unknown device");
});

test("sendSummary: one plain line per person, including failures and people with no devices", () => {
  const labelOf = (id) => ({ a: "Alex", b: "Bea", c: "Chris" })[id];
  assert.deepEqual(
    sendSummary({ results: [{ user_id: "a", sent: 2, failed: 0, removed: 0 }, { user_id: "b", sent: 1, failed: 1, removed: 1 }], skipped: ["c"] }, labelOf),
    ["Alex: sent to 2 devices", "Bea: sent to 1 device, 1 failed (1 dead device removed)", "Chris: no devices"],
  );
  assert.deepEqual(sendSummary({ results: [], skipped: [] }, labelOf), ["Nobody has notifications turned on yet."]);
});

test("every sample message fits the server's limits and uses a kind the server accepts", () => {
  const server = readFileSync("supabase/functions/send-push/handler.ts", "utf8");
  const kinds = server.match(/export const KINDS = \[([^\]]*)\]/)[1].match(/"([^"]+)"/g).map((s) => s.slice(1, -1));
  const seen = new Set();
  for (const p of PRESETS) {
    assert.ok(kinds.includes(p.kind), `server accepts ${p.kind}`);
    assert.ok(p.title.length >= 1 && p.title.length <= 80, `${p.kind} title length`);
    assert.ok(p.body.length >= 1 && p.body.length <= 200, `${p.kind} message length`);
    assert.ok(!seen.has(p.kind), `${p.kind} listed once`);
    seen.add(p.kind);
  }
  assert.deepEqual([...seen].sort(), [...kinds].sort(), "the admin page offers every kind the server knows");
});
