/* ربط بريد Gmail بالحساب + «نسيت كلمة المرور؟» */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const GMAIL = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?@(gmail|googlemail)\.com$/i;
  const isLogin = !!document.getElementById('loginForm');

  function dialog(html) {
    const ov = document.createElement('div');
    ov.className = 'acc-ov';
    ov.innerHTML = `<div class="acc-box" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    setTimeout(() => { const f = ov.querySelector('input'); if (f) f.focus(); }, 50);
    return { ov, box: ov.firstChild, close, $: s => ov.querySelector(s) };
  }
  const busy = (btn, on, text) => { btn.disabled = on; if (text) btn.textContent = text; };
  const msg = (el, t, good) => { el.textContent = t || ''; el.className = 'acc-msg' + (good ? ' good' : ''); };

  /* ---------------- داخل الحساب: ربط Gmail ---------------- */
  function linkDialog(current) {
    const d = dialog(`
      <div class="acc-icon" aria-hidden="true">✉️</div>
      <h2>${current ? 'تغيير بريد Gmail' : 'أكمل معلومات حسابك'}</h2>
      <p class="acc-lead">${current ? 'بريدك المربوط حالياً: <b dir="ltr">' + esc(current) + '</b>' : 'اربط بريد <b>Gmail</b> الخاص بك بحسابك.'} نرسل إليه رمزاً إذا نسيت كلمة المرور، ويمكنك الدخول به أيضاً.</p>
      <div class="acc-step" data-s="1">
        <label for="accMail">بريد Gmail</label>
        <input id="accMail" type="email" dir="ltr" inputmode="email" autocomplete="email" placeholder="name@gmail.com">
        <button type="button" class="button btn-publish" id="accSend">إرسال رمز التحقق</button>
      </div>
      <div class="acc-step" data-s="2" hidden>
        <p class="acc-sent"></p>
        <label for="accCode">رمز التحقق (6 أرقام)</label>
        <input id="accCode" class="acc-code" dir="ltr" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••">
        <button type="button" class="button btn-publish" id="accVerify">تأكيد الربط</button>
        <p class="acc-hint">لم تصلك الرسالة؟ افحص مجلد «الرسائل غير المرغوب فيها» (Spam)، أو <button type="button" class="link-btn" id="accBack">غيّر البريد وأعد الإرسال</button>.</p>
      </div>
      <p class="acc-msg" role="alert"></p>
      <div class="acc-foot"><button type="button" class="link-btn" id="accLater">${current ? 'إغلاق' : 'لاحقاً'}</button></div>`);
    const m = d.$('.acc-msg');
    const step = n => d.ov.querySelectorAll('.acc-step').forEach(s => { s.hidden = s.dataset.s !== String(n); });
    d.$('#accLater').onclick = () => { if (!current) ss.set('gmailLater', '1'); d.close(); };
    d.$('#accBack').onclick = () => { step(1); msg(m, ''); d.$('#accMail').focus(); };
    const send = async () => {
      const email = d.$('#accMail').value.trim().toLowerCase();
      if (!GMAIL.test(email)) { msg(m, 'اكتب بريد Gmail صحيحاً ينتهي بـ ‎@gmail.com‎'); return; }
      const b = d.$('#accSend'); busy(b, true, 'جارِ الإرسال…');
      const r = await callApi('sendGmailCode', { email });
      busy(b, false, 'إرسال رمز التحقق');
      if (!r || !r.success) { msg(m, (r && r.message) || 'تعذّر الإرسال.'); return; }
      msg(m, ''); d.$('.acc-sent').innerHTML = 'أرسلنا رمزاً إلى <b dir="ltr">' + esc(email) + '</b>. الرمز صالح 15 دقيقة.';
      step(2); d.$('#accCode').value = ''; d.$('#accCode').focus();
    };
    let inflight = false, lastTried = '';
    const verify = async () => {
      const code = d.$('#accCode').value.replace(/\D/g, '');
      if (inflight || code === lastTried) return;
      inflight = true; lastTried = code;
      try { await doVerify(code); } finally { inflight = false; }
    };
    const doVerify = async (code) => {
      if (code.length !== 6) { msg(m, 'الرمز 6 أرقام.'); return; }
      const b = d.$('#accVerify'); busy(b, true, 'جارِ التأكيد…');
      const r = await callApi('verifyGmailCode', { code });
      busy(b, false, 'تأكيد الربط');
      if (!r || !r.success) { if (!r || r.network) lastTried = ''; msg(m, (r && r.message) || 'تعذّر التأكيد.'); return; }
      d.close();
      state.gmail = r.gmail; paintFoot();
      if (typeof toast === 'function') toast(r.message || 'تم ربط البريد ✅');
    };
    d.$('#accSend').onclick = send;
    d.$('#accMail').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    d.$('#accVerify').onclick = verify;
    d.$('#accCode').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); if (e.target.value.length === 6) verify(); });
  }

  const state = { gmail: null };
  function paintFoot() {
    const foot = document.querySelector('.app-foot');
    if (!foot || state.gmail === null) return;
    let b = document.getElementById('appGmail');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.id = 'appGmail';
      const lo = document.getElementById('appLogout');
      foot.insertBefore(b, lo || null);
      b.onclick = () => linkDialog(state.gmail);
    }
    b.textContent = state.gmail ? '✉️ ' + state.gmail : '✉️ ربط بريد Gmail';
    b.title = state.gmail ? 'تغيير بريد Gmail المربوط' : 'اربط Gmail لاستعادة كلمة المرور';
    b.classList.toggle('need', !state.gmail);
  }

  async function checkAccount() {
    if (typeof callApi !== 'function' || !localStorage.getItem('userData')) return;
    const r = await callApi('getMyGmail');
    if (!r || !r.success) return;            // الخادم قديم أو لا اتصال: لا شيء
    state.gmail = r.gmail || '';
    paintFoot();
    if (!state.gmail && !ss.get('gmailLater')) linkDialog('');
  }

  /* ---------------- صفحة الدخول: نسيت كلمة المرور ---------------- */
  function forgotDialog() {
    const d = dialog(`
      <div class="acc-icon" aria-hidden="true">🔑</div>
      <h2>استعادة كلمة المرور</h2>
      <div class="acc-step" data-s="1">
        <p class="acc-lead">اكتب بريد الدخول أو بريد Gmail المربوط بحسابك، وسنرسل رمزاً إلى Gmail.</p>
        <label for="fpLogin">البريد</label>
        <input id="fpLogin" type="email" dir="ltr" autocomplete="username" placeholder="name@gmail.com">
        <button type="button" class="button btn-publish" id="fpSend">إرسال الرمز</button>
      </div>
      <div class="acc-step" data-s="2" hidden>
        <p class="acc-sent"></p>
        <label for="fpCode">رمز التحقق (6 أرقام)</label>
        <input id="fpCode" class="acc-code" dir="ltr" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••">
        <label for="fpPass">كلمة المرور الجديدة</label>
        <input id="fpPass" type="password" dir="ltr" autocomplete="new-password" placeholder="6 أحرف على الأقل">
        <label for="fpPass2">أعد كتابتها</label>
        <input id="fpPass2" type="password" dir="ltr" autocomplete="new-password">
        <button type="button" class="button btn-publish" id="fpSave">حفظ كلمة المرور</button>
        <p class="acc-hint">لم يصل الرمز؟ افحص «الرسائل غير المرغوب فيها» (Spam).</p>
      </div>
      <p class="acc-msg" role="alert"></p>
      <div class="acc-foot"><button type="button" class="link-btn" id="fpClose">إغلاق</button></div>`);
    const m = d.$('.acc-msg');
    const step = n => d.ov.querySelectorAll('.acc-step').forEach(s => { s.hidden = s.dataset.s !== String(n); });
    const em = document.getElementById('email');
    if (em && em.value) d.$('#fpLogin').value = em.value.trim();
    d.$('#fpClose').onclick = d.close;
    let login = '';
    const send = async () => {
      login = d.$('#fpLogin').value.trim().toLowerCase();
      if (!login) { msg(m, 'اكتب البريد.'); return; }
      const b = d.$('#fpSend'); busy(b, true, 'جارِ الإرسال…');
      const r = await callApi('forgotPassword', { login });
      busy(b, false, 'إرسال الرمز');
      if (!r || !r.success) { msg(m, (r && r.message) || 'تعذّر الإرسال.'); return; }
      msg(m, ''); d.$('.acc-sent').innerHTML = esc(r.message) + '. الرمز صالح 15 دقيقة.';
      step(2); d.$('#fpCode').focus();
    };
    d.$('#fpSend').onclick = send;
    d.$('#fpLogin').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    d.$('#fpCode').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
    d.$('#fpSave').onclick = async () => {
      const code = d.$('#fpCode').value, p1 = d.$('#fpPass').value, p2 = d.$('#fpPass2').value;
      if (code.length !== 6) { msg(m, 'الرمز 6 أرقام.'); return; }
      if (p1.length < 6) { msg(m, 'كلمة المرور 6 أحرف على الأقل.'); return; }
      if (p1 !== p2) { msg(m, 'كلمتا المرور غير متطابقتين.'); return; }
      const b = d.$('#fpSave'); busy(b, true, 'جارِ الحفظ…');
      const r = await callApi('resetPassword', { login, code, newPassword: await hashPassword(p1) });
      busy(b, false, 'حفظ كلمة المرور');
      if (!r || !r.success) { msg(m, (r && r.message) || 'تعذّر الحفظ.'); return; }
      d.close();
      if (em) em.value = r.login || login;
      const pw = document.getElementById('password'); if (pw) { pw.value = ''; pw.focus(); }
      const lm = document.getElementById('message'); if (lm) { lm.textContent = r.message; lm.style.color = '#2c7a40'; }
    };
  }

  function mountLogin() {
    const form = document.getElementById('loginForm');
    const sub = form.querySelector('button[type="submit"]');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'forgot-link'; b.textContent = 'نسيت كلمة المرور؟';
    b.onclick = forgotDialog;
    sub.after(b);
  }

  const start = () => {
    if (isLogin) mountLogin();
    else setTimeout(() => { paintFoot(); checkAccount(); }, 1200);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
