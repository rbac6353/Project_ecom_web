import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import {
  ORDER_STATUS_STEPS,
  getOrderStepIndex,
  getStepDateFromHistory,
} from "../../constants/orderStatus";

const TrackingTimeline = ({ orderId, className = "", compact = false }) => {
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [orderRes, trackingRes] = await Promise.all([
          apiClient.get(`/api/orders/${orderId}`),
          apiClient.get(`/api/orders/${orderId}/tracking`),
        ]);
        if (!cancelled) {
          if (orderRes.data?.order) setOrder(orderRes.data.order);
          if (trackingRes.data?.trackingHistory)
            setHistory(trackingRes.data.trackingHistory);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "โหลดประวัติไม่สำเร็จ");
          toast.error(err.response?.data?.message || "โหลดประวัติการติดตามไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [orderId]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm flex items-center gap-2 ${className}`}>
        <i className="fas fa-exclamation-circle flex-shrink-0" />
        {error}
      </div>
    );
  }

  const currentStepIndex = getOrderStepIndex(order?.orderStatus);
  const isCancelled = ['CANCELLED', 'REFUNDED', 'CANCELLATION_REQUESTED', 'REFUND_REQUESTED'].includes(order?.orderStatus);

  const effectiveStepIndex = isCancelled
    ? Math.max(-1, ...history.map((h) => getOrderStepIndex(h.status)))
    : currentStepIndex;

  // โหมดย่อ: แสดงแค่ขั้นล่าสุด + ลิงก์ดูทั้งหมด
  if (compact && orderId) {
    const showStepIndex = Math.max(0, effectiveStepIndex);
    const step = ORDER_STATUS_STEPS[showStepIndex];
    const stepDate = getStepDateFromHistory(showStepIndex, history);
    const isDeliveredSuccess = step?.status === "COMPLETED";
    return (
      <div className={`space-y-0 ${className}`}>
        <Link
          to={`/orders/${orderId}`}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group ${
            isDeliveredSuccess
              ? "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200"
              : "border-slate-100 bg-slate-50/50 hover:bg-teal-50 hover:border-teal-200"
          }`}
        >
          <span
            className={`flex-shrink-0 w-9 h-9 rounded-xl text-white flex items-center justify-center ${
              isDeliveredSuccess ? "bg-emerald-500" : "bg-teal-500"
            }`}
          >
            {isDeliveredSuccess ? (
              <i className="fas fa-check text-sm" />
            ) : (
              <i className="fas fa-truck text-sm" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium text-slate-800 ${
                isDeliveredSuccess ? "group-hover:text-emerald-700" : "group-hover:text-teal-700"
              }`}
            >
              {step?.label || "กำลังดำเนินการ"}
            </p>
            {stepDate && (
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(stepDate)}</p>
            )}
          </div>
          <span className="text-xs text-teal-600 group-hover:underline flex items-center gap-1 font-medium">
            ดูทั้งหมด
            <i className="fas fa-chevron-right text-[10px]" />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <i className="fas fa-route text-teal-500" />
        ประวัติการจัดส่ง
      </h4>
      <div className="relative pl-7 border-l-2 border-slate-200 space-y-0">
        {ORDER_STATUS_STEPS.slice(0, Math.min(ORDER_STATUS_STEPS.length, Math.max(2, effectiveStepIndex + 2))).map((step, stepIndex) => {
          const isCompleted = effectiveStepIndex >= stepIndex;
          const isCurrent = !isCancelled && currentStepIndex === stepIndex;
          const isNext = stepIndex === effectiveStepIndex + 1;
          const showActive = isCurrent || isNext;
          const stepDate = getStepDateFromHistory(stepIndex, history);
          return (
            <div key={step.status} className="relative flex gap-4 pb-7 last:pb-0">
              <span
                className={`absolute left-0 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center -translate-x-[2.35rem] z-10 ${
                  isCompleted ? "bg-emerald-500 text-white" : showActive ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-400"
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackingTimeline;
