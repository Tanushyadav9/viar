import fs from 'fs';
import path from 'path';

// Parse raw source map mappings or check if source-map library is installed
async function main() {
  const mapPath = path.resolve('.next/static/chunks/app/courses/[slug]/page-143190fece7abdfb.js.map');
  const rawMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

  console.log('Sources in map:');
  rawMap.sources.forEach((s, idx) => console.log(`[${idx}] ${s}`));

  // Check if source-map is available
  try {
    const { SourceMapConsumer } = await import('source-map');
    const consumer = await new SourceMapConsumer(rawMap);
    const pos = consumer.originalPositionFor({
      line: 1,
      column: 31043,
    });
    console.log('\nDecoded Original Position for line 1 col 31043:');
    console.log(JSON.stringify(pos, null, 2));
    consumer.destroy();
  } catch (err) {
    console.log('source-map package not installed or error:', err.message);
  }
}

main();
