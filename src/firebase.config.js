// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCl1-9WgEetxQeiYCov3XRkeSv7_UhS5I",
  authDomain: "fishtopia-79b7f.firebaseapp.com",
  projectId: "fishtopia-79b7f",
  storageBucket: "fishtopia-79b7f.appspot.com",
  messagingSenderId: "530616299955",
  appId: "1:530616299955:web:0a9839713d9fc34bae5bc6",
  measurementId: "G-31K3G683MZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore()