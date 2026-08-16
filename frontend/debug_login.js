const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API RESPONSE: ${response.url()} ${response.status()}`);
    }
  });

  console.log("Navigating to http://localhost:3000");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  console.log("Filling form...");
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');

  console.log("Clicking login...");
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'login_debug.png' });
  console.log("Saved screenshot to login_debug.png");
  
  await browser.close();
})();
