import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://gruvio.app', 'http://localhost:3000', 'https://localhost'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : 'https://gruvio.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Missing fields' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_code, verification_code_expires')
    .eq('email', email)
    .maybeSingle();

  if (!profile) return res.status(404).json({ error: 'Account not found' });
  if (!profile.verification_code) return res.status(400).json({ error: 'already_verified' });
  if (profile.verification_code !== code) return res.status(400).json({ error: 'Wrong code. Try again.' });
  if (profile.verification_code_expires && new Date(profile.verification_code_expires) < new Date()) {
    return res.status(400).json({ error: 'Code expired. Use the resend button to get a new one.' });
  }

  await supabase
    .from('profiles')
    .update({ verification_code: null, verification_code_expires: null })
    .eq('email', email);

  return res.status(200).json({ ok: true });
}
