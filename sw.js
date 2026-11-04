// Service worker: shows push notifications and opens the club when one is tapped.
// It does not cache anything on purpose: the site always loads fresh from the network.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Present so the browser treats the site as an installable app. Everything still goes to the network.
self.addEventListener("fetch", () => {});

// A push message is JSON: { title, body, url, tag }. `tag` replaces an older notification of the same kind
// instead of stacking duplicates.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Hobson Movie Club", {
      body: data.body || "",
      icon: "img/icon-192.png",
      tag: data.tag || undefined,
      data: { url: data.url || "./" },
    }),
  );
});

// Tapping a notification focuses the open club window (and goes to its page), or opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.registration.scope));
      if (open) {
        open.focus();
        return open.navigate(target);
      }
      return self.clients.openWindow(target);
    }),
  );
});
