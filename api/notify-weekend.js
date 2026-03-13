import { createClient } from '@supabase/supabase-js';
import { createECDH, createHmac, createCipheriv, randomBytes, createPrivateKey, sign } from 'node:crypto';
import { request as httpsRequest } from 'node:https';

function b64decode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
function b64encode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function hkdfExpand(prk, info, len) {
  const hmac = createHmac('sha256', prk);
  hmac.update(info);
  hmac.update(Buffer.from([0x01]));
  return hmac.digest().slice(0, len);
}
function makeVapidJWT(endpoint, vapidPrivateKeyBase64) {
  const { protocol, host } = new URL(endpoint);
  const now = Math.floor(Date.now() / 1000);
  const hdr = b64encode(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const pld = b64encode(Buffer.from(JSON.stringify({ aud: `${protocol}//${host}`, exp: now + 43200, sub: 'mailto:admin@fevo.app' })));
  const input = `${hdr}.${pld}`;
  const rawKey = b64decode(vapidPrivateKeyBase64);
  const prefix = Buffer.from('3041020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420', 'hex');
  const privKey = createPrivateKey({ key: Buffer.concat([prefix, rawKey]), format: 'der', type: 'pkcs8' });
  const sig = sign('SHA256', Buffer.from(input), { key: privKey, dsaEncoding: 'ieee-p1363' });
  return `${input}.${b64encode(sig)}`;
}
function encryptPayload(subscription, payloadStr) {
  const p256dh = b64decode(subscription.keys.p256dh);
  const auth = b64decode(subscription.keys.auth);
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  const senderPub = ecdh.getPublicKey();
  const sharedSecret = ecdh.computeSecret(p256dh);
  const salt = randomBytes(16);
  const prkKey = createHmac('sha256', auth).update(sharedSecret).digest();
  const ikm = hkdfExpand(prkKey, Buffer.concat([Buffer.from('WebPush: info\0'), p256dh, senderPub]), 32);
  const prk = createHmac('sha256', salt).update(ikm).digest();
  const cek = hkdfExpand(prk, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdfExpand(prk, Buffer.from('Content-Encoding: nonce\0'), 12);
  const plaintext = Buffer.concat([Buffer.from(payloadStr), Buffer.from([0x02])]);
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([senderPub.length]), senderPub, ciphertext, tag]);
}
function postToEndpoint(endpoint, headers, body) {
  return new Promise((resolve, reject) => {
    const { hostname, pathname, search } = new URL(endpoint);
    const req = httpsRequest(
      { hostname, path: pathname + (search || ''), method: 'POST', headers: { ...headers, 'Content-Length': body.length } },
      (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // Allow GET (from cron) or POST (for manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  try {
    const { VAPID_PUBLIC_KEY: pubKey, VAPID_PRIVATE_KEY: privKey } = process.env;

    // Get this weekend's range (Saturday 00:00 to Sunday 23:59 UTC)
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
    const daysUntilSat = day === 6 ? 0 : (6 - day + 7) % 7 || 7;
    const saturday = new Date(now);
    saturday.setUTCDate(now.getUTCDate() + daysUntilSat);
    saturday.setUTCHours(0, 0, 0, 0);
    const endOfSunday = new Date(saturday);
    endOfSunday.setUTCDate(saturday.getUTCDate() + 2);

    // Fetch weekend events
    const { data: weekendEvents } = await supabase
      .from('events')
      .select('id, title, category, emoji, time')
      .gte('time', saturday.toISOString())
      .lt('time', endOfSunday.toISOString());

    if (!weekendEvents || weekendEvents.length === 0) return res.status(200).json({ ok: true, reason: 'No weekend events' });

    // Get all users with push subscriptions + their interests
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription');

    if (!subs || subs.length === 0) return res.status(200).json({ ok: true, sent: 0 });

    const userIds = [...new Set(subs.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, interests')
      .in('id', userIds);

    const interestMap = {};
    (profiles || []).forEach(p => { interestMap[p.id] = p.interests || []; });

    let sent = 0;
    await Promise.all(subs.map(async ({ user_id, subscription }) => {
      const interests = interestMap[user_id] || [];
      const matching = weekendEvents.filter(e => !interests.length || interests.includes(e.category));
      if (matching.length === 0) return;

      const title = matching.length === 1
        ? `${matching[0].emoji} ${matching[0].title} this weekend`
        : `🎉 ${matching.length} events this weekend match your interests`;
      const body = matching.length === 1
        ? 'Tap to see details and request a spot'
        : `${matching.map(e => e.emoji + ' ' + e.title.split(' ').slice(0, 3).join(' ')).slice(0, 2).join(', ')}${matching.length > 2 ? ' and more' : ''}`;

      try {
        await supabase.from('notifications').insert({
          user_id,
          type: 'weekend_digest',
          title,
          body,
          data: { event_id: String(matching[0].id) },
        });

        const encrypted = encryptPayload(subscription, JSON.stringify({ title, body }));
        const jwt = makeVapidJWT(subscription.endpoint, privKey);
        await postToEndpoint(subscription.endpoint, {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'TTL': '86400',
          'Authorization': `vapid t=${jwt},k=${pubKey}`,
        }, encrypted);
        sent++;
      } catch (e) {
        console.error('Weekend digest push error for user', user_id, e.message);
      }
    }));

    res.status(200).json({ ok: true, sent, weekendEvents: weekendEvents.length });
  } catch (err) {
    console.error('notify-weekend error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
