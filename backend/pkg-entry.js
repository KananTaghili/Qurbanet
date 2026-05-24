const path = require('path');
const fs = require('fs');

// ─── Global xəta tutucular ─────────────────────────────────────────────────
// Bu olmasa hər hansı unhandled error prosesi dərhal öldürür
process.on('uncaughtException', (err) => {
  const msg = `[${new Date().toISOString()}] UNCAUGHT: ${err.message}\n${err.stack}\n`;
  process.stderr.write('\n❌ XƏTA: ' + err.message + '\n');
  if (process.pkg) {
    try {
      fs.appendFileSync(
        path.join(path.dirname(process.execPath), 'backend-error.log'),
        msg
      );
      process.stderr.write('📄 Ətraflı: backend-error.log faylına bax\n');
    } catch (_) {}
  }
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  process.stderr.write('\n⚠️  Unhandled Rejection: ' + msg + '\n');
  if (process.pkg) {
    try {
      fs.appendFileSync(
        path.join(path.dirname(process.execPath), 'backend-error.log'),
        `[${new Date().toISOString()}] REJECTION: ${msg}\n`
      );
    } catch (_) {}
  }
});

// ─── PKG: Real filesystem paths ────────────────────────────────────────────
if (process.pkg) {
  const execDir = path.dirname(process.execPath);

  // CWD-i exe-nin qovluğuna apar (bəzi paketlər CWD işlədir)
  try { process.chdir(execDir); } catch (_) {}

  // .env faylını exe-nin yanından yüklə
  require('dotenv').config({ path: path.join(execDir, '.env') });

  // Uploads qovluqlarını exe-nin yanında yarat
  const uploadsBase = path.join(execDir, 'uploads');
  const dirs = [
    uploadsBase,
    path.join(uploadsBase, 'orders'),
    path.join(uploadsBase, 'categories'),
    path.join(uploadsBase, 'charity-options'),
  ];
  dirs.forEach(d => { try { fs.mkdirSync(d, { recursive: true }); } catch (_) {} });

  // Global dəyişənlər - route faylları bunları istifadə edəcək
  global.__UPLOADS_BASE = uploadsBase;
} else {
  require('dotenv').config();
}

// ─── Server-i yüklə ────────────────────────────────────────────────────────
try {
  require('./server.js');
} catch (err) {
  process.stderr.write('\n❌ Server yüklənərkən xəta: ' + err.message + '\n');
  process.stderr.write(err.stack + '\n');
  if (process.pkg) {
    try {
      fs.appendFileSync(
        path.join(path.dirname(process.execPath), 'backend-error.log'),
        `[${new Date().toISOString()}] LOAD ERROR: ${err.message}\n${err.stack}\n`
      );
      process.stderr.write('📄 Ətraflı: backend-error.log faylına bax\n');
    } catch (_) {}
  }
  // Pəncərə açıq qalsın
  setInterval(() => {}, 60000);
}
