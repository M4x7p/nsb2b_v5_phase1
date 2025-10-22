// สำเนาไฟล์นี้เป็น 'config.js' แล้วใส่ค่าให้ครบ
export const CONFIG = {
  LIFF_ID: "2008323668-pe1MQLzZ",
  AUTH_FLOW_URL: "https://5a1c2d740043e072baa147741b6585.82.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/04b9554fac2f4aa080ecb91c7a732f1d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1_fdmbhWP_VP2jxr1T6DtWiio8mogU4Ql61jU89rHg8",      // Power Automate (HTTP trigger) ตรวจ allowlist → ออก sessionKey
  SUBMIT_FLOW_URL: "https://5a1c2d740043e072baa147741b6585.82.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ef3435e55f624845ac9f7a7a865c17e6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=glWBV2dDctx5UaDICpZi1TgTFqjE3sKP4zoqxZVtweU",  // Power Automate (HTTP trigger) บันทึกลง Excel
  // อนุญาตต้นทาง (production domain) เพื่อเช็ค CORS ฝั่ง Flow ให้ตรงกัน
  ORIGIN: "https://m4x7p.github.io",
  ISSUE_INVITE_FLOW_URL: "https://5a1c2d740043e072baa147741b6585.82.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1ece5092430e4cf0906baac6baabf545/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=gY8eWTXRi5Qkk7JJ8IjyWXkiU-lZ45rXgb9bosGu9WY"
};
