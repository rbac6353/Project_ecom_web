/**
 * อัปเดต product.sku จาก product_variant (ใช้ SKU ตัวแรกของแต่ละ product)
 * ใช้ Prisma model ProductVariant
 *
 * รัน: node scripts/sync-product-sku-from-variant.js (จากโฟลเดอร์ server)
 */
require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function run() {
  console.log('กำลัง sync product.sku จาก product_variant (Prisma ProductVariant)...\n');

  try {
    const variants = await prisma.productVariant.findMany({
      where: { sku: { not: null } },
      select: { productId: true, sku: true },
      orderBy: { sku: 'asc' }
    });
    const skuByProductId = {};
    for (const v of variants) {
      if (v.sku != null && String(v.sku).trim()) {
        const id = v.productId;
        if (!skuByProductId[id]) skuByProductId[id] = String(v.sku).trim();
      }
    }
    let updated = 0;
    for (const [productIdStr, sku] of Object.entries(skuByProductId)) {
      const productId = parseInt(productIdStr, 10);
      const p = await prisma.product.findUnique({
        where: { id: productId },
        select: { sku: true }
      });
      if (p && (!p.sku || p.sku.trim() === '')) {
        await prisma.product.update({
          where: { id: productId },
          data: { sku }
        });
        updated++;
      }
    }
    console.log('อัปเดต product.sku สำเร็จ จำนวนแถวที่เปลี่ยน:', updated);
    if (updated === 0) {
      console.log('(ไม่มี product ที่ sku เป็น NULL และมี variant ที่มี sku)');
    }
  } catch (err) {
    if (err.code === 'P2021') {
      console.log('ตาราง product_variant ไม่พบใน DB (รัน npx prisma generate แล้วหรือยัง?)');
      return;
    }
    console.error('เกิดข้อผิดพลาด:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
