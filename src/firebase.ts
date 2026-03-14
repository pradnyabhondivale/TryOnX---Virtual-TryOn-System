
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmqF4gV5haM2kpWouUksAUJ9na6cZl8Bw",
  authDomain: "virtual-tryon-175d7.firebaseapp.com",
  projectId: "virtual-tryon-175d7",
  storageBucket: "virtual-tryon-175d7.firebasestorage.app",
  messagingSenderId: "826571759200",
  appId: "1:826571759200:web:5d5abc158acb9d31632d05"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);