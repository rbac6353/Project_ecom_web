# โครงสร้างตารางฐานข้อมูล ecom1 (BoxiFy)

เอกสารอธิบายตารางทั้งหมดในรูปแบบ ตารางที่ X.X — ตรงกับไฟล์ `ecom1.sql`

---

## ตารางที่ 3.1 ตาราง admin_log

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสประวัติการดำเนินการของแอดมิน | PK |
| 2 | adminId | int | NOT NULL | รหัสผู้ดูแลระบบที่ดำเนินการ | FK |
| 3 | targetId | int | NOT NULL | รหัสเป้าหมายที่ถูกดำเนินการ | |
| 4 | details | text | | รายละเอียดการดำเนินการ | |
| 5 | createdAt | datetime(6) | NOT NULL, DEFAULT | วันที่สร้างบันทึก | |
| 6 | action | varchar(255) | NOT NULL | ประเภทการกระทำ | |
| 7 | targetType | varchar(255) | NOT NULL | ประเภทเป้าหมาย (user, store ฯลฯ) | |

---

## ตารางที่ 3.2 ตาราง banner

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสแบนเนอร์ | PK |
| 2 | createdAt | datetime(6) | NOT NULL, DEFAULT | วันที่สร้าง | |
| 3 | imageUrl | varchar(255) | NOT NULL | URL รูปแบนเนอร์ | |
| 4 | isActive | tinyint | NOT NULL, DEFAULT 1 | สถานะแสดงผล (1=แสดง) | |
| 5 | displayOrder | int | DEFAULT 0 | ลำดับการแสดง | |
| 6 | title | varchar(255) | | ชื่อแบนเนอร์ | |
| 7 | link | varchar(255) | | ลิงก์เมื่อคลิก | |
| 8 | position | varchar(191) | NOT NULL, DEFAULT 'main' | ตำแหน่งบนหน้า | |
| 9 | order | int | DEFAULT 0 | ลำดับ | |
| 10 | status | tinyint(1) | NOT NULL, DEFAULT 1 | สถานะ | |
| 11 | updatedAt | datetime(3) | NOT NULL | วันที่อัปเดต | |
| 12 | image | varchar(500) | NOT NULL, DEFAULT '' | path/URL รูปภาพ | |

---

## ตารางที่ 3.3 ตาราง cart

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสตะกร้าสินค้า | PK |
| 2 | createdAt | datetime(6) | NOT NULL, DEFAULT | วันที่สร้าง | |
| 3 | updatedAt | datetime(6) | NOT NULL, ON UPDATE | วันที่อัปเดต | |
| 4 | orderedById | int | NOT NULL | รหัสผู้ใช้เจ้าของตะกร้า | FK |
| 5 | cartTotal | decimal(10,2) | NOT NULL, DEFAULT 0 | ยอดรวมในตะกร้า | |

---

## ตารางที่ 3.4 ตาราง category

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสหมวดหมู่ | PK |
| 2 | slug | varchar(255) | UNIQUE | ชื่อ slug สำหรับ URL | |
| 3 | name | varchar(255) | NOT NULL | ชื่อหมวดหมู่ | |
| 4 | image | text | | ข้อมูลรูป/ไอคอน (JSON ได้) | |
| 5 | createdAt | datetime(3) | NOT NULL | วันที่สร้าง | |
| 6 | updatedAt | datetime(3) | NOT NULL | วันที่อัปเดต | |

---

## ตารางที่ 3.5 ตาราง chat_message

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสข้อความแชท | PK |
| 2 | senderId | int | NOT NULL | รหัสผู้ส่ง | FK |
| 3 | message | text | NOT NULL | เนื้อหาข้อความ | |
| 4 | isRead | tinyint(1) | NOT NULL, DEFAULT 0 | อ่านแล้วหรือยัง | |
| 5 | createdAt | datetime(6) | NOT NULL | วันที่ส่ง | |
| 6 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 7 | roomId | varchar(255) | NOT NULL | รหัสห้องแชท | |
| 8 | type | varchar(255) | NOT NULL, DEFAULT 'text' | ประเภท (text, image ฯลฯ) | |
| 9 | imageUrl | varchar(255) | | URL รูป (ถ้าเป็นรูป) | |

---

