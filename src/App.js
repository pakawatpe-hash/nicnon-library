import React, { useState, useEffect } from "react";
import "./styles.css";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import BorrowBook from "./BorrowBook";
import ReturnBook from "./ReturnBook";
import History from "./History";
import AdminDashboard from "./AdminDashboard"; 
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("login");
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // ดึงข้อมูล User และเช็ค Role
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);

          
          if (data.role === "admin") {
            setCurrentScreen("admin"); 
          } else {
            setCurrentScreen("home"); 
          }
        } else {
          setCurrentScreen("home");
        }
      } else {
        setUser(null);
        setUserData(null);
        setCurrentScreen("login");
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (isCheckingAuth) return null;

  return (
    <div>
      {currentScreen === "login" && (
        <Login onSwitchToRegister={() => setCurrentScreen("register")} />
      )}
      {currentScreen === "register" && (
        <Register onSwitchToLogin={() => setCurrentScreen("login")} />
      )}

      {currentScreen === "home" && (
        <Home
          onLogout={() => setCurrentScreen("login")}
          onGoToBorrow={() => setCurrentScreen("borrow")}
          onGoToReturn={() => setCurrentScreen("return")}
          onGoToHistory={() => setCurrentScreen("history")}
        />
      )}

      {currentScreen === "borrow" && (
        <BorrowBook
          onBack={() => setCurrentScreen("home")}
          userId={user?.uid}
          userData={userData}
        />
      )}
      {currentScreen === "return" && (
        <ReturnBook
          onBack={() => setCurrentScreen("home")}
          userId={user?.uid}
        />
      )}
      {currentScreen === "history" && (
        <History onBack={() => setCurrentScreen("home")} userId={user?.uid} />
      )}

      
      {currentScreen === "admin" && (
        <AdminDashboard onLogout={() => setCurrentScreen("login")} />
      )}
    </div>
  );
}
