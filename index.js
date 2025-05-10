// index.js (project entry point)

require('dotenv').config();
const express       = require('express');
const http          = require('http');
const session       = require('express-session');
const SQLiteStore   = require('connect-sqlite3')(session);
const path          = require('path');
const { initialize }= require('./db/index');
const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const dbRoutes      = require('./routes/db');
const callRoutes    = require('./routes/call');

const app    = express();
const server = http.createServer(app);
const io     = require('socket.io')(server);

// — initialize database & seed admins from .env
initialize();

// — view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// — session setup
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './db' }),
  secret: 'licall_session_secret',
  resave: false,
  saveUninitialized: false
}));

// — parsers & static
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// — load runtime settings into locals
const { getSetting } = require('./db/index');
app.use(async (req,res,next) => {
  res.locals.roomStatus        = await getSetting('roomStatus');
  res.locals.autoApproveGuests = await getSetting('autoApproveGuests');
  res.locals.hideParticipants  = await getSetting('hideParticipants');
  res.locals.hideChat          = await getSetting('hideChat');
  res.locals.user             = req.session.user;
  res.locals.guest            = req.session.guest;
  next();
});

// — routes
app.use('/auth',  authRoutes);
app.use('/admin', adminRoutes);
app.use('/db',    dbRoutes);
app.use('/call',  callRoutes);
app.get('/', (req,res)=> res.redirect('/auth/login'));

// — Socket.IO handlers (audio, screen-share, roles, chat…)
io.on('connection', socket => {
  // all realtime logic will go here
  require('./sockets/audio')(io, socket);
  require('./sockets/screen')(io, socket);
  require('./sockets/participants')(io, socket);
  require('./sockets/chat')(io, socket);
});

// — start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log(`LiCall listening on port ${PORT}`));