## ตารางที่ 3.6 ตาราง coupon

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสคูปอง | PK |
| 2 | isUsed | tinyint(1) | NOT NULL, DEFAULT 0 | ใช้แล้วหรือยัง | |
| 3 | usedAt | datetime(3) | | วันที่ใช้ | |
| 4 | expiresAt | datetime(3) | | วันหมดอายุ | |
| 5 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 6 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 7 | userId | int | NOT NULL | รหัสผู้ใช้ (เจ้าของ/สร้าง) | FK |
| 8 | type | varchar(20) | NOT NULL, DEFAULT 'DISCOUNT' | ประเภทคูปอง | |
| 9 | title | varchar(255) | | ชื่อคูปอง | |
| 10 | description | text | | คำอธิบาย | |
| 11 | startDate | datetime | | วันเริ่มใช้ได้ | |
| 12 | totalQuantity | int | | จำนวนรวมที่ออก | |
| 13 | perUserLimit | int | NOT NULL, DEFAULT 1 | ใช้ได้คนละกี่ครั้ง | |
| 14 | usedCount | int | NOT NULL, DEFAULT 0 | จำนวนที่ใช้ไปแล้ว | |
| 15 | targetUsers | varchar(20) | NOT NULL, DEFAULT 'ALL' | กลุ่มเป้าหมาย | |
| 16 | categoryIds | text | | หมวดหมู่ที่ใช้ได้ (ถ้ากำหนด) | |
| 17 | storeId | int | | รหัสร้าน (ถ้าเฉพาะร้าน) | FK |
| 18 | code | varchar(255) | NOT NULL, UNIQUE | รหัสคูปอง | |
| 19 | discountAmount | decimal(10,2) | NOT NULL, DEFAULT 0 | ส่วนลดเป็นเงิน | |
| 20 | discountPercent | decimal(5,2) | | ส่วนลดเป็นเปอร์เซ็นต์ | |
| 21 | minPurchase | decimal(10,2) | | ยอดซื้อขั้นต่ำ | |
| 22 | maxDiscount | decimal(10,2) | | ส่วนลดสูงสุด (บาท) | |

---

## ตารางที่ 3.7 ตาราง faq

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัส FAQ | PK |
| 2 | answer | text | NOT NULL | คำตอบ | |
| 3 | isActive | tinyint(1) | NOT NULL, DEFAULT 1 | แสดงหรือไม่ | |
| 4 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 5 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 6 | question | varchar(255) | NOT NULL | คำถาม | |
| 7 | category | varchar(255) | NOT NULL | หมวด FAQ | |

---

## ตารางที่ 3.8 ตาราง flash_sale

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสแฟลชเซลล์ | PK |
| 2 | startTime | datetime(3) | NOT NULL | วันเวลาเริ่ม | |
| 3 | endTime | datetime(3) | NOT NULL | วันเวลาสิ้นสุด | |
| 4 | isActive | tinyint(1) | NOT NULL, DEFAULT 1 | เปิดใช้หรือไม่ | |
| 5 | description | text | | คำอธิบาย | |
| 6 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 7 | name | varchar(255) | NOT NULL | ชื่อแฟลชเซลล์ | |

---

## ตารางที่ 3.9 ตาราง shipment (การจัดส่ง)

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสการจัดส่ง | PK |
| 2 | orderId | int | NOT NULL, UNIQUE | รหัสคำสั่งซื้อที่เกี่ยวข้องกับการจัดส่ง | FK |
| 3 | courierId | int | | รหัสไรเดอร์/คนส่ง | FK |
| 4 | codAmount | decimal(10,2) | NOT NULL, DEFAULT 0 | ยอดเก็บเงินปลายทาง | |
| 5 | isCodPaid | tinyint(1) | NOT NULL, DEFAULT 0 | ชำระ COD แล้วหรือยัง | |
| 6 | latitude | decimal(10,6) | | ละติจูด (ตำแหน่ง) | |
| 7 | longitude | decimal(10,6) | | ลองจิจูด (ตำแหน่ง) | |
| 8 | pickupTime | datetime(3) | | เวลารับของที่ร้าน | |
| 9 | deliveredTime | datetime(3) | | เวลาส่งสำเร็จ | |
| 10 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 11 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 12 | status | enum | NOT NULL, DEFAULT 'WAITING_PICKUP' | สถานะของการจัดส่ง (WAITING_PICKUP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED) | |
| 13 | proofImage | varchar(255) | | URL รูปหลักฐานการส่ง | |
| 14 | signatureImage | varchar(255) | | URL รูปลายเซ็น | |
| 15 | failedReason | varchar(255) | | เหตุผลเมื่อจัดส่งไม่สำเร็จ | |

