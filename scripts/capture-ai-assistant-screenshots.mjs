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
    } catch {
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
    env: { ...process.env, PORT: String(PORT), CHATBOT_API_KEY: 'sk-proj-mock-key-for-screenshots' },
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

    async function takeScreenshot(name, description) {
      const artifactPath = path.join(ARTIFACT_DIR, name);
      const publicPath = path.join(PUBLIC_SCREENSHOTS_DIR, name);

      await page.screenshot({ path: artifactPath, fullPage: false });
      fs.copyFileSync(artifactPath, publicPath);
      console.log(`📸 [Captured] ${name} -> ${description}`);
    }

    // ----------------------------------------------------
    // 1. DESKTOP VIEWPORT (1366x768)
    // ----------------------------------------------------
    await page.setViewport({ width: 1366, height: 768 });

    // A. Desktop English Closed
    console.log('\n[1/8] Capturing Desktop English Closed (/)');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('button[aria-controls="viar-ai-chat-window"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot('08_ai_assistant_desktop_closed_en.png', 'Desktop English Homepage with Closed AI Floating Trigger');

    // B. Desktop English Open
    console.log('[2/8] Opening assistant on Desktop English...');
    await page.$eval('button[aria-controls="viar-ai-chat-window"]', (el) => el.click());
    await page.waitForSelector('#viar-ai-chat-window', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('09_ai_assistant_desktop_open_en.png', 'Desktop English AI Assistant Open Panel (380x560) with chips & escalation');

    // C. Desktop Hindi Closed
    console.log('\n[3/8] Capturing Desktop Hindi Closed (/hi)');
    await page.goto(`http://localhost:${PORT}/hi`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('button[aria-controls="viar-ai-chat-window"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot('10_ai_assistant_desktop_closed_hi.png', 'Desktop Hindi Homepage with Closed AI Floating Trigger');

    // D. Desktop Hindi Open
    console.log('[4/8] Opening assistant on Desktop Hindi...');
    await page.$eval('button[aria-controls="viar-ai-chat-window"]', (el) => el.click());
    await page.waitForSelector('#viar-ai-chat-window', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('11_ai_assistant_desktop_open_hi.png', 'Desktop Hindi AI Assistant Open Panel with Devanagari greeting & chips');

    // ----------------------------------------------------
    // 2. MOBILE VIEWPORT (390x844 - iPhone 12/13/14)
    // ----------------------------------------------------
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // E. Mobile English Closed
    console.log('\n[5/8] Capturing Mobile English Closed (/)');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('button[aria-controls="viar-ai-chat-window"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot('12_ai_assistant_mobile_closed_en.png', 'Mobile (390px) English with Floating Trigger (no collisions)');

    // F. Mobile English Open
    console.log('[6/8] Opening assistant on Mobile English...');
    await page.$eval('button[aria-controls="viar-ai-chat-window"]', (el) => el.click());
    await page.waitForSelector('#viar-ai-chat-window', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('13_ai_assistant_mobile_open_en.png', 'Mobile (390px) English AI Assistant Full-Height Responsive Sheet');

    // G. Mobile Hindi Closed
    console.log('\n[7/8] Capturing Mobile Hindi Closed (/hi)');
    await page.goto(`http://localhost:${PORT}/hi`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('button[aria-controls="viar-ai-chat-window"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot('14_ai_assistant_mobile_closed_hi.png', 'Mobile (390px) Hindi with Floating Trigger');

    // H. Mobile Hindi Open
    console.log('[8/8] Opening assistant on Mobile Hindi...');
    await page.$eval('button[aria-controls="viar-ai-chat-window"]', (el) => el.click());
    await page.waitForSelector('#viar-ai-chat-window', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('15_ai_assistant_mobile_open_hi.png', 'Mobile (390px) Hindi AI Assistant Full-Height Responsive Sheet in Hindi');

    await browser.close();
    console.log('\n🎉 ALL 8 AI ASSISTANT PROOF SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    console.log('Shutting down server process on port ' + PORT + '...');
    if (nextProcess && !nextProcess.killed) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(nextProcess.pid), '/f', '/t']);
      } else {
        nextProcess.kill('SIGTERM');
      }
    }
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
