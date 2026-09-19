import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker.
 *
 * `__SW_MANIFEST` dodá Serwist při buildu a zahrne do něj i celý obsah
 * `public/`, tedy všech 228 vlajek. Hra proto funguje offline úplně celá,
 * včetně vlajek, které dítě ještě nevidělo. Že tam opravdu jsou, hlídá test
 * `tests/offline.test.ts` – ruční seznam navíc by dělal konflikt revizí.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
