import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Offers a reload when a new build has been installed.
 *
 * The service worker's `onUpdate` was a bare console.log, so a returning
 * visitor with the app already open had no way to learn a new version existed
 * — they got it whenever they next happened to cold-start the app.
 */
export function UpdateBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onUpdateReady = () => setReady(true);
    window.addEventListener('keyperfect:update-ready', onUpdateReady);
    return () => window.removeEventListener('keyperfect:update-ready', onUpdateReady);
  }, []);

  if (!ready) return null;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[100] px-4 pb-4 safe-area-bottom pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-purple-500/40 bg-[#1a1633] px-4 py-3 shadow-lg">
        <RefreshCw className="h-5 w-5 shrink-0 text-purple-400" />
        <span className="flex-1 text-sm">A new version of KeyPerfect is ready.</span>
        <button
          onClick={() => window.location.reload()}
          className="tap-target rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-medium hover:bg-purple-600"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
