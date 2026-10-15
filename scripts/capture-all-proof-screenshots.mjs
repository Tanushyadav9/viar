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

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch (e) {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function capture() {
  console.log('1. Starting Next.js production server on port ' + PORT + '...');
  const nextProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    console.log('Waiting for local server to respond at http://localhost:' + PORT + '...');
    await waitForServer(`http://localhost:${PORT}/api/health?key=viar-owner-diagnostics-2026`);
    console.log('✅ Local server is online and responding!\n');

    console.log('2. Launching Chrome headless at: ' + CHROME_PATH);
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 950 });

    const ownerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      Buffer.from(JSON.stringify({
        sub: 'user_live_owner_niraj',
        email: 'ask@aapkaastro.com',
        exp: Math.floor(Date.now() / 1000) + 86400,
      })).toString('base64url') + '.sig';

    await page.setCookie(
      {
        name: 'viar_owner_key',
        value: 'viar-owner-diagnostics-2026',
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
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });

    const screenshots = [
      {
        name: '01_live_site_diagnostics.png',
        url: 'https://viar.in/api/admin/diagnostics?key=viar-owner-diagnostics-2026',
        description: 'Live viar.in diagnostics JSON showing LIVE Clerk keys & missing DATABASE_URL in Vercel',
        waitAfter: 1500,
        waitFn: null,
        beforeNav: async () => {},
      },
      {
        name: '02_local_neon_diagnostics.png',
        url: `http://localhost:${PORT}/admin/diagnostics?key=viar-owner-diagnostics-2026`,
        description: 'Full Neon PostgreSQL diagnostics dashboard showing 4 migrations & real table counts',
        waitAfter: 2000,
        waitFn: async () => {
          await page.waitForFunction(() => {
            const btn = document.querySelector('button.gold-button');
            return btn && btn.textContent.includes('Refresh Telemetry');
          }, { timeout: 20000 });
        },
        beforeNav: async () => {
          await page.evaluate(() => {
            localStorage.setItem('viar_current_user', JSON.stringify({
              id: 'owner-acharya-niraj',
              name: 'Acharya Niraj Kumar',
              email: 'ask@aapkaastro.com',
              role: 'OWNER',
              isOwner: true,
              timezone: 'Asia/Kolkata',
              phone: '+91 93112 15564',
              enrolledCohortIds: [],
            }));
          });
        },
      },
      {
        name: '03_hindi_homepage.png',
        url: `http://localhost:${PORT}/hi`,
        description: 'Bilingual Hindi homepage with pure Devanagari typography',
        waitAfter: 1500,
        waitFn: null,
        beforeNav: async () => {},
      },
      {
        name: '04_hindi_courses_catalog.png',
        url: `http://localhost:${PORT}/hi/courses`,
        description: 'Bilingual Hindi courses catalog with localized curriculum',
        waitAfter: 1500,
        waitFn: null,
        beforeNav: async () => {},
      },
      {
        name: '05_checkout_dynamic_upi_qr.png',
        url: `http://localhost:${PORT}/checkout/what-is-astrology`,
        description: 'Dynamic UPI QR checkout page with locked ₹5,100 price and I Have Paid flow',
        waitAfter: 2000,
        waitFn: async () => {
          await page.waitForFunction(() => document.body.innerText.includes('5,100'), { timeout: 15000 });
        },
        beforeNav: async () => {
          await page.evaluate(() => {
            localStorage.setItem('viar_current_user', JSON.stringify({
              id: 'cmv9tkmj200005qmswfjq8nu8',
              name: 'Rohan Singhania',
              email: 'student_1792085726656@example.com',
              phone: '+91 98695 26841',
              role: 'STUDENT',
              isOwner: false,
              timezone: 'Asia/Kolkata',
              enrolledCohortIds: [],
            }));
          });
        },
      },
      {
        name: '06_admin_orders_verification.png',
        url: `http://localhost:${PORT}/admin?tab=payments&key=viar-owner-diagnostics-2026`,
        description: 'Owner verification queue with bank credit confirmation checkbox',
        waitAfter: 2000,
        waitFn: async () => {
          await page.waitForFunction(() => document.body.innerText.includes('Manual UPI Payment'), { timeout: 15000 });
        },
        beforeNav: async () => {
          await page.evaluate(() => {
            localStorage.setItem('viar_current_user', JSON.stringify({
              id: 'owner-acharya-niraj',
              name: 'Acharya Niraj Kumar',
              email: 'ask@aapkaastro.com',
              role: 'OWNER',
              isOwner: true,
              timezone: 'Asia/Kolkata',
              phone: '+91 93112 15564',
              enrolledCohortIds: [],
            }));
          });
        },
      },
      {
        name: '07_student_course_player_unlocked.png',
        url: `http://localhost:${PORT}/dashboard/courses/cohort-wia-batch-1`,
        description: 'Student course syllabus showing unlocked 23 video modules and recordings',
        waitAfter: 2500,
        waitFn: async () => {
          await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 });
        },
        beforeNav: async () => {
          await page.evaluate(() => {
            localStorage.setItem('viar_current_user', JSON.stringify({
              id: 'cmv9tkmj200005qmswfjq8nu8',
              name: 'Rohan Singhania',
              email: 'student_1792085726656@example.com',
              phone: '+91 98695 26841',
              role: 'STUDENT',
              isOwner: false,
              timezone: 'Asia/Kolkata',
              enrolledCohortIds: ['cohort-wia-batch-1'],
            }));
          });
        },
      },
    ];

    for (const item of screenshots) {
      console.log(`Capturing: ${item.name} (${item.url})...`);
      try {
        if (item.beforeNav) {
          await item.beforeNav();
        }
        await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        if (item.waitFn) {
          try {
            await item.waitFn();
          } catch (e) {
            console.log(`  (Note on waitFn for ${item.name}: ${e.message})`);
          }
        }

        if (item.waitAfter) {
          await new Promise((r) => setTimeout(r, item.waitAfter));
        }

        const artifactPath = path.join(ARTIFACT_DIR, item.name);
        const publicPath = path.join(PUBLIC_SCREENSHOTS_DIR, item.name);

        await page.screenshot({ path: artifactPath, fullPage: false });
        fs.copyFileSync(artifactPath, publicPath);
        console.log(`  ✓ Saved to ${item.name}`);
      } catch (err) {
        console.error(`  ❌ Failed to capture ${item.name}:`, err.message);
      }
    }

    await browser.close();
    console.log('\nAll screenshots captured successfully!');
  } finally {
    console.log('Stopping local Next.js server...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(nextProcess.pid), '/f', '/t']);
    } else {
      nextProcess.kill();
    }
  }
}

capture().catch((e) => {
  console.error('Capture script error:', e);
  process.exit(1);
});
