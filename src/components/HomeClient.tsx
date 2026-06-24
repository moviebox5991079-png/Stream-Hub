'use client';

import React, { useState, useEffect, useRef } from 'react';
import OkRuPlayer from '@/components/OkRuPlayer'; 
import { Play, Menu, User, Tv, X, ShieldAlert, Radio } from 'lucide-react'; 
import Script from 'next/script'; 
import Head from 'next/head'; 

interface ChannelData {
  name: string;
  videoId: string;
}

interface StreamData {
  videoTitle: string;
  videoId: string;
  activeThumbnail: string; 
  channels?: ChannelData[]; 
  isLive?: boolean;
}

interface HomeProps {
  initialData: {
    isLive: boolean; 
    title: string; 
    thumbnails: { [key: string]: string }; 
    streams: StreamData[]; 
  };
}

export default function HomeClient({ initialData }: HomeProps) {
  
  const availableStreams = initialData.streams 
    ? initialData.streams.filter((stream) => stream.isLive !== false) 
    : [];

  const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
    availableStreams.length > 0 ? availableStreams[0] : null
  );
  
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isChangingChannel, setIsChangingChannel] = useState(false);

  const [isOverlayVisible, setOverlayVisible] = useState(false); 
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  const overlayRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);
  const welcomeModalRef = useRef<HTMLDivElement>(null);

  // === UPDATE: SMART TIME MATCHER LOGIC ===
  const getSmartActiveChannel = (channels: ChannelData[] | undefined) => {
    if (!channels || channels.length === 0) return null;

    // 1. Get current time in PKT (UTC+5)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const pktDate = new Date(utc + (3600000 * 5));
    const currentMinutes = pktDate.getHours() * 60 + pktDate.getMinutes();

    // 2. Parse times from channel names
    const parsedChannels = channels.map(ch => {
      // Regex to find time like 10:00 PM or 1:00 AM
      const timeMatch = ch.name.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      let timeInMins = -1;
      
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        const period = timeMatch[3].toUpperCase();
        
        if (hours === 12 && period === 'AM') hours = 0;
        if (hours < 12 && period === 'PM') hours += 12;
        timeInMins = hours * 60 + mins;
      }
      
      return {
        ...ch,
        timeInMins,
        hasPriority: ch.name.includes('!') // ! sign check
      };
    });

    const timeChannels = parsedChannels.filter(c => c.timeInMins !== -1);
    
    // If no time is found in the strings, fallback to default logic
    if (timeChannels.length === 0) {
       const priorityFallback = parsedChannels.find(c => c.hasPriority);
       return priorityFallback ? priorityFallback.videoId : channels[0].videoId;
    }

    // Sort ascending by time
    timeChannels.sort((a, b) => a.timeInMins - b.timeInMins);

    let bestCandidate = null;

    // 3. Find the best candidate (Current match OR Upcoming within 10 mins)
    const timeGroups: { [key: number]: typeof timeChannels } = {};
    timeChannels.forEach(c => {
       if (!timeGroups[c.timeInMins]) timeGroups[c.timeInMins] = [];
       timeGroups[c.timeInMins].push(c);
    });

    const uniqueTimes = Object.keys(timeGroups).map(Number).sort((a,b) => a-b);

    for (let i = 0; i < uniqueTimes.length; i++) {
       const t = uniqueTimes[i];
       const group = timeGroups[t];
       
       // Priority tie-breaker: Pick the one with "!" if times match, else pick the first
       const winnerInGroup = group.find(c => c.hasPriority) || group[0];

       if (currentMinutes >= t) {
           // Match has started, so it's currently our best candidate
           bestCandidate = winnerInGroup;
       } else if (t - currentMinutes <= 10) {
           // Match is in the future, BUT within 10 minutes (Priority shifts!)
           bestCandidate = winnerInGroup;
           break; 
       } else {
           // Match is more than 10 mins in the future, stop looking
           break; 
       }
    }

    return bestCandidate ? bestCandidate.videoId : timeChannels[0].videoId;
  };

  // Jab page load ho ya selectedVideo change ho, smart time calculation run karo
  useEffect(() => {
    if (selectedVideo) {
      const smartChannelId = getSmartActiveChannel(selectedVideo.channels);
      setActiveVideoId(smartChannelId || selectedVideo.videoId);
    }
  }, [selectedVideo]);

  // Ads & Modal Effects (Same as your original code)
  useEffect(() => {
    const checkForAd = () => {
      const allElements = document.body.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i] as HTMLElement;
        if (overlayRef.current && overlayRef.current.contains(el)) continue;
        if (navbarRef.current && navbarRef.current.contains(el)) continue;
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
             if (!isOverlayVisible) setOverlayVisible(true);
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

  useEffect(() => {
    if (showWelcomeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showWelcomeModal]);

  const handleChannelChange = (newVideoId: string) => {
    if (activeVideoId === newVideoId) return; 
    
    setIsChangingChannel(true);
    setActiveVideoId(newVideoId);
    
    setTimeout(() => {
      setIsChangingChannel(false);
    }, 1000);
  };

  const getThumbnailImage = (video: StreamData) => {
    if (video && video.activeThumbnail && initialData.thumbnails && initialData.thumbnails[video.activeThumbnail]) {
      return initialData.thumbnails[video.activeThumbnail];
    }
    return 'https://via.placeholder.com/800x450.png?text=No+Thumbnail'; 
  };

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ok.ru" />
      </Head>

      <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative overflow-x-hidden">
        
        {/* === WELCOME MODAL === */}
        {showWelcomeModal && (
          <div 
            ref={welcomeModalRef}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-4 transition-all duration-300"
          >
            <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 scrollbar-hide">
              
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
              <button 
                onClick={() => setShowWelcomeModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2 rounded-full transition-colors z-[100000]"
              >
                <X size={20} />
              </button>
              
              <div className="text-center mb-6 relative z-10">
                 <div className="mx-auto w-16 h-16 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                   <ShieldAlert className="text-red-500" size={32} />
                 </div>
                 <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">
                   Welcome to <span className="text-red-600">SPORTS</span>HUB
                 </h2>
                 <p className="text-gray-300 text-sm sm:text-base px-2">
                   Please read these important instructions before streaming.
                 </p>
              </div>

              <div className="space-y-4 relative z-10">
                 <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-gray-800/50">
                    <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
                    <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                       <strong className="text-white font-bold text-base sm:text-lg block mb-0.5">Note 1:</strong> 
                       The live stream will only start when the match officially begins. It will not play before the scheduled time.
                    </p>
                 </div>
                 
                 <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-gray-800/50">
                    <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
                    <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                       <strong className="text-white font-bold text-base sm:text-lg block mb-0.5">Note 2:</strong> 
                       If the stream doesn't play even after the match has started, it is a <span className="text-red-400 font-semibold">server issue</span>. It will resolve itself automatically. Meanwhile, you can check other servers below. Our team is actively working to fix this.
                    </p>
                 </div>
              </div>
              
              <button 
                onClick={() => setShowWelcomeModal(false)}
                className="w-full mt-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-lg hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
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
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0f0f0f] w-full transition-all duration-300">

             <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                
                {/* VIDEO PLAYER AREA */}
                {!selectedVideo ? (
                  <div className="mb-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
                       <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
                          <Tv className="text-red-600/80" size={36} />
                       </div>
                       <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">No Matches Available</h2>
                       <p className="text-gray-400 max-w-lg z-10">Please check back later when matches are live.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
                     <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800 relative">
                       
                        {isChangingChannel && (
                           <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
                              <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
                              <p className="text-white text-lg font-bold tracking-widest animate-pulse">Switching Server...</p>
                           </div>
                        )}

                        {activeVideoId && (
                           <OkRuPlayer 
                             videoId={activeVideoId} 
                             title={selectedVideo.videoTitle} 
                             thumbnail={getThumbnailImage(selectedVideo)} 
                             autoPlay={false} 
                           />
                        )}
                     </div>

                     <div className="mt-5 px-1">
                        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                          {selectedVideo.videoTitle} {selectedVideo.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
                        </h1>

                        {selectedVideo.channels && selectedVideo.channels.length > 0 && (
                          <div className="mt-4 mb-4 p-5 bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] border border-red-900/30 rounded-2xl flex flex-col gap-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            
                            {/* Background glow for the container */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 blur-3xl rounded-full pointer-events-none"></div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-white">
                                  <Tv size={22} className="text-red-500 animate-pulse"/>
                                  <span className="text-base sm:text-lg font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                    Available Servers
                                  </span>
                                </div>
                                <span className="text-sm text-red-400 font-medium mt-1">
                                  Stream stuck or not working, they fix in few seconds (server issue)? <span className="text-white font-bold underline decoration-red-500 decoration-2 underline-offset-2">Wacth Below More Matches, Current Live or Upcomming (Eastern Time)!</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-1 relative z-10">
                              {selectedVideo.channels.map((channel, idx) => {
                                const isActive = activeVideoId === channel.videoId;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleChannelChange(channel.videoId)}
                                    className={`relative px-6 py-3 rounded-xl text-sm sm:text-base font-black transition-all duration-300 flex items-center gap-3 overflow-hidden group ${
                                      isActive
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-400 scale-105 z-10'
                                        : 'bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a] text-gray-200 hover:text-white border-2 border-gray-600 hover:border-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:-translate-y-1'
                                    }`}
                                  >
                                    {isActive && <span className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></span>}
                                    
                                    {isActive ? (
                                      <Radio size={18} className="animate-pulse text-white" />
                                    ) : (
                                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse group-hover:bg-red-500 group-hover:shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-colors"></div>
                                    )}
                                    
                                    <span className="relative z-10 tracking-wide uppercase">{channel.name}</span>
                                    
                                    {!isActive && (
                                      <span className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none"></span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-3 bg-gray-900/50 rounded-r-md">
                          {initialData.title}
                        </p>
                     </div>
                  </div>
                )}

                {/* MULTIPLE STREAMS GRID */}
                {availableStreams && availableStreams.length > 0 && (
                  <>
                    <div className="flex flex-col mt-8 mb-4 px-1">
                      <div className="flex justify-center my-6 w-full overflow-hidden">
                        <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }} title="Sponsor Ad" />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
                          Check Below for More Streams!
                        </h2>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                       {availableStreams.map((video, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => { 
                              setIsChangingChannel(true);
                              setSelectedVideo(video); 
                              // Update hata diya yaha se, wo useEffect handle karega ab.
                              window.scrollTo({ top: 0, behavior: 'smooth' }); 
                              
                              setTimeout(() => {
                                setIsChangingChannel(false);
                              }, 1000);
                            }} 
                            className="group cursor-pointer flex flex-col"
                          >
                             <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
                                <img 
                                  src={getThumbnailImage(video)} 
                                  alt={video.videoTitle} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                                  loading="lazy" 
                                />
                                
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/20 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                    <Play fill="white" size={24} className="text-white ml-0.5" />
                                  </div>
                                </div>

                                {video.isLive !== false && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
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
             <div className="flex justify-center my-6 w-full overflow-hidden">
                 <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }} title="Sponsor Ad" />
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











































// =================== Alhdmuallah yheh done hai complete hai bas iss mey yehe eek new functinality add akrty hai automaticallyy select match based on pakistani time standard ===================



// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv, X, ShieldAlert, Radio } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// interface ChannelData {
//   name: string;
//   videoId: string;
// }

// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   activeThumbnail: string; 
//   channels?: ChannelData[]; 
//   isLive?: boolean; // === UPDATE: yahan isLive add kar diya hai ===
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean; // Yeh root wala isLive hai (Global Live Badge ke liye)
//     title: string; 
//     thumbnails: { [key: string]: string }; // === UPDATE: Yahan global thumbnails add kiya hai ===
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
  
//   // === UPDATE: Filter logic - Sirf wo streams jin ka stream.isLive 'false' NAHI hai ===
//   const availableStreams = initialData.streams 
//     ? initialData.streams.filter((stream) => stream.isLive !== false) 
//     : [];

//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     availableStreams.length > 0 ? availableStreams[0] : null
//   );
  
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(
//     availableStreams.length > 0 
//       ? (availableStreams[0].channels && availableStreams[0].channels.length > 0 ? availableStreams[0].channels[0].videoId : availableStreams[0].videoId) 
//       : null
//   );
  
//   const [isChangingChannel, setIsChangingChannel] = useState(false);

//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const [showWelcomeModal, setShowWelcomeModal] = useState(true);

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);
//   const welcomeModalRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

//   useEffect(() => {
//     if (showWelcomeModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//     return () => { document.body.style.overflow = 'auto'; };
//   }, [showWelcomeModal]);

//   const handleChannelChange = (newVideoId: string) => {
//     if (activeVideoId === newVideoId) return; 
    
//     setIsChangingChannel(true);
//     setActiveVideoId(newVideoId);
    
//     setTimeout(() => {
//       setIsChangingChannel(false);
//     }, 1000);
//   };

//   const getThumbnailImage = (video: StreamData) => {
//     // === UPDATE: Ab global initialData.thumbnails se image fetch ho rahi hai ===
//     if (video && video.activeThumbnail && initialData.thumbnails && initialData.thumbnails[video.activeThumbnail]) {
//       return initialData.thumbnails[video.activeThumbnail];
//     }
//     return 'https://via.placeholder.com/800x450.png?text=No+Thumbnail'; 
//   };

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative overflow-x-hidden">
        
//         {/* === WELCOME MODAL === */}
//         {showWelcomeModal && (
//           <div 
//             ref={welcomeModalRef}
//             className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-4 transition-all duration-300"
//           >
//             <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 scrollbar-hide">
              
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2 rounded-full transition-colors z-[100000]"
//               >
//                 <X size={20} />
//               </button>
              
//               <div className="text-center mb-6 relative z-10">
//                  <div className="mx-auto w-16 h-16 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
//                    <ShieldAlert className="text-red-500" size={32} />
//                  </div>
//                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">
//                    Welcome to <span className="text-red-600">SPORTS</span>HUB
//                  </h2>
//                  <p className="text-gray-300 text-sm sm:text-base px-2">
//                    Please read these important instructions before streaming.
//                  </p>
//               </div>

//               <div className="space-y-4 relative z-10">
//                  <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-gray-800/50">
//                     <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
//                     <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
//                        <strong className="text-white font-bold text-base sm:text-lg block mb-0.5">Note 1:</strong> 
//                        The live stream will only start when the match officially begins. It will not play before the scheduled time.
//                     </p>
//                  </div>
                 
//                  <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-gray-800/50">
//                     <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
//                     <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
//                        <strong className="text-white font-bold text-base sm:text-lg block mb-0.5">Note 2:</strong> 
//                        If the stream doesn't play even after the match has started, it is a <span className="text-red-400 font-semibold">server issue</span>. It will resolve itself automatically. Meanwhile, you can check other servers below. Our team is actively working to fix this.
//                     </p>
//                  </div>
//               </div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="w-full mt-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-lg hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
//               >
//                 Continue to Website
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BLACK OVERLAY FOR ADS */}
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
          
//           <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0f0f0f] w-full transition-all duration-300">
             
//              {/* Categories Removed */}

//              <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                
//                 {/* VIDEO PLAYER AREA */}
//                 {!selectedVideo ? (
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">No Matches Available</h2>
//                        <p className="text-gray-400 max-w-lg z-10">Please check back later when matches are live.</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800 relative">
                        
//                         {isChangingChannel && (
//                            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
//                               <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
//                               <p className="text-white text-lg font-bold tracking-widest animate-pulse">Switching Server...</p>
//                            </div>
//                         )}

//                         <OkRuPlayer 
//                           videoId={activeVideoId || selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={getThumbnailImage(selectedVideo)} 
//                           autoPlay={true} 
//                         />
//                      </div>

//                      <div className="mt-5 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {selectedVideo.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>

//                         {selectedVideo.channels && selectedVideo.channels.length > 0 && (
//                           <div className="mt-4 mb-4 p-5 bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] border border-red-900/30 rounded-2xl flex flex-col gap-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            
//                             {/* Background glow for the container */}
//                             <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 blur-3xl rounded-full pointer-events-none"></div>

//                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//                               <div className="flex flex-col">
//                                 <div className="flex items-center gap-2 text-white">
//                                   <Tv size={22} className="text-red-500 animate-pulse"/>
//                                   <span className="text-base sm:text-lg font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
//                                     Available Servers
//                                   </span>
//                                 </div>
//                                 <span className="text-sm text-red-400 font-medium mt-1">
//                                   Stream stuck or not working, they fix in few seconds (server issue)? <span className="text-white font-bold underline decoration-red-500 decoration-2 underline-offset-2">Wacth Below More Matches, Current Live or Upcomming (Eastern Time)!</span>
//                                 </span>
//                               </div>
//                             </div>

//                             <div className="flex flex-wrap gap-3 mt-1 relative z-10">
//                               {selectedVideo.channels.map((channel, idx) => {
//                                 const isActive = activeVideoId === channel.videoId;
//                                 return (
//                                   <button
//                                     key={idx}
//                                     onClick={() => handleChannelChange(channel.videoId)}
//                                     className={`relative px-6 py-3 rounded-xl text-sm sm:text-base font-black transition-all duration-300 flex items-center gap-3 overflow-hidden group ${
//                                       isActive
//                                         ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-400 scale-105 z-10'
//                                         : 'bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a] text-gray-200 hover:text-white border-2 border-gray-600 hover:border-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:-translate-y-1'
//                                     }`}
//                                   >
//                                     {isActive && <span className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></span>}
                                    
//                                     {isActive ? (
//                                       <Radio size={18} className="animate-pulse text-white" />
//                                     ) : (
//                                       <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse group-hover:bg-red-500 group-hover:shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-colors"></div>
//                                     )}
                                    
//                                     <span className="relative z-10 tracking-wide uppercase">{channel.name}</span>
                                    
//                                     {!isActive && (
//                                       <span className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none"></span>
//                                     )}
//                                   </button>
//                                 );
//                               })}
//                             </div>
//                           </div>
//                         )}

//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-3 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {availableStreams && availableStreams.length > 0 && (
//                   <>
//                     <div className="flex flex-col mt-8 mb-4 px-1">
//                       <div className="flex justify-center my-6 w-full overflow-hidden">
//                         <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }} title="Sponsor Ad" />
//                       </div>
//                       <div className="flex items-center justify-between mt-2">
//                         <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                           <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                           Check Below for More Streams!
//                         </h2>
//                       </div>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {availableStreams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { 
//                               setIsChangingChannel(true);
//                               setSelectedVideo(video); 
//                               setActiveVideoId(video.channels && video.channels.length > 0 ? video.channels[0].videoId : video.videoId);
//                               window.scrollTo({ top: 0, behavior: 'smooth' }); 
                              
//                               setTimeout(() => {
//                                 setIsChangingChannel(false);
//                               }, 1000);
//                             }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img 
//                                   src={getThumbnailImage(video)} 
//                                   alt={video.videoTitle} 
//                                   className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
//                                   loading="lazy" 
//                                 />
                                
//                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                                   <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/20 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300 shadow-lg">
//                                     <Play fill="white" size={24} className="text-white ml-0.5" />
//                                   </div>
//                                 </div>

//                                 {video.isLive !== false && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
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
//              <div className="flex justify-center my-6 w-full overflow-hidden">
//                  <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }} title="Sponsor Ad" />
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






















































































































// ================== Alhmadullah good, bas srf yeh paddding css style k issue thaa jokey global.css me *{    } k andar code ko commnet kar deya hai jookeey teek hu qaya Alhamdullah =======================




// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv, X, ShieldAlert, Radio } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// interface ChannelData {
//   name: string;
//   videoId: string;
// }

// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   activeThumbnail: string; 
//   channels?: ChannelData[]; 
//   isLive?: boolean; // === UPDATE: yahan isLive add kar diya hai ===
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean; // Yeh root wala isLive hai (Global Live Badge ke liye)
//     title: string; 
//     thumbnails: { [key: string]: string }; // === UPDATE: Yahan global thumbnails add kiya hai ===
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
  
//   // === UPDATE: Filter logic - Sirf wo streams jin ka stream.isLive 'false' NAHI hai ===
//   const availableStreams = initialData.streams 
//     ? initialData.streams.filter((stream) => stream.isLive !== false) 
//     : [];

//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     availableStreams.length > 0 ? availableStreams[0] : null
//   );
  
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(
//     availableStreams.length > 0 
//       ? (availableStreams[0].channels && availableStreams[0].channels.length > 0 ? availableStreams[0].channels[0].videoId : availableStreams[0].videoId) 
//       : null
//   );
  
//   const [isChangingChannel, setIsChangingChannel] = useState(false);

//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const [showWelcomeModal, setShowWelcomeModal] = useState(true);

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);
//   const welcomeModalRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

//   useEffect(() => {
//     if (showWelcomeModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//     return () => { document.body.style.overflow = 'auto'; };
//   }, [showWelcomeModal]);

//   const handleChannelChange = (newVideoId: string) => {
//     if (activeVideoId === newVideoId) return; 
    
//     setIsChangingChannel(true);
//     setActiveVideoId(newVideoId);
    
//     setTimeout(() => {
//       setIsChangingChannel(false);
//     }, 1000);
//   };

//   const getThumbnailImage = (video: StreamData) => {
//     // === UPDATE: Ab global initialData.thumbnails se image fetch ho rahi hai ===
//     if (video && video.activeThumbnail && initialData.thumbnails && initialData.thumbnails[video.activeThumbnail]) {
//       return initialData.thumbnails[video.activeThumbnail];
//     }
//     return 'https://via.placeholder.com/800x450.png?text=No+Thumbnail'; 
//   };

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* === WELCOME MODAL === */}
//         {showWelcomeModal && (
//           <div 
//             ref={welcomeModalRef}
//             className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300"
//           >
//             <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 overflow-hidden">
              
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2.5 rounded-full transition-colors z-[100000]"
//               >
//                 <X size={24} />
//               </button>
              
//               <div className="text-center mb-10 relative z-10">
//                  <div className="mx-auto w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
//                    <ShieldAlert className="text-red-500" size={40} />
//                  </div>
//                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3">
//                    Welcome to <span className="text-red-600">SPORTS</span>HUB
//                  </h2>
//                  <p className="text-gray-300 text-base sm:text-lg px-4">
//                    Please read these important instructions before streaming.
//                  </p>
//               </div>

//               <div className="space-y-5 relative z-10">
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 1:</strong> 
//                        Live stream tabhi chalu hogi jab match officially start hoga. Time se pehle play nahi hogi.
//                     </p>
//                  </div>
                 
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 2:</strong> 
//                        Agar match start hone par bhi stream na chalay toh yeh <span className="text-red-400 font-semibold">server issue</span> hai. Yeh khud theek ho jayega, tab tak aap next server check kar sakte hain.Hamari team is masle ko theek karne par kaam kar rahi hai.
//                     </p>
//                  </div>
//               </div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="w-full mt-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-xl hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
//               >
//                 Continue to Website
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BLACK OVERLAY FOR ADS */}
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
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">No Matches Available</h2>
//                        <p className="text-gray-400 max-w-lg z-10">Please check back later when matches are live.</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800 relative">
                        
//                         {isChangingChannel && (
//                            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
//                               <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
//                               <p className="text-white text-lg font-bold tracking-widest animate-pulse">Switching Server...</p>
//                            </div>
//                         )}

//                         <OkRuPlayer 
//                           videoId={activeVideoId || selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={getThumbnailImage(selectedVideo)} 
//                           autoPlay={true} 
//                         />
//                      </div>

//                      <div className="mt-5 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {selectedVideo.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>

//                         {selectedVideo.channels && selectedVideo.channels.length > 0 && (
//                           <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-[#161616] to-[#0f0f0f] border border-gray-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg">
//                             <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap">
//                                <Tv size={20} className="text-red-500"/>
//                                <span className="text-sm font-bold uppercase tracking-wider">Select Channels  :</span>
//                             </div>
//                             <div className="flex flex-wrap gap-2.5">
//                               {selectedVideo.channels.map((channel, idx) => {
//                                 const isActive = activeVideoId === channel.videoId;
//                                 return (
//                                   <button
//                                     key={idx}
//                                     onClick={() => handleChannelChange(channel.videoId)}
//                                     className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden ${
//                                       isActive
//                                         ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500 scale-105'
//                                         : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a] hover:text-white border border-gray-700 hover:border-gray-500'
//                                     }`}
//                                   >
//                                     {isActive && <span className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></span>}
//                                     {isActive && <Radio size={16} className="animate-pulse" />}
//                                     <span className="relative z-10">{channel.name}</span>
//                                   </button>
//                                 );
//                               })}
//                             </div>
//                           </div>
//                         )}

//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-3 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {availableStreams && availableStreams.length > 0 && (
//                   <>
//                     <div className="flex items-center justify-between mt-8 mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">

//                         <div className="flex justify-center my-6">
//                           <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
//                         </div>

                        
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Check Below for More Streams!
//                       </h2>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {availableStreams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { 
//                               setIsChangingChannel(true);
//                               setSelectedVideo(video); 
//                               setActiveVideoId(video.channels && video.channels.length > 0 ? video.channels[0].videoId : video.videoId);
//                               window.scrollTo({ top: 0, behavior: 'smooth' }); 
                              
//                               setTimeout(() => {
//                                 setIsChangingChannel(false);
//                               }, 1000);
//                             }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img 
//                                   src={getThumbnailImage(video)} 
//                                   alt={video.videoTitle} 
//                                   className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
//                                   loading="lazy" 
//                                 />
                                
//                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                                   <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/20 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300 shadow-lg">
//                                     <Play fill="white" size={24} className="text-white ml-0.5" />
//                                   </div>
//                                 </div>

//                                 {video.isLive !== false && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
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





































// below code 26 may 2026 




// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv, X, ShieldAlert, Radio } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// interface ChannelData {
//   name: string;
//   videoId: string;
// }

// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   activeThumbnail: string; 
//   thumbnailsList: { [key: string]: string }; 
//   channels?: ChannelData[]; 
//   isLive?: boolean; // === UPDATE: yahan isLive add kar diya hai ===
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean; // Yeh root wala isLive hai (Global Live Badge ke liye)
//     title: string; 
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
  
//   // === UPDATE: Filter logic - Sirf wo streams jin ka stream.isLive 'false' NAHI hai ===
//   const availableStreams = initialData.streams 
//     ? initialData.streams.filter((stream) => stream.isLive !== false) 
//     : [];

//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     availableStreams.length > 0 ? availableStreams[0] : null
//   );
  
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(
//     availableStreams.length > 0 
//       ? (availableStreams[0].channels && availableStreams[0].channels.length > 0 ? availableStreams[0].channels[0].videoId : availableStreams[0].videoId) 
//       : null
//   );
  
//   const [isChangingChannel, setIsChangingChannel] = useState(false);

//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const [showWelcomeModal, setShowWelcomeModal] = useState(true);

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);
//   const welcomeModalRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

//   useEffect(() => {
//     if (showWelcomeModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//     return () => { document.body.style.overflow = 'auto'; };
//   }, [showWelcomeModal]);

//   const handleChannelChange = (newVideoId: string) => {
//     if (activeVideoId === newVideoId) return; 
    
//     setIsChangingChannel(true);
//     setActiveVideoId(newVideoId);
    
//     setTimeout(() => {
//       setIsChangingChannel(false);
//     }, 1000);
//   };

//   const getThumbnailImage = (video: StreamData) => {
//     if (video && video.thumbnailsList && video.activeThumbnail && video.thumbnailsList[video.activeThumbnail]) {
//       return video.thumbnailsList[video.activeThumbnail];
//     }
//     return 'https://via.placeholder.com/800x450.png?text=No+Thumbnail'; 
//   };

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

      

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* === WELCOME MODAL === */}
//         {showWelcomeModal && (
//           <div 
//             ref={welcomeModalRef}
//             className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300"
//           >
//             <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 overflow-hidden">
              
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2.5 rounded-full transition-colors z-[100000]"
//               >
//                 <X size={24} />
//               </button>
              
//               <div className="text-center mb-10 relative z-10">
//                  <div className="mx-auto w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
//                    <ShieldAlert className="text-red-500" size={40} />
//                  </div>
//                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3">
//                    Welcome to <span className="text-red-600">SPORTS</span>HUB
//                  </h2>
//                  <p className="text-gray-300 text-base sm:text-lg px-4">
//                    Please read these important instructions before streaming.
//                  </p>
//               </div>

//               <div className="space-y-5 relative z-10">
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 1:</strong> 
//                        Live stream tabhi chalu hogi jab match officially start hoga. Time se pehle play nahi hogi.
//                     </p>
//                  </div>
                 
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 2:</strong> 
//                        Agar match start hone par bhi stream na chalay toh yeh <span className="text-red-400 font-semibold">server issue</span> hai. Yeh khud theek ho jayega, tab tak aap next server check kar sakte hain.Hamari team is masle ko theek karne par kaam kar rahi hai.
//                     </p>
//                  </div>
//               </div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="w-full mt-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-xl hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
//               >
//                 Continue to Website
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BLACK OVERLAY FOR ADS */}
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
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">No Matches Available</h2>
//                        <p className="text-gray-400 max-w-lg z-10">Please check back later when matches are live.</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800 relative">
                        
//                         {isChangingChannel && (
//                            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
//                               <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
//                               <p className="text-white text-lg font-bold tracking-widest animate-pulse">Switching Server...</p>
//                            </div>
//                         )}

//                         <OkRuPlayer 
//                           videoId={activeVideoId || selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={getThumbnailImage(selectedVideo)} 
//                           autoPlay={true} 
//                         />
//                      </div>

//                      <div className="mt-5 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {selectedVideo.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>

//                         {selectedVideo.channels && selectedVideo.channels.length > 0 && (
//                           <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-[#161616] to-[#0f0f0f] border border-gray-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg">
//                             <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap">
//                                <Tv size={20} className="text-red-500"/>
//                                <span className="text-sm font-bold uppercase tracking-wider">Select Channels  :</span>
//                             </div>
//                             <div className="flex flex-wrap gap-2.5">
//                               {selectedVideo.channels.map((channel, idx) => {
//                                 const isActive = activeVideoId === channel.videoId;
//                                 return (
//                                   <button
//                                     key={idx}
//                                     onClick={() => handleChannelChange(channel.videoId)}
//                                     className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden ${
//                                       isActive
//                                         ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500 scale-105'
//                                         : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a] hover:text-white border border-gray-700 hover:border-gray-500'
//                                     }`}
//                                   >
//                                     {isActive && <span className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></span>}
//                                     {isActive && <Radio size={16} className="animate-pulse" />}
//                                     <span className="relative z-10">{channel.name}</span>
//                                   </button>
//                                 );
//                               })}
//                             </div>
//                           </div>
//                         )}

//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-3 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {availableStreams && availableStreams.length > 0 && (
//                   <>
//                     <div className="flex items-center justify-between mt-8 mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">

//                         <div className="flex justify-center my-6">
//                           <iframe src="/banner" width="300" height="250" style={{ border: 'none', overflow: 'hidden' }} title="Sponsor Ad" />
//                         </div>

                        
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Check Below for More Streams!
//                       </h2>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {availableStreams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { 
//                               setIsChangingChannel(true);
//                               setSelectedVideo(video); 
//                               setActiveVideoId(video.channels && video.channels.length > 0 ? video.channels[0].videoId : video.videoId);
//                               window.scrollTo({ top: 0, behavior: 'smooth' }); 
                              
//                               setTimeout(() => {
//                                 setIsChangingChannel(false);
//                               }, 1000);
//                             }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img 
//                                   src={getThumbnailImage(video)} 
//                                   alt={video.videoTitle} 
//                                   className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
//                                   loading="lazy" 
//                                 />
                                
//                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                                   <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/20 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-300 shadow-lg">
//                                     <Play fill="white" size={24} className="text-white ml-0.5" />
//                                   </div>
//                                 </div>

//                                 {video.isLive !== false && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
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

















// ================ Alhamdullah done, bas eek new functionality add karty hai agar acha ipl k match nahey hai tuuu iss sport ko frontend par hide karey ============================




// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv, X, ShieldAlert, Radio } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// interface ChannelData {
//   name: string;
//   videoId: string;
// }

// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   activeThumbnail: string; 
//   thumbnailsList: { [key: string]: string }; 
//   channels?: ChannelData[]; 
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean;
//     title: string; 
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     initialData.streams && initialData.streams.length > 0 ? initialData.streams[0] : null
//   );
  
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(
//     initialData.streams && initialData.streams.length > 0 
//       ? (initialData.streams[0].channels && initialData.streams[0].channels.length > 0 ? initialData.streams[0].channels[0].videoId : initialData.streams[0].videoId) 
//       : null
//   );
  
//   const [isChangingChannel, setIsChangingChannel] = useState(false);

//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const [showWelcomeModal, setShowWelcomeModal] = useState(true);

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);
//   const welcomeModalRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

//   useEffect(() => {
//     if (showWelcomeModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//     return () => { document.body.style.overflow = 'auto'; };
//   }, [showWelcomeModal]);

//   const handleChannelChange = (newVideoId: string) => {
//     if (activeVideoId === newVideoId) return; 
    
//     setIsChangingChannel(true);
//     setActiveVideoId(newVideoId);
    
//     setTimeout(() => {
//       setIsChangingChannel(false);
//     }, 1000);
//   };

//   // === UPDATE: Safe Function to prevent build errors if thumbnail is missing ===
//   const getThumbnailImage = (video: StreamData) => {
//     if (video && video.thumbnailsList && video.activeThumbnail && video.thumbnailsList[video.activeThumbnail]) {
//       return video.thumbnailsList[video.activeThumbnail];
//     }
//     return 'https://via.placeholder.com/800x450.png?text=No+Thumbnail'; // Fallback image
//   };

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* === WELCOME MODAL === */}
//         {showWelcomeModal && (
//           <div 
//             ref={welcomeModalRef}
//             className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300"
//           >
//             <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 overflow-hidden">
              
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2.5 rounded-full transition-colors z-[100000]"
//               >
//                 <X size={24} />
//               </button>
              
//               <div className="text-center mb-10 relative z-10">
//                  <div className="mx-auto w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
//                    <ShieldAlert className="text-red-500" size={40} />
//                  </div>
//                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3">
//                    Welcome to <span className="text-red-600">SPORTS</span>HUB
//                  </h2>
//                  <p className="text-gray-300 text-base sm:text-lg px-4">
//                    Please read these important instructions before streaming.
//                  </p>
//               </div>

//               <div className="space-y-5 relative z-10">
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 1:</strong> 
//                        Live stream tabhi chalu hogi jab match officially start hoga. Time se pehle play nahi hogi.
//                     </p>
//                  </div>
                 
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 2:</strong> 
//                        Agar match start hone par bhi stream na chalay toh yeh <span className="text-red-400 font-semibold">server issue</span> hai. Yeh khud theek ho jayega, tab tak aap next server check kar sakte hain.Hamari team is masle ko theek karne par kaam kar rahi hai.
//                     </p>
//                  </div>
//               </div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="w-full mt-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-xl hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
//               >
//                 Continue to Website
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BLACK OVERLAY FOR ADS */}
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
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">Stream Offline</h2>
//                        <p className="text-gray-400 max-w-lg z-10">Please wait while streams are loading.</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800 relative">
                        
//                         {isChangingChannel && (
//                            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
//                               <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
//                               <p className="text-white text-lg font-bold tracking-widest animate-pulse">Switching Server...</p>
//                            </div>
//                         )}

//                         <OkRuPlayer 
//                           videoId={activeVideoId || selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={getThumbnailImage(selectedVideo)} 
//                           autoPlay={true} 
//                         />
//                      </div>

//                      <div className="mt-5 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {initialData.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>

//                         {selectedVideo.channels && selectedVideo.channels.length > 0 && (
//                           <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-[#161616] to-[#0f0f0f] border border-gray-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg">
//                             <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap">
//                                <Tv size={20} className="text-red-500"/>
//                                <span className="text-sm font-bold uppercase tracking-wider">Select Channels  :</span>
//                             </div>
//                             <div className="flex flex-wrap gap-2.5">
//                               {selectedVideo.channels.map((channel, idx) => {
//                                 const isActive = activeVideoId === channel.videoId;
//                                 return (
//                                   <button
//                                     key={idx}
//                                     onClick={() => handleChannelChange(channel.videoId)}
//                                     className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden ${
//                                       isActive
//                                         ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500 scale-105'
//                                         : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a] hover:text-white border border-gray-700 hover:border-gray-500'
//                                     }`}
//                                   >
//                                     {isActive && <span className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></span>}
//                                     {isActive && <Radio size={16} className="animate-pulse" />}
//                                     <span className="relative z-10">{channel.name}</span>
//                                   </button>
//                                 );
//                               })}
//                             </div>
//                           </div>
//                         )}

//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-3 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {initialData.streams && initialData.streams.length > 0 && (
//                   <>
//                     <div className="flex items-center justify-between mt-8 mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Check Below for More Streams!
//                       </h2>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {initialData.streams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { 
//                               setIsChangingChannel(true);
//                               setSelectedVideo(video); 
//                               setActiveVideoId(video.channels && video.channels.length > 0 ? video.channels[0].videoId : video.videoId);
//                               window.scrollTo({ top: 0, behavior: 'smooth' }); 
                              
//                               setTimeout(() => {
//                                 setIsChangingChannel(false);
//                               }, 1000);
//                             }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img 
//                                   src={getThumbnailImage(video)} 
//                                   alt={video.videoTitle} 
//                                   className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
//                                   loading="lazy" 
//                                 />
                                
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


















// ========================================== yeh eek error ata hai jab data.json mei koi data add karey json format not match , below code mei yeh error ata hai ===========================



// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv, X, ShieldAlert, Radio } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// interface ChannelData {
//   name: string;
//   videoId: string;
// }

// // === UPDATE: Thumbnail library ka structure add kiya ===
// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   activeThumbnail: string; // Konsa thumbnail show karna hai
//   thumbnailsList: { [key: string]: string }; // Sab thumbnails ka collection
//   channels?: ChannelData[]; 
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean;
//     title: string; 
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     initialData.streams && initialData.streams.length > 0 ? initialData.streams[0] : null
//   );
  
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(
//     initialData.streams && initialData.streams.length > 0 
//       ? (initialData.streams[0].channels && initialData.streams[0].channels.length > 0 ? initialData.streams[0].channels[0].videoId : initialData.streams[0].videoId) 
//       : null
//   );
  
//   const [isChangingChannel, setIsChangingChannel] = useState(false);

//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const [showWelcomeModal, setShowWelcomeModal] = useState(true);

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);
//   const welcomeModalRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

//   useEffect(() => {
//     if (showWelcomeModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//     return () => { document.body.style.overflow = 'auto'; };
//   }, [showWelcomeModal]);

//   const handleChannelChange = (newVideoId: string) => {
//     if (activeVideoId === newVideoId) return; 
    
//     setIsChangingChannel(true);
//     setActiveVideoId(newVideoId);
    
//     setTimeout(() => {
//       setIsChangingChannel(false);
//     }, 1000);
//   };

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* === WELCOME MODAL === */}
//         {showWelcomeModal && (
//           <div 
//             ref={welcomeModalRef}
//             className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300"
//           >
//             <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 overflow-hidden">
              
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2.5 rounded-full transition-colors z-[100000]"
//               >
//                 <X size={24} />
//               </button>
              
//               <div className="text-center mb-10 relative z-10">
//                  <div className="mx-auto w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
//                    <ShieldAlert className="text-red-500" size={40} />
//                  </div>
//                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3">
//                    Welcome to <span className="text-red-600">SPORTS</span>HUB
//                  </h2>
//                  <p className="text-gray-300 text-base sm:text-lg px-4">
//                    Please read these important instructions before streaming.
//                  </p>
//               </div>

//               <div className="space-y-5 relative z-10">
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 1:</strong> 
//                        Live stream tabhi chalu hogi jab match officially start hoga. Time se pehle play nahi hogi.
//                     </p>
//                  </div>
                 
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 2:</strong> 
//                        Agar match start hone par bhi stream na chalay toh yeh <span className="text-red-400 font-semibold">server issue</span> hai. Yeh khud theek ho jayega, tab tak aap next server check kar sakte hain.Hamari team is masle ko theek karne par kaam kar rahi hai.
//                     </p>
//                  </div>
//               </div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="w-full mt-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-xl hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
//               >
//                 Continue to Website
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BLACK OVERLAY FOR ADS */}
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
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">Stream Offline</h2>
//                        <p className="text-gray-400 max-w-lg z-10">Please wait while streams are loading.</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800 relative">
                        
//                         {isChangingChannel && (
//                            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
//                               <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
//                               <p className="text-white text-lg font-bold tracking-widest animate-pulse">Switching Server...</p>
//                            </div>
//                         )}

//                         <OkRuPlayer 
//                           videoId={activeVideoId || selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={selectedVideo.thumbnailsList[selectedVideo.activeThumbnail]} 
//                           autoPlay={true} 
//                         />
//                      </div>

//                      <div className="mt-5 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {initialData.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>

//                         {selectedVideo.channels && selectedVideo.channels.length > 0 && (
//                           <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-[#161616] to-[#0f0f0f] border border-gray-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg">
//                             <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap">
//                                <Tv size={20} className="text-red-500"/>
//                                <span className="text-sm font-bold uppercase tracking-wider">Select Channels  :</span>
//                             </div>
//                             <div className="flex flex-wrap gap-2.5">
//                               {selectedVideo.channels.map((channel, idx) => {
//                                 const isActive = activeVideoId === channel.videoId;
//                                 return (
//                                   <button
//                                     key={idx}
//                                     onClick={() => handleChannelChange(channel.videoId)}
//                                     className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden ${
//                                       isActive
//                                         ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500 scale-105'
//                                         : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a] hover:text-white border border-gray-700 hover:border-gray-500'
//                                     }`}
//                                   >
//                                     {isActive && <span className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></span>}
//                                     {isActive && <Radio size={16} className="animate-pulse" />}
//                                     <span className="relative z-10">{channel.name}</span>
//                                   </button>
//                                 );
//                               })}
//                             </div>
//                           </div>
//                         )}

//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-3 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {initialData.streams && initialData.streams.length > 0 && (
//                   <>
//                     <div className="flex items-center justify-between mt-8 mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Check Below for More Streams!
//                       </h2>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {initialData.streams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { 
//                               setIsChangingChannel(true);
//                               setSelectedVideo(video); 
//                               setActiveVideoId(video.channels && video.channels.length > 0 ? video.channels[0].videoId : video.videoId);
//                               window.scrollTo({ top: 0, behavior: 'smooth' }); 
                              
//                               setTimeout(() => {
//                                 setIsChangingChannel(false);
//                               }, 1000);
//                             }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img 
//                                   src={video.thumbnailsList[video.activeThumbnail]} 
//                                   alt={video.videoTitle} 
//                                   className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
//                                   loading="lazy" 
//                                 />
                                
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












// 1

// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv, X, ShieldAlert, Radio } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// interface ChannelData {
//   name: string;
//   videoId: string;
// }

// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   thumbnail: string;
//   channels?: ChannelData[]; 
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean;
//     title: string; 
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     initialData.streams && initialData.streams.length > 0 ? initialData.streams[0] : null
//   );
  
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(
//     initialData.streams && initialData.streams.length > 0 
//       ? (initialData.streams[0].channels && initialData.streams[0].channels.length > 0 ? initialData.streams[0].channels[0].videoId : initialData.streams[0].videoId) 
//       : null
//   );
  
//   // === UPDATE: Loading state add kiya visual feedback ke liye ===
//   const [isChangingChannel, setIsChangingChannel] = useState(false);

//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const [showWelcomeModal, setShowWelcomeModal] = useState(true);

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);
//   const welcomeModalRef = useRef<HTMLDivElement>(null);

//   // ULTIMATE DETECTOR (Ads ke liye)
//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

//   // Modal open hone par background scrolling rokne aur close hone par wapas theek karne ke liye
//   useEffect(() => {
//     if (showWelcomeModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//     return () => { document.body.style.overflow = 'auto'; };
//   }, [showWelcomeModal]);

//   // === UPDATE: Channel change handle karne ka function ===
//   const handleChannelChange = (newVideoId: string) => {
//     if (activeVideoId === newVideoId) return; // Agar same channel par click kiya toh kuch na karo
    
//     setIsChangingChannel(true);
//     setActiveVideoId(newVideoId);
    
//     // 1 second baad loading hata do taake smooth transition lage
//     setTimeout(() => {
//       setIsChangingChannel(false);
//     }, 1000);
//   };

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* === WELCOME MODAL === */}
//         {showWelcomeModal && (
//           <div 
//             ref={welcomeModalRef}
//             className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300"
//           >
//             <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 overflow-hidden">
              
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2.5 rounded-full transition-colors z-[100000]"
//               >
//                 <X size={24} />
//               </button>
              
//               <div className="text-center mb-10 relative z-10">
//                  <div className="mx-auto w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
//                    <ShieldAlert className="text-red-500" size={40} />
//                  </div>
//                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3">
//                    Welcome to <span className="text-red-600">SPORTS</span>HUB
//                  </h2>
//                  <p className="text-gray-300 text-base sm:text-lg px-4">
//                    Please read these important instructions before streaming.
//                  </p>
//               </div>

//               <div className="space-y-5 relative z-10">
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 1:</strong> 
//                        Live stream tabhi chalu hogi jab match officially start hoga. Time se pehle play nahi hogi.
//                     </p>
//                  </div>
                 
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 2:</strong> 
//                        Agar match start hone par bhi stream na chalay toh yeh <span className="text-red-400 font-semibold">server issue</span> hai. Yeh khud theek ho jayega, tab tak aap next server check kar sakte hain.Hamari team is masle ko theek karne par kaam kar rahi hai.
//                     </p>
//                  </div>
//               </div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="w-full mt-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-xl hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
//               >
//                 Continue to Website
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BLACK OVERLAY FOR ADS */}
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
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">Stream Offline</h2>
//                        <p className="text-gray-400 max-w-lg z-10">Please wait while streams are loading.</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
//                      {/* === UPDATE: Video Player + Loading State === */}
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800 relative">
                        
//                         {/* Loading Overlay */}
//                         {isChangingChannel && (
//                            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
//                               <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
//                               <p className="text-white text-lg font-bold tracking-widest animate-pulse">Switching Channel...</p>
//                            </div>
//                         )}

//                         <OkRuPlayer 
//                           videoId={activeVideoId || selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={selectedVideo.thumbnail} 
//                           autoPlay={true} 
//                         />
//                      </div>

//                      <div className="mt-5 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {initialData.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>

//                         {/* === UPDATE: IMPROVED CHANNELS LIST UI === */}
//                         {selectedVideo.channels && selectedVideo.channels.length > 0 && (
//                           <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-[#161616] to-[#0f0f0f] border border-gray-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg">
//                             <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap">
//                                <Tv size={20} className="text-red-500"/>
//                                <span className="text-sm font-bold uppercase tracking-wider">Select Channels :</span>
//                             </div>
//                             <div className="flex flex-wrap gap-2.5">
//                               {selectedVideo.channels.map((channel, idx) => {
//                                 const isActive = activeVideoId === channel.videoId;
//                                 return (
//                                   <button
//                                     key={idx}
//                                     onClick={() => handleChannelChange(channel.videoId)}
//                                     className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden ${
//                                       isActive
//                                         ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500 scale-105'
//                                         : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a] hover:text-white border border-gray-700 hover:border-gray-500'
//                                     }`}
//                                   >
//                                     {isActive && <span className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></span>}
//                                     {isActive && <Radio size={16} className="animate-pulse" />}
//                                     <span className="relative z-10">{channel.name}</span>
//                                   </button>
//                                 );
//                               })}
//                             </div>
//                           </div>
//                         )}

//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-3 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {initialData.streams && initialData.streams.length > 0 && (
//                   <>
//                     <div className="flex items-center justify-between mt-8 mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Check Below for More Streams!
//                       </h2>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {initialData.streams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { 
//                               // Grid video click par bhi loading aur naya channel set karein
//                               setIsChangingChannel(true);
//                               setSelectedVideo(video); 
//                               setActiveVideoId(video.channels && video.channels.length > 0 ? video.channels[0].videoId : video.videoId);
//                               window.scrollTo({ top: 0, behavior: 'smooth' }); 
                              
//                               setTimeout(() => {
//                                 setIsChangingChannel(false);
//                               }, 1000);
//                             }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img src={video.thumbnail} alt={video.videoTitle} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                                
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








// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv, X, ShieldAlert } from 'lucide-react'; 
// import Script from 'next/script'; 
// import Head from 'next/head'; 

// // === UPDATE: Channel interface add kiya ===
// interface ChannelData {
//   name: string;
//   videoId: string;
// }

// interface StreamData {
//   videoTitle: string;
//   videoId: string;
//   thumbnail: string;
//   channels?: ChannelData[]; // === UPDATE: Channels array add kiya ===
// }

// interface HomeProps {
//   initialData: {
//     isLive: boolean;
//     title: string; 
//     streams: StreamData[]; 
//   };
// }

// export default function HomeClient({ initialData }: HomeProps) {
//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     initialData.streams && initialData.streams.length > 0 ? initialData.streams[0] : null
//   );
  
//   // === UPDATE: Active video id track karne ke liye taake channel change ho sake ===
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(
//     initialData.streams && initialData.streams.length > 0 
//       ? (initialData.streams[0].channels && initialData.streams[0].channels.length > 0 ? initialData.streams[0].channels[0].videoId : initialData.streams[0].videoId) 
//       : null
//   );
  
//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const [showWelcomeModal, setShowWelcomeModal] = useState(true);

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);
//   const welcomeModalRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

//   useEffect(() => {
//     if (showWelcomeModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//     return () => { document.body.style.overflow = 'auto'; };
//   }, [showWelcomeModal]);

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* === WELCOME MODAL === */}
//         {showWelcomeModal && (
//           <div 
//             ref={welcomeModalRef}
//             className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300"
//           >
//             <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 overflow-hidden">
              
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2.5 rounded-full transition-colors z-[100000]"
//               >
//                 <X size={24} />
//               </button>
              
//               <div className="text-center mb-10 relative z-10">
//                  <div className="mx-auto w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
//                    <ShieldAlert className="text-red-500" size={40} />
//                  </div>
//                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3">
//                    Welcome to <span className="text-red-600">SPORTS</span>HUB
//                  </h2>
//                  <p className="text-gray-300 text-base sm:text-lg px-4">
//                    Please read these important instructions before streaming.
//                  </p>
//               </div>

//               <div className="space-y-5 relative z-10">
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 1:</strong> 
//                        Live stream tabhi chalu hogi jab match officially start hoga. Time se pehle play nahi hogi.
//                     </p>
//                  </div>
                 
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 2:</strong> 
//                        Agar match start hone par bhi stream na chalay toh yeh <span className="text-red-400 font-semibold">server issue</span> hai. Yeh khud theek ho jayega, tab tak aap next server check kar sakte hain.Hamari team is masle ko theek karne par kaam kar rahi hai.
//                     </p>
//                  </div>
//               </div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="w-full mt-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-xl hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
//               >
//                 Continue to Website
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BLACK OVERLAY FOR ADS */}
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
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">Stream Offline</h2>
//                        <p className="text-gray-400 max-w-lg z-10">Please wait while streams are loading.</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
//                         <OkRuPlayer 
//                           videoId={activeVideoId || selectedVideo.videoId} // === UPDATE: selectedVideo ki jagah activeVideoId ===
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={selectedVideo.thumbnail} 
//                           autoPlay={true} 
//                         />
//                      </div>

//                      <div className="mt-5 px-1">
//                         <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
//                           {selectedVideo.videoTitle} {initialData.isLive && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
//                         </h1>

//                         {/* === UPDATE: CHANNELS LIST UI === */}
//                         {selectedVideo.channels && selectedVideo.channels.length > 0 && (
//                           <div className="flex flex-wrap gap-2 mt-3 mb-2">
//                             {selectedVideo.channels.map((channel, idx) => (
//                               <button
//                                 key={idx}
//                                 onClick={() => setActiveVideoId(channel.videoId)}
//                                 className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
//                                   activeVideoId === channel.videoId
//                                     ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.6)] border border-red-500'
//                                     : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] border border-gray-800'
//                                 }`}
//                               >
//                                 {channel.name}
//                               </button>
//                             ))}
//                           </div>
//                         )}

//                         <p className="text-sm text-gray-400 border-l-2 border-red-600 pl-3 py-1 mt-2 bg-gray-900/50 rounded-r-md">
//                           {initialData.title}
//                         </p>
//                      </div>
//                   </div>
//                 )}

//                 {/* MULTIPLE STREAMS GRID */}
//                 {initialData.streams && initialData.streams.length > 0 && (
//                   <>
//                     <div className="flex items-center justify-between mt-8 mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Check Below for More Streams!
//                       </h2>
//                     </div>
                    
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                        {initialData.streams.map((video, idx) => (
//                           <div 
//                             key={idx} 
//                             onClick={() => { 
//                               setSelectedVideo(video); 
//                               // === UPDATE: Naya sport select hone par pehle channel (ya default) ka videoId set karega ===
//                               setActiveVideoId(video.channels && video.channels.length > 0 ? video.channels[0].videoId : video.videoId);
//                               window.scrollTo({ top: 0, behavior: 'smooth' }); 
//                             }} 
//                             className="group cursor-pointer flex flex-col"
//                           >
//                              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border ${selectedVideo?.videoId === video.videoId ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-gray-800 group-hover:border-red-600/50'}`}>
//                                 <img src={video.thumbnail} alt={video.videoTitle} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                                
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
































































































// ================= Yeh Alhmduallh fulley done hai project2.0 bas srf muliples chaneel add karty hai har sports k andar like Asport,starsport etc ==============================



// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer'; 
// import { Play, Menu, User, Tv, X, ShieldAlert } from 'lucide-react'; 
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
//   const [selectedVideo, setSelectedVideo] = useState<StreamData | null>(
//     initialData.streams && initialData.streams.length > 0 ? initialData.streams[0] : null
//   );
  
//   const [isOverlayVisible, setOverlayVisible] = useState(false); 
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const [showWelcomeModal, setShowWelcomeModal] = useState(true);

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const navbarRef = useRef<HTMLElement>(null);
//   // === UPDATE: Welcome Modal ka Ref add kiya taake Ad Detector confuse na ho ===
//   const welcomeModalRef = useRef<HTMLDivElement>(null);

//   // ULTIMATE DETECTOR (Ads ke liye)
//   useEffect(() => {
//     const checkForAd = () => {
//       const allElements = document.body.getElementsByTagName('*');
//       for (let i = 0; i < allElements.length; i++) {
//         const el = allElements[i] as HTMLElement;
//         if (overlayRef.current && overlayRef.current.contains(el)) continue;
//         if (navbarRef.current && navbarRef.current.contains(el)) continue;
//         // === UPDATE: Ad Detector ko bataya ke Welcome Modal ko ignore kare ===
//         if (welcomeModalRef.current && welcomeModalRef.current.contains(el)) continue;
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

//   // Modal open hone par background scrolling rokne aur close hone par wapas theek karne ke liye
//   useEffect(() => {
//     if (showWelcomeModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//     // Cleanup function
//     return () => { document.body.style.overflow = 'auto'; };
//   }, [showWelcomeModal]);

//   return (
//     <>
//       <Head>
//         <link rel="preconnect" href="https://ok.ru" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://ok.ru" />
//       </Head>

//       <div className="min-h-screen bg-[#0f0f0f] text-white font-sans relative">
        
//         {/* === WELCOME MODAL === */}
//         {showWelcomeModal && (
//           <div 
//             ref={welcomeModalRef} // Ref attach kiya
//             className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 transition-all duration-300"
//           >
//             <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-500 overflow-hidden">
              
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-red-600 p-2.5 rounded-full transition-colors z-[100000]"
//               >
//                 <X size={24} />
//               </button>
              
//               <div className="text-center mb-10 relative z-10">
//                  <div className="mx-auto w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
//                    <ShieldAlert className="text-red-500" size={40} />
//                  </div>
//                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3">
//                    Welcome to <span className="text-red-600">SPORTS</span>HUB
//                  </h2>
//                  <p className="text-gray-300 text-base sm:text-lg px-4">
//                    Please read these important instructions before streaming.
//                  </p>
//               </div>

//               <div className="space-y-5 relative z-10">
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] flex-shrink-0 animate-pulse"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 1:</strong> 
//                        Live stream tabhi chalu hogi jab match officially start hoga. Time se pehle play nahi hogi.
//                     </p>
//                  </div>
                 
//                  <div className="flex items-start gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/50">
//                     <div className="mt-2 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] flex-shrink-0"></div>
//                     <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
//                        <strong className="text-white font-bold text-lg sm:text-xl block mb-1">Note 2:</strong> 
//                        Agar match start hone par bhi stream na chalay toh yeh <span className="text-red-400 font-semibold">server issue</span> hai. Yeh khud theek ho jayega, tab tak aap next server check kar sakte hain.Hamari team is masle ko theek karne par kaam kar rahi hai.
//                     </p>
//                  </div>
//               </div>
              
//               <button 
//                 onClick={() => setShowWelcomeModal(false)}
//                 className="w-full mt-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/40 text-xl hover:scale-[1.02] active:scale-[0.98] relative z-10 tracking-wide"
//               >
//                 Continue to Website
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BLACK OVERLAY FOR ADS */}
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
//                   <div className="mb-8 animate-in fade-in zoom-in duration-500">
//                     <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1a1a1a] rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner relative overflow-hidden">
//                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-800 z-10">
//                           <Tv className="text-red-600/80" size={36} />
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide z-10">Stream Offline</h2>
//                        <p className="text-gray-400 max-w-lg z-10">Please wait while streams are loading.</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     
//                      <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
//                         <OkRuPlayer 
//                           videoId={selectedVideo.videoId} 
//                           title={selectedVideo.videoTitle} 
//                           thumbnail={selectedVideo.thumbnail} 
//                           autoPlay={true} 
//                         />
//                      </div>

//                      <div className="mt-5 px-1">
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
//                     <div className="flex items-center justify-between mt-8 mb-4 px-1">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                         <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span> 
//                         Check Below for More Streams!
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
