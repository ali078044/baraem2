// ==========================================================
//   الإضافات: الميزات والصلاحيات، الامتحانات، الورقي، المحادثة،
//   وليّ الأمر، السجل الدراسي، الإحصائيات، إضافة المستخدمين
//   ضع هذا الملف في Apps Script كملف جديد باسم Extensions
// ==========================================================

const ROLE_ = { S: 'طالب', T: 'مدرس', A: 'إداري', P: 'ولي أمر' };
const isRole_ = (u, r) => normalizeArabicText_(u && u.role) === normalizeArabicText_(r);

// ---------------- الصفحات الجديدة ----------------
const EXT_SHEETS_ = {
  EXAMS: 'الامتحانات',
  ATTEMPTS: 'إجابات_الامتحانات',
  CHAT: 'المحادثات'
};
const EXT_HEADERS_ = {
  'الامتحانات': ['ExamID', 'Title', 'Subject', 'Class', 'Section', 'TeacherID', 'TeacherName', 'Mode', 'Status', 'SettingsJSON', 'CreatedAt', 'UpdatedAt', 'QuestionCount', 'TotalMarks', 'QuestionsJSON'],
  'إجابات_الامتحانات': ['AttemptID', 'ExamID', 'StudentID', 'StudentName', 'Source', 'AnswersJSON', 'Score', 'Total', 'StartedAt', 'SubmittedAt', 'Status', 'RecordedBy'],
  'المحادثات': ['MsgID', 'FromID', 'ToID', 'Body', 'CreatedAt', 'ReadAt']
};
// أعمدة تُضاف لصفحة المستخدمين
const EXT_USER_COLUMNS_ = ['CanUseMasterExcel', 'CanCreateExams', 'CanScanPaper', 'CanChat', 'CanViewRecords', 'Children', 'GoogleEmail'];

// ---------------- الميزات العامة (تظهر كمفاتيح في الإعدادات) ----------------
const FEATURES_ = {
  Feature_Exams: 'ميزة: الامتحانات الإلكترونية',
  Feature_PaperExams: 'ميزة: الامتحانات الورقية والتصحيح بالكاميرا',
  Feature_Chat: 'ميزة: المحادثة بين المدرسين والطلاب وأولياء الأمور',
  Feature_StudentStartChat: 'ميزة: الطالب ووليّ الأمر يبدآن المحادثة مع المدرس',
  Feature_Parents: 'ميزة: حسابات أولياء الأمور',
  Feature_StudentRecord: 'ميزة: السجل الدراسي للطالب',
  Feature_Stats: 'ميزة: الإحصائيات'
};
// صلاحيات المدرس الفردية (من تبويب المستخدمين)
const TEACHER_PERMS_ = {
  canRecordAbsence: 'CanRecordAbsence', canUseMasterExcel: 'CanUseMasterExcel', canCreateExams: 'CanCreateExams',
  canScanPaper: 'CanScanPaper', canChat: 'CanChat', canViewRecords: 'CanViewRecords'
};

function featuresOn_() {
  const s = getSystemSettings().settings;
  const out = {};
  Object.keys(FEATURES_).forEach(k => { out[k] = !!(s[k] && s[k].value === 'مفتوح'); });
  return out;
}

// ---------------- الأوامر الجديدة: من يحق له، وأي ميزة/صلاحية تلزم ----------------
// roles: الأدوار المسموحة | feature: مفتاح الميزة | perm: صلاحية المدرس المطلوبة
const EXT_ACL_ = (function () {
  const S = ROLE_.S, T = ROLE_.T, A = ROLE_.A, P = ROLE_.P;
  return {
    getMyFeatures: { roles: [S, T, A, P] },
    // ربط Gmail (لكل الحسابات)
    getMyGmail: { roles: [S, T, A, P] }, sendGmailCode: { roles: [S, T, A, P] }, verifyGmailCode: { roles: [S, T, A, P] },
    // الامتحانات
    listExams: { roles: [T, A], feature: 'Feature_Exams', perm: 'canCreateExams' },
    getExam: { roles: [T, A], feature: 'Feature_Exams', perm: 'canCreateExams' },
    saveExam: { roles: [T, A], feature: 'Feature_Exams', perm: 'canCreateExams' },
    setExamStatus: { roles: [T, A], feature: 'Feature_Exams', perm: 'canCreateExams' },
    getExamResults: { roles: [T, A], feature: 'Feature_Exams', perm: 'canCreateExams' },
    resetAttempt: { roles: [T, A], feature: 'Feature_Exams', perm: 'canCreateExams' },
    transferExamToGrades: { roles: [T, A], feature: 'Feature_Exams', perm: 'canCreateExams' },
    submitExamResults: { roles: [T, A] },
    getPendingExamResults: { roles: [A] },
    handleExamResults: { roles: [A] },
    getMyExams: { roles: [S, P], feature: 'Feature_Exams', proxy: true },
    startExam: { roles: [S], feature: 'Feature_Exams' },
    submitExam: { roles: [S], feature: 'Feature_Exams' },
    // الورقي
    getExamForPrint: { roles: [T, A], feature: 'Feature_PaperExams', perm: 'canScanPaper' },
    savePaperResult: { roles: [T, A], feature: 'Feature_PaperExams', perm: 'canScanPaper' },
    // المحادثة
    getChatContacts: { roles: [S, T, A, P], feature: 'Feature_Chat', perm: 'canChat' },
    getChatThreads: { roles: [S, T, A, P], feature: 'Feature_Chat', perm: 'canChat' },
    getChatMessages: { roles: [S, T, A, P], feature: 'Feature_Chat', perm: 'canChat' },
    sendChatMessage: { roles: [S, T, A, P], feature: 'Feature_Chat', perm: 'canChat' },
    adminChatReview: { roles: [A], feature: 'Feature_Chat' },
    // السجل الدراسي والإحصائيات
    getRecordStudents: { roles: [T, A], feature: 'Feature_StudentRecord', perm: 'canViewRecords' },
    getStudentRecord: { roles: [T, A], feature: 'Feature_StudentRecord', perm: 'canViewRecords' },
    getAdminStats: { roles: [A], feature: 'Feature_Stats' },
    // المستخدمون
    createUser: { roles: [A] },
    getTeachersPermissions: { roles: [A] },
    updateUserPermission: { roles: [A] }
  };
})();

// أوامر حساب وليّ الأمر نفسه
const PARENT_SELF_ = ['logout', 'whoAmI', 'getMyProfile', 'updateMyProfile', 'getWeeklySchedule', 'getNotifications', 'markNotificationsRead', 'registerPushToken', 'unregisterPushToken', 'getMyFeatures', 'getMyGmail', 'sendGmailCode', 'verifyGmailCode'];
// أوامر الطالب التي يستطيع وليّ الأمر قراءتها نيابة عن ابنه
const PARENT_PROXY_ = ['getStudentDashboard', 'getStudentObjections', 'getMyExams', 'submitObjection'];

/**
 * يُستدعى من authorize_ في Code.js قبل أي أمر.
 * يُرجع null عند السماح، أو نص الرفض.
 */
function authorizeExtra_(action, user, payload) {
  const rule = EXT_ACL_[action];
  const isAdmin = isRole_(user, ROLE_.A);
  // وليّ الأمر: أوامر الطالب تُنفَّذ باسم ابنه بعد التحقق من الربط
  if (isRole_(user, ROLE_.P)) {
    if (!featuresOn_().Feature_Parents) return 'حسابات أولياء الأمور غير مفعّلة.';
    if (PARENT_PROXY_.indexOf(action) > -1 || (rule && rule.proxy)) {
      const child = String(payload.childId || '');
      if (!child || user.children.indexOf(child) === -1) return 'هذا الطالب غير مرتبط بحسابك.';
      if (!rule || !rule.feature) return null;
    }
    if (PARENT_SELF_.indexOf(action) > -1) return null;
    if (!rule) return 'ليست لديك صلاحية لهذا الإجراء.';
  }
  if (!rule) return undefined;   // ليس أمراً إضافياً: يقرر ACL_ الأصلي
  const allowed = rule.roles.map(normalizeArabicText_);
  if (!isAdmin && allowed.indexOf(normalizeArabicText_(user.role)) === -1) return 'ليست لديك صلاحية لهذا الإجراء.';
  if (rule.feature) {
    const f = featuresOn_();
    if (!f[rule.feature]) return 'هذه الميزة غير مفعّلة من الإدارة.';
    if (rule.feature === 'Feature_Chat' && !isAdmin && !isRole_(user, ROLE_.T) && action === 'sendChatMessage' && !f.Feature_StudentStartChat) {
      // الطالب ووليّ الأمر يستطيعان الرد فقط إن لم تُفعَّل «بدء المحادثة»؛ يُفحص داخل sendChatMessage
    }
  }
  if (rule.perm && isRole_(user, ROLE_.T) && !user.perms[rule.perm]) return 'هذه الصلاحية غير مفعّلة لحسابك. راجع الإدارة.';
  return null;
}

