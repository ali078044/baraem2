// ==========================================================
//                     الإعدادات العامة
// ==========================================================
// (لا تقم بتغيير هذا التوكن إلا إذا قمت بتغييره في تليجرام)
// رمز البوت لم يعد مكتوباً هنا. ضعه مرة واحدة في:
// إعدادات المشروع (Project Settings) ← خصائص السكربت (Script properties) ← TELEGRAM_BOT_TOKEN
function getBotToken_() {
  return PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || '';
}

// تعريف أسماء الصفحات
// تعريف أسماء الصفحات
// تعريف أسماء الصفحات
// (التعديل الكامل) تعريف أسماء الصفحات وإضافة جدول التتبع والأرشيف الذكي
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
  TEACHER_ASSIGNMENTS: 'TeacherAssignments',
  OBJECTIONS: 'الاعتراضات',
  VIEWS_TRACKING: 'تتبع_المشاهدات', // (جديد) لميزة تتبع المشاهدات
  TIMETABLE_CONSTRAINTS: 'قيود_الجدول', // (إصلاح) كان الاسم غير معرّف
  SMART_TIMETABLES_ARCHIVE: 'أرشيف_الجداول_الذكية' // (جديد) لحفظ نسخ الجدول الذكي المعتمدة
};

/**
 * دالة لإنشاء وتحديث جميع الصفحات والأعمدة المطلوبة تلقائياً
 * (تم تعديلها لتشمل جدول التتبع الجديد)
 */
/**
 * دالة لإنشاء وتحديث جميع الصفحات والأعمدة المطلوبة تلقائياً
 * تقوم بفحص النقص في الأعمدة وإضافته دون المساس بالبيانات القديمة
 */
/**
 * دالة تهيئة النظام: تفحص وجود الصفحات وتنشئ الناقص منها مع حماية البيانات الموجودة.
 * تضمن وجود صفحة أرشيف الجداول لمنع ظهور رسائل الخطأ.
 */
function createRequiredSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // القائمة المحدثة لجميع الصفحات المطلوبة في النظام
  const requiredSheets = [
    SHEETS.USERS, 
    SHEETS.GRADES, 
    SHEETS.GRADES_ARCHIVE, 
    SHEETS.ABSENCES,
    SHEETS.ANNOUNCEMENTS, 
    SHEETS.SETTINGS, 
    SHEETS.HOMEWORK, 
    SHEETS.DAILY_EVALUATIONS,
    SHEETS.LIBRARY, 
    SHEETS.EXAM_SCHEDULES, 
    SHEETS.WEEKLY_SCHEDULES,
    SHEETS.TEACHER_ASSIGNMENTS, 
    SHEETS.OBJECTIONS, 
    SHEETS.VIEWS_TRACKER,
    'أرشيف_الجداول_الذكية' // إضافة الصفحة المسببة للتحذير بشكل صريح
  ];

  requiredSheets.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      // إنشاء الصفحة فقط إذا لم تكن موجودة
      sheet = ss.insertSheet(name);
      
      // إعداد رؤوس الأعمدة الأساسية لصفحة الأرشيف إذا تم إنشاؤها حديثاً
      if (name === 'أرشيف_الجداول_الذكية') {
        sheet.appendRow(['versionId', 'versionName', 'publishDate', 'dataJSON', 'createdBy']);
        sheet.getRange("1:1").setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      // يمكنك هنا إضافة شروط مشابهة لبقية الصفحات الجديدة لضمان هيكلية صحيحة
      console.log("تم إنشاء الصفحة: " + name);
    } else {
      console.log("الصفحة موجودة مسبقاً: " + name);
    }
  });

  return successResponse({ 
    message: "تم تحديث هيكلية النظام بنجاح. جميع الصفحات المطلوبة متوفرة الآن والبيانات القديمة آمنة." 
  });
}

/**
 * دالة مخصصة لإنشاء صفحة تتبع المشاهدات فقط في حال عدم وجودها
 */
function initTrackingSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'تتبع_المشاهدات';
  const headers = ['ViewID', 'ItemID', 'ItemType', 'StudentID', 'ViewDate'];
  
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length)
         .setValues([headers])
         .setFontWeight('bold')
         .setBackground('#eeeeee');
    sheet.setFrozenRows(1);
    SpreadsheetApp.getUi().alert('تم إضافة صفحة تتبع_المشاهدات بنجاح!');
  } else {
    SpreadsheetApp.getUi().alert('الصفحة موجودة بالفعل، لا حاجة لإضافتها.');
  }
}


// ==========================================================
//               دالة الإعداد (محدثة)
// ==========================================================
/**
 * عند فتح ملف جوجل شيت، يضيف قائمة مخصصة لتشغيل الإعداد
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('إعدادات النظام')
    .addItem('فحص وإصلاح الصفحات الناقصة', 'repairSheetsNow')
    .addItem('تفعيل النسخ الاحتياطي الأسبوعي', 'setupWeeklyBackup')
    .addItem('أخذ نسخة احتياطية الآن', 'backupSpreadsheet')
    .addItem('تجربة إشعار لمستخدم', 'testPushToUser')
    .addSeparator()
    .addItem('إنشاء/تحديث الصفحات والبيانات التجريبية', 'createRequiredSheets')
    .addToUi();
}

/**
 * دالة لإنشاء جميع الصفحات والأعمدة المطلوبة تلقائياً
 */
function createRequiredSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // (تم تعديل الأعمدة هنا لتطابق الكود الجديد)
 const schema = {
    [SHEETS.USERS]: ['ID', 'Email', 'Password', 'Role', 'FullName', 'Status', 'Class', 'Section', 'GuardianName', 'GuardianPhone', 'StudentPhone', 'CanRecordAbsence', 'TelegramID'],
    [SHEETS.GRADES]: ['RecordID', 'StudentID', 'Subject', 'GradeType', 'Grade', 'Term1_Avg', 'MidYear_Exam', 'Term2_Avg', 'Yearly_Effort', 'Final_Exam', 'Final_Result', 'GradeNotes', 'UpdatedAt', 'UpdatedByID', 'Status', 'ChangesJSON', 'UpdatedByName', 'TelegramStatus'], 
    [SHEETS.GRADES_ARCHIVE]: ['RecordID', 'StudentID', 'Subject', 'GradeType', 'Grade', 'Term1_Avg', 'MidYear_Exam', 'Term2_Avg', 'Yearly_Effort', 'Final_Exam', 'Final_Result', 'GradeNotes', 'UpdatedAt', 'UpdatedByID', 'Status', 'ChangesJSON', 'UpdatedByName', 'TelegramStatus'],
    [SHEETS.ABSENCES]: ['AbsenceID', 'StudentID', 'Date', 'Notes', 'RecordedBy', 'Status', 'TelegramStatus'],
    [SHEETS.ANNOUNCEMENTS]: ['AnnounceID', 'Date', 'Title', 'Audience', 'Content', 'PostedBy'],
    [SHEETS.SETTINGS]: ['SettingKey', 'SettingValue', 'Description'],
    [SHEETS.HOMEWORK]: ['HomeworkID', 'SubmitDate', 'Class', 'Section', 'Subject', 'Status', 'Content', 'TeacherName', 'TelegramStatus', 'SentDate'], 
    [SHEETS.DAILY_EVALUATIONS]: ['EvalID', 'StudentID', 'TeacherID', 'Date', 'Subject', 'DailyPrep', 'Participation', 'Behavior', 'Homework', 'Note', 'Status', 'TeacherName', 'TelegramStatus'],
    [SHEETS.LIBRARY]: ['LinkID', 'Date', 'Title', 'URL', 'Class', 'Status', 'Subject', 'Description', 'TeacherName', 'TelegramStatus'],
    [SHEETS.EXAM_SCHEDULES]: ['ExamScheduleID', 'Date', 'TargetClass', 'Title', 'ScheduleDataJSON'],
    [SHEETS.WEEKLY_SCHEDULES]: ['ScheduleID', 'TargetClass', 'TargetSection', 'ScheduleDataJSON', 'LastUpdated'],
    [SHEETS.TEACHER_ASSIGNMENTS]: ['TeacherID', 'TeacherName', 'Class', 'Section', 'Subject'],
    [SHEETS.OBJECTIONS]: ['ObjectionID', 'Date', 'StudentID', 'Subject', 'Content', 'AdminStatus', 'TeacherStatus', 'TeacherID', 'TeacherReply'] // (جديد)
  };

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  for (const sheetName in schema) {
    let sheet = ss.getSheetByName(sheetName);
    const headers = schema[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setFontWeight('bold').setBackground('#eeeeee');
      sheet.setFrozenRows(1);
      createdCount++;
    } else {
      // (جديد) التحقق من الأعمدة الناقصة وإضافتها
      const currentHeaders = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
      let headerChanged = false;
      headers.forEach((header) => {
        if (!currentHeaders.includes(header)) {
          sheet.getRange(1, currentHeaders.length + 1).setValue(header);
          currentHeaders.push(header);
          headerChanged = true;
        }
      });
      if (headerChanged) {
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
  }
  
  prefillTestData_(ss);
  ui.alert('اكتمل الإعداد!', `تم إنشاء ${createdCount} صفحات جديدة. تم تحديث ${updatedCount} صفحات. تم تخطي ${skippedCount} صفحات موجودة بالفعل.`, ui.ButtonSet.OK);
}

/**
 * دالة مساعدة لملء البيانات التجريبية (تم إصلاح خطأ الإعدادات)
 */
function prefillTestData_(ss) {
  try {
    const settingsSheet = ss.getSheetByName(SHEETS.SETTINGS);
    if (settingsSheet && settingsSheet.getLastRow() === 1) { 
      const settingsData = [
        ['Term1_Month1_Status', 'مفتوح', 'صلاحية إدخال درجة الشهر الأول (ف1)'], ['Term1_Month2_Status', 'مغلق', 'صلاحية إدخال درجة الشهر الثاني (ف1)'],
        ['Term1_Month3_Status', 'مغلق', 'صلاحية إدخال درجة الشهر الثالث (ف1)'], ['Term1_Avg_Status', 'مغلق', 'صلاحية إدخال السعي (ف1)'],
        ['MidYear_Exam_Status', 'مغلق', 'صلاحية إدخال درجة نصف السنة'], 
        ['Term2_Month1_Status', 'مغلق', 'صلاحية إدخال درجة الشهر الأول (ف2)'], ['Term2_Month2_Status', 'مغلق', 'صلاحية إدخال درجة الشهر الثاني (ف2)'], 
        ['Term2_Month3_Status', 'مغلق', 'صلاحية إدخال درجة الشهر الثالث (ف2)'], ['Term2_Avg_Status', 'مغلق', 'صلاحية إدخال السعي (ف2)'],
        ['Yearly_Effort_Status', 'مغلق', 'صلاحية إدخال السعي السنوي'],
        ['Final_Exam_Status', 'مغلق', 'صلاحية إدخال درجة الامتحان النهائي'], ['Final_Result_Status', 'مغلق', 'صلاحية إدخال الدرجة النهائية']
      ];
      // تم الإصلاح هنا (فصل السطر واستخدام settingsSheet)
      settingsSheet.getRange(2, 1, settingsData.length, settingsData[0].length).setValues(settingsData);
    }
    const usersSheet = ss.getSheetByName(SHEETS.USERS);
    if (usersSheet && usersSheet.getLastRow() === 1) {
      const usersData = [
        ['A-001', 'admin@riahi.com', '123456', 'إداري', 'مشرف النظام', 'نشط', '', '', '', '', '', 'لا', 'ADMIN_TELEGRAM_ID'],
        ['T-001', 'teacher@riahi.com', '123456', 'مدرس', 'أستاذ علي', 'نشط', '', '', '', '', '', 'نعم', 'TEACHER_TELEGRAM_ID'],
        ['S-001', 'student@riahi.com', '123456', 'طالب', 'الطالب محمد', 'نشط', 'الأول المتوسط', 'أ', 'ولي أمر محمد', '07700000000', '', 'لا', 'STUDENT_TELEGRAM_ID']
      ];
      usersSheet.getRange(2, 1, usersData.length, usersData.length > 0 ? usersData[0].length : 0).setValues(usersData);
    }
    const assignmentsSheet = ss.getSheetByName(SHEETS.TEACHER_ASSIGNMENTS);
    if (assignmentsSheet && assignmentsSheet.getLastRow() === 1) {
      const assignmentsData = [
        ['T-001', 'أستاذ علي', 'الأول المتوسط', 'أ', 'الرياضيات'], ['T-001', 'أستاذ علي', 'الأول المتوسط', 'أ', 'العلوم']
      ];
      assignmentsSheet.getRange(2, 1, assignmentsData.length, assignmentsData[0].length).setValues(assignmentsData);
    }
    const weeklySheet = ss.getSheetByName(SHEETS.WEEKLY_SCHEDULES);
    if (weeklySheet && weeklySheet.getLastRow() === 1) {
      const scheduleJSON = {"الأحد": {"lesson1": "الرياضيات", "lesson2": "العلوم", "lesson3": "العربي", "lesson4": "الانكليزي", "lesson5": "الاسلامية", "lesson6": "الرياضة"}, "الاثنين": {"lesson1": "الرياضيات", "lesson2": "العلوم", "lesson3": "العربي", "lesson4": "الانكليزي", "lesson5": "الفنية", "lesson6": "الحاسوب"}, "الثلاثاء": {"lesson1": "الرياضيات", "lesson2": "العلوم", "lesson3": "العربي", "lesson4": "الانكليزي", "lesson5": "الاجتماعيات", "lesson6": ""}, "الأربعاء": {"lesson1": "الرياضيات", "lesson2": "العلوم", "lesson3": "العربي", "lesson4": "الانكليزي", "lesson5": "الاسلامية", "lesson6": ""}, "الخميس": {"lesson1": "الرياضيات", "lesson2": "العلوم", "lesson3": "العربي", "lesson4": "الانكليزي", "lesson5": "الاجتماعيات", "lesson6": ""}, "الجمعة": {}, "السبت": {}};
      const weeklyData = [['WS-001', 'الأول المتوسط', 'أ', JSON.stringify(scheduleJSON), new Date()]];
      weeklySheet.getRange(2, 1, weeklyData.length, weeklyData[0].length).setValues(weeklyData);
    }
  } catch (e) { Logger.log('Error prefilling test data: ' + e.message); }
}



// ==========================================================
//                   الموجه الرئيسي (Router)
// ==========================================================
// ==========================================================
//                   الموجه الرئيسي (Router)
// ==========================================================
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const payload = requestData.payload || {};
    let userInfo = null;

    // أوامر بلا تسجيل دخول: الدخول، واستعادة كلمة المرور عبر Gmail
    const isPublic = action === 'login' || (typeof PUBLIC_ACTIONS_ !== 'undefined' && PUBLIC_ACTIONS_.indexOf(action) > -1);
    if (!isPublic) {
      // التحقق الحقيقي: الرمز يجب أن يطابق جلسة صادرة من الخادم، والدور يُقرأ من الشيت لا من المتصفح
      userInfo = authenticate_(requestData.userInfo);
      if (!userInfo) return jsonOut_(errorResponse('انتهت الجلسة، يرجى تسجيل الدخول مجدداً.', '', 'AUTH'));
      const denied = authorize_(action, userInfo, payload);
      if (denied) return jsonOut_(errorResponse(denied, '', 'FORBIDDEN'));
      if (action === 'logout') { endSession_(requestData.userInfo); return jsonOut_(successResponse({}, 'تم تسجيل الخروج.')); }
      // وليّ الأمر يقرأ بيانات ابنه باسم الابن، بعد التحقق من الربط
      if (typeof actingUser_ === 'function') userInfo = actingUser_(action, payload, userInfo);
    }

    // (جديد) النظام يجهّز أي صفحة أو عمود ناقص بنفسه قبل تنفيذ الطلب
    ensureSchema_();

    let result;
    switch (action) {
      case 'registerPushToken': result = registerPushToken(payload, userInfo); break;
      case 'unregisterPushToken': result = unregisterPushToken(payload, userInfo); break;
      case 'getNotifications': result = getNotifications(payload, userInfo); break;
      case 'getEvaluationsLog': result = getEvaluationsLog(payload, userInfo); break;
      case 'markNotificationsRead': result = markNotificationsRead(payload, userInfo); break;
      case 'login': result = handleLogin(payload); break;
      case 'getStudentDashboard': result = getStudentDashboard(userInfo); break; 
      case 'getTeacherDashboard': result = getTeacherDashboard(userInfo); break;
      case 'getMasterExcelData': result = getMasterExcelData(payload); break;
      case 'getTeacherSentHomework': result = getTeacherSentHomework(userInfo); break;
      case 'getItemViews': result = getItemViews(payload); break;
      case 'getStudentsForGrading': result = getStudentsForGrading(payload, userInfo); break;
      case 'getStudentsForExcel': result = getStudentsForExcel(payload); break;
      case 'submitGrades': result = submitGrades(payload, userInfo); break;
      case 'getStudentsForAttendance': result = getStudentsForAttendance(payload); break;
      case 'recordAbsences': result = recordAbsences(payload, userInfo); break;
      case 'submitHomework': result = submitHomework(payload, userInfo); break;
      case 'getExistingEvaluations': result = getExistingEvaluations(payload); break;
      case 'submitDailyEvaluation': result = submitDailyEvaluation(payload, userInfo); break;
      case 'addLibraryLink': result = addLibraryLink(payload, userInfo); break;
      case 'getSystemSettings': result = getSystemSettings(); break;
      case 'updateSystemSettings': result = updateSystemSettings(payload); break;
      case 'getUniqueClassesAndSubjects': result = getUniqueClassesAndSubjects(); break;
      case 'createAnnouncement': result = createAnnouncement(payload, userInfo); break;
      case 'publishExamSchedule': result = publishExamSchedule(payload); break;
      case 'publishWeeklySchedule': result = publishWeeklySchedule(payload); break;
      case 'getWeeklySchedule': result = getWeeklySchedule(payload); break;
      case 'getAllUsers': result = getAllUsers(); break;
      case 'whoAmI': result = successResponse({ user: publicUser_(userInfo) }); break;
      case 'getUserDetails': result = getUserDetails(payload); break;
      case 'updateUser': result = updateUser(payload); break;
      case 'updateUserPermission': result = updateUserPermissionExt_(payload); break; 
      case 'getTeachersPermissions': result = getTeachersPermissions_(); break;
      case 'getSchoolStructure': result = getSchoolStructure(); break;
      case 'updateSchoolStructure': result = updateSchoolStructure(payload); break;
      case 'getTeacherAssignmentsAdmin': result = getTeacherAssignmentsAdmin(payload); break;
      case 'saveTeacherAssignmentsAdmin': result = saveTeacherAssignmentsAdmin(payload); break;
      case 'getPendingGrades': result = getPendingItems(SHEETS.GRADES); break; 
      case 'getPendingAbsences': result = getPendingItems(SHEETS.ABSENCES); break;
      case 'getPendingEvaluations': result = getPendingItems(SHEETS.DAILY_EVALUATIONS); break;
      case 'getPendingHomeworks': result = getPendingItems(SHEETS.HOMEWORK); break;
      case 'getPendingLibraryLinks': result = getPendingItems(SHEETS.LIBRARY); break;
      case 'handleApproval': result = handleApproval(payload, userInfo); break;
      case 'getStudentEvaluationSummary': result = getStudentEvaluationSummary(payload); break;
      case 'sendSummaryToTelegram': result = sendSummaryToTelegram(payload); break;
      case 'getMissingSubmissions': result = getMissingSubmissions(); break;
      case 'sendSubmissionReminder': result = sendSubmissionReminder(payload); break;
      case 'getGradesReportBySection': result = getGradesReportBySection(payload); break;
      case 'getSubmissionStatusReport': result = getSubmissionStatusReport(payload); break;
      case 'manualSendTelegram': result = manualSendTelegram(payload); break;
      case 'archiveStudentGrades': result = archiveStudentGrades(payload); break;
      case 'getArchivedGrades': result = getArchivedGrades(payload); break;
      case 'submitObjection': result = submitObjection(payload, userInfo); break;
      case 'getStudentObjections': result = getStudentObjections(userInfo); break;
      case 'getAdminObjections': result = getAdminObjections(); break;
      case 'handleAdminObjection': result = handleAdminObjection(payload); break;
      case 'getTeacherObjections': result = getTeacherObjections(userInfo); break;
      case 'handleTeacherObjection': result = handleTeacherObjection(payload, userInfo); break;
      case 'getMyProfile': result = getMyProfile(userInfo); break;
      case 'updateMyProfile': result = updateMyProfile(payload, userInfo); break;
      case 'trackItemView': result = trackItemView(payload, userInfo); break;
      case 'getAdminAnalytics': result = getAdminAnalytics(); break;

      // --- نظام الجدول المدرسي الذكي (توليد آلي) ---
      case 'getTeacherConstraints': result = getTeacherConstraints(); break;
      case 'saveTeacherConstraints': result = saveTeacherConstraints(payload); break;
      case 'generateSmartTimetable': result = generateSmartTimetable(); break;
      case 'publishSmartTimetableToWeekly': result = publishSmartTimetableToWeekly(payload, userInfo); break; // (جديد) اعتماد الجدول الذكي وتوزيعه
      case 'getSmartTimetableVersions': result = getSmartTimetableVersions(); break; // (جديد) جلب النسخ المؤرشفة

      default: result = (typeof routeExtra_ === 'function' && routeExtra_(action, payload, userInfo)) || errorResponse('إجراء غير معروف: ' + action);
    }
    // (جديد) إشعارات تلقائية بعد نجاح العملية، ولا تُفشلها إن تعذّرت
    if (result && result.success && typeof afterAction_ === 'function') {
      try { afterAction_(action, payload, userInfo, result); } catch (notifErr) { Logger.log('notify: ' + notifErr.stack); }
    }
    // تحديث بيانات المستخدم المحفوظة مؤقتاً بعد تعديلها
    if (result && result.success && ['updateUser', 'updateMyProfile', 'updateUserPermission'].indexOf(action) > -1) {
      CacheService.getScriptCache().remove('u_' + (payload.userId || (userInfo && userInfo.userId)));
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Server Error: ' + error.stack);
    // لا تُرسل تفاصيل الخطأ الداخلية للمتصفح، فهي محفوظة في سجل Apps Script
    return jsonOut_({ success: false, message: 'حدث خطأ في الخادم. حاول مرة أخرى، وإن تكرر أبلغ المشرف.' });
  }
}

