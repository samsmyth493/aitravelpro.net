export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        listIds: [5],
        updateEnabled: true
      })
    });

    if (!brevoRes.ok) {
      const detail = await brevoRes.json().catch(() => ({}));
      console.error('Brevo contacts error:', detail);
      return res.status(502).json({ error: 'Failed to subscribe' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Newsletter handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
