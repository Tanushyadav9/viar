import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { POST } from '../src/app/api/client-errors/route.ts';

test('Error boundaries and 404 Not Found verification', async (t) => {
  await t.test('app/error.tsx exists and contains bilingual copy, reset handler, WhatsApp and contact info', () => {
    const filePath = path.resolve(process.cwd(), 'src/app/error.tsx');
    assert.ok(fs.existsSync(filePath), 'src/app/error.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes("'use client'"), 'must be a client component');
    assert.ok(content.includes('logClientError'), 'must log error to server telemetry');
    assert.ok(content.includes('Try Again / पुनः प्रयास करें') || content.includes('reset()'), 'must offer reset handler');
    assert.ok(content.includes('wa.me/919311215564'), 'must contain WhatsApp link');
    assert.ok(content.includes('+91 93112 15564'), 'must contain support phone');
    assert.ok(content.includes('admissions@viar.in'), 'must contain support email');
  });

  await t.test('app/global-error.tsx exists, includes html & body tags, and offers full recovery', () => {
    const filePath = path.resolve(process.cwd(), 'src/app/global-error.tsx');
    assert.ok(fs.existsSync(filePath), 'src/app/global-error.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes("'use client'"), 'must be a client component');
    assert.ok(content.includes('<html'), 'must include <html> tag');
    assert.ok(content.includes('<body'), 'must include <body> tag');
    assert.ok(content.includes('logClientError'), 'must log error on server');
    assert.ok(content.includes('wa.me/919311215564'), 'must contain WhatsApp link');
    assert.ok(content.includes('+91 93112 15564'), 'must contain contact phone');
    assert.ok(content.includes('admissions@viar.in'), 'must contain contact email');
  });

  await t.test('app/courses/[slug]/error.tsx exists and handles curriculum errors', () => {
    const filePath = path.resolve(process.cwd(), 'src/app/courses/[slug]/error.tsx');
    assert.ok(fs.existsSync(filePath), 'src/app/courses/[slug]/error.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes("'use client'"), 'must be a client component');
    assert.ok(content.includes('logClientError'), 'must log error to server');
    assert.ok(content.includes('wa.me/919311215564'), 'must contain WhatsApp link');
    assert.ok(content.includes('reset()'), 'must offer reset handler');
    assert.ok(content.includes('/courses'), 'must link to /courses');
  });

  await t.test('app/courses/[slug]/not-found.tsx exists and renders clean 404 rather than crashing', () => {
    const filePath = path.resolve(process.cwd(), 'src/app/courses/[slug]/not-found.tsx');
    assert.ok(fs.existsSync(filePath), 'src/app/courses/[slug]/not-found.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('Course Not Found'), 'must state Course Not Found in English');
    assert.ok(content.includes('पाठ्यक्रम नहीं मिला') || content.includes('उपलब्ध नहीं है'), 'must provide Hindi explanation');
    assert.ok(content.includes('/courses'), 'must link to catalog /courses');
    assert.ok(content.includes('wa.me/919311215564'), 'must link to WhatsApp admissions');
  });

  await t.test('app/not-found.tsx exists for site-wide 404 handling', () => {
    const filePath = path.resolve(process.cwd(), 'src/app/not-found.tsx');
    assert.ok(fs.existsSync(filePath), 'src/app/not-found.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('Page Not Found'), 'must state Page Not Found');
    assert.ok(content.includes('पृष्ठ नहीं मिला'), 'must provide Hindi explanation');
    assert.ok(content.includes('/courses'), 'must offer course link');
  });

  await t.test('POST /api/client-errors accepts payload and returns { success: true }', async () => {
    const req = new Request('http://localhost:3000/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'TypeError',
        message: 'Simulated client component error',
        segment: 'courses/[slug]',
        url: 'https://viar.in/courses/test',
        timestamp: new Date().toISOString(),
      }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });
});