// ==========================================================
//             دوال الاعتماد وتوزيع الجدول الذكي (جديد)
// ==========================================================

/**
 * دالة تفكك الجدول الضخم وتوزعه على الجداول الأسبوعية لكل صف
 * وتقوم بحفظ نسخة منه في الأرشيف للرجوع إليها لاحقاً
 */
function publishSmartTimetableToWeekly(payload, userInfo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const full = payload.fullSchedule;
  if (!full || typeof full !== 'object' || !Object.keys(full).length) return errorResponse('لا يوجد جدول لنشره. ولّد الجدول أولاً.');
  const versionName = String(payload.versionName || ('إصدار ' + new Date().toLocaleDateString('ar-IQ'))).slice(0, 120);

  // 1. حفظ نسخة في الأرشيف (يُقسَّم النص إن تجاوز حد الخلية في Google Sheets)
  const archive = ss.getSheetByName(SHEETS.SMART_TIMETABLES_ARCHIVE);
  const json = JSON.stringify(full);
  const parts = [];
  for (let i = 0; i < json.length; i += 45000) parts.push(json.slice(i, i + 45000));
  archive.appendRow(['STV-' + new Date().getTime(), new Date(), versionName, parts[0], (userInfo && userInfo.name) || ''].concat(parts.slice(1)));

  // 2. توزيعه على الجداول الأسبوعية لكل صف وشعبة
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const weekly = ss.getSheetByName(SHEETS.WEEKLY_SCHEDULES);
  const data = weekly.getDataRange().getValues();
  const students = [];
  let count = 0;
  Object.keys(full).forEach(key => {
    const cut = key.lastIndexOf('-');
    const cls = cut > -1 ? key.slice(0, cut) : key;
    const sec = cut > -1 ? key.slice(cut + 1) : '';
    const out = {};
    days.forEach(d => {
      out[d] = {};
      const src = full[key][d] || {};
      Object.keys(src).forEach(lesson => {
        const v = src[lesson];
        out[d][lesson] = v && typeof v === 'object' ? (v.subject || '') : (v || '');
      });
    });
    const idx = data.findIndex((r, i) => i > 0 && r[1] === cls && r[2] === sec);
    if (idx > 0) weekly.getRange(idx + 1, 4, 1, 2).setValues([[JSON.stringify(out), new Date()]]);
    else weekly.appendRow(['WS-' + new Date().getTime() + '-' + count, cls, sec, JSON.stringify(out), new Date()]);
    findStudentsByClass(cls, sec).forEach(id => students.push(id));
    count++;
  });
  if (typeof notifyUsers_ === 'function' && students.length) {
    try { notifyUsers_(students, 'جدول أسبوعي جديد', 'اعتُمد جدول الحصص الجديد لصفك.', 'schedulesMainTab'); } catch (e) { Logger.log(e); }
  }
  return successResponse({}, 'تم اعتماد الجدول ونشره لـ ' + count + ' شعبة، وحُفظت نسخة «' + versionName + '» في الأرشيف.');
}

/**
 * دالة لجلب النسخ القديمة من الجدول الذكي في حال أراد المشرف استرجاعها
 */
function getSmartTimetableVersions() {
    const archiveSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SMART_TIMETABLES_ARCHIVE);
    if (!archiveSheet) return errorResponse('لم يتم العثور على ورقة الأرشيف.');
    
    const data = archiveSheet.getDataRange().getValues();
    if (data.length <= 1) return successResponse({ versions: [] });
    
    const versions = [];
    for (let i = data.length - 1; i >= 1; i--) { // ترتيب تنازلي (الأحدث أولاً)
        versions.push({
            versionId: data[i][0],
            publishDate: new Date(data[i][1]).toLocaleString('ar-IQ'),
            versionName: data[i][2],
            scheduleData: JSON.parse(String(data[i][3]) + data[i].slice(5).join('')),
            publisher: data[i][4]
        });
    }
    
    return successResponse({ versions });
}

// ==========================================================
//                   محرك الجدول الذكي (توليد آلي)
// ==========================================================

function getTeacherConstraints() {
    const users = getData_(SHEETS.USERS).filter(u => String(u[3]).trim() === 'مدرس' && String(u[5]).trim() === 'نشط');
    let constraintsData = [];
    try { constraintsData = getData_(SHEETS.TIMETABLE_CONSTRAINTS); } catch(e) {}

    const constraints = users.map(u => {
        const tId = u[0];
        const tName = u[4];
        const row = constraintsData.find(r => r[0] === tId);
        // الافتراضي: المدرس متاح جميع الأيام (1 إلى 6)
        const defaultAvail = { "الأحد": [1,2,3,4,5,6], "الاثنين": [1,2,3,4,5,6], "الثلاثاء": [1,2,3,4,5,6], "الأربعاء": [1,2,3,4,5,6], "الخميس": [1,2,3,4,5,6] };
        return {
            teacherId: tId,
            teacherName: tName,
            availability: row && row[2] ? JSON.parse(row[2]) : defaultAvail,
            maxPeriods: row && row[3] ? parseInt(row[3]) : 20 // النصاب الافتراضي 20 حصة أسبوعياً
        };
    });

    return successResponse({ constraints });
}

function saveTeacherConstraints(payload) {
    const { teacherId, availability, maxPeriods } = payload;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.TIMETABLE_CONSTRAINTS);
    if (!sheet) {
        sheet = ss.insertSheet(SHEETS.TIMETABLE_CONSTRAINTS);
        sheet.appendRow(["TeacherID", "TeacherName", "AvailabilityJSON", "MaxPeriods"]);
    }
    
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(r => r[0] === teacherId);
    const teacherName = getUsersMap_().get(teacherId)?.name || '';

    if (rowIndex > 0) {
        sheet.getRange(rowIndex + 1, 3).setValue(JSON.stringify(availability));
        sheet.getRange(rowIndex + 1, 4).setValue(maxPeriods);
    } else {
        sheet.appendRow([teacherId, teacherName, JSON.stringify(availability), maxPeriods]);
    }
    
    return successResponse({}, 'تم حفظ قيود وأوقات فراغ المدرس بنجاح.');
}

function generateSmartTimetable() {
    const assignments = getData_(SHEETS.TEACHER_ASSIGNMENTS);
    const constraintsRes = getTeacherConstraints().constraints;
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    // إعداد هيكل الجدول الفارغ [الصف-الشعبة][اليوم][الحصة]
    let schedule = {};
    let teacherLoad = {}; // لحساب النصاب
    
    constraintsRes.forEach(c => {
        teacherLoad[c.teacherId] = { name: c.teacherName, count: 0, max: c.maxPeriods, availability: c.availability };
    });

    let failedAssignments = [];

    // التوزيع الآلي (خوارزمية ذكية مبسطة)
    assignments.forEach(assign => {
        const tId = assign[0];
        const className = assign[2];
        const section = assign[3];
        const subject = assign[4];
        
        const classKey = `${className}-${section}`;
        if (!schedule[classKey]) schedule[classKey] = {};
        days.forEach(d => { if (!schedule[classKey][d]) schedule[classKey][d] = {}; });

        const tConstraints = teacherLoad[tId];
        if (!tConstraints) return;

        // لنفترض أن لكل مادة حصتين أسبوعياً كافتراضي (يمكن برمجتها لاحقاً لتتغير)
        let periodsToAssign = 2; 

        for (let p = 0; p < periodsToAssign; p++) {
            let assigned = false;
            
            // البحث عن فراغ مشترك بين المدرس والصف
            for (let d = 0; d < days.length; d++) {
                const day = days[d];
                const availablePeriodsForTeacher = tConstraints.availability[day] || [];
                
                for (let i = 0; i < availablePeriodsForTeacher.length; i++) {
                    const period = availablePeriodsForTeacher[i];
                    
                    // هل الصف فارغ في هذا الدرس؟
                    if (!schedule[classKey][day][`lesson${period}`]) {
                        
                        // هل المدرس يدرس صفاً آخر في نفس الوقت؟
                        let teacherBusy = false;
                        for (let otherClass in schedule) {
                            if (schedule[otherClass][day] && schedule[otherClass][day][`lesson${period}`]?.teacherId === tId) {
                                teacherBusy = true;
                                break;
                            }
                        }

                        if (!teacherBusy && tConstraints.count < tConstraints.max) {
                            schedule[classKey][day][`lesson${period}`] = { subject: subject, teacherId: tId, teacherName: tConstraints.name };
                            tConstraints.count++;
                            assigned = true;
                            break; // تم التوزيع بنجاح لهذه الحصة
                        }
                    }
                }
                if (assigned) break;
            }
            if (!assigned) {
                failedAssignments.push({ class: className, section: section, subject: subject, teacher: tConstraints.name });
            }
        }
    });

    // تجهيز تقرير النصاب
    let quotaReport = [];
    for (let tId in teacherLoad) {
        let t = teacherLoad[tId];
        if (t.count < t.max) {
            quotaReport.push(`المدرس ${t.name} (أخذ ${t.count} من أصل ${t.max} حصة).`);
        }
    }

    return successResponse({ schedule, quotaReport, failedAssignments }, 'تم توليد الجدول بنجاح.');
}

