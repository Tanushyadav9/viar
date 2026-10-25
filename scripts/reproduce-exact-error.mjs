import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 45000) {
  const startTime = Date.now();
  console.log(`Polling server at ${url}...`);
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status >= 200 && res.status < 500) {
        console.log(`Server responded with HTTP ${res.status}`);
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for server at ${url}`);
}

async function main() {
  console.log('================================================================');
  console.log('   REPRODUCE AND CAPTURE EXACT CLIENT ERROR WITH SOURCE MAPS');
  console.log('================================================================\n');

  console.log(`[1/4] Spawning production Next.js server on port ${PORT}...`);
  const nextBin = path.resolve('node_modules/next/dist/bin/next');
  const server = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], {
    cwd: process.cwd(),
    shell: false,
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: String(PORT),
    },
  });

  server.stdout.on('data', (d) => {
    const s = d.toString().trim();
    if (s) console.log(`[next-server] ${s}`);
  });

  server.stderr.on('data', (d) => {
    const s = d.toString().trim();
    if (s && !s.includes('util._extend')) console.error(`[next-server-err] ${s}`);
  });

  const cleanup = () => {
    console.log('\nCleaning up processes...');
    if (server && server.pid) {
      try {
        execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: 'ignore' });
      } catch {}
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });
  process.on('exit', cleanup);

  try {
    await waitForServer(`${BASE_URL}/courses/what-is-astrology`);
    console.log('✅ Server is up and accepting requests!\n');

    console.log('[2/4] Launching Playwright browser driver (Google Chrome)...');
    const browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
    });

    const testRuns = [
      { name: '1. Logged Out - English', url: `${BASE_URL}/courses/what-is-astrology`, locale: 'en' },
      { name: '2. Logged Out - Hindi', url: `${BASE_URL}/courses/what-is-astrology`, locale: 'hi' },
      { name: '3. Student Persona - English', url: `${BASE_URL}/courses/what-is-astrology`, locale: 'en', isStudent: true },
      { name: '4. Student Persona - Hindi', url: `${BASE_URL}/courses/what-is-astrology`, locale: 'hi', isStudent: true },
    ];

    const results = [];

    for (const run of testRuns) {
      console.log(`\n------------------------------------------------------------`);
      console.log(`Testing: ${run.name}`);
      console.log(`URL: ${run.url}`);
      console.log(`------------------------------------------------------------`);

      const context = await browser.newContext({
        locale: run.locale === 'hi' ? 'hi-IN' : 'en-US',
      });

      if (run.locale === 'hi') {
        await context.addCookies([
          { name: 'NEXT_LOCALE', value: 'hi', domain: 'localhost', path: '/' },
        ]);
      }

      if (run.isStudent) {
        await context.addCookies([
          { name: '__test_role', value: 'STUDENT', domain: 'localhost', path: '/' },
          { name: '__test_email', value: 'parnikagrover88@gmail.com', domain: 'localhost', path: '/' },
        ]);
      }

      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const networkFailures = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            text: msg.text(),
            location: msg.location(),
          });
        }
      });

      page.on('pageerror', (err) => {
        pageErrors.push({
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
      });

      page.on('requestfailed', (req) => {
        networkFailures.push({
          url: req.url(),
          failure: req.failure()?.errorText,
        });
      });

      let pageResponse;
      try {
        pageResponse = await page.goto(run.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch (err) {
        console.error(`Page navigation timeout or error: ${err.message}`);
      }

      // Wait 3.5 seconds to let React client component hydration and useEffect settle
      await page.waitForTimeout(3500);

      // Check for client-side exception banner
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasClientException =
        bodyText.includes('Application error: a client-side exception has occurred') ||
        bodyText.includes('client-side exception');

      const screenshotDir = path.join(process.cwd(), 'public', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const screenshotPath = path.join(
        screenshotDir,
        `reproduce-${run.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const runSummary = {
        name: run.name,
        status: pageResponse ? pageResponse.status() : 'FAILED',
        hasClientException,
        consoleErrors,
        pageErrors,
        networkFailures,
        screenshotPath,
      };

      results.push(runSummary);

      console.log(`Status Code: ${runSummary.status}`);
      console.log(`Client Exception Banner detected: ${hasClientException ? '💥 YES' : '✨ NO'}`);
      console.log(`Page Errors (Uncaught Exceptions): ${pageErrors.length}`);
      console.log(`Console Errors: ${consoleErrors.length}`);
      console.log(`Network Failures: ${networkFailures.length}`);

      if (pageErrors.length > 0) {
        console.log('\n--- Captured Page Errors (Uncaught Exceptions) ---');
        pageErrors.forEach((pe, idx) => {
          console.log(`[Error #${idx + 1}] ${pe.name}: ${pe.message}`);
          console.log(`Stack Trace:\n${pe.stack}\n`);
        });
      }

      if (consoleErrors.length > 0) {
        console.log('\n--- Captured Console Errors ---');
        consoleErrors.forEach((ce, idx) => {
          console.log(`[Console Error #${idx + 1}] ${ce.text}`);
          if (ce.location) {
            console.log(`Location: ${ce.location.url}:${ce.location.lineNumber}:${ce.location.columnNumber}`);
          }
        });
      }

      await context.close();
    }

    await browser.close();

    console.log('\n================================================================');
    console.log('                       REPRODUCTION SUMMARY');
    console.log('================================================================');

    const outJsonPath = path.join(process.cwd(), 'reproduce-results.json');
    fs.writeFileSync(outJsonPath, JSON.stringify(results, null, 2));
    console.log(`\nResults written to ${outJsonPath}`);

  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
