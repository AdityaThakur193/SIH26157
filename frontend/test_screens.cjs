const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'qa_screenshots_final');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log("Navigating to Login...");
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01_login.png') });

  console.log("Logging in...");
  await page.click('button:has-text("AUTHENTICATE ENCLAVE")');
  await page.waitForTimeout(2000);
  
  console.log("Screenshotting Overview...");
  await page.screenshot({ path: path.join(outDir, '02_overview.png') });

  console.log("Navigating to Evidence Locker...");
  await page.click('text=Evidence Locker');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '03_evidence_locker.png') });

  console.log("Navigating to Assessments...");
  await page.click('text=Assessments');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '04_assessments.png') });

  console.log("Navigating to Dossier...");
  await page.click('text=Inspect Dossier >> nth=0');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '05_dossier.png') });

  console.log("Navigating to Review Queue...");
  await page.click('text=Review Queue');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '06_review_queue.png') });

  console.log("Navigating to Copilot...");
  await page.click('text=Forensic Copilot');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '07_copilot.png') });

  await browser.close();
  console.log("Done.");
})();
