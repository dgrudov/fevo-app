'use strict';
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const { userId } = req.query;

  const envCheck = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VAPID_PUBLIC_KEY: !!process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    vapidPubKeyPreview: process.env.VAPID_PUBLIC_KEY?.slice(0, 20) + '...',
  };

  if (!userId) return res.status(200).json({ envCheck, error: 'Pass ?userId=YOUR_USER_ID to also check subscriptions' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('push_subscriptions').select('subscription').eq('user_id', userId);
    res.status(200).json({
      envCheck,
      subscriptionCount: data?.length ?? 0,
      supabaseError: error?.message ?? null,
      endpointPreview: data?.[0]?.subscription?.endpoint?.slice(0, 50) + '...',
    });
  } catch (err) {
    res.status(500).json({ envCheck, error: err.message });
  }
};
