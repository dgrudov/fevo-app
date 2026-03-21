import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const emailHtml = (code) => `
<div style="background:#0a0805;padding:40px 20px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="font-size:42px;font-weight:800;color:#fff;letter-spacing:-1.5px;margin:0;text-shadow:0 0 30px rgba(255,87,51,0.5)">Gruvio</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;margin:6px 0 0">Find your people. Go do things.</p>
    </div>
    <div style="background:#161009;border-radius:24px;padding:36px 32px;border:1px solid rgba(255,255,255,0.07);text-align:center">
      <div style="font-size:52px;margin-bottom:20px">🔐</div>
      <h2 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 12px;letter-spacing:-0.5px">Your verification code</h2>
      <p style="color:rgba(255,255,255,0.5);font-size:15px;line-height:1.7;margin:0 0 24px">
        Enter this code in the app to verify your account:
      </p>
      <div style="background:#0a0805;border-radius:16px;padding:28px 24px;border:1px solid rgba(255,87,51,0.3);margin-bottom:24px;letter-spacing:16px;font-size:44px;font-weight:800;color:#ff5733;font-family:monospace">
        ${code}
      </div>
      <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;line-height:1.6">
        This code expires in 15 minutes. If you didn't sign up for Gruvio, ignore this email.
      </p>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;margin-top:24px;line-height:1.6">
      © 2025 Gruvio · <a href="https://gruvio.app/privacy" style="color:rgba(255,87,51,0.6);text-decoration:none">Privacy Policy</a>
    </p>
  </div>
</div>`;

async function sendCodeEmail(email, code) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Gruvio <noreply@gruvio.app>',
      to: [email],
      subject: 'Your Gruvio verification code',
      html: emailHtml(code),
    }),
  });
  if (!res.ok) console.error('Resend error:', await res.json());
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://gruvio.app', 'http://localhost:3000', 'https://localhost'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : 'https://gruvio.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      if (existingUser.deleted_at) {
        await supabase.auth.admin.deleteUser(existingUser.id);
      } else {
        // Check if they have a pending verification code — if so, just resend it
        const { data: profile } = await supabase.from('profiles').select('verification_code').eq('id', existingUser.id).maybeSingle();
        if (profile?.verification_code) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          await supabase.from('profiles').update({ verification_code: code, verification_code_expires: expires }).eq('id', existingUser.id);
          await sendCodeEmail(email, code);
          return res.status(200).json({ ok: true });
        }
        return res.status(409).json({ error: 'already_registered' });
      }
    }

    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return res.status(500).json({ error: createErr.message });

    const userId = newUser.user.id;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const username = 'user_' + userId.substring(0, 8);

    await supabase.from('profiles').upsert({
      id: userId,
      email,
      username,
      onboarded: false,
      verification_code: code,
      verification_code_expires: expires,
    }, { onConflict: 'id' });

    await sendCodeEmail(email, code);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: err.message });
  }
}
