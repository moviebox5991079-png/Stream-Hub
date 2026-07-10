'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DevToolsShield({ children }: { children: React.ReactNode }) {
  const [isCompromised, setIsCompromised] = useState(false);

  useEffect(() => {
    // 1. DOCKED DETECTOR (Screen Size Difference)
    const checkDimensions = () => {
      const widthDiff = window.outerWidth - window.innerWidth > 160;
      const heightDiff = window.outerHeight - window.innerHeight > 160;
      if (widthDiff || heightDiff) {
        setIsCompromised(true);
      }
    };

    // 2. FLOATING DETECTOR (Debugger Time Delay Trick)
    const checkDebuggerTime = () => {
      const start = Date.now();
      (function() { debugger; })();
      const end = Date.now();
      if (end - start > 100) {
        setIsCompromised(true);
      }
    };

    // 3. 🚫 KEYBOARD SHORTCUTS BLOCKER
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U') || 
        (e.ctrlKey && e.key.toUpperCase() === 'S') || 
        (e.ctrlKey && e.key.toUpperCase() === 'P')    
      ) {
        e.preventDefault(); 
        setIsCompromised(true); 
      }
    };

    // Continuous Monitoring
    const monitorId = setInterval(() => {
      if (!isCompromised) {
        checkDimensions();
        checkDebuggerTime();
      }
    }, 1000);

    // Initial Event Listeners
    checkDimensions();
    window.addEventListener('resize', checkDimensions);
    window.addEventListener('keydown', blockKeys); 

    return () => {
      clearInterval(monitorId);
      window.removeEventListener('resize', checkDimensions);
      window.removeEventListener('keydown', blockKeys);
    };
  }, [isCompromised]);

  // Agar DevTools open hai, tou player gayab aur sirf alert dikhao
  if (isCompromised) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black border-2 border-red-600 rounded-[14px]">
         <ShieldAlert size={48} className="text-red-500 mb-4 animate-pulse" />
         <h2 className="text-xl sm:text-2xl font-black text-red-500 mb-2 tracking-widest uppercase text-center px-4">
           Security Protocol Engaged
         </h2>
         <p className="text-gray-400 text-center px-6 text-sm sm:text-base">
           Developer tools detected. The stream has been locked. <br/> Please close the inspector and refresh the page.
         </p>
      </div>
    );
  }

  // Agar safe hai, tou asli player (children) render karo
  return <>{children}</>;
}
