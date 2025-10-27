// auth.js — เสถียรขึ้น: รอ liff.ready, auto-continue, แนบ invite ทุกครั้ง
import { CONFIG } from './config.js';

const state = { sessionKey: null, user: null };
let authInFlight = false;

export function getSession() {
  return state;
}

// -------- utils --------
function getInviteCodeFromURL() {
  try {
    const usp = new URLSearchParams(location.search);
    return (usp.get('invite') || '').trim();
  } catch { return ''; }
}

function persistSession(sessionKey, user) {
  state.sessionKey = sessionKey;
  state.user = user;
  try { sessionStorage.setItem('nsb2b.session', JSON.stringify({ sessionKey, user })); } catch {}
}

function restoreSession() {
  try {
    const raw = sessionStorage.getItem('nsb2b.session');
    if (!raw) return null;
    const data = JSON.parse(raw);
    state.sessionKey = data.sessionKey || null;
    state.user = data.user || null;
    return data;
  } catch { return null; }
}

function renderUser(user) {
  const btnLogin   = document.getElementById('btnLogin');
  const userCard   = document.getElementById('userCard');
  const userAvatar = document.getElementById('userAvatar');
  const userName   = document.getElementById('userName');
  const userMeta   = document.getElementById('userMeta');
  const authNotice = document.getElementById('authNotice');
  const formSection= document.getElementById('formSection');

  if (!user) return;
  btnLogin?.classList.add('hidden');
  userCard?.classList.remove('hidden');
  authNotice?.classList.add('hidden');
  formSection?.classList.remove('hidden');
  if (userAvatar) userAvatar.src = user.pictureUrl || '';
  if (userName)   userName.textContent = user.displayName || 'Unknown';
  if (userMeta)   userMeta.textContent = `team ${user.team || '-'} • ${user.isAdmin ? 'Admin' : 'Member'}`;
}

// -------- คุยกับ AuthGate (แนบ invite ทุกครั้ง) --------
async function callAuthGate(profile) {
  const inviteCode = getInviteCodeFromURL();
  const payload = {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl || '',
    origin: location.origin,
    inviteCode,
  };

  const res = await fetch(CONFIG.AUTH_FLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || `AuthGate ล้มเหลว (${res.status})`);
  }

  persistSession(data.sessionKey, {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl || '',
    team: data.team,
    isAdmin: !!data.isAdmin,
    expiresAt: data.expiresAt,
  });

  // ลบ ?invite= ออกหลังสำเร็จ
  try {
    const url = new URL(location.href);
    url.searchParams.delete('invite');
    history.replaceState(null, '', url.toString());
  } catch {}

  return data;
}

// -------- main login flow --------
async function doLoginFlow() {
  if (authInFlight) return;
  authInFlight = true;
  try {
    if (!CONFIG.LIFF_ID || CONFIG.LIFF_ID.includes('YOUR_')) {
      throw new Error('ยังไม่ได้ตั้งค่า LIFF_ID ใน config.js');
    }

    await liff.init({ liffId: CONFIG.LIFF_ID });
    // ให้ SDK พร้อมจริง ๆ
    if (liff.ready && typeof liff.ready.then === 'function') {
      try { await liff.ready; } catch {}
    }

    if (!liff.isLoggedIn()) {
      // เก็บ query (รวม invite) ไว้ครบ
      liff.login({ redirectUri: location.href });
      return;
    }

    const profile = await liff.getProfile();
    await callAuthGate(profile);
    renderUser(state.user);

  } catch (err) {
    // ถ้าเครือข่าย/LIFF authorize หลุด จะโผล่ที่นี่บ่อย
    console.error('[LIFF login error]', err);
    alert('ล็อกอินล้มเหลว: ' + (err?.message || err));
  } finally {
    authInFlight = false;
  }
}

export async function initAuth() {
  const btnLogin   = document.getElementById('btnLogin');
  const btnLogout  = document.getElementById('btnLogout');

  // restore session
  const restored = restoreSession();
  if (restored?.user) {
    renderUser(restored.user);
  }

  // init + auto-continue หลัง redirect
  try {
    if (!CONFIG.LIFF_ID || CONFIG.LIFF_ID.includes('YOUR_')) {
      throw new Error('ยังไม่ได้ตั้งค่า LIFF_ID ใน config.js');
    }
    await liff.init({ liffId: CONFIG.LIFF_ID });
    if (liff.ready && typeof liff.ready.then === 'function') {
      try { await liff.ready; } catch {}
    }

    if (liff.isLoggedIn() && !state.sessionKey) {
      const profile = await liff.getProfile();
      await callAuthGate(profile);
      renderUser(state.user);
    }
  } catch (e) {
    // ให้ผู้ใช้กดปุ่มเองเมื่อ init ไม่สำเร็จ
    console.debug('[LIFF init lazy]', e?.message || e);
  }

  btnLogin?.addEventListener('click', doLoginFlow);

  btnLogout?.addEventListener('click', () => {
    sessionStorage.removeItem('nsb2b.session');
    state.sessionKey = null;
    state.user = null;

    document.getElementById('userCard')?.classList.add('hidden');
    document.getElementById('btnLogin')?.classList.remove('hidden');
    document.getElementById('authNotice')?.classList.remove('hidden');
    document.getElementById('formSection')?.classList.add('hidden');

    try { if (liff.isLoggedIn()) liff.logout(); } catch {}
  });
}
