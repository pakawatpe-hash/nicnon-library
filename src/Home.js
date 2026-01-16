import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import liff from "@line/liff";
import "./styles.css";

function Home({ onLogout, onGoToBorrow, onGoToReturn, onGoToHistory }) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);
  const [isLiffLoading, setIsLiffLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());

        const q = query(
          collection(db, "transactions"),
          where("userId", "==", user.uid),
          where("status", "==", "borrowed")
        );
        const querySnapshot = await getDocs(q);
        let count = 0;
        const now = new Date();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.returnDate && now > new Date(data.returnDate)) count++;
        });
        setOverdueCount(count);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  // ✅ ปุ่มแอดเพื่อน: เพื่อนแต่ละคนกดจะไปที่บอทเพื่อรับข้อความได้
  const handleAddFriend = () => {
    window.open("https://line.me/R/ti/p/@378ctbjr", "_blank");
  };

  // ✅ ปุ่มลงทะเบียน: เพื่อนแต่ละคนกด ระบบจะดึงรหัสตัว U ของ "คนนั้น" มาเก็บให้เอง
  const handleLineRegister = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsLiffLoading(true);
    try {
      await liff.init({ liffId: "2008895606-9zzGDfoE" });
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      const lineUserId = profile.userId; // ดึงรหัสตัว U ของคนใช้ปัจจุบัน

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { lineUserId: lineUserId });

      alert("✅ ผูกบัญชีสำเร็จ! ต่อไปคุณจะได้รับแจ้งเตือนคืนหนังสือผ่าน LINE");
      fetchData();
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsLiffLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    onLogout();
  };

  if (isLoading)
    return (
      <div style={styles.loadingOverlayFull}>
        <div className="spinner"></div>
      </div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/nicnon.jpg" alt="Logo" style={styles.headerLogo} />
          <span style={styles.headerTitle}>ห้องสมุด Nicnon</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.content}>
        {overdueCount > 0 && (
          <div style={styles.alertBox}>
            ⚠️ คุณมีหนังสือเกินกำหนด {overdueCount} เล่ม!
          </div>
        )}

        <div style={styles.welcomeCard}>
          <h2 style={{ margin: "0 0 10px 0" }}>
            สวัสดี, {userData?.name || "นักศึกษา"}
          </h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            รหัส: {userData?.studentId || "-"}
          </p>
          <p
            style={{ margin: "5px 0 15px 0", color: "#666", fontSize: "14px" }}
          >
            สถานะ LINE:{" "}
            {userData?.lineUserId ? (
              <span style={{ color: "#28a745", fontWeight: "bold" }}>
                ✅ พร้อมรับแจ้งเตือน
              </span>
            ) : (
              <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                ❌ ยังไม่ผูกบัญชี
              </span>
            )}
          </p>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleAddFriend}
              style={{ ...styles.lineButton, backgroundColor: "#06C755" }}
            >
              ➕ แอดไลน์บอท
            </button>
            {!userData?.lineUserId && (
              <button
                onClick={handleLineRegister}
                disabled={isLiffLoading}
                style={{ ...styles.lineButton, backgroundColor: "#00c300" }}
              >
                {isLiffLoading ? "..." : "🟢 ผูกบัญชี"}
              </button>
            )}
          </div>
        </div>

        <div style={styles.menuGrid}>
          <div style={styles.menuCard} onClick={onGoToBorrow}>
            <span style={styles.icon}>📚</span>
            <h3>ยืม</h3>
          </div>
          <div style={styles.menuCard} onClick={onGoToReturn}>
            <span style={styles.icon}>↩️</span>
            <h3>คืน</h3>
          </div>
          <div style={styles.menuCard} onClick={onGoToHistory}>
            <span style={styles.icon}>📜</span>
            <h3>ประวัติ</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingOverlayFull: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f2f5",
  },
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "Sarabun",
  },
  header: {
    backgroundColor: "white",
    padding: "15px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  headerLogo: { width: "40px", height: "40px", borderRadius: "50%" },
  headerTitle: { fontSize: "18px", fontWeight: "bold" },
  logoutButton: {
    padding: "6px 12px",
    backgroundColor: "#ff4d4f",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
  },
  content: { padding: "20px", maxWidth: "600px", margin: "0 auto" },
  welcomeCard: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    marginBottom: "20px",
    borderLeft: "5px solid #0056b3",
  },
  lineButton: {
    flex: 1,
    padding: "12px",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
  },
  menuCard: {
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
    cursor: "pointer",
  },
  icon: { fontSize: "30px", display: "block", marginBottom: "5px" },
  alertBox: {
    backgroundColor: "#fff2f0",
    color: "#ff4d4f",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "15px",
    textAlign: "center",
    border: "1px solid #ffccc7",
  },
};

export default Home;
