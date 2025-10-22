// สำเนาไฟล์นี้เป็น 'config.js' แล้วใส่ค่าให้ครบ
export const CONFIG = {
  LIFF_ID: "YOUR_LIFF_ID",
  AUTH_FLOW_URL: "https://YOUR_AUTH_FLOW_URL",      // Power Automate (HTTP trigger) ตรวจ allowlist → ออก sessionKey
  SUBMIT_FLOW_URL: "https://YOUR_SUBMIT_FLOW_URL",  // Power Automate (HTTP trigger) บันทึกลง Excel
  // อนุญาตต้นทาง (production domain) เพื่อเช็ค CORS ฝั่ง Flow ให้ตรงกัน
  ORIGIN: "https://your-domain.example.com"
};
