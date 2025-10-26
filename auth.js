// auth.js
import { CONFIG } from './config.js';

const state = { sessionKey: null, user: null };
let _initDone = false;
let _initRunning = false;

// ให้ api.js เรียกใช้ได้
export function getSession() {
  return state;
}

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

// ---------- init LIFF ให้ทนมือทนเท้า + รองรับ external browser ----------
async function initLiffWithRetry(maxRetry = 3) {
  if (_initDone) return;
  if (_initRunning) {
    while (_initRunning) await new Promise(r => setTimeout(r, 100));
    return;
  }
  _initRunning = true;
  const opts = { liffId: CONFIG.LIFF_ID, withLoginOnExternalBrowser: true };

  for (let i = 0; i < maxRetry; i++) {
    try {
      console.debug('[LIFF] init try', i + 1, opts);
      await liff.init(opts);
      _initDone = true;
      console.debug('[LIFF] init OK, inClient=', liff.isInClient(), 'loggedIn=', liff.isLoggedIn());
      break;
    } catch (e) {
      console.warn('[LIFF] init fail', e);
      await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
  }
  _initRunning = false;
  if (!_initDone) throw new Error('LIFF init failed after retries');
}

async function ensureLogin() {
  if (!liff.isLoggedIn()) {
    const url = new URL(window.location.href);
    url.searchParams.set('_ts', Date.now().toString()); // กัน cache redirect แปลก ๆ
    liff.login({ redirectUri: url.toString() });
    return false; // จะถูก redirect ออกไปแล้ว
  }
  return true;
}

async function getFreshProfile() {
  try {
    const token = liff.getAccessToken();
    if (!token) {
      await liff.logout();
      const ok = await ensureLogin();
      if (!ok) return null;
    }
    return await liff.getProfile();
  } catch (e) {
    try { await liff.logout(); } catch {}
    await ensureLogin();
    return null;
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
      renderUs
