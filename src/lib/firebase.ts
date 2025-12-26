import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Yahan apni Firebase Console wali keys paste karein
// const firebaseConfig = {
//   apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxx",
//   authDomain: "streamhub-xyz.firebaseapp.com",
//   projectId: "streamhub-xyz",
//   storageBucket: "streamhub-xyz.firebasestorage.app",
//   messagingSenderId: "123456789",
//   appId: "1:123456789:web:abcdef123456"
// };

const firebaseConfig = {
  apiKey: "AIzaSyCd685Rn6UYLGPLtWK3dIluBnX9weKGWjc",
  authDomain: "streamhub-93111.firebaseapp.com",
  projectId: "streamhub-93111",
  storageBucket: "streamhub-93111.firebasestorage.app",
  messagingSenderId: "324634942826",
  appId: "1:324634942826:web:2cbd99b7ca2815fdae9913"
};

// Singleton Pattern: Check karte hain ke app pehle se initialized to nahi hai
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };