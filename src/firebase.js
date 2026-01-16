// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ เพิ่ม Storage สำหรับเก็บรูป

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlj8Zn31ZdlEjXKA8xiR-tTJDmzIP8Upo",
  authDomain: "nicnon-library.firebaseapp.com",
  projectId: "nicnon-library",
  storageBucket: "nicnon-library.firebasestorage.app",
  messagingSenderId: "884589356108",
  appId: "1:884589356108:web:c892360ec7142b270180e9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// สร้างตัวแปรสำหรับใช้งาน Service ต่างๆ
const auth = getAuth(app); // ระบบล็อกอิน
const db = getFirestore(app); // ฐานข้อมูล
const storage = getStorage(app); // ✅ ระบบเก็บรูปภาพ

// ส่งออกไปให้ไฟล์อื่นใช้
export { auth, db, storage };
