// sockets/audio.js
module.exports = (io, socket) => {
  socket.on('audio-chunk', payload => {
    // Broadcast to others
    socket.broadcast.emit('audio-chunk', payload);
  });
};
