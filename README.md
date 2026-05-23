# 🌸 CompetitionBoard — คู่มือการใช้งาน

## โครงสร้างไฟล์
```
backend/
  server.js       ← Express API
  package.json

frontend/
  index.html      ← หน้าแสดงรายการ (Public)
  admin.html      ← Admin Panel (จัดการข้อมูล)
```

---

## 🚀 วิธีรันโปรเจกต์

### 1. ติดตั้ง Backend
```bash
cd backend
npm install
node server.js
```
API จะรันที่ → http://localhost:3001

### 2. เปิด Frontend
เปิดไฟล์ `frontend/index.html` ในเบราว์เซอร์ หรือใช้ Live Server extension ใน VS Code

> ⚠️ ต้องเปิด backend ก่อนจะเห็นข้อมูล

---

## 🔌 API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|-----------|
| GET    | /api/competitions | ดึงรายการทั้งหมด |
| GET    | /api/competitions/:id | ดึงรายการเดียว |
| POST   | /api/competitions | เพิ่มรายการใหม่ |
| PUT    | /api/competitions/:id | แก้ไขรายการ |
| DELETE | /api/competitions/:id | ลบรายการ |
| PATCH  | /api/competitions/:id/toggle | สลับสถานะเปิด/ปิด |

---

## 📦 ขยายต่อ (Production)

- เปลี่ยน in-memory store เป็น **SQLite** หรือ **MongoDB**
- เพิ่ม **JWT Authentication** สำหรับ Admin
- Deploy backend บน **Railway / Render**
- Deploy frontend บน **Netlify / Vercel**
