const puppeteer = require('puppeteer-core');
const assert = require('node:assert/strict');
(async () => {
  const browser = await puppeteer.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
    assert(await page.$('[role="timer"]'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    await page.click('.upkeep-link');
    await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
    assert((await page.$eval('.sheet .paynow-number', e => e.textContent)).includes('8481 0703'));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copiedNumber = text; } }, configurable: true }));
    await page.click('.paynow-number button');
    assert.equal(await page.evaluate(() => window.copiedNumber), '84810703');
    await page.screenshot({ path: '/tmp/key-board-support.png', fullPage: true });
    await page.setRequestInterception(true);
    page.on('request', request => request.url().endsWith('/support.json') ? request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ deadline: '2020-01-01T00:00:00Z' }) }) : request.continue());
    await page.reload({ waitUntil: 'networkidle0' });
    assert((await page.$eval('.upkeep-copy h2', e => e.textContent)).includes('paused'));
    assert(await page.$('[inert]'));
    assert(!(await page.evaluate(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Preview report'))));
    await page.click('.bottom-bar button');
    assert(await page.$('.sheet .menu-row'));
    assert.deepEqual(errors, []);
    console.log('PASS support: countdown, phone layout, payment number copy, expiry pause, backup access, no runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
