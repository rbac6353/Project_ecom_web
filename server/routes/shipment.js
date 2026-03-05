/**
 * Routes - Shipment (Logistics) ตรงตามเอกสาร
 * ลูกค้า: GET /shipments/orders/:orderId/detail
 * ไรเดอร์: available-jobs, my-active-jobs, orders/:id/preview, tasks, accept, pickup, out-for-delivery, complete, status
 */
const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipment');
const { authCheck, riderCheck } = require('../middlewares/authCheck');

// ---- ลูกค้า/แอดมิน/ไรเดอร์: ดูรายละเอียด Shipment ตาม orderId (path ตามเอกสาร)
router.get('/orders/:orderId/detail', authCheck, shipmentController.getByOrderId);

// ไรเดอร์: รายการงานที่พร้อมรับ
router.get('/available-jobs', authCheck, riderCheck, shipmentController.getAvailableJobs);

// ไรเดอร์: งานที่รับแล้ว (alias ตามเอกสาร my-active-jobs)
router.get('/my-active-jobs', authCheck, riderCheck, shipmentController.getMyShipments);
router.get('/my', authCheck, riderCheck, shipmentController.getMyShipments);

// ไรเดอร์: ดูข้อมูลพัสดุก่อนรับงาน (orders/:id/preview)
router.get('/orders/:id/preview', authCheck, shipmentController.getOrderPreview);

// ไรเดอร์: งานของไรเดอร์ type=ACTIVE|HISTORY
router.get('/tasks', authCheck, riderCheck, shipmentController.getTasks);

// ไรเดอร์: รับงาน (เอกสาร PATCH accept)
router.patch('/:id/accept', authCheck, riderCheck, shipmentController.assignCourier);
router.post('/:id/assign', authCheck, riderCheck, shipmentController.assignCourier); // backward compatibility

// ไรเดอร์: รับของที่ร้าน → IN_TRANSIT, Order SHIPPED
router.patch('/:id/pickup', authCheck, riderCheck, shipmentController.pickup);

// ไรเดอร์: กำลังนำจ่าย → OUT_FOR_DELIVERY
router.patch('/:id/out-for-delivery', authCheck, riderCheck, shipmentController.outForDelivery);

// ไรเดอร์: ส่งสำเร็จ — body: proofImage?, collectedCod?, signatureImage?, location?
router.patch('/:id/complete', authCheck, riderCheck, shipmentController.complete);

// ไรเดอร์: อัปเดตสถานะ Shipment โดยตรง
router.patch('/:id/status', authCheck, riderCheck, shipmentController.updateShipmentStatus);
router.put('/:id/status', authCheck, riderCheck, shipmentController.updateShipmentStatus);

// ดึง shipment ตาม orderId (path เดิม)
router.get('/order/:orderId', authCheck, shipmentController.getByOrderId);

// งานรับของคืน (Reverse Logistics)
router.post('/return-jobs/:id/assign', authCheck, riderCheck, shipmentController.assignReturnPickup);
router.patch('/return-jobs/:id/pickup', authCheck, riderCheck, shipmentController.returnPickupPickup);
router.patch('/return-jobs/:id/complete', authCheck, riderCheck, shipmentController.returnPickupComplete);

module.exports = router;
