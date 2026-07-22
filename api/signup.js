// Lychee Learning — aanmeldingen doorsturen naar Google Sheet "Website Applications"
// De sheet-webhook (Apps Script URL) staat als env var SHEET_WEBHOOK_URL in Vercel.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const b = req.body || {};
  const parent = String(b.parent || '').trim();
  const email = String(b.email || '').trim();

  // Minimale validatie + simpele spamval (honeypot-veld "website" moet leeg zijn)
  if (!parent || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || (b.website && String(b.website).length)) {
    return res.status(400).json({ ok: false, error: 'Invalid submission' });
  }

  const row = {
    timestamp: new Date().toISOString(),
    parent,
    email,
    whatsapp: String(b.whatsapp || '').slice(0, 40),
    child: String(b.child || '').slice(0, 80),
    age: String(b.age || '').slice(0, 20),
    situation: String(b.situation || '').slice(0, 80),
    program: String(b.program || '').slice(0, 80),
    hub: String(b.hub || '').slice(0, 120),
    message: String(b.message || '').slice(0, 2000),
    source: String(b.source || 'website-signup').slice(0, 40),
    status: 'New'
  };

  const webhook = process.env.SHEET_WEBHOOK_URL;
  if (!webhook) {
    return res.status(500).json({ ok: false, error: 'Webhook not configured' });
  }

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      redirect: 'follow'
    });
    if (!r.ok) throw new Error('Sheet webhook status ' + r.status);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('signup forward failed:', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not store submission' });
  }
}
