/**
 * VIAR Content Sanitizer
 * 
 * CORE SECURITY GUARANTEES:
 * 1. Safe Formatting Only: Headings (h1-h6), bold/italic, lists (ul/ol/li), blockquotes, links, and paragraphs.
 * 2. Strict Link Filtering: Links may ONLY be https, tel, mailto, or wa.me (or internal root paths '/').
 *    Never allows javascript:, data:, vbscript:, or protocol-relative '//'.
 * 3. Never Allow Raw HTML Scripts or Injections: Strips <script>, <iframe>, <object>, <embed>, <style>,
 *    and all inline event handlers (onerror, onclick, onload, etc.).
 * 4. Dual Enforcement: Sanitizes both on save and on render.
 */

const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a'
]);

/**
 * Validates whether a link URL is safe for visitor presentation.
 * Allowed: https://..., tel:..., mailto:..., https://wa.me/..., or internal single-slash /...
 */
export function isSafeContentUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();

  // Reject empty or protocol-relative or backslash evasions
  if (trimmed.startsWith('//') || trimmed.includes('\\')) return false;

  // Single-slash internal route (e.g. '/courses/what-is-astrology')
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  // Safe protocols: https:, tel:, mailto:
  if (/^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    return true;
  }

  if (/^tel:\+?[0-9\s-]{7,18}$/i.test(trimmed)) {
    return true;
  }

  if (/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(trimmed)) {
    return true;
  }

  if (/^https:\/\/wa\.me\/[0-9]{8,15}(\?.*)?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Cleans and sanitizes raw rich-text or HTML input string.
 * Strips all dangerous tags, scripts, and event handlers.
 */
export function sanitizeRichText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // 1. Strip script, iframe, object, embed, style, meta, link, form, input tags with content
  sanitized = sanitized.replace(/<\s*(script|iframe|object|embed|style|meta|link|form|input|button|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  sanitized = sanitized.replace(/<\s*(script|iframe|object|embed|style|meta|link|form|input|button|svg|math)[^>]*\/?>/gi, '');

  // 2. Strip inline event handlers (e.g. onload=, onerror=, onclick=)
  sanitized = sanitized.replace(/\s*on[a-zA-Z]+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');

  // 3. Strip javascript:, data:, vbscript: protocols from anywhere
  sanitized = sanitized.replace(/(javascript|data|vbscript):/gi, 'blocked:');

  // 4. Parse tags and ensure only allowed tags survive
  sanitized = sanitized.replace(/<\/?([a-zA-Z0-9_-]+)([^>]*)>/g, (fullMatch, rawTagName, rawAttrs) => {
    const tagName = rawTagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      // Disallowed tag -> strip tag markup, preserve inner text
      return '';
    }

    const isClosing = fullMatch.startsWith('</');
    if (isClosing) {
      return `</${tagName}>`;
    }

    // If tag is <a>, strictly parse and sanitize href
    if (tagName === 'a') {
      const hrefMatch = rawAttrs.match(/href\s*=\s*["']([^"']*)["']/i);
      const rawHref = hrefMatch ? hrefMatch[1] : '';

      if (isSafeContentUrl(rawHref)) {
        const isExternal = rawHref.startsWith('https://');
        const relAttr = isExternal ? ' rel="noopener noreferrer" target="_blank"' : '';
        return `<a href="${rawHref}" class="text-amber-400 hover:text-amber-300 underline font-medium transition"${relAttr}>`;
      } else {
        return `<a href="#" class="text-amber-400 underline">`;
      }
    }

    // For other allowed tags, strip any lingering attributes for security
    return `<${tagName}>`;
  });

  return sanitized.trim();
}

/**
 * Renders simple markdown (headings, bold, lists, links) safely into HTML.
 */
export function renderSafeContent(text: string): string {
  if (!text) return '';

  // 1. First sanitize any existing HTML
  let processed = sanitizeRichText(text);

  // 2. Convert markdown bold **bold** or __bold__
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // 3. Convert markdown italic *italic* or _italic_
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');

  // 4. Convert markdown links [title](url) safely
  processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, (_, title, url) => {
    if (isSafeContentUrl(url)) {
      const isExternal = url.startsWith('https://');
      const rel = isExternal ? ' rel="noopener noreferrer" target="_blank"' : '';
      return `<a href="${url}" class="text-amber-400 hover:text-amber-300 underline font-medium transition"${rel}>${title}</a>`;
    }
    return title;
  });

  // 5. Convert markdown bullet points
  processed = processed.replace(/(?:^|\n)[*•-]\s+(.*)/g, '\n<li>$1</li>');
  if (processed.includes('<li>')) {
    processed = processed.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="list-disc pl-5 my-2 space-y-1">$1</ul>');
  }

  // 6. Convert newlines to paragraphs / linebreaks if not inside HTML tags
  if (!processed.includes('<p>') && !processed.includes('<div>')) {
    const paragraphs = processed.split(/\n{2,}/);
    processed = paragraphs
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p class="mb-2 leading-relaxed">${p.replace(/\n/g, '<br />')}</p>`)
      .join('');
  }

  return processed;
}
