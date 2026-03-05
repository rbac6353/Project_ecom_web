import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../utils/axiosConfig";
import { toast } from "react-toastify";

const SHIPMENT_STEPS = [
  { status: "IN_TRANSIT", label: "รับของที่ร้าน", icon: "fa-box", color: "bg-sky-500" },
  { status: "OUT_FOR_DELIVERY", label: "กำลังนำจ่าย", icon: "fa-motorcycle", color: "bg-orange-500" },
  { status: "DELIVERED", label: "ส่งสำเร็จ", icon: "fa-check-circle", color: "bg-emerald-500" },
];

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  });
};

const RiderDashboard = () => {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [returnJobs, setReturnJobs] = useState([]);
  const [myShipments, setMyShipments] = useState([]);
  const [myReturnPickups, setMyReturnPickups] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingMy, setLoadingMy] = useState(true);
  const [updating, setUpdating] = useState(new Set());
  const [activeTab, setActiveTab] = useState("available");
  const [returnCompleteModal, setReturnCompleteModal] = useState({ open: false, id: null });
  const [returnProofFile, setReturnProofFile] = useState(null);
  const [returnProofPreview, setReturnProofPreview] = useState(null);

  const loadAvailableJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const { data } = await apiClient.get("/api/shipments/available-jobs");
      setAvailableJobs(data.jobs || []);
      setReturnJobs(data.returnJobs || []);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 403) {
        toast.error("กรุณาเข้าสู่ระบบด้วยบัญชี Courier (ไรเดอร์) เพื่อดูงานที่รอรับ");
      } else {
        toast.error(msg || "โหลดงานที่รอรับไม่สำเร็จ");
      }
      setAvailableJobs([]);
      setReturnJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const loadMyShipments = useCallback(async () => {
    try {
      setLoadingMy(true);
      const { data } = await apiClient.get("/api/shipments/my");
      setMyShipments(data.shipments || []);
      setMyReturnPickups(data.returnPickups || []);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("กรุณาเข้าสู่ระบบด้วยบัญชี Courier (ไรเดอร์)");
      } else {
        toast.error(err.response?.data?.message || "โหลดรายการของฉันไม่สำเร็จ");
      }
      setMyShipments([]);
      setMyReturnPickups([]);
    } finally {
      setLoadingMy(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableJobs();
  }, [loadAvailableJobs]);

  useEffect(() => {
    if (activeTab === "my") loadMyShipments();
  }, [activeTab, loadMyShipments]);

  // รีเฟรชงานที่รอรับอัตโนมัติทุก 10 วินาที (เมื่อร้านกดแจ้งหาไรเดอร์ งานจะโผล่)
  useEffect(() => {
    if (activeTab !== "available") return;
    const t = setInterval(() => loadAvailableJobs(), 10000);
    return () => clearInterval(t);
  }, [activeTab, loadAvailableJobs]);

  const handleAssign = async (shipmentId) => {
    try {
      setUpdating((prev) => new Set(prev).add(`assign-${shipmentId}`));
      await apiClient.post(`/api/shipments/${shipmentId}/assign`);
      toast.success("รับงานสำเร็จ");
      setActiveTab("my"); // สลับไปแท็บ "งานของฉัน" ทันที
      loadAvailableJobs();
      loadMyShipments();
    } catch (err) {
      toast.error(err.response?.data?.message || "รับงานไม่สำเร็จ");
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(`assign-${shipmentId}`);
        return next;
      });
    }
  };

  const handleUpdateStatus = async (shipmentId, status) => {
    try {
      setUpdating((prev) => new Set(prev).add(`${shipmentId}-${status}`));
      if (status === "IN_TRANSIT") {
        await apiClient.patch(`/api/shipments/${shipmentId}/pickup`);
      } else if (status === "OUT_FOR_DELIVERY") {
        await apiClient.patch(`/api/shipments/${shipmentId}/out-for-delivery`);
      } else if (status === "DELIVERED") {
        await apiClient.patch(`/api/shipments/${shipmentId}/complete`);
      } else {
        await apiClient.patch(`/api/shipments/${shipmentId}/status`, { status });
      }
      toast.success("อัปเดตสถานะสำเร็จ");
      loadMyShipments();
    } catch (err) {
      toast.error(err.response?.data?.message || "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(`${shipmentId}-${status}`);
        return next;
      });
    }
  };

  const handleAssignReturnPickup = async (id) => {
    try {
      setUpdating((prev) => new Set(prev).add(`return-assign-${id}`));
      await apiClient.post(`/api/shipments/return-jobs/${id}/assign`);
      toast.success("รับงานรับสินค้าคืนสำเร็จ");
      setActiveTab("my");
      loadAvailableJobs();
      loadMyShipments();
    } catch (err) {
      toast.error(err.response?.data?.message || "รับงานไม่สำเร็จ");
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(`return-assign-${id}`);
        return next;
      });
    }
  };

  const handleReturnPickupStatus = async (id, action) => {
    if (action === "complete") {
      setReturnCompleteModal({ open: true, id });
      setReturnProofFile(null);
      setReturnProofPreview(null);
      return;
    }
    try {
      const key = `return-${id}-${action}`;
      setUpdating((prev) => new Set(prev).add(key));
      if (action === "pickup") {
        await apiClient.patch(`/api/shipments/return-jobs/${id}/pickup`);
        toast.success("บันทึกรับของจากลูกค้าแล้ว");
      }
      loadMyShipments();
    } catch (err) {
      toast.error(err.response?.data?.message || "อัปเดตไม่สำเร็จ");
    } finally {
      if (action !== "complete") {
        setUpdating((prev) => {
          const next = new Set(prev);
          next.delete(`return-${id}-${action}`);
          return next;
        });
      }
    }
  };

  const handleReturnCompleteSubmit = async () => {
    const id = returnCompleteModal.id;
    if (!id || !returnProofFile) {
      toast.error("กรุณาอัปโหลดรูปหลักฐานการส่งของคืนร้าน");
      return;
    }
    try {
      setUpdating((prev) => new Set(prev).add(`return-${id}-complete`));
      const fd = new FormData();
      fd.append("proof", returnProofFile);
      const uploadRes = await apiClient.post("/api/orders/upload-return-proof", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const proofImageUrl = uploadRes.data?.proofImageUrl || uploadRes.data?.urls?.[0];
      if (!proofImageUrl) {
        toast.error("อัปโหลดรูปไม่สำเร็จ");
        return;
      }
      await apiClient.patch(`/api/shipments/return-jobs/${id}/complete`, { proofImageUrl });
      toast.success("ส่งสินค้าคืนร้านเรียบร้อย");
      setReturnCompleteModal({ open: false, id: null });
      setReturnProofFile(null);
      setReturnProofPreview(null);
      loadMyShipments();
    } catch (err) {
      toast.error(err.response?.data?.message || "อัปเดตไม่สำเร็จ");
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(`return-${id}-complete`);
        return next;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ขั้นถัดไป: WAITING_PICKUP → รับของที่ร้าน (IN_TRANSIT), IN_TRANSIT → กำลังนำจ่าย, ฯลฯ
  const getNextStep = (currentStatus) => {
    if (currentStatus === "WAITING_PICKUP") return SHIPMENT_STEPS[0]; // รับของที่ร้าน
    const idx = SHIPMENT_STEPS.findIndex((s) => s.status === currentStatus);
    if (idx < 0 || idx >= SHIPMENT_STEPS.length - 1) return null;
    return SHIPMENT_STEPS[idx + 1];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
              <i className="fas fa-motorcycle text-2xl" />
              หน้าไรเดอร์
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              เมื่อร้านค้ากด &quot;แจ้งหาไรเดอร์&quot; งานจะเข้ามาที่แท็บ &quot;งานที่รอรับ&quot; — กดรับงานหรือไม่ได้ตามต้องการ
            </p>
          </div>

          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("available")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "available"
                  ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <i className="fas fa-list mr-2" />
              งานที่รอรับ ({availableJobs.length + returnJobs.length})
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "my"
                  ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <i className="fas fa-box-open mr-2" />
              งานของฉัน ({myShipments.length + myReturnPickups.length})
            </button>
          </div>
        </div>

        {activeTab === "available" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                งานที่ร้านค้ากด &quot;แจ้งหาไรเดอร์&quot; แล้ว — เลือกกด &quot;รับงาน&quot; หรือไม่รับ
              </p>
              <button
                type="button"
                onClick={() => loadAvailableJobs()}
                disabled={loadingJobs}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <i className={`fas fa-sync-alt ${loadingJobs ? "animate-spin" : ""}`} />
                รีเฟรช
              </button>
            </div>
            {loadingJobs ? (
              <div className="bg-white rounded-xl shadow border border-slate-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent mx-auto mb-3" />
                <p className="text-slate-600">กำลังโหลดงานที่รอรับ...</p>
              </div>
            ) : availableJobs.length === 0 && returnJobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow border border-slate-200 p-12 text-center">
                <i className="fas fa-inbox text-5xl text-slate-300 mb-4" />
                <p className="text-slate-600 font-medium">ไม่มีงานที่รอรับในขณะนี้</p>
                <p className="text-slate-500 text-sm mt-1">เมื่อร้านกด &quot;แจ้งหาไรเดอร์&quot; หรือมีคำขอคืนสินค้า งานจะแสดงที่นี่</p>
                <p className="text-slate-400 text-xs mt-3">ตรวจสอบ: 1) เข้าสู่ระบบด้วยบัญชี Courier 2) ร้านกด &quot;แจ้งหาไรเดอร์&quot; จากออเดอร์ที่สถานะ &quot;สินค้าพร้อมแล้ว&quot; 3) กดปุ่มรีเฟรชด้านบน</p>
              </div>
            ) : (
              <>
              {availableJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-sm">ออเดอร์ #</span>
                      <span className="font-semibold text-slate-900 ml-1">{job.order?.id}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                      รอไรเดอร์รับ
                    </span>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 text-xs mb-2 flex-wrap gap-x-4">
                      <span title="เวลาที่ลูกค้าสั่งซื้อ">
                        <i className="fas fa-shopping-cart w-4 text-slate-400 mr-1" />
                        สั่งซื้อ: {formatDateTime(job.order?.createdAt)}
                      </span>
                      <span title="เวลาที่ร้านแจ้งหาไรเดอร์">
                        <i className="fas fa-bell w-4 text-slate-400 mr-1" />
                        แจ้งหาไรเดอร์: {formatDateTime(job.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <i className="fas fa-user w-5 text-slate-400" />
                      {job.order?.orderedBy?.name || job.order?.orderedBy?.email || "ไม่ระบุ"}
                    </div>
                    {job.order?.orderedBy?.phone && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <i className="fas fa-phone w-5 text-slate-400" />
                        {job.order.orderedBy.phone}
                      </div>
                    )}
                    {job.order?.shippingAddress && (
                      <div className="flex items-start gap-2 text-slate-700">
                        <i className="fas fa-map-marker-alt w-5 text-slate-400 mt-0.5" />
                        <span className="line-clamp-2">{job.order.shippingAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600 pt-1">
                      <i className="fas fa-money-bill-wave w-5 text-slate-400" />
                      <span className="text-slate-500 text-xs">ยอดรวมออเดอร์:</span>
                      <span className="font-semibold text-emerald-600">
                        ฿{Number(job.order?.cartTotal || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => handleAssign(job.id)}
                      disabled={updating.has(`assign-${job.id}`)}
                      className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updating.has(`assign-${job.id}`) ? (
                        <>
                          <i className="fas fa-spinner fa-spin" />
                          กำลังรับงาน...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-hand-holding" />
                          รับงาน
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {returnJobs.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <i className="fas fa-undo" />
                    งานรับสินค้าคืนจากลูกค้า ส่งคืนร้าน ({returnJobs.length})
                  </h3>
                  <div className="space-y-4">
                    {returnJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-amber-50/80 rounded-xl shadow border border-amber-200 overflow-hidden"
                      >
                        <div className="p-4 border-b border-amber-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-amber-900">รับสินค้าคืน #คืน-{job.orderReturn?.id}</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white border border-orange-600">
                              งานรับของคืน (Return)
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-900">รอไรเดอร์รับ</span>
                        </div>
                        <div className="p-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-amber-800/80 text-xs mb-2">
                            <i className="fas fa-clock w-4 text-amber-600" />
                            สร้างงานเมื่อ: {formatDateTime(job.createdAt)}
                          </div>
                          <div className="flex items-start gap-2">
                            <i className="fas fa-map-marker-alt w-5 text-orange-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-slate-500 block text-xs">จุดรับของ (Pick-up): ที่อยู่ลูกค้า</span>
                              <span className="font-medium text-slate-800">{job.pickupAddress}</span>
                            </div>
                          </div>
                          {job.pickupPhone && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <i className="fas fa-phone w-5 text-slate-400" />
                              {job.pickupPhone}
                            </div>
                          )}
                          <div className="flex items-start gap-2 pt-1">
                            <i className="fas fa-store w-5 text-amber-600 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-slate-500 block text-xs">จุดส่งของ (Drop-off): ร้านค้า</span>
                              <span className="font-medium text-slate-800">{job.store?.name}</span>
                              {job.store?.address && <span className="text-slate-600 block"> {job.store.address}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-amber-100/50 border-t border-amber-200">
                          <button
                            onClick={() => handleAssignReturnPickup(job.id)}
                            disabled={updating.has(`return-assign-${job.id}`)}
                            className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updating.has(`return-assign-${job.id}`) ? (
                              <><i className="fas fa-spinner fa-spin" /> กำลังรับงาน...</>
                            ) : (
                              <><i className="fas fa-hand-holding" /> รับงานรับสินค้าคืน</>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {activeTab === "my" && (
          <div className="space-y-4">
            {loadingMy ? (
              <div className="bg-white rounded-xl shadow border border-slate-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent mx-auto mb-3" />
                <p className="text-slate-600">กำลังโหลดงานของฉัน...</p>
              </div>
            ) : myShipments.length === 0 && myReturnPickups.length === 0 ? (
              <div className="bg-white rounded-xl shadow border border-slate-200 p-12 text-center">
                <i className="fas fa-box-open text-5xl text-slate-300 mb-4" />
                <p className="text-slate-600 font-medium">ยังไม่มีงานที่รับ</p>
                <p className="text-slate-500 text-sm mt-1">ไปที่แท็บ &quot;งานที่รอรับ&quot; เพื่อรับงานจัดส่งหรืองานรับสินค้าคืน</p>
              </div>
            ) : (
              <>
              {myShipments.map((s) => {
                const nextStep = getNextStep(s.status);
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-slate-500 text-sm">ออเดอร์ #</span>
                        <span className="font-semibold text-slate-900 ml-1">{s.orderId}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          s.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "IN_TRANSIT" || s.status === "OUT_FOR_DELIVERY"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        {s.status === "WAITING_PICKUP" && "รอไปรับของ"}
                        {s.status === "IN_TRANSIT" && "รับของแล้ว กำลังขนส่ง"}
                        {s.status === "OUT_FOR_DELIVERY" && "กำลังนำส่ง"}
                        {s.status === "DELIVERED" && "ส่งสำเร็จ"}
                        {s.status === "FAILED" && "จัดส่งไม่สำเร็จ"}
                      </span>
                    </div>
                    <div className="p-4 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2 text-slate-600 text-xs mb-2 flex-wrap gap-x-4">
                        <span><i className="fas fa-shopping-cart w-4 text-slate-400 mr-1" />เวลาออเดอร์: {formatDateTime(s.order?.createdAt)}</span>
                        {s.pickupTime && (
                          <span><i className="fas fa-box w-4 text-slate-400 mr-1" />รับของเมื่อ: {formatDateTime(s.pickupTime)}</span>
                        )}
                        {s.deliveredTime && (
                          <span><i className="fas fa-check-circle w-4 text-slate-400 mr-1" />ส่งเมื่อ: {formatDateTime(s.deliveredTime)}</span>
                        )}
                        {!s.pickupTime && !s.deliveredTime && (
                          <span><i className="fas fa-sync w-4 text-slate-400 mr-1" />อัปเดตล่าสุด: {formatDateTime(s.updatedAt)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-user w-5 text-slate-400" />
                        {s.order?.orderedBy?.name || s.order?.orderedBy?.email || "-"}
                      </div>
                      {s.order?.orderedBy?.phone && (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-phone w-5 text-slate-400" />
                          {s.order.orderedBy.phone}
                        </div>
                      )}
                      {s.order?.shippingAddress && (
                        <div className="flex items-start gap-2">
                          <i className="fas fa-map-marker-alt w-5 text-slate-400 mt-0.5" />
                          <span className="line-clamp-2">{s.order.shippingAddress}</span>
                        </div>
                      )}
                    </div>
                    {/* Step buttons */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        {SHIPMENT_STEPS.map((step) => {
                          const isDone =
                            SHIPMENT_STEPS.findIndex((x) => x.status === s.status) >=
                            SHIPMENT_STEPS.findIndex((x) => x.status === step.status);
                          const isNext = nextStep?.status === step.status;
                          const key = `${s.id}-${step.status}`;
                          return (
                            <button
                              key={step.status}
                              onClick={() =>
                                isNext ? handleUpdateStatus(s.id, step.status) : undefined
                              }
                              disabled={!isNext || updating.has(key)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                                isDone && !isNext
                                  ? "bg-slate-200 text-slate-600 cursor-default"
                                  : isNext
                                  ? `${step.color} text-white hover:opacity-90 disabled:opacity-50`
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              {isDone && !isNext && <i className="fas fa-check" />}
                              {isNext && updating.has(key) && <i className="fas fa-spinner fa-spin" />}
                              <i className={`fas ${step.icon}`} />
                              {step.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {myReturnPickups.length > 0 && (
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <i className="fas fa-undo" />
                    งานรับสินค้าคืนของฉัน ({myReturnPickups.length})
                  </h3>
                  <div className="space-y-4">
                    {myReturnPickups.map((rp) => (
                      <div
                        key={rp.id}
                        className="bg-amber-50/80 rounded-xl shadow border border-amber-200 overflow-hidden"
                      >
                        <div className="p-4 border-b border-amber-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-amber-900">รับสินค้าคืน #คืน-{rp.orderReturn?.id}</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white border border-orange-600">
                              งานรับของคืน (Return)
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            rp.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800" :
                            rp.status === "PICKED_UP" ? "bg-orange-100 text-orange-800" : "bg-amber-200 text-amber-900"
                          }`}>
                            {rp.status === "WAITING_PICKUP" && "รอไปรับของจากลูกค้า"}
                            {rp.status === "PICKED_UP" && "รับของแล้ว — กำลังนำส่งคืนร้าน"}
                            {rp.status === "DELIVERED" && "ส่งคืนร้านเรียบร้อย"}
                          </span>
                        </div>
                        <div className="p-4 space-y-2 text-sm text-slate-700">
                          <div className="flex items-center gap-2 text-amber-800/80 text-xs mb-2 flex-wrap gap-x-4">
                            <span><i className="fas fa-clock w-4 text-amber-600" />สร้างงานเมื่อ: {formatDateTime(rp.createdAt)}</span>
                            <span><i className="fas fa-sync w-4 text-amber-600" />อัปเดตล่าสุด: {formatDateTime(rp.updatedAt)}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <i className="fas fa-map-marker-alt w-5 text-orange-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-slate-500 block text-xs">จุดรับของ (Pick-up): ที่อยู่ลูกค้า</span>
                              <span>{rp.pickupAddress}</span>
                            </div>
                          </div>
                          {rp.pickupPhone && <div><span className="text-slate-500">โทร: </span>{rp.pickupPhone}</div>}
                          <div className="flex items-start gap-2">
                            <i className="fas fa-store w-5 text-amber-600 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-slate-500 block text-xs">จุดส่งของ (Drop-off): ร้านค้า</span>
                              <span>{rp.store?.name}{rp.store?.address ? ` — ${rp.store.address}` : ""}</span>
                            </div>
                          </div>
                        </div>
                        {rp.status !== "DELIVERED" && (
                          <div className="p-4 bg-amber-100/50 border-t border-amber-200 flex gap-2">
                            {rp.status === "WAITING_PICKUP" && (
                              <button
                                onClick={() => handleReturnPickupStatus(rp.id, "pickup")}
                                disabled={updating.has(`return-${rp.id}-pickup`)}
                                className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {updating.has(`return-${rp.id}-pickup`) ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-box-open" />}
                                รับของจากลูกค้าแล้ว
                              </button>
                            )}
                            {rp.status === "PICKED_UP" && (
                              <button
                                onClick={() => handleReturnPickupStatus(rp.id, "complete")}
                                disabled={updating.has(`return-${rp.id}-complete`)}
                                className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {updating.has(`return-${rp.id}-complete`) ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check-circle" />}
                                ส่งของถึงร้านค้า (อัปโหลดรูปหลักฐาน)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {/* Modal อัปโหลดรูปหลักฐานส่งของคืนร้าน */}
        {returnCompleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !updating.has(`return-${returnCompleteModal.id}-complete`) && setReturnCompleteModal({ open: false, id: null })}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-lg font-bold text-slate-800 mb-2">ส่งของถึงร้านค้าแล้ว</h4>
              <p className="text-slate-600 text-sm mb-4">กรุณาอัปโหลดรูปหลักฐานการส่งของคืนร้าน (เช่น ภาพสินค้าที่ร้าน)</p>
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="return-proof-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReturnProofFile(file);
                      setReturnProofPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <label htmlFor="return-proof-input" className="block border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
                  {returnProofPreview ? (
                    <div className="space-y-2">
                      <img src={returnProofPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
                      <span className="text-sm text-slate-600">คลิกเพื่อเปลี่ยนรูป</span>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-camera text-3xl text-slate-300 mb-2 block" />
                      <span className="text-slate-600 text-sm">คลิกเพื่อเลือกรูปหลักฐาน</span>
                    </>
                  )}
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setReturnCompleteModal({ open: false, id: null })}
                  disabled={updating.has(`return-${returnCompleteModal.id}-complete`)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleReturnCompleteSubmit}
                  disabled={!returnProofFile || updating.has(`return-${returnCompleteModal.id}-complete`)}
                  className="px-5 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  {updating.has(`return-${returnCompleteModal.id}-complete`) ? (
                    <><i className="fas fa-spinner fa-spin" /> กำลังส่ง...</>
                  ) : (
                    <><i className="fas fa-check-circle" /> ยืนยันส่งคืนร้าน</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;
