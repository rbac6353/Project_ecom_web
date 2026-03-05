const prisma = require('../config/prisma');
const { notifyUserPaymentStatus } = require('./notification');
const generatePayload = require('promptpay-qr');

/**
 * สร้างสตริง QR PromptPay ด้วย library promptpay-qr (มาตรฐานที่แอพธนาคารไทยรองรับ)
 * ใช้ PROMPTPAY_ID จาก env (เบอร์โทร เช่น 0820844920)
 */
function buildPromptPayQRPayload(amount) {
    const promptPayId = process.env.PROMPTPAY_ID || '0820844920';
    return generatePayload(promptPayId, { amount: Number(amount) });
}

/**
 * เติมเงินเข้ากระเป๋าตังของร้านค้า (เรียกเมื่อลูกค้ายืนยันรับสินค้า → COMPLETED)
 * แยกยอดตามร้าน; ถ้าเครดิตออเดอร์นี้ไปแล้วจะไม่เครดิตซ้ำ
 */
async function creditStoreWalletsForOrder(orderId) {
    const existing = await prisma.storeWalletTransaction.findFirst({
        where: { referenceId: String(orderId), type: 'SALE_REVENUE' }
    });
    if (existing) return;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            products: {
                include: {
                    product: { select: { storeId: true } }
                }
            }
        }
    });
    if (!order || !order.products?.length) return;
    const byStore = {};
    for (const item of order.products) {
        const storeId = item.product?.storeId;
        if (!storeId) continue;
        const amount = Number(item.price || 0) * (item.count || 1);
        byStore[storeId] = (byStore[storeId] || 0) + amount;
    }
    for (const [storeId, amount] of Object.entries(byStore)) {
        if (amount <= 0) continue;
        const storeIdNum = parseInt(storeId, 10);
        let wallet = await prisma.storeWallet.findUnique({
            where: { storeId: storeIdNum }
        });
        if (!wallet) {
            wallet = await prisma.storeWallet.create({
                data: { storeId: storeIdNum, balance: 0 }
            });
        }
        await prisma.$transaction([
            prisma.storeWallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: amount } }
            }),
            prisma.storeWalletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    type: 'SALE_REVENUE',
                    referenceId: String(orderId),
                    description: `ขายออเดอร์ #${orderId}`
                }
            })
        ]);
    }
}

