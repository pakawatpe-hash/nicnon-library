import liff from "@line/liff";

const handleLineBinding = async () => {
  try {
    // 1. เริ่มต้นใช้งาน LIFF (เอา LIFF ID จากหน้า LINE Developers มาใส่)
    await liff.init({ liffId: "รหัส_LIFF_ID_ของคุณ" });

    // 2. ถ้ายังไม่ได้ Login ใน LINE ให้บังคับ Login ก่อน
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // 3. ดึงข้อมูลโปรไฟล์จาก LINE
    const profile = await liff.getProfile();
    const lineId = profile.userId; // รหัส U123... ที่เราต้องการ

    // 4. บันทึกลง Firebase (เปเปอร์ต้องมีข้อมูล user ที่ login อยู่ในมือ)
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

// ส่วนของปุ่มในหน้าเว็บ
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
