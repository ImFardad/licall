// sockets/screen.js
module.exports = (io, socket) => {
  socket.on('screen-chunk', payload => {
    socket.broadcast.emit('screen-chunk', payload);
  });
};
