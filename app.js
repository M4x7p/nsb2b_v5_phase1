import { initAuth, getSession } from './auth.js';
import { submitVisit } from './api.js';

function $(sel){ return document.querySelector(sel); }

function todayISO(){
  const d = new Date();
  const tzoffset = d.getTimezoneOffset() * 60000;
  return new Date(Date.now()-tzoffset).toISOString().slice(0,10);
}

async function onSubmit(e){
  e.preventDefault();
  const s = getSession();
  if (!s.sessionKey) { alert('กรุณาล็อกอินก่อน'); return; }

  const payload = {
    date: $('#date').value,
    team: $('#team').value.trim(),
    staff: $('#staff').value.trim(),
    customer: $('#customer').value.trim(),
    phone: $('#phone').value.trim(),
    site: $('#site').value.trim(),
    businessType: $('#businessType').value.trim(),
    products: $('#products').value.trim(),
    estAmount: Number($('#estAmount').value || 0),
    shop: $('#shop').value.trim(),
    details: $('#details').value.trim(),
    latlon: $('#latlon').value.trim(),
    subdistrict: $('#subdistrict').value.trim(),
  };

  const statusEl = document.getElementById('formStatus');
  statusEl.textContent = 'กำลังส่ง...';

  try {
    const res = await submitVisit(payload);
    statusEl.textContent = 'ส่งสำเร็จ #' + res.rowId;
    // reset minimal
    $('#customer').value=''; $('#phone').value=''; $('#details').value='';
  } catch (err) {
    console.error(err);
    statusEl.textContent = '❌ ' + err.message;
    alert('ส่งไม่สำเร็จ: ' + err.message);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  document.getElementById('date').value = todayISO();
  document.getElementById('visitForm').addEventListener('submit', onSubmit);
});
