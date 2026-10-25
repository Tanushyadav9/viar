import fs from 'fs';
import path from 'path';

// 1. Fix src/components/CourseDetailClient.tsx
const courseDetailPath = path.resolve('src/components/CourseDetailClient.tsx');
let cdc = fs.readFileSync(courseDetailPath, 'utf8');

// Ensure publishedLessonsCount is array-safe
cdc = cdc.replace(
  'if (course.modules && course.modules.length > 0) {',
  'if (Array.isArray(course.modules) && course.modules.length > 0) {'
);
cdc = cdc.replace(
  'if (m.lessons && m.lessons.length > 0) {',
  'if (Array.isArray(m.lessons) && m.lessons.length > 0) {'
);

// Ensure cohorts array check
cdc = cdc.replace(
  'if (data.course.cohorts && data.course.cohorts.length > 0) {',
  'if (Array.isArray(data.course.cohorts) && data.course.cohorts.length > 0) {'
);

// Ensure discountPercent calculation is null/NaN safe
cdc = cdc.replace(
  /const discountPercent = origPriceNum > priceNum\s*\?\s*Math\.round\(\(\(course\.originalPriceInr - course\.priceInr\) \/ course\.originalPriceInr\) \* 100\)\s*:\s*54;/,
  `const discountPercent = origPriceNum > priceNum && origPriceNum > 0\n    ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100)\n    : 54;`
);

// Ensure modules map is array-safe
cdc = cdc.replace(
  '{course.modules.map((module) => {',
  '{(Array.isArray(course.modules) ? course.modules : []).map((module) => {'
);

// Ensure FAQs section is array-safe
cdc = cdc.replace(
  `{course.faqs.map((faq, idx) => (`,
  `{(Array.isArray(course.faqs) ? course.faqs : []).map((faq, idx) => (`
);

fs.writeFileSync(courseDetailPath, cdc, 'utf8');
console.log('✅ Applied null-safe fixes to CourseDetailClient.tsx');

// 2. Fix src/app/courses/page.tsx
const coursesPagePath = path.resolve('src/app/courses/page.tsx');
let cp = fs.readFileSync(coursesPagePath, 'utf8');

cp = cp.replace(
  "import { Course } from '@/lib/types';",
  "import { CoursePublicDTO } from '@/lib/courses/dto';\nimport { Course } from '@/lib/types';"
);
cp = cp.replace(
  'const [courses, setCourses] = useState<Course[]>([]);',
  'const [courses, setCourses] = useState<CoursePublicDTO[]>([]);'
);
cp = cp.replace(
  'const [notifyCourse, setNotifyCourse] = useState<Course | null>(null);',
  'const [notifyCourse, setNotifyCourse] = useState<CoursePublicDTO | null>(null);'
);

fs.writeFileSync(coursesPagePath, cp, 'utf8');
console.log('✅ Applied null-safe fixes to src/app/courses/page.tsx');

// 3. Fix src/components/WelcomeCohortModal.tsx
const welcomeModalPath = path.resolve('src/components/WelcomeCohortModal.tsx');
let wm = fs.readFileSync(welcomeModalPath, 'utf8');

// Null-safe targetCohort fallback
wm = wm.replace(
  'const targetCohort = cohort || ViarStore.getCohorts()[0];',
  'const targetCohort = cohort || (Array.isArray(ViarStore.getCohorts()) ? ViarStore.getCohorts()[0] : null);'
);
wm = wm.replace(
  'const flagshipCohort = flagship ? ViarStore.getCohorts(flagship.id)[0] : null;',
  'const flagshipCohort = flagship ? (Array.isArray(ViarStore.getCohorts(flagship.id)) ? ViarStore.getCohorts(flagship.id)[0] : null) : null;'
);

fs.writeFileSync(welcomeModalPath, wm, 'utf8');
console.log('✅ Applied null-safe fixes to WelcomeCohortModal.tsx');

// 4. Fix src/app/dashboard/courses/[cohortId]/page.tsx
const dashboardCohortPagePath = path.resolve('src/app/dashboard/courses/[cohortId]/page.tsx');
let dcp = fs.readFileSync(dashboardCohortPagePath, 'utf8');

dcp = dcp.replace(
  'const fallbackCohort = ViarStore.getCohortById(cohortId) || ViarStore.getCohorts()[0];',
  'const fallbackCohort = ViarStore.getCohortById(cohortId) || (Array.isArray(ViarStore.getCohorts()) ? ViarStore.getCohorts()[0] : null);'
);

fs.writeFileSync(dashboardCohortPagePath, dcp, 'utf8');
console.log('✅ Applied null-safe fixes to dashboard/courses/[cohortId]/page.tsx');
