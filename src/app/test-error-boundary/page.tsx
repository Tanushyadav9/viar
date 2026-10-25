'use client';

import { useEffect, useState } from 'react';

export default function TestErrorBoundaryPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('crash=true')) {
      setShouldThrow(true);
    }
  }, []);

  if (shouldThrow) {
    throw new Error('Simulated production client exception: Verifying friendly error boundary');
  }

  return (
    <div className="p-8 text-white min-h-screen cosmic-bg flex flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-bold text-amber-400">Error Boundary Verification Sandbox</h1>
      <p className="text-slate-400 text-sm max-w-md">
        This route allows engineering staff to verify that root and segment error boundaries catch runtime exceptions cleanly.
      </p>
      <a
        href="/test-error-boundary?crash=true"
        className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20"
      >
        Trigger Simulated Client Crash (?crash=true)
      </a>
    </div>
  );
}
