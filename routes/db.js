// routes/db.js
const express = require('express');
const router  = express.Router();
const { db }  = require('../db/index');

// admin‑only middleware
function ensureAdmin(req,res,next){
  if (req.session.user && req.session.user.role==='admin') return next();
  res.status(403).json({ error:'Forbidden' });
}

// USERS CRUD
router.get('/users', ensureAdmin, (req,res)=>{
  const q = `%${req.query.search||''}%`;
  db.all(`SELECT id,username,role FROM users WHERE username LIKE ? ORDER BY username`,[q],(e,rows)=>
    e? res.status(500).json(e): res.json(rows)
  );
});
router.post('/users', ensureAdmin, (req,res)=>{
  const { username,password,role } = req.body;
  db.run(`INSERT INTO users(username,password,role) VALUES(?,?,?)`,
    [username,password,role], function(err){
      if (err) return res.status(400).json(err);
      res.json({ id:this.lastID });
    }
  );
});
router.put('/users/:id', ensureAdmin, (req,res)=>{
  const { username,password,role } = req.body;
  db.run(`UPDATE users SET username=?,password=?,role=? WHERE id=?`,
    [username,password,role,req.params.id], function(err){
      if (err) return res.status(400).json(err);
      res.json({ changes:this.changes });
    }
  );
});
router.delete('/users/:id', ensureAdmin, (req,res)=>{
  db.run(`DELETE FROM users WHERE id=?`,[req.params.id], function(err){
    if (err) return res.status(400).json(err);
    res.json({ changes:this.changes });
  });
});

// GUESTS CRUD
router.get('/guests', ensureAdmin, (req,res)=>{
  const q = `%${req.query.search||''}%`;
  db.all(`SELECT id,name,deviceId,status FROM guests 
          WHERE name LIKE ? ORDER BY id`,[q],(e,rows)=>
    e? res.status(500).json(e): res.json(rows)
  );
});
router.put('/guests/:id', ensureAdmin, (req,res)=>{
  const { name,deviceId,status } = req.body;
  db.run(`UPDATE guests SET name=?,deviceId=?,status=? WHERE id=?`,
    [name,deviceId,status,req.params.id], function(err){
      if (err) return res.status(400).json(err);
      res.json({ changes:this.changes });
    }
  );
});
router.delete('/guests/:id', ensureAdmin, (req,res)=>{
  db.run(`DELETE FROM guests WHERE id=?`,[req.params.id], function(err){
    if (err) return res.status(400).json(err);
    res.json({ changes:this.changes });
  });
});

module.exports = router;
