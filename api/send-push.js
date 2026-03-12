import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  'mailto:admin@fevo.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, title, body } = req.body;
  if (!userId || !title) return res.status(400).json({ error: 'Missing fields' });

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) return res.status(200).json({ ok: true });

  await Promise.all(
    subs.map(({ subscription }) =>
      webpush
        .sendNotification(subscription, JSON.stringify({ title, body }))
        .catch(() => {}) // ignore expired/invalid subscriptions
    )
  );

  res.status(200).json({ ok: true });
}
