// public/js/participants.js
(() => {
  const socket = window.socket;
  const listEl = document.getElementById('participantList');

  let participants = {};

  socket.on('participant-joined', p => {
    participants[p.id] = { name:p.displayName, role:p.role, muted:true, raised:false };
    render();
  });
  socket.on('participant-left', id => {
    delete participants[id];
    render();
  });
  socket.on('user-muted', ({ id, muted }) => {
    if (participants[id]) participants[id].muted = muted;
    render();
  });
  socket.on('role-changed', ({ id, role }) => {
    if (participants[id]) {
      participants[id].role = role;
      if (role!=='guest') participants[id].raised = false;
    }
    render();
  });
  socket.on('raised-hand', id => {
    if (participants[id]) participants[id].raised = true;
    render();
  });

  function render() {
    listEl.innerHTML = '';
    // تبدیل به آرایه و سورت
    const arr = Object.entries(participants).map(([id,p])=>({ id, ...p }));
    arr.sort((a,b)=>{
      const rank = { admin:0, operator:1, provider:2, normal:3 };
      if (a.raised!==b.raised) return b.raised?1:-1;
      if (a.muted!==b.muted) return a.muted?1:-1;
      if (rank[a.role]!==rank[b.role]) return rank[a.role]-rank[b.role];
      return a.name.localeCompare(b.name);
    });
    for (const p of arr) {
      const div = document.createElement('div');
      div.className = 'participant-card';
      div.innerHTML = `
        <span class="mic-icon ${p.muted?'muted':'unmuted'}"></span>
        <span class="name ${p.role}">${p.name}${p.raised? ' ✋':''}</span>
        ${window.initCall && window.socket && window.socket.id!==p.id ? `
          <button class="role-btn" data-id="${p.id}">Role</button>
          <button class="kick-btn" data-id="${p.id}">Kick</button>` : ''}
      `;
      listEl.appendChild(div);
    }
    // bind عملیات
    document.querySelectorAll('.role-btn').forEach(b=>{
      b.onclick = () => {
        const id = b.dataset.id;
        const newRole = prompt('New role (normal,provider,operator):');
        socket.emit('change-role',{ id, role:newRole });
      };
    });
    document.querySelectorAll('.kick-btn').forEach(b=>{
      b.onclick = () => {
        const id = b.dataset.id;
        if (confirm('Kick this user?')) socket.emit('kick-user', id);
      };
    });
  }
})();
