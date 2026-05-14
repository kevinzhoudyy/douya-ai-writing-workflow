const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Load the HTML file
  await page.goto('file:///Users/strongzwang/WorkBuddy/Claw/豆芽编辑器/高中物理-电磁学.html');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Navigate to slide 6 (index 5, since slides are 0-indexed)
  await page.evaluate(() => {
    const slides = document.querySelectorAll('.slide');
    // Find slide 6 - navigate by going through slides
    // First, let's see how navigation works
    const navDots = document.querySelectorAll('.nav-dot');
    // Check if there's a keyboard-based or click-based navigation
    return { slideCount: slides.length, navDotCount: navDots.length };
  });
  
  const info = await page.evaluate(() => {
    const slides = document.querySelectorAll('.slide');
    const slide6 = slides[5];
    return {
      totalSlides: slides.length,
      slide6Index: 5,
      slide6Title: slide6 ? slide6.textContent.substring(0, 50) : 'not found'
    };
  });
  console.log('Slides info:', info);
  
  // Try to navigate to slide 6 using keyboard
  // Press right arrow 5 times to go from slide 1 to slide 6
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(800);
  }
  
  // Verify current slide
  const currentSlide = await page.evaluate(() => {
    const active = document.querySelector('.slide.active');
    return active ? active.textContent.substring(0, 50) : 'no active slide';
  });
  console.log('Current slide after navigation:', currentSlide);
  
  // Wait for animations to play
  await page.waitForTimeout(2000);
  
  // Record GIF using page.screenshot in a loop
  // Playwright doesn't have native GIF recording, so we'll capture frames and use a separate tool
  // For now, let's capture multiple screenshots as frames
  
  const frames = [];
  const frameCount = 40; // ~3 seconds at ~13fps
  const interval = 75; // ms between frames
  
  for (let i = 0; i < frameCount; i++) {
    const buffer = await page.screenshot({ type: 'png' });
    frames.push(buffer);
    await page.waitForTimeout(interval);
  }
  
  // Save frames to disk
  const fs = require('fs');
  const dir = '/Users/strongzwang/WorkBuddy/Claw/豆芽编辑器/screenshots/gif-frames';
  fs.mkdirSync(dir, { recursive: true });
  
  for (let i = 0; i < frames.length; i++) {
    fs.writeFileSync(`${dir}/frame-${String(i).padStart(3, '0')}.png`, frames[i]);
  }
  
  console.log(`Captured ${frames.length} frames to ${dir}`);
  
  await browser.close();
})();
