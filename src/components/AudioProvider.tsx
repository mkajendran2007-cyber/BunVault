'use client';

import { useEffect } from 'react';
import { engine } from '@/lib/AudioEngine';

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Browsers require a user gesture to initialize audio contexts and autoplay audio.
    const handleInteraction = () => {
      engine.init();
      // Remove listeners once initialized
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return <>{children}</>;
}
