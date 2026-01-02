'use client';

import React, { useState, useEffect } from 'react';
import OkRuPlayer from '@/components/OkRuPlayer';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { 
  Play, Search, Menu, User, Loader2, Home, Flame, 
  Radio, Trophy, MonitorPlay, History, Clock 
} from 'lucide-react';

// --- 🛑 ONE TIME SETUP ---
// Apna npoint API link yahan dalein. Phir kabhi code change nahi karna padega.
// const CONFIG_URL = "https://api.npoint.io/YOUR_ID_HERE";
// ========================================================================

// const CONFIG_URL = "https://api.npoint.io/40fd44c0812006cd57b0";
const CONFIG_URL = "https://api.npoint.io/04bd07a2ee3adf4b1f27";

// =====================================================================================


// Example: "https://api.npoint.io/8d6b7f3a2b1c"

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [highTrafficMode, setHighTrafficMode] = useState(false); // Track Mode
  
  // UI States
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Live Now", "Cricket", "Football", "UFC"];

  // 1. Auth Setup
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (error) { console.error("Auth Error:", error); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 2. MASTER CONTROLLER (The Logic)
  useEffect(() => {
    let unsubscribe = () => {};

    const fetchMasterConfig = async () => {
      try {
        // Step A: Check Remote Config (npoint)
        const res = await fetch(CONFIG_URL, { cache: 'no-store' }); // Fresh data lao
        const config = await res.json();

        if (config.isLive === true) {
          // === HIGH TRAFFIC MODE ON ===
          console.log("High Traffic Mode: ACTIVE");
          setHighTrafficMode(true);
          
          const liveMatch = {
            id: 'live-json',
            title: config.title,
            videoId: config.videoId,
            thumbnail: "https://img.youtube.com/vi/placeholder/hqdefault.jpg",
            live: true
          };
          
          setVideos([liveMatch]); // Sirf Live match dikhao (List clear kardo taake load na pade)
          setSelectedVideo(liveMatch); // Auto play
          setLoading(false);
          
          // Firebase mat chalao (Return here)
          return;
        } 
      } catch (err) {
        console.error("Config fetch failed, defaulting to Firebase", err);
      }

      // === NORMAL MODE (Firebase) ===
      // Agar config.isLive false hai, ya fetch fail hua, to Firebase chalao
      console.log("Normal Mode: Firebase Active");
      setHighTrafficMode(false);

      if (user) {
        const q = query(collection(db, 'videos'));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const vidList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setVideos(vidList);
          setLoading(false);
        });
      }
    };

    fetchMasterConfig();
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-full transition"><Menu className="text-white" /></button>
          <a href="/" className="flex items-center gap-1">
             <div className="bg-red-600 p-1 rounded-lg"><Play fill="white" size={16} className="text-white"/></div>
             <span className="text-xl font-bold tracking-tight">SPORTS<span className="text-red-600">HUB</span></span>
          </a>
        </div>
        
        {/* Status Indicator (Sirf Admin ko dikhega idea ke liye) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-gray-800">
           Server Status: 
           {highTrafficMode ? (
             <span className="text-green-500 animate-pulse">HIGH TRAFFIC (SAFE)</span>
           ) : (
             <span className="text-blue-500">NORMAL</span>
           )}
        </div>

        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"><User className="text-white" size={16} /></div>
        </div>
      </nav>

      <div className="flex pt-16 h-screen">
        {/* SIDEBAR */}
        {/* <aside className={`${isSidebarOpen ? 'w-60' : 'w-20'} hidden md:flex flex-col bg-[#0f0f0f] border-r border-gray-800 overflow-y-auto transition-all duration-300 fixed bottom-0 top-16 left-0 z-40`}>
           <div className="p-3 space-y-1">
              <NavItem icon={<Home size={22}/>} label="Home" active isOpen={isSidebarOpen} />
              <NavItem icon={<Flame size={22}/>} label="Trending" isOpen={isSidebarOpen} />
              <NavItem icon={<Radio size={22} className="text-red-500"/>} label="Live TV" isOpen={isSidebarOpen} />
           </div>
        </aside> */}

        {/* MAIN CONTENT */}
        <main className={`flex-1 overflow-y-auto bg-[#0f0f0f] ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'} transition-all duration-300`}>
           {/* Chips */}
           <div className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-800">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>{cat}</button>
              ))}
           </div>

           <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
              {/* SELECTED PLAYER */}
              {selectedVideo && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                   <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
                      <OkRuPlayer videoId={selectedVideo.videoId} title={selectedVideo.title} autoPlay={true} />
                   </div>
                   <div className="mt-4 px-1">
                      <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        {selectedVideo.title}
                        {selectedVideo.live && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">LIVE NOW</span>}
                      </h1>
                   </div>
                   <div className="my-6 border-b border-gray-800"></div>
                </div>
              )}

              {/* VIDEO GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                 {loading ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />) : videos.map((video) => (
                    <div key={video.id} onClick={() => { setSelectedVideo(video); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group cursor-pointer flex flex-col">
                       <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border border-gray-800 group-hover:border-red-600/50">
                          <img src={video.thumbnail || "https://img.youtube.com/vi/placeholder/hqdefault.jpg"} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                          {video.live && <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE</div>}
                       </div>
                       <div className="flex gap-3 px-1">
                          <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                          <div className="flex flex-col">
                             <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1 group-hover:text-red-500 transition-colors">{video.title}</h3>
                             <p className="text-[#AAAAAA] text-xs hover:text-white transition-colors">SportsHub Official</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, isOpen }: { icon: any, label: string, active?: boolean, isOpen: boolean }) {
  return <div className={`flex items-center gap-5 px-3 py-2.5 rounded-lg cursor-pointer transition ${active ? 'bg-[#272727] font-bold' : 'hover:bg-[#272727]'}`}><div className={`${active ? 'text-white' : 'text-white'}`}>{icon}</div>{isOpen && <span className="text-sm truncate">{label}</span>}</div>;
}

function SkeletonCard() {
  return <div className="flex flex-col gap-3"><div className="aspect-video bg-[#1f1f1f] rounded-xl animate-pulse"></div><div className="flex gap-3"><div className="w-9 h-9 bg-[#1f1f1f] rounded-full animate-pulse"></div><div className="flex flex-col gap-2 w-full"><div className="h-4 bg-[#1f1f1f] rounded w-3/4 animate-pulse"></div><div className="h-3 bg-[#1f1f1f] rounded w-1/2 animate-pulse"></div></div></div></div>;
}





{/* <iframe width="560" height="315" src="//ok.ru/videoembed/11090668161682?nochat=1" frameborder="0" allow="autoplay" allowfullscreen></iframe> */}