function getGradesReportBySection(payload) {
  const { studentClass, studentSection } = payload;
  
  const targetClass = normalizeArabicText_(studentClass);
  const targetSection = normalizeArabicText_(studentSection);

  const allUsers = getData_(SHEETS.USERS);
  const students = allUsers.filter(row => {
      const role = normalizeArabicText_(row[3]);
      const status = normalizeArabicText_(row[5]);
      const cls = normalizeArabicText_(row[6]);
      const sec = normalizeArabicText_(row[7]);

      return role === 'طالب' && status === 'نشط' && cls === targetClass && (targetSection === 'الكل' || targetSection === '' || sec === targetSection);
  }).map(row => ({ studentId: row[0], name: row[4] }));
  
  if (students.length === 0) return errorResponse('لا توجد درجات: لا يوجد طلاب مسجلين في هذا الصف والشعبة.');

  const allGrades = getData_(SHEETS.GRADES);
  const report = [];

  students.forEach(s => {
    // جلب الدرجات المعتمدة (المنشورة) فقط
    const studentGrades = allGrades.filter(r => String(r[1]).trim() === String(s.studentId).trim() && String(r[14]).trim() === 'منشور');
    if (studentGrades.length > 0) {
      const gradesObj = {};
      studentGrades.forEach(g => {
        const subj = String(g[2]).trim();
        const gType = String(g[3]).trim();
        if (!gradesObj[subj]) gradesObj[subj] = {};
        gradesObj[subj][gType] = g[4];
      });
      report.push({ studentName: s.name, grades: gradesObj });
    }
  });

  return successResponse({ report });
}


// دالة لتشفير كلمات المرور الحالية في الشيت وإضافة عمود التوكن (تُشغل مرة واحدة فقط من المحرر)
function migratePasswordsToHash() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  
  // التأكد من وجود عنوان لعمود التوكن
  sheet.getRange(1, 14).setValue('SessionToken');
  
  let updatedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const plainPassword = String(data[i][2]); // العمود C يحتوي على كلمة المرور
    
    // التشفير بـ SHA-256 طوله 64 حرفاً. إذا كان أقل، فهذا يعني أنه غير مشفر بعد
    if (plainPassword.length !== 64 && plainPassword.trim() !== "") {
        const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plainPassword, Utilities.Charset.UTF_8);
        let txtHash = '';
        for (let j = 0; j < rawHash.length; j++) {
          let hashVal = rawHash[j];
          if (hashVal < 0) { hashVal += 256; }
          if (hashVal.toString(16).length == 1) { txtHash += '0'; }
          txtHash += hashVal.toString(16);
        }
        // كتابة كلمة المرور المشفرة فوق الكلمة القديمة
        sheet.getRange(i + 1, 3).setValue(txtHash);
        updatedCount++;
    }
  }
  
  SpreadsheetApp.getUi().alert('اكتمل التحديث!', `تم تشفير كلمات مرور ${updatedCount} مستخدم بنجاح. النظام الآن آمن.`, SpreadsheetApp.getUi().ButtonSet.OK);
}

function errorResponse(msg, stack = '', code = '') {
  return { success: false, message: msg, code: code };
}

function successResponse(data = {}, msg = 'تمت العملية بنجاح') {
  return { success: true, message: msg, ...data };
}

// ==========================================================
//                   المصادقة
// ==========================================================
/**
 * (محدث) إصلاح مشكلة مقارنة كلمة المرور
 */
function handleLogin(payload) {
  const { email, password } = payload;
  if (!email || !password) return errorResponse('اكتب البريد وكلمة المرور.');
  const cache = CacheService.getScriptCache();
  const tryKey = 'login_' + String(email).toLowerCase();
  const tries = Number(cache.get(tryKey) || 0);
  if (tries >= 8) return errorResponse('محاولات خاطئة كثيرة. انتظر 15 دقيقة ثم حاول مجدداً.');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const gIdx = data[0].indexOf('GoogleEmail');   // يمكن الدخول أيضاً ببريد Gmail المربوط
  const want = String(email).trim().toLowerCase();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const ids = [String(row[1]).trim().toLowerCase()];
    if (gIdx > -1 && row[gIdx]) ids.push(String(row[gIdx]).trim().toLowerCase());
    if (ids.indexOf(want) > -1 && String(row[2]) === String(password)) {
      if (row[5] === 'نشط') {
        const sessionToken = "TOKEN-" + Utilities.getUuid() + Utilities.getUuid();
        sheet.getRange(i + 1, 14).setValue(sessionToken); // حفظ التوكن في العمود N
        startSession_(sessionToken, row[0]);
        cache.remove(tryKey);

        return successResponse({
          user: {
            userId: row[0], email: row[1], role: row[3], name: row[4],
            studentClass: row[6], studentSection: row[7], token: sessionToken
          }
        }, 'تم تسجيل الدخول بنجاح.');
      }
      return errorResponse('الحساب غير نشط.');
    }
  }
  cache.put(tryKey, String(tries + 1), 900);
  return errorResponse('البريد أو كلمة المرور غير صحيحة.');
}

// جلب بيانات الملف الشخصي الكاملة من الشيت
function getMyProfile(userInfo) {
  const data = getData_(SHEETS.USERS);
  const userRow = data.find(r => r[0] === userInfo.userId);
  if (!userRow) return errorResponse('المستخدم غير موجود.');

  // تعتمد هذه الدالة على ترتيب الأعمدة في شيت "المستخدمون"
  return successResponse({
    profile: {
      userId: userRow[0],       // العمود A
      email: userRow[1],        // العمود B
      fullName: userRow[4],     // العمود E
      studentClass: userRow[6], // العمود G
      studentSection: userRow[7], // العمود H
      guardianName: userRow[8],  // العمود I
      guardianPhone: userRow[9], // العمود J
      studentPhone: userRow[10], // العمود K
      telegramId: userRow[12],   // العمود M
      motherName: userRow[14] || '',  // العمود O
      address: userRow[15] || '',     // العمود P
      dob: userRow[16] || '',         // العمود Q
      bloodType: userRow[17] || '',   // العمود R
      medicalNotes: userRow[18] || '', // العمود S
      profilePic: userRow[19] || ''    // العمود T (مهم جداً للصورة)
    }
  });
}

// تحديث البيانات في الشيت (بما في ذلك الصورة الشخصية)
// التحديث الصحيح بناءً على صورة الشيت الأخيرة (العمود N هو التوكن)
function updateMyProfile(payload, userInfo) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => r[0] === userInfo.userId);

  if (rowIndex <= 0) return errorResponse('فشل العثور على المستخدم.');

  // تحديث الأعمدة الأساسية
  sheet.getRange(rowIndex + 1, 5).setValue(payload.fullName);      // العمود E
  sheet.getRange(rowIndex + 1, 9).setValue(payload.guardianName);  // العمود I
  sheet.getRange(rowIndex + 1, 10).setValue(payload.guardianPhone);// العمود J
  sheet.getRange(rowIndex + 1, 11).setValue(payload.studentPhone); // العمود K
  sheet.getRange(rowIndex + 1, 13).setValue(payload.telegramId);   // العمود M

  // البيانات الإضافية تبدأ بعد التوكن (العمود O رقم 15 وما بعده)
  sheet.getRange(rowIndex + 1, 15).setValue(payload.motherName);   // العمود O
  sheet.getRange(rowIndex + 1, 16).setValue(payload.address);      // العمود P
  sheet.getRange(rowIndex + 1, 17).setValue(payload.dob);          // العمود Q
  sheet.getRange(rowIndex + 1, 18).setValue(payload.bloodType);    // العمود R
  sheet.getRange(rowIndex + 1, 19).setValue(payload.medicalNotes); // العمود S
  sheet.getRange(rowIndex + 1, 20).setValue(payload.profilePicBase64); // العمود T

  // تحديث كلمة المرور إذا تم تغييرها
  if (payload.newPassword) {
    sheet.getRange(rowIndex + 1, 3).setValue(payload.newPassword);
  }

  return successResponse({}, 'تم حفظ بياناتك بنجاح في السجل المدرسي.');
}
// ==========================================================
//                   وظائف التليجرام (محدثة)
// ==========================================================

/**
 * (إصلاح المشكلة) دالة إرسال التليجرام
 */
function sendTelegramMessage_(chatId, text) {
  const chatIdStr = String(chatId); // (الإصلاح) تحويل ID إلى نص
  
  if (!chatId || !text || chatIdStr.includes("_ID") || chatIdStr.trim() === "") {
    Logger.log(`Skipped sending to placeholder or empty ID: ${chatIdStr}`);
    return false;
  }
  
  try {
    const botToken = getBotToken_();
    if (!botToken) { Logger.log('TELEGRAM_BOT_TOKEN غير مضبوط في خصائص السكربت'); return false; }
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = { chat_id: chatIdStr, text: text, parse_mode: 'HTML' };
    const options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(url, options);
    const resJson = JSON.parse(response.getContentText());
    if (!resJson.ok) {
      Logger.log(`Telegram Error for ${chatIdStr}: ${resJson.description}`);
    }
    return resJson.ok;
  } catch (e) {
    Logger.log('Telegram Fetch Error: ' + e.message);
    return false;
  }
}

function broadcastToStudents(studentIds, message) {
  const usersMap = getUsersMap_();
  let sentCount = 0;
  studentIds.forEach(studentId => {
    const telegramId = usersMap.get(studentId)?.telegramId;
    if (telegramId) {
      if(sendTelegramMessage_(telegramId, message)) {
        sentCount++;
      }
    }
  });
  return sentCount;
}

/**
 * (جديد) دالة الإرسال الآلي للواجبات - تعمل عبر مُشغّل (Trigger)
 */
function homeworkScheduler() {
  Logger.log("Running Daily Homework Scheduler...");
  const homeworkSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HOMEWORK);
  const data = homeworkSheet.getDataRange().getValues();
  const schedulesMap = getSchedulesMap_();
  
  let tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][tomorrow.getDay()];
  
  let sentCount = 0;
  
  // [5=Status, 8=TelegramStatus, 2=Class, 3=Section, 4=Subject, 6=Content]
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[5];
    const telegramStatus = row[8];
    const hwClass = row[2];
    const hwSection = row[3];
    const hwSubject = row[4];

    // إرسال فقط إذا كان "مجدول" و "لم يرسل من قبل"
    if (status === 'مجدول' && telegramStatus !== 'تم الإرسال آلياً' && telegramStatus !== 'فشل الإرسال الآلي') {
      
      const scheduleKey = `${hwClass}-${hwSection}`;
      const tomorrowSchedule = schedulesMap.get(scheduleKey)?.[tomorrowDayName] || {};
      
      let isLessonTomorrow = false;
      for (let lesson in tomorrowSchedule) {
        if (tomorrowSchedule[lesson] === hwSubject) {
          isLessonTomorrow = true;
          break;
        }
      }
      
      if (isLessonTomorrow) {
        const content = row[6];
        const msg = `🔔 <b>واجب ليوم غد (${tomorrowDayName})</b>\n\n<b>المادة:</b> ${hwSubject}\n<b>الصف:</b> ${hwClass} ${hwSection}\n\n${content}`;
        
        const targetStudentIds = findStudentsByClass(hwClass, hwSection);
        
        // التحقق إذا كان النشر مطلوباً للتليجرام
        let isSent = false;
        if (telegramStatus === 'جاهز للإرسال الآلي') {
           let count = broadcastToStudents(targetStudentIds, msg);
           isSent = (count > 0);
           sentCount += count;
        }
        
        // تحديث الحالة في الشيت (تغيير إلى "منشور" في كل الأحوال)
        homeworkSheet.getRange(i + 1, 6).setValue('منشور'); // Status -> منشور
        if (typeof notifyUsers_ === 'function') {
          try { notifyUsers_(targetStudentIds, '🔔 واجب ليوم غد: ' + hwSubject, String(content).slice(0, 200), 'homeworkEvalTab'); } catch (e) { Logger.log(e); }
        }
        homeworkSheet.getRange(i + 1, 10).setValue(new Date()); // SentDate
        
        if (telegramStatus === 'جاهز للإرسال الآلي') {
           homeworkSheet.getRange(i + 1, 9).setValue(isSent ? 'تم الإرسال آلياً' : 'فشل الإرسال الآلي'); // TelegramStatus
        }
        // إذا كان 'نشر للمنصة فقط'، لا نغير حالة التليجرام
      }
    }
  }
  Logger.log(`Homework scheduler finished. Sent ${sentCount} messages.`);
}


// ==========================================================
//                   لوحات التحكم (الطالب والمدرس)
// ==========================================================
// ==========================================================
//                   لوحات التحكم (الطالب والمدرس)
// ==========================================================
function getStudentDashboard(userInfo) {
  const allUsers = getData_(SHEETS.USERS);
  const student = allUsers.find(r => r[0] === userInfo.userId);
  if (!student) return errorResponse('لم يتم العثور على بيانات الطالب.');
  const studentClass = student[6];
  const studentSection = student[7];

  const filterPublished = (data, classCol, sectionCol, statusCol) => {
    return data.filter(r => 
      r[statusCol] === 'منشور' && 
      (r[classCol] === studentClass || r[classCol] === 'الكل') &&
      (r[sectionCol] === studentSection || r[sectionCol] === 'الكل' || !r[sectionCol])
    );
  };
  
  const grades = getData_(SHEETS.GRADES).filter(r => r[1] === userInfo.userId && r[14] === 'منشور');
  const absences = getData_(SHEETS.ABSENCES).filter(r => r[1] === userInfo.userId && r[5] === 'منشور');
  
  // (الإصلاح هنا) السماح بعرض الواجبات إذا كانت "منشور" أو "مجدول"
  const homework = getData_(SHEETS.HOMEWORK).filter(r => 
      (r[5] === 'منشور' || r[5] === 'مجدول') && 
      (r[2] === studentClass || r[2] === 'الكل') &&
      (r[3] === studentSection || r[3] === 'الكل' || !r[3])
  );
  
  const evaluations = getData_(SHEETS.DAILY_EVALUATIONS).filter(r => r[1] === userInfo.userId && r[10] === 'منشور');
  const library = filterPublished(getData_(SHEETS.LIBRARY), 4, null, 5);
  const announcements = getData_(SHEETS.ANNOUNCEMENTS).filter(r => r[3] === 'الكل' || r[3] === 'الطلاب فقط');
  const examSchedules = getData_(SHEETS.EXAM_SCHEDULES).filter(r => r[2] === studentClass || r[2] === 'الكل');
  const scheduleRow = getData_(SHEETS.WEEKLY_SCHEDULES).find(r => r[1] === studentClass && r[2] === studentSection);
  const weeklySchedule = scheduleRow ? JSON.parse(scheduleRow[3]) : null;

  return successResponse({ 
    data: { 
      announcements: formatAnnouncements(announcements), grades: formatGrades(grades), absences: formatAbsences(absences),
      homework: formatHomework(homework), evaluations: formatEvaluations(evaluations), library: formatLibrary(library),
      weeklySchedule: weeklySchedule, examSchedules: formatExamSchedules(examSchedules)
    } 
  });
}

