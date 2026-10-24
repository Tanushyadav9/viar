import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq !== -1) {
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

console.log('Environment check:');
console.log('DATABASE_URL defined:', !!env.DATABASE_URL);
if (env.DATABASE_URL) {
  const u = new URL(env.DATABASE_URL);
  console.log('DB Host:', u.hostname);
  console.log('DB Name:', u.pathname);
  console.log('DB User:', u.username);
}
console.log('NEON_API_KEY defined:', !!process.env.NEON_API_KEY || !!env.NEON_API_KEY);
