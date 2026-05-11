const API = 'https://script.google.com/macros/s/AKfycbyM6G8tEILpPi9E3FP-Uzh1HIoD20L6JSKu4TIWY4e3SwG-itvQJvqgf-rpJodzFQRd/exec';
let session = JSON.parse(localStorage.getItem('chem_session')) || null;
let courses = [];

// เช็คว่าถ้าเคย Login แล้วให้เข้าแอปเลย
if(session) {
    enterApp(session.sid, session.role, session.house);
    startSessionCheck();
}

async function doLogin() {
    const sid = document.getElementById('l_sid').value.trim();
    const house = document.getElementById('l_house').value.trim();
    const newToken = 'tk_' + Date.now();

    const res = await apiCall({ action: 'loginStudent', sid, house, token: newToken });
    
    if(res.ok) {
        session = { sid, role: res.role, house, token: newToken };
        localStorage.setItem('chem_session', JSON.stringify(session));
        enterApp(sid, res.role, house);
        startSessionCheck();
    } else {
        document.getElementById('err').textContent = res.message;
        document.getElementById('err').style.display = 'block';
    }
}

function enterApp(sid, role, house) {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');
    document.getElementById('userInfo').textContent = sid;
    
    // ตั้งค่าหน้าตาตาม Role
    const badge = document.getElementById('roleBadge');
    badge.textContent = role === 'senior' ? 'รุ่นพี่ (Admin)' : 'รุ่นน้อง (View Only)';
    badge.className = 'badge ' + role;

    // ถ้าเป็นรุ่นพี่ ให้แสดงปุ่มเพิ่มวิชา
    if(role === 'senior') {
        document.getElementById('addBtn').style.display = 'block';
    }

    loadCourses();
}

async function loadCourses() {
    const res = await apiCall({ action: 'getCourses' });
    courses = res.courses || [];
    render();
}

function render() {
    const q = document.getElementById('srch').value.toLowerCase();
    const main = document.getElementById('main');
    
    const filtered = courses.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));

    main.innerHTML = filtered.map(c => `
        <div class="card" onclick="openDetail('${c.id}')">
            <div class="card-code">${c.code}</div>
            <div class="card-name">${c.name}</div>
            <div class="card-meta">ปี ${c.year} | สิทธิ์: ${session.role}</div>
        </div>
    `).join('');
}

function openDetail(id) {
    const c = courses.find(x => x.id === id);
    const isSenior = session.role === 'senior';
    
    document.getElementById('detailInner').innerHTML = `
        <h2>${c.name} (${c.code})</h2>
        <p>${c.desc || 'ไม่มีรายละเอียด'}</p>
        <hr>
        ${isSenior ? `<button class="btn btn-primary" onclick="editCourse('${c.id}')">แก้ไขวิชา</button>` : '<p><i>* คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้</i></p>'}
        <button class="btn" onclick="closeModal('detailOverlay')">ปิด</button>
    `;
    document.getElementById('detailOverlay').classList.add('open');
}

// ระบบป้องกัน Login ซ้อน
function startSessionCheck() {
    setInterval(async () => {
        const res = await apiCall({ action: 'checkSession', sid: session.sid, token: session.token });
        if(!res.valid) {
            alert('มีการเข้าสู่ระบบจากเครื่องอื่น!');
            logout();
        }
    }, 30000);
}

function logout() {
    localStorage.clear();
    location.reload();
}

// ฟังก์ชันเสริม (apiCall, closeModal ฯลฯ เขียนเหมือนเดิม)
function apiCall(p) {
    return new Promise((r) => {
        const cb = 'cb_' + Math.random().toString(36).slice(2);
        const qs = Object.entries({...p, callback: cb}).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
        const s = document.createElement('script');
        s.src = API + '?' + qs;
        window[cb] = (d) => { delete window[cb]; s.remove(); r(d); };
        document.head.appendChild(s);
    });
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openAdd() { document.getElementById('addOverlay').classList.add('open'); }
