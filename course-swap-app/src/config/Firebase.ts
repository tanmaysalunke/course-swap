// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAURLUn4-6BCNwgjGzv6mAyZPQzZzKHJOk",
  authDomain: "react-course-swap.firebaseapp.com",
  projectId: "react-course-swap",
  storageBucket: "react-course-swap.appspot.com",
  messagingSenderId: "311020974540",
  appId: "1:311020974540:web:93d9c3eac165bf95246d69",
  measurementId: "G-26L5MDT4KE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider(); 