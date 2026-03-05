/**
 * ระบบคืนสินค้า/คืนเงิน — รับประกัน 7 วัน, แจ้งเตือนร้านค้าเมื่อมีคำขอคืน
 */
const prisma = require('../config/prisma');
const { refundAmountToCustomerWallet } = require('./order');
const { createNotification } = require('./notification');

const RETURN_DAYS = 7;

const getBaseUrl = () => {
  const url = process.env.SERVER_URL || process.env.CLIENT_URL || 'http://localhost:3000';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

/** อัปโหลดรูปหลักฐานขอคืนสินค้า — ใช้ก่อน POST /return */
exports.uploadReturnProof = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
  }
  const base = getBaseUrl();
  const urls = req.files.map((f) => `${base}/uploads/return-proofs/${f.filename}`);
  return res.status(200).json({ urls, proofImageUrl: urls[0] });
};

/** อัปโหลดสลิปโอนเงินคืน — ใช้ก่อน PUT return-status (อนุมัติ) */
exports.uploadRefundSlip = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'กรุณาเลือกไฟล์สลิปโอนเงิน' });
  }
  const base = getBaseUrl();
  const refundSlipUrl = `${base}/uploads/refund-slips/${req.file.filename}`;
  return res.status(200).json({ refundSlipUrl });
}; // รับประกันคืนสินค้าภายใน 7 วัน

/** ลูกค้าสร้างคำขอคืนสินค้า (เฉพาะออเดอร์ที่จัดส่งแล้ว และภายใน 7 วันจากวันรับของ)
 * รองรับ payload: { reason, returnItems, proofImageUrl } หรือ { reason_text, reason_code, images, items }
 */
