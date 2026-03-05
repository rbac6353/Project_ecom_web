## วิธีรัน BoxiFy

ครั้งแรก: `npm install` ใน `server` และ `client`

**1. Backend**
```bash
cd server
npm start
```
→ พอร์ต 3000

**2. Frontend**
```bash
cd client
npm start
```
→ พอร์ต 3001 → เปิด http://localhost:3001

**3. Webhook ชำระเงิน (SMS / ngrok)**  
- รัน `ngrok http 3000` แล้วใช้ URL ที่ได้ (เช่น `https://xxxx.ngrok-free.dev`) ไปตั้งในแอปดัก SMS
- Webhook รับเฉพาะ **POST** ที่ `https://<ngrok-url>/api/payments/webhook/sms`
- Body (JSON): `transactionId` หรือ `orderId` ใช้จับคู่ payment ที่รอชำระ (ถ้าไม่ส่ง จะใช้รายการรอชำระตัวแรก)

**ทดสอบ Webhook โดยไม่ต้องรอ SMS จริง**
1. เปิดหน้าชำระเงิน QR ของออเดอร์หนึ่ง (จดเลข **orderId** จาก URL เช่น `/payment/39` → orderId = 39)
2. รันคำสั่งนี้ (เปลี่ยน `ORDER_ID` และ `NGROK_URL` ให้ตรง):

```bash
curl -X POST "https://NGROK_URL/api/payments/webhook/sms" -H "Content-Type: application/json" -d "{\"orderId\": ORDER_ID}"
```

3. ภายในประมาณ 5 วินาที หน้าชำระเงินควรแสดง "ชำระเรียบร้อยแล้ว" และเด้งไปหน้าสำเร็จ (เพราะมี polling ทุก 5 วินาที)

**ถ้าสแกน QR จริงแล้วไม่มีอะไรเกิดขึ้น**
- ใน log ของ ngrok ต้องมี request เข้ามา (POST) — ถ้าไม่มี แปลว่าแอปบนมือถือยังไม่ยิง request มา (เช็ค trigger เมื่อได้ SMS, สิทธิ์แอป, วิธีส่งต้องเป็น POST)
- ถ้ามี POST แล้วแต่หน้าเว็บไม่เปลี่ยน: เช็คว่า backend รันอยู่ และ body ส่ง `orderId` หรือ `transactionId` มาถูกต้อง
