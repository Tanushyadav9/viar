import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_COURSES } from '@/lib/data';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const autoPrint = searchParams.get('print') === 'true';

  const course = INITIAL_COURSES.find((c) => c.slug === slug) || INITIAL_COURSES[0];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${course.title} — Comprehensive Syllabus | Viar.in</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      padding: 20px;
    }

    .header {
      border-bottom: 2px solid #E8A33D;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .academy-brand {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      font-weight: 800;
      color: #7B2D26;
      letter-spacing: 1px;
    }

    .academy-sub {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      margin-top: 2px;
    }

    .course-meta {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }

    .course-title {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .tagline {
      font-size: 14px;
      color: #C1662F;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #faf8f5;
      border: 1px solid #f1e9dd;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 24px;
    }

    .stat-box {
      text-align: center;
    }

    .stat-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-val {
      font-size: 14px;
      font-weight: 700;
      color: #7B2D26;
    }

    .instructor-card {
      background: #fdfaf6;
      border-left: 4px solid #7B2D26;
      padding: 12px 16px;
      margin-bottom: 24px;
      border-radius: 0 8px 8px 0;
    }

    .instructor-name {
      font-weight: 700;
      color: #7B2D26;
      font-size: 14px;
    }

    .instructor-bio {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
    }

    .section-title {
      font-family: 'Cinzel', serif;
      font-size: 16px;
      color: #7B2D26;
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 20px 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .module-card {
      margin-bottom: 18px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .module-header {
      background: #fafaf9;
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .module-title {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
    }

    .module-timing {
      font-size: 11px;
      font-weight: 600;
      color: #C1662F;
      background: #fff4ed;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .module-desc {
      padding: 10px 14px;
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }

    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="academy-brand">VIHANGAM INSTITUTE OF ASTROLOGY AND RESEARCH</div>
      <div class="academy-sub">VIAR.IN • In Academic Lineage with Aapka Astro</div>
    </div>
    <div class="course-meta">
      <div>Accredited Course Syllabus</div>
      <div>Official Academic Curriculum</div>
    </div>
  </div>

  <h1 class="course-title">${course.title}</h1>
  <div class="tagline">${course.tagline}</div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-label">Delivery Mode</div>
      <div class="stat-val">100% Self-Paced</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Total Curriculum</div>
      <div class="stat-val">${course.totalModules || 23} Modules (Self-Paced)</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Curriculum Level</div>
      <div class="stat-val">${course.level}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Tuition</div>
      <div class="stat-val">₹${course.priceInr.toLocaleString('en-IN')}</div>
    </div>
  </div>

  <div class="instructor-card">
    <div class="instructor-name">Master Instructor: Acharya Niraj Kumar</div>
    <div class="instructor-bio">
      Founder, Aapka Astro • Jyotish Acharya (Bharatiya Vidya Bhavan, New Delhi) • Certified Logical Vastu Expert • Astro Vastu Specialist
    </div>
  </div>

  <div class="section-title">Course Description & Philosophy</div>
  <p style="font-size: 12px; color: #334155; margin-bottom: 16px; line-height: 1.6;">
    ${course.description}
  </p>

  <div class="section-title">Detailed Curriculum Modules (23 Modules: 21 Core + 2 Bonus)</div>
  
  ${course.modules && course.modules.length > 0 ? course.modules.map((mod) => `
    <div class="module-card">
      <div class="module-header">
        <span class="module-title">${mod.isBonus ? `Bonus Video — Module ${mod.moduleNumber}: ${mod.title.replace(/^Bonus Video\s*—\s*/i, '')}` : `Module ${mod.moduleNumber}: ${mod.title}`}</span>
        <span class="module-timing">${mod.durationMinutes ? `${mod.durationMinutes} mins` : 'Self-Paced'}</span>
      </div>
      <div class="module-desc">
        ${mod.description}
      </div>
    </div>
  `).join('') : `
    <div class="module-card">
      <div class="module-header">
        <span class="module-title">Complete 23-Module Curriculum</span>
        <span class="module-timing">23 Video Lessons • Self-Paced</span>
      </div>
      <div class="module-desc">
        Syllabus structure and session materials are provided in your student portal upon enrollment.
      </div>
    </div>
  `}

  <div class="section-title">What You Will Master</div>
  <ul style="font-size: 12px; color: #334155; margin-left: 20px; line-height: 1.8; margin-bottom: 20px;">
    ${course.whatYouWillLearn.map((item) => `<li>${item}</li>`).join('')}
  </ul>

  <div class="section-title">Certification & Examination</div>
  <p style="font-size: 12px; color: #334155; margin-bottom: 24px; line-height: 1.6;">
    Upon completing the 23 video modules, students unlock the 20-question final graded assessment. Achieving &ge;70% unlocks an authentic, verifiable certificate of completion signed by Acharya Niraj Kumar, permanently hosted and verifiable at <strong>https://viar.in/verify</strong>.
  </p>

  <div class="footer">
    <div>Vihangam Institute of Astrology and Research (VIAR) • aapkaastro1606@gmail.com • WhatsApp: +91 93112 15564</div>
    <div>Official Syllabus Document • https://viar.in/courses/${course.slug}</div>
  </div>

  ${autoPrint ? `<script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>` : ''}
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="syllabus-${slug}.html"`,
    },
  });
}
