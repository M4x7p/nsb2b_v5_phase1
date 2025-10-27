// auth.js — ล็อกอินลื่น, รองรับลิงก์เชิญ, ไม่ต้องกดซ้ำ
import { CONFIG } from './config.js';

const state = {
  sessionKey: null,
  user: null,
};
let authInFlight = false; // กันกดซ้ำ/ยิงซ้ำ

export function getSession() {
  return state;
}

// ---- ดึง inviteCode จากพารามิเตอร์ URL ----
function getInviteCodeFromURL() {
  try {
    const usp = new URLSearchParams(location.search);
    return (usp.get('invite') || '').trim();
  } catch {
    return '';
  }
}

// ---- เก็บ/โหลด session ----
function persistSession(sessionKey, user) {
  state.sessionKey = sessionKey;
  state.user = user;
  try {
    sessionStorage.setItem('nsb2b.session', JSON.stringify({ sessionKey, user }));
  } catch {}
}
function restoreSession() {
  try {
    const raw = sessionStorage.getItem('nsb2b.session');
    if (!raw) return null;
    const data = JSON.parse(raw);
    state.sessionKey = data.sessionKey || null;
    state.user = data.user || null;
    return data;
  } catch {
    return null;
  }
}

// ---- แสดงผลผู้ใช้บนหน้า ----
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

// ---- เรียก AuthGate (แนบ inviteCode ทุกครั้ง) ----
async function callAuthGate(profile) {
  const inviteCode = getInviteCodeFromURL();
  const payload = {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl || '',
    origin: location.origin,
    inviteCode, // สำคัญ: ให้ Flow เช็คเชิญเมื่อยังไม่มีพนักงาน
  };

  // debug เผื่อใช้
  console.debug('[AuthGate] payload', payload);

  const res = await fetch(CONFIG.AUTH_FLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  console.debug('[AuthGate] response', res.status, data);

  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || `AuthGate ล้มเหลว (${res.status})`);
  }

  // เก็บ session
  persistSession(data.sessionKey, {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl || '',
    team: data.team,
    isAdmin: !!data.isAdmin,
    expiresAt: data.expiresAt,
  });

  // ลบ ?invite= ออกจาก URL หลังสำเร็จ (กันสับสนรอบหน้า)
  try {
    const url = new URL(location.href);
    url.searchParams.delete('invite');
    history.replaceState(null, '', url.toString());
  } catch {}

  return data;
}

// ---- flow หลักตอนคลิกปุ่ม หรือ auto-continue ----
async function doLoginFlow() {
  if (authInFlight) return;
  authInFlight = true;

  try {
    if (!CONFIG.LIFF_ID || CONFIG.LIFF_ID.includes('YOUR_')) {
      throw new Error('ยังไม่ได้ตั้งค่า LIFF_ID ใน config.js');
    }

    // 1) init LIFF
    await liff.init({ liffId: CONFIG.LIFF_ID });

    // 2) ถ้ายังไม่ล็อกอิน ให้ส่งไปหน้า LINE แล้วจบ (จะ redirect กลับหน้าเดิม)
    if (!liff.isLoggedIn()) {
      // รักษา query (รวมทั้ง ?invite=) ไว้ด้วย
      liff.login({ redirectUri: location.href });
      return;
    }

    // 3) ได้โปรไฟล์แล้ว ยิง AuthGate
    const profile = await liff.getProfile();
    await callAuthGate(profile);
    renderUser(state.user);
  } catch (err) {
    console.error('[LIFF login error]', err);
    alert('ล็อกอินล้มเหลว: ' + (err?.message || err));
  } finally {
    authInFlight = false;
  }
}

export async function initAuth() {
  const btnLogin   = document.getElementById('btnLogin');
  const btnLogout  = document.getElementById('btnLogout');

  // กู้ session ถ้ามี
  const restored = restoreSession();
  if (restored?.user) {
    renderUser(restored.user);
  }

  // Auto-continue: ถ้ากลับมาจาก LINE แล้ว ให้ยิง AuthGate ต่อเอง
  try {
    if (!CONFIG.LIFF_ID || CONFIG.LIFF_ID.includes('YOUR_')) {
      throw new Error('ยังไม่ได้ตั้งค่า LIFF_ID ใน config.js');
    }
    await liff.init({ liffId: CONFIG.LIFF_ID });

    // กรณียังไม่มี session (ครั้งแรกหลัง redirect) แต่ LINE login แล้ว
    if (liff.isLoggedIn() && !state.sessionKey) {
      const profile = await liff.getProfile();
      await callAuthGate(profile);
      renderUser(state.user);
    }
  } catch (e) {
    // เงียบไว้ก่อน ให้ผู้ใช้กดปุ่มแทน
    console.debug('[LIFF init lazy]', e?.message || e);
  }

  // ปุ่มกดจริง
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
