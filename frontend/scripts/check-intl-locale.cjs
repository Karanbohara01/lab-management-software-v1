const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const result = await page.evaluate(() => {
    const d = new Date(2026, 10, 5);
    return {
      full: d.toLocaleDateString('ne-NP-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      short: d.toLocaleDateString('ne-NP-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' }),
      plainNe: d.toLocaleDateString('ne', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      supportedLocales: Intl.DateTimeFormat.supportedLocalesOf(['ne-NP-u-nu-latn', 'ne', 'ne-NP']),
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
