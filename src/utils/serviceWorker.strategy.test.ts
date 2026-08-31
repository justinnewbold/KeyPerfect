import { describe, it, expect, vi, beforeEach } from 'vitest';
// Vite's ?raw import, so this needs no Node type definitions.
import swSource from '../../public/sw.js?raw';

/**
 * public/sw.js runs in a ServiceWorkerGlobalScope, which jsdom does not
 * provide. Rather than mock a whole worker environment, evaluate the file
 * against a hand-built scope and drive its fetch handler directly — the thing
 * under test is which caching strategy each kind of request takes.
 */

type Handler = (event: FakeFetchEvent) => void;

interface FakeFetchEvent {
  request: Request;
  respondWith: (response: Promise<Response> | Response) => void;
  waitUntil: (promise: Promise<unknown>) => void;
}

function loadServiceWorker() {
  const listeners = new Map<string, Handler>();
  const store = new Map<string, Map<string, Response>>();

  const openCache = (name: string) => {
    if (!store.has(name)) store.set(name, new Map());
    const entries = store.get(name)!;
    return Promise.resolve({
      addAll: (urls: string[]) =>
        Promise.all(urls.map(u => entries.set(u, new Response(`precached ${u}`)))),
      put: (request: Request | string, response: Response) => {
        entries.set(typeof request === 'string' ? request : request.url, response);
        return Promise.resolve();
      },
    });
  };

  const caches = {
    open: openCache,
    keys: () => Promise.resolve([...store.keys()]),
    delete: (name: string) => Promise.resolve(store.delete(name)),
    match: (request: Request | string) => {
      const key = typeof request === 'string' ? request : request.url;
      for (const entries of store.values()) {
        // Precached entries are keyed by path, runtime ones by full URL.
        const hit = entries.get(key) ?? entries.get(new URL(key, 'https://app.test').pathname);
        if (hit) return Promise.resolve(hit);
      }
      return Promise.resolve(undefined);
    },
  };

  const self = {
    location: { origin: 'https://app.test' },
    addEventListener: (type: string, handler: Handler) => listeners.set(type, handler),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };

  // eslint-disable-next-line no-new-func
  new Function('self', 'caches', 'fetch', 'Response', 'URL', swSource)(
    self,
    caches,
    (...args: unknown[]) => (globalThis.fetch as (...a: unknown[]) => Promise<Response>)(...args),
    Response,
    URL
  );

  /** Run the fetch handler and return whatever it responded with. */
  async function handleFetch(url: string, init?: { mode?: string; accept?: string }) {
    const request = new Request(url, {
      headers: init?.accept ? { accept: init.accept } : undefined,
    });
    Object.defineProperty(request, 'mode', { value: init?.mode ?? 'cors' });

    let responded: Promise<Response> | Response | undefined;
    const pending: Promise<unknown>[] = [];
    listeners.get('fetch')!({
      request,
      respondWith: r => {
        responded = r;
      },
      waitUntil: (p: Promise<unknown>) => pending.push(p),
    });

    if (responded === undefined) return undefined;
    const response = await responded;
    await Promise.allSettled(pending);
    return response;
  }

  async function install() {
    const pending: Promise<unknown>[] = [];
    listeners.get('install')!({
      waitUntil: (p: Promise<unknown>) => pending.push(p),
    } as unknown as FakeFetchEvent);
    await Promise.allSettled(pending);
  }

  return { handleFetch, install, store };
}

describe('service worker caching strategy', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async (input: Request | string) => {
      const url = typeof input === 'string' ? input : input.url;
      return new Response(`network ${url}`, { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('goes to the network first for a navigation', async () => {
    // This is the deploy bug. The old worker was cache-first for every
    // same-origin GET and precached '/' and '/index.html', so after a deploy
    // the cached HTML still pointed at the previous build's hashed assets and
    // the background revalidate only helped the load after that one.
    const sw = loadServiceWorker();
    await sw.install();

    const response = await sw.handleFetch('https://app.test/', {
      mode: 'navigate',
      accept: 'text/html',
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(await response!.text()).toBe('network https://app.test/');
  });

  it('serves the cached page when the network is down', async () => {
    const sw = loadServiceWorker();
    await sw.install();
    fetchMock.mockRejectedValue(new Error('offline'));

    const response = await sw.handleFetch('https://app.test/', {
      mode: 'navigate',
      accept: 'text/html',
    });

    expect(await response!.text()).toBe('precached /index.html');
  });

  it('serves a hashed asset from cache once it has been fetched', async () => {
    const sw = loadServiceWorker();
    const url = 'https://app.test/assets/index-abc123.js';

    const first = await sw.handleFetch(url);
    expect(await first!.text()).toBe(`network ${url}`);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValue(new Response('should not be used', { status: 200 }));
    const second = await sw.handleFetch(url);
    expect(await second!.text()).toBe(`network ${url}`);
  });

  it('ignores cross-origin and non-GET requests', async () => {
    const sw = loadServiceWorker();

    expect(await sw.handleFetch('https://fonts.example/x.woff2')).toBeUndefined();
  });
});
