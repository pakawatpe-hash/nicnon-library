import React, { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import "./styles.css";

function BorrowBook({ onBack, userId, userData }) {
  // ✅ State สำหรับเก็บข้อมูล
  const [bookName, setBookName] = useState(""); // ชื่อหนังสือ
  const [returnDate, setReturnDate] = useState(""); // วันกำหนดคืน
  const [image, setImage] = useState(null); // ไฟล์รูป
  const [previewUrl, setPreviewUrl] = useState(null); // URL รูปตัวอย่าง
  const [isLoading, setIsLoading] = useState(false); // สถานะโหลด
  const fileInputRef = useRef(null);

  // ฟังก์ชันเมื่อเลือกรูป (แสดงตัวอย่างทันที)
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ฟังก์ชันกดยืนยันการยืม
  const handleBorrow = async (e) => {
    e.preventDefault();

    // 1. ตรวจสอบข้อมูลว่าครบไหม
    if (!bookName.trim()) return alert("📚 กรุณาระบุชื่อหนังสือด้วยครับ");
    if (!image) return alert("📸 กรุณาถ่ายรูปหนังสือที่จะยืมด้วยครับ");
    if (!returnDate) return alert("⏰ กรุณาระบุเวลาที่จะคืนด้วยครับ");

    setIsLoading(true);

    try {
      // 2. อัปโหลดรูปภาพ (ส่งไฟล์ต้นฉบับเลย ไม่ย่อ เพื่อแก้ปัญหาค้าง)
      // ตั้งชื่อไฟล์: borrow_photos/เวลาปัจจุบัน_รหัสUser.jpg
      const storageRef = ref(
        storage,
        `borrow_photos/${Date.now()}_${userId}.jpg`
      );
      await uploadBytes(storageRef, image);
      const photoUrl = await getDownloadURL(storageRef);

      // 3. บันทึกข้อมูลลงฐานข้อมูล (Firestore)
      await addDoc(collection(db, "transactions"), {
        userId: userId,
        studentId: userData?.studentId || "unknown",
        userName: userData?.name || "unknown",
        bookName: bookName, // ✅ บันทึกชื่อหนังสือ
        photoUrl: photoUrl, // ลิงก์รูปภาพ
        borrowDate: new Date().toISOString(), // วันที่ยืม (ตอนนี้)
        returnDate: returnDate, // วันที่กำหนดคืน
        status: "borrowed", // สถานะ: กำลังยืม
      });

      alert("✅ ยืมหนังสือสำเร็จ!");
      onBack(); // กลับไปหน้าหลัก
    } catch (error) {
      console.error("Error borrowing:", error);
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // หน้าจอตอนกำลังบันทึก (หมุนๆ)
  if (isLoading) {
    return (
      <div style={styles.loadingOverlayFull}>
        <div className="spinner"></div>
        <p>กำลังบันทึกข้อมูล...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in-up">
      <div style={styles.card}>
        <h2 style={{ color: "#333" }}>📸 ยืมหนังสือ</h2>

        {/* พื้นที่แสดงรูป / กดถ่ายรูป */}
        <div
          onClick={() => fileInputRef.current.click()}
          style={styles.imagePreviewArea}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" style={styles.previewImage} />
          ) : (
            <div style={{ color: "#888" }}>
              <span style={{ fontSize: "40px" }}>📷</span>
              <p>กดเพื่อถ่ายรูปหนังสือ</p>
            </div>
          )}
        </div>

        {/* ตัว Input File ที่ซ่อนอยู่ */}
        <input
          type="file"
          accept="image/*"
          capture="environment" // เปิดกล้องหลัง
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

        <form onSubmit={handleBorrow} style={styles.form}>
          {/* ✅ ช่องกรอกชื่อหนังสือ */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>ชื่อหนังสือ:</label>
            <input
              type="text"
              placeholder="ระบุชื่อหนังสือ..."
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {/* ช่องเลือกวันเวลาคืน */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>กำหนดคืนเมื่อไหร่:</label>
            <input
              type="datetime-local"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {/* ปุ่มยืนยัน */}
          <button type="submit" style={styles.button}>
            ยืนยันการยืม
          </button>

          {/* ปุ่มยกเลิก */}
          <button
            type="button"
            onClick={onBack}
            style={{
              ...styles.button,
              backgroundColor: "#6c757d",
              marginTop: "10px",
            }}
          >
            ยกเลิก
          </button>
        </form>
      </div>
    </div>
  );
}

// Styles (สไตล์ตกแต่ง)
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "20px",
    fontFamily: "'Sarabun', sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    width: "100%",
    maxWidth: "450px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
  },
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
  },
  imagePreviewArea: {
    width: "100%",
    height: "200px",
    backgroundColor: "#f0f2f5",
    borderRadius: "10px",
    border: "2px dashed #ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    marginBottom: "10px",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
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
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 9999,
  },
};

export default BorrowBook;
