const API = 'URL_ของ_GOOGLE_APPS_SCRIPT_ของคุณ'; // *** อย่าลืมเปลี่ยน URL ***
let sessionToken = localStorage.getItem('chemhub_token') || null;
let currentSid = localStorage.getItem('chemhub_sid') || null;
let courses = [];

function apiCall(p) {
  return new Promise((r, j) => {
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    const qs = Object.entries({...p, callback: cb}).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const s = document.createElement('script');
    s.src = API + '?' + qs;
    window[cb] = (d) => { delete window[cb]; s.remove(); r(d); };
    s.onerror = () => { delete window[cb]; s.remove(); j(); };
    document.head.appendChild(s);
  });
}

// 1. ระบบ Login (แบบ Single Session)
async function doLogin() {
    const sid = document.getElementById('l_sid').value.trim();
    const house = document.getElementById('l_house').value.trim();
    const errEl = document.getElementById('err');
    
    if(!sid || !house) {
        errEl.textContent = 'กรุณากรอกรหัสนักศึกษาและสายรหัส';
        errEl.className = 'err show';
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'กำลังตรวจสอบ...';

    // สร้าง Token ใหม่เพื่อใช้ยืนยันเครื่องนี้
    const newToken = 'tk_' + Math.random().toString(36).substring(2, 15);

    try {
        const res = await apiCall({
            action: 'loginStudent',
            sid: sid,
            house: house,
            token: newToken
        });

        if(res.ok) {
            sessionToken = newToken;
            currentSid = sid;
            localStorage.setItem('chemhub_token', newToken);
            localStorage.setItem('chemhub_sid', sid);
            
            enterApp(sid, house);
            startSessionCheck(); // เริ่มระบบเช็คเครื่องซ้อน
        } else {
            errEl.textContent = res.message || 'ข้อมูลไม่ถูกต้อง';
            errEl.className = 'err show';
            loginBtn.disabled = false;
            loginBtn.textContent = 'เข้าใช้งาน';
        }
    } catch(e) {
        errEl.textContent = 'เชื่อมต่อฐานข้อมูลไม่ได้';
        errEl.className = 'err show';
        loginBtn.disabled = false;
        loginBtn.textContent = 'เข้าใช้งาน';
    }
}

// 2. ระบบตรวจสอบการ Login ซ้อน
function startSessionCheck() {
    // ตรวจสอบทุกๆ 1 นาที (หรือปรับตามความเหมาะสม)
    setInterval(async () => {
        if(!sessionToken || !currentSid) return;
        
        try {
            const res = await apiCall({
                action: 'checkSession',
                sid: currentSid,
                token: sessionToken
            });
            
            if(!res.valid) {
                alert('บัญชีนี้ถูกเข้าใช้งานจากเครื่องอื่น ระบบจะตัดการเชื่อมต่อ');
                logout();
            }
        } catch(e) { console.warn('Session check error'); }
    }, 60000);
}

function enterApp(sid, house) {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');
    document.getElementById('user').textContent = `รหัส: ${sid} (${house})`;
    loadCourses();
}

function logout() {
    localStorage.clear();
    sessionToken = null;
    currentSid = null;
    location.reload();
}

// --- ฟังก์ชันจัดการข้อมูล (เหมือนเวอร์ชันก่อนหน้า) ---

async function loadCourses() {
    const main = document.getElementById('main');
    main.innerHTML = '<div style="grid-column:1/-1;text-align:center">กำลังโหลดข้อมูล...</div>';
    try {
        const res = await apiCall({ action: 'getCourses' });
        courses = res.courses || [];
        render();
    } catch(e) { main.innerHTML = 'โหลดข้อมูลไม่สำเร็จ'; }
}

function render() {
    const q = document.getElementById('srch').value.toLowerCase();
    const main = document.getElementById('main');
    let filtered = courses;
    
    if(q) {
        filtered = courses.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }

    if(filtered.length === 0) {
        main.innerHTML = '<div style="grid-column:1/-1;text-align:center">ไม่พบข้อมูล</div>';
        return;
    }

    main.innerHTML = filtered.map(c => `
        <div class="card" onclick="alert('แสดงรายละเอียดวิชา: ${c.name}')">
            <div style="font-size:0.7rem; color:var(--muted)">${c.code}</div>
            <div style="font-weight:700; margin:0.5rem 0">${c.name}</div>
            <div style="font-size:0.8rem; color:var(--muted2)">ชั้นปีที่ ${c.year} | ${c.credits} หน่วยกิต</div>
        </div>
    `).join('');
}

function switchTab(y, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    // เพิ่ม logic กรองปีที่นี่ได้ตามต้องการ
}
