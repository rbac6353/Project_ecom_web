import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authStorage } from '../../utils/authStorage';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';

const POLL_INTERVAL_MS = 2000; // โพลทุก 2 วินาที — หลัง webhook เข้ามาหน้าจะอัปเดตภายใน 2 วินาที
const SUCCESS_DELAY_MS = 1800; // แสดงแจ้งเตือน "ชำระเรียบร้อยแล้ว" ก่อนเด้งไปหน้าสำเร็จ
const COUNTDOWN_SECONDS = 10 * 60; // 10 นาที

/**
 * หน้า QR PromptPay — แสดง QR Code, เลขนับถอยหลัง, และ Polling สถานะออเดอร์
 * เมื่อ orderStatus เปลี่ยนเป็น PENDING_CONFIRMATION หรือ oderStatus เป็น Processing จะ redirect ไปหน้าสำเร็จ
 */
const QRPaymentScreen = ({
  orderId,
  payment,
  totalAmount,
  onSuccess,
  onBack,
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [qrValue, setQrValue] = useState(payment?.qrCodeData || '');
  const pollingRef = useRef(null);
  const mountedRef = useRef(true);

  // ดึง QR ล่าสุดจาก API เสมอ (รองรับ payment เก่าที่เก็บ QR เก่าใน DB และให้ได้ QR ที่สแกนได้จริง)
  useEffect(() => {
    if (!payment?.id || payment.status === 'completed') return;
    let cancelled = false;
    const token = authStorage.getToken();
    axios
      .get(`/api/payment/${payment.id}/promptpay`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const qr = res.data?.promptPay?.qrString || res.data?.qrString;
        if (!cancelled && qr) setQrValue(qr);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [payment?.id, payment?.status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isPaymentConfirmed = useCallback((order) => {
    if (!order) return false;
    return (
      order.orderStatus === 'PENDING_CONFIRMATION' ||
      order.oderStatus === 'Processing'
    );
  }, []);

  const fetchOrderAndCheck = useCallback(async () => {
    if (!orderId) return null;
    try {
      const token = authStorage.getToken();
      const { data } = await axios.get(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.order ?? null;
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'โหลดสถานะไม่สำเร็จ');
      return null;
    }
  }, [orderId]);

  const handleConfirmSuccess = useCallback(() => {
    if (typeof onSuccess === 'function') {
      onSuccess();
    } else {
      navigate(`/payment/${orderId}`, { replace: true });
      window.location.reload();
    }
  }, [onSuccess, orderId, navigate]);

  // แจ้งเตือน "ชำระเรียบร้อยแล้ว" แล้วค่อยเด้งไปหน้าชำระเงินสำเร็จ
  const showPaidThenRedirect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    toast.success('ชำระเรียบร้อยแล้ว', {
      position: 'top-center',
      autoClose: SUCCESS_DELAY_MS,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: false,
    });
    setTimeout(() => {
      if (mountedRef.current) handleConfirmSuccess();
    }, SUCCESS_DELAY_MS);
  }, [handleConfirmSuccess]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // เลขนับถอยหลัง 10 นาที
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Polling: ตรวจสอบสถานะออเดอร์ทุก 5 วินาที
  useEffect(() => {
    if (!orderId || !payment || payment.status === 'completed') return;

    const poll = async () => {
      const order = await fetchOrderAndCheck();
      if (!mountedRef.current) return;
      if (order && isPaymentConfirmed(order)) {
        showPaidThenRedirect();
      }
    };

    poll();
    pollingRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, payment?.status, fetchOrderAndCheck, isPaymentConfirmed, showPaidThenRedirect]);

  const handleCheckPayment = async () => {
    setChecking(true);
    setError(null);
    const order = await fetchOrderAndCheck();
    setChecking(false);
    if (order && isPaymentConfirmed(order)) {
      showPaidThenRedirect();
    } else if (mountedRef.current) {
      setError('ยังไม่พบการชำระเงิน กรุณาโอนเงินให้ตรงกับยอดที่แสดง');
    }
  };


  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* หัวข้อธีมส้ม - น่าเชื่อถือ */}
        <div className="bg-gradient-to-r from-[#ee4d2d] via-[#f7522e] to-[#ff7337] px-6 py-5 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-qrcode text-white text-2xl" />
          </div>
          <h1 className="text-xl font-bold text-white">โอนเงินผ่าน QR PromptPay</h1>
          <p className="text-white/90 text-sm mt-1">สแกน QR Code ด้วยแอพธนาคาร</p>
        </div>

        <div className="p-6">
          {/* QR Code กลางบล็อก */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-3">สแกน QR Code นี้เพื่อชำระเงิน</p>
            <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-inner">
              {qrValue ? (
                <QRCodeSVG
                  value={qrValue}
                  size={220}
                  level="H"
                  includeMargin
                />
              ) : (
                <div className="w-[220px] h-[220px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-qrcode text-5xl text-gray-300" />
                </div>
              )}
            </div>

            <p className="text-2xl font-bold text-[#ee4d2d] mt-4">
              ฿{(totalAmount ?? payment?.amount ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Ref: {payment?.transactionId || '—'}
            </p>

            {/* เลขนับถอยหลัง */}
            <div className="mt-4 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">QR หมดอายุใน</p>
              <p className={`text-xl font-mono font-bold ${countdown <= 60 ? 'text-red-600' : 'text-amber-700'}`}>
                {formatTime(countdown)}
              </p>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-600" />
              หมายเหตุ
            </p>
            <p className="text-sm text-blue-800 mt-1 leading-relaxed">
              ระบบจะตรวจสอบยอดเงินอัตโนมัติ กรุณาโอนเงินให้ตรงกับยอดที่แสดง
            </p>
            <p className="text-xs text-blue-700 mt-2 opacity-90">
              ถ้าสแกนแล้วขึ้น Error (เช่น FE000) กรุณาตรวจสอบว่าเบอร์รับเงินลงทะเบียนพร้อมเพย์รับเงินแล้ว
            </p>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ปุ่มตรวจสอบการชำระเงิน */}
          <button
            type="button"
            onClick={handleCheckPayment}
            disabled={checking}
            className="w-full mt-4 py-3 rounded-xl font-medium text-white bg-[#ee4d2d] hover:bg-[#d73211] disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt" />
                ตรวจสอบการชำระเงิน
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full mt-3 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            <i className="fas fa-arrow-left mr-2" />
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRPaymentScreen;
