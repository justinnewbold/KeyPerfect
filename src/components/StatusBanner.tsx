import React, { useEffect, useState } from 'react';
import { WifiOff, VolumeX, Signal } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { AUDIO_BLOCKED_EVENT, AUDIO_RESUMED_EVENT, isAudioBlocked, unblockAudio } from '../utils/audioEngine';

type Banner = {
  key: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  action?: { label: string; onClick: () => void };
  tone: 'warn' | 'info';
};

/**
 * One place for the conditions that make the app look broken without saying
 * why: sound blocked by the browser's autoplay policy, and a lost or very slow
 * connection. Both were console.log-only.
 *
 * The offline copy is deliberately reassuring rather than alarming: every
 * sound in KeyPerfect is synthesised on the device, so a cached session keeps
 * working with no network at all. Saying "you are offline" and stopping would
 * imply otherwise.
 */
export function StatusBanner() {
  const { online, offlineReady, slow } = useNetworkStatus();
  const [audioBlocked, setAudioBlocked] = useState(isAudioBlocked);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const onBlocked = () => setAudioBlocked(true);
    const onResumed = () => setAudioBlocked(false);
    window.addEventListener(AUDIO_BLOCKED_EVENT, onBlocked);
    window.addEventListener(AUDIO_RESUMED_EVENT, onResumed);
    return () => {
      window.removeEventListener(AUDIO_BLOCKED_EVENT, onBlocked);
      window.removeEventListener(AUDIO_RESUMED_EVENT, onResumed);
    };
  }, []);

  const banners: Banner[] = [];

  if (audioBlocked) {
    banners.push({
      key: 'audio',
      tone: 'warn',
      icon: <VolumeX className="h-5 w-5 shrink-0 text-amber-400" />,
      title: 'Sound is blocked',
      detail: 'Your browser waits for a tap before it will play audio.',
      action: {
        label: 'Enable sound',
        onClick: () => {
          void unblockAudio().then(ok => setAudioBlocked(!ok));
        },
      },
    });
  }

  if (!online) {
    banners.push({
      key: 'offline',
      tone: 'info',
      icon: <WifiOff className="h-5 w-5 shrink-0 text-sky-400" />,
      title: "You're offline",
      detail: offlineReady
        ? 'Training carries on as normal — every sound is generated on your device, and your progress is saved here.'
        : "Some of the app hasn't been saved for offline use yet. Reconnect once and it will work without a signal after that.",
    });
  } else if (slow) {
    banners.push({
      key: 'slow',
      tone: 'info',
      icon: <Signal className="h-5 w-5 shrink-0 text-sky-400" />,
      title: 'Slow connection',
      detail: 'Loading may take a moment. Sound and training are unaffected — nothing is streamed.',
    });
  }

  const visible = banners.filter(b => !dismissed.includes(b.key));
  if (visible.length === 0) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[90] px-3 pt-3 safe-area-top pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2">
        {visible.map(banner => (
          <div
            key={banner.key}
            data-testid={`status-banner-${banner.key}`}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-lg ${
              banner.tone === 'warn'
                ? 'border-amber-500/40 bg-[#241c10]/95'
                : 'border-sky-500/40 bg-[#101c24]/95'
            }`}
          >
            {banner.icon}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{banner.title}</p>
              <p className="text-xs text-white/70">{banner.detail}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {banner.action && (
                <button
                  type="button"
                  onClick={banner.action.onClick}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {banner.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDismissed(prev => [...prev, banner.key])}
                aria-label={`Dismiss ${banner.title}`}
                className="tap-target rounded-lg text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
