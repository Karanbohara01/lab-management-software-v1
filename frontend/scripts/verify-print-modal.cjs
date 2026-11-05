const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"], input#username, input[type="text"]', 'superadmin');
  await page.fill('input[name="password"], input#password, input[type="password"]', 'Passw0rd!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 15000 });

  // Patient detail page -> print-emulate to see the PatientCard's brand colors
  await page.goto('http://localhost:5173/app/patients/112215', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(500);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/.verify-shots/print-patientcard.png', fullPage: true });
  await page.emulateMedia({ media: 'screen' });

  // Open a modal: Register patient quick-register from the Patients list
  await page.goto('http://localhost:5173/app/patients', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const regBtn = page.locator('button, a').filter({ hasText: /Register patient/i }).first();
  if (await regBtn.count()) {
    await regBtn.click();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: 'scripts/.verify-shots/register-page-or-modal.png', fullPage: false });

  await browser.close();
})().catch((err) => { console.error('FATAL', err); process.exit(1); });
