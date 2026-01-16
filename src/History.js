import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./styles.css";

function History({ onBack, userId }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลประวัติทั้งหมดของ User นี้
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, "transactions"),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);

        // แปลงข้อมูล + เรียงลำดับจาก "ใหม่ไปเก่า"
        const data = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

        setTransactions(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  // ฟังก์ชันแปลงวันที่ให้เป็นภาษาไทยสวยๆ
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("th-TH", {
      year: "2-digit",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div style={styles.loadingOverlayFull}>
        <div className="spinner"></div>
        <p>กำลังโหลดประวัติ...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in-up">
      <div style={styles.cardFullHeight}>
        {" "}
        {/* ใช้ Card แบบเต็มจอเพื่อให้ scroll ได้ */}
        {/* หัวข้อ */}
        <div style={styles.headerRow}>
          <button onClick={onBack} style={styles.backButton}>
            ⬅️ กลับ
          </button>
          <h2 style={{ margin: 0, color: "#333" }}>ประวัติการยืม-คืน</h2>
          <div style={{ width: "40px" }}></div> {/* จัด layout ให้ตรงกลาง */}
        </div>
        {/* รายการประวัติ */}
        <div style={styles.listContainer}>
          {transactions.length === 0 ? (
            <p
              style={{ textAlign: "center", color: "#999", marginTop: "50px" }}
            >
              ยังไม่มีประวัติการยืม
            </p>
          ) : (
            transactions.map((item) => (
              <div key={item.id} style={styles.historyItem}>
                {/* ส่วนหัว: ชื่อหนังสือ + สถานะ */}
                <div style={styles.itemHeader}>
                  <span style={styles.bookName}>
                    📖 {item.bookName || "ไม่ระบุชื่อ"}
                  </span>
                  <span
                    style={
                      item.status === "returned"
                        ? styles.statusGreen
                        : styles.statusOrange
                    }
                  >
                    {item.status === "returned" ? "คืนแล้ว ✅" : "กำลังยืม ⏳"}
                  </span>
                </div>

                {/* รายละเอียดวันที่ */}
                <div style={styles.itemDetails}>
                  <p>
                    📅 <strong>วันที่ยืม:</strong> {formatDate(item.borrowDate)}
                  </p>

                  {item.status === "borrowed" ? (
                    <p style={{ color: "#d9534f" }}>
                      ⏰ <strong>กำหนดคืน:</strong>{" "}
                      {formatDate(item.returnDate)}
                    </p>
                  ) : (
                    <p style={{ color: "#28a745" }}>
                      ↩️ <strong>คืนเมื่อ:</strong>{" "}
                      {formatDate(item.returnedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Reuse สไตล์เดิม
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
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "'Sarabun', sans-serif",
  },

  // สไตล์ใหม่สำหรับหน้า History
  cardFullHeight: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: "600px",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 0 20px rgba(0,0,0,0.05)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
    backgroundColor: "white",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#0056b3",
    fontWeight: "bold",
  },
  listContainer: { padding: "20px", overflowY: "auto" },

  // กล่องรายการแต่ละอัน
  historyItem: {
    backgroundColor: "#fff",
    border: "1px solid #eee",
    borderRadius: "10px",
    padding: "15px",
    marginBottom: "15px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  bookName: { fontSize: "16px", fontWeight: "bold", color: "#333" },

  // ป้ายสถานะ
  statusGreen: {
    fontSize: "12px",
    backgroundColor: "#e6f4ea",
    color: "#1e7e34",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "bold",
  },
  statusOrange: {
    fontSize: "12px",
    backgroundColor: "#fff3cd",
    color: "#856404",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "bold",
  },

  itemDetails: { fontSize: "14px", color: "#666", lineHeight: "1.6" },
};

export default History;
