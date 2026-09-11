'use client';

import { useEffect, useRef } from 'react';

export function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutside: () => void,
  enabled = true,
) {
  const callback = useRef(onOutside);

  useEffect(() => {
    callback.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    if (!enabled) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && ref.current && !ref.current.contains(target)) callback.current();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [enabled, ref]);
}
