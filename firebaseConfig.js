import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASTE YOUR FIREBASE CONFIG OBJECT HERE
const firebaseConfig = {
  apiKey: "AIzaSyDilz3biR7IUH5cKM3cVatrYfCDMxQhU2Y",
  authDomain: "chat-app-7c242.firebaseapp.com",
  projectId: "chat-app-7c242",
  storageBucket: "chat-app-7c242.firebasestorage.app",
  messagingSenderId: "194988405606",
  appId: "1:194988405606:web:9d1ded517fc8d71ade8ea7",
  measurementId: "G-Z38KB56M50"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getFirestore(app);