import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';

const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve('public/screenshots');
const ARTIFACT_DIR = 'C:\\Users\\TANUSH YADAV\\.gemini\\antigravity\\brain\\096bfe9f-b128-4fdd-964d-724a827165d5';

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
  console.log('--- CAPTURING FULL SET OF PROOF SCREENSHOTS ---');
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
    const shots = [
      {
        name: 'proof-error-light.png',
        url: `${BASE_URL}/test-proof-views?view=error-light`,
        viewport: { width: 1280, height: 900 },
      },
      {
        name: 'proof-error-dark.png',
        url: `${BASE_URL}/test-proof-views?view=error-dark`,
        viewport: { width: 1280, height: 900 },
      },
      {
        name: 'proof-enrolled-course.png',
        url: `${BASE_URL}/test-proof-views?view=enrolled`,
        viewport: { width: 1280, height: 900 },
      },
      {
        name: 'proof-open-order.png',
        url: `${BASE_URL}/test-proof-views?view=open-order`,
        viewport: { width: 1280, height: 900 },
      },
      {
        name: 'proof-duplicate-payment-warning.png',
        url: `${BASE_URL}/test-proof-views?view=duplicate-warning`,
        viewport: { width: 1280, height: 900 },
      },
    ];

    for (const item of shots) {
      console.log(`Capturing ${item.name}...`);
      const page = await browser.newPage({ viewport: item.viewport });
      await page.goto(item.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const targetPath = path.join(SCREENSHOT_DIR, item.name);
      await page.screenshot({ path: targetPath, fullPage: false });

      if (fs.existsSync(ARTIFACT_DIR)) {
        const artifactPath = path.join(ARTIFACT_DIR, item.name);
        fs.copyFileSync(targetPath, artifactPath);
        console.log(`Saved to artifact dir: ${artifactPath}`);
      }

      await page.close();
    }

    console.log('All walkthrough proof screenshots captured successfully!');
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
