const puppeteer = require('C:/Users/adity/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'brag-output', 'composition', 'assets', 'real_img');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();

  // 1. Capture Login Screen (unauthenticated)
  console.log('Capturing 01_login.png...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login.png') });

  // Authenticate in sessionStorage
  await page.evaluate(() => {
    sessionStorage.setItem('sat_sa_auth', 'true');
    sessionStorage.setItem('sat_sa_officer', 'SHARMA-994');
    sessionStorage.setItem('sat_sa_role', 'Auditor - Supervisory Lead');
  });

  // 2. Overview Dashboard
  console.log('Capturing 02_overview.png...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_overview.png') });

  // Helper to click sidebar button
  async function clickSidebar(label, filename, waitMs = 1500) {
    console.log(`Navigating to ${label} -> ${filename}...`);
    await page.evaluate((text) => {
      const items = Array.from(document.querySelectorAll('aside button, aside a'));
      const target = items.find(el => el.textContent.includes(text));
      if (target) target.click();
    }, label);
    await new Promise(r => setTimeout(r, waitMs));
    await page.screenshot({ path: path.join(OUTPUT_DIR, filename) });
  }

  // 3. Assessments
  await clickSidebar('Assessments', '03_assessments.png');

  // 4. Data Ingestion
  await clickSidebar('Data Ingestion', '04_evidence.png');

  // 5. Findings
  await clickSidebar('Findings', '05_findings.png');

  // 6. Review Queue
  await clickSidebar('Review Queue', '06_review_queue.png');

  // 7. AI Threat Copilot
  console.log('Navigating to AI Threat Copilot...');
  await clickSidebar('AI Threat Copilot', '08_copilot.png', 2000);

  // 8. Open Dossier for first entity from Overview
  console.log('Opening Dossier...');
  await clickSidebar('Overview', 'temp.png', 1000);
  await page.evaluate(() => {
    const row = document.querySelector('tbody tr');
    if (row) row.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_dossier.png') });

  await browser.close();
  console.log('Capture complete!');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