// =========== cooreect upper waley mee npont.org k setup kya hai ========================

// 'use client';

// import React, { useState, useEffect } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer';
// import { auth, db } from '@/lib/firebase';
// import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
// import { collection, query, onSnapshot } from 'firebase/firestore'; // Removed orderBy for now to prevent index errors
// import { 
//   Play, Search, Menu, User, Loader2, Home, Flame, 
//   Radio, Trophy, MonitorPlay, History, Clock 
// } from 'lucide-react';

// export default function HomePage() {
//   const [user, setUser] = useState<any>(null);
//   const [videos, setVideos] = useState<any[]>([]);
//   const [selectedVideo, setSelectedVideo] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
  
//   // UI States
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");

//   const categories = ["All", "Live Now", "Cricket", "Football", "UFC", "Highlights", "Classic Matches"];

//   // 1. Auth Setup
//   useEffect(() => {
//     const initAuth = async () => {
//       try { await signInAnonymously(auth); } catch (error) { console.error("Auth Error:", error); }
//     };
//     initAuth();
//     return onAuthStateChanged(auth, setUser);
//   }, []);

//   // 2. Fetch Videos
//   useEffect(() => {
//     if (!user) return;
//     const q = query(collection(db, 'videos'));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const vidList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setVideos(vidList);
//       setLoading(false);
//     });
//     return () => unsubscribe();
//   }, [user]);

//   return (
//     <div className="min-h-screen bg-[#0f0f0f] text-white font-sans">
      
