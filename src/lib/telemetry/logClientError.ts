/**
 * Client Error Reporting Utility
 * Vihangam Institute of Astrology and Research (Viar.in)
 * 
 * Safely dispatches client-side unhandled errors and boundary crashes to the
 * server endpoint (/api/client-errors) for server-side logging and diagnostic tracking.
 */

export function logClientError(
  error: Error & { digest?: string },
  contextInfo?: { segment?: string; url?: string }
): void {
  try {
    const payload = {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown client runtime error',
      stack: error?.stack || null,
      digest: error?.digest || null,
      segment: contextInfo?.segment || 'root',
      url: typeof window !== 'undefined' ? window.location.href : contextInfo?.url || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      timestamp: new Date().toISOString(),
    };

    // Attempt lightweight beacon dispatch first
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/client-errors', blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // In worst-case network outage, avoid throwing further errors
    });
  } catch (err) {
    console.warn('[logClientError] Failed to dispatch client error:', err);
  }
}
