import { CONFIG } from './config.js';
import { getSession } from './auth.js';

function headers() {
  const s = getSession();
  const h = {
    'Content-Type': 'application/json'
  };
  if (s.sessionKey) h['X-Session-Key'] = s.sessionKey;
  if (s.user?.userId) h['X-User-Id'] = s.user.userId;
  return h;
}

export async function submitVisit(payload) {
  const res = await fetch(CONFIG.SUBMIT_FLOW_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok || !data.ok) {
    throw new Error(data?.message || `ส่งข้อมูลไม่สำเร็จ (${res.status})`);
  }
  return data;
}
