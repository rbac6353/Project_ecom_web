/**
 * ตั้ง orderStatus (Logistics) กลับเป็น PENDING สำหรับออเดอร์ที่ถูกตั้งเป็น PROCESSING จาก payment โดย mistake
 * ใช้เมื่อร้านยังไม่กด "ยืนยันรับออเดอร์" แต่ปุ่ม "แจ้งหาไรเดอร์" โผล่มา
 * ใช้: node scripts/fix-order-logistics-status.js <orderId>
 * ตัวอย่าง: node scripts/fix-order-logistics-status.js 8
 */
const prisma = require('../config/prisma');

const orderId = process.argv[2] ? parseInt(process.argv[2], 10) : null;

async function main() {
  if (!orderId || Number.isNaN(orderId)) {
    console.log('ใช้: node scripts/fix-order-logistics-status.js <orderId>');
    console.log('ตัวอย่าง: node scripts/fix-order-logistics-status.js 8');
    process.exit(1);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderStatus: true, oderStatus: true }
  });

  if (!order) {
    console.log('ไม่พบออเดอร์ #' + orderId);
    process.exit(1);
  }

  if (order.orderStatus === 'PENDING') {
    console.log('ออเดอร์ #' + orderId + ' อยู่ที่ PENDING อยู่แล้ว ไม่ต้องแก้');
    process.exit(0);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { orderStatus: 'PENDING' }
  });

  console.log('อัปเดตออเดอร์ #' + orderId + ' จาก ' + order.orderStatus + ' เป็น PENDING แล้ว');
  console.log('(oderStatus ยังเป็น "' + order.oderStatus + '" ตามเดิม)');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