---

## ตารางที่ 3.10 ตาราง flash_sale_item

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสรายการในแฟลชเซลล์ | PK |
| 2 | flashSaleId | int | NOT NULL | รหัสแฟลชเซลล์ | FK |
| 3 | productId | int | NOT NULL | รหัสสินค้า | FK |
| 4 | discountPrice | decimal(10,2) | NOT NULL | ราคาลด | |
| 5 | limitStock | int | NOT NULL | จำนวนจำกัด | |
| 6 | sold | int | NOT NULL, DEFAULT 0 | ขายไปแล้ว | |
| 7 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |

---

## ตารางที่ 3.11 ตาราง image

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสรูปภาพ | PK |
| 2 | productId | int | NOT NULL | รหัสสินค้า | FK |
| 3 | asset_id | varchar(255) | | รหัส asset (Cloudinary ฯลฯ) | |
| 4 | public_id | varchar(255) | | public id | |
| 5 | secure_url | varchar(255) | | URL แบบ HTTPS | |
| 6 | url | varchar(255) | NOT NULL | URL รูปภาพ | |
| 7 | updatedAt | datetime(3) | NOT NULL | วันที่อัปเดต | |
| 8 | createdAt | datetime(3) | NOT NULL | วันที่สร้าง | |

---

## ตารางที่ 3.12 ตาราง notification

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสการแจ้งเตือน | PK |
| 2 | isRead | tinyint(1) | NOT NULL, DEFAULT 0 | อ่านแล้วหรือยัง | |
| 3 | userId | int | NOT NULL | รหัสผู้รับการแจ้งเตือน | FK |
| 4 | data | text | | ข้อมูลเพิ่ม (JSON) | |
| 5 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 6 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 7 | body | varchar(255) | NOT NULL | เนื้อหาสั้น | |
| 8 | title | varchar(255) | NOT NULL | หัวข้อ | |
| 9 | type | varchar(255) | | ประเภทการแจ้งเตือน | |
| 10 | message | varchar(2000) | NOT NULL, DEFAULT '' | ข้อความเต็ม | |
| 11 | targetRole | varchar(191) | | กลุ่มเป้าหมาย (role) | |
| 12 | orderId | int | | รหัสออเดอร์ที่เกี่ยวข้อง | |
| 13 | paymentId | int | | รหัสการชำระเงิน | |
| 14 | productId | int | | รหัสสินค้า | |
| 15 | storeId | int | | รหัสร้าน | |

---

## ตารางที่ 3.13 ตาราง notification_setting

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสการตั้งค่า | PK |
| 2 | userId | int | NOT NULL, UNIQUE | รหัสผู้ใช้ | FK |
| 3 | orderUpdate | tinyint(1) | NOT NULL, DEFAULT 1 | รับแจ้งอัปเดตออเดอร์ | |
| 4 | promotion | tinyint(1) | NOT NULL, DEFAULT 1 | รับแจ้งโปรโมชัน | |
| 5 | chat | tinyint(1) | NOT NULL, DEFAULT 1 | รับแจ้งแชท | |

---

