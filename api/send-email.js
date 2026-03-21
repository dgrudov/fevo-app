import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const emailHtml = (name) => `
<div style="background:#0a0805;padding:40px 20px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="font-size:42px;font-weight:800;color:#fff;letter-spacing:-1.5px;margin:0;text-shadow:0 0 30px rgba(255,87,51,0.5)">Gruvio</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;margin:6px 0 0">Find your people. Go do things.</p>
    </div>
    <div style="background:#161009;border-radius:24px;padding:36px 32px;border:1px solid rgba(255,255,255,0.07);text-align:center">
      <div style="font-size:52px;margin-bottom:20px">🎉</div>
      <h2 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 12px;letter-spacing:-0.5px">Hey ${name}, welcome to Gruvio!</h2>
      <p style="color:rgba(255,255,255,0.5);font-size:15px;line-height:1.7;margin:0 0 32px">
        Your account is ready. Click below to open the app and complete your profile.
      </p>
      <a href="https://gruvio.app"
        style="display:inline-block;background:linear-gradient(135deg,#ff5733,#ff8c42);color:#fff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(255,87,51,0.4)">
        Open Gruvio →
      </a>
      <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:28px 0 0;line-height:1.6">
        If you didn't sign up for Gruvio, you can safely ignore this email.
      </p>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;margin-top:24px;line-height:1.6">
      © 2025 Gruvio · <a href="https://gruvio.app/privacy" style="color:rgba(255,87,51,0.6);text-decoration:none">Privacy Policy</a>
    </p>
  </div>
</div>`;

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://gruvio.app', 'http://localhost:3000', 'https://localhost'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : 'https://gruvio.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name, userId } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    // Create profile server-side using service role (bypasses RLS)
    if (userId && name) {
      // Use userId suffix on username to prevent unique constraint conflicts
      const baseUsername = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
      const username = baseUsername + '_' + userId.substring(0, 6);
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: name,
        email: email,
        username,
        onboarded: false,
      }, { onConflict: 'id' });
    }

    // Send welcome email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gruvio <noreply@gruvio.app>',
        to: [email],
        subject: 'Welcome to Gruvio!',
        html: emailHtml(name || 'there'),
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: err.message || 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
