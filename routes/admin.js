// routes/admin.js
const express = require('express');
const router  = express.Router();
const { db, getSetting, setSetting } = require('../db/index');

// middleware: فقط admin
function ensureAdmin(req,res,next){
  if (req.session.user?.role==='admin') return next();
  res.redirect('/auth/login');
}

// صفحه‌ی لاگین ادمین (در مسیر /admin/login)
router.get('/login', (req,res) => {
  res.render('admin-login', { error: null, roomOpen: res.locals.roomStatus==='open' });
});

// پردازش لاگین ادمین
router.post('/login', (req,res) => {
  const { username,password } = req.body;
  db.get(`SELECT role FROM users WHERE username=? AND password=?`, [username,password], (e,row)=>{
    if (e||!row||row.role!=='admin') {
      return res.render('admin-login',{ error:'Invalid credentials', roomOpen: res.locals.roomStatus==='open' });
    }
    req.session.user = { username, role:'admin' };
    res.redirect('/admin/panel');
  });
});

// پنل ادمین (start/stop/settings) در /admin/panel
router.get('/panel', ensureAdmin, async (req,res) => {
  res.render('admin-panel', {
    roomStatus: res.locals.roomStatus,
    autoApprove: res.locals.autoApproveGuests,
    hideParticipants: res.locals.hideParticipants,
    hideChat: res.locals.hideChat
  });
});

// استارت روم
router.post('/start-room', ensureAdmin, async (req,res) => {
  await setSetting('roomStatus','open');
  res.redirect('/admin/panel');
});
// بستن روم (پاک‌کردن مهمان‌ها)
router.post('/close-room', ensureAdmin, async (req,res) => {
  await setSetting('roomStatus','closed');
  db.run(`DELETE FROM guests`);
  res.redirect('/admin/panel');
});
// toggle auto‑approve
router.post('/toggle-auto-approve', ensureAdmin, async (req,res) => {
  const v = res.locals.autoApproveGuests==='true'?'false':'true';
  await setSetting('autoApproveGuests',v);
  res.redirect('/admin/panel');
});
// toggle hide participants
router.post('/toggle-hide-participants', ensureAdmin, async (req,res) => {
  const v = res.locals.hideParticipants==='true'?'false':'true';
  await setSetting('hideParticipants',v);
  res.redirect('/admin/panel');
});
// toggle hide chat
router.post('/toggle-hide-chat', ensureAdmin, async (req,res) => {
  const v = res.locals.hideChat==='true'?'false':'true';
  await setSetting('hideChat',v);
  res.redirect('/admin/panel');
});

module.exports = router;
