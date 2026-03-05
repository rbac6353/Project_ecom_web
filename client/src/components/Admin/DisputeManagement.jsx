import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/axiosConfig';
import { authStorage } from '../../utils/authStorage';
import { toast } from 'react-toastify';

const DisputeManagement = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingOrderId, setResolvingOrderId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { orderId, action: 'APPROVED' | 'REJECTED', returnItem }

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/returns?refundStatus=IN_DISPUTE');
      setList(res.data.orderReturns || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'โหลดรายการข้อพิพาทไม่สำเร็จ');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async () => {
    if (!confirmModal?.orderId || !confirmModal?.action) return;
    setResolvingOrderId(confirmModal.orderId);
    try {
      await apiClient.put(
        `/api/orders/${confirmModal.orderId}/return-approve`,
        { status: confirmModal.action },
        { headers: { Authorization: `Bearer ${authStorage.getToken()}` } }
      );
      toast.success(
        confirmModal.action === 'APPROVED'
          ? 'อนุมัติคืนเงินให้ลูกค้าแล้ว'
          : 'ปฏิเสธการคืนเงินแล้ว'
      );
      setConfirmModal(null);
      fetchDisputes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ดำเนินการไม่สำเร็จ');
    } finally {
      setResolvingOrderId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
  };

  const parseImages = (str) => {
    if (!str) return [];
    try {
      const arr = typeof str === 'string' ? JSON.parse(str) : str;
      return Array.isArray(arr) ? arr : [arr];
    } catch {
      return [];
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-balance-scale text-amber-500" />
          จัดการข้อพิพาท (Dispute Management)
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
          <i className="fas fa-check-circle text-4xl mb-3 text-emerald-400" />
          <p>ไม่มีรายการข้อพิพาทรอพิจารณา</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"
            >
              <div className="p-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">คำขอ #{r.id}</span>
                    <span className="text-slate-500">ออเดอร์ #{r.order?.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-100 text-amber-700 border-amber-200">
                      ข้อพิพาท
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    ลูกค้า: {r.user?.name || r.user?.email || '-'} · {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmModal({ orderId: r.order?.id, action: 'APPROVED', returnItem: r })}
                    disabled={resolvingOrderId !== null}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <i className="fas fa-check-circle" />
                    อนุมัติคืนเงินให้ลูกค้า
                  </button>
                  <button
                    onClick={() => setConfirmModal({ orderId: r.order?.id, action: 'REJECTED', returnItem: r })}
                    disabled={resolvingOrderId !== null}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <i className="fas fa-times-circle" />
                    ปฏิเสธการคืนเงิน
                  </button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-0.5">เหตุผลลูกค้า (ขอคืน)</p>
                  <p className="text-slate-800">{r.reason_text || r.reason_code || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">เหตุผลร้านค้า (แจ้งข้อพิพาท)</p>
                  <p className="text-slate-800">{r.dispute_reason || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">ยอดคืน (บาท)</p>
                  <p className="text-slate-800 font-medium">฿{Number(r.refund_amount || 0).toLocaleString()}</p>
                </div>
                {r.items?.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-slate-500 mb-1">รายการที่ขอคืน</p>
                    <ul className="list-disc list-inside text-slate-700">
                      {r.items.map((it, i) => (
                        <li key={i}>
                          {it.orderItem?.product?.title || 'สินค้า'} x{it.quantity} (฿{Number(it.unitPrice || 0).toLocaleString()}/ชิ้น)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {parseImages(r.dispute_images).length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-slate-500 mb-1">รูปหลักฐานจากร้านค้า</p>
                    <div className="flex flex-wrap gap-2">
                      {parseImages(r.dispute_images).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ยืนยันตัดสิน */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-2">
              {confirmModal.action === 'APPROVED' ? '✅ อนุมัติคืนเงินให้ลูกค้า' : '❌ ปฏิเสธการคืนเงิน'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {confirmModal.action === 'APPROVED'
                ? `ยืนยันจะคืนเงิน ฿${Number(confirmModal.returnItem?.refund_amount || 0).toLocaleString()} เข้ากระเป๋าลูกค้าทันที (หักจากร้านค้า + คืนสต็อก)`
                : 'ลูกค้าจะไม่ได้รับเงินคืน และคำขอคืนจะถูกปิด'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolvingOrderId !== null}
                className={`flex-1 py-2 rounded-lg text-white text-sm font-medium ${
                  confirmModal.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {resolvingOrderId ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeManagement;
