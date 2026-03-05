/**
 * ตั้งค่า user เป็น role 'courier' (บัญชีขนส่ง) เพื่อเข้าใช้หน้าไรเดอร์ได้
 * ใช้: node scripts/make-rider.js [email]
 * ตัวอย่าง: node scripts/make-rider.js courier@gmail.com
 */
const prisma = require('../config/prisma');

const email = process.argv[2] || process.env.COURIER_EMAIL;

async function makeCourier() {
  try {
    if (!email) {
      console.log('ใช้: node scripts/make-rider.js <email>');
      console.log('ตัวอย่าง: node scripts/make-rider.js courier@gmail.com');
      process.exit(1);
    }

    console.log('🛵 ตั้งสิทธิ์ผู้ใช้เป็น Courier (ขนส่ง)...\n');
    const user = await prisma.user.findFirst({
      where: { email: email.trim() },
    });

    if (!user) {
      console.log('❌ ไม่พบผู้ใช้ที่อีเมล:', email);
      process.exit(1);
    }

    console.log('👤 พบผู้ใช้:', user.name, '(', user.email, ')');
    console.log('🔒 สิทธิ์ปัจจุบัน:', user.role);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'courier', enabled: true },
    });

    console.log('✅ อัพเดตสิทธิ์สำเร็จ!');
    console.log('🛵 สิทธิ์ใหม่:', updated.role);
    console.log('\n🌐 เข้าใช้หน้าขนส่ง: /rider/dashboard หรือเมนู Rider Dashboard');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeCourier();
