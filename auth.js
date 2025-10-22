import { CONFIG } from './config.js';

const state = {
  sessionKey: null,
  user: null
};

export function getSession() {
  return state;
}
export async function initAuth() {
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');
  const userCard = document.getElementById('userCard');
  const authNotice = document.getElementById('authNotice');
  const formSection = document.getElementById('formSection');

  // Restore session
  const saved = sessionStorage.getItem('nsb2b.session');
  if (saved) {
    try {
      const s = JSON.parse(saved);
      state.sessionKey = s.sessionKey;
      state.user = s.user;
      renderUser(s.user);
      authNotice.classList.add('hidden');
      formSection.classList.remove('hidden');
    } catch(e){}
  }

// แทนที่ใน btnLogin.addEventListener('click', ...) ทั้งบล็อก
btnLogin?.addEventListener('click', async () => {
  try {
    if (!CONFIG.LIFF_ID || CONFIG.LIFF_ID.includes('YOUR_')) {
      alert('ยังไม่ได้ตั้งค่า LIFF_ID ใน config.js');
      return;
    }

    // 1) init เสมอ (ทั้งใน LINE และนอก LINE)
    await liff.init({ liffId: CONFIG.LIFF_ID });

    // 2) ถ้ายังไม่ล็อกอิน ให้ redirect เข้าหน้า login ของ LINE
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
      return; // จะถูก redirect อัตโนมัติ
    }

    // 3) ได้โปรไฟล์แล้วค่อยยิง Auth Flow
    const profile = await liff.getProfile();
    const { userId, displayName, pictureUrl } = profile;

    const res = await fetch(CONFIG.AUTH_FLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId, displayName, pictureUrl: pictureUrl || '', origin: location.origin
      })
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data?.message || 'ไม่ผ่านการยืนยันตัวตน');
    }

    state.sessionKey = data.sessionKey;
    state.user = {
      userId, displayName, pictureUrl: pictureUrl || '',
      team: data.team, isAdmin: !!data.isAdmin, expiresAt: data.expiresAt
    };
    sessionStorage.setItem('nsb2b.session', JSON.stringify({
      sessionKey: state.sessionKey, user: state.user
    }));

    renderUser(state.user);
    authNotice.classList.add('hidden');
    formSection.classList.remove('hidden');
  } catch (err) {
    console.error('[LIFF login error]', err);
    alert('ล็อกอินล้มเหลว: ' + (err?.message || err));
  }
});
  btnLogout?.addEventListener('click', () => {
    sessionStorage.removeItem('nsb2b.session');
    state.sessionKey = null;
    state.user = null;
    document.getElementById('userCard').classList.add('hidden');
    document.getElementById('btnLogin').classList.remove('hidden');
    document.getElementById('authNotice').classList.remove('hidden');
    document.getElementById('formSection').classList.add('hidden');
    try {
      if (liff.isLoggedIn()) liff.logout();
    } catch (e) {}
  });

  function renderUser(user){
    const btnLogin = document.getElementById('btnLogin');
    const userCard = document.getElementById('userCard');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userMeta = document.getElementById('userMeta');

    if (!user) return;
    btnLogin.classList.add('hidden');
    userCard.classList.remove('hidden');
    userAvatar.src = user.pictureUrl || '';
    userName.textContent = user.displayName || 'Unknown';
    userMeta.textContent = `team ${user.team || '-'} • ${user.isAdmin ? 'Admin' : 'Member'}`;
  }
}
