import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/TANUSH YADAV/.gemini/antigravity/brain/d9194cdb-cf07-491e-9624-5291d0f9b910';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function capture() {
  console.log('Launching Chrome to capture walkthrough proof screenshots...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  // 1. Public Catalog (/courses)
  console.log('Capturing 1/4: Public Catalog (/courses)...');
  await page.goto('http://localhost:3000/courses', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'walkthrough_1_public_catalog.png'), fullPage: false });
  console.log('  ✓ Saved walkthrough_1_public_catalog.png');

  // 2. Public Course Outline with Locked Content (/courses/what-is-astrology)
  console.log('Capturing 2/4: Course Detail Outline & Locked Syllabus Modules...');
  await page.goto('http://localhost:3000/courses/what-is-astrology', { waitUntil: 'networkidle2' });
  
  // Scroll down to the 23-Module Masterclass Section
  await page.evaluate(() => {
    window.scrollBy(0, 1650);
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click the first module toggle button to expand it and reveal lessons
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Module 1')) {
        await btn.click();
        break;
      }
    }
  } catch (err) {
    console.log('Module click note:', err.message);
  }
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'walkthrough_2_course_detail_locked.png'), fullPage: false });
  console.log('  ✓ Saved walkthrough_2_course_detail_locked.png');

  // 3. Logged-out Visitor Redirection on Protected Student Area (/dashboard/courses)
  console.log('Capturing 3/4: Clerk Protected Gate Redirect (/sign-in)...');
  await page.goto('http://localhost:3000/dashboard/courses', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'walkthrough_3_student_my_courses.png'), fullPage: false });
  console.log('  ✓ Saved walkthrough_3_student_my_courses.png');

  // 4. Logged-out Visitor Redirection on Protected Admin / Instructor Area (/instructor/courses)
  console.log('Capturing 4/4: Instructor Access Gate Redirect (/sign-in)...');
  await page.goto('http://localhost:3000/instructor/courses', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'walkthrough_5_instructor_courses.png'), fullPage: false });
  console.log('  ✓ Saved walkthrough_5_instructor_courses.png');

  await browser.close();
  console.log('Walkthrough screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
