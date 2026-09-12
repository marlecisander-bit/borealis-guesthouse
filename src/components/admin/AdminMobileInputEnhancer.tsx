'use client';

import { useEffect } from 'react';

/** Adds phone keyboard hints to existing Admin forms without changing submitted values. */
export function AdminMobileInputEnhancer() {
  useEffect(() => {
    const enhance = () => document.querySelectorAll<HTMLInputElement>('input[type="number"]').forEach(input => {
      const decimal = Boolean(input.step && input.step !== '1');
      input.inputMode = decimal ? 'decimal' : 'numeric';
    });
    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
