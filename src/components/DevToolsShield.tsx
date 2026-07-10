'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DevToolsShield({ children }: { children: React.ReactNode }) {
  const [isCompromised, setIsCompromised] = useState(() => {
    // Check sessionStorage for sticky flag
    return sessionStorage.getItem('devtools_detected') === 'true';
  });

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debuggerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (isCompromised) return; // already blocked

    // ---------- 1. DIMENSION CHECK (with tolerance) ----------
    const checkDimensions = () => {
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      // Some browsers have a built‑in margin; use a threshold of 150px
      if (wDiff > 150 || hDiff > 150) {
        triggerDetection();
      }
    };

    // ---------- 2. CONSOLE GETTER (survives clear) ----------
    const consoleTrap = () => {
      // Use an object with a getter that fires when logged
      const trapObj = {
        get _devtools() {
          triggerDetection();
          return 'detected';
        },
      };
      // Override console.log to include the trap automatically
      const originalLog = console.log;
      console.log = function (...args) {
        originalLog.apply(console, args);
        // Access the getter inside the logged arguments (without printing it)
        try {
          // Force access by referencing trapObj._devtools inside a no‑op
          trapObj._devtools;
        } catch (_) {}
      };
      // Also trigger via console.dir, etc.
    };

    // ---------- 3. DEBUGGER LOOP (with try/catch) ----------
    const startDebuggerLoop = () => {
      if (debuggerIntervalRef.current) clearInterval(debuggerIntervalRef.current);
      debuggerIntervalRef.current = setInterval(() => {
        try {
          // This will pause if devtools is open and breakpoints are enabled
          // but won't crash if "Deactivate breakpoints" is on
          (function () {}).constructor('debugger')();
        } catch (_) {
          // ignore
        }
      }, 100);
    };

    // ---------- 4. PERFORMANCE TIMING ----------
    let lastTime = performance.now();
    const checkPerformance = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      // If delta is unusually high (e.g., > 100ms), devtools might be busy
      if (delta > 100) {
        triggerDetection();
      }
    };

    // ---------- 5. KEYBOARD SHORTCUTS (with right‑click prevention) ----------
    const blockKeys = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toUpperCase();
      if (
        e.key === 'F12' ||
        (ctrl && shift && ['I', 'J', 'C'].includes(key)) ||
        (ctrl && key === 'U') ||
        (e.button === 2) // right‑click
      ) {
        e.preventDefault();
        triggerDetection();
      }
    };

    // ---------- 6. WEB WORKER (background monitor) ----------
    const startWorker = () => {
      if (window.Worker) {
        const workerCode = `
          let lastPing = Date.now();
          setInterval(() => {
            const now = Date.now();
            if (now - lastPing > 200) {
              // Main thread is frozen → devtools likely paused
              postMessage('detected');
            }
            lastPing = now;
          }, 100);
          // Listen for pings from main thread
          onmessage = (e) => {
            if (e.data === 'ping') lastPing = Date.now();
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        workerRef.current = new Worker(url);
        workerRef.current.onmessage = (e) => {
          if (e.data === 'detected') {
            triggerDetection();
          }
        };
        // Ping the worker every 50ms
        const pingInterval = setInterval(() => {
          if (workerRef.current) {
            workerRef.current.postMessage('ping');
          }
        }, 50);
        // Store interval to clear later
        (workerRef.current as any).pingInterval = pingInterval;
      }
    };

    // ---------- TRIGGER FUNCTION (sets state + sticky flag) ----------
    const triggerDetection = () => {
      sessionStorage.setItem('devtools_detected', 'true');
      setIsCompromised(true);
      // Stop all monitors to save resources
      cleanUpMonitors();
    };

    // ---------- CLEANUP ----------
    const cleanUpMonitors = () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (debuggerIntervalRef.current) {
        clearInterval(debuggerIntervalRef.current);
        debuggerIntervalRef.current = null;
      }
      if (workerRef.current) {
        if ((workerRef.current as any).pingInterval) {
          clearInterval((workerRef.current as any).pingInterval);
        }
        workerRef.current.terminate();
        workerRef.current = null;
      }
      window.removeEventListener('resize', checkDimensions);
      window.removeEventListener('keydown', blockKeys);
    };

    // ---------- MOUNT SETUP ----------
    const startMonitors = () => {
      // Resize listener
      window.addEventListener('resize', checkDimensions);
      // Keyboard / right‑click blocker
      window.addEventListener('keydown', blockKeys);
      window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        triggerDetection();
      });
      // Dimension check immediately
      checkDimensions();

      // Console trap
      consoleTrap();

      // Debugger loop
      startDebuggerLoop();

      // Performance monitor (every 200ms)
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = setInterval(() => {
        checkPerformance();
        // Also re‑run dimension check (sometimes outer/inner changes without resize)
        checkDimensions();
      }, 200);

      // Worker
      startWorker();
    };

    startMonitors();

    // ---------- CLEANUP ON UNMOUNT ----------
    return () => {
      cleanUpMonitors();
      // Restore original console.log if needed
      // (You could save a reference to originalLog and restore it)
    };
  }, [isCompromised]);

  // ---------- RENDER ----------
  if (isCompromised) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black border-2 border-red-600 rounded-[14px]">
        <ShieldAlert size={48} className="text-red-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-red-500 mb-2 uppercase text-center">
          Security Protocol Engaged
        </h2>
        <p className="text-gray-400 text-center text-sm">
          Developer tools detected. Please close the inspector.
        </p>
        <p className="text-gray-500 text-xs mt-4">
          Repeated attempts will be logged.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
