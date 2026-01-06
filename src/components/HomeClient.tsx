'use client';

import React, { useState, useEffect, useRef } from 'react';
import OkRuPlayer from '@/components/OkRuPlayer';
import { Play, Menu, User, Loader2 } from 'lucide-react';
import Script from 'next/script'; 

// Props interface define karein (Data jo Server se aayega)
interface HomeProps {
  initialData: {
    isLive: boolean;
    title: string;
    videoId: string;
    thumbnail: string;
  };
}

export default function HomeClient({ initialData }: HomeProps) {
  // Data ab direct props se set hoga, loading ki zaroorat nahi
  const [selectedVideo, setSelectedVideo] = useState<any>(initialData.isLive ? { ...initialData, live: true } : null);
  const [videos, setVideos] = useState<any[]>([initialData]); 
  
  const [isOverlayVisible, setOverlayVisible] = useState(false); 
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

  const overlayRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);

  // =========================================================
  // 👇 ULTIMATE DETECTOR (Aapka Ad Blocker Logic Same rahega)
  // =========================================================
  useEffect(() => {
    const checkForAd = () => {
      const allElements = document.body.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i] as HTMLElement;
        if (overlayRef.current && overlayRef.current.contains(el)) continue;
        if (navbarRef.current && navbarRef.current.contains(el)) continue;
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;

        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex, 10);

        if (
          (style.position === 'fixed' || style.position === 'absolute') && 
          !isNaN(zIndex) && zIndex > 100 && 
          style.display !== 'none' && style.visibility !== 'hidden' &&
          el.offsetHeight > 10
        ) {
             if (!isOverlayVisible) {
                 setOverlayVisible(true);
             }
             return;
        }
      }
    };

    const observer = new MutationObserver(checkForAd);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, [isOverlayVisible]);

  useEffect(() => {
    const handleBlur = () => { if (isOverlayVisible) setOverlayVisible(false); };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isOverlayVisible]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
      
      {/* 👇 BLACK OVERLAY */}
      {isOverlayVisible && (
        <div 
          ref={overlayRef} 
          className="fixed inset-0 bg-black/85 z-[40] transition-opacity duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => setOverlayVisible(false)} 
        >
          <div className="text-white/60 text-sm mt-96 animate-pulse font-mono tracking-widest">
            Tap anywhere to Start Stream...
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav ref={navbarRef} className="fixed top-0 left-0 right-0 z-[30] flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-full transition"><Menu className="text-white" /></button>
          <a href="/" className="flex items-center gap-1">
             <div className="bg-red-600 p-1 rounded-lg"><Play fill="white" size={16} className="text-white"/></div>
             <span className="text-xl font-bold tracking-tight">SPORTS<span className="text-red-600">HUB</span></span>
          </a>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-gray-800">
           {/* Static Mode mein hamesha High Traffic dikha sakte hain ya prop se control karein */}
           <span className="text-green-500 animate-pulse">LIVE SERVER</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"><User className="text-white" size={16} /></div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex pt-16 h-screen">
        <main className={`flex-1 overflow-y-auto bg-[#0f0f0f] ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'} transition-all duration-300`}>
           
           {/* Categories */}
           <div className="sticky top-0 z-[20] bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-800">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>{cat}</button>
              ))}
           </div>

           <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
              {/* VIDEO PLAYER AREA */}
              {selectedVideo && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                   <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
                      <OkRuPlayer videoId={selectedVideo.videoId} title={selectedVideo.title} autoPlay={true} />
                   </div>
                   <div className="mt-4 px-1">
                      <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        {selectedVideo.title} {selectedVideo.live && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
                      </h1>
                   </div>

                   {/* BANNER 1 */}
                   <div className="flex justify-center my-6">
                       <iframe src="/ads/banner.html" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
                   </div>
                   <div className="my-6 border-b border-gray-800"></div>
                </div>
              )}

              {/* VIDEO GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                 {videos.map((video, idx) => (
                    <div key={idx} onClick={() => { setSelectedVideo(video); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group cursor-pointer flex flex-col">
                       <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border border-gray-800 group-hover:border-red-600/50">
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                          {video.live && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
                       </div>
                       <div className="flex gap-3 px-1">
                          <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                          <div className="flex flex-col">
                             <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1 group-hover:text-red-500 transition-colors">{video.title}</h3>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* BANNER 2 */}
           <div className="flex justify-center my-6">
               <iframe src="/ads/banner.html" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
           </div>
        </main>
      </div>

      {/* Ad Script */}
      <Script 
        src="https://pl28382929.effectivegatecpm.com/b1/06/0e/b1060e51e3f0ca4c6da303d42b6ea068.js"
        strategy="afterInteractive"
      />
    </div>
  );
}