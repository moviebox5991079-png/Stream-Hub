'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Maximize, Minimize, Play, Loader2 } from 'lucide-react'; // Play icon add kiya

interface OkRuPlayerProps {
  videoId: string;
  title?: string;
  thumbnail?: string; // New Prop added
  autoPlay?: boolean;
}

const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
  videoId, 
  title = "OK.ru Video Player",
  thumbnail, 
  autoPlay = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlayClicked, setIsPlayClicked] = useState(false); // New State
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Smart ID Extractor
  const cleanVideoId = useMemo(() => {
    if (!videoId) return '';
    const iframeMatch = videoId.match(/videoembed\/(\d+)/);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    const urlMatch = videoId.match(/ok\.ru\/video\/(\d+)/);
    if (urlMatch && urlMatch[1]) return urlMatch[1];
    return videoId;
  }, [videoId]);

  // URL mein autoplay hamesha 1 rahega kyunke user ne click kar diya hai
  const embedUrl = `https://ok.ru/videoembed/${cleanVideoId}?nochat=1&autoplay=1`;

  // === FULLSCREEN LOGIC (Same as your original) ===
  const toggleFullScreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        const el: any = containerRef.current;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
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
      <div 
        ref={containerRef} 
        className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group"
      >
        {/* Step 1: Fake Thumbnail & Play Button (Dikhayen jab tak click na ho) */}
        {!isPlayClicked ? (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer bg-black"
            onClick={() => setIsPlayClicked(true)}
          >
            {thumbnail && (
              <img 
                src={thumbnail} 
                alt={title} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 hover:opacity-50 transition duration-300"
              />
            )}
            <div className="relative z-10 w-20 h-20 bg-red-600/90 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.6)] transform group-hover:scale-110 transition-all">
              <Play className="text-white ml-2" size={40} fill="white" />
            </div>
          </div>
        ) : (
          /* Step 2: Iframe and Loading Animation (Click ke baad dikhayen) */
          <>
            {/* === SHIELDS === */}
            <div className="absolute top-0 right-0 w-[80%] h-[18%] md:h-[10%] z-50 bg-transparent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onContextMenu={(e) => e.preventDefault()} />
            <div className="absolute top-0 right-0 w-[15%] h-[20%] z-50 bg-transparent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onContextMenu={(e) => e.preventDefault()} />
            <div className="absolute bottom-0 right-0 z-50 bg-transparent w-[6%] h-[15%] md:w-[6%] md:h-[10%]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onContextMenu={(e) => e.preventDefault()} />

            {/* Custom Controls */}
            <button
              onClick={toggleFullScreen}
              className="absolute bottom-4 right-8 z-[60] p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>

            {/* Loading Animation */}
            {!isLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-[#000000] overflow-hidden">
                <div className="absolute w-64 h-64 bg-red-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
                <div className="relative flex flex-col items-center gap-6 z-10">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-[3px] border-red-900/30 animate-[spin_3s_linear_infinite]"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-[3px] border-t-red-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-bold tracking-[0.2em] text-sm animate-pulse">CONNECTING STREAM</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actual OK.ru Player */}
            <iframe
              src={embedUrl}
              title={title}
              className="absolute top-0 left-0 w-full h-full z-10"
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture; screen-wake-lock"
              onLoad={() => setIsLoaded(true)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default OkRuPlayer;

























// ======= king ======================


// 'use client';

// import React, { useRef, useState, useEffect, useMemo } from 'react';
// import { Maximize, Minimize, Loader2 } from 'lucide-react'; 

// interface OkRuPlayerProps {
//   videoId: string;
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [isLandscape, setIsLandscape] = useState<boolean>(false);
//   const [showRotateHint, setShowRotateHint] = useState<boolean>(false);
//   const [isIosSafari, setIsIosSafari] = useState<boolean>(false);

//   // Smart ID Extractor
//   const cleanVideoId = useMemo(() => {
//     if (!videoId) return '';
//     const iframeMatch = videoId.match(/videoembed\/(\d+)/);
//     if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
//     const urlMatch = videoId.match(/ok\.ru\/video\/(\d+)/);
//     if (urlMatch && urlMatch[1]) return urlMatch[1];
//     return videoId;
//   }, [videoId]);

//   const embedUrl = `https://ok.ru/videoembed/${cleanVideoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   useEffect(() => { setIsLoaded(false); }, [cleanVideoId]);

//   // === UPDATED FULLSCREEN LOGIC (WITH LANDSCAPE LOCK) ===
//   const toggleFullScreen = async () => {
//     if (!containerRef.current) return;

//     try {
//       if (!document.fullscreenElement) {
//         // 1. Enter Fullscreen (with vendor prefixes)
//         const el: any = containerRef.current;
//         if (el.requestFullscreen) {
//           await el.requestFullscreen();
//         } else if (el.webkitRequestFullscreen) {
//           await el.webkitRequestFullscreen();
//         } else if (el.msRequestFullscreen) {
//           await el.msRequestFullscreen();
//         } else if (el.mozRequestFullScreen) {
//           await el.mozRequestFullScreen();
//         }
        
//         // 2. Force Landscape (Mobile par screen teda karne k liye)
//         // @ts-ignore (Typescript kabhi kabhi screen.orientation ko nahi maanta)
//         if (screen.orientation && screen.orientation.lock) {
//           try {
//             // @ts-ignore
//             await screen.orientation.lock("landscape");
//           } catch (err) {
//             // Agar browser support na kare (jaise Desktop ya iPhone), to ignore karo
//             console.log("Landscape lock not supported on this device");
//           }
//         } else {
//           // iOS Safari ke liye hint dikhao (orientation lock supported nahi hota)
//           setShowRotateHint(true);
//         }
//       } else {
//         // 3. Exit Fullscreen
//         if (document.exitFullscreen) {
//           await document.exitFullscreen();
//         } else if ((document as any).webkitExitFullscreen) {
//           await (document as any).webkitExitFullscreen();
//         } else if ((document as any).msExitFullscreen) {
//           await (document as any).msExitFullscreen();
//         }
        
//         // 4. Wapas Portrait (Seedha) karo
//         // @ts-ignore
//         if (screen.orientation && screen.orientation.unlock) {
//            // @ts-ignore
//            screen.orientation.unlock();
//         }
//         setShowRotateHint(false);
//       }
//     } catch (err) {
//       console.error("Fullscreen error:", err);
//     }
//   };

//   useEffect(() => {
//     const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
//     document.addEventListener('fullscreenchange', handleChange);
//     return () => document.removeEventListener('fullscreenchange', handleChange);
//   }, []);

//   // Track orientation changes for hint visibility
//   useEffect(() => {
//     const checkOrientation = () => {
//       const landscape = window.matchMedia('(orientation: landscape)').matches || (window.innerWidth > window.innerHeight);
//       setIsLandscape(landscape);
//       if (landscape) setShowRotateHint(false);
//     };
//     checkOrientation();
//     window.addEventListener('orientationchange', checkOrientation);
//     window.addEventListener('resize', checkOrientation);
//     return () => {
//       window.removeEventListener('orientationchange', checkOrientation);
//       window.removeEventListener('resize', checkOrientation);
//     };
//   }, []);

//   // Detect iOS Safari to manage expectations
//   useEffect(() => {
//     const ua = navigator.userAgent;
//     const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
//     const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
//     setIsIosSafari(isIOS && isSafari);
//   }, []);

//   return (
//     <div className="w-full max-w-6xl mx-auto my-6 animate-in fade-in zoom-in duration-500">
//       <div 
//         ref={containerRef} 
//         className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group"
//       >
//         {/* === SHIELDS === */}
//         {/* <div className="absolute top-0 left-0 w-[100%] h-[18%] md:h-[10%] z-50 bg-red-500" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} /> */}
        
//         {/* UPDATED TOP SHIELD: Covers full width to block top-left 'VK Video' link */}
//         <div
//           className="
//             absolute top-0 
//             right-0
//             w-[80%] 
//             h-[18%] md:h-[10%] 
//             z-50 bg-transparent
//           "
//           onClick={(e) => {
//             e.preventDefault();
//             e.stopPropagation();
//           }}
//           onContextMenu={(e) => e.preventDefault()}
//         />

//         <div className="absolute top-0 right-0 w-[15%] h-[20%] z-50 bg-transparent" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />
        
//         <div className="absolute bottom-0 right-0 z-50 bg-transparent
//           w-[6%] h-[15%] md:w-[6%] h-[10%] 
//         " onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />

//         {/* === CUSTOM CONTROLS (Updated Button) === */}
//         <button
//           onClick={toggleFullScreen}
//           // Maine 'opacity-0' hata diya hai jaisa aapne chaha, ab button hamesha dikhega (lekin dim hoga)
//           className="absolute  bottom-4 right-8 z-[60] p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm"
//           title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
//         >
//           {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
//         </button>

//         {/* === ROTATE HINT (iOS/unsupported orientation lock) === */}
//         {/* {isFullscreen && !isLandscape && showRotateHint && (
//           <div className="absolute inset-x-0 bottom-16 mx-auto w-max max-w-[90%] z-[60] px-3 py-2 rounded-md bg-black/70 text-white text-xs sm:text-sm shadow-md">
//             Rotate your phone  ko landscape me ghumaye better fullscreen ke liye.
//           </div>
//         )} */}

//         {/* === IFRAME PLAYER & NEW LOADING ANIMATION === */}
//         {!isLoaded && (
//           <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-[#000000] overflow-hidden">
//             {/* Background Glow Effect */}
//             <div className="absolute w-64 h-64 bg-red-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
            
//             <div className="relative flex flex-col items-center gap-6 z-10">
//               {/* Spinner Container */}
//               <div className="relative">
//                 {/* Outer Ring */}
//                 <div className="w-16 h-16 rounded-full border-[3px] border-red-900/30 animate-[spin_3s_linear_infinite]"></div>
//                 {/* Middle Ring */}
//                 <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-[3px] border-t-red-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
//                 {/* Inner Dot */}
//                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
//               </div>
              
//               {/* Text Animation */}
//               <div className="flex flex-col items-center gap-1">
//                 <span className="text-white font-bold tracking-[0.2em] text-sm animate-pulse">
//                   ESTABLISHING CONNECTION
//                 </span>
//                 <span className="text-xs text-red-500/70 font-mono tracking-widest">
//                   BUFFERING STREAM...
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         <iframe
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           allow="autoplay; encrypted-media; picture-in-picture; screen-wake-lock"
//           // allowFullScreen
//           onLoad={() => setIsLoaded(true)}
//         />
//       </div>
//     </div>
//   );
// };

// export default OkRuPlayer;








// ========= correct bas srf top left mei clickable option hai ===================

// 'use client';

// import React, { useRef, useState, useEffect, useMemo } from 'react';
// import { Maximize, Minimize, Loader2 } from 'lucide-react'; 

// interface OkRuPlayerProps {
//   videoId: string;
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [isLandscape, setIsLandscape] = useState<boolean>(false);
//   const [showRotateHint, setShowRotateHint] = useState<boolean>(false);
//   const [isIosSafari, setIsIosSafari] = useState<boolean>(false);

//   // Smart ID Extractor
//   const cleanVideoId = useMemo(() => {
//     if (!videoId) return '';
//     const iframeMatch = videoId.match(/videoembed\/(\d+)/);
//     if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
//     const urlMatch = videoId.match(/ok\.ru\/video\/(\d+)/);
//     if (urlMatch && urlMatch[1]) return urlMatch[1];
//     return videoId;
//   }, [videoId]);

//   const embedUrl = `https://ok.ru/videoembed/${cleanVideoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   useEffect(() => { setIsLoaded(false); }, [cleanVideoId]);

//   // === UPDATED FULLSCREEN LOGIC (WITH LANDSCAPE LOCK) ===
//   const toggleFullScreen = async () => {
//     if (!containerRef.current) return;

//     try {
//       if (!document.fullscreenElement) {
//         // 1. Enter Fullscreen (with vendor prefixes)
//         const el: any = containerRef.current;
//         if (el.requestFullscreen) {
//           await el.requestFullscreen();
//         } else if (el.webkitRequestFullscreen) {
//           await el.webkitRequestFullscreen();
//         } else if (el.msRequestFullscreen) {
//           await el.msRequestFullscreen();
//         } else if (el.mozRequestFullScreen) {
//           await el.mozRequestFullScreen();
//         }
        
//         // 2. Force Landscape (Mobile par screen teda karne k liye)
//         // @ts-ignore (Typescript kabhi kabhi screen.orientation ko nahi maanta)
//         if (screen.orientation && screen.orientation.lock) {
//           try {
//             // @ts-ignore
//             await screen.orientation.lock("landscape");
//           } catch (err) {
//             // Agar browser support na kare (jaise Desktop ya iPhone), to ignore karo
//             console.log("Landscape lock not supported on this device");
//           }
//         } else {
//           // iOS Safari ke liye hint dikhao (orientation lock supported nahi hota)
//           setShowRotateHint(true);
//         }
//       } else {
//         // 3. Exit Fullscreen
//         if (document.exitFullscreen) {
//           await document.exitFullscreen();
//         } else if ((document as any).webkitExitFullscreen) {
//           await (document as any).webkitExitFullscreen();
//         } else if ((document as any).msExitFullscreen) {
//           await (document as any).msExitFullscreen();
//         }
        
//         // 4. Wapas Portrait (Seedha) karo
//         // @ts-ignore
//         if (screen.orientation && screen.orientation.unlock) {
//            // @ts-ignore
//            screen.orientation.unlock();
//         }
//         setShowRotateHint(false);
//       }
//     } catch (err) {
//       console.error("Fullscreen error:", err);
//     }
//   };

//   useEffect(() => {
//     const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
//     document.addEventListener('fullscreenchange', handleChange);
//     return () => document.removeEventListener('fullscreenchange', handleChange);
//   }, []);

//   // Track orientation changes for hint visibility
//   useEffect(() => {
//     const checkOrientation = () => {
//       const landscape = window.matchMedia('(orientation: landscape)').matches || (window.innerWidth > window.innerHeight);
//       setIsLandscape(landscape);
//       if (landscape) setShowRotateHint(false);
//     };
//     checkOrientation();
//     window.addEventListener('orientationchange', checkOrientation);
//     window.addEventListener('resize', checkOrientation);
//     return () => {
//       window.removeEventListener('orientationchange', checkOrientation);
//       window.removeEventListener('resize', checkOrientation);
//     };
//   }, []);

//   // Detect iOS Safari to manage expectations
//   useEffect(() => {
//     const ua = navigator.userAgent;
//     const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
//     const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
//     setIsIosSafari(isIOS && isSafari);
//   }, []);

//   return (
//     <div className="w-full max-w-6xl mx-auto my-6 animate-in fade-in zoom-in duration-500">
//       <div 
//         ref={containerRef} 
//         className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group"
//       >
//         {/* === SHIELDS === */}
//         {/* <div className="absolute top-0 left-0 w-[100%] h-[18%] md:h-[10%] z-50 bg-red-500" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} /> */}
//         <div
//           className="
//             absolute top-0 
//             right-0 
//             w-[80%] 
//             md:w-[100%] 
//             h-[18%] md:h-[10%] 
//             z-50 bg-red-500
//           "
//           onClick={(e) => {
//             e.preventDefault();
//             e.stopPropagation();
//           }}
//           onContextMenu={(e) => e.preventDefault()}
//         />

//         <div className="absolute top-0 right-0 w-[15%] h-[20%] z-50 bg-transparent" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />
//         {/* <div className="absolute bottom-0 right-0 z-50 bg-red-600

//     w-[5%] h-[5%]

//     [@media(min-width:300px)]:w-[27%]
//     [@media(min-width:300px)]:h-[15%]

//     [@media(min-width:380px)]:w-[23%]
//     [@media(min-width:500px)]:h-[17%]

//     [@media(min-width:458px)]:w-[20%]
//     [@media(min-width:700px)]:h-[20%]

//     [@media(min-width:523px)]:w-[16%]
//     [@media(min-width:900px)]:h-[22%]

//     [@media(min-width:672px)]:w-[13%]
//     [@media(min-width:1100px)]:h-[25%]

//     [@media(min-width:820px)]:w-[8.5%]
//     [@media(min-width:1300px)]:h-[28%]

//     [@media(min-width:1020px)]:w-[4%] 

        
        
        
//         " onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} /> */}

//                 <div className="absolute bottom-0 right-0 z-50 bg-transparent

//     w-[6%] h-[15%] md:w-[6%] h-[10%] 
        
        
//         " onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />

//         {/* === CUSTOM CONTROLS (Updated Button) === */}
//         <button
//           onClick={toggleFullScreen}
//           // Maine 'opacity-0' hata diya hai jaisa aapne chaha, ab button hamesha dikhega (lekin dim hoga)
//           className="absolute  bottom-4 right-8 z-[60] p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm"
//           title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
//         >
//           {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
//         </button>

//         {/* === ROTATE HINT (iOS/unsupported orientation lock) === */}
//         {/* {isFullscreen && !isLandscape && showRotateHint && (
//           <div className="absolute inset-x-0 bottom-16 mx-auto w-max max-w-[90%] z-[60] px-3 py-2 rounded-md bg-black/70 text-white text-xs sm:text-sm shadow-md">
//             Rotate your phone  ko landscape me ghumaye better fullscreen ke liye.
//           </div>
//         )} */}

//         {/* === IFRAME PLAYER & NEW LOADING ANIMATION === */}
//         {!isLoaded && (
//           <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-[#000000] overflow-hidden">
//             {/* Background Glow Effect */}
//             <div className="absolute w-64 h-64 bg-red-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
            
//             <div className="relative flex flex-col items-center gap-6 z-10">
//               {/* Spinner Container */}
//               <div className="relative">
//                 {/* Outer Ring */}
//                 <div className="w-16 h-16 rounded-full border-[3px] border-red-900/30 animate-[spin_3s_linear_infinite]"></div>
//                 {/* Middle Ring */}
//                 <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-[3px] border-t-red-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
//                 {/* Inner Dot */}
//                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
//               </div>
              
//               {/* Text Animation */}
//               <div className="flex flex-col items-center gap-1">
//                 <span className="text-white font-bold tracking-[0.2em] text-sm animate-pulse">
//                   ESTABLISHING CONNECTION
//                 </span>
//                 <span className="text-xs text-red-500/70 font-mono tracking-widest">
//                   BUFFERING STREAM...
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         <iframe
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           allow="autoplay; encrypted-media; picture-in-picture; screen-wake-lock"
//           // allowFullScreen
//           onLoad={() => setIsLoaded(true)}
//         />
//       </div>
//     </div>
//   );
// };

// export default OkRuPlayer;




// =============== correct complete with smart id extractor ===========================

// 'use client';

// import React, { useRef, useState, useEffect, useMemo } from 'react';
// import { Maximize, Minimize, Loader2 } from 'lucide-react'; 

// interface OkRuPlayerProps {
//   videoId: string;
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [isLandscape, setIsLandscape] = useState<boolean>(false);
//   const [showRotateHint, setShowRotateHint] = useState<boolean>(false);
//   const [isIosSafari, setIsIosSafari] = useState<boolean>(false);

//   // Smart ID Extractor
//   const cleanVideoId = useMemo(() => {
//     if (!videoId) return '';
//     const iframeMatch = videoId.match(/videoembed\/(\d+)/);
//     if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
//     const urlMatch = videoId.match(/ok\.ru\/video\/(\d+)/);
//     if (urlMatch && urlMatch[1]) return urlMatch[1];
//     return videoId;
//   }, [videoId]);

//   const embedUrl = `https://ok.ru/videoembed/${cleanVideoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   useEffect(() => { setIsLoaded(false); }, [cleanVideoId]);

//   // === UPDATED FULLSCREEN LOGIC (WITH LANDSCAPE LOCK) ===
//   const toggleFullScreen = async () => {
//     if (!containerRef.current) return;

//     try {
//       if (!document.fullscreenElement) {
//         // 1. Enter Fullscreen (with vendor prefixes)
//         const el: any = containerRef.current;
//         if (el.requestFullscreen) {
//           await el.requestFullscreen();
//         } else if (el.webkitRequestFullscreen) {
//           await el.webkitRequestFullscreen();
//         } else if (el.msRequestFullscreen) {
//           await el.msRequestFullscreen();
//         } else if (el.mozRequestFullScreen) {
//           await el.mozRequestFullScreen();
//         }
        
//         // 2. Force Landscape (Mobile par screen teda karne k liye)
//         // @ts-ignore (Typescript kabhi kabhi screen.orientation ko nahi maanta)
//         if (screen.orientation && screen.orientation.lock) {
//           try {
//             // @ts-ignore
//             await screen.orientation.lock("landscape");
//           } catch (err) {
//             // Agar browser support na kare (jaise Desktop ya iPhone), to ignore karo
//             console.log("Landscape lock not supported on this device");
//           }
//         } else {
//           // iOS Safari ke liye hint dikhao (orientation lock supported nahi hota)
//           setShowRotateHint(true);
//         }
//       } else {
//         // 3. Exit Fullscreen
//         if (document.exitFullscreen) {
//           await document.exitFullscreen();
//         } else if ((document as any).webkitExitFullscreen) {
//           await (document as any).webkitExitFullscreen();
//         } else if ((document as any).msExitFullscreen) {
//           await (document as any).msExitFullscreen();
//         }
        
//         // 4. Wapas Portrait (Seedha) karo
//         // @ts-ignore
//         if (screen.orientation && screen.orientation.unlock) {
//            // @ts-ignore
//            screen.orientation.unlock();
//         }
//         setShowRotateHint(false);
//       }
//     } catch (err) {
//       console.error("Fullscreen error:", err);
//     }
//   };

//   useEffect(() => {
//     const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
//     document.addEventListener('fullscreenchange', handleChange);
//     return () => document.removeEventListener('fullscreenchange', handleChange);
//   }, []);

//   // Track orientation changes for hint visibility
//   useEffect(() => {
//     const checkOrientation = () => {
//       const landscape = window.matchMedia('(orientation: landscape)').matches || (window.innerWidth > window.innerHeight);
//       setIsLandscape(landscape);
//       if (landscape) setShowRotateHint(false);
//     };
//     checkOrientation();
//     window.addEventListener('orientationchange', checkOrientation);
//     window.addEventListener('resize', checkOrientation);
//     return () => {
//       window.removeEventListener('orientationchange', checkOrientation);
//       window.removeEventListener('resize', checkOrientation);
//     };
//   }, []);

//   // Detect iOS Safari to manage expectations
//   useEffect(() => {
//     const ua = navigator.userAgent;
//     const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
//     const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
//     setIsIosSafari(isIOS && isSafari);
//   }, []);

//   return (
//     <div className="w-full max-w-6xl mx-auto my-6 animate-in fade-in zoom-in duration-500">
//       <div 
//         ref={containerRef} 
//         className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group"
//       >
//         {/* === SHIELDS === */}
//         {/* <div className="absolute top-0 left-0 w-[100%] h-[18%] md:h-[10%] z-50 bg-red-500" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} /> */}
//         <div
//   className="
//     absolute top-0 
//     right-0 
//     w-[80%] 
//     md:w-[100%] 
//     h-[18%] md:h-[10%] 
//     z-50 bg-transparent
//   "
//   onClick={(e) => {
//     e.preventDefault();
//     e.stopPropagation();
//   }}
//   onContextMenu={(e) => e.preventDefault()}
// />

//         <div className="absolute top-0 right-0 w-[15%] h-[20%] z-50 bg-transparent" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />
//         {/* <div className="absolute bottom-0 right-0 z-50 bg-red-600

//     w-[5%] h-[5%]

//     [@media(min-width:300px)]:w-[27%]
//     [@media(min-width:300px)]:h-[15%]

//     [@media(min-width:380px)]:w-[23%]
//     [@media(min-width:500px)]:h-[17%]

//     [@media(min-width:458px)]:w-[20%]
//     [@media(min-width:700px)]:h-[20%]

//     [@media(min-width:523px)]:w-[16%]
//     [@media(min-width:900px)]:h-[22%]

//     [@media(min-width:672px)]:w-[13%]
//     [@media(min-width:1100px)]:h-[25%]

//     [@media(min-width:820px)]:w-[8.5%]
//     [@media(min-width:1300px)]:h-[28%]

//     [@media(min-width:1020px)]:w-[4%] 

        
        
//         " onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} /> */}

//                 <div className="absolute bottom-0 right-0 z-50 bg-transparent

//     w-[6%] h-[15%] md:w-[6%] h-[10%] 
        
        
//         " onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />

//         {/* === CUSTOM CONTROLS (Updated Button) === */}
//         <button
//           onClick={toggleFullScreen}
//           // Maine 'opacity-0' hata diya hai jaisa aapne chaha, ab button hamesha dikhega (lekin dim hoga)
//           className="absolute  bottom-4 right-8 z-[60] p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm"
//           title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
//         >
//           {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
//         </button>

//         {/* === ROTATE HINT (iOS/unsupported orientation lock) === */}
//         {/* {isFullscreen && !isLandscape && showRotateHint && (
//           <div className="absolute inset-x-0 bottom-16 mx-auto w-max max-w-[90%] z-[60] px-3 py-2 rounded-md bg-black/70 text-white text-xs sm:text-sm shadow-md">
//             Rotate your phone  ko landscape me ghumaye better fullscreen ke liye.
//           </div>
//         )} */}

//         {/* === IFRAME PLAYER === */}
//         {!isLoaded && (
//           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0 bg-[#0f0f0f]">
//             <Loader2 className="w-10 h-10 animate-spin mb-2 text-red-600" />
//             <span className="text-sm font-medium">Loading Stream...</span>
//           </div>
//         )}

//         <iframe
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           allow="autoplay; encrypted-media; picture-in-picture; screen-wake-lock"
//           // allowFullScreen
//           onLoad={() => setIsLoaded(true)}
//         />
//       </div>
//     </div>
//   );
// };

// export default OkRuPlayer;














































// 'use client';

// import React, { useRef, useState, useEffect, useMemo } from 'react';
// import { Maximize, Minimize, Loader2 } from 'lucide-react'; 

// interface OkRuPlayerProps {
//   videoId: string; // Yeh ID, URL, ya Iframe code ho sakta hai
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);

//   // === SMART ID EXTRACTOR ===
//   // Yeh function check karega ke user ne kya paste kiya hai aur usme se asli ID nikalega
//   const cleanVideoId = useMemo(() => {
//     if (!videoId) return '';
    
//     // 1. Agar user ne poora Iframe code paste kiya hai
//     // Example: <iframe src="//ok.ru/videoembed/123456789"...>
//     const iframeMatch = videoId.match(/videoembed\/(\d+)/);
//     if (iframeMatch && iframeMatch[1]) {
//       return iframeMatch[1];
//     }

//     // 2. Agar user ne poora URL paste kiya hai
//     // Example: https://ok.ru/video/123456789
//     const urlMatch = videoId.match(/ok\.ru\/video\/(\d+)/);
//     if (urlMatch && urlMatch[1]) {
//       return urlMatch[1];
//     }

//     // 3. Agar user ne sirf numbers paste kiye hain (Sahi tareeqa)
//     return videoId;
//   }, [videoId]);

//   const embedUrl = `https://ok.ru/videoembed/${cleanVideoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   // Reset loader when video changes
//   useEffect(() => {
//     setIsLoaded(false);
//   }, [cleanVideoId]);

//   // Fullscreen Logic
//   const toggleFullScreen = () => {
//     if (!containerRef.current) return;
//     if (!document.fullscreenElement) {
//       containerRef.current.requestFullscreen().catch((err) => console.error(err));
//     } else {
//       document.exitFullscreen();
//     }
//   };

//   useEffect(() => {
//     const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
//     document.addEventListener('fullscreenchange', handleChange);
//     return () => document.removeEventListener('fullscreenchange', handleChange);
//   }, []);

//   return (
//     <div className="w-full max-w-6xl mx-auto my-6 animate-in fade-in zoom-in duration-500">
//       <div 
//         ref={containerRef} 
//         className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group"
//       >
//         {/* === SHIELDS (Popups/Redirects rokne ke liye) === */}
//         <div className="absolute top-0 left-0 w-[100%] h-[18%] md:h-[10%] z-50 bg-transparent" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />
//         <div className="absolute top-0 right-0 w-[15%] h-[20%] z-50 bg-transparent" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />
//         {/* <div className="absolute bottom-0 right-0 w-[17%] h-[20%] z-50 bg-green-500" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} /> */}
//         <div className=" absolute bottom-0 right-0 z-50 bg-transparent

//     w-[36%] h-[29%]   /* default */

//     [@media(min-width:300px)]:w-[27%]
//     [@media(min-width:300px)]:h-[15%]

//     [@media(min-width:380px)]:w-[23%]
//     [@media(min-width:500px)]:h-[17%]

//     [@media(min-width:458px)]:w-[20%]
//     [@media(min-width:700px)]:h-[20%]

//     [@media(min-width:523px)]:w-[16%]
//     [@media(min-width:900px)]:h-[22%]

//     [@media(min-width:672px)]:w-[13%]
//     [@media(min-width:1100px)]:h-[25%]

//     [@media(min-width:820px)]:w-[8%]
//     [@media(min-width:1300px)]:h-[28%]

//     [@media(min-width:1020px)]:w-[4%]

// " onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />


//         {/* === CUSTOM CONTROLS === */}
//         <button
//           onClick={toggleFullScreen}
//           // className="absolute bottom-4 right-4 z-[60] p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm"
//           className="absolute bottom-4 right-4 z-[60] p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg  group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm"

//           title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
//         >
//           {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
//         </button>

//         {/* === IFRAME PLAYER === */}
//         {!isLoaded && (
//           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0 bg-[#0f0f0f]">
//             <Loader2 className="w-10 h-10 animate-spin mb-2 text-red-600" />
//             <span className="text-sm font-medium">Loading Stream...</span>
//           </div>
//         )}

//         <iframe
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           // Updated allow attribute to fix wake-lock error
//           allow="autoplay; encrypted-media; picture-in-picture; screen-wake-lock"
//           onLoad={() => setIsLoaded(true)}
//         />
//       </div>
//     </div>
//   );
// };

// export default OkRuPlayer;
















// ============ correct complete with smart id extractor ===========================

// 'use client';

// import React, { useRef, useState, useEffect, useMemo } from 'react';
// import { Maximize, Minimize, Loader2 } from 'lucide-react'; 

// interface OkRuPlayerProps {
//   videoId: string; // Yeh ID, URL, ya Iframe code ho sakta hai
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);

//   // === SMART ID EXTRACTOR ===
//   // Yeh function check karega ke user ne kya paste kiya hai aur usme se asli ID nikalega
//   const cleanVideoId = useMemo(() => {
//     if (!videoId) return '';
    
//     // 1. Agar user ne poora Iframe code paste kiya hai
//     // Example: <iframe src="//ok.ru/videoembed/123456789"...>
//     const iframeMatch = videoId.match(/videoembed\/(\d+)/);
//     if (iframeMatch && iframeMatch[1]) {
//       return iframeMatch[1];
//     }

//     // 2. Agar user ne poora URL paste kiya hai
//     // Example: https://ok.ru/video/123456789
//     const urlMatch = videoId.match(/ok\.ru\/video\/(\d+)/);
//     if (urlMatch && urlMatch[1]) {
//       return urlMatch[1];
//     }

//     // 3. Agar user ne sirf numbers paste kiye hain (Sahi tareeqa)
//     return videoId;
//   }, [videoId]);

//   const embedUrl = `https://ok.ru/videoembed/${cleanVideoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   // Reset loader when video changes
//   useEffect(() => {
//     setIsLoaded(false);
//   }, [cleanVideoId]);

//   // Fullscreen Logic
//   const toggleFullScreen = () => {
//     if (!containerRef.current) return;
//     if (!document.fullscreenElement) {
//       containerRef.current.requestFullscreen().catch((err) => console.error(err));
//     } else {
//       document.exitFullscreen();
//     }
//   };

//   useEffect(() => {
//     const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
//     document.addEventListener('fullscreenchange', handleChange);
//     return () => document.removeEventListener('fullscreenchange', handleChange);
//   }, []);

//   return (
//     <div className="w-full max-w-6xl mx-auto my-6 animate-in fade-in zoom-in duration-500">
//       <div 
//         ref={containerRef} 
//         className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group"
//       >
//         {/* === SHIELDS (Popups/Redirects rokne ke liye) === */}
//         <div className="absolute top-0 left-0 w-[50%] h-[10%] z-50 bg-transparent" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />
//         <div className="absolute top-0 right-0 w-[15%] h-[20%] z-50 bg-transparent" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />
//         <div className="absolute bottom-0 right-0 w-[12%] h-[15%] z-50 bg-transparent" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} onContextMenu={(e) => e.preventDefault()} />

//         {/* === CUSTOM CONTROLS === */}
//         <button
//           onClick={toggleFullScreen}
//           className="absolute bottom-4 right-4 z-[60] p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm"
//           title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
//         >
//           {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
//         </button>

//         {/* === IFRAME PLAYER === */}
//         {!isLoaded && (
//           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0 bg-[#0f0f0f]">
//             <Loader2 className="w-10 h-10 animate-spin mb-2 text-red-600" />
//             <span className="text-sm font-medium">Loading Stream...</span>
//           </div>
//         )}

//         <iframe
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           allow="autoplay; encrypted-media; picture-in-picture"
//           onLoad={() => setIsLoaded(true)}
//         />
//       </div>
//     </div>
//   );
// };

// export default OkRuPlayer;





// ==================== very very well ok 120% correct ===============================================

// 'use client';
// import React, { useRef, useState } from 'react';
// import { Maximize } from 'lucide-react'; // Icon import karein (npm install lucide-react)

// interface OkRuPlayerProps {
//   videoId: string;
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null); // Poore container ka ref
//   const [isLoaded, setIsLoaded] = useState(false);

//   const embedUrl = `https://ok.ru/videoembed/${videoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   // === Function: Container ko Full Screen karne ke liye ===
//   const toggleFullScreen = () => {
//     if (!containerRef.current) return;

//     if (!document.fullscreenElement) {
//       // Full screen enter karein
//       containerRef.current.requestFullscreen().catch((err) => {
//         console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
//       });
//     } else {
//       // Full screen exit karein
//       document.exitFullscreen();
//     }
//   };

//   return (
//     <div className="w-full max-w-4xl mx-auto my-4">
      
//       {/* Container Ref yahan lagaya hai */}
//       <div 
//         ref={containerRef} 
//         className="relative w-full aspect-[16/9] bg-black rounded-lg overflow-hidden shadow-lg border border-gray-800 group"
//       >
        
//         {/* =======================================================
//             PIRATE SHIELDS (Overlays)
//             Z-Index 50 rakha hai taake sabse uppar rahein
//            ======================================================= */}
        
//         {/* 1. Top Left (Logo) */}
//         <div 
//         //   className="absolute top-0 left-0 w-[50%] h-[10%] z-50 bg-red-500"
//           className="absolute top-0 left-0 w-[50%] h-[10%] z-50 bg-transparent"

//           onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
//           onContextMenu={(e) => e.preventDefault()} 
//         />

//         {/* 2. Top Right (Share/Menu) */}
//         <div 
//           className="absolute top-0 right-0 w-[15%] h-[20%] z-50 bg-transparent"
//           onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
//           onContextMenu={(e) => e.preventDefault()}
//         />

//         {/* 3. Bottom Right (Native Fullscreen Block) 
//             Yeh zaroori hai! Taake user asli button na dabaye.
//             Location: Bottom 0, Right 0. Size chota rakha hai.
//         */}
//         <div 
//           className="absolute bottom-0 right-0 w-[10%] h-[15%] z-50 bg-transparent"
//           onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
//           onContextMenu={(e) => e.preventDefault()}
//         />

        
//         {/* =======================================================
//             CUSTOM CONTROLS (Humara apna Full Screen Button)
//            ======================================================= */}
//         <button
//           onClick={toggleFullScreen}
//           className="absolute bottom-4 right-4 z-[60] p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"
//           title="Fullscreen"
//         >
//           <Maximize size={20} />
//         </button>


//         {/* =======================================================
//             MAIN PLAYER
//            ======================================================= */}
//         {!isLoaded && (
//           <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0">
//             <span>Loading Player...</span>
//           </div>
//         )}

//         <iframe
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           allow="autoplay; encrypted-media; picture-in-picture"
//           // Note: Maine yahan se 'fullscreen' allow hata diya hai (optional)
//           // lekin browser policies ki wajah se iframe abhi bhi try karega.
//           onLoad={() => setIsLoaded(true)}
//           loading="lazy"
//         />
//       </div>
      
//       {/* Help Text */}
//       <p className="text-xs text-gray-500 mt-2 text-center">
//         Use the red button for fullscreen to avoid ads/redirects.
//       </p>
//     </div>
//   );
// };

// export default OkRuPlayer;

















































































// // components/OkRuPlayer.tsx
// 'use client';
// import React, { useRef, useState } from 'react';

// interface OkRuPlayerProps {
//   videoId: string;
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const [isLoaded, setIsLoaded] = useState(false);

//   const embedUrl = `https://ok.ru/videoembed/${videoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   return (
//     <div className="w-full max-w-4xl mx-auto my-4">
//       {/* Container: 'relative' hona zaroori hai taake blockers iske andar hi rahein */}
//       <div className="relative w-full aspect-[16/9] bg-black rounded-lg overflow-hidden shadow-lg border border-gray-800 group">
        
//         {/* =======================================================
//             RESPONSIVE PIRATE SHIELDS (Percentage Based)
//            ======================================================= */}
        
//         {/* 1. Top Left Blocker (Logo Area) 
//             - Width: 18% of player width
//             - Height: 20% of player height
//         */}
//         <div 
//           className="absolute top-0 left-0 w-[18%] h-[20%] z-100 bg-red-500 cursor-default"
//           onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} 
//           onContextMenu={(e) => e.preventDefault()} // Right click bhi disable
//         ></div>

//         {/* 2. Top Right Blocker (Share/Menu Area) 
//             - Width: 15% (Right side buttons usually take less space)
//             - Height: 20%
//         */}
//         <div 
//           className="absolute top-0 right-0 w-[15%] h-[20%] z-20 bg-transparent cursor-default"
//           onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
//           onContextMenu={(e) => e.preventDefault()}
//         ></div>


//         {/* =======================================================
//             MAIN PLAYER
//            ======================================================= */}
//         {!isLoaded && (
//           <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0">
//             <span>Loading Player...</span>
//           </div>
//         )}

//         <iframe
//           ref={iframeRef}
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           allow="autoplay; fullscreen; picture-in-picture"
//           allowFullScreen
//           onLoad={() => setIsLoaded(true)}
//           loading="lazy"
//         />
//       </div>
//     </div>
//   );
// };

// export default OkRuPlayer;



// // components/OkRuPlayer.tsx
// 'use client';
// import React, { useRef, useState } from 'react';

// interface OkRuPlayerProps {
//   videoId: string;
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const [isLoaded, setIsLoaded] = useState(false);

//   const embedUrl = `https://ok.ru/videoembed/${videoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   return (
//     <div className="w-full max-w-4xl mx-auto my-4">
//       <div className="relative w-full aspect-[16/9] bg-black rounded-lg overflow-hidden shadow-lg border border-gray-800 group">
        
//         {/* =======================================================
//             PIRATE SHIELDS (Yeh wo invisible boxes hain)
//            ======================================================= */}
        
//         {/* 1. Top Left Blocker (Logo chupane ke liye) */}
//         <div 
//           className="absolute top-0 left-0 w-28 h-20 z-20 bg-transparent"
//           onClick={(e) => e.preventDefault()} // Click ko rokne ke liye
//           title="" // Tooltip hide karne ke liye
//         ></div>

//         {/* 2. Top Right Blocker (Menu/Share button chupane ke liye) */}
//         <div 
//           className="absolute top-0 right-0 w-28 h-20 z-20 bg-transparent"
//           onClick={(e) => e.preventDefault()}
//         ></div>

//         {/* Note: Agar aap dekhna chahte hain ke ye boxes kahan hain, 
//             to uppar 'bg-transparent' ko hata kar 'bg-red-500/50' kar dein. */}


//         {/* =======================================================
//             MAIN PLAYER
//            ======================================================= */}
        
//         {!isLoaded && (
//           <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0">
//             <span>Loading Player...</span>
//           </div>
//         )}

//         <iframe
//           ref={iframeRef}
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           allow="autoplay; fullscreen; picture-in-picture"
//           allowFullScreen
//           onLoad={() => setIsLoaded(true)}
//           loading="lazy"
//         />
//       </div>
//     </div>
//   );
// };

// export default OkRuPlayer;




// ============== correct ===========================

// // components/OkRuPlayer.tsx
// 'use client';
// import React, { useRef, useState } from 'react';

// interface OkRuPlayerProps {
//   videoId: string; // Sirf ID pass karni hai (e.g., "11090668161682")
//   title?: string;
//   autoPlay?: boolean;
// }

// const OkRuPlayer: React.FC<OkRuPlayerProps> = ({ 
//   videoId, 
//   title = "OK.ru Video Player",
//   autoPlay = false 
// }) => {
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const [isLoaded, setIsLoaded] = useState(false);

//   // Video URL construct karna parameters ke saath
//   // nochat=1: Chat hide karne ke liye
//   // autoplay: Agar user chahta hai (browser policies apply hongi)
//   const embedUrl = `https://ok.ru/videoembed/${videoId}?nochat=1&autoplay=${autoPlay ? 1 : 0}`;

//   return (
//     <div className="w-full max-w-4xl mx-auto my-4">
//       {/* Container: Aspect Ratio 16:9 maintain karne ke liye.
//         Tailwind class 'aspect-video' best hai, agar nahi hai to custom CSS use karein.
//       */}
//       <div className="relative w-full aspect-[16/9] bg-black rounded-lg overflow-hidden shadow-lg border border-gray-800">
        
//         {/* Loading State (Optional Skeleton) */}
//         {!isLoaded && (
//           <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0">
//             <span>Loading Player...</span>
//           </div>
//         )}

//         <iframe
//           ref={iframeRef}
//           src={embedUrl}
//           title={title}
//           className="absolute top-0 left-0 w-full h-full z-10"
//           frameBorder="0"
//           allow="autoplay; fullscreen; picture-in-picture"
//           allowFullScreen
//           onLoad={() => setIsLoaded(true)}
//           loading="lazy" // Performance boost ke liye
//         />
//       </div>
//     </div>
//   );
// };

// export default OkRuPlayer;