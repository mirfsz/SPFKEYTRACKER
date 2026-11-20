import React, { useEffect, useState } from 'react';

export function remainingTime(deadline, now) {
  const seconds = Math.max(0, Math.floor((Date.parse(deadline) - now) / 1000));
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
}

export default function SupportUpkeep({ deadline, expanded = false, onExpand, onExpired }) {
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const notifyDeveloper = async event => {
    event.preventDefault();
    setSending(true);
    setNotice('');
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/support?action=notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference: fields.get('reference'), amount: fields.get('amount') }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setNotice(result.message);
      setNotifyOpen(false);
    } catch (error) { setNotice(error.message?.startsWith('Unexpected') ? 'Payment notifications are not connected yet. Please try again later.' : error.message || 'Could not notify the developer. Please try again.'); }
    finally { setSending(false); }
  };
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  const expired = Boolean(deadline && now >= Date.parse(deadline));
  useEffect(() => { onExpired?.(expired); }, [expired, onExpired]);
  const dateLabel = deadline && new Date(deadline).toLocaleString('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const copy = async () => {
    try { await navigator.clipboard.writeText('84810703'); setCopied(true); }
    catch (error) { setCopied(false); }
  };
  return (
    <section className={`upkeep-panel ${expanded ? 'expanded' : ''}`} aria-label="Site upkeep">
      <div className="upkeep-top">
        <svg className={`hourglass ${expired ? 'stopped' : ''}`} viewBox="0 0 64 80" fill="none" aria-hidden="true">
          <path d="M13 7h38M13 73h38M18 9v11c0 11 14 15 14 20S18 49 18 60v11M46 9v11c0 11-14 15-14 20s14 9 14 20v11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path className="sand-upper" d="M23 20h18c0 7-9 11-9 15S23 27 23 20Z" fill="currentColor" />
          <path className="sand-stream" d="M32 40v17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 4" />
          <path d="M22 66c0-5 10-10 10-10s10 5 10 10H22Z" fill="currentColor" />
        </svg>
        <div className="upkeep-copy"><p className="company-kicker">Keep Key board running</p><h2>{expired ? 'Key board has paused' : 'Two weeks. Keep it going.'}</h2></div>
      </div>
      {deadline ? <>
        <div className="upkeep-countdown" role="timer" aria-label={expired ? 'Countdown ended' : `Time until ${dateLabel} Singapore time`}>
          {remainingTime(deadline, now).map((value, index) => <div key={index}><strong>{String(value).padStart(2, '0')}</strong><span>{['days', 'hours', 'minutes', 'seconds'][index]}</span></div>)}
        </div>
        <p className="upkeep-message">{expired ? 'Tracking and report generation are paused. Until renewed, you’ll need to type the report manually. Your saved key records and backup remain available.' : 'This site is scheduled to close when the timer ends. Without renewal, you’ll need to type the nightly report manually.'}</p>
        <p className="upkeep-date">{expired ? 'Paused' : 'Scheduled closure'}: {dateLabel} SGT</p>
      </> : <p className="upkeep-message">Checking the current upkeep deadline…</p>}
      {expanded ? <div className="paynow-details">
        <p>Each S$5 PayNow payment resets the timer to 14 days from receipt, once the developer confirms it.</p>
        <div className="paynow-number"><div><span>PayNow mobile number</span><strong>8481 0703</strong></div><button onClick={copy}>{copied ? 'Copied' : 'Copy number'}</button></div>
        <p className="upkeep-footnote">Any amount is welcome. The timer resets for confirmed payments of S$5 or more. Confirm the recipient in your banking app before sending.</p>
        <button className="notify-payment" onClick={() => setNotifyOpen(!notifyOpen)} aria-expanded={notifyOpen}>Notify Developer of payment</button>
        {notifyOpen && <form className="payment-form" onSubmit={notifyDeveloper}>
          <p>Send your payment reference and amount to the developer at irfanmirzan@gmail.com for verification. Do not include bank account numbers or passwords.</p>
          <label>Amount paid (S$)<input name="amount" type="number" min="5" max="10000" step="0.01" defaultValue="5" required /></label>
          <label>Transfer reference<input name="reference" minLength="4" maxLength="80" required autoComplete="off" /></label>
          <button className="primary-action" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send payment notification'}</button>
        </form>}
        {notice && <p className="payment-notice" role="status">{notice}</p>}
      </div> : <button className="upkeep-link" onClick={onExpand}>Support upkeep <span aria-hidden="true">↗</span></button>}
    </section>
  );
}
