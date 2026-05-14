const { chromium } = require('playwright');
const path = require('path');

const inputFile = process.argv[2];
const outputDir = process.argv[3];
const prefix = process.argv[4];
const pages = parseInt(process.argv[5]) || 3;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const filePath = path.resolve(inputFile);
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Wait for animations to settle on first page
  await page.waitForTimeout(1000);

  // Screenshot page 1
  await page.screenshot({
    path: path.join(outputDir, `${prefix}-01.png`),
    fullPage: false,
  });
  console.log(`Captured ${prefix}-01.png`);

  // Navigate through pages using arrow keys
  for (let i = 2; i <= pages; i++) {
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1500); // wait for transition animation

    await page.screenshot({
      path: path.join(outputDir, `${prefix}-${String(i).padStart(2, '0')}.png`),
      fullPage: false,
    });
    console.log(`Captured ${prefix}-${String(i).padStart(2, '0')}.png`);
  }

  await browser.close();
  console.log('Done');
})();
