// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCNgSYj6Pn36RXcR332c7cPbQzOdD91TA0",
  authDomain: "webapp1-88589.firebaseapp.com",
  databaseURL: "https://webapp1-88589-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "webapp1-88589",
  storageBucket: "webapp1-88589.firebasestorage.app",
  messagingSenderId: "528459325608",
  appId: "1:528459325608:web:f16035ab252e7b6996229d",
  measurementId: "G-X1VK7JG7G7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);


export { auth, googleProvider, signInWithPopup, db, setDoc, doc  };
