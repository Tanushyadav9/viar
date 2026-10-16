/**
 * Validates a redirect URL to prevent Open Redirect vulnerabilities.
 * - Must be an internal path starting with a single '/'
 * - Must NOT start with '//' or '/\' (protocol-relative or backslash bypasses)
 * - Must NOT contain ':' or '\' anywhere in the path
 * - Returns defaultUrl if invalid
 */
export function validateRedirectUrl(
  url: string | null | undefined,
  defaultUrl: string = '/dashboard'
): string {
  if (!url || typeof url !== 'string') return defaultUrl;
  const trimmed = url.trim();

  // Reject empty string or anything not starting with a single '/'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultUrl;
  }

  // Reject paths containing protocol schemes or directory traversal / backslashes
  if (
    trimmed.includes('\\') ||
    trimmed.includes(':') ||
    trimmed.toLowerCase().includes('javascript') ||
    trimmed.toLowerCase().includes('data:')
  ) {
    return defaultUrl;
  }

  return trimmed;
}
