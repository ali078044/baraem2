/* الوحدات الجديدة: الامتحانات (إلكتروني وورقي بالكاميرا)، المحادثة، وليّ الأمر، السجل الدراسي، الإحصائيات، الصلاحيات.
   كل وحدة لا تظهر إلا إذا فعّلها المدير ومنح الصلاحية، والخادم يتحقق مرة أخرى في كل طلب. */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const store = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const me = store.get('userData') || {};
  const body = document.body;
  const PAGE = body.classList.contains('teacher-page') ? 'teacher' : body.classList.contains('admin-page') ? 'admin' : body.classList.contains('student-page') ? 'student' : '';
  if (!PAGE) return;
  const isParent = me.role === 'ولي أمر';
  const LOC = 'ar-IQ-u-nu-latn';
  const fmtDate = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(LOC, { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' }); };
  const say = (m, bad) => (window.toast ? toast(m, bad) : alert(m));
  async function api(action, payload) { return callApi(action, payload || {}); }

  /* ---------------- وليّ الأمر: يقرأ باسم ابنه ---------------- */
  const PROXY = ['getStudentDashboard', 'getStudentObjections', 'getMyExams', 'submitObjection'];
  if (isParent && typeof window.callApi === 'function') {
    const orig = window.callApi;
    window.callApi = function (action, payload) {
      payload = payload || {};
      if (action === 'trackItemView') return Promise.resolve({ success: true });   // المشاهدة تُحسب للطالب نفسه فقط
      if (PROXY.indexOf(action) > -1) {
        const child = store.get('parentChild');
        // أول دخول: ننتظر معرفة الأبناء ثم تُعاد تهيئة الصفحة تلقائياً
        if (!child) return Promise.resolve({ success: false, message: '', quiet: true });
        payload = Object.assign({ childId: child }, payload);
      }
      return orig(action, payload);
    };
  }
  // المكتبة: إضافة التصنيف لطلب المدرس
  if (typeof window.callApi === 'function') {
    const orig2 = window.callApi;
    window.callApi = function (action, payload) {
      if (action === 'addLibraryLink') { const c = $('#libCategory'); payload = Object.assign({}, payload, { category: c ? c.value : 'رابط' }); }
      return orig2(action, payload);
    };
  }

  /* ---------------- إضافة التبويبات (مخفية حتى نعرف الصلاحيات) ---------------- */
  const TABS = {
    teacher: [['examsTab', 'fa-file-signature', 'الامتحانات', f => f.exams || f.paper], ['chatTab', 'fa-comments', 'المحادثات', f => f.chat], ['recordTab', 'fa-id-card', 'السجل الدراسي', f => f.record]],
    admin: [['examsTab', 'fa-file-signature', 'الامتحانات', f => f.exams || f.paper], ['chatTab', 'fa-comments', 'المحادثات', f => f.chat], ['recordTab', 'fa-id-card', 'السجل الدراسي', f => f.record],
      ['statsTab', 'fa-chart-pie', 'الإحصائيات', f => f.stats], ['libraryAdminTab', 'fa-book', 'المكتبة', () => true], ['permsTab', 'fa-user-shield', 'الميزات والصلاحيات', () => true]],
    student: [['examsTab', 'fa-file-signature', isParent ? 'الامتحانات' : 'امتحاناتي', f => f.exams], ['chatTab', 'fa-comments', 'المحادثات', f => f.chat]]
  }[PAGE];
  const tabsEl = $('.tabs');
  const container = $('.container');
  TABS.forEach(([id, icon, label]) => {
    const b = document.createElement('button');
    b.className = 'tab-button'; b.setAttribute('onclick', `showTab('${id}')`); b.style.display = 'none'; b.dataset.mod = id;
    b.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
    tabsEl.appendChild(b);
    const t = document.createElement('div');
    t.id = id; t.className = 'tab-content'; t.style.display = 'none';
    t.innerHTML = `<h2>${label}</h2><div class="mod-body"><p class="empty-note">جارِ التحميل…</p></div>`;
    container.appendChild(t);
  });

  let FEAT = store.get('feat_' + me.userId) || null;
  const loaded = {};
  function applyFeatures(f) {
    FEAT = f;
    TABS.forEach(([id, , , test]) => { const b = $(`[data-mod="${id}"]`); if (b) b.style.display = test(f.features || {}) ? '' : 'none'; });
    if (isParent) setupParent(f);
  }
  if (FEAT) applyFeatures(FEAT);
  document.addEventListener('DOMContentLoaded', async () => {
    const r = await api('getMyFeatures');
    if (r && r.success) { store.set('feat_' + me.userId, r); applyFeatures(r); return; }
    // الخادم لم يُحدَّث: نوضح السبب للمدير والمدرس بدل أن تختفي الميزات بصمت
    if (r && !r.network && PAGE !== 'student' && !$('#serverOld')) {
      const b = document.createElement('div');
      b.id = 'serverOld'; b.className = 'info-note server-old';
      b.innerHTML = '<b>⚠️ الخادم يعمل بنسخة قديمة.</b> الامتحانات والصلاحيات لن تظهر حتى يُحدَّث. في Apps Script تأكد من وجود الملفات الثلاثة (Code و Notifications و Extensions) ثم: نشر ← إدارة عمليات النشر ← ✏️ ← إصدار جديد ← نشر.' + (r.message ? `<br><small>رد الخادم: ${esc(r.message)}</small>` : '');
      const a = $('.container .page-title'); if (a) a.after(b);
    }
  });

  // تحميل الوحدة عند أول فتح لتبويبها
  const LOADERS = { examsTab: () => PAGE === 'student' ? studentExams() : teacherExams(), chatTab: chat, recordTab: record, statsTab: stats, permsTab: perms, libraryAdminTab: libraryAdmin };
  const origShow = window.showTab;
  window.showTab = function (id) {
    const r = origShow.apply(this, arguments);
    if (LOADERS[id] && !loaded[id]) { loaded[id] = true; LOADERS[id](); }
    return r;
  };
  const bodyOf = id => $('#' + id + ' .mod-body');

  // إبراز العنصر الذي جاء منه الإشعار (مثل امتحان معيّن)
  function highlightDeep(tab, sel) {
    const d = window.__deepArg;
    if (!d || d.tab !== tab || !d.arg) return;
    const el = $$(sel).find(x => x.dataset.id === d.arg);
    if (!el) return;
    window.__deepArg = null;
    el.classList.add('deep-hit');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    setTimeout(() => el.classList.remove('deep-hit'), 4000);
  }
  // إشعار وصل والتبويب مفتوح مسبقاً: نعيد تحميله ثم نبرز العنصر
  window.addEventListener('deeplink', ev => {
    const d = ev.detail || {};
    if (d.initial || !LOADERS[d.tab]) return;
    if (!loaded[d.tab]) return;   // التحميل الأول سيتكفل به
    if (d.tab === 'chatTab' && d.arg && window.__openChat) { window.__deepArg = null; window.__openChat(d.arg); }
    else LOADERS[d.tab]();
  });

  /* ================================================================
     وليّ الأمر
     ================================================================ */
  function setupParent(f) {
    const kids = f.children || [];
    let cur = store.get('parentChild');
    if (!kids.some(k => k.id === cur)) { cur = kids[0] && kids[0].id; store.set('parentChild', cur); if (cur && !setupParent.reloaded) { setupParent.reloaded = true; setTimeout(() => location.reload(), 50); return; } }
    ['profileTab'].forEach(id => { const b = $(`[onclick="showTab('${id}')"]`); if (b) b.style.display = 'none'; });
    const ban = $('#profileAlertBanner'); if (ban) ban.remove();
    const nameEl = $('#userName'); if (nameEl) nameEl.textContent = 'وليّ الأمر ' + (me.name || '');
    const label = $('.app-brand small'); if (label) label.textContent = 'متابعة وليّ الأمر';
    if ($('#childSwitch')) return;
    const box = document.createElement('div');
    box.id = 'childSwitch'; box.className = 'child-switch';
    box.innerHTML = kids.length ? `<span>تتابع الآن:</span>${kids.map(k => `<button type="button" class="${k.id === cur ? 'on' : ''}" data-id="${esc(k.id)}"><b>${esc(k.name)}</b><small>${esc(k.cls)} ${esc(k.sec)}</small></button>`).join('')}`
      : '<span>لا يوجد أبناء مرتبطون بحسابك. راجع إدارة المدرسة.</span>';
    const anchor = $('.container .page-title');
    if (anchor) anchor.after(box);
    $$('button', box).forEach(b => b.onclick = () => { store.set('parentChild', b.dataset.id); location.reload(); });
  }

  /* ================================================================
     الامتحانات — المدرس والإدارة
     ================================================================ */
  const MODE = { online: 'إلكتروني', paper: 'ورقي', both: 'إلكتروني وورقي' };
  const ST_CLS = { 'مسودة': 'mute', 'منشور': 'ok', 'مغلق': 'warn' };
  const GRADE_OPTS = [['Term1_Month1', 'الفصل الأول — الشهر الأول'], ['Term1_Month2', 'الفصل الأول — الشهر الثاني'], ['Term1_Month3', 'الفصل الأول — الشهر الثالث'], ['MidYear_Exam', 'نصف السنة'], ['Term2_Month1', 'الفصل الثاني — الشهر الأول'], ['Term2_Month2', 'الفصل الثاني — الشهر الثاني'], ['Term2_Month3', 'الفصل الثاني — الشهر الثالث'], ['Final_Exam', 'النهائي']];
  const sendAsLabel = sa => !sa ? 'كتقييم يومي' : sa.kind === 'monthly' ? 'كدرجة شهرية: ' + ((GRADE_OPTS.find(o => o[0] === sa.gradeType) || [])[1] || '') + ' (من ' + sa.outOf + ')' : 'كتقييم يومي بتاريخ ' + (sa.date || '');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];
  function classesForMe() {
    if (PAGE === 'teacher') {
      const a = window.teacherRawAssignments || [];
      const st = window.academicStructure || {};
      const classes = Array.from(new Set(a.map(x => x.class)));
      return { classes, sections: c => { let s = a.filter(x => x.class === c).map(x => x.section); if (s.some(x => !x || x === 'الكل')) s = s.concat((st.classSections && st.classSections[c]) || []); return Array.from(new Set(s.filter(x => x && x !== 'الكل'))); }, subjects: c => Array.from(new Set(a.filter(x => x.class === c).map(x => x.subject))) };
    }
    const st = window.academicStructure || {};
    return { classes: st.classes || [], sections: c => (st.classSections && st.classSections[c] && st.classSections[c].length ? st.classSections[c] : st.sections) || [], subjects: c => (st.classSubjects && st.classSubjects[c]) || st.globalSubjects || [] };
  }

  async function teacherExams() {
    const el = bodyOf('examsTab');
    el.innerHTML = '<p class="empty-note">جارِ التحميل…</p>';
    const r = await api('listExams');
    if (!r.success) { el.innerHTML = `<p class="empty-note">${esc(r.message)}</p>`; return; }
    const canOnline = FEAT && FEAT.features.exams, canPaper = FEAT && FEAT.features.paper;
    el.innerHTML = `<div class="mod-toolbar"><button type="button" class="button" id="exNew"><i class="fas fa-plus"></i> امتحان جديد</button>
        <span class="muted">${r.exams.length} امتحان · الأحدث أولاً</span></div>
      ${r.exams.length ? `<div class="exam-list">${r.exams.map(e => `
        <div class="exam-card" data-id="${esc(e.id)}">
          <div class="exam-top"><b>${esc(e.title)}</b><span class="st-chip ${ST_CLS[e.status] || 'mute'}">${esc(e.status)}</span></div>
          <div class="exam-meta">${esc(e.subject)} · ${esc(e.cls)}${e.section && e.section !== 'الكل' ? ' / ' + esc(e.section) : ''} · ${MODE[e.mode] || ''} · ${e.count} سؤال · ${e.total} درجة${e.settings && e.settings.duration && e.mode !== 'paper' ? ' · ' + e.settings.duration + ' دقيقة' : ''}</div>
          <div class="exam-meta">${e.submitted ? `سلّم ${e.submitted} طالب · المعدل ${e.avgPct}%` : 'لا نتائج بعد'}${PAGE === 'admin' ? ' · ' + esc(e.teacherName) : ''}
            ${e.resultState === 'pending' ? ' <span class="st-chip warn">النتائج بانتظار اعتماد الإدارة</span>' : e.resultState === 'published' ? ' <span class="st-chip ok">النتائج منشورة للطلاب</span>' : ''}</div>
          <div class="exam-actions">
            <button type="button" data-a="edit">تعديل</button>
            ${e.status !== 'منشور' && e.mode !== 'paper' ? '<button type="button" data-a="publish">نشر للطلاب</button>' : ''}
            ${e.status === 'منشور' ? '<button type="button" data-a="close">إغلاق</button>' : ''}
            <button type="button" data-a="results">النتائج</button>
            ${canPaper && e.mode !== 'online' ? '<button type="button" data-a="print">طباعة الأوراق</button><button type="button" data-a="scan" class="scan-btn"><i class="fas fa-camera"></i> تصحيح بالكاميرا</button>' : ''}
            <button type="button" data-a="delete" class="danger">حذف</button>
          </div>
        </div>`).join('')}</div>` : '<p class="empty-note">لا توجد امتحانات بعد. اضغط «امتحان جديد».</p>'}`;
    $('#exNew').onclick = () => examEditor(null, canOnline, canPaper);
    highlightDeep('examsTab', '.exam-card');
    $$('.exam-card', el).forEach(card => card.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const id = card.dataset.id, a = b.dataset.a;
      if (a === 'edit') { const x = await api('getExam', { examId: id }); if (x.success) examEditor(x.exam, canOnline, canPaper); }
      else if (a === 'publish' || a === 'close') { const x = await api('setExamStatus', { examId: id, status: a === 'publish' ? 'منشور' : 'مغلق' }); if (x.success) { say(x.message); teacherExams(); } }
      else if (a === 'delete') { if (await confirmBox('حذف هذا الامتحان؟ تبقى النتائج المحفوظة في الشيت.')) { const x = await api('setExamStatus', { examId: id, status: 'محذوف' }); if (x.success) { say(x.message); teacherExams(); } } }
      else if (a === 'results') examResults(id);
      else if (a === 'print') printSheets(id);
      else if (a === 'scan') openScanner(id);
    }));
  }

  function confirmBox(text, yes) {
    return new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'mod-overlay';
      ov.innerHTML = `<div class="mod-dialog"><p>${esc(text)}</p><div class="mod-toolbar"><button type="button" class="button" data-y>${esc(yes || 'نعم، تابع')}</button><button type="button" class="button btn-ghost" data-n>تراجع</button></div></div>`;
      document.body.appendChild(ov);
      ov.onclick = e => { if (e.target.closest('[data-y]')) { ov.remove(); res(true); } else if (e.target.closest('[data-n]') || e.target === ov) { ov.remove(); res(false); } };
    });
  }

  function examEditor(exam, canOnline, canPaper) {
    const el = bodyOf('examsTab');
    const C = classesForMe();
    const x = exam || { title: '', subject: '', cls: C.classes[0] || '', section: 'الكل', mode: canOnline ? 'online' : 'paper', settings: { duration: 30, showResult: 'admin', showAnswers: false, shuffle: true }, questions: [] };
    let qs = (x.questions || []).map(q => ({ text: q.text || '', options: q.options.slice(), correct: q.correct, marks: q.marks || 1 }));
    if (!qs.length) qs = [{ text: '', options: ['', '', '', ''], correct: -1, marks: 1 }];
    const dtLocal = v => v ? new Date(v).toISOString().slice(0, 16) : '';
    el.innerHTML = `
      <div class="mod-toolbar"><button type="button" class="button btn-ghost" id="exBack">‹ رجوع للقائمة</button><b>${exam ? 'تعديل امتحان' : 'امتحان جديد'}</b></div>
      <div class="form-section exam-form">
        <div class="ex-grid">
          <label class="wide">عنوان الامتحان<input type="text" id="exTitle" value="${esc(x.title)}" placeholder="مثال: امتحان الشهر الأول — الفصل الثاني"></label>
          <label>الصف<select id="exCls">${C.classes.map(c => `<option ${c === x.cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
          <label>الشعبة<select id="exSec"></select></label>
          <label>المادة<select id="exSub"></select></label>
          <label>نوع الامتحان<select id="exMode">
            ${canOnline ? `<option value="online" ${x.mode === 'online' ? 'selected' : ''}>إلكتروني (على الهاتف)</option>` : ''}
            ${canPaper ? `<option value="paper" ${x.mode === 'paper' ? 'selected' : ''}>ورقي (تصحيح بالكاميرا)</option>` : ''}
            ${canOnline && canPaper ? `<option value="both" ${x.mode === 'both' ? 'selected' : ''}>الاثنان</option>` : ''}</select></label>
          <label class="on-online">المدة (دقيقة)<input type="number" id="exDur" min="1" max="300" value="${x.settings.duration || 30}"></label>
          <label class="on-online">يفتح من (اختياري)<input type="datetime-local" id="exStart" value="${dtLocal(x.settings.start)}"></label>
          <label class="on-online">يُغلق في (اختياري)<input type="datetime-local" id="exEnd" value="${dtLocal(x.settings.end)}"></label>
          <label class="on-online">عرض النتيجة للطالب<select id="exShow">
            <option value="admin" ${!x.settings.showResult || x.settings.showResult === 'admin' || x.settings.showResult === 'after_close' ? 'selected' : ''}>بعد اعتماد الإدارة (موصى به)</option>
            <option value="immediate" ${x.settings.showResult === 'immediate' ? 'selected' : ''}>فور التسليم</option>
            <option value="never" ${x.settings.showResult === 'never' ? 'selected' : ''}>لا تُعرض</option></select></label>
          <label class="chk on-online"><input type="checkbox" id="exShuffle" ${x.settings.shuffle ? 'checked' : ''}> ترتيب عشوائي للأسئلة لكل طالب</label>
          <label class="chk on-online"><input type="checkbox" id="exAnswers" ${x.settings.showAnswers ? 'checked' : ''}> إظهار الإجابات الصحيحة مع النتيجة</label>
        </div>
      </div>
      <div class="form-section">
        <div class="mod-toolbar"><h3>الأسئلة <span class="muted" id="exCount"></span></h3>
          <button type="button" class="button btn-ghost" id="exQuick">مفتاح إجابات سريع</button></div>
        <p class="muted on-paper">للامتحان الورقي يكفي تحديد الإجابة الصحيحة لكل رقم؛ نص السؤال اختياري (يُكتب على السبورة أو ورقة منفصلة). الحد الأقصى 60 سؤالاً و4 اختيارات.</p>
        <div id="exQs"></div>
        <button type="button" class="button btn-ghost" id="exAdd"><i class="fas fa-plus"></i> إضافة سؤال</button>
      </div>
      <div class="mod-toolbar sticky-save"><button type="button" class="button btn-publish" id="exSave"><i class="fas fa-save"></i> حفظ الامتحان</button><span class="muted" id="exMsg"></span></div>`;
    const fill = () => {
      const c = $('#exCls').value;
      $('#exSec').innerHTML = `<option value="الكل">جميع الشعب</option>` + C.sections(c).map(s => `<option ${s === x.section ? 'selected' : ''}>${esc(s)}</option>`).join('');
      $('#exSub').innerHTML = C.subjects(c).map(s => `<option ${s === x.subject ? 'selected' : ''}>${esc(s)}</option>`).join('') || '<option value="">لا مواد</option>';
    };
    fill(); $('#exCls').onchange = fill;
    const modeUI = () => { const m = $('#exMode').value; el.classList.toggle('mode-paper', m === 'paper'); el.classList.toggle('mode-online', m !== 'paper'); };
    modeUI(); $('#exMode').onchange = () => { modeUI(); drawQs(); };
    function drawQs() {
      const paper = $('#exMode').value !== 'online';
      $('#exCount').textContent = `(${qs.length} سؤال · ${qs.reduce((s, q) => s + (+q.marks || 1), 0)} درجة)`;
      $('#exQs').innerHTML = qs.map((q, i) => `
        <div class="q-card" data-i="${i}">
          <div class="q-head"><b>${i + 1}</b><textarea rows="2" data-f="text" placeholder="نص السؤال${paper ? ' (اختياري للورقي)' : ''}">${esc(q.text)}</textarea>
            <label class="q-marks">الدرجة<input type="number" min="0.5" step="0.5" data-f="marks" value="${q.marks}"></label>
            <button type="button" class="q-del" data-del title="حذف السؤال">✕</button></div>
          <div class="q-opts">${q.options.map((o, k) => `
            <label class="q-opt ${q.correct === k ? 'right' : ''}"><input type="radio" name="c${i}" data-correct="${k}" ${q.correct === k ? 'checked' : ''} aria-label="الإجابة الصحيحة ${LETTERS[k]}">
              <span class="q-let">${LETTERS[k]}</span><input type="text" data-opt="${k}" value="${esc(o)}" placeholder="${paper ? 'اختياري' : 'نص الاختيار'}"></label>`).join('')}
            <span class="q-optbtns">${q.options.length < (paper ? 4 : 5) ? '<button type="button" data-addopt>+ اختيار</button>' : ''}${q.options.length > 2 ? '<button type="button" data-delopt>− اختيار</button>' : ''}</span></div>
        </div>`).join('');
    }
    drawQs();
    $('#exQs').addEventListener('input', e => {
      const card = e.target.closest('.q-card'); if (!card) return;
      const q = qs[+card.dataset.i];
      if (e.target.dataset.f === 'text') q.text = e.target.value;
      else if (e.target.dataset.f === 'marks') q.marks = +e.target.value || 1;
      else if (e.target.dataset.opt !== undefined) q.options[+e.target.dataset.opt] = e.target.value;
    });
    $('#exQs').addEventListener('change', e => {
      const card = e.target.closest('.q-card'); if (!card || e.target.dataset.correct === undefined) return;
      qs[+card.dataset.i].correct = +e.target.dataset.correct;
      $$('.q-opt', card).forEach((l, k) => l.classList.toggle('right', k === +e.target.dataset.correct));
    });
    $('#exQs').addEventListener('click', e => {
      const card = e.target.closest('.q-card'); if (!card) return;
      const i = +card.dataset.i, q = qs[i];
      if (e.target.closest('[data-del]')) { qs.splice(i, 1); if (!qs.length) qs.push({ text: '', options: ['', '', '', ''], correct: -1, marks: 1 }); drawQs(); }
      else if (e.target.closest('[data-addopt]')) { q.options.push(''); drawQs(); }
      else if (e.target.closest('[data-delopt]')) { q.options.pop(); if (q.correct >= q.options.length) q.correct = -1; drawQs(); }
    });
    $('#exAdd').onclick = () => { qs.push({ text: '', options: ['', '', '', ''], correct: -1, marks: 1 }); drawQs(); const last = $('#exQs .q-card:last-child textarea'); if (last) last.focus(); };
    $('#exQuick').onclick = () => {
      const ov = document.createElement('div'); ov.className = 'mod-overlay';
      ov.innerHTML = `<div class="mod-dialog"><h3>مفتاح إجابات سريع</h3><p class="muted">اكتب عدد الأسئلة ثم اضغط الإجابة الصحيحة لكل رقم.</p>
        <label>عدد الأسئلة <input type="number" id="qkN" min="1" max="60" value="${qs.length > 1 ? qs.length : 20}"></label>
        <div id="qkGrid" class="qk-grid"></div><div class="mod-toolbar"><button type="button" class="button btn-publish" data-ok>اعتماد</button><button type="button" class="button btn-ghost" data-n>إلغاء</button></div></div>`;
      document.body.appendChild(ov);
      let key = qs.map(q => q.correct);
      const draw = () => { const n = Math.max(1, Math.min(60, +$('#qkN', ov).value || 1)); key.length = n; $('#qkGrid', ov).innerHTML = Array.from({ length: n }, (_, i) => `<div><b>${i + 1}</b>${LETTERS.slice(0, 4).map((l, k) => `<button type="button" class="${key[i] === k ? 'on' : ''}" data-q="${i}" data-k="${k}">${l}</button>`).join('')}</div>`).join(''); };
      draw();
      $('#qkN', ov).oninput = draw;
      ov.addEventListener('click', e => {
        const b = e.target.closest('[data-q]');
        if (b) { key[+b.dataset.q] = +b.dataset.k; $$(`[data-q="${b.dataset.q}"]`, ov).forEach(x => x.classList.toggle('on', x === b)); return; }
        if (e.target.closest('[data-ok]')) {
          const n = key.length;
          qs = Array.from({ length: n }, (_, i) => qs[i] && qs[i].text ? Object.assign(qs[i], { correct: key[i] === undefined ? -1 : key[i] }) : { text: '', options: ['', '', '', ''], correct: key[i] === undefined ? -1 : key[i], marks: (qs[i] && qs[i].marks) || 1 });
          ov.remove(); drawQs();
        } else if (e.target.closest('[data-n]') || e.target === ov) ov.remove();
      });
    };
    $('#exBack').onclick = teacherExams;
    $('#exSave').onclick = async () => {
      const missing = qs.findIndex(q => !(q.correct >= 0));
      if (missing > -1) { $('#exMsg').textContent = `حدد الإجابة الصحيحة للسؤال ${missing + 1}.`; $(`.q-card[data-i="${missing}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const toIso = v => v ? new Date(v).toISOString() : '';
      const payload = { exam: { id: exam && exam.id, title: $('#exTitle').value, cls: $('#exCls').value, section: $('#exSec').value, subject: $('#exSub').value, mode: $('#exMode').value,
        settings: { duration: +$('#exDur').value, start: toIso($('#exStart').value), end: toIso($('#exEnd').value), showResult: $('#exShow').value, shuffle: $('#exShuffle').checked, showAnswers: $('#exAnswers').checked },
        questions: qs } };
      const r = await api('saveExam', payload);
      if (r.success) { say(r.message); teacherExams(); } else $('#exMsg').textContent = r.message;
    };
  }

  async function examResults(id) {
    const el = bodyOf('examsTab');
    el.innerHTML = '<p class="empty-note">جارِ التحميل…</p>';
    const r = await api('getExamResults', { examId: id });
    if (!r.success) { el.innerHTML = `<p class="empty-note">${esc(r.message)}</p>`; return; }
    const s = r.summary, ex = r.exam;
    const sa = (ex.settings || {}).sendAs;
    const sorted = r.rows.slice().sort((a, b) => (b.total ? b.score / b.total : -1) - (a.total ? a.score / a.total : -1));
    el.innerHTML = `
      <div class="mod-toolbar"><button type="button" class="button btn-ghost" id="rsBack">‹ رجوع</button><b>${esc(ex.title)}</b><span class="muted">${esc(ex.subject)} · ${esc(ex.cls)} ${ex.section !== 'الكل' ? esc(ex.section) : ''}</span></div>
      <div class="stat-tiles"><div><span>سلّموا</span><b>${s.submitted}/${s.students}</b></div><div><span>المعدل</span><b>${s.avg == null ? '—' : s.avg + '%'}</b></div>
        <div><span>أعلى</span><b>${s.max == null ? '—' : s.max + '%'}</b></div><div><span>أدنى</span><b>${s.min == null ? '—' : s.min + '%'}</b></div><div><span>ناجحون (50%+)</span><b>${s.passed}</b></div></div>
      <div class="form-section result-send"><div class="rs-head"><h3>إرسال النتائج</h3>
        <p class="muted">${ex.resultState === 'published' ? 'النتائج منشورة، ويراها الطلاب وأولياء أمورهم.' + (sa ? ' (' + esc(sendAsLabel(sa)) + ')' : '') : ex.resultState === 'pending' ? 'أُرسلت النتائج ' + esc(sendAsLabel(sa)) + '، وهي بانتظار اعتماد الإدارة.' : PAGE === 'admin' ? 'اختر كيف تُسجَّل النتيجة ثم انشرها، ويصل الطلاب إشعار.' : 'بعد اكتمال التصحيح اختر كيف تُسجَّل النتيجة وأرسلها للإدارة. بعد اعتمادها تظهر للطلاب ويصلهم إشعار.'}</p></div>
        ${ex.resultState === 'published' ? '<span class="st-chip ok">منشورة ✓</span>' : `
        <div class="rs-kind" role="radiogroup" aria-label="نوع التسجيل">
          <label class="rs-opt"><input type="radio" name="rsKind" value="daily" ${!sa || sa.kind !== 'monthly' ? 'checked' : ''}><span><b>تقييم يومي</b><small>يظهر في تقييمات الطالب بمستوى (جيد/متوسط/ضعيف) مع الدرجة</small></span></label>
          <label class="rs-opt"><input type="radio" name="rsKind" value="monthly" ${sa && sa.kind === 'monthly' ? 'checked' : ''}><span><b>درجة شهرية</b><small>تُسجَّل في سجل الدرجات للشهر الذي تختاره</small></span></label>
        </div>
        <div class="controls rs-daily"><label>تاريخ التقييم <input type="date" id="rsDate" value="${esc((sa && sa.date) || today())}"></label></div>
        <div class="controls rs-monthly"><select id="rsType" aria-label="الشهر">${GRADE_OPTS.map(o => `<option value="${o[0]}" ${sa && sa.gradeType === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
          <label>الدرجة من <input type="number" id="rsOut" value="${(sa && sa.outOf) || 100}" min="1" max="100" style="width:5rem"></label></div>
        <button type="button" class="button btn-publish" id="rsSend">${PAGE === 'admin' ? 'اعتماد ونشر للطلاب' : ex.resultState === 'pending' ? 'إعادة الإرسال بعد التعديل' : 'حفظ وإرسال النتائج للإدارة'}</button>`}</div>
      <div class="table-responsive"><table class="data-table"><thead><tr><th>#</th><th>الطالب</th><th>الدرجة</th><th>النسبة</th><th>الطريقة</th><th>الحالة</th><th></th></tr></thead>
        <tbody>${sorted.map((x, i) => `<tr><td>${i + 1}</td><td class="g-name">${esc(x.name)}</td><td>${x.total ? `${x.score} / ${x.total}` : '—'}</td>
          <td>${x.total ? `<span class="pct-bar"><i style="width:${Math.round(x.score / x.total * 100)}%" class="${x.score / x.total < .5 ? 'low' : ''}"></i><b>${Math.round(x.score / x.total * 100)}%</b></span>` : ''}</td>
          <td>${esc(x.source || '')}</td><td><span class="st-chip ${x.status === 'لم يمتحن' ? 'mute' : x.status === 'جارٍ' ? 'warn' : 'ok'}">${esc(x.status)}</span></td>
          <td>${x.status !== 'لم يمتحن' ? `<button type="button" class="link-btn" data-reset="${esc(x.id)}">إعادة الامتحان</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <div class="form-section"><h3>صعوبة الأسئلة</h3><p class="muted">نسبة من أجاب إجابة صحيحة. الأسئلة الأصعب تحتاج مراجعة مع الطلاب.</p>
        <div class="q-stats">${r.questions.map((q, i) => { const qq = ex.questions[i] || {}; const wrongPick = q.picks.map((n, k) => [n, k]).filter(p => p[1] !== qq.correct).sort((a, b) => b[0] - a[0])[0];
          return `<div class="q-stat"><b>${q.n}</b><span class="pct-bar"><i style="width:${q.pct || 0}%" class="${(q.pct || 0) < 50 ? 'low' : ''}"></i><b>${q.pct == null ? '—' : q.pct + '%'}</b></span>
            <small>الصحيحة ${LETTERS[qq.correct] || ''}${wrongPick && wrongPick[0] ? ' · أكثر خطأ: ' + LETTERS[wrongPick[1]] + ' (' + wrongPick[0] + ')' : ''}</small></div>`; }).join('')}</div></div>`;
    $('#rsBack').onclick = teacherExams;
    const syncKind = () => { const k = ($('[name=rsKind]:checked', el) || {}).value; const d = $('.rs-daily', el), m = $('.rs-monthly', el); if (d) d.hidden = k !== 'daily'; if (m) m.hidden = k !== 'monthly'; };
    $$('[name=rsKind]', el).forEach(x => x.onchange = syncKind); syncKind();
    if ($('#rsSend')) $('#rsSend').onclick = async () => {
      const kind = $('[name=rsKind]:checked', el).value;
      const p = kind === 'monthly' ? { kind, gradeType: $('#rsType').value, outOf: +$('#rsOut').value } : { kind, date: $('#rsDate').value };
      const btn = $('#rsSend'); btn.disabled = true;
      const x = await api('submitExamResults', Object.assign({ examId: id }, p));
      btn.disabled = false;
      if (x.success) { say(x.message); examResults(id); }
    };
    $$('[data-reset]', el).forEach(b => b.onclick = async () => { if (await confirmBox('إلغاء محاولة هذا الطالب ليمتحن من جديد؟')) { const x = await api('resetAttempt', { examId: id, studentId: b.dataset.reset }); if (x.success) { say(x.message); examResults(id); } } });
  }

  /* ---------------- طباعة أوراق الإجابة (مع معاينة) ---------------- */
  async function printSheets(id) {
    const r = await api('getExamForPrint', { examId: id });
    if (!r.success) return;
    const ex = r.exam, n = ex.questions.length, hasText = ex.questions.some(q => q.text);
    const comboMax = OMR.maxFor('B2');
    const ov = document.createElement('div'); ov.className = 'mod-overlay';
    ov.innerHTML = `<div class="mod-dialog print-dialog">
      <div class="pd-side">
        <h3>طباعة: ${esc(ex.title)}</h3>
        <p class="muted">${n} سؤال · ${ex.total} درجة · ${r.students.length} طالب</p>
        <fieldset class="pd-group"><legend>شكل الورقة</legend>
          <label class="chk"><input type="radio" name="prLayout" value="combined" ${n <= comboMax && hasText ? 'checked' : ''} ${n > comboMax ? 'disabled' : ''}> الأسئلة والإجابات في ورقة واحدة <small>(الدوائر أعلى الورقة والأسئلة تحتها · حتى ${comboMax} سؤالاً)</small></label>
          <label class="chk"><input type="radio" name="prLayout" value="separate" ${n > comboMax || !hasText ? 'checked' : ''}> ورقة إجابة منفصلة <small>(حتى ${OMR.MAXQ} سؤالاً)</small></label>
          <label class="chk pd-sep"><input type="checkbox" id="prQ" ${hasText ? 'checked' : ''} ${hasText ? '' : 'disabled'}> مع ورقة أسئلة منفصلة لكل طالب</label>
          ${n > comboMax ? `<p class="pd-warn">الورقة الواحدة تتسع لـ ${comboMax} سؤالاً فقط، وهذا الامتحان ${n} سؤالاً.</p>` : ''}
          ${hasText ? '' : '<p class="muted">لم تكتب نص الأسئلة، فتُطبع ورقة الإجابة فقط.</p>'}
        </fieldset>
        <fieldset class="pd-group"><legend>حجم خط الأسئلة</legend>
          <div class="seg-btns" id="prFont"><button type="button" data-f="9">صغير</button><button type="button" data-f="10.5" class="on">متوسط</button><button type="button" data-f="12">كبير</button></div>
          <span class="muted">أعمدة الأسئلة</span>
          <div class="seg-btns" id="prCols"><button type="button" data-c="1">1</button><button type="button" data-c="2" class="on">2</button><button type="button" data-c="3">3</button></div>
          <label class="chk"><input type="checkbox" id="prKey" checked> صفحة مفتاح الإجابات للمدرس</label>
        </fieldset>
        <fieldset class="pd-group"><legend>الطلاب <span id="prCount" class="muted"></span></legend>
          <div class="pd-btns"><button type="button" data-sel="all">تحديد الكل</button><button type="button" data-sel="none">إلغاء الكل</button><button type="button" data-sel="undone">غير المصحَّحين فقط</button></div>
          <div class="pr-list">${r.students.map(s => `<label class="chk"><input type="checkbox" value="${esc(s.id)}" ${s.result ? 'data-done="1"' : ''} checked> ${esc(s.name)} ${s.section ? '<small>' + esc(s.section) + '</small>' : ''}${s.result ? ` <span class="st-chip ok">${s.result.score}/${s.result.total}</span>` : ''}</label>`).join('')}</div>
        </fieldset>
        <div class="mod-toolbar"><button type="button" class="button btn-publish" data-print><i class="fas fa-print"></i> طباعة</button><button type="button" class="button btn-ghost" data-n>إغلاق</button></div>
        <p class="muted">اطبع على A4 بمقياس 100% (لا تختر «ملاءمة الصفحة»).</p>
      </div>
      <div class="pd-preview">
        <div class="pd-bar"><b>معاينة</b><span id="prFit" class="muted"></span><span class="pd-zoom"><button type="button" data-z="-">−</button><span id="prZ">60%</span><button type="button" data-z="+">+</button><button type="button" data-z="fit">ملاءمة</button></span></div>
        <div class="pd-stage" id="prStage"></div>
      </div></div>`;
    document.body.appendChild(ov);
    let font = 10.5, zoom = 0.6, cols = 2;
    const chosen = () => $$('.pr-list input:checked', ov).map(c => c.value);
    const layout = () => (($('input[name=prLayout]:checked', ov) || {}).value) || 'separate';
    // الاختيارات القصيرة في سطر واحد لتوفير المساحة
    const qList = () => `<ol class="q-print" style="columns:${cols}">${ex.questions.map(q => `<li><p>${esc(q.text) || '&nbsp;'}</p><div class="q-print-opts n${q.options.length} ${Math.max.apply(null, q.options.map(o => String(o).length)) <= (cols === 3 ? 7 : 12) ? 'one-row' : ''}">${q.options.map((o, k) => `<span><b>${LETTERS[k]}</b> ${esc(o)}</span>`).join('')}</div></li>`).join('')}</ol>`;
    const sheet = (s, lid) => OMR.sheetSVG({ examId: ex.id, studentId: s.id, studentName: s.name, title: ex.title + ' · ' + ex.subject, count: n, options: ex.questions.map(q => q.options.length), layout: lid });
    const pagesFor = s => {
      if (layout() === 'combined') return `<section class="print-page paper-page combo-page">${sheet(s, 'B2')}<div class="combo-q" style="font-size:${font}pt">${qList()}</div></section>`;
      return `<section class="print-page paper-page">${sheet(s, 'B1')}</section>` + ($('#prQ', ov).checked && hasText ? `<section class="print-page paper-page q-page" style="font-size:${font}pt"><div class="q-page-head"><b>${esc(s.name)}</b><span>${esc(ex.title)} · ${esc(ex.subject)}</span></div>${qList()}<div class="q-page-foot">ظلّل إجابتك في ورقة الإجابة المرفقة</div></section>` : '');
    };
    const keyPage = () => `<section class="print-page paper-page q-page key-page"><div class="q-page-head"><b>مفتاح الإجابات — للمدرس فقط</b><span>${esc(ex.title)} · ${esc(ex.subject)} · ${n} سؤال · ${ex.total} درجة</span></div>
      <div class="key-grid">${ex.questions.map((q, i) => `<span><b>${i + 1}</b>${LETTERS[q.correct]}<small>${q.marks}</small></span>`).join('')}</div></section>`;
    function preview() {
      const ids = chosen();
      $('#prCount', ov).textContent = `(${ids.length} من ${r.students.length})`;
      $('.pd-sep', ov).hidden = layout() === 'combined';
      const st = r.students.find(x => ids.indexOf(x.id) > -1) || r.students[0];
      const stage = $('#prStage', ov);
      stage.innerHTML = st ? `<div class="pd-scale" style="transform:scale(${zoom})">${pagesFor(st)}</div>` : '<p class="empty-note">اختر طالباً.</p>';
      const sc = $('.pd-scale', stage);
      if (sc) { sc.style.marginBottom = `${-(1 - zoom) * sc.scrollHeight}px`; sc.style.marginRight = `${-(1 - zoom) * sc.scrollWidth}px`; }
      $('#prZ', ov).textContent = Math.round(zoom * 100) + '%';
      // هل تتسع الأسئلة؟
      const box = $('.combo-q', stage), fit = $('#prFit', ov);
      if (layout() === 'combined' && box) {
        // نتحقق أن آخر سؤال يقع داخل المساحة المخصصة للأسئلة
        const br = box.getBoundingClientRect(), items = $$('li', box), last = items[items.length - 1];
        const lr = last ? last.getBoundingClientRect() : br;
        const over = !!last && (lr.left < br.left - 1 || lr.right > br.right + 1 || lr.bottom > br.bottom + 1);
        fit.innerHTML = over ? '<span class="pd-warn-inline">⚠️ الأسئلة لا تتسع في الورقة. صغّر الخط أو اختر الورقة المنفصلة.</span>' : '<span class="ok-inline">✓ كل الأسئلة تتسع في ورقة واحدة</span>';
        fit.dataset.over = over ? '1' : '';
      } else { fit.textContent = `${n} سؤال في ورقة إجابة واحدة`; fit.dataset.over = ''; }
    }
    preview();
    ov.addEventListener('change', e => { if (e.target.closest('.pr-list') || e.target.name === 'prLayout' || e.target.id === 'prQ') preview(); });
    ov.addEventListener('click', e => {
      const sel = e.target.closest('[data-sel]');
      if (sel) { $$('.pr-list input', ov).forEach(c => { c.checked = sel.dataset.sel === 'all' ? true : sel.dataset.sel === 'none' ? false : !c.dataset.done; }); return preview(); }
      const cb = e.target.closest('[data-c]');
      if (cb) { cols = +cb.dataset.c; $$('#prCols button', ov).forEach(b => b.classList.toggle('on', b === cb)); return preview(); }
      const f = e.target.closest('[data-f]');
      if (f) { font = +f.dataset.f; $$('#prFont button', ov).forEach(b => b.classList.toggle('on', b === f)); return preview(); }
      const z = e.target.closest('[data-z]');
      if (z) { const w = $('#prStage', ov).clientWidth; zoom = z.dataset.z === '+' ? Math.min(1.5, zoom + 0.1) : z.dataset.z === '-' ? Math.max(0.25, zoom - 0.1) : Math.max(0.25, (w - 24) / (210 * 3.78)); return preview(); }
      if (e.target.closest('[data-n]') || e.target === ov) return ov.remove();
      if (!e.target.closest('[data-print]')) return;
      const ids = chosen();
      if (!ids.length) return say('اختر طالباً واحداً على الأقل.', true);
      if ($('#prFit', ov).dataset.over && !confirm('الأسئلة لا تتسع كاملة في الورقة. هل تطبع على أي حال؟')) return;
      let area = $('#printArea'); if (!area) { area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
      area.innerHTML = ($('#prKey', ov).checked ? keyPage() : '') + r.students.filter(s => ids.indexOf(s.id) > -1).map(pagesFor).join('');
      ov.remove();
      setTimeout(() => window.print(), 300);
    });
  }

  /* ---------------- التصحيح بالكاميرا ---------------- */
  async function openScanner(id) {
    const r = await api('getExamForPrint', { examId: id });
    if (!r.success) return;
    const ex = r.exam;
    const students = {}; r.students.forEach(s => { students[s.id.toUpperCase()] = s; });
    const done = {}; r.students.forEach(s => { if (s.result) done[s.id.toUpperCase()] = { score: s.result.score, total: s.result.total, key: null }; });
    const opts = { count: ex.questions.length, options: ex.questions.map(q => q.options.length) };
    const ov = document.createElement('div'); ov.className = 'scan-overlay';
    ov.innerHTML = `
      <div class="scan-top"><b>${esc(ex.title)}</b><span id="scCount"></span><button type="button" id="scClose" aria-label="إغلاق">✕</button></div>
      <div class="scan-view"><video id="scVideo" playsinline muted></video><div class="scan-frame"><i></i><i></i><i></i><i></i></div>
        <div class="scan-flash" id="scFlash"></div></div>
      <div class="scan-status" id="scStatus">اضغط «ابدأ» ثم وجّه الكاميرا نحو ورقة الإجابة كاملة.</div>
      <div class="scan-result" id="scResult" hidden></div>
      <div class="scan-actions"><button type="button" class="button btn-publish" id="scStart"><i class="fas fa-camera"></i> ابدأ</button>
        <label class="button btn-ghost"><input type="file" id="scFiles" accept="image/*" multiple hidden> صور من المعرض</label></div>
      <div class="scan-list" id="scList"></div>`;
    document.body.appendChild(ov);
    document.documentElement.classList.add('no-scroll');
    const video = $('#scVideo', ov), status = $('#scStatus', ov), resBox = $('#scResult', ov);
    const lo = document.createElement('canvas'), hi = document.createElement('canvas');
    const lctx = lo.getContext('2d', { willReadFrequently: true }), hctx = hi.getContext('2d', { willReadFrequently: true });
    let stream = null, timer = null, last = '', busy = false, frame = 0, audio = null, wake = null;
    const queue = [];
    const drawCount = () => { $('#scCount', ov).textContent = `صُحّح ${Object.keys(done).length} من ${r.students.length}`; };
    const drawList = () => {
      $('#scList', ov).innerHTML = r.students.map(s => { const d = done[s.id.toUpperCase()]; return `<span class="${d ? 'ok' : ''}">${d ? '✓ ' : ''}${esc(s.name)}${d ? ` <b>${d.score}/${d.total}</b>` : ''}</span>`; }).join('');
      drawCount();
    };
    drawList();
    const beep = ok => {
      try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = ok ? 880 : 300; g.gain.value = 0.15; o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + (ok ? 0.12 : 0.25)); } catch (e) {}
      if (navigator.vibrate) navigator.vibrate(ok ? 70 : [60, 60, 60]);
    };
    const flash = ok => { const f = $('#scFlash', ov); f.className = 'scan-flash ' + (ok ? 'ok' : 'bad'); setTimeout(() => { f.className = 'scan-flash'; }, 450); };
    const localScore = ans => { let s = 0, t = 0; ex.questions.forEach((q, i) => { const m = +q.marks || 1; t += m; if (ans[i] === q.correct) s += m; }); return { s, t }; };
    async function upload() {
      if (upload.running) return; upload.running = true;
      while (queue.length) {
        const item = queue[0];
        const x = await api('savePaperResult', { examId: ex.id, studentId: item.studentId, answers: item.answers });
        if (x && x.success) { queue.shift(); done[item.key] = { score: x.score, total: x.total, key: item.sig }; drawList(); }
        else { await new Promise(res => setTimeout(res, 3000)); if (!x || x.success === false && x.message && !/الشبكة|الاتصال/.test(x.message)) queue.shift(); }
      }
      upload.running = false;
    }
    function handle(res, fromFile) {
      if (res.status !== 'ok') {
        status.textContent = res.status === 'noqr' ? 'أبحث عن الورقة… اجعل الورقة كاملة داخل الإطار وبإضاءة جيدة.' : 'ظهر الرمز ولم تظهر المربعات الأربعة. أبعد الهاتف قليلاً حتى تظهر الزوايا.';
        return false;
      }
      if (res.examId.toUpperCase() !== ex.id.toUpperCase()) { status.textContent = '⚠️ هذه ورقة امتحان آخر.'; if (fromFile) beep(false); return false; }
      const key = res.studentId.toUpperCase();
      const st = students[key];
      if (!st) { status.textContent = '⚠️ هذا الطالب ليس من صف الامتحان.'; return false; }
      const sig = key + ':' + res.answers.join(',');
      if (!fromFile && sig !== last) { last = sig; status.textContent = 'ثبّت الهاتف لحظة…'; return false; }   // نطلب قراءتين متطابقتين
      if (done[key] && done[key].key === sig) { status.textContent = `✓ ${st.name} محفوظ مسبقاً. ضع الورقة التالية.`; return true; }
      const sc = localScore(res.answers);
      const blanks = res.answers.filter(a => a === -1).length, multi = res.answers.filter(a => a === -2).length;
      done[key] = { score: sc.s, total: sc.t, key: sig };
      queue.push({ key, sig, studentId: st.id, answers: res.answers });
      upload();
      beep(true); flash(true); drawList();
      resBox.hidden = false;
      resBox.innerHTML = `<div class="sr-head"><b>${esc(st.name)}</b><span class="sr-score">${sc.s} / ${sc.t}</span></div>
        ${blanks || multi ? `<div class="sr-warn">${blanks ? blanks + ' بلا إجابة' : ''}${blanks && multi ? ' · ' : ''}${multi ? multi + ' فيها أكثر من اختيار (تُحسب خطأ)' : ''}</div>` : ''}
        <div class="sr-grid">${res.answers.map((a, i) => `<span class="${a === ex.questions[i].correct ? 'ok' : a < 0 ? 'blank' : 'bad'}">${i + 1}<b>${a >= 0 ? LETTERS[a] : a === -2 ? '×' : '—'}</b></span>`).join('')}</div>`;
      status.textContent = '✓ حُفظت. ضع الورقة التالية.';
      return true;
    }
    function grab() {
      const vw = video.videoWidth, vh = video.videoHeight;
      if (!vw) return null;
      lo.width = 1000; lo.height = Math.round(vh * 1000 / vw);
      lctx.drawImage(video, 0, 0, lo.width, lo.height);
      let hiData = null;
      if (frame++ % 2 === 1 && vw > 1100) { hi.width = Math.min(1600, vw); hi.height = Math.round(vh * hi.width / vw); hctx.drawImage(video, 0, 0, hi.width, hi.height); hiData = hctx.getImageData(0, 0, hi.width, hi.height); }
      return [lctx.getImageData(0, 0, lo.width, lo.height), hiData];
    }
    function loop() {
      if (!stream) return;
      if (!busy) {
        busy = true;
        try { const g = grab(); if (g) handle(OMR.decode(g[0], opts, g[1]), false); } catch (e) { console.error(e); }
        busy = false;
      }
      timer = setTimeout(loop, 180);
    }
    $('#scStart', ov).onclick = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        video.srcObject = stream; await video.play();
        $('#scStart', ov).hidden = true;
        status.textContent = 'وجّه الكاميرا نحو ورقة الإجابة كاملة.';
        try { wake = await navigator.wakeLock.request('screen'); } catch (e) {}
        try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
        loop();
      } catch (e) {
        const n = e && e.name;
        status.innerHTML = !window.isSecureContext ? 'الكاميرا تعمل فقط عبر رابط https (رابط GitHub). افتح المنصة من الرابط وليس من ملف على الجهاز.'
          : n === 'NotAllowedError' ? 'رُفض إذن الكاميرا. اضغط رمز القفل 🔒 بجانب الرابط في الأعلى ← الأذونات ← الكاميرا ← سماح، ثم أعد تحميل الصفحة واضغط «ابدأ».'
          : n === 'NotFoundError' ? 'لم يُعثر على كاميرا في هذا الجهاز. استخدم «صور من المعرض».'
          : n === 'NotReadableError' ? 'الكاميرا مستخدمة في تطبيق آخر. أغلقه ثم اضغط «ابدأ» مرة أخرى.'
          : 'تعذّر فتح الكاميرا. افتح المنصة في Chrome أو Safari (وليس من داخل واتساب أو تليجرام)، أو استخدم «صور من المعرض».';
        $('#scStart', ov).hidden = false;
      }
    };
    $('#scFiles', ov).onchange = async e => {
      for (const f of Array.from(e.target.files)) {
        const url = URL.createObjectURL(f); const img = new Image(); img.src = url; await img.decode();
        lo.width = 1000; lo.height = Math.round(img.height * 1000 / img.width); lctx.drawImage(img, 0, 0, lo.width, lo.height);
        hi.width = Math.min(1600, img.width); hi.height = Math.round(img.height * hi.width / img.width); hctx.drawImage(img, 0, 0, hi.width, hi.height);
        const ok = handle(OMR.decode(lctx.getImageData(0, 0, lo.width, lo.height), opts, hctx.getImageData(0, 0, hi.width, hi.height)), true);
        if (!ok) say(f.name + ': ' + status.textContent, true);
        URL.revokeObjectURL(url);
      }
      e.target.value = '';
    };
    $('#scClose', ov).onclick = () => {
      clearTimeout(timer); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null;
      try { wake && wake.release(); } catch (e) {}
      document.documentElement.classList.remove('no-scroll');
      ov.remove();
      if (queue.length) say('يتم رفع ' + queue.length + ' ورقة في الخلفية…');
      if (loaded.examsTab) teacherExams();
    };
  }

  /* ================================================================
     الامتحانات — الطالب ووليّ الأمر
     ================================================================ */
  async function studentExams() {
    const el = bodyOf('examsTab');
    el.innerHTML = '<p class="empty-note">جارِ التحميل…</p>';
    const r = await api('getMyExams');
    if (!r.success) { el.innerHTML = `<p class="empty-note">${esc(r.message)}</p>`; return; }
    if (!r.exams.length) { el.innerHTML = '<p class="empty-note">لا توجد امتحانات حالياً.</p>'; return; }
    const now = Date.now();
    el.innerHTML = `<div class="exam-list">${r.exams.map(e => {
      const notYet = e.status === 'منشور' && e.settings.start && new Date(e.settings.start).getTime() > now;
      return `<div class="exam-card ${e.available ? 'is-open' : ''}" data-id="${esc(e.id)}">
        <div class="exam-top"><b>${esc(e.title)}</b>${e.done ? '<span class="st-chip ok">سُلّم</span>' : e.available ? '<span class="st-chip warn">متاح الآن</span>' : notYet ? '<span class="st-chip mute">لم يبدأ</span>' : '<span class="st-chip mute">' + esc(e.status === 'مغلق' ? 'مغلق' : e.mode === 'paper' ? 'ورقي' : 'غير متاح') + '</span>'}</div>
        <div class="exam-meta">${esc(e.subject)} · ${e.count} سؤال · ${e.total} درجة${e.mode !== 'paper' ? ' · ' + e.settings.duration + ' دقيقة' : ' · ورقي'}${e.teacherName ? ' · ' + esc(e.teacherName) : ''}</div>
        ${notYet ? `<div class="exam-meta">يبدأ ${fmtDate(e.settings.start)}</div>` : ''}${e.settings.end && !e.done ? `<div class="exam-meta">يُغلق ${fmtDate(e.settings.end)}</div>` : ''}
        ${e.score != null ? `<div class="exam-score"><span class="pct-bar"><i style="width:${Math.round(e.score / e.total * 100)}%" class="${e.score / e.total < .5 ? 'low' : ''}"></i><b>${e.score} / ${e.total}</b></span></div>` : e.resultNote ? `<div class="exam-meta">${esc(e.resultNote)}</div>` : ''}
        <div class="exam-actions">${e.available ? `<button type="button" class="button" data-start>${e.inProgress ? 'متابعة الامتحان' : 'ابدأ الامتحان'}</button>` : ''}${e.review ? '<button type="button" data-review>مراجعة الإجابات</button>' : ''}</div>
      </div>`; }).join('')}</div>`;
    highlightDeep('examsTab', '.exam-card');
    $$('.exam-card', el).forEach(c => c.addEventListener('click', ev => {
      const e = r.exams.find(x => x.id === c.dataset.id);
      if (ev.target.closest('[data-start]')) takeExam(e);
      else if (ev.target.closest('[data-review]')) reviewExam(e);
    }));
  }

  function reviewExam(e) {
    const ov = document.createElement('div'); ov.className = 'mod-overlay';
    ov.innerHTML = `<div class="mod-dialog wide"><h3>${esc(e.title)} — ${e.score}/${e.total}</h3><ol class="review-list">${e.review.map(q => `<li><p>${esc(q.text) || '—'}</p>${q.options.map((o, k) => `<div class="${k === q.correct ? 'ok' : k === q.mine ? 'bad' : ''}">${LETTERS[k]}) ${esc(o)}${k === q.correct ? ' ✓' : k === q.mine ? ' ✗ (إجابتك)' : ''}</div>`).join('')}</li>`).join('')}</ol>
      <div class="mod-toolbar"><button type="button" class="button" data-n>إغلاق</button></div></div>`;
    document.body.appendChild(ov);
    ov.onclick = x => { if (x.target.closest('[data-n]') || x.target === ov) ov.remove(); };
  }

  async function takeExam(e) {
    const r = await api('startExam', { examId: e.id });
    if (!r.success) return;
    const draftKey = 'exam_' + e.id + '_' + me.userId;
    const ans = Object.assign({}, (r.saved || []).reduce((o, a, i) => { if (a >= 0) o[i] = a; return o; }, {}), store.get(draftKey) || {});
    let left = r.remaining, tick = null, saveTick = null, finished = false;
    const ov = document.createElement('div'); ov.className = 'take-overlay';
    ov.innerHTML = `<div class="take-top"><b>${esc(r.exam.title)}</b><span id="tkTimer" class="tk-timer"></span><span id="tkProg" class="muted"></span></div>
      <div class="take-body"><ol class="take-list">${r.questions.map((q, n) => `<li data-i="${q.i}"><p><b>${n + 1}.</b> ${esc(q.text)} <small>(${q.marks} درجة)</small></p>
        ${q.options.map((o, k) => `<label class="tk-opt"><input type="radio" name="q${q.i}" value="${k}" ${ans[q.i] === k ? 'checked' : ''}><span>${LETTERS[k]}</span> ${esc(o)}</label>`).join('')}</li>`).join('')}</ol></div>
      <div class="take-foot"><button type="button" class="button btn-publish" id="tkSubmit">تسليم الامتحان</button><span class="muted">تُحفظ إجاباتك تلقائياً.</span></div>`;
    document.body.appendChild(ov);
    document.documentElement.classList.add('no-scroll');
    const prog = () => { $('#tkProg', ov).textContent = `أجبت ${Object.keys(ans).length} من ${r.questions.length}`; };
    prog();
    ov.addEventListener('change', ev => { const li = ev.target.closest('li'); if (!li) return; ans[+li.dataset.i] = +ev.target.value; store.set(draftKey, ans); prog(); });
    const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const timerEl = $('#tkTimer', ov);
    const leave = ev => { if (!finished) { ev.preventDefault(); ev.returnValue = ''; } };
    window.addEventListener('beforeunload', leave);
    tick = setInterval(() => { left--; timerEl.textContent = '⏱ ' + fmt(Math.max(0, left)); timerEl.classList.toggle('low', left < 60); if (left <= 0) submit(true); }, 1000);
    timerEl.textContent = '⏱ ' + fmt(left);
    saveTick = setInterval(() => api('submitExam', { examId: e.id, answers: ans, draft: true }), 45000);
    async function submit(auto) {
      if (finished) return;
      if (!auto) { const n = r.questions.length - Object.keys(ans).length; if (!(await confirmBox(n ? `بقي ${n} سؤال بلا إجابة. تسليم الآن؟` : 'تسليم الامتحان الآن؟', 'تسليم'))) return; }
      finished = true; clearInterval(tick); clearInterval(saveTick);
      const x = await api('submitExam', { examId: e.id, answers: ans });
      window.removeEventListener('beforeunload', leave);
      try { localStorage.removeItem(draftKey); } catch (er) {}
      ov.innerHTML = `<div class="take-done"><h3>${x.success ? 'سُلّم الامتحان ✅' : 'تعذّر التسليم'}</h3><p>${esc(x.message || '')}</p><button type="button" class="button" id="tkClose">رجوع</button></div>`;
      $('#tkClose', ov).onclick = () => { ov.remove(); document.documentElement.classList.remove('no-scroll'); studentExams(); };
    }
    $('#tkSubmit', ov).onclick = () => submit(false);
  }

  /* ================================================================
     المحادثة
     ================================================================ */
  async function chat() {
    const el = bodyOf('chatTab');
    el.innerHTML = `<div class="chat">
      <aside class="chat-side"><div class="mod-toolbar"><button type="button" class="button" id="chNew"><i class="fas fa-pen"></i> محادثة جديدة</button></div><div id="chThreads" class="chat-threads"></div></aside>
      <section class="chat-main" id="chMain"><p class="empty-note">اختر محادثة.</p></section></div>
      ${PAGE === 'admin' ? '<div class="form-section"><h3>مراجعة المحادثات</h3><p class="muted">للإدارة فقط، لحماية الطلاب.</p><div class="controls"><select id="chRevA"><option value="">اختر مستخدماً</option></select><select id="chRevB"><option value="">مع</option></select></div><div id="chRevOut"></div></div>' : ''}`;
    let current = null, poll = null, contacts = null;
    async function threads() {
      const r = await api('getChatThreads');
      if (!r.success) return;
      $('#chThreads').innerHTML = r.threads.length ? r.threads.map(t => `<button type="button" class="chat-thread ${current === t.id ? 'on' : ''}" data-id="${esc(t.id)}" data-name="${esc(t.name)}">
        <b>${esc(t.name)}</b><small>${esc(t.role)}</small><span>${t.mine ? 'أنت: ' : ''}${esc(t.last)}</span>${t.unread ? `<i>${t.unread}</i>` : ''}</button>`).join('') : '<p class="empty-note">لا محادثات بعد.</p>';
      $$('.chat-thread').forEach(b => b.onclick = () => open(b.dataset.id, b.dataset.name));
    }
    async function open(id, name) {
      current = id;
      $$('.chat-thread').forEach(b => b.classList.toggle('on', b.dataset.id === id));
      const main = $('#chMain');
      main.innerHTML = `<div class="chat-head"><b>${esc(name)}</b></div><div class="chat-msgs" id="chMsgs"><p class="empty-note">جارِ التحميل…</p></div>
        <form class="chat-form" id="chForm"><textarea id="chText" rows="1" maxlength="1000" placeholder="اكتب رسالة…"></textarea><button type="submit" class="button btn-publish">إرسال</button></form>`;
      el.classList.add('chat-open');
      const load = async () => {
        const r = await api('getChatMessages', { partnerId: id });
        if (!r.success || current !== id) return;
        const box = $('#chMsgs'); if (!box) return;
        const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
        box.innerHTML = r.messages.length ? r.messages.map(m => `<div class="msg ${m.mine ? 'mine' : ''}"><p>${esc(m.body).replace(/\n/g, '<br>')}</p><small>${fmtDate(m.at)}${m.mine ? (m.read ? ' · ✓✓' : ' · ✓') : ''}</small></div>`).join('') : '<p class="empty-note">ابدأ المحادثة.</p>';
        if (atBottom || !load.done) box.scrollTop = box.scrollHeight;
        load.done = true;
      };
      await load(); threads();
      clearInterval(poll); poll = setInterval(() => { if (document.visibilityState === 'visible' && $('#chatTab').style.display !== 'none') load(); }, 15000);
      $('#chForm').onsubmit = async ev => {
        ev.preventDefault();
        const t = $('#chText'); const body = t.value.trim(); if (!body) return;
        t.disabled = true;
        const r = await api('sendChatMessage', { partnerId: id, body });
        t.disabled = false;
        if (r.success) { t.value = ''; await load(); threads(); } t.focus();
      };
      $('#chText').addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); $('#chForm').requestSubmit(); } });
    }
    $('#chNew').onclick = async () => {
      if (!contacts) { const r = await api('getChatContacts'); if (!r.success) return; contacts = r.contacts; }
      const ov = document.createElement('div'); ov.className = 'mod-overlay';
      ov.innerHTML = `<div class="mod-dialog"><h3>محادثة جديدة</h3><input type="text" id="ctQ" placeholder="ابحث بالاسم أو الصف"><div class="ct-list" id="ctList"></div><div class="mod-toolbar"><button type="button" class="button btn-ghost" data-n>إغلاق</button></div></div>`;
      document.body.appendChild(ov);
      const draw = () => { const q = $('#ctQ', ov).value.trim(); $('#ctList', ov).innerHTML = contacts.filter(c => !q || (c.name + c.cls + c.role).includes(q)).slice(0, 200).map(c => `<button type="button" data-id="${esc(c.id)}" data-name="${esc(c.name)}"><b>${esc(c.name)}</b><small>${esc(c.role)}${c.cls ? ' · ' + esc(c.cls) : ''}</small></button>`).join('') || '<p class="empty-note">لا نتائج.</p>'; };
      draw(); $('#ctQ', ov).oninput = draw; $('#ctQ', ov).focus();
      ov.onclick = ev => { const b = ev.target.closest('[data-id]'); if (b) { ov.remove(); open(b.dataset.id, b.dataset.name); } else if (ev.target.closest('[data-n]') || ev.target === ov) ov.remove(); };
    };
    window.__openChat = async (id) => {
      const t = await api('getChatThreads');
      let name = ((t.threads || []).find(x => x.id === id) || {}).name;
      if (!name) { if (!contacts) { const c = await api('getChatContacts'); contacts = c.contacts || []; } name = ((contacts || []).find(x => x.id === id) || {}).name || id; }
      open(id, name);
    };
    await threads();
    const d = window.__deepArg;
    if (d && d.tab === 'chatTab' && d.arg) { window.__deepArg = null; window.__openChat(d.arg); }
    if (PAGE === 'admin') {
      const r = await api('getAllUsers');
      if (r.success) $('#chRevA').innerHTML += r.users.map(u => `<option value="${esc(u.userId)}">${esc(u.fullName)} (${esc(u.role)})</option>`).join('');
      $('#chRevA').onchange = async () => { const x = await api('adminChatReview', { userA: $('#chRevA').value }); $('#chRevB').innerHTML = '<option value="">مع</option>' + (x.partners || []).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''); $('#chRevOut').innerHTML = x.partners && !x.partners.length ? '<p class="empty-note">لا محادثات لهذا المستخدم.</p>' : ''; };
      $('#chRevB').onchange = async () => { const x = await api('adminChatReview', { userA: $('#chRevA').value, userB: $('#chRevB').value }); $('#chRevOut').innerHTML = `<div class="chat-msgs review">${(x.messages || []).map(m => `<div class="msg ${m.fromId === $('#chRevA').value ? 'mine' : ''}"><b>${esc(m.from)}</b><p>${esc(m.body)}</p><small>${fmtDate(m.at)}</small></div>`).join('')}</div>`; };
    }
  }

  /* ================================================================
     السجل الدراسي
     ================================================================ */
  const GT = { Term1_Month1: 'ش1 ف1', Term1_Month2: 'ش2 ف1', Term1_Month3: 'ش3 ف1', Term1_Avg: 'معدل ف1', MidYear_Exam: 'نصف السنة', Term2_Month1: 'ش1 ف2', Term2_Month2: 'ش2 ف2', Term2_Month3: 'ش3 ف2', Term2_Avg: 'معدل ف2', Yearly_Effort: 'السعي', Final_Exam: 'النهائي', Final_Result: 'القرار' };
  async function record() {
    const el = bodyOf('recordTab');
    const r = await api('getRecordStudents');
    if (!r.success) { el.innerHTML = `<p class="empty-note">${esc(r.message)}</p>`; return; }
    const classes = Array.from(new Set(r.students.map(s => s.cls))).filter(Boolean);
    el.innerHTML = `<div class="controls"><select id="rcCls"><option value="">كل الصفوف</option>${classes.map(c => `<option>${esc(c)}</option>`).join('')}</select><input type="text" id="rcQ" placeholder="ابحث باسم الطالب"><select id="rcStu"></select><button type="button" class="button btn-publish" id="rcGo">عرض السجل</button></div><div id="rcOut"></div>`;
    const fill = () => { const c = $('#rcCls').value, q = $('#rcQ').value.trim(); $('#rcStu').innerHTML = r.students.filter(s => (!c || s.cls === c) && (!q || s.name.includes(q))).map(s => `<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.cls)} ${esc(s.section || '')}</option>`).join(''); };
    fill(); $('#rcCls').onchange = fill; $('#rcQ').oninput = fill;
    $('#rcGo').onclick = async () => {
      const x = await api('getStudentRecord', { studentId: $('#rcStu').value });
      if (!x.success) return;
      const s = x.student;
      const subjects = Array.from(new Set(x.grades.map(g => g.subject)));
      const types = Object.keys(GT).filter(t => x.grades.some(g => g.type === t));
      const years = Array.from(new Set(x.grades.map(g => g.year)));
      $('#rcOut').innerHTML = `<div class="record" id="recordPrint">
        <div class="rec-head"><div><h3>${esc(s.name)}</h3><p class="muted">${esc(s.cls)} ${esc(s.section)} · ${esc(s.id)} · ${esc(s.status)}</p></div><button type="button" class="button btn-ghost" id="rcPrint"><i class="fas fa-print"></i> طباعة</button></div>
        <div class="kv-grid">${[['ولي الأمر', s.guardian], ['هاتف ولي الأمر', s.guardianPhone], ['هاتف الطالب', s.studentPhone], ['اسم الأم', s.motherName], ['تاريخ الولادة', s.dob], ['العنوان', s.address], ['فصيلة الدم', s.bloodType], ['ملاحظات طبية', s.medical]].filter(k => k[1]).map(k => `<div><span>${k[0]}</span><b>${esc(k[1])}</b></div>`).join('')}</div>
        ${years.map(y => `<h4>الدرجات — ${esc(y)}</h4><div class="table-responsive"><table class="data-table"><thead><tr><th>المادة</th>${types.map(t => `<th>${GT[t]}</th>`).join('')}</tr></thead><tbody>${subjects.filter(sb => x.grades.some(g => g.year === y && g.subject === sb)).map(sb => `<tr><td class="g-name">${esc(sb)}</td>${types.map(t => { const g = x.grades.find(z => z.year === y && z.subject === sb && z.type === t); return `<td class="${g && +g.grade < 50 ? 'low' : ''}">${g ? esc(g.grade) : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`).join('') || '<p class="muted">لا درجات منشورة.</p>'}
        <h4>الغياب (${x.absences.length} يوم)</h4>${x.absences.length ? `<div class="chip-wrap">${x.absences.map(a => `<span class="st-chip ${a.status === 'منشور' ? 'bad' : 'mute'}">${esc(a.iso)}${a.notes ? ' · ' + esc(a.notes) : ''}</span>`).join('')}</div>` : '<p class="muted">لا غياب.</p>'}
        <h4>التقييم اليومي</h4>${x.evaluations.length ? x.evaluations.map(e => { const t = e.good + e.mid + e.weak || 1; return `<div class="ev-bar"><b>${esc(e.subject)}</b><span class="stack"><i class="ok" style="width:${e.good / t * 100}%"></i><i class="warn" style="width:${e.mid / t * 100}%"></i><i class="bad" style="width:${e.weak / t * 100}%"></i></span><small>${e.count} تقييم · جيد ${Math.round(e.good / t * 100)}%</small></div>`; }).join('') : '<p class="muted">لا تقييمات.</p>'}
        <h4>الامتحانات</h4>${x.exams.length ? `<div class="table-responsive"><table class="data-table"><thead><tr><th>الامتحان</th><th>المادة</th><th>الدرجة</th><th>التاريخ</th></tr></thead><tbody>${x.exams.map(e => `<tr><td>${esc(e.title)}</td><td>${esc(e.subject)}</td><td>${e.score}/${e.total}</td><td>${esc(e.iso)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">لا امتحانات.</p>'}
        ${x.objections.length ? `<h4>الاعتراضات</h4>${x.objections.map(o => `<p>${esc(o.iso)} · ${esc(o.subject)} · <span class="st-chip mute">${esc(o.status)}</span>${o.reply ? ' — ' + esc(o.reply) : ''}</p>`).join('')}` : ''}
      </div>`;
      $('#rcPrint').onclick = () => { let area = $('#printArea'); if (!area) { area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); } area.innerHTML = `<section class="print-doc">${$('#recordPrint').innerHTML}</section>`; setTimeout(() => window.print(), 200); };
    };
  }

  /* ================================================================
     الإحصائيات
     ================================================================ */
  async function stats() {
    const el = bodyOf('statsTab');
    const r = await api('getAdminStats');
    if (!r.success) { el.innerHTML = `<p class="empty-note">${esc(r.message)}</p>`; return; }
    const bar = (v, max, low) => v == null ? '—' : `<span class="pct-bar"><i style="width:${Math.min(100, v / max * 100)}%" class="${low ? 'low' : ''}"></i><b>${v}</b></span>`;
    el.innerHTML = `<div class="stat-tiles">${Object.keys(r.roles).map(k => `<div><span>${esc(k)}</span><b>${r.roles[k]}</b></div>`).join('')}<div><span>بانتظار المراجعة</span><b>${r.pending}</b></div></div>
      <div class="form-section"><h3>الصفوف</h3><div class="table-responsive"><table class="data-table"><thead><tr><th>الصف</th><th>الطلاب</th><th>غياب آخر 30 يوماً (لكل طالب)</th><th>معدل الدرجات المنشورة</th><th>معدل الامتحانات</th></tr></thead>
        <tbody>${r.classes.map(c => `<tr><td class="g-name">${esc(c.name)}</td><td>${c.students}</td><td>${bar(c.absencePerStudent, 5, c.absencePerStudent > 2)}</td><td>${bar(c.gradeAvg, 100, c.gradeAvg != null && c.gradeAvg < 60)}</td><td>${bar(c.examAvg, 100, c.examAvg != null && c.examAvg < 60)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="form-section"><h3>المواد (الأضعف أولاً)</h3>${r.subjects.length ? r.subjects.map(s => `<div class="ev-bar"><b>${esc(s.subject)}</b>${bar(s.avg, 100, s.avg < 60)}<small>راسبون ${s.failPct}% من ${s.n} درجة</small></div>`).join('') : '<p class="muted">لا درجات منشورة بعد.</p>'}</div>
      <div class="form-section"><h3>نشاط المدرسين آخر 7 أيام (الأقل أولاً)</h3><div class="table-responsive"><table class="data-table"><thead><tr><th>المدرس</th><th>درجات</th><th>غيابات</th><th>تقييمات</th><th>واجبات</th></tr></thead>
        <tbody>${r.teachers.map(t => `<tr class="${t.grades + t.absences + t.evals + t.homework === 0 ? 'row-warn' : ''}"><td class="g-name">${esc(t.name)}</td><td>${t.grades}</td><td>${t.absences}</td><td>${t.evals}</td><td>${t.homework}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  /* ================================================================
     الميزات والصلاحيات + إضافة مستخدم (المدير)
     ================================================================ */
  const PERMS = [['canRecordAbsence', 'تسجيل الغياب'], ['canUseMasterExcel', 'الإكسل الشامل'], ['canCreateExams', 'إنشاء الامتحانات'], ['canScanPaper', 'الامتحان الورقي والكاميرا'], ['canChat', 'المحادثة'], ['canViewRecords', 'السجل الدراسي']];
  async function perms() {
    const el = bodyOf('permsTab');
    const r = await api('getTeachersPermissions');
    if (!r.success) { el.innerHTML = `<p class="empty-note">${esc(r.message)}</p>`; return; }
    const st = window.academicStructure || {};
    el.innerHTML = `
      <div class="form-section"><h3>الميزات العامة</h3><p class="muted">الميزة المعطّلة لا تظهر لأي مستخدم، ويرفضها الخادم أيضاً.</p>
        <div class="feat-list">${Object.keys(r.featureNames).map(k => `<label class="feat"><span>${esc(r.featureNames[k].replace('ميزة: ', ''))}</span><span class="switch"><input type="checkbox" data-feat="${k}" ${r.features[k] ? 'checked' : ''}><span class="slider round"></span></span></label>`).join('')}</div></div>
      <div class="form-section"><h3>صلاحيات المدرسين</h3><p class="muted">تعمل الصلاحية فقط إذا كانت الميزة العامة مفعّلة.</p>
        <div class="table-responsive"><table class="data-table perm-table"><thead><tr><th>المدرس</th>${PERMS.map(p => `<th>${p[1]}</th>`).join('')}</tr></thead>
        <tbody>${r.teachers.map(t => `<tr><td class="g-name">${esc(t.name)}<small>${esc(t.id)}</small></td>${PERMS.map(p => `<td><input type="checkbox" class="perm-cb" data-u="${esc(t.id)}" data-p="${p[0]}" ${t.perms[p[0]] ? 'checked' : ''} aria-label="${esc(t.name)} ${p[1]}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="mod-toolbar">${PERMS.map(p => `<button type="button" class="link-btn" data-all="${p[0]}">منح «${p[1]}» للجميع</button>`).join('')}</div></div>
      <div class="form-section"><h3>إضافة مستخدم</h3>
        <div class="ex-grid">
          <label>الدور<select id="nuRole"><option>طالب</option><option>مدرس</option><option>ولي أمر</option><option>إداري</option></select></label>
          <label class="wide">الاسم الكامل<input type="text" id="nuName"></label>
          <label>البريد الإلكتروني<input type="email" id="nuEmail" dir="ltr"></label>
          <label>كلمة المرور (6 أحرف على الأقل)<input type="text" id="nuPass" dir="ltr"></label>
          <label class="nu-s">الصف<select id="nuCls">${(st.classes || []).map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
          <label class="nu-s">الشعبة<select id="nuSec"></select></label>
          <label class="nu-s">هاتف وليّ الأمر<input type="tel" id="nuGPhone" dir="ltr"></label>
          <label class="nu-p wide">أرقام الأبناء (مثال: S-001, S-014)<input type="text" id="nuKids" dir="ltr"></label>
        </div>
        <div class="mod-toolbar"><button type="button" class="button btn-publish" id="nuSave">إضافة الحساب</button><span class="muted" id="nuMsg"></span></div></div>`;
    $$('[data-feat]', el).forEach(c => c.onchange = async () => { const x = await api('updateSystemSettings', { [c.dataset.feat]: c.checked ? 'مفتوح' : 'مغلق' }); if (x.success) say(c.checked ? 'فُعّلت الميزة.' : 'عُطّلت الميزة.'); });
    el.addEventListener('change', async e => {
      const c = e.target.closest('.perm-cb'); if (!c) return;
      const x = await api('updateUserPermission', { userId: c.dataset.u, permission: c.dataset.p, value: c.checked });
      if (!x.success) c.checked = !c.checked;
    });
    $$('[data-all]', el).forEach(b => b.onclick = async () => {
      for (const c of $$(`.perm-cb[data-p="${b.dataset.all}"]`, el)) if (!c.checked) { c.checked = true; await api('updateUserPermission', { userId: c.dataset.u, permission: c.dataset.p, value: true }); }
      say('تم.');
    });
    const roleUI = () => { const r0 = $('#nuRole').value; $$('.nu-s', el).forEach(x => x.hidden = r0 !== 'طالب'); $$('.nu-p', el).forEach(x => x.hidden = r0 !== 'ولي أمر'); };
    const secs = () => { const c = $('#nuCls').value; $('#nuSec').innerHTML = ((st.classSections && st.classSections[c] && st.classSections[c].length ? st.classSections[c] : st.sections) || []).map(s => `<option>${esc(s)}</option>`).join(''); };
    roleUI(); secs(); $('#nuRole').onchange = roleUI; $('#nuCls').onchange = secs;
    $('#nuSave').onclick = async () => {
      const x = await api('createUser', { role: $('#nuRole').value, name: $('#nuName').value, email: $('#nuEmail').value, password: $('#nuPass').value, cls: $('#nuCls').value, section: $('#nuSec').value, guardianPhone: $('#nuGPhone').value, children: $('#nuKids').value });
      $('#nuMsg').textContent = x.message || '';
      if (x.success) ['#nuName', '#nuEmail', '#nuPass', '#nuGPhone', '#nuKids'].forEach(s => { $(s).value = ''; });
    };
  }

  /* ================================================================
     المكتبة: تصنيفات (المدرس يرسل، والمدير ينشر مباشرة)
     ================================================================ */
  const CATS = [['كتاب منهج', '📕'], ['ملزمة', '📄'], ['فيديو', '🎬'], ['رابط', '🔗']];
  function catSelect(id) { return `<select id="${id}" aria-label="التصنيف">${CATS.map(c => `<option value="${c[0]}">${c[1]} ${c[0]}</option>`).join('')}</select>`; }
  if (PAGE === 'teacher') {
    const f = $('#libraryForm .controls');
    if (f) f.insertAdjacentHTML('beforeend', catSelect('libCategory'));
  }
  async function libraryAdmin() {
    const el = bodyOf('libraryAdminTab');
    const st = window.academicStructure || {};
    el.innerHTML = `<p class="muted">ما يضيفه المدير يُنشر مباشرة دون مراجعة. للكتب الرسمية ضع رابط Google Drive للملف بصيغة PDF، وللفيديو رابط يوتيوب.</p>
      <div class="ex-grid"><label>الصف<select id="laCls"><option value="الكل">كل الصفوف</option>${(st.classes || []).map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label>المادة<select id="laSub">${(st.globalSubjects || []).map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
        <label>التصنيف${catSelect('libCategory')}</label>
        <label class="wide">العنوان<input type="text" id="laTitle" placeholder="مثال: كتاب الفيزياء للصف الأول المتوسط"></label>
        <label class="wide">الرابط<input type="url" id="laUrl" dir="ltr" placeholder="https://"></label>
        <label class="wide">وصف قصير<input type="text" id="laDesc"></label></div>
      <div class="mod-toolbar"><button type="button" class="button btn-publish" id="laSave">نشر في المكتبة</button><span class="muted" id="laMsg"></span></div>`;
    $('#laSave').onclick = async () => {
      const x = await api('addLibraryLink', { title: $('#laTitle').value, url: $('#laUrl').value, description: $('#laDesc').value, targetClass: $('#laCls').value, targetSubject: $('#laSub').value });
      $('#laMsg').textContent = x.message || '';
      if (x.success) ['#laTitle', '#laUrl', '#laDesc'].forEach(s => { $(s).value = ''; });
    };
  }
  // مكتبة الطالب: حسب التصنيف ثم المادة، مع صورة الفيديو
  const ytId = u => { const m = String(u).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; };
  window.renderLibrary = function (links) {
    const box = document.getElementById('libraryContainer'); if (!box) return;
    const list = (links || []).slice().sort((a, b) => String(b.iso || '').localeCompare(String(a.iso || '')));
    if (!list.length) { box.innerHTML = '<p class="empty-note">لا توجد مواد في المكتبة حالياً.</p>'; return; }
    box.classList.remove('card-container');
    box.innerHTML = CATS.filter(c => list.some(l => (l.category || 'رابط') === c[0])).map(c => `<h3 class="lib-cat">${c[1]} ${c[0]}</h3><div class="lib-grid">${list.filter(l => (l.category || 'رابط') === c[0]).map(l => {
      const yt = ytId(l.url);
      return `<a class="lib-item" href="${esc(l.url)}" target="_blank" rel="noopener">${yt ? `<img src="https://i.ytimg.com/vi/${yt}/mqdefault.jpg" alt="" loading="lazy">` : ''}<b>${esc(l.title)}</b><small>${esc(l.subject || '')}</small>${l.description ? `<span>${esc(l.description)}</span>` : ''}</a>`;
    }).join('')}</div>`).join('');
  };

  /* ---------------- المدير: اعتماد نتائج الامتحانات (في «قيد المراجعة») ---------------- */
  if (PAGE === 'admin') {
    const host = $('#pendingTab');
    if (host) {
      const sec = document.createElement('div');
      sec.className = 'form-section'; sec.id = 'pendingExams';
      sec.innerHTML = '<h3><i class="fas fa-file-signature"></i> 6. نتائج الامتحانات</h3><div class="pe-body"><p class="empty-note">جارِ التحميل…</p></div>';
      host.appendChild(sec);
      const load = async () => {
        const r = await api('getPendingExamResults');
        const b = $('.pe-body', sec);
        if (!r || !r.success) { b.innerHTML = '<p class="muted">لا توجد نتائج امتحانات بانتظار الاعتماد.</p>'; return; }
        b.innerHTML = r.items.length ? `<div class="table-responsive"><table class="data-table"><thead><tr><th>الامتحان</th><th>المادة</th><th>الصف</th><th>المدرس</th><th>التسجيل</th><th>سلّموا</th><th>المعدل</th><th>ناجحون</th><th></th></tr></thead><tbody>
          ${r.items.map(x => `<tr data-id="${esc(x.id)}"><td class="g-name">${esc(x.title)}</td><td>${esc(x.subject)}</td><td>${esc(x.cls)} ${x.section !== 'الكل' ? esc(x.section) : ''}</td><td>${esc(x.teacherName)}</td><td><span class="st-chip ${(x.settings.sendAs || {}).kind === 'monthly' ? 'warn' : 'ok'}">${esc(sendAsLabel(x.settings.sendAs).replace(/^ك/, ''))}</span></td><td>${x.submitted}</td><td>${x.avg == null ? '—' : x.avg + '%'}</td><td>${x.passed}</td>
            <td><div class="row-actions"><button type="button" class="button btn-approve" data-pe="approve">اعتماد ونشر للطلاب</button><button type="button" class="button btn-reject" data-pe="reject">إعادة للمدرس</button><button type="button" class="link-btn" data-pe="view">التفاصيل</button></div></td></tr>`).join('')}</tbody></table></div>`
          : '<p class="muted">لا توجد نتائج امتحانات بانتظار الاعتماد.</p>';
      };
      sec.addEventListener('click', async e => {
        const b = e.target.closest('[data-pe]'); if (!b) return;
        const id = b.closest('tr').dataset.id;
        if (b.dataset.pe === 'view') { showTab('examsTab'); setTimeout(() => examResults(id), 300); return; }
        const x = await api('handleExamResults', { examId: id, action: b.dataset.pe });
        if (x.success) { say(x.message); load(); }
      });
      document.addEventListener('DOMContentLoaded', () => setTimeout(load, 400));
      window.addEventListener('deeplink', ev => { if ((ev.detail || {}).tab === 'pendingTab') load(); });
    }
  }

  /* ---------------- الإعدادات: مفاتيح الدرجات فقط (الميزات لها تبويبها) ---------------- */
  if (PAGE === 'admin' && typeof window.loadSystemSettings === 'function') {
    window.loadSystemSettings = async function () {
      const r = await api('getSystemSettings');
      if (!r.success) return;
      const box = document.getElementById('settingsContainer');
      const keys = Object.keys(r.settings).filter(k => /_Status$/.test(k));
      box.innerHTML = `<p class="muted">الشهر المفتوح يظهر للمدرس للإدخال. الشهر المغلق يظهر للاطلاع فقط إن كانت فيه درجات.</p>` + keys.map(k => `<div class="setting-item"><label>${esc(r.settings[k].description)}</label><label class="switch"><input type="checkbox" data-key="${k}" ${r.settings[k].value === 'مفتوح' ? 'checked' : ''}><span class="slider round"></span></label></div>`).join('');
      $$('input[data-key]', box).forEach(t => t.onchange = () => api('updateSystemSettings', { [t.dataset.key]: t.checked ? 'مفتوح' : 'مغلق' }));
    };
  }
})();
