/**
 * เพิ่มคอลัมน์ที่ขาดในฐานข้อมูลเดิม (ไม่ลบข้อมูล)
 * รัน: node scripts/add-missing-columns.js (จากโฟลเดอร์ server)
 */
require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const statements = [
  // Category
  { name: 'Category.createdAt', sql: 'ALTER TABLE `Category` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' },
  { name: 'Category.updatedAt', sql: 'ALTER TABLE `Category` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)' },
  { name: 'Category.image', sql: 'ALTER TABLE `Category` ADD COLUMN `image` VARCHAR(191) NULL' },
  // Product
  { name: 'Product.sku', sql: 'ALTER TABLE `Product` ADD COLUMN `sku` VARCHAR(191) NULL' },
  { name: 'product.createdAt', sql: 'ALTER TABLE `product` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' },
  { name: 'product.updatedAt', sql: 'ALTER TABLE `product` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)' },
  // Image
  { name: 'Image.createdAt', sql: 'ALTER TABLE `Image` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' },
  { name: 'Image.updatedAt', sql: 'ALTER TABLE `Image` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)' },
  { name: 'Image.url', sql: 'ALTER TABLE `Image` ADD COLUMN `url` VARCHAR(191) NOT NULL DEFAULT \'\'' },
  // Store
  { name: 'Store.idCard', sql: 'ALTER TABLE `Store` ADD COLUMN `idCard` VARCHAR(191) NULL' },
  { name: 'Store.address', sql: 'ALTER TABLE `Store` ADD COLUMN `address` VARCHAR(191) NULL' },
  { name: 'Store.status', sql: 'ALTER TABLE `Store` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT \'pending\'' },
  { name: 'Store.createdAt', sql: 'ALTER TABLE `Store` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' },
  { name: 'Store.updatedAt', sql: 'ALTER TABLE `Store` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)' },
  // Order (สังเกต: schema ใช้ oderStatus ไม่ใช่ orderStatus)
  { name: 'Order.oderStatus', sql: 'ALTER TABLE `Order` ADD COLUMN `oderStatus` VARCHAR(191) NOT NULL DEFAULT \'Not Process\'' },
  { name: 'Order.discountAmount', sql: 'ALTER TABLE `Order` ADD COLUMN `discountAmount` DOUBLE NOT NULL DEFAULT 0' },
  { name: 'Order.discountCode', sql: 'ALTER TABLE `Order` ADD COLUMN `discountCode` VARCHAR(191) NULL' },
  { name: 'Order.shippingAddress', sql: 'ALTER TABLE `Order` ADD COLUMN `shippingAddress` VARCHAR(191) NULL' },
  { name: 'Order.shippingPhone', sql: 'ALTER TABLE `Order` ADD COLUMN `shippingPhone` VARCHAR(191) NULL' },
  { name: 'Order.createdAt', sql: 'ALTER TABLE `Order` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' },
  { name: 'Order.updatedAt', sql: 'ALTER TABLE `Order` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)' },
  { name: 'Order.couponId', sql: 'ALTER TABLE `Order` ADD COLUMN `couponId` INTEGER NULL' },
  // ProductOnCart
  { name: 'ProductOnCart.selectedVariants', sql: 'ALTER TABLE `ProductOnCart` ADD COLUMN `selectedVariants` TEXT NULL' },
  // ProductOnOrder
  { name: 'ProductOnOrder.selectedVariants', sql: 'ALTER TABLE `ProductOnOrder` ADD COLUMN `selectedVariants` TEXT NULL' },
  // OrderReturn - ข้อพิพาท (Dispute)
  { name: 'order_returns.dispute_reason', sql: 'ALTER TABLE `order_returns` ADD COLUMN `dispute_reason` TEXT NULL' },
  { name: 'order_returns.dispute_images', sql: 'ALTER TABLE `order_returns` ADD COLUMN `dispute_images` TEXT NULL' },
];

// อัปเดต ENUM refundStatus ในตาราง order ให้รองรับ flow คืนสินค้า (แก้ 500 Data truncated)
const orderRefundStatusEnumSql = `ALTER TABLE \`order\` MODIFY COLUMN \`refundStatus\` enum('NONE','PENDING','REQUESTED','WAITING_FOR_PICKUP','RETURN_IN_TRANSIT','RETURN_DELIVERED','IN_DISPUTE','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE'`;

