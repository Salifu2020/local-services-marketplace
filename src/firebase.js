// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtm0d4kT1KPKQWyoQGzo9yAPTAPM_0LNY",
  authDomain: "neighborly-52673.firebaseapp.com",
  projectId: "neighborly-52673",
  storageBucket: "neighborly-52673.firebasestorage.app",
  messagingSenderId: "530737726016",
  appId: "1:530737726016:web:2ddee802c22c31c1d055a5",
  measurementId: "G-TXK326JBWG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication (required for the app)
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Analytics (optional)
const analytics = getAnalytics(app);

// Get appId from config for Firestore paths
export const appId = firebaseConfig.appId;

export default app;