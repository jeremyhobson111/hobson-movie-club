// Admin "Notifications" tab: send test messages to members' devices and see what was sent.
// The real automatic notifications (finished watching, reminders) will use the same sending code later.
import { h } from "./dom.js";
import { memberRows } from "./members.js";

// Sample messages for each kind of notification we expect to send. `kind` must match the server's list.
export const PRESETS = [
  { kind: "review_prompt", label: "Review prompt (finished the movie)", title: "How was the movie?", body: "You finished this week's movie. Tap to rate and review it." },
  { kind: "reminder_2d", label: "Reminder: 2 days left", title: "2 days left", body: "This week's movie ends in 2 days and you haven't watched it yet." },
  { kind: "reminder_1d", label: "Reminder: 1 day left", title: "Last day", body: "This week's movie ends tomorrow. Watch it tonight?" },
  { kind: "pick_turn", label: "Your turn to pick", title: "Your turn to pick", body: "You're choosing next week's movie. Tap to pick." },
  { kind: "reviews_revealed", label: "Reviews revealed", title: "Reviews are in", body: "Everyone has weighed in on this week's movie. See the ratings." },
  { kind: "test", label: "Custom message", title: "Hello", body: "This is a test notification." },
];

// "Chrome on Android" from a browser's user-agent text. Good enough to tell devices apart, not exact.
export function describeDevice(ua) {
  const s = String(ua ?? "");
  const os = /Android/.test(s) ? "Android" : /iPhone|iPad|iPod/.test(s) ? "iPhone/iPad" : /Windows/.test(s) ? "Windows" : /Mac OS X|Macintosh/.test(s) ? "Mac" : /Linux/.test(s) ? "Linux" : null;
  const browser = /Edg\//.test(s) ? "Edge" : /Firefox\//.test(s) ? "Firefox" : /Chrome\//.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : null;
  return browser && os ? `${browser} on ${os}` : browser ?? os ?? "Unknown device";
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Plain-words result of a send, one string per person.
export function sendSummary(out, labelOf) {
  const lines = (out.results ?? []).map((r) => {
    let text = `${labelOf(r.user_id)}: sent to ${plural(r.sent, "device")}`;
    if (r.failed) text += `, ${r.failed} failed`;
    if (r.removed) text += ` (${plural(r.removed, "dead device")} removed)`;
    return text;
  });
  for (const id of out.skipped ?? []) lines.push(`${labelOf(id)}: no devices`);
  return lines.length ? lines : ["Nobody has notifications turned on yet."];
}

const card = (...kids) => h("section", { className: "card" }, ...kids);

export function notificationsView(store, data) {
  const labelOf = (id) => memberRows(data.members, data.survey, data.plex).find((r) => r.member.user_id === id)?.label ?? "(unknown)";
  let push = { subs: [], log: [] };

  // The composer is built once so what you type survives redraws of the lists below it.
  const preset = h("select", { ariaLabel: "Kind of notification" }, PRESETS.map((p) => h("option", { textContent: p.label })));
  const title = h("input", { type: "text", maxLength: 80, ariaLabel: "Title" });
  const body = h("input", { type: "text", maxLength: 200, ariaLabel: "Message" });
  const fill = () => { const p = PRESETS[preset.selectedIndex]; title.value = p.title; body.value = p.body; };
  preset.onchange = fill;
  fill();
  const status = h("p", { className: "hint", role: "status" });
  const lists = h("div");

  async function send(target) {
    status.className = "hint";
    status.textContent = "Sending…";
    try {
      const out = await store.sendPush({ ...target, kind: PRESETS[preset.selectedIndex].kind, title: title.value.trim(), body: body.value.trim() });
      status.textContent = sendSummary(out, labelOf).join(" · ");
      push = await store.loadPush();
      drawLists();
    } catch (e) {
      status.className = "error";
      status.textContent = e.message;
    }
  }

  function drawLists() {
    const devices = new Map();
    for (const s of push.subs) devices.set(s.user_id, [...(devices.get(s.user_id) ?? []), s]);
    const rows = memberRows(data.members, data.survey, data.plex);
    const people = rows.filter((r) => devices.has(r.member.user_id)).length;

    const everyone = h("button", { type: "button", textContent: `Send to everyone with notifications on (${people})` });
    everyone.disabled = people === 0;
    everyone.onclick = () => send({ everyone: true });

    const memberCards = rows.map((r) => {
      const mine = devices.get(r.member.user_id) ?? [];
      const go = h("button", { type: "button", className: "ghost small", textContent: "Send test" });
      go.disabled = mine.length === 0;
      go.onclick = () => send({ user_ids: [r.member.user_id] });
      return card(
        h("div", { className: "member-head" }, h("p", { className: "q-title", textContent: r.label }), go),
        h("p", { className: mine.length ? "q-meta" : "who", textContent: mine.length ? `On · ${plural(mine.length, "device")}: ${mine.map((d) => describeDevice(d.user_agent)).join(", ")}` : "Off: hasn't turned on notifications yet" }));
    });

    const recent = push.log.length
      ? push.log.map((n) => h("p", { className: "quote" }, h("strong", { textContent: n.title }), " ",
        h("span", { className: "who", textContent: `→ ${labelOf(n.user_id)} · ${plural(n.devices_sent, "device")}${n.devices_failed ? `, ${n.devices_failed} failed` : ""} · ${new Date(n.sent_at).toLocaleString()}${n.is_test ? "" : ""}` })))
      : [h("p", { className: "who", textContent: "Nothing sent yet." })];

    lists.replaceChildren(
      card(everyone),
      h("h3", { textContent: "Members" }), ...memberCards,
      h("h3", { textContent: "Recently sent" }), card(...recent));
  }

  const box = h("div", {},
    h("p", { className: "hint", textContent: "Send test notifications to members' phones and computers. Every message is marked “Test:” so nobody mistakes it for the real thing. Members turn notifications on themselves, from the card on the survey page." }),
    card(h("label", {}, "Kind of notification", preset), h("label", {}, "Title", title), h("label", {}, "Message", body), status),
    lists);

  store.loadPush().then((p) => { push = p; drawLists(); }).catch(() => lists.replaceChildren(card(h("p", { className: "error", textContent: "Couldn't load notification data." }))));
  return box;
}
