// app.js (admin page)
import { CONFIG } from './config.js?v=2025-10-26-7';
import { createInvite } from './api.js?v=2025-10-26-7';

const $ = (id) => document.getElementById(id);

function initAdminDefaults() {
  const prefixEl     = $('prefix');
  const baseWebEl    = $('baseWebUrl');
  const teamEl       = $('team');
  const branchEl     = $('branch');
  const maxUsesEl    = $('maxUses');
  const expiresEl    = $('expiresInDays');
  const adminTokenEl = $('adminToken');

  // โหลดค่าที่เคยบันทึกไว้ หรือค่าเริ่มต้น
  const savedPrefix  = localStorage.getItem('nsb2b.admin.prefix')
                    || CONFIG.DEFAULT_INVITE_PREFIX
                    || 'INV-';
  const savedBaseUrl = localStorage.getItem('nsb2b.admin.baseWebUrl')
                    || CONFIG.DEFAULT_BASE_WEB_URL
                    || 'https://m4x7p.github.io/nsb2b_v5_phase1/';

  if (prefixEl)  prefixEl.value  = savedPrefix;
  if (baseWebEl) baseWebEl.value = savedBaseUrl;

  // เก็บทันทีเมื่อแก้ไข
  prefixEl?.addEventListener('change', () => {
    const val = (prefixEl.value || 'INV-').trim();
    prefixEl.value = val || 'INV-';
    localStorage.setItem('nsb2b.admin.prefix', prefixEl.value);
  });
  baseWebEl?.addEventListener('change', () => {
    const val = (baseWebEl.value || '').trim();
    localStorage.setItem('nsb2b.admin.baseWebUrl', val);
  });

  // กันลืมค่าเบสิก
  if (teamEl && !teamEl.value)        teamEl.value = 'A';
  if (maxUsesEl && !maxUsesEl.value)  maxUsesEl.value = '1';
  if (expiresEl && !expiresEl.value)  expiresEl.value = '14';

  // ปุ่มสร้าง Invite
  $('btnCreateInvite')?.addEventListener('click', async () => {
    try {
      $('resultBox')?.classList.add('hidden');
      $('inviteUrlWrap')?.classList.add('hidden');

      const token = (adminTokenEl?.value || '').trim();
      if (!token) {
        alert('กรุณาใส่ Admin token');
        return;
      }

      const payload = {
        team:          teamEl?.value || 'A',
        branch:        branchEl?.value?.trim() || '',
        maxUses:       Math.max(1, parseInt(maxUsesEl?.value || '1', 10)),
        expiresInDays: Math.max(1, parseInt(expiresEl?.value || '14', 10)),
        prefix:        (prefixEl?.value || 'INV-').trim(),
        baseWebUrl:    (baseWebEl?.value || '').trim()
      };

      // ลงท้ายด้วย / เสมอเพื่อประกอบลิงก์สวยๆ
      if (payload.baseWebUrl && !payload.baseWebUrl.endsWith('/')) {
        payload.baseWebUrl += '/';
      }

      // บันทึกค่าที่ผู้ใช้ตั้งไว้
      try {
        localStorage.setItem('nsb2b.admin.prefix', payload.prefix);
        localStorage.setItem('nsb2b.admin.baseWebUrl', payload.baseWebUrl);
      } catch {}

      const data = await createInvite(payload, token);

      const url  = data?.inviteUrl || '';
      const code = data?.inviteCode || '';

      $('resultCode').textContent = code || '-';
      if (url) {
        $('resultLink').href = url;
        $('resultLink').textContent = url;
        $('inviteUrlWrap')?.classList.remove('hidden');
      }
      $('resultBox')?.classList.remove('hidden');

    } catch (err) {
      console.error('[createInvite error]', err);
      alert(err?.message || 'สร้าง Invite ไม่สำเร็จ');
    }
  });
}

// เริ่มทำงานเฉพาะหน้า admin.html
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminPage')) {
    initAdminDefaults();
  }
});
