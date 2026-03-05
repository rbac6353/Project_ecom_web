/**
 * Logistics & Order Status - สำหรับร้านค้า/แอดมิน
 * อัปเดต orderStatus และสร้าง shipment เมื่อ READY_FOR_PICKUP
 */
const prisma = require('../config/prisma');
const { creditStoreWalletsForOrder } = require('./payment');

/**
 * คืนเงินเข้ากระเป๋าลูกค้าเมื่อออเดอร์ถูกยกเลิก (และเคยชำระผ่าน QR/ออนไลน์แล้ว)
 * กันเครดิตซ้ำด้วย referenceId = orderId + type REFUND
 */
async function refundToCustomerWallet(orderId) {
  const existing = await prisma.walletTransaction.findFirst({
    where: { referenceId: String(orderId), type: 'REFUND' },
  });
  if (existing) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { where: { status: 'completed' }, take: 1 },
      orderedBy: { select: { id: true } },
    },
  });
  if (!order || !order.orderedById) return;
  const completed = order.payments?.[0];
  if (!completed) return;
  const amount = Number(completed.amount ?? order.cartTotal ?? 0);
  if (amount <= 0) return;

  let wallet = await prisma.wallet.findUnique({
    where: { userId: order.orderedById },
  });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: order.orderedById, balance: 0, status: 'ACTIVE' },
    });
  }

  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'REFUND',
        referenceId: String(orderId),
        description: `คืนเงินจากยกเลิกออเดอร์ #${orderId}`,
      },
    }),
  ]);
}

exports.refundToCustomerWallet = refundToCustomerWallet;

/**
 * คืนเงินจำนวนที่กำหนดเข้ากระเป๋าลูกค้าตามออเดอร์ (ใช้กับคำขอคืนสินค้า)
 * referenceId ต้องไม่ซ้ำ เช่น return_<returnId>
 */
async function refundAmountToCustomerWallet(orderId, amount, referenceId, description) {
  if (!amount || amount <= 0) return;
  const existing = await prisma.walletTransaction.findFirst({
    where: { referenceId, type: 'REFUND' },
  });
  if (existing) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderedBy: { select: { id: true } } },
  });
  if (!order || !order.orderedById) return;

  let wallet = await prisma.wallet.findUnique({
    where: { userId: order.orderedById },
  });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: order.orderedById, balance: 0, status: 'ACTIVE' },
    });
  }

  const value = Number(amount);
  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: value } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: value,
        type: 'REFUND',
        referenceId,
        description: description || `คืนเงินจากคำขอคืนสินค้า ออเดอร์ #${orderId}`,
      },
    }),
  ]);
}

exports.refundAmountToCustomerWallet = refundAmountToCustomerWallet;

/**
 * ดึงรายละเอียดออเดอร์ตาม id (GET /orders/:id)
 * ลูกค้าดูได้เฉพาะของตัวเอง; แอดมิน/ร้านค้า/ไรเดอร์ ตามสิทธิ์
 */
exports.getOrderById = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderedBy: {
          select: {
            id: true,
            email: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
                storeId: true,
                store: { select: { id: true, name: true } },
              },
            },
          },
        },
        shipment: {
          include: {
            courier: { select: { id: true, name: true, phone: true } },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }

    const isOwner = req.user.id === order.orderedById;
    const isStaff = ['admin', 'seller', 'courier'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูคำสั่งซื้อนี้' });
    }

    return res.status(200).json({
      message: 'ดึงรายละเอียดคำสั่งซื้อสำเร็จ',
      order,
    });
  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายละเอียดคำสั่งซื้อ' });
  }
};

// สถานะที่ร้านค้าสามารถเปลี่ยนได้ (ก่อนส่งให้ไรเดอร์)
const STORE_ALLOWED_STATUSES = [
  'PROCESSING',
  'READY_FOR_PICKUP',
  'CANCELLED',
  'CANCELLATION_REQUESTED',
];

// ลำดับ Step สำหรับแสดงใน UI (Backend Enum -> Thai Label)
const ORDER_STATUS_STEPS = [
  { status: 'PENDING', label: 'สั่งซื้อสำเร็จ' },
  { status: 'PENDING_CONFIRMATION', label: 'ชำระเงินเรียบร้อย' },
  { status: 'PROCESSING', label: 'ร้านค้ายืนยันรับออเดอร์แล้ว' },
  { status: 'READY_FOR_PICKUP', label: 'สินค้าพร้อมแล้ว กำลังหาไรเดอร์' },
  { status: 'RIDER_ASSIGNED', label: 'ไรเดอร์กำลังไปรับสินค้า' },
  { status: 'PICKED_UP', label: 'ไรเดอร์รับสินค้าแล้ว' },
  { status: 'OUT_FOR_DELIVERY', label: 'กำลังจัดส่งถึงคุณ' },
  { status: 'COMPLETED', label: 'จัดส่งสำเร็จ' },
];

