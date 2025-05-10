// public/js/chat.js
(() => {
  const socket = window.socket;
  const chatList = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const input    = document.getElementById('chatInput');

  // ارسال پیام
  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const txt = input.value.trim();
    if (!txt) return;
    socket.emit('chat-message', txt);
    input.value = '';
  });

  // دریافت پیام
  socket.on('chat-message', ({ id, name, role, text }) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="name ${role}">${name}:</span> ${text}`;
    chatList.appendChild(li);
    chatList.scrollTop = chatList.scrollHeight;
  });
})();