exports.createReturnRequest = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.id;
    let { reason_code, reason_text, images, items, reason, returnItems, proofImageUrl } = req.body;
    // รองรับ payload ตามสเปก API: reason, returnItems, proofImageUrl
    if (reason != null) reason_text = reason_text || reason;
    if (Array.isArray(returnItems) && returnItems.length > 0) items = returnItems;
    if (proofImageUrl != null) images = typeof proofImageUrl === 'string' ? proofImageUrl : (Array.isArray(proofImageUrl) ? proofImageUrl : [proofImageUrl]);

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        products: { include: { product: { select: { storeId: true, title: true } } } },
        orderReturns: { where: { status: 'REQUESTED' }, take: 1 },
        shipment: { select: { deliveredTime: true } },
      },
    });

    if (!order) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    const orderOwnerId = Number(order.orderedById);
    const currentUserId = Number(userId);
    if (orderOwnerId !== currentUserId) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ขอคืนสินค้าของคำสั่งซื้อนี้ (เฉพาะผู้สั่งซื้อเท่านั้นที่ขอคืนได้)' });
    }

    const allowStatuses = ['DELIVERED', 'COMPLETED'];
    if (!allowStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        message: 'ขอคืนสินค้าได้เฉพาะคำสั่งซื้อที่จัดส่งสำเร็จแล้ว',
      });
    }

    // รับประกัน 7 วัน: ใช้เฉพาะเมื่อมีวันรับของชัดเจน (receivedAt หรือ deliveredTime)
    const receivedDate = order.receivedAt || order.shipment?.deliveredTime || null;
    if (receivedDate) {
      const daysSinceReceived = (Date.now() - new Date(receivedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceReceived > RETURN_DAYS) {
        return res.status(400).json({
          message: `เกินระยะเวลารับประกันคืนสินค้า ${RETURN_DAYS} วันแล้ว (รับของเมื่อ ${new Date(receivedDate).toLocaleDateString('th-TH')})`,
        });
      }
    }
    // ถ้าไม่มี receivedAt/deliveredTime (ออเดอร์เก่า) อนุญาตให้ขอคืนได้

    if (order.orderReturns?.length > 0) {
      return res.status(400).json({ message: 'มีคำขอคืนสินค้าของออเดอร์นี้อยู่แล้ว รอแอดมินพิจารณา' });
    }

    if (!reason_text && !reason_code) {
      return res.status(400).json({ message: 'กรุณากรอกเหตุผลการขอคืนสินค้า' });
    }

    const itemList = Array.isArray(items) && items.length > 0
      ? items
      : order.products.map((p) => ({ orderItemId: p.id, quantity: p.count || 1 }));

    let refundAmount = 0;
    const validItems = [];
    for (const it of itemList) {
      const line = order.products.find((p) => p.id === parseInt(it.orderItemId));
      if (!line) continue;
      const qty = Math.min(parseInt(it.quantity, 10) || 1, line.count || 1);
      validItems.push({ orderItemId: line.id, quantity: qty, unitPrice: line.price });
      refundAmount += Number(line.price) * qty;
    }

    if (validItems.length === 0) {
      return res.status(400).json({ message: 'กรุณาเลือกรายการสินค้าที่ต้องการคืนอย่างน้อย 1 รายการ' });
    }

    const [orderReturn] = await prisma.$transaction([
      prisma.orderReturn.create({
        data: {
          orderId,
          userId,
          reason_code: reason_code || null,
          reason_text: reason_text || null,
          images: typeof images === 'string' ? images : (images ? JSON.stringify(images) : null),
          refund_amount: refundAmount,
          status: 'REQUESTED',
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'REFUND_REQUESTED',
          refundStatus: 'REQUESTED',
          refundReason: reason_text || reason_code || 'ลูกค้าขอคืนสินค้า',
        },
      }),
    ]);

    await prisma.orderReturnItem.createMany({
      data: validItems.map((v) => ({
        orderReturnId: orderReturn.id,
        orderItemId: v.orderItemId,
        quantity: v.quantity,
        unitPrice: v.unitPrice,
      })),
    });

    const full = await prisma.orderReturn.findUnique({
      where: { id: orderReturn.id },
      include: {
        order: { select: { id: true, orderStatus: true } },
        items: { include: { orderItem: { include: { product: { select: { title: true } } } } } },
      },
    });

    // แจ้งเตือนร้านค้า + สร้างงานไรเดอร์รับสินค้าคืน
    const storeIds = [...new Set((order.products || [])
      .map((p) => p.product?.storeId)
      .filter(Boolean))];
    const pickupAddress = order.shippingAddress || order.orderedBy?.address || '';
    const pickupPhone = order.shippingPhone || order.orderedBy?.phone || null;

    for (const storeId of storeIds) {
      try {
        const store = await prisma.store.findUnique({
          where: { id: storeId },
          select: { id: true, name: true, ownerId: true },
        });
        if (store?.ownerId) {
          await createNotification(
            'return_request',
            '📦 มีคำขอคืนสินค้า',
            `ลูกค้าขอคืนสินค้าจากออเดอร์ #${orderId} (ร้าน ${store.name}) กรุณาตรวจสอบในเมนูแอดมิน`,
            {
              userId: store.ownerId,
              orderId,
              storeId: store.id,
              data: { orderReturnId: orderReturn.id, orderId },
            }
          );
        }
      } catch (notifyErr) {
        console.error('Notify store return request:', notifyErr);
      }
    }

    // สร้างงานไรเดอร์: ไปรับสินค้าคืนที่อยู่ลูกค้า → ส่งคืนร้าน (ใช้ร้านแรกที่เกี่ยวข้อง)
    if (storeIds.length > 0 && pickupAddress.trim()) {
      try {
        await prisma.returnPickup.create({
          data: {
            orderReturnId: orderReturn.id,
            pickupAddress: pickupAddress.trim(),
            pickupPhone,
            storeId: storeIds[0],
            status: 'WAITING_PICKUP',
          },
        });
      } catch (pickupErr) {
        console.error('Create return pickup job:', pickupErr);
      }
    }

    return res.status(201).json({
      message: 'ส่งคำขอคืนสินค้าเรียบร้อย รอแอดมินพิจารณา (รับประกัน 7 วัน)',
      orderReturn: full,
    });
  } catch (err) {
    console.error('createReturnRequest error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งคำขอคืนสินค้า' });
  }
};

/** ลูกค้าดูคำขอคืนของตัวเอง */
exports.getMyReturnRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const list = await prisma.orderReturn.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderStatus: true,
            refundStatus: true,
            cartTotal: true,
            createdAt: true,
          },
        },
        returnPickups: {
          orderBy: { id: 'desc' },
          take: 1,
          select: { id: true, status: true, courierId: true },
        },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { id: true, title: true, images: true } },
              },
            },
          },
        },
      },
    });
    return res.status(200).json({ orderReturns: list });
  } catch (err) {
    console.error('getMyReturnRequests error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดรายการขอคืน' });
  }
};

