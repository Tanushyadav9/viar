import fs from 'fs';
import path from 'path';

const jsPath = path.resolve('.next/static/chunks/app/courses/[slug]/page-143190fece7abdfb.js');
const content = fs.readFileSync(jsPath, 'utf8');

// Look around 31043
const start = Math.max(0, 31043 - 250);
const end = Math.min(content.length, 31043 + 250);
console.log('Snippet around 31043:');
console.log(content.slice(start, end));
console.log('\nExact character at 31043:', content[31043]);
