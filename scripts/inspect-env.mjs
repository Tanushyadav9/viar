import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const lines = env.split(/\r?\n/);
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (key.includes('URL') || key.includes('DATABASE')) {
    try {
      const u = new URL(val);
      console.log(`${key}: host=${u.host}, pathname=${u.pathname}, protocol=${u.protocol}`);
    } catch(e) {
      console.log(`${key}: unable to parse URL`);
    }
  } else if (key.includes('CLERK')) {
    const prefix = val.substring(0, 8);
    console.log(`${key}: prefix=${prefix}, length=${val.length}`);
  } else {
    console.log(`${key}: present, length=${val.length}`);
  }
}
