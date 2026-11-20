// Developer recovery command: run only after independently checking the transfer in your bank.
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const value = name => args[args.indexOf(name) + 1];
if (!args.includes('--confirmed') || !args.includes('--received-at')) {
  console.error('After confirming receipt of S$5 or more, run: node scripts/confirm-support.cjs --confirmed --received-at 2026-11-20T12:00:00+08:00');
  process.exit(1);
}
const received = Date.parse(value('--received-at'));
if (!Number.isFinite(received) || received > Date.now()) {
  console.error('Provide a valid receipt time, with timezone, that is not in the future.');
  process.exit(1);
}
const file = path.join(__dirname, '../public/support.json');
const current = JSON.parse(fs.readFileSync(file, 'utf8'));
const deadline = new Date(received + 14 * 86400000).toISOString();
if (Date.parse(deadline) <= Date.parse(current.deadline)) {
  console.error('This receipt would not extend the existing deadline. No changes made.');
  process.exit(1);
}
fs.writeFileSync(file, `${JSON.stringify({ deadline }, null, 2)}\n`);
console.log(`Confirmed. New deadline: ${deadline}. Build and publish the updated support.json to apply this date for everyone.`);
