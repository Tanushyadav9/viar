import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { getLocalizedContent, formatINR } from '../src/i18n/index.ts';

// Allowed technical acronyms and brands in Hindi strings/parentheses
const ALLOWED_ACRONYMS = new Set(['VIAR', 'viar.in', 'UPI', 'QR', 'WhatsApp', 'GPay', 'PhonePe', 'Paytm', 'BHIM', 'UTR', 'PDF', 'INR', 'Google Pay']);

function flattenKeys(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value as Record<string, unknown>, newKey));
    } else if (typeof value === 'string') {
      result[newKey] = value;
    }
  }
  return result;
}

test('i18n Bilingual Translation Quality & Completeness Suite', async (t) => {
  const enPath = path.resolve(process.cwd(), 'src/i18n/locales/en.json');
  const hiPath = path.resolve(process.cwd(), 'src/i18n/locales/hi.json');

  const enRaw = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const hiRaw = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

  const enFlat = flattenKeys(enRaw);
  const hiFlat = flattenKeys(hiRaw);

  await t.test('1. Key Parity: Every English key has a matching Hindi key', () => {
    const missingInHi: string[] = [];
    for (const key of Object.keys(enFlat)) {
      if (!(key in hiFlat)) {
        missingInHi.push(key);
      }
    }
    assert.deepStrictEqual(missingInHi, [], `Missing Hindi translations for keys: ${missingInHi.join(', ')}`);
  });

  await t.test('2. Key Parity: No orphaned Hindi keys without English counterpart', () => {
    const missingInEn: string[] = [];
    for (const key of Object.keys(hiFlat)) {
      if (!(key in enFlat)) {
        missingInEn.push(key);
      }
    }
    assert.deepStrictEqual(missingInEn, [], `Orphaned Hindi keys without English source: ${missingInEn.join(', ')}`);
  });

  await t.test('3. Non-Empty Strings: No translation key is empty or whitespace-only', () => {
    const emptyKeys: string[] = [];
    for (const [key, val] of Object.entries(hiFlat)) {
      if (!val || val.trim().length === 0) {
        emptyKeys.push(key);
      }
    }
    assert.deepStrictEqual(emptyKeys, [], `Found empty Hindi keys: ${emptyKeys.join(', ')}`);
  });

  await t.test('4. Authentic Devanagari Presence: Hindi strings must contain Devanagari script', () => {
    const devanagariRegex = /[\u0900-\u097F]/;
    const nonDevanagariKeys: Array<{ key: string; val: string }> = [];

    for (const [key, val] of Object.entries(hiFlat)) {
      // Must contain at least one Devanagari character unless it's a pure currency symbol, number, or punctuation
      if (!devanagariRegex.test(val) && !/^[₹\d\s.,:;!?%/-]+$/.test(val)) {
        nonDevanagariKeys.push({ key, val });
      }
    }

    assert.deepStrictEqual(
      nonDevanagariKeys,
      [],
      `Hindi keys missing authentic Devanagari script: ${JSON.stringify(nonDevanagariKeys)}`
    );
  });

  await t.test('5. Anti-Mixed-Leftovers: Strictly ban parenthetical English words like "(About)"', () => {
    // Detect any parentheses in Hindi strings: e.g. "(About)", "(54% छूट)", etc.
    const parentheticalRegex = /\(([^)]+)\)/g;
    const violations: Array<{ key: string; parenthetical: string; full: string }> = [];

    for (const [key, val] of Object.entries(hiFlat)) {
      const matches = [...val.matchAll(parentheticalRegex)];
      for (const match of matches) {
        const inside = match[1].trim();
        const hasDevanagari = /[\u0900-\u097F]/.test(inside);
        
        // If it doesn't contain Devanagari, it must be in the approved acronym/token whitelist
        if (!hasDevanagari) {
          const words = inside.split(/[\s,]+/);
          const allAllowed = words.every((w) => ALLOWED_ACRONYMS.has(w) || /^\d+%?$/.test(w));
          if (!allAllowed) {
            violations.push({
              key,
              parenthetical: match[0],
              full: val,
            });
          }
        }
      }
    }

    assert.deepStrictEqual(
      violations,
      [],
      `Found untranslated English leftovers or banned parenthetical text: ${JSON.stringify(violations, null, 2)}`
    );
  });

  await t.test('6. Content Fallback: getLocalizedContent returns Hindi when available, falls back to English', () => {
    const itemWithHi = {
      title: 'Astrology Basics',
      titleHi: 'ज्योतिष की आधारशिला',
      description: 'Learn planets and signs',
      descriptionHi: 'ग्रहों और राशियों का अध्ययन',
    };

    const itemWithoutHi = {
      title: 'Advanced Prashna',
      titleHi: null,
      description: 'Horary astrology method',
      descriptionHi: '',
    };

    // Hindi locale with Hindi available
    const localizedHi = getLocalizedContent(itemWithHi, 'hi');
    assert.strictEqual(localizedHi.title, 'ज्योतिष की आधारशिला');
    assert.strictEqual(localizedHi.description, 'ग्रहों और राशियों का अध्ययन');

    // English locale with Hindi available
    const localizedEn = getLocalizedContent(itemWithHi, 'en');
    assert.strictEqual(localizedEn.title, 'Astrology Basics');
    assert.strictEqual(localizedEn.description, 'Learn planets and signs');

    // Hindi locale with Hindi missing (graceful fallback)
    const fallbackHi = getLocalizedContent(itemWithoutHi, 'hi');
    assert.strictEqual(fallbackHi.title, 'Advanced Prashna');
    assert.strictEqual(fallbackHi.description, 'Horary astrology method');
  });

  await t.test('7. formatINR Currency Formatter in English & Hindi', () => {
    const formattedEn = formatINR(5100, 'en');
    assert.ok(formattedEn.includes('5,100'), `Expected formatted English INR, got: ${formattedEn}`);

    const formattedHi = formatINR(5100, 'hi');
    assert.ok(formattedHi.includes('5,100'), `Expected formatted Hindi INR, got: ${formattedHi}`);
  });
});