//       {/* --- 1. YOUTUBE STYLE NAVBAR (Fixed Top) --- */}
//       <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-gray-800">
//         <div className="flex items-center gap-4">
//           <button 
//             onClick={() => setSidebarOpen(!isSidebarOpen)}
//             className="p-2 hover:bg-gray-800 rounded-full transition"
//           >
//             <Menu className="text-white" />
//           </button>
//           <a href="/" className="flex items-center gap-1">
//              <div className="bg-red-600 p-1 rounded-lg">
//                 <Play fill="white" size={16} className="text-white"/>
//              </div>
//              <span className="text-xl font-bold tracking-tight">SPORTS<span className="text-red-600">HUB</span></span>
//           </a>
//         </div>
        
//         {/* Search Bar (Center) */}
//         <div className="hidden md:flex flex-1 max-w-2xl mx-10">
//            <div className="flex w-full">
//              <input 
//                type="text" 
//                placeholder="Search match, team or player..." 
//                className="w-full bg-[#121212] border border-gray-700 rounded-l-full px-4 py-2 focus:border-blue-500 outline-none placeholder-gray-500"
//              />
//              <button className="bg-[#222] border border-l-0 border-gray-700 px-5 rounded-r-full hover:bg-gray-700 transition">
//                <Search className="text-gray-400" size={20} />
//              </button>
//            </div>
//         </div>

//         <div className="flex items-center gap-3">
//           <button className="p-2 hover:bg-gray-800 rounded-full md:hidden"><Search size={22}/></button>
//           <button className="hidden md:block p-2 hover:bg-gray-800 rounded-full text-red-500 font-bold text-xs uppercase border border-red-900 bg-red-900/10">Go Live</button>
//           <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white">
//             <User className="text-white" size={16} />
//           </div>
//         </div>
//       </nav>

//       <div className="flex pt-16 h-screen">
        
//         {/* --- 2. SIDEBAR (Collapsible) --- */}
//         {/* <aside className={`${isSidebarOpen ? 'w-60' : 'w-20'} hidden md:flex flex-col bg-[#0f0f0f] border-r border-gray-800 overflow-y-auto transition-all duration-300 fixed bottom-0 top-16 left-0 z-40`}>
//            <div className="p-3 space-y-1">
//               <NavItem icon={<Home size={22}/>} label="Home" active isOpen={isSidebarOpen} />
//               <NavItem icon={<Flame size={22}/>} label="Trending" isOpen={isSidebarOpen} />
//               <NavItem icon={<Radio size={22} className="text-red-500"/>} label="Live TV" isOpen={isSidebarOpen} />
//            </div>
//            <div className="border-t border-gray-800 my-2 mx-3"></div>
//            <div className="p-3 space-y-1">
//               <p className={`text-xs font-bold text-gray-500 mb-2 px-3 ${!isSidebarOpen && 'hidden'}`}>SPORTS</p>
//               <NavItem icon={<Trophy size={22}/>} label="Cricket" isOpen={isSidebarOpen} />
//               <NavItem icon={<MonitorPlay size={22}/>} label="Football" isOpen={isSidebarOpen} />
//               <NavItem icon={<History size={22}/>} label="Highlights" isOpen={isSidebarOpen} />
//            </div>
//         </aside> */}

//         {/* --- 3. MAIN CONTENT --- */}
//         <main className={`flex-1 overflow-y-auto bg-[#0f0f0f] ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'} transition-all duration-300`}>
           
//            {/* Category Chips */}
//            <div className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-800">
//               {categories.map((cat) => (
//                 <button 
//                   key={cat}
//                   onClick={() => setActiveCategory(cat)}
//                   className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition ${
//                     activeCategory === cat 
//                     ? 'bg-white text-black' 
//                     : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'
//                   }`}
//                 >
//                   {cat}
//                 </button>
//               ))}
//            </div>

//            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
              