async function run() {
  console.log('กำลังเพิ่มคอลัมน์ที่ขาด (ข้ามถ้ามีอยู่แล้ว)...\n');
  for (const { name, sql } of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('OK:', name);
    } catch (err) {
      if (err.code === 'P2010' || err.message?.includes('Duplicate column')) {
        console.log('ข้าม (มีอยู่แล้ว):', name);
      } else {
        console.error('ผิดพลาด', name, err.message);
      }
    }
  }
  // Banner: อาจมีตารางแต่ไม่มีคอลัมน์ image (ใช้ VARCHAR เพื่อให้ DEFAULT ใช้ได้ทุก MySQL)
  // ใช้ชื่อตารางให้ตรงกับ Prisma @@map("banner") — บาง DB ใช้ banner (ตัวเล็ก)
  const bannerTable = 'banner';
  const bannerStatements = [
    { name: 'Banner.image', sql: `ALTER TABLE \`${bannerTable}\` ADD COLUMN \`image\` VARCHAR(500) NOT NULL DEFAULT ''` },
    { name: 'Banner.title', sql: `ALTER TABLE \`${bannerTable}\` ADD COLUMN \`title\` VARCHAR(191) NULL` },
    { name: 'Banner.link', sql: `ALTER TABLE \`${bannerTable}\` ADD COLUMN \`link\` VARCHAR(191) NULL` },
    { name: 'banner.position', sql: `ALTER TABLE \`${bannerTable}\` ADD COLUMN \`position\` VARCHAR(191) NOT NULL DEFAULT 'main'` },
    { name: 'Banner.order', sql: `ALTER TABLE \`${bannerTable}\` ADD COLUMN \`order\` INTEGER NOT NULL DEFAULT 0` },
    { name: 'Banner.status', sql: `ALTER TABLE \`${bannerTable}\` ADD COLUMN \`status\` BOOLEAN NOT NULL DEFAULT true` },
    { name: 'Banner.createdAt', sql: `ALTER TABLE \`${bannerTable}\` ADD COLUMN \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` },
    { name: 'Banner.updatedAt', sql: `ALTER TABLE \`${bannerTable}\` ADD COLUMN \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` },
  ];
  for (const { name, sql } of bannerStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('OK:', name);
    } catch (err) {
      if (err.code === 'P2010' || err.message?.includes('Duplicate column')) {
        console.log('ข้าม (มีอยู่แล้ว):', name);
      } else {
        console.error('ผิดพลาด', name, err.message);
      }
    }
  }
  // Order.refundStatus ENUM: เพิ่มค่า WAITING_FOR_PICKUP, RETURN_IN_TRANSIT, RETURN_DELIVERED, IN_DISPUTE (แก้ 500 ตอนเรียกไรเดอร์)
  try {
    await prisma.$executeRawUnsafe(orderRefundStatusEnumSql);
    console.log('OK: Order.refundStatus ENUM updated');
  } catch (err) {
    if (err.message && (err.message.includes('Duplicate') || err.message.includes('1265'))) {
      console.log('ข้าม (มีอยู่แล้วหรือไม่ใช่ ENUM): Order.refundStatus');
    } else {
      console.error('ผิดพลาด Order.refundStatus ENUM:', err.message);
    }
  }
  // สร้างตาราง return_pickup (งานไรเดอร์ไปรับของคืน) ถ้ายังไม่มี
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`return_pickup\` (
        \`id\` INTEGER NOT NULL AUTO_INCREMENT,
        \`orderReturnId\` INTEGER NOT NULL,
        \`pickupAddress\` TEXT NOT NULL,
        \`pickupPhone\` VARCHAR(191) NULL,
        \`storeId\` INTEGER NOT NULL,
        \`courierId\` INTEGER NULL,
        \`status\` VARCHAR(191) NOT NULL DEFAULT 'WAITING_PICKUP',
        \`proofImage\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`return_pickup_orderReturnId_idx\`(\`orderReturnId\`),
        INDEX \`return_pickup_storeId_idx\`(\`storeId\`),
        INDEX \`return_pickup_courierId_idx\`(\`courierId\`),
        INDEX \`return_pickup_status_idx\`(\`status\`),
        CONSTRAINT \`return_pickup_orderReturnId_fkey\` FOREIGN KEY (\`orderReturnId\`) REFERENCES \`order_returns\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`return_pickup_storeId_fkey\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`return_pickup_courierId_fkey\` FOREIGN KEY (\`courierId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('OK: return_pickup (table)');
  } catch (err) {
    console.log('ข้ามหรือผิดพลาด return_pickup:', err.message);
  }
  // สร้างตาราง SiteSetting และ Banner ถ้ายังไม่มี
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`SiteSetting\` (
        \`id\` INTEGER NOT NULL AUTO_INCREMENT,
        \`siteName\` VARCHAR(191) NOT NULL DEFAULT 'Boxify',
        \`description\` VARCHAR(191) NULL,
        \`contactEmail\` VARCHAR(191) NULL,
        \`contactPhone\` VARCHAR(191) NULL,
        \`address\` TEXT NULL,
        \`shippingFee\` DOUBLE NOT NULL DEFAULT 50,
        \`freeShippingThreshold\` DOUBLE NOT NULL DEFAULT 1000,
        \`facebook\` VARCHAR(191) NULL,
        \`line\` VARCHAR(191) NULL,
        \`maintenanceMode\` BOOLEAN NOT NULL DEFAULT false,
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('OK: SiteSetting (table)');
  } catch (err) {
    console.log('ข้ามหรือผิดพลาด SiteSetting:', err.message);
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`Banner\` (
        \`id\` INTEGER NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(191) NULL,
        \`image\` TEXT NOT NULL,
        \`link\` VARCHAR(191) NULL,
        \`position\` VARCHAR(191) NOT NULL DEFAULT 'main',
        \`order\` INTEGER NOT NULL DEFAULT 0,
        \`status\` BOOLEAN NOT NULL DEFAULT true,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('OK: Banner (table)');
  } catch (err) {
    console.log('ข้ามหรือผิดพลาด Banner:', err.message);
  }
  // Notification: สร้างตารางก่อน แล้วค่อยเพิ่มคอลัมน์ที่ขาด
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`Notification\` (
        \`id\` INTEGER NOT NULL AUTO_INCREMENT,
        \`type\` VARCHAR(191) NOT NULL DEFAULT 'info',
        \`title\` VARCHAR(191) NOT NULL DEFAULT '',
        \`message\` TEXT NOT NULL,
        \`isRead\` BOOLEAN NOT NULL DEFAULT false,
        \`userId\` INTEGER NULL,
        \`targetRole\` VARCHAR(191) NULL,
        \`orderId\` INTEGER NULL,
        \`paymentId\` INTEGER NULL,
        \`productId\` INTEGER NULL,
        \`storeId\` INTEGER NULL,
        \`data\` TEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('OK: Notification (table)');
  } catch (err) {
    console.log('ข้ามหรือผิดพลาด Notification table:', err.message);
  }
  const notificationStatements = [
    { name: 'Notification.type', sql: 'ALTER TABLE `Notification` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT \'info\'' },
    { name: 'Notification.title', sql: 'ALTER TABLE `Notification` ADD COLUMN `title` VARCHAR(191) NOT NULL DEFAULT \'\'' },
    { name: 'Notification.message', sql: 'ALTER TABLE `Notification` ADD COLUMN `message` VARCHAR(2000) NOT NULL DEFAULT \'\'' },
    { name: 'Notification.isRead', sql: 'ALTER TABLE `Notification` ADD COLUMN `isRead` BOOLEAN NOT NULL DEFAULT false' },
    { name: 'Notification.userId', sql: 'ALTER TABLE `Notification` ADD COLUMN `userId` INTEGER NULL' },
    { name: 'Notification.targetRole', sql: 'ALTER TABLE `Notification` ADD COLUMN `targetRole` VARCHAR(191) NULL' },
    { name: 'Notification.orderId', sql: 'ALTER TABLE `Notification` ADD COLUMN `orderId` INTEGER NULL' },
    { name: 'Notification.paymentId', sql: 'ALTER TABLE `Notification` ADD COLUMN `paymentId` INTEGER NULL' },
    { name: 'Notification.productId', sql: 'ALTER TABLE `Notification` ADD COLUMN `productId` INTEGER NULL' },
    { name: 'Notification.storeId', sql: 'ALTER TABLE `Notification` ADD COLUMN `storeId` INTEGER NULL' },
    { name: 'Notification.data', sql: 'ALTER TABLE `Notification` ADD COLUMN `data` TEXT NULL' },
    { name: 'Notification.createdAt', sql: 'ALTER TABLE `Notification` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' },
    { name: 'Notification.updatedAt', sql: 'ALTER TABLE `Notification` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)' },
  ];
  for (const { name, sql } of notificationStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('OK:', name);
    } catch (err) {
      if (err.code === 'P2010' || err.message?.includes('Duplicate column')) {
        console.log('ข้าม (มีอยู่แล้ว):', name);
      } else {
        console.error('ผิดพลาด', name, err.message);
      }
    }
  }
  await prisma.$disconnect();
}

// รันเองเมื่อเรียก node scripts/add-missing-columns.js
if (require.main === module) {
  run()
    .then(() => console.log('\nเสร็จแล้ว ลองรีสตาร์ท server แล้วโหลดหน้าเว็บใหม่'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { run };
