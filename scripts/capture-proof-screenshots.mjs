import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';

const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve('public/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function isPortAvailable(port) {
  try {
    const res = await fetch(`http://localhost:${port}/api/payments/config`, { signal: AbortSignal.timeout(1500) });
    return res.status >= 200;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status >= 200 && res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for Next.js server at ${url}`);
}

async function main() {
  console.log('--- CAPTURING PROOF SCREENSHOTS ---');
  let serverProcess = null;
  const running = await isPortAvailable(PORT);

  if (!running) {
    console.log(`Starting Next.js on port ${PORT}...`);
    const nextBin = path.resolve('node_modules/next/dist/bin/next');
    serverProcess = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], {
      cwd: process.cwd(),
      shell: false,
      stdio: 'pipe',
      env: { ...process.env, PORT: String(PORT) },
    });
    await waitForServer(BASE_URL);
  }

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (process.platform === 'win32') {
    launchOptions.channel = 'msedge';
  }

  const browser = await chromium.launch(launchOptions);

  try {
    // 1. Desktop English (1280x800)
    console.log('1. Capturing Desktop English...');
    const pageDeskEn = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await pageDeskEn.goto(`${BASE_URL}/courses/what-is-astrology`, { waitUntil: 'domcontentloaded' });
    await pageDeskEn.waitForTimeout(1500);
    const deskEnPath = path.join(SCREENSHOT_DIR, 'proof-desktop-en.png');
    await pageDeskEn.screenshot({ path: deskEnPath, fullPage: false });
    await pageDeskEn.close();

    // 2. Desktop Hindi (1280x800)
    console.log('2. Capturing Desktop Hindi...');
    const pageDeskHi = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await pageDeskHi.addInitScript(() => {
      localStorage.setItem('viar_language', 'hi');
    });
    await pageDeskHi.goto(`${BASE_URL}/courses/what-is-astrology`, { waitUntil: 'domcontentloaded' });
    await pageDeskHi.waitForTimeout(1500);
    const deskHiPath = path.join(SCREENSHOT_DIR, 'proof-desktop-hi.png');
    await pageDeskHi.screenshot({ path: deskHiPath, fullPage: false });
    await pageDeskHi.close();

    // 3. Mobile English (390x844)
    console.log('3. Capturing Mobile 390px English...');
    const pageMobEn = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
    });
    await pageMobEn.goto(`${BASE_URL}/courses/what-is-astrology`, { waitUntil: 'domcontentloaded' });
    await pageMobEn.waitForTimeout(1500);
    const mobEnPath = path.join(SCREENSHOT_DIR, 'proof-mobile-390-en.png');
    await pageMobEn.screenshot({ path: mobEnPath, fullPage: false });
    await pageMobEn.close();

    // 4. Mobile Hindi (390x844)
    console.log('4. Capturing Mobile 390px Hindi...');
    const pageMobHi = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
    });
    await pageMobHi.addInitScript(() => {
      localStorage.setItem('viar_language', 'hi');
    });
    await pageMobHi.goto(`${BASE_URL}/courses/what-is-astrology`, { waitUntil: 'domcontentloaded' });
    await pageMobHi.waitForTimeout(1500);
    const mobHiPath = path.join(SCREENSHOT_DIR, 'proof-mobile-390-hi.png');
    await pageMobHi.screenshot({ path: mobHiPath, fullPage: false });
    await pageMobHi.close();

    // 5. Friendly Error Page (deliberately simulated failure)
    console.log('5. Capturing Friendly Error Page (Simulated Failure)...');
    const pageError = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    // We navigate to /courses/non-existent-course-slug or error test route
    await pageError.goto(`${BASE_URL}/courses/non-existent-course-slug`, { waitUntil: 'domcontentloaded' });
    await pageError.waitForTimeout(1000);
    const notFoundPath = path.join(SCREENSHOT_DIR, 'proof-course-404.png');
    await pageError.screenshot({ path: notFoundPath, fullPage: false });
    await pageError.close();

    // 6. Deliberate simulated client boundary error page screenshot
    console.log('6. Capturing Deliberately Simulated Error Boundary...');
    const pageSimError = await browser.newPage({ viewport: { width: 1280, height: 850 } });
    await pageSimError.goto(`${BASE_URL}/test-error-boundary`, { waitUntil: 'domcontentloaded' });
    await pageSimError.waitForTimeout(1000);
    const errPath = path.join(SCREENSHOT_DIR, 'proof-friendly-error.png');
    await pageSimError.screenshot({ path: errPath, fullPage: false });
    await pageSimError.close();

    console.log('All screenshots captured successfully in', SCREENSHOT_DIR);
  } finally {
    await browser.close();
    if (serverProcess && serverProcess.pid) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /F /T /PID ${serverProcess.pid}`, { stdio: 'ignore' });
        } else {
          serverProcess.kill('SIGKILL');
        }
      } catch {}
    }
  }
}

main().catch((e) => {
  console.error('Screenshot capture failed:', e);
  process.exit(1);
});
