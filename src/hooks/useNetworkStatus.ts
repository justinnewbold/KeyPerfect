import { useEffect, useState } from 'react';

export interface NetworkStatus {
  online: boolean;
  /** True once a service worker controls the page, so a cold start works offline. */
  offlineReady: boolean;
  /** Reported by the Network Information API where available. */
  effectiveType: string | null;
  /** 2G-class link, or the user has asked the OS to save data. */
  slow: boolean;
}

interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  saveData?: boolean;
}

function readConnection(): NetworkInformation | null {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection ?? null;
}

function snapshot(): NetworkStatus {
  const connection = readConnection();
  const effectiveType = connection?.effectiveType ?? null;
  return {
    online: navigator.onLine,
    offlineReady: Boolean(navigator.serviceWorker?.controller),
    effectiveType,
    slow: Boolean(connection?.saveData) || effectiveType === '2g' || effectiveType === 'slow-2g',
  };
}

/**
 * Online/offline plus link quality.
 *
 * The service worker already published `online` and `offline` to the console
 * and nowhere else, so a player who lost signal mid-session got no explanation
 * — and no reassurance that the app in fact keeps working, since every sound
 * is synthesised on the device rather than fetched.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(snapshot);

  useEffect(() => {
    const update = () => setStatus(snapshot());

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const connection = readConnection();
    connection?.addEventListener('change', update);
    navigator.serviceWorker?.addEventListener('controllerchange', update);

    // The controller can arrive after this effect runs on a first visit.
    void navigator.serviceWorker?.ready.then(update).catch(() => {});

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      connection?.removeEventListener('change', update);
      navigator.serviceWorker?.removeEventListener('controllerchange', update);
    };
  }, []);

  return status;
}
