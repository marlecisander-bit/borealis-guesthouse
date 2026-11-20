'use client';

import { useEffect, useState } from 'react';
import type { NotificationBell } from './NotificationBell';
import { NotificationTrigger } from './NotificationTrigger';

let bellModule: Promise<typeof NotificationBell> | undefined;

function loadBell() {
  return bellModule ??= import('./NotificationBell').then(module => module.NotificationBell).catch(error => {
    bellModule = undefined;
    throw error;
  });
}

export function AdminNotificationTrigger() {
  const [Bell, setBell] = useState<typeof NotificationBell>();
  const [requestedOpen, setRequestedOpen] = useState(false);

  useEffect(() => {
    let active = true;
    // Load the database client and realtime code after the first screen has had time to render.
    const timer = window.setTimeout(() => {
      void loadBell().then(component => { if (active) setBell(() => component); }).catch(() => {});
    }, 900);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  if (Bell) return <Bell initialOpen={requestedOpen}/>;
  return <NotificationTrigger busy={requestedOpen} onClick={() => {
    setRequestedOpen(true);
    void loadBell().then(component => setBell(() => component)).catch(() => setRequestedOpen(false));
  }}/>;
}