// สถานะคำสั่งซื้อ ตามโครงสร้าง ecom1 (ใช้สำหรับ validation + tracking title)
const ORDER_STATUS_LABELS = {
  PENDING: ORDER_STATUS_STEPS[0].label,
  VERIFYING: 'รอแอดมินตรวจสอบสลิปการโอนเงิน',
  PENDING_CONFIRMATION: ORDER_STATUS_STEPS[1].label,
  PROCESSING: ORDER_STATUS_STEPS[2].label,
  READY_FOR_PICKUP: ORDER_STATUS_STEPS[3].label,
  RIDER_ASSIGNED: ORDER_STATUS_STEPS[4].label,
  PICKED_UP: ORDER_STATUS_STEPS[5].label,
  SHIPPED: 'สินค้าอยู่ระหว่างการขนส่งโดยไรเดอร์',
  OUT_FOR_DELIVERY: ORDER_STATUS_STEPS[6].label,
  DELIVERED: 'ไรเดอร์ส่งสินค้าถึงมือลูกค้าเรียบร้อยแล้ว',
  COMPLETED: ORDER_STATUS_STEPS[7].label,
  CANCELLED: 'คำสั่งซื้อถูกยกเลิก',
  CANCELLATION_REQUESTED: 'ลูกค้าส่งคำขอยกเลิกคำสั่งซื้อ',
  REFUND_REQUESTED: 'ลูกค้าแจ้งขอคืนเงิน',
  REFUNDED: 'คืนเงินให้ลูกค้าเรียบร้อยแล้ว',
};

/**
 * เพิ่มประวัติ tracking (รับ tx ถ้าอยู่ใน transaction)
 */
async function addTrackingHistory(orderId, status, title, description = null, location = null, tx = null) {
  const client = tx || prisma;
  await client.trackingHistory.create({
    data: {
      orderId,
      status,
      title,
      description: description || null,
      location: location || null,
    },
  });
}

/**
 * อัปเดตสถานะคำสั่งซื้อ (ร้านค้า/แอดมิน)
 * Body: { status, trackingNumber?, provider? } — กรณีส่งเองส่ง status: SHIPPED พร้อม trackingNumber, provider
 * เมื่อเปลี่ยนเป็น READY_FOR_PICKUP จะสร้าง shipment อัตโนมัติและบันทึก log "กำลังค้นหาคนขับ"
 */
exports.updateStatus = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, trackingNumber, provider } = req.body;

    if (!status || !ORDER_STATUS_LABELS[status]) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    // ร้านค้า/แอดมิน เปลี่ยนได้เฉพาะบางสถานะ (หรือให้แอดมินเปลี่ยนได้ทุกสถานะ)
    const isAdmin = req.user.role === 'admin';
    const allowedForStore = [...STORE_ALLOWED_STATUSES, 'SHIPPED'];
    if (!isAdmin && !allowedForStore.includes(status)) {
      return res.status(403).json({
        message: 'ร้านค้าสามารถเปลี่ยนได้เฉพาะ: ' + allowedForStore.join(', '),
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }

    const previousStatus = order.orderStatus;

    const updateData = { orderStatus: status };
    if (status === 'SHIPPED' && (trackingNumber != null || provider != null)) {
      if (trackingNumber != null) updateData.trackingNumber = String(trackingNumber);
      if (provider != null) updateData.logisticsProvider = String(provider);
    }

    // อัปเดต orderStatus ใน transaction แบบสั้น (ไม่ดึง include เยอะ) เพื่อไม่ให้ timeout
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      await addTrackingHistory(
        orderId,
        status,
        ORDER_STATUS_LABELS[status] || status,
        `เปลี่ยนสถานะจาก ${previousStatus} เป็น ${status}`,
        null,
        tx
      );

      if (status === 'READY_FOR_PICKUP' && !order.shipment) {
        await tx.shipment.create({
          data: {
            orderId,
            status: 'WAITING_PICKUP',
            codAmount: 0,
          },
        });
        await tx.trackingHistory.create({
          data: {
            orderId,
            status: 'READY_FOR_PICKUP',
            title: 'กำลังค้นหาคนขับ',
            description: 'รอไรเดอร์มารับสินค้าที่ร้าน',
          },
        });
        if (process.env.NODE_ENV !== 'production') {
          console.log('[order] READY_FOR_PICKUP: สร้าง shipment สำหรับ order', orderId, '— งานจะโผล่ในหน้าไรเดอร์');
        }
      }
    }, { timeout: 10000 });

    // เมื่อยกเลิกออเดอร์ที่ชำระ QR แล้ว → คืนเงินเข้ากระเป๋าลูกค้า
    if (status === 'CANCELLED') {
      await refundToCustomerWallet(orderId).catch((e) =>
        console.error('refundToCustomerWallet:', e),
      );
    }

    // ดึง order ใหม่พร้อม shipment (ถ้าเพิ่งสร้าง)
    const withShipment = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderedBy: {
          select: {
            id: true,
            email: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
              },
            },
          },
        },
        shipment: true,
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            createdAt: true,
          },
        },
      },
    });

    // Realtime notify customer
    try {
      const io = req.app?.locals?.io;
      const customerId = withShipment?.orderedBy?.id;
      if (io && customerId) {
        io.to(`user_${customerId}`).emit('order_status_updated', {
          orderId: withShipment.id,
          status: withShipment.orderStatus,
          order: withShipment,
        });
      }
    } catch (socketError) {
      console.warn('Socket emit failed:', socketError?.message || socketError);
    }

    return res.status(200).json({
      message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ',
      order: withShipment,
    });
  } catch (err) {
    console.error('Order updateStatus error:', err);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * คำนวณค่าจัดส่งก่อนสร้างออเดอร์ (POST /orders/preview-shipping)
 * Body: { cartTotal } หรือไม่ส่ง ก็ดึงจาก SiteSetting คืน shippingFee / ฟรีเมื่อเกิน freeShippingThreshold
 */
exports.previewShipping = async (req, res) => {
  try {
    const cartTotal = req.body.cartTotal != null ? parseFloat(req.body.cartTotal) : null;
    const setting = await prisma.siteSetting.findFirst();
    const shippingFee = setting?.shippingFee ?? 50;
    const freeThreshold = setting?.freeShippingThreshold ?? 1000;
    const amount =
      cartTotal != null && !isNaN(cartTotal) && cartTotal >= freeThreshold ? 0 : shippingFee;
    return res.status(200).json({
      message: 'ดึงข้อมูลค่าจัดส่งสำเร็จ',
      shippingFee,
      freeShippingThreshold: freeThreshold,
      cartTotal: cartTotal ?? null,
      shippingAmount: amount,
    });
  } catch (err) {
    console.error('previewShipping error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการคำนวณค่าจัดส่ง' });
  }
};

