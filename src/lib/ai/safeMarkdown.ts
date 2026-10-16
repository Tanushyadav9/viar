import React from 'react';

/**
 * 1. STRICT LINK ALLOWLIST
 * Allows links ONLY to:
 * - This site (internal paths starting with a single '/' and not '//', or canonical viar.in)
 * - WhatsApp (https://wa.me/... or https://api.whatsapp.com/...)
 * - Telephone (tel:...)
 * Rejects javascript:, data:, and all third-party external URLs.
 */
export function isAllowedLinkUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // 1. Internal site path (must start with / and not // or /\\)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return true;
  }

  // 2. Canonical site URLs
  if (trimmed.startsWith('https://viar.in') || trimmed.startsWith('http://viar.in')) {
    return true;
  }

  // 3. Official WhatsApp links
  if (
    trimmed.startsWith('https://wa.me/') ||
    trimmed.startsWith('https://api.whatsapp.com/')
  ) {
    return true;
  }

  // 4. Telephone links
  if (trimmed.startsWith('tel:')) {
    return true;
  }

  return false;
}

/**
 * 2. ROUTE SUPPRESSION LOGIC
 * Hide the floating AI assistant completely on:
 * - /admin/*
 * - /dashboard/*
 * - /instructor/*
 * - /checkout/*
 * and their bilingual /hi/* counterparts.
 */
export function shouldSuppressAssistant(pathname: string | null | undefined): boolean {
  if (!pathname) return true;

  const normalized = pathname.toLowerCase();
  const suppressedPrefixes = [
    '/admin',
    '/dashboard',
    '/instructor',
    '/checkout',
    '/hi/admin',
    '/hi/dashboard',
    '/hi/instructor',
    '/hi/checkout',
  ];

  return suppressedPrefixes.some((prefix) => normalized.startsWith(prefix));
}

/**
 * 3. SUGGESTED QUESTION CHIPS
 * Exactly four chips in English and Hindi.
 */
export const SUGGESTED_QUESTION_CHIPS = {
  en: [
    'What is the course fee?',
    'What are the 23 modules?',
    'Who is the instructor?',
    'How do I get certified?',
  ],
  hi: [
    'कोर्स की फीस कितनी है?',
    '23 मॉड्यूल में क्या शामिल है?',
    'आचार्य जी की योग्यता क्या है?',
    'सर्टिफिकेट कैसे मिलेगा?',
  ],
} as const;

/**
 * 4. ESCALATION WHATSAPP URL GENERATOR
 * Pre-fills WhatsApp message with the visitor's last inquiry.
 */
export function buildEscalationWhatsAppUrl(lastUserQuestion?: string, isHi: boolean = false): string {
  const phone = '919311215564';
  const trimmed = lastUserQuestion?.trim();

  let message = '';
  if (trimmed) {
    message = isHi
      ? `नमस्ते आचार्य जी, मैं VIAR AI सहायक से पूछ रहा था: "${trimmed}"। क्या आप मार्गदर्शन कर सकते हैं?`
      : `Namaste Acharya ji, I was asking the VIAR AI assistant: "${trimmed}". Could you please guide me?`;
  } else {
    message = isHi
      ? 'नमस्ते आचार्य जी, मुझे विहंगम ज्योतिष मास्टरक्लास के बारे में जानकारी चाहिए।'
      : 'Namaste Acharya ji, I have an inquiry regarding the VIAR Vedic Astrology Masterclass.';
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * 5. SAFE MARKDOWN RENDERER (NO RAW HTML)
 * Converts bold text, bulleted lists, numbered lists, and safe allowed links
 * into safe React nodes. Never uses dangerouslySetInnerHTML.
 */
export function renderSafeMarkdown(content: string): React.ReactNode {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        React.createElement(
          'ul',
          { key: `${keyPrefix}-ul`, className: 'list-disc pl-5 my-1.5 space-y-1' },
          currentList.items.map((item, idx) =>
            React.createElement('li', { key: idx, className: 'leading-relaxed' }, renderInlineSafeMarkdown(item))
          )
        )
      );
    } else {
      elements.push(
        React.createElement(
          'ol',
          { key: `${keyPrefix}-ol`, className: 'list-decimal pl-5 my-1.5 space-y-1' },
          currentList.items.map((item, idx) =>
            React.createElement('li', { key: idx, className: 'leading-relaxed' }, renderInlineSafeMarkdown(item))
          )
        )
      );
    }
    currentList = null;
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Bullet list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.slice(2).trim();
      if (!currentList || currentList.type !== 'ul') {
        flushList(`flush-${lineIdx}`);
        currentList = { type: 'ul', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Numbered list item
    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      const itemText = numberedMatch[1].trim();
      if (!currentList || currentList.type !== 'ol') {
        flushList(`flush-${lineIdx}`);
        currentList = { type: 'ol', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    flushList(`flush-before-${lineIdx}`);

    if (trimmed.length === 0) {
      elements.push(React.createElement('div', { key: `empty-${lineIdx}`, className: 'h-1.5' }));
      return;
    }

    elements.push(
      React.createElement(
        'p',
        { key: `p-${lineIdx}`, className: 'leading-relaxed my-0.5' },
        renderInlineSafeMarkdown(trimmed)
      )
    );
  });

  flushList('flush-final');

  return React.createElement(React.Fragment, null, ...elements);
}

/**
 * Helper: Parse inline markdown (**bold**, [label](url))
 * into safe React nodes. Disallows any raw HTML tags.
 */
function renderInlineSafeMarkdown(text: string): React.ReactNode {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, label, url] = match;
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      parts.push(renderBoldItalic(text.substring(lastIndex, startIndex), `pre-${startIndex}`));
    }

    if (isAllowedLinkUrl(url)) {
      const isExternal = url.startsWith('http') || url.startsWith('tel:');
      parts.push(
        React.createElement(
          'a',
          {
            key: `link-${startIndex}`,
            href: url,
            target: isExternal ? '_blank' : undefined,
            rel: isExternal ? 'noopener noreferrer' : undefined,
            className:
              'text-amber-400 font-medium underline underline-offset-2 hover:text-amber-300 focus-visible:ring-1 focus-visible:ring-amber-400 rounded-sm',
          },
          label
        )
      );
    } else {
      parts.push(renderBoldItalic(label, `disallowed-${startIndex}`));
    }

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(renderBoldItalic(text.substring(lastIndex), `post-${lastIndex}`));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Helper: Parse bold **bold**
 */
function renderBoldItalic(text: string, keyPrefix: string): React.ReactNode {
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldContent = part.slice(2, -2);
      return React.createElement(
        'strong',
        { key: `${keyPrefix}-b-${idx}`, className: 'font-semibold text-white' },
        boldContent
      );
    }
    return part;
  });
}
