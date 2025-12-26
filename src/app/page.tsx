'use client';

import React, { useState, useEffect } from 'react';
import OkRuPlayer from '@/components/OkRuPlayer';
import { auth, db } from '@/lib/firebase'; // <--- IMPORTS FROM LIB
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Play, Search, Menu, User } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'videos'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vidList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(vidList);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0f0f0f] to-black text-white font-sans">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-gray-800/70 shadow-lg">
        <div className="flex items-center gap-4">
          <Menu className="text-gray-400 cursor-pointer" />
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-pink-500 to-purple-500">MOVIES</span>
            <span className="ml-1">HUB</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[#161616] rounded-full px-4 py-2 w-64 border border-gray-700/70 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-600/30 transition-all">
            <input type="text" placeholder="Search movies, shows..." className="bg-transparent border-none outline-none w-full text-sm text-gray-300 placeholder:text-gray-500" />
            <Search className="text-gray-400" size={18} />
          </div>
          <div className="w-8 h-8 bg-gradient-to-tr from-red-500 to-purple-600 rounded-full flex items-center justify-center shadow-md ring-1 ring-white/10">
            <User className="text-white" size={16} />
          </div>
        </div>
      </nav>

      {/* Hero / Player */}
      <div className="w-full">
        {selectedVideo ? (
           <div className="bg-gradient-to-b from-gray-900 to-[#0f0f0f] pb-8 pt-4">
              <OkRuPlayer videoId={selectedVideo.videoId} title={selectedVideo.title} autoPlay={true} />
              <div className="max-w-6xl mx-auto px-4 mt-4">
                <h1 className="text-3xl font-bold text-white">{selectedVideo.title}</h1>
              </div>
           </div>
        ) : (
          <div className="relative h-[50vh] flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="relative z-10 text-center">
               <h1 className="text-5xl font-extrabold mb-4">Unlimited Cinema</h1>
               <button onClick={() => videos.length > 0 && setSelectedVideo(videos[0])} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto shadow-lg ring-1 ring-white/10 transition-colors">
                 <Play fill="currentColor" /> Watch Now
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-6 border-l-4 border-red-600 pl-4">Trending Now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div key={video.id} onClick={() => { setSelectedVideo(video); window.scrollTo({top:0, behavior:'smooth'}); }}
              className={`group bg-[#161616] rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300 border border-gray-800/70 ring-1 ring-white/5 ${selectedVideo?.id === video.id ? 'ring-2 ring-red-600' : ''}`}
            >
              <div className="aspect-video relative">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Play fill="white" size={30} className="text-red-600"/></div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm truncate group-hover:text-red-500 transition-colors">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}





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