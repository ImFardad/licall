// /db/seed.js
require('dotenv').config();
const { db, initialize } = require('./index');
const sqlite3 = require('sqlite3').verbose();

// ۱) ابتدا جداول را بساز (در صورت نیاز)
initialize();

// ۲) خواندن لیست ADMIN_USERS از .env
// فرمت: "alice:pass1,bob:pass2"
const raw = process.env.ADMIN_USERS || '';
const pairs = raw.split(',').map(x => x.trim()).filter(x => x);

// ۳) درج هر admin در جدول users با نقش 'admin'
const insert = db.prepare(`
  INSERT OR IGNORE INTO users(username,password,role)
  VALUES(?,?, 'admin')
`);
pairs.forEach(pair => {
  const [username, password] = pair.split(':');
  if (username && password) {
    insert.run(username, password);
    console.log(`Seeded admin: ${username}`);
  }
});
insert.finalize(() => {
  console.log('Admin seeding complete.');
  // اختیاری: بستن اتصال
  db.close();
});
