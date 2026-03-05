/**
 * Logistics - ShipmentsService สำหรับไรเดอร์
 * อัปเดตสถานะการจัดส่ง และ sync กับ Order + tracking_history
 */
const prisma = require('../config/prisma');

const SHIPMENT_STATUS_LABELS = {
  WAITING_PICKUP: 'รอไรเดอร์มารับ',
  IN_TRANSIT: 'กำลังขนส่ง',
  OUT_FOR_DELIVERY: 'กำลังนำส่ง',
  DELIVERED: 'จัดส่งสำเร็จ',
  FAILED: 'จัดส่งไม่สำเร็จ',
};

// สถานะ Order ที่ sync กับ Shipment
const ORDER_STATUS_FOR_SHIPMENT = {
  IN_TRANSIT: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
};

async function addTrackingHistory(orderId, status, title, description = null, location = null) {
  await prisma.trackingHistory.create({
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
 * รายการงานที่พร้อมให้ไรเดอร์รับ (READY_FOR_PICKUP และยังไม่มีไรเดอร์ หรือ shipment ยัง WAITING_PICKUP)
 * ถ้ามีออเดอร์ที่ READY_FOR_PICKUP แต่ยังไม่มี shipment จะสร้างให้อัตโนมัติ (แก้กรณีงานไม่เข้าไรเดอร์)
 */
exports.getAvailableJobs = async (req, res) => {
  try {
    // สร้าง shipment ให้ออเดอร์ที่ READY_FOR_PICKUP แต่ยังไม่มี shipment (กรณีอัปเดตสถานะผ่าน path อื่น)
    const ordersWithoutShipment = await prisma.order.findMany({
      where: {
        orderStatus: 'READY_FOR_PICKUP',
        shipment: null,
      },
      select: { id: true },
    });
    for (const o of ordersWithoutShipment) {
      try {
        await prisma.shipment.create({
          data: {
            orderId: o.id,
            status: 'WAITING_PICKUP',
            codAmount: 0,
          },
        });
        await prisma.trackingHistory.create({
          data: {
            orderId: o.id,
            status: 'READY_FOR_PICKUP',
            title: 'กำลังค้นหาคนขับ',
            description: 'รอไรเดอร์มารับสินค้าที่ร้าน',
          },
        });
        console.log('[getAvailableJobs] สร้าง shipment ให้ order', o.id);
      } catch (createErr) {
        console.error('Auto-create shipment for order', o.id, createErr.message);
      }
    }

    // ออเดอร์ที่ orderStatus = READY_FOR_PICKUP และมี shipment status = WAITING_PICKUP และ courierId เป็น null
    const shipments = await prisma.shipment.findMany({
      where: {
        status: 'WAITING_PICKUP',
        courierId: null,
        order: {
          orderStatus: 'READY_FOR_PICKUP',
        },
      },
      include: {
        order: {
          include: {
            orderedBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true,
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
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // งานรับของคืน (Reverse Logistics): ReturnPickup ที่รอไรเดอร์ และ order.refundStatus = WAITING_FOR_PICKUP
    let returnJobs = [];
    try {
      returnJobs = await prisma.returnPickup.findMany({
        where: {
          status: 'WAITING_PICKUP',
          courierId: null,
          orderReturn: {
            order: { refundStatus: 'WAITING_FOR_PICKUP' },
          },
        },
        include: {
          orderReturn: { select: { id: true, orderId: true } },
          store: { select: { id: true, name: true, address: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (e) {
      console.warn('getAvailableJobs returnJobs:', e?.message);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[getAvailableJobs] งานที่รอรับ:', shipments.length, ' | งานรับของคืน:', returnJobs.length);
    }
    return res.status(200).json({
      message: 'ดึงรายการงานที่พร้อมรับสำเร็จ',
      jobs: shipments,
      returnJobs,
      count: shipments.length + returnJobs.length,
    });
  } catch (err) {
    console.error('getAvailableJobs error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการงาน' });
  }
};

/**
 * ไรเดอร์รับงาน (assign ตัวเองเป็น courier)
 */
exports.assignCourier = async (req, res) => {
  try {
    const shipmentId = parseInt(req.params.id);
    const courierId = req.user.id;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      return res.status(404).json({ message: 'ไม่พบรายการจัดส่ง' });
    }
    if (shipment.courierId) {
      return res.status(400).json({ message: 'มีไรเดอร์รับงานนี้แล้ว' });
    }
    if (shipment.status !== 'WAITING_PICKUP') {
      return res.status(400).json({ message: 'สถานะไม่ใช่รอรับสินค้า' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: shipmentId },
        data: { courierId },
      });
      await tx.order.update({
        where: { id: shipment.orderId },
        data: { orderStatus: 'RIDER_ASSIGNED' },
      });
      await tx.trackingHistory.create({
        data: {
          orderId: shipment.orderId,
          status: 'RIDER_ASSIGNED',
          title: 'มีไรเดอร์รับงานแล้ว',
          description: `ไรเดอร์ ID ${courierId} รับงาน`,
          location: null,
        },
      });
    }, { timeout: 10000 });

    const updated = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            orderedBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true,
              },
            },
          },
        },
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: 'รับงานสำเร็จ',
      shipment: updated,
    });
  } catch (err) {
    console.error('assignCourier error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการรับงาน' });
  }
};

/**
 * ดูข้อมูลพัสดุ/ออเดอร์ก่อนรับงาน (สำหรับไรเดอร์ สแกน QR หรือเปิดดู)
 * GET /shipments/orders/:id/preview
 */
exports.getOrderPreview = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderedBy: { select: { id: true, name: true, phone: true, address: true } },
        products: {
          include: {
            product: { select: { id: true, title: true, price: true, images: true } },
          },
        },
        shipment: true,
      },
    });
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }
    // ไม่บังคับสิทธิ์ สำหรับ preview ไรเดอร์อาจเข้าจาก QR/link
    return res.status(200).json({
      message: 'ดึงข้อมูลพัสดุสำเร็จ',
      order,
    });
  } catch (err) {
    console.error('getOrderPreview error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
};

/**
 * งานของไรเดอร์ แยก type=ACTIVE | HISTORY
 * GET /shipments/tasks?type=ACTIVE|HISTORY
 */
exports.getTasks = async (req, res) => {
  try {
    const courierId = req.user.id;
    const type = (req.query.type || 'ACTIVE').toUpperCase();
    const where = { courierId };
    if (type === 'HISTORY') {
      where.status = { in: ['DELIVERED', 'FAILED'] };
    } else {
      where.status = { notIn: ['DELIVERED', 'FAILED'] };
    }
    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        order: {
          include: {
            orderedBy: { select: { id: true, name: true, phone: true, address: true } },
            products: {
              include: {
                product: { select: { id: true, title: true, price: true, images: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return res.status(200).json({
      message: 'ดึงรายการงานสำเร็จ',
      type,
      tasks: shipments,
      count: shipments.length,
    });
  } catch (err) {
    console.error('getTasks error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการ' });
  }
};

/**
 * ไรเดอร์รับของที่ร้านแล้ว → Shipment IN_TRANSIT, Order SHIPPED
 * PATCH /shipments/:id/pickup
 */
exports.pickup = async (req, res) => {
  if (!req.body) req.body = {};
  req.body.status = 'IN_TRANSIT';
  return exports.updateShipmentStatus(req, res);
};

/**
 * ไรเดอร์กำลังนำจ่าย → Shipment OUT_FOR_DELIVERY, Order OUT_FOR_DELIVERY
 * PATCH /shipments/:id/out-for-delivery
 */
exports.outForDelivery = async (req, res) => {
  if (!req.body) req.body = {};
  req.body.status = 'OUT_FOR_DELIVERY';
  return exports.updateShipmentStatus(req, res);
};

/**
 * ไรเดอร์ส่งสำเร็จ — body: proofImage?, collectedCod?, signatureImage?, location?
 * PATCH /shipments/:id/complete
 */
exports.complete = async (req, res) => {
  if (!req.body) req.body = {};
  const { proofImage, collectedCod, signatureImage, location } = req.body;
  req.body.status = 'DELIVERED';
  req.body.proofImage = proofImage;
  req.body.signatureImage = signatureImage;
  if (collectedCod != null) req.body.collectedCod = collectedCod;
  if (location != null) {
    if (typeof location === 'object' && location.latitude != null && location.longitude != null) {
      req.body.latitude = location.latitude;
      req.body.longitude = location.longitude;
    }
  }
  return exports.updateShipmentStatus(req, res);
};

/**
 * อัปเดตสถานะการจัดส่ง (ไรเดอร์)
 * Logic: เมื่อเป็น IN_TRANSIT -> อัปเดต Order เป็น SHIPPED; OUT_FOR_DELIVERY -> Order OUT_FOR_DELIVERY; DELIVERED -> Order DELIVERED
 * บันทึก tracking_history ทุกครั้ง
 */
exports.updateShipmentStatus = async (req, res) => {
  try {
    const shipmentId = parseInt(req.params.id);
    const { status, description, location, proofImage, signatureImage, failedReason, collectedCod, latitude, longitude } = req.body;

    const validStatuses = ['WAITING_PICKUP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      return res.status(404).json({ message: 'ไม่พบรายการจัดส่ง' });
    }

    // ตรวจสิทธิ์: ไรเดอร์ที่รับงานนี้หรือแอดมิน
    const isCourier = shipment.courierId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isCourier && !isAdmin) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์อัปเดตรายการจัดส่งนี้' });
    }

    const previousStatus = shipment.status;
    const title = SHIPMENT_STATUS_LABELS[status] || status;

    const updated = await prisma.$transaction(async (tx) => {
      const updateData = {
        status,
        ...(proofImage != null && { proofImage }),
        ...(signatureImage != null && { signatureImage }),
        ...(failedReason != null && { failedReason }),
        ...(collectedCod != null && { isCodPaid: Boolean(collectedCod) }),
        ...(latitude != null && { latitude }),
        ...(longitude != null && { longitude }),
      };

      if (status === 'IN_TRANSIT') {
        updateData.pickupTime = new Date();
      }
      if (status === 'DELIVERED') {
        updateData.deliveredTime = new Date();
      }

      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: updateData,
      });

      // Sync Order: อัปเดต orderStatus ตามสถานะ shipment
      const newOrderStatus = ORDER_STATUS_FOR_SHIPMENT[status];
      if (newOrderStatus) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { orderStatus: newOrderStatus },
        });
      }

      // บันทึก tracking_history ใน transaction เดียวกัน (ใช้ tx เพื่อไม่ timeout)
      await tx.trackingHistory.create({
        data: {
          orderId: shipment.orderId,
          status: status,
          title,
          description: description || `เปลี่ยนสถานะการจัดส่งจาก ${previousStatus} เป็น ${status}`,
          location: location || null,
        },
      });

      return updatedShipment;
    }, { timeout: 10000 });

    const withOrder = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            orderedBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true,
              },
            },
          },
        },
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Realtime notify customer
    try {
      const io = req.app?.locals?.io;
      const customerId = withOrder?.order?.orderedById;
      if (io && customerId) {
        io.to(`user_${customerId}`).emit('order_status_updated', {
          orderId: withOrder.orderId,
          status: withOrder.order?.orderStatus,
          shipment: withOrder,
        });
      }
    } catch (socketError) {
      console.warn('Socket emit failed:', socketError?.message || socketError);
    }

    return res.status(200).json({
      message: 'อัปเดตสถานะการจัดส่งสำเร็จ',
      shipment: withOrder,
    });
  } catch (err) {
    console.error('updateShipmentStatus error:', err);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * ดึง shipment ตาม orderId (ลูกค้า/แอดมิน/ไรเดอร์)
 */
exports.getByOrderId = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderedById: true },
    });

    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }

    const isOwner = req.user.id === order.orderedById;
    const isStaff = ['admin', 'seller', 'courier', 'rider'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูรายการจัดส่งนี้' });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            orderedBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true,
              },
            },
          },
        },
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!shipment) {
      return res.status(200).json({
        message: 'ยังไม่มีรายการจัดส่ง',
        shipment: null,
        orderId,
      });
    }

    return res.status(200).json({
      message: 'ดึงรายการจัดส่งสำเร็จ',
      shipment,
      orderId,
    });
  } catch (err) {
    console.error('getByOrderId error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการจัดส่ง' });
  }
};

