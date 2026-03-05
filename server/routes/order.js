/**
 * Routes - Order (Logistics & Order Status) + คืนสินค้า
 */
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const orderReturnController = require('../controllers/orderReturn');
const userController = require('../controllers/user');
const { authCheck, sellerOrAdminCheck, riderCheck } = require('../middlewares/authCheck');
const { uploadReturnProof, uploadRefundSlip, handleReturnUploadError } = require('../middlewares/uploadReturn');

// อัปโหลดรูปหลักฐานขอคืน (ลูกค้า) และสลิปโอนเงินคืน (ร้าน/แอดมิน) — ต้องอยู่ก่อน /:id
router.post('/upload-return-proof', authCheck, uploadReturnProof, handleReturnUploadError, orderReturnController.uploadReturnProof);
router.post('/upload-refund-slip', authCheck, sellerOrAdminCheck, uploadRefundSlip, handleReturnUploadError, orderReturnController.uploadRefundSlip);

// สร้างคำสั่งซื้อ (ตามเอกสาร POST /orders — body: shippingAddress?, shippingPhone?, cartTotal?, couponId?, discountAmount?)
router.post('/', authCheck, (req, res) => userController.saveOrder(req, res));

// คำนวณค่าจัดส่งก่อนสร้างออเดอร์ (body: { cartTotal? })
router.post('/preview-shipping', authCheck, orderController.previewShipping);

// ดึงประวัติการติดตาม (tracking) ของคำสั่งซื้อ — ต้องอยู่ก่อน /:id
router.get('/:id/tracking', authCheck, orderController.getTrackingHistory);

// ลูกค้ายืนยันรับสินค้า → Order เป็น COMPLETED (เฉพาะเมื่อ DELIVERED)
router.post('/:id/confirm-received', authCheck, orderController.confirmReceived);

// คืนสินค้า: สร้างคำขอคืน (POST), ดึงคำขอคืนของออเดอร์นี้ (GET)
router.post('/:orderId/returns', authCheck, orderReturnController.createReturnRequest);
router.post('/:orderId/return', authCheck, orderReturnController.createReturnRequest); // alias ตามสเปก API
router.get('/:orderId/returns', authCheck, orderReturnController.getReturnByOrderId);
// ร้านค้า/แอดมิน: อัปเดตสถานะคำขอคืน (อนุมัติ/ปฏิเสธ + สลิปโอนเงิน)
router.put('/:orderId/return-status', authCheck, sellerOrAdminCheck, orderReturnController.updateReturnStatusByOrderId);
// ร้านค้า/แอดมิน: เรียกไรเดอร์ไปรับของคืน
router.put('/:orderId/return-call-rider', authCheck, sellerOrAdminCheck, orderReturnController.returnCallRider);
// ไรเดอร์: อัปเดตสถานะรับของคืน (RETURN_IN_TRANSIT / RETURN_DELIVERED)
router.put('/:orderId/return-rider-status', authCheck, riderCheck, orderReturnController.returnRiderStatus);
// ร้านค้า/แอดมิน: อนุมัติคืนเงิน (เมื่อ RETURN_DELIVERED หรือ IN_DISPUTE)
router.put('/:orderId/return-approve', authCheck, sellerOrAdminCheck, orderReturnController.returnApprove);
// ร้านค้า: แจ้งข้อพิพาท/ส่งเรื่องให้แอดมิน (เมื่อ RETURN_DELIVERED)
router.put('/:orderId/return-dispute', authCheck, sellerOrAdminCheck, orderReturnController.returnDispute);

// ดึงรายละเอียดออเดอร์ (ลูกค้า/แอดมิน/ร้านค้า/ไรเดอร์ ตามสิทธิ์)
router.get('/:id', authCheck, orderController.getOrderById);

// อัปเดตสถานะคำสั่งซื้อ (ร้านค้า/แอดมิน) — body: { status, trackingNumber?, provider? }
router.patch('/:id/status', authCheck, sellerOrAdminCheck, orderController.updateStatus);
router.put('/:id/status', authCheck, sellerOrAdminCheck, orderController.updateStatus); // backward compatibility

module.exports = router;
