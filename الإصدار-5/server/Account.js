/**
 * ربط حساب Gmail واستعادة كلمة المرور
 * ---------------------------------------------------------------
 * - كل مستخدم بلا Gmail مربوط يُطلب منه ربطه عند فتح حسابه.
 * - الربط يتم برمز من 6 أرقام يصل إلى بريده، فنتأكد أن البريد له فعلاً.
 * - «نسيت كلمة المرور؟» في صفحة الدخول ترسل رمزاً إلى Gmail المربوط
 *   ويضع المستخدم كلمة مرور جديدة بنفسه.
 * - الرسائل تُرسل من حساب Google الذي نشر السكربت (MailApp).
 */

// أوامر تعمل بدون تسجيل دخول
const PUBLIC_ACTIONS_ = ['forgotPassword', 'resetPassword'];

const GMAIL_RE_ = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?@(gmail|googlemail)\.com$/;
const CODE_MINUTES_ = 15;

function normGmail_(s) { return String(s || '').trim().toLowerCase(); }
function maskEmail_(e) {
  const [a, d] = String(e).split('@');
  if (!d) return '';
  return a.slice(0, 2) + '•••' + a.slice(-1) + '@' + d;
}
function newCode_() { return ('00000' + Math.floor(Math.random() * 1e6)).slice(-6); }

/** يحد عدد المحاولات خلال مدة. يرجع true إن تجاوز الحد */
function overLimit_(key, max, seconds) {
  const c = CacheService.getScriptCache();
  const n = Number(c.get(key) || 0);
  if (n >= max) return true;
  c.put(key, String(n + 1), seconds);
  return false;
}

function usersSheetInfo_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  let g = data[0].indexOf('GoogleEmail');
  if (g === -1) { g = data[0].length; sheet.getRange(1, g + 1).setValue('GoogleEmail'); }
  return { sheet, data, g };
}

function schoolName_() { return 'مدرسة البراعم كربلاء الأهلية'; }

function sendCodeMail_(to, name, code, purpose) {
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error('QUOTA');
  const school = schoolName_();
  const what = purpose === 'reset' ? 'استعادة كلمة المرور' : 'ربط بريدك بحسابك في المنصة';
  MailApp.sendEmail({
    to: to,
    subject: school + ' — رمز التحقق: ' + code,
    name: school,
    body: 'مرحباً ' + name + '\n\nرمز ' + what + ': ' + code + '\nصالح لمدة ' + CODE_MINUTES_ + ' دقيقة.\nإذا لم تطلب ذلك فتجاهل هذه الرسالة ولا تعطِ الرمز لأحد.',
    htmlBody:
      '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:460px;margin:auto;border:1px solid #e3e3e3;border-radius:12px;padding:24px;text-align:right">' +
      '<h2 style="margin:0 0 6px;color:#0f5c4d;font-size:18px">' + school + '</h2>' +
      '<p style="color:#444">مرحباً ' + String(name).replace(/[<>&]/g, '') + '،</p>' +
      '<p style="color:#444">رمز ' + what + ':</p>' +
      '<div style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#f2f7f5;border-radius:10px;padding:14px;text-align:center;direction:ltr;color:#0f5c4d">' + code + '</div>' +
      '<p style="color:#777;font-size:13px">صالح لمدة ' + CODE_MINUTES_ + ' دقيقة. إذا لم تطلب ذلك فتجاهل هذه الرسالة، ولا تعطِ الرمز لأي شخص حتى لو قال إنه من المدرسة.</p></div>'
  });
}

// ---------------- ربط Gmail (للمستخدم المسجّل) ----------------

function getMyGmail(userInfo) {
  const { data, g } = usersSheetInfo_();
  const row = data.find((r, i) => i > 0 && String(r[0]) === String(userInfo.userId));
  const gm = row ? String(row[g] || '') : '';
  return successResponse({ gmail: gm, masked: gm ? maskEmail_(gm) : '' });
}

function sendGmailCode(payload, userInfo) {
  const email = normGmail_(payload.email);
  if (!GMAIL_RE_.test(email)) return errorResponse('اكتب بريد Gmail صحيحاً ينتهي بـ ‎@gmail.com‎');
  if (overLimit_('gv_n_' + userInfo.userId, 5, 3600)) return errorResponse('طلبت رموزاً كثيرة. حاول بعد ساعة.');
  const { data, g } = usersSheetInfo_();
  const taken = data.some((r, i) => i > 0 && String(r[0]) !== String(userInfo.userId) &&
    (normGmail_(r[g]) === email || normGmail_(r[1]) === email));
  if (taken) return errorResponse('هذا البريد مربوط بحساب آخر في المنصة. استخدم بريدك الشخصي.');
  const code = newCode_();
  try { sendCodeMail_(email, userInfo.name, code, 'link'); }
  catch (e) {
    Logger.log('mail: ' + e);
    return errorResponse(String(e).indexOf('QUOTA') > -1 ? 'وصلت المنصة للحد اليومي للرسائل. حاول غداً.' : 'تعذّر إرسال الرسالة. تأكد من البريد وحاول مجدداً.');
  }
  CacheService.getScriptCache().put('gv_' + userInfo.userId, JSON.stringify({ e: email, h: sha256Hex_(code), t: 0 }), CODE_MINUTES_ * 60);
  return successResponse({ masked: maskEmail_(email) }, 'أرسلنا رمزاً من 6 أرقام إلى ' + email);
}