/** يُستدعى من الموجّه للأوامر غير الموجودة في Code.js */
function routeExtra_(action, payload, userInfo) {
  // حساب المستخدم: Gmail واستعادة كلمة المرور (Account.js)
  switch (action) {
    case 'forgotPassword': return forgotPassword(payload);
    case 'resetPassword': return resetPassword(payload);
    case 'getMyGmail': return getMyGmail(userInfo);
    case 'sendGmailCode': return sendGmailCode(payload, userInfo);
    case 'verifyGmailCode': return verifyGmailCode(payload, userInfo);
  }
  const actor = actingUser_(action, payload, userInfo);
  switch (action) {
    case 'getMyFeatures': return getMyFeatures(userInfo);
    case 'listExams': return listExams(payload, userInfo);
    case 'getExam': return getExam(payload, userInfo);
    case 'saveExam': return saveExam(payload, userInfo);
    case 'setExamStatus': return setExamStatus(payload, userInfo);
    case 'getExamResults': return getExamResults(payload, userInfo);
    case 'resetAttempt': return resetAttempt(payload, userInfo);
    case 'transferExamToGrades': return transferExamToGrades(payload, userInfo);
    case 'submitExamResults': return submitExamResults(payload, userInfo);
    case 'getPendingExamResults': return getPendingExamResults();
    case 'handleExamResults': return handleExamResults(payload, userInfo);
    case 'getMyExams': return getMyExams(payload, actor);
    case 'startExam': return startExam(payload, userInfo);
    case 'submitExam': return submitExam(payload, userInfo);
    case 'getExamForPrint': return getExamForPrint(payload, userInfo);
    case 'savePaperResult': return savePaperResult(payload, userInfo);
    case 'getChatContacts': return getChatContacts(userInfo);
    case 'getChatThreads': return getChatThreads(userInfo);
    case 'getChatMessages': return getChatMessages(payload, userInfo);
    case 'sendChatMessage': return sendChatMessage(payload, userInfo);
    case 'adminChatReview': return adminChatReview(payload);
    case 'getRecordStudents': return getRecordStudents(userInfo);
    case 'getStudentRecord': return getStudentRecord(payload, userInfo);
    case 'getAdminStats': return getAdminStats();
    case 'createUser': return createUser(payload);
  }
  return null;
}

/** وليّ الأمر يعمل باسم ابنه في أوامر القراءة */
function actingUser_(action, payload, userInfo) {
  if (!isRole_(userInfo, ROLE_.P)) return userInfo;
  if (PARENT_PROXY_.indexOf(action) === -1 && !(EXT_ACL_[action] && EXT_ACL_[action].proxy)) return userInfo;
  const child = getData_(SHEETS.USERS).find(r => String(r[0]) === String(payload.childId));
  if (!child) return userInfo;
  return { userId: child[0], role: child[3], name: child[4], studentClass: child[6], studentSection: child[7], viaParent: userInfo.userId, perms: {}, children: [] };
}

function getMyFeatures(userInfo) {
  const f = featuresOn_();
  const isT = isRole_(userInfo, ROLE_.T), isA = isRole_(userInfo, ROLE_.A), isS = isRole_(userInfo, ROLE_.S), isP = isRole_(userInfo, ROLE_.P);
  const p = userInfo.perms || {};
  const can = (feat, perm) => !!f[feat] && (isA || !isT || !perm || !!p[perm]);
  let children = [];
  if (isP) {
    const users = getUsersMap_();
    children = userInfo.children.map(id => ({ id: id, name: (users.get(id) || {}).name || id, cls: (users.get(id) || {}).class || '', sec: (users.get(id) || {}).section || '' }));
  }
  return successResponse({
    role: userInfo.role,
    features: {
      exams: (isT || isA) ? can('Feature_Exams', 'canCreateExams') : (isS || isP) && f.Feature_Exams,
      paper: (isT || isA) && can('Feature_PaperExams', 'canScanPaper'),
      chat: can('Feature_Chat', 'canChat'),
      studentStartChat: !!f.Feature_StudentStartChat,
      parents: !!f.Feature_Parents,
      record: (isT || isA) && can('Feature_StudentRecord', 'canViewRecords'),
      stats: isA && !!f.Feature_Stats
    },
    perms: isT ? p : {},
    children: children
  });
}