## ตารางที่ 3.14 ตาราง order

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสคำสั่งซื้อ | PK |
| 2 | createdAt | datetime(6) | NOT NULL | วันที่สั่ง | |
| 3 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 4 | orderedById | int | NOT NULL | รหัสผู้สั่ง | FK |
| 5 | couponId | int | | รหัสคูปองที่ใช้ | FK |
| 6 | orderStatus | enum | NOT NULL, DEFAULT 'PENDING' | สถานะคำสั่งซื้อ (PENDING, PROCESSING, READY_FOR_PICKUP, RIDER_ASSIGNED, DELIVERED ฯลฯ) | |
| 7 | refundStatus | enum | NOT NULL, DEFAULT 'NONE' | สถานะการคืนเงิน | |
| 8 | refundReason | text | | เหตุผลคืนเงิน | |
| 9 | refundSlipUrl | varchar(255) | | URL สลิปโอนคืน | |
| 10 | refundDate | datetime | | วันที่คืนเงิน | |
| 11 | paymentMethod | varchar(255) | DEFAULT 'STRIPE' | วิธีชำระเงิน | |
| 12 | paymentExpiredAt | datetime | | วันหมดอายุการชำระ | |
| 13 | paymentSlipUrl | varchar(255) | UNIQUE | URL สลิปโอน | |
| 14 | slipReference | varchar(255) | UNIQUE | อ้างอิงสลิป | |
| 15 | trackingNumber | varchar(255) | | หมายเลขติดตามพัสดุ | |
| 16 | logisticsProvider | varchar(255) | | บริษัทขนส่ง | |
| 17 | receivedAt | datetime | | วันที่ลูกค้ารับของ | |
| 18 | confirmationDeadline | datetime | | กำหนดยืนยันรับของ | |
| 19 | isAutoCancelled | tinyint | NOT NULL, DEFAULT 0 | ยกเลิกอัตโนมัติหรือไม่ | |
| 20 | cartTotal | decimal(10,2) | NOT NULL | ยอดรวมคำสั่งซื้อ | |
| 21 | shippingAddress | varchar(255) | | ที่อยู่จัดส่ง | |
| 22 | shippingPhone | varchar(255) | | เบอร์ติดต่อจัดส่ง | |
| 23 | discountAmount | decimal(10,2) | NOT NULL, DEFAULT 0 | ส่วนลดรวม | |
| 24 | discountCode | varchar(255) | | รหัสคูปองที่ใช้ | |
| 25 | oderStatus | varchar(191) | NOT NULL, DEFAULT 'Not Process' | สถานะเดิม (legacy) | |

---

## ตารางที่ 3.15 ตาราง order_returns

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสการคืนสินค้า | PK |
| 2 | orderId | int | NOT NULL | รหัสคำสั่งซื้อ | FK |
| 3 | userId | int | NOT NULL | รหัสผู้ขอคืน | FK |
| 4 | images | text | | รูปประกอบ | |
| 5 | created_at | datetime(6) | NOT NULL | วันที่สร้าง | |
| 6 | updated_at | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 7 | reason_code | varchar(100) | | รหัสเหตุผล | |
| 8 | reason_text | text | | เหตุผลแบบข้อความ | |
| 9 | refund_amount | decimal(10,2) | | ยอดคืนเงิน | |
| 10 | admin_note | text | | หมายเหตุแอดมิน | |
| 11 | resolved_at | datetime | | วันที่ดำเนินการเสร็จ | |
| 12 | status | varchar(20) | NOT NULL, DEFAULT 'REQUESTED' | สถานะ (REQUESTED ฯลฯ) | |

---

## ตารางที่ 3.16 ตาราง order_return_items

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสรายการคืน | PK |
| 2 | orderReturnId | int | NOT NULL | รหัสการคืนสินค้า | FK |
| 3 | orderItemId | int | NOT NULL | รหัสรายการในออเดอร์ | FK |
| 4 | quantity | int | NOT NULL | จำนวนที่คืน | |
| 5 | unitPrice | decimal(10,2) | NOT NULL | ราคาต่อหน่วยตอนคืน | |

---

## ตารางที่ 3.17 ตาราง payment

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสการชำระเงิน | PK |
| 2 | amount | double | NOT NULL | จำนวนเงิน | |
| 3 | currency | varchar(191) | NOT NULL, DEFAULT 'THB' | สกุลเงิน | |
| 4 | method | varchar(191) | NOT NULL | วิธีชำระ (PROMPTPAY, COD ฯลฯ) | |
| 5 | status | varchar(191) | NOT NULL, DEFAULT 'pending' | สถานะ (pending, paid ฯลฯ) | |
| 6 | customerEmail | varchar(191) | | อีเมลลูกค้า | |
| 7 | customerName | varchar(191) | | ชื่อลูกค้า | |
| 8 | customerPhone | varchar(191) | | เบอร์โทรลูกค้า | |
| 9 | transactionId | varchar(191) | NOT NULL, UNIQUE | รหัสธุรกรรม | |
| 10 | gatewayId | varchar(191) | | รหัสจาก gateway | |
| 11 | gatewayStatus | varchar(191) | | สถานะจาก gateway | |
| 12 | metadata | varchar(191) | | ข้อมูลเพิ่ม | |
| 13 | qrCodeData | varchar(191) | | ข้อมูล QR ชำระเงิน | |
| 14 | paymentSlipUrl | varchar(191) | | URL สลิปโอน | |
| 15 | approvedBy | int | | รหัสแอดมินที่อนุมัติ | |
| 16 | approvedAt | datetime(3) | | วันที่อนุมัติ | |
| 17 | rejectedBy | int | | รหัสแอดมินที่ปฏิเสธ | |
| 18 | rejectedAt | datetime(3) | | วันที่ปฏิเสธ | |
| 19 | rejectionReason | varchar(191) | | เหตุผลปฏิเสธ | |
| 20 | createdAt | datetime(3) | NOT NULL | วันที่สร้าง | |
| 21 | updatedAt | datetime(3) | NOT NULL | วันที่อัปเดต | |
| 22 | orderId | int | NOT NULL | รหัสคำสั่งซื้อ | FK |

