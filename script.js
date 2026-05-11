const API = 'https://script.google.com/macros/s/AKfycbyM6G8tEILpPi9E3FP-Uzh1HIoD20L6JSKu4TIWY4e3SwG-itvQJvqgf-rpJodzFQRd/exec';
const EMOJIS = ['⚗️','🔬','🧪','🧫','🧬','💊','🔭','📐','🧮','💻','📘','📙','📊','🌡️','⚛️','🫧'];
const YC = {1:'var(--y1)',2:'var(--y2)',3:'var(--y3)',4:'var(--y4)'};
const YN = {1:'ชั้นปีที่ 1',2:'ชั้นปีที่ 2',3:'ชั้นปีที่ 3',4:'ชั้นปีที่ 4'};
const YG = {1:'🧪',2:'⚗️',3:'🔬',4:'🎓'};
const TI = {PDF:'📄',SLIDE:'🖼️',EXERCISE:'✏️',LINK:'🔗',VIDEO:'🎬',NOTE:'📝'};

let session = null, courses = [], selEmoji = '⚗️', activeTab = 'all';

function apiCall(p) {
  return new Promise((r, j) => {
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    const qs = Object.entries({...p,callback:cb}).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
    const s = document.createElement('script');
    s.src = API + '?' + qs;
    window[cb] = (d) => { delete window[cb]; s.remove(); r(d); };
    s.onerror = () => { delete window[cb]; s.remove(); j(); };
    document.head.appendChild(s);
  });
}

let selectedRole = null;
function selectRole(r) {
  selectedRole = r;
  document.querySelectorAll('.role-btn').forEach(b => b.className='role-btn');
  if(r==='senior') document.querySelector('.role-btn:nth-child(1)').className='role-btn sel-senior';
  else document.querySelector('.role-btn:nth-child(2)').className='role-btn sel-junior';
  document.getElementById('seniorForm').style.display = r==='senior'?'block':'none';
  document.getElementById('juniorForm').style.display = r==='junior'?'block':'none';
  document.getElementById('title').textContent = r==='senior'?'เข้าสู่ระบบ — รุ่นพี่':'เข้าสู่ระบบ — รุ่นน้อง';
  document.getElementById('err').className='err';
}

async function doLogin() {
  const u = document.getElementById('l_user').value.trim();
  const p = document.getElementById('l_pass').value;
  if(!u||!p) { showErr('กรุณากรอก username และ password'); return; }
  setLoading(true);
  try {
    const res = await apiCall({action:'login',role:'senior',username:u,password:p});
    if(res.ok) enterApp({role:'senior',username:res.username||u});
    else showErr('Username หรือ Password ไม่ถูกต้อง');
  } catch { showErr('เชื่อมต่อไม่ได้'); }
  setLoading(false);
}

async function doLoginJunior() {
  const p = document.getElementById('l_jpass').value;
  if(!p) { showErr('กรุณากรอกรหัสผ่าน'); return; }
  setLoading(true);
  try {
    const res = await apiCall({action:'login',role:'junior',password:p});
    if(res.ok) enterApp({role:'junior',username:'น้องนักศึกษา'});
    else showErr('รหัสผ่านไม่ถูกต้อง');
  } catch { showErr('เชื่อมต่อไม่ได้'); }
  setLoading(false);
}

function showErr(m) { const e = document.getElementById('err'); e.textContent=m; e.className='err show'; }
function setLoading(on) {
  ['loginBtn'].forEach(id => {
    const b = document.getElementById(id);
    if(b) { b.disabled=on; b.textContent=on?'กำลังตรวจสอบ...':'เข้าสู่ระบบ'; }
  });
}

async function enterApp(s) {
  session = s;
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('appScreen').classList.add('active');
  const b = document.getElementById('badge');
  if(s.role==='senior') { b.className='nav-badge'; b.textContent='รุ่นพี่'; }
  else { b.className='nav-badge'; b.textContent='รุ่นน้อง'; b.style.borderColor='rgba(245,180,65,.4)'; b.style.background='rgba(245,180,65,.15)'; b.style.color='var(--gold)'; }
  document.getElementById('user').textContent = s.username;
  document.getElementById('roBar').style.display = s.role==='junior'?'flex':'none';
  const btn = document.querySelector('nav .btn');
  if(btn) { if(s.role==='senior') btn.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> เพิ่มวิชา'; }
  await loadCourses();
}

function logout() {
  session = null; courses = [];
  document.getElementById('appScreen').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
  ['l_user','l_pass','l_jpass','srch'].forEach(id => document.getElementById(id).value='');
  selectedRole = null;
  document.querySelectorAll('.role-btn').forEach(b => b.className='role-btn');
  document.getElementById('seniorForm').style.display='none';
  document.getElementById('juniorForm').style.display='none';
  document.getElementById('title').textContent='เลือกบทบาทก่อนเข้าสู่ระบบ';
}

async function loadCourses() {
  document.getElementById('main').innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)">กำลังโหลด…</div>`;
  try {
    const res = await apiCall({action:'getCourses'});
    courses = (res.courses||[]).map(c => ({...c,resources:(() => {try{return JSON.parse(c.resources||'[]')}catch{return[]}}())}));
    render();
  } catch {
    document.getElementById('main').innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--muted)">⚠️ โหลดไม่ได้</div>`;
  }
}

