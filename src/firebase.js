import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBanJ7GEQfPDHhhNBuAGvGxNBqgzvk12Ik",
  authDomain: "mesas-para-eventos.firebaseapp.com",
  projectId: "mesas-para-eventos",
  storageBucket: "mesas-para-eventos.firebasestorage.app",
  messagingSenderId: "305480899254",
  appId: "1:305480899254:web:054d0a5de0bc66c0246417"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);