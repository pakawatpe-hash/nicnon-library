import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import "./styles.css";

function AdminDashboard({ onLogout }) {
  const [viewMode, setViewMode] = useState("transactions");
  const [isLoading, setIsLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [transFilter, setTransFilter] = useState("all");
  const [transSearch, setTransSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const qUsers = query(collection(db, "users"));
      const usersSnap = await getDocs(qUsers);
      const usersData = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllUsers(usersData);

      const qTrans = query(
        collection(db, "transactions"),
        orderBy("borrowDate", "desc")
      );
      const transSnap = await getDocs(qTrans);

      const enrichedTrans = transSnap.docs.map((d) => {
        const transData = d.data();
        const userMatch = usersData.find(
          (u) => u.studentId === transData.studentId
        );
        return {
          id: d.id,
          ...transData,
          classLevel: transData.classLevel || userMatch?.classLevel || "-",
          lineUserId: userMatch?.lineUserId || null,
        };
      });

      setAllTransactions(enrichedTrans);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      signOut(auth);
      onLogout();
    }
  };

  const openEditModal = (user) => {
    setEditingUser({ ...user });
  };

  const sendLineMessagingAPI = async (item) => {
    const user = allUsers.find((u) => u.studentId === item.studentId);
    if (!user || !user.lineUserId) {
      alert("❌ นักศึกษาคนนี้ยังไม่ได้ลงทะเบียน LINE");
      return;
    }
    const GAS_URL =
      "https://script.google.com/macros/s/AKfycbyFOC3EAK_hcoAO0vkSEWC1U7d1SW_sMf2d-7gE3ulYvSZ5hwAZanN3mUUZm5IuCVoP/exec";
    const message = `📚 แจ้งเตือนห้องสมุด\n${item.userName}\nหนังสือ "${item.bookName}" เกินกำหนดคืนแล้ว\nกรุณานำมาคืนที่ห้องสมุดด้วยนะ`;

    if (!window.confirm(`ยืนยันการส่ง LINE แจ้งเตือนหา ${item.userName}?`))
      return;

    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.lineUserId, message: message }),
      });
      alert("✅ ส่งคำสั่งแจ้งเตือนเรียบร้อย!");
    } catch (error) {
      alert("❌ ผิดพลาด: " + error.message);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, {
        studentId: editingUser.studentId,
        name: editingUser.name,
        email: editingUser.email,
        classLevel: editingUser.classLevel,
        role: editingUser.role,
        lineUserId: editingUser.lineUserId || "",
      });
      alert("✅ บันทึกเรียบร้อย!");
      setEditingUser(null);
      fetchData();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.prompt(`พิมพ์ "confirm" เพื่อลบ: ${userName}`) !== "confirm")
      return;
    try {
      await deleteDoc(doc(db, "users", userId));
      alert("ลบผู้ใช้เรียบร้อย");
      fetchData();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleSendResetEmail = async (email) => {
    if (!window.confirm(`ส่งลิงก์รีเซ็ตไปที่ ${email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`✅ ส่งลิงก์เรียบร้อย!`);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  
  const checkStatus = (item) => {
    if (item.status === "returned") return "คืนแล้ว";
    const now = new Date();
    const returnDate = new Date(item.returnDate);
    return now > returnDate ? "เกินกำหนด" : "กำลังยืม";
  };

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleString("th-TH", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

  const filteredTransactions = allTransactions.filter((item) => {
    const status = checkStatus(item);
    const matchesFilter =
      transFilter === "all" ||
      (transFilter === "overdue"
        ? status === "เกินกำหนด"
        : transFilter === "borrowed"
        ? status === "กำลังยืม"
        : transFilter === "returned"
        ? status === "คืนแล้ว"
        : false);
    const searchLower = transSearch.toLowerCase();
    return (
      matchesFilter &&
      (item.userName?.toLowerCase().includes(searchLower) ||
        item.studentId?.includes(searchLower) ||
        item.bookName?.toLowerCase().includes(searchLower))
    );
  });

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.studentId?.includes(userSearch)
  );

  if (isLoading)
    return (
      <div style={styles.loadingOverlayFull}>
        <div className="spinner"></div>
        <p style={{ marginTop: "10px", color: "#666" }}>กำลังโหลดข้อมูล...</p>
      </div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.cardFullWidth}>
        <div style={styles.headerRow}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: isMobile ? "20px" : "24px" }}>🛡️</span>
            <h2 style={{ margin: 0, fontSize: isMobile ? "18px" : "22px" }}>
              Admin Panel
            </h2>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            ออก
          </button>
        </div>

        <div style={styles.viewToggleBar}>
          <button
            style={
              viewMode === "transactions"
                ? styles.viewButtonActive
                : styles.viewButton
            }
            onClick={() => setViewMode("transactions")}
          >
            📚 ยืม-คืน
          </button>
          <button
            style={
              viewMode === "users" ? styles.viewButtonActive : styles.viewButton
            }
            onClick={() => setViewMode("users")}
          >
            👥 สมาชิก
          </button>
        </div>

        <div style={{ padding: isMobile ? "10px" : "20px" }}>
          <input
            type="text"
            placeholder="🔍 ค้นหาที่นี่..."
            value={viewMode === "transactions" ? transSearch : userSearch}
            onChange={(e) =>
              viewMode === "transactions"
                ? setTransSearch(e.target.value)
                : setUserSearch(e.target.value)
            }
            style={styles.searchInput}
          />

          {viewMode === "transactions" && (
            <>
              <div style={styles.filterBar}>
                <button onClick={() => setTransFilter("all")} style={transFilter === "all" ? styles.tabActive : styles.tab}>ทั้งหมด</button>
                <button onClick={() => setTransFilter("borrowed")} style={transFilter === "borrowed" ? styles.tabActive : styles.tab}>กำลังยืม</button>
                <button onClick={() => setTransFilter("returned")} style={transFilter === "returned" ? styles.tabActive : styles.tab}>คืนแล้ว</button>
                <button onClick={() => setTransFilter("overdue")} style={transFilter === "overdue" ? styles.tabActiveRed : styles.tab}>⚠️ เกินกำหนด</button>
              </div>

              <div
                style={
                  isMobile ? styles.mobileListContainer : styles.tableContainer
                }
              >
                {isMobile ? (
                  filteredTransactions.map((item) => (
                    <div key={item.id} style={styles.mobileCard}>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "start",
                        }}
                      >
                        
                        {item.photoUrl && (
                          <img
                            src={item.photoUrl}
                            alt="book"
                            style={{
                              ...styles.mobileBookThumb,
                              cursor: "pointer",
                            }}
                            onClick={() => window.open(item.photoUrl, "_blank")}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                            {item.userName}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#444",
                              marginTop: "2px",
                            }}
                          >
                            📖 {item.bookName}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#888",
                              marginTop: "4px",
                            }}
                          >
                            📅 {formatDate(item.borrowDate)}
                          </div>
                        </div>
                        <span
                          style={
                            checkStatus(item) === "คืนแล้ว"
                              ? styles.badgeGreen
                              : checkStatus(item) === "เกินกำหนด"
                              ? styles.badgeRed
                              : styles.badgeYellow
                          }
                        >
                          {checkStatus(item)}
                        </span>
                      </div>
                      {checkStatus(item) === "เกินกำหนด" && (
                        <button
                          onClick={() => sendLineMessagingAPI(item)}
                          style={styles.btnLineMobile}
                        >
                          📢 ส่งแจ้งเตือน LINE
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>รูป</th>
                        <th style={styles.th}>ผู้ยืม</th>
                        <th style={styles.th}>หนังสือ</th>
                        <th style={styles.th}>สถานะ</th>
                        <th style={styles.th}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((item) => (
                        <tr
                          key={item.id}
                          style={{ borderBottom: "1px solid #eee" }}
                        >
                          <td style={styles.td}>
                            
                            {item.photoUrl ? (
                              <img
                                src={item.photoUrl}
                                alt="b"
                                style={{
                                  ...styles.bookThumb,
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  window.open(item.photoUrl, "_blank")
                                }
                              />
                            ) : (
                              "-"
                            )}
                          </td>
                          <td style={styles.td}>
                            <strong>{item.userName}</strong>
                            <br />
                            <small>{item.studentId}</small>
                          </td>
                          <td style={styles.td}>{item.bookName}</td>
                          <td style={styles.td}>
                            <span
                              style={
                                checkStatus(item) === "คืนแล้ว"
                                  ? styles.badgeGreen
                                  : checkStatus(item) === "เกินกำหนด"
                                  ? styles.badgeRed
                                  : styles.badgeYellow
                              }
                            >
                              {checkStatus(item)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {checkStatus(item) === "เกินกำหนด" && (
                              <button
                                onClick={() => sendLineMessagingAPI(item)}
                                style={styles.btnLine}
                              >
                                📢 แจ้ง LINE
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {viewMode === "users" && (
            <div
              style={
                isMobile ? styles.mobileListContainer : styles.tableContainer
              }
            >
              {isMobile ? (
                filteredUsers.map((user) => (
                  <div key={user.id} style={styles.mobileCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold" }}>{user.name}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          ID: {user.studentId}
                        </div>
                      </div>
                      <span style={styles.badgeClass}>
                        {user.classLevel || "-"}
                      </span>
                    </div>
                    <div
                      style={{ marginTop: "10px", display: "flex", gap: "8px" }}
                    >
                      <button
                        onClick={() => openEditModal(user)}
                        style={{ ...styles.btnActionEdit, flex: 1 }}
                      >
                        แก้ไข
                      </button>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          style={{ ...styles.btnActionDelete, flex: 1 }}
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ชื่อ-นามสกุล</th>
                      <th style={styles.th}>ชั้น</th>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        style={{ borderBottom: "1px solid #eee" }}
                      >
                        <td style={styles.td}>{user.name}</td>
                        <td style={styles.td}>{user.classLevel}</td>
                        <td style={styles.td}>{user.studentId}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => openEditModal(user)}
                            style={styles.btnActionEdit}
                          >
                            ✏️
                          </button>
                          {user.role !== "admin" && (
                            <button
                              onClick={() =>
                                handleDeleteUser(user.id, user.name)
                              }
                              style={styles.btnActionDelete}
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <div style={styles.modalOverlay}>
          <div
            style={{ ...styles.modalCard, padding: isMobile ? "15px" : "25px" }}
          >
            <h3>✏️ แก้ไขข้อมูลผู้ใช้</h3>
            <form
              onSubmit={handleSaveUser}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <label style={styles.label}>ชื่อ-นามสกุล:</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                style={styles.input}
                required
              />
              <label style={styles.label}>รหัสนักศึกษา:</label>
              <input
                type="text"
                value={editingUser.studentId}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, studentId: e.target.value })
                }
                style={styles.input}
                required
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>ระดับชั้น:</label>
                  <select
                    value={editingUser.classLevel || "ปวช.1"}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        classLevel: e.target.value,
                      })
                    }
                    style={styles.input}
                  >
                    {["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"].map((lv) => (
                      <option key={lv} value={lv}>
                        {lv}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>สถานะ:</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="student">นักเรียน</option>
                    <option value="admin">แอดมิน</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                <button type="submit" style={styles.btnSave}>
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={styles.btnCancel}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "10px",
  },
  cardFullWidth: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: "1000px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
  },
  logoutButton: {
    padding: "6px 15px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  viewToggleBar: {
    display: "flex",
    borderBottom: "1px solid #eee",
    background: "#fcfcfc",
  },
  viewButton: {
    flex: 1,
    padding: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    color: "#888",
  },
  viewButtonActive: {
    flex: 1,
    padding: "12px",
    background: "#fff",
    border: "none",
    fontWeight: "bold",
    color: "#0056b3",
    borderBottom: "3px solid #0056b3",
  },
  searchInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    marginBottom: "12px",
    fontSize: "14px",
  },
  filterBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "15px",
    overflowX: "auto",
    paddingBottom: "5px",
  },
  tab: {
    padding: "6px 12px",
    border: "1px solid #ddd",
    borderRadius: "15px",
    background: "white",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  tabActive: {
    padding: "6px 12px",
    background: "#0056b3",
    color: "white",
    borderRadius: "15px",
    border: "1px solid #0056b3",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  tabActiveRed: {
    padding: "6px 12px",
    background: "#dc3545",
    color: "white",
    borderRadius: "15px",
    border: "1px solid #dc3545",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  mobileListContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  mobileCard: {
    padding: "15px",
    background: "#fff",
    border: "1px solid #efefef",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  },
  mobileBookThumb: {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  btnLineMobile: {
    width: "100%",
    marginTop: "12px",
    padding: "10px",
    backgroundColor: "#00c300",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "13px",
  },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "15px",
    fontSize: "13px",
    color: "#666",
    borderBottom: "2px solid #eee",
    textAlign: "left",
  },
  td: { padding: "15px", fontSize: "14px", borderBottom: "1px solid #eee" },
  bookThumb: {
    width: "40px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  badgeGreen: {
    backgroundColor: "#e6f4ea",
    color: "#1e7e34",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  badgeYellow: {
    backgroundColor: "#fff9e6",
    color: "#856404",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  badgeRed: {
    backgroundColor: "#fce8e6",
    color: "#d93025",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  badgeClass: {
    backgroundColor: "#e3f2fd",
    color: "#0d47a1",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  btnLine: {
    padding: "6px 10px",
    backgroundColor: "#00c300",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  btnActionEdit: {
    padding: "8px 12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    marginRight: "5px",
  },
  btnActionDelete: {
    padding: "8px 12px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "6px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "400px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    boxSizing: "border-box",
  },
  label: {
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "4px",
    display: "block",
  },
  btnSave: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },
  btnCancel: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "8px",
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
    backgroundColor: "#f0f2f5",
    zIndex: 9999,
  },
};

export default AdminDashboard;

