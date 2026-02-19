'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Maximize, Minimize } from 'lucide-react'; 

interface BilibiliPlayerProps {
  videoId: string; // Yahan 'BV1xxxxxx' ya Live room ka CID (jaise '1809235763') aayega
  title?: string;
  autoPlay?: boolean;
}

const BilibiliPlayer: React.FC<BilibiliPlayerProps> = ({ 
  videoId, 
  title = "Bilibili Stream",
  autoPlay = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Smart ID Extractor (Dono Live aur VOD ko pehchanega)
  const cleanVideoId = useMemo(() => {
    if (!videoId) return '';
    
    // Agar BV id hai (Normal Video)
    const bvMatch = videoId.match(/BV[a-zA-Z0-9]+/);
    if (bvMatch) return bvMatch[0];
    
    // Agar sirf numbers hain (Live Room CID)
    const numericMatch = videoId.match(/\d+/);
    if (numericMatch) return numericMatch[0];
    
    return videoId;
  }, [videoId]);

  // 👇 AUTOMATIC URL SWITCHER (Live vs Normal)
  const isLiveRoom = !cleanVideoId.startsWith('BV');
  
  // Yahan maine quality=3 (Sab se Low) aur danmaku=0 (Comments band) kar diya hai
  const embedUrl = isLiveRoom
    ? `https://www.bilibili.com/blackboard/live/live-activity-player.html?cid=${cleanVideoId}&quality=3&danmaku=0&autoplay=${autoPlay ? 1 : 0}`
    : `https://player.bilibili.com/player.html?isOutside=true&bvid=${cleanVideoId}&high_quality=0&danmaku=0&autoplay=${autoPlay ? 1 : 0}`;

  useEffect(() => { setIsLoaded(false); }, [cleanVideoId]);

  // === FULLSCREEN LOGIC ===
  const toggleFullScreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        const el: any = containerRef.current;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        
        // Force Landscape
        // @ts-ignore
        if (screen.orientation && screen.orientation.lock) {
          // @ts-ignore
          try { await screen.orientation.lock("landscape"); } catch (err) {}
        }
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
        
        // Wapas Portrait (Seedha) karo
        // @ts-ignore
        if (screen.orientation && screen.orientation.unlock) {
           // @ts-ignore
           screen.orientation.unlock();
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto my-6 animate-in fade-in zoom-in duration-500">
      <div ref={containerRef} className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group">
        
        {/* === CUSTOM FULLSCREEN CONTROLS === */}
        <button
          onClick={toggleFullScreen}
          className="absolute bottom-4 right-8 z-[60] p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>

        {/* === IFRAME PLAYER & NEW LOADING ANIMATION === */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-[#000000] overflow-hidden">
            <div className="absolute w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
            
            <div className="relative flex flex-col items-center gap-6 z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-[3px] border-blue-900/30 animate-[spin_3s_linear_infinite]"></div>
                <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-[3px] border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <span className="text-white font-bold tracking-[0.2em] text-sm animate-pulse">
                  CONNECTING BILIBILI
                </span>
                <span className="text-xs text-blue-500/70 font-mono tracking-widest">
                  BUFFERING STREAM...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bilibili Iframe */}
        <iframe
          src={embedUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full z-10"
          frameBorder="0"
          scrolling="no"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
};

export default BilibiliPlayer;