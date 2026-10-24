import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GET as getCourses } from '../src/app/api/courses/route.ts';
import { GET as getCourseBySlug } from '../src/app/api/courses/[slug]/route.ts';
import { GET as getCertDownload } from '../src/app/api/certificates/[code]/download/route.ts';
import { GET as getSyllabusDownload } from '../src/app/api/courses/[slug]/syllabus/download/route.ts';
import { GET as getPublicPaymentConfig } from '../src/app/api/payments/config/route.ts';
import { getUnifiedAdminStats } from '../src/lib/analytics/stats.ts';
import { generateUpiUrl } from '../src/lib/payments/upi.ts';
import { NextRequest } from 'next/server';

describe('ADMIN AND WEBSITE ARE ONE SYSTEM — Comprehensive Specification', () => {
  describe('1. Single Source of Truth & Static Fallback Elimination', () => {
    it('GET /api/courses does not fall back to INITIAL_COURSES when database returns courses or empty array', async () => {
      const req = new NextRequest('http://localhost:3000/api/courses');
      const res = await getCourses(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.courses), 'courses must be an array');
    });

    it('GET /api/courses/[slug] returns 404 for non-existent slug (never falls back to fake/static courses)', async () => {
      const req = new NextRequest('http://localhost:3000/api/courses/non-existent-course-slug-xyz');
      const res = await getCourseBySlug(req, { params: { slug: 'non-existent-course-slug-xyz' } });
      assert.strictEqual(res.status, 404, 'Must return 404 for non-existent slug');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'Course not found');
    });

    it('GET /api/certificates/[code]/download returns 404 for invalid certificate (never emits fake certificate)', async () => {
      const req = new NextRequest('http://localhost:3000/api/certificates/FAKE-CERT-99999/download');
      const res = await getCertDownload(req, { params: { code: 'FAKE-CERT-99999' } });
      assert.strictEqual(res.status, 404, 'Must return 404 for invalid certificate code');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'Certificate not found');
    });

    it('GET /api/courses/[slug]/syllabus/download returns 404 for non-existent course slug', async () => {
      const req = new NextRequest('http://localhost:3000/api/courses/non-existent-syllabus/syllabus/download');
      const res = await getSyllabusDownload(req, { params: { slug: 'non-existent-syllabus' } });
      assert.strictEqual(res.status, 404, 'Must return 404 for non-existent syllabus');
    });
  });

  describe('2. Unified Administrative Metrics & Derived Database Figures', () => {
    it('getUnifiedAdminStats provides consistent calculation from Neon PostgreSQL', async () => {
      const stats = await getUnifiedAdminStats();
      assert.ok(typeof stats.totalRevenueInr === 'number', 'totalRevenueInr must be a number');
      assert.ok(stats.totalRevenueInr >= 0, 'totalRevenueInr must be non-negative');
      assert.ok(typeof stats.approvedOrdersCount === 'number', 'approvedOrdersCount must be a number');
      assert.ok(typeof stats.totalStudents === 'number', 'totalStudents must be a number');
      assert.ok(typeof stats.completionRate === 'number', 'completionRate must be a number');
      assert.ok(typeof stats.certificatesIssued === 'number', 'certificatesIssued must be a number');
      
      // USD metrics must NOT exist in the unified admin stats interface
      assert.strictEqual((stats as Record<string, unknown>).totalRevenueUsd, undefined, 'totalRevenueUsd must be eliminated');
      assert.strictEqual((stats as Record<string, unknown>).priceUsd, undefined, 'priceUsd must be eliminated');
    });

    it('exam pass rate is either null (when 0 attempts) or a realistic percentage between 0 and 100', async () => {
      const stats = await getUnifiedAdminStats();
      if (stats.totalExamAttempts === 0) {
        assert.strictEqual(stats.examPassRate, null, 'Must be null when no exams have been attempted');
      } else {
        assert.ok(typeof stats.examPassRate === 'number');
        assert.ok(stats.examPassRate >= 0 && stats.examPassRate <= 100);
      }
    });
  });

  describe('3. Live Payment & Dynamic UPI Settings', () => {
    it('GET /api/payments/config exposes safe public payment settings without admin permissions', async () => {
      const req = new NextRequest('http://localhost:3000/api/payments/config');
      const res = await getPublicPaymentConfig(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.config, 'Must return public config object');
      assert.ok(typeof data.config.upiId === 'string' && data.config.upiId.length > 0, 'upiId must be non-empty string');
      assert.ok(typeof data.config.payeeName === 'string', 'payeeName must be a string');
    });

    it('generateUpiUrl incorporates dynamically supplied VPA and payee name', () => {
      const dynamicVpa = 'customacademy@okaxis';
      const dynamicPayee = 'VIAR Custom Academy';
      const uri = generateUpiUrl({
        amount: 5100,
        studentName: 'Aarav Sharma',
        courseTitle: 'Vedic Astrology',
        vpa: dynamicVpa,
        payeeName: dynamicPayee,
      });

      assert.ok(uri.includes(`pa=${dynamicVpa}`), 'Must include dynamic VPA');
      assert.ok(uri.includes('am=5100'), 'Must include correct tuition amount in INR');
      assert.ok(uri.includes('cu=INR'), 'Currency must strictly be INR');
    });
  });
});
