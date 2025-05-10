// routes/call.js
const express = require('express');
const router  = express.Router();
const { db }  = require('../db/index');

// middleware: روم باید open باشد
function ensureRoomOpen(req,res,next){
  if (res.locals.roomStatus==='open') return next();
  res.redirect('/auth/login');
}
// middleware: user یا approved guest
function ensureParticipant(req,res,next){
  if (req.session.user) return next();
  if (req.session.guest) {
    db.get(`SELECT status FROM guests WHERE id=?`, [req.session.guest.id], (e,row)=>{
      if (!e && row?.status==='approved') return next();
      return res.redirect('/auth/pending');
    });
  } else res.redirect('/auth/login');
}

router.get('/', ensureRoomOpen, ensureParticipant, (req,res)=>{
  res.render('call', {
    me: req.session.user?.username || req.session.guest.name,
    role: req.session.user?.role || 'guest'
  });
});

module.exports = router;
