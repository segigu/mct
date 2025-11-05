const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 12'],
    viewport: { width: 390, height: 844 }
  });

  const page = await context.newPage();

  // Navigate to the survey
  await page.goto('file://' + __dirname + '/index.html');

  console.log('📱 Page loaded with iPhone 12 viewport');

  // Wait for page to be ready
  await page.waitForTimeout(1000);

  // Check if --vh CSS variable is set
  const vhValue = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--vh');
  });
  console.log('✅ CSS variable --vh:', vhValue);

  // Check fixedSlideHeight
  const slideHeight = await page.evaluate(() => {
    return window.fixedSlideHeight;
  });
  console.log('✅ Fixed slide height:', slideHeight);

  // Check initial transform
  const initialTransform = await page.evaluate(() => {
    const container = document.getElementById('questionsContainer');
    return container.style.transform;
  });
  console.log('✅ Initial transform:', initialTransform);

  // Find first text input or textarea
  const input = await page.locator('.answer-input').first();
  const inputExists = await input.count() > 0;

  if (inputExists) {
    console.log('✅ Found input field');

    // Focus on input
    await input.focus();
    console.log('📝 Input focused');

    // Type some text
    await input.fill('Test answer from mobile viewport');
    console.log('✅ Text entered');

    await page.waitForTimeout(500);

    // Check scroll positions after focus
    const scrollInfo = await page.evaluate(() => {
      const slides = Array.from(document.querySelectorAll('.question-slide'));
      return {
        window: { x: window.scrollX, y: window.scrollY },
        body: document.body.scrollTop,
        slides: slides.map(s => s.scrollTop)
      };
    });
    console.log('📊 Scroll positions after focus:', JSON.stringify(scrollInfo, null, 2));

    // Blur input (simulate keyboard close)
    await page.evaluate(() => {
      document.activeElement.blur();
    });
    console.log('🔽 Input blurred (simulating keyboard close)');

    await page.waitForTimeout(500);

    // Check scroll positions after blur
    const scrollInfoAfter = await page.evaluate(() => {
      const slides = Array.from(document.querySelectorAll('.question-slide'));
      return {
        window: { x: window.scrollX, y: window.scrollY },
        body: document.body.scrollTop,
        slides: slides.map(s => s.scrollTop)
      };
    });
    console.log('📊 Scroll positions after blur:', JSON.stringify(scrollInfoAfter, null, 2));

    // Verify scroll was reset
    if (scrollInfoAfter.window.y === 0 && scrollInfoAfter.slides.every(s => s === 0)) {
      console.log('✅ SUCCESS: Scroll positions reset correctly!');
    } else {
      console.log('⚠️  WARNING: Scroll positions not fully reset');
    }
  } else {
    console.log('⚠️  No input field found on first question');
  }

  // Try navigating to next question
  await page.click('#nextBtn');
  console.log('➡️  Navigated to next question');

  await page.waitForTimeout(500);

  const newTransform = await page.evaluate(() => {
    const container = document.getElementById('questionsContainer');
    return container.style.transform;
  });
  console.log('✅ Transform after navigation:', newTransform);

  // Take screenshot
  await page.screenshot({ path: '/home/user/mct/mobile-test.png' });
  console.log('📸 Screenshot saved to mobile-test.png');

  await browser.close();
  console.log('\n✅ Mobile test completed!');
})();