/**
 * ลูกค้ายืนยันรับสินค้า → อัปเดต Order เป็น COMPLETED (เมื่อ orderStatus = DELIVERED)
 */
exports.confirmReceived = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderedById: true, orderStatus: true },
    });
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }
    if (order.orderedById !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ยืนยันรับคำสั่งซื้อนี้' });
    }
    if (order.orderStatus !== 'DELIVERED') {
      return res.status(400).json({
        message: 'สามารถยืนยันรับได้เฉพาะออเดอร์ที่จัดส่งถึงแล้ว (สถานะ DELIVERED)',
      });
    }
    await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: 'COMPLETED', receivedAt: new Date() },
    });
    await addTrackingHistory(
      orderId,
      'COMPLETED',
      'ลูกค้ายืนยันรับสินค้าแล้ว',
      'ธุรกรรมเสร็จสมบูรณ์',
      null
    );
    // เงินจากบัญชีกลางเข้าเป๋าตังร้านค้า (เมื่อลูกค้ายอมรับสินค้าภายใน 7 วัน)
    const hasCompletedPayment = await prisma.payment.findFirst({
      where: { orderId, status: 'completed' },
    });
    if (hasCompletedPayment) {
      await creditStoreWalletsForOrder(orderId).catch((e) =>
        console.error('creditStoreWalletsForOrder:', e)
      );
    }
    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderedBy: { select: { id: true, email: true, name: true } },
        products: { include: { product: { select: { id: true, title: true } } } },
        shipment: true,
      },
    });
    return res.status(200).json({
      message: 'ยืนยันรับสินค้าสำเร็จ',
      order: updated,
    });
  } catch (err) {
    console.error('confirmReceived error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการยืนยันรับสินค้า' });
  }
};

/**
 * ดึงประวัติการติดตาม (tracking) ของคำสั่งซื้อ
 */
exports.getTrackingHistory = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderedById: true },
    });

    if (!order) {
      // ไม่พบออเดอร์: ส่ง 200 + array ว่าง เพื่อให้ UI แสดง "ยังไม่มีประวัติ" แทนข้อความ error
      console.warn(`[tracking] order not found: orderId=${orderId}`);
      return res.status(200).json({
        message: 'ดึงประวัติการติดตามสำเร็จ',
        orderId,
        trackingHistory: [],
      });
    }

    // ลูกค้าดูได้เฉพาะ order ของตัวเอง; แอดมิน/ร้านค้า/ไรเดอร์ดูได้ตาม policy
    const isOwner = req.user.id === order.orderedById;
    const isStaff = ['admin', 'seller', 'courier'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูประวัติคำสั่งซื้อนี้' });
    }

    const history = await prisma.trackingHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      message: 'ดึงประวัติการติดตามสำเร็จ',
      orderId,
      trackingHistory: history,
    });
  } catch (err) {
    console.error('getTrackingHistory error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติ' });
  }
};
