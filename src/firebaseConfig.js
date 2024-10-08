// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC5siaFnxhtfEbw1FaKuX8GkEQyN5rb6a0",
    authDomain: "sidewalk-survey-f7904.firebaseapp.com",
    projectId: "sidewalk-survey-f7904",
    storageBucket: "sidewalk-survey-f7904.appspot.com",
    messagingSenderId: "116996397844",
    appId: "1:116996397844:web:10d973cb146b348c040001",
    measurementId: "G-3MC54XMWQD"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
