'use client';

import { useEffect } from 'react';

const today = '/admin/dashboard';

export function AdminAppResume() {
  useEffect(() => {
    const iosApp = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const installedTouchApp = window.matchMedia('(display-mode: standalone) and (pointer: coarse)').matches;
    if (!iosApp && !installedTouchApp) return;

    // A newly opened notification or sign-in continuation gets its first foreground visit.
    let hasBeenVisible = document.visibilityState === 'visible';
    let wasBackgrounded = false;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasBackgrounded = hasBeenVisible;
        return;
      }
      if (document.visibilityState !== 'visible') return;

      hasBeenVisible = true;
      if (!wasBackgrounded) return;
      wasBackgrounded = false;

      // Wait for an online reopening rather than replace an offline page with a network error.
      if (!navigator.onLine || /^\/admin\/(?:login|mfa)\/?$/.test(location.pathname)) return;
      if (!window.dispatchEvent(new Event('borealis-admin-resume', { cancelable: true }))) return;

      if (location.pathname === today && !location.search && !location.hash) {
        // Reload the document so Today does not reuse a cached client route.
        window.scrollTo({ top: 0, behavior: 'instant' });
        location.reload();
      } else {
        location.replace(today);
      }
    };

    // A document leaving for another route is navigation, not app backgrounding.
    const onPageHide = () => { wasBackgrounded = false; };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  return null;
}
