const MOCK_MODE = !process.env.CAMPAY_USERNAME || process.env.NODE_ENV === 'development';

async function initiatePayment({ phone, amount, currency = 'XAF', description, bookingId }) {
  if (MOCK_MODE) {
    console.log(`[PAYMENT MOCK] Initiating ${amount} ${currency} from ${phone} for booking ${bookingId}`);
    return {
      mock: true,
      reference: `MOCK-${Date.now()}`,
      status: 'PENDING',
      message: 'Paiement en cours (mode simulation)',
    };
  }

  const res = await fetch(`${process.env.CAMPAY_BASE_URL}/collect/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Token ${await getCampayToken()}` },
    body: JSON.stringify({ amount: String(amount), currency, from: phone, description, external_reference: bookingId }),
  });

  if (!res.ok) throw new Error('Campay collection failed');
  return res.json();
}

async function checkPaymentStatus(reference) {
  if (MOCK_MODE) {
    return { status: 'SUCCESSFUL', reference };
  }

  const res = await fetch(`${process.env.CAMPAY_BASE_URL}/transaction/${reference}/`, {
    headers: { Authorization: `Token ${await getCampayToken()}` },
  });
  return res.json();
}

let _tokenCache = null;
async function getCampayToken() {
  if (_tokenCache && _tokenCache.expiresAt > Date.now()) return _tokenCache.token;
  const res = await fetch(`${process.env.CAMPAY_BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.CAMPAY_USERNAME, password: process.env.CAMPAY_PASSWORD }),
  });
  const data = await res.json();
  _tokenCache = { token: data.token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return data.token;
}

module.exports = { initiatePayment, checkPaymentStatus };