//               {/* --- SELECTED PLAYER (Theater Mode) --- */}
//               {selectedVideo && (
//                 <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
//                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
//                       <OkRuPlayer videoId={selectedVideo.videoId} title={selectedVideo.title} autoPlay={true} />
//                    </div>
//                    <div className="mt-4 px-1">
//                       <h1 className="text-2xl font-bold text-white mb-2">{selectedVideo.title}</h1>
//                       <div className="flex items-center justify-between text-gray-400 text-sm">
//                          <div className="flex items-center gap-2">
//                             <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0"></div>
//                             <div>
//                                <p className="text-white font-semibold">SportsHub Official</p>
//                                <p className="text-xs">1.2M Subscribers</p>
//                             </div>
//                             <button className="ml-4 bg-white text-black px-4 py-2 rounded-full font-bold text-xs hover:bg-gray-200">Subscribe</button>
//                          </div>
//                          {/* <div className="flex gap-4">
//                             <button className="flex items-center gap-2 bg-[#272727] px-4 py-2 rounded-full hover:bg-[#3f3f3f]"><Trophy size={16}/> Like</button>
//                             <button className="flex items-center gap-2 bg-[#272727] px-4 py-2 rounded-full hover:bg-[#3f3f3f]"><Radio size={16}/> Share</button>
//                          </div> */}
//                       </div>
//                    </div>
//                    <div className="my-6 border-b border-gray-800"></div>
//                 </div>
//               )}

//               {/* --- VIDEO GRID --- */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
//                  {loading ? (
//                     [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
//                  ) : videos.map((video) => (
//                     <div 
//                       key={video.id} 
//                       onClick={() => {
//                         setSelectedVideo(video);
//                         window.scrollTo({ top: 0, behavior: 'smooth' });
//                       }}
//                       className="group cursor-pointer flex flex-col"
//                     >
//                        {/* Thumbnail */}
//                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3 group-hover:rounded-none transition-all duration-300 border border-gray-800 group-hover:border-red-600/50">
//                           <img 
//                             src={video.thumbnail || "https://img.youtube.com/vi/placeholder/hqdefault.jpg"} 
//                             alt={video.title} 
//                             className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
//                             loading="lazy"
//                           />
                          
//                           {/* DYNAMIC LIVE BADGE Logic */}
//                           {video.live && (
//                             <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-bold z-10">
//                                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> LIVE
//                             </div>
//                           )}
                          
//                           {/* Play Overlay */}
//                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
//                              {/* Optional Play Icon on Hover */}
//                           </div>
//                        </div>

//                        {/* Meta Data */}
//                        <div className="flex gap-3 px-1">
//                           {/* Channel Icon */}
//                           <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                          
//                           <div className="flex flex-col">
//                              <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1 group-hover:text-red-500 transition-colors">
//                                {video.title}
//                              </h3>
//                              <p className="text-[#AAAAAA] text-xs hover:text-white transition-colors">
//                                SportsHub Official
//                              </p>
//                              {/* <p className="text-[#AAAAAA] text-xs flex items-center gap-1">
//                                24K views • <Clock size={10} /> 2 hours ago
//                              </p> */}
//                           </div>
//                        </div>
//                     </div>
//                  ))}
//               </div>

//            </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// // --- Helper Components ---

// function NavItem({ icon, label, active = false, isOpen }: { icon: any, label: string, active?: boolean, isOpen: boolean }) {
//   return (
//     <div className={`flex items-center gap-5 px-3 py-2.5 rounded-lg cursor-pointer transition ${active ? 'bg-[#272727] font-bold' : 'hover:bg-[#272727]'}`}>
//        <div className={`${active ? 'text-white' : 'text-white'}`}>{icon}</div>
//        {isOpen && <span className="text-sm truncate">{label}</span>}
//     </div>
//   );
// }

// function SkeletonCard() {
//   return (
//     <div className="flex flex-col gap-3">
//        <div className="aspect-video bg-[#1f1f1f] rounded-xl animate-pulse"></div>
//        <div className="flex gap-3">
//           <div className="w-9 h-9 bg-[#1f1f1f] rounded-full animate-pulse"></div>
//           <div className="flex flex-col gap-2 w-full">
//              <div className="h-4 bg-[#1f1f1f] rounded w-3/4 animate-pulse"></div>
//              <div className="h-3 bg-[#1f1f1f] rounded w-1/2 animate-pulse"></div>
//           </div>
//        </div>
//     </div>
//   )
// }





































































