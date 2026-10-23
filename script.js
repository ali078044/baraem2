// ==========================================================
//                     الإعدادات الرئيسية
// ==========================================================
// !!! تنبيه هام: هذا هو رابط النشر الجديد الذي زودتني به
const API_URL = 'https://script.google.com/macros/s/AKfycbx8xsJMMZe5bEDo7-bq9AzuzLW1dgJc2EsdJhdmWA80iYVwsvgSxYsoLplKBgx_w0hf/exec'; 

// ==========================================================
//                   دوال الأمان (جديد)
// ==========================================================
// دالة لتشفير كلمة المرور في متصفح المستخدم قبل إرسالها للخادم
async function hashPassword(password) {
    if (!(window.crypto && crypto.subtle)) return sha256Fallback(password);
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// (جديد) بديل SHA-256 للمتصفحات التي لا توفّر crypto.subtle (مثلاً عند الفتح عبر http)
function sha256Fallback(str) {
    const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const bytes = unescape(encodeURIComponent(str)).split('').map(c => c.charCodeAt(0));
    const l = bytes.length * 8; bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (l >>> (i * 8)) & 0xff);
    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < bytes.length; i += 64) {
        const w = [];
        for (let j = 0; j < 16; j++) w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
        for (let j = 16; j < 64; j++) { const s0 = r(w[j - 15], 7) ^ r(w[j - 15], 18) ^ (w[j - 15] >>> 3), s1 = r(w[j - 2], 17) ^ r(w[j - 2], 19) ^ (w[j - 2] >>> 10); w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0; }
        let [a, b, c, d, e, f, g, h] = H;
        for (let j = 0; j < 64; j++) {
            const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
            const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        H = H.map((v, k) => (v + [a, b, c, d, e, f, g, h][k]) | 0);
    }
    return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

// (جديد) تعريف أسماء الصفحات لمطابقة الخادم
const SHEETS = {
  USERS: 'المستخدمون',
  GRADES: 'الدرجات_2025_2026',
  GRADES_ARCHIVE: 'أرشيف_الدرجات',
  ABSENCES: 'الغيابات',
  ANNOUNCEMENTS: 'الاخبار',
  SETTINGS: 'إعدادات_النظام',
  HOMEWORK: 'الواجبات',
  DAILY_EVALUATIONS: 'التقييمات_اليومية',
  LIBRARY: 'المكتبة_الرقمية',
  EXAM_SCHEDULES: 'جداول_الامتحانات',
  WEEKLY_SCHEDULES: 'الجداول_الأسبوعية',
  TEACHER_ASSIGNMENTS: 'TeacherAssignments'
};

// ==========================================================
//                   تحسين التنبيهات (SweetAlert2)
// ==========================================================
const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
    .swal2-popup { font-family: 'Tajawal', sans-serif !important; }
    .swal2-title { font-size: 1.5em !important; }
`;
document.head.appendChild(swalStyle);

window.alert = function(message) {
    message = String(message == null ? '' : message);
    // (إصلاح) صفحة الدخول لا تحمّل SweetAlert؛ كان هذا يُسقط الدخول ويُبقي الزر على «جاري التحقق» للأبد
    if (typeof Swal === 'undefined') {
        if (typeof window.toast === 'function') window.toast(message, /خطأ|فشل|غير صحيح|تعذّر|لم يتم/.test(message));
        else console.warn(message);
        return;
    }
    let iconType = 'success';
    let titleText = 'نجاح';
    let btnColor = '#28a745';

    if (message.includes('خطأ') || message.includes('فشل') || message.includes('الرجاء') || message.includes('غير صحيح') || message.includes('لم يتم') || message.includes('لا يوجد')) {
        iconType = 'error';
        titleText = 'تنبيه';
        btnColor = '#dc3545'; 
    }

    Swal.fire({
        title: titleText,
        text: message,
        icon: iconType,
        confirmButtonText: 'موافق',
        confirmButtonColor: btnColor,
        backdrop: `rgba(0,0,0,0.4)`
    });
};

// ==========================================================
//                   دالة مساعدة للتواصل مع API
// ==========================================================
async function callApi(action, payload = {}) {
    const userInfo = JSON.parse(localStorage.getItem('userData'));
    try {
        document.body.style.cursor = 'wait';
        const ctrl = new AbortController();
        const killer = setTimeout(() => ctrl.abort(), action === 'login' ? 25000 : 45000);
        const res = await fetch(API_URL, {
            signal: ctrl.signal,
            method: 'POST',
            cache: 'no-cache',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, payload, userInfo })
        });
        clearTimeout(killer);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const result = await res.json();
        // (جديد) الخادم يرفض الجلسات المنتهية؛ نعيد المستخدم لتسجيل الدخول
        if (result && result.code === 'AUTH' && action !== 'login') {
            localStorage.removeItem('userData');
            alert('انتهت الجلسة، سجّل الدخول مجدداً.');
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            return result;
        }
        if (!result.success) {
          console.error("API Error Response:", result.message, result.stack);
          if (!['getWeeklySchedule', 'getExistingEvaluations', 'getUniqueClassesAndSubjects', 'getUserDetails', 'getSmartTimetableVersions', 'trackItemView', 'getNotifications', 'markNotificationsRead', 'registerPushToken', 'unregisterPushToken', 'logout'].includes(action)) { 
            alert(`خطأ من الخادم: ${result.message || 'حدث خطأ غير متوقع.'}`);
          }
        }
        return result;
    } catch (error) {
        console.error('API Call Error:', action, error);
        const msg = error.name === 'AbortError' ? 'الخادم تأخر في الرد. تأكد من الإنترنت وحاول مرة أخرى.' : 'تعذّر الاتصال بالخادم. تأكد من الإنترنت وحاول مرة أخرى.';
        if (action !== 'login') alert(msg);
        return { success: false, message: msg, network: true };
    } finally {
        document.body.style.cursor = 'default';
    }
}

// ==========================================================
//                   الموجه الرئيسي والتوابع العامة
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('StudentInterface.html')) { handleStudentPage(); }
    else if (path.includes('TeacherInterface.html')) { handleTeacherPage(); }
    else if (path.includes('AdminInterface.html')) { handleAdminPage(); }
    else { handleLoginPage(); }
});

function handleLoginPage() {
    // (ميزة تذكرني): إذا كان المستخدم مسجلاً مسبقاً، سيتم توجيهه مباشرة للوحة دون الحاجة لكتابة الباسورد
    const savedUser = JSON.parse(localStorage.getItem('userData'));
    if (savedUser && savedUser.role) {
        switch(savedUser.role) {
            case 'إداري': window.location.href = 'AdminInterface.html'; return;
            case 'مدرس': window.location.href = 'TeacherInterface.html'; return;
            case 'طالب': window.location.href = 'StudentInterface.html'; return;
            case 'ولي أمر': window.location.href = 'StudentInterface.html'; return;
        }
    }

    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const messageEl = document.getElementById('message');
        const setMsg = (t) => { messageEl.textContent = t; messageEl.style.color = t ? '#b3261e' : ''; };
        if (!email || !password) { setMsg('اكتب البريد الإلكتروني وكلمة المرور.'); return; }
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
        setMsg('');
        try {
            const hashedPassword = await hashPassword(password);
            const result = await callApi('login', { email, password: hashedPassword });
            if (result.success) {
                localStorage.setItem('userData', JSON.stringify(result.user));
                const page = { 'إداري': 'AdminInterface.html', 'مدرس': 'TeacherInterface.html', 'طالب': 'StudentInterface.html', 'ولي أمر': 'StudentInterface.html' }[result.user.role];
                if (page) { submitBtn.innerHTML = 'تم ✓ جارِ الفتح…'; window.location.href = page; return; }
                setMsg('دور المستخدم غير معروف. راجع إدارة المدرسة.');
            } else {
                // رسالة واضحة: كلمة مرور خاطئة، أو حساب غير نشط، أو محاولات كثيرة، أو مشكلة اتصال
                setMsg(result.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
                const pw = document.getElementById('password'); pw.value = ''; pw.focus();
            }
        } catch (err) {
            console.error(err);
            setMsg('حدث خطأ غير متوقع. حدّث الصفحة وحاول مرة أخرى.');
        } finally {
            if (!submitBtn.innerHTML.includes('✓')) { submitBtn.disabled = false; submitBtn.innerHTML = 'تسجيل الدخول'; }
        }
    });
}

function setupCommonElements() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'index.html';
        return null;
    }
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        if (document.body.classList.contains('student-page')) {
            userNameEl.textContent = `الطالب ${userData.name}`;
        } else if (document.body.classList.contains('teacher-page')) {
            userNameEl.textContent = `الأستاذ ${userData.name}`;
        } else {
            userNameEl.textContent = `${userData.name}`;
        }
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
        // (جديد) إلغاء الجلسة في الخادم أيضاً، حتى لا يبقى الرمز صالحاً على هذا الجهاز
        try {
            const pushToken = localStorage.getItem('pushToken');
            if (pushToken) await callApi('unregisterPushToken', { token: pushToken });
            localStorage.removeItem('pushToken');
            await callApi('logout');
        } catch (e) {}
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });
    return userData;
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    const activeButton = document.querySelector(`[onclick="showTab('${tabId}')"]`);
    if(activeButton) activeButton.classList.add('active');
}

function populateSelect(selectId, options, defaultOptionText = '-- اختر --') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">${defaultOptionText}</option>` + (options || []).map(o => `<option value="${o}">${o}</option>`).join('');
}

async function loadAndCheckProfile() {
    const res = await callApi('getMyProfile');
    if (res.success) {
        const p = res.profile;
        
        if(document.getElementById('profFullName')) document.getElementById('profFullName').value = p.fullName || '';
        if(document.getElementById('profMotherName')) document.getElementById('profMotherName').value = p.motherName || '';
        if(document.getElementById('profStudentPhone')) document.getElementById('profStudentPhone').value = p.studentPhone || '';
        if(document.getElementById('profGuardianPhone')) document.getElementById('profGuardianPhone').value = p.guardianPhone || '';
        if(document.getElementById('profAddress')) document.getElementById('profAddress').value = p.address || '';
        if(document.getElementById('profDOB')) document.getElementById('profDOB').value = p.dob || '';
        if(document.getElementById('profBloodType')) document.getElementById('profBloodType').value = p.bloodType || '';
        if(document.getElementById('profTelegramId')) document.getElementById('profTelegramId').value = p.telegramId || '';
        if(document.getElementById('profMedical')) document.getElementById('profMedical').value = p.medicalNotes || '';
        
        if (p.profilePic) {
            document.getElementById('profilePreview').src = p.profilePic;
        }

        const banner = document.getElementById('profileAlertBanner');
        if (banner) {
            if (!p.motherName || !p.address || !p.profilePic) {
                banner.style.display = 'flex';
            } else {
                banner.style.display = 'none';
            }
        }
    }
}

// ==========================================================
//                 واجهة الجدول الذكي الآلي
// ==========================================================

let allTeacherConstraints = [];
let generatedScheduleResult = null;

// يتم استدعاؤها من داخل handleAdminPage لإعداد القوائم
async function initSmartTimetable() {
    const resUsers = await callApi('getAllUsers');
    if (resUsers.success) {
        const teachers = resUsers.users.filter(u => u.role === 'مدرس');
        const select = document.getElementById('stTeacherSelect');
        if (select) {
            select.innerHTML = '<option value="">-- اختر المدرس لتحديد أوقاته --</option>' + 
                               teachers.map(t => `<option value="${t.userId}">${t.fullName}</option>`).join('');
        }
    }

    const resCons = await callApi('getTeacherConstraints');
    if (resCons.success) {
        allTeacherConstraints = resCons.constraints;
    }

    // بناء شبكة الأيام
    const daysGrid = document.getElementById('stDaysGrid');
    if (daysGrid) {
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        let html = '';
        days.forEach(day => {
            html += `<div style="display: flex; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                        <strong style="width: 80px;">${day}:</strong>
                        <div style="display: flex; gap: 10px;">
                            ${[1,2,3,4,5,6].map(p => `<label><input type="checkbox" class="st-period-cb" data-day="${day}" value="${p}"> د${p}</label>`).join('')}
                        </div>
                     </div>`;
        });
        daysGrid.innerHTML = html;
    }

    // تعبئة فلتر عرض الجدول المولد
    if (window.academicStructure && window.academicStructure.classes) {
        populateSelect('stClassFilter', window.academicStructure.classes, '-- اختر الصف لعرض جدوله --');
    }
}

// دالة لجلب قيود المدرس عند اختياره
function loadSpecificTeacherConstraints() {
    const tId = document.getElementById('stTeacherSelect').value;
    const container = document.getElementById('stAvailabilityContainer');
    if (!tId) { container.style.display = 'none'; return; }
    
    container.style.display = 'block';
    const tData = allTeacherConstraints.find(c => c.teacherId === tId);
    
    document.getElementById('stMaxPeriods').value = tData ? tData.maxPeriods : 20;
    
    // الافتراضي (إذا لم يتم التحديد مسبقاً) هو أن جميع الأيام والدروس متاحة (checked)
    document.querySelectorAll('.st-period-cb').forEach(cb => {
        const day = cb.dataset.day;
        const period = parseInt(cb.value);
        if (tData && tData.availability[day]) {
            cb.checked = tData.availability[day].includes(period);
        } else {
            cb.checked = true; 
        }
    });
}