// ==========================================================
//                       الامتحانات
// ==========================================================
const CHUNK_ = 45000;
function sheetX_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.getRange(1, 1, 1, EXT_HEADERS_[name].length).setValues([EXT_HEADERS_[name]]); sh.setFrozenRows(1); }
  return sh;
}
function chunks_(text) { const out = []; for (let i = 0; i < text.length; i += CHUNK_) out.push(text.slice(i, i + CHUNK_)); return out.length ? out : ['']; }
function examFromRow_(r) {
  let questions = [];
  try { questions = JSON.parse(r.slice(14).map(String).join('') || '[]'); } catch (e) { questions = []; }
  let settings = {};
  try { settings = JSON.parse(r[9] || '{}'); } catch (e) { settings = {}; }
  return { id: String(r[0]), title: r[1], subject: r[2], cls: r[3], section: r[4], teacherId: String(r[5]), teacherName: r[6], mode: r[7] || 'online',
    status: r[8] || 'مسودة', settings: settings, createdAt: r[10], updatedAt: r[11], count: Number(r[12]) || questions.length, total: Number(r[13]) || 0, questions: questions };
}
function findExam_(id) {
  const sh = sheetX_(EXT_SHEETS_.EXAMS);
  const data = sh.getDataRange().getValues();
  const i = data.findIndex((r, k) => k > 0 && String(r[0]) === String(id));
  return i > 0 ? { sheet: sh, row: i + 1, exam: examFromRow_(data[i]) } : null;
}
function ownsExam_(exam, user) { return isRole_(user, ROLE_.A) || String(exam.teacherId) === String(user.userId); }
function teacherTeaches_(user, cls, section, subject) {
  if (isRole_(user, ROLE_.A)) return true;
  return getData_(SHEETS.TEACHER_ASSIGNMENTS).some(a => String(a[0]) === String(user.userId) && a[2] === cls &&
    (a[3] === section || a[3] === 'الكل' || !a[3] || section === 'الكل') && a[4] === subject);
}
function scoreAnswers_(exam, answers) {
  let score = 0, total = 0;
  exam.questions.forEach((q, i) => { const m = Number(q.marks) || 1; total += m; if (answers && Number(answers[i]) === Number(q.correct)) score += m; });
  return { score: score, total: total };
}
function examStudents_(exam) {
  const users = getData_(SHEETS.USERS);
  const cls = normalizeArabicText_(exam.cls), sec = normalizeArabicText_(exam.section);
  return users.filter(r => normalizeArabicText_(r[3]) === 'طالب' && normalizeArabicText_(r[5]) === 'نشط' && normalizeArabicText_(r[6]) === cls &&
    (!sec || sec === 'الكل' || normalizeArabicText_(r[7]) === sec))
    .map(r => ({ id: String(r[0]), name: r[4], section: r[7] }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
}
function attemptsFor_(examId) {
  return getData_(EXT_SHEETS_.ATTEMPTS).filter(r => String(r[1]) === String(examId));
}
const examPublic_ = e => ({ id: e.id, title: e.title, subject: e.subject, cls: e.cls, section: e.section, teacherName: e.teacherName, mode: e.mode, resultState: (e.settings && e.settings.resultState) || '',
  status: e.status, settings: e.settings, count: e.count, total: e.total, updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : String(e.updatedAt || '') });

function listExams(payload, user) {
  const atts = getData_(EXT_SHEETS_.ATTEMPTS);
  const exams = getData_(EXT_SHEETS_.EXAMS).map(examFromRow_)
    .filter(e => e.status !== 'محذوف' && (isRole_(user, ROLE_.A) || e.teacherId === String(user.userId)))
    .map(e => {
      const a = atts.filter(r => String(r[1]) === e.id && (r[10] === 'مسلّم' || r[10] === 'مصحح'));
      const avg = a.length ? Math.round(a.reduce((s, r) => s + (Number(r[7]) ? Number(r[6]) / Number(r[7]) : 0), 0) / a.length * 100) : null;
      return Object.assign(examPublic_(e), { submitted: a.length, avgPct: avg });
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return successResponse({ exams: exams });
}

function getExam(payload, user) {
  const f = findExam_(payload.examId);
  if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود.');
  return successResponse({ exam: Object.assign(examPublic_(f.exam), { questions: f.exam.questions }) });
}

function saveExam(payload, user) {
  const x = payload.exam || {};
  const title = String(x.title || '').trim().slice(0, 150);
  if (!title) return errorResponse('اكتب عنوان الامتحان.');
  if (!x.cls || !x.subject) return errorResponse('اختر الصف والمادة.');
  const section = x.section || 'الكل';
  if (!teacherTeaches_(user, x.cls, section, x.subject)) return errorResponse('هذا الصف أو المادة غير مسند إليك.');
  const qs = Array.isArray(x.questions) ? x.questions : [];
  if (!qs.length) return errorResponse('أضف سؤالاً واحداً على الأقل.');
  if (qs.length > 100) return errorResponse('الحد الأقصى 100 سؤال.');
  const clean = [];
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i] || {};
    const opts = (Array.isArray(q.options) ? q.options : []).map(o => String(o || '').slice(0, 300));
    const mode = x.mode || 'online';
    if (opts.length < 2 || opts.length > 5) return errorResponse('السؤال ' + (i + 1) + ': من 2 إلى 5 اختيارات.');
    if (mode !== 'paper' && opts.some(o => !o.trim())) return errorResponse('السؤال ' + (i + 1) + ': اكتب نص كل اختيار.');
    const correct = Number(q.correct);
    if (!(correct >= 0 && correct < opts.length)) return errorResponse('السؤال ' + (i + 1) + ': حدد الإجابة الصحيحة.');
    clean.push({ text: String(q.text || '').slice(0, 1500), options: opts, correct: correct, marks: Math.max(0.5, Math.min(100, Number(q.marks) || 1)) });
  }
  const st = x.settings || {};
  const settings = {
    duration: Math.max(1, Math.min(300, Number(st.duration) || 30)),
    start: st.start || '', end: st.end || '',
    shuffle: !!st.shuffle, showResult: ['immediate', 'admin', 'after_close', 'never'].indexOf(st.showResult) > -1 ? st.showResult : 'admin',
    showAnswers: !!st.showAnswers
  };
  const total = clean.reduce((s, q) => s + q.marks, 0);
  const json = chunks_(JSON.stringify(clean));
  const now = new Date();
  const sh = sheetX_(EXT_SHEETS_.EXAMS);
  const mode = ['online', 'paper', 'both'].indexOf(x.mode) > -1 ? x.mode : 'online';
  if (x.id) {
    const f = findExam_(x.id);
    if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود.');
    settings.resultState = f.exam.settings.resultState || '';
    const lastCol = Math.max(sh.getLastColumn(), 15);
    const row = [f.exam.id, title, x.subject, x.cls, section, f.exam.teacherId, f.exam.teacherName, mode, f.exam.status === 'محذوف' ? 'مسودة' : f.exam.status,
      JSON.stringify(settings), f.exam.createdAt, now, clean.length, total].concat(json);
    while (row.length < lastCol) row.push('');
    sh.getRange(f.row, 1, 1, row.length).setValues([row]);
    // إعادة تصحيح الإجابات المسلّمة إن تغيّرت الإجابات الصحيحة
    regrade_(Object.assign({}, f.exam, { questions: clean }));
    return successResponse({ id: f.exam.id }, 'حُفظ الامتحان.');
  }
  const id = 'EX-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  sh.appendRow([id, title, x.subject, x.cls, section, user.userId, user.name, mode, 'مسودة', JSON.stringify(settings), now, now, clean.length, total].concat(json));
  return successResponse({ id: id }, 'أُنشئ الامتحان كمسودة. انشره عندما يكون جاهزاً.');
}

function regrade_(exam) {
  const sh = sheetX_(EXT_SHEETS_.ATTEMPTS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) !== exam.id || (data[i][10] !== 'مسلّم' && data[i][10] !== 'مصحح')) continue;
    let ans = []; try { ans = JSON.parse(data[i][5] || '[]'); } catch (e) {}
    const s = scoreAnswers_(exam, ans);
    if (Number(data[i][6]) !== s.score || Number(data[i][7]) !== s.total) sh.getRange(i + 1, 7, 1, 2).setValues([[s.score, s.total]]);
  }
}

function setExamStatus(payload, user) {
  const f = findExam_(payload.examId);
  if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود.');
  const st = payload.status;
  if (['مسودة', 'منشور', 'مغلق', 'محذوف'].indexOf(st) === -1) return errorResponse('حالة غير معروفة.');
  f.sheet.getRange(f.row, 9).setValue(st);
  f.sheet.getRange(f.row, 12).setValue(new Date());
  if (st === 'منشور' && f.exam.mode !== 'paper' && typeof notifyUsers_ === 'function') {
    try { notifyUsers_(examStudents_(f.exam).map(s => s.id), '📝 امتحان جديد: ' + f.exam.subject, f.exam.title, 'examsTab:' + f.exam.id); } catch (e) { Logger.log(e); }
  }
  if (st === 'مغلق' && f.exam.settings.showResult === 'after_close' && typeof notifyUsers_ === 'function') {
    try { notifyUsers_(attemptsFor_(f.exam.id).map(r => String(r[2])), 'نتيجة امتحان ' + f.exam.subject, 'ظهرت نتيجة «' + f.exam.title + '».', 'examsTab:' + f.exam.id); } catch (e) { Logger.log(e); }
  }
  return successResponse({}, { 'منشور': 'نُشر الامتحان للطلاب.', 'مغلق': 'أُغلق الامتحان.', 'مسودة': 'أُعيد إلى المسودات.', 'محذوف': 'حُذف الامتحان.' }[st]);
}

function getExamResults(payload, user) {
  const f = findExam_(payload.examId);
  if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود.');
  const exam = f.exam;
  const atts = attemptsFor_(exam.id);
  const byStudent = {};
  atts.forEach(r => { byStudent[String(r[2])] = r; });
  const qStats = exam.questions.map(() => ({ right: 0, answered: 0, picks: [0, 0, 0, 0, 0] }));
  const rows = examStudents_(exam).map(s => {
    const r = byStudent[s.id];
    if (!r) return { id: s.id, name: s.name, section: s.section, status: 'لم يمتحن' };
    let ans = []; try { ans = JSON.parse(r[5] || '[]'); } catch (e) {}
    if (r[10] === 'مسلّم' || r[10] === 'مصحح') ans.forEach((a, i) => { if (!qStats[i]) return; if (a >= 0) { qStats[i].answered++; qStats[i].picks[a] = (qStats[i].picks[a] || 0) + 1; } if (Number(a) === Number(exam.questions[i].correct)) qStats[i].right++; });
    return { id: s.id, name: s.name, section: s.section, status: r[10], source: r[4], score: Number(r[6]), total: Number(r[7]),
      submittedAt: r[9] instanceof Date ? r[9].toISOString() : String(r[9] || ''), answers: ans };
  });
  const done = rows.filter(r => r.total);
  const pcts = done.map(r => r.score / r.total * 100);
  return successResponse({
    exam: Object.assign(examPublic_(exam), { questions: exam.questions }),
    rows: rows,
    summary: { students: rows.length, submitted: done.length, avg: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
      max: pcts.length ? Math.round(Math.max.apply(null, pcts)) : null, min: pcts.length ? Math.round(Math.min.apply(null, pcts)) : null,
      passed: pcts.filter(p => p >= 50).length },
    questions: qStats.map((q, i) => ({ n: i + 1, right: q.right, answered: q.answered, picks: q.picks, pct: done.length ? Math.round(q.right / done.length * 100) : null }))
  });
}

