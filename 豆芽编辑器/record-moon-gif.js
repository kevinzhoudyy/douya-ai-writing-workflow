const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Load moon landing page
  await page.goto('file:///Users/strongzwang/WorkBuddy/Claw/豆芽编辑器/moon-landing-history.html');
  await page.waitForTimeout(2000);

  // Check total slides
  const info = await page.evaluate(() => {
    const slides = document.querySelectorAll('.slide');
    return { total: slides.length, titles: Array.from(slides).map((s,i) => i + ':' + s.textContent.trim().substring(0,30)) };
  });
  console.log('Moon slides:', JSON.stringify(info.titles));

  // Navigate to a page with starfield effect - let's go to slide 2 or 3 for the narrative style
  // Press right to go to slide 2
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1000);

  // Check what slide we're on
  const cur = await page.evaluate(() => {
    const active = document.querySelector('.slide.active');
    return active ? active.textContent.trim().substring(0, 60) : 'none';
  });
  console.log('Current slide:', cur);

  // Let's try a few different slides to find one with good starfield effect
  // Go to slide 3 (press right again)
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1000);
  
  const cur3 = await page.evaluate(() => {
    const active = document.querySelector('.slide.active');
    return active ? active.textContent.trim().substring(0, 60) : 'none';
  });
  console.log('Slide 3:', cur3);

  // Record GIF from slide 3 - it should have the starfield background
  const dir = '/Users/strongzwang/WorkBuddy/Claw/豆芽编辑器/screenshots/gif-frames-moon';
  fs.mkdirSync(dir, { recursive: true });
  
  const frameCount = 50;
  const interval = 80;

  for (let i = 0; i < frameCount; i++) {
    const buffer = await page.screenshot({ type: 'png' });
    fs.writeFileSync(`${dir}/frame-${String(i).padStart(3, '0')}.png`, buffer);
    await page.waitForTimeout(interval);
  }

  console.log(`Captured ${frameCount} frames`);
  await browser.close();
})();
