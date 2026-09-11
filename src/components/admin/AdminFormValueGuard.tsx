'use client';

import { useEffect } from 'react';

type PreservedControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

interface ControlSnapshot {
  control: PreservedControl;
  value: string;
  checked?: boolean;
  selected?: boolean[];
}

function canPreserve(control: Element): control is PreservedControl {
  if (control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) return true;
  return control instanceof HTMLInputElement && control.type !== 'file' && control.type !== 'password';
}

function snapshot(form: HTMLFormElement): ControlSnapshot[] {
  return Array.from(form.elements).filter(canPreserve).map(control => ({
    control,
    value: control.value,
    checked: control instanceof HTMLInputElement ? control.checked : undefined,
    selected: control instanceof HTMLSelectElement && control.multiple
      ? Array.from(control.options).map(option => option.selected)
      : undefined,
  }));
}

function restore(items: ControlSnapshot[]) {
  for (const item of items) {
    if (!item.control.isConnected) continue;
    item.control.value = item.value;
    if (item.control instanceof HTMLInputElement && item.checked !== undefined) {
      item.control.checked = item.checked;
    }
    if (item.control instanceof HTMLSelectElement && item.selected) {
      Array.from(item.control.options).forEach((option, index) => {
        option.selected = item.selected?.[index] ?? false;
      });
    }
  }
}

/** Keeps an admin editor intact when a server action returns validation errors. */
export function AdminFormValueGuard() {
  useEffect(() => {
    const submittedValues = new WeakMap<HTMLFormElement, ControlSnapshot[]>();

    const remember = (event: SubmitEvent) => {
      if (event.target instanceof HTMLFormElement) {
        submittedValues.set(event.target, snapshot(event.target));
      }
    };

    const preventAutomaticReset = (event: Event) => {
      if (!(event.target instanceof HTMLFormElement)) return;
      const values = submittedValues.get(event.target);
      if (!values) return;

      event.preventDefault();
      // This is also a fallback for browsers where the framework reset has
      // already started before the cancellable reset event is observed.
      requestAnimationFrame(() => restore(values));
    };

    document.addEventListener('submit', remember, true);
    document.addEventListener('reset', preventAutomaticReset, true);
    return () => {
      document.removeEventListener('submit', remember, true);
      document.removeEventListener('reset', preventAutomaticReset, true);
    };
  }, []);

  return null;
}
