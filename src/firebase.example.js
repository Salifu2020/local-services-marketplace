// Example Firebase configuration
// Copy this structure and replace with your actual values from Firebase Console

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Replace these values with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyExample123456789",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;

