import { allowedPreviewRoute } from './lib/readonly-preview/policy';
// Opt-in local preview only; runs before application hydration.
if (process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW === '1') {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : undefined;
    const url = new URL(request?.url || input.toString(), window.location.origin);
    const method = (init?.method || request?.method || 'GET').toUpperCase();
    if (!allowedPreviewRoute(url.href, method, new Headers(init?.headers || request?.headers))) throw new Error('readonly_preview_browser_request_blocked');
    return originalFetch(url, { ...init, method, credentials: 'omit', redirect: 'error' });
  };
  // This preview needs neither XHR nor standalone WebSocket connections.
  window.XMLHttpRequest = class { constructor() { throw new Error('readonly_preview_xhr_blocked'); } } as unknown as typeof XMLHttpRequest;
  window.WebSocket = class { constructor() { throw new Error('readonly_preview_websocket_blocked'); } } as unknown as typeof WebSocket;
  document.addEventListener('submit', event => event.preventDefault(), true);
  const restrictLink = (event: MouseEvent) => {
    const anchor = event.target instanceof Element ? event.target.closest('a') : null;
    if (!anchor) return;
    const url = new URL(anchor.href, window.location.origin);
    if (!allowedPreviewRoute(url.href, 'GET', new Headers())) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  document.addEventListener('click', restrictLink, true);
  document.addEventListener('auxclick', restrictLink, true);
}
