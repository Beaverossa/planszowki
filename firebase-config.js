import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGIqIV-7oeMGa4EHGSQn-wGzo20jcL1aU",
  authDomain: "czolgi-online.firebaseapp.com",
  projectId: "czolgi-online",
  storageBucket: "czolgi-online.firebasestorage.app",
  messagingSenderId: "586260490520",
  appId: "1:586260490520:web:48ce8b963bc81c5779566d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
