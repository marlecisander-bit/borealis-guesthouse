'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';

/** Keep focus and scroll stable while fitting dialogs to the visible viewport. */
export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  opener?: RefObject<HTMLElement | null>,
) {
  const close = useRef(onClose);
  useLayoutEffect(() => { close.current = onClose; }, [onClose]);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!open || !panel) return;
    const previous = opener?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const root = document.documentElement;
    const body = document.body;
    const overflow = body.style.overflow;
    const { scrollbarGutter } = root.style;
    // Keep the existing classic scrollbar gutter while the document is locked.
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable';
    body.style.overflow = 'hidden';

    const viewport = window.visualViewport;
    const bounds = () => {
      const height = viewport?.height ?? window.innerHeight;
      panel.style.setProperty('--dialog-viewport-height', `${height}px`);
      panel.style.setProperty('--dialog-viewport-top', `${viewport?.offsetTop ?? 0}px`);
      panel.style.maxHeight = `${Math.max(0, height - 32)}px`;
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = [...panel.querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
      )].filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = document.activeElement;
      if (!first || !panel.contains(active) || active === panel || active === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last ?? panel : first ?? panel).focus({ preventScroll: true });
      }
    };

    bounds();
    panel.focus({ preventScroll: true });
    document.addEventListener('keydown', key);
    viewport?.addEventListener('resize', bounds);
    viewport?.addEventListener('scroll', bounds);
    window.addEventListener('resize', bounds);
    return () => {
      body.style.overflow = overflow;
      root.style.scrollbarGutter = scrollbarGutter;
      document.removeEventListener('keydown', key);
      viewport?.removeEventListener('resize', bounds);
      viewport?.removeEventListener('scroll', bounds);
      window.removeEventListener('resize', bounds);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, opener, ref]);
}
