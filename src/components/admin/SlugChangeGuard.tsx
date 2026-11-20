'use client';

import { useEffect } from 'react';

export function SlugChangeGuard() {
  useEffect(() => {
    const selector = 'form input[name="slug"]';
    const originals = new WeakMap<HTMLInputElement, string>();
    const remember = (input: HTMLInputElement) => {
      if (!originals.has(input)) originals.set(input, input.defaultValue);
    };
    document.querySelectorAll<HTMLInputElement>(selector).forEach(remember);
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node instanceof HTMLInputElement && node.matches(selector)) remember(node);
        node.querySelectorAll<HTMLInputElement>(selector).forEach(remember);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const guard = (event: SubmitEvent) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      const input = form?.querySelector<HTMLInputElement>('input[name="slug"]');
      if (!input) return;
      const original = originals.get(input) ?? input.defaultValue;
      if (original && input.value !== original && !window.confirm('Changing the slug may break existing links if this content is published. Continue? A redirect can be added when redirect management is enabled.')) {
        event.preventDefault();
      }
    };
    document.addEventListener('submit', guard, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('submit', guard, true);
    };
  }, []);

  return null;
}
