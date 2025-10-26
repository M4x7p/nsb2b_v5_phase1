import { initAuth, getSession } from './auth.js';
import { submitVisit } from './api.js';

initAuth().catch(console.error);

// helper ui
function setBusy(btn, on, textIdle='ส่งข้อมูล'){
  const status = document.getElementById('formStatus');
  if(on){
    btn.disabled = true;
    btn.textContent = 'กำลังส่ง…';
    status.textContent = 'กำลังส่งข้อมูลไปยังระบบ';
  }else{
    btn.disabled = false;
    btn.textContent = textIdle;
  }
}

const form = document.getElementById('visitForm');
const teamSel = document.getElementById('team');
const btnSubmit = document.getElementById('btnSubmit');

// เติม team อัตโนมัติจาก session (ถ้ามี)
(function primeTeam(){
  const s = getSession();
  if(s?.user?.team && teamSel && !teamSel.value){
    teamSel.value = s.user.team;
  }
})();

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const status = document.getElementById('formStatus');
  const s = getSession();

  const payload = {
    date:       document.getElementById('date').value || '',
    team:       document.getElementById('team').value || s?.user?.team || '',
    staff:      document.getElementById('staff').value || '',
    customer:   document.getElementById('customer').value || '',
    phone:      document.getElementById('phone').value || '',
    site:       document.getElementById('site').value || '',
    businessType: document.getElementById('businessType').value || '',
    products:   document.getElementById('products').value || '',
    estAmount:  document.getElementById('estAmount').value || '',
    shop:       document.getElementById('shop').value || '',
    details:    document.getElementById('details').value || '',
    latlon:     document.getElementById('latlon').value || '',
    subdistrict:document.getElementById('subdistrict').value || ''
  };

  try{
    setBusy(btnSubmit, true);
    const resp = await submitVisit(payload);
    status.textContent = 'ส่งสำเร็จ #' + (resp?.ref || '');
    form.reset();
    if(s?.user?.team) teamSel.value = s.user.team; // คืนค่า team เดิม
  }catch(err){
    console.error(err);
    status.textContent = 'ส่งไม่สำเร็จ: ' + (err?.message || err);
  }finally{
    setBusy(btnSubmit, false);
  }
});
