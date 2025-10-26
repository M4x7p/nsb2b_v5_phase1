// api.js
import { CONFIG } from './config.js';
import { getSession } from './auth.js';

function baseHeaders() {
  const s = getSession();
  const h = { 'Content-Type': 'application/json' };
  if (s?.sessionKey) h['X-Session-Key'] = s.sessionKey;
  if (s?.user?.userId) h['X-User-Id'] = s.user.userId;
  return h;
}

export async function submitVisit(payload) {
  const res = await fetch(CONFIG.SUBMIT_FLOW_URL, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok || !data.ok) throw new Error(data?.message || `ส่งข้อมูลไม่สำเร็จ (${res.status})`);
  return data;
}

// === New: Issue Invite ===
export async function issueInvite(payload, adminToken) {
  const res = await fetch(CONFIG.ISSUE_INVITE_FLOW_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken || ''
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok || !data.ok) {
    const msg = data?.message || `ออกโค้ดไม่สำเร็จ (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