---

## ตารางที่ 3.18 ตาราง product

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสสินค้า | PK |
| 2 | description | text | | รายละเอียดสินค้า | |
| 3 | discountStartDate | datetime(3) | | วันเริ่มลด | |
| 4 | discountEndDate | datetime(3) | | วันสิ้นสุดลด | |
| 5 | sold | int | NOT NULL, DEFAULT 0 | จำนวนขายแล้ว | |
| 6 | quantity | int | NOT NULL | จำนวนคงเหลือ | |
| 7 | categoryId | int | NOT NULL | รหัสหมวดหมู่ | FK |
| 8 | storeId | int | | รหัสร้านค้า | FK |
| 9 | subcategoryId | int | | รหัสหมวดหมู่ย่อย | FK |
| 10 | slug | varchar(255) | UNIQUE | slug สำหรับ URL | |
| 11 | isActive | tinyint | NOT NULL, DEFAULT 1 | เปิดขายหรือไม่ | |
| 12 | subcategory | varchar(255) | | ชื่อหมวดย่อย (legacy) | |
| 13 | title | varchar(255) | NOT NULL | ชื่อสินค้า | |
| 14 | price | decimal(10,2) | NOT NULL | ราคาปกติ | |
| 15 | discountPrice | decimal(10,2) | | ราคาลด | |
| 16 | createdAt | datetime(3) | NOT NULL | วันที่สร้าง | |
| 17 | updatedAt | datetime(3) | NOT NULL | วันที่อัปเดต | |
| 18 | sku | varchar(191) | | รหัส SKU | |

---

## ตารางที่ 3.19 ตาราง productoncart

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสรายการในตะกร้า | PK |
| 2 | cartId | int | NOT NULL | รหัสตะกร้า | FK |
| 3 | productId | int | NOT NULL | รหัสสินค้า | FK |
| 4 | count | int | NOT NULL | จำนวน | |
| 5 | variantId | int | | รหัสตัวเลือกสินค้า | FK |
| 6 | price | decimal(10,2) | NOT NULL | ราคาต่อหน่วย | |
| 7 | selectedVariants | text | | ตัวเลือกที่เลือก (JSON) | |

---

## ตารางที่ 3.20 ตาราง productonorder

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสรายการในคำสั่งซื้อ | PK |
| 2 | productId | int | NOT NULL | รหัสสินค้า | FK |
| 3 | orderId | int | NOT NULL | รหัสคำสั่งซื้อ | FK |
| 4 | count | int | NOT NULL | จำนวน | |
| 5 | variantId | int | | รหัสตัวเลือก | FK |
| 6 | price | decimal(10,2) | NOT NULL | ราคาต่อหน่วย | |
| 7 | selectedVariants | text | | ตัวเลือกที่สั่ง | |

---

## ตารางที่ 3.21 ตาราง product_variant

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสตัวเลือกสินค้า | PK |
| 2 | productId | int | NOT NULL | รหัสสินค้า | FK |
| 3 | price | decimal(10,2) | | ราคาของตัวเลือกนี้ | |
| 4 | stock | int | NOT NULL | จำนวนคงเหลือ | |
| 5 | imageIndex | int | | ดัชนีรูปที่ใช้ | |
| 6 | attributes | json | | คุณสมบัติ (สี ไซส์ ฯลฯ) | |
| 7 | name | varchar(255) | NOT NULL | ชื่อตัวเลือก | |
| 8 | sku | varchar(64) | | รหัส SKU | |

---

## ตารางที่ 3.22 ตาราง recently_viewed

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสบันทึก | PK |
| 2 | userId | int | NOT NULL | รหัสผู้ใช้ | FK |
| 3 | productId | int | NOT NULL | รหัสสินค้าที่ดู | FK |
| 4 | viewedAt | datetime(6) | NOT NULL, ON UPDATE | วันที่ดูล่าสุด | |