// دالة لحفظ القيود
async function saveSTConstraints() {
    const tId = document.getElementById('stTeacherSelect').value;
    if (!tId) return;

    Swal.fire({ title: 'جاري الحفظ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    let availability = {};
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    days.forEach(d => availability[d] = []);

    document.querySelectorAll('.st-period-cb:checked').forEach(cb => {
        availability[cb.dataset.day].push(parseInt(cb.value));
    });

    const payload = {
        teacherId: tId,
        maxPeriods: parseInt(document.getElementById('stMaxPeriods').value),
        availability: availability
    };

    const res = await callApi('saveTeacherConstraints', payload);
    if (res.success) {
        Swal.fire('نجاح', res.message, 'success');
        // تحديث المصفوفة المحلية لتجنب إعادة التحميل
        const idx = allTeacherConstraints.findIndex(c => c.teacherId === tId);
        if (idx > -1) { allTeacherConstraints[idx] = { ...payload, teacherName: allTeacherConstraints[idx].teacherName }; }
        else { allTeacherConstraints.push(payload); }
    }
}

// ==========================================================
//        محرك الجدول الذكي - الواجهة الشاملة (Matrix)
// ==========================================================

let globalTimetableData = null; 
let globalTeacherQuotas = {}; // { teacherId: { name, max, count } }
let selectedCellForSwap = null; // للاحتفاظ بالخلية المحددة للتبديل

// 1. توليد الجدول
async function generateSmartTimetableUI() {
    Swal.fire({ title: 'جاري التحليل وبناء الجدول الشامل...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    
    const res = await callApi('generateSmartTimetable');
    if (res.success) {
        globalTimetableData = res.schedule;
        
        // تجهيز بيانات النصاب مبدئياً
        globalTeacherQuotas = {};
        allTeacherConstraints.forEach(c => {
            globalTeacherQuotas[c.teacherId] = { name: c.teacherName, max: c.maxPeriods, count: 0 };
        });

        Swal.fire('تم التوليد!', 'تم بناء الجدول الشامل. يمكنك الآن التعديل والتبديل بين الحصص بالضغط عليها.', 'success');
        renderTimetableMatrix();
    } else {
        Swal.fire('خطأ', res.message, 'error');
    }
}

// 2. رسم الجدول الشامل (Matrix)
function renderTimetableMatrix() {
    const container = document.getElementById('stGeneratedTimetableContainer');
    if (!globalTimetableData) return;

    // استخراج جميع الشعب المشاركة لبناء الأعمدة
    const classKeys = Object.keys(globalTimetableData).sort(); 
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    let html = `<table class="matrix-table" id="masterTimetableElement">
                    <thead>
                        <tr>
                            <th style="width: 120px;">اليوم / الدرس</th>`;
    
    classKeys.forEach(ck => { html += `<th>${ck.replace('-', ' ')}</th>`; });
    html += `           </tr>
                    </thead>
                    <tbody>`;

    days.forEach(day => {
        // سطر عنوان اليوم (مدمج عبر كل الأعمدة)
        html += `<tr><td class="day-row-header" colspan="${classKeys.length + 1}">${day}</td></tr>`;
        
        for (let period = 1; period <= 6; period++) {
            html += `<tr>
                        <td class="period-col-header">الدرس ${period}</td>`;
            
            classKeys.forEach(ck => {
                const lessonData = globalTimetableData[ck][day] ? globalTimetableData[ck][day][`lesson${period}`] : null;
                const cellId = `${ck}|${day}|lesson${period}`;
                
                if (lessonData) {
                    html += `<td id="${cellId}" 
                                 onclick="handleTimetableCellClick('${ck}', '${day}', 'lesson${period}')"
                                 data-teacher-id="${lessonData.teacherId}">
                                <span class="subject-name">${lessonData.subject}</span><br>
                                <span class="teacher-name">${lessonData.teacherName}</span>
                             </td>`;
                } else {
                    html += `<td id="${cellId}" onclick="handleTimetableCellClick('${ck}', '${day}', 'lesson${period}')" data-teacher-id="">
                                <span style="color:#ccc;">فارغ</span>
                             </td>`;
                }
            });
            html += `</tr>`;
        }
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    
    // إظهار عنوان الطباعة
    document.querySelector('.print-title').style.display = 'block';

    // بعد الرسم، نفحص التضارب ونحدث النصاب
    checkConflictsAndUpdateQuota();
}

// 3. التبديل التفاعلي بين الخلايا
function handleTimetableCellClick(classKey, day, lesson) {
    const cellId = `${classKey}|${day}|${lesson}`;
    const tdElement = document.getElementById(cellId);

    if (!selectedCellForSwap) {
        // التحديد الأول
        selectedCellForSwap = { classKey, day, lesson, element: tdElement };
        tdElement.classList.add('selected');
    } else {
        // التحديد الثاني (عملية التبديل)
        if (selectedCellForSwap.classKey === classKey && selectedCellForSwap.day === day && selectedCellForSwap.lesson === lesson) {
            // إلغاء التحديد إذا ضغط على نفس الخلية
            tdElement.classList.remove('selected');
            selectedCellForSwap = null;
            return;
        }

        // تبديل البيانات في الكائن البرمجي
        const val1 = globalTimetableData[selectedCellForSwap.classKey][selectedCellForSwap.day][selectedCellForSwap.lesson];
        const val2 = globalTimetableData[classKey][day][lesson];

        globalTimetableData[selectedCellForSwap.classKey][selectedCellForSwap.day][selectedCellForSwap.lesson] = val2;
        globalTimetableData[classKey][day][lesson] = val1;

        // إعادة رسم الجدول بالكامل بعد التبديل لضمان الدقة
        selectedCellForSwap = null;
        renderTimetableMatrix();
    }
}

// 4. كشف التضارب وتحديث تقرير النصاب
function checkConflictsAndUpdateQuota() {
    let hasConflict = false;
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const classKeys = Object.keys(globalTimetableData);
    
    // تصفير عدادات النصاب
    for (let tId in globalTeacherQuotas) { globalTeacherQuotas[tId].count = 0; }

    // إزالة التلوين الأحمر السابق
    document.querySelectorAll('.matrix-table td.conflict').forEach(td => td.classList.remove('conflict'));

    days.forEach(day => {
        for (let period = 1; period <= 6; period++) {
            const teachersInThisPeriod = {}; // { teacherId: [cellId1, cellId2] }

            classKeys.forEach(ck => {
                const lesson = globalTimetableData[ck][day][`lesson${period}`];
                if (lesson && lesson.teacherId) {
                    // تحديث النصاب
                    if (globalTeacherQuotas[lesson.teacherId]) {
                        globalTeacherQuotas[lesson.teacherId].count++;
                    } else {
                        // إذا كان المدرس غير موجود في القيود، نضيفه مبدئياً
                        globalTeacherQuotas[lesson.teacherId] = { name: lesson.teacherName, max: 20, count: 1 };
                    }

                    // فحص التضارب الأفقي (نفس الدرس في نفس اليوم لصفوف مختلفة)
                    if (!teachersInThisPeriod[lesson.teacherId]) {
                        teachersInThisPeriod[lesson.teacherId] = [];
                    }
                    teachersInThisPeriod[lesson.teacherId].push(`${ck}|${day}|lesson${period}`);
                }
            });

            // تلوين الخلايا المتضاربة
            for (let tId in teachersInThisPeriod) {
                if (teachersInThisPeriod[tId].length > 1) {
                    hasConflict = true;
                    teachersInThisPeriod[tId].forEach(cellId => {
                        const td = document.getElementById(cellId);
                        if (td) td.classList.add('conflict');
                    });
                }
            }
        }
    });

    // إظهار أو إخفاء رسالة التضارب
    document.getElementById('stConflictAlert').style.display = hasConflict ? 'block' : 'none';

    // تحديث واجهة النصاب (الباجات)
    const quotaContainer = document.getElementById('stQuotaReportContainer');
    const quotaList = document.getElementById('stQuotaList');
    quotaContainer.style.display = 'block';
    
    let quotaHtml = '';
    for (let tId in globalTeacherQuotas) {
        const q = globalTeacherQuotas[tId];
        let badgeClass = 'quota-ok';
        if (q.count < q.max) badgeClass = 'quota-under';
        if (q.count > q.max) badgeClass = 'quota-over';
        
        quotaHtml += `<span class="quota-badge ${badgeClass}">${q.name}: ${q.count}/${q.max}</span>`;
    }
    quotaList.innerHTML = quotaHtml;
}

// 5. اعتماد الجدول وتوزيعه
async function publishSmartSchedule() {
    if (!globalTimetableData) return alert('الرجاء توليد أو تحميل جدول أولاً.');
    
    // التحقق من عدم وجود تضارب قبل الحفظ
    if (document.getElementById('stConflictAlert').style.display === 'block') {
        const confirmSave = await Swal.fire({
            title: 'تحذير تضارب!',
            text: 'يوجد مدرسون لديهم أكثر من حصة في نفس الوقت. هل أنت متأكد أنك تريد الاعتماد والنشر بوجود هذا الخطأ؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، انشر على أي حال',
            cancelButtonText: 'تراجع للتعديل'
        });
        if (!confirmSave.isConfirmed) return;
    }

    const { value: versionName } = await Swal.fire({
        title: 'اعتماد الجدول وتوزيعه',
        input: 'text',
        inputLabel: 'أدخل اسماً لهذه النسخة لحفظها في الأرشيف (مثال: جدول شهر 10)',
        inputValue: `إصدار ${new Date().toLocaleDateString('ar-IQ')}`,
        showCancelButton: true,
        confirmButtonText: 'حفظ ونشر',
        cancelButtonText: 'إلغاء'
    });

    if (versionName) {
        Swal.fire({ title: 'جاري الحفظ والتوزيع...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        
        const res = await callApi('publishSmartTimetableToWeekly', { 
            versionName: versionName, 
            fullSchedule: globalTimetableData 
        });
        
        if (res.success) {
            Swal.fire('نجاح', res.message, 'success');
            loadSmartVersionsMenu(); // تحديث قائمة النسخ
        } else {
            Swal.fire('خطأ', res.message, 'error');
        }
    }
}

// 6. تحميل قائمة النسخ المحفوظة (الأرشيف)
async function loadSmartVersionsMenu() {
    const select = document.getElementById('stVersionsSelect');
    if (!select) return;
    
    const res = await callApi('getSmartTimetableVersions');
    if (res.success && res.versions) {
        window.smartTimetableVersionsCache = res.versions; // حفظها محلياً
        let options = '<option value="">-- تحميل نسخة محفوظة سابقة --</option>';
        res.versions.forEach(v => {
            options += `<option value="${v.versionId}">${v.versionName} (${v.publishDate})</option>`;
        });
        select.innerHTML = options;
    }
}

// 7. استرجاع نسخة سابقة وعرضها في الماتريكس
function loadSmartVersion() {
    const versionId = document.getElementById('stVersionsSelect').value;
    if (!versionId) return alert('الرجاء اختيار نسخة من القائمة.');
    
    const version = window.smartTimetableVersionsCache.find(v => v.versionId === versionId);
    if (version) {
        globalTimetableData = version.scheduleData;
        
        // تجهيز بيانات النصاب (استرداد المدرسين)
        globalTeacherQuotas = {};
        allTeacherConstraints.forEach(c => {
            globalTeacherQuotas[c.teacherId] = { name: c.teacherName, max: c.maxPeriods, count: 0 };
        });

        renderTimetableMatrix();
        Swal.fire('تم الاسترجاع', `تم تحميل: ${version.versionName}`, 'success');
    }
}

// أخيراً، يجب تشغيل دالة التهيئة عند فتح صفحة الأدمن:
// ابحث عن دالة handleAdminPage() في script.js، وأضف هذا السطر في نهايتها:
// initSmartTimetable();

// ==========================================================
//                  منطق صفحة الطالب
// ==========================================================
function handleStudentPage() {
    const userData = setupCommonElements();
    if (!userData) return;
    showTab('announcementsTab');
    
    callApi('getStudentDashboard').then(result => {
        if (result.success) {
            renderAnnouncements(result.data.announcements, 'announcementsContainer');
            renderGrades(result.data.grades);
            renderAbsences(result.data.absences);
            renderHomework(result.data.homework);
            renderEvaluations(result.data.evaluations);
            renderLibrary(result.data.library);
            renderWeeklySchedule(result.data.weeklySchedule);
            renderExamSchedules(result.data.examSchedules);
            
            loadAndCheckProfile(); 
        }
    });

    const profileForm = document.getElementById('profileForm');
    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
    
    const picInput = document.getElementById('profilePicInput');
    if (picInput) picInput.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => document.getElementById('profilePreview').src = ev.target.result;
        reader.readAsDataURL(e.target.files[0]);
    };

    // (إصلاح) تفعيل زر إرسال الاعتراض للطالب
    const objectionForm = document.getElementById('objectionForm');
    if (objectionForm) objectionForm.addEventListener('submit', submitObjectionHandler);
    
    loadStudentObjections();
}

// (إصلاح) دالة إرسال الاعتراض لمنع تحديث الصفحة
async function submitObjectionHandler(e) {
    e.preventDefault();
    const payload = {
        subject: document.getElementById('objSubject').value,
        content: document.getElementById('objContent').value
    };
    if (!payload.subject || !payload.content) return alert('الرجاء إدخال المادة ونص الاعتراض.');
    
    Swal.fire({ title: 'جاري الإرسال...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const result = await callApi('submitObjection', payload);
    
    if (result.success) {
        Swal.fire('نجاح', result.message, 'success');
        e.target.reset();
        loadStudentObjections(); // تحديث القائمة فوراً
    } else {
        Swal.fire('خطأ', result.message, 'error');
    }
}
// (جديد) الدالة التي تمنع تحديث الصفحة وترسل الاعتراض للسيرفر
async function submitObjectionHandler(e) {
    e.preventDefault(); // هذا السطر هو الذي يمنع الصفحة من التحديث!
    
    const payload = {
        subject: document.getElementById('objSubject').value,
        content: document.getElementById('objContent').value
    };
    
    if (!payload.subject || !payload.content) return alert('الرجاء إدخال المادة ونص الاعتراض.');
    
    Swal.fire({ title: 'جاري الإرسال...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const result = await callApi('submitObjection', payload);
    
    if (result.success) {
        Swal.fire('نجاح', result.message, 'success');
        e.target.reset(); // تفريغ الحقول بعد الإرسال
        loadStudentObjections(); // تحديث الجدول فوراً
    } else {
        Swal.fire('خطأ', result.message, 'error');
    }
}

// (إصلاح) دالة إرسال الاعتراض لمنع تحديث الصفحة
async function submitObjectionHandler(e) {
    e.preventDefault();
    const payload = {
        subject: document.getElementById('objSubject').value,
        content: document.getElementById('objContent').value
    };
    if (!payload.subject || !payload.content) return alert('الرجاء إدخال المادة ونص الاعتراض.');
    
    Swal.fire({ title: 'جاري الإرسال...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const result = await callApi('submitObjection', payload);
    
    if (result.success) {
        Swal.fire('نجاح', result.message, 'success');
        e.target.reset();
        loadStudentObjections(); // تحديث القائمة فوراً
    } else {
        Swal.fire('خطأ', result.message, 'error');
    }
}
async function handleProfileUpdate(e) {
    e.preventDefault();
    Swal.fire({ title: 'جاري الحفظ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const profilePreview = document.getElementById('profilePreview');
    let profilePicBase64 = null;

    if (profilePreview.src.startsWith('data:image') && profilePreview.src !== window.DEFAULT_AVATAR) {
        profilePicBase64 = await compressImage(profilePreview.src, 300);
    }

    const newPass = document.getElementById('profNewPass').value;
    let hashedPassword = newPass ? await hashPassword(newPass) : null;

    const payload = {
        fullName: document.getElementById('profFullName').value,
        motherName: document.getElementById('profMotherName').value,
        studentPhone: document.getElementById('profStudentPhone').value,
        guardianPhone: document.getElementById('profGuardianPhone').value,
        address: document.getElementById('profAddress').value,
        dob: document.getElementById('profDOB').value,
        bloodType: document.getElementById('profBloodType').value,
        telegramId: document.getElementById('profTelegramId').value,
        medicalNotes: document.getElementById('profMedical').value,
        newPassword: hashedPassword,
        profilePicBase64: profilePicBase64
    };

    const result = await callApi('updateMyProfile', payload);
    
    if (result.success) {
        Swal.fire('تم الحفظ!', 'تم تحديث بيانات ملفك الشخصي وصورتك بنجاح.', 'success');
        loadAndCheckProfile(); 
    } else {
        Swal.fire('خطأ في الحفظ', result.message, 'error');
    }
}

function compressImage(base64Str, maxWidth) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
    });
}

async function loadStudentObjections() {
    const container = document.getElementById('myObjectionsContainer');
    if (!container) return;
    const res = await callApi('getStudentObjections');
    if (res.success && res.objections.length > 0) {
        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>التاريخ</th><th>المادة / الموضوع</th><th>التفاصيل</th><th>حالة الإدارة</th><th>حالة المدرس</th><th>رد المدرس</th></tr></thead>
                <tbody>
                    ${res.objections.map(obj => `
                        <tr>
                            <td>${obj.date}</td>
                            <td>${obj.subject}</td>
                            <td>${obj.content}</td>
                            <td style="font-weight:bold; color:${obj.adminStatus.includes('مرفوض') ? 'red' : (obj.adminStatus.includes('محول') ? 'green' : 'orange')}">${obj.adminStatus}</td>
                            <td style="font-weight:bold; color:${obj.teacherStatus === 'تم الرد' ? 'green' : 'orange'}">${obj.teacherStatus}</td>
                            <td>${obj.reply || 'لا يوجد رد بعد'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    } else {
        container.innerHTML = '<p>لا توجد اعتراضات سابقة.</p>';
    }
}

function renderAnnouncements(announcements, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<div class="card"><p>لا توجد إعلانات حالياً.</p></div>';
        return;
    }
    container.innerHTML = announcements.map(ann => `
        <div class="card announcement-card">
            <h4>${ann.title}</h4>
            <p>${ann.content.replace(/\n/g, '<br>')}</p>
            <small>تاريخ النشر: ${ann.date}</small>
        </div>
    `).join('');
}

function renderGrades(grades) {
    const container = document.getElementById('gradesContainer');
    if (!container) return;
    if (!grades || grades.length === 0) {
        container.innerHTML = '<p>لا توجد درجات منشورة لك حالياً.</p>';
        return;
    }
    container.innerHTML = `
        <div class="table-responsive">
        <table class="data-table">
            <thead>
                <tr><th rowspan="2">المادة</th><th colspan="4">الفصل الأول</th><th rowspan="2">نصف السنة</th><th colspan="4">الفصل الثاني</th><th rowspan="2">السعي السنوي</th><th rowspan="2">الامتحان النهائي</th><th rowspan="2">الدرجة النهائية</th></tr>
                <tr><th>ش1</th><th>ش2</th><th>ش3</th><th>السعي</th><th>ش1</th><th>ش2</th><th>ش3</th><th>السعي</th></tr>
            </thead>
            <tbody>
                ${grades.map(g => `
                    <tr>
                        <td>${g.subject || ''}</td>
                        <td>${g.term1_month1 || ''}</td><td>${g.term1_month2 || ''}</td><td>${g.term1_month3 || ''}</td><td style="background:#eafaf1;"><strong>${g.term1_avg || ''}</strong></td>
                        <td><strong>${g.midYear_exam || ''}</strong></td>
                        <td>${g.term2_month1 || ''}</td><td>${g.term2_month2 || ''}</td><td>${g.term2_month3 || ''}</td><td style="background:#eafaf1;"><strong>${g.term2_avg || ''}</strong></td>
                        <td style="background:#fff3cd;"><strong>${g.yearly_effort || ''}</strong></td><td>${g.final_exam || ''}</td><td style="background:#d4edda; color:green;"><strong>${g.final_result || ''}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    `;
}

function renderAbsences(absences) {
    const container = document.getElementById('absencesContainer');
    if (!container) return;
    if (!absences || absences.length === 0) {
        container.innerHTML = '<p>لا توجد غيابات مسجلة لك.</p>';
        return;
    }
    container.innerHTML = `
        <ul class="absences-list">
            ${absences.map(a => `<li><span>${a.date}</span>: ${a.notes || 'غياب بدون ملاحظات'}</li>`).join('')}
        </ul>
    `;
}

function renderHomework(homework) {
    const container = document.getElementById('homeworkContainer');
    if (!container) return;
    if (!homework || homework.length === 0) {
        container.innerHTML = '<p>لا توجد واجبات حالياً.</p>';
        return;
    }
    
    container.innerHTML = homework.map(hw => `
        <div class="card">
            <h4>${hw.subject} <small>(${hw.date})</small></h4>
            <p>${hw.content.replace(/\n/g, '<br>')}</p>
        </div>
    `).join('');

    homework.forEach(hw => {
        if (hw.id) {
            callApi('trackItemView', { itemId: hw.id, itemType: 'homework' });
        }
    });
}

function renderEvaluations(evaluations) {
    const container = document.getElementById('evaluationsContainer');
    if (!container) return;
    if (!evaluations || evaluations.length === 0) {
        container.innerHTML = '<p>لا توجد تقييمات مسجلة لك.</p>';
        return;
    }
    container.innerHTML = `
        <div class="table-responsive">
        <table class="data-table">
            <thead><tr><th>التاريخ</th><th>المادة</th><th>تحضير</th><th>مشاركة</th><th>سلوك</th><th>واجبات</th><th>ملاحظات</th></tr></thead>
            <tbody>
                ${evaluations.map(ev => `
                    <tr><td>${ev.date}</td><td>${ev.subject}</td><td>${ev.daily_prep || '-'}</td><td>${ev.participation || '-'}</td><td>${ev.behavior || '-'}</td><td>${ev.homework || '-'}</td><td>${ev.note || '-'}</td></tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    `;
}

function renderLibrary(links) {
    const container = document.getElementById('libraryContainer');
    if (!container) return;
    if (!links || links.length === 0) {
        container.innerHTML = '<p>لا توجد مواد في المكتبة حالياً.</p>';
        return;
    }
    container.innerHTML = links.map(link => `
        <div class="card">
            <h4>${link.title} <small>(${link.subject})</small></h4>
            <p>${link.description || ''}</p>
            <a href="${link.url}" target="_blank" class="button">فتح الرابط <i class="fas fa-external-link-alt"></i></a>
        </div>
    `).join('');
}

function renderWeeklySchedule(scheduleData) {
    const container = document.getElementById('weeklyScheduleContainer');
    if (!container) return;
    if (!scheduleData) {
        container.innerHTML = '<p>لم يتم نشر الجدول الأسبوعي الخاص بصفك بعد.</p>';
        return;
    }
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    let tableHtml = '<div class="table-responsive"><table class="data-table weekly-schedule-table"><thead><tr><th>اليوم</th>';
    for(let i = 1; i <= 6; i++) {
        tableHtml += `<th>الدرس ${i}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    
    days.forEach(day => {
        tableHtml += `<tr><td><strong>${day}</strong></td>`;
        for(let i = 1; i <= 6; i++) {
            tableHtml += `<td>${scheduleData[day]?.[`lesson${i}`] || ''}</td>`;
        }
        tableHtml += '</tr>';
    });
    
    tableHtml += '</tbody></table></div>';
    container.innerHTML = tableHtml;
}

function renderExamSchedules(schedules) {
    const container = document.getElementById('examSchedulesContainer');
    if (!container) return;
    if (!schedules || schedules.length === 0) {
        container.innerHTML = '<p>لا توجد جداول امتحانات منشورة حالياً.</p>';
        return;
    }
    
    container.innerHTML = schedules.map(schedule => `
        <div class="card exam-schedule-card">
            <h3>${schedule.title}</h3>
            <ul>
                ${schedule.scheduleData.map(day => `
                    <li>
                        <span><strong>${day.date} (${day.day})</strong></span>
                        <span>${day.subject}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

// ==========================================================
//                  منطق صفحة المدرس
// ==========================================================
function handleTeacherPage() {
    const userData = setupCommonElements();
    if (!userData) return;

    callApi('getSchoolStructure').then(res => {
        if(res.success) window.academicStructure = res.structure;
        
        callApi('getTeacherDashboard').then(result => {
            if(result.success) {
                const { announcements, canRecordAbsence, canUseMasterExcel, weeklySchedules } = result.data;
                
                window.teacherRawAssignments = result.data.rawAssignments || [];
                
                // (إصلاح): نملأ الصفوف فقط في البداية، وباقي القوائم تتحدث عند الاختيار
                const classesOnly = [...new Set(window.teacherRawAssignments.map(a => a.class))];
                
                populateSelect('teacherClasses', classesOnly, '-- اختر الصف --');
                populateSelect('hwClasses', classesOnly, '-- اختر الصف --');
                populateSelect('evalClasses', classesOnly, '-- اختر الصف --');
                populateSelect('libClasses', classesOnly, '-- اختر الصف --');
                populateSelect('absenceClasses', classesOnly, '-- اختر الصف --');
                populateSelect('masterClass', classesOnly, '-- اختر الصف أولاً --');
                
                const masterUploadInput = document.getElementById('masterExcelUploadInput');
                if (masterUploadInput) masterUploadInput.addEventListener('change', handleMasterExcelUpload);

                renderAnnouncements(announcements, 'announcementsContainer');
                
                // جلب المواد الخاصة بالمدرس لعرض جدوله
                const allTeacherSubjects = [...new Set(window.teacherRawAssignments.map(a => a.subject))];
                renderTeacherWeeklySchedules(weeklySchedules, allTeacherSubjects);
                
                const absenceTabButton = document.querySelector('[onclick="showTab(\'absencesTab\')"]');
                const masterExcelTabButton = document.querySelector('[onclick="showTab(\'masterExcelTab\')"]');

                if (absenceTabButton) absenceTabButton.style.display = canRecordAbsence ? '' : 'none';
                if (masterExcelTabButton) masterExcelTabButton.style.display = canUseMasterExcel ? '' : 'none';
                
                showTab('gradesTab');
            } else {
                 document.body.innerHTML = `<p style="color:red; text-align:center; padding: 50px;">فشل تحميل بيانات المدرس. ${result.message}</p>`;
            }
        });
    });
    
    document.getElementById('loadStudentsBtn').addEventListener('click', loadStudentsForGrading);
    document.getElementById('gradesForm').addEventListener('submit', submitGradesForReview);
    document.getElementById('downloadExcelBtn').addEventListener('click', downloadExcelTemplate);
    document.getElementById('uploadExcelInput').addEventListener('change', handleExcelUpload);
    document.getElementById('loadStudentsForAbsenceBtn').addEventListener('click', loadStudentsForAttendance);
    document.getElementById('absenceForm').addEventListener('submit', recordAbsencesHandler);
    document.getElementById('homeworkForm').addEventListener('submit', submitHomeworkHandler); 
    document.getElementById('loadStudentsForEvalBtn').addEventListener('click', loadStudentsForEvaluation); 
    document.getElementById('evaluationsForm').addEventListener('submit', submitEvaluationsHandler); 
    document.getElementById('libraryForm').addEventListener('submit', addLibraryLinkHandler);
    
    document.getElementById('absenceDate').valueAsDate = new Date();
    document.getElementById('evalDate').valueAsDate = new Date();

    loadTeacherObjections();
    loadTeacherSentHomework();
    const loadSentHwBtn = document.getElementById('loadSentHomeworkBtn');
    if(loadSentHwBtn) loadSentHwBtn.addEventListener('click', loadTeacherSentHomework);
}
async function loadTeacherObjections() {
    const container = document.getElementById('teacherObjectionsContainer');
    if (!container) return;
    
    const res = await callApi('getTeacherObjections');
    if (res.success && res.objections.length > 0) {
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>الطالب</th>
                        <th>المادة</th>
                        <th>نص الاعتراض / الملاحظة</th>
                        <th>الرد</th>
                    </tr>
                </thead>
                <tbody>
                    ${res.objections.map(obj => `
                        <tr>
                            <td>${obj.date}</td>
                            <td>${obj.studentName}</td>
                            <td>${obj.subject}</td>
                            <td>${obj.content}</td>
                            <td>
                                <div style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                                    <textarea id="reply-text-${obj.id}" rows="2" placeholder="اكتب ردك هنا لولي الأمر/الطالب..." style="padding: 5px; width: 100%; border: 1px solid #ccc; font-size: 0.9em;" required></textarea>
                                    <button onclick="submitTeacherReply('${obj.id}')" class="button btn-publish" style="padding: 5px 10px; font-size: 0.8em; width: 100%;">إرسال الرد</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    } else {
        container.innerHTML = '<p>لا توجد اعتراضات أو ملاحظات محولة إليك حالياً.</p>';
    }
}

async function submitTeacherReply(objectionId) {
    const replyInput = document.getElementById(`reply-text-${objectionId}`);
    if (!replyInput || !replyInput.value.trim()) {
        return alert('الرجاء كتابة الرد قبل الإرسال.');
    }
    
    const payload = { objectionId, reply: replyInput.value.trim() };
    const res = await callApi('handleTeacherObjection', payload);
    
    if (res.success) {
        alert(res.message);
        loadTeacherObjections(); 
    }
}

function renderTeacherWeeklySchedules(schedules, teacherSubjects) {
    const container = document.getElementById('teacherScheduleContainer');
    if (!container) return;
    if (!schedules || schedules.length === 0) {
        container.innerHTML = '<p>لم يتم نشر أي جداول للصفوف والشعب المسندة إليك بعد.</p>';
        return;
    }
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    let finalHtml = '';
    schedules.forEach(schedule => {
        finalHtml += `<div class="form-section"><h3>الصف: ${schedule.targetClass} - الشعبة: ${schedule.targetSection}</h3>`;
        let tableHtml = '<div class="table-responsive"><table class="data-table weekly-schedule-table"><thead><tr><th>اليوم</th>';
        for (let i = 1; i <= 6; i++) { tableHtml += `<th>الدرس ${i}</th>`; }
        tableHtml += '</tr></thead><tbody>';
        days.forEach(day => {
            tableHtml += `<tr><td><strong>${day}</strong></td>`;
            for (let i = 1; i <= 6; i++) {
                const subject = schedule.scheduleData[day]?.[`lesson${i}`] || '';
                const isMySubject = (teacherSubjects || []).includes(subject);
                tableHtml += `<td class="${isMySubject ? 'my-subject' : ''}">${subject}</td>`;
            }
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table></div></div>';
        finalHtml += tableHtml;
    });
    container.innerHTML = finalHtml;
}


async function loadStudentsForGrading() {
    const payload = {
        studentClass: document.getElementById('teacherClasses').value,
        studentSection: document.getElementById('teacherSections').value,
        subject: document.getElementById('teacherSubjects').value,
    };
    if (!payload.studentClass || !payload.studentSection || !payload.subject) {
        return alert('الرجاء اختيار الصف والشعبة والمادة.');
    }
    
    const result = await callApi('getStudentsForGrading', payload);
    const container = document.getElementById('studentsGradeContainer');
    
    if (result.success && result.students && result.students.length > 0) {
        const settings = result.settings || {}; 

        const getInputState = (gradeType) => {
            const settingKey = `${gradeType}_Status`; 
            if (!settings[settingKey] || settings[settingKey].value === 'مفتوح') {
                return '';
            }
            return 'readonly style="background-color: #eee; color:#888;" tabindex="-1"';
        };
        
        container.innerHTML = `
            <div class="table-responsive" style="overflow-x: auto; white-space: nowrap;">
            <table class="data-table" style="font-size: 0.85em; min-width: 1200px;">
                <thead><tr>
                    <th style="position: sticky; right: 0; background: var(--light-green); z-index: 2;">اسم الطالب</th>
                    <th>ش1 (ف1)</th><th>ش2 (ف1)</th><th>ش3 (ف1)</th><th style="background:#eafaf1;">السعي (ف1)</th>
                    <th>نصف السنة</th>
                    <th>ش1 (ف2)</th><th>ش2 (ف2)</th><th>ش3 (ف2)</th><th style="background:#eafaf1;">السعي (ف2)</th>
                    <th style="background:#fff3cd;">السعي السنوي</th><th>الدفتر</th><th style="background:#d4edda;">النهائي</th><th>الحالة</th>
                </tr></thead>
                <tbody>
                    ${result.students.map(s => {
                        const g = result.grades[s.studentId] || {};
                        const latestStatus = g.Term1_Month1?.status || g.Term1_Avg?.status || 'جديد';
                        return `
                        <tr data-student-id="${s.studentId}">
                            <td style="position: sticky; right: 0; background: #fff; font-weight:bold; z-index: 1;">${s.name}</td>
                            <td><input type="number" class="grade-input" data-grade-type="Term1_Month1" value="${g.Term1_Month1?.grade || ''}" ${getInputState('Term1_Month1')}></td>
                            <td><input type="number" class="grade-input" data-grade-type="Term1_Month2" value="${g.Term1_Month2?.grade || ''}" ${getInputState('Term1_Month2')}></td>
                            <td><input type="number" class="grade-input" data-grade-type="Term1_Month3" value="${g.Term1_Month3?.grade || ''}" ${getInputState('Term1_Month3')}></td>
                            <td><input type="number" class="grade-input" data-grade-type="Term1_Avg" value="${g.Term1_Avg?.grade || ''}" ${getInputState('Term1_Avg')} style="background:#eafaf1; font-weight:bold;"></td>
                            
                            <td><input type="number" class="grade-input" data-grade-type="MidYear_Exam" value="${g.MidYear_Exam?.grade || ''}" ${getInputState('MidYear_Exam')} style="font-weight:bold;"></td>
                            
                            <td><input type="number" class="grade-input" data-grade-type="Term2_Month1" value="${g.Term2_Month1?.grade || ''}" ${getInputState('Term2_Month1')}></td>
                            <td><input type="number" class="grade-input" data-grade-type="Term2_Month2" value="${g.Term2_Month2?.grade || ''}" ${getInputState('Term2_Month2')}></td>
                            <td><input type="number" class="grade-input" data-grade-type="Term2_Month3" value="${g.Term2_Month3?.grade || ''}" ${getInputState('Term2_Month3')}></td>
                            <td><input type="number" class="grade-input" data-grade-type="Term2_Avg" value="${g.Term2_Avg?.grade || ''}" ${getInputState('Term2_Avg')} style="background:#eafaf1; font-weight:bold;"></td>
                            
                            <td><input type="number" class="grade-input" data-grade-type="Yearly_Effort" value="${g.Yearly_Effort?.grade || ''}" ${getInputState('Yearly_Effort')} style="background:#fff3cd; font-weight:bold;"></td>
                            <td><input type="number" class="grade-input" data-grade-type="Final_Exam" value="${g.Final_Exam?.grade || ''}" ${getInputState('Final_Exam')}></td>
                            <td><input type="number" class="grade-input" data-grade-type="Final_Result" value="${g.Final_Result?.grade || ''}" ${getInputState('Final_Result')} style="background:#d4edda; color:green; font-weight:bold;"></td>
                            
                            <td><span class="status">${latestStatus}</span></td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
            </div>`;
        document.getElementById('submitGradesBtn').style.display = 'block';
        
        if (typeof attachGradeCalculators === 'function') attachGradeCalculators();
    } else {
        container.innerHTML = `<p>${result.message || 'لا يوجد طلاب في هذه الشعبة.'}</p>`;
    }
}

async function submitGradesForReview(e) {
    e.preventDefault();
    const grades = [];
    document.querySelectorAll('#studentsGradeContainer tbody tr').forEach(row => {
        const studentGrade = { studentId: row.dataset.studentId, grades: {} };
        let hasChanged = false;
        row.querySelectorAll('.grade-input').forEach(input => {
            if (input.value !== '' && !input.hasAttribute('readonly')) { 
                studentGrade.grades[input.dataset.gradeType] = input.value;
                hasChanged = true;
            }
        });
        if(hasChanged) grades.push(studentGrade);
    });

    if (grades.length === 0) return alert('لم يتم إدخال أي درجات جديدة (أو أن الحقول المفتوحة فارغة).');

    const payload = {
        subject: document.getElementById('teacherSubjects').value,
        grades: grades
    };

    // (جديد) إظهار نافذة التحميل لمنع النقر المتكرر وتوضيح أن العملية جارية
    Swal.fire({ title: 'جاري رفع وحفظ الدرجات...', text: 'الرجاء الانتظار قليلاً وعدم إغلاق النافذة.', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const result = await callApi('submitGrades', payload);
    
    if (result.success) {
        Swal.fire('تمت العملية بنجاح', result.message, 'success'); 
        loadStudentsForGrading(); 
    } else {
        Swal.fire('خطأ في الحفظ', result.message, 'error');
    }
}

async function loadStudentsForAttendance() {
    const payload = {
        studentClass: document.getElementById('absenceClasses').value,
        studentSection: document.getElementById('absenceSections').value
    };
    if (!payload.studentClass || !payload.studentSection) return alert('الرجاء اختيار الصف والشعبة.');

    const result = await callApi('getStudentsForAttendance', payload);
    const container = document.getElementById('studentsForAbsenceContainer');
    if (result.success && result.students.length > 0) {
        container.innerHTML = `<ul class="students-list">${result.students.map(s => `<li><label><input type="checkbox" name="absentStudent" value="${s.studentId}"> ${s.name}</label></li>`).join('')}</ul>`;
        document.getElementById('submitAbsencesBtn').style.display = 'block';
    } else {
        container.innerHTML = '<p>لا يوجد طلاب في هذه الشعبة.</p>';
    }
}

async function recordAbsencesHandler(e) {
    e.preventDefault();
    const studentIds = Array.from(document.querySelectorAll('input[name="absentStudent"]:checked')).map(cb => cb.value);
    if (studentIds.length === 0) return alert('الرجاء تحديد طالب واحد على الأقل.');

    const payload = {
        date: document.getElementById('absenceDate').value,
        studentIds: studentIds,
        notes: document.getElementById('absenceNotes').value
    };
    
    const result = await callApi('recordAbsences', payload);
    if (result.success) {
        alert(result.message); 
        e.target.reset();
        document.getElementById('absenceDate').valueAsDate = new Date();
        document.getElementById('studentsForAbsenceContainer').innerHTML = '<p>الرجاء اختيار الصف والشعبة والتاريخ لعرض الطلاب.</p>';
        document.getElementById('submitAbsencesBtn').style.display = 'none';
    }
}

async function loadTeacherSentHomework() {
    const container = document.getElementById('sentHomeworkContainer');
    if (!container) return;
    
    container.innerHTML = '<p>جاري التحميل...</p>';
    const result = await callApi('getTeacherSentHomework');
    
    if (result.success && result.homework && result.homework.length > 0) {
        let html = `<table class="data-table">
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>الصف والشعبة</th>
                    <th>المادة</th>
                    <th>المحتوى</th>
                    <th>الحالة</th>
                    <th>المشاهدات</th>
                </tr>
            </thead>
            <tbody>`;
        
        result.homework.forEach(hw => {
            html += `<tr>
                <td>${hw.date}</td>
                <td>${hw.class} ${hw.section}</td>
                <td>${hw.subject}</td>
                <td>${hw.content.substring(0, 40)}...</td>
                <td style="font-weight: bold; color: ${hw.status === 'منشور' ? '#28a745' : '#ffc107'};">${hw.status}</td>
                <td>
                    <button onclick="showItemViews('${hw.id}', '${hw.class}', '${hw.section}')" class="button" style="background-color: #17a2b8; padding: 5px 10px; font-size: 0.85em; width: auto;">
                        <i class="fas fa-eye"></i> الإحصائيات
                    </button>
                </td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p>لا توجد واجبات مرسلة مسبقاً.</p>';
    }
}

async function showItemViews(itemId, targetClass, targetSection) {
    Swal.fire({ title: 'جاري جلب المشاهدات...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    
    const result = await callApi('getItemViews', { itemId, targetClass, targetSection });
    
    if (result.success) {
        const { viewed, notViewed, viewedCount, totalCount } = result;
        
        let html = `
            <div style="text-align: right; font-family: 'Tajawal', sans-serif;">
                <h4 style="color: #28a745; margin-bottom: 5px;"><i class="fas fa-check-circle"></i> شاهدوا الواجب (${viewedCount}):</h4>
                <div style="max-height: 150px; overflow-y: auto; background: #eafaf1; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #c3e6cb;">
                    ${viewed.length > 0 ? viewed.map(name => `<div>- ${name}</div>`).join('') : '<div style="color: #666;">لم يشاهد أحد الواجب بعد.</div>'}
                </div>
                
                <h4 style="color: #dc3545; margin-bottom: 5px;"><i class="fas fa-times-circle"></i> لم يشاهدوا الواجب (${totalCount - viewedCount}):</h4>
                <div style="max-height: 150px; overflow-y: auto; background: #f8d7da; padding: 10px; border-radius: 5px; border: 1px solid #f5c6cb;">
                    ${notViewed.length > 0 ? notViewed.map(name => `<div>- ${name}</div>`).join('') : '<div style="color: #28a745; font-weight: bold;">ممتاز! الجميع شاهد الواجب!</div>'}
                </div>
            </div>
        `;
        
        Swal.fire({
            title: 'إحصائيات المشاهدة للواجب',
            html: html,
            confirmButtonText: 'إغلاق',
            confirmButtonColor: '#6c757d',
            width: '600px'
        });
    } else {
        Swal.fire('خطأ', result.message, 'error');
    }
}

async function submitHomeworkHandler(e) {
    e.preventDefault();
    const payload = {
        content: document.getElementById('hwContent').value,
        targetClass: document.getElementById('hwClasses').value,
        targetSection: document.getElementById('hwSections').value,
        targetSubject: document.getElementById('hwSubjects').value
    };
    if(!payload.targetClass || !payload.targetSection || !payload.targetSubject || !payload.content) return alert('الرجاء ملء جميع الحقول.');
    
    const result = await callApi('submitHomework', payload);
    if(result.success) {
        alert(result.message); 
        e.target.reset();
    }
}

async function loadStudentsForEvaluation() {
    const payload = {
        studentClass: document.getElementById('evalClasses').value,
        studentSection: document.getElementById('evalSections').value
    };
    if(!payload.studentClass || !payload.studentSection) return alert('الرجاء اختيار الصف والشعبة.');
    
    const studentsResult = await callApi('getStudentsForAttendance', payload);
    const container = document.getElementById('studentsForEvalContainer');
    
    if (!studentsResult.success || studentsResult.students.length === 0) {
        container.innerHTML = '<p>لا يوجد طلاب في هذه الشعبة.</p>';
        return;
    }
    
    const students = studentsResult.students;
    const studentIds = students.map(s => s.studentId);
    
    const evalPayload = {
        date: document.getElementById('evalDate').value,
        subject: document.getElementById('evalSubjects').value,
        studentIds: studentIds
    };
    
    const existingEvalsResult = await callApi('getExistingEvaluations', evalPayload);
    const existingEvalsMap = new Map();
    if (existingEvalsResult.success) {
        existingEvalsResult.evaluations.forEach(ev => {
            existingEvalsMap.set(ev.studentId, ev);
        });
    }

    const optionsHtml = (selectedValue = "") => `
        <option value="" ${selectedValue === "" ? "selected" : ""}>--</option>
        <option value="جيد" ${selectedValue === "جيد" ? "selected" : ""}>جيد</option>
        <option value="متوسط" ${selectedValue === "متوسط" ? "selected" : ""}>متوسط</option>
        <option value="ضعيف" ${selectedValue === "ضعيف" ? "selected" : ""}>ضعيف</option>
    `;

    let tableHtml = `
        <div class="table-responsive">
        <table class="data-table">
            <thead>
                <tr><th>اسم الطالب</th><th>تحضير يومي</th><th>مشاركة</th><th>سلوك</th><th>واجب بيتي</th><th>ملاحظات</th><th>الحالة</th></tr>
            </thead>
            <tbody>
    `;
    students.forEach(s => {
        const existing = existingEvalsMap.get(s.studentId) || {};
        const status = existing.status || 'جديد';
        const isEditable = (status === 'جديد' || status === 'بانتظار الموافقة');
        
        tableHtml += `
            <tr data-student-id="${s.studentId}" data-evaluation-id="${existing.evaluationId || ''}">
                <td>${s.name}</td>
                <td><select class="eval-select" data-type="DailyPrep" ${!isEditable ? 'disabled' : ''}>${optionsHtml(existing.daily_prep)}</select></td>
                <td><select class="eval-select" data-type="Participation" ${!isEditable ? 'disabled' : ''}>${optionsHtml(existing.participation)}</select></td>
                <td><select class="eval-select" data-type="Behavior" ${!isEditable ? 'disabled' : ''}>${optionsHtml(existing.behavior)}</select></td>
                <td><select class="eval-select" data-type="Homework" ${!isEditable ? 'disabled' : ''}>${optionsHtml(existing.homework)}</select></td>
                <td><input type="text" class="eval-note" placeholder="ملاحظة" value="${existing.note || ''}" ${!isEditable ? 'readonly' : ''}></td>
                <td><span class="status" style="color: ${isEditable ? '#ffc107' : '#28a745'}">${status}</span></td>
            </tr>
        `;
    });
    tableHtml += '</tbody></table></div>';
    container.innerHTML = tableHtml;
    document.getElementById('submitEvaluationsBtn').style.display = 'block';
}

async function submitEvaluationsHandler(e) {
    e.preventDefault();
    const evaluationsPayload = [];
    const date = document.getElementById('evalDate').value;
    const subject = document.getElementById('evalSubjects').value;
    
    if (!subject) return alert('الرجاء اختيار المادة.');

    document.querySelectorAll('#studentsForEvalContainer tbody tr').forEach(row => {
        const evaluationId = row.dataset.evaluationId;
        
        if (row.querySelector('select').disabled) return;
        
        const studentEvals = {
            studentId: row.dataset.studentId,
            evaluationId: evaluationId || null,
            evaluations: {},
            note: row.querySelector('.eval-note').value
        };
        
        let hasEval = false;
        row.querySelectorAll('.eval-select').forEach(select => {
            if (select.value) {
                studentEvals.evaluations[select.dataset.type] = select.value;
                hasEval = true;
            }
        });
        
        if (hasEval || studentEvals.note) {
            evaluationsPayload.push(studentEvals);
        }
    });

    if (evaluationsPayload.length === 0) return alert('الرجاء تقييم طالب واحد على الأقل أو كتابة ملاحظة (في الحقول القابلة للتعديل).');

    const result = await callApi('submitDailyEvaluation', { evaluations: evaluationsPayload, date: date, subject: subject });
    if (result.success) {
        alert(result.message); 
        loadStudentsForEvaluation(); 
    }
}

async function addLibraryLinkHandler(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('libTitle').value,
        url: document.getElementById('libUrl').value,
        description: document.getElementById('libDescription').value,
        targetClass: document.getElementById('libClasses').value,
        targetSubject: document.getElementById('libSubjects').value
    };
    if (!payload.title || !payload.url || !payload.targetClass || !payload.targetSubject) return alert('الرجاء ملء الحقول المطلوبة.');
    
    const result = await callApi('addLibraryLink', payload);
    if (result.success) {
        alert(result.message); 
        e.target.reset();
    }
}

// ==========================================================
//                  منطق صفحة المشرف
// ==========================================================
function handleAdminPage() {
    const userData = setupCommonElements();
    if (!userData) return;
    
    showTab('pendingTab'); 
    refreshAdminAnalytics();

    loadPendingGrades();
    loadPendingAbsences();
    loadPendingEvaluations();
    loadPendingHomeworks();
    loadPendingLibraryLinks();
    
    loadAllUsers();
    loadSystemSettings();

    callApi('getSchoolStructure').then(res => {
        if(res.success) {
            window.academicStructure = res.structure;
            if (typeof renderAcademicStructureUI === 'function') renderAcademicStructureUI();
        }
    });

    callApi('getUniqueClassesAndSubjects').then(result => {
        if (result.success) {
            window.allSubjects = result.subjects || []; 
            window.allClasses = result.classes || [];
            window.allSections = result.sections || [];
            
            populateSelect('examScheduleClass', window.allClasses, '-- اختر الصف --');
            populateSelect('weeklyScheduleClass', window.allClasses, '-- اختر الصف --');
            populateSelect('weeklyScheduleSection', window.allSections, '-- اختر الشعبة --');
            populateSelect('reportClassSelect', window.allClasses, '-- اختر الصف --');
            populateSelect('reportSectionSelect', window.allSections, '-- اختر الشعب --');

            populateSelect('masterClass', window.allClasses, '-- اختر الصف أولاً --');
            const masterUploadInputAdmin = document.getElementById('masterExcelUploadInput');
            if (masterUploadInputAdmin) masterUploadInputAdmin.addEventListener('change', handleMasterExcelUpload);
            
            buildWeeklyScheduleGrid(window.allSubjects);
            addExamDayField();
        }
    });

    document.getElementById('announcementForm').addEventListener('submit', handleAnnouncementSubmit);
    document.getElementById('addExamDayBtn').addEventListener('click', addExamDayField);
    document.getElementById('examScheduleForm').addEventListener('submit', publishExamScheduleHandler);
    document.getElementById('weeklyScheduleForm').addEventListener('submit', publishWeeklyScheduleHandler);
    document.getElementById('loadWeeklyScheduleBtn').addEventListener('click', loadExistingWeeklySchedule);
    document.getElementById('archiveStudentBtn').addEventListener('click', archiveStudent);
    
    document.getElementById('loadMissingSubmissionsBtn').addEventListener('click', loadMissingSubmissions);
    document.getElementById('getSummaryBtn').addEventListener('click', getStudentEvaluationSummary);
    document.getElementById('sendSummaryToTelegramBtn').addEventListener('click', sendSummaryToTelegram);
    document.getElementById('getGradesReportBtn').addEventListener('click', getGradesReportBySection);
    
    document.getElementById('loadUserBtn').addEventListener('click', loadUserForEditing);
    document.getElementById('closeModalBtn').addEventListener('click', closeUserModal);
    document.getElementById('saveUserBtn').addEventListener('click', saveUserChanges);

    document.getElementById('loadHwStatusBtn').addEventListener('click', () => loadSubmissionStatusReport(SHEETS.HOMEWORK, 'hwStatusContainer'));
    document.getElementById('loadEvalStatusBtn').addEventListener('click', () => loadSubmissionStatusReport(SHEETS.DAILY_EVALUATIONS, 'evalStatusContainer'));
    
    document.getElementById('summaryStartDate').valueAsDate = new Date();
    document.getElementById('summaryEndDate').valueAsDate = new Date();

    // (جديد) تفعيل ميزة البحث الذكي عن الطالب
    setupStudentSearch();

    loadAdminObjections();
    
    // (جديد) تحميل قائمة النسخ المحفوظة للجدول الذكي
    loadSmartVersionsMenu();
}

function setupStudentSearch() {
    const searchInput = document.getElementById('summaryStudentSearch');
    const hiddenIdInput = document.getElementById('summaryStudentId');
    const resultsDiv = document.getElementById('studentSearchResults');

    if (!searchInput || !resultsDiv) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        resultsDiv.innerHTML = '';
        
        if (query === '') {
            resultsDiv.style.display = 'none';
            hiddenIdInput.value = '';
            return;
        }

        if (!window.allStudentsList || window.allStudentsList.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 10px; color: red;">الرجاء الانتظار، جاري تحميل بيانات الطلاب في الخلفية...</div>';
            resultsDiv.style.display = 'block';
            return;
        }

        // دالة لتوحيد النصوص العربية (تجاهل الهمزات والتاء المربوطة)
        const normalizeArabic = (text) => {
            if (!text) return '';
            return text.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
        };

        const queryNorm = normalizeArabic(query);
        
        const matchedStudents = window.allStudentsList.filter(s => {
            const nameNorm = normalizeArabic(s.fullName);
            // البحث بالاسم أو بـ ID الطالب
            return nameNorm.includes(queryNorm) || (s.userId && s.userId.toLowerCase().includes(query.toLowerCase()));
        });

        if (matchedStudents.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 10px; color: #888;">لم يتم العثور على طالب يطابق بحثك.</div>';
            resultsDiv.style.display = 'block';
            return;
        }

        matchedStudents.forEach(student => {
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.style.cursor = 'pointer';
            div.innerHTML = `<strong>${student.fullName}</strong> <small style="color:#888;">(${student.class} - شعبة ${student.section})</small>`;
            
            div.addEventListener('mouseover', () => div.style.backgroundColor = '#f0f8ff');
            div.addEventListener('mouseout', () => div.style.backgroundColor = 'transparent');
            
            div.addEventListener('click', () => {
                searchInput.value = student.fullName;
                hiddenIdInput.value = student.userId; 
                resultsDiv.style.display = 'none';
            });
            
            resultsDiv.appendChild(div);
        });
        
        resultsDiv.style.display = 'block';
    });

    document.addEventListener('click', function(e) {
        if (e.target !== searchInput && e.target !== resultsDiv) {
            resultsDiv.style.display = 'none';
        }
    });
}

async function loadAdminObjections() {
    const container = document.getElementById('adminObjectionsContainer');
    if (!container) return;
    
    const res = await callApi('getAdminObjections');
    if (res.success && res.objections.length > 0) {
        const teachers = res.teachers || [];

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>الطالب</th>
                        <th>الصف والشعبة</th>
                        <th>المادة</th>
                        <th>نص الاعتراض</th>
                        <th>إجراء الإدارة</th>
                    </tr>
                </thead>
                <tbody>
                    ${res.objections.map(obj => {
                        const teacherOptions = teachers.map(t => 
                            `<option value="${t.id}" ${t.id === obj.suggestedTeacherId ? 'selected' : ''}>${t.name}</option>`
                        ).join('');

                        return `
                        <tr>
                            <td>${obj.date}</td>
                            <td>${obj.studentName}</td>
                            <td>${obj.classSection}</td>
                            <td>${obj.subject}</td>
                            <td>${obj.content}</td>
                            <td>
                                <div style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                                    <select id="teacher-id-${obj.id}" style="padding: 5px; width: 100%; border: 1px solid #ccc; text-align: center; font-size: 0.9em; border-radius: 4px;">
                                        <option value="">-- اختر المدرس --</option>
                                        ${teacherOptions}
                                    </select>
                                    <button onclick="handleAdminObjectionAction('${obj.id}', 'approve')" class="button btn-publish" style="padding: 5px 10px; font-size: 0.8em; width: 100%;">موافقة وتحويل</button>
                                    <button onclick="handleAdminObjectionAction('${obj.id}', 'reject')" class="button btn-reject" style="padding: 5px 10px; font-size: 0.8em; width: 100%;">رفض</button>
                                </div>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>`;
    } else {
        container.innerHTML = '<p>لا توجد اعتراضات معلقة بانتظار قرار الإدارة.</p>';
    }
}

async function handleAdminObjectionAction(objectionId, action) {
    let payload = { objectionId, action };
    
    if (action === 'approve') {
        const teacherSelect = document.getElementById(`teacher-id-${objectionId}`);
        if (!teacherSelect || !teacherSelect.value) {
            return alert('الرجاء اختيار المدرس من القائمة لتحويل الاعتراض إليه.');
        }
        payload.teacherId = teacherSelect.value;
    }

    const res = await callApi('handleAdminObjection', payload);
    if (res.success) {
        alert(res.message);
        loadAdminObjections(); 
    }
}

async function handleApproval(sheetName, action, sendTelegram = false) {
    const checkboxClass = `.checkbox-${sheetName.replace(/[_\.]/g, '-')}`; 
    const itemIds = Array.from(document.querySelectorAll(`${checkboxClass}:checked`)).map(cb => cb.value);
    
    if (itemIds.length === 0) return alert('الرجاء تحديد سجل واحد على الأقل.');

    const payload = {
        itemIds: itemIds,
        action: action, 
        sendTelegram: sendTelegram,
        sheetName: sheetName 
    };
    
    const result = await callApi('handleApproval', payload);
    if (result.success) {
        alert(result.message);
        if (sheetName === SHEETS.GRADES) loadPendingGrades();
        else if (sheetName === SHEETS.ABSENCES) loadPendingAbsences();
        else if (sheetName === SHEETS.DAILY_EVALUATIONS) loadPendingEvaluations();
        else if (sheetName === SHEETS.HOMEWORK) loadPendingHomeworks();
        else if (sheetName === SHEETS.LIBRARY) loadPendingLibraryLinks();
    }
}

function getApprovalControls(sheetName) {
    const sheetId = sheetName.replace(/[_\.]/g, '-'); 
    const checkboxClass = `checkbox-${sheetId}`;
    const selectAllId = `selectAll-${sheetId}`;
    
    const isHomework = (sheetName === SHEETS.HOMEWORK);
    const publishText = isHomework ? 'جدولة للمنصة' : 'حفظ ونشر للمنصة';
    const telegramText = isHomework ? 'جدولة + إرسال آلي' : 'نشر + إرسال تليجرام';
    const publishTitle = isHomework ? 'جدولة الواجب ليتم إرساله آلياً (للمنصة فقط) قبل يوم الحصة' : 'حفظ ونشر السجلات لتظهر في واجهة الطالب.';
    const telegramTitle = isHomework ? 'جدولة الواجب ليتم إرساله آلياً (للمنصة وتليجرام) قبل يوم الحصة' : 'حفظ ونشر، وإرسال إشعار فوري لولي الأمر عبر تليجرام.';

    setTimeout(() => {
        try {
            const updateCount = () => {
                const count = document.querySelectorAll(`.${checkboxClass}:checked`).length;
                const label = document.querySelector(`#controls-${sheetId} label`);
                if (label) label.innerText = 'للـ ' + count + ' محدد:';
            };
            
            document.querySelectorAll(`.${checkboxClass}`).forEach(cb => {
                cb.onchange = updateCount;
            });
            const selectAll = document.getElementById(selectAllId);
            if (selectAll) {
                selectAll.onchange = (e) => {
                    document.querySelectorAll(`.${checkboxClass}`).forEach(cb => cb.checked = e.target.checked);
                    updateCount();
                };
            }
        } catch (e) {
            console.error("Error attaching listeners:", e);
        }
    }, 100);

    return `
    <div class="approval-controls" id="controls-${sheetId}">
        <label>للـ 0 محدد:</label>
        <button onclick="handleApproval('${sheetName}', 'approve', false)" class="button btn-approve" title="حفظ السجلات في النظام (للاستخدام الداخلي) دون إظهارها للطالب.">
            <i class="fas fa-save"></i> حفظ فقط (موافقة)
        </button>
        <button onclick="handleApproval('${sheetName}', 'publish', false)" class="button btn-publish" title="${publishTitle}">
            <i class="fas fa-check"></i> ${publishText}
        </button>
        <button onclick="handleApproval('${sheetName}', 'publish', true)" class="button btn-telegram" title="${telegramTitle}">
            <i class="fab fa-telegram-plane"></i> ${telegramText}
        </button>
        <button onclick="handleApproval('${sheetName}', 'reject', false)" class="button btn-reject" title="رفض السجلات، لن يتم حفظها أو نشرها.">
            <i class="fas fa-times"></i> رفض
        </button>
    </div>
    `;
}

async function loadPendingGrades() {
    const result = await callApi('getPendingGrades');
    const container = document.getElementById('pendingGradesContainer');
    const sheetName = SHEETS.GRADES;
    const sheetId = sheetName.replace(/[_\.]/g, '-');
    
    if (result.success && result.items.length > 0) {
        container.innerHTML = `<div class="table-responsive"><table class="data-table"><thead><tr><th><input type="checkbox" id="selectAll-${sheetId}"></th><th>الطالب</th><th>المادة</th><th>نوع الدرجة</th><th>التغييرات</th><th>المدرس</th></tr></thead><tbody>${result.items.map(g => `<tr><td><input type="checkbox" class="checkbox-${sheetId}" value="${g.id}"></td><td>${g.studentName}</td><td>${g.subject}</td><td>${g.gradeType}</td><td><details><summary class="details-toggle">عرض</summary><div class="changes-details"><span class="old-value">${g.changes.old || '(فارغ)'}</span> &rarr; <span class="new-value">${g.changes.new}</span></div></details></td><td>${g.teacher}</td></tr>`).join('')}</tbody></table></div>
        ${getApprovalControls(sheetName)}`;
    } else { container.innerHTML = '<p>لا توجد درجات بانتظار الموافقة.</p>'; }
}

async function loadPendingAbsences() {
    const result = await callApi('getPendingAbsences');
    const container = document.getElementById('pendingAbsencesContainer');
    const sheetName = SHEETS.ABSENCES;
    const sheetId = sheetName.replace(/[_\.]/g, '-');

    if (result.success && result.items.length > 0) {
         container.innerHTML = `<div class="table-responsive"><table class="data-table"><thead><tr><th><input type="checkbox" id="selectAll-${sheetId}"></th><th>الطالب</th><th>التاريخ</th><th>الملاحظات</th><th>بواسطة</th></tr></thead><tbody>${result.items.map(a => `<tr><td><input type="checkbox" class="checkbox-${sheetId}" value="${a.id}"></td><td>${a.studentName}</td><td>${new Date(a.date).toLocaleDateString('ar-IQ')}</td><td>${a.notes || '-'}</td><td>${a.teacher}</td></tr>`).join('')}</tbody></table></div>
         ${getApprovalControls(sheetName)}`;
    } else { container.innerHTML = '<p>لا توجد غيابات بانتظار الموافقة.</p>'; }
}

async function loadPendingEvaluations() {
    const result = await callApi('getPendingEvaluations');
    const container = document.getElementById('pendingEvaluationsContainer');
    const sheetName = SHEETS.DAILY_EVALUATIONS;
    const sheetId = sheetName.replace(/[_\.]/g, '-');

    if (result.success && result.items.length > 0) {
         container.innerHTML = `<div class="table-responsive"><table class="data-table"><thead><tr><th><input type="checkbox" id="selectAll-${sheetId}"></th><th>الطالب</th><th>المادة</th><th>التاريخ</th><th>التقييم</th><th>ملاحظات</th><th>بواسطة</th></tr></thead><tbody>${result.items.map(ev => `<tr><td><input type="checkbox" class="checkbox-${sheetId}" value="${ev.id}"></td><td>${ev.studentName}</td><td>${ev.subject}</td><td>${new Date(ev.date).toLocaleDateString('ar-IQ')}</td><td><ul style="padding-right: 20px; margin: 0; text-align: right;">${ev.data.daily_prep ? `<li>تحضير: ${ev.data.daily_prep}</li>` : ''}${ev.data.participation ? `<li>مشاركة: ${ev.data.participation}</li>` : ''}${ev.data.behavior ? `<li>سلوك: ${ev.data.behavior}</li>` : ''}${ev.data.homework ? `<li>واجب: ${ev.data.homework}</li>` : ''}</ul></td><td>${ev.data.note || '-'}</td><td>${ev.teacher}</td></tr>`).join('')}</tbody></table></div>
         ${getApprovalControls(sheetName)}`;
    } else { container.innerHTML = '<p>لا توجد تقييمات بانتظار الموافقة.</p>'; }
}

async function loadPendingHomeworks() {
    const result = await callApi('getPendingHomeworks');
    const container = document.getElementById('pendingHomeworkContainer');
    const sheetName = SHEETS.HOMEWORK;
    const sheetId = sheetName.replace(/[_\.]/g, '-');
    
     if (result.success && result.items.length > 0) {
        container.innerHTML = `<div class="table-responsive"><table class="data-table">
            <thead><tr><th><input type="checkbox" id="selectAll-${sheetId}"></th><th>تاريخ الإرسال</th><th>المدرس</th><th>الصف</th><th>المادة</th><th>المحتوى</th></tr></thead>
            <tbody>${result.items.map(hw => `<tr>
                <td><input type="checkbox" class="checkbox-${sheetId}" value="${hw.id}"></td>
                <td>${new Date(hw.date).toLocaleDateString('ar-IQ')}</td>
                <td>${hw.teacher}</td>
                <td>${hw.class} ${hw.section}</td>
                <td>${hw.subject}</td>
                <td>${hw.content.substring(0, 100)}...</td>
            </tr>`).join('')}</tbody></table></div>
            ${getApprovalControls(sheetName)}`;
     } else { container.innerHTML = '<p>لا توجد واجبات بانتظار الموافقة.</p>'; }
}

async function loadPendingLibraryLinks() {
    const result = await callApi('getPendingLibraryLinks');
    const container = document.getElementById('pendingLibraryContainer');
    const sheetName = SHEETS.LIBRARY;
    const sheetId = sheetName.replace(/[_\.]/g, '-');

     if (result.success && result.items.length > 0) {
        container.innerHTML = `<div class="table-responsive"><table class="data-table">
            <thead><tr><th><input type="checkbox" id="selectAll-${sheetId}"></th><th>التاريخ</th><th>المدرس</th><th>الصف</th><th>المادة</th><th>العنوان</th><th>الرابط</th></tr></thead>
            <tbody>${result.items.map(lib => `<tr>
                <td><input type="checkbox" class="checkbox-${sheetId}" value="${lib.id}"></td>
                <td>${new Date(lib.date).toLocaleDateString('ar-IQ')}</td>
                <td>${lib.teacher}</td>
                <td>${lib.class}</td>
                <td>${lib.subject}</td>
                <td>${lib.title}</td>
                <td><a href="${lib.url}" target="_blank">فتح</a></td>
            </tr>`).join('')}</tbody></table></div>
            ${getApprovalControls(sheetName)}`;
     } else { container.innerHTML = '<p>لا توجد روابط مكتبة بانتظار الموافقة.</p>'; }
}

async function loadMissingSubmissions() {
    const container = document.getElementById('missingSubmissionsContainer');
    
    // إظهار نافذة تحميل منعت التفاعل لحين اكتمال التحليل
    Swal.fire({ title: 'جاري تحليل الجداول...', text: 'الرجاء الانتظار، يتم فحص سجلات آخر 7 أيام.', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    
    const result = await callApi('getMissingSubmissions');
    
    if (!result.success) {
        Swal.close();
        container.style.display = 'block';
        container.innerHTML = `<p style="color:red; font-weight:bold;">خطأ: ${result.message}</p>`;
        return;
    }
    
    Swal.close();
    container.style.display = 'block';
    
    const report = result.report;
    if (Object.keys(report).length === 0) {
        container.innerHTML = '<p style="color:green; font-weight:bold;">ممتاز! جميع المدرسين ملتزمون بإرسال الواجبات والتقييمات لآخر 7 أيام.</p>';
        return;
    }
    
    let html = `<table class="data-table">
                    <thead>
                        <tr>
                            <th>المدرس</th>
                            <th>عدد تقصير (تقييمات)</th>
                            <th>عدد تقصير (واجبات)</th>
                            <th>التفاصيل</th>
                            <th>إجراء</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    for (const teacherId in report) {
        const item = report[teacherId];
        const message = `الأستاذ ${item.teacherName}، \nيرجى متابعة إرسال التقييمات والواجبات اليومية للحصص. \n\nتفاصيل التقصير (آخر 7 أيام):\n- ${item.details.join('\n- ')}`;
        
        html += `<tr>
            <td>${item.teacherName} (ID: ${item.teacherId})</td>
            <td>${item.evalMisses}</td>
            <td>${item.hwMisses}</td>
            <td>${item.details.join('<br>')}</td>
            <td>
                <button onclick="sendReminder('${item.teacherId}', \`${message}\`)" class="button btn-telegram" style="padding: 5px 10px; font-size: 0.8em;">
                    <i class="fab fa-telegram-plane"></i> إرسال تذكير
                </button>
            </td>
        </tr>`;
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

async function sendReminder(teacherId, message) {
    const result = await callApi('sendSubmissionReminder', { teacherId, message });
    if (result.success) {
        alert(result.message);
    }
}

async function getStudentEvaluationSummary() {
    const payload = {
        studentId: document.getElementById('summaryStudentId').value,
        startDate: document.getElementById('summaryStartDate').value,
        endDate: document.getElementById('summaryEndDate').value,
    };
    
    // التحقق من أن المستخدم اختار الطالب من القائمة (الـ ID موجود)
    if (!payload.studentId) {
        return alert('الرجاء البحث عن اسم الطالب واختياره من القائمة المنسدلة.');
    }
    if (!payload.startDate || !payload.endDate) {
        return alert('الرجاء تحديد فترة زمنية.');
    }
    
    // إظهار نافذة تحميل
    Swal.fire({ title: 'جاري جلب الخلاصة...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const result = await callApi('getStudentEvaluationSummary', payload);
    const container = document.getElementById('summaryReportContainer');
    const textArea = document.getElementById('summaryText');
    
    if (result.success) {
        Swal.close();
        container.style.display = 'block';
        textArea.value = result.summaryText; 
    } else {
        Swal.close();
        container.style.display = 'none';
        textArea.value = '';
        Swal.fire('تنبيه', result.message, 'warning');
    }
}

async function sendSummaryToTelegram() {
    const studentId = document.getElementById('summaryStudentId').value;
    const summaryText = document.getElementById('summaryText').value;
    if (!studentId || !summaryText) {
        return alert('الرجاء إنشاء الخلاصة أولاً.');
    }
    
    const result = await callApi('sendSummaryToTelegram', { studentId, summaryText });
    if (result.success) {
        alert(result.message);
    }
}

async function getGradesReportBySection() {
    const studentClass = document.getElementById('reportClassSelect').value;
    const studentSection = document.getElementById('reportSectionSelect').value;
    
    if (!studentClass || !studentSection) {
        return alert('الرجاء اختيار الصف والشعبة.');
    }

    const selectedTypes = Array.from(document.querySelectorAll('.report-col-cb:checked')).map(cb => cb.value);
    if (selectedTypes.length === 0) return alert('يجب اختيار نوع درجة واحد على الأقل للعرض.');

    Swal.fire({ title: 'جاري جلب وتحليل البيانات...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const result = await callApi('getGradesReportBySection', { studentClass, studentSection });
    const container = document.getElementById('gradesReportContainer');
    
    if (result.success && result.report.length > 0) {
        Swal.close();
        
        // جلب قائمة المواد الصحيحة من الهيكلية
        let subjectsArray = [];
        if (window.academicStructure && window.academicStructure.classSubjects && window.academicStructure.classSubjects[studentClass]) {
            subjectsArray = window.academicStructure.classSubjects[studentClass];
        } else {
            const allSubj = new Set();
            result.report.forEach(s => Object.keys(s.grades).forEach(subj => allSubj.add(subj)));
            subjectsArray = Array.from(allSubj);
        }

        // فصل خيارات الحساب التراكمي (المجموع والمعدل) لتعرض في نهاية الجدول
        const extraCalcTypes = selectedTypes.filter(t => t === 'Total_Effort' || t === 'Avg_Effort');
        const coreGradeTypes = selectedTypes.filter(t => t !== 'Total_Effort' && t !== 'Avg_Effort');

        let html = `<table class="data-table"><thead><tr><th>اسم الطالب</th>`;
        
        // هيدر المواد
        subjectsArray.forEach(subject => {
            html += `<th colspan="${coreGradeTypes.length}">${subject}</th>`;
        });
        
        // هيدر الحسابات الإضافية في النهاية
        if (extraCalcTypes.length > 0) {
            html += `<th colspan="${extraCalcTypes.length}" style="background: #fff3cd; color: #856404;">النتائج السنوية التراكمية</th>`;
        }
        
        html += `</tr><tr><th></th>`;
        
        // هيدر أنواع الدرجات لكل مادة
        subjectsArray.forEach(() => {
            coreGradeTypes.forEach(type => {
                html += `<th style="font-size: 0.8em;">${ARABIC_GRADE_MAP[type] || type}</th>`;
            });
        });
        
        // هيدر أنواع الحسابات الإضافية
        extraCalcTypes.forEach(type => {
            const label = type === 'Total_Effort' ? 'مجموع السعي' : 'معدل السعي';
            html += `<th style="background: #fff3cd; color: #856404;">${label}</th>`;
        });

        html += `</tr></thead><tbody>`;

        result.report.forEach(student => {
            html += `<tr><td style="font-weight:bold; position: sticky; right: 0; background: #fff; z-index: 1;">${student.studentName}</td>`;
            
            let totalEffortSum = 0;
            let subjectCount = subjectsArray.length;

            // عرض درجات المواد وحساب المجموع
            subjectsArray.forEach(subject => {
                const studentGrades = student.grades[subject] || {};
                
                // حساب السعي السنوي للمجموع (إذا لم يوجد نعتبره 0)
                const effortVal = parseFloat(studentGrades['Yearly_Effort']) || 0;
                totalEffortSum += effortVal;

                coreGradeTypes.forEach(type => {
                    const val = studentGrades[type];
                    const style = (type.includes('Avg') || type.includes('Result') || type.includes('Effort')) ? 'style="background:#eafaf1; font-weight:bold;"' : '';
                    html += `<td ${style}>${val !== undefined ? val : '0'}</td>`;
                });
            });

            // عرض أعمدة المجموع والمعدل في نهاية الصف
            extraCalcTypes.forEach(type => {
                if (type === 'Total_Effort') {
                    html += `<td style="background: #fff3cd; font-weight: bold; color: #d63384;">${totalEffortSum.toFixed(1)}</td>`;
                } else if (type === 'Avg_Effort') {
                    const avg = subjectCount > 0 ? (totalEffortSum / subjectCount) : 0;
                    html += `<td style="background: #fff3cd; font-weight: bold; color: #d63384;">${avg.toFixed(2)}</td>`;
                }
            });

            html += `</tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    } else {
        Swal.close();
        container.innerHTML = '<p style="color:#888;">لا توجد درجات معتمدة لعرضها.</p>';
    }
}
// (جديد) دالة التحديد/إلغاء التحديد للكل في التقارير
function toggleAllReportCols(status) {
    document.querySelectorAll('.report-col-cb').forEach(cb => cb.checked = status);
}

async function loadSubmissionStatusReport(sheetName, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p>جاري تحميل السجلات...</p>';
    
    const result = await callApi('getSubmissionStatusReport', { sheetName });
    
    if (result.success && result.items.length > 0) {
        renderSubmissionStatusReport(result.items, containerId, sheetName);
    } else {
        container.innerHTML = `<p>${result.message || 'لا توجد سجلات لعرضها.'}</p>`;
    }
}

function renderSubmissionStatusReport(items, containerId, sheetName) {
    const container = document.getElementById(containerId);
    let html = `<div class="table-responsive"><table class="data-table">
                    <thead>
                        <tr>
                            <th>المدرس</th>
                            <th>الصف</th>
                            <th>المادة/المحتوى</th>
                            <th>حالة الموافقة</th>
                            <th>حالة التليجرام</th>
                            <th>إجراء</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    items.forEach(item => {
        let statusColor = 'black';
        if (item.telegramStatus.includes('فشل')) statusColor = '#dc3545';
        if (item.telegramStatus.includes('تم الإرسال')) statusColor = '#28a745';
        if (item.telegramStatus.includes('جاهز')) statusColor = '#007bff';
        
        const canBeSent = (item.status === 'منشور' || item.status === 'مجدول') && 
                          (item.telegramStatus.includes('فشل') || item.telegramStatus === 'جاهز للإرسال الآلي');

        html += `<tr>
            <td>${item.teacher}</td>
            <td>${item.class}</td>
            <td>${item.subject}</td>
            <td>${item.status}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${item.telegramStatus}</td>
            <td>
                <button onclick="manualSend('${item.id}', '${sheetName}', this)" 
                        class="button btn-telegram" 
                        style="padding: 5px 10px; font-size: 0.8em;"
                        ${!canBeSent ? 'disabled' : ''}
                        title="${canBeSent ? 'إرسال هذا السجل الآن' : 'لا يمكن إرساله يدوياً'}">
                    <i class="fab fa-telegram-plane"></i> إرسال يدوي
                </button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

async function manualSend(itemId, sheetName, btnElement) {
    const confirmResult = await Swal.fire({
        title: 'تأكيد الإرسال',
        text: 'هل أنت متأكد من رغبتك في إرسال هذا الإشعار يدوياً عبر تليجرام الآن؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#007bff',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'نعم، أرسل الآن',
        cancelButtonText: 'إلغاء'
    });

    if (!confirmResult.isConfirmed) return; 
    
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    const result = await callApi('manualSendTelegram', { itemId, sheetName });
    
    if (result.success) {
        alert(result.message);
        if (sheetName === SHEETS.HOMEWORK) {
            loadSubmissionStatusReport(SHEETS.HOMEWORK, 'hwStatusContainer');
        } else {
            loadSubmissionStatusReport(SHEETS.DAILY_EVALUATIONS, 'evalStatusContainer');
        }
    } else {
        alert(result.message);
        btnElement.disabled = false;
        btnElement.innerHTML = '<i class="fab fa-telegram-plane"></i> إرسال يدوي';
    }
}

async function loadSystemSettings() {
    const result = await callApi('getSystemSettings');
    if (result.success) {
        const container = document.getElementById('settingsContainer');
        container.innerHTML = Object.keys(result.settings).map(key => {
            const setting = result.settings[key];
            return `<div class="setting-item">
                        <label>${setting.description}</label>
                        <label class="switch">
                            <input type="checkbox" data-key="${key}" ${setting.value === 'مفتوح' ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>`;
        }).join('');
        container.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', async (event) => {
                const key = event.target.dataset.key;
                const value = event.target.checked ? 'مفتوح' : 'مغلق';
                await callApi('updateSystemSettings', { [key]: value });
            });
        });
    }
}

async function loadAllUsers() {
    const result = await callApi('getAllUsers');
    const container = document.getElementById('usersContainer');
    if (result.success) {
        // (جديد) حفظ قائمة الطلاب للبحث الذكي السريع
        window.allStudentsList = result.users.filter(u => u.role === 'طالب');

        let html = `<div class="table-responsive"><table class="data-table">
            <thead><tr><th>الصورة</th><th>ID</th><th>الاسم/الدور</th><th>الصف/الشعبة</th><th>الحالة</th><th>صلاحية الغياب</th><th>صلاحية الإكسل</th><th>الإجراءات</th></tr></thead><tbody>`;
        
        result.users.forEach(user => {
            const roleBadge = user.role === 'مدرس' ? 'background:#17a2b8' : (user.role === 'إداري' ? 'background:#dc3545' : 'background:#6c757d');
            const classInfo = user.role === 'طالب' ? `<strong>${user.class}</strong><br><small>شعبة: ${user.section}</small>` : '-';
            
            html += `<tr>
                <td><img src="${user.profilePic}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd;"></td>
                <td style="font-weight:bold; color:#555;">${user.userId}</td>
                <td><strong>${user.fullName}</strong><br><span style="display:inline-block; padding:2px 8px; border-radius:12px; color:white; font-size:0.8em; ${roleBadge}">${user.role}</span></td>
                <td>${classInfo}</td>
                <td><span style="color:${user.status==='نشط'?'green':'red'}; font-weight:bold;">${user.status}</span></td>
                <td>${user.role === 'مدرس' ? `<label class="switch"><input type="checkbox" class="permission-toggle" data-userid="${user.userId}" data-permission="canRecordAbsence" ${user.canRecordAbsence ? 'checked' : ''}><span class="slider round"></span></label>` : '-'}</td>
                <td>${user.role === 'مدرس' ? `<label class="switch"><input type="checkbox" class="permission-toggle" data-userid="${user.userId}" data-permission="canUseMasterExcel" ${user.canUseMasterExcel ? 'checked' : ''}><span class="slider round"></span></label>` : '-'}</td>
                <td>
                    <button class="button" style="padding: 5px 10px; font-size: 0.85em; margin-bottom:3px;" onclick="document.getElementById('searchUserId').value='${user.userId}'; loadUserForEditing();"><i class="fas fa-edit"></i> تعديل</button>
                    ${user.role === 'مدرس' ? `<button class="button btn-publish" style="padding: 5px 10px; font-size: 0.85em;" onclick="openTeacherAssignments('${user.userId}', '${user.fullName}')"><i class="fas fa-tasks"></i> المهام</button>` : ''}
                </td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        container.innerHTML = html;

        document.querySelectorAll('.permission-toggle').forEach(toggle => {
            toggle.addEventListener('change', async (event) => {
                const payload = { userId: event.target.dataset.userid, permission: event.target.dataset.permission, value: event.target.checked };
                await callApi('updateUserPermission', payload);
            });
        });
    }
}

async function loadUserForEditing() {
    const userId = document.getElementById('searchUserId').value;
    if (!userId) return alert('الرجاء إدخال ID المستخدم.');
    
    const result = await callApi('getUserDetails', { userId });
    if (!result.success) return alert(result.message);
    
    const { headers, userData } = result;
    const form = document.getElementById('userEditForm');
    form.innerHTML = ''; 
    form.dataset.currentUserId = userId; 
    
    headers.forEach((header, index) => {
        const value = userData[index];
        const isReadOnly = (header === 'ID'); 
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.setAttribute('for', `edit-${header}`);
        label.textContent = header;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `edit-${header}`;
        input.name = header;
        input.value = value;
        if (isReadOnly) input.readOnly = true;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        
        if (['FullName', 'Email', 'Password', 'TelegramID', 'GuardianName', 'GuardianPhone', 'StudentPhone'].includes(header)) {
            formGroup.classList.add('full-width');
        }
        
        form.appendChild(formGroup);
    });
    
    document.getElementById('modalUserName').textContent = userData[4]; 
    document.getElementById('userEditModal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userEditModal').style.display = 'none';
}

async function saveUserChanges() {
    const form = document.getElementById('userEditForm');
    const userId = form.dataset.currentUserId;
    if (!userId) return alert('خطأ: لم يتم العثور على ID المستخدم.');
    
    const inputs = form.querySelectorAll('input, select');
    const newRowData = Array.from(inputs).map(input => input.value); 
    
    const result = await callApi('updateUser', { userId, newRowData });
    if (result.success) {
        alert(result.message);
        closeUserModal();
        loadAllUsers(); 
    }
}

async function archiveStudent() {
    const studentId = document.getElementById('archiveStudentId').value;
    if (!studentId) return alert('الرجاء إدخال ID الطالب.');
    const result = await callApi('archiveStudentGrades', { studentId });
    if (result.success) {
        alert(result.message);
        document.getElementById('archiveStudentId').value = '';
    }
}

async function handleAnnouncementSubmit(e) {
    e.preventDefault(); 
    const payload = { 
        title: document.getElementById('annTitle').value, 
        content: document.getElementById('annContent').value, 
        audience: document.getElementById('annAudience').value,
        sendTelegram: document.getElementById('annSendTelegram').checked
    }; 
    const result = await callApi('createAnnouncement', payload); 
    if (result.success) { 
        alert(result.message); 
        e.target.reset(); 
    } 
}

function addExamDayField() {
    const container = document.getElementById('examDaysContainer');
    const div = document.createElement('div');
    div.className = 'exam-day-row';
    const subjectOptions = (window.allSubjects || []).map(s => `<option value="${s}">${s}</option>`).join('');

    div.innerHTML = `
        <div class="controls" style="padding: 5px; background: #f9f9f9;">
            <input type="date" class="exam-date" required>
            <input type="text" class="exam-day" placeholder="اليوم" required>
            <select class="exam-subject" required><option value="">-- اختر المادة --</option>${subjectOptions}</select>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="button" style="background-color: #dc3545; padding: 8px 12px;">حذف</button>
        </div>
    `;
    container.appendChild(div);
}

async function publishExamScheduleHandler(e) {
    e.preventDefault();
    const scheduleData = [];
    document.querySelectorAll('#examDaysContainer .exam-day-row').forEach(row => {
        scheduleData.push({
            date: row.querySelector('.exam-date').value,
            day: row.querySelector('.exam-day').value,
            subject: row.querySelector('.exam-subject').value
        });
    });
    
    const payload = {
        title: document.getElementById('examScheduleTitle').value,
        targetClass: document.getElementById('examScheduleClass').value,
        scheduleData: scheduleData
    };

    const result = await callApi('publishExamSchedule', payload);
    if (result.success) {
        alert(result.message);
        e.target.reset();
        document.getElementById('examDaysContainer').innerHTML = '';
        addExamDayField();
    }
}

function buildWeeklyScheduleGrid(subjects = []) {
    const container = document.getElementById('weeklyScheduleContainer');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    let html = '';
    const subjectOptions = `<option value="">--</option>` + (subjects || []).map(s => `<option value="${s}">${s}</option>`).join('');

    html += `<div class="schedule-grid">
        <div class="schedule-header"></div> 
        ${[1,2,3,4,5,6].map(i => `<div class="schedule-header">الدرس ${i}</div>`).join('')}
    </div>`;

    days.forEach(day => {
        html += `<div class="schedule-grid">
            <div class="schedule-header">${day}</div>
            ${[1,2,3,4,5,6].map(i => `<select id="${day}-lesson${i}">${subjectOptions}</select>`).join('')}
        </div>`;
    });
    container.innerHTML = html;
}

async function publishWeeklyScheduleHandler(e) {
    e.preventDefault();
    const scheduleData = {};
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    days.forEach(day => {
        scheduleData[day] = {};
        for (let i = 1; i <= 6; i++) {
            const lessonInput = document.getElementById(`${day}-lesson${i}`);
            if (lessonInput && lessonInput.value) {
                scheduleData[day][`lesson${i}`] = lessonInput.value;
            } else {
                scheduleData[day][`lesson${i}`] = ''; 
            }
        }
    });

    const payload = {
        targetClass: document.getElementById('weeklyScheduleClass').value,
        targetSection: document.getElementById('weeklyScheduleSection').value,
        scheduleData: scheduleData
    };

    if (!payload.targetClass || !payload.targetSection) {
        return alert('الرجاء اختيار الصف والشعبة.');
    }
    
    const result = await callApi('publishWeeklySchedule', payload);
    if (result.success) {
        alert(result.message);
    }
}

async function loadExistingWeeklySchedule() {
    const payload = {
        targetClass: document.getElementById('weeklyScheduleClass').value,
        targetSection: document.getElementById('weeklyScheduleSection').value,
    };

    if (!payload.targetClass || !payload.targetSection) {
        return alert('الرجاء اختيار الصف والشعبة لتحميل الجدول.');
    }

    const result = await callApi('getWeeklySchedule', payload);
    if (result.success && result.schedule) {
        const schedule = result.schedule;
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        days.forEach(day => {
            for (let i = 1; i <= 6; i++) {
                const lessonSelect = document.getElementById(`${day}-lesson${i}`);
                if (lessonSelect) {
                    lessonSelect.value = schedule[day]?.[`lesson${i}`] || '';
                }
            }
        });
        alert('تم تحميل الجدول بنجاح.');
    } else {
        alert('لم يتم العثور على جدول محفوظ لهذا الصف والشعبة. يمكنك إنشاء جدول جديد الآن.');
        buildWeeklyScheduleGrid(window.allSubjects || []);
    }
}

async function refreshAdminAnalytics() {
    const res = await callApi('getAdminAnalytics');
    if (res.success) {
        const a = res.analytics;
        document.getElementById('statStudents').innerText = a.studentsCount;
        document.getElementById('statTeachers').innerText = a.teachersCount;
        document.getElementById('statPending').innerText = a.pendingApprovals;
        document.getElementById('statObjections').innerText = a.activeObjections;
    }
}

function attachGradeCalculators() {
    document.querySelectorAll('#studentsGradeContainer tbody tr').forEach(row => {
        const inputs = Array.from(row.querySelectorAll('.grade-input'));
        
        const getVal = (type) => {
            const el = inputs.find(i => i.dataset.gradeType === type);
            return (el && el.value !== '') ? Number(el.value) : null;
        };
        
        const setVal = (type, val) => {
            const el = inputs.find(i => i.dataset.gradeType === type);
            if (el && !el.hasAttribute('readonly') && el.dataset.manualOverride !== 'true') {
                el.value = val;
            }
        };

        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const type = e.target.dataset.gradeType;
                
                if(['Term1_Avg', 'Term2_Avg', 'Yearly_Effort', 'Final_Result'].includes(type)) {
                    e.target.dataset.manualOverride = (e.target.value !== '') ? 'true' : 'false';
                }

                let m1_1 = getVal('Term1_Month1'), m2_1 = getVal('Term1_Month2'), m3_1 = getVal('Term1_Month3');
                let sum1 = 0, count1 = 0;
                if(m1_1 !== null) { sum1 += m1_1; count1++; }
                if(m2_1 !== null) { sum1 += m2_1; count1++; }
                if(m3_1 !== null) { sum1 += m3_1; count1++; }
                if(count1 > 0) setVal('Term1_Avg', Math.round(sum1/count1));

                let m1_2 = getVal('Term2_Month1'), m2_2 = getVal('Term2_Month2'), m3_2 = getVal('Term2_Month3');
                let sum2 = 0, count2 = 0;
                if(m1_2 !== null) { sum2 += m1_2; count2++; }
                if(m2_2 !== null) { sum2 += m2_2; count2++; }
                if(m3_2 !== null) { sum2 += m3_2; count2++; }
                if(count2 > 0) setVal('Term2_Avg', Math.round(sum2/count2));

                let avg1 = getVal('Term1_Avg'), mid = getVal('MidYear_Exam'), avg2 = getVal('Term2_Avg');
                if (avg1 !== null && mid !== null && avg2 !== null) {
                    setVal('Yearly_Effort', Math.round((avg1 + mid + avg2)/3));
                }

                let yearly = getVal('Yearly_Effort'), final_exam = getVal('Final_Exam');
                if (yearly !== null && final_exam !== null) {
                    setVal('Final_Result', Math.round((yearly + final_exam)/2));
                }
            });
        });
    });
}

async function downloadExcelTemplate() {
    const studentClass = document.getElementById('teacherClasses').value;
    const subject = document.getElementById('teacherSubjects').value;
    if (!studentClass || !subject) return alert('الرجاء اختيار الصف والمادة أولاً.');

    Swal.fire({ title: 'جاري تجهيز الملف...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const result = await callApi('getStudentsForExcel', { studentClass, subject });
    if (!result.success) return Swal.fire('خطأ', result.message, 'error');

    const data = [['ID الطالب', 'اسم الطالب', 'الشعبة', 'ش1 (ف1)', 'ش2 (ف1)', 'ش3 (ف1)', 'السعي (ف1)', 'نصف السنة', 'ش1 (ف2)', 'ش2 (ف2)', 'ش3 (ف2)', 'السعي (ف2)', 'السعي السنوي', 'الدفتر النهائي', 'الدرجة النهائية']];

    result.students.forEach(s => {
        const g = result.grades[s.studentId] || {};
        data.push([
            s.studentId, s.name, s.section,
            g.Term1_Month1?.grade || '', g.Term1_Month2?.grade || '', g.Term1_Month3?.grade || '', g.Term1_Avg?.grade || '',
            g.MidYear_Exam?.grade || '',
            g.Term2_Month1?.grade || '', g.Term2_Month2?.grade || '', g.Term2_Month3?.grade || '', g.Term2_Avg?.grade || '',
            g.Yearly_Effort?.grade || '', g.Final_Exam?.grade || '', g.Final_Result?.grade || ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    if(!ws['!views']) ws['!views'] = [];
    ws['!views'][0] = { rightToLeft: true }; 

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الدرجات");
    XLSX.writeFile(wb, `درجات_${studentClass}_${subject}.xlsx`);
    Swal.close();
}

async function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const subject = document.getElementById('teacherSubjects').value;
    if (!subject) {
        e.target.value = '';
        return alert('الرجاء اختيار المادة قبل رفع الملف.');
    }

    const reader = new FileReader();
    reader.onload = async function(evt) {
        const data = evt.target.result;
        const workbook = XLSX.read(data, {type: 'binary'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});

        const gradesPayload = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[0]) continue; 

            const studentId = String(row[0]);
            const grades = {};

            const getVal = (idx) => (row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== '') ? Number(row[idx]) : '';

            let m1_1 = getVal(3), m2_1 = getVal(4), m3_1 = getVal(5), avg_1 = getVal(6);
            let mid = getVal(7);
            let m1_2 = getVal(8), m2_2 = getVal(9), m3_2 = getVal(10), avg_2 = getVal(11);
            let yearly = getVal(12), final_exam = getVal(13), final_result = getVal(14);

            if (avg_1 === '') {
                let sum = 0, count = 0;
                if(m1_1 !== '') { sum += m1_1; count++; }
                if(m2_1 !== '') { sum += m2_1; count++; }
                if(m3_1 !== '') { sum += m3_1; count++; }
                if (count > 0) avg_1 = Math.round(sum / count);
            }

            if (avg_2 === '') {
                let sum = 0, count = 0;
                if(m1_2 !== '') { sum += m1_2; count++; }
                if(m2_2 !== '') { sum += m2_2; count++; }
                if(m3_2 !== '') { sum += m3_2; count++; }
                if (count > 0) avg_2 = Math.round(sum / count);
            }

            if (yearly === '' && avg_1 !== '' && mid !== '' && avg_2 !== '') {
                yearly = Math.round((avg_1 + mid + avg_2) / 3);
            }

            if (final_result === '' && yearly !== '' && final_exam !== '') {
                final_result = Math.round((yearly + final_exam) / 2);
            }

            if(m1_1 !== '') grades.Term1_Month1 = m1_1;
            if(m2_1 !== '') grades.Term1_Month2 = m2_1;
            if(m3_1 !== '') grades.Term1_Month3 = m3_1;
            if(avg_1 !== '') grades.Term1_Avg = avg_1;

            if(mid !== '') grades.MidYear_Exam = mid;

            if(m1_2 !== '') grades.Term2_Month1 = m1_2;
            if(m2_2 !== '') grades.Term2_Month2 = m2_2;
            if(m3_2 !== '') grades.Term2_Month3 = m3_2;
            if(avg_2 !== '') grades.Term2_Avg = avg_2;

            if(yearly !== '') grades.Yearly_Effort = yearly;
            if(final_exam !== '') grades.Final_Exam = final_exam;
            if(final_result !== '') grades.Final_Result = final_result;

            if(Object.keys(grades).length > 0) {
                gradesPayload.push({ studentId, grades });
            }
        }

        if(gradesPayload.length === 0) {
            e.target.value = '';
            return alert('لم يتم العثور على درجات في الملف.');
        }

        Swal.fire({ title: 'جاري حفظ درجات الإكسل...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const result = await callApi('submitGrades', { subject: subject, grades: gradesPayload });
        e.target.value = ''; 

        if (result.success) {
            Swal.fire('نجاح', 'تم رفع وحساب الدرجات وإرسالها للمراجعة بنجاح.', 'success');
            const sec = document.getElementById('teacherSections').value;
            if(sec) loadStudentsForGrading();
        } else {
            Swal.fire('خطأ', result.message, 'error');
        }
    };
    reader.readAsBinaryString(file);
}

// ==========================================================
//               دوال الإكسل الشامل (الماستر) الجديد
// ==========================================================

const ARABIC_GRADE_MAP = {
    'Term1_Month1': 'شهر 1 (ف1)', 'Term1_Month2': 'شهر 2 (ف1)', 'Term1_Month3': 'شهر 3 (ف1)', 'Term1_Avg': 'سعي (ف1)',
    'MidYear_Exam': 'نصف السنة',
    'Term2_Month1': 'شهر 1 (ف2)', 'Term2_Month2': 'شهر 2 (ف2)', 'Term2_Month3': 'شهر 3 (ف2)', 'Term2_Avg': 'سعي (ف2)',
    'Yearly_Effort': 'السعي السنوي', 'Final_Exam': 'الامتحان النهائي', 'Final_Result': 'الدرجة النهائية'
};

async function downloadMasterExcel() {
    const studentClass = document.getElementById('masterClass').value;
    let studentSection = document.getElementById('masterSection').value;
    
    if (!studentClass) return alert('الرجاء تحديد الصف أولاً.');

    // (إصلاح) إذا كان الحقل فارغاً، نعتبره "الكل" 
    if (!studentSection) studentSection = 'الكل';

    const selectedSubjects = Array.from(document.querySelectorAll('.master-subject-cb:checked')).map(cb => cb.value);
    const selectedTypes = Array.from(document.querySelectorAll('#masterGradeTypesContainer input:checked')).map(cb => cb.value);

    if (selectedSubjects.length === 0 || selectedTypes.length === 0) return alert('يجب اختيار مادة واحدة ونوع درجة واحد على الأقل.');

    Swal.fire({ title: 'جاري استخراج البيانات السابقة...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const result = await callApi('getMasterExcelData', { studentClass, studentSection });
    if (!result.success) return Swal.fire('خطأ', result.message, 'error');

    const row1 = ['ID الطالب', 'اسم الطالب', 'الشعبة'];
    const row2 = ['', '', ''];
    const merges = [];
    let colIndex = 3;

    selectedSubjects.forEach(subj => {
        row1[colIndex] = subj; 
        merges.push({ s: {r: 0, c: colIndex}, e: {r: 0, c: colIndex + selectedTypes.length - 1} }); 
        
        selectedTypes.forEach(type => {
            row2[colIndex] = ARABIC_GRADE_MAP[type];
            colIndex++;
        });
        while (row1.length < colIndex) row1.push('');
    });

    const data = [row1, row2];

    result.students.forEach(s => {
        const rowData = [s.studentId, s.name, s.section];
        const studentGrades = result.grades[s.studentId] || {};
        
        selectedSubjects.forEach(subj => {
            const subjGrades = studentGrades[subj] || {};
            selectedTypes.forEach(type => {
                rowData.push(subjGrades[type] !== undefined ? subjGrades[type] : '');
            });
        });
        data.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges; 
    if(!ws['!views']) ws['!views'] = [];
    ws['!views'][0] = { rightToLeft: true }; 

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الشيت_الشامل");
    XLSX.writeFile(wb, `الشيت_الشامل_${studentClass}_${studentSection}.xlsx`);
    Swal.close();
}
async function handleMasterExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
        try {
            const data = evt.target.result;
            const workbook = XLSX.read(data, {type: 'binary'});
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});

            if (rows.length < 3) {
                e.target.value = '';
                return alert('الملف فارغ أو تنسيقه غير صحيح. تأكد من أنك تستخدم النموذج المخصص للإكسل الشامل.');
            }

            const header1 = rows[0] || []; 
            const header2 = rows[1] || []; 

            const colMapping = {};
            let currentSubject = '';
            
            const maxCols = Math.max(header1.length, header2.length);
            for (let c = 3; c < maxCols; c++) {
                if (header1[c] && String(header1[c]).trim() !== '') {
                    currentSubject = String(header1[c]).trim();
                }
                if (currentSubject && header2[c]) {
                    const arabicType = String(header2[c]).trim();
                    const englishType = Object.keys(ARABIC_GRADE_MAP).find(key => ARABIC_GRADE_MAP[key] === arabicType);
                    if (englishType) {
                        colMapping[c] = { subject: currentSubject, type: englishType };
                    }
                }
            }

            const gradesPayload = [];
            
            for (let i = 2; i < rows.length; i++) {
                const row = rows[i];
                if (!row || !row[0]) continue;
                
                const studentId = String(row[0]).trim();
                if (!studentId) continue;

                const studentSubjectGrades = {}; 
                
                for (let c = 3; c < row.length; c++) {
                    const map = colMapping[c];
                    
                    if (!map || !map.subject) continue; 

                    const val = row[c];
                    if (val !== undefined && val !== null && String(val).trim() !== '') {
                        if (!studentSubjectGrades[map.subject]) {
                            studentSubjectGrades[map.subject] = {};
                        }
                        studentSubjectGrades[map.subject][map.type] = Number(val);
                    }
                }
                
                for (const subj in studentSubjectGrades) {
                    if (Object.keys(studentSubjectGrades[subj]).length > 0) {
                        gradesPayload.push({
                            studentId: studentId,
                            subject: subj, 
                            grades: studentSubjectGrades[subj]
                        });
                    }
                }
            }

            if (gradesPayload.length === 0) {
                e.target.value = '';
                return alert('لم يتم العثور على أي درجات جديدة في الملف. تأكد من تعبئة الدرجات تحت الأعمدة الصحيحة.');
            }

            Swal.fire({ title: 'جاري معالجة الإكسل الشامل...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            
            const result = await callApi('submitGrades', { grades: gradesPayload });
            e.target.value = ''; 

            if (result.success) {
                Swal.fire('نجاح', 'تم رفع الملف بنجاح! تم حفظ التعديلات الجديدة وتجاهل الدرجات التي لم تتغير.', 'success');
            } else {
                Swal.fire('خطأ', result.message, 'error');
            }
            
        } catch (error) {
            console.error('Excel Upload Error:', error);
            e.target.value = '';
            Swal.fire('خطأ', 'حدث خطأ أثناء قراءة الملف. يرجى التأكد من أن الملف سليم وغير تالف.', 'error');
        }
    };
    reader.readAsBinaryString(file);
}

// ==========================================================
//               الهيكلية الأكاديمية وإدارة المهام (جديد)
// ==========================================================
function renderAcademicStructureUI() {
    const s = window.academicStructure;
    if(!s) return;

    const renderTags = (arr, type) => arr.map(item => `<span style="background: #007bff; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; display:inline-block;">${item} <i class="fas fa-times" style="margin-right: 8px; cursor: pointer; color:#ffcccc;" onclick="removeStructureItem('${type}', '${item}')"></i></span>`).join('');
    
    document.getElementById('classesListContainer').innerHTML = renderTags(s.classes, 'classes');
    document.getElementById('sectionsListContainer').innerHTML = renderTags(s.sections, 'sections');
    document.getElementById('globalSubjectsContainer').innerHTML = renderTags(s.globalSubjects, 'globalSubjects');
    
    populateSelect('classMapperSelect', s.classes, '-- اختر الصف للتخصيص --');
}

function addStructureItem(type, inputId) {
    const val = document.getElementById(inputId).value.trim();
    if(!val) return;
    if(!window.academicStructure[type].includes(val)) {
        window.academicStructure[type].push(val);
        document.getElementById(inputId).value = '';
        renderAcademicStructureUI();
    }
}

function removeStructureItem(type, item) {
    if(confirm(`هل أنت متأكد من حذف (${item})؟`)) {
        window.academicStructure[type] = window.academicStructure[type].filter(i => i !== item);
        renderAcademicStructureUI();
    }
}

// (جديد) دالة عرض الشعب والمواد للترتيب
function renderClassMapping() {
    const selectedClass = document.getElementById('classMapperSelect').value;
    const container = document.getElementById('classMappingContainer');
    const secContainer = document.getElementById('classSectionsMapping');
    const subjContainer = document.getElementById('classSubjectsMapping');

    if(!selectedClass) { container.style.display = 'none'; return; }
    container.style.display = 'block';

    const s = window.academicStructure;
    if(!s.classSections) s.classSections = {};
    if(!s.classSubjects) s.classSubjects = {};

    if(!s.classSections[selectedClass]) s.classSections[selectedClass] = [...s.sections];
    if(!s.classSubjects[selectedClass]) s.classSubjects[selectedClass] = [...s.globalSubjects];

    const mySections = s.classSections[selectedClass];
    const mySubjects = s.classSubjects[selectedClass];

    // عرض الشعب
    secContainer.innerHTML = s.sections.map(sec => {
        const isChecked = mySections.includes(sec) ? 'checked' : '';
        return `<label style="padding: 5px 10px; background: ${isChecked?'#eafaf1':'#f8f9fa'}; border: 1px solid #ddd; border-radius: 4px; cursor:pointer;">
            <input type="checkbox" onchange="updateClassSection('${selectedClass}', '${sec}', this.checked)" ${isChecked}> ${sec}
        </label>`;
    }).join('');

    // عرض المواد مع الترتيب
    let subjHtml = '';
    // المواد المختارة (بالترتيب)
    mySubjects.forEach((subj, idx) => {
        subjHtml += `<div style="display:flex; align-items:center; gap:5px; padding: 5px; background: #eafaf1; border: 1px solid #28a745; border-radius: 4px;">
            <input type="checkbox" checked onchange="removeClassSubject('${selectedClass}', '${subj}')">
            <label style="width: 100px; font-weight:bold;">${subj}</label>
            <input type="number" value="${idx + 1}" onchange="changeSubjectOrder('${selectedClass}', '${subj}', this.value)" style="width:50px; padding:2px; text-align:center; border:1px solid #28a745;" title="تغيير التسلسل">
        </div>`;
    });
    // المواد غير المختارة
    s.globalSubjects.forEach(subj => {
        if(!mySubjects.includes(subj)) {
            subjHtml += `<div style="display:flex; align-items:center; gap:5px; padding: 5px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px;">
                <input type="checkbox" onchange="addClassSubject('${selectedClass}', '${subj}')">
                <label style="width: 100px;">${subj}</label>
            </div>`;
        }
    });
    subjContainer.innerHTML = subjHtml;
}

function updateClassSection(className, section, isAdd) {
    let arr = window.academicStructure.classSections[className] || [];
    if(isAdd && !arr.includes(section)) arr.push(section);
    else if(!isAdd) arr = arr.filter(s => s !== section);
    window.academicStructure.classSections[className] = arr;
}

function addClassSubject(className, subject) {
    window.academicStructure.classSubjects[className].push(subject);
    renderClassMapping();
}

function removeClassSubject(className, subject) {
    window.academicStructure.classSubjects[className] = window.academicStructure.classSubjects[className].filter(s => s !== subject);
    renderClassMapping();
}

function changeSubjectOrder(className, subject, newOrderStr) {
    const newOrder = parseInt(newOrderStr) - 1;
    let arr = window.academicStructure.classSubjects[className];
    const currentIndex = arr.indexOf(subject);
    if(currentIndex > -1 && newOrder >= 0 && newOrder < arr.length) {
        // إزالة المادة من مكانها القديم ووضعها في المكان الجديد
        arr.splice(currentIndex, 1);
        arr.splice(newOrder, 0, subject);
        window.academicStructure.classSubjects[className] = arr;
        renderClassMapping();
    }
}

async function saveAcademicStructure() {
    Swal.fire({ title: 'جاري الحفظ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const res = await callApi('updateSchoolStructure', { structure: window.academicStructure });
    if(res.success) {
        Swal.fire('نجاح', res.message, 'success');
        setTimeout(() => location.reload(), 1500);
    }
}

function renderClassSubjectMapping() {
    const selectedClass = document.getElementById('classSubjectMapper').value;
    const container = document.getElementById('classSubjectMappingContainer');
    if(!selectedClass) { container.innerHTML = '<p style="color: #888;">الرجاء اختيار صف لعرض المواد...</p>'; return; }
    
    const s = window.academicStructure;
    if(!s.classSubjects[selectedClass]) s.classSubjects[selectedClass] = [...s.globalSubjects];
    
    const classSubjs = s.classSubjects[selectedClass];
    
    container.innerHTML = s.globalSubjects.map(subj => {
        const isChecked = classSubjs.includes(subj) ? 'checked' : '';
        return `<label style="padding: 10px; border: 1px solid #eee; border-radius: 5px; background: ${isChecked?'#eafaf1':'#fff'}; cursor:pointer;">
            <input type="checkbox" value="${subj}" onchange="toggleSubjectForClass('${selectedClass}', '${subj}', this.checked)" ${isChecked}> ${subj}
        </label>`;
    }).join('');
}

function toggleSubjectForClass(className, subject, isChecked) {
    let arr = window.academicStructure.classSubjects[className] || [];
    if(isChecked && !arr.includes(subject)) arr.push(subject);
    else if(!isChecked) arr = arr.filter(s => s !== subject);
    window.academicStructure.classSubjects[className] = arr;
    renderClassSubjectMapping();
}

async function saveAcademicStructure() {
    Swal.fire({ title: 'جاري الحفظ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const res = await callApi('updateSchoolStructure', { structure: window.academicStructure });
    if(res.success) {
        Swal.fire('نجاح', res.message, 'success');
        setTimeout(() => location.reload(), 1500);
    }
}

let currentEditingTeacherId = null;
let currentTeacherAssignments = [];

function renderModalDaysGrid(availability) {
    const grid = document.getElementById('modalDaysGrid');
    if (!grid) return;
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    let html = '';
    days.forEach(day => {
        html += `<div style="border: 1px solid #ccc; padding: 5px; border-radius: 4px; background: #fff; min-width: 140px;">
                    <strong>${day}:</strong><br>
                    ${[1,2,3,4,5,6].map(p => {
                        const isChecked = availability ? (availability[day] && availability[day].includes(p)) : true;
                        return `<label style="font-size:0.85em; margin-left:3px;"><input type="checkbox" class="modal-period-cb" data-day="${day}" value="${p}" ${isChecked ? 'checked' : ''}> د${p}</label>`;
                    }).join(' ')}
                 </div>`;
    });
    grid.innerHTML = html;
}

async function openTeacherAssignments(teacherId, teacherName) {
    currentEditingTeacherId = teacherId;
    document.getElementById('modalTeacherName').textContent = teacherName;
    document.getElementById('teacherAssignmentsModal').style.display = 'flex';
    
    const s = window.academicStructure;
    populateSelect('assignClass', s.classes, '-- اختر الصف --');
    populateSelect('assignSection', ['الكل', ...s.sections], '-- اختر الشعبة --');
    
    document.getElementById('currentAssignmentsTable').querySelector('tbody').innerHTML = '<tr><td colspan="5">جاري التحميل...</td></tr>';
    
    // جلب المهام بالإضافة إلى قيود الجدول
    const res = await callApi('getTeacherAssignmentsAdmin', { teacherId });
    if(res.success) {
        currentTeacherAssignments = res.assignments;
        document.getElementById('modalMaxPeriods').value = res.constraints ? res.constraints.maxPeriods : 20;
        renderModalDaysGrid(res.constraints ? res.constraints.availability : null);
        renderTeacherAssignmentsTable();
    }
}

function addTeacherAssignmentRow() {
    const cls = document.getElementById('assignClass').value;
    const sec = document.getElementById('assignSection').value;
    const sub = document.getElementById('assignSubject').value;
    const periods = parseInt(document.getElementById('assignPeriods').value) || 2;
    
    if(!cls || !sec || !sub) return alert('الرجاء اختيار الصف والشعبة والمادة.');
    
    const s = window.academicStructure;
    let sectionsToAdd = [];
    
    if (sec === 'الكل') {
        sectionsToAdd = (s.classSections && s.classSections[cls]) ? s.classSections[cls] : s.sections;
    } else {
        sectionsToAdd = [sec];
    }
    
    let addedAny = false;
    
    sectionsToAdd.forEach(sectionName => {
        const exists = currentTeacherAssignments.some(a => a.class === cls && a.section === sectionName && a.subject === sub);
        if(!exists) {
            // إضافة عدد الحصص للمهمة
            currentTeacherAssignments.push({ class: cls, section: sectionName, subject: sub, periods: periods });
            addedAny = true;
        }
    });
    
    if(!addedAny) return alert('هذه المهام مسندة مسبقاً لهذا المدرس!');
    
    renderTeacherAssignmentsTable();
}

function removeTeacherAssignment(index) {
    currentTeacherAssignments.splice(index, 1);
    renderTeacherAssignmentsTable();
}

function renderTeacherAssignmentsTable() {
    const tbody = document.getElementById('currentAssignmentsTable').querySelector('tbody');
    if(currentTeacherAssignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:#888;">لا توجد مهام مسندة.</td></tr>';
        return;
    }
    tbody.innerHTML = currentTeacherAssignments.map((a, idx) => `
        <tr>
            <td>${a.class}</td><td>${a.section}</td><td>${a.subject}</td><td style="font-weight:bold; color:#dc3545;">${a.periods || 2} حصص</td>
            <td><button onclick="removeTeacherAssignment(${idx})" class="button btn-reject" style="padding: 5px; font-size: 0.8em;"><i class="fas fa-trash"></i> حذف</button></td>
        </tr>
    `).join('');
}

async function saveTeacherAssignments() {
    Swal.fire({ title: 'جاري الحفظ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    
    // تجميع أوقات التواجد
    let availability = {};
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    days.forEach(d => availability[d] = []);
    document.querySelectorAll('.modal-period-cb:checked').forEach(cb => {
        availability[cb.dataset.day].push(parseInt(cb.value));
    });

    const constraints = {
        maxPeriods: parseInt(document.getElementById('modalMaxPeriods').value) || 20,
        availability: availability
    };

    const payload = {
        teacherId: currentEditingTeacherId,
        teacherName: document.getElementById('modalTeacherName').textContent,
        assignments: currentTeacherAssignments,
        constraints: constraints
    };

    const res = await callApi('saveTeacherAssignmentsAdmin', payload);
    if(res.success) {
        Swal.fire('نجاح', res.message, 'success');
        document.getElementById('teacherAssignmentsModal').style.display = 'none';
    }
}

// ==========================================================
//               فلترة الإكسل الشامل (مواد وشعب ديناميكية)
// ==========================================================
function updateMasterExcelFilters() {
    const selectedClass = document.getElementById('masterClass').value;
    const subjContainer = document.getElementById('masterSubjectsContainer');
    const sectionSelect = document.getElementById('masterSection');

    if (!selectedClass) {
        subjContainer.innerHTML = '<p style="color:#888;">الرجاء اختيار الصف لتظهر المواد.</p>';
        sectionSelect.innerHTML = '<option value="الكل">جميع الشعب</option>';
        return;
    }

    let availableSubjects = [];
    let availableSections = [];

    const userData = JSON.parse(localStorage.getItem('userData'));
    const isTeacher = userData && userData.role === 'مدرس';

    if (isTeacher) {
        const assignments = window.teacherRawAssignments || [];
        const classAssignments = assignments.filter(a => a.class === selectedClass);
        
        availableSubjects = [...new Set(classAssignments.map(a => a.subject))];
        availableSections = [...new Set(classAssignments.map(a => a.section))];
    } else {
        const s = window.academicStructure;
        if (s && s.classSubjects && s.classSubjects[selectedClass]) {
            availableSubjects = s.classSubjects[selectedClass]; 
        } else {
            availableSubjects = window.allSubjects || [];
        }
        
        // (إصلاح): الاعتماد على الشعب المخصصة للصف بدلاً من كل الشعب
        if (s && s.classSections && s.classSections[selectedClass]) {
             availableSections = s.classSections[selectedClass];
        } else {
             availableSections = window.allSections || [];
        }
    }

    let secOptions = '<option value="الكل">جميع الشعب</option>';
    availableSections.forEach(sec => {
        if(sec !== 'الكل') secOptions += `<option value="${sec}">${sec}</option>`;
    });
    sectionSelect.innerHTML = secOptions || '<option value="الكل">جميع الشعب</option>';

    if (availableSubjects.length > 0) {
        subjContainer.innerHTML = availableSubjects.map(subj => 
            `<label style="margin-left: 10px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa;">
                <input type="checkbox" value="${subj}" class="master-subject-cb" checked> ${subj}
            </label>`
        ).join('');
    } else {
        subjContainer.innerHTML = '<p style="color:red;">لا توجد مواد مخصصة لهذا الصف.</p>';
    }
}

// دالة تحديث قائمة الشعب في نافذة مهام المدرس
function updateAssignSubjects() {
    const selectedClass = document.getElementById('assignClass').value;
    const s = window.academicStructure;
    const availableSubjects = s.classSubjects[selectedClass] || s.globalSubjects;
    const availableSections = s.classSections[selectedClass] || s.sections;
    
    populateSelect('assignSubject', availableSubjects, '-- اختر المادة --');
    populateSelect('assignSection', ['الكل', ...availableSections], '-- اختر الشعبة --');
}

// ==========================================================
//               فلترة القوائم المترابطة (للمدرس)
// ==========================================================
function updateTeacherFilters(prefix) {
    const classSelect = document.getElementById(`${prefix}Classes`);
    const sectionSelect = document.getElementById(`${prefix}Sections`);
    const subjectSelect = document.getElementById(`${prefix}Subjects`);

    const selectedClass = classSelect ? classSelect.value : null;
    const assignments = window.teacherRawAssignments || [];
    
    if (!selectedClass) {
        if (sectionSelect) sectionSelect.innerHTML = '<option value="">-- اختر الصف أولاً --</option>';
        if (subjectSelect) subjectSelect.innerHTML = '<option value="">-- اختر الصف أولاً --</option>';
        return;
    }

    // جلب المهام المرتبطة بهذا الصف فقط
    const classAssignments = assignments.filter(a => a.class === selectedClass);

    if (sectionSelect) {
        const sections = [...new Set(classAssignments.map(a => a.section))];
        let secOptions = '<option value="الكل">جميع الشعب</option>';
        sections.forEach(sec => {
            if (sec !== 'الكل') secOptions += `<option value="${sec}">${sec}</option>`;
        });
        sectionSelect.innerHTML = secOptions;
    }

    if (subjectSelect) {
        const subjects = [...new Set(classAssignments.map(a => a.subject))];
        let subOptions = '';
        subjects.forEach(sub => {
            subOptions += `<option value="${sub}">${sub}</option>`;
        });
        subjectSelect.innerHTML = subOptions || '<option value="">لا توجد مواد مسندة</option>';
    }
}