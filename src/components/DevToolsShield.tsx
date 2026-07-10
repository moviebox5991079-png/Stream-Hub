'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DevToolsShield({ children }: { children: React.ReactNode }) {
  const [isCompromised, setIsCompromised] = useState(false);

  useEffect(() => {
    // 1. DOCKED DETECTOR (Window size difference)
    const checkDimensions = () => {
      if (window.outerWidth - window.innerWidth > 100 || window.outerHeight - window.innerHeight > 100) {
        setIsCompromised(true);
      }
    };

    // 2. CONSOLE GETTER TRICK (Catches manual 3-dots open INSTANTLY)
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function () {
        setIsCompromised(true);
        return 'detect';
      }
    });

    // 3. OBFUSCATED DEBUGGER TRAP
    const lockBrowser = () => {
      try { (function() { return false; })['constructor']('debugger')(); } catch (e) {}
    };

    // 4. KEYBOARD SHORTCUTS BLOCKER
    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toUpperCase() === 'U')) {
        e.preventDefault();
        setIsCompromised(true);
      }
    };

    const monitorId = setInterval(() => {
      if (!isCompromised) {
        checkDimensions();
        console.log('%c', element); // Trigger Getter
        console.clear(); 
        lockBrowser();
      }
    }, 500);

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
         <p className="text-gray-400 text-center text-sm">Developer tools detected. Please close the inspector.</p>
      </div>
    );
  }

  return <>{children}</>;
}
