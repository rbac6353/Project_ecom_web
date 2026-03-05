# Scripts สำหรับจัดการข้อมูล

## 📋 Scripts ที่มี

### 1. `create-admin.js` - สร้าง Admin User
สร้างหรืออัพเดต Admin User ในระบบ

**วิธีใช้:**
```bash
cd server
node scripts/create-admin.js
```

หรือระบุ email และ password:
```bash
node scripts/create-admin.js admin@gmail.com admin123
```

หรือระบุ email, password และ name:
```bash
node scripts/create-admin.js admin@gmail.com admin123 "Admin Name"
```

**ผลลัพธ์:**
- สร้าง Admin User ใหม่ (ถ้ายังไม่มี)
- อัพเดต User ที่มีอยู่เป็น Admin (ถ้ามี email อยู่แล้ว)
- แสดงรายชื่อ Admin ทั้งหมดในระบบ

---

### 2. `check-products.js` - ตรวจสอบข้อมูลสินค้า
ตรวจสอบว่ามีสินค้าในฐานข้อมูลหรือไม่ และแสดงสถิติต่างๆ

**วิธีใช้:**
```bash
cd server
node scripts/check-products.js
```

**ผลลัพธ์:**
- จำนวนสินค้าทั้งหมด
- สถิติสินค้า (มีรูปภาพ, มีส่วนลด, มีสต็อก, ฯลฯ)
- สินค้าตามหมวดหมู่
- สินค้าล่าสุด 10 รายการ

---

### 3. `export-products.js` - Export ข้อมูลสินค้า
Export ข้อมูลสินค้าทั้งหมดจากฐานข้อมูลเป็นไฟล์ JSON และ CSV

**วิธีใช้:**
```bash
cd server
node scripts/export-products.js
```

**ผลลัพธ์:**
- ไฟล์ JSON: `exports/products_export_<timestamp>.json`
- ไฟล์ CSV: `exports/products_export_<timestamp>.csv`

**ข้อมูลที่ Export:**
- ข้อมูลสินค้าทั้งหมด (title, price, quantity, ฯลฯ)
- รูปภาพสินค้า
- หมวดหมู่
- ข้อมูลร้านค้า

---

### 4. `restore-products.js` - Restore ข้อมูลสินค้า
Restore ข้อมูลสินค้าจากไฟล์ JSON ที่ export มา

**วิธีใช้:**
```bash
cd server
node scripts/restore-products.js <path-to-json-file>
```

**ตัวอย่าง:**
```bash
node scripts/restore-products.js exports/products_export_2024-01-01.json
```

**หมายเหตุ:**
- จะข้ามสินค้าที่มี ID ซ้ำ (ไม่แทนที่ข้อมูลเดิม)
- ต้องมี category ในฐานข้อมูลก่อน
- จะสร้างรูปภาพใหม่ถ้ามีข้อมูลรูปภาพ

---

### 5. `sync-product-sku-from-variant.js` - Sync SKU จาก product_variant ไป product
อัปเดต `product.sku` จากตาราง `product_variant` (ใช้ SKU ตัวแรกของแต่ละสินค้า)  
ใช้เมื่อใน DB มีตาราง `product_variant` (เช่นจาก ecom1.sql) แต่ `product.sku` เป็น NULL จึงไม่แสดงบนเว็บ

**วิธีใช้:**
```bash
cd server
node scripts/sync-product-sku-from-variant.js
```

**ผลลัพธ์:** สินค้าที่มี variant มี SKU จะได้ค่า `product.sku` อัปเดต แล้วหน้าเว็บจะแสดงรหัส SKU แทน #id

---

## 🔧 ข้อกำหนด

1. ต้องมีไฟล์ `.env` ในโฟลเดอร์ `server` พร้อม `DATABASE_URL`
2. ต้องรัน Prisma generate ก่อน:
   ```bash
   cd server
   npx prisma generate
   ```

---

## 📝 ตัวอย่างการใช้งาน

### สร้าง Admin User
```bash
cd server
node scripts/create-admin.js admin@gmail.com admin123
```

### ตรวจสอบข้อมูลสินค้า
```bash
cd server
node scripts/check-products.js
```

### Export ข้อมูลสินค้า
```bash
cd server
node scripts/export-products.js
```

### Restore ข้อมูลสินค้า
```bash
cd server
node scripts/restore-products.js exports/products_export_2024-01-01.json
```

---

## ⚠️ คำเตือน

- **Backup ฐานข้อมูลก่อน restore** ถ้าต้องการแทนที่ข้อมูลเดิม
- Script restore จะ**ไม่ลบข้อมูลเดิม** แต่จะข้ามสินค้าที่มี ID ซ้ำ
- ตรวจสอบไฟล์ JSON ก่อน restore เพื่อให้แน่ใจว่าข้อมูลถูกต้อง

---

## 🆘 แก้ไขปัญหา

### ไม่พบสินค้าในฐานข้อมูล
1. ตรวจสอบว่า database connection ถูกต้อง
2. ตรวจสอบว่า Prisma schema ตรงกับฐานข้อมูล
3. ใช้ `check-products.js` เพื่อตรวจสอบ

### Export ไม่สำเร็จ
1. ตรวจสอบว่าโฟลเดอร์ `exports` มีสิทธิ์เขียนไฟล์
2. ตรวจสอบว่า database connection ทำงาน

### Restore ไม่สำเร็จ
1. ตรวจสอบว่าไฟล์ JSON ถูกต้อง
2. ตรวจสอบว่า category ที่ระบุใน JSON มีอยู่ในฐานข้อมูล
3. ตรวจสอบ console log เพื่อดู error message
