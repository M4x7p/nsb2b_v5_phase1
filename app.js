// app.js (เฉพาะส่วน admin page)
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

  // อ่านจาก localStorage หรือค่าเริ่มต้นจาก CONFIG
  const savedPrefix  = localStorage.getItem('nsb2b.admin.prefix')
                    || CONFIG.DEFAULT_INVITE_PREFIX
                    || 'INV-';
  const savedBaseUrl = localStorage.getItem('nsb2b.admin.baseWebUrl')
                    || CONFIG.DEFAULT_BASE_WEB_URL
                    || `${location.origin}/`;

  if (prefixEl)  prefixEl.value  = savedPrefix;
  if (baseWebEl) baseWebEl.value = savedBaseUrl;

  // เก็บค่าทันทีเมื่อแก้ไข
  prefixEl?.addEventListener('change', () => {
    const val = (prefixEl.value || 'INV-').trim();
    prefixEl.value = val || 'INV-';
    localStorage.setItem('nsb2b.admin.prefix', prefixEl.value);
  });
  baseWebEl?.addEventListener('change', () => {
    const val = (baseWebEl.value || '').trim();
    localStorage.setItem('nsb2b.admin.baseWebUrl', val);
  });

  // ค่าเริ่มต้นอื่นๆ (กันลืมกรอก)
  if (teamEl && !teamEl.value)     teamEl.value = 'A';
  if (maxUsesEl && !maxUsesEl.value) maxUsesEl.value = '1';
  if (expiresEl && !expiresEl.value) expiresEl.value = '14';

  // กดปุ่ม “สร้าง Invite”
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

      // กันช่องว่าง/เครื่องหมาย / ซ้อนผิดที่
      if (payload.baseWebUrl && !payload.baseWebUrl.endsWith('/')) {
        payload.baseWebUrl += '/';
      }

      const data = await createInvite(payload);

      // แสดงผลลิงก์
      const url = data?.inviteUrl || '';
      const code = data?.inviteCode || '';
      $('resultCode').textContent = code || '-';
      if (url) {
        $('resultLink').href = url;
        $('resultLink').textContent = url;
        $('inviteUrl')?.classList.remove('hidden');
      }
      $('resultBox')?.classList.remove('hidden');
    } catch (err) {
      console.error('[createInvite error]', err);
      alert(err?.message || 'สร้าง Invite ไม่สำเร็จ');
    }
  });
}

// ทำงานเฉพาะเมื่ออยู่บนหน้า admin.html (เช็ค element เฉพาะหน้า)
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminPage')) {
    initAdminDefaults();
  }
});
