'use client';

import { useEffect } from 'react';

/** Adds phone keyboard hints to existing Admin forms without changing submitted values. */
export function AdminMobileInputEnhancer() {
  useEffect(() => {
    const selector = 'input[type="number"]';
    const enhance = (input: HTMLInputElement) => {
      input.inputMode = input.step && input.step !== '1' ? 'decimal' : 'numeric';
    };
    document.querySelectorAll<HTMLInputElement>(selector).forEach(enhance);
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node instanceof HTMLInputElement && node.matches(selector)) enhance(node);
        node.querySelectorAll<HTMLInputElement>(selector).forEach(enhance);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
