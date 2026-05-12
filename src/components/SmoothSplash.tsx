'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SmoothSplash() {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Allow time for the app content to settle before fading out
    const timer = setTimeout(() => {
      setShouldRender(false);
    }, 800); // matches css transition time + small buffer
    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: mounted ? 0 : 1,
        pointerEvents: 'none',
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
         <Image 
            src="/logo.png" 
            alt="Bun Vault Logo" 
            width={100} 
            height={100} 
            className="animate-bounce-subtle"
            style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))'}}
          />
         <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-loading-bar"></div>
         </div>
      </div>
    </div>
  );
}
