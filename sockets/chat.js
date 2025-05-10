// sockets/chat.js
module.exports = (io, socket) => {
  socket.on('chat-message', msg => {
    io.emit('chat-message', {
      id: socket.id,
      name: socket.data.name,
      role: socket.data.role,
      text: msg
    });
  });
};
