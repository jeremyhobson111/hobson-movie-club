// The "Notifications" card shown to signed-in members. It reads the browser's abilities and shows only
// what makes sense for this device. `deps` is injectable so the card can be tried without a real push service.
import { h } from "./dom.js";
import * as push from "./push.js";

const realDeps = {
  vapidKey: push.VAPID_PUBLIC_KEY,
  facts: push.browserFacts,
  isSubscribed: async () => !!(await push.currentSubscription()),
  enable: push.enablePush,
  disable: push.disablePush,
};

// Returns the card, or null when there is nothing to show (push keys not set up yet).
export async function notificationsCard(deps = realDeps) {
  if (!deps.vapidKey) return null;

  const card = h("section", { className: "card notify" });
  const msg = h("p", { className: "error", role: "alert" });

  const draw = async () => {
    const support = push.pushSupport(deps.facts());
    const subscribed = support === "available" && (await deps.isSubscribed());
    const body = [];

    if (support === "install-first") {
      body.push(h("p", { textContent: "To get notifications on an iPhone or iPad: tap the Share button, choose “Add to Home Screen”, then open the club from your home screen and come back here." }));
    } else if (support === "unsupported") {
      body.push(h("p", { textContent: "This browser can't show notifications. Chrome on Android or a computer works." }));
    } else if (support === "blocked") {
      body.push(h("p", { textContent: "Notifications are blocked for this site. To turn them on, allow notifications for this site in your browser's settings, then reload the page." }));
    } else if (subscribed) {
      const off = h("button", { type: "button", className: "ghost", textContent: "Turn off on this device" });
      off.onclick = async () => {
        msg.textContent = "";
        off.disabled = true;
        try { await deps.disable(); } catch (e) { msg.textContent = `Couldn't turn them off: ${e.message}`; }
        draw();
      };
      body.push(h("p", { textContent: "Notifications are on for this device. You'll hear about your picks, reminders and reviews." }), off);
    } else {
      const on = h("button", { type: "button", textContent: "Turn on notifications" });
      on.onclick = async () => {
        msg.textContent = "";
        on.disabled = true;
        try { await deps.enable(); } catch (e) { msg.textContent = e.message; }
        draw();
      };
      body.push(h("p", { textContent: "Get a nudge on your phone when it's your turn to pick, when a movie is due, and when reviews are in." }), on);
    }
    card.replaceChildren(h("h3", { textContent: "Notifications" }), ...body, msg);
  };

  await draw();
  return card;
}
