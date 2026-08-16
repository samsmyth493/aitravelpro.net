export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Add contact to Brevo list
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: name.split(' ')[0],
          LASTNAME: name.split(' ').slice(1).join(' ')
        },
        listIds: [5],
        updateEnabled: true
      })
    });

    // Send notification email via Brevo SMTP
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'AI Travel Pro Website', email: 'hi@aitravelpro.net' },
        to:          [{ email: 'hi@aitravelpro.net', name: 'AI Travel Pro' }],
        replyTo:     { email, name },
        subject:     'New Contact: ' + name + ' via aitravelpro.net',
        htmlContent: '<h3>New contact form submission</h3>' +
          '<p><strong>Name:</strong> ' + name + '</p>' +
          '<p><strong>Email:</strong> <a href="mailto:' + email + '">' + email + '</a></p>' +
          '<p><strong>Message:</strong></p>' +
          '<p>' + message.replace(/\n/g, '<br>') + '</p>'
      })
    });

    if (!emailRes.ok) {
      const detail = await emailRes.json().catch(() => ({}));
      console.error('Brevo SMTP error:', detail);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
