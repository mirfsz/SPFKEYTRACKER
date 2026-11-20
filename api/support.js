const { randomBytes, createHash, scryptSync, timingSafeEqual } = require('node:crypto');
const initial = require('../public/support.json');
const DAY = 86400000;
const digest = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function verifyPassword(password, encoded) {
  try {
    const [salt, hash] = encoded.split(':');
    const expected = Buffer.from(hash, 'hex');
    if (typeof password !== 'string' || password.length > 200 || expected.length !== 64) return false;
    return timingSafeEqual(scryptSync(password, salt, 64), expected);
  } catch { return false; }
}

function createHandler({ env = process.env, request = fetch, clock = Date.now } = {}) {
  const configured = () => ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'RESEND_API_KEY', 'SUPPORT_PASSWORD_HASH', 'SUPPORT_SITE_URL', 'SUPPORT_FROM_EMAIL'].every(key => Boolean(env[key]));
  async function redis(...command) {
    const response = await request(env.UPSTASH_REDIS_REST_URL, {
      method: 'POST', headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command), signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error('Storage unavailable');
    return data.result;
  }
  async function limit(key, maximum, seconds) {
    const count = await redis('EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n", '1', key, String(seconds));
    return Number(count) <= maximum;
  }
  const html = (res, title, body, status = 200) => res.status(status).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escape(title)} · Key board</title><style>body{margin:0;background:#f2f2f2;color:#000;font:15px/1.6 Helvetica,Arial,sans-serif}main{max-width:460px;margin:10vh auto;padding:28px;border:1px solid #fff;border-radius:28px;background:linear-gradient(160deg,#ffffffef,#ffffffac);box-shadow:0 20px 60px -48px #0007}h1{font-size:32px;line-height:1.1;letter-spacing:-.04em}label{display:block;margin:18px 0}input{display:block;box-sizing:border-box;width:100%;padding:14px;margin-top:6px;border:1px solid #ccc;border-radius:12px;font:inherit}button{background:#000;color:#fff;border:0;border-radius:30px;padding:15px 22px;font:700 14px Helvetica;cursor:pointer}small{color:#626262}a{color:inherit}@media(max-width:520px){main{margin:24px 12px;padding:22px}}</style></head><body><main><small>Key board · Developer verification</small><h1>${escape(title)}</h1>${body}</main></body></html>`);

  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    const action = req.query?.action || 'status';
    if (!configured()) {
      if (action === 'status') return res.status(200).json({ deadline: initial.deadline, notificationsAvailable: false });
      return res.status(503).json({ error: 'Payment notifications are not connected yet. Please try again later.' });
    }
    try {
      const origin = new URL(env.SUPPORT_SITE_URL).origin;
      const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      if (req.method === 'GET' && action === 'status') {
        const deadline = await redis('GET', 'support:deadline');
        return res.status(200).json({ deadline: deadline || initial.deadline, notificationsAvailable: true });
      }
      if (req.method === 'POST') {
        if (req.headers.origin !== origin) return res.status(403).json({ error: 'Request origin not allowed.' });
        if (Number(req.headers['content-length'] || 0) > 4096) return res.status(413).json({ error: 'Request too large.' });
      }
      let body = req.body || {};
      if (typeof body === 'string') {
        if (body.length > 4096) return res.status(413).json({ error: 'Request too large.' });
        body = req.headers['content-type']?.includes('application/json') ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
      }
      if (action === 'notify' && req.method === 'POST') {
        if (!await limit(`support:notify:${digest(ip)}`, 3, 3600) || !await limit('support:notify:global', 30, 3600)) return res.status(429).json({ error: 'Too many notifications. Please try again later.' });
        const reference = String(body.reference || '').trim();
        const amount = Number(body.amount);
        if (!/^[\w .\/-]{4,80}$/.test(reference) || !Number.isFinite(amount) || amount < 5 || amount > 10000) return res.status(400).json({ error: 'Enter a payment reference and an amount of at least S$5.' });
        const token = randomBytes(32).toString('hex');
        const tokenKey = `support:review:${digest(token)}`;
        const record = { reference, amount, notifiedAt: new Date(clock()).toISOString() };
        await redis('SET', tokenKey, JSON.stringify(record), 'EX', String(7 * 86400));
        const link = `${origin}/api/support?action=review&token=${token}`;
        const response = await request('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: env.SUPPORT_FROM_EMAIL, to: ['irfanmirzan@gmail.com'], subject: 'Key board: review a PayNow payment',
            text: `A visitor reports a PayNow payment of S$${amount.toFixed(2)}.\nReference: ${reference}\n\nThis is an unverified claim. Check your banking app before approving.\n\nReview: ${link}\n\nThe link expires in 7 days and requires your developer password. Opening it does not reset the timer.` }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) { await redis('DEL', tokenKey); return res.status(502).json({ error: 'Email could not be sent. Please try again later.' }); }
        return res.status(200).json({ message: 'Developer notified. The timer resets after your payment is verified.' });
      }
      const token = String(req.query?.token || body.token || '');
      if (!/^[a-f0-9]{64}$/.test(token)) return html(res, 'Invalid review link', '<p>Use the review link in the payment notification email.</p>', 400);
      const tokenKey = `support:review:${digest(token)}`;
      const stored = await redis('GET', tokenKey);
      if (!stored) return html(res, 'Link unavailable', '<p>This link has expired or was already used.</p>', 410);
      const record = JSON.parse(stored);
      if (action === 'review' && req.method === 'GET') {
        return html(res, 'Verify the payment', `<p>A visitor reports <strong>S$${escape(record.amount)}</strong>.</p><p>Reference: <strong>${escape(record.reference)}</strong></p><p>Check the transfer in your banking app, then enter its actual receipt time and your developer password.</p><form method="post" action="/api/support?action=approve"><input type="hidden" name="token" value="${token}"><label>Receipt date and time (Singapore)<input type="datetime-local" name="receivedAt" required></label><label>Developer password<input type="password" name="password" autocomplete="current-password" required maxlength="200"></label><label><input style="width:auto;display:inline" type="checkbox" name="verified" value="yes" required> I verified this payment in my banking app.</label><button type="submit">Confirm payment & reset timer</button></form><p><small>The timer resets to 14 days after receipt. Each review link can be used once.</small></p>`);
      }
      if (action === 'approve' && req.method === 'POST') {
        if (!await limit(`support:attempts:${digest(ip)}`, 5, 900) || !await limit(`${tokenKey}:attempts`, 10, 3600)) return html(res, 'Try again later', '<p>Too many attempts. Wait 15 minutes before trying again.</p>', 429);
        if (!verifyPassword(body.password, env.SUPPORT_PASSWORD_HASH)) return html(res, 'Password incorrect', '<p>Return to the email link and try again.</p>', 403);
        const received = /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(body.receivedAt || '') ? Date.parse(`${body.receivedAt}:00+08:00`) : NaN;
        if (body.verified !== 'yes' || !Number.isFinite(received) || received > clock() || received < clock() - 14 * DAY) return html(res, 'Check receipt time', '<p>Enter the actual Singapore receipt time within the last 14 days and confirm bank verification.</p>', 400);
        const deadline = new Date(received + 14 * DAY).toISOString();
        const result = await redis('EVAL', "if not redis.call('GET',KEYS[1]) then return 'used' end; if redis.call('EXISTS',KEYS[2])==1 then return 'duplicate' end; local current=redis.call('GET',KEYS[3]) or ARGV[2]; if current>ARGV[1] then return 'older' end; redis.call('SET',KEYS[2],'verified'); redis.call('SET',KEYS[3],ARGV[1]); redis.call('DEL',KEYS[1]); return 'ok'", '3', tokenKey, `support:receipt:${digest(record.reference.toLowerCase())}`, 'support:deadline', deadline, initial.deadline);
        if (result !== 'ok') return html(res, 'Timer unchanged', '<p>This payment was already confirmed, this link was used, or its receipt time would shorten the current deadline.</p>', 409);
        return html(res, 'Timer reset', `<p>Payment verified. The new deadline is <strong>${escape(new Date(deadline).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }))} SGT</strong>.</p><p>Visitors see the updated date within a minute.</p><a href="/">Back to Key board</a>`);
      }
      return res.status(405).json({ error: 'Method not allowed.' });
    } catch {
      return res.status(503).json({ error: 'Payment service temporarily unavailable. Please try again later.' });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.verifyPassword = verifyPassword;
