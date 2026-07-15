import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDkFY5A7j8FuViOR08MnIR2Rm7t7mR7ooE",
  authDomain: "smartgpa-69849.firebaseapp.com",
  projectId: "smartgpa-69849",
  storageBucket: "smartgpa-69849.firebasestorage.app",
  messagingSenderId: "72803003814",
  appId: "1:72803003814:web:0ae1237d4af906254bf367"
};

// Initialize Firebase — guard against double-init (e.g., hot reload)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Auth — use initializeAuth only on first init, getAuth on subsequent
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized (e.g., fast refresh)
  auth = getAuth(app);
}

export { auth };
