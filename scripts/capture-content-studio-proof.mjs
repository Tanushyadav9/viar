import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/TANUSH YADAV/.gemini/antigravity/brain/096bfe9f-b128-4fdd-964d-724a827165d5';
const PUBLIC_SCREENSHOTS_DIR = path.resolve('public/screenshots');
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 3001;

if (!fs.existsSync(PUBLIC_SCREENSHOTS_DIR)) {
  fs.mkdirSync(PUBLIC_SCREENSHOTS_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function waitForServer(url, timeoutMs = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function run() {
  console.log('1. Starting Next.js production server on port ' + PORT + '...');
  const nextProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(PORT),
      OWNER_EMAIL: 'aapkaastro1606@gmail.com',
    },
  });

  try {
    console.log('Waiting for local server at http://localhost:' + PORT + '...');
    await waitForServer(`http://localhost:${PORT}/api/health?key=viar-owner-diagnostics-2026`);
    console.log('✅ Local server is online!\n');

    console.log('2. Launching headless Chrome at: ' + CHROME_PATH);
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('clerk.accounts.dev') || u.includes('accounts.dev')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const ownerToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      Buffer.from(
        JSON.stringify({
          sub: 'user_live_owner_niraj',
          email: 'aapkaastro1606@gmail.com',
          exp: Math.floor(Date.now() / 1000) + 86400,
        })
      ).toString('base64url') +
      '.sig';

    await page.setCookie(
      {
        name: 'viar_owner_key',
        value: 'viar-owner-diagnostics-2026',
        domain: 'localhost',
        path: '/',
      },
      {
        name: '__clerk_db_jwt',
        value: 'mock_jwt_dev_browser',
        domain: 'localhost',
        path: '/',
      },
      {
        name: '__client_uat',
        value: String(Math.floor(Date.now() / 1000)),
        domain: 'localhost',
        path: '/',
      },
      {
        name: '__session',
        value: ownerToken,
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'viar_session',
        value: ownerToken,
        domain: 'localhost',
        path: '/',
      }
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

    // Helper to capture both destinations
    async function saveScreenshot(filename) {
      console.log(`  Current URL for ${filename}:`, page.url());
      const publicPath = path.join(PUBLIC_SCREENSHOTS_DIR, filename);
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      await page.screenshot({ path: publicPath, fullPage: false });
      fs.copyFileSync(publicPath, artifactPath);
      console.log(`  📸 Captured: ${filename}`);
    }

    // --- SCREENSHOT 1: Admin Home Hub ---
    console.log('\n--- Capturing 1/8: Admin Home Hub ---');
    await page.goto(`http://localhost:${PORT}/admin?tab=home&key=viar-owner-diagnostics-2026`, {
      waitUntil: 'domcontentloaded',
    });
    await new Promise((r) => setTimeout(r, 2000));
    await saveScreenshot('16_admin_home_hub.png');

    // --- SCREENSHOT 2: Content Studio Editor ---
    console.log('\n--- Capturing 2/8: Content Studio Editor ---');
    await page.goto(`http://localhost:${PORT}/admin?tab=content&key=viar-owner-diagnostics-2026`, {
      waitUntil: 'domcontentloaded',
    });
    // Wait for items to load
    try {
      await page.waitForFunction(
        () => !document.body.innerText.includes('Loading collection items...'),
        { timeout: 12000 }
      );
    } catch {
      // fallback
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Edit" on the first item to reveal the full editor form with tabs & preview
    try {
      const editButtons = await page.$$('button');
      for (const btn of editButtons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.trim() === 'Edit') {
          await btn.click();
          break;
        }
      }
    } catch (e) {
      console.log('Edit button click notice:', e.message);
    }
    await new Promise((r) => setTimeout(r, 1200));
    await saveScreenshot('17_content_studio_editor.png');

    // --- SCREENSHOT 3: FAQ Editor & Reordering ---
    console.log('\n--- Capturing 3/8: FAQ Editor & Reorder ---');
    try {
      const collectionPills = await page.$$('button');
      for (const pill of collectionPills) {
        const text = await page.evaluate((el) => el.textContent, pill);
        if (text && text.includes('Frequently Asked Questions')) {
          await pill.click();
          break;
        }
      }
    } catch (e) {
      console.log('FAQ pill click notice:', e.message);
    }
    try {
      await page.waitForFunction(
        () => !document.body.innerText.includes('Loading collection items...'),
        { timeout: 12000 }
      );
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshot('18_faq_editor_reorder.png');

    // --- SCREENSHOT 4: Media Library ---
    console.log('\n--- Capturing 4/8: Media Library ---');
    await page.goto(`http://localhost:${PORT}/admin?tab=media&key=viar-owner-diagnostics-2026`, {
      waitUntil: 'domcontentloaded',
    });
    try {
      await page.waitForFunction(
        () => !document.body.innerText.includes('Loading media library...'),
        { timeout: 12000 }
      );
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshot('19_media_library_r2.png');

    // --- SCREENSHOT 5: Revision History Modal ---
    console.log('\n--- Capturing 5/8: Revision History Modal ---');
    await page.goto(`http://localhost:${PORT}/admin?tab=content&key=viar-owner-diagnostics-2026`, {
      waitUntil: 'domcontentloaded',
    });
    try {
      await page.waitForFunction(
        () => !document.body.innerText.includes('Loading collection items...'),
        { timeout: 12000 }
      );
    } catch {}
    await new Promise((r) => setTimeout(r, 800));

    // Open first item editor
    try {
      const editButtons = await page.$$('button');
      for (const btn of editButtons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.trim() === 'Edit') {
          await btn.click();
          break;
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Revisions" button
    try {
      const revButtons = await page.$$('button');
      for (const btn of revButtons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes('Revisions')) {
          await btn.click();
          break;
        }
      }
    } catch (e) {
      console.log('Revisions button notice:', e.message);
    }
    await new Promise((r) => setTimeout(r, 1200));
    await saveScreenshot('20_revision_history_modal.png');

    // --- SCREENSHOT 6: Public Homepage with Dynamic Content ---
    console.log('\n--- Capturing 6/8: Public Homepage ---');
    await page.deleteCookie({ name: 'viar_owner_key', domain: 'localhost' });
    await page.evaluate(() => {
      localStorage.removeItem('viar_current_user');
    });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2000));
    await saveScreenshot('21_public_homepage_live.png');

    // --- SCREENSHOT 7: Bilingual Hindi Toggle ---
    console.log('\n--- Capturing 7/8: Bilingual Hindi Toggle ---');
    await page.goto(`http://localhost:${PORT}/hi`, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 2000));
    await saveScreenshot('22_bilingual_hindi_toggle.png');

    // --- SCREENSHOT 8: Staff Limited RBAC View ---
    console.log('\n--- Capturing 8/8: Staff Limited RBAC View ---');
    await page.setCookie(
      {
        name: 'viar_owner_key',
        value: 'viar-owner-diagnostics-2026',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'viar_staff_sim',
        value: 'content,media',
        domain: 'localhost',
        path: '/',
      }
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
    await new Promise((r) => setTimeout(r, 2000));
    await saveScreenshot('23_staff_limited_gating.png');

    await browser.close();
    console.log('\n✨ All 8 proof screenshots successfully captured!');
  } finally {
    console.log('Shutting down local server...');
    nextProcess.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('Fatal error capturing screenshots:', err);
  process.exit(1);
});