function verifyGmailCode(payload, userInfo) {
  const c = CacheService.getScriptCache();
  const key = 'gv_' + userInfo.userId;
  let st; try { st = JSON.parse(c.get(key) || 'null'); } catch (e) { st = null; }
  if (!st) return errorResponse('انتهت صلاحية الرمز. اطلب رمزاً جديداً.');
  if (st.t >= 5) { c.remove(key); return errorResponse('محاولات خاطئة كثيرة. اطلب رمزاً جديداً.'); }
  if (sha256Hex_(String(payload.code || '').trim()) !== st.h) {
    st.t++; c.put(key, JSON.stringify(st), CODE_MINUTES_ * 60);
    return errorResponse('الرمز غير صحيح. بقي ' + (5 - st.t) + ' محاولات.');
  }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const { sheet, data, g } = usersSheetInfo_();
    const i = data.findIndex((r, k) => k > 0 && String(r[0]) === String(userInfo.userId));
    if (i < 1) return errorResponse('المستخدم غير موجود.');
    sheet.getRange(i + 1, g + 1).setValue(st.e);
  } finally { lock.releaseLock(); }
  c.remove(key); c.remove('u_' + userInfo.userId);
  return successResponse({ gmail: st.e }, 'تم ربط ' + st.e + ' بحسابك ✅');
}

// ---------------- استعادة كلمة المرور (بدون تسجيل دخول) ----------------

function forgotPassword(payload) {
  const login = normGmail_(payload.login);
  if (!login) return errorResponse('اكتب بريد الدخول أو بريد Gmail المربوط.');
  if (overLimit_('fp_n_' + login, 3, 3600) || overLimit_('fp_all', 60, 3600)) return errorResponse('طلبات كثيرة. حاول بعد ساعة.');
  const { data, g } = usersSheetInfo_();
  const row = data.find((r, i) => i > 0 && (normGmail_(r[1]) === login || normGmail_(r[g]) === login));
  if (!row) return errorResponse('لا يوجد حساب بهذا البريد. تأكد منه أو راجع إدارة المدرسة.');
  const gm = normGmail_(row[g]);
  if (!gm) return errorResponse('حسابك غير مربوط ببريد Gmail، لذلك لا يمكن الاستعادة تلقائياً. راجع إدارة المدرسة لتعيين كلمة جديدة، ثم اربط بريدك من داخل حسابك.');
  if (String(row[5]) !== 'نشط') return errorResponse('الحساب غير نشط. راجع إدارة المدرسة.');
  const code = newCode_();
  try { sendCodeMail_(gm, row[4], code, 'reset'); }
  catch (e) { Logger.log('mail: ' + e); return errorResponse('تعذّر إرسال الرسالة الآن. حاول لاحقاً.'); }
  CacheService.getScriptCache().put('pr_' + login, JSON.stringify({ u: String(row[0]), h: sha256Hex_(code), t: 0 }), CODE_MINUTES_ * 60);
  return successResponse({ masked: maskEmail_(gm) }, 'أرسلنا رمز الاستعادة إلى ' + maskEmail_(gm));
}

function resetPassword(payload) {
  const login = normGmail_(payload.login);
  const pass = String(payload.newPassword || '');
  if (!/^[a-f0-9]{64}$/.test(pass)) return errorResponse('كلمة المرور الجديدة غير صالحة.');
  const c = CacheService.getScriptCache();
  const key = 'pr_' + login;
  let st; try { st = JSON.parse(c.get(key) || 'null'); } catch (e) { st = null; }
  if (!st) return errorResponse('انتهت صلاحية الرمز. اطلب رمزاً جديداً.');
  if (st.t >= 5) { c.remove(key); return errorResponse('محاولات خاطئة كثيرة. اطلب رمزاً جديداً.'); }
  if (sha256Hex_(String(payload.code || '').trim()) !== st.h) {
    st.t++; c.put(key, JSON.stringify(st), CODE_MINUTES_ * 60);
    return errorResponse('الرمز غير صحيح. بقي ' + (5 - st.t) + ' محاولات.');
  }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let emailLogin = '';
  try {
    const { sheet, data } = usersSheetInfo_();
    const i = data.findIndex((r, k) => k > 0 && String(r[0]) === st.u);
    if (i < 1) return errorResponse('المستخدم غير موجود.');
    sheet.getRange(i + 1, 3).setValue(pass);
    emailLogin = String(data[i][1]);
  } finally { lock.releaseLock(); }
  c.remove(key); c.remove('u_' + st.u); c.remove('login_' + emailLogin.toLowerCase()); c.remove('login_' + login);
  // إنهاء الجلسات القديمة على كل الأجهزة
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all).forEach(k => {
    if (k.indexOf('sess_') !== 0) return;
    try { if (JSON.parse(all[k]).u === st.u) props.deleteProperty(k); } catch (e) {}
  });
  return successResponse({ login: emailLogin }, 'تم تغيير كلمة المرور ✅ سجّل الدخول بالكلمة الجديدة.');
}

/** شغّلها مرة واحدة من المحرر لمنح السكربت إذن إرسال البريد */
function authorizeMail() {
  const me = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(me, 'منصة البراعم: تم تفعيل إرسال البريد', 'إذن الإرسال يعمل. المتبقي اليوم: ' + MailApp.getRemainingDailyQuota());
  Logger.log('OK, sent to ' + me);
}