/**
 * ไรเดอร์: ดึงรายการจัดส่งของตัวเอง
 */
exports.getMyShipments = async (req, res) => {
  try {
    const courierId = req.user.id;
    const { status } = req.query;

    const where = { courierId };
    if (status) where.status = status;

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        order: {
          include: {
            orderedBy: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true,
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
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // งานรับของคืนที่ไรเดอร์รับไว้
    let returnPickups = [];
    try {
      returnPickups = await prisma.returnPickup.findMany({
        where: { courierId: courierId },
        include: {
          orderReturn: { select: { id: true, orderId: true } },
          store: { select: { id: true, name: true, address: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (e) {
      console.warn('getMyShipments returnPickups:', e?.message);
    }

    return res.status(200).json({
      message: 'ดึงรายการจัดส่งของไรเดอร์สำเร็จ',
      shipments,
      returnPickups,
      count: shipments.length + returnPickups.length,
    });
  } catch (err) {
    console.error('getMyShipments error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการ' });
  }
};

/**
 * ไรเดอร์รับงานรับของคืน — POST /shipments/return-jobs/:id/assign
 */
exports.assignReturnPickup = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const courierId = req.user.id;
    if (!id) return res.status(400).json({ message: 'รหัสงานไม่ถูกต้อง' });

    const rp = await prisma.returnPickup.findUnique({
      where: { id },
      include: { orderReturn: { select: { orderId: true } } },
    });
    if (!rp) return res.status(404).json({ message: 'ไม่พบงานรับของคืนนี้' });
    if (rp.courierId) return res.status(400).json({ message: 'มีไรเดอร์รับงานนี้แล้ว' });
    if (rp.status !== 'WAITING_PICKUP') return res.status(400).json({ message: 'สถานะงานไม่ใช่รอรับ' });

    const orderId = rp.orderReturn.orderId;
    await prisma.$transaction([
      prisma.returnPickup.update({
        where: { id },
        data: { courierId },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { refundStatus: 'WAITING_FOR_PICKUP' },
      }),
    ]);

    const updated = await prisma.returnPickup.findUnique({
      where: { id },
      include: {
        orderReturn: { select: { id: true, orderId: true } },
        store: { select: { id: true, name: true, address: true } },
      },
    });
    return res.status(200).json({ message: 'รับงานรับสินค้าคืนสำเร็จ', returnPickup: updated });
  } catch (err) {
    console.error('assignReturnPickup error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

/**
 * ไรเดอร์รับของจากลูกค้าแล้ว — PATCH /shipments/return-jobs/:id/pickup
 */
exports.returnPickupPickup = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const courierId = req.user.id;
    if (!id) return res.status(400).json({ message: 'รหัสงานไม่ถูกต้อง' });

    const rp = await prisma.returnPickup.findUnique({
      where: { id },
      include: { orderReturn: { select: { orderId: true } } },
    });
    if (!rp) return res.status(404).json({ message: 'ไม่พบงานรับของคืนนี้' });
    if (rp.courierId !== courierId) return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
    if (rp.status !== 'WAITING_PICKUP') return res.status(400).json({ message: 'สถานะไม่ใช่รอรับของ' });

    const orderId = rp.orderReturn.orderId;
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { refundStatus: 'RETURN_IN_TRANSIT' },
      }),
      prisma.trackingHistory.create({
        data: {
          orderId,
          status: 'RETURN_IN_TRANSIT',
          title: 'ไรเดอร์รับของจากลูกค้าแล้ว',
          description: 'กำลังนำสินค้าคืนไปส่งที่ร้าน',
        },
      }),
      prisma.returnPickup.update({
        where: { id },
        data: { status: 'PICKED_UP' },
      }),
    ]);
    const updated = await prisma.returnPickup.findUnique({
      where: { id },
      include: { orderReturn: true, store: true },
    });
    return res.status(200).json({ message: 'บันทึกรับของจากลูกค้าแล้ว', returnPickup: updated });
  } catch (err) {
    console.error('returnPickupPickup error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

/**
 * ไรเดอร์ส่งของคืนร้านแล้ว — PATCH /shipments/return-jobs/:id/complete
 * Body: { proofImageUrl?: string }
 */
exports.returnPickupComplete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const courierId = req.user.id;
    const { proofImageUrl } = req.body || {};
    if (!id) return res.status(400).json({ message: 'รหัสงานไม่ถูกต้อง' });

    const rp = await prisma.returnPickup.findUnique({
      where: { id },
      include: { orderReturn: { select: { orderId: true } } },
    });
    if (!rp) return res.status(404).json({ message: 'ไม่พบงานรับของคืนนี้' });
    if (rp.courierId !== courierId) return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
    if (rp.status !== 'PICKED_UP') return res.status(400).json({ message: 'กรุณาบันทึกรับของจากลูกค้าก่อน' });
    if (!proofImageUrl) return res.status(400).json({ message: 'กรุณาอัปโหลดรูปหลักฐานการส่งของคืนร้าน' });

    const orderId = rp.orderReturn.orderId;
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { refundStatus: 'RETURN_DELIVERED', refundDate: new Date() },
      }),
      prisma.trackingHistory.create({
        data: {
          orderId,
          status: 'RETURN_DELIVERED',
          title: 'ไรเดอร์ส่งของคืนร้านแล้ว',
          description: 'ส่งสินค้าคืนถึงร้านแล้ว',
        },
      }),
      prisma.returnPickup.update({
        where: { id },
        data: { status: 'DELIVERED', proofImage: proofImageUrl },
      }),
    ]);
    const updated = await prisma.returnPickup.findUnique({
      where: { id },
      include: { orderReturn: true, store: true },
    });
    return res.status(200).json({ message: 'ส่งสินค้าคืนร้านเรียบร้อย', returnPickup: updated });
  } catch (err) {
    console.error('returnPickupComplete error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};
