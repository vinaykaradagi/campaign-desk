/* Saundatti Constituency Survey — lets the web app open with no internet.
   App files are kept on the phone; voter data is never stored here
   (the app keeps its own small offline copy). */
const CACHE = "syp-survey-v2";
const SHELL = ["./", "index.html", "config.js", "manifest.json", "logo-96.png", "logo-192.png", "icon-192.png", "icon-512.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const lib = url.hostname === "cdn.jsdelivr.net";
  if (!own && !lib) return;                       // database calls and fonts go straight to the internet
  if (own && (req.mode === "navigate" || /\.(html|js|json)$/.test(url.pathname) || url.pathname.endsWith("/"))) {
    // newest version when online, saved copy when offline
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { if (n.ok || n.type === "opaque") { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return n; })));
});
