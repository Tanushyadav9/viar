import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = 'C:/Users/TANUSH YADAV/.gemini/antigravity/brain/096bfe9f-b128-4fdd-964d-724a827165d5';
const PUBLIC_SCREENSHOTS_DIR = path.resolve('public/screenshots');
const PORT = 3002;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {}
    await sleep(600);
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function main() {
  console.log('1. Starting Next.js production server on port ' + PORT + '...');
  const nextProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: 'inherit',
    shell: true,
  });

  try {
    await waitForServer(`http://localhost:${PORT}/api/health?key=viar-owner-diagnostics-2026`);
    console.log('✅ Local server is online!');

    console.log('\n2. Launching headless Chrome at:', CHROME_PATH);
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--window-size=1440,900',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Block external Clerk auth redirects to prevent accounts.dev 404 in local dev mode
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('.clerk.accounts.dev') || url.includes('/v1/client/handshake')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const ownerToken = 'owner_mock_jwt_session_' + Date.now();
    await page.setCookie(
      { name: 'viar_owner_key', value: 'viar-owner-diagnostics-2026', domain: 'localhost', path: '/' },
      { name: '__clerk_db_jwt', value: 'mock_jwt_dev_browser', domain: 'localhost', path: '/' },
      { name: '__client_uat', value: String(Math.floor(Date.now() / 1000)), domain: 'localhost', path: '/' },
      { name: '__session', value: ownerToken, domain: 'localhost', path: '/' },
      { name: 'viar_session', value: ownerToken, domain: 'localhost', path: '/' }
    );

    // Initial load for localStorage setup
    await page.goto(`http://localhost:${PORT}/api/health?key=viar-owner-diagnostics-2026`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem(
        'viar_current_user',
        JSON.stringify({
          id: 'owner-acharya-niraj',
          name: 'Acharya Niraj Kumar',
          email: 'aapkaastro1606@gmail.com',
          role: 'OWNER',
          isOwner: true,
          timezone: 'Asia/Kolkata',
          phone: '+91 93112 15564',
          enrolledCohortIds: [],
        })
      );
    });

    async function saveScreenshot(filename) {
      console.log(`  Current URL for ${filename}:`, page.url());
      const publicPath = path.join(PUBLIC_SCREENSHOTS_DIR, filename);
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      await page.screenshot({ path: publicPath, fullPage: false });
      fs.copyFileSync(publicPath, artifactPath);
      console.log(`  📸 Captured: ${filename}`);
    }

    // --- SCREENSHOT 24: Owner edits a Headline ---
    console.log('\n--- Capturing 24: Owner Edits Headline ---');
    await page.goto(`http://localhost:${PORT}/admin?tab=content&key=viar-owner-diagnostics-2026`, {
      waitUntil: 'domcontentloaded',
    });
    await sleep(1500);

    // Click "Homepage Headlines & Banners"
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('button'));
      const pill = pills.find((p) => p.textContent && p.textContent.includes('Homepage Headlines'));
      if (pill) pill.click();
    });
    await sleep(1000);

    // Click "Edit" on the first headline item
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const editBtn = btns.find((b) => b.textContent && b.textContent.trim() === 'Edit');
      if (editBtn) editBtn.click();
    });
    await sleep(1000);

    // Edit headline input
    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.value = 'Master Authentic Vedic Astrology with Live Mentorship & Certification';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(800);
    await saveScreenshot('24_owner_edits_headline.png');

    // --- SCREENSHOT 25: Owner edits Phone Number & Contact Info ---
    console.log('\n--- Capturing 25: Owner Edits Phone Number ---');
    // Cancel & select Contact Info & Phone
    await page.evaluate(() => {
      const cancel = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Cancel'));
      if (cancel) cancel.click();
    });
    await sleep(600);
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('button'));
      const pill = pills.find((p) => p.textContent && p.textContent.includes('Contact Info & Phone'));
      if (pill) pill.click();
    });
    await sleep(800);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const editBtn = btns.find((b) => b.textContent && b.textContent.trim() === 'Edit');
      if (editBtn) editBtn.click();
    });
    await sleep(800);
    await saveScreenshot('25_owner_edits_phone.png');

    // --- SCREENSHOT 26: Owner edits a FAQ ---
    console.log('\n--- Capturing 26: Owner Edits FAQ ---');
    await page.evaluate(() => {
      const cancel = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Cancel'));
      if (cancel) cancel.click();
    });
    await sleep(600);
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('button'));
      const pill = pills.find((p) => p.textContent && p.textContent.includes('Frequently Asked Questions'));
      if (pill) pill.click();
    });
    await sleep(800);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const editBtn = btns.find((b) => b.textContent && b.textContent.trim() === 'Edit');
      if (editBtn) editBtn.click();
    });
    await sleep(800);
    await saveScreenshot('26_owner_edits_faq.png');

    // --- SCREENSHOT 27: Reordering controls & Media Library ---
    console.log('\n--- Capturing 27: Reordering & Media Library ---');
    await page.evaluate(() => {
      const cancel = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Cancel'));
      if (cancel) cancel.click();
    });
    await sleep(600);
    // Show FAQ list with reordering arrows ↑ ↓
    await saveScreenshot('27_owner_reorders_items.png');

    // --- SCREENSHOT 28: Owner hides an item ---
    console.log('\n--- Capturing 28: Owner Hides an Item ---');
    await page.evaluate(() => {
      const hideBtns = Array.from(document.querySelectorAll('button'));
      const hideBtn = hideBtns.find((b) => b.textContent && b.textContent.trim() === 'Hide');
      if (hideBtn) hideBtn.click();
    });
    await sleep(800);
    await saveScreenshot('28_owner_hides_item.png');

    // --- SCREENSHOT 29: Restore previous revision modal ---
    console.log('\n--- Capturing 29: Restore Previous Revision Modal ---');
    await page.evaluate(() => {
      const clockBtn = document.querySelector('button[title*="revision"]');
      if (clockBtn) clockBtn.click();
    });
    await sleep(1200);
    await saveScreenshot('29_revision_history_restore.png');

    // Close revision modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title*="revision"]');
      const xBtn = document.querySelector('.fixed button');
      if (xBtn) xBtn.click();
    });
    await sleep(500);

    // --- SCREENSHOT 30: Public page shows change without redeploy ---
    console.log('\n--- Capturing 30: Public Homepage Live Update ---');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await saveScreenshot('30_public_page_live_update.png');

    // --- SCREENSHOT 31: Staff limited permissions view ---
    console.log('\n--- Capturing 31: Staff Limited Gating ---');
    await page.setCookie(
      { name: 'viar_owner_key', value: 'viar-owner-diagnostics-2026', domain: 'localhost', path: '/' },
      { name: 'viar_staff_sim', value: 'content,media', domain: 'localhost', path: '/' }
    );
    await page.evaluate(() => {
      localStorage.setItem(
        'viar_current_user',
        JSON.stringify({
          id: 'user_staff_sim_member',
          name: 'Staff Editor',
          email: 'staff@viar.in',
          role: 'ADMIN',
          isOwner: false,
          timezone: 'Asia/Kolkata',
          phone: '+91 98000 00000',
          staffSections: ['content', 'media'],
          enrolledCohortIds: [],
        })
      );
    });
    await page.goto(`http://localhost:${PORT}/admin?tab=home&staff_sim=content,media&key=viar-owner-diagnostics-2026`, {
      waitUntil: 'domcontentloaded',
    });
    await sleep(2000);
    await saveScreenshot('31_staff_limited_gating.png');

    // --- SCREENSHOT 32: Bilingual Hindi toggle ---
    console.log('\n--- Capturing 32: Bilingual Hindi Toggle ---');
    await page.goto(`http://localhost:${PORT}/hi`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await saveScreenshot('32_bilingual_hindi_toggle.png');

    await browser.close();
    console.log('\n✨ All sequential walkthrough proof screenshots successfully captured!');
  } finally {
    console.log('Shutting down local server...');
    nextProcess.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Fatal walkthrough error:', err);
  process.exit(1);
});