/**
 * جلب قائمة الواجبات التي أرسلها المدرس لعرضها في سجله الخاص
 */
function getTeacherSentHomework(userInfo) {
  const usersMap = getUsersMap_();
  const teacherName = usersMap.get(userInfo.userId)?.name || userInfo.name;
  
  const hwData = getData_(SHEETS.HOMEWORK);
  const sentHomework = hwData.filter(r => r[7] === teacherName).map(r => ({
      id: r[0], 
      date: new Date(r[1]).toLocaleDateString('ar-IQ'),
      iso: isoDate_(r[1]),
      class: r[2], 
      section: r[3], 
      subject: r[4], 
      content: r[6], 
      status: r[5]
  })).reverse(); // العكس لعرض الأحدث أولاً
  
  return successResponse({ homework: sentHomework });
}

/**
 * جلب قائمة بأسماء الطلاب الذين شاهدوا عنصراً معيناً (واجب أو إعلان)
 */
function getItemViews(payload) {
  const { itemId, targetClass, targetSection } = payload;
  
  const viewsData = getData_(SHEETS.VIEWS_TRACKING);
  const usersMap = getUsersMap_();
  
  // 1. جلب ID الطلاب الذين شاهدوا هذا العنصر
  const viewersIds = viewsData.filter(r => r[1] === itemId).map(r => r[3]);
  
  // 2. جلب جميع طلاب هذه الشعبة لمعرفة من لم يشاهد
  const allClassStudents = [];
  usersMap.forEach((data, id) => {
    if (data.role === 'طالب' && data.class === targetClass && (data.section === targetSection || targetSection === 'الكل')) {
      allClassStudents.push({ id: id, name: data.name });
    }
  });
  
  // 3. تصنيف الطلاب (شاهد / لم يشاهد)
  const viewed = [];
  const notViewed = [];
  
  allClassStudents.forEach(student => {
    if (viewersIds.includes(student.id)) {
      viewed.push(student.name);
    } else {
      notViewed.push(student.name);
    }
  });
  
  return successResponse({ 
      viewed: viewed, 
      notViewed: notViewed,
      viewedCount: viewed.length,
      totalCount: allClassStudents.length
  });
}

function getTeacherDashboard(userInfo) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const teacher = data.find(r => r[0] === userInfo.userId);
  
  const announcements = getData_(SHEETS.ANNOUNCEMENTS).filter(r => r[3] === 'الكل' || r[3] === 'المدرسين فقط');
  const weeklySchedules = getData_(SHEETS.WEEKLY_SCHEDULES).map(r => ({
      targetClass: r[1], targetSection: r[2], scheduleData: JSON.parse(r[3])
  }));
  
  const assignments = getData_(SHEETS.TEACHER_ASSIGNMENTS);
  const teacherAssignments = assignments.filter(a => a[0] === userInfo.userId);
  
  const teacherClasses = [...new Set(teacherAssignments.map(a => a[2]))];
  const teacherSections = [...new Set(teacherAssignments.map(a => a[3]))];
  const teacherSubjects = [...new Set(teacherAssignments.map(a => a[4]))];
  const rawAssignments = teacherAssignments.map(a => ({ class: a[2], section: a[3], subject: a[4] }));

  const absIdx = headers.indexOf('CanRecordAbsence');
  const excelIdx = headers.indexOf('CanUseMasterExcel');

  const teacherData = {
      classes: teacherClasses.length > 0 ? teacherClasses : [],
      sections: teacherSections.length > 0 ? teacherSections : [],
      subjects: teacherSubjects.length > 0 ? teacherSubjects : [],
      rawAssignments: rawAssignments, // (جديد) لمعرفة الشعب والمواد المرتبطة بكل صف بدقة
      announcements: formatAnnouncements(announcements),
      canRecordAbsence: absIdx > -1 ? teacher[absIdx] === 'نعم' : false,
      canUseMasterExcel: excelIdx > -1 ? teacher[excelIdx] === 'نعم' : false,
      weeklySchedules: weeklySchedules.filter(s => teacherClasses.includes(s.targetClass) && (teacherSections.includes(s.targetSection) || teacherSections.length === 0))
  };

  return successResponse({ data: teacherData });
}
// ==========================================================
//                   وظائف المدرس (محدثة)
// ==========================================================


// (جديد) دالة تنظيف وتوحيد النصوص العربية لحل مشاكل المسافات والهمزات في الإكسل
function normalizeArabicText_(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
}

function getStudentsForExcel(payload) {
  const { studentClass, subject } = payload;
  const allUsers = getData_(SHEETS.USERS);
  const targetClass = normalizeArabicText_(studentClass);

  const students = allUsers.filter(row => {
      const role = normalizeArabicText_(row[3]);
      const status = normalizeArabicText_(row[5]);
      const cls = normalizeArabicText_(row[6]);
      return role === 'طالب' && status === 'نشط' && cls === targetClass;
  }).map(row => ({ studentId: row[0], name: row[4], section: row[7] }));
  
  if (students.length === 0) return errorResponse('لا يوجد طلاب في هذا الصف.');
  
  const allGrades = getData_(SHEETS.GRADES);
  const targetSubject = normalizeArabicText_(subject);
  const grades = {};
  
  students.forEach(s => {
    const studentGrades = allGrades.filter(r => String(r[1]).trim() === String(s.studentId).trim() && normalizeArabicText_(r[2]) === targetSubject);
    if (studentGrades.length > 0) {
      grades[s.studentId] = {};
      studentGrades.forEach(g => {
        grades[s.studentId][String(g[3]).trim()] = { grade: g[4], status: g[14], recordId: g[0] };
      });
    }
  });
  
  return successResponse({ students, grades });
}

function getMasterExcelData(payload) {
  const { studentClass, studentSection } = payload;
  const allUsers = getData_(SHEETS.USERS);
  
  const targetClass = normalizeArabicText_(studentClass);
  const targetSection = normalizeArabicText_(studentSection);

  const students = allUsers.filter(row => {
      const role = normalizeArabicText_(row[3]);
      const status = normalizeArabicText_(row[5]);
      const cls = normalizeArabicText_(row[6]);
      const sec = normalizeArabicText_(row[7]);

      const isStudent = role === 'طالب' && status === 'نشط';
      const isClassMatch = cls === targetClass;
      const isSectionMatch = (targetSection === 'الكل' || targetSection === '' || sec === targetSection);
      
      return isStudent && isClassMatch && isSectionMatch;
  }).map(row => ({ studentId: row[0], name: row[4], section: row[7] }));
  
  if (students.length === 0) return errorResponse('لا يوجد طلاب في هذا الصف/الشعبة. (تم فحص المسافات والهمزات بنجاح)');
  
  const allGrades = getData_(SHEETS.GRADES);
  const grades = {};
  
  students.forEach(s => {
    const studentGrades = allGrades.filter(r => String(r[1]).trim() === String(s.studentId).trim());
    grades[s.studentId] = {};
    studentGrades.forEach(g => {
      const subj = String(g[2]).trim(); // نحتفظ باسم المادة كما هو في الإكسل
      const gType = String(g[3]).trim();
      if (!grades[s.studentId][subj]) grades[s.studentId][subj] = {};
      grades[s.studentId][subj][gType] = g[4]; 
    });
  });
  
  return successResponse({ students, grades });
}

function getStudentsForGrading(payload, userInfo) {
  const { studentClass, studentSection, subject } = payload;
  const settings = getSystemSettings().settings;
  const allUsers = getData_(SHEETS.USERS);
  
  const targetClass = normalizeArabicText_(studentClass);
  const targetSection = normalizeArabicText_(studentSection);
  const targetSubject = normalizeArabicText_(subject);

  const students = allUsers.filter(row => {
      const role = normalizeArabicText_(row[3]);
      const status = normalizeArabicText_(row[5]);
      const cls = normalizeArabicText_(row[6]);
      const sec = normalizeArabicText_(row[7]);
      
      const isStudent = role === 'طالب' && status === 'نشط';
      const isClassMatch = cls === targetClass;
      const isSectionMatch = (targetSection === 'الكل' || targetSection === '' || sec === targetSection);
      
      return isStudent && isClassMatch && isSectionMatch;
  }).map(row => ({ studentId: row[0], name: row[4] }));

  if (students.length === 0) return errorResponse('لا يوجد طلاب في هذا الصف/الشعبة.');

  const allGrades = getData_(SHEETS.GRADES);
  const grades = {};
  students.forEach(s => {
    const studentGrades = allGrades.filter(r => String(r[1]).trim() === String(s.studentId).trim() && normalizeArabicText_(r[2]) === targetSubject);
    if (studentGrades.length > 0) {
      grades[s.studentId] = {};
      studentGrades.forEach(g => {
        grades[s.studentId][String(g[3]).trim()] = { grade: g[4], status: g[14], recordId: g[0] };
      });
    }
  });
  return successResponse({ students, grades, settings });
}

function getStudentsForAttendance(payload) {
  const { studentClass, studentSection } = payload;
  const allUsers = getData_(SHEETS.USERS);
  
  const targetClass = normalizeArabicText_(studentClass);
  const targetSection = normalizeArabicText_(studentSection);

  const students = allUsers.filter(row => {
      const role = normalizeArabicText_(row[3]);
      const status = normalizeArabicText_(row[5]);
      const cls = normalizeArabicText_(row[6]);
      const sec = normalizeArabicText_(row[7]);

      return role === 'طالب' && status === 'نشط' && cls === targetClass && (targetSection === 'الكل' || targetSection === '' || sec === targetSection);
  }).map(row => ({ studentId: row[0], name: row[4] }));
  
  if (students.length === 0) return errorResponse('لا يوجد طلاب في هذا الصف/الشعبة.');

  return successResponse({ students });
}

function submitGrades(payload, userInfo) {
  const { subject, grades } = payload; // subject قد يكون فارغاً في الإكسل الشامل
  const settings = getSystemSettings().settings;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.GRADES);
  const data = sheet.getDataRange().getValues();
  const teacherName = getUsersMap_().get(userInfo.userId)?.name || userInfo.name;
  let newRows = [], updateLogs = [];

  for (const studentGrade of grades) {
    const studentId = studentGrade.studentId;
    // دعم الإكسل الشامل (المادة تأتي مع الطالب) أو الإكسل العادي
    const currentSubject = studentGrade.subject || subject; 
    
    for (const gradeType of Object.keys(studentGrade.grades)) {
      const newValue = studentGrade.grades[gradeType];
      if (newValue === "" || newValue === null) continue;

      if (settings[`${gradeType}_Status`]?.value === 'مغلق') continue;

      let existingRowIndex = data.findIndex(r => r[1] === studentId && r[2] === currentSubject && r[3] === gradeType);
      
      if (existingRowIndex > 0) {
        // --- (ميزة التخطي الذكي للدرجات المطابقة) ---
        const existingGrade = data[existingRowIndex][4];
        if (String(existingGrade) === String(newValue)) {
           continue; // تجاهل الدرجة تماماً لأنها مطابقة للقديمة ولا تحتاج موافقة
        }
        // تسجيل التعديل للدرجات المختلفة فقط
        updateLogs.push({ row: existingRowIndex + 1, grade: newValue, teacherId: userInfo.userId });
      } else {
        newRows.push(["GRD-"+Utilities.getUuid(), studentId, currentSubject, gradeType, newValue, '','','','','','','', new Date(), userInfo.userId, 'بانتظار الموافقة', JSON.stringify({old:'',new:newValue}), teacherName, '']);
      }
    }
  }

  updateLogs.forEach(log => {
    sheet.getRange(log.row, 5).setValue(log.grade);
    sheet.getRange(log.row, 13, 1, 5).setValues([[new Date(), log.teacherId, 'بانتظار الموافقة', '', teacherName]]);
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  return successResponse({}, 'تم استلام الدرجات الجديدة وتخطي المطابقة بنجاح.');
}



function getExistingEvaluations(payload) {
  const { date, subject, studentIds } = payload;
  const data = getData_(SHEETS.DAILY_EVALUATIONS);
  const normalizedDate = new Date(date).toLocaleDateString();
  const existing = data.filter(r => 
    new Date(r[3]).toLocaleDateString() === normalizedDate && r[4] === subject && studentIds.includes(r[1])
  );
  const evaluations = existing.map(r => ({
    evaluationId: r[0], studentId: r[1],
    daily_prep: r[5], participation: r[6], behavior: r[7], homework: r[8],
    note: r[9], status: r[10]
  }));
  return successResponse({ evaluations });
}

function submitDailyEvaluation(payload, userInfo) {
  const { evaluations, date, subject } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DAILY_EVALUATIONS);
  const data = sheet.getDataRange().getValues();
  const teacherName = getUsersMap_().get(userInfo.userId)?.name || userInfo.name;
  let newRows = [];
  let updateLogs = [];
  evaluations.forEach(ev => {
    const newStatus = 'بانتظار الموافقة'; 
    if (ev.evaluationId) {
      let rowIndex = data.findIndex(r => r[0] === ev.evaluationId);
      if (rowIndex > 0) {
        updateLogs.push({
          row: rowIndex + 1,
          values: [ ev.evaluations.DailyPrep || '', ev.evaluations.Participation || '', ev.evaluations.Behavior || '', ev.evaluations.Homework || '', ev.note || '', newStatus ]
        });
      }
    } else { 
      newRows.push([
        "EV-" + new Date().getTime() + Math.random(), ev.studentId, userInfo.userId, new Date(date), subject,
        ev.evaluations.DailyPrep || '', ev.evaluations.Participation || '', ev.evaluations.Behavior || '', ev.evaluations.Homework || '',
        ev.note || '', newStatus, teacherName, ''
      ]);
    }
  });
  updateLogs.forEach(log => { sheet.getRange(log.row, 6, 1, 6).setValues([log.values]); });
  if (newRows.length > 0) { sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows); }
  return successResponse({}, 'تم إرسال التقييمات للمراجعة.');
}

function getStudentsForAttendance(payload) {
  const cls = normalizeArabicText_(payload.studentClass);
  const sec = normalizeArabicText_(payload.studentSection);
  const students = getData_(SHEETS.USERS).filter(row =>
      normalizeArabicText_(row[3]) === 'طالب' && normalizeArabicText_(row[5]) === 'نشط' &&
      normalizeArabicText_(row[6]) === cls && (!sec || sec === 'الكل' || normalizeArabicText_(row[7]) === sec))
    .map(row => ({ studentId: row[0], name: row[4], section: row[7] }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
  return successResponse({ students }, students.length ? '' : 'لا يوجد طلاب في هذه الشعبة.');
}

function recordAbsences(payload, userInfo) {
  const { date, studentIds, notes } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ABSENCES);
  const teacherName = getUsersMap_().get(userInfo.userId)?.name || userInfo.name;
  const newRows = studentIds.map(studentId => {
    return [ "ABS-" + new Date().getTime() + Math.random(), studentId, new Date(date), notes || '', teacherName, 'بانتظار الموافقة', '' ];
  });
  if (newRows.length > 0) { sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows); }
  return successResponse({}, 'تم إرسال الغيابات للمراجعة.');
}