---

## ตารางที่ 3.23 ตาราง review

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสรีวิว | PK |
| 2 | rating | int | NOT NULL | คะแนน (1–5) | |
| 3 | createdAt | datetime(6) | NOT NULL | วันที่รีวิว | |
| 4 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 5 | userId | int | NOT NULL | รหัสผู้รีวิว | FK |
| 6 | productId | int | NOT NULL | รหัสสินค้า | FK |
| 7 | storeId | int | | รหัสร้าน | FK |
| 8 | orderItemId | int | NOT NULL | รหัสรายการในออเดอร์ | |
| 9 | sellerReply | text | | คำตอบจากร้าน | |
| 10 | isEdited | tinyint | NOT NULL, DEFAULT 0 | แก้ไขแล้วหรือไม่ | |
| 11 | isHidden | tinyint | NOT NULL, DEFAULT 0 | ซ่อนหรือไม่ | |
| 12 | comment | text | | ข้อความรีวิว | |
| 13 | images | text | | รูปประกอบ | |

---

## ตารางที่ 3.24 ตาราง review_report

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสรายงาน | PK |
| 2 | reviewId | int | NOT NULL | รหัสรีวิวที่ถูกรายงาน | FK |
| 3 | reporterId | int | NOT NULL | รหัสผู้รายงาน | FK |
| 4 | reason | text | NOT NULL | เหตุผล | |
| 5 | createdAt | datetime(6) | NOT NULL | วันที่รายงาน | |
| 6 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 7 | status | enum | NOT NULL, DEFAULT 'PENDING' | สถานะ (PENDING, RESOLVED, REJECTED) | |

---

## ตารางที่ 3.25 ตาราง sitesetting

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสการตั้งค่า | PK |
| 2 | siteName | varchar(191) | NOT NULL, DEFAULT 'Boxify' | ชื่อเว็บไซต์ | |
| 3 | description | varchar(191) | | คำอธิบายเว็บ | |
| 4 | contactEmail | varchar(191) | | อีเมลติดต่อ | |
| 5 | contactPhone | varchar(191) | | เบอร์ติดต่อ | |
| 6 | address | text | | ที่อยู่ | |
| 7 | shippingFee | double | NOT NULL, DEFAULT 50 | ค่าจัดส่ง (บาท) | |
| 8 | freeShippingThreshold | double | NOT NULL, DEFAULT 1000 | ยอดขั้นต่ำส่งฟรี (บาท) | |
| 9 | facebook | varchar(191) | | ลิงก์ Facebook | |
| 10 | line | varchar(191) | | ลิงก์ LINE | |
| 11 | maintenanceMode | tinyint(1) | NOT NULL, DEFAULT 0 | โหมดซ่อมบำรุง | |
| 12 | updatedAt | datetime(3) | NOT NULL | วันที่อัปเดต | |

---

## ตารางที่ 3.26 ตาราง store

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสร้านค้า | PK |
| 2 | ownerId | int | NOT NULL | รหัสเจ้าของร้าน | FK |
| 3 | isVerified | tinyint | NOT NULL, DEFAULT 0 | ยืนยันตัวตนแล้วหรือไม่ | |
| 4 | rating | decimal(3,2) | NOT NULL, DEFAULT 0 | คะแนนร้าน | |
| 5 | followerCount | int | NOT NULL, DEFAULT 0 | จำนวนผู้ติดตาม | |
| 6 | isActive | tinyint | NOT NULL, DEFAULT 1 | เปิดร้านหรือไม่ | |
| 7 | isMall | tinyint | NOT NULL, DEFAULT 0 | เป็นร้าน Mall หรือไม่ | |
| 8 | name | varchar(255) | NOT NULL | ชื่อร้าน | |
| 9 | description | text | | คำอธิบายร้าน | |
| 10 | logo | varchar(255) | | URL โลโก้ | |
| 11 | createdAt | datetime(3) | NOT NULL | วันที่สร้าง | |
| 12 | updatedAt | datetime(3) | NOT NULL | วันที่อัปเดต | |
| 13 | idCard | varchar(191) | | เลขบัตรประชาชน | |
| 14 | address | varchar(191) | | ที่อยู่ร้าน | |
| 15 | status | varchar(191) | NOT NULL, DEFAULT 'pending' | สถานะการอนุมัติ (pending, approved ฯลฯ) | |

