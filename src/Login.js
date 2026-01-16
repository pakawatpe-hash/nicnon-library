import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./styles.css";

function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // สถานะโหลด (เริ่มต้น = true)
  const [isLoading, setIsLoading] = useState(true);

  // ฟังก์ชันนี้จะทำงานเมื่อ "รูปในหน้าเว็บ" โหลดเสร็จจริงๆ
  const handleImageLoaded = () => {
    // หน่วงเวลา 1 วินาที ให้เห็น Spinner สวยๆ ก่อนค่อยเปิดภาพ
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("✅ เข้าสู่ระบบสำเร็จ!");
    } catch (error) {
      console.error(error);
      alert("❌ รหัสผ่านไม่ถูกต้อง หรือไม่มีบัญชีนี้");
    }
  };

  return (
    <div style={styles.container}>
      {/* --- ส่วนที่ 1: หน้า Loading (จะโชว์ทับจนกว่ารูปจะเสร็จ) --- */}
      {isLoading && (
        <div style={styles.loadingOverlayFull}>
          <div className="spinner"></div>
          <p style={{ color: "#666", fontSize: "16px", fontWeight: "bold" }}>
            กำลังเข้าสู่ระบบ...
          </p>
        </div>
      )}

      {/* --- ส่วนที่ 2: หน้าเนื้อหาหลัก --- */}
      {/* เราวาดหน้านี้รอไว้เลย แต่ปรับ opacity เป็น 0 (ล่องหน) จนกว่า isLoading จะเป็น false */}
      <div
        className={!isLoading ? "fade-in-up" : ""}
        style={{
          ...styles.cardWrapper,
          opacity: isLoading ? 0 : 1, // ถ้าโหลดอยู่ให้ล่องหน (0), เสร็จแล้วให้โชว์ (1)
          visibility: isLoading ? "hidden" : "visible", // ซ่อนไม่ให้กดได้
        }}
      >
        <div style={styles.card}>
          {/* หัวใจสำคัญ: onLoad อยู่ตรงนี้!! */}
          <img
            src="/nicnon.jpg"
            alt="Logo College"
            style={styles.logo}
            onLoad={handleImageLoaded} // พอรูปนี้เสร็จปุ๊บ ค่อยสั่งปิด Loading
            onError={handleImageLoaded} // ถ้ารูปเสีย ก็ให้เปิดเว็บได้เหมือนกัน
          />

          <h2 style={{ color: "#333", marginBottom: "5px", fontSize: "24px" }}>
            เข้าสู่ระบบห้องสมุด
          </h2>
          <p style={{ color: "#777", marginBottom: "25px", fontSize: "14px" }}>
            วิทยาลัยเทคนิคนนทบุรี
          </p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>อีเมล (Email):</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>รหัสผ่าน (Password):</label>
              <input
                type="password"
                placeholder="กรอกรหัสผ่าน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.button}>
              เข้าสู่ระบบ (Login)
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
              ยังไม่มีบัญชี? <br />
              <button onClick={onSwitchToRegister} style={styles.linkButton}>
                สมัครสมาชิกใหม่ที่นี่
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
    zIndex: 9999, // บังทุกอย่าง
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
  // wrapper นี้เอาไว้คุมการซ่อน/แสดง
  cardWrapper: {
    width: "100%",
    maxWidth: "450px",
    transition: "opacity 0.5s ease", // เอฟเฟกต์ค่อยๆ ชัดขึ้น
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
    backgroundColor: "#0056b3",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
    boxShadow: "0 4px 12px rgba(0, 86, 179, 0.2)",
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

export default Login;
