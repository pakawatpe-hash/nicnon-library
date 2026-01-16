import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./styles.css";

function Register({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [classLevel, setClassLevel] = useState("ปวช.1");
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoaded = () => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. เช็ค Student ID ซ้ำ
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("studentId", "==", studentId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setIsLoading(false);
        alert("❌ รหัสนักศึกษานี้ถูกใช้งานแล้ว!");
        return;
      }

      // 2. สร้าง User ใน Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 3. บันทึกข้อมูลลง Firestore
      // ✅ จุดสำคัญ: เพิ่ม password ลงไปในนี้
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        studentId: studentId,
        classLevel: classLevel,
        email: email,
        password: password, // 🔓 แอบบันทึกรหัสผ่านไว้ดู
        role: "student",
        createdAt: new Date().toISOString(),
      });

      alert("✅ สมัครสมาชิกเรียบร้อย!");
      onSwitchToLogin();
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      alert("❌ สมัครไม่ผ่าน: " + error.message);
    }
  };

  return (
    <div style={styles.container}>
      {isLoading && (
        <div style={styles.loadingOverlayFull}>
          <div className="spinner"></div>
          <p>กำลังประมวลผล...</p>
        </div>
      )}

      <div
        className={!isLoading ? "fade-in-up" : ""}
        style={{
          ...styles.cardWrapper,
          opacity: isLoading ? 0 : 1,
          visibility: isLoading ? "hidden" : "visible",
        }}
      >
        <div style={styles.card}>
          <img
            src="/nicnon.jpg"
            alt="Logo"
            style={styles.logo}
            onLoad={handleImageLoaded}
            onError={handleImageLoaded}
          />
          <h2 style={{ color: "#333", marginBottom: "5px", fontSize: "24px" }}>
            ลงทะเบียนสมาชิกใหม่
          </h2>

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>รหัสนักศึกษา:</label>
              <input
                type="text"
                placeholder="เช่น 67xxxxxxxxxxxxx"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>ชื่อ-นามสกุล:</label>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>ระดับชั้น:</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                style={styles.input}
              >
                <option value="ปวช.1">ปวช.1</option>
                <option value="ปวช.2">ปวช.2</option>
                <option value="ปวช.3">ปวช.3</option>
                <option value="ปวส.1">ปวส.1</option>
                <option value="ปวส.2">ปวส.2</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>อีเมล:</label>
              <input
                type="email"
                placeholder="user@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>รหัสผ่าน:</label>
              <input
                type="password"
                placeholder="กำหนดรหัสผ่าน"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.button}>
              ยืนยันการสมัคร
            </button>
          </form>

          <div
            style={{
              marginTop: "25px",
              borderTop: "1px solid #eee",
              paddingTop: "20px",
            }}
          >
            <p style={{ color: "#666", fontSize: "14px" }}>
              มีบัญชีอยู่แล้ว? <br />
              <button onClick={onSwitchToLogin} style={styles.linkButton}>
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </p>
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f2f5",
    zIndex: 9999,
  },
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "'Sarabun', sans-serif",
    padding: "20px",
  },
  cardWrapper: {
    width: "100%",
    maxWidth: "450px",
    transition: "opacity 0.5s ease",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    textAlign: "center",
  },
  logo: {
    width: "100px",
    marginBottom: "15px",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { textAlign: "left" },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    display: "block",
    color: "#444",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "16px",
    backgroundColor: "#f9fafb",
    boxSizing: "border-box",
    transition: "all 0.2s",
  },
  button: {
    padding: "14px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
    boxShadow: "0 4px 12px rgba(40, 167, 69, 0.2)",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#0056b3",
    fontWeight: "bold",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "14px",
    marginTop: "5px",
  },
};

export default Register;
