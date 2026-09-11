'use client';

import { useEffect } from 'react';

/** Keeps every current and future admin slug input consistent with server rules. */
export function SlugFieldDefaults() {
  useEffect(() => {
    const configure = () => {
      document.querySelectorAll<HTMLInputElement>('form input[name="slug"]').forEach((input) => {
        if (input.readOnly) return;
        input.required = false;
        input.placeholder = 'Leave blank to generate automatically';
        input.setAttribute('autocomplete', 'off');

        const label = input.closest('label');
        if (!label || label.querySelector('[data-slug-hint]')) return;
        const hint = document.createElement('span');
        hint.dataset.slugHint = 'true';
        hint.className = 'mt-1 block text-xs font-normal leading-5 text-slate-500';
        hint.textContent = 'Optional — leave blank to generate it automatically.';
        label.insertBefore(hint, input);
      });
    };

    configure();
    const observer = new MutationObserver(configure);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
