import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://gruvio.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  try {
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const userId = user.id;

    // Delete all user data from tables
    await Promise.all([
      supabase.from('push_subscriptions').delete().eq('user_id', userId),
      supabase.from('notifications').delete().eq('user_id', userId),
      supabase.from('buddy_request').delete().or(`requester_id.eq.${userId},receiver_id.eq.${userId}`),
      supabase.from('blocks').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      supabase.from('ratings').delete().or(`rater_id.eq.${userId},rated_id.eq.${userId}`),
      supabase.from('messages').delete().eq('user_id', userId),
      supabase.from('attendance').delete().eq('user_id', userId),
      supabase.from('join_requests').delete().or(`user_id.eq.${userId},host_id.eq.${userId}`),
      supabase.from('event_confirmations').delete().eq('user_id', userId),
      supabase.from('event_photos').delete().eq('user_id', userId),
    ]);

    // Delete events hosted by the user
    await supabase.from('events').delete().eq('host_id', userId);

    // Delete profile
    await supabase.from('profiles').delete().eq('id', userId);

    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('delete-account error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
