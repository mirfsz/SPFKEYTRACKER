const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scryptSync } = require('node:crypto');
const { createHandler } = require('../api/support');

function fixture() {
  const values = new Map();
  const mail = [];
  const now = Date.parse('2026-12-02T04:00:00Z');
  const password = 'test-only-password';
  const env = { UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'test', RESEND_API_KEY: 'test', SUPPORT_FROM_EMAIL: 'test@example.com', SUPPORT_SITE_URL: 'https://site.test', SUPPORT_PASSWORD_HASH: `salt:${scryptSync(password, 'salt', 64).toString('hex')}` };
  const request = async (url, options) => {
    const body = JSON.parse(options.body);
    if (url.includes('resend.com')) { mail.push(body); return { ok: true }; }
    const [command, ...args] = body;
    let result;
    if (command === 'GET') result = values.get(args[0]) || null;
    if (command === 'SET') { values.set(args[0], args[1]); result = 'OK'; }
    if (command === 'DEL') result = values.delete(args[0]);
    if (command === 'EVAL' && args[1] === '1') { result = Number(values.get(args[2]) || 0) + 1; values.set(args[2], result); }
    if (command === 'EVAL' && args[1] === '3') {
      const [, , tokenKey, receiptKey, deadlineKey, deadline, initial] = args;
      if (!values.has(tokenKey)) result = 'used';
      else if (values.has(receiptKey)) result = 'duplicate';
      else if ((values.get(deadlineKey) || initial) > deadline) result = 'older';
      else { values.set(receiptKey, 'verified'); values.set(deadlineKey, deadline); values.delete(tokenKey); result = 'ok'; }
    }
    return { ok: true, json: async () => ({ result }) };
  };
  const handler = createHandler({ env, request, clock: () => now });
  const invoke = async (action, body, method = 'POST', query = {}) => {
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; }, send(value) { this.body = value; return this; } };
    await handler({ method, query: { action, ...query }, body, headers: { origin: env.SUPPORT_SITE_URL, 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' } }, res);
    return res;
  };
  const notify = async reference => {
    const response = await invoke('notify', { reference, amount: 5 });
    assert.equal(response.statusCode, 200);
    return mail.at(-1).text.match(/token=([a-f0-9]{64})/)[1];
  };
  return { invoke, notify, mail, values, password };
}

test('notification email goes only to developer; opening link cannot reset timer', async () => {
  const f = fixture();
  const token = await f.notify('BANK-1234');
  assert.deepEqual(f.mail[0].to, ['irfanmirzan@gmail.com']);
  const review = await f.invoke('review', null, 'GET', { token });
  assert.equal(review.statusCode, 200);
  assert(review.body.includes('Developer password'));
  assert(!f.values.has('support:deadline'));
});

test('wrong password cannot reset; approved payment resets once for everyone', async () => {
  const f = fixture();
  const token = await f.notify('BANK-5678');
  const body = { token, password: 'wrong', verified: 'yes', receivedAt: '2026-12-02T11:00' };
  assert.equal((await f.invoke('approve', body)).statusCode, 403);
  assert(!f.values.has('support:deadline'));
  body.password = f.password;
  assert.equal((await f.invoke('approve', body)).statusCode, 200);
  assert.equal(f.values.get('support:deadline'), '2026-12-16T03:00:00.000Z');
  assert.equal((await f.invoke('approve', body)).statusCode, 410);
  assert.equal((await f.invoke('status', null, 'GET')).body.deadline, '2026-12-16T03:00:00.000Z');
});

test('same bank reference cannot be approved via a second notification', async () => {
  const f = fixture();
  const first = await f.notify('BANK-9999');
  const details = { password: f.password, verified: 'yes', receivedAt: '2026-12-02T11:00' };
  assert.equal((await f.invoke('approve', { ...details, token: first })).statusCode, 200);
  const second = await f.notify('BANK-9999');
  assert.equal((await f.invoke('approve', { ...details, token: second })).statusCode, 409);
});

test('notification throttling and invalid amounts are enforced', async () => {
  const f = fixture();
  assert.equal((await f.invoke('notify', { reference: 'BANK-0000', amount: 1 })).statusCode, 400);
  await f.notify('BANK-0001');
  await f.notify('BANK-0002');
  assert.equal((await f.invoke('notify', { reference: 'BANK-0003', amount: 5 })).statusCode, 429);
});
