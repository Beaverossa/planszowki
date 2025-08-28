// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";

// Konfiguracja z konsoli Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAGIqIV-7oeMGa4EHGSQn-wGzo20jcL1aU",
  authDomain: "czolgi-online.firebaseapp.com",
  projectId: "czolgi-online",
  storageBucket: "czolgi-online.firebasestorage.app",
  messagingSenderId: "586260490520",
  appId: "1:586260490520:web:48ce8b963bc81c5779566d",
  measurementId: "G-4H6BLCRXLK"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
