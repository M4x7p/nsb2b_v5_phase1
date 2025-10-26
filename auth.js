// auth.js (ปรับเฉพาะส่วน auth; ใช้ร่วมกับ CONFIG เดิมของคุณ)
import { CONFIG } from './config.js';

const state = { sessionKey: null, user: null };
let _initDone = false;
let _initRunning = false;

function saveSession(sessionKey, user) {
  state.sessionKey = sessionKey;
  state.user = user;
  try { sessionStorage.setItem('nsb2b.session', JSON.stringify({ sessionKey, user })); } catch {}
}

function getInviteCodeFromURL() {
  try {
    const usp = new URLSearchParams(location.search);
    return (usp.get('invite') || '').trim();
  } catch { return ''; }
}

function renderUser(user) {
  const btnLogin   = document.getElementById('btnLogin');
  const userCard   = document.getElementById('userCard');
  const userAvatar = document.getElementById('userAvatar');
  const userName   = document.getElementById('userName');
  const userMeta   = document.getElementById('userMeta');
  if (!user) return;
  btnLogin?.classList.add('hidden');
  userCard?.classList.remove('hidden');
  if (userAvatar) userAvatar.src = user.pictureUrl || '';
  if (userName)   userName.textContent = user.displayName || 'Unknown';
  if (userMeta)   userMeta.textContent = `team ${user.team || '-'} • ${user.isAdmin ? 'Admin' : 'Member'}`;
}

// ---------- LIFF init แบบทนมือทนเท้า + รองรับ external browser ----------
async function initLiffWithRetry(maxRetry = 3) {
  if (_initDone) return;
  if (_initRunning) {
    // กันคลิกซ้ำ: รอจน init ชุดแรกเสร็จ
    while (_initRunning) await new Promise(r => setTimeout(r, 100));
    return;
  }
  _initRunning = true;
  const opts = { liffId: CONFIG.LIFF_ID, withLoginOnExternalBrowser: true };

  for (let i = 0; i < maxRetry; i++) {
    try {
      console.debug('[LIFF] init try', i+1, opts);
      await liff.init(opts);
      _initDone = true;
      console.debug('[LIFF] init OK, inClient=', liff.isInClient(), 'loggedIn=', liff.isLoggedIn());
      break;
    } catch (e) {
      console.warn('[LIFF] init fail', e);
      await new Promise(r => setTimeout(r, 400 * (i+1)));
    }
  }
  _initRunning = false;
  if (!_initDone) throw new Error('LIFF init failed after retries');
}

// ---------- บังคับให้ได้สถานะล็อกอิน ----------
async function ensureLogin() {
  if (!liff.isLoggedIn()) {
    const url = new URL(window.location.href);
    // เพิ่ม nonce กัน cache redirect แปลก ๆ
    url.searchParams.set('_ts', Date.now().toString());
    console.debug('[LIFF] not logged in → redirect login to', url.toString());
    liff.login({ redirectUri: url.toString() });
    return false; // โดน redirect ออกไปแล้ว
  }
  return true;
}

// ---------- ดึงโปรไฟล์ (รีเฟรชถ้า token เน่า) ----------
async function getFreshProfile() {
  try {
    const token = liff.getAccessToken();
    if (!token) {
      console.warn('[LIFF] no access token -> re-login');
      await liff.logout();
      const ok = await ensureLogin();
      if (!ok) return null; // จะ redirect
    }
    const p = await liff.getProfile();
    console.debug('[LIFF] profile', p);
    return p;
  } catch (e) {
    console.warn('[LIFF] getProfile error -> force relogin', e);
    try { await liff.logout(); } catch {}
    const ok = await ensureLogin();
    return null; // ถ้า ok=false จะ redirect ออกไปแล้ว
  }
}

export async function initAuth() {
  const btnLogin   = document.getElementById('btnLogin');
  const btnLogout  = document.getElementById('btnLogout');
  const authNotice = document.getElementById('authNotice');
  const formSection= document.getElementById('formSection');
  const userCard   = document.getElementById('userCard');

  // Restore session
  const saved = sessionStorage.getItem('nsb2b.session');
  if (saved) {
    try {
      const s = JSON.parse(saved);
      state.sessionKey = s.sessionKey;
      state.user = s.user;
      renderUser(s.user);
      authNotice?.classList.add('hidden');
      formSection?.classList.remove('hidden');
    } catch {}
  }

  // พยายาม init ตั้งแต่โหลดหน้า เพื่อให้ login เร็วขึ้น
  try { 
    if (!CONFIG.LIFF_ID || CONFIG.LIFF_ID.includes('YOUR_')) throw new Error('LIFF_ID not set');
    await initLiffWithRetry();
  } catch (e) {
    console.error('[LIFF] early init error', e);
  }

  // ---- ปุ่มล็อกอิน ----
  btnLogin?.addEventListener('click', async () => {
    try {
      await initLiffWithRetry();

      // ถ้ายังไม่ล็อกอิน ระบบจะ redirect ออกไปและกลับมาใหม่
      const stay = await ensureLogin();
      if (!stay) return;

      const profile = await getFreshProfile();
      if (!profile) return; // กรณีถูก redirect เพื่อ re-login

      const { userId, displayName, pictureUrl } = profile;
      const inviteCode = getInviteCodeFromURL();

      const res = await fetch(CONFIG.AUTH_FLOW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          displayName,
          pictureUrl: pictureUrl || '',
          origin: location.origin,
          inviteCode
        })
      });

      const data = await res.json().catch(() => ({}));
      console.debug('[AUTH] response', res.status, data);
      if (!res.ok || !data.ok) {
        // ถ้าตอบ 401 เพราะ invite ไม่ผ่าน และเราไม่ได้กดจากลิงก์ invite: แจ้งให้กดผ่านลิงก์เชิญ
        const msg = data?.message || 'ไม่ผ่านการยืนยันตัวตน';
        throw new Error(msg);
      }

      saveSession(data.sessionKey, {
        userId, displayName, pictureUrl: pictureUrl || '',
        team: data.team, isAdmin: !!data.isAdmin, expiresAt: data.expiresAt
      });
      renderUser(state.user);
      authNotice?.classList.add('hidden');
      formSection?.classList.remove('hidden');

      // เคลียร์ ?invite= หลัง “สำเร็จ”
      try {
        const url = new URL(location.href);
        url.searchParams.delete('invite');
        url.searchParams.delete('_ts');
        history.replaceState(null, '', url.toString());
      } catch {}

    } catch (err) {
      console.error('[Login failed]', err);
      // สำรอง: เคลียร์ session ฝั่งเราให้สะอาดก่อนลองใหม่
      try { sessionStorage.removeItem('nsb2b.session'); } catch {}
      alert('ล็อกอินล้มเหลว: ' + (err?.message || err));
    }
  });

  // ---- ปุ่มล็อกเอาต์ ----
  btnLogout?.addEventListener('click', () => {
    try { sessionStorage.removeItem('nsb2b.session'); } catch {}
    state.sessionKey = null;
    state.user = null;
    userCard?.classList.add('hidden');
    document.getElementById('btnLogin')?.classList.remove('hidden');
    authNotice?.classList.remove('hidden');
    formSection?.classList.add('hidden');
    try { if (liff.isLoggedIn()) liff.logout(); } catch {}
  });
}
