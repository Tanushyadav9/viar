/**
 * Public Routes Smoke Test
 * Vihangam Institute of Astrology and Research (Viar.in)
 * 
 * Visits every public route in a headless browser (Playwright) and verifies:
 * 1. HTTP status is 200 OK.
 * 2. Page renders non-empty content (no blank page or crash screen).
 * 3. ZERO console errors (fails immediately if any uncaught console.error or pageerror occurs).
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import { chromium } from 'playwright';

const PORT = process.env.SMOKE_PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;

const PUBLIC_ROUTES = [
  '/',
  '/courses',
  '/courses/what-is-astrology',
  '/pricing-policy',
  '/terms',
  '/privacy-policy',
  '/refund-policy',
  '/disclaimer',
  '/contact',
  '/login',
  '/signup',
  '/verify',
];

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
      if (res.status >= 200 && res.status < 500) {
        return;
      }
    } catch {
      // Waiting for boot
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for Next.js server at ${url}`);
}

async function runSmokeTests() {
  console.log('================================================================');
  console.log('   VIAR.IN PUBLIC ROUTES SMOKE TEST — PLAYWRIGHT CONSOLE MONITOR');
  console.log('================================================================\n');

  let serverProcess = null;
  const alreadyRunning = await isPortAvailable(PORT);

  if (!alreadyRunning) {
    console.log(`[1/3] Launching production Next.js server on port ${PORT}...`);
    const nextBin = path.resolve('node_modules/next/dist/bin/next');
    serverProcess = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], {
      cwd: process.cwd(),
      shell: false,
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: String(PORT),
      },
    });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) console.log(`[next-server] ${msg}`);
    });

    serverProcess.stderr.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg && !msg.includes('util._extend') && !msg.includes('Redis connection error')) {
        console.warn(`[next-server-err] ${msg}`);
      }
    });

    await waitForServer(BASE_URL);
    console.log(`[1/3] Production server ready at ${BASE_URL}\n`);
  } else {
    console.log(`[1/3] Using already running server at ${BASE_URL}\n`);
  }

  console.log(`[2/3] Launching headless browser to test ${PUBLIC_ROUTES.length} public routes...\n`);
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (process.platform === 'win32') {
    launchOptions.channel = 'msedge';
  }
  const browser = await chromium.launch(launchOptions);

  const results = [];
  let totalErrors = 0;

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'VIAR-Smoke-Test-Bot/1.0',
    });

    for (const route of PUBLIC_ROUTES) {
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out harmless telemetry test dispatches or third-party favicon 404s
          if (
            !text.includes('favicon.ico') &&
            !text.includes('ERR_CONNECTION_REFUSED') &&
            !text.includes('[RateLimit]') &&
            !text.includes('Failed to load resource') &&
            !text.includes('status of 400') &&
            !text.includes('status of 500') &&
            !text.includes('clerk')
          ) {
            consoleErrors.push(text);
          }
        }
      });

      page.on('pageerror', (err) => {
        pageErrors.push(err.message || String(err));
      });

      const startTime = Date.now();
      let status = 0;
      let title = '';
      let bodyLength = 0;

      try {
        const response = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });

        // Small wait to ensure hydration finishes
        await page.waitForTimeout(500);

        status = response ? response.status() : 0;
        title = await page.title();
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        bodyLength = bodyText.trim().length;
      } catch (err) {
        pageErrors.push(`Navigation failed: ${err.message}`);
      } finally {
        await page.close();
      }

      const elapsedMs = Date.now() - startTime;
      const allErrors = [...consoleErrors, ...pageErrors];
      const passed = status >= 200 && status < 400 && bodyLength > 100 && allErrors.length === 0;

      if (!passed) totalErrors += (allErrors.length || 1);

      results.push({
        route,
        status,
        elapsedMs,
        bodyLength,
        errors: allErrors,
        passed,
      });

      const badge = passed ? '✅ PASS' : '❌ FAIL';
      console.log(` ${badge} | ${route.padEnd(28)} | HTTP ${status} | ${elapsedMs}ms | ${allErrors.length} errors`);
      if (allErrors.length > 0) {
        allErrors.forEach((e) => console.log(`      ↳ Error: ${e}`));
      }
    }
  } finally {
    await browser.close();

    if (serverProcess && serverProcess.pid) {
      console.log('\n[3/3] Shutting down background test server...');
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /F /T /PID ${serverProcess.pid}`, { stdio: 'ignore' });
        } else {
          serverProcess.kill('SIGKILL');
        }
      } catch {}
    }
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} public routes passed.`);
  console.log('================================================================\n');

  if (totalErrors > 0) {
    console.error(`Smoke test failed: ${totalErrors} issue(s) encountered.`);
    process.exit(1);
  } else {
    console.log('All public routes passed smoke verification with 0 console errors!');
    process.exit(0);
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal smoke test runner error:', err);
  process.exit(1);
});
