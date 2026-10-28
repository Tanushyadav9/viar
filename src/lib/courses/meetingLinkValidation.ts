/**
 * Meeting Link Validation Utilities
 * Pure TypeScript functions with ZERO server or database dependencies.
 * Safe for use in both Client Components and Server Services.
 */

export interface MeetingLinkValidationResult {
  valid: boolean;
  provider?: 'GOOGLE_MEET' | 'ZOOM';
  normalizedUrl?: string;
  error?: string;
  errorHi?: string;
}

export const REJECTED_WORDS = ['example', 'test', 'jyotish-mentorship', 'xxx', 'demo'];

export const INVALID_LINK_MESSAGE_EN =
  'This does not look like a real Meet or Zoom link. Create the meeting in Google Calendar or at meet.google.com/new and paste the link here.';

export const INVALID_LINK_MESSAGE_HI =
  'यह एक मान्य गूगल मीट या ज़ूम लिंक नहीं लगता है। गूगल कैलेंडर या meet.google.com/new पर मीटिंग बनाएं और वास्तविक लिंक यहाँ पेस्ट करें।';

/**
 * Validates meeting URLs for Google Meet and Zoom.
 * Enforces production invariants:
 * - Real Google Meet links follow https://meet.google.com/xxx-xxxx-xxx (three lowercase letter groups of 3, 4 and 3)
 * - Real Zoom links follow https://<subdomain>.zoom.us/j/<digits> (with an optional pwd parameter)
 * - Rejects any links containing words like example, test, jyotish-mentorship, xxx or demo
 * - Anything else is rejected with the standardized client-approved error message
 */
export function isValidMeetingLink(
  rawUrl?: string | null,
  expectedProvider?: 'GOOGLE_MEET' | 'ZOOM' | null
): MeetingLinkValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      valid: false,
      error: 'Meeting link cannot be empty.',
      errorHi: 'मीटिंग लिंक खाली नहीं हो सकता।',
    };
  }

  let trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  // Reject links containing words like example, test, jyotish-mentorship, xxx or demo
  for (const word of REJECTED_WORDS) {
    if (lower.includes(word)) {
      return {
        valid: false,
        error: INVALID_LINK_MESSAGE_EN,
        errorHi: INVALID_LINK_MESSAGE_HI,
      };
    }
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: INVALID_LINK_MESSAGE_EN,
      errorHi: INVALID_LINK_MESSAGE_HI,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;

  // 1. Google Meet Validation: https://meet.google.com/xxx-xxxx-xxx (3, 4 and 3 lowercase letters)
  const isMeetDomain = hostname === 'meet.google.com';
  const meetCodeMatch = pathname.match(/^\/([a-z]{3})-([a-z]{4})-([a-z]{3})$/i);

  if (isMeetDomain) {
    if (!meetCodeMatch) {
      return {
        valid: false,
        provider: 'GOOGLE_MEET',
        error: INVALID_LINK_MESSAGE_EN,
        errorHi: INVALID_LINK_MESSAGE_HI,
      };
    }
    const cleanUrl = `https://meet.google.com/${meetCodeMatch[1].toLowerCase()}-${meetCodeMatch[2].toLowerCase()}-${meetCodeMatch[3].toLowerCase()}${parsed.search}`;
    if (expectedProvider === 'ZOOM') {
      return {
        valid: false,
        error: 'Expected a Zoom link, but received a Google Meet link.',
        errorHi: 'ज़ूम लिंक अपेक्षित था, लेकिन गूगल मीट लिंक प्राप्त हुआ।',
      };
    }
    return {
      valid: true,
      provider: 'GOOGLE_MEET',
      normalizedUrl: cleanUrl,
    };
  }

  // 2. Zoom Validation: https://<subdomain>.zoom.us/j/<digits> (with optional pwd parameter)
  const isZoomDomain = hostname === 'zoom.us' || hostname.endsWith('.zoom.us');
  const zoomPathMatch = pathname.match(/^\/j\/(\d{9,11})/i);

  if (isZoomDomain) {
    if (!zoomPathMatch) {
      return {
        valid: false,
        provider: 'ZOOM',
        error: INVALID_LINK_MESSAGE_EN,
        errorHi: INVALID_LINK_MESSAGE_HI,
      };
    }
    if (expectedProvider === 'GOOGLE_MEET') {
      return {
        valid: false,
        error: 'Expected a Google Meet link, but received a Zoom link.',
        errorHi: 'गूगल मीट लिंक अपेक्षित था, लेकिन ज़ूम लिंक प्राप्त हुआ।',
      };
    }
    return {
      valid: true,
      provider: 'ZOOM',
      normalizedUrl: trimmed,
    };
  }

  // Anything else is rejected
  return {
    valid: false,
    error: INVALID_LINK_MESSAGE_EN,
    errorHi: INVALID_LINK_MESSAGE_HI,
  };
}