/** ดึงคำขอคืนของออเดอร์หนึ่ง (ลูกค้า/แอดมิน) */
exports.getReturnByOrderId = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderedById: true },
    });
    if (!order) return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    if (!isAdmin && order.orderedById !== userId) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
    }

    const orderReturns = await prisma.orderReturn.findMany({
      where: { orderId },
      orderBy: { created_at: 'desc' },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { id: true, title: true, images: true } },
              },
            },
          },
        },
      },
    });
    return res.status(200).json({ orderReturns });
  } catch (err) {
    console.error('getReturnByOrderId error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

/** ร้านค้า: รายการคำขอคืนที่เกี่ยวกับออเดอร์ของร้านนี้ (ดูได้อย่างเดียว แอดมินเป็นคนอนุมัติ/ปฏิเสธ)
 * ใช้ logic เดียวกับ getStoreOrders — หา orderId ที่มีสินค้าของร้าน (กรองใน memory เหมือน getStoreOrders) แล้วดึง OrderReturn
 */
exports.sellerListReturns = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
    });
    if (!store) {
      return res.status(404).json({ message: 'ยังไม่มีร้านค้า' });
    }

    // ดึง orders พร้อม products แล้วกรองเฉพาะออเดอร์ที่มีสินค้าของร้าน (ใช้ include อย่างเดียว ห้ามใช้ select+include พร้อมกัน)
    const allOrders = await prisma.order.findMany({
      include: {
        products: {
          include: {
            product: { select: { storeId: true } },
          },
        },
      },
    });
    // ใช้การเปรียบเทียบแบบเดียวกับ getStoreOrders + รองรับ type (number/string จาก DB)
    const storeIdVal = store.id;
    const orderIds = allOrders
      .filter((order) =>
        (order.products || []).some(
          (item) =>
            item.product != null &&
            item.product.storeId != null &&
            (Number(item.product.storeId) === Number(storeIdVal) ||
              String(item.product.storeId) === String(storeIdVal)),
        ),
      )
      .map((o) => o.id);
    if (orderIds.length === 0) {
      return res.status(200).json({ orderReturns: [] });
    }

    const status = req.query.status; // REQUESTED | APPROVED | REJECTED | ไม่ส่ง = ทั้งหมด
    const where = { orderId: { in: orderIds } };
    if (status && ['REQUESTED', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const list = await prisma.orderReturn.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderStatus: true,
            refundStatus: true,
            cartTotal: true,
            createdAt: true,
            orderedBy: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { id: true, title: true, storeId: true } },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ orderReturns: list });
  } catch (err) {
    console.error('sellerListReturns error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดรายการขอคืน' });
  }
};

/** แอดมิน: รายการคำขอคืนทั้งหมด
 * Query: status = REQUESTED | APPROVED | REJECTED
 *        refundStatus = IN_DISPUTE (รายการที่ร้านแจ้งข้อพิพาท)
 */
exports.adminListReturns = async (req, res) => {
  try {
    const status = req.query.status; // REQUESTED | APPROVED | REJECTED
    const refundStatus = req.query.refundStatus; // IN_DISPUTE สำหรับ Dispute Management

    const where = {};
    if (status && ['REQUESTED', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }
    if (refundStatus === 'IN_DISPUTE') {
      where.order = { refundStatus: 'IN_DISPUTE' };
    }

    const list = await prisma.orderReturn.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderStatus: true,
            refundStatus: true,
            cartTotal: true,
            createdAt: true,
            orderedBy: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });
    return res.status(200).json({ orderReturns: list });
  } catch (err) {
    console.error('adminListReturns error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดรายการขอคืน' });
  }
};

/** ร้านค้า/แอดมิน: เรียกไรเดอร์ไปรับของคืน
 * PUT /api/orders/:orderId/return-call-rider
 * อัปเดต refundStatus = 'WAITING_FOR_PICKUP' และสร้าง/อัปเดต ReturnPickup ให้โผล่ในแอปไรเดอร์
 */
