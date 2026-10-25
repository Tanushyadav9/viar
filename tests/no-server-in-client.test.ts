import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function getAllSourceFiles(dir: string, extensions = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        results.push(...getAllSourceFiles(fullPath, extensions));
      }
    } else if (extensions.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

function resolveImportPath(importSpecifier: string, fromFile: string): string | null {
  if (importSpecifier.startsWith('.')) {
    const dir = path.dirname(fromFile);
    const resolvedBase = path.resolve(dir, importSpecifier);
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']) {
      const candidate = resolvedBase + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return path.normalize(candidate);
      }
    }
    return null;
  }

  if (importSpecifier.startsWith('@/')) {
    const rel = importSpecifier.slice(2);
    const resolvedBase = path.resolve(process.cwd(), 'src', rel);
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']) {
      const candidate = resolvedBase + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return path.normalize(candidate);
      }
    }
    return null;
  }

  return null;
}

function extractImports(sourceCode: string): string[] {
  const imports: string[] = [];
  // Match `import ... from '...'` and `import '...'`
  const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?|export\s+(?:[\w*\s{},]*\s+from\s+)?|import\()\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(sourceCode)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

test('Architectural Boundary: Client components must NEVER import server-only modules', async (t) => {
  const srcFiles = getAllSourceFiles(path.resolve(process.cwd(), 'src'));

  // 1. Identify all server-only modules
  const serverOnlyFiles = new Set<string>();
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (
      content.includes("import 'server-only'") ||
      content.includes('import "server-only"') ||
      content.includes("from 'server-only'") ||
      content.includes('from "server-only"')
    ) {
      serverOnlyFiles.add(path.normalize(file));
    }
  }

  // Known dangerous server-only third-party or Node packages
  const forbiddenServerPackages = [
    'server-only',
    '@prisma/client',
    'svix',
    'node:fs',
    'node:child_process',
    'child_process',
  ];

  await t.test('Server-only files are present and tracked', () => {
    assert.ok(serverOnlyFiles.size >= 5, `Expected at least 5 server-only files, found ${serverOnlyFiles.size}`);
  });

  // 2. Identify all client components (marked with 'use client')
  const clientComponentFiles: string[] = [];
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const trimmed = content.trimStart();
    if (trimmed.startsWith("'use client'") || trimmed.startsWith('"use client"')) {
      clientComponentFiles.push(path.normalize(file));
    }
  }

  await t.test('Client components are discovered', () => {
    assert.ok(clientComponentFiles.length > 0, 'Should find client components in src/');
  });

  // 3. Trace imports of each client component recursively
  const violations: { clientFile: string; chain: string[]; target: string }[] = [];

  for (const clientFile of clientComponentFiles) {
    const visited = new Set<string>();

    const trace = (currentFile: string, currentChain: string[]) => {
      if (visited.has(currentFile)) return;
      visited.add(currentFile);

      const content = fs.readFileSync(currentFile, 'utf-8');
      const importedSpecifiers = extractImports(content);

      for (const spec of importedSpecifiers) {
        // Check for forbidden package imports
        if (forbiddenServerPackages.includes(spec)) {
          violations.push({
            clientFile,
            chain: [...currentChain, spec],
            target: spec,
          });
          continue;
        }

        const resolved = resolveImportPath(spec, currentFile);
        if (resolved) {
          if (serverOnlyFiles.has(resolved)) {
            violations.push({
              clientFile,
              chain: [...currentChain, path.relative(process.cwd(), resolved)],
              target: path.relative(process.cwd(), resolved),
            });
          } else {
            trace(resolved, [...currentChain, path.relative(process.cwd(), resolved)]);
          }
        }
      }
    }

    const relClient = path.relative(process.cwd(), clientFile);
    trace(clientFile, [relClient]);
  }

  await t.test('Zero violations: no client component imports any server-only module or file', () => {
    if (violations.length > 0) {
      const errorMsg = violations
        .map((v) => `\n❌ Client Component "${v.clientFile}" imports "${v.target}"\n   Chain: ${v.chain.join(' -> ')}`)
        .join('\n');
      assert.fail(`Found ${violations.length} server-in-client boundary violation(s):${errorMsg}`);
    }
    assert.equal(violations.length, 0);
  });
});
