// routes/auth.js
const express = require('express');
const router  = express.Router();
const { db }  = require('../db/index');
const { v4: uuidv4 } = require('uuid');

// Show login form (user / guest)
router.get('/login', (req, res) => {
  const roomStatus = req.app.locals.roomStatus;
  if (roomStatus !== 'open') {
    return res.render('login', { roomOpen: false });
  }
  res.render('login', { roomOpen: true, error: null });
});

// Handle user login (admin & normal user)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    `SELECT id, role FROM users WHERE username=? AND password=?`,
    [username, password],
    (err, row) => {
      if (err) return res.render('login', { roomOpen: true, error: 'Server error' });
      if (!row) return res.render('login', { roomOpen: true, error: 'Invalid credentials' });
      // store session
      req.session.user = { id: row.id, username, role: row.role };
      res.redirect('/call');
    }
  );
});

// Handle guest request
router.post('/guest', (req, res) => {
  const { guestName } = req.body;
  const deviceId = uuidv4();
  db.run(
    `INSERT INTO guests(name,deviceId,status) VALUES(?,?,?)`,
    [guestName, deviceId, 'pending'],
    function(err) {
      if (err) return res.render('login', { roomOpen: true, error: 'Server error' });
      req.session.guest = { id: this.lastID, name: guestName, deviceId };
      // if auto‑approve on
      if (req.app.locals.autoApproveGuests === 'true') {
        db.run(`UPDATE guests SET status='approved' WHERE id=?`, [this.lastID]);
        return res.redirect('/call');
      }
      res.redirect('/auth/pending');
    }
  );
});

// Pending page for guests
router.get('/pending', (req, res) => {
  res.render('pending');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
});

module.exports = router;
