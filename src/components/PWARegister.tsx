'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* PWA is progressive enhancement — ignore failures */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
