/* إعدادات إشعارات الهاتف (Firebase). تُملأ مرة واحدة من لوحة Firebase، والخطوات في README.
   ما دامت فارغة، يعمل صندوق الإشعارات داخل المنصة فقط. */
self.PUSH_CONFIG = {
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    messagingSenderId: '',
    appId: ''
  },
  // Project settings ← Cloud Messaging ← Web Push certificates ← Key pair
  vapidKey: ''
};
