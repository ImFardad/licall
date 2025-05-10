// public/js/screen-share.js
(() => {
  let screenStream=null, video=null, canvas=null, ctx=null;
  const socket = window.socket;

  async function startShare() {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video:true });
    video = document.createElement('video');
    video.srcObject = screenStream;
    await video.play();
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    document.getElementById('screenShareBtn').onclick = stopShare;
    captureLoop();
  }

  function stopShare() {
    clearInterval(captureInterval);
    screenStream.getTracks().forEach(t=>t.stop());
    socket.emit('screen-stop');
  }

  let captureInterval;
  function captureLoop() {
    captureInterval = setInterval(()=>{
      ctx.drawImage(video,0,0);
      canvas.toBlob(blob=>{
        if (blob) socket.emit('screen-chunk', { blob, timestamp:Date.now() });
      }, 'image/jpeg', 0.7);
    }, 1000/15);
  }

  // نمایش دریافتی
  socket.on('screen-chunk', ({ blob }) => {
    const img = document.getElementById('sharedScreen');
    img.src = URL.createObjectURL(blob);
  });

  // bind دکمه
  document.getElementById('screenShareBtn').addEventListener('click', () => {
    if (!screenStream) startShare();
    else stopShare();
  });
})();
