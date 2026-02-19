const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Gehe zu Arena.ai
  await page.goto('https://arena.ai');
  await page.waitForTimeout(5000);
  
  // Suche nach Model Selector und wähle Opus 4.6
  const modelButton = await page.$('text=claude') || await page.$('[data-testid="model-selector"]');
  if (modelButton) {
    await modelButton.click();
    await page.waitForTimeout(1000);
    
    // Wähle Opus 4.6
    const opusOption = await page.$('text=opus-4-6') || await page.$('text=thinking');
    if (opusOption) await opusOption.click();
  }
  
  // Lese Code Files
  const fs = require('fs');
  const files = [
    'src/screens/OnboardingScreen.js',
    'src/screens/MainScreen.js',
    'src/services/AudioMonitorService.js',
    'src/services/AudioClassificationService.js',
    'src/services/PDFReportService.js',
    'src/services/DatabaseService.js'
  ];
  
  let codeContent = '';
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      codeContent += `\n=== ${file} ===\n${content.substring(0, 3000)}\n`;
    } catch (e) {}
  }
  
  // Finde Chat Input
  const textarea = await page.$('textarea');
  if (textarea) {
    await textarea.fill(`Review this React Native code for SilenceNow MVP. Find ALL errors: syntax errors, missing imports, undefined variables, wrong React Native usage, logic bugs.

${codeContent}

List every error with file path and line number.`);
    
    await textarea.press('Enter');
    await page.waitForTimeout(30000);
    
    // Speichere Antwort
    const response = await page.$eval('.response, .message, [data-testid="message"]', el => el.textContent).catch(() => 'No response found');
    fs.writeFileSync('arena_review.txt', response);
    console.log(response);
  }
  
  await browser.close();
})();
