/* الواجهة الموحّدة: تبني القائمة الجانبية حول الصفحات الحالية دون تغيير منطق script.js */
(function () {
  'use strict';
  var SCHOOL_NAME = 'مدرسة البراعم كربلاء الأهلية';
  var ROLE_LABEL = { 'student-page': 'واجهة الطالب', 'teacher-page': 'لوحة المدرس', 'admin-page': 'لوحة المشرف' };
  var MARK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12h4l2.5-6 4 12 3-8 1.5 2H22"/></svg>';
  window.SCHOOL_NAME = SCHOOL_NAME;
  window.DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#dcefec"/><circle cx="60" cy="46" r="22" fill="#0d6a61"/><path d="M18 112c4-26 22-38 42-38s38 12 42 38" fill="#0d6a61"/></svg>');

  /* رسائل غير مزعجة بدل نوافذ alert التي توقف الصفحة */
  var toastTimer;
  function toast(msg, isErr) {
    var old = document.querySelector('.app-toast');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'app-toast' + (isErr ? ' err' : '');
    el.setAttribute('role', isErr ? 'alert' : 'status');
    el.textContent = String(msg == null ? '' : msg);
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.remove(); }, isErr ? 6000 : 3200);
  }
  window.toast = toast;
  window.alert = function (msg) { toast(msg, /^(خطأ|فشل|الرجاء|يرجى|لا |لم )/.test(String(msg))); };

  /* شريط «جارِ التحميل» أعلى الشاشة مع كل طلب للخادم، حتى لا يبقى المستخدم محتاراً */
  var pending = 0, loadTimer;
  function loadingUI(on) {
    var bar = document.getElementById('appLoading');
    if (!bar && document.body) {
      bar = document.createElement('div');
      bar.id = 'appLoading';
      bar.innerHTML = '<i></i><span>جارِ التحميل…</span>';
      document.body.appendChild(bar);
    }
    if (!bar) return;
    clearTimeout(loadTimer);
    if (on) loadTimer = setTimeout(function () { bar.classList.add('on'); }, 150);
    else bar.classList.remove('on');
  }
  var realFetch = window.fetch;
  window.fetch = function (url) {
    var isApi = /script\.google(usercontent)?\.com/.test(String(url && url.url || url));
    if (!isApi) return realFetch.apply(this, arguments);
    var body = arguments[1] && arguments[1].body;
    var quiet = /"action":"(getNotifications|trackItemView|markNotificationsRead|registerPushToken)"/.test(String(body || ''));
    if (!quiet) { pending++; loadingUI(true); }
    var done = function () { if (!quiet && --pending <= 0) { pending = 0; loadingUI(false); } };
    return realFetch.apply(this, arguments).then(function (r) { done(); return r; }, function (e) { done(); throw e; });
  };

  function onReady(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  onReady(function () {
    document.title = document.title.replace(/ - .*$/, '') + ' — ' + SCHOOL_NAME;
    var img = document.getElementById('profilePreview');
    if (img && (!img.getAttribute('src') || /placeholder/.test(img.getAttribute('src')))) img.src = window.DEFAULT_AVATAR;
    document.addEventListener('error', function (e) {
      if (e.target && e.target.tagName === 'IMG' && e.target.src !== window.DEFAULT_AVATAR) e.target.src = window.DEFAULT_AVATAR;
    }, true);

    if (document.getElementById('loginForm')) return buildLogin();
    if (document.querySelector('.tabs')) { buildShell(); deepLink(); }
    addSelectAll();
  });

  function buildLogin() {
    document.body.classList.add('login-page');
    var box = document.querySelector('.form-container');
    if (!box) return;
    var brand = document.createElement('div');
    brand.className = 'login-brand';
    brand.innerHTML = '<span class="app-mark">' + MARK + '</span><span><b>' + SCHOOL_NAME + '</b><small>تسجيل الدخول للطلاب والمدرسين والإدارة</small></span>';
    box.insertBefore(brand, box.firstChild);
    var pw = document.getElementById('password');
    if (pw && pw.parentNode) {
      var eye = document.createElement('button');
      eye.type = 'button'; eye.className = 'pw-eye'; eye.textContent = 'إظهار'; eye.setAttribute('aria-label', 'إظهار كلمة المرور');
      eye.onclick = function () { var show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; eye.textContent = show ? 'إخفاء' : 'إظهار'; };
      pw.parentNode.appendChild(eye);
    }
  }

  function buildShell() {
    var body = document.body;
    var page = body.classList.contains('student-page') ? 'student-page' : body.classList.contains('teacher-page') ? 'teacher-page' : 'admin-page';
    body.classList.add('shell-on');
    var tabs = document.querySelector('.tabs');
    var container = document.querySelector('.container');

    // صفحة المشرف فيها تبويبات خارج الحاوية؛ نجمعها كلها في مكان واحد
    if (container) Array.prototype.forEach.call(document.querySelectorAll('.tab-content'), function (t) {
      if (!container.contains(t)) container.appendChild(t);
    });

    var side = document.createElement('aside');
    side.className = 'app-side';
    side.setAttribute('aria-label', 'القائمة');
    side.innerHTML = '<div class="app-brand"><span class="app-mark">' + MARK + '</span><span><b>' + SCHOOL_NAME + '</b><small>' + ROLE_LABEL[page] + '</small></span></div>';
    side.appendChild(tabs);
    var foot = document.createElement('div');
    foot.className = 'app-foot';
    foot.innerHTML = '<div><b id="appUser">—</b><span>' + ROLE_LABEL[page] + '</span></div><button type="button" id="appLogout">تسجيل الخروج</button>';
    side.appendChild(foot);
    body.insertBefore(side, body.firstChild);

    var scrim = document.createElement('div');
    scrim.className = 'app-scrim';
    body.insertBefore(scrim, side.nextSibling);

    var top = document.createElement('header');
    top.className = 'app-top';
    top.innerHTML = '<button type="button" id="appMenu" aria-label="فتح القائمة"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><b>البراعم</b><span id="appTopTitle"></span>';
    body.insertBefore(top, scrim.nextSibling);

    var title = document.createElement('div');
    title.className = 'page-title';
    title.innerHTML = '<div><h1 id="appPageTitle">' + ROLE_LABEL[page] + '</h1><p>' + SCHOOL_NAME + '</p></div>';
    if (container) container.insertBefore(title, container.firstChild);

    document.getElementById('appMenu').onclick = function () { body.classList.add('nav-open'); };
    scrim.onclick = function () { body.classList.remove('nav-open'); };
    document.getElementById('appLogout').onclick = function () {
      var b = document.getElementById('logoutBtn');
      if (b) b.click();
    };

    // اسم المستخدم يكتبه script.js في الترويسة القديمة؛ ننسخه إلى القائمة
    var nameEl = document.getElementById('userName');
    var syncName = function () { if (nameEl && nameEl.textContent.trim()) document.getElementById('appUser').textContent = nameEl.textContent.trim(); };
    if (nameEl) new MutationObserver(syncName).observe(nameEl, { childList: true, characterData: true, subtree: true });
    syncName();

    var syncTitle = function () {
      var a = side.querySelector('.tab-button.active');
      var t = a ? a.textContent.trim() : ROLE_LABEL[page];
      document.getElementById('appTopTitle').textContent = t;
    };
    new MutationObserver(syncTitle).observe(tabs, { attributes: true, subtree: true, attributeFilter: ['class'] });
    tabs.addEventListener('click', function (e) {
      if (e.target.closest('.tab-button')) { body.classList.remove('nav-open'); window.scrollTo(0, 0); }
    });
    syncTitle();
  }

  /* فتح التبويب (والعنصر) المطلوب من رابط الإشعار.
     صيغة الرابط: Page.html#tabId أو #tabId:itemId ، وقد ينتهي بـ ~رقم لجعل كل ضغطة فريدة */
  function parseHash(h) {
    h = decodeURIComponent(String(h || '').replace(/^#/, '')).split('~')[0];
    var i = h.indexOf(':');
    return { tab: i > -1 ? h.slice(0, i) : h, arg: i > -1 ? h.slice(i + 1) : '' };
  }
  window.parseDeepHash = parseHash;
  function announce(d) {
    window.__deepArg = d;
    try { window.dispatchEvent(new CustomEvent('deeplink', { detail: d })); } catch (e) {}
  }
  function deepLink() {
    var orig = window.showTab;
    if (typeof orig !== 'function') return;
    var want = parseHash(location.hash);
    var pending = want.tab && document.getElementById(want.tab) ? want.tab : '';
    window.showTab = function (id) {
      // التحميل الأولي في script.js يفتح التبويب الافتراضي؛ نستبدله بالتبويب المطلوب من الرابط فقط
      if (pending && ['gradesTab', 'announcementsTab', 'pendingTab'].indexOf(id) > -1) id = pending;
      var r = window.__showTabRaw(id);
      try { history.replaceState(null, '', '#' + id); } catch (e) {}
      return r;
    };
    window.__showTabRaw = orig;
    var tabs = document.querySelector('.tabs');
    if (tabs) tabs.addEventListener('click', function () { pending = ''; }, true);
    setTimeout(function () { pending = ''; }, 8000);
    if (pending) { window.__deepArg = want; orig(pending); window.scrollTo(0, 0); announce(Object.assign({ initial: true }, want)); }
    window.addEventListener('hashchange', function () {
      var d = parseHash(location.hash);
      if (d.tab && document.getElementById(d.tab)) {
        pending = '';
        orig(d.tab);
        try { history.replaceState(null, '', '#' + d.tab); } catch (e) {}
        window.scrollTo(0, 0);
        announce(d);
      }
    });
  }

  /* أزرار «تحديد الكل / إلغاء الكل» للإكسل الشامل */
  function addSelectAll() {
    ['masterSubjectsContainer', 'masterGradeTypesContainer'].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box || box.previousElementSibling && box.previousElementSibling.classList.contains('select-bar')) return;
      var bar = document.createElement('div');
      bar.className = 'select-bar';
      bar.innerHTML = '<button type="button" data-v="1">تحديد الكل</button><button type="button" data-v="0">إلغاء الكل</button><span></span>';
      var count = bar.querySelector('span');
      var upd = function () {
        var all = box.querySelectorAll('input[type=checkbox]'), on = box.querySelectorAll('input[type=checkbox]:checked');
        count.textContent = all.length ? on.length + ' من ' + all.length + ' محدد' : '';
      };
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        box.querySelectorAll('input[type=checkbox]').forEach(function (c) { c.checked = b.dataset.v === '1'; c.dispatchEvent(new Event('change', { bubbles: true })); });
        upd();
      });
      box.addEventListener('change', upd);
      new MutationObserver(upd).observe(box, { childList: true, subtree: true });
      box.parentNode.insertBefore(bar, box);
      upd();
    });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
