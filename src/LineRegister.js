import liff from "@line/liff";

const handleLineBinding = async () => {
  try {
    
    await liff.init({ liffId: "รหัส_LIFF_ID_ของคุณ" });

   
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    
    const profile = await liff.getProfile();
    const lineId = profile.userId; 

    
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, {
      lineUserId: lineId,
    });

    alert(
      "✅ ผูกบัญชี LINE สำเร็จ! คุณจะได้รับการแจ้งเตือนผ่านแชทส่วนตัวแล้วครับ"
    );
  } catch (err) {
    console.error("LIFF Error:", err);
    alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
  }
};


<button
  onClick={handleLineBinding}
  style={{
    backgroundColor: "#00c300",
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "bold",
  }}
>
  🟢 กดเพื่อรับการแจ้งเตือนผ่าน LINE
</button>;