function switchTab(y, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active'); activeTab = y; render();
}

function render() {
  const q = document.getElementById('srch').value.toLowerCase();
  let html = '';
  [1,2,3,4].forEach(y => {
    if(activeTab!=='all' && activeTab!==String(y)) return;
    let list = courses.filter(c => String(c.year)===String(y));
    if(q) list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    if(q && !list.length) return;

    html += `<div style="grid-column:1/-1;margin-top:${y===1?0:'1.5rem'}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;padding-bottom:.8rem;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:.8rem">
          <div style="width:40px;height:40px;border-radius:12px;background:rgba(0,82,204,.15);display:flex;align-items:center;justify-content:center;font-size:1.15rem">${YG[y]}</div>
          <div style="font-family:'Noto Serif Thai',serif;font-size:1.2rem;font-weight:700">${YN[y]}</div>
          <div style="font-family:'DM Mono',monospace;font-size:.72rem;color:var(--muted);background:var(--surface2);border:1px solid var(--border);padding:.2rem .7rem;border-radius:99px">${list.length}</div>
        </div>
        ${session?.role==='senior'?`<button class="btn" style="background:transparent;border:1px solid var(--border2);color:var(--muted2);padding:.4rem 1rem;font-size:.85rem" onclick="openAdd('${y}')">+ เพิ่มวิชา</button>`:''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(256px,1fr));gap:1.15rem">`;

    if(!list.length) {
      html += `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--muted)"><div style="font-size:1.8rem;margin-bottom:.5rem">🧫</div><p>ยังไม่มีวิชาในชั้นปีนี้</p></div>`;
    } else {
      list.forEach(c => {
        html += `<div class="card" onclick="openDetail('${c.id}')">
          <div class="card-top">
            <div class="card-icon" style="background:rgba(0,82,204,.15)">${c.icon||'📘'}</div>
            <div class="card-code">${c.code}</div>
          </div>
          <div class="card-name">${c.name}</div>
          ${c.desc?`<div class="card-desc">${c.desc}</div>`:''}
          <div class="card-footer">
            <div class="pill">📁 ${(c.resources||[]).length}</div>
            <div class="pill">⭐ ${c.credits}</div>
          </div>
        </div>`;
      });
    }
    html += `</div></div>`;
  });

  if(!html) html = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--muted)"><div style="font-size:2rem;margin-bottom:.5rem">🔍</div><p>ไม่พบวิชาที่ค้นหา</p></div>`;
  document.getElementById('main').innerHTML = html;
}

function buildEmoji() {
  document.getElementById('emojiRow').innerHTML = EMOJIS.map(e => 
    `<button style="width:36px;height:36px;border-radius:9px;background:var(--surface2);border:1.5px solid var(--border);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;${e===selEmoji?'border-color:var(--accent2);background:rgba(0,82,204,.18)':''}" class="${e===selEmoji?'sel':''}" onclick="pickE('${e}',this)">${e}</button>`
  ).join('');
}
function pickE(e, el) {
  selEmoji = e;
  document.querySelectorAll('#emojiRow button').forEach(b => b.className='');
  el.className='sel';
}

function openAdd(year='1') {
  document.getElementById('mTag').textContent='NEW COURSE';
  document.getElementById('mTitle').textContent='เพิ่มวิชาใหม่';
  document.getElementById('f_id').value='';
  ['f_code','f_name','f_desc'].forEach(id => document.getElementById(id).value='');
  document.getElementById('f_year').value=year;
  document.getElementById('f_credits').value=3;
  selEmoji='⚗️'; buildEmoji();
  open2('addOverlay');
}

function openEdit(id) {
  const c = courses.find(x => x.id===id); if(!c) return;
  document.getElementById('mTag').textContent='EDIT COURSE';
  document.getElementById('mTitle').textContent='แก้ไขวิชา';
  document.getElementById('f_id').value=c.id;
  document.getElementById('f_code').value=c.code;
  document.getElementById('f_name').value=c.name;
  document.getElementById('f_desc').value=c.desc||'';
  document.getElementById('f_year').value=c.year;
  document.getElementById('f_credits').value=c.credits;
  selEmoji=c.icon||'⚗️'; buildEmoji();
  close2('detailOverlay'); open2('addOverlay');
}

async function saveCourse() {
  const code = document.getElementById('f_code').value.trim();
  const name = document.getElementById('f_name').value.trim();
  if(!code||!name) { toast('⚠️ กรุณากรอกรหัสและชื่อวิชา'); return; }
  const eid = document.getElementById('f_id').value;
  const id = eid || 'c_'+Date.now();
  const existing = courses.find(c => c.id===eid);
  const course = {id,code,name,desc:document.getElementById('f_desc').value.trim(),year:document.getElementById('f_year').value,credits:document.getElementById('f_credits').value,icon:selEmoji,resources:JSON.stringify(existing?.resources||[])};
  try {
    await apiCall({action:'saveCourse',course:JSON.stringify(course)});
    await loadCourses();
    close2('addOverlay');
    toast(eid?'✅ แก้ไขแล้ว':'✅ เพิ่มวิชาแล้ว');
  } catch { toast('❌ บันทึกไม่สำเร็จ'); }
}

