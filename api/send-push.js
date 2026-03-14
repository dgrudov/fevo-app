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
  const pld = b64encode(Buffer.from(JSON.stringify({ aud: `${protocol}//${host}`, exp: now + 43200, sub: 'mailto:admin@gruvio.app' })));
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, title, body, eventId } = req.body;
  if (!userId || !title) return res.status(400).json({ error: 'Missing fields' });
  try {
    // If eventId provided (chat message), skip push if unread notification already exists
    if (eventId) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'new_message')
        .eq('read', false)
        .filter('data->>event_id', 'eq', String(eventId))
        .maybeSingle();
      if (existing) return res.status(200).json({ ok: true, skipped: true });
    }

    const { data: subs, error } = await supabase.from('push_subscriptions').select('subscription').eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    if (!subs || subs.length === 0) return res.status(200).json({ ok: true, sent: 0 });
    const { VAPID_PUBLIC_KEY: pubKey, VAPID_PRIVATE_KEY: privKey } = process.env;
    await Promise.all(subs.map(async ({ subscription }) => {
      try {
        const encrypted = encryptPayload(subscription, JSON.stringify({ title, body }));
        const jwt = makeVapidJWT(subscription.endpoint, privKey);
        const status = await postToEndpoint(subscription.endpoint, {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'TTL': '86400',
          'Authorization': `vapid t=${jwt},k=${pubKey}`,
        }, encrypted);
        console.log('Push status:', status);
      } catch (e) { console.error('Push send error:', e.message); }
    }));
    res.status(200).json({ ok: true, sent: subs.length });
  } catch (err) {
    console.error('Handler error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
