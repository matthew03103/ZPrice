// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgEyXYhlHE3Lb4TTy0fJFStdWZC49WsFM",
  authDomain: "zprice-a9f6e.firebaseapp.com",
  projectId: "zprice-a9f6e",
  storageBucket: "zprice-a9f6e.firebasestorage.app",
  messagingSenderId: "1007574280413",
  appId: "1:1007574280413:web:1dd56c683feb85155b9334",
  measurementId: "G-NGD5FG13VT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const firestore = getFirestore(app);

// Export Firestore
export { firestore };