exports.returnCallRider = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' });
    }

    const orderReturn = await prisma.orderReturn.findFirst({
      where: { orderId, status: 'REQUESTED' },
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            refundStatus: true,
            shippingAddress: true,
            shippingPhone: true,
            orderedBy: { select: { address: true, phone: true } },
          },
        },
      },
    });

    if (!orderReturn) {
      return res.status(404).json({ message: 'ไม่พบคำขอคืนที่รอพิจารณาสำหรับออเดอร์นี้' });
    }

    const order = orderReturn.order;
    const pickupAddress = order.shippingAddress || order.orderedBy?.address || '';
    const pickupPhone = order.shippingPhone || order.orderedBy?.phone || null;

    if (!pickupAddress.trim()) {
      return res.status(400).json({ message: 'ไม่มีที่อยู่สำหรับให้ไรเดอร์ไปรับของคืน' });
    }

    const orderWithProducts = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        products: { include: { product: { select: { storeId: true } } } },
      },
    });
    const storeIds = [...new Set((orderWithProducts?.products || []).map((p) => p.product?.storeId).filter(Boolean))];
    const storeId = storeIds[0];
    if (!storeId) {
      return res.status(400).json({ message: 'ไม่พบร้านค้าที่เกี่ยวข้อง' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { refundStatus: 'WAITING_FOR_PICKUP' },
      });
      const existing = await tx.returnPickup.findFirst({
        where: { orderReturnId: orderReturn.id },
      });
      if (existing) {
        await tx.returnPickup.update({
          where: { id: existing.id },
          data: { status: 'WAITING_PICKUP', pickupAddress: pickupAddress.trim(), pickupPhone },
        });
      } else {
        await tx.returnPickup.create({
          data: {
            orderReturnId: orderReturn.id,
            pickupAddress: pickupAddress.trim(),
            pickupPhone,
            storeId,
            status: 'WAITING_PICKUP',
          },
        });
      }
    });

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, refundStatus: true },
    });
    return res.status(200).json({
      message: 'เรียกไรเดอร์ไปรับของคืนแล้ว งานจะโผล่ในแอปไรเดอร์',
      order: updated,
    });
  } catch (err) {
    console.error('returnCallRider error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเรียกไรเดอร์' });
  }
};

/** ไรเดอร์: อัปเดตสถานะการรับของคืน
 * PUT /api/orders/:orderId/return-rider-status
 * Body: { status: 'RETURN_IN_TRANSIT' | 'RETURN_DELIVERED', proofImageUrl?: string }
 * บันทึก tracking_history ด้วย
 */
exports.returnRiderStatus = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status, proofImageUrl } = req.body;
    const riderId = req.user.id;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' });
    }
    if (!status || !['RETURN_IN_TRANSIT', 'RETURN_DELIVERED'].includes(status)) {
      return res.status(400).json({ message: 'กรุณาระบุ status เป็น RETURN_IN_TRANSIT หรือ RETURN_DELIVERED' });
    }
    if (status === 'RETURN_DELIVERED' && !proofImageUrl) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดรูปหลักฐานการส่งของคืนร้าน' });
    }

    const pickup = await prisma.returnPickup.findFirst({
      where: {
        orderReturn: { orderId },
        courierId: riderId,
      },
      include: { orderReturn: { select: { orderId: true } } },
    });

    if (!pickup) {
      return res.status(404).json({ message: 'ไม่พบงานรับของคืนที่คุณรับไว้สำหรับออเดอร์นี้' });
    }

    const titles = {
      RETURN_IN_TRANSIT: 'ไรเดอร์รับของจากลูกค้าแล้ว',
      RETURN_DELIVERED: 'ไรเดอร์ส่งของคืนร้านแล้ว',
    };
    const descriptions = {
      RETURN_IN_TRANSIT: 'กำลังนำสินค้าคืนไปส่งที่ร้าน',
      RETURN_DELIVERED: 'ส่งสินค้าคืนถึงร้านแล้ว',
    };

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          refundStatus: status,
          ...(status === 'RETURN_DELIVERED' && { refundDate: new Date() }),
        },
      });
      await tx.trackingHistory.create({
        data: {
          orderId,
          status,
          title: titles[status],
          description: descriptions[status],
        },
      });
      const updateData = {
        status: status === 'RETURN_IN_TRANSIT' ? 'PICKED_UP' : 'DELIVERED',
        ...(proofImageUrl && { proofImage: proofImageUrl }),
      };
      await tx.returnPickup.update({
        where: { id: pickup.id },
        data: updateData,
      });
    });

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, refundStatus: true },
    });
    return res.status(200).json({
      message: status === 'RETURN_DELIVERED' ? 'บันทึกส่งของคืนร้านเรียบร้อย' : 'บันทึกรับของจากลูกค้าแล้ว',
      order: updated,
    });
  } catch (err) {
    console.error('returnRiderStatus error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
  }
};

