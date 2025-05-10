// public/js/audio.js
// PCM + VAD path (مسیر اول)

let localStream, audioContext, sourceNode, scriptNode;
let sendBuffer = [];
const VAD_THRESHOLD = 0.02;

// این تابع را main-ui.js بعد از join صدا می‌کند
async function initLocalStream() {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount:1, sampleRate:48000 }
  });
  // یک track مجازی برای کنترل میوت
  localStream.getAudioTracks()[0].enabled = false;
  // راه‌اندازی Web Audio API
  audioContext = new AudioContext({ sampleRate: 48000 });
  sourceNode = audioContext.createMediaStreamSource(localStream);
  scriptNode = audioContext.createScriptProcessor(4096,1,1);
  sourceNode.connect(scriptNode);
  scriptNode.connect(audioContext.destination);

  scriptNode.onaudioprocess = e => {
    const input = e.inputBuffer.getChannelData(0);
    let maxAmp = 0;
    for (let i = 0; i < input.length; i++) {
      maxAmp = Math.max(maxAmp, Math.abs(input[i]));
    }
    if (maxAmp > VAD_THRESHOLD) {
      sendBuffer.push(new Float32Array(input));
    }
  };

  setInterval(() => {
    if (!sendBuffer.length) return;
    const totalLen = sendBuffer.reduce((sum,a)=>sum+a.length,0);
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const arr of sendBuffer) {
      merged.set(arr, offset);
      offset += arr.length;
    }
    sendBuffer = [];
    const int16 = new Int16Array(merged.length);
    for (let i=0; i<merged.length; i++) {
      const s = Math.max(-1, Math.min(1, merged[i]));
      int16[i] = s<0 ? s*0x8000 : s*0x7FFF;
    }
    // ارسال به همه
    socket.emit('audio-chunk', { buffer: int16.buffer, sampleRate: audioContext.sampleRate });
  }, 250);

  // کنترل قطع/وصل
  document.getElementById('disconnectBtn').onclick = () => {
    localStream.getTracks().forEach(t=>t.stop());
  };
}

// دریافت و پخش PCM از دیگران
const incoming = {};
socket && socket.on('audio-chunk', ({ id, buffer, sampleRate }) => {
  const int16 = new Int16Array(buffer);
  if (!incoming[id]) incoming[id] = [];
  incoming[id].push(int16);
  playAudio(id, sampleRate);
});

function playAudio(id, sampleRate) {
  const q = incoming[id];
  if (!q || !q.length) return;
  const chunk = q.shift();
  const f32 = new Float32Array(chunk.length);
  for (let i=0; i<chunk.length; i++) {
    f32[i] = chunk[i] / (chunk[i]<0 ? 0x8000 : 0x7FFF);
  }
  if (!audioContext || audioContext.state==='closed') return;
  const buf = audioContext.createBuffer(1, f32.length, sampleRate);
  buf.getChannelData(0).set(f32);
  const src = audioContext.createBufferSource();
  src.buffer = buf;
  src.connect(audioContext.destination);
  src.start();
}
