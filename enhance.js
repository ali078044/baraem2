/* تحسينات العرض الذكي: ترتيب حسب التاريخ، تجميع حسب المادة، إخفاء الأشهر المغلقة، سجل التقييمات.
   يُحمَّل بعد script.js ويستبدل دوال العرض فقط؛ منطق الحفظ والإرسال كما هو. */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const LOC = 'ar-IQ-u-nu-latn';
  const todayIso = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const daysAgo = iso => iso ? Math.round((new Date(todayIso()) - new Date(iso)) / 864e5) : 999;
  function dateLabel(iso, fallback) {
    if (!iso) return esc(fallback || '');
    const n = daysAgo(iso);
    const d = new Date(iso + 'T12:00:00');
    const full = DAY[d.getDay()] + ' ' + d.toLocaleDateString(LOC, { day: 'numeric', month: 'long', year: 'numeric' });
    if (n === 0) return 'اليوم · ' + full;
    if (n === 1) return 'أمس · ' + full;
    return full;
  }
  const byIsoDesc = (a, b) => String(b.iso || '').localeCompare(String(a.iso || ''));
  const LEVEL = v => v === 'جيد' ? 'ok' : v === 'متوسط' ? 'warn' : v === 'ضعيف' ? 'bad' : 'mute';
  const chip = (label, v) => `<span class="ev-chip ${LEVEL(v)}"><small>${label}</small>${esc(v || '—')}</span>`;
  const EV_FIELDS = [['prep', 'daily_prep', 'التحضير'], ['part', 'participation', 'المشاركة'], ['beh', 'behavior', 'السلوك'], ['hw', 'homework', 'الواجب']];
  const isNew = iso => daysAgo(iso) <= 2;

  /* ---------------- الطالب: التقييمات اليومية ---------------- */
  window.renderEvaluations = function (evaluations) {
    const box = document.getElementById('evaluationsContainer');
    if (!box) return;
    const list = (evaluations || []).slice().sort(byIsoDesc);
    if (!list.length) { box.innerHTML = '<p class="empty-note">لا توجد تقييمات منشورة لك بعد.</p>'; return; }
    const subjects = Array.from(new Set(list.map(e => e.subject))).sort((a, b) => a.localeCompare(b, 'ar'));
    const stat = subjects.map(s => {
      const vals = list.filter(e => e.subject === s).flatMap(e => EV_FIELDS.map(f => e[f[1]]).filter(Boolean));
      const good = vals.filter(v => v === 'جيد').length;
      return { s, pct: vals.length ? Math.round(good / vals.length * 100) : 0, n: list.filter(e => e.subject === s).length };
    });
    let current = '';
    const draw = () => {
      const shown = current ? list.filter(e => e.subject === current) : list;
      const groups = [];
      shown.forEach(e => { const g = groups[groups.length - 1]; if (g && g.iso === e.iso) g.items.push(e); else groups.push({ iso: e.iso, date: e.date, items: [e] }); });
      box.innerHTML = `
        <div class="ev-summary">${stat.map(x => `<button type="button" class="ev-sub ${current === x.s ? 'on' : ''}" data-s="${esc(x.s)}"><b>${esc(x.s)}</b><span>${x.pct}% جيد · ${x.n} تقييم</span><i style="width:${x.pct}%"></i></button>`).join('')}
          ${current ? '<button type="button" class="ev-clear" data-s="">عرض كل المواد</button>' : ''}</div>
        ${groups.map(g => `<section class="ev-day"><h4>${dateLabel(g.iso, g.date)}${isNew(g.iso) ? ' <span class="new-badge">جديد</span>' : ''}</h4>
          ${g.items.map(e => `<div class="ev-row"><div class="ev-subj">${esc(e.subject)}${e.teacher ? `<small>${esc(e.teacher)}</small>` : ''}</div>
            <div class="ev-chips">${EV_FIELDS.map(f => chip(f[2], e[f[1]])).join('')}</div>
            ${e.note ? `<p class="ev-note">${esc(e.note)}</p>` : ''}</div>`).join('')}</section>`).join('')}`;
      box.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { current = current === b.dataset.s ? '' : b.dataset.s; draw(); });
    };
    draw();
  };

  /* ---------------- الطالب: الواجبات الأحدث أولاً ---------------- */
  window.renderHomework = function (homework) {
    const box = document.getElementById('homeworkContainer');
    if (!box) return;
    const list = (homework || []).slice().sort(byIsoDesc);
    if (!list.length) { box.innerHTML = '<p class="empty-note">لا توجد واجبات حالياً.</p>'; return; }
    box.innerHTML = list.map(hw => `
      <div class="card hw-card ${isNew(hw.iso) ? 'is-new' : ''}">
        <div class="hw-head"><b>${esc(hw.subject)}</b>${isNew(hw.iso) ? '<span class="new-badge">جديد</span>' : ''}</div>
        <p>${esc(hw.content).replace(/\n/g, '<br>')}</p>
        <small>${dateLabel(hw.iso, hw.date)}${hw.teacher ? ' · ' + esc(hw.teacher) : ''}</small>
      </div>`).join('');
    list.forEach(hw => { if (hw.id && typeof callApi === 'function') callApi('trackItemView', { itemId: hw.id, itemType: 'homework' }); });
  };

  /* ---------------- الطالب: الغياب والمكتبة الأحدث أولاً ---------------- */
  window.renderAbsences = function (absences) {
    const box = document.getElementById('absencesContainer');
    if (!box) return;
    const list = (absences || []).slice().sort(byIsoDesc);
    if (!list.length) { box.innerHTML = '<p class="empty-note">لا توجد غيابات مسجلة لك. أحسنت!</p>'; return; }
    box.innerHTML = `<p class="count-line">مجموع أيام الغياب: <b>${list.length}</b></p>
      <div class="simple-list">${list.map(a => `<div><b>${dateLabel(a.iso, a.date)}</b><span>${esc(a.notes || 'بدون ملاحظات')}</span></div>`).join('')}</div>`;
  };
  const origLibrary = window.renderLibrary;
  window.renderLibrary = function (links) { return origLibrary((links || []).slice().sort(byIsoDesc)); };


  /* عدد أشهر الامتحان في كل فصل لكل صف (يحدده المدير من «الهيكلية والمهام») */
  function classMonths(cls) {
    const st = window.academicStructure || {};
    const v = st.classMonths && +st.classMonths[cls];
    return v >= 1 && v <= 3 ? v : 3;
  }
  window.classMonthsFor = classMonths;
  const origMapping = window.renderClassMapping;
  if (typeof origMapping === 'function') window.renderClassMapping = function () {
    origMapping.apply(this, arguments);
    const cls = document.getElementById('classMapperSelect').value;
    const box = document.getElementById('classMappingContainer');
    if (!cls || !box) return;
    const s = window.academicStructure; if (!s.classMonths) s.classMonths = {};
    let el = document.getElementById('classMonthsBox');
    if (!el) { el = document.createElement('div'); el.id = 'classMonthsBox'; el.className = 'months-box'; box.insertBefore(el, box.firstChild); }
    const cur = classMonths(cls);
    el.innerHTML = `<b>عدد الامتحانات الشهرية في كل فصل لهذا الصف:</b>
      ${[1, 2, 3].map(n => `<label><input type="radio" name="clsMonths" value="${n}" ${n === cur ? 'checked' : ''}> ${n === 1 ? 'شهر واحد' : n === 2 ? 'شهران' : 'ثلاثة أشهر'}</label>`).join('')}
      <span class="muted">الأشهر الزائدة لا تظهر للمدرس في إدخال الدرجات. اضغط «حفظ التغييرات على الهيكلية» بعدها.</span>`;
    el.querySelectorAll('input').forEach(r => r.onchange = () => { s.classMonths[cls] = +r.value; });
  };

  /* الطالب: كشف الدرجات يعرض فقط الأعمدة التي فيها درجات */
  window.renderGrades = function (grades) {
    const box = document.getElementById('gradesContainer');
    if (!box) return;
    if (!grades || !grades.length) { box.innerHTML = '<p class="empty-note">لا توجد درجات منشورة لك حالياً.</p>'; return; }
    const K = [['term1_month1', 'ش1', 1], ['term1_month2', 'ش2', 1], ['term1_month3', 'ش3', 1], ['term1_avg', 'معدل ف1', 1, 'avg'], ['midYear_exam', 'نصف السنة', 0, 'key'],
      ['term2_month1', 'ش1', 2], ['term2_month2', 'ش2', 2], ['term2_month3', 'ش3', 2], ['term2_avg', 'معدل ف2', 2, 'avg'], ['yearly_effort', 'السعي السنوي', 0, 'year'], ['final_exam', 'النهائي', 0, 'key'], ['final_result', 'الدرجة النهائية', 0, 'final']];
    const has = k => grades.some(g => g[k] !== '' && g[k] !== undefined && g[k] !== null);
    const cols = K.filter(k => has(k[0]));
    const cell = (v, k) => { const n = +v; const low = v !== '' && v !== undefined && !isNaN(n) && n < 50; return `<td class="${k[3] || ''} ${low ? 'low' : ''}">${v === undefined || v === '' ? '—' : esc(v)}</td>`; };
    box.innerHTML = `<div class="table-responsive"><table class="data-table grade-view"><thead><tr><th>المادة</th>${cols.map(k => `<th class="${k[3] || ''}">${esc(k[1])}${k[2] ? `<small>الفصل ${k[2] === 1 ? 'الأول' : 'الثاني'}</small>` : ''}</th>`).join('')}</tr></thead>
      <tbody>${grades.slice().sort((a, b) => String(a.subject).localeCompare(String(b.subject), 'ar')).map(g => `<tr><td class="g-name">${esc(g.subject)}</td>${cols.map(k => cell(g[k[0]], k)).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="muted">الدرجات الأقل من 50 بالأحمر.</p>`;
  };

  /* ---------------- المدرس: إدخال الدرجات ---------------- */
  const GRADE_COLS = [
    ['Term1_Month1', 'ش1', 'الفصل الأول'], ['Term1_Month2', 'ش2', 'الفصل الأول'], ['Term1_Month3', 'ش3', 'الفصل الأول'], ['Term1_Avg', 'السعي', 'الفصل الأول', 'avg'],
    ['MidYear_Exam', 'نصف السنة', '', 'key'],
    ['Term2_Month1', 'ش1', 'الفصل الثاني'], ['Term2_Month2', 'ش2', 'الفصل الثاني'], ['Term2_Month3', 'ش3', 'الفصل الثاني'], ['Term2_Avg', 'السعي', 'الفصل الثاني', 'avg'],
    ['Yearly_Effort', 'السعي السنوي', '', 'year'], ['Final_Exam', 'النهائي', '', 'key'], ['Final_Result', 'الدرجة النهائية', '', 'final']
  ];
  window.loadStudentsForGrading = async function () {
    const payload = {
      studentClass: document.getElementById('teacherClasses').value,
      studentSection: document.getElementById('teacherSections').value,
      subject: document.getElementById('teacherSubjects').value
    };
    if (!payload.studentClass || !payload.studentSection || !payload.subject) return alert('الرجاء اختيار الصف والشعبة والمادة.');
    const box = document.getElementById('studentsGradeContainer');
    const btn = document.getElementById('submitGradesBtn');
    box.innerHTML = '<p class="empty-note">جاري تحميل الطلاب…</p>';
    const result = await callApi('getStudentsForGrading', payload);
    if (!(result.success && result.students && result.students.length)) {
      box.innerHTML = `<p class="empty-note">${esc(result.message || 'لا يوجد طلاب في هذه الشعبة.')}</p>`; btn.style.display = 'none'; return;
    }
    const settings = result.settings || {};
    const open = c => !settings[c + '_Status'] || settings[c + '_Status'].value === 'مفتوح';
    const months = classMonths(payload.studentClass);
    const inClass = c => !/_Month([23])$/.test(c) || +c.slice(-1) <= months;
    const hasData = c => result.students.some(s => { const g = (result.grades[s.studentId] || {})[c]; return g && g.grade !== '' && g.grade !== undefined && g.grade !== null; });
    // يظهر العمود المفتوح للإدخال، والعمود المغلق الذي فيه درجات سابقة (للاطلاع فقط)
    const cols = GRADE_COLS.filter(c => inClass(c[0]) && (open(c[0]) || hasData(c[0]))).map(c => [c[0], c[1], c[2], c[3] || '', open(c[0])]);
    if (!cols.some(c => c[4])) {
      box.innerHTML = '<div class="info-note">لا يوجد شهر مفتوح للإدخال حالياً. تفتح الإدارة الأشهر من الإعدادات.</div>' + (cols.length ? '' : ''); btn.style.display = 'none';
      if (!cols.length) return;
    }
    const students = result.students.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
    const statusOf = g => { for (const c of cols) if (g[c[0]] && g[c[0]].status) return g[c[0]].status; return 'جديد'; };
    const stCls = s => s === 'منشور' ? 'ok' : s === 'بانتظار الموافقة' ? 'warn' : s === 'مرفوض' ? 'bad' : 'mute';
    box.innerHTML = `
      <div class="grade-meta"><span>${esc(payload.subject)} · ${esc(payload.studentClass)} / ${esc(payload.studentSection)}</span><span>${students.length} طالب</span>
        <span class="muted">مفتوح للإدخال: ${cols.filter(c => c[4]).map(c => esc((c[2] ? c[2] + ' ' : '') + c[1])).join('، ') || 'لا شيء'}${cols.some(c => !c[4]) ? ' · الأعمدة الرمادية 🔒 درجات سابقة للاطلاع فقط' : ''}</span></div>
      <div class="table-responsive grade-wrap"><table class="data-table grade-table">
        <thead><tr><th class="g-name">#</th><th class="g-name">اسم الطالب</th>${cols.map(c => `<th class="${c[3] || ''} ${c[4] ? '' : 'locked'}">${c[4] ? '' : '🔒 '}${esc(c[1])}${c[2] ? `<small>${esc(c[2])}</small>` : ''}</th>`).join('')}<th>الحالة</th></tr></thead>
        <tbody>${students.map((s, i) => {
          const g = result.grades[s.studentId] || {};
          const st = statusOf(g);
          return `<tr data-student-id="${esc(s.studentId)}"><td class="g-num">${i + 1}</td><td class="g-name">${esc(s.name)}</td>
            ${cols.map(c => c[4]
              ? `<td class="${c[3] || ''}"><input type="number" inputmode="numeric" min="0" max="100" class="grade-input" data-grade-type="${c[0]}" value="${esc(g[c[0]] && g[c[0]].grade !== undefined ? g[c[0]].grade : '')}" aria-label="${esc(s.name)} ${esc(c[1])}"></td>`
              : `<td class="${c[3] || ''} locked"><input type="number" class="grade-input" data-grade-type="${c[0]}" value="${esc(g[c[0]] && g[c[0]].grade !== undefined ? g[c[0]].grade : '')}" readonly tabindex="-1" aria-label="${esc(s.name)} ${esc(c[1])} (للاطلاع)"></td>`).join('')}
            <td><span class="st-chip ${stCls(st)}">${esc(st)}</span></td></tr>`;
        }).join('')}</tbody></table></div>`;
    btn.style.display = cols.some(c => c[4]) ? 'block' : 'none';
    box.querySelectorAll('.grade-input').forEach(inp => inp.addEventListener('input', () => {
      const v = inp.value.trim();
      inp.classList.toggle('bad-value', v !== '' && (isNaN(v) || +v < 0 || +v > 100));
    }));
    // Enter ينقل للطالب التالي في نفس العمود
    box.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !e.target.classList.contains('grade-input')) return;
      e.preventDefault();
      const type = e.target.dataset.gradeType;
      const next = e.target.closest('tr').nextElementSibling;
      const n = next && next.querySelector(`[data-grade-type="${type}"]`);
      if (n) { n.focus(); n.select(); }
    });
    if (typeof attachGradeCalculators === 'function') attachGradeCalculators();
  };

  /* ---------------- المدرس: الواجبات المرسلة الأحدث أولاً ---------------- */
  const origSent = window.loadTeacherSentHomework;
  window.loadTeacherSentHomework = async function () {
    await origSent();
    const box = document.getElementById('sentHomeworkContainer');
    const rows = box && box.querySelectorAll('tbody tr');
    if (rows && rows.length) rows[0].classList.add('row-new');
  };


  /* ---------------- المدرس: قوائم الصف والشعبة والمادة ---------------- */
  window.updateTeacherFilters = function (prefix) {
    const cs = document.getElementById(prefix + 'Classes');
    const ss = document.getElementById(prefix + 'Sections');
    const sb = document.getElementById(prefix + 'Subjects');
    const cls = cs ? cs.value : '';
    const asg = (window.teacherRawAssignments || []).filter(a => a.class === cls);
    resetResults(prefix);
    if (!cls) {
      if (ss) ss.innerHTML = '<option value="">-- اختر الصف أولاً --</option>';
      if (sb) sb.innerHTML = '<option value="">-- اختر الصف أولاً --</option>';
      return;
    }
    if (ss) {
      const st = window.academicStructure || {};
      let secs = asg.map(a => a.section).filter(s => s && s !== 'الكل');
      // إسناد «كل الشعب»: نأخذ شعب الصف من الهيكلية
      if (asg.some(a => !a.section || a.section === 'الكل')) secs = secs.concat((st.classSections && st.classSections[cls]) || []);
      secs = Array.from(new Set(secs)).sort((a, b) => String(a).localeCompare(String(b), 'ar'));
      ss.innerHTML = (secs.length > 1 || !secs.length ? '<option value="الكل">جميع الشعب</option>' : '') + secs.map(s => `<option value="${esc(s)}">الشعبة ${esc(s)}</option>`).join('');
    }
    if (sb) {
      const subs = Array.from(new Set(asg.map(a => a.subject)));
      sb.innerHTML = subs.length ? subs.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('') : '<option value="">لا توجد مواد مسندة</option>';
    }
  };

  // تغيير الصف أو الشعبة أو المادة أو التاريخ يمسح القائمة القديمة حتى لا تختلط الأسماء
  const RESULT_OF = {
    teacher: ['studentsGradeContainer', 'submitGradesBtn', 'اختر الصف والشعبة والمادة ثم «عرض الطلاب للتقييم».'],
    absence: ['studentsForAbsenceContainer', 'submitAbsencesBtn', 'اختر الصف والشعبة والتاريخ ثم «عرض الطلاب».'],
    eval: ['studentsForEvalContainer', 'submitEvaluationsBtn', 'اختر الصف والشعبة والمادة ثم «عرض الطلاب».']
  };
  function resetResults(prefix) {
    const r = RESULT_OF[prefix];
    if (!r) return;
    const box = document.getElementById(r[0]), btn = document.getElementById(r[1]);
    if (box) box.innerHTML = `<p class="empty-note">${r[2]}</p>`;
    if (btn) btn.style.display = 'none';
  }
  document.addEventListener('change', e => {
    const id = e.target && e.target.id || '';
    const m = id.match(/^(teacher|absence|eval)(Sections|Subjects|Date)$/);
    if (m) resetResults(m[1]);
  });

  /* ---------------- المدرس: جدولي الأسبوعي مع تمييز حصصي ---------------- */
  window.renderTeacherWeeklySchedules = function (schedules) {
    const box = document.getElementById('teacherScheduleContainer');
    if (!box) return;
    if (!schedules || !schedules.length) { box.innerHTML = '<p class="empty-note">لم تُنشر جداول للصفوف المسندة إليك بعد.</p>'; return; }
    const asg = window.teacherRawAssignments || [];
    const mine = (cls, sec, subj) => !!subj && asg.some(a => a.class === cls && (!a.section || a.section === 'الكل' || a.section === sec) && a.subject === subj);
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const today = DAY[new Date().getDay()];
    let total = 0;
    const perDay = {};
    const html = schedules.map(s => {
      let n = 0;
      const rows = days.map(d => {
        const cells = [1, 2, 3, 4, 5, 6].map(i => {
          const subj = (s.scheduleData && s.scheduleData[d] && s.scheduleData[d]['lesson' + i]) || '';
          const my = mine(s.targetClass, s.targetSection, subj);
          if (my) { n++; (perDay[d] = perDay[d] || []).push({ i, cls: s.targetClass, sec: s.targetSection, subj }); }
          return `<td class="${my ? 'my-subject' : ''}">${esc(subj)}</td>`;
        }).join('');
        return `<tr class="${d === today ? 'is-today' : ''}"><td><strong>${d}</strong>${d === today ? '<small>اليوم</small>' : ''}</td>${cells}</tr>`;
      }).join('');
      total += n;
      return `<div class="form-section"><h3>${esc(s.targetClass)} — الشعبة ${esc(s.targetSection)} <span class="st-chip ok">${n} حصة لك</span></h3>
        <div class="table-responsive"><table class="data-table weekly-schedule-table"><thead><tr><th>اليوم</th>${[1, 2, 3, 4, 5, 6].map(i => `<th>الدرس ${i}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
    }).join('');
    const todayList = (perDay[today] || []).sort((a, b) => a.i - b.i);
    box.innerHTML = `<div class="my-week"><div><b>${total}</b><span>حصة أسبوعياً</span></div>
        <div class="my-today"><b>حصصك اليوم:</b> ${todayList.length ? todayList.map(x => `<span class="st-chip ok">الدرس ${x.i}: ${esc(x.subj)} · ${esc(x.cls)} ${esc(x.sec)}</span>`).join(' ') : '<span class="muted">لا حصص لك اليوم</span>'}</div>
        <div class="legend"><i></i> الخانات الملوّنة حصصك</div></div>` + html;
  };

  /* ---------------- سجل التقييمات (المدرس والإدارة) ---------------- */
  function mountEvalLog(host, isAdmin) {
    const sec = document.createElement('div');
    sec.className = 'form-section eval-log';
    const from = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    sec.innerHTML = `<h3><i class="fas fa-history"></i> ${isAdmin ? 'سجل التقييمات اليومية' : 'سجل تقييماتي'}</h3>
      <p class="muted">مرتبة من الأحدث، ومجمّعة حسب اليوم ثم المادة والشعبة.</p>
      <div class="controls">
        ${isAdmin ? '<select id="elTeacher"><option value="">كل المدرسين</option></select>' : ''}
        <select id="elSubject"><option value="">كل المواد</option></select>
        <select id="elClass"><option value="">كل الصفوف</option></select>
        <input type="date" id="elFrom" value="${from}" aria-label="من تاريخ">
        <input type="date" id="elTo" value="${todayIso()}" aria-label="إلى تاريخ">
        <button type="button" class="button btn-publish" id="elLoad">عرض السجل</button>
      </div>
      <div id="elOut"><p class="empty-note">اضغط «عرض السجل».</p></div>`;
    host.appendChild(sec);
    let filled = false;
    const fill = (id, vals) => { const s = sec.querySelector('#' + id); const cur = s.value; s.innerHTML = s.options[0].outerHTML + vals.map(v => `<option value="${esc(v.id || v)}">${esc(v.name || v)}</option>`).join(''); s.value = cur; };
    sec.querySelector('#elLoad').onclick = async () => {
      const out = sec.querySelector('#elOut');
      out.innerHTML = '<p class="empty-note">جاري التحميل…</p>';
      const p = { subject: sec.querySelector('#elSubject').value, studentClass: sec.querySelector('#elClass').value, from: sec.querySelector('#elFrom').value, to: sec.querySelector('#elTo').value };
      if (isAdmin) p.teacherId = sec.querySelector('#elTeacher').value;
      const r = await callApi('getEvaluationsLog', p);
      if (!r.success) { out.innerHTML = `<p class="empty-note">${esc(r.message)}</p>`; return; }
      if (!filled || !p.subject && !p.studentClass) {
        fill('elSubject', Array.from(new Set(r.items.map(i => i.subject))).sort((a, b) => a.localeCompare(b, 'ar')));
        fill('elClass', Array.from(new Set(r.items.map(i => i.studentClass).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar')));
        if (isAdmin) fill('elTeacher', r.teachers || []);
        filled = true;
      }
      if (!r.items.length) { out.innerHTML = '<p class="empty-note">لا توجد تقييمات في هذه الفترة.</p>'; return; }
      const groups = {};
      const order = [];
      r.items.forEach(i => { const k = i.iso + '|' + i.subject + '|' + i.studentClass + '|' + i.studentSection + (isAdmin ? '|' + i.teacher : ''); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(i); });
      let lastDay = '';
      out.innerHTML = (r.truncated ? '<p class="info-note">النتائج كثيرة، تظهر أحدث 2000. ضيّق الفترة.</p>' : '') + order.map(k => {
        const items = groups[k], f = items[0];
        const dayHead = f.iso !== lastDay ? `<h4 class="el-day">${dateLabel(f.iso)}</h4>` : '';
        lastDay = f.iso;
        const pending = items.filter(i => i.status === 'بانتظار الموافقة').length;
        return dayHead + `<details class="el-group" ${order.indexOf(k) < 3 ? 'open' : ''}><summary><b>${esc(f.subject)}</b><span>${esc(f.studentClass)} / ${esc(f.studentSection)}</span>${isAdmin ? `<span>${esc(f.teacher)}</span>` : ''}<span class="muted">${items.length} طالب</span>${pending ? `<span class="st-chip warn">${pending} بانتظار الموافقة</span>` : ''}</summary>
          <div class="table-responsive"><table class="data-table"><thead><tr><th>الطالب</th>${EV_FIELDS.map(x => `<th>${x[2]}</th>`).join('')}<th>ملاحظة</th><th>الحالة</th></tr></thead>
          <tbody>${items.map(i => `<tr><td class="g-name">${esc(i.studentName)}</td>${EV_FIELDS.map(x => `<td><span class="ev-dot ${LEVEL(i[x[0]])}">${esc(i[x[0]] || '—')}</span></td>`).join('')}<td>${esc(i.note || '')}</td><td><span class="st-chip ${i.status === 'منشور' ? 'ok' : i.status === 'مرفوض' ? 'bad' : 'warn'}">${esc(i.status)}</span></td></tr>`).join('')}</tbody></table></div></details>`;
      }).join('');
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const tEval = document.querySelector('.teacher-page #evaluationsTab');
    if (tEval) mountEvalLog(tEval, false);
    const aRep = document.querySelector('.admin-page #reportsTab');
    if (aRep) mountEvalLog(aRep, true);
  });
})();
