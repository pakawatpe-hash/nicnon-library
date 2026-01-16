import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import "./styles.css";


const LIBRARY_LOCATION = {
  latitude: 14.10508,
  longitude: 100.32193,
};


const ALLOWED_RADIUS = 50;

function ReturnBook({ onBack, userId }) {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  
  useEffect(() => {
    const fetchBorrowedBooks = async () => {
      try {
        const q = query(
          collection(db, "transactions"),
          where("userId", "==", userId),
          where("status", "==", "borrowed")
        );
        const querySnapshot = await getDocs(q);
        const books = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBorrowedBooks(books);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };
    fetchBorrowedBooks();
  }, [userId]);

  
  const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();

   
    if (!selectedBook) return alert("📚 กรุณาเลือกหนังสือที่จะคืนก่อนครับ");
    if (!image) return alert("📸 กรุณาถ่ายรูปหนังสือเพื่อยืนยันสภาพครับ");

    setIsLoading(true);

    
    if (!navigator.geolocation) {
      setIsLoading(false);
      return alert("❌ อุปกรณ์ของคุณไม่รองรับ GPS");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        
        const distance = getDistanceFromLatLonInM(
          userLat,
          userLon,
          LIBRARY_LOCATION.latitude,
          LIBRARY_LOCATION.longitude
        );

        const distanceInt = Math.round(distance);

        
        if (distance > ALLOWED_RADIUS) {
          setIsLoading(false);
          alert(
            `❌ คืนหนังสือไม่ได้!\n\nขณะนี้คุณอยู่ห่างจากจุดคืน: ${distanceInt} เมตร\n(เกินกำหนดไป ${
              distanceInt - ALLOWED_RADIUS
            } เมตร)\n\nกรุณาเดินเข้าไปในระยะ 50 เมตรครับ`
          );
          return; 
        }

        
        try {
          
          const storageRef = ref(
            storage,
            `return_photos/${Date.now()}_${userId}.jpg`
          );
          await uploadBytes(storageRef, image);
          const photoUrl = await getDownloadURL(storageRef);

         
          const transactionRef = doc(db, "transactions", selectedBook.id);
          await updateDoc(transactionRef, {
            status: "returned",
            returnedAt: new Date().toISOString(),
            returnPhotoUrl: photoUrl,
          });

          alert(`✅ คืนหนังสือเรียบร้อย! (ระยะห่าง ${distanceInt} เมตร)`);
          onBack();
        } catch (error) {
          console.error(error);
          alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        alert("❌ ไม่สามารถดึงพิกัดได้ กรุณาเปิด GPS แล้วลองใหม่");
      },
      { enableHighAccuracy: true }
    );
  };

  if (isLoading) {
    return (
      <div style={styles.loadingOverlayFull}>
        <div className="spinner"></div>
        <p>กำลังตรวจสอบพิกัดและบันทึก...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in-up">
      <div style={styles.card}>
        <h2 style={{ color: "#333", marginBottom: "20px" }}>↩️ คืนหนังสือ</h2>

       
        <div style={{ textAlign: "left", marginBottom: "20px" }}>
          <label style={styles.label}>เลือกรายการที่จะคืน:</label>
          {borrowedBooks.length === 0 ? (
            <div
              style={{
                padding: "20px",
                background: "#f8f9fa",
                borderRadius: "8px",
                textAlign: "center",
                color: "#666",
              }}
            >
              ไม่พบรายการที่กำลังยืมอยู่
            </div>
          ) : (
            <select
              style={styles.input}
              onChange={(e) => {
                const book = borrowedBooks.find((b) => b.id === e.target.value);
                setSelectedBook(book);
              }}
              defaultValue=""
            >
              <option value="" disabled>
                -- กรุณาเลือก --
              </option>
              {borrowedBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  📖 {book.bookName || "ไม่ระบุชื่อ"} (ยืม:{" "}
                  {new Date(book.borrowDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
        </div>

       
        {(selectedBook || borrowedBooks.length > 0) && (
          <>
            <div style={styles.stepBox}>
              <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>
                📸 ถ่ายรูปยืนยันสภาพหนังสือ
              </p>
              <div
                onClick={() => fileInputRef.current.click()}
                style={styles.imagePreviewArea}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={styles.previewImage}
                  />
                ) : (
                  <div style={{ color: "#888" }}>
                    <span style={{ fontSize: "30px" }}>📷</span>
                    <p>กดถ่ายรูปหนังสือ</p>
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
            </div>

            
            <button
              onClick={handleReturn}
              style={{
                ...styles.button,
                marginTop: "20px",
               
                backgroundColor: selectedBook && image ? "#0056b3" : "#6c757d",
              }}
            >
              ยืนยันการคืนหนังสือ
            </button>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
              * ระบบจะตรวจสอบระยะทาง 50 เมตรอัตโนมัติ
            </p>
          </>
        )}

        <button
          type="button"
          onClick={onBack}
          style={{
            ...styles.button,
            backgroundColor: "transparent",
            color: "#666",
            border: "1px solid #ddd",
            marginTop: "15px",
          }}
        >
          กลับหน้าหลัก
        </button>
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
    width: "100%",
    padding: "14px",
    backgroundColor: "#0056b3",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
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
  stepBox: {
    border: "1px solid #eee",
    padding: "15px",
    borderRadius: "10px",
    marginTop: "15px",
    backgroundColor: "#fafafa",
  },
  imagePreviewArea: {
    width: "100%",
    height: "180px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "2px dashed #ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%", objectFit: "cover" },
};

export default ReturnBook;

