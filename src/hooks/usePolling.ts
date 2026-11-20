"use client";

import { useEffect, useState } from 'react';

export function usePolling(intervalMs = 30000) {
  const [isTabActive, setIsTabActive] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsTabActive(!document.hidden);
    setIsOnline(navigator.onLine);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isTabActive, isOnline, shouldPoll: isTabActive && isOnline };
}