function resetAttempt(payload, user) {
  const f = findExam_(payload.examId);
  if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود.');
  const sh = sheetX_(EXT_SHEETS_.ATTEMPTS);
  const data = sh.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === f.exam.id && String(data[i][2]) === String(payload.studentId)) sh.getRange(i + 1, 11).setValue('ملغى');
  }
  return successResponse({}, 'أُلغيت المحاولة، ويستطيع الطالب الامتحان من جديد.');
}

function transferExamToGrades(payload, user) {
  const f = findExam_(payload.examId);
  if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود.');
  const types = ['Term1_Month1', 'Term1_Month2', 'Term1_Month3', 'MidYear_Exam', 'Term2_Month1', 'Term2_Month2', 'Term2_Month3', 'Final_Exam'];
  if (types.indexOf(payload.gradeType) === -1) return errorResponse('اختر نوع الدرجة.');
  const outOf = Math.max(1, Math.min(100, Number(payload.outOf) || 100));
  const grades = attemptsFor_(f.exam.id).filter(r => (r[10] === 'مسلّم' || r[10] === 'مصحح') && Number(r[7]))
    .map(r => ({ studentId: String(r[2]), subject: f.exam.subject, grades: { [payload.gradeType]: Math.round(Number(r[6]) / Number(r[7]) * outOf) } }));
  if (!grades.length) return errorResponse('لا توجد نتائج لنقلها.');
  const res = submitGrades({ subject: f.exam.subject, grades: grades }, user);
  if (!res.success) return res;
  if (typeof afterAction_ === 'function') { try { afterAction_('submitGrades', { subject: f.exam.subject }, user); } catch (e) {} }
  return successResponse({}, 'أُرسلت ' + grades.length + ' درجة إلى الإدارة للمراجعة (إن كان الشهر مفتوحاً).');
}

// ---------------- الطالب ----------------
function examOpenNow_(exam) {
  const now = Date.now();
  if (exam.status !== 'منشور') return false;
  if (exam.settings.start && now < new Date(exam.settings.start).getTime()) return false;
  if (exam.settings.end && now > new Date(exam.settings.end).getTime()) return false;
  return true;
}
function studentInExam_(exam, user) {
  return normalizeArabicText_(user.studentClass) === normalizeArabicText_(exam.cls) &&
    (!exam.section || exam.section === 'الكل' || normalizeArabicText_(user.studentSection) === normalizeArabicText_(exam.section));
}
function resultVisible_(exam) {
  const s = exam.settings || {};
  if (s.resultState === 'published') return true;          // اعتمدتها الإدارة
  if (s.showResult === 'immediate') return true;
  return s.showResult === 'after_close' && exam.status === 'مغلق';
}

function getMyExams(payload, user) {
  const atts = getData_(EXT_SHEETS_.ATTEMPTS).filter(r => String(r[2]) === String(user.userId) && r[10] !== 'ملغى');
  const list = getData_(EXT_SHEETS_.EXAMS).map(examFromRow_)
    // الامتحان الورقي يبقى «مسودة» لكن يظهر للطالب بعد تصحيح ورقته
    .filter(e => e.status !== 'محذوف' && studentInExam_(e, user) && (e.status === 'منشور' || e.status === 'مغلق' || atts.some(r => String(r[1]) === e.id)))
    .map(e => {
      const a = atts.filter(r => String(r[1]) === e.id).pop();
      const done = a && (a[10] === 'مسلّم' || a[10] === 'مصحح');
      const show = done && resultVisible_(e);
      const item = Object.assign(examPublic_(e), {
        available: !done && e.mode !== 'paper' && examOpenNow_(e) && !user.viaParent,
        inProgress: !!(a && a[10] === 'جارٍ'),
        done: !!done, source: a ? a[4] : '',
        submittedAt: a && a[9] instanceof Date ? a[9].toISOString() : '',
        score: show ? Number(a[6]) : null, total: show ? Number(a[7]) : null,
        resultNote: done && !show ? (e.settings.showResult === 'never' ? 'النتيجة لا تُعرض' : e.settings.showResult === 'after_close' ? 'تظهر النتيجة بعد إغلاق الامتحان' : 'تظهر النتيجة بعد اعتمادها من الإدارة') : ''
      });
      if (show && e.settings.showAnswers) {
        let ans = []; try { ans = JSON.parse(a[5] || '[]'); } catch (x) {}
        item.review = e.questions.map((q, i) => ({ text: q.text, options: q.options, correct: q.correct, mine: ans[i] }));
      }
      return item;
    })
    .sort((a, b) => (b.available - a.available) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return successResponse({ exams: list });
}

function shuffledOrder_(n, seed) {
  const idx = Array.from({ length: n }, (_, i) => i);
  let s = 0; for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = n - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; const j = s % (i + 1); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  return idx;
}

function startExam(payload, user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const f = findExam_(payload.examId);
    if (!f || !studentInExam_(f.exam, user)) return errorResponse('الامتحان غير متاح لك.');
    const exam = f.exam;
    if (exam.mode === 'paper') return errorResponse('هذا امتحان ورقي.');
    if (!examOpenNow_(exam)) return errorResponse('الامتحان غير متاح الآن.');
    const sh = sheetX_(EXT_SHEETS_.ATTEMPTS);
    const data = sh.getDataRange().getValues();
    let idx = data.findIndex((r, k) => k > 0 && String(r[1]) === exam.id && String(r[2]) === String(user.userId) && r[10] !== 'ملغى');
    if (idx > 0 && data[idx][10] !== 'جارٍ') return errorResponse('سلّمت هذا الامتحان مسبقاً.');
    let started;
    if (idx > 0) started = new Date(data[idx][8]);
    else {
      started = new Date();
      sh.appendRow(['AT-' + Utilities.getUuid().slice(0, 10), exam.id, user.userId, user.name, 'إلكتروني', '[]', '', '', started, '', 'جارٍ', '']);
    }
    let remaining = exam.settings.duration * 60 - Math.floor((Date.now() - started.getTime()) / 1000);
    if (exam.settings.end) remaining = Math.min(remaining, Math.floor((new Date(exam.settings.end).getTime() - Date.now()) / 1000));
    if (remaining <= 0) return errorResponse('انتهى وقت الامتحان.');
    const order = exam.settings.shuffle ? shuffledOrder_(exam.questions.length, exam.id + user.userId) : exam.questions.map((_, i) => i);
    let saved = [];
    if (idx > 0) { try { saved = JSON.parse(data[idx][5] || '[]'); } catch (e) {} }
    return successResponse({
      exam: { id: exam.id, title: exam.title, subject: exam.subject, total: exam.total, duration: exam.settings.duration },
      // بدون الإجابات الصحيحة
      questions: order.map(i => ({ i: i, text: exam.questions[i].text, options: exam.questions[i].options, marks: exam.questions[i].marks })),
      remaining: remaining, saved: saved
    });
  } finally { lock.releaseLock(); }
}

