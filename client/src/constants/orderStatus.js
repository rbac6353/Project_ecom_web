/**
 * Logic การ Map สถานะ (Backend Enum -> Thai UI Label)
 * Array ของ Step เรียงตามลำดับสำหรับไทม์ไลน์/การติดตามออเดอร์
 */
export const ORDER_STATUS_STEPS = [
  { status: 'PENDING', label: 'สั่งซื้อสำเร็จ' },
  { status: 'PENDING_CONFIRMATION', label: 'ชำระเงินเรียบร้อย' },
  { status: 'PROCESSING', label: 'ร้านค้ายืนยันรับออเดอร์แล้ว' },
  { status: 'READY_FOR_PICKUP', label: 'สินค้าพร้อมแล้ว กำลังหาไรเดอร์' },
  { status: 'RIDER_ASSIGNED', label: 'ไรเดอร์กำลังไปรับสินค้า' },
  { status: 'PICKED_UP', label: 'ไรเดอร์รับสินค้าแล้ว' },
  { status: 'OUT_FOR_DELIVERY', label: 'กำลังจัดส่งถึงคุณ' },
  { status: 'COMPLETED', label: 'จัดส่งสำเร็จ' },
];

/** Map ทุก enum -> ข้อความภาษาไทย (สำหรับ badge / รายการออเดอร์) */
export const ORDER_STATUS_LABEL = {
  PENDING: 'สั่งซื้อสำเร็จ',
  VERIFYING: 'รอแอดมินตรวจสอบสลิปการโอนเงิน',
  PENDING_CONFIRMATION: 'ชำระเงินเรียบร้อย',
  PROCESSING: 'ร้านค้ายืนยันรับออเดอร์แล้ว',
  READY_FOR_PICKUP: 'สินค้าพร้อมแล้ว กำลังหาไรเดอร์',
  RIDER_ASSIGNED: 'ไรเดอร์กำลังไปรับสินค้า',
  PICKED_UP: 'ไรเดอร์รับสินค้าแล้ว',
  SHIPPED: 'สินค้าอยู่ระหว่างการขนส่งโดยไรเดอร์',
  OUT_FOR_DELIVERY: 'กำลังจัดส่งถึงคุณ',
  DELIVERED: 'ไรเดอร์ส่งสินค้าถึงมือลูกค้าเรียบร้อยแล้ว',
  COMPLETED: 'จัดส่งสำเร็จ',
  CANCELLED: 'คำสั่งซื้อถูกยกเลิก',
  CANCELLATION_REQUESTED: 'ลูกค้าส่งคำขอยกเลิกคำสั่งซื้อ',
  REFUND_REQUESTED: 'ลูกค้าแจ้งขอคืนเงิน',
  REFUNDED: 'คืนเงินให้ลูกค้าเรียบร้อยแล้ว',
};

export function getOrderStatusLabel(orderStatus) {
  return ORDER_STATUS_LABEL[orderStatus] || orderStatus || '';
}

/** ลำดับ step (0–7) ตาม orderStatus (ใช้ SHIPPED/DELIVERED เป็น step 6/7) */
const STATUS_TO_STEP_INDEX = {
  PENDING: 0,
  VERIFYING: 0,
  PENDING_CONFIRMATION: 1,
  PROCESSING: 2,
  READY_FOR_PICKUP: 3,
  RIDER_ASSIGNED: 4,
  PICKED_UP: 5,
  SHIPPED: 6,
  IN_TRANSIT: 6,
  OUT_FOR_DELIVERY: 6,
  DELIVERED: 7,
  COMPLETED: 7,
};

export function getOrderStepIndex(orderStatus) {
  if (!orderStatus) return -1;
  const idx = STATUS_TO_STEP_INDEX[orderStatus];
  return idx !== undefined ? idx : -1;
}

/** หาวันที่จาก trackingHistory ที่ตรงกับ step (รองรับ SHIPPED/DELIVERED กับ step 6/7) */
export function getStepDateFromHistory(stepIndex, trackingHistory) {
  if (!trackingHistory?.length) return null;
  const step = ORDER_STATUS_STEPS[stepIndex];
  if (!step) return null;
  const statuses = [step.status];
  if (stepIndex === 6) statuses.push('SHIPPED', 'IN_TRANSIT');
  if (stepIndex === 7) statuses.push('DELIVERED');
  const found = trackingHistory
    .filter((h) => statuses.includes(h.status))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  return found ? found.createdAt : null;
}
