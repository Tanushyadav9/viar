import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_COURSES } from '@/lib/data';

interface RouteParams {
  params: {
    code: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { code } = params;
  const { searchParams } = new URL(req.url);
  const autoPrint = searchParams.get('print') === 'true';

  let studentName = 'Dedicated Student';
  let courseTitle = INITIAL_COURSES[0].title;
  let issueDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  let grade = 'Distinction (95%)';
  let certId = code || 'VIAR-2026-CERT';

  // Attempt database retrieval
  try {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { certificateNumber: code },
          { verifySlug: code },
        ],
      },
      include: {
        user: true,
        cohort: { include: { course: true } },
      },
    });

    if (cert) {
      studentName = cert.user?.name || studentName;
      courseTitle = cert.cohort?.course?.title || courseTitle;
      issueDate = cert.issuedAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      grade = cert.grade ? `${cert.grade} (${cert.scorePercentage || 90}%)` : grade;
      certId = cert.certificateNumber;
    }
  } catch (err) {
    console.warn('Database cert download lookup skipped:', (err as Error).message);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion - ${certId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 297mm;
      height: 210mm;
      background: #0f172a;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cert-outer {
      width: 280mm;
      height: 195mm;
      background: radial-gradient(circle at center, #1e1b4b 0%, #09090b 100%);
      border: 4px solid #d97706;
      border-radius: 12px;
      padding: 10mm;
      position: relative;
      box-shadow: 0 0 30px rgba(217, 119, 6, 0.2);
    }

    .cert-inner {
      width: 100%;
      height: 100%;
      border: 1.5px solid rgba(251, 191, 36, 0.4);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 8mm 14mm;
      text-align: center;
      position: relative;
    }

    .corner-decor {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: #f59e0b;
    }
    .tl { top: 6px; left: 6px; border-top: 2px solid #f59e0b; border-left: 2px solid #f59e0b; }
    .tr { top: 6px; right: 6px; border-top: 2px solid #f59e0b; border-right: 2px solid #f59e0b; }
    .bl { bottom: 6px; left: 6px; border-bottom: 2px solid #f59e0b; border-left: 2px solid #f59e0b; }
    .br { bottom: 6px; right: 6px; border-bottom: 2px solid #f59e0b; border-right: 2px solid #f59e0b; }

    .header-tag {
      font-size: 11px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #fbbf24;
      font-weight: 700;
    }

    .title {
      font-family: 'Cinzel', serif;
      font-size: 30px;
      font-weight: 700;
      color: #fef08a;
      letter-spacing: 2px;
      margin-top: 2mm;
    }

    .subtitle {
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 1px;
    }

    .presented-to {
      font-size: 12px;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 3mm;
    }

    .recipient {
      font-family: 'Cinzel', serif;
      font-size: 34px;
      font-weight: 800;
      color: #ffffff;
      border-bottom: 2px solid rgba(245, 158, 11, 0.5);
      padding: 0 20px 6px 20px;
      margin-top: 1mm;
      display: inline-block;
    }

    .completion-text {
      max-width: 180mm;
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.5;
      margin-top: 3mm;
    }

    .course-title {
      color: #fde047;
      font-weight: 700;
    }

    .footer {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 5mm;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sig-block {
      text-align: center;
      width: 65mm;
    }

    .sig-line {
      font-family: 'Cinzel', serif;
      font-size: 15px;
      font-weight: 700;
      color: #fef08a;
      border-top: 1px solid rgba(245, 158, 11, 0.6);
      padding-top: 4px;
    }

    .sig-title {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cert-meta {
      text-align: center;
    }

    .cert-id {
      font-family: monospace;
      font-size: 11px;
      color: #fbbf24;
      letter-spacing: 1px;
    }

    .cert-link {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }

    @media print {
      body {
        background: transparent;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="cert-outer">
    <div class="cert-inner">
      <div class="corner-decor tl"></div>
      <div class="corner-decor tr"></div>
      <div class="corner-decor bl"></div>
      <div class="corner-decor br"></div>

      <div>
        <div class="header-tag">Vedic Institute of Astrological Research (Viar.in)</div>
        <h1 class="title">Certificate of Completion</h1>
        <div class="subtitle">In Affiliation with Aapka Astro & Authentic Guru Shishya Lineage</div>
      </div>

      <div>
        <div class="presented-to">This is proudly conferred upon</div>
        <div class="recipient">${studentName}</div>
      </div>

      <div class="completion-text">
        for successfully attending all lectures, completing rigorous chart analyses, and passing the comprehensive certification examination with <strong style="color: #4ade80;">${grade}</strong> in the masterclass:
        <br>
        <span class="course-title">${courseTitle}</span>
      </div>

      <div class="footer">
        <div class="sig-block">
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Issued On</div>
          <div style="font-size: 13px; font-weight: 600; color: #f8fafc;">${issueDate}</div>
        </div>

        <div class="cert-meta">
          <div class="cert-id">${certId}</div>
          <div class="cert-link">Verify authenticity at viar.in/verify/${certId}</div>
        </div>

        <div class="sig-block">
          <div class="sig-line">Acharya Niraj Kumar</div>
          <div class="sig-title">Master Astrologer & Founder, Aapka Astro</div>
        </div>
      </div>
    </div>
  </div>

  ${autoPrint ? `<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>` : ''}
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="certificate-${code}.html"`,
    },
  });
}