function submitExam(payload, user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const f = findExam_(payload.examId);
    if (!f) return errorResponse('الامتحان غير موجود.');
    const exam = f.exam;
    const sh = sheetX_(EXT_SHEETS_.ATTEMPTS);
    const data = sh.getDataRange().getValues();
    const idx = data.findIndex((r, k) => k > 0 && String(r[1]) === exam.id && String(r[2]) === String(user.userId) && r[10] === 'جارٍ');
    if (idx < 1) return errorResponse('لا توجد محاولة مفتوحة لهذا الامتحان.');
    const answers = exam.questions.map((q, i) => { const a = Number((payload.answers || {})[i]); return a >= 0 && a < q.options.length ? a : -1; });
    const started = new Date(data[idx][8]).getTime();
    const late = Date.now() > started + (exam.settings.duration * 60 + 90) * 1000;
    if (payload.draft && !late) {   // حفظ تلقائي أثناء الامتحان
      sh.getRange(idx + 1, 6).setValue(JSON.stringify(answers));
      return successResponse({ saved: true });
    }
    const s = scoreAnswers_(exam, answers);
    sh.getRange(idx + 1, 6, 1, 6).setValues([[JSON.stringify(answers), s.score, s.total, data[idx][8], new Date(), 'مسلّم']]);
    if (late) sh.getRange(idx + 1, 12).setValue('سُلّم بعد انتهاء الوقت');
    const show = resultVisible_(exam);
    return successResponse({ score: show ? s.score : null, total: show ? s.total : null }, show ? 'سُلّم الامتحان. درجتك ' + s.score + ' من ' + s.total + '.' : 'سُلّم الامتحان بنجاح.');
  } finally { lock.releaseLock(); }
}

// ==========================================================
//                 الامتحان الورقي (الطباعة والتصحيح)
// ==========================================================
function getExamForPrint(payload, user) {
  const f = findExam_(payload.examId);
  if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود.');
  if (f.exam.mode === 'online') return errorResponse('هذا امتحان إلكتروني فقط. غيّر نوعه إلى «ورقي» أو «الاثنين».');
  if (f.exam.questions.some(q => q.options.length > 4)) return errorResponse('ورقة التصحيح تدعم 4 اختيارات كحد أقصى لكل سؤال.');
  if (f.exam.questions.length > 60) return errorResponse('ورقة التصحيح تدعم 60 سؤالاً كحد أقصى.');
  const done = {};
  attemptsFor_(f.exam.id).forEach(r => { if (r[10] === 'مصحح' || r[10] === 'مسلّم') done[String(r[2])] = { score: Number(r[6]), total: Number(r[7]) }; });
  return successResponse({
    exam: Object.assign(examPublic_(f.exam), { questions: f.exam.questions.map(q => ({ text: q.text, options: q.options, correct: q.correct, marks: q.marks })) }),
    students: examStudents_(f.exam).map(s => Object.assign(s, { result: done[s.id] || null }))
  });
}

function savePaperResult(payload, user) {
  const f = findExam_(payload.examId);
  if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود أو ليس من امتحاناتك.');
  const exam = f.exam;
  const st = getData_(SHEETS.USERS).find(r => String(r[0]) === String(payload.studentId));
  if (!st || !studentInExam_(exam, { studentClass: st[6], studentSection: st[7] })) return errorResponse('الطالب ليس من صف هذا الامتحان.');
  const raw = Array.isArray(payload.answers) ? payload.answers : [];
  // -1 = بدون إجابة، -2 = أكثر من اختيار (تُحسب خطأ)
  const answers = exam.questions.map((q, i) => { const a = Number(raw[i]); return a >= 0 && a < q.options.length ? a : (a === -2 ? -2 : -1); });
  const s = scoreAnswers_(exam, answers);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = sheetX_(EXT_SHEETS_.ATTEMPTS);
    const data = sh.getDataRange().getValues();
    const idx = data.findIndex((r, k) => k > 0 && String(r[1]) === exam.id && String(r[2]) === String(st[0]) && r[10] !== 'ملغى');
    const row = [idx > 0 ? data[idx][0] : 'AT-' + Utilities.getUuid().slice(0, 10), exam.id, st[0], st[4], 'ورقي', JSON.stringify(answers), s.score, s.total,
      idx > 0 ? data[idx][8] : new Date(), new Date(), 'مصحح', user.name];
    if (idx > 0) sh.getRange(idx + 1, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  } finally { lock.releaseLock(); }
  return successResponse({ studentId: st[0], studentName: st[4], score: s.score, total: s.total,
    blanks: answers.filter(a => a === -1).length, multi: answers.filter(a => a === -2).length }, 'حُفظت درجة ' + st[4] + ': ' + s.score + ' من ' + s.total);
}