// สร้างคำสั่งชำระเงิน (Mock Payment)
exports.createPayment = async (req, res) => {
    try {
        const { orderId, method = "cash", customerInfo = {} } = req.body;
        const userId = req.user.id;

        // ตรวจสอบว่า order มีอยู่และเป็นของ user นี้
        const order = await prisma.order.findFirst({
            where: {
                id: parseInt(orderId),
                orderedById: userId
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });
        }

        // ตรวจสอบว่ามี payment อยู่แล้วหรือไม่
        const existingPayment = await prisma.payment.findFirst({
            where: {
                orderId: parseInt(orderId),
                status: { in: ["completed", "pending"] }
            }
        });

        if (existingPayment) {
            return res.status(400).json({ 
                message: "คำสั่งซื้อนี้มีการชำระเงินอยู่แล้ว",
                payment: existingPayment 
            });
        }

        // คำนวณยอดรวม (รวม shipping fee ถ้ามี)
        const shippingFee = req.body.shippingFee || 0;
        const totalAmount = order.cartTotal + shippingFee;

        // กำหนดสถานะเริ่มต้น
        // สำหรับ QR code payment จะเป็น pending จนกว่าจะอัพโหลดสลีป
        // สำหรับ COD และ credit card จะเป็น completed ทันที
        let initialStatus = "completed";
        let qrCodeData = null;
        
        if (method === "qr_code") {
            initialStatus = "pending";
            qrCodeData = buildPromptPayQRPayload(totalAmount);
        }

        // สร้าง Payment record
        const payment = await prisma.payment.create({
            data: {
                amount: totalAmount,
                currency: "THB",
                method: method,
                status: initialStatus,
                customerEmail: customerInfo.email || req.user.email,
                customerName: customerInfo.name || req.user.name,
                customerPhone: customerInfo.phone || req.user.phone || "",
                transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                qrCodeData: qrCodeData,
                metadata: JSON.stringify({
                    orderItems: order.products.length,
                    paymentMethod: method,
                    customerAddress: customerInfo.address || req.user.address || "",
                    shippingFee: shippingFee,
                    timestamp: new Date().toISOString()
                }),
                orderId: parseInt(orderId)
            }
        });
        
        // อัพเดต Order ให้มีที่อยู่จัดส่ง (ถ้ามี field ใน schema)
        const updateData = {};
        if (customerInfo.address || req.user.address) {
            updateData.shippingAddress = customerInfo.address || req.user.address;
        }
        if (customerInfo.phone || req.user.phone) {
            updateData.shippingPhone = customerInfo.phone || req.user.phone;
        }
        
        if (Object.keys(updateData).length > 0) {
            await prisma.order.update({
                where: { id: parseInt(orderId) },
                data: updateData
            });
        }

        // อัพเดตสถานะ order (เฉพาะ legacy oderStatus; orderStatus ใช้กับ Logistics — ร้านต้องกด "ยืนยันรับออเดอร์" ถึงจะเป็น PROCESSING)
        if (method !== "qr_code") {
            await prisma.order.update({
                where: { id: parseInt(orderId) },
                data: { oderStatus: "Processing" }
            });
        }

        res.status(201).json({
            message: method === "qr_code" 
                ? "สร้างคำสั่งชำระเงิน QR Code สำเร็จ กรุณาสแกนและอัพโหลดสลีป" 
                : "ชำระเงินสำเร็จ! คำสั่งซื้อของคุณอยู่ในขั้นตอนการดำเนินการ",
            payment: {
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
                status: payment.status,
                transactionId: payment.transactionId,
                qrCodeData: payment.qrCodeData,
                createdAt: payment.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำสั่งชำระเงิน" });
    }
};

// ดูประวัติการชำระเงิน
exports.getPayments = async (req, res) => {
    try {
        const userId = req.user.id;

        const payments = await prisma.payment.findMany({
            where: {
                order: {
                    orderedById: userId
                }
            },
            include: {
                order: {
                    include: {
                        products: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            message: "ดึงประวัติการชำระเงินสำเร็จ",
            payments
        });

    } catch (error) {
        console.error('Error getting payments:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน" });
    }
};

// ดูรายละเอียดการชำระเงิน
exports.getPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const payment = await prisma.payment.findFirst({
            where: {
                id: parseInt(id),
                order: {
                    orderedById: userId
                }
            },
            include: {
                order: {
                    include: {
                        products: {
                            include: {
                                product: {
                                    include: {
                                        images: true,
                                        category: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        res.status(200).json({
            message: "ดึงข้อมูลการชำระเงินสำเร็จ",
            payment
        });

    } catch (error) {
        console.error('Error getting payment:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน" });
    }
};

/**
 * Webhook สำหรับ SMS / Gateway แจ้งโอนเงินแล้ว (PromptPay ฯลฯ)
 * รับ POST /payments/webhook/sms — อัปเดต payment เป็น completed และ order เป็น PENDING_CONFIRMATION
 *
 * Body ได้ทั้งแบบ Gateway (transactionId/orderId) หรือแบบแอปดัก SMS (sender, message, receivedAt).
 * ถ้าไม่มี transactionId/orderId จะใช้ payment รอชำระล่าสุด (Fallback) — ใช้ตอนพรีเซนต์ได้โดยให้เพื่อนส่ง SMS
 * ธรรมดา (เช่น "คุณได้รับโอนเงิน 1.00 บาท") มาเบอร์คุณ แอปดักจะยิง webhook มา ระบบจะตัดออเดอร์ล่าสุดที่รอจ่ายให้
 */
exports.smsWebhook = async (req, res) => {
    try {
        console.log('[smsWebhook] method:', req.method, 'body keys:', req.body ? Object.keys(req.body) : []);
        const body = req.body || {};
        console.log('[smsWebhook] received:', JSON.stringify(body));
        const transactionId =
            body.transactionId || body.transaction_id || body.ref || body.reference
            || body.reference_id || body.transaction_ref;
        const orderId = body.orderId ?? body.order_id;

        let payment = null;
        if (transactionId) {
            const ref = String(transactionId).trim();
            payment = await prisma.payment.findFirst({
                where: { transactionId: ref, method: 'qr_code', status: 'pending' }
            });
        }
        if (!payment && orderId) {
            payment = await prisma.payment.findFirst({
                where: { orderId: parseInt(orderId, 10), method: 'qr_code', status: 'pending' },
                orderBy: { createdAt: 'desc' }
            });
        }
        // Fallback: ไม่มี ref ใน body (เช่น เพื่อนส่ง SMS จำลอง) → ใช้ออเดอร์รอชำระล่าสุด (เหมาะสำหรับพรีเซนต์)
        if (!payment) {
            payment = await prisma.payment.findFirst({
                where: { method: 'qr_code', status: 'pending' },
                orderBy: { createdAt: 'desc' }
            });
        }
        if (!payment) {
            console.warn('[smsWebhook] ไม่พบ payment ที่รอชำระ — ตรวจสอบว่า Gateway ส่ง ref/transactionId มาหรือไม่');
            return res.status(404).json({ message: 'ไม่พบรายการรอชำระ', received: body });
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'completed', updatedAt: new Date() }
        });
        const order = await prisma.order.findUnique({
            where: { id: payment.orderId },
            select: { orderedById: true }
        });
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { oderStatus: 'Processing', orderStatus: 'PENDING_CONFIRMATION' }
        });

        const io = req.app && req.app.locals && req.app.locals.io;
        if (io && order && order.orderedById) {
            io.to(`user_${order.orderedById}`).emit('order_status_updated', {
                orderId: payment.orderId,
                status: 'PENDING_CONFIRMATION',
                paymentStatus: 'completed'
            });
        }
        console.log('[smsWebhook] อัปเดต payment', payment.id, 'order', payment.orderId, 'เป็นชำระแล้ว');

        return res.status(200).json({ ok: true, message: 'รับแจ้งชำระเงินแล้ว', paymentId: payment.id, orderId: payment.orderId });
    } catch (err) {
        console.error('smsWebhook error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการประมวลผล webhook' });
    }
};

// จำลอง Webhook สำหรับ Payment Gateway
exports.paymentWebhook = async (req, res) => {
    try {
        const { transactionId, status, gatewayId } = req.body;

        // ค้นหา payment จาก transactionId
        const payment = await prisma.payment.findFirst({
            where: { transactionId: transactionId }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบธุรกรรม" });
        }

        // อัพเดตสถานะการชำระเงิน
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: status,
                gatewayId: gatewayId,
                gatewayStatus: status,
                updatedAt: new Date()
            }
        });

        // อัพเดตสถานะ order หากชำระเงินสำเร็จ + เติมกระเป๋าร้าน
        if (status === "completed") {
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { oderStatus: "Processing", orderStatus: "PENDING_CONFIRMATION" }
            });
            // เงินอยู่บัญชีกลาง; จะเข้าเป๋าร้านเมื่อลูกค้ายืนยันรับสินค้า (COMPLETED)
        } else if (status === "failed") {
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { oderStatus: "Payment Failed", orderStatus: "PENDING" }
            });
        }

        res.status(200).json({
            message: "อัพเดตสถานะการชำระเงินสำเร็จ",
            payment: updatedPayment
        });

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผล webhook" });
    }
};

// [Admin] ดูประวัติการชำระเงินทั้งหมด
exports.getAllPayments = async (req, res) => {
    try {
        const { status, method, page = 1, limit = 20 } = req.query;
        
        const where = {};
        if (status) where.status = status;
        if (method) where.method = method;

        const payments = await prisma.payment.findMany({
            where,
            include: {
                order: {
                    include: {
                        orderedBy: {
                            select: {
                                id: true,
                                email: true,
                                name: true
                            }
                        },
                        products: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        title: true,
                                        price: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        const total = await prisma.payment.count({ where });

        res.status(200).json({
            message: "ดึงประวัติการชำระเงินทั้งหมดสำเร็จ",
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting all payments:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน" });
    }
};

// [Admin] อนุมัติการชำระเงิน
exports.approvePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const adminId = req.user.id;
        const adminName = req.user.name || req.user.email;

        // ตรวจสอบ payment
        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(paymentId) },
            include: {
                order: {
                    include: {
                        orderedBy: { select: { name: true, email: true } }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        if (payment.status !== "waiting_approval") {
            return res.status(400).json({ message: "การชำระเงินนี้ไม่ได้อยู่ในสถานะรอการอนุมัติ" });
        }

        // อัพเดตสถานะการชำระเงิน
        const updatedPayment = await prisma.payment.update({
            where: { id: parseInt(paymentId) },
            data: {
                status: "completed",
                approvedBy: adminId,
                approvedAt: new Date()
            }
        });

        // อัพเดตสถานะ order (เงินอยู่บัญชีกลาง; จะเข้าเป๋าร้านเมื่อลูกค้ายืนยันรับสินค้า)
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { oderStatus: "Processing", orderStatus: "PENDING_CONFIRMATION" }
        });

        // ส่งแจ้งเตือนให้ลูกค้า
        await notifyUserPaymentStatus(payment, 'approved', adminName);

        // ลบแจ้งเตือนรอการอนุมัติ
        await prisma.notification.deleteMany({
            where: {
                paymentId: parseInt(paymentId),
                type: 'payment_pending'
            }
        });

        res.status(200).json({
            message: "อนุมัติการชำระเงินสำเร็จ",
            payment: updatedPayment
        });

    } catch (error) {
        console.error('Error approving payment:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอนุมัติการชำระเงิน" });
    }
};

// [Admin] ปฏิเสธการชำระเงิน
exports.rejectPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;
        const adminName = req.user.name || req.user.email;

        // ตรวจสอบ payment
        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(paymentId) },
            include: {
                order: {
                    include: {
                        orderedBy: { select: { name: true, email: true } }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        if (payment.status !== "waiting_approval") {
            return res.status(400).json({ message: "การชำระเงินนี้ไม่ได้อยู่ในสถานะรอการอนุมัติ" });
        }

        // อัพเดตสถานะการชำระเงิน
        const updatedPayment = await prisma.payment.update({
            where: { id: parseInt(paymentId) },
            data: {
                status: "failed",
                rejectedBy: adminId,
                rejectedAt: new Date(),
                rejectionReason: reason || "ไม่ระบุเหตุผล"
            }
        });

        // อัพเดตสถานะ order กลับเป็นรอชำระ (Logistics: PENDING)
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { oderStatus: "Not Process", orderStatus: "PENDING" }
        });

        // ส่งแจ้งเตือนให้ลูกค้า
        await notifyUserPaymentStatus(payment, 'rejected', adminName, reason);

        // ลบแจ้งเตือนรอการอนุมัติ
        await prisma.notification.deleteMany({
            where: {
                paymentId: parseInt(paymentId),
                type: 'payment_pending'
            }
        });

        res.status(200).json({
            message: "ปฏิเสธการชำระเงินสำเร็จ",
            payment: updatedPayment
        });

    } catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการปฏิเสธการชำระเงิน" });
    }
};

// จำลองการชำระเงินผ่าน PromptPay
exports.generatePromptPayQR = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        // ตรวจสอบ payment
        const payment = await prisma.payment.findFirst({
            where: {
                id: parseInt(paymentId),
                order: {
                    orderedById: userId
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        if (payment.status === "completed") {
            return res.status(400).json({ message: "การชำระเงินนี้เสร็จสิ้นแล้ว" });
        }

        // สร้าง Mock PromptPay QR Data
        const promptPayData = {
            amount: payment.amount,
            transactionId: payment.transactionId,
            qrString: buildPromptPayQRPayload(payment.amount),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // หมดอายุใน 15 นาที
            instructions: [
                "เปิดแอพธนาคารของคุณ",
                "เลือกสแกน QR Code",
                "สแกน QR Code นี้",
                "ตรวจสอบยอดเงินและกดยืนยัน",
                "อัพโหลดรูปสลีปการโอนเงิน"
            ]
        };

        res.status(200).json({
            message: "สร้าง PromptPay QR Code สำเร็จ",
            promptPay: promptPayData,
            payment: {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                transactionId: payment.transactionId
            }
        });

    } catch (error) {
        console.error('Error generating PromptPay QR:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้าง PromptPay QR" });
    }
};

// อัพโหลดสลีปการโอนเงินสำหรับ QR code payment
exports.uploadPaymentSlip = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        // ตรวจสอบ payment
        const payment = await prisma.payment.findFirst({
            where: {
                id: parseInt(paymentId),
                order: {
                    orderedById: userId
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        if (payment.status === "completed") {
            return res.status(400).json({ message: "การชำระเงินนี้เสร็จสิ้นแล้ว" });
        }

        if (payment.method !== "qr_code") {
            return res.status(400).json({ message: "วิธีการชำระเงินนี้ไม่รองรับการอัพโหลดสลีป" });
        }

        // ตรวจสอบว่ามีไฟล์อัพโหลดหรือไม่
        if (!req.file) {
            return res.status(400).json({ message: "กรุณาอัพโหลดรูปสลีปการโอนเงิน" });
        }

        // สร้าง URL ของสลีป (ใช้ SERVER_URL จาก env ถ้ามี)
        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        const normalizedServerUrl = serverUrl.endsWith('/')
            ? serverUrl.slice(0, -1)
            : serverUrl;
        const slipUrl = `${normalizedServerUrl}/uploads/payment-slips/${req.file.filename}`;

        // อัพเดต payment ด้วย URL ของสลีปและเปลี่ยนสถานะเป็น completed
        const updatedPayment = await prisma.payment.update({
            where: { id: parseInt(paymentId) },
            data: {
                paymentSlipUrl: slipUrl,
                status: "completed",
                updatedAt: new Date()
            }
        });

        // อัพเดตสถานะ order (เงินอยู่บัญชีกลาง; จะเข้าเป๋าร้านเมื่อลูกค้ายืนยันรับสินค้า)
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { oderStatus: "Processing", orderStatus: "PENDING_CONFIRMATION" }
        });

        res.status(200).json({
            message: "อัพโหลดสลีปสำเร็จ! การชำระเงินเสร็จสิ้นแล้ว",
            payment: {
                id: updatedPayment.id,
                amount: updatedPayment.amount,
                status: updatedPayment.status,
                paymentSlipUrl: updatedPayment.paymentSlipUrl,
                transactionId: updatedPayment.transactionId
            }
        });

    } catch (error) {
        console.error('Error uploading payment slip:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัพโหลดสลีป" });
    }
};

exports.creditStoreWalletsForOrder = creditStoreWalletsForOrder;
