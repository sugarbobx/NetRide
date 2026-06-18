const MOCK_OTP = '1234';
const otpStore = new Map(); // phone → { code, expiresAt }

function isMockMode() {
  return !process.env.AT_API_KEY || process.env.NODE_ENV === 'development';
}

/**
 * Feature 48: Sends an OTP to the given phone number.
 * In mock/dev mode, always sends '1234' without hitting Africa's Talking.
 * TTL is 10 minutes (per spec — stricter than the original 5 min).
 *
 * @param {string} phone - cleaned +237XXXXXXXXX
 * @returns {{ mock: boolean }}
 */
async function sendOtp(phone) {
  const code = isMockMode() ? MOCK_OTP : String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // Feature 48: 10-minute window
  otpStore.set(phone, { code, expiresAt });

  if (!isMockMode()) {
    const AfricasTalking = require('africastalking');
    const at = AfricasTalking({ username: process.env.AT_USERNAME, apiKey: process.env.AT_API_KEY });
    await at.SMS.send({
      to: [phone],
      message: `Votre code NetRide : ${code}. Valide 10 minutes.`,
    });
  } else {
    console.log(`[OTP MOCK] ${phone} → ${code}`);
  }

  return { mock: isMockMode() };
}

/**
 * Verifies an OTP code and removes it immediately to prevent reuse.
 *
 * @param {string} phone
 * @param {string} code
 * @returns {boolean}
 */
function verifyOtp(phone, code) {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { otpStore.delete(phone); return false; }
  if (entry.code !== code) return false;
  otpStore.delete(phone); // Feature 48: single-use — delete immediately after validation
  return true;
}

module.exports = { sendOtp, verifyOtp };
