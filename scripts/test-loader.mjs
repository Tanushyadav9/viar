import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }
  if (specifier === 'next/navigation') {
    return nextResolve('next/navigation.js', context);
  }

  let target = specifier;
  if (target.startsWith('@/')) {
    target = path.resolve('src', target.slice(2));
  } else if (context.parentURL && (target.startsWith('./') || target.startsWith('../'))) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    target = path.resolve(parentDir, target);
  }

  if (target.startsWith('/') || target.match(/^[A-Za-z]:[\\/]/)) {
    // Try target as-is
    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      return nextResolve(new URL('file:///' + target.replace(/\\/g, '/')).href, context);
    }
    // Try adding extensions
    for (const ext of ['.ts', '.tsx', '.js', '.mjs', '/route.ts', '/index.ts', '/index.js']) {
      const candidate = target + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return nextResolve(new URL('file:///' + candidate.replace(/\\/g, '/')).href, context);
      }
    }
  }

  return nextResolve(specifier, context);
}