// ==========================================================
//                        المحادثة
// ==========================================================
function chatContacts_(user) {
  const users = getData_(SHEETS.USERS).filter(r => normalizeArabicText_(r[5]) === 'نشط' && String(r[0]) !== String(user.userId));
  const asg = getData_(SHEETS.TEACHER_ASSIGNMENTS);
  const headers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS).getRange(1, 1, 1, Math.max(1, SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS).getLastColumn())).getValues()[0];
  const chIdx = headers.indexOf('Children');
  const chatIdx = headers.indexOf('CanChat');
  const role = r => normalizeArabicText_(r[3]);
  const R = { S: normalizeArabicText_(ROLE_.S), T: normalizeArabicText_(ROLE_.T), A: normalizeArabicText_(ROLE_.A), P: normalizeArabicText_(ROLE_.P) };
  const teacherCovers = (tid, cls, sec) => asg.some(a => String(a[0]) === String(tid) && a[2] === cls && (a[3] === sec || a[3] === 'الكل' || !a[3]));
  const teacherCanChat = r => chatIdx > -1 && r[chatIdx] === 'نعم';
  const me = normalizeArabicText_(user.role);
  let list;
  if (me === R.A) list = users;
  else if (me === R.T) {
    const myStudents = users.filter(r => role(r) === R.S && teacherCovers(user.userId, r[6], r[7]));
    const ids = myStudents.map(r => String(r[0]));
    list = users.filter(r => role(r) === R.A || (role(r) === R.T && teacherCanChat(r)) || ids.indexOf(String(r[0])) > -1 ||
      (role(r) === R.P && chIdx > -1 && String(r[chIdx] || '').split(/[,،\s]+/).some(c => ids.indexOf(c) > -1)));
  } else if (me === R.S) {
    list = users.filter(r => role(r) === R.A || (role(r) === R.T && teacherCanChat(r) && teacherCovers(r[0], user.studentClass, user.studentSection)));
  } else if (me === R.P) {
    const kids = users.concat([]).filter(r => user.children.indexOf(String(r[0])) > -1);
    list = users.filter(r => role(r) === R.A || (role(r) === R.T && teacherCanChat(r) && kids.some(k => teacherCovers(r[0], k[6], k[7]))));
  } else list = [];
  return list.map(r => ({ id: String(r[0]), name: r[4], role: r[3], cls: role(r) === R.S ? (r[6] + ' ' + (r[7] || '')).trim() : '' }));
}
function getChatContacts(user) {
  return successResponse({ contacts: chatContacts_(user).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar')) });
}
function getChatThreads(user) {
  const me = String(user.userId);
  const users = getUsersMap_();
  const t = {};
  getData_(EXT_SHEETS_.CHAT).forEach(r => {
    const from = String(r[1]), to = String(r[2]);
    if (from !== me && to !== me) return;
    const other = from === me ? to : from;
    const x = t[other] || (t[other] = { id: other, name: (users.get(other) || {}).name || other, role: (users.get(other) || {}).role || '', unread: 0, last: '', at: '' });
    x.last = String(r[3]).slice(0, 80); x.at = r[4] instanceof Date ? r[4].toISOString() : String(r[4]); x.mine = from === me;
    if (to === me && !r[5]) x.unread++;
  });
  return successResponse({ threads: Object.keys(t).map(k => t[k]).sort((a, b) => String(b.at).localeCompare(String(a.at))) });
}
function getChatMessages(payload, user) {
  const me = String(user.userId), other = String(payload.partnerId || '');
  const sh = sheetX_(EXT_SHEETS_.CHAT);
  const data = sh.getDataRange().getValues();
  const msgs = [];
  const now = new Date();
  for (let i = 1; i < data.length; i++) {
    const r = data[i], from = String(r[1]), to = String(r[2]);
    if (!((from === me && to === other) || (from === other && to === me))) continue;
    if (to === me && !r[5]) sh.getRange(i + 1, 6).setValue(now);
    msgs.push({ id: r[0], mine: from === me, body: r[3], at: r[4] instanceof Date ? r[4].toISOString() : String(r[4]), read: !!r[5] || to === me });
  }
  return successResponse({ messages: msgs.slice(-200) });
}
function sendChatMessage(payload, user) {
  const body = String(payload.body || '').trim().slice(0, 1000);
  if (!body) return errorResponse('اكتب الرسالة.');
  const other = String(payload.partnerId || '');
  const allowed = chatContacts_(user).some(c => c.id === other);
  if (!allowed) return errorResponse('لا يمكنك مراسلة هذا الشخص.');
  const isStudentSide = isRole_(user, ROLE_.S) || isRole_(user, ROLE_.P);
  if (isStudentSide && !featuresOn_().Feature_StudentStartChat) {
    const started = getData_(EXT_SHEETS_.CHAT).some(r => String(r[1]) === other && String(r[2]) === String(user.userId));
    if (!started) return errorResponse('يمكنك الرد فقط عندما يراسلك المدرس أولاً.');
  }
  const cache = CacheService.getScriptCache();
  const k = 'chat_rate_' + user.userId;
  const n = Number(cache.get(k) || 0);
  if (n >= 20) return errorResponse('أرسلت رسائل كثيرة خلال دقيقة. انتظر قليلاً.');
  cache.put(k, String(n + 1), 60);
  sheetX_(EXT_SHEETS_.CHAT).appendRow(['M-' + Utilities.getUuid().slice(0, 12), user.userId, other, body, new Date(), '']);
  if (typeof notifyUsers_ === 'function') { try { notifyUsers_([other], '💬 ' + user.name, body.slice(0, 140), 'chatTab:' + user.userId, true); } catch (e) { Logger.log(e); } }
  return successResponse({}, 'أُرسلت.');
}
// الإدارة تراجع أي محادثة (حماية للطلاب)
function adminChatReview(payload) {
  const a = String(payload.userA || ''), b = String(payload.userB || '');
  const users = getUsersMap_();
  if (!b) {
    const partners = {};
    getData_(EXT_SHEETS_.CHAT).forEach(r => { const f = String(r[1]), t = String(r[2]); if (f === a) partners[t] = 1; if (t === a) partners[f] = 1; });
    return successResponse({ partners: Object.keys(partners).map(id => ({ id: id, name: (users.get(id) || {}).name || id })) });
  }
  const msgs = getData_(EXT_SHEETS_.CHAT).filter(r => (String(r[1]) === a && String(r[2]) === b) || (String(r[1]) === b && String(r[2]) === a))
    .map(r => ({ from: (users.get(String(r[1])) || {}).name || r[1], fromId: String(r[1]), body: r[3], at: r[4] instanceof Date ? r[4].toISOString() : String(r[4]) }));
  return successResponse({ messages: msgs.slice(-300) });
}

// ==========================================================
//                     السجل الدراسي
// ==========================================================
function getRecordStudents(user) {
  const asg = getData_(SHEETS.TEACHER_ASSIGNMENTS).filter(a => String(a[0]) === String(user.userId));
  const isA = isRole_(user, ROLE_.A);
  const list = getData_(SHEETS.USERS).filter(r => normalizeArabicText_(r[3]) === 'طالب' &&
    (isA || asg.some(a => a[2] === r[6] && (a[3] === r[7] || a[3] === 'الكل' || !a[3]))))
    .map(r => ({ id: String(r[0]), name: r[4], cls: r[6], section: r[7], status: r[5] }))
    .sort((a, b) => String(a.cls).localeCompare(String(b.cls), 'ar') || String(a.name).localeCompare(String(b.name), 'ar'));
  return successResponse({ students: list });
}
function getStudentRecord(payload, user) {
  const id = String(payload.studentId || '');
  const ok = getRecordStudents(user).students.some(s => s.id === id);
  if (!ok) return errorResponse('لا تملك صلاحية عرض سجل هذا الطالب.');
  const u = getData_(SHEETS.USERS).find(r => String(r[0]) === id);
  const yearOf = name => (String(name).match(/\d{4}_\d{4}/) || [''])[0].replace('_', '–');
  const grades = [];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEETS.GRADES, SHEETS.GRADES_ARCHIVE].forEach(name => {
    getData_(name).filter(r => String(r[1]) === id && (r[14] === 'منشور' || r[14] === 'موافق عليه' || name === SHEETS.GRADES_ARCHIVE))
      .forEach(r => grades.push({ year: name === SHEETS.GRADES ? (yearOf(name) || 'الحالية') : 'أرشيف', subject: r[2], type: r[3], grade: r[4] }));
  });
  const abs = getData_(SHEETS.ABSENCES).filter(r => String(r[1]) === id && r[5] !== 'مرفوض').map(r => ({ iso: isoDate_(r[2]), notes: r[3], status: r[5] }));
  const evals = getData_(SHEETS.DAILY_EVALUATIONS).filter(r => String(r[1]) === id && r[10] === 'منشور');
  const evSum = {};
  evals.forEach(r => {
    const s = evSum[r[4]] || (evSum[r[4]] = { subject: r[4], count: 0, good: 0, mid: 0, weak: 0 });
    s.count++; [5, 6, 7, 8].forEach(c => { if (r[c] === 'جيد') s.good++; else if (r[c] === 'متوسط') s.mid++; else if (r[c] === 'ضعيف') s.weak++; });
  });
  const exams = {};
  getData_(EXT_SHEETS_.EXAMS).forEach(r => { exams[String(r[0])] = { title: r[1], subject: r[2] }; });
  const att = getData_(EXT_SHEETS_.ATTEMPTS).filter(r => String(r[2]) === id && (r[10] === 'مسلّم' || r[10] === 'مصحح'))
    .map(r => ({ title: (exams[String(r[1])] || {}).title || r[1], subject: (exams[String(r[1])] || {}).subject || '', score: Number(r[6]), total: Number(r[7]), source: r[4], iso: isoDate_(r[9]) }));
  const obj = getData_(SHEETS.OBJECTIONS).filter(r => String(r[2]) === id).map(r => ({ iso: isoDate_(r[1]), subject: r[3], status: r[5], reply: r[8] }));
  return successResponse({
    student: { id: id, name: u[4], email: u[1], cls: u[6], section: u[7], status: u[5], guardian: u[8], guardianPhone: u[9], studentPhone: u[10],
      motherName: u[14] || '', address: u[15] || '', dob: u[16] ? isoDate_(u[16]) : '', bloodType: u[17] || '', medical: isRole_(user, ROLE_.A) ? (u[18] || '') : '' },
    grades: grades, absences: abs, evaluations: Object.keys(evSum).map(k => evSum[k]), exams: att, objections: obj
  });
}

// ==========================================================
//                       الإحصائيات
// ==========================================================
function getAdminStats() {
  const users = getData_(SHEETS.USERS);
  const active = users.filter(r => normalizeArabicText_(r[5]) === 'نشط');
  const roleCount = {};
  active.forEach(r => { roleCount[r[3]] = (roleCount[r[3]] || 0) + 1; });
  const students = active.filter(r => normalizeArabicText_(r[3]) === 'طالب');
  const clsOf = {};
  students.forEach(r => { clsOf[String(r[0])] = r[6] + (r[7] ? ' / ' + r[7] : ''); });
  const classes = {};
  students.forEach(r => { const k = clsOf[String(r[0])]; classes[k] = classes[k] || { name: k, students: 0, absences30: 0, gradeSum: 0, gradeN: 0, examSum: 0, examN: 0 }; classes[k].students++; });
  const since = Date.now() - 30 * 864e5;
  getData_(SHEETS.ABSENCES).forEach(r => { const k = clsOf[String(r[1])]; if (k && r[5] !== 'مرفوض' && new Date(r[2]).getTime() >= since) classes[k].absences30++; });
  const subj = {};
  getData_(SHEETS.GRADES).forEach(r => {
    const k = clsOf[String(r[1])]; const g = Number(r[4]);
    if (!k || isNaN(g) || r[14] !== 'منشور') return;
    classes[k].gradeSum += g; classes[k].gradeN++;
    const s = subj[r[2]] || (subj[r[2]] = { subject: r[2], sum: 0, n: 0, fail: 0 }); s.sum += g; s.n++; if (g < 50) s.fail++;
  });
  getData_(EXT_SHEETS_.ATTEMPTS).forEach(r => { const k = clsOf[String(r[2])]; if (k && Number(r[7]) && (r[10] === 'مسلّم' || r[10] === 'مصحح')) { classes[k].examSum += Number(r[6]) / Number(r[7]) * 100; classes[k].examN++; } });
  const pending = getAdminAnalytics().analytics.pendingApprovals;
  const week = Date.now() - 7 * 864e5;
  const teachers = {};
  active.filter(r => normalizeArabicText_(r[3]) === 'مدرس').forEach(r => { teachers[r[4]] = { name: r[4], grades: 0, absences: 0, evals: 0, homework: 0 }; });
  getData_(SHEETS.GRADES).forEach(r => { if (teachers[r[16]] && new Date(r[12]).getTime() >= week) teachers[r[16]].grades++; });
  getData_(SHEETS.ABSENCES).forEach(r => { if (teachers[r[4]] && new Date(r[2]).getTime() >= week) teachers[r[4]].absences++; });
  getData_(SHEETS.DAILY_EVALUATIONS).forEach(r => { if (teachers[r[11]] && new Date(r[3]).getTime() >= week) teachers[r[11]].evals++; });
  getData_(SHEETS.HOMEWORK).forEach(r => { if (teachers[r[7]] && new Date(r[1]).getTime() >= week) teachers[r[7]].homework++; });
  return successResponse({
    roles: roleCount, pending: pending,
    classes: Object.keys(classes).map(k => { const c = classes[k]; return { name: c.name, students: c.students, absences30: c.absences30,
      absencePerStudent: c.students ? Math.round(c.absences30 / c.students * 10) / 10 : 0,
      gradeAvg: c.gradeN ? Math.round(c.gradeSum / c.gradeN) : null, examAvg: c.examN ? Math.round(c.examSum / c.examN) : null }; })
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar')),
    subjects: Object.keys(subj).map(k => ({ subject: k, avg: Math.round(subj[k].sum / subj[k].n), failPct: Math.round(subj[k].fail / subj[k].n * 100), n: subj[k].n }))
      .sort((a, b) => a.avg - b.avg),
    teachers: Object.keys(teachers).map(k => teachers[k]).sort((a, b) => (a.grades + a.absences + a.evals + a.homework) - (b.grades + b.absences + b.evals + b.homework))
  });
}

// ==========================================================
//                     إضافة مستخدم
// ==========================================================
function createUser(payload) {
  const role = String(payload.role || '');
  const prefix = { 'طالب': 'S', 'مدرس': 'T', 'إداري': 'A', 'ولي أمر': 'P' }[role];
  if (!prefix) return errorResponse('اختر الدور.');
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const pass = String(payload.password || '');
  if (name.split(/\s+/).length < 2) return errorResponse('اكتب الاسم الكامل.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse('البريد الإلكتروني غير صحيح.');
  if (pass.length < 6) return errorResponse('كلمة المرور 6 أحرف على الأقل.');
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  if (data.some((r, i) => i > 0 && String(r[1]).toLowerCase() === email)) return errorResponse('هذا البريد مستخدم لحساب آخر.');
  if (role === 'طالب' && !payload.cls) return errorResponse('اختر صف الطالب.');
  let max = 0;
  data.forEach(r => { const m = String(r[0]).match(new RegExp('^' + prefix + '-(\\d+)$')); if (m) max = Math.max(max, +m[1]); });
  const id = prefix + '-' + String(max + 1).padStart(3, '0');
  const row = new Array(headers.length).fill('');
  const set = (h, v) => { const i = headers.indexOf(h); if (i > -1) row[i] = v; };
  row[0] = id; row[1] = email; row[2] = sha256Hex_(pass); row[3] = role; row[4] = name; row[5] = 'نشط';
  row[6] = role === 'طالب' ? payload.cls : ''; row[7] = role === 'طالب' ? (payload.section || '') : '';
  row[8] = payload.guardianName || ''; row[9] = payload.guardianPhone || ''; row[10] = payload.studentPhone || '';
  set('CanRecordAbsence', 'لا');
  if (role === 'ولي أمر') {
    const kids = String(payload.children || '').split(/[,،\s]+/).filter(Boolean);
    const valid = kids.filter(k => data.some(r => String(r[0]) === k && normalizeArabicText_(r[3]) === 'طالب'));
    if (!valid.length) return errorResponse('اكتب رقم ابن واحد على الأقل (مثال: S-001).');
    set('Children', valid.join(','));
  }
  sh.appendRow(row);
  return successResponse({ id: id }, 'أُضيف الحساب ' + id + ' بنجاح.');
}

// صلاحيات إضافية في تبويب المستخدمين
function updateUserPermissionExt_(payload) {
  const header = TEACHER_PERMS_[payload.permission];
  if (!header) return errorResponse('صلاحية غير معروفة.');
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sh.getDataRange().getValues();
  let col = data[0].indexOf(header);
  if (col === -1) { col = data[0].length; sh.getRange(1, col + 1).setValue(header); }
  const r = data.findIndex((x, i) => i > 0 && String(x[0]) === String(payload.userId));
  if (r < 1) return errorResponse('لم يتم العثور على المستخدم.');
  sh.getRange(r + 1, col + 1).setValue(payload.value ? 'نعم' : 'لا');
  CacheService.getScriptCache().remove('u_' + payload.userId);
  return successResponse({}, 'تم تحديث الصلاحية.');
}
function getTeachersPermissions_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sh.getDataRange().getValues();
  const h = data[0];
  const teachers = data.slice(1).filter(r => normalizeArabicText_(r[3]) === 'مدرس').map(r => {
    const p = {}; Object.keys(TEACHER_PERMS_).forEach(k => { const i = h.indexOf(TEACHER_PERMS_[k]); p[k] = i > -1 && r[i] === 'نعم'; });
    return { id: String(r[0]), name: r[4], status: r[5], perms: p };
  });
  return successResponse({ teachers: teachers, features: featuresOn_(), featureNames: FEATURES_ });
}


// ==========================================================
//   اعتماد نتائج الامتحانات: المدرس يرسل ← الإدارة تعتمد ← تظهر للطلاب
// ==========================================================
function setExamSetting_(f, key, value) {
  const s = Object.assign({}, f.exam.settings, typeof key === 'object' ? key : { [key]: value });
  f.sheet.getRange(f.row, 10).setValue(JSON.stringify(s));
  f.sheet.getRange(f.row, 12).setValue(new Date());
  f.exam.settings = s;
}
const GRADE_TYPES_ = { Term1_Month1: 'الفصل الأول — الشهر الأول', Term1_Month2: 'الفصل الأول — الشهر الثاني', Term1_Month3: 'الفصل الأول — الشهر الثالث', MidYear_Exam: 'نصف السنة',
  Term2_Month1: 'الفصل الثاني — الشهر الأول', Term2_Month2: 'الفصل الثاني — الشهر الثاني', Term2_Month3: 'الفصل الثاني — الشهر الثالث', Final_Exam: 'النهائي' };

/** نوع الإرسال: تقييم يومي (الافتراضي) أو درجة شهرية */
function readSendAs_(payload) {
  const kind = payload.kind === 'monthly' ? 'monthly' : 'daily';
  if (kind === 'daily') {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(payload.date || '')) ? payload.date : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    return { kind: 'daily', date: d };
  }
  if (!GRADE_TYPES_[payload.gradeType]) return { error: 'اختر الشهر الذي تُسجَّل فيه الدرجة.' };
  return { kind: 'monthly', gradeType: payload.gradeType, outOf: Math.max(1, Math.min(100, Number(payload.outOf) || 100)) };
}

