import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\TANUSH YADAV\\.gemini\\antigravity\\brain\\096bfe9f-b128-4fdd-964d-724a827165d5';
const USER_UPLOADED_DIR = path.join(ARTIFACT_DIR, '.user_uploaded');
const PUBLIC_DIR = path.resolve('public/screenshots');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 1. Copy user-uploaded before screenshots to recognizable filenames
const copyMap = [
  { src: 'media_1793115402232_9ede0106.jpg', dest: 'before-1-sessions-admin.png' },
  { src: 'media_1793119380497_a94c7bb7.jpg', dest: 'before-2-student-portal-request.png' },
  { src: 'media_1793119389572_20fa4da2.jpg', dest: 'before-3-student-portal-grey-placeholder.png' },
];

for (const item of copyMap) {
  const srcPath = path.join(USER_UPLOADED_DIR, item.src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(ARTIFACT_DIR, item.dest));
    fs.copyFileSync(srcPath, path.join(PUBLIC_DIR, item.dest));
    console.log(`Copied ${item.src} -> ${item.dest}`);
  }
}

console.log('User uploaded before screenshots copied.');
