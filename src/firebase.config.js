// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

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
// Use this to initialize the firebase App
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Use these for db & auth
const db = firebaseApp.firestore();
const auth = firebase.auth();

export { auth, db };