const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173');
  await page.click('text=AUTHENTICATE ENCLAVE');
  await page.waitForTimeout(1000);

  console.log("Navigating to Assessments...");
  await page.click('text=Assessments');
  await page.waitForTimeout(1500);

  console.log("Clicking into cybersecurity_attacks...");
  await page.locator('.assessment-card').filter({ hasText: 'cybersecurity_attacks' }).click();
  await page.waitForTimeout(1500);

  console.log("Clicking DET-01 Forensic Audit...");
  const html = await page.evaluate(() => document.body.outerHTML);
  const fs = require('fs');
  fs.writeFileSync('debug.html', html);
  console.log("Saved debug.html");
  const btnCount = await page.locator('.dimension-card button').count();
  console.log("Found buttons:", btnCount);
  await page.locator('.dimension-card button').nth(0).click({ force: true });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '11_det01_evidence.png' });
  console.log("Saved 11_det01_evidence.png");

  // Go back to the dossier
  await page.click('text=Assessments');
  await page.waitForTimeout(1000);
  await page.locator('.assessment-card').filter({ hasText: 'cybersecurity_attacks' }).click();
  await page.waitForTimeout(1500);

  console.log("Clicking AST-05 Forensic Audit...");
  // 5 dimensions have buttons, CMP-03 has 0. AST-05 is 5th card but 4th button.
  await page.locator('.dimension-card button').nth(3).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '12_ast05_evidence.png' });
  console.log("Saved 12_ast05_evidence.png");

  // Expand the specific row for fingerprint 1134738803121071072 if it exists, to show the payload
  console.log("Looking for fingerprint 1134738803121071072...");
  const row = page.locator('tr').filter({ hasText: '1134738803121071072' });
  if (await row.count() > 0) {
    await row.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '13_ast05_payload.png' });
    console.log("Saved 13_ast05_payload.png");
  } else {
    console.log("Row not found in AST-05 view.");
  }

  await browser.close();
})();
