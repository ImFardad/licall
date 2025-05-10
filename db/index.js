// db/index.js
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const DB_PATH = path.join(__dirname, 'licall.sqlite');
const db = new sqlite3.Database(DB_PATH, err => {
  if (err) console.error('❌ Cannot open database:', err);
});

// initialize: ساخت جداول و seed خودکار adminها از .env
function initialize() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        username  TEXT    UNIQUE NOT NULL,
        password  TEXT    NOT NULL,
        role      TEXT    NOT NULL CHECK(role IN ('admin','user'))
      )`);
    db.run(`
      CREATE TABLE IF NOT EXISTS guests (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        name      TEXT    NOT NULL,
        deviceId  TEXT    NOT NULL,
        status    TEXT    NOT NULL CHECK(status IN ('pending','approved','banned'))
      )`);
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`);
    // defaults
    const defs = [
      ['roomStatus','closed'],
      ['autoApproveGuests','false'],
      ['hideParticipants','false'],
      ['hideChat','false']
    ];
    const stmt = db.prepare(`INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)`);
    defs.forEach(d=>stmt.run(d[0],d[1]));
    stmt.finalize();
    // seed admins
    const raw = process.env.ADMIN_USERS||'';
    raw.split(',').map(s=>s.trim()).filter(s=>s.includes(':')).forEach(pair=>{
      const [u,p] = pair.split(':');
      db.run(
        `INSERT OR IGNORE INTO users(username,password,role) VALUES(?,?,'admin')`,
        [u,p]
      );
    });
  });
}

function getSetting(key){ return new Promise((r,j)=>{ db.get(
  `SELECT value FROM settings WHERE key=?`,[key],
  (e,row)=> e? j(e): r(row?row.value:null)
);} ); }
function setSetting(key,value){ return new Promise((r,j)=>{ db.run(
  `REPLACE INTO settings(key,value) VALUES(?,?)`,[key,value],
  e=> e? j(e): r()
);} ); }

module.exports = { db, initialize, getSetting, setSetting };
