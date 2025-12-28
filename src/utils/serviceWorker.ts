// Service Worker Registration Utility

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  console.log('New content available; please refresh.');
                  config?.onUpdate?.(registration);
                } else {
                  // Content cached for offline use
                  console.log('Content cached for offline use.');
                  config?.onSuccess?.(registration);
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Back online');
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline');
      config?.onOffline?.();
    });
  }
}

export function unregisterServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('SW unregistration failed:', error);
      });
  }
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function checkForUpdates(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update().then(() => {
          resolve(true);
        }).catch(() => {
          resolve(false);
        });
      });
    } else {
      resolve(false);
    }
  });
}