---

## ตารางที่ 3.27 ตาราง store_follower

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสความสัมพันธ์ | PK |
| 2 | userId | int | NOT NULL | รหัสผู้ใช้ | FK |
| 3 | storeId | int | NOT NULL | รหัสร้าน | FK |
| 4 | createdAt | datetime(6) | NOT NULL | วันที่ติดตาม | |

---

## ตารางที่ 3.28 ตาราง store_wallet

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสกระเป๋าร้าน | PK |
| 2 | balance | decimal(10,2) | NOT NULL, DEFAULT 0 | ยอดคงเหลือ | |
| 3 | storeId | int | NOT NULL, UNIQUE | รหัสร้าน | FK |
| 4 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 5 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |

---

## ตารางที่ 3.29 ตาราง store_wallet_transaction

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสธุรกรรม | PK |
| 2 | walletId | int | NOT NULL | รหัสกระเป๋าร้าน | FK |
| 3 | amount | decimal(10,2) | NOT NULL | จำนวนเงิน | |
| 4 | createdAt | datetime(6) | NOT NULL | วันที่ทำรายการ | |
| 5 | type | enum | NOT NULL | ประเภท (SALE_REVENUE, WITHDRAWAL, ADJUSTMENT) | |
| 6 | referenceId | varchar(255) | | รหัสอ้างอิง | |
| 7 | description | varchar(255) | | คำอธิบาย | |

---

## ตารางที่ 3.30 ตาราง store_withdrawal_request

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสคำขอถอน | PK |
| 2 | storeId | int | NOT NULL | รหัสร้าน | FK |
| 3 | walletId | int | NOT NULL | รหัสกระเป๋าร้าน | FK |
| 4 | amount | decimal(10,2) | NOT NULL | จำนวนที่ขอถอน | |
| 5 | adminNote | text | | หมายเหตุแอดมิน | |
| 6 | processedBy | int | | รหัสแอดมินที่ดำเนินการ | |
| 7 | processedAt | datetime(3) | | วันที่ดำเนินการ | |
| 8 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 9 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 10 | status | enum | NOT NULL, DEFAULT 'PENDING' | สถานะ (PENDING, APPROVED, REJECTED) | |
| 11 | bankName | varchar(255) | | ชื่อธนาคาร | |
| 12 | accountNumber | varchar(255) | | เลขบัญชี | |
| 13 | accountName | varchar(255) | | ชื่อบัญชี | |
| 14 | proofImage | varchar(255) | | URL รูปหลักฐาน | |

---

## ตารางที่ 3.31 ตาราง subcategory

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสหมวดหมู่ย่อย | PK |
| 2 | iconImageUrl | text | | URL ไอคอน | |
| 3 | categoryId | int | NOT NULL | รหัสหมวดหมู่หลัก | FK |
| 4 | storeId | int | | รหัสร้าน (ถ้าเฉพาะร้าน) | |
| 5 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 6 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 7 | name | varchar(255) | NOT NULL | ชื่อหมวดย่อย | |
| 8 | iconType | varchar(255) | NOT NULL, DEFAULT 'emoji' | ประเภทไอคอน | |
| 9 | iconEmoji | varchar(255) | | ไอคอนแบบ emoji | |
| 10 | iconIonicon | varchar(255) | | ไอคอนแบบ ionicon | |

---

## ตารางที่ 3.32 ตาราง tracking_history

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสประวัติติดตาม | PK |
| 2 | orderId | int | NOT NULL | รหัสคำสั่งซื้อ | FK |
| 3 | createdAt | datetime(6) | NOT NULL | วันที่บันทึก | |
| 4 | status | varchar(255) | NOT NULL | สถานะ (ข้อความ) | |
| 5 | title | varchar(255) | NOT NULL | หัวข้อ | |
| 6 | description | varchar(255) | | คำอธิบาย | |
| 7 | location | varchar(255) | | สถานที่ | |

---

