import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA31IFUrfqtdHX4WyQoP0ybPdDkcRvs07E",
    authDomain: "eire-fastconversation.firebaseapp.com",
    projectId: "eire-fastconversation",
    storageBucket: "eire-fastconversation.firebasestorage.app",
    messagingSenderId: "857373501480",
    appId: "1:857373501480:web:a1fd4249d0bf48ddeb6d1d",
    measurementId: "G-PVTV2ZPLQ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

