import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDkFY5A7j8FuViOR08MnIR2Rm7t7mR7ooE",
  authDomain: "smartgpa-69849.firebaseapp.com",
  projectId: "smartgpa-69849",
  storageBucket: "smartgpa-69849.firebasestorage.app",
  messagingSenderId: "72803003814",
  appId: "1:72803003814:web:0ae1237d4af906254bf367"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
