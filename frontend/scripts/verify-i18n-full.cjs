const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const shots = [];
const errors = [];

async function shot(page, name) {
  const path = `scripts/.verify-shots/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  shots.push(path);
}

function checkOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

const PAGES = [
  ['06-dashboard', '/app'],
  ['07-orders', '/app/orders'],
  ['08-samples', '/app/samples'],
  ['09-results', '/app/results'],
  ['10-reports', '/app/reports'],
  ['11-invoices', '/app/invoices'],
  ['12-inventory', '/app/inventory'],
  ['13-test-catalog', '/app/tests'],
  ['13b-reflex-rules', '/app/reflex-rules'],
  ['13c-parameter-master', '/app/platform/master-tests'],
  ['14-appointments', '/app/appointments'],
  ['15-doctors', '/app/doctors'],
  ['16-departments', '/app/departments'],
  ['17-branches', '/app/branches'],
  ['18-users', '/app/users'],
  ['18b-roles', '/app/roles'],
  ['19-audit', '/app/audit'],
  ['20-settings', '/app/settings'],
  ['21-qc', '/app/qc'],
  ['22-revenue', '/app/revenue'],
  ['23-commission', '/app/commission'],
  ['24-ird', '/app/ird'],
  ['25-notifications', '/app/notifications'],
  ['26-analytics', '/app/analytics'],
  ['27-backups', '/app/backups'],
  ['28-help', '/app/help'],
  ['29-platform', '/app/platform'],
  ['30-purchase-orders', '/app/purchase-orders'],
  ['31-suppliers', '/app/suppliers'],
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console] ${page.url()} :: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${page.url()} :: ${err.message}`));

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="username"], input#username, input[type="text"]', 'superadmin');
  await page.fill('input[name="password"], input#password, input[type="password"]', 'Passw0rd!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('lims-locale', 'ne'));

  const report = [];

  for (const [name, path] of PAGES) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(400);
      const overflow = await checkOverflow(page);
      const h1 = await page.locator('h1').first().innerText().catch(() => '(no h1)');
      const bodySample = await page.evaluate(() => document.querySelector('main')?.innerText?.slice(0, 400) || document.body.innerText.slice(0, 400));
      await shot(page, name);
      report.push({ path, h1, overflow, bodySample: bodySample.split('\n').filter(Boolean).slice(0, 10) });
    } catch (err) {
      report.push({ path, error: String(err) });
    }
  }

  console.log('=== REPORT ===');
  for (const r of report) {
    console.log(JSON.stringify(r));
  }
  console.log('=== CONSOLE/PAGE ERRORS ===');
  console.log(JSON.stringify(errors));
  console.log('=== SHOTS ===');
  console.log(JSON.stringify(shots));

  await browser.close();
})().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