/** ร้านค้า/แอดมิน: อนุมัติคืนเงิน (ได้เมื่อ refundStatus = RETURN_DELIVERED เท่านั้น)
 * PUT /api/orders/:orderId/return-approve
 * Body: { status: 'APPROVED' | 'REJECTED' }
 * เมื่อ APPROVED: คืนเงินเข้า Wallet ลูกค้า, หักจาก store_wallet, คืนสต็อก product (ใน transaction เดียว)
 */
exports.returnApprove = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' });
    }
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'กรุณาระบุ status เป็น APPROVED หรือ REJECTED' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, refundStatus: true },
    });
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }

    const orderReturn = await prisma.orderReturn.findFirst({
      where: { orderId, status: { in: ['REQUESTED', 'APPROVED', 'REJECTED'] } },
      orderBy: { created_at: 'desc' },
      include: {
        order: { select: { id: true, orderedById: true, orderStatus: true, cartTotal: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { id: true, storeId: true, quantity: true } },
              },
            },
          },
        },
      },
    });

    if (!orderReturn) {
      return res.status(404).json({ message: 'ไม่พบคำขอคืนสำหรับออเดอร์นี้' });
    }

    const allowApproveStatuses = ['RETURN_DELIVERED', 'IN_DISPUTE'];
    if (status === 'APPROVED' && !allowApproveStatuses.includes(order.refundStatus)) {
      return res.status(400).json({
        message: 'อนุมัติคืนเงินได้เมื่อไรเดอร์ส่งของคืนร้านแล้ว (RETURN_DELIVERED) หรืออยู่ระหว่างข้อพิพาท (IN_DISPUTE) เท่านั้น',
      });
    }

    const allowRejectStatuses = ['REQUESTED', 'WAITING_FOR_PICKUP', 'RETURN_IN_TRANSIT', 'RETURN_DELIVERED', 'IN_DISPUTE'];
    if (status === 'REJECTED' && !allowRejectStatuses.includes(order.refundStatus)) {
      return res.status(400).json({ message: 'สถานะปัจจุบันไม่สามารถปฏิเสธได้' });
    }

    const now = new Date();
    const returnId = orderReturn.id;
    const refundAmount = Number(orderReturn.refund_amount ?? orderReturn.order.cartTotal ?? 0);

    if (status === 'REJECTED') {
      await prisma.$transaction([
        prisma.orderReturn.update({
          where: { id: returnId },
          data: { status: 'REJECTED', resolved_at: now },
        }),
        prisma.order.update({
          where: { id: orderId },
          data: {
            refundStatus: 'REJECTED',
            refundReason: orderReturn.reason_text || orderReturn.reason_code || null,
          },
        }),
      ]);
      const updated = await prisma.orderReturn.findUnique({
        where: { id: returnId },
        include: { order: { select: { id: true, orderStatus: true, refundStatus: true } } },
      });
      return res.status(200).json({
        message: 'ปฏิเสธคำขอคืนแล้ว',
        orderReturn: updated,
      });
    }

    // APPROVED: Wallet + หักร้าน + คืนสต็อก ใน transaction เดียว
    const refId = `return_${returnId}`;
    const existingRefund = await prisma.walletTransaction.findFirst({
      where: { referenceId: refId, type: 'REFUND' },
    });
    if (existingRefund) {
      return res.status(400).json({ message: 'คำขอนี้ดำเนินการคืนเงินแล้ว' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. อัปเดต order + order_return
      await tx.orderReturn.update({
        where: { id: returnId },
        data: { status: 'APPROVED', resolved_at: now },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'REFUNDED',
          refundStatus: 'APPROVED',
          refundReason: orderReturn.reason_text || orderReturn.reason_code || null,
          refundDate: now,
        },
      });

      // 2. คืนเงินเข้า Wallet ลูกค้า
      if (refundAmount > 0) {
        let wallet = await tx.wallet.findUnique({
          where: { userId: orderReturn.order.orderedById },
        });
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: orderReturn.order.orderedById, balance: 0, status: 'ACTIVE' },
          });
        }
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: refundAmount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: refundAmount,
            type: 'REFUND',
            referenceId: refId,
            description: `คืนเงินจากคำขอคืนสินค้า #${returnId} (ออเดอร์ #${orderId})`,
          },
        });
      }

      // 3. หักจาก store_wallet ตามสัดส่วนรายการที่คืน
      const byStore = {};
      for (const item of orderReturn.items || []) {
        const storeId = item.orderItem?.product?.storeId;
        if (storeId == null) continue;
        const amt = Number(item.quantity || 0) * Number(item.unitPrice || 0);
        if (amt <= 0) continue;
        byStore[storeId] = (byStore[storeId] || 0) + amt;
      }
      for (const [storeId, amount] of Object.entries(byStore)) {
        if (amount <= 0) continue;
        const storeIdNum = Number(storeId);
        let storeWallet = await tx.storeWallet.findUnique({
          where: { storeId: storeIdNum },
        });
        if (!storeWallet) continue;
        await tx.storeWallet.update({
          where: { id: storeWallet.id },
          data: { balance: { decrement: amount } },
        });
        await tx.storeWalletTransaction.create({
          data: {
            walletId: storeWallet.id,
            amount,
            type: 'WITHDRAWAL',
            referenceId: refId,
            description: `หักคืนเงินลูกค้า (คำขอคืน #${returnId})`,
          },
        });
      }

      // 4. คืนสต็อก product
      for (const item of orderReturn.items || []) {
        const productId = item.orderItem?.product?.id;
        const qty = Number(item.quantity || 0);
        if (!productId || qty <= 0) continue;
        await tx.product.update({
          where: { id: productId },
          data: { quantity: { increment: qty } },
        });
      }
    });

    const updated = await prisma.orderReturn.findUnique({
      where: { id: returnId },
      include: {
        order: { select: { id: true, orderStatus: true, refundStatus: true, refundDate: true } },
      },
    });
    return res.status(200).json({
      message: 'อนุมัติคืนเงินแล้ว เงินเข้า Wallet ลูกค้า',
      orderReturn: updated,
    });
  } catch (err) {
    console.error('returnApprove error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดำเนินการ' });
  }
};

