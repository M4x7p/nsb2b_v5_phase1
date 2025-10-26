// app.js (admin page only)
import { CONFIG } from './config.js?v=2025-10-26-8';
import { createInvite } from './api.js?v=2025-10-26-8';

const $ = (id) => document.getElementById(id);

function setBtnBusy(btn, busy) {
  if (!btn) return;
  btn.disabled = !!busy;
  btn.classList.toggle('is-busy', !!busy);
  btn.innerText = busy ? 'กำลังสร้าง…' : 'สร้าง Invite';
}

function initAdminDefaults() {
  const prefixEl     = $('prefix');
  const baseWebEl    = $('baseWebUrl');
  const teamEl       = $('team');
  const branchEl     = $('branch');
  const maxUsesEl    = $('maxUses');
  const expiresEl    = $('expiresInDays');
  const adminTokenEl = $('adminToken');
  const notesEl      = $('notes');
  const btnCreate    = $('btnCreateInvite');

  // โหลดค่าที่เคยบันทึกไว้ หรือค่าเริ่มต้น
  const savedPrefix  = localStorage.getItem('nsb2b.admin.prefix')
                    || CONFIG.DEFAULT_INVITE_PREFIX
                    || 'INV-';
  const savedBaseUrl = localStorage.getItem('nsb2b.admin.baseWebUrl')
                    || CONFIG.DEFAULT_BASE_WEB_URL
                    || (location.origin + '/');

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

  btnCreate?.addEventListener('click', async () => {
    try {
      setBtnBusy(btnCreate, true);
      $('resultBox')?.classList.add('hidden');
      $('inviteUrlWrap')?.classList.add('hidden');

      const token = (adminTokenEl?.value || '').trim();
      if (!token) { alert('กรุณาใส่ Admin token'); return; }

      let baseWebUrl = (baseWebEl?.value || '').trim();
      if (baseWebUrl && !baseWebUrl.endsWith('/')) baseWebUrl += '/';

      const payload = {
        team:          teamEl?.value || 'A',
        branch:        branchEl?.value?.trim() || '',
        maxUses:       Math.max(1, parseInt(maxUsesEl?.value || '1', 10)),
        expiresInDays: Math.max(1, parseInt(expiresEl?.value || '14', 10)),
        prefix:        (prefixEl?.value || 'INV-').trim(),
        baseWebUrl,
        notes:         (notesEl?.value || '').trim()
      };

      // บันทึก prefs
      try {
        localStorage.setItem('nsb2b.admin.prefix', payload.prefix);
        localStorage.setItem('nsb2b.admin.baseWebUrl', payload.baseWebUrl);
      } catch {}

      const data = await createInvite(payload, token);

      const url  = data?.inviteUrl || '';
      const code = data?.inviteCode || '';

      $('resultCode').textContent = code || '-';
      if (url) {
        const link = $('resultLink');
        link.href = url;
        link.textContent = url;
        $('inviteUrlWrap')?.classList.remove('hidden');
      }
      $('resultBox')?.classList.remove('hidden');

    } catch (err) {
      console.error('[createInvite error]', err);
      alert(err?.message || 'สร้าง Invite ไม่สำเร็จ');
    } finally {
      setBtnBusy(btnCreate, false);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminPage')) {
    initAdminDefaults();
  }
});
