const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';

async function shot(page, name) {
  await page.screenshot({ path: `scripts/.verify-shots/theme-${name}.png`, fullPage: true });
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  // 1. Landing page (unauthenticated, public) -- confirm it still looks exactly as before.
  const pub = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const ppage = await pub.newPage();
  ppage.on('pageerror', (e) => errors.push(`[landing] ${e}`));
  await ppage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await ppage.waitForTimeout(500);
  await shot(ppage, '01-landing');
  const primaryColorLanding = await ppage.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary'));
  console.log('LANDING --primary:', primaryColorLanding.trim());

  // 2. Login page (also forced-light / theme-lims)
  await ppage.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await ppage.waitForTimeout(300);
  await shot(ppage, '02-login');

  // 3. Authenticated app, light mode
  await ppage.fill('input[name="username"], input#username, input[type="text"]', 'superadmin');
  await ppage.fill('input[name="password"], input#password, input[type="password"]', 'Passw0rd!');
  await ppage.click('button[type="submit"]');
  await ppage.waitForURL(/\/app/, { timeout: 15000 });
  await ppage.waitForTimeout(500);
  const primaryColorApp = await ppage.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary'));
  console.log('APP (light) --primary:', primaryColorApp.trim());
  await shot(ppage, '03-dashboard-light');

  for (const [name, path] of [
    ['patients', '/app/patients'],
    ['orders', '/app/orders'],
    ['sales-book', '/app/sales-book'],
    ['settings', '/app/settings'],
  ]) {
    await ppage.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await ppage.waitForTimeout(400);
    await shot(ppage, `04-${name}-light`);
  }

  // open a modal (Register patient) and a dropdown menu to check those surfaces
  await ppage.goto(`${BASE}/app/patients`, { waitUntil: 'networkidle' });
  await ppage.waitForTimeout(300);
  await shot(ppage, '05-patients-list-light');

  // 4. Dark mode
  await ppage.evaluate(() => localStorage.setItem('lims-theme', 'dark'));
  await ppage.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await ppage.waitForTimeout(500);
  const primaryColorDark = await ppage.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary'));
  console.log('APP (dark) --primary:', primaryColorDark.trim());
  await shot(ppage, '06-dashboard-dark');

  for (const [name, path] of [
    ['patients', '/app/patients'],
    ['orders', '/app/orders'],
  ]) {
    await ppage.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await ppage.waitForTimeout(400);
    await shot(ppage, `07-${name}-dark`);
  }

  // 5. Mobile width, light mode
  await ppage.evaluate(() => localStorage.setItem('lims-theme', 'light'));
  await ppage.setViewportSize({ width: 390, height: 844 });
  await ppage.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await ppage.waitForTimeout(400);
  const overflowMobile = await ppage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  console.log('MOBILE overflow:', overflowMobile);
  await shot(ppage, '08-dashboard-mobile');

  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