/** ร้านค้า: แจ้งข้อพิพาท/ส่งเรื่องให้แอดมิน (เมื่อ refundStatus = RETURN_DELIVERED)
 * PUT /api/orders/:orderId/return-dispute
 * Body: { reason: string, imageUrls?: string[] }
 */
exports.returnDispute = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { reason, imageUrls } = req.body;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' });
    }
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกเหตุผลการแจ้งปัญหา' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, refundStatus: true },
    });
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }
    if (order.refundStatus !== 'RETURN_DELIVERED') {
      return res.status(400).json({
        message: 'แจ้งข้อพิพาทได้เฉพาะเมื่อสถานะเป็น "ส่งของถึงร้านแล้ว (RETURN_DELIVERED)" เท่านั้น',
      });
    }

    const orderReturn = await prisma.orderReturn.findFirst({
      where: { orderId, status: 'REQUESTED' },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    });
    if (!orderReturn) {
      return res.status(404).json({ message: 'ไม่พบคำขอคืนสำหรับออเดอร์นี้' });
    }

    const disputeImagesJson = Array.isArray(imageUrls) && imageUrls.length > 0
      ? JSON.stringify(imageUrls)
      : null;

    await prisma.$transaction([
      prisma.orderReturn.update({
        where: { id: orderReturn.id },
        data: {
          dispute_reason: reason.trim(),
          dispute_images: disputeImagesJson,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { refundStatus: 'IN_DISPUTE' },
      }),
    ]);

    const updated = await prisma.orderReturn.findUnique({
      where: { id: orderReturn.id },
      include: {
        order: { select: { id: true, refundStatus: true } },
      },
    });
    return res.status(200).json({
      message: 'ส่งเรื่องข้อพิพาทให้แอดมินพิจารณาแล้ว',
      orderReturn: updated,
    });
  } catch (err) {
    console.error('returnDispute error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดำเนินการ' });
  }
};

/** ร้านค้า/แอดมิน: อัปเดตสถานะคำขอคืนตาม orderId (PUT /api/orders/:orderId/return-status)
 * Body: { status: 'APPROVED' | 'REJECTED', refundSlipUrl?: string } — refundSlipUrl บังคับเมื่อ APPROVED
 */
