const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  'mailto:admin@fevo.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, title, body } = req.body;
  if (!userId || !title) return res.status(400).json({ error: 'Missing fields' });

  try {
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    if (!subs || subs.length === 0) return res.status(200).json({ ok: true, sent: 0 });

    await Promise.all(
      subs.map(({ subscription }) =>
        webpush
          .sendNotification(subscription, JSON.stringify({ title, body }))
          .catch(() => {})
      )
    );

    res.status(200).json({ ok: true, sent: subs.length });
  } catch (err) {
    console.error('send-push error:', err);
    res.status(500).json({ error: err.message });
  }
};
