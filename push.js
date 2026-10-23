/* جرس الإشعارات داخل المنصة + تفعيل إشعارات الهاتف عبر Firebase */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cfg = self.PUSH_CONFIG || {};
  const pushConfigured = !!(cfg.firebase && cfg.firebase.apiKey && cfg.vapidKey);
  const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const TOKEN_KEY = 'pushToken';
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: k => { try { localStorage.removeItem(k); } catch (e) {} } };
  let items = [], unread = 0, panel;

  const BELL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  const when = iso => { const d = new Date(iso); if (isNaN(d)) return ''; const m = Math.round((Date.now() - d) / 6e4); if (m < 1) return 'الآن'; if (m < 60) return 'قبل ' + m + ' د'; if (m < 1440) return 'قبل ' + Math.round(m / 60) + ' س'; return d.toLocaleDateString('ar-IQ-u-nu-latn', { day: 'numeric', month: 'short' }); };

  function openTab(tab) {
    if (tab && document.getElementById(tab) && typeof showTab === 'function') { showTab(tab); window.scrollTo(0, 0); }
  }
  window.openTabFromLink = openTab;

  function setBadges() {
    document.querySelectorAll('.bell-btn').forEach(b => {
      let n = b.querySelector('.bell-n');
      if (!n) { n = document.createElement('span'); n.className = 'bell-n'; b.appendChild(n); }
      n.textContent = unread > 99 ? '99+' : unread;
      n.hidden = !unread;
      b.setAttribute('aria-label', unread ? `الإشعارات، ${unread} غير مقروء` : 'الإشعارات');
    });
    document.title = document.title.replace(/^\(\d+\+?\) /, '');
    if (unread) document.title = '(' + unread + ') ' + document.title;
  }

  async function refresh() {
    if (typeof callApi !== 'function' || !localStorage.getItem('userData')) return;
    const r = await callApi('getNotifications');
    if (!r || !r.success) return;
    items = r.items || []; unread = r.unread || 0;
    setBadges();
    if (panel && !panel.hidden) drawPanel();
  }

  function pushState() {
    if (!supported) return { k: 'none', t: 'هذا المتصفح لا يدعم إشعارات الهاتف. الإشعارات تظهر هنا في الجرس.' };
    if (isIOS && !standalone) return { k: 'ios', t: 'في الآيفون: اضغط زر المشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية»، وافتح المنصة من الأيقونة، ثم فعّل الإشعارات.' };
    if (!pushConfigured) return { k: 'none', t: 'إشعارات الهاتف لم تُفعَّل من الإدارة بعد. الإشعارات تظهر هنا في الجرس.' };
    if (Notification.permission === 'denied') return { k: 'denied', t: 'الإشعارات محظورة لهذا الموقع. افتح إعدادات المتصفح ← إعدادات الموقع ← الإشعارات ← سماح.' };
    if (Notification.permission === 'granted' && store.get(TOKEN_KEY)) return { k: 'on', t: 'إشعارات الهاتف مفعّلة على هذا الجهاز ✅' };
    return { k: 'off', t: 'فعّل الإشعارات لتصلك الدرجات والغيابات والواجبات على هاتفك فوراً.' };
  }

  function drawPanel() {
    const st = pushState();
    panel.innerHTML = `
      <div class="np-head"><b>الإشعارات</b>${unread ? '<button type="button" class="np-link" data-all>تعليم الكل كمقروء</button>' : ''}<button type="button" class="np-x" aria-label="إغلاق">✕</button></div>
      <div class="np-push ${st.k}"><span>${esc(st.t)}</span>${st.k === 'off' ? '<button type="button" class="button btn-publish" data-enable>تفعيل الإشعارات</button>' : ''}</div>
      <div class="np-list">${items.length ? items.map(n => `
        <button type="button" class="np-item ${n.read ? '' : 'unread'}" data-id="${esc(n.id)}" data-tab="${esc(n.tab)}">
          <span class="np-dot"></span><span class="np-body"><b>${esc(n.title)}</b><span>${esc(n.body)}</span></span><small>${when(n.date)}</small>
        </button>`).join('') : '<p class="np-empty">لا توجد إشعارات بعد.</p>'}</div>`;
    panel.querySelector('.np-x').onclick = closePanel;
    const all = panel.querySelector('[data-all]');
    if (all) all.onclick = async () => { items.forEach(i => i.read = true); unread = 0; setBadges(); drawPanel(); await callApi('markNotificationsRead', {}); };
    const en = panel.querySelector('[data-enable]');
    if (en) en.onclick = enablePush;
    panel.querySelectorAll('.np-item').forEach(b => b.onclick = () => {
      const n = items.find(i => i.id === b.dataset.id);
      if (n && !n.read) { n.read = true; unread = Math.max(0, unread - 1); setBadges(); callApi('markNotificationsRead', { ids: [n.id] }); }
      closePanel(); openTab(b.dataset.tab);
    });
  }
  function openPanel() { panel.hidden = false; drawPanel(); refresh(); }
  function closePanel() { panel.hidden = true; }

  let messaging = null;
  async function getMessaging() {
    if (messaging) return messaging;
    if (!window.firebase) {
      await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
      await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
    }
    if (!firebase.apps.length) firebase.initializeApp(cfg.firebase);
    messaging = firebase.messaging();
    // إشعار يصل والمنصة مفتوحة: يظهر داخلها ويُحدَّث الجرس
    messaging.onMessage(p => {
      const d = p.data || {};
      if (typeof toast === 'function') toast('🔔 ' + (d.title || '') + (d.body ? '\n' + d.body : ''));
      refresh();
    });
    return messaging;
  }

  async function enablePush() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { drawPanel(); return; }
      const reg = await navigator.serviceWorker.register('sw.js');
      await navigator.serviceWorker.ready;
      const m = await getMessaging();
      const token = await m.getToken({ vapidKey: cfg.vapidKey, serviceWorkerRegistration: reg });
      if (!token) throw new Error('no token');
      const r = await callApi('registerPushToken', { token, platform: (isIOS ? 'iOS' : /android/i.test(navigator.userAgent) ? 'Android' : 'Desktop') + (standalone ? ' app' : ''), baseUrl: location.href.split('#')[0] });
      if (r && r.success) { store.set(TOKEN_KEY, token); if (typeof toast === 'function') toast('تم تفعيل الإشعارات على هذا الجهاز ✅'); }
    } catch (e) {
      console.error(e);
      if (typeof toast === 'function') toast('تعذّر تفعيل الإشعارات. تأكد من الاتصال وحاول مرة أخرى.', true);
    }
    if (panel && !panel.hidden) drawPanel();
    const b = document.getElementById('pushBanner'); if (b && pushState().k !== 'off') b.remove();
  }

  // تسجيل الخروج: إلغاء إشعارات هذا الجهاز لهذا المستخدم
  window.addEventListener('beforelogout', () => {
    const t = store.get(TOKEN_KEY);
    if (t && typeof callApi === 'function') callApi('unregisterPushToken', { token: t });
    store.del(TOKEN_KEY);
  });

  function mount() {
    if (!document.body.classList.contains('shell-on')) return;
    const mk = () => { const b = document.createElement('button'); b.type = 'button'; b.className = 'bell-btn'; b.innerHTML = BELL; b.onclick = () => (panel.hidden ? openPanel() : closePanel()); return b; };
    const top = document.querySelector('.app-top'); if (top) top.appendChild(mk());
    const brand = document.querySelector('.app-brand'); if (brand) brand.appendChild(mk());
    panel = document.createElement('div');
    panel.className = 'notif-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'الإشعارات');
    document.body.appendChild(panel);
    document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && !e.target.closest('.bell-btn')) closePanel(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

    // تذكير لطيف مرة واحدة أعلى الصفحة
    const st = pushState();
    if ((st.k === 'off' || st.k === 'ios') && !store.get('pushBannerDismissed')) {
      const c = document.querySelector('.container .page-title');
      if (c) {
        const b = document.createElement('div');
        b.id = 'pushBanner'; b.className = 'push-banner';
        b.innerHTML = `<span>🔔 ${esc(st.t)}</span>${st.k === 'off' ? '<button type="button" class="button btn-publish">تفعيل</button>' : ''}<button type="button" class="np-x" aria-label="إخفاء">✕</button>`;
        c.after(b);
        const en = b.querySelector('.button'); if (en) en.onclick = enablePush;
        b.querySelector('.np-x').onclick = () => { store.set('pushBannerDismissed', '1'); b.remove(); };
      }
    }
    // إن كان الجهاز مفعّلاً سابقاً: تحديث الرمز بصمت (قد يتغير)
    if (st.k === 'on' || (pushConfigured && supported && Notification.permission === 'granted' && !store.get(TOKEN_KEY))) enablePush();

    refresh();
    setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'open-tab') { openTab(e.data.tab); refresh(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 0)); else setTimeout(mount, 0);
})();
