# 🏆 สูตร Deploy ฟรี: Vercel + Render + TiDB

คู่มือนี้สรุปจากคำแนะนำในกลุ่มโปรแกรมเมอร์ — **ฟรีตลอดชีพ ไม่ต้องผูกบัตร** เหมาะกับโปรเจกต์ที่ใช้ **MySQL + Node.js + React** (ปรับโค้ดน้อยที่สุด)

---

## 📦 สูตร "The Dream Team"

| ส่วน | บริการ | เหตุผล |
|------|--------|--------|
| **Database** | **TiDB Cloud** | เป็น MySQL เหมือนในเครื่อง ไม่ต้องแก้ Prisma (ถ้าใช้ Supabase/PostgreSQL ต้องแก้ schema เยอะ) + พื้นที่ฟรี 5GB |
| **Backend** | **Render** | รัน `server.js` ได้เลย ไม่ต้องแปลงเป็น Serverless เหมือน Vercel (หมายเหตุ: รอตื่นนานหน่อยเมื่อไม่มีคนเข้า) |
| **Frontend** | **Vercel** | Deploy React ง่าย เร็ว ฟรี |

---

## 🚀 ขั้นตอนทีละขั้น

### 1. จัดการฐานข้อมูล (TiDB)

1. สมัคร **TiDB Cloud**: https://tidbcloud.com (ฟรี)
2. สร้าง **Cluster** → เลือก **Serverless Tier**
3. รอสร้างเสร็จ → กด **Connect** เพื่อดู **Connection String** (รูปแบบ MySQL)
4. ในเครื่องคุณ:
   - เปิด `server/.env` เปลี่ยน `DATABASE_URL` เป็น Connection String จาก TiDB
   - รันในโฟลเดอร์ `server`:
     ```bash
     npx prisma db push
     ```
   - (หรือใช้ `npx prisma migrate deploy` ถ้าคุณใช้ migration อยู่แล้ว)
5. จดค่า `DATABASE_URL` ไว้ใส่ใน Render ในขั้นที่ 2

---

### 2. เอา Backend ขึ้น Render

1. **เอาโค้ดขึ้น GitHub** (ทั้งโปรเจกต์หรือแยก repo เฉพาะ backend ก็ได้)
   - ถ้า repo เดียว: Render จะ deploy จาก root แต่ต้องตั้ง **Root Directory** เป็น `server`
2. สมัคร **Render.com** → **New** → **Web Service**
3. เชื่อมกับ **GitHub Repo** ของโปรเจกต์
4. ตั้งค่า:
   - **Root Directory:** `server` (ถ้า repo มีทั้ง client + server)
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm start`
   - **Environment Variables** (ต้องใส่):
     - `DATABASE_URL` = Connection String จาก TiDB
     - `JWT_SECRET` = สร้างค่าสุ่มยาว ๆ ไว้ใช้ใน production
     - `CLIENT_URL` = URL ของ Frontend บน Vercel (เช่น `https://your-app.vercel.app`) — **สำคัญสำหรับ CORS และ OAuth redirect**
     - `NODE_ENV` = `production`
     - (ถ้ามี OAuth / Cloudinary / Payment) ใส่ `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` โดยให้ callback ชี้ไปที่ URL ของ Render เช่น `https://your-api.onrender.com/api/auth/google/callback`
5. Deploy เสร็จแล้วจด **URL ของ Backend** (เช่น `https://your-api.onrender.com`) ไว้ใช้ใน Frontend

---

### 3. เอา Frontend ขึ้น Vercel

1. **แก้ให้ Frontend ยิง API ไปที่ Backend บน Render**
   - ในโปรเจกต์นี้ใช้ตัวแปร **`REACT_APP_API_URL`**
   - เปิด `client/.env` หรือสร้าง `client/.env.production` ใส่:
     ```env
     REACT_APP_API_URL=https://your-api.onrender.com
     ```
   - (หรือตั้งใน Vercel → Project → Settings → Environment Variables แทนก็ได้)
