// auth.js — แนบ inviteCode อัตโนมัติ + export ฟังก์ชันให้ api.js เรียกใช้ได้
import { CONFIG } from './config.js';

const state = {
  sessionKey: null,
  user: null
};

// export ให้ api.js ใช้งาน (แก้ปัญหา "does not provide an export named 'getSession'")
export function getSession(){ return state; }

// ----------------- utils -----------------
function getInviteCodeFromURL(){
  try{
    const usp = new URLSearchParams(location.search);
    return (usp.get('invite') || '').trim();
  }catch{ return ''; }
}
function saveSession(sessionKey, user){
  state.sessionKey = sessionKey;
  state.user = user;
  try{ sessionStorage.setItem('nsb2b.session', JSON.stringify({ sessionKey, user })); }catch{}
}
function renderUser(user){
  const btnLogin   = document.getElementById('btnLogin');
  const userCard   = document.getElementById('userCard');
  const userAvatar = document.getElementById('userAvatar');
  const userName   = document.getElementById('userName');
  const userMeta   = document.getElementById('userMeta');
  if(!user) return;
  btnLogin?.classList.add('hidden');
  userCard?.classList.remove('hidden');
  if(userAvatar) userAvatar.src = user.pictureUrl || '';
  if(userName)   userName.textContent = user.displayName || 'Unknown';
  if(userMeta)   userMeta.textContent = `team ${user.team || '-'} • ${user.isAdmin ? 'Admin' : 'Member'}`;
}

// --------------- main init ----------------
export async function initAuth(){
  const btnLogin   = document.getElementById('btnLogin');
  const btnLogout  = document.getElementById('btnLogout');
  const authNotice = document.getElementById('authNotice');
  const formSection= document.getElementById('formSection');
  const userCard   = document.getElementById('userCard');

  // Restore session
  const saved = sessionStorage.getItem('nsb2b.session');
  if(saved){
    try{
      const s = JSON.parse(saved);
      state.sessionKey = s.sessionKey;
      state.user = s.user;
      renderUser(s.user);
      authNotice?.classList.add('hidden');
      formSection?.classList.remove('hidden');
    }catch{}
  }

  btnLogin?.addEventListener('click', async ()=>{
    const btn = btnLogin;
    try{
      if(!CONFIG.LIFF_ID || CONFIG.LIFF_ID.includes('YOUR_')){
        alert('ยังไม่ได้ตั้งค่า LIFF_ID ใน config.js'); return;
      }

      btn.disabled = true;

      // 1) init LIFF เสมอ
      await liff.init({ liffId: CONFIG.LIFF_ID });

      // 2) ถ้ายังไม่ล็อกอิน → ส่งไปหน้า login
      if(!liff.isLoggedIn()){
        liff.login({ redirectUri: window.location.href });
        return;
      }

      // 3) ได้โปรไฟล์
      const profile = await liff.getProfile();
      const { userId, displayName, pictureUrl } = profile;

      // 4) แนบ inviteCode (ถ้ามี)
      const inviteCode = getInviteCodeFromURL();

      const res = await fetch(CONFIG.AUTH_FLOW_URL, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          userId, displayName, pictureUrl: pictureUrl || '',
          origin: location.origin, inviteCode
        })
      });
      const data = await res.json().catch(()=> ({}));
      if(!res.ok || !data.ok){ throw new Error(data?.message || 'ไม่ผ่านการยืนยันตัวตน'); }

      // 5) เก็บ session + คาย UI
      saveSession(data.sessionKey, {
        userId, displayName, pictureUrl: pictureUrl || '',
        team: data.team, isAdmin: !!data.isAdmin, expiresAt: data.expiresAt
      });
      renderUser(state.user);
      authNotice?.classList.add('hidden');
      formSection?.classList.remove('hidden');

      // 6) ล้าง ?invite=
      try{
        const url = new URL(location.href);
        url.searchParams.delete('invite');
        history.replaceState(null,'',url.toString());
      }catch{}
    }catch(err){
      console.error('[LIFF login error]', err);
      alert('ล็อกอินล้มเหลว: ' + (err?.message || err));
    }finally{
      btn.disabled = false;
    }
  });

  btnLogout?.addEventListener('click', ()=>{
    sessionStorage.removeItem('nsb2b.session');
    state.sessionKey = null;
    state.user = null;
    userCard?.classList.add('hidden');
    document.getElementById('btnLogin')?.classList.remove('hidden');
    authNotice?.classList.remove('hidden');
    formSection?.classList.add('hidden');
    try{ if(liff.isLoggedIn()) liff.logout(); }catch{}
  });
}
