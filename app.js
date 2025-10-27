// app.js (admin page only)
import { CONFIG } from './config.js';
import { createInvite } from './api.js';

function initAdminDefaults() {
  const $ = (id) => document.getElementById(id);

  const prefixEl     = $('prefix');
  const baseWebEl    = $('baseWebUrl');
  const teamEl       = $('team');
  const branchEl     = $('branch');
  const maxUsesEl    = $('maxUses');
  const expiresEl    = $('expiresInDays');
  const adminTokenEl = $('adminToken');

  // โหลดค่าเดิมจาก localStorage หรือ CONFIG
  const savedPrefix  = localStorage.getItem('nsb2b.admin.prefix')
                   || CONFIG.DEFAULT_INVITE_PREFIX
                   || 'INV-';
  const savedBaseUrl = localStorage.getItem('nsb2b.admin.baseWebUrl')
                   || CONFIG.DEFAULT_BASE_WEB_URL
                   || `${location.origin}/`;

  if (prefixEl)  prefixEl.value  = savedPrefix;
  if (baseWebEl) baseWebEl.value = savedBaseUrl;

  prefixEl?.addEventListener('change', () => {
    const val = (prefixEl.value || 'INV-').trim();
    prefixEl.value = val || 'INV-';
    localStorage.setItem('nsb2b.admin.prefix', prefixEl.value);
  });
  baseWebEl?.addEventListener('change', () => {
    const val = (baseWebEl.value || '').trim();
    localStorage.setItem('nsb2b.admin.baseWebUrl', val);
  });

  if (teamEl && !teamEl.value)        teamEl.value = 'A';
  if (maxUsesEl && !maxUsesEl.value)  maxUsesEl.value = '1';
  if (expiresEl && !expiresEl.value)  expiresEl.value = '14';

  // ปุ่ม “สร้าง Invite”
  $('btnCreateInvite')?.addEventListener('click', async () => {
    try {
      $('resultBox')?.classList.add('hidden');
      $('inviteUrl')?.classList.add('hidden');

      const payload = {
        team:           teamEl?.value || 'A',
        branch:         branchEl?.value?.trim() || '',
        maxUses:        parseInt(maxUsesEl?.value || '1', 10),
        expiresInDays:  parseInt(expiresEl?.value || '14', 10),
        prefix:         (prefixEl?.value || 'INV-').trim(),
        baseWebUrl:     (baseWebEl?.value || '').trim()
      };
      if (payload.baseWebUrl && !payload.baseWebUrl.endsWith('/')) {
        payload.baseWebUrl += '/';
      }

      const res = await createInvite(payload, adminTokenEl?.value || '');
      // โครงสร้างตอบกลับคาดหวัง:
      // { ok, inviteCode, inviteUrl, team, maxUses, expiresAtUTC }
      const url   = res?.inviteUrl || '';
      const team  = res?.team || '-';
      const exp   = res?.expiresAtUTC || res?.expiresAt || '-';

      // เติมผลลัพธ์ 3 บรรทัด
      const teamElOut = $('resultTeam');
      const expElOut  = $('resultExpire');
      const linkElOut = $('resultLink');

      if (teamElOut) teamElOut.textContent = team;
      if (expElOut)  expElOut.textContent  = exp;
      if (linkElOut) {
        linkElOut.href = url || '#';
        linkElOut.textContent = url || '-';
      }

      if (url) $('inviteUrl')?.classList.remove('hidden');
      $('resultBox')?.classList.remove('hidden');
    } catch (err) {
      console.error('[createInvite error]', err);
      alert(err?.message || 'สร้าง Invite ไม่สำเร็จ');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminPage')) {
    initAdminDefaults();
  }
});
