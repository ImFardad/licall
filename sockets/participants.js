// sockets/participants.js
const { db } = require('../db/index');

module.exports = (io, socket) => {
  // join-room: notify others
  socket.on('join-room', ({ name, role }) => {
    socket.data = { name, role };
    io.emit('participant-joined', { id: socket.id, displayName: name, role });
  });
  socket.on('leave-room', () => {
    io.emit('participant-left', socket.id);
  });
  socket.on('change-role', ({ id, role }) => {
    io.emit('role-changed', { id, role });
  });
  socket.on('kick-user', id => {
    io.to(id).emit('kicked');
    io.emit('participant-left', id);
  });
  socket.on('ban-user', ({ id, deviceId }) => {
    if (deviceId) {
      db.run(`UPDATE guests SET status='banned' WHERE deviceId=?`, [deviceId]);
    } else {
      db.run(`DELETE FROM users WHERE id=?`, [id]);
    }
    io.to(id).emit('banned');
    io.emit('participant-left', id);
  });
};
