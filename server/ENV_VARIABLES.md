# คำอธิบายตัวแปรใน .env

คัดลอกคำอธิบายด้านล่างไปใส่เป็น comment ในไฟล์ `.env` ของคุณได้ (ใส่ `#` นำหน้าแต่ละบรรทัด)

---

```env
# ========== ฐานข้อมูล MySQL ==========
# DB_HOST=localhost          → โฮสต์ของ MySQL
# DB_PORT=3306               → พอร์ตของ MySQL (ค่าเริ่มต้น 3306)
# DB_USERNAME=root           → ชื่อผู้ใช้ MySQL
# DB_PASSWORD=               → รหัสผ่าน MySQL (ว่างถ้าไม่มี)
# DB_DATABASE=ecom1           → ชื่อฐานข้อมูลที่ใช้
# DB_SYNCHRONIZE=true        → (ใช้กับ TypeORM) ซิงค์ schema อัตโนมัติ

# Prisma ใช้ connection string นี้เท่านั้น (รวมค่าจากด้านบน)
# DATABASE_URL="mysql://user:password@host:port/database"

# ========== เซิร์ฟเวอร์ ==========
# PORT=3000                   → พอร์ตที่ backend รัน (ใช้ 3000 เพื่อให้ ngrok ชี้มาที่นี่ได้โดยไม่ต้องระบุ 5000)
# CLIENT_URL=http://localhost:3001  → URL ฝั่ง frontend (ถ้า frontend รันที่พอร์ต 3001)

# ========== JWT (ล็อกอิน/Token) ==========
# JWT_SECRET=...              → คีย์ลับสำหรับเซ็น JWT (ต้องเก็บเป็นความลับ)

# ========== Cloudinary (อัปโหลดรูป) ==========
# CLOUDINARY_CLOUD_NAME=...   → ชื่อ Cloud ของ Cloudinary
# CLOUDINARY_API_KEY=...      → API Key จาก Cloudinary
# CLOUDINARY_API_SECRET=...   → API Secret จาก Cloudinary

# ========== Stripe (ชำระเงินบัตร) ==========
# STRIPE_SECRET_KEY=...       → คีย์ลับ Stripe (Test/Live)
# STRIPE_WEBHOOK_SECRET=...    → Webhook secret สำหรับรับเหตุการณ์จาก Stripe

# ========== Google OAuth (ล็อกอินด้วย Google) ==========
# GOOGLE_CLIENT_ID=...        → Client ID จาก Google Cloud Console
# GOOGLE_CLIENT_SECRET=...     → Client Secret
# GOOGLE_CALLBACK_URL=...     → URL ที่ Google redirect หลังล็อกอินสำเร็จ

# ========== Facebook OAuth (ล็อกอินด้วย Facebook) ==========
# FACEBOOK_APP_ID=...         → App ID จาก Facebook Developers
# FACEBOOK_APP_SECRET=...      → App Secret
# FACEBOOK_CALLBACK_URL=...   → URL redirect หลังล็อกอิน Facebook

# ========== Gmail (ส่งอีเมล) ==========
# GMAIL_USER=...              → อีเมล Gmail ที่ใช้ส่ง
# GMAIL_APP_PASSWORD=...      → App Password (ไม่ใช่รหัสผ่านปกติ)

# ========== EasySlip (ตรวจสลิปโอนเงิน) ==========
# EASYSLIP_API_KEY=...        → API Key ของ EasySlip (ถ้าใช้)

# ========== PromptPay / โอนเงิน QR ==========
# PROMPTPAY_ID=...            → เบอร์โทรหรือเลข PromptPay ที่รับเงิน (ใช้สร้าง QR)

# ========== Webhook SMS (แจ้งโอนเงินอัตโนมัติ) ==========
# SMS_SECRET_KEY=...           → คีย์ลับสำหรับยืนยัน webhook ที่รับแจ้งโอนจาก SMS

# ========== AI ถามเกี่ยวกับสินค้า (ใช้ได้อย่างน้อยหนึ่งตัว) ==========
# GROQ_API_KEY=...             → API Key จาก Groq (https://console.groq.com/keys) — ใช้ก่อน ถ้ามี (โควต้า Free สูง)
# GROQ_MODEL=...                → (ไม่บังคับ) โมเดล Groq เช่น llama-3.1-8b-instant
# GEMINI_API_KEY=...            → API Key จาก Google AI Studio (https://aistudio.google.com/apikey) — ใช้เมื่อไม่มี Groq หรือ Groq ล้มเหลว
# GEMINI_MODEL=...              → (ไม่บังคับ) โมเดล Gemini เช่น gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro
```

---

## หมายเหตุ

- **อย่า commit ไฟล์ `.env` ขึ้น Git** (ควรมีใน `.gitignore` แล้ว)
- ใช้ `.env.example` เก็บเฉพาะชื่อตัวแปรและคำอธิบาย (ไม่มีค่าจริง) เพื่อให้ทีมรู้ว่าต้องตั้งค่าอะไรบ้าง
