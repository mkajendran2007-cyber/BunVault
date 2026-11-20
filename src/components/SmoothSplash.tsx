'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import AppBrandLogo from '@/components/AppBrandLogo';

export default function SmoothSplash() {
  const [visible, setVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Wait slightly after hydration, then start fading out
    const fadeTimer = setTimeout(() => {
      setVisible(false);
    }, 450);
    // Remove from DOM after the fade transition (450ms + 400ms)
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 850);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#0f172a] transition-opacity duration-400 ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6 animate-pulse">
         <AppBrandLogo size="splash" />
         <div className="h-1.5 w-48 bg-slate-200 dark:bg-slate-800/40 rounded-full overflow-hidden border border-slate-300 dark:border-amber-500/20">
            <div className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500 animate-loading-bar"></div>
         </div>
         <span className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase font-bold">
           INITIALIZING BUN VAULT...
         </span>
      </div>
    </div>
  );
}
