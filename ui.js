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

  function onReady(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  onReady(function () {
    document.title = document.title.replace(/ - .*$/, '') + ' — ' + SCHOOL_NAME;
    var img = document.getElementById('profilePreview');
    if (img && (!img.getAttribute('src') || /placeholder/.test(img.getAttribute('src')))) img.src = window.DEFAULT_AVATAR;
    document.addEventListener('error', function (e) {
      if (e.target && e.target.tagName === 'IMG' && e.target.src !== window.DEFAULT_AVATAR) e.target.src = window.DEFAULT_AVATAR;
    }, true);

    if (document.getElementById('loginForm')) return buildLogin();
    if (document.querySelector('.tabs')) buildShell();
  });

  function buildLogin() {
    document.body.classList.add('login-page');
    var box = document.querySelector('.form-container');
    if (!box) return;
    var brand = document.createElement('div');
    brand.className = 'login-brand';
    brand.innerHTML = '<span class="app-mark">' + MARK + '</span><span><b>' + SCHOOL_NAME + '</b><small>تسجيل الدخول للطلاب والمدرسين والإدارة</small></span>';
    box.insertBefore(brand, box.firstChild);
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

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
