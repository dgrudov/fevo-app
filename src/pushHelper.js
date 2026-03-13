import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = 'BKcGGnjGfcXDDFD495Ieh-4Piidw-uEz9KolZ5aQx1D6idbO4x5tZmlJUdEUehNAv-36JCUBlyevXAH985Kfneo';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Unsubscribe first to clear any stale subscription, then resubscribe
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, endpoint: sub.endpoint, subscription: sub.toJSON() },
      { onConflict: 'user_id,endpoint' }
    );
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}