exports.updateReturnStatusByOrderId = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status, refundSlipUrl } = req.body;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' });
    }
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'กรุณาระบุ status เป็น APPROVED หรือ REJECTED' });
    }
    if (status === 'APPROVED' && !refundSlipUrl) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดสลิปโอนเงินคืนก่อนอนุมัติ' });
    }

    const orderReturn = await prisma.orderReturn.findFirst({
      where: { orderId, status: 'REQUESTED' },
      orderBy: { created_at: 'desc' },
      include: { order: true },
    });

    if (!orderReturn) {
      return res.status(404).json({ message: 'ไม่พบคำขอคืนที่รอพิจารณาสำหรับออเดอร์นี้' });
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.orderReturn.update({
        where: { id: orderReturn.id },
        data: {
          status,
          resolved_at: now,
          ...(refundSlipUrl && { admin_note: `สลิปโอนเงิน: ${refundSlipUrl}` }),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: status === 'APPROVED' ? 'REFUNDED' : orderReturn.order.orderStatus,
          refundStatus: status,
          refundReason: orderReturn.reason_text || orderReturn.reason_code || null,
          refundDate: status === 'APPROVED' ? now : null,
          ...(refundSlipUrl && { refundSlipUrl }),
        },
      }),
    ]);

    if (status === 'APPROVED') {
      const amount = Number(orderReturn.refund_amount ?? orderReturn.order.cartTotal ?? 0);
      if (amount > 0) {
        await refundAmountToCustomerWallet(
          orderReturn.orderId,
          amount,
          `return_${orderReturn.id}`,
          `คืนเงินจากคำขอคืนสินค้า #${orderReturn.id} (ออเดอร์ #${orderReturn.orderId})`,
        ).catch((e) => console.error('refundAmountToCustomerWallet:', e));
      }
    }

    const updated = await prisma.orderReturn.findUnique({
      where: { id: orderReturn.id },
      include: {
        order: { select: { id: true, orderStatus: true, refundStatus: true } },
      },
    });

    return res.status(200).json({
      message: status === 'APPROVED' ? 'อนุมัติคืนเงินแล้ว' : 'ปฏิเสธคำขอคืนแล้ว',
      orderReturn: updated,
    });
  } catch (err) {
    console.error('updateReturnStatusByOrderId error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดำเนินการ' });
  }
};

/** แอดมิน: อนุมัติหรือปฏิเสธคำขอคืน */
exports.adminResolveReturn = async (req, res) => {
  try {
    const returnId = parseInt(req.params.id);
    const { action, admin_note, refundSlipUrl } = req.body; // action: 'APPROVED' | 'REJECTED'

    if (!returnId || !['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });
    }

    const orderReturn = await prisma.orderReturn.findUnique({
      where: { id: returnId },
      include: { order: true },
    });

    if (!orderReturn) return res.status(404).json({ message: 'ไม่พบคำขอคืนนี้' });
    if (orderReturn.status !== 'REQUESTED') {
      return res.status(400).json({ message: 'คำขอนี้ได้รับการดำเนินการแล้ว' });
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.orderReturn.update({
        where: { id: returnId },
        data: {
          status: action,
          admin_note: admin_note || null,
          resolved_at: now,
        },
      }),
      prisma.order.update({
        where: { id: orderReturn.orderId },
        data: {
          orderStatus: action === 'APPROVED' ? 'REFUNDED' : orderReturn.order.orderStatus,
          refundStatus: action,
          refundReason: orderReturn.reason_text || orderReturn.reason_code || null,
          refundDate: action === 'APPROVED' ? now : null,
          ...(refundSlipUrl && { refundSlipUrl }),
        },
      }),
    ]);

    if (action === 'APPROVED') {
      const amount = Number(orderReturn.refund_amount ?? orderReturn.order.cartTotal ?? 0);
      if (amount > 0) {
        await refundAmountToCustomerWallet(
          orderReturn.orderId,
          amount,
          `return_${returnId}`,
          `คืนเงินจากคำขอคืนสินค้า #${returnId} (ออเดอร์ #${orderReturn.orderId})`,
        ).catch((e) => console.error('refundAmountToCustomerWallet:', e));
      }
    }

    const updated = await prisma.orderReturn.findUnique({
      where: { id: returnId },
      include: {
        order: { select: { id: true, orderStatus: true, refundStatus: true } },
      },
    });

    return res.status(200).json({
      message: action === 'APPROVED' ? 'อนุมัติคำขอคืนเงินแล้ว คืนเงินเข้ากระเป๋าลูกค้า' : 'ปฏิเสธคำขอคืนแล้ว',
      orderReturn: updated,
    });
  } catch (err) {
    console.error('adminResolveReturn error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดำเนินการ' });
  }
};
