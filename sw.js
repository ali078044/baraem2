// عامل الخدمة: يفتح التطبيق بسرعة، ويستقبل إشعارات الهاتف حتى والمنصة مغلقة.
// طلبات الخادم (Google Apps Script) لا تُحفظ أبداً.
const C = 'baraem-v7';
const FILES = ['./', 'index.html', 'StudentInterface.html', 'TeacherInterface.html', 'AdminInterface.html',
  'style.css?v=6', 'ui.js?v=4', 'enhance.js?v=2', 'push.js?v=3', 'account.js?v=2', 'modules.js?v=4', 'omr.js?v=2', 'vendor/qrcode.js', 'vendor/jsQR.js', 'script.js?v=7', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('push-config.js')) return;
  // no-cache: يتأكد من الخادم كل مرة (رد سريع 304 إن لم يتغير)، فتصل التحديثات للهاتف فوراً
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
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

// الضغط على الإشعار: يفتح المنصة على الصفحة والعنصر المعنيين.
// إن كانت المنصة مفتوحة يُنقل نفس التبويب إليها (navigate) بدل فتح نافذة جديدة.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const base = new URL((e.notification.data && e.notification.data.link) || './', self.registration.scope);
  // ~رقم يجعل كل ضغطة تغييراً في الرابط فيتحرك التبويب حتى لو كان الرابط نفسه
  if (base.hash) base.hash = base.hash + '~' + Date.now();
  const link = base.href;
  const page = link.split('#')[0];
  e.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const same = list.filter(w => w.url.split('#')[0] === page);
    const ours = list.filter(w => new URL(w.url).origin === base.origin);
    for (const w of same.concat(ours)) {
      try {
        await w.focus();
        if ('navigate' in w) { await w.navigate(link); return; }
        w.postMessage({ type: 'open-tab', tab: base.hash.slice(1) });
        return;
      } catch (err) { /* نافذة غير خاضعة لعامل الخدمة: نجرب التالية */ }
    }
    if (same[0]) { same[0].postMessage({ type: 'open-tab', tab: base.hash.slice(1) }); try { return await same[0].focus(); } catch (err) {} }
    return clients.openWindow(link);
  })());
});
