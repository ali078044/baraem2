// عامل الخدمة: يفتح التطبيق بسرعة، ويستقبل إشعارات الهاتف حتى والمنصة مغلقة.
// طلبات الخادم (Google Apps Script) لا تُحفظ أبداً.
const C = 'baraem-v3';
const FILES = ['./', 'index.html', 'StudentInterface.html', 'TeacherInterface.html', 'AdminInterface.html',
  'style.css?v=3', 'ui.js?v=3', 'enhance.js?v=2', 'push.js?v=2', 'modules.js?v=1', 'omr.js?v=1', 'vendor/qrcode.js', 'vendor/jsQR.js', 'script.js', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('push-config.js')) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});

// ---------------- إشعارات الهاتف ----------------
try {
  importScripts('push-config.js');
  const cfg = self.PUSH_CONFIG || {};
  if (cfg.firebase && cfg.firebase.apiKey) {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
                  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    firebase.initializeApp(cfg.firebase);
    firebase.messaging().onBackgroundMessage(p => showPush(p.data || {}));
  }
} catch (err) { /* بدون إعدادات Firebase: لا شيء */ }

function showPush(d) {
  return self.registration.showNotification(d.title || 'مدرسة البراعم', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', dir: 'rtl', lang: 'ar',
    tag: d.tag || undefined, data: { link: d.link || './' }
  });
}

// الضغط على الإشعار: يفتح المنصة على الصفحة المعنية، أو ينقل نافذة مفتوحة إليها
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = new URL((e.notification.data && e.notification.data.link) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const page = link.split('#')[0];
    for (const w of list) {
      if (w.url.split('#')[0] === page && 'focus' in w) {
        w.postMessage({ type: 'open-tab', tab: link.split('#')[1] || '' });
        return w.focus();
      }
    }
    return clients.openWindow(link);
  }));
});