function evalLevel_(pct) { return pct >= 75 ? 'جيد' : pct >= 50 ? 'متوسط' : 'ضعيف'; }

/** عند الاعتماد: تُكتب النتائج تقييماً يومياً أو درجة شهرية، وتُنشر للطلاب (مع تيليجرام إن وُجد) */
function applyExamResults_(f, sendAs) {
  const ex = f.exam;
  const rows = attemptsFor_(ex.id).filter(r => (r[10] === 'مسلّم' || r[10] === 'مصحح') && Number(r[7]));
  if (!rows.length) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ids = [];
  const now = new Date();
  if (sendAs.kind === 'monthly') {
    const sh = ss.getSheetByName(SHEETS.GRADES);
    const data = sh.getDataRange().getValues();
    const add = [];
    rows.forEach(r => {
      const sid = String(r[2]);
      const val = Math.round(Number(r[6]) / Number(r[7]) * sendAs.outOf);
      const i = data.findIndex((g, k) => k > 0 && String(g[1]) === sid && g[2] === ex.subject && g[3] === sendAs.gradeType);
      if (i > 0) {
        const old = data[i][4];
        sh.getRange(i + 1, 5).setValue(val);
        sh.getRange(i + 1, 13, 1, 6).setValues([[now, ex.teacherId, 'بانتظار الموافقة', JSON.stringify({ old: old, new: val, exam: ex.id }), ex.teacherName, '']]);
        ids.push(data[i][0]);
      } else {
        const id = 'GRD-' + Utilities.getUuid();
        add.push([id, sid, ex.subject, sendAs.gradeType, val, '', '', '', '', '', '', '', now, ex.teacherId, 'بانتظار الموافقة', JSON.stringify({ old: '', new: val, exam: ex.id }), ex.teacherName, '']);
        ids.push(id);
      }
    });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
    handleApproval({ itemIds: ids, action: 'publish', sendTelegram: true, sheetName: SHEETS.GRADES }, {});
  } else {
    const sh = ss.getSheetByName(SHEETS.DAILY_EVALUATIONS);
    const data = sh.getDataRange().getValues();
    const tag = 'امتحان «' + ex.title + '»';
    const add = [];
    rows.forEach(r => {
      const sid = String(r[2]);
      const score = Number(r[6]), total = Number(r[7]);
      const note = tag + ': ' + score + ' من ' + total;
      const level = evalLevel_(score / total * 100);
      // إعادة الاعتماد لا تكرر التقييم: يُحدَّث السطر السابق لنفس الامتحان
      const i = data.findIndex((e, k) => k > 0 && String(e[1]) === sid && String(e[9]).indexOf(tag + ':') === 0);
      if (i > 0) {
        sh.getRange(i + 1, 4, 1, 8).setValues([[new Date(sendAs.date), ex.subject, level, data[i][6], data[i][7], data[i][8], note, 'بانتظار الموافقة']]);
        ids.push(data[i][0]);
      } else {
        const id = 'EV-' + now.getTime() + '-' + sid;
        add.push([id, sid, ex.teacherId, new Date(sendAs.date), ex.subject, level, '', '', '', note, 'بانتظار الموافقة', ex.teacherName, '']);
        ids.push(id);
      }
    });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
    handleApproval({ itemIds: ids, action: 'publish', sendTelegram: true, sheetName: SHEETS.DAILY_EVALUATIONS }, {});
  }
  return ids.length;
}

