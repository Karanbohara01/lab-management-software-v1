const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"], input#username, input[type="text"]', 'superadmin');
  await page.fill('input[name="password"], input#password, input[type="password"]', 'Passw0rd!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('lims-locale', 'ne'));

  const pages = ['/app', '/app/orders', '/app/catalog/tests'.replace('catalog/tests', 'tests'), '/app/inventory', '/app/revenue'];
  for (const [i, path] of pages.entries()) {
    await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    console.log(path, 'overflow:', overflow);
    await page.screenshot({ path: `scripts/.verify-shots/mobile-${i}.png`, fullPage: true });
  }

  await browser.close();
})().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