2. เอาโค้ดขึ้น **GitHub** (ถ้ายังไม่ได้ push)
3. สมัคร **Vercel.com** → **Add New Project** → เลือก Repo
4. ตั้งค่า:
   - **Root Directory:** `client` (ถ้า repo มีทั้ง client + server)
   - **Environment Variables:** ใส่ `REACT_APP_API_URL=https://your-api.onrender.com`
5. กด **Deploy** — เสร็จแล้วจะได้ URL เช่น `https://your-app.vercel.app`
6. **กลับไปที่ Render** → แก้ `CLIENT_URL` ให้เป็น URL ของ Vercel นี้ (เพื่อ CORS และ OAuth)

---

## ⚠️ สิ่งที่ต้องระวัง (มักติดตรงนี้)

### CORS Error

- ในโปรเจกต์นี้ Backend อ่าน CORS จาก **`CLIENT_URL`** (รองรับหลาย URL คั่นด้วย comma)
- บน Render ต้องตั้ง **`CLIENT_URL`** = URL จริงของ Frontend บน Vercel (เช่น `https://your-app.vercel.app`)
- ตัวอย่าง: `CLIENT_URL=https://your-app.vercel.app`  
  ถ้ามีหลายโดเมน: `CLIENT_URL=https://app1.vercel.app,https://app2.vercel.app`

### Prisma Generate

- บน Render **ต้องรัน `npx prisma generate` ก่อน start** จึงต้องใส่ใน **Build Command**:  
  `npm install && npx prisma generate`

### OAuth (Google / Facebook)

- ใน Google Cloud Console / Facebook Developer ตั้ง **Authorized redirect URI** ให้ชี้ไปที่ Backend บน Render เช่น  
  `https://your-api.onrender.com/api/auth/google/callback`
- ใน `server/.env` บน Render:  
  `GOOGLE_CALLBACK_URL=https://your-api.onrender.com/api/auth/google/callback`  
  และ `CLIENT_URL` ต้องเป็น URL ของ Vercel เพื่อ redirect หลังล็อกอินสำเร็จ

### Webhook (ระบบจ่ายเงิน / แจ้งโอน)

- ถ้ามี Webhook รับแจ้งโอน (เช่น SMS / Gateway) ต้องไปตั้ง **URL ของ Webhook** ในแอปหรือระบบภายนอกให้ชี้ไปที่ **URL ของ Render** (เช่น `https://your-api.onrender.com/payments/webhook/sms`) ไม่ใช่ localhost

### Render หลับเมื่อไม่มีคนเข้า

- Free tier ของ Render จะปิด service เมื่อไม่มี request นาน ๆ พอมีคนเข้าใหม่จะรอ “ตื่น” สักพัก (cold start) เป็นเรื่องปกติ

---

## 📁 สรุป Environment Variables

### Backend (Render)

| ตัวแปร | ตัวอย่าง | หมายเหตุ |
|--------|----------|----------|
| `DATABASE_URL` | Connection String จาก TiDB | ต้องมี |
| `JWT_SECRET` | สตริงสุ่มยาว ๆ | ต้องมี |
| `CLIENT_URL` | `https://your-app.vercel.app` | สำหรับ CORS + OAuth redirect |
| `NODE_ENV` | `production` | แนะนำ |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | ตาม OAuth | ถ้าใช้ Google Login |
| อื่น ๆ | ตามที่ใช้ในโปรเจกต์ | Cloudinary, Payment, ฯลฯ |

### Frontend (Vercel)

| ตัวแปร | ตัวอย่าง | หมายเหตุ |
|--------|----------|----------|
| `REACT_APP_API_URL` | `https://your-api.onrender.com` | ต้องมี เพื่อให้ React ยิง API ไปที่ Backend |

---

## 🔗 ลิงก์ที่เกี่ยวข้อง

- TiDB Cloud: https://tidbcloud.com  
- Render: https://render.com  
- Vercel: https://vercel.com  

---

*คู่มือนี้เขียนให้ใช้กับโปรเจกต์ E-commerce (React + Node.js + Prisma/MySQL) โดยอ้างอิงจากคำแนะนำในกลุ่มโปรแกรมเมอร์ (Supasan และทีม)*