// (محدث - لا يأخذ تاريخ، فقط المحتوى)
function submitHomework(payload, userInfo) {
  const { content, targetClass, targetSection, targetSubject } = payload; 
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HOMEWORK);
  const teacherName = getUsersMap_().get(userInfo.userId)?.name || userInfo.name;
  
  // [0=ID, 1=SubmitDate, 2=Class, 3=Section, 4=Subject, 5=Status, 6=Content, 7=TchName, 8=TlgStatus, 9=SentDate]
  const newRow = [
    "HW-" + new Date().getTime() + Math.random(), // 0
    new Date(), targetClass, targetSection, targetSubject, // 1, 2, 3, 4
    'بانتظار الموافقة', content, teacherName, '', '' // 5, 6, 7, 8, 9
  ];
  
  sheet.appendRow(newRow);
  return successResponse({}, 'تم إرسال الواجب للمراجعة.');
}

function addLibraryLink(payload, userInfo) {
  const { title, url, description, targetClass, targetSubject } = payload;
  const category = ['كتاب منهج', 'ملزمة', 'فيديو', 'رابط'].indexOf(payload.category) > -1 ? payload.category : 'رابط';
  if (!/^https:\/\//i.test(String(url || ''))) return errorResponse('الرابط يجب أن يبدأ بـ https://');
  const isAdmin = normalizeArabicText_(userInfo.role) === normalizeArabicText_('إداري');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.LIBRARY);
  const teacherName = getUsersMap_().get(userInfo.userId)?.name || userInfo.name;
  const newRow = [
    "LIB-" + new Date().getTime() + Math.random(), new Date(), title, url, targetClass,
    isAdmin ? 'منشور' : 'بانتظار الموافقة', targetSubject, description, teacherName, '', category
  ];
  sheet.appendRow(newRow);
  return successResponse({}, isAdmin ? 'نُشر في المكتبة.' : 'تم إرسال الرابط للمراجعة.');
}


// ==========================================================
//                   وظائف المشرف (محدثة بالكامل)
// ==========================================================

// --- 1. إدارة المستخدمين (محدثة لدعم البحث الذكي) ---

function updateSchoolStructure(payload) {
    const { structure } = payload;
    updateSystemSettings({ 'School_Structure': JSON.stringify(structure) });
    return successResponse({}, 'تم حفظ الهيكلية الأكاديمية بنجاح.');
}


function getTeacherAssignmentsAdmin(payload) {
    const { teacherId } = payload;
    const assignments = getData_(SHEETS.TEACHER_ASSIGNMENTS).filter(a => a[0] === teacherId);
    const formatted = assignments.map(a => ({ class: a[2], section: a[3], subject: a[4] }));
    return successResponse({ assignments: formatted });
}

function saveTeacherAssignmentsAdmin(payload) {
    const { teacherId, teacherName, assignments } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.TEACHER_ASSIGNMENTS);
    const data = sheet.getDataRange().getValues();
    
    // مسح المهام القديمة لهذا المدرس
    const rowsToDelete = [];
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][0] === teacherId) rowsToDelete.push(i + 1);
    }
    rowsToDelete.forEach(r => sheet.deleteRow(r));
    
    // إضافة المهام الجديدة
    if (assignments && assignments.length > 0) {
        const newRows = assignments.map(a => [teacherId, teacherName, a.class, a.section, a.subject]);
        sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }
    return successResponse({}, 'تم حفظ مهام المدرس بنجاح.');
}

function getUserDetails(payload) {
  const { userId } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rowIndex = data.findIndex(r => r[0] == userId);
  
  if (rowIndex > 0) {
    const safeRow = data[rowIndex].slice();
    const pIdx = headers.indexOf('Password'), tIdx = headers.indexOf('SessionToken');
    if (pIdx > -1) safeRow[pIdx] = '';   // تُترك فارغة = بدون تغيير
    if (tIdx > -1) safeRow[tIdx] = '';
    return successResponse({ headers: headers, userData: safeRow });
  } else {
    return errorResponse('لم يتم العثور على المستخدم.');
  }
}

function updateUser(payload) {
  const { userId, newRowData } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => r[0] == userId);
  
  if (rowIndex > 0) {
    const headers = data[0];
    const row = data[rowIndex].slice();
    const pIdx = headers.indexOf('Password'), tIdx = headers.indexOf('SessionToken');
    const n = Math.min(newRowData.length, headers.length);
    for (let c = 0; c < n; c++) {
      if (c === 0 || c === tIdx) continue;          // المعرّف ورمز الجلسة لا يتغيران من هنا
      if (c === pIdx) {
        const p = String(newRowData[c] || '').trim();
        if (p) row[c] = /^[0-9a-f]{64}$/.test(p) ? p : sha256Hex_(p);  // كلمة جديدة تُشفّر في الخادم
        continue;
      }
      row[c] = newRowData[c];
    }
    sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
    return successResponse({}, 'تم تحديث بيانات المستخدم بنجاح.');
  } else {
    return errorResponse('لم يتم العثور على المستخدم.');
  }
}

// (جديد) دالة آمنة لتحديث صلاحية واحدة فقط
function updateUserPermission(payload) {
  const { userId, permission, value } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rowIndex = data.findIndex(r => r[0] == userId);
 
  let colIndex = -1;
  if (permission === 'canRecordAbsence') colIndex = headers.indexOf('CanRecordAbsence');
  if (permission === 'canUseMasterExcel') colIndex = headers.indexOf('CanUseMasterExcel');
 
  // إنشاء العمود تلقائياً إذا لم يكن موجوداً (ميزة ذكية لحماية البيانات)
  if (colIndex === -1) {
     colIndex = headers.length;
     let colName = permission === 'canRecordAbsence' ? 'CanRecordAbsence' : 'CanUseMasterExcel';
     sheet.getRange(1, colIndex + 1).setValue(colName);
     sheet.getRange(1, colIndex + 1).setFontWeight('bold').setBackground('#eeeeee');
  }

  if (rowIndex > 0) {
    const newValue = value ? 'نعم' : 'لا';
    sheet.getRange(rowIndex + 1, colIndex + 1).setValue(newValue);
    return successResponse({}, 'تم تحديث الصلاحية بنجاح.');
  } else {
    return errorResponse('لم يتم العثور على المستخدم.');
  }
}

// --- 2. نظام الموافقات الشامل (محدث) ---
function getPendingItems(sheetName) {
  const usersMap = getUsersMap_();
  const data = getData_(sheetName);
  let items = [];
  try {
    if (sheetName === SHEETS.GRADES) {
      items = data.filter(r => r[14] === 'بانتظار الموافقة').map(r => ({
        id: r[0], studentName: usersMap.get(r[1])?.name || r[1],
        subject: r[2], gradeType: r[3],
        changes: JSON.parse(r[15] || '{}'), teacher: r[16] // (إصلاح) إضافة معالجة للـ JSON الفارغ
      }));
    } else if (sheetName === SHEETS.ABSENCES) {
      items = data.filter(r => r[5] === 'بانتظار الموافقة').map(r => ({
        id: r[0], studentName: usersMap.get(r[1])?.name || r[1],
        date: r[2], notes: r[3], teacher: r[4]
      }));
    } else if (sheetName === SHEETS.DAILY_EVALUATIONS) {
      items = data.filter(r => r[10] === 'بانتظار الموافقة').map(r => ({
        id: r[0], studentName: usersMap.get(r[1])?.name || r[1], subject: r[4], date: r[3],
        data: { daily_prep: r[5], participation: r[6], behavior: r[7], homework: r[8], note: r[9] },
        teacher: r[11]
      }));
    } else if (sheetName === SHEETS.HOMEWORK) {
      items = data.filter(r => r[5] === 'بانتظار الموافقة').map(r => ({
        id: r[0], date: r[1], class: r[2], section: r[3], subject: r[4], content: r[6], teacher: r[7]
      }));
    } else if (sheetName === SHEETS.LIBRARY) {
      items = data.filter(r => r[5] === 'بانتظار الموافقة').map(r => ({
        id: r[0], date: r[1], title: r[2], url: r[3], class: r[4], subject: r[6], teacher: r[8]
      }));
    }
  } catch (e) {
    Logger.log(`Error parsing pending items for ${sheetName}: ${e.message}`);
    return errorResponse(`حدث خطأ أثناء جلب البيانات لـ ${sheetName}.`);
  }
  return successResponse({ items });
}

function handleApproval(payload, userInfo) {
  // (محدث بالكامل - تم إصلاح خطأ التليجرام + تعديل منطق الواجبات)
  const { itemIds, action, sendTelegram, sheetName } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return errorResponse(`Sheet ${sheetName} not found.`);
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  const usersMap = getUsersMap_();

  let newStatus;
  if (action === 'approve') newStatus = 'موافق عليه';
  else if (action === 'publish') {
    // (تعديل منطق الواجبات)
    newStatus = (sheetName === SHEETS.HOMEWORK) ? 'مجدول' : 'منشور';
  }
  else if (action === 'reject') newStatus = 'مرفوض';
  else return errorResponse('إجراء غير معروف.');

  let telegramStatusCol = -1;
  let statusCol = -1;
  let sentCount = 0;

  if (sheetName === SHEETS.GRADES) { statusCol = 14; telegramStatusCol = 17; }
  else if (sheetName === SHEETS.ABSENCES) { statusCol = 5; telegramStatusCol = 6; }
  else if (sheetName === SHEETS.DAILY_EVALUATIONS) { statusCol = 10; telegramStatusCol = 12; }
  else if (sheetName === SHEETS.HOMEWORK) { statusCol = 5; telegramStatusCol = 8; }
  else if (sheetName === SHEETS.LIBRARY) { statusCol = 5; telegramStatusCol = 9; }
  else return errorResponse('اسم ورقة غير مدعوم للموافقة.');

  itemIds.forEach(id => {
    const rowIndex = values.findIndex(r => r[0] === id);
    if (rowIndex > 0) {
      const rowData = values[rowIndex];
      // 1. تحديث الحالة
      sheet.getRange(rowIndex + 1, statusCol + 1).setValue(newStatus);
      
      let sendNow = (action === 'publish' && sendTelegram);
      
      // لا ترسل الواجبات فوراً، الدالة الآلية هي المسؤولة
      if (sheetName === SHEETS.HOMEWORK) {
        sendNow = false; 
        if (newStatus === 'مجدول' && sendTelegram) { // (إذا طلب الإرسال، سيسجل أنه جاهز للإرسال الآلي)
            sheet.getRange(rowIndex + 1, telegramStatusCol + 1).setValue('جاهز للإرسال الآلي');
        } else if (newStatus === 'مجدول' && !sendTelegram) {
            sheet.getRange(rowIndex + 1, telegramStatusCol + 1).setValue('نشر للمنصة فقط'); // (سينشر على المنصة آلياً أيضاً)
        }
      }

      if (sendNow) {
        let msg = '';
        let studentId = '';
        let targetStudentIds = [];

        try {
          if (sheetName === SHEETS.GRADES) {
             studentId = rowData[1];
             msg = `🔔 <b>إشعار درجة</b>\n\nتم نشر درجة جديدة للطالب/ة <b>${usersMap.get(studentId)?.name}</b>\nالمادة: ${rowData[2]}\nالدرجة: ${rowData[3]} = ${rowData[4]}`;
          } else if (sheetName === SHEETS.ABSENCES) {
            studentId = rowData[1];
            msg = `🔔 <b>إشعار غياب</b>\n\nتم تسجيل غياب للطالب/ة <b>${usersMap.get(studentId)?.name}</b>\nبتاريخ: ${new Date(rowData[2]).toLocaleDateString('ar-IQ')}\nملاحظات: ${rowData[3] || 'لا يوجد'}`;
          } else if (sheetName === SHEETS.DAILY_EVALUATIONS) {
            studentId = rowData[1];
            msg = formatEvaluationMessage_(usersMap.get(studentId)?.name, rowData[4], rowData[3], { DailyPrep: rowData[5], Participation: rowData[6], Behavior: rowData[7], Homework: rowData[8] }, rowData[9], rowData[11]);
          } else if (sheetName === SHEETS.LIBRARY) {
            msg = `📚 <b>مادة جديدة في المكتبة</b>\n\n<b>المادة:</b> ${rowData[6]}\n<b>العنوان:</b> ${rowData[2]}\n\n<a href="${rowData[3]}">اضغط هنا لفتح الرابط</a>`;
            targetStudentIds = findStudentsByClass(rowData[4], 'الكل');
          }
        } catch (e) { Logger.log('Error formatting Telegram message: ' + e.message); }

        let isSent = false;
        if (studentId) {
          const telegramId = usersMap.get(studentId)?.telegramId;
          if (telegramId) {
            isSent = sendTelegramMessage_(telegramId, msg);
            if (isSent) sentCount++;
          }
        } else if (targetStudentIds.length > 0) {
          let count = broadcastToStudents(targetStudentIds, msg);
          if (count > 0) { isSent = true; sentCount += count; }
        }
        
        if (telegramStatusCol > -1) {
          let tlgStatus = 'فشل';
          if (isSent) tlgStatus = 'تم الإرسال';
          else if (!studentId && targetStudentIds.length === 0) tlgStatus = 'لا مستلمين';
          else tlgStatus = 'لا يوجد معرف';
          sheet.getRange(rowIndex + 1, telegramStatusCol + 1).setValue(tlgStatus);
        }
      }
    }
  });

  let msg = `تم تحديث ${itemIds.length} سجل إلى "${newStatus}".`;
  if (sentCount > 0) msg += ` وتم إرسال ${sentCount} إشعار تليجرام.`;
  if (newStatus === 'مجدول') msg = `تمت جدولة ${itemIds.length} واجب. سيتم إرسالها آلياً قبل يوم الحصة.`;
  
  return successResponse({}, msg);
}


// --- 3. تقارير المشرف الجديدة ---

// (تقرير خلاصة التقييمات - محدث)
function getStudentEvaluationSummary(payload) {
  const { studentId, startDate, endDate } = payload;
  const data = getData_(SHEETS.DAILY_EVALUATIONS);
  
  const studentEvals = data.filter(r => 
    r[1] === studentId && (r[10] === 'موافق عليه' || r[10] === 'منشور') &&
    new Date(r[3]) >= new Date(startDate) && new Date(r[3]) <= new Date(endDate)
  );

  if (studentEvals.length === 0) {
    return errorResponse('لا توجد تقييمات معتمدة لهذا الطالب ضمن الفترة المحددة.');
  }

  // (تنسيق الخلاصة بشكل مرتب)
  let summary = {
    total: studentEvals.length,
    bySubject: {},
    byType: { 
      'تحضير يومي': { 'جيد': 0, 'متوسط': 0, 'ضعيف': 0, 'ناقص': 0, total: 0 }, 
      'مشاركة': { 'جيد': 0, 'متوسط': 0, 'ضعيف': 0, 'ناقص': 0, total: 0 }, 
      'سلوك': { 'جيد': 0, 'متوسط': 0, 'ضعيف': 0, 'ناقص': 0, total: 0 }, 
      'واجب بيتي': { 'جيد': 0, 'متوسط': 0, 'ضعيف': 0, 'ناقص': 0, total: 0 } 
    },
    notes: []
  };
  const typeKeys = {'تحضير يومي': 5, 'مشاركة': 6, 'سلوك': 7, 'واجب بيتي': 8};

  studentEvals.forEach(r => {
    const subject = r[4];
    if (!summary.bySubject[subject]) summary.bySubject[subject] = 0;
    summary.bySubject[subject]++;
    
    for (const typeName in typeKeys) {
      const evalValue = r[typeKeys[typeName]];
      if (evalValue && summary.byType[typeName].hasOwnProperty(evalValue)) {
        summary.byType[typeName][evalValue]++;
        summary.byType[typeName].total++;
      } else if (!evalValue) {
        summary.byType[typeName]['ناقص']++;
      }
    }
    if (r[9]) summary.notes.push(`[${new Date(r[3]).toLocaleDateString('ar-IQ')} - ${subject}]: ${r[9]}`);
  });
  
  // (جديد) تنسيق النص للواجهة
  let summaryText = `خلاصة تقييمات الطالب (من ${startDate} إلى ${endDate})\n`;
  summaryText += `=============================\n`;
  summaryText += `إجمالي التقييمات المستلمة: ${summary.total}\n\n`;
  
  summaryText += `--- ملخص حسب المادة ---\n`;
  for (const subject in summary.bySubject) {
      summaryText += `- ${subject}: ${summary.bySubject[subject]} تقييم\n`;
  }
  
  summaryText += `\n--- ملخص حسب النوع ---\n`;
  for (const typeName in summary.byType) {
    const stats = summary.byType[typeName];
    summaryText += `${typeName} (إجمالي ${stats.total}):\n`;
    summaryText += `  جيد: ${stats['جيد']} | متوسط: ${stats['متوسط']} | ضعيف: ${stats['ضعيف']} | ناقص: ${stats['ناقص']}\n`;
  }
  
  summaryText += `\n--- الملاحظات المسجلة (${summary.notes.length}) ---\n`;
  summary.notes.forEach(note => {
      summaryText += `- ${note}\n`;
  });

  return successResponse({ summary, details: formatEvaluations(studentEvals), summaryText: summaryText });
}

