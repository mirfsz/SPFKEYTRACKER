# Key board

Version 2 is a phone-first rewrite of the SPF key tracker using the Starchy System.

## What changed

- A key's condition (`usable` or `unusable`) is separate from its location (`in fridge` or `drawn out`).
- OB ICs can select one or more keys in **Manage keys** and change their condition themselves.
- Unusable keys can be labelled missing, spoiled, no key, or other.
- Charlie is seeded from the supplied 205 C1 list.
- Conflicting entries in the supplied Delta lists are flagged **Needs review** rather than silently overwritten.
- Reports can be previewed before copying.
- Local records can be exported and restored as a JSON handover backup.

## Local preview

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Verification

```bash
npm test -- --watchAll=false
npm run build
```

## Storage and deployment

## Upkeep countdown

The shared deadline is in `public/support.json`. The initial local preview ends on 4 December 2026 at 12:49 pm Singapore time. This date does not reset when visitors refresh. At expiry the app pauses tracking and automatic reports, while retaining saved records and backup access. It does not delete the Vercel deployment or device data.

Developer recovery command: after checking receipt of a PayNow payment of S$5 or more in your bank, run the following with the actual receipt timestamp:

```bash
node scripts/confirm-support.cjs --confirmed --received-at 2026-11-21T12:00:00+08:00
npm run build
```

Publish the updated build to apply the deadline to everyone. The command resets the deadline to 14 days after receipt; it never verifies a payment itself. A S$10 payment also resets to 14 days rather than stacking time. No public payment-confirmation button is provided. The app refreshes the deadline every minute. The notice uses “scheduled closure” and “paused” because the static app cannot remove its own hosting deployment.

### Email review and developer verification

The preferred workflow is **Notify Developer of payment** in Settings. The visitor submits the amount and bank transfer reference. `api/support.js` emails a random review link only to `irfanmirzan@gmail.com`. Opening the link does not change the deadline. After checking the bank transfer, the developer enters the receipt time in Singapore time, checks the verification box, and enters the developer password. The server consumes the link once and updates the shared Redis deadline immediately. Links expire after seven days. Bank reference reuse and repeated password guesses are rejected; notifications are rate-limited.

Configure the server variables from `.env.example` in Vercel. The salted developer password hash is stored in ignored `.env.local`; transfer that hash to `SUPPORT_PASSWORD_HASH` privately. No password belongs in React variables or source code. `SUPPORT_FROM_EMAIL` must be an approved Resend sender, and `SUPPORT_SITE_URL` must match the deployed origin. The server and sender are unconnected until those credentials are supplied. No automatic bank verification is performed.

Tests: `node --test scripts/test-support-api.cjs`. These use mocked email/storage and do not send messages. `python -m http.server` serves only the frontend; use Vercel development for live API routes. Once Redis is connected, the recovery command changes only the fallback date; normal renewals should use email review.

This branch is intentionally a local preview. Version 2 records are stored in the browser under `spf-key-tracker-v2`, so they persist on one device but do not yet sync between phones.

Before production deployment, connect the same UI to a shared database and protect management actions with an admin login or company passcode. The current Flask files are legacy code and are not used by the Vercel React deployment.
