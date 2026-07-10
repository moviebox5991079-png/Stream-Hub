'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DevToolsShield({ children }: { children: React.ReactNode }) {
  const [isCompromised, setIsCompromised] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);

  useEffect(() => {
    // Check if the user is already serving a 10-second penalty
    const checkPenalty = () => {
      const lockTime = localStorage.getItem('dev_penalty');
      if (lockTime) {
        const remaining = parseInt(lockTime) - Date.now();
        if (remaining > 0) {
          setIsCompromised(true);
          setLockTimeLeft(Math.ceil(remaining / 1000));
          return true;
        } else {
          // Penalty over, clear it
          localStorage.removeItem('dev_penalty');
        }
      }
      return false;
    };

    // If currently penalized, run a timer to update the countdown UI
    if (checkPenalty()) {
      const timer = setInterval(() => {
         const stillLocked = checkPenalty();
         if (!stillLocked) {
             setIsCompromised(false);
             clearInterval(timer);
         }
      }, 1000);
      return () => clearInterval(timer);
    }

    // Function to trigger the 10-second lock
    const triggerPenalty = () => {
      setIsCompromised(true);
      // Lock for 10 seconds (10,000 milliseconds)
      localStorage.setItem('dev_penalty', (Date.now() + 10000).toString()); 
      setLockTimeLeft(10);
    };

    // 1. DOCKED DETECTOR (Detects if DevTools took up screen space)
    const checkDimensions = () => {
      // Increased threshold slightly to prevent false positives from normal zooming
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > 160 || heightDiff > 160) {
        triggerPenalty();
      }
    };

    // 2. CONSOLE GETTER TRICK (Catches if console is open)
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function () {
        triggerPenalty();
        return 'detect';
      }
    });

    // 3. DEBUGGER TIMING TRAP
    // If DevTools is open (and breakpoints aren't deactivated), it will pause here.
    // If it takes more than 100ms to execute, we know DevTools paused it.
    const checkDebuggerPause = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger; 
      if (performance.now() - start > 100) {
        triggerPenalty();
      }
    };

    // 4. KEYBOARD SHORTCUTS BLOCKER
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || 
        (e.ctrlKey && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault();
        triggerPenalty();
      }
    };

    const monitorId = setInterval(() => {
      if (!isCompromised) {
        checkDimensions();
        console.log('%c', element); // Trigger Getter
        console.clear(); 
        checkDebuggerPause();
      }
    }, 1000); // Check every 1 second

    window.addEventListener('resize', checkDimensions);
    window.addEventListener('keydown', blockKeys);

    return () => {
      clearInterval(monitorId);
      window.removeEventListener('resize', checkDimensions);
      window.removeEventListener('keydown', blockKeys);
    };
  }, [isCompromised]);

  if (isCompromised) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black border-2 border-red-600 rounded-[14px]">
         <ShieldAlert size={48} className="text-red-500 mb-4 animate-pulse" />
         <h2 className="text-xl font-black text-red-500 mb-2 uppercase text-center">Security Protocol Engaged</h2>
         <p className="text-gray-400 text-center text-sm mb-6">Developer tools detected. Access temporarily restricted.</p>
         
         {lockTimeLeft > 0 && (
            <div className="bg-red-950/50 border border-red-500/30 px-6 py-3 rounded-lg text-center">
              <span className="block text-red-200 text-xs mb-1 uppercase tracking-wider">Cooldown</span>
              <span className="text-2xl font-mono text-white font-bold">{lockTimeLeft}s</span>
            </div>
         )}
      </div>
    );
  }

  return <>{children}</>;
}