function sendSummaryToTelegram(payload) {
  const { studentId, summaryText } = payload;
  const user = getUsersMap_().get(studentId);
  if (!user) return errorResponse('لم يتم العثور على الطالب.');
  if (!user.telegramId) return errorResponse('لا يمتلك ولي أمر الطالب معرف تليجرام مسجل.');
  const studentName = user.name;
  const header = `📋 <b>خلاصة التقييمات للطالب/ة: ${studentName}</b>\n\n`;
  if(sendTelegramMessage_(user.telegramId, header + summaryText)) {
    return successResponse({}, 'تم إرسال الخلاصة إلى ولي الأمر بنجاح.');
  } else {
    return errorResponse('فشل إرسال الرسالة عبر تليجرام.');
  }
}

// (تقرير المدرسين المقصرين - محدث لآخر 7 أيام)
function getMissingSubmissions() {
  const assignments = getData_(SHEETS.TEACHER_ASSIGNMENTS);
  const schedulesMap = getSchedulesMap_();
  
  const evalsData = getData_(SHEETS.DAILY_EVALUATIONS);
  const hwData = getData_(SHEETS.HOMEWORK);
  
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  let missesByTeacher = {};

  // التحقق من آخر 7 أيام (باستثناء اليوم)
  for (let i = 1; i <= 7; i++) {
    let date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString();
    const dayName = dayNames[date.getDay()];

    if (dayName === 'الجمعة' || dayName === 'السبت') continue;

    let expectedSubmissions = [];
    assignments.forEach(a => {
      const [teacherId, teacherName, className, sectionName, subject] = a;
      const scheduleKey = `${className}-${sectionName}`;
      const dayLessons = schedulesMap.get(scheduleKey)?.[dayName] || {};
      
      let hasLesson = false;
      for(const lesson in dayLessons) {
        if(dayLessons[lesson] === subject) {
          hasLesson = true;
          break;
        }
      }
      
      if(hasLesson) {
        expectedSubmissions.push({ class: className, section: sectionName, subject: subject, teacherId: teacherId, teacherName: teacherName });
      }
    });

    const uniqueExpected = [...new Map(expectedSubmissions.map(item => [item.teacherId + item.class + item.section + item.subject, item])).values()];

    uniqueExpected.forEach(exp => {
      const evalFound = evalsData.some(ev => 
        ev[2] === exp.teacherId && ev[4] === exp.subject && new Date(ev[3]).toLocaleDateString() === dateStr
      );
      // (ملاحظة: هذا يفترض أن المدرس يرسل الواجب في نفس يوم الحصة)
      const hwFound = hwData.some(hw => 
        hw[7] === exp.teacherName && hw[2] === exp.class && hw[3] === exp.section && hw[4] === exp.subject && new Date(hw[1]).toLocaleDateString() === dateStr
      );

      if (!evalFound || !hwFound) {
        if (!missesByTeacher[exp.teacherId]) {
          missesByTeacher[exp.teacherId] = { teacherId: exp.teacherId, teacherName: exp.teacherName, evalMisses: 0, hwMisses: 0, details: [] };
        }
        if (!evalFound) {
          missesByTeacher[exp.teacherId].evalMisses++;
          missesByTeacher[exp.teacherId].details.push(`تقييم ${exp.subject} (${exp.class} ${exp.section}) يوم ${dayName}`);
        }
        if (!hwFound) {
          missesByTeacher[exp.teacherId].hwMisses++;
          missesByTeacher[exp.teacherId].details.push(`واجب ${exp.subject} (${exp.class} ${exp.section}) يوم ${dayName}`);
        }
      }
    });
  }

  return successResponse({ report: missesByTeacher });
}


function sendSubmissionReminder(payload) {
  const { teacherId, message } = payload;
  const user = getUsersMap_().get(teacherId);
  if (!user) return errorResponse('لم يتم العثور على المدرس.');
  if (!user.telegramId) return errorResponse('المدرس لا يمتلك معرف تليجرام مسجل.');
  const header = "🔔 <b>تذكير من الإدارة</b> 🔔\n\n";
  if(sendTelegramMessage_(user.telegramId, header + message)) {
    return successResponse({}, 'تم إرسال التذكير للمدرس بنجاح.');
  } else {
    return errorResponse('فشل إرسال التذكير.');
  }
}



// ==========================================================
//           (جديد) تقارير متابعة الإرسال
// ==========================================================
function getSubmissionStatusReport(payload) {
  const { sheetName } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return errorResponse(`Sheet ${sheetName} not found.`);
  
  const data = sheet.getDataRange().getValues().slice(1); //
  const usersMap = getUsersMap_();
  let items = [];

  // عرض آخر 50 سجل فقط للسرعة
  const recentData = data.slice(Math.max(data.length - 50, 0)).reverse();

  if (sheetName === SHEETS.HOMEWORK) {
    // [7=TeacherName, 2=Class, 3=Section, 4=Subject, 5=Status, 8=TelegramStatus, 0=ID]
    items = recentData.map(r => ({
      teacher: r[7],
      class: `${r[2]} ${r[3]}`,
      subject: r[4],
      status: r[5],
      telegramStatus: r[8] || '(فارغ)',
      id: r[0]
    }));
  } else if (sheetName === SHEETS.DAILY_EVALUATIONS) {
    // [11=TeacherName, 1=StudentID, 4=Subject, 10=Status, 12=TelegramStatus, 0=ID]
    items = recentData.map(r => ({
      teacher: r[11],
      class: usersMap.get(r[1])?.class || 'N/A',
      subject: `${r[4]} (لـ ${usersMap.get(r[1])?.name || r[1]})`,
      status: r[10],
      telegramStatus: r[12] || '(فارغ)',
      id: r[0]
    }));
  }
  
  return successResponse({ items });
}

function manualSendTelegram(payload) {
  const { itemId, sheetName } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return errorResponse(`Sheet ${sheetName} not found.`);
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  const usersMap = getUsersMap_();
  
  const rowIndex = values.findIndex(r => r[0] === itemId);
  if (rowIndex <= 0) return errorResponse('لم يتم العثور على السجل.');
  
  const rowData = values[rowIndex];
  
  let telegramStatusCol = -1;
  let msg = '';
  let studentId = '';
  let targetStudentIds = [];
  let isSent = false;
  let tlgStatus = 'فشل (إرسال يدوي)';

  try {
    if (sheetName === SHEETS.HOMEWORK) {
      // [2=Class, 3=Section, 4=Subject, 6=Content, 8=TelegramStatusCol]
      telegramStatusCol = 8;
      msg = `🔔 <b>واجب</b>\n\n<b>المادة:</b> ${rowData[4]}\n<b>الصف:</b> ${rowData[2]} ${rowData[3]}\n\n${rowData[6]}`;
      targetStudentIds = findStudentsByClass(rowData[2], rowData[3]);
      
    } else if (sheetName === SHEETS.DAILY_EVALUATIONS) {
      // [1=StudentID, 4=Subject, 3=Date, 5-9=Evals, 11=TeacherName, 12=TelegramStatusCol]
      telegramStatusCol = 12;
      studentId = rowData[1];
      msg = formatEvaluationMessage_(usersMap.get(studentId)?.name, rowData[4], rowData[3], { DailyPrep: rowData[5], Participation: rowData[6], Behavior: rowData[7], Homework: rowData[8] }, rowData[9], rowData[11]);
    }
  } catch (e) { 
    Logger.log('Error formatting manual Telegram message: ' + e.message);
    return errorResponse('خطأ في تنسيق الرسالة.');
  }

  if (studentId) {
    const telegramId = usersMap.get(studentId)?.telegramId;
    if (telegramId) {
      isSent = sendTelegramMessage_(telegramId, msg);
    }
  } else if (targetStudentIds.length > 0) {
    let count = broadcastToStudents(targetStudentIds, msg);
    if (count > 0) { isSent = true; }
  }

  if (isSent) tlgStatus = 'تم الإرسال (يدوي)';
  
  if (telegramStatusCol > -1) {
    sheet.getRange(rowIndex + 1, telegramStatusCol + 1).setValue(tlgStatus);
  }
  
  return isSent ? successResponse({}, 'تم الإرسال اليدوي بنجاح.') : errorResponse('فشل الإرسال اليدوي.');
}


// ==========================================================
//                   إدارة الإعدادات والجداول والأرشفة
// ==========================================================
function getSystemSettings() {
  const data = getData_(SHEETS.SETTINGS);
  const settings = {};
  data.forEach(row => { settings[row[0]] = { value: row[1], description: row[2] }; });
  return successResponse({ settings });
}

function updateSystemSettings(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const keys = Object.keys(payload);
  
  keys.forEach(key => {
    let found = false;
    // البحث عن المفتاح إذا كان موجوداً لتحديثه
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) { 
        sheet.getRange(i + 1, 2).setValue(payload[key]); 
        found = true;
        break;
      }
    }
    // (ميزة ذكية) إذا لم يكن المفتاح موجوداً في الشيت، يضيفه كسطر جديد تلقائياً
    if (!found) {
      sheet.appendRow([key, payload[key], 'إعدادات الهيكلية والنظام']);
    }
  });
  
  return successResponse({}, 'تم تحديث الإعدادات.');
}
function createAnnouncement(payload, userInfo) {
  const { title, content, audience, sendTelegram } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ANNOUNCEMENTS);
  sheet.appendRow([ "ANN-" + new Date().getTime() + Math.random(), new Date(), title, audience, content, userInfo.name ]);
  let sentCount = 0;
  if (sendTelegram) {
    const usersMap = getUsersMap_();
    let targetRole = (audience === 'الطلاب فقط') ? 'طالب' : (audience === 'المدرسين فقط') ? 'مدرس' : '';
    const targetStudentIds = Array.from(usersMap.entries())
      .filter(([userId, data]) => audience === 'الكل' || data.role === targetRole)
      .map(([userId, data]) => userId); 
    const telegramMsg = `📢 <b>إعلان من الإدارة</b> 📢\n\n<b>${title}</b>\n\n${content}`;
    sentCount = broadcastToStudents(targetStudentIds, telegramMsg);
  }
  let msg = 'تم نشر الإعلان بنجاح.';
  if (sentCount > 0) msg += ` وتم إرساله إلى ${sentCount} مستخدم عبر تليجرام.`;
  return successResponse({}, msg);
}

function publishExamSchedule(payload) {
  const { title, targetClass, scheduleData } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.EXAM_SCHEDULES);
  sheet.appendRow([ "EXAM-" + new Date().getTime() + Math.random(), new Date(), targetClass, title, JSON.stringify(scheduleData) ]);
  return successResponse({}, 'تم نشر جدول الامتحانات بنجاح.');
}

function publishWeeklySchedule(payload) {
    const { targetClass, targetSection, scheduleData } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.WEEKLY_SCHEDULES);
    const data = sheet.getDataRange().getValues();
    let existingRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === targetClass && data[i][2] === targetSection) { existingRowIndex = i + 1; break; }
    }
    if (existingRowIndex > 0) {
        sheet.getRange(existingRowIndex, 4).setValue(JSON.stringify(scheduleData));
        return successResponse({}, 'تم تحديث الجدول الأسبوعي بنجاح.');
    } else {
        sheet.appendRow([ "WS-" + new Date().getTime() + Math.random(), targetClass, targetSection, JSON.stringify(scheduleData), new Date() ]);
        return successResponse({}, 'تم نشر الجدول الأسبوعي بنجاح.');
    }
}

function getWeeklySchedule(payload) {
    const { targetClass, targetSection } = payload;
    const data = getData_(SHEETS.WEEKLY_SCHEDULES);
    const scheduleRow = data.find(r => r[1] === targetClass && r[2] === targetSection);
    if (scheduleRow) {
        return successResponse({ schedule: JSON.parse(scheduleRow[3]) });
    } else {
        return errorResponse('لم يتم العثور على جدول.');
    }
}





function updateSchoolStructure(payload) {
    const { structure } = payload;
    updateSystemSettings({ 'School_Structure': JSON.stringify(structure) });
    return successResponse({}, 'تم حفظ الهيكلية الأكاديمية بنجاح.');
}

function getSchoolStructure() {
    const settings = getSystemSettings().settings;
    let structure = settings['School_Structure'] ? JSON.parse(settings['School_Structure'].value) : null;
    if (!structure) {
        structure = {
            classes: ['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط', 'الرابع الإعدادي', 'الخامس الإعدادي', 'السادس الإعدادي'],
            sections: ['أ', 'ب', 'ج', 'د'],
            globalSubjects: ['الاسلامية', 'العربي', 'الانكليزي', 'الرياضيات', 'العلوم', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الاجتماعيات', 'الحاسوب'],
            classSubjects: {},
            classSections: {} 
        };
    }
    // (حماية جوهرية): ضمان عدم وجود قيم فارغة تسبب توقف النظام
    if (!structure.classSections) structure.classSections = {};
    if (!structure.classSubjects) structure.classSubjects = {};
    return successResponse({ structure });
}

function getUniqueClassesAndSubjects() {
    try {
        const res = getSchoolStructure();
        const structure = res.structure;
        let allSubj = new Set();
        
        // منع الانهيار إذا لم تكن المواد مخصصة بعد
        if (structure.classSubjects) {
            Object.values(structure.classSubjects).forEach(arr => {
                if (Array.isArray(arr)) arr.forEach(s => allSubj.add(s));
            });
        }
        
        return successResponse({
            classes: structure.classes || [],
            sections: structure.sections || [],
            subjects: Array.from(allSubj).length > 0 ? Array.from(allSubj) : (structure.globalSubjects || []),
            classSubjects: structure.classSubjects || {},
            classSections: structure.classSections || {}
        });
    } catch (e) {
        return errorResponse('خطأ داخلي: ' + e.message);
    }
}

function getTeacherAssignmentsAdmin(payload) {
    const { teacherId } = payload;
    const assignments = getData_(SHEETS.TEACHER_ASSIGNMENTS).filter(a => a[0] === teacherId);
    const formatted = assignments.map(a => ({ class: a[2], section: a[3], subject: a[4] }));
    return successResponse({ assignments: formatted });
}

function saveTeacherAssignmentsAdmin(payload) {
    const { teacherId, teacherName, assignments } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.TEACHER_ASSIGNMENTS);
    const data = sheet.getDataRange().getValues();
    
    const rowsToDelete = [];
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][0] === teacherId) rowsToDelete.push(i + 1);
    }
    rowsToDelete.forEach(r => sheet.deleteRow(r));
    
    if (assignments && assignments.length > 0) {
        const newRows = assignments.map(a => [teacherId, teacherName, a.class, a.section, a.subject]);
        sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }
    return successResponse({}, 'تم حفظ مهام المدرس بنجاح.');
}