// 'use client';

// import React, { useState, useEffect } from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer';
// import { auth, db } from '@/lib/firebase';
// import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
// import { collection, query, onSnapshot } from 'firebase/firestore';
// import { Play, Search, Menu, User, Zap, Radio, Trophy, Clock } from 'lucide-react';

// export default function HomePage() {
//   const [user, setUser] = useState<any>(null);
//   const [videos, setVideos] = useState<any[]>([]);
//   const [selectedVideo, setSelectedVideo] = useState<any>(null);
//   const [activeCategory, setActiveCategory] = useState('All');

//   const categories = ['All', 'Football', 'Basketball', 'Cricket', 'Tennis', 'MMA'];

//   useEffect(() => {
//     signInAnonymously(auth).catch(console.error);
//     return onAuthStateChanged(auth, setUser);
//   }, []);

//   useEffect(() => {
//     if (!user) return;
//     const q = query(collection(db, 'videos'));
    
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const vidList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setVideos(vidList);
//     });
//     return () => unsubscribe();
//   }, [user]);

//   return (
//     <div className="min-h-screen bg-slate-950 text-white">
//       {/* Clean Sports Navbar */}
//       <nav className="sticky top-0 z-50 bg-black/80 border-b border-white/10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-14">
//             {/* Brand */}
//             <div className="flex items-center gap-3">
//               <button className="lg:hidden p-2 hover:bg-white/10 rounded-md">
//                 <Menu size={22} />
//               </button>
//               <div className="flex items-center gap-2">
//                 <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center">
//                   <Zap className="text-white" size={18} />
//                 </div>
//                 <span className="text-xl font-black tracking-tight">
//                   <span className="text-white">SPORT</span>
//                   <span className="text-emerald-400">CAST</span>
//                 </span>
//               </div>
//             </div>
//             {/* Search & User */}
//             <div className="flex items-center gap-3">
//               <div className="hidden md:flex items-center bg-white/5 rounded-md px-3 py-1.5 border border-white/10 w-64">
//                 <Search className="text-gray-400" size={16} />
//                 <input type="text" placeholder="Search matches" className="bg-transparent outline-none w-full ml-2 text-sm" />
//               </div>
//               <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center">
//                 <User size={16} />
//               </div>
//             </div>
//           </div>
//           {/* Categories */}
//           <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar">
//             {categories.map((cat) => (
//               <button
//                 key={cat}
//                 onClick={() => setActiveCategory(cat)}
//                 className={`px-3 py-1.5 rounded-full text-sm border ${
//                   activeCategory === cat ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/10 bg-white/5 text-gray-300'
//                 }`}
//               >
//                 {cat}
//               </button>
//             ))}
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       {selectedVideo ? (
//         <div className="bg-slate-900 pb-8 pt-6">
//           <div className="max-w-6xl mx-auto px-6">
//             <OkRuPlayer videoId={selectedVideo.videoId} title={selectedVideo.title} autoPlay={true} />
//             <h1 className="text-2xl lg:text-3xl font-bold mt-4">{selectedVideo.title}</h1>
//           </div>
//         </div>
//       ) : (
//         <div className="relative h-[56vh] flex items-center justify-center">
//           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2000')] bg-cover bg-center" />
//           <div className="absolute inset-0 bg-black/70" />
//           <div className="relative z-10 text-center px-4">
//             <h1 className="text-5xl font-black mb-4">Live Sports</h1>
//             <p className="text-gray-300 mb-6">Watch your favorite matches in HD.</p>
//             <button onClick={() => videos.length > 0 && setSelectedVideo(videos[0])} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-md font-bold inline-flex items-center gap-2">
//               <Play size={20} /> Watch Live
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Scrollable Layout: Left content + Right sidebar each with their own scrollbars */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
//         {/* Left: multiple sections (vertical scroll) */}
//         <div className="max-h-[calc(100vh-180px)] overflow-y-auto scrollbar rounded-2xl">
//           {/* Live Matches Grid */}
//           <section className="mb-8">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-3">
//                 <Trophy className="text-emerald-400" size={28} />
//                 <h2 className="text-2xl font-black">
//                   <span className="text-white">Live</span>
//                   <span className="text-emerald-400 ml-2">Matches</span>
//                 </h2>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
//                 <span className="text-sm text-gray-400">{videos.length} Live Now</span>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
//               {videos.map((video, index) => (
//                 <div
//                   key={video.id}
//                   onClick={() => { setSelectedVideo(video); window.scrollTo({top:0, behavior:'smooth'}); }}
//                   className={`group relative bg-white/5 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border ${
//                     selectedVideo?.id === video.id 
//                       ? 'border-emerald-500 scale-[1.01]' 
//                       : 'border-white/10 hover:border-emerald-500/50'
//                   }`}
//                   style={{ animationDelay: `${index * 50}ms` }}
//                 >
//                   <div className="aspect-video relative overflow-hidden">
//                     <img 
//                       src={video.thumbnail} 
//                       alt={video.title}
//                       className="w-full h-full object-cover"
//                     />
//                     <div className="absolute inset-0 bg-black/20"></div>
//                     <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-red-500 rounded-md text-xs font-bold">
//                       <Radio size={12} className="animate-pulse" />
//                       LIVE
//                     </div>
//                     <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded-md text-xs font-semibold flex items-center gap-1">
//                       <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
//                       {Math.floor(Math.random() * 10 + 1)}K
//                     </div>
//                     <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 bg-black/70 rounded-md">
//                       <div className="text-xs font-bold">{Math.floor(Math.random() * 4)}</div>
//                       <div className="text-[10px] text-emerald-400 font-semibold">VS</div>
//                       <div className="text-xs font-bold">{Math.floor(Math.random() * 4)}</div>
//                     </div>
//                   </div>
//                   <div className="p-4">
//                     <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
//                       {video.title}
//                     </h3>
//                     <div className="flex items-center justify-between text-xs text-gray-400">
//                       <span className="flex items-center gap-1">
//                         <Clock size={12} />
//                         {Math.floor(Math.random() * 90)}:00
//                       </span>
//                       <span className="px-2 py-0.5 bg-white/5 text-emerald-400 rounded font-semibold">
//                         ⚽ Football
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </section>

//           {/* Highlights (horizontal scroll) */}
//           <section className="mb-10">
//             <div className="flex items-center justify-between mb-3">
//               <h2 className="text-xl font-black"><span className="text-white">Highlights</span> <span className="text-emerald-400">Today</span></h2>
//               <span className="text-sm text-gray-400">Swipe →</span>
//             </div>
//             <div className="overflow-x-auto scrollbar pb-2">
//               <div className="flex gap-4 min-h-[220px]">
//                 {videos.map((video) => (
//                   <div key={`hl-${video.id}`} className="min-w-[280px] rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors cursor-pointer" onClick={() => { setSelectedVideo(video); window.scrollTo({top:0, behavior:'smooth'}); }}>
//                     <div className="aspect-video relative">
//                       <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
//                       <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs">{video.title?.slice(0, 24)}...</div>
//                     </div>
//                     <div className="p-3 text-xs text-gray-400 flex items-center justify-between">
//                       <span>Replay</span>
//                       <span className="text-emerald-400">HD</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </section>

//           {/* Top Replays (horizontal scroll) */}
//           <section className="mb-10">
//             <div className="flex items-center justify-between mb-3">
//               <h2 className="text-xl font-black"><span className="text-white">Top</span> <span className="text-emerald-400">Replays</span></h2>
//               <span className="text-sm text-gray-400">Swipe →</span>
//             </div>
//             <div className="overflow-x-auto scrollbar pb-2">
//               <div className="flex gap-4 min-h-[220px]">
//                 {videos.map((video) => (
//                   <div key={`rp-${video.id}`} className="min-w-[240px] rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors cursor-pointer" onClick={() => { setSelectedVideo(video); window.scrollTo({top:0, behavior:'smooth'}); }}>
//                     <div className="aspect-video relative">
//                       <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
//                       <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition" />
//                     </div>
//                     <div className="p-3">
//                       <div className="text-sm font-semibold line-clamp-1">{video.title}</div>
//                       <div className="text-[11px] text-gray-400">Full Match</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </section>

//           {/* Upcoming Fixtures (horizontal scroll) */}
//           <section>
//             <div className="flex items-center justify-between mb-3">
//               <h2 className="text-xl font-black"><span className="text-white">Upcoming</span> <span className="text-emerald-400">Fixtures</span></h2>
//               <span className="text-sm text-gray-400">Swipe →</span>
//             </div>
//             <div className="overflow-x-auto scrollbar pb-2">
//               <div className="flex gap-4 min-h-[160px]">
//                 {videos.map((video) => (
//                   <div key={`up-${video.id}`} className="min-w-[220px] rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors cursor-pointer">
//                     <div className="p-3">
//                       <div className="text-sm font-semibold line-clamp-1">{video.title}</div>
//                       <div className="text-[11px] text-gray-400">Tomorrow • 8:30 PM</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </section>
//         </div>

//         {/* Right: sidebar (independent vertical scroll) */}
//         <aside className="max-h-[calc(100vh-180px)] overflow-y-auto scrollbar rounded-2xl bg-white/5 border border-white/10 p-4">
//           <h3 className="text-lg font-black mb-4">Leaderboard</h3>
//           <div className="space-y-3">
//             {videos.slice(0, 20).map((video, i) => (
//               <div key={`lb-${video.id}`} className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2">
//                 <div className="flex items-center gap-3">
//                   <div className="w-6 text-gray-400 font-bold">{i + 1}</div>
//                   <div className="w-10 h-6 rounded bg-white/10 overflow-hidden">
//                     {video.thumbnail && <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />}
//                   </div>
//                   <div className="text-sm line-clamp-1">{video.title}</div>
//                 </div>
//                 <div className="text-xs text-emerald-400 font-semibold">{Math.floor(Math.random() * 10 + 1)}K viewers</div>
//               </div>
//             ))}
//           </div>

//           <h3 className="text-lg font-black mt-6 mb-3">Live Chat (read-only)</h3>
//           <div className="space-y-2">
//             {[...Array(30)].map((_, idx) => (
//               <div key={`msg-${idx}`} className="text-sm text-gray-300 bg-black/40 rounded px-3 py-2">User{idx + 1}: Amazing match! 🔥</div>
//             ))}
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }





// ==================== very very well ok 120% correct ===============================================

// 'use client';

// import React from 'react';
// import OkRuPlayer from '@/components/OkRuPlayer';
// import { Play, ThumbsUp, Share2, Bell, Menu, Search, User } from 'lucide-react';

// export default function MoviePage() {
//   // Example Data
//   const currentVideo = {
//     id: "11090668161682",
//     title: "Action Thriller: The Chase (2024)",
//     views: "1.2M views",
//     uploadDate: "2 days ago",
//     description: "Yeh ek zabardast action movie hai jisme hero apni family ko bachane ke liye ek mission par nikalta hai. Full HD result aur behtareen sound quality."
//   };

//   const relatedVideos = [
//     { id: 1, title: "Cyberpunk Future 2077", views: "540K", time: "12:30", img: "https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?auto=format&fit=crop&w=400&q=80" },
//     { id: 2, title: "Nature's Fury: Documentary", views: "89K", time: "45:00", img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80" },
//     { id: 3, title: "Coding in the Dark", views: "2.1M", time: "08:15", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80" },
//     { id: 4, title: "Space Exploration Live", views: "300K", time: "Live", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80" },
//   ];

//   return (
//     <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-600 selection:text-white">
      
//       {/* 1. Navbar */}
//       <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-gray-800">
//         <div className="flex items-center gap-4">
//           <button className="p-2 hover:bg-gray-800 rounded-full"><Menu size={24} /></button>
//           <span className="text-2xl font-bold text-red-600 tracking-tighter">STREAM<span className="text-white">HUB</span></span>
//         </div>
        
//         <div className="hidden md:flex items-center bg-[#1f1f1f] rounded-full px-4 py-2 w-1/3 border border-gray-700 focus-within:border-red-600 transition-colors">
//           <input type="text" placeholder="Search movies, shows..." className="bg-transparent border-none outline-none w-full text-sm text-gray-300 placeholder-gray-500" />
//           <Search size={18} className="text-gray-400" />
//         </div>

//         <div className="flex items-center gap-4">
//           <button className="p-2 hover:bg-gray-800 rounded-full"><Bell size={24} /></button>
//           <div className="w-8 h-8 bg-gradient-to-tr from-red-500 to-purple-600 rounded-full flex items-center justify-center">
//             <User size={16} />
//           </div>
//         </div>
//       </nav>

//       <main className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
//         {/* LEFT COLUMN: Player & Info (Takes 2 columns space on large screens) */}
//         <div className="lg:col-span-2">
          
//           {/* Video Player Container */}
//           <div className="w-full shadow-2xl shadow-red-900/10 rounded-xl overflow-hidden bg-black mb-4">
//             <OkRuPlayer videoId={currentVideo.id} />
//           </div>

//           {/* Video Metadata */}
//           <h1 className="text-xl md:text-2xl font-bold mt-4 mb-2">{currentVideo.title}</h1>
          
//           <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
//             <p className="text-gray-400 text-sm">{currentVideo.views} • {currentVideo.uploadDate}</p>
            
//             <div className="flex items-center gap-2">
//               <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full text-sm font-medium transition">
//                 <ThumbsUp size={18} /> Like
//               </button>
//               <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full text-sm font-medium transition">
//                 <Share2 size={18} /> Share
//               </button>
//             </div>
//           </div>

//           {/* Description Box */}
//           <div className="mt-4 p-4 bg-[#1f1f1f] rounded-xl hover:bg-[#2a2a2a] transition cursor-pointer">
//             <p className="text-sm font-semibold mb-1">Description</p>
//             <p className="text-sm text-gray-300 leading-relaxed">
//               {currentVideo.description}
//             </p>
//           </div>

//           {/* Comments Section Placeholder */}
//           <div className="mt-8">
//             <h3 className="text-lg font-bold mb-4">Comments <span className="text-gray-500 text-sm font-normal">(124)</span></h3>
//             <div className="flex gap-4">
//               <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0"></div>
//               <input type="text" placeholder="Add a comment..." className="w-full bg-transparent border-b border-gray-700 pb-2 outline-none focus:border-white transition" />
//             </div>
//           </div>
//         </div>

//         {/* RIGHT COLUMN: Up Next / Recommendations */}
//         <div className="lg:col-span-1">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-lg font-bold">Up Next</h2>
//             <span className="text-xs font-bold text-red-500 cursor-pointer uppercase tracking-wider">Autoplay On</span>
//           </div>

//           <div className="flex flex-col gap-3">
//             {relatedVideos.map((video) => (
//               <div key={video.id} className="flex gap-3 group cursor-pointer">
//                 {/* Thumbnail */}
//                 <div className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
//                   <img src={video.img} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
//                   <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
//                     {video.time}
//                   </span>
//                 </div>
//                 {/* Info */}
//                 <div className="flex flex-col justify-center">
//                   <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-red-500 transition-colors">
//                     {video.title}
//                   </h4>
//                   <p className="text-xs text-gray-400 mt-1">StreamHub Channel</p>
//                   <p className="text-xs text-gray-500">{video.views} views</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//       </main>
//     </div>
//   );
// }



































































// import OkRuPlayer from '@/components/OkRuPlayer';

// export default function Home() {
//   // Aapke link se Video ID ye hai: 11090668161682
//   const videoId = "11090668161682"; 

//   return (
//     <main className="min-h-screen p-8 bg-gray-900 text-white">
//       <h1 className="text-3xl font-bold mb-6 text-center">
//         My Streaming Platform
//       </h1>
      
//       {/* Player Component Yahan Hai */}
//       <OkRuPlayer videoId={videoId} title="My Live Stream" />
      
//       <p className="mt-4 text-gray-400 text-center">
//         Powered by OK.ru embed
//       </p>
//     </main>
//   );
// }