## ตารางที่ 3.33 ตาราง user

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสผู้ใช้ | PK |
| 2 | enabled | tinyint(1) | NOT NULL, DEFAULT 1 | เปิดใช้งานหรือไม่ | |
| 3 | createdAt | datetime(6) | NOT NULL | วันที่สมัคร | |
| 4 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 5 | notificationToken | varchar(255) | | Token สำหรับ push notification | |
| 6 | resetPasswordToken | varchar(255) | | Token รีเซ็ตรหัสผ่าน | |
| 7 | resetPasswordExpires | datetime | | วันหมดอายุ token รีเซ็ต | |
| 8 | isEmailVerified | tinyint | NOT NULL, DEFAULT 0 | ยืนยันอีเมลแล้วหรือไม่ | |
| 9 | verificationToken | varchar(255) | | Token ยืนยันอีเมล | |
| 10 | googleId | varchar(255) | UNIQUE | รหัสจาก Google OAuth | |
| 11 | facebookId | varchar(255) | UNIQUE | รหัสจาก Facebook | |
| 12 | points | int | NOT NULL, DEFAULT 0 | คะแนนสะสม | |
| 13 | email | varchar(255) | NOT NULL, UNIQUE | อีเมล | |
| 14 | password | varchar(255) | | รหัสผ่าน (hash) | |
| 15 | name | varchar(255) | | ชื่อ | |
| 16 | picture | varchar(255) | | URL รูปโปรไฟล์ | |
| 17 | role | varchar(255) | NOT NULL, DEFAULT 'user' | บทบาท (user, admin, seller, courier ฯลฯ) | |
| 18 | address | varchar(255) | | ที่อยู่ | |
| 19 | phone | varchar(255) | | เบอร์โทร | |

---

## ตารางที่ 3.34 ตาราง user_coupon

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสความสัมพันธ์ | PK |
| 2 | userId | int | NOT NULL | รหัสผู้ใช้ | FK |
| 3 | couponId | int | NOT NULL | รหัสคูปอง | FK |
| 4 | isUsed | tinyint(1) | NOT NULL, DEFAULT 0 | ใช้แล้วหรือยัง | |
| 5 | usedAt | datetime(3) | | วันที่ใช้ | |
| 6 | usedInOrderId | int | | รหัสออเดอร์ที่ใช้ | |
| 7 | collectedAt | datetime(6) | NOT NULL | วันที่เก็บคูปอง | |
| 8 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 9 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |

---

## ตารางที่ 3.35 ตาราง wallet

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสกระเป๋าเงิน | PK |
| 2 | userId | int | NOT NULL, UNIQUE | รหัสผู้ใช้ | FK |
| 3 | balance | decimal(10,2) | NOT NULL, DEFAULT 0 | ยอดคงเหลือ | |
| 4 | createdAt | datetime(6) | NOT NULL | วันที่สร้าง | |
| 5 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 6 | status | enum | NOT NULL, DEFAULT 'ACTIVE' | สถานะ (ACTIVE, FROZEN) | |

---

## ตารางที่ 3.36 ตาราง wallet_transaction

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสธุรกรรม | PK |
| 2 | walletId | int | NOT NULL | รหัสกระเป๋าเงิน | FK |
| 3 | amount | decimal(10,2) | NOT NULL | จำนวนเงิน | |
| 4 | referenceId | varchar(255) | | รหัสอ้างอิง | |
| 5 | description | varchar(255) | | คำอธิบาย | |
| 6 | createdAt | datetime(6) | NOT NULL | วันที่ทำรายการ | |
| 7 | updatedAt | datetime(6) | NOT NULL | วันที่อัปเดต | |
| 8 | type | enum | NOT NULL | ประเภท (DEPOSIT, WITHDRAW, PAYMENT, REFUND) | |

---

## ตารางที่ 3.37 ตาราง wishlist

| No. | Field | Data type | Properties | คำอธิบาย | KEY |
|-----|--------|-----------|------------|----------|-----|
| 1 | id | int | AUTO_INCREMENT | รหัสรายการในวินลิสต์ | PK |
| 2 | userId | int | NOT NULL | รหัสผู้ใช้ | FK |
| 3 | productId | int | NOT NULL | รหัสสินค้า | FK |
| 4 | createdAt | datetime(6) | NOT NULL | วันที่เพิ่ม | |

---

**หมายเหตุ:** ตาราง **shipment** (ตารางที่ 3.9 ในเอกสารนี้) ใช้เก็บข้อมูลการจัดส่ง 1:1 กับคำสั่งซื้อ คล้ายกับตาราง Express ในภาพอ้างอิง (express_id, order_id, tracking_number, express_status, express_date, express_time, carrier_name) โดยใน ecom1 ใช้ชื่อฟิลด์เป็น orderId, status, courierId, proofImage ฯลฯ แทน