function archiveStudentGrades(payload) {
  const { studentId } = payload;
  const gradesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.GRADES);
  const gradesData = gradesSheet.getDataRange().getValues();
  const archiveSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.GRADES_ARCHIVE);
  if (!archiveSheet) return errorResponse('ورقة الأرشيف غير موجودة.');
  if (archiveSheet.getLastRow() === 0) { archiveSheet.appendRow(gradesData[0]); }
  const rowsToArchive = [];
  const rowsToDelete = []; 
  for (let i = 1; i < gradesData.length; i++) {
    if (gradesData[i][1] === studentId) { rowsToArchive.push(gradesData[i]); rowsToDelete.push(i + 1); }
  }
  if (rowsToArchive.length > 0) {
    archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, rowsToArchive.length, rowsToArchive[0].length).setValues(rowsToArchive);
    for (let i = rowsToDelete.length - 1; i >= 0; i--) { gradesSheet.deleteRow(rowsToDelete[i]); }
    return successResponse({}, `تم أرشفة ${rowsToArchive.length} سجل درجات للطالب.`);
  } else {
    return errorResponse('لم يتم العثور على درجات لهذا الطالب.');
  }
}

function getArchivedGrades(payload) {
  const { studentId } = payload;
  const data = getData_(SHEETS.GRADES_ARCHIVE);
  const studentGrades = data.filter(r => r[1] === studentId);
  return successResponse({ grades: formatGrades(studentGrades) });
}

// ==========================================================
//                   دوال مساعدة (Helpers)
// ==========================================================
function getData_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
      Logger.log(`Sheet not found: ${sheetName}`);
      return []; 
  }
  const data = sheet.getDataRange().getValues();
  return data.length > 1 ? data.slice(1) : [];
}

let USERS_MAP_MEMO_ = null;
function getUsersMap_() {
  if (USERS_MAP_MEMO_) return USERS_MAP_MEMO_;
  const data = getData_(SHEETS.USERS);
  const map = new Map();
  data.forEach(row => {
    map.set(row[0], {
      name: row[4], role: row[3], class: row[6], section: row[7], telegramId: row[12] 
    });
  });
  USERS_MAP_MEMO_ = map;
  return map;
}

function getSchedulesMap_() {
  const data = getData_(SHEETS.WEEKLY_SCHEDULES);
  const map = new Map();
  data.forEach(row => {
    const key = `${row[1]}-${row[2]}`; // "Class-Section"
    try {
      map.set(key, JSON.parse(row[3]));
    } catch (e) {
      Logger.log(`Error parsing schedule for ${key}`);
    }
  });
  return map;
}

function findStudentsByClass(className, sectionName) {
  const allUsers = getData_(SHEETS.USERS);
  return allUsers.filter(r => 
    r[3] === 'طالب' && r[5] === 'نشط' &&
    (r[6] === className || className === 'الكل') &&
    (r[7] === sectionName || sectionName === 'الكل' || !sectionName)
  ).map(r => r[0]);
}

// ==========================================================
//                   دوال تنسيق البيانات (Formatters)
// ==========================================================
function formatAnnouncements(data) { return data.map(r => ({ id: r[0], date: new Date(r[1]).toLocaleDateString('ar-IQ'), title: r[2], content: r[4] })).reverse(); }

/**
 * (إصلاح) دالة تنسيق الدرجات
 * تضمن هذه الدالة أن المفاتيح المرسلة للواجهة (مثل term1_month1)
 * تتطابق تماماً مع ما يتوقعه script.js
 */
function formatGrades(data) {
  const gradesBySubject = {};
  data.forEach(r => {
    const subject = r[2];
    if (!gradesBySubject[subject]) {
      gradesBySubject[subject] = { subject: subject };
    }
    
    const type = r[3]; // "Term1_Month1", "MidYear_Exam", "Term1_Avg"
    let key_simple = '';
    
    // (إصلاح) مطابقة دقيقة لأسماء الحقول وإضافة الشهر الثالث والسعيات
    if (type === 'Term1_Month1') key_simple = 'term1_month1';
    else if (type === 'Term1_Month2') key_simple = 'term1_month2';
    else if (type === 'Term1_Month3') key_simple = 'term1_month3';
    else if (type === 'Term1_Avg') key_simple = 'term1_avg';
    else if (type === 'MidYear_Exam') key_simple = 'midYear_exam';
    else if (type === 'Term2_Month1') key_simple = 'term2_month1';
    else if (type === 'Term2_Month2') key_simple = 'term2_month2';
    else if (type === 'Term2_Month3') key_simple = 'term2_month3';
    else if (type === 'Term2_Avg') key_simple = 'term2_avg';
    else if (type === 'Yearly_Effort') key_simple = 'yearly_effort';
    else if (type === 'Final_Exam') key_simple = 'final_exam';
    else if (type === 'Final_Result') key_simple = 'final_result';
    else key_simple = type.toLowerCase(); // fallback
    
    if (key_simple) {
        gradesBySubject[subject][key_simple] = r[4];
    }
  });
  return Object.values(gradesBySubject);
}

function isoDate_(v) { const d = new Date(v); return isNaN(d) ? '' : Utilities.formatDate(d, 'Asia/Baghdad', 'yyyy-MM-dd'); }
function formatAbsences(data) { return data.map(r => ({ date: new Date(r[2]).toLocaleDateString('ar-IQ'), iso: isoDate_(r[2]), notes: r[3] })); }
// (محدثة) دالة تنسيق الواجبات لتشمل ID الواجب الضروري للتتبع
function formatHomework(data) { 
  return data.map(r => ({ 
    id: r[0], // أضفنا الـ ID هنا
    date: new Date(r[1]).toLocaleDateString('ar-IQ'), 
    iso: isoDate_(r[1]), teacher: r[7],
    subject: r[4], 
    content: r[6] 
  })); 
}

function formatEvaluations(data) { return data.map(ev => ({ date: new Date(ev[3]).toLocaleDateString('ar-IQ'), iso: isoDate_(ev[3]), teacher: ev[11], subject: ev[4], daily_prep: ev[5], participation: ev[6], behavior: ev[7], homework: ev[8], note: ev[9] })); }
function formatLibrary(data) { return data.map(r => ({ id: r[0], category: r[10] || 'رابط', iso: isoDate_(r[1]), title: r[2], url: r[3], subject: r[6], description: r[7] })); }
function formatExamSchedules(data) { return data.map(r => ({ title: r[3], targetClass: r[2], scheduleData: JSON.parse(r[4]) })); }
function formatEvaluationMessage_(studentName, subject, date, evals, note, teacherName) {
  let msg = `🔔 <b>إشعار تقييم يومي</b>\n\n`;
  msg += `👤 الطالب: <b>${studentName}</b>\n`;
  msg += `📅 التاريخ: ${new Date(date).toLocaleDateString('ar-IQ')}\n`;
  msg += `📚 المادة: ${subject}\n`;
  msg += `👨‍🏫 المدرس: ${teacherName}\n\n`;
  msg += `📊 <b>التقييم:</b>\n`;
  if (evals.DailyPrep) msg += `- التحضير اليومي: ${evals.DailyPrep}\n`;
  if (evals.Participation) msg += `- المشاركة: ${evals.Participation}\n`;
  if (evals.Behavior) msg += `- السلوك: ${evals.Behavior}\n`;
  if (evals.Homework) msg += `- الواجب البيتي: ${evals.Homework}\n`;
  if (note) msg += `\n📝 <b>ملاحظات:</b> ${note}\n`;
  msg += `\n<i>مدرسة البراعم كربلاء الأهلية</i>`;
  return msg;
}

// ==========================================================
//                   نظام الاعتراضات (جديد)
// ==========================================================

// 1. دالة تقديم اعتراض من قبل الطالب
function submitObjection(payload, userInfo) {
  const { subject, content } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.OBJECTIONS);
  const newRow = [
    "OBJ-" + new Date().getTime() + Math.random(),
    new Date(), userInfo.userId, subject, content,
    'بانتظار الإدارة', 'غير محول', '', ''
  ];
  sheet.appendRow(newRow);
  return successResponse({}, 'تم إرسال الاعتراض للإدارة بنجاح.');
}

// 2. دالة جلب اعتراضات الطالب الخاصة به
function getStudentObjections(userInfo) {
  const data = getData_(SHEETS.OBJECTIONS);
  const myObjections = data.filter(r => r[2] === userInfo.userId).map(r => ({
      id: r[0], date: new Date(r[1]).toLocaleDateString('ar-IQ'),
      subject: r[3], content: r[4], adminStatus: r[5], teacherStatus: r[6], reply: r[8]
  }));
  return successResponse({ objections: myObjections });
}

// 3. دالة جلب الاعتراضات المعلقة للمشرف (الإدارة)
function getAdminObjections() {
  const data = getData_(SHEETS.OBJECTIONS);
  const usersMap = getUsersMap_();
  const assignments = getData_(SHEETS.TEACHER_ASSIGNMENTS);
  
  // (جديد) جلب قائمة كل المدرسين لإرسالها للواجهة
  const teachersList = [];
  usersMap.forEach((userData, userId) => {
     if (userData.role === 'مدرس') {
         teachersList.push({ id: userId, name: userData.name });
     }
  });

  const pending = data.filter(r => r[5] === 'بانتظار الإدارة').map(r => {
      const studentClass = usersMap.get(r[2])?.class;
      const studentSection = usersMap.get(r[2])?.section;
      // البحث عن المدرس المسؤول عن هذه المادة لهذا الصف
      const teacherInfo = assignments.find(a => a[2] === studentClass && a[3] === studentSection && a[4] === r[3]);
      
      return {
          id: r[0], date: new Date(r[1]).toLocaleDateString('ar-IQ'),
          studentName: usersMap.get(r[2])?.name || r[2], 
          classSection: `${studentClass} - ${studentSection}`,
          subject: r[3], content: r[4],
          suggestedTeacherId: teacherInfo ? teacherInfo[0] : '',
          suggestedTeacherName: teacherInfo ? teacherInfo[1] : 'غير محدد'
      };
  });
  // (تعديل) إرجاع قائمة المدرسين مع الاعتراضات
  return successResponse({ objections: pending, teachers: teachersList });
}

// 4. دالة معالجة المشرف للاعتراض (موافقة/رفض)
function handleAdminObjection(payload) {
   const { objectionId, action, teacherId } = payload; 
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.OBJECTIONS);
   const data = sheet.getDataRange().getValues();
   const rowIndex = data.findIndex(r => r[0] === objectionId);
   
   if(rowIndex > 0) {
       if(action === 'approve') {
           if(!teacherId) return errorResponse('الرجاء تحديد المدرس لتحويل الاعتراض إليه.');
           sheet.getRange(rowIndex + 1, 6).setValue('محول للمدرس');
           sheet.getRange(rowIndex + 1, 7).setValue('قيد المراجعة');
           sheet.getRange(rowIndex + 1, 8).setValue(teacherId);
           return successResponse({}, 'تم تحويل الاعتراض للمدرس بنجاح.');
       } else if (action === 'reject') {
           sheet.getRange(rowIndex + 1, 6).setValue('مرفوض من الإدارة');
           return successResponse({}, 'تم رفض الاعتراض.');
       }
   }
   return errorResponse('لم يتم العثور على الاعتراض.');
}

// 5. دالة جلب اعتراضات المدرس المحولة إليه
function getTeacherObjections(userInfo) {
   const data = getData_(SHEETS.OBJECTIONS);
   const usersMap = getUsersMap_();
   const pending = data.filter(r => r[7] === userInfo.userId && r[6] === 'قيد المراجعة').map(r => ({
      id: r[0], date: new Date(r[1]).toLocaleDateString('ar-IQ'),
      studentName: usersMap.get(r[2])?.name || r[2],
      subject: r[3], content: r[4]
   }));
   return successResponse({ objections: pending });
}

// 6. دالة معالجة المدرس للاعتراض (الرد عليه)
function handleTeacherObjection(payload, userInfo) {
   const { objectionId, reply } = payload;
   if(!reply) return errorResponse('الرجاء كتابة رد على الاعتراض.');
   
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.OBJECTIONS);
   const data = sheet.getDataRange().getValues();
   const rowIndex = data.findIndex(r => r[0] === objectionId);
   
   if(rowIndex > 0 && userInfo && String(data[rowIndex][7]) !== String(userInfo.userId)) {
       return errorResponse('هذا الاعتراض غير محوّل إليك.');
   }
   if(rowIndex > 0) {
       sheet.getRange(rowIndex + 1, 7).setValue('تم الرد');
       sheet.getRange(rowIndex + 1, 9).setValue(reply);
       return successResponse({}, 'تم إرسال الرد للطالب بنجاح.');
   }
   return errorResponse('لم يتم العثور على الاعتراض.');
}

/**
 * دالة لتسجيل مشاهدة الطالب للواجبات أو الإعلانات
 */
function trackItemView(payload, userInfo) {
  const { itemId, itemType } = payload;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.VIEWS_TRACKING);
  if (!sheet) return errorResponse('جدول التتبع غير موجود.');
  
  const data = sheet.getDataRange().getValues();
  
  // فحص إذا كان الطالب قد سجل مشاهدة لهذا العنصر مسبقاً لمنع التكرار
  const alreadyViewed = data.some(r => r[1] === itemId && r[3] === userInfo.userId);
  
  if (!alreadyViewed) {
    sheet.appendRow([
      "VW-" + Utilities.getUuid(), // ViewID
      itemId,                      // ItemID
      itemType,                    // ItemType (homework/announcement)
      userInfo.userId,             // StudentID
      new Date()                   // ViewDate
    ]);
  }
  return successResponse({}, 'تم تسجيل المشاهدة بنجاح.');
}

/**
 * دالة جلب الإحصائيات الشاملة للوحة تحكم المشرف
 */
function getAdminAnalytics() {
  const users = getData_(SHEETS.USERS);
  const grades = getData_(SHEETS.GRADES);
  const absences = getData_(SHEETS.ABSENCES);
  const objections = getData_(SHEETS.OBJECTIONS);
  const homework = getData_(SHEETS.HOMEWORK);

  // حساب الأرقام بدقة
  const analytics = {
    studentsCount: users.filter(u => u[3] === 'طالب').length,
    teachersCount: users.filter(u => u[3] === 'مدرس').length,
    pendingApprovals: grades.filter(g => g[14] === 'بانتظار الموافقة').length + 
                       absences.filter(a => a[5] === 'بانتظار الموافقة').length +
                       homework.filter(h => h[5] === 'بانتظار الموافقة').length,
    activeObjections: objections.filter(obj => obj[5] === 'بانتظار الإدارة').length
  };

  return successResponse({ analytics });
}

function getAllUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const absIdx = headers.indexOf('CanRecordAbsence');
  const excelIdx = headers.indexOf('CanUseMasterExcel');

  const users = data.slice(1).map(user => ({
    userId: user[0],
    fullName: user[4],
    role: user[3],
    status: user[5],
    class: user[6] || '-',
    section: user[7] || '-',
    phone: user[10],
    telegramId: user[12],
    profilePic: user[19] || '', // جلب الصورة الشخصية
    canRecordAbsence: absIdx > -1 ? user[absIdx] === 'نعم' : false,
    canUseMasterExcel: excelIdx > -1 ? user[excelIdx] === 'نعم' : false
  }));
  return successResponse({ users });
}



// ==========================================================
//          طبقة الأمان: الجلسات والصلاحيات (جديد)
// ==========================================================
const SESSION_DAYS_ = 30;

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sha256Hex_(text) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8);
  return raw.map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('');
}

// تُحفظ الجلسات في خصائص السكربت، فيستطيع المستخدم الدخول من الهاتف والحاسوب معاً
function startSession_(token, userId) {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const all = props.getProperties();
  Object.keys(all).forEach(k => {
    if (k.indexOf('sess_') !== 0) return;
    try { if (JSON.parse(all[k]).exp < now) props.deleteProperty(k); } catch (e) { props.deleteProperty(k); }
  });
  props.setProperty('sess_' + sha256Hex_(token), JSON.stringify({ u: String(userId), exp: now + SESSION_DAYS_ * 864e5 }));
}

function endSession_(clientInfo) {
  if (clientInfo && clientInfo.token) PropertiesService.getScriptProperties().deleteProperty('sess_' + sha256Hex_(clientInfo.token));
}

function authenticate_(clientInfo) {
  if (!clientInfo || !clientInfo.userId || !clientInfo.token) return null;
  const raw = PropertiesService.getScriptProperties().getProperty('sess_' + sha256Hex_(clientInfo.token));
  if (!raw) return null;
  let s; try { s = JSON.parse(raw); } catch (e) { return null; }
  if (s.exp < Date.now() || s.u !== String(clientInfo.userId)) return null;
  // (سرعة) بيانات المستخدم تُحفظ مؤقتاً دقيقتين بدل قراءة جدول المستخدمين مع كل طلب
  const cache = CacheService.getScriptCache();
  let u = null;
  const hit = cache.get('u_' + s.u);
  if (hit) { try { u = JSON.parse(hit); } catch (e) { u = null; } }
  if (!u) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const row = data.find((r, i) => i > 0 && String(r[0]) === s.u);
    if (!row) return null;
    const flag = name => { const i = headers.indexOf(name); return i > -1 && row[i] === 'نعم'; };
    const chIdx = headers.indexOf('Children');
    u = { userId: row[0], email: row[1], role: row[3], name: row[4], status: row[5], studentClass: row[6], studentSection: row[7],
      canRecordAbsence: flag('CanRecordAbsence'), canUseMasterExcel: flag('CanUseMasterExcel'),
      perms: { canRecordAbsence: flag('CanRecordAbsence'), canUseMasterExcel: flag('CanUseMasterExcel'), canCreateExams: flag('CanCreateExams'),
               canScanPaper: flag('CanScanPaper'), canChat: flag('CanChat'), canViewRecords: flag('CanViewRecords') },
      children: chIdx > -1 ? String(row[chIdx] || '').split(/[,،\s]+/).filter(Boolean) : [],
      googleEmail: headers.indexOf('GoogleEmail') > -1 ? String(row[headers.indexOf('GoogleEmail')] || '') : '' };
    cache.put('u_' + s.u, JSON.stringify(u), 120);
  }
  if (normalizeArabicText_(u.status) !== normalizeArabicText_('نشط')) return null;
  return Object.assign({}, u, { token: clientInfo.token });
}

function publicUser_(u) {
  return { userId: u.userId, email: u.email, role: u.role, name: u.name, studentClass: u.studentClass,
           studentSection: u.studentSection, token: u.token, canRecordAbsence: u.canRecordAbsence, canUseMasterExcel: u.canUseMasterExcel };
}

// من يحق له تنفيذ كل أمر. أي أمر غير مذكور هنا للإداري فقط.
const ACL_ = (function () {
  const S = 'طالب', T = 'مدرس', A = 'إداري';
  return {
    logout: [S, T, A], whoAmI: [S, T, A], getMyProfile: [S, T, A], updateMyProfile: [S, T, A], getWeeklySchedule: [S, T, A],
    getStudentDashboard: [S], submitObjection: [S], getStudentObjections: [S], trackItemView: [S],
    getTeacherDashboard: [T], getTeacherObjections: [T], handleTeacherObjection: [T],
    getTeacherSentHomework: [T, A], getItemViews: [T, A], getStudentsForGrading: [T, A], getStudentsForExcel: [T, A],
    submitGrades: [T, A], getStudentsForAttendance: [T, A], recordAbsences: [T, A], submitHomework: [T, A],
    getExistingEvaluations: [T, A], submitDailyEvaluation: [T, A], addLibraryLink: [T, A], getMasterExcelData: [T, A],
    getSchoolStructure: [T, A], getUniqueClassesAndSubjects: [T, A], getSystemSettings: [T, A],
    getEvaluationsLog: [T, A], registerPushToken: [S, T, A], unregisterPushToken: [S, T, A], getNotifications: [S, T, A], markNotificationsRead: [S, T, A]
  };
})();

function authorize_(action, user, payload) {
  // (جديد) الأوامر الإضافية، وصلاحيات الميزات، ووليّ الأمر
  if (typeof authorizeExtra_ === 'function') {
    const ext = authorizeExtra_(action, user, payload);
    if (ext !== undefined) return ext;
  }
  const role = normalizeArabicText_(user.role);
  if (role === normalizeArabicText_('إداري')) return null;
  const allowed = (ACL_[action] || []).map(normalizeArabicText_);
  if (allowed.indexOf(role) === -1) return 'ليست لديك صلاحية لهذا الإجراء.';
  if (role === normalizeArabicText_('مدرس')) {
    if (action === 'recordAbsences' && !user.canRecordAbsence) return 'صلاحية تسجيل الغياب غير مفعّلة لحسابك. راجع المشرف.';
    if (action === 'getMasterExcelData' && !user.canUseMasterExcel) return 'صلاحية الإكسل الشامل غير مفعّلة لحسابك. راجع المشرف.';
  }
  return null;
}


// ==========================================================
//      التجهيز الذاتي: ينشئ الصفحات والأعمدة الناقصة تلقائياً
// ==========================================================
const SCHEMA_VERSION_ = '5';
const USERS_COLUMNS_ = ['ID', 'Email', 'Password', 'Role', 'FullName', 'Status', 'Class', 'Section', 'GuardianName', 'GuardianPhone',
  'StudentPhone', 'CanRecordAbsence', 'TelegramID', 'SessionToken', 'MotherName', 'Address', 'DOB', 'BloodType', 'MedicalNotes', 'ProfilePic'];

function schemaDefinition_() {
  const s = {};
  s[SHEETS.GRADES] = ['RecordID', 'StudentID', 'Subject', 'GradeType', 'Grade', 'Term1_Avg', 'MidYear_Exam', 'Term2_Avg', 'Yearly_Effort', 'Final_Exam', 'Final_Result', 'GradeNotes', 'UpdatedAt', 'UpdatedByID', 'Status', 'ChangesJSON', 'UpdatedByName', 'TelegramStatus'];
  s[SHEETS.GRADES_ARCHIVE] = s[SHEETS.GRADES];
  s[SHEETS.ABSENCES] = ['AbsenceID', 'StudentID', 'Date', 'Notes', 'RecordedBy', 'Status', 'TelegramStatus'];
  s[SHEETS.ANNOUNCEMENTS] = ['AnnounceID', 'Date', 'Title', 'Audience', 'Content', 'PostedBy'];
  s[SHEETS.SETTINGS] = ['SettingKey', 'SettingValue', 'Description'];
  s[SHEETS.HOMEWORK] = ['HomeworkID', 'SubmitDate', 'Class', 'Section', 'Subject', 'Status', 'Content', 'TeacherName', 'TelegramStatus', 'SentDate'];
  s[SHEETS.DAILY_EVALUATIONS] = ['EvalID', 'StudentID', 'TeacherID', 'Date', 'Subject', 'DailyPrep', 'Participation', 'Behavior', 'Homework', 'Note', 'Status', 'TeacherName', 'TelegramStatus'];
  s[SHEETS.LIBRARY] = ['LinkID', 'Date', 'Title', 'URL', 'Class', 'Status', 'Subject', 'Description', 'TeacherName', 'TelegramStatus'];
  s[SHEETS.EXAM_SCHEDULES] = ['ExamScheduleID', 'Date', 'TargetClass', 'Title', 'ScheduleDataJSON'];
  s[SHEETS.WEEKLY_SCHEDULES] = ['ScheduleID', 'TargetClass', 'TargetSection', 'ScheduleDataJSON', 'LastUpdated'];
  s[SHEETS.TEACHER_ASSIGNMENTS] = ['TeacherID', 'TeacherName', 'Class', 'Section', 'Subject'];
  s[SHEETS.OBJECTIONS] = ['ObjectionID', 'Date', 'StudentID', 'Subject', 'Content', 'AdminStatus', 'TeacherStatus', 'TeacherID', 'TeacherReply'];
  s[SHEETS.VIEWS_TRACKING] = ['ViewID', 'ItemID', 'ItemType', 'StudentID', 'ViewDate'];
  s[SHEETS.SMART_TIMETABLES_ARCHIVE] = ['ID', 'Date', 'Name', 'DataJSON', 'User'];
  s[SHEETS.TIMETABLE_CONSTRAINTS] = ['TeacherID', 'TeacherName', 'AvailabilityJSON', 'MaxPeriods'];
  if (typeof NOTIF_HEADERS_ !== 'undefined') Object.keys(NOTIF_HEADERS_).forEach(k => { s[k] = NOTIF_HEADERS_[k]; });
  if (typeof EXT_HEADERS_ !== 'undefined') Object.keys(EXT_HEADERS_).forEach(k => { s[k] = EXT_HEADERS_[k]; });
  s[SHEETS.LIBRARY] = s[SHEETS.LIBRARY].concat(['Category']);
  return s;
}

function ensureSchema_(force) {
  const props = PropertiesService.getScriptProperties();
  if (!force && props.getProperty('SCHEMA_VERSION') === SCHEMA_VERSION_) return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    if (!force && props.getProperty('SCHEMA_VERSION') === SCHEMA_VERSION_) return;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const report = [];
    const headerRow = sh => {
      const w = Math.max(1, sh.getLastColumn());
      return sh.getRange(1, 1, 1, w).getValues()[0].map(v => String(v).trim());
    };
    const style = (sh, n) => sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#eeeeee');

    // المستخدمون: الكود يقرأ الأعمدة بمواقعها، فيُكتب كل عنوان ناقص في مكانه الصحيح
    let users = ss.getSheetByName(SHEETS.USERS);
    if (!users) { users = ss.insertSheet(SHEETS.USERS); report.push(SHEETS.USERS); }
    const uh = headerRow(users);
    USERS_COLUMNS_.forEach((h, i) => {
      if (!uh[i]) { users.getRange(1, i + 1).setValue(h); uh[i] = h; }
    });
    (typeof EXT_USER_COLUMNS_ !== 'undefined' ? EXT_USER_COLUMNS_ : ['CanUseMasterExcel']).forEach(h => { if (uh.indexOf(h) === -1) { users.getRange(1, uh.length + 1).setValue(h); uh.push(h); } });
    style(users, uh.length);

    const defs = schemaDefinition_();
    Object.keys(defs).forEach(name => {
      let sh = ss.getSheetByName(name);
      if (!sh) {
        sh = ss.insertSheet(name);
        sh.getRange(1, 1, 1, defs[name].length).setValues([defs[name]]);
        style(sh, defs[name].length);
        sh.setFrozenRows(1);
        report.push(name);
        return;
      }
      if (sh.getLastRow() === 0) { sh.getRange(1, 1, 1, defs[name].length).setValues([defs[name]]); style(sh, defs[name].length); return; }
      const h = headerRow(sh);
      defs[name].forEach((col, i) => { if (!h[i]) { sh.getRange(1, i + 1).setValue(col); h[i] = col; } });
    });
    // مفاتيح الميزات تُضاف معطّلة، ويفعّلها المدير من الإعدادات
    if (typeof FEATURES_ !== 'undefined') {
      const st = ss.getSheetByName(SHEETS.SETTINGS);
      const keys = st.getDataRange().getValues().map(r => r[0]);
      Object.keys(FEATURES_).forEach(k => { if (keys.indexOf(k) === -1) st.appendRow([k, 'مغلق', FEATURES_[k]]); });
    }
    props.setProperty('SCHEMA_VERSION', SCHEMA_VERSION_);
    if (report.length) Logger.log('أُنشئت الصفحات: ' + report.join('، '));
    return report;
  } finally { lock.releaseLock(); }
}

// من قائمة الشيت: فحص وإصلاح يدوي
function repairSheetsNow() {
  const report = ensureSchema_(true) || [];
  SpreadsheetApp.getUi().alert(report.length ? 'أُنشئت الصفحات الناقصة: ' + report.join('، ') : 'كل الصفحات والأعمدة موجودة وسليمة ✅');
}


// ==========================================================
//   سجل التقييمات اليومية: المدرس يرى ما رفعه هو، والإدارة ترى الكل
// ==========================================================
function getEvaluationsLog(payload, userInfo) {
  const isTeacher = normalizeArabicText_(userInfo.role) === normalizeArabicText_('مدرس');
  const users = getUsersMap_();
  const from = payload.from ? new Date(payload.from + 'T00:00:00') : new Date(Date.now() - 30 * 864e5);
  const to = payload.to ? new Date(payload.to + 'T23:59:59') : new Date();
  const items = getData_(SHEETS.DAILY_EVALUATIONS).filter(r => {
    if (isTeacher && String(r[2]) !== String(userInfo.userId)) return false;
    if (!isTeacher && payload.teacherId && String(r[2]) !== String(payload.teacherId)) return false;
    const d = new Date(r[3]);
    if (isNaN(d) || d < from || d > to) return false;
    if (payload.subject && r[4] !== payload.subject) return false;
    const st = users.get(r[1]) || {};
    if (payload.studentClass && st.class !== payload.studentClass) return false;
    if (payload.studentSection && payload.studentSection !== 'الكل' && st.section !== payload.studentSection) return false;
    return true;
  }).map(r => {
    const st = users.get(r[1]) || {};
    return { id: r[0], iso: isoDate_(r[3]), subject: r[4], studentId: r[1], studentName: st.name || r[1], studentClass: st.class || '', studentSection: st.section || '',
      teacher: r[11], prep: r[5], part: r[6], beh: r[7], hw: r[8], note: r[9], status: r[10] };
  });
  items.sort((a, b) => b.iso.localeCompare(a.iso) || a.subject.localeCompare(b.subject) || String(a.studentName).localeCompare(String(b.studentName), 'ar'));
  const teachers = isTeacher ? [] : getData_(SHEETS.USERS).filter(u => normalizeArabicText_(u[3]) === normalizeArabicText_('مدرس')).map(u => ({ id: u[0], name: u[4] }));
  return successResponse({ items: items.slice(0, 2000), truncated: items.length > 2000, teachers: teachers });
}
