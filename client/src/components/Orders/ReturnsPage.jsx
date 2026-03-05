import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const STATUS_MAP = {
  REQUESTED: { label: 'รอพิจารณา', class: 'bg-amber-100 text-amber-800 border-amber-200' },
  APPROVED: { label: 'อนุมัติแล้ว', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'ปฏิเสธ', class: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const REFUND_STATUS_LABEL = {
  NONE: 'รอการดำเนินการ',
  PENDING: 'รอการดำเนินการ',
  REQUESTED: 'รอร้านค้าพิจารณา',
  WAITING_FOR_PICKUP: 'รอไรเดอร์มารับของ',
  RETURN_IN_TRANSIT: 'ไรเดอร์กำลังนำของคืนร้าน',
  RETURN_DELIVERED: 'ส่งของถึงร้านแล้ว (รอตรวจสอบ)',
  IN_DISPUTE: 'ข้อพิพาท — รอแอดมินพิจารณา',
  APPROVED: 'คืนเงินแล้ว',
  REJECTED: 'ปฏิเสธการคืน',
};

const getRefundStatusText = (r) => {
  if (r.status !== 'REQUESTED') return null;
  const pickup = r.returnPickups?.[0];
  if (pickup) {
    if (pickup.status === 'DELIVERED') return REFUND_STATUS_LABEL.RETURN_DELIVERED;
    if (pickup.status === 'PICKED_UP') return REFUND_STATUS_LABEL.RETURN_IN_TRANSIT;
    if (pickup.status === 'WAITING_PICKUP' && pickup.courierId) return 'ไรเดอร์รับงานแล้ว';
    return REFUND_STATUS_LABEL.WAITING_FOR_PICKUP;
  }
  const rs = r.order?.refundStatus || 'NONE';
  return REFUND_STATUS_LABEL[rs] || REFUND_STATUS_LABEL.NONE;
};

const ReturnsPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/user/returns');
      setList(res.data.orderReturns || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'โหลดรายการขอคืนไม่สำเร็จ');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getStatusBadge = (status) => {
    const s = STATUS_MAP[status] || { label: status, class: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.class}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-undo text-indigo-500" />
              คำขอคืนสินค้าของฉัน
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              รับประกันคืนสินค้า 7 วัน — ดูสถานะคำขอคืนและยอดคืนเงิน
            </p>
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
          >
            <i className="fas fa-arrow-left" />
            กลับไปคำสั่งซื้อของฉัน
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <i className="fas fa-inbox text-5xl text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">ยังไม่มีคำขอคืนสินค้า</p>
            <p className="text-slate-500 text-sm mt-1">
              เมื่อคุณขอคืนสินค้าจากออเดอร์ที่จัดส่งแล้ว คำขอจะแสดงที่นี่
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium"
            >
              <i className="fas fa-shopping-bag" />
              ดูคำสั่งซื้อของฉัน
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">คำขอคืน #{r.id}</span>
                      <Link
                        to={`/orders/${r.order?.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        ออเดอร์ #{r.order?.id}
                      </Link>
                      {getStatusBadge(r.status)}
                      {getRefundStatusText(r) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {getRefundStatusText(r)}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-sm">{formatDate(r.created_at)}</span>
                  </div>
                  {getRefundStatusText(r) && (
                    <p className="mt-2 text-sm text-slate-600 flex items-center gap-1.5">
                      <i className="fas fa-info-circle text-indigo-500" />
                      ขั้นตอนปัจจุบัน: {getRefundStatusText(r)}
                    </p>
                  )}
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-0.5">เหตุผล</p>
                      <p className="text-slate-800">{r.reason_text || r.reason_code || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">ยอดคืน (บาท)</p>
                      <p className="text-slate-800 font-semibold text-emerald-600">
                        ฿{Number(r.refund_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {r.items?.length > 0 && (
                    <div>
                      <p className="text-slate-500 text-sm mb-2">รายการที่ขอคืน</p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {r.items.map((it, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="text-slate-400">•</span>
                            {it.orderItem?.product?.title || 'สินค้า'} x{it.quantity}
                            {it.unitPrice != null && (
                              <span className="text-slate-500">
                                (฿{Number(it.unitPrice).toLocaleString()}/ชิ้น)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.admin_note && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-slate-500 text-xs mb-0.5">หมายเหตุจากแอดมิน</p>
                      <p className="text-slate-700 text-sm">{r.admin_note}</p>
                    </div>
                  )}
                  {r.status === 'APPROVED' && (
                    <p className="text-emerald-600 text-sm font-medium flex items-center gap-2">
                      <i className="fas fa-check-circle" />
                      เงินจะถูกคืนเข้ากระเป๋าของคุณในแอป
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsPage;
