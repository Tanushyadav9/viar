import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';

const PORT = 3010;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOT_DIR = path.resolve('public/screenshots');
const ARTIFACT_DIR = 'C:\\Users\\TANUSH YADAV\\.gemini\\antigravity\\brain\\096bfe9f-b128-4fdd-964d-724a827165d5';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function isPortAvailable(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/test-proof-views?view=admin-home-en`, { signal: AbortSignal.timeout(1500) });
    return res.status >= 200;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 45000) {
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
  console.log('--- CAPTURING COMPLETE SUITE OF ADMIN PROOF SCREENSHOTS (EN & HI) ---');
  let serverProcess = null;
  const running = await isPortAvailable(PORT);

  if (!running) {
    console.log(`Starting Next.js on port ${PORT}...`);
    const nextBin = path.resolve('node_modules/next/dist/bin/next');
    serverProcess = spawn(process.execPath, [nextBin, 'dev', '-H', '127.0.0.1', '-p', String(PORT)], {
      cwd: process.cwd(),
      shell: false,
      stdio: 'inherit',
      env: { ...process.env, PORT: String(PORT) },
    });
    await waitForServer(`${BASE_URL}/test-proof-views?view=admin-home-en`);
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
    const shots = [
      // English Screens
      { name: 'admin-1-home-en.png', view: 'admin-home-en' },
      { name: 'admin-2-course-en.png', view: 'admin-course-en' },
      { name: 'admin-3-students-en.png', view: 'admin-students-en' },
      { name: 'admin-4-payments-en.png', view: 'admin-payments-en' },
      { name: 'admin-5-content-en.png', view: 'admin-content-en' },
      { name: 'admin-6-readiness-modal-en.png', view: 'admin-readiness-modal-en' },
      { name: 'admin-7-testdata-modal-en.png', view: 'admin-testdata-modal-en' },

      // Hindi Screens
      { name: 'admin-1-home-hi.png', view: 'admin-home-hi' },
      { name: 'admin-2-course-hi.png', view: 'admin-course-hi' },
      { name: 'admin-3-students-hi.png', view: 'admin-students-hi' },
      { name: 'admin-4-payments-hi.png', view: 'admin-payments-hi' },
      { name: 'admin-5-content-hi.png', view: 'admin-content-hi' },
      { name: 'admin-6-readiness-modal-hi.png', view: 'admin-readiness-modal-hi' },
      { name: 'admin-7-testdata-modal-hi.png', view: 'admin-testdata-modal-hi' },
    ];

    for (const item of shots) {
      console.log(`Capturing ${item.name}...`);
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`${BASE_URL}/test-proof-views?view=${item.view}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const targetPath = path.join(SCREENSHOT_DIR, item.name);
      await page.screenshot({ path: targetPath, fullPage: false });

      if (fs.existsSync(ARTIFACT_DIR)) {
        const artifactPath = path.join(ARTIFACT_DIR, item.name);
        fs.copyFileSync(targetPath, artifactPath);
        console.log(`Saved to artifact dir: ${artifactPath}`);
      }

      await page.close();
    }

    console.log('All 14 admin proof screenshots captured and saved successfully!');
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
  console.error('Screenshot capture error:', e);
  process.exit(1);
});
