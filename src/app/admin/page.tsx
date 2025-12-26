'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, Plus, Video, Loader2, Edit, Radio } from 'lucide-react'; // Added Radio icon import

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [videoId, setVideoId] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isLive, setIsLive] = useState(false); // LIVE State
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoId) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'videos'), {
        title,
        videoId,
        thumbnail: thumbnail || `https://img.youtube.com/vi/placeholder/hqdefault.jpg`,
        live: isLive, // Save Live Status
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setVideoId('');
      setThumbnail('');
      setIsLive(false); // Reset Checkbox
      alert("Video Added!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add video");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this video?")) {
      await deleteDoc(doc(db, 'videos', id));
    }
  };

  if (!user) return <div className="h-screen flex items-center justify-center bg-[#0f0f0f] text-white">Loading Admin...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-red-600 mb-8 flex items-center gap-2">
          <Video /> Admin Dashboard
        </h1>

        {/* Add Form */}
        <div className="bg-[#1f1f1f] p-6 rounded-xl border border-gray-800 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Video</h2>
          <form onSubmit={handleAddVideo} className="space-y-4">
            <input 
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Movie/Match Title" className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none" required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" value={videoId} onChange={(e) => setVideoId(e.target.value)}
                placeholder="OK.ru ID (e.g. 11090668161682)" className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none" required
              />
              <input 
                type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)}
                placeholder="Thumbnail URL (Optional)" className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none"
              />
            </div>
            
            {/* LIVE CHECKBOX */}
            <div className="flex items-center gap-3 bg-[#2a2a2a] p-3 rounded-lg border border-gray-700">
               <input 
                 type="checkbox" 
                 id="isLive"
                 checked={isLive}
                 onChange={(e) => setIsLive(e.target.checked)}
                 className="w-5 h-5 accent-red-600 cursor-pointer"
               />
               <label htmlFor="isLive" className="cursor-pointer font-medium flex items-center gap-2">
                 <Radio size={18} className={isLive ? "text-red-500" : "text-gray-400"} />
                 Is this Video LIVE?
               </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="animate-spin"/> : <><Plus size={20} /> Add to Library</>}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="space-y-3">
          {videos.map((vid) => (
            <div key={vid.id} className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
              <div className="flex items-center gap-4">
                 <div className="relative w-16 h-10">
                   <img src={vid.thumbnail} alt="" className="w-full h-full object-cover rounded bg-gray-700"/>
                   {vid.live && <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse border border-black"></div>}
                 </div>
                 <div>
                   <h3 className="font-bold flex items-center gap-2">
                     {vid.title} 
                     {vid.live && <span className="text-[10px] bg-red-600 px-1 rounded text-white font-bold">LIVE</span>}
                   </h3>
                   <p className="text-xs text-gray-500">{vid.videoId}</p>
                 </div>
              </div>
              <div className="flex items-center">
                <a href={`/admin/edit?id=${vid.id}`} className="p-2 text-blue-500 hover:bg-blue-900/20 rounded-full mr-2">
                  <Edit size={18} />
                </a>
                <button onClick={() => handleDelete(vid.id)} className="p-2 text-red-500 hover:bg-red-900/20 rounded-full"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}












// 'use client';

// import React, { useState, useEffect } from 'react';
// import { auth, db } from '@/lib/firebase'; // <--- IMPORTS FROM LIB
// import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
// import { collection, addDoc, serverTimestamp, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
// import { Trash2, Plus, Video, Loader2, Edit } from 'lucide-react';

// // Environment safe check
// const appId = (typeof window !== 'undefined' && (window as any).__app_id) || 'default-app';

// export default function AdminPage() {
//   const [user, setUser] = useState<any>(null);
//   const [videos, setVideos] = useState<any[]>([]);
  
//   const [title, setTitle] = useState('');
//   const [videoId, setVideoId] = useState('');
//   const [thumbnail, setThumbnail] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // 1. Auth
//   useEffect(() => {
//     signInAnonymously(auth).catch(console.error);
//     return onAuthStateChanged(auth, setUser);
//   }, []);

//   // 2. Fetch Videos
//   useEffect(() => {
//     if (!user) return;
//     // Path update kiya hai taake conflict na ho
//     const q = query(collection(db, 'videos')); 
    
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const vidList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setVideos(vidList);
//     });
//     return () => unsubscribe();
//   }, [user]);

//   // 3. Add Video
//   const handleAddVideo = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!title || !videoId) return;
//     setIsSubmitting(true);

//     try {
//       await addDoc(collection(db, 'videos'), {
//         title,
//         videoId,
//         thumbnail: thumbnail || `https://img.youtube.com/vi/placeholder/hqdefault.jpg`,
//         createdAt: serverTimestamp(),
//       });
//       setTitle('');
//       setVideoId('');
//       setThumbnail('');
//       alert("Video Added!");
//     } catch (error) {
//       console.error("Error:", error);
//       alert("Failed to add video");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // 4. Delete Video
//   const handleDelete = async (id: string) => {
//     if (confirm("Delete this video?")) {
//       await deleteDoc(doc(db, 'videos', id));
//     }
//   };

//   if (!user) return <div className="h-screen flex items-center justify-center text-white">Loading Admin...</div>;

//   return (
//     <div className="min-h-screen bg-[#0f0f0f] text-white p-8 font-sans">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-3xl font-bold text-red-600 mb-8 flex items-center gap-2">
//           <Video /> Admin Dashboard
//         </h1>

//         {/* Add Form */}
//         <div className="bg-[#1f1f1f] p-6 rounded-xl border border-gray-800 mb-8">
//           <h2 className="text-xl font-semibold mb-4">Add New Movie</h2>
//           <form onSubmit={handleAddVideo} className="space-y-4">
//             <input 
//               type="text" value={title} onChange={(e) => setTitle(e.target.value)}
//               placeholder="Movie Title" className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none" required
//             />
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <input 
//                 type="text" value={videoId} onChange={(e) => setVideoId(e.target.value)}
//                 placeholder="OK.ru ID (e.g. 11090668161682)" className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none" required
//               />
//               <input 
//                 type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)}
//                 placeholder="Thumbnail URL (Optional)" className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none"
//               />
//             </div>
//             <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
//               {isSubmitting ? <Loader2 className="animate-spin"/> : <><Plus size={20} /> Add to Library</>}
//             </button>
//           </form>
//         </div>

//         {/* List */}
//         <div className="space-y-3">
//           {videos.map((vid) => (
//             <div key={vid.id} className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">

//               {/* ========================================================== */}

//                 {/* <a href={`/admin/edit/${vid.id}`} className="p-2 text-blue-500 hover:bg-blue-900/20 rounded-full mr-2">
//                   <Edit size={18} />
//                 </a> */}

//               <a href={`/admin/edit?id=${vid.id}`} className="p-2 text-blue-500 hover:bg-blue-900/20 rounded-full mr-2">
//                 <Edit size={18} />
//               </a>


//               {/* ============================================= */}
//               <div className="flex items-center gap-4">
//                  <img src={vid.thumbnail} alt="" className="w-16 h-10 object-cover rounded bg-gray-700"/>
//                  <div><h3 className="font-bold">{vid.title}</h3><p className="text-xs text-gray-500">{vid.videoId}</p></div>
//               </div>
//               <button onClick={() => handleDelete(vid.id)} className="p-2 text-red-500 hover:bg-red-900/20 rounded-full"><Trash2 size={18} /></button>
//             </div>
            
//           ))}

          
//         </div>
//       </div>
//     </div>
//   );
// }