const puppeteer = require('puppeteer-core');
const assert = require('node:assert/strict');

(async () => {
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const click = async text => {
      await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
      const handle = await page.evaluateHandle(text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text), text);
      assert(handle.asElement(), `Button exists: ${text}`);
      await handle.asElement().click();
    };
    await page.goto('https://spfkeytracker.vercel.app/', { waitUntil: 'networkidle0' });
    const old = await page.evaluate(() => ({ keys: document.querySelectorAll('[data-key]').length, text: document.body.innerText }));
    assert(old.keys >= 54);
    assert(old.text.includes('GENERATE REPORT'));
    await page.evaluate(() => {
      window.capturedReport = '';
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.capturedReport = text; } }, configurable: true });
    });
    await click('GENERATE REPORT');
    await page.waitForFunction(() => window.capturedReport.includes('FOXTROT'));
    const oldReport = await page.evaluate(() => window.capturedReport);
    assert(oldReport.includes('ALPHA1') && oldReport.includes('DELTA'));
    console.log('PASS old site: 54-key board and all-company report verified');

    await page.setViewport({ width: 1100, height: 1000 });
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
    await page.click('[data-key="11"]');
    await page.select('select', 'ECHO');
    await page.click('[data-key="51"]');
    await page.select('select', 'CHARLIE');
    assert(await page.$('[data-key="11"].out'));
    const center = async number => {
      const box = await (await page.$(`[data-key="${number}"]`)).boundingBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const start = await center(11), end = await center(16);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 18 });
    await page.mouse.up();
    assert.equal(await page.$$eval('.key-tile.selected', keys => keys.length), 6);
    await click('Draw out');
    await click('Preview report');
    const report = await page.$eval('textarea', input => input.value);
    assert.equal((report.match(/54 keys in total/g) || []).length, 9);
    assert(report.includes('Drawn: 11–16 (6 keys)'));
    assert(report.includes('• Level 1 classroom'));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('blocked'); } }, configurable: true }));
    await click('Copy report');
    assert(await page.$('textarea'), 'Manual copy remains available after clipboard failure');
    await click('×');
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$$eval('.key-tile.out', keys => keys.length), 6);
    console.log('PASS local: company isolation, drag, bulk action, classroom report, clipboard fallback, reload persistence');

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 900 });
      const layout = await page.evaluate(() => {
        const select = document.querySelector('select').getBoundingClientRect();
        const arrow = document.querySelector('.company-chevron').getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth > innerWidth, offset: Math.abs(select.y + select.height / 2 - arrow.y - arrow.height / 2) };
      });
      assert(!layout.overflow, `No overflow at ${width}px`);
      assert(layout.offset < 1, `Chevron centered at ${width}px`);
    }
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.reload({ waitUntil: 'networkidle0' });
    await click('Select keys');
    await page.tap('[data-key="11"]');
    await click('Return');
    assert(await page.$('[data-key="11"].in'));
    await click('Manage keys');
    await page.tap('[data-key="3"]');
    await click('Set usable');
    await click('Done');
    assert(await page.$('[data-key="3"].in'));
    await page.screenshot({ path: '/tmp/key-board-audit-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS local: phone bulk return, grey-key recovery, 320–1440px layout, arrow alignment, no runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