function openDetail(id) {
  const c = courses.find(x => x.id===id); if(!c) return;
  renderDetail(c); open2('detailOverlay');
}

function renderDetail(c) {
  const isSr = session?.role==='senior';
  const res = c.resources||[];
  const resHtml = res.length
    ? res.map(r => `
      <div class="res-item">
        <a class="res-a" href="${r.url||'#'}" target="_blank" rel="noopener">
          <span class="res-icon">${TI[r.type]||'📎'}</span>
          <span class="res-name">${r.name}</span>
          <span class="res-type">${r.type}</span>
        </a>
        ${isSr?`<button class="res-del" onclick="delRes('${c.id}','${r.id}')">🗑</button>`:''}
      </div>`).join('')
    : `<div class="empty" style="padding:1.2rem 0"><div class="empty-icon">📭</div><p>${isSr?'ยังไม่มีไฟล์':'ยังไม่มีไฟล์'}</p></div>`;

  const addRow = isSr?`
    <div class="add-row">
      <input class="fi" id="r_name" placeholder="ชื่อไฟล์"/>
      <input class="fi" id="r_url" placeholder="URL"/>
      <select class="fi" id="r_type">
        <option>PDF</option><option>SLIDE</option><option>EXERCISE</option>
        <option>LINK</option><option>VIDEO</option><option>NOTE</option>
      </select>
      <button class="btn btn-primary" style="padding:.42rem .85rem;font-size:.82rem" onclick="addRes('${c.id}')">+ เพิ่ม</button>
    </div>`:'';

  const actions = isSr?`
    <button class="btn" style="background:transparent;border:1px solid var(--border2);color:var(--muted2);padding:.4rem .8rem;font-size:.82rem" onclick="openEdit('${c.id}')">✏️ แก้ไข</button>
    <button class="btn" style="background:transparent;border:1px solid #2a1818;color:#d66262;padding:.4rem .8rem;font-size:.82rem" onclick="delCourse('${c.id}')">🗑 ลบ</button>`:'';

  document.getElementById('detailInner').innerHTML = `
    <div class="dtop" style="background:linear-gradient(135deg,rgba(0,82,204,.08),transparent)">
      <div class="dinfo">
        <div class="d-icon">${c.icon||'📘'}</div>
        <div class="d-code">${c.code} · ปี ${c.year} · ${c.credits} cr.</div>
        <div class="d-title">${c.name}</div>
        ${c.desc?`<div class="d-desc">${c.desc}</div>`:''}
      </div>
      <button class="modal-close" onclick="close2('detailOverlay')">✕</button>
    </div>
    <div class="dsec">
      <div class="dsec-label">ไฟล์และลิงก์</div>
      <div class="res-list">${resHtml}</div>
      ${addRow}
    </div>
    <div class="modal-foot" style="justify-content:space-between">
      <div style="display:flex;gap:.55rem">${actions}</div>
      <button class="btn" style="background:transparent;border:1px solid var(--border2);color:var(--muted2);padding:.4rem .8rem;font-size:.82rem" onclick="close2('detailOverlay')">ปิด</button>
    </div>`;
}

async function addRes(cid) {
  const name = document.getElementById('r_name')?.value.trim();
  const url = document.getElementById('r_url')?.value.trim()||'#';
  const type = document.getElementById('r_type')?.value;
  if(!name) { toast('⚠️ กรุณากรอกชื่อไฟล์'); return; }
  const c = courses.find(x => x.id===cid);
  c.resources.push({id:'r_'+Date.now(),name,url,type});
  try {
    await apiCall({action:'saveCourse',course:JSON.stringify({...c,resources:JSON.stringify(c.resources)})});
    renderDetail(c); render(); toast('✅ เพิ่มไฟล์แล้ว');
  } catch { toast('❌ บันทึกไม่สำเร็จ'); c.resources.pop(); renderDetail(c); }
}

async function delRes(cid, rid) {
  const c = courses.find(x => x.id===cid);
  const prev = [...c.resources];
  c.resources = c.resources.filter(r => r.id!==rid);
  try {
    await apiCall({action:'saveCourse',course:JSON.stringify({...c,resources:JSON.stringify(c.resources)})});
    renderDetail(c); render(); toast('🗑 ลบไฟล์แล้ว');
  } catch { toast('❌ ลบไม่สำเร็จ'); c.resources = prev; renderDetail(c); }
}

async function delCourse(id) {
  if(!confirm('ต้องการลบวิชานี้?')) return;
  close2('detailOverlay');
  try {
    await apiCall({action:'deleteCourse',id});
    await loadCourses();
    toast('🗑 ลบวิชาแล้ว');
  } catch { toast('❌ ลบไม่สำเร็จ'); }
}

function open2(id) { document.getElementById(id).classList.add('open'); }
function close2(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', function(e) {
  if (e.target === o) {
    close2(o.id);
  }
}));

let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
  }, 2500);
}
