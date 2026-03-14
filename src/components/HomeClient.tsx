'use client';

import React, { useState, useEffect, useRef } from 'react';
import OkRuPlayer from '@/components/OkRuPlayer'; 
import { Play, Menu, User, Tv, X, ShieldAlert } from 'lucide-react'; 
import Script from 'next/script'; 
import Head from 'next/head'; 

interface StreamData {
  videoTitle: string;
  videoId: string;
  thumbnail: string;
}

interface HomeProps {
  initialData: {
    isLive: boolean;
    title: string; 
    streams: StreamData[]; 
  };
}

export default function HomeClient({ initialData }: HomeProps) {
  const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
    initialData.streams && initialData.streams.length > 0 ? initialData.streams[0] : null
  );
  
  const [isOverlayVisible, setOverlayVisible] = useState(false); 
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

  const overlayRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);
  // === UPDATE: Welcome Modal ka Ref add kiya taake Ad Detector confuse na ho ===
  const welcomeModalRef = useRef<HTMLDivElement>(null);

  // ULTIMATE DETECTOR (Ads ke liye)
  useEffect(() => {
    const checkForAd = () => {
      const allElements = document.body.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i] as HTMLElement;
        if (overlayRef.current && overlayRef.current.contains(el)) continue;
        if (navbarRef.current && navbarRef.current.contains(el)) continue;
        // === UPDATE: Ad Detector ko bataya ke Welcome Modal ko ignore kare ===
        if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

  // Modal open hone par background scrolling rokne aur close hone par wapas theek karne ke liye
  useEffect(() => {
    if (showWelcomeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function
    return () => { document.body.style.overflow = 'auto'; };
  }, [showWelcomeModal]);

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ok.ru" />
      </Head>

      <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
        {/* === WELCOME MODAL === */}
        {showWelcomeModal && (
          <div 
            ref={welcomeModalRef} // Ref attach kiya
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300"
          >
            <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 overflow-hidden">
              
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
              <button 
                onClick={() => setShowWelcomeModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2.5 rounded-full transition-colors z-[100000]"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-10 relative z-10">
                 <div className="mx-auto w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                   <ShieldAlert className="text-red-500" size={40} />
                 </div>
                 <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3">
                   Welcome to <span className="text-red-600">SPORTS</span>HUB
                 </h2>
                 <p className="text-gray-300 text-base sm:text-lg px-4">
                   Please read these important instructions before streaming.
                 </p>
              </div>

              <div className="space-y-5 relative z-10">
                 <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
                    <div className="mt-2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
                    <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                       <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 1:</strong> 
                       Live stream tabhi chalu hogi jab match officially start hoga. Time se pehle play nahi hogi.
                    </p>
                 </div>
                 
                 <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
                    <div className="mt-2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
                    <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                       <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 2:</strong> 
                       Agar match start hone par bhi stream na chalay toh yeh <span className="text-red-400 font-semibold">server issue</span> hai. Yeh khud theek ho jayega, tab tak aap next server check kar sakte hain.Hamari team is masle ko theek karne par kaam kar rahi hai.
                    </p>
                 </div>
              </div>
              
              <button 
                onClick={() => setShowWelcomeModal(false)}
                className="w-full mt-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-xl hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
              >
                Continue to Website
              </button>
            </div>
          </div>
        )}

        {/* BLACK OVERLAY FOR ADS */}
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
                {!selectedVideo ? (
                  <div className="mb-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
                       <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
                          <Tv className="text-red-600/80" size={36} />
                       </div>
                       <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">Stream Offline</h2>
                       <p className="text-gray-400 max-w-lg z-10">Please wait while streams are loading.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
                     <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
                        <OkRuPlayer 
                          videoId={selectedVideo.videoId} 
                          title={selectedVideo.videoTitle} 
                          thumbnail={selectedVideo.thumbnail} 
                          autoPlay={true} 
                        />
                     </div>

                     <div className="mt-5 px-1">
                        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                          {selectedVideo.videoTitle} {initialData.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
                        </h1>
                        <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-2 bg-gray-900/50 rounded-r-md">
                          {initialData.title}
                        </p>
                     </div>
                  </div>
                )}

                {/* MULTIPLE STREAMS GRID */}
                {initialData.streams && initialData.streams.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mt-8 mb-4 px-1">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
                        Check Below for More Streams!
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                       {initialData.streams.map((video, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => { setSelectedVideo(video); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                            className="group cursor-pointer flex flex-col"
                          >
                             <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
                                <img src={video.thumbnail} alt={video.videoTitle} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                                
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/20 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                    <Play fill="white" size={24} className="text-white ml-0.5" />
                                  </div>
                                </div>

                                {initialData.isLive && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
                             </div>
                             <div className="flex gap-3 px-1">
                                <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                                <div className="flex flex-col">
                                   <h3 className={`text-sm font-bold line-clamp-2 leading-tight mb-1 transition-colors ${selectedVideo?.videoId === video.videoId ? 'text-red-500' : 'text-white group-hover:text-red-500'}`}>
                                     {video.videoTitle}
                                   </h3>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                  </>
                )}
             </div>

             {/* BANNER 2 */}
             <div className="flex justify-center my-6">
                 <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
             </div>
          </main>
        </div>

        <Script 
          src="https://pl28382929.effectivegatecpm.com/b1/06/0e/b1060e51e3f0ca4c6da303d42b6ea068.js"
          strategy="afterInteractive"
        />
      </div>
    </>
  );
}









// ============================ upper waley code mei ; Maine code mein ek naya popup (modal) add kar diya hai jo sirf tab show hoga jab koi live stream available nahi hogi (!selectedVideo). =========================













// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   thumbnail: string;
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean;
//     title: string; 
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
//   // === UPDATE: By default pehli stream (index 0) ko select kiya hai ===
//   // Is se page load hote hi pehli stream ka thumbnail aur Play button nazar aayega
//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     initialData.streams && initialData.streams.length > 0 ? initialData.streams[0] : null
//   );
  
//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");
//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);

//   // ULTIMATE DETECTOR
//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;

//         const style = window.getComputedStyle(el);
//         const zIndex = parseInt(style.zIndex, 10);

//         if (
//           (style.position === 'fixed' || style.position === 'absolute') && 
//           !isNaN(zIndex) && zIndex > 100 && 
//           style.display !== 'none' && style.visibility !== 'hidden' &&
//           el.offsetHeight > 10
//         ) {
//              if (!isOverlayVisible) {
//                  setOverlayVisible(true);
//              }
//              return;
//         }
//       }
//     };

//     const observer = new MutationObserver(checkForAd);
//     observer.observe(document.body, { childList: true, subtree: true, attributes: true });
//     return () => observer.disconnect();
//   }, [isOverlayVisible]);

//   useEffect(() => {
//     const handleBlur = () => { if (isOverlayVisible) setOverlayVisible(false); };
//     window.addEventListener('blur', handleBlur);
//     return () => window.removeEventListener('blur', handleBlur);
//   }, [isOverlayVisible]);

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* BLACK OVERLAY */}
//         {isOverlayVisible && (
//           <div 
//             ref={overlayRef} 
//             className="fixed inset-0 bg-black/85 z-[40] transition-opacity duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
//             onClick={() => setOverlayVisible(false)} 
//           >
//             <div className="text-white/60 text-sm mt-96 animate-pulse font-mono tracking-widest">
//               Tap anywhere to Start Stream...
//             </div>
//           </div>
//         )}

//         {/* NAVBAR */}
//         <nav ref={navbarRef} className="fixed top-0 left-0 right-0 z-[30] flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-gray-800">
//           <div className="flex items-center gap-4">
//             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-full transition"><Menu className="text-white" /></button>
//             <a href="/" className="flex items-center gap-1">
//                <div className="bg-red-600 p-1 rounded-lg"><Play fill="white" size={16} className="text-white"/></div>
//                <span className="text-xl font-bold tracking-tight">SPORTS<span className="text-red-600">HUB</span></span>
//             </a>
//           </div>
//           <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-gray-800">
//              <span className="text-green-500 animate-pulse">LIVE SERVER</span>
//           </div>
//           <div className="flex items-center gap-3">
//              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"><User className="text-white" size={16} /></div>
//           </div>
//         </nav>

//         {/* Main Content */}
//         <div className="flex pt-16 h-screen">
//           <main className={`flex-1 overflow-y-auto bg-[#0f0f0f] ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'} transition-all duration-300`}>
             
//              {/* Categories */}
//              <div className="sticky top-0 z-[20] bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-800">
//                 {categories.map((cat) => (
//                   <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>{cat}</button>
//                 ))}
//              </div>

//              <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                
//                 {/* VIDEO PLAYER AREA */}
//                 {!selectedVideo ? (
//                   /* Fallback Placeholder: Agar API/JSON se data fetch na ho sake */
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide">No Stream Data Found</h2>
//                        <p className="text-gray-400 max-w-lg">
//                          Please wait while streams are loading or check your connection.
//                        </p>
//                     </div>
//                   </div>
//                 ) : (
//                   /* ACTUAL VIDEO PLAYER: By default pehli stream yahan load hogi */
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
//                         <OkRuPlayer 
//                           videoId={selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={selectedVideo.thumbnail} 
//                           autoPlay={true} 
//                         />
//                      </div>
//                      <div className="mt-4 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {initialData.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>
//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-2 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {initialData.streams && initialData.streams.length > 0 && (
//                   <>
//                     <div className="flex items-center justify-between mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Available Live Streams
//                       </h2>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {initialData.streams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { setSelectedVideo(video); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img src={video.thumbnail} alt={video.videoTitle} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                                
//                                 {/* === ADDED LIGHTWEIGHT PLAY BUTTON OVERLAY === */}
//                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                                   <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/20 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300 shadow-lg">
//                                     <Play fill="white" size={24} className="text-white ml-0.5" />
//                                   </div>
//                                 </div>

//                                 {initialData.isLive && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
//                              </div>
//                              <div className="flex gap-3 px-1">
//                                 <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
//                                 <div className="flex flex-col">
//                                    <h3 className={`text-sm font-bold line-clamp-2 leading-tight mb-1 transition-colors ${selectedVideo?.videoId === video.videoId ? 'text-red-500' : 'text-white group-hover:text-red-500'}`}>
//                                      {video.videoTitle}
//                                    </h3>
//                                 </div>
//                              </div>
//                           </div>
//                        ))}
//                     </div>
//                   </>
//                 )}
//              </div>

//              {/* BANNER 2 */}
//              <div className="flex justify-center my-6">
//                  <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
//              </div>
//           </main>
//         </div>

//         <Script 
//           src="https://pl28382929.effectivegatecpm.com/b1/06/0e/b1060e51e3f0ca4c6da303d42b6ea068.js"
//           strategy="afterInteractive"
//         />
//       </div>
//     </>
//   );
// }














// ==== upper code mei srf bootm video par play k button add kya hai=




// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   thumbnail: string;
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean;
//     title: string; 
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
//   // === UPDATE: By default pehli stream (index 0) ko select kiya hai ===
//   // Is se page load hote hi pehli stream ka thumbnail aur Play button nazar aayega
//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     initialData.streams && initialData.streams.length > 0 ? initialData.streams[0] : null
//   );
  
//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");
//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);

//   // ULTIMATE DETECTOR
//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;

//         const style = window.getComputedStyle(el);
//         const zIndex = parseInt(style.zIndex, 10);

//         if (
//           (style.position === 'fixed' || style.position === 'absolute') && 
//           !isNaN(zIndex) && zIndex > 100 && 
//           style.display !== 'none' && style.visibility !== 'hidden' &&
//           el.offsetHeight > 10
//         ) {
//              if (!isOverlayVisible) {
//                  setOverlayVisible(true);
//              }
//              return;
//         }
//       }
//     };

//     const observer = new MutationObserver(checkForAd);
//     observer.observe(document.body, { childList: true, subtree: true, attributes: true });
//     return () => observer.disconnect();
//   }, [isOverlayVisible]);

//   useEffect(() => {
//     const handleBlur = () => { if (isOverlayVisible) setOverlayVisible(false); };
//     window.addEventListener('blur', handleBlur);
//     return () => window.removeEventListener('blur', handleBlur);
//   }, [isOverlayVisible]);

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* BLACK OVERLAY */}
//         {isOverlayVisible && (
//           <div 
//             ref={overlayRef} 
//             className="fixed inset-0 bg-black/85 z-[40] transition-opacity duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
//             onClick={() => setOverlayVisible(false)} 
//           >
//             <div className="text-white/60 text-sm mt-96 animate-pulse font-mono tracking-widest">
//               Tap anywhere to Start Stream...
//             </div>
//           </div>
//         )}

//         {/* NAVBAR */}
//         <nav ref={navbarRef} className="fixed top-0 left-0 right-0 z-[30] flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-gray-800">
//           <div className="flex items-center gap-4">
//             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-full transition"><Menu className="text-white" /></button>
//             <a href="/" className="flex items-center gap-1">
//                <div className="bg-red-600 p-1 rounded-lg"><Play fill="white" size={16} className="text-white"/></div>
//                <span className="text-xl font-bold tracking-tight">SPORTS<span className="text-red-600">HUB</span></span>
//             </a>
//           </div>
//           <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-gray-800">
//              <span className="text-green-500 animate-pulse">LIVE SERVER</span>
//           </div>
//           <div className="flex items-center gap-3">
//              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"><User className="text-white" size={16} /></div>
//           </div>
//         </nav>

//         {/* Main Content */}
//         <div className="flex pt-16 h-screen">
//           <main className={`flex-1 overflow-y-auto bg-[#0f0f0f] ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'} transition-all duration-300`}>
             
//              {/* Categories */}
//              <div className="sticky top-0 z-[20] bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-800">
//                 {categories.map((cat) => (
//                   <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>{cat}</button>
//                 ))}
//              </div>

//              <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                
//                 {/* VIDEO PLAYER AREA */}
//                 {!selectedVideo ? (
//                   /* Fallback Placeholder: Agar API/JSON se data fetch na ho sake */
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide">No Stream Data Found</h2>
//                        <p className="text-gray-400 max-w-lg">
//                          Please wait while streams are loading or check your connection.
//                        </p>
//                     </div>
//                   </div>
//                 ) : (
//                   /* ACTUAL VIDEO PLAYER: By default pehli stream yahan load hogi */
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
//                         <OkRuPlayer 
//                           videoId={selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={selectedVideo.thumbnail} 
//                           autoPlay={true} 
//                         />
//                      </div>
//                      <div className="mt-4 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {initialData.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>
//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-2 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {initialData.streams && initialData.streams.length > 0 && (
//                   <>
//                     <div className="flex items-center justify-between mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Available Live Streams
//                       </h2>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {initialData.streams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { setSelectedVideo(video); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img src={video.thumbnail} alt={video.videoTitle} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
//                                 {initialData.isLive && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
//                              </div>
//                              <div className="flex gap-3 px-1">
//                                 <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
//                                 <div className="flex flex-col">
//                                    <h3 className={`text-sm font-bold line-clamp-2 leading-tight mb-1 transition-colors ${selectedVideo?.videoId === video.videoId ? 'text-red-500' : 'text-white group-hover:text-red-500'}`}>
//                                      {video.videoTitle}
//                                    </h3>
//                                 </div>
//                              </div>
//                           </div>
//                        ))}
//                     </div>
//                   </>
//                 )}
//              </div>

//              {/* BANNER 2 */}
//              <div className="flex justify-center my-6">
//                  <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
//              </div>
//           </main>
//         </div>

//         <Script 
//           src="https://pl28382929.effectivegatecpm.com/b1/06/0e/b1060e51e3f0ca4c6da303d42b6ea068.js"
//           strategy="afterInteractive"
//         />
//       </div>
//     </>
//   );
// }


















// ====================== multi stream logic added upper code,belwo code iss 100% valid for single match stream ====================================================================




// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; // Aapka path check kar lijiye
// import { Play, Menu, User } from 'lucide-react';
// import Script from 'next/script'; 

// interface HomeProps {
//   initialData: {
//     isLive: boolean;
//     title: string;
//     videoId: string;
//     thumbnail: string;
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
//   const [selectedVideo, setSelectedVideo] = useState<any>(initialData.isLive ? { ...initialData, live: true } : null);
//   const [videos, setVideos] = useState<any[]>([initialData]); 
  
//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");
//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);

//   // ULTIMATE DETECTOR (Aapka Ad Blocker Logic Same)
//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;

//         const style = window.getComputedStyle(el);
//         const zIndex = parseInt(style.zIndex, 10);

//         if (
//           (style.position === 'fixed' || style.position === 'absolute') && 
//           !isNaN(zIndex) && zIndex > 100 && 
//           style.display !== 'none' && style.visibility !== 'hidden' &&
//           el.offsetHeight > 10
//         ) {
//              if (!isOverlayVisible) {
//                  setOverlayVisible(true);
//              }
//              return;
//         }
//       }
//     };

//     const observer = new MutationObserver(checkForAd);
//     observer.observe(document.body, { childList: true, subtree: true, attributes: true });
//     return () => observer.disconnect();
//   }, [isOverlayVisible]);

//   useEffect(() => {
//     const handleBlur = () => { if (isOverlayVisible) setOverlayVisible(false); };
//     window.addEventListener('blur', handleBlur);
//     return () => window.removeEventListener('blur', handleBlur);
//   }, [isOverlayVisible]);

//   return (
//     <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
      
//       {/* BLACK OVERLAY */}
//       {isOverlayVisible && (
//         <div 
//           ref={overlayRef} 
//           className="fixed inset-0 bg-black/85 z-[40] transition-opacity duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
//           onClick={() => setOverlayVisible(false)} 
//         >
//           <div className="text-white/60 text-sm mt-96 animate-pulse font-mono tracking-widest">
//             Tap anywhere to Start Stream...
//           </div>
//         </div>
//       )}

//       {/* NAVBAR */}
//       <nav ref={navbarRef} className="fixed top-0 left-0 right-0 z-[30] flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-gray-800">
//         <div className="flex items-center gap-4">
//           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-full transition"><Menu className="text-white" /></button>
//           <a href="/" className="flex items-center gap-1">
//              <div className="bg-red-600 p-1 rounded-lg"><Play fill="white" size={16} className="text-white"/></div>
//              <span className="text-xl font-bold tracking-tight">SPORTS<span className="text-red-600">HUB</span></span>
//           </a>
//         </div>
//         <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-gray-800">
//            <span className="text-green-500 animate-pulse">LIVE SERVER</span>
//         </div>
//         <div className="flex items-center gap-3">
//            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"><User className="text-white" size={16} /></div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="flex pt-16 h-screen">
//         <main className={`flex-1 overflow-y-auto bg-[#0f0f0f] ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'} transition-all duration-300`}>
           
//            {/* Categories */}
//            <div className="sticky top-0 z-[20] bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-800">
//               {categories.map((cat) => (
//                 <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>{cat}</button>
//               ))}
//            </div>

//            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
//               {/* VIDEO PLAYER AREA */}
//               {selectedVideo && (
//                 <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
//                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
//                       {/* === YAHAN THUMBNAIL PROP ADD KIYA HAI === */}
//                       <OkRuPlayer 
//                         videoId={selectedVideo.videoId} 
//                         title={selectedVideo.title} 
//                         thumbnail={selectedVideo.thumbnail} 
//                         autoPlay={true} 
//                       />
//                    </div>
//                    <div className="mt-4 px-1">
//                       <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                         {selectedVideo.title} {selectedVideo.live && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                       </h1>
//                    </div>

//                    {/* BANNER 1 */}
//                    <div className="flex justify-center my-6">
//                        <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
//                    </div>
//                    <div className="my-6 border-b border-gray-800"></div>
//                 </div>
//               )}

//               {/* VIDEO GRID */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                  {videos.map((video, idx) => (
//                     <div key={idx} onClick={() => { setSelectedVideo(video); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group cursor-pointer flex flex-col">
//                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border border-gray-800 group-hover:border-red-600/50">
//                           <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
//                           {video.live && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
//                        </div>
//                        <div className="flex gap-3 px-1">
//                           <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
//                           <div className="flex flex-col">
//                              <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1 group-hover:text-red-500 transition-colors">{video.title}</h3>
//                           </div>
//                        </div>
//                     </div>
//                  ))}
//               </div>
//            </div>

//            {/* BANNER 2 */}
//            <div className="flex justify-center my-6">
//                <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
//            </div>
//         </main>
//       </div>

//       {/* Ad Script */}
//       <Script 
//         src="https://pl28382929.effectivegatecpm.com/b1/06/0e/b1060e51e3f0ca4c6da303d42b6ea068.js"
//         strategy="afterInteractive"
//       />
//     </div>
//   );
// }



























































// ========= king ==================================


// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer';
// import { Play, Menu, User, Loader2 } from 'lucide-react';
// import Script from 'next/script'; 

// // Props interface define karein (Data jo Server se aayega)
// interface HomeProps {
//   initialData: {
//     isLive: boolean;
//     title: string;
//     videoId: string;
//     thumbnail: string;
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
//   // Data ab direct props se set hoga, loading ki zaroorat nahi
//   const [selectedVideo, setSelectedVideo] = useState<any>(initialData.isLive ? { ...initialData, live: true } : null);
//   const [videos, setVideos] = useState<any[]>([initialData]); 
  
//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");
//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);

//   // =========================================================
//   // 👇 ULTIMATE DETECTOR (Aapka Ad Blocker Logic Same rahega)
//   // =========================================================
//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;

//         const style = window.getComputedStyle(el);
//         const zIndex = parseInt(style.zIndex, 10);

//         if (
//           (style.position === 'fixed' || style.position === 'absolute') && 
//           !isNaN(zIndex) && zIndex > 100 && 
//           style.display !== 'none' && style.visibility !== 'hidden' &&
//           el.offsetHeight > 10
//         ) {
//              if (!isOverlayVisible) {
//                  setOverlayVisible(true);
//              }
//              return;
//         }
//       }
//     };

//     const observer = new MutationObserver(checkForAd);
//     observer.observe(document.body, { childList: true, subtree: true, attributes: true });
//     return () => observer.disconnect();
//   }, [isOverlayVisible]);

//   useEffect(() => {
//     const handleBlur = () => { if (isOverlayVisible) setOverlayVisible(false); };
//     window.addEventListener('blur', handleBlur);
//     return () => window.removeEventListener('blur', handleBlur);
//   }, [isOverlayVisible]);

//   return (
//     <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
      
//       {/* 👇 BLACK OVERLAY */}
//       {isOverlayVisible && (
//         <div 
//           ref={overlayRef} 
//           className="fixed inset-0 bg-black/85 z-[40] transition-opacity duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
//           onClick={() => setOverlayVisible(false)} 
//         >
//           <div className="text-white/60 text-sm mt-96 animate-pulse font-mono tracking-widest">
//             Tap anywhere to Start Stream...
//           </div>
//         </div>
//       )}

//       {/* NAVBAR */}
//       <nav ref={navbarRef} className="fixed top-0 left-0 right-0 z-[30] flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-gray-800">
//         <div className="flex items-center gap-4">
//           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-full transition"><Menu className="text-white" /></button>
//           <a href="/" className="flex items-center gap-1">
//              <div className="bg-red-600 p-1 rounded-lg"><Play fill="white" size={16} className="text-white"/></div>
//              <span className="text-xl font-bold tracking-tight">SPORTS<span className="text-red-600">HUB</span></span>
//           </a>
//         </div>
//         <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-gray-800">
//            {/* Static Mode mein hamesha High Traffic dikha sakte hain ya prop se control karein */}
//            <span className="text-green-500 animate-pulse">LIVE SERVER</span>
//         </div>
//         <div className="flex items-center gap-3">
//            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"><User className="text-white" size={16} /></div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="flex pt-16 h-screen">
//         <main className={`flex-1 overflow-y-auto bg-[#0f0f0f] ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'} transition-all duration-300`}>
           
//            {/* Categories */}
//            <div className="sticky top-0 z-[20] bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-800">
//               {categories.map((cat) => (
//                 <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>{cat}</button>
//               ))}
//            </div>

//            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
//               {/* VIDEO PLAYER AREA */}
//               {selectedVideo && (
//                 <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
//                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
//                       <OkRuPlayer videoId={selectedVideo.videoId} title={selectedVideo.title} autoPlay={true} />
//                    </div>
//                    <div className="mt-4 px-1">
//                       <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                         {selectedVideo.title} {selectedVideo.live && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                       </h1>
//                    </div>

//                    {/* BANNER 1 */}
//                    <div className="flex justify-center my-6">
//                        <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />

//                        {/* <iframe src="/ads/banner.html" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" /> */}
//                        {/* <iframe src="https://raw.githubusercontent.com/moviebox5991079-png/Stream-Hub/refs/heads/main/public/ads/banner.html" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" /> */}

//                    </div>
//                    <div className="my-6 border-b border-gray-800"></div>
//                 </div>
//               )}

//               {/* VIDEO GRID */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                  {videos.map((video, idx) => (
//                     <div key={idx} onClick={() => { setSelectedVideo(video); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group cursor-pointer flex flex-col">
//                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border border-gray-800 group-hover:border-red-600/50">
//                           <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
//                           {video.live && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
//                        </div>
//                        <div className="flex gap-3 px-1">
//                           <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
//                           <div className="flex flex-col">
//                              <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1 group-hover:text-red-500 transition-colors">{video.title}</h3>
//                           </div>
//                        </div>
//                     </div>
//                  ))}
//               </div>
//            </div>

//            {/* BANNER 2 */}
//            <div className="flex justify-center my-6">
//                {/* <iframe src="/ads/banner.html" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" /> */}
//                <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />

//            </div>
//         </main>
//       </div>

//       {/* Ad Script */}
//       <Script 
//         src="https://pl28382929.effectivegatecpm.com/b1/06/0e/b1060e51e3f0ca4c6da303d42b6ea068.js"
//         strategy="afterInteractive"
//       />
//     </div>
//   );
// }
