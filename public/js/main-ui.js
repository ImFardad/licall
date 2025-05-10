// public/js/main-ui.js
// این فایل کنترل دکمه‌ها و اتصال کل ماژول‌ها به Socket.IO را بر عهده دارد

function initCall({ socketUrl, me, role }) {
  // وصل شو به سرور سوکت
  window.socket = io(socketUrl, { transports: ['websocket'] });

  // بعد از اتصال، اعلام کن که وارد روم شدی
  socket.on('connect', () => {
    socket.emit('join-room', { name: me, role });
  });

  // UI elements
  const muteBtn      = document.getElementById('muteBtn');
  const screenBtn    = document.getElementById('screenShareBtn');
  const raiseBtn     = document.getElementById('raiseHandBtn');
  const exitBtn      = document.getElementById('disconnectBtn');

  // قطع/وصل میکروفون
  muteBtn.addEventListener('click', () => {
    document.getElementById('audioTrack').enabled = 
      !document.getElementById('audioTrack').enabled;
    socket.emit('mute-toggle');
  });

  // دکمه ریز هند
  raiseBtn.addEventListener('click', () => {
    socket.emit('raise-hand');
  });

  // قطع تماس
  exitBtn.addEventListener('click', () => {
    socket.emit('leave-room');
    location.reload();
  });

  // وقتی کیک شدی یا بن شدی
  socket.on('kicked', () => { alert('You were kicked'); location.reload(); });
  socket.on('banned', () => { alert('You are banned'); location.reload(); });

  // راه‌اندازی صدای محلی
  if (typeof initLocalStream === 'function') initLocalStream();

  // راه‌اندازی screen-share
  // (کدی در screen-share.js اجرا می‌شود)
}

// تابع initCall را به window بده تا در inline اسکریپت قابل‌دسترسی باشد
window.initCall = initCall;
