const puppeteer = require('C:/Users/adity/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = 'C:/Users/adity/.gemini/antigravity/brain/dc26cf15-9ec8-4553-8079-c88caa3384d0/scratch';

async function testBrowser() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  // Set auth
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('sat_sa_auth', 'true');
    sessionStorage.setItem('sat_sa_officer', 'SHARMA-994');
    sessionStorage.setItem('sat_sa_role', 'Auditor - Supervisory Lead');
  });
  
  // 1. Overview Page
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_overview.png') });
  
  // 2. Assessment Dossier - soc_case_management (CASE-2026-SOC-09)
  await page.evaluate(() => {
    // Find the row for soc_case_management and click its View Dossier button
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const socRow = rows.find(r => r.textContent.includes('soc_case_management'));
    if (socRow) {
      socRow.querySelector('button').click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_dossier_soc.png') });

  // 3. Evidence View
  await page.evaluate(() => {
    // Click 'Forensic Audit' on the first dimension card
    const btn = document.querySelector('button[title=\"Examine underlying evidence and related indicators\"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_evidence_view.png') });
  
  // 4. Scroll raw payload
  await page.evaluate(() => {
    // Click the first row to open copilot evidence inspector
    const rows = document.querySelectorAll('tbody tr');
    if (rows.length > 0) rows[0].click();
  });
  await new Promise(r => setTimeout(r, 1000));
  // Scroll down the pre block
  await page.evaluate(() => {
    const pre = document.querySelector('pre');
    if (pre) {
      pre.scrollTop = 500;
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_evidence_scroll.png') });
  
  // Go back to overview and test insurance
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const insRow = rows.find(r => r.textContent.includes('insurance'));
    if (insRow) {
      insRow.querySelector('button').click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_dossier_insurance.png') });

  await browser.close();
}
testBrowser().catch(console.error);
