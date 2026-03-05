import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const RETURN_REASONS = [
  { code: "damaged", label: "สินค้าชำรุด/เสียหาย" },
  { code: "wrong_item", label: "ได้สินค้าผิด/ไม่ตรงรายการ" },
  { code: "defect", label: "คุณภาพไม่ตรงตามที่ระบุ" },
  { code: "other", label: "เหตุผลอื่นๆ" },
];

const ReturnRequestModal = ({ order, onClose, onSubmit, submitting }) => {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState([]);
  const [reasonCode, setReasonCode] = useState("other");
  const [reasonText, setReasonText] = useState("");

  useEffect(() => {
    if (!order?.products) return;
    setItems(
      order.products.map((p) => ({
        orderItemId: p.id,
        productTitle: p.product?.title || "สินค้า",
        maxQty: p.count || 1,
        quantity: p.count || 1,
        price: p.price || 0,
      }))
    );
  }, [order]);

  const setQuantity = (index, value) => {
    const n = parseInt(value, 10);
    if (isNaN(n)) return;
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? { ...it, quantity: Math.max(0, Math.min(n, it.maxQty)) }
          : it
      )
    );
  };

  const totalRefund = items.reduce(
    (sum, it) => sum + (it.price || 0) * (it.quantity || 0),
    0
  );
  const selectedItems = items
    .filter((it) => it.quantity > 0)
    .map((it) => ({ orderItemId: it.orderItemId, quantity: it.quantity }));

  const reasonLabel = reasonText.trim() || RETURN_REASONS.find((r) => r.code === reasonCode)?.label || "";

  const goToConfirm = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    setStep(2);
  };

  const handleConfirmReturn = () => {
    if (selectedItems.length === 0) return;
    const text = reasonText.trim() || RETURN_REASONS.find((r) => r.code === reasonCode)?.label || "";
    onSubmit({
      reason_code: reasonCode,
      reason_text: text,
      items: selectedItems,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    const text = reasonText.trim() || RETURN_REASONS.find((r) => r.code === reasonCode)?.label || "";
    onSubmit({
      reason_code: reasonCode,
      reason_text: text,
      items: selectedItems,
    });
  };

  if (!order) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 id="return-modal-title" className="text-lg font-semibold text-gray-900">
            {step === 1 ? `ขอคืนสินค้า – ออเดอร์ #${order.id}` : "ยืนยันการคืนสินค้า"}
          </h2>
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : onClose())}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label={step === 2 ? "กลับ" : "ปิด"}
          >
            <i className="fas fa-times" />
          </button>
        </div>
        {step === 1 ? (
        <form onSubmit={goToConfirm} className="p-4 space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
            <i className="fas fa-shield-alt text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">รับประกันคืนสินค้า 7 วัน</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                คุณสามารถขอคืนสินค้าได้ภายใน 7 วันนับจากวันรับของ ทันทีเป็นการรับประกัน
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            เลือกรายการที่ต้องการคืนและระบุเหตุผล แอดมินจะพิจารณาให้
          </p>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">รายการสินค้า</p>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={it.orderItemId}
                  className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-800 truncate flex-1">
                    {it.productTitle} x{it.maxQty}
                  </span>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500">คืน:</label>
                    <input
                      type="number"
                      min={0}
                      max={it.maxQty}
                      value={it.quantity}
                      onChange={(e) => setQuantity(idx, e.target.value)}
                      className="w-14 py-1 px-2 border border-gray-200 rounded text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            {selectedItems.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                ยอดคืนโดยประมาณ: <strong>฿{totalRefund.toLocaleString()}</strong>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เหตุผลการขอคืน
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm"
            >
              {RETURN_REASONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียดเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="อธิบายเพิ่มเติม..."
              rows={3}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={selectedItems.length === 0}
              className="flex-1 py-2.5 bg-[#ee4d2d] text-white rounded-lg text-sm font-medium hover:bg-[#d73211] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i className="fas fa-arrow-right" />
              ถัดไป – ยืนยันการคืนสินค้า
            </button>
          </div>
        </form>
        ) : (
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            กรุณาตรวจสอบข้อมูลด้านล่าง กดยืนยันแล้วระบบจะส่งคำขอและมีไรเดอร์มารับสินค้าคืนที่อยู่ของคุณ
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <p className="text-sm font-medium text-amber-800">ออเดอร์ #{order.id}</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {items.filter((it) => it.quantity > 0).map((it) => (
                <li key={it.orderItemId}>
                  {it.productTitle} x{it.quantity} = ฿{((it.price || 0) * it.quantity).toLocaleString()}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium text-gray-800 pt-1 border-t border-amber-200">
              ยอดคืนโดยประมาณ: ฿{totalRefund.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">เหตุผล: {reasonLabel}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              แก้ไข
            </button>
            <button
              type="button"
              onClick={handleConfirmReturn}
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle" />
                  ยืนยันการคืนสินค้า
                </>
              )}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ReturnRequestModal;
