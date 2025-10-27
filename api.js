// api.js
import { CONFIG } from './config.js';

export async function createInvite(payload, adminToken = '') {
  if (!CONFIG.ISSUE_INVITE_FLOW_URL) {
    throw new Error('ยังไม่ได้ตั้ง ISSUE_INVITE_FLOW_URL ใน config.js');
  }
  const res = await fetch(CONFIG.ISSUE_INVITE_FLOW_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { 'X-Admin-Token': adminToken } : {})
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || `ออกโค้ดไม่สำเร็จ (${res.status})`);
  }
  return data;
}
