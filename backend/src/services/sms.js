const SEMAPHORE_URL = 'https://api.semaphore.co/api/v4/messages';

export function isSmsConfigured() {
  return !!process.env.SEMAPHORE_API_KEY;
}

function formatPhone(phone) {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('63') && p.length === 12) return p;
  if (p.startsWith('0') && p.length === 11) return '63' + p.slice(1);
  if (p.length === 10) return '63' + p;
  return p;
}

export async function sendSms({ to, message }) {
  if (!isSmsConfigured()) return { success: false, error: 'Semaphore API not configured' };

  const number = formatPhone(to);
  if (!number) return { success: false, error: 'No recipient phone number' };

  try {
    const res = await fetch(SEMAPHORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.SEMAPHORE_API_KEY,
        number,
        message,
        sendername: process.env.SEMAPHORE_SENDER || 'NEMSUC',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.message || data?.error || `HTTP ${res.status}` };
    }
    return { success: true, data };
  } catch (err) {
    console.error('[SMS]', err.message);
    return { success: false, error: err.message };
  }
}
