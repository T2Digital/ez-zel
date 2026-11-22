// Battah System Biometric Bridge - Windows Service Installer
// هذا السكربت مخصص لتثبيت أداة الربط كخدمة نظام (Windows Service) تعمل في الخلفية تلقائياً 
// مع تشغيل جهاز الكمبيوتر بدون ظهور أي شاشات للمستخدم.

const { Service } = require('node-windows');
const path = require('path');

// إنشاء كائن الخدمة
const svc = new Service({
  name: 'Battah Biometric Bridge',
  description: 'خدمة الربط التلقائي بين جهاز البصمة ونظام بطاح السحابي.',
  script: path.join(__dirname, 'bridge-agent.js'),
  env: [{
      name: "NODE_ENV",
      value: "production"
  }],
  // إعادة تشغيل الخدمة تلقائياً في حالة توقفها
  wait: 2,
  grow: .5,
  maxRestarts: 10
});

// ماذا يحدث بعد التثبيت بنجاح
svc.on('install', function() {
  console.log('✅ تم تثبيت الخدمة بنجاح!');
  console.log('جاري تشغيل الخدمة الآن في الخلفية...');
  svc.start();
  console.log('🚀 الخدمة تعمل الآن ومخفية تماماً. ستعمل تلقائياً مع كل عملية تشغيل للكمبيوتر بدون أي تدخل.');
});

// في حالة كانت الخدمة مثبتة بالفعل
svc.on('alreadyinstalled', function() {
  console.log('⚠️ هذه الخدمة مثبتة بالفعل على هذا الجهاز. جاري إعادة تشغيلها لضمان عملها...');
  svc.restart();
  console.log('🔄 تم إعادة التشغيل.');
});

svc.on('error', function(err) {
  console.error('❌ حدث خطأ أثناء التعامل مع الخدمة:', err);
});

// تثبيت الخدمة
console.log('⏳ جاري إعداد وتثبيت الخدمة في نظام التشغيل، يرجى الانتظار...');
svc.install();
