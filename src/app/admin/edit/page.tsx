'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { Save, ArrowLeft, Loader2, Video, Radio } from 'lucide-react';

function EditVideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoDocId = searchParams.get('id');

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [videoId, setVideoId] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isLive, setIsLive] = useState(false); // LIVE State

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!videoDocId) {
       router.push('/admin');
       return;
    }

    const fetchData = async () => {
      try {
        const docRef = doc(db, 'videos', videoDocId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setVideoId(data.videoId || '');
          setThumbnail(data.thumbnail || '');
          setIsLive(data.live || false); // Set Live State
        } else {
          alert("Video not found!");
          router.push('/admin');
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, videoDocId, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoDocId) return;
    setSaving(true);

    try {
      const docRef = doc(db, 'videos', videoDocId);
      await updateDoc(docRef, {
        title,
        videoId,
        thumbnail,
        live: isLive, // Update Live Status
        updatedAt: new Date()
      });
      alert("Video Updated Successfully!");
      router.push('/admin');
    } catch (error) {
      console.error("Error updating:", error);
      alert("Failed to update video.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-[#0f0f0f] text-white"><Loader2 className="animate-spin text-red-600 w-10 h-10" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-[#1f1f1f] rounded-full hover:bg-[#333] transition"><ArrowLeft size={20} /></button>
          <h1 className="text-2xl font-bold flex items-center gap-2">Edit Video</h1>
        </div>

        <div className="bg-[#1f1f1f] p-8 rounded-xl border border-gray-800 shadow-xl">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Video Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">OK.ru Video ID</label>
              <div className="relative">
                <Video className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input type="text" value={videoId} onChange={(e) => setVideoId(e.target.value)} className="w-full bg-[#2a2a2a] p-3 pl-10 rounded-lg border border-gray-700 focus:border-red-600 outline-none text-white font-mono" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Thumbnail URL</label>
              <input type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none text-white" />
            </div>

            {/* LIVE TOGGLE */}
            <div className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-700 flex items-center justify-between">
               <label htmlFor="isLiveEdit" className="cursor-pointer font-medium flex items-center gap-2">
                 <Radio size={18} className={isLive ? "text-red-500" : "text-gray-400"} />
                 <span className={isLive ? "text-red-500 font-bold" : "text-gray-400"}>
                    {isLive ? "Status: LIVE STREAM" : "Status: RECORDED / OFFLINE"}
                 </span>
               </label>
               <input 
                 type="checkbox" 
                 id="isLiveEdit"
                 checked={isLive}
                 onChange={(e) => setIsLive(e.target.checked)}
                 className="w-6 h-6 accent-red-600 cursor-pointer"
               />
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button type="button" onClick={() => router.back()} className="flex-1 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : <><Save size={20} /> Update Video</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-10">Loading Editor...</div>}>
      <EditVideoContent />
    </Suspense>
  );
}







// 'use client';

// import React, { useState, useEffect, Suspense } from 'react';
// import { auth, db } from '@/lib/firebase';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
// import { useRouter, useSearchParams } from 'next/navigation'; 
// import { Save, ArrowLeft, Loader2, Video } from 'lucide-react';

// // Content Component (Suspense Boundary ke liye zaroori hai)
// function EditVideoContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const videoDocId = searchParams.get('id'); // ID ab URL query se ayegi (?id=...)

//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [title, setTitle] = useState('');
//   const [videoId, setVideoId] = useState('');
//   const [thumbnail, setThumbnail] = useState('');

//   useEffect(() => {
//     signInAnonymously(auth).catch(console.error);
//     return onAuthStateChanged(auth, setUser);
//   }, []);

//   useEffect(() => {
//     if (!user) return;
//     if (!videoDocId) {
//        // Agar ID nahi mili to wapas bhej do
//        router.push('/admin');
//        return;
//     }

//     const fetchData = async () => {
//       try {
//         const docRef = doc(db, 'videos', videoDocId);
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           setTitle(data.title || '');
//           setVideoId(data.videoId || '');
//           setThumbnail(data.thumbnail || '');
//         } else {
//           alert("Video not found!");
//           router.push('/admin');
//         }
//       } catch (error) {
//         console.error("Error fetching video:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [user, videoDocId, router]);

//   const handleUpdate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!videoDocId) return;
//     setSaving(true);

//     try {
//       const docRef = doc(db, 'videos', videoDocId);
//       await updateDoc(docRef, {
//         title,
//         videoId,
//         thumbnail,
//         updatedAt: new Date()
//       });
//       alert("Video Updated Successfully!");
//       router.push('/admin');
//     } catch (error) {
//       console.error("Error updating:", error);
//       alert("Failed to update video.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return <div className="h-screen flex items-center justify-center bg-[#0f0f0f] text-white"><Loader2 className="animate-spin text-red-600 w-10 h-10" /></div>;
//   }

//   return (
//     <div className="min-h-screen bg-[#0f0f0f] text-white p-6 font-sans">
//       <div className="max-w-2xl mx-auto">
//         <div className="flex items-center gap-4 mb-8">
//           <button onClick={() => router.back()} className="p-2 bg-[#1f1f1f] rounded-full hover:bg-[#333] transition"><ArrowLeft size={20} /></button>
//           <h1 className="text-2xl font-bold flex items-center gap-2">Edit Video</h1>
//         </div>

//         <div className="bg-[#1f1f1f] p-8 rounded-xl border border-gray-800 shadow-xl">
//           <form onSubmit={handleUpdate} className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-400 mb-2">Video Title</label>
//               <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none text-white" required />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-400 mb-2">OK.ru Video ID</label>
//               <div className="relative">
//                 <Video className="absolute left-3 top-3.5 text-gray-500" size={18} />
//                 <input type="text" value={videoId} onChange={(e) => setVideoId(e.target.value)} className="w-full bg-[#2a2a2a] p-3 pl-10 rounded-lg border border-gray-700 focus:border-red-600 outline-none text-white font-mono" required />
//               </div>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-400 mb-2">Thumbnail URL</label>
//               <input type="text" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} className="w-full bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none text-white" />
//             </div>
//             <div className="pt-4 flex items-center gap-4">
//               <button type="button" onClick={() => router.back()} className="flex-1 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition">Cancel</button>
//               <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center justify-center gap-2">
//                 {saving ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : <><Save size={20} /> Update Video</>}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Main Page Component
// export default function EditPage() {
//   return (
//     // Suspense zaroori hai build time par searchParams handle karne ke liye
//     <Suspense fallback={<div className="text-white text-center mt-10">Loading Editor...</div>}>
//       <EditVideoContent />
//     </Suspense>
//   );
// }