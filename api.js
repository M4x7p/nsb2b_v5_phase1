// api.js
import { CONFIG } from './config.js';
import { getSession } from './auth.js';

function commonHeaders() {
  const s = getSession();
  const h = { 'Content-Type': 'application/json' };
  if (s.sessionKey) h['X-Session-Key'] = s.sessionKey;
  if (s.user?.userId) h['X-User-Id'] = s.user.userId;
  return h;
}

// สร้าง/บันทึก visit (ของเดิม)
export async function submitVisit(payload) {
  const res = await fetch(`${CONFIG.SUBMIT_FLOW_URL}`, {
    method: 'POST',
    headers: commonHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok || !data.ok) {
    throw new Error(data?.message || `ส่งข้อมูลไม่สำเร็จ (${res.status})`);
  }
  return data;
}

// ใหม่: สร้าง Invite (ใช้ในหน้า admin)
export async function createInvite(payload) {
  const res = await fetch(`${CONFIG.INVITE_FLOW_URL}`, {
    method: 'POST',
    headers: {
      ...commonHeaders(),
      'X-Admin-Token': CONFIG.ADMIN_TOKEN
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok || !data.ok) {
    throw new Error(data?.message || 'สร้าง Invite ไม่สำเร็จ');
  }
  return data;
}