function submitExamResults(payload, user) {
  const fs = featuresOn_();
  if (!fs.Feature_Exams && !fs.Feature_PaperExams) return errorResponse('ميزة الامتحانات غير مفعّلة من الإدارة.');
  if (isRole_(user, ROLE_.T) && !user.perms.canCreateExams && !user.perms.canScanPaper) return errorResponse('هذه الصلاحية غير مفعّلة لحسابك. راجع الإدارة.');
  const f = findExam_(payload.examId);
  if (!f || !ownsExam_(f.exam, user)) return errorResponse('الامتحان غير موجود.');
  const sendAs = readSendAs_(payload);
  if (sendAs.error) return errorResponse(sendAs.error);
  if (sendAs.kind === 'monthly') {
    const st = getSystemSettings().settings[sendAs.gradeType + '_Status'];
    if (st && st.value === 'مغلق' && !isRole_(user, ROLE_.A)) return errorResponse('«' + GRADE_TYPES_[sendAs.gradeType] + '» مغلق حالياً. اختر شهراً مفتوحاً أو أرسلها تقييماً يومياً.');
  }
  const done = attemptsFor_(f.exam.id).filter(r => r[10] === 'مسلّم' || r[10] === 'مصحح').length;
  if (!done) return errorResponse('لا توجد نتائج لإرسالها بعد.');
  if (isRole_(user, ROLE_.A)) {
    setExamSetting_(f, { sendAs: sendAs });
    applyExamResults_(f, sendAs);
    setExamSetting_(f, { resultState: 'published' });
    notifyExamPublished_(f.exam);
    return successResponse({}, 'نُشرت النتائج للطلاب ' + (sendAs.kind === 'daily' ? 'كتقييم يومي.' : 'كدرجة ' + GRADE_TYPES_[sendAs.gradeType] + '.'));
  }
  setExamSetting_(f, { resultState: 'pending', sendAs: sendAs });
  if (typeof notifyUsers_ === 'function') {
    try { notifyUsers_(usersByRole_('إداري'), 'نتائج امتحان بانتظار الاعتماد', user.name + ': ' + f.exam.title + ' — ' + f.exam.subject + ' (' + done + ' طالب، ' + (sendAs.kind === 'daily' ? 'تقييم يومي' : 'درجة شهرية') + ')', 'pendingTab'); } catch (e) { Logger.log(e); }
  }
  return successResponse({}, 'أُرسلت نتائج ' + done + ' طالب إلى الإدارة ' + (sendAs.kind === 'daily' ? 'كتقييم يومي' : 'كدرجة ' + GRADE_TYPES_[sendAs.gradeType]) + '. تظهر للطلاب بعد الاعتماد.');
}
function getPendingExamResults() {
  const atts = getData_(EXT_SHEETS_.ATTEMPTS);
  const items = getData_(EXT_SHEETS_.EXAMS).map(examFromRow_).filter(e => e.status !== 'محذوف' && e.settings.resultState === 'pending').map(e => {
    const a = atts.filter(r => String(r[1]) === e.id && (r[10] === 'مسلّم' || r[10] === 'مصحح') && Number(r[7]));
    const pcts = a.map(r => Number(r[6]) / Number(r[7]) * 100);
    return Object.assign(examPublic_(e), { submitted: a.length, avg: pcts.length ? Math.round(pcts.reduce((x, y) => x + y, 0) / pcts.length) : null,
      passed: pcts.filter(p => p >= 50).length });
  });
  return successResponse({ items: items });
}
function notifyExamPublished_(exam) {
  if (typeof notifyUsers_ !== 'function') return;
  try { notifyUsers_(attemptsFor_(exam.id).filter(r => r[10] === 'مسلّم' || r[10] === 'مصحح').map(r => String(r[2])), 'نتيجة امتحان ' + exam.subject, 'ظهرت نتيجتك في «' + exam.title + '».', 'examsTab:' + exam.id); } catch (e) { Logger.log(e); }
}
function handleExamResults(payload, user) {
  const f = findExam_(payload.examId);
  if (!f) return errorResponse('الامتحان غير موجود.');
  if (payload.action === 'approve') {
    applyExamResults_(f, f.exam.settings.sendAs || { kind: 'daily', date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') });
    setExamSetting_(f, 'resultState', 'published');
    notifyExamPublished_(f.exam);
    return successResponse({}, 'اعتُمدت النتائج ونُشرت للطلاب.');
  }
  if (payload.action === 'reject') {
    setExamSetting_(f, 'resultState', '');
    if (typeof notifyUsers_ === 'function') { try { notifyUsers_([f.exam.teacherId], 'أُعيدت نتائج امتحان', '«' + f.exam.title + '»' + (payload.note ? ': ' + String(payload.note).slice(0, 200) : ''), 'examsTab:' + f.exam.id); } catch (e) {} }
    return successResponse({}, 'أُعيدت النتائج إلى المدرس.');
  }
  return errorResponse('إجراء غير معروف.');
}
