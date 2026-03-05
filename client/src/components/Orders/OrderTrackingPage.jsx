import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STEPS,
  getOrderStepIndex,
  getStepDateFromHistory,
} from "../../constants/orderStatus";

const OrderTrackingPage = () => {
  const { id } = useParams();
  const orderId = id ? parseInt(id, 10) : null;
  const [order, setOrder] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({ reason: "", returnItems: [], proofFile: null });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!orderId || isNaN(orderId)) {
      setError("รหัสคำสั่งซื้อไม่ถูกต้อง");
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const [orderRes, trackingRes] = await Promise.all([
          apiClient.get(`/api/orders/${orderId}`),
          apiClient.get(`/api/orders/${orderId}/tracking`),
        ]);
        if (cancelled) return;
        if (orderRes.data?.order) setOrder(orderRes.data.order);
        if (trackingRes.data?.trackingHistory)
          setTrackingHistory(trackingRes.data.trackingHistory);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
          toast.error(err.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [orderId]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${h}:${m}`;
  };

  const courier = order?.shipment?.courier;
  const proofImage = order?.shipment?.proofImage;
  const trackingNumber = order?.trackingNumber || order?.shipment?.id;

  const copyTracking = () => {
    const num = order?.trackingNumber || order?.shipment?.id;
    if (num && navigator.clipboard) {
      navigator.clipboard.writeText(String(num));
      toast.success("คัดลอกเลขติดตามแล้ว");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-teal-500 border-t-transparent" />
          <p className="text-sm text-slate-500">กำลังโหลดข้อมูลการจัดส่ง...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-circle text-red-500 text-2xl" />
          </div>
          <p className="text-slate-800 font-medium mb-1">ไม่พบคำสั่งซื้อ</p>
          <p className="text-sm text-slate-500 mb-6">{error || "รหัสคำสั่งซื้อไม่ถูกต้อง"}</p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 text-sm font-medium transition-colors"
          >
            <i className="fas fa-arrow-left" /> ย้อนกลับ
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel =
    ORDER_STATUS_LABEL[order?.orderStatus] ||
    order?.orderStatus ||
    (order.oderStatus === "Delivered" && "คำสั่งซื้อสำเร็จแล้ว") ||
    (order.oderStatus === "Shipped" && "จัดส่งแล้ว") ||
    (order.oderStatus === "Processing" && "กำลังเตรียมสินค้า") ||
    "รอดำเนินการ";

  const currentStepIndex = getOrderStepIndex(order?.orderStatus);
  const isCancelled = ['CANCELLED', 'REFUNDED', 'CANCELLATION_REQUESTED', 'REFUND_REQUESTED'].includes(order?.orderStatus);
  const effectiveStepIndex = isCancelled
    ? Math.max(-1, ...(trackingHistory || []).map((h) => getOrderStepIndex(h.status)))
    : currentStepIndex;

  const summaryMessage = (() => {
    if (isCancelled) return "คำสั่งซื้อนี้ถูกยกเลิกหรือขอคืนเงิน";
    if (currentStepIndex >= 7) return "คุณได้รับสินค้าเรียบร้อยแล้ว";
    if (currentStepIndex >= 6) return "พัสดุกำลังเดินทางมาหาคุณ!";
    if (currentStepIndex >= 4) return "ไรเดอร์กำลังดำเนินการจัดส่ง";
    if (currentStepIndex >= 3) return "กำลังค้นหาไรเดอร์มารับสินค้า";
    if (currentStepIndex >= 2) return "ร้านค้ากำลังเตรียมสินค้า";
    if (currentStepIndex >= 1) return "รอร้านค้ายืนยันรับออเดอร์";
    return "รอการชำระเงิน";
  })();

  const expectedDate = order?.shipment?.deliveredTime
    ? formatDate(order.shipment.deliveredTime)
    : null;

  const isDelivered = currentStepIndex >= 7 && !isCancelled;
  const canRequestReturn =
    isDelivered &&
    order?.orderStatus === "DELIVERED" &&
    !["REQUESTED", "REFUND_REQUESTED", "REFUNDED", "PENDING"].includes(order?.refundStatus || "");

  const openReturnModal = () => {
    const items = (order?.products || []).map((p) => ({
      orderItemId: p.id,
      productTitle: p.product?.title,
      maxQty: p.count || 1,
      quantity: p.count || 1,
      price: p.price,
    }));
    setReturnForm({ reason: "", returnItems: items, proofFile: null });
    setShowReturnModal(true);
  };

  const toggleReturnItem = (orderItemId, quantity) => {
    setReturnForm((prev) => ({
      ...prev,
      returnItems: prev.returnItems.map((it) =>
        it.orderItemId === orderItemId ? { ...it, quantity: quantity ? Math.min(quantity, it.maxQty) : 0 } : it
      ),
    }));
  };

  const MIN_REASON_LENGTH = 5;
  const hasValidReason = returnForm.reason.trim().length >= MIN_REASON_LENGTH;
  const hasReturnItems = returnForm.returnItems.some((it) => it.quantity > 0);
  const canSubmitReturn = hasValidReason && hasReturnItems;

  const submitReturnRequest = async () => {
    if (!returnForm.reason.trim()) {
      toast.error("กรุณากรอกเหตุผลการขอคืนสินค้า");
      return;
    }
    if (returnForm.reason.trim().length < MIN_REASON_LENGTH) {
      toast.error(`กรุณากรอกเหตุผลอย่างน้อย ${MIN_REASON_LENGTH} ตัวอักษร`);
      return;
    }
    const selected = returnForm.returnItems.filter((it) => it.quantity > 0);
    if (selected.length === 0) {
      toast.error("กรุณเลือกรายการสินค้าที่ต้องการคืนอย่างน้อย 1 รายการ");
      return;
    }
    setSubmittingReturn(true);
    try {
      let proofImageUrl = null;
      if (returnForm.proofFile) {
        const fd = new FormData();
        Array.from(returnForm.proofFile).forEach((f) => fd.append("proof", f));
        const uploadRes = await apiClient.post("/api/orders/upload-return-proof", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        proofImageUrl = uploadRes.data?.proofImageUrl || uploadRes.data?.urls?.[0];
      }
      await apiClient.post(`/api/orders/${orderId}/return`, {
        reason: returnForm.reason.trim(),
        returnItems: selected.map((it) => ({ orderItemId: it.orderItemId, quantity: it.quantity })),
        ...(proofImageUrl && { proofImageUrl }),
      });
      toast.success("ส่งคำขอคืนสินค้าเรียบร้อย รอพิจารณา");
      setShowReturnModal(false);
      const orderRes = await apiClient.get(`/api/orders/${orderId}`);
      if (orderRes.data?.order) setOrder(orderRes.data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || "ส่งคำขอไม่สำเร็จ");
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-5 text-sm transition-colors"
        >
          <i className="fas fa-arrow-left" /> ย้อนกลับไปรายการคำสั่งซื้อ
        </Link>

        {/* Header: Order ID + Status badge */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="text-xl font-bold text-slate-800">
            คำสั่งซื้อ <span className="text-teal-600">#{order.id}</span>
          </h1>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isCancelled
                ? "bg-red-100 text-red-700"
                : isDelivered
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Summary card - สถานะจัดส่งหลัก */}
        <div
          className={`rounded-2xl p-5 mb-6 flex gap-4 items-start shadow-sm ${
            isCancelled
              ? "bg-slate-100 border border-slate-200"
              : isDelivered
              ? "bg-emerald-50 border border-emerald-100"
              : "bg-white border border-amber-100 shadow-amber-100/20"
          }`}
        >
          <div
            className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${
              isCancelled ? "bg-slate-200" : isDelivered ? "bg-emerald-100" : "bg-amber-100"
            }`}
          >
            <i
              className={`fas ${
                isDelivered ? "fa-check-circle" : isCancelled ? "fa-times-circle" : "fa-truck"
              } text-2xl ${
                isCancelled ? "text-slate-500" : isDelivered ? "text-emerald-600" : "text-amber-600"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">
              {isDelivered ? "จัดส่งถึงคุณแล้ว" : isCancelled ? "คำสั่งซื้อนี้ถูกยกเลิกหรือขอคืนเงิน" : "กำลังจัดส่ง"}
            </p>
            <p className="text-sm text-slate-600 mt-0.5">{summaryMessage}</p>
            {expectedDate && currentStepIndex >= 5 && !isCancelled && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <i className="fas fa-calendar-alt" /> คาดว่าจะได้รับ: {expectedDate}
              </p>
            )}
            {canRequestReturn && (
              <button
                type="button"
                onClick={openReturnModal}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <i className="fas fa-undo" />
                ขอคืนสินค้า/คืนเงิน
              </button>
            )}
            {isCancelled && ['REFUND_REQUESTED', 'REFUNDED'].includes(order?.orderStatus) && (
              <Link
                to="/returns"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm ml-2"
              >
                <i className="fas fa-undo" />
                ดูสถานะการคืนสินค้า
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: ที่อยู่ + สินค้า */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-slate-400" />
                ที่อยู่จัดส่ง
              </h3>
              <p className="font-medium text-slate-800">{order.orderedBy?.name || "-"}</p>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
                <i className="fas fa-phone text-slate-400 text-xs" />
                {order.shippingPhone || order.orderedBy?.phone || "-"}
              </p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed pl-5 border-l-2 border-slate-100">
                {order.shippingAddress || order.orderedBy?.address || "-"}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <i className="fas fa-shopping-bag text-slate-400" />
                รายการสินค้า
              </h3>
              <div className="space-y-3">
                {order.products?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-2 rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0].url || item.product.images[0].secure_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <i className="fas fa-image text-lg" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 line-clamp-2 font-medium">
                        {item.product?.title || "สินค้า"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        x{item.count || 1} · ฿{((item.price || 0) * (item.count || 1)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-3 pt-3 border-t border-slate-100">
                รวม ฿{(order.cartTotal || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Right: ข้อมูลขนส่ง + Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {(trackingNumber || courier || order.logisticsProvider) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <i className="fas fa-shipping-fast text-teal-500" />
                  ข้อมูลการขนส่ง
                </h3>
                <div className="space-y-2">
                  {order.logisticsProvider && (
                    <p className="text-sm text-slate-700 font-medium">
                      บริษัทขนส่ง: {order.logisticsProvider}
                    </p>
                  )}
                  {trackingNumber && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-slate-600">เลขติดตาม:</span>
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded-lg font-mono text-slate-800">
                        {trackingNumber}
                      </code>
                      <button
                        type="button"
                        onClick={copyTracking}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                      >
                        <i className="fas fa-copy" /> คัดลอก
                      </button>
                    </div>
                  )}
                  {courier && (
                    <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                      <i className="fas fa-user text-slate-400" />
                      ไรเดอร์: {courier.name || "–"}
                      {courier.phone && (
                        <a href={`tel:${courier.phone}`} className="text-teal-600 hover:underline ml-1">
                          {courier.phone}
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <i className="fas fa-route text-teal-500" />
                <h3 className="text-sm font-semibold text-slate-800">ประวัติการจัดส่ง</h3>
              </div>
              <div className="p-5">
                <div className="relative pl-7 border-l-2 border-slate-200 space-y-0">
                  {ORDER_STATUS_STEPS.slice(0, Math.min(ORDER_STATUS_STEPS.length, Math.max(2, effectiveStepIndex + 2))).map((step, stepIndex) => {
                    const isCompleted = effectiveStepIndex >= stepIndex;
                    const isCurrent = !isCancelled && currentStepIndex === stepIndex;
                    const isNext = stepIndex === effectiveStepIndex + 1;
                    const showActive = isCurrent || isNext;
                    const stepDate = getStepDateFromHistory(stepIndex, trackingHistory);
                    return (
                      <div key={step.status} className="relative flex gap-4 pb-7 last:pb-0">
                        <span
                          className={`absolute left-0 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center -translate-x-[2.35rem] z-10 ${
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : showActive
                              ? "bg-teal-500 text-white"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <i className="fas fa-check text-[10px]" />
                          ) : showActive ? (
                            <i className="fas fa-circle text-[6px]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p
                            className={`text-sm font-medium ${
                              isCurrent ? "text-teal-700" : isCompleted ? "text-slate-700" : "text-slate-500"
                            }`}
                          >
                            {step.label}
                          </p>
                          {stepDate && (
                            <p className="text-xs text-slate-500 mt-0.5">{formatDate(stepDate)}</p>
                          )}
                          {proofImage &&
                            stepIndex === 7 &&
                            (order?.orderStatus === "DELIVERED" || order?.orderStatus === "COMPLETED") && (
                              <a
                                href={proofImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 mt-2 font-medium"
                              >
                                <i className="fas fa-file-image" /> ดูหลักฐานการจัดส่ง
                              </a>
                            )}
                          {courier && stepIndex >= 4 && stepIndex <= 6 && isCurrent && (
                            <p className="text-xs text-slate-500 mt-1">
                              ไรเดอร์: {courier.name || "–"} {courier.phone && `· ${courier.phone}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 text-sm font-medium transition-colors"
          >
            <i className="fas fa-shopping-cart" /> ซื้อสินค้าต่อ
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <i className="fas fa-list" /> รายการคำสั่งซื้อ
          </Link>
        </div>
      </div>

      {/* Modal ขอคืนสินค้า/คืนเงิน */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">แบบฟอร์มขอคืนสินค้า/คืนเงิน</h3>
              <p className="text-sm text-slate-500 mt-0.5">กรุณากรอกเหตุผลและเลือกรายการที่ต้องการคืน</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">รายการที่ต้องการคืน</label>
                <div className="space-y-2">
                  {returnForm.returnItems.map((it) => (
                    <label key={it.orderItemId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={it.quantity > 0}
                        onChange={(e) => toggleReturnItem(it.orderItemId, e.target.checked ? it.maxQty : 0)}
                        className="rounded border-slate-300 text-orange-500"
                      />
                      <span className="flex-1 text-sm text-slate-800">{it.productTitle}</span>
                      {it.quantity > 0 && (
                        <select
                          value={it.quantity}
                          onChange={(e) => toggleReturnItem(it.orderItemId, parseInt(e.target.value, 10))}
                          className="text-sm border border-slate-200 rounded-lg px-2 py-1"
                        >
                          {Array.from({ length: it.maxQty }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      )}
                      <span className="text-slate-500 text-xs">x{it.maxQty}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">เหตุผลการขอคืนสินค้า (จำเป็น)</label>
                <textarea
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="เช่น สินค้าชำรุด ไม่ตรงตามที่สั่ง"
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {returnForm.reason.trim().length > 0 && returnForm.reason.trim().length < MIN_REASON_LENGTH && (
                  <p className="text-amber-600 text-xs mt-1">กรุณากรอกเหตุผลอย่างน้อย {MIN_REASON_LENGTH} ตัวอักษร (ปัจจุบัน {returnForm.reason.trim().length} ตัว)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รูปหลักฐาน (สินค้าชำรุด ฯลฯ)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, proofFile: e.target.files }))}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700"
                />
              </div>
            </div>
            <div className="p-5 flex gap-3 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={submitReturnRequest}
                disabled={submittingReturn || !canSubmitReturn}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {submittingReturn ? "กำลังส่ง..." : "ยืนยันส่งคำขอ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
