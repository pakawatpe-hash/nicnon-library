import React, { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import "./styles.css";

function BorrowBook({ onBack, userId, userData }) {

  const [bookName, setBookName] = useState(""); 
  const [returnDate, setReturnDate] = useState(""); 
  const [image, setImage] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null); 
  const [isLoading, setIsLoading] = useState(false); 
  const fileInputRef = useRef(null);

  
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  
  const handleBorrow = async (e) => {
    e.preventDefault();

    
    if (!bookName.trim()) return alert("📚 กรุณาระบุชื่อหนังสือด้วยครับ");
    if (!image) return alert("📸 กรุณาถ่ายรูปหนังสือที่จะยืมด้วยครับ");
    if (!returnDate) return alert("⏰ กรุณาระบุเวลาที่จะคืนด้วยครับ");

    setIsLoading(true);

    try {
      
      const storageRef = ref(
        storage,
        `borrow_photos/${Date.now()}_${userId}.jpg`
      );
      await uploadBytes(storageRef, image);
      const photoUrl = await getDownloadURL(storageRef);

      
      await addDoc(collection(db, "transactions"), {
        userId: userId,
        studentId: userData?.studentId || "unknown",
        userName: userData?.name || "unknown",
        bookName: bookName, 
        photoUrl: photoUrl, 
        borrowDate: new Date().toISOString(), 
        returnDate: returnDate, 
        status: "borrowed", 
      });

      alert("✅ ยืมหนังสือสำเร็จ!");
      onBack(); 
    } catch (error) {
      console.error("Error borrowing:", error);
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };


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

        
        <input
          type="file"
          accept="image/*"
          capture="environment" 
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

        <form onSubmit={handleBorrow} style={styles.form}>
          
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

         
          <button type="submit" style={styles.button}>
            ยืนยันการยืม
          </button>

          
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

