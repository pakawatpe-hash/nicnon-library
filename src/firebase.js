
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 


const firebaseConfig = {
  apiKey: "AIzaSyDlj8Zn31ZdlEjXKA8xiR-tTJDmzIP8Upo",
  authDomain: "nicnon-library.firebaseapp.com",
  projectId: "nicnon-library",
  storageBucket: "nicnon-library.firebasestorage.app",
  messagingSenderId: "884589356108",
  appId: "1:884589356108:web:c892360ec7142b270180e9",
};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app); 
const db = getFirestore(app); 
const storage = getStorage(app); 

// ส่งออกไปให้ไฟล์อื่นใช้
export { auth, db, storage };

