# Regression Baseline & Verification Record

**Date**: 2026-10-20  
**Branch**: `production-readiness-fixes`  
**Commit**: Initial Baseline  
**Environment**: Node.js v20.x, Windows 11, Next.js 14.2.35, Prisma 5.22.0  
**Baseline Verification Command**: `npm run verify` (`npm run lint && npm test`)  
**Baseline Verification Result**:  
- `next lint`: **0 errors, 0 warnings**
- Node Test Suites: **312 tests passed, 0 failed, 80 test suites (916ms)**

---

## 1. Verified Working Flows Matrix

| Flow / Feature Category | Specific Pages & Components | Verified Behavior | Verification Method |
| :--- | :--- | :--- | :--- |
| **Public Landing & Brand** | `/` (Home), `src/components/HeroSection.tsx`, `src/components/AboutSection.tsx` | Hero banner renders, Acharya Niraj Kumar credentials, trust badges, curriculum highlights, CTA buttons active. | Automated in `tests/walkthrough.test.ts` & Live HTTP 200 |
| **Public Course Catalog** | `/courses`, `/courses/[slug]` (`/courses/what-is-astrology`) | Server-rendered course metadata, syllabus overview, pricing (₹5,100), cohort details, instructor pedigree. | `tests/content-gating.test.ts`, `tests/ai-evaluation-40.test.ts` |
| **Bilingual Localization** | `src/components/LanguageContext.tsx`, Hindi Devanagari maps | Instant toggle between English and Hindi (`hi`), translates headings, badges, syllabus notes, and legal policies. | Automated in `tests/i18n.test.ts` |
| **Timezone & Schedule Engine** | `src/lib/timezones.ts`, Timezone dropdown in Navbar | Live conversions across IST, EDT/EST, BST/GMT; handles live window detection (`too_early`, `window_open`, `live_now`, `ended`). | Automated in `tests/timezone.test.ts` (7/7 tests passed) |
| **Checkout & UPI Order Locking** | `/checkout/[cohortId]`, `src/lib/payments/orders.ts` | Dynamic order generation, server-locked price matching (₹5,100), dynamic UPI URI generation (`upi://pay`), QR generation, 12-digit UTR validation. | Automated in `tests/orders.test.ts` & `tests/webhooks.test.ts` |
| **Payment Claim & WhatsApp Dispatch** | `/api/orders/[id]/claim`, `src/lib/payments/upi.ts` | Submits payment claim, marks order `PAYMENT_CLAIMED`, formats zero-password WhatsApp claim URL with payee VPA and transaction note. | Automated in `tests/orders.test.ts` & `tests/webhooks.test.ts` |
| **Clerk Authentication & Webhooks** | `/login`, `/sign-in`, `/sign-up`, `/api/webhooks/clerk` | Svix signature verification, Clerk live keys prefix (`pk_live_...`), JIT user synchronization, tamper-proof role assignment. | Automated in `tests/webhooks.test.ts`, `tests/server-auth.test.ts` |
| **Site Owner & Diagnostics Access** | `/admin/diagnostics`, `/api/admin/diagnostics` | Strictly restricted to Site Owner (`aapkaastro1606@gmail.com`). Database reachability, latency, migration counts (6 applied), and live telemetry. | Automated in `tests/server-auth.test.ts` & Live Diagnostics |
| **Admin Portal UI** | `/admin`, `src/app/admin/AdminPortalClient.tsx` | Owner reaches console without redirect loop; staff permissions scoping; tabs for orders, content studio, media library, and diagnostics. | Automated in `tests/server-auth.test.ts`, `tests/permissions.test.ts` |
| **Admin Order Verification** | `/api/admin/orders/[id]`, `approveOrder`, `rejectOrder`, `refundOrder` | Owner verifies bank credit, marks order `APPROVED`, activates student enrollment, logs audit trail, or revokes access on refund. | Automated in `tests/orders.test.ts` |
| **Floating AI Assistant** | `src/components/AIAssistantWidget.tsx`, `/api/assistant` | Multilingual detection (Hindi, English, Hinglish), intent classification, grounded knowledge enforcement (₹5,100 pricing, 23 modules, 7-day refund). | Automated in `tests/ai-assistant.test.ts` & `tests/ai-evaluation-40.test.ts` (50/50 Q&A passing) |
| **Content Studio & Revisions** | `/api/admin/content`, `/api/admin/content/revisions` | Versioned content updates, draft vs published workflow, rollback history, collection filtering. | Automated in `tests/content-studio.test.ts` (10/10 tests passed) |
| **Legal & Policy Pages** | `/terms`, `/privacy-policy`, `/refund-policy`, `/pricing-policy`, `/disclaimer` | Compliant 7-day refund terms, pricing transparency, disclaimer of predictions, institutional credentials. | Automated in `tests/production-hardening.test.ts` & Live HTTP 200 |

---

## 2. Preconditions Verified
- **Live Clerk Key Mode**: `LIVE` (`pk_live_...` and `sk_live_...`)
- **Live Database Connection**: Connected to Neon PostgreSQL (`ep-orange-poetry-b4cupwem.c-6.us-east-2.aws.neon.tech`)
- **Prisma Migrations Applied**: 6 applied migrations in database
- **Test Baseline**: 312 passing tests, 0 failing tests, 0 linting errors
