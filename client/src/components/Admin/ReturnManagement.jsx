import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const ReturnManagement = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('REQUESTED');
  const [resolvingId, setResolvingId] = useState(null);
  const [note, setNote] = useState('');
  const [resolveModal, setResolveModal] = useState(null); // { id, action }

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const url = filter ? `/api/admin/returns?status=${filter}` : '/api/admin/returns';
      const res = await apiClient.get(url);
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
  }, [filter]);

  const handleResolve = async () => {
    if (!resolveModal?.id || !resolveModal?.action) return;
    setResolvingId(resolveModal.id);
    try {
      await apiClient.patch(`/api/admin/returns/${resolveModal.id}`, {
        action: resolveModal.action,
        admin_note: note,
      });
      toast.success(resolveModal.action === 'APPROVED' ? 'อนุมัติคำขอคืนเงินแล้ว' : 'ปฏิเสธคำขอแล้ว');
      setResolveModal(null);
      setNote('');
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ดำเนินการไม่สำเร็จ');
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
  };

  const statusBadge = (status) => {
    const map = {
      REQUESTED: { label: 'รอพิจารณา', class: 'bg-amber-100 text-amber-700 border-amber-200' },
      APPROVED: { label: 'อนุมัติแล้ว', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      REJECTED: { label: 'ปฏิเสธ', class: 'bg-rose-100 text-rose-700 border-rose-200' },
    };
    const s = map[status] || { label: status, class: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.class}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-undo text-indigo-500" />
          คำขอคืนสินค้า/คืนเงิน
        </h1>
        <div className="flex gap-2">
          {['REQUESTED', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filter === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'REQUESTED' && 'รอพิจารณา'}
              {s === 'APPROVED' && 'อนุมัติแล้ว'}
              {s === 'REJECTED' && 'ปฏิเสธ'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
          <i className="fas fa-inbox text-4xl mb-3 opacity-50" />
          <p>ไม่มีคำขอคืนในสถานะนี้</p>
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
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    โดย {r.user?.name || r.user?.email || '-'} · {formatDate(r.created_at)}
                  </p>
                </div>
                {r.status === 'REQUESTED' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResolveModal({ id: r.id, action: 'APPROVED' })}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => setResolveModal({ id: r.id, action: 'REJECTED' })}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-0.5">เหตุผล</p>
                  <p className="text-slate-800">{r.reason_text || r.reason_code || '-'}</p>
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
                {r.admin_note && (
                  <div className="md:col-span-2">
                    <p className="text-slate-500 mb-0.5">หมายเหตุแอดมิน</p>
                    <p className="text-slate-700">{r.admin_note}</p>
                  </div>
                )}
                {r.resolved_at && (
                  <p className="text-slate-500 text-xs md:col-span-2">
                    ดำเนินการเมื่อ {formatDate(r.resolved_at)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal อนุมัติ/ปฏิเสธ */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setResolveModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-2">
              {resolveModal.action === 'APPROVED' ? 'อนุมัติคำขอคืนเงิน' : 'ปฏิเสธคำขอ'}
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              {resolveModal.action === 'APPROVED'
                ? 'ยืนยันจะคืนเงินเข้ากระเป๋าลูกค้าตามยอดที่ขอ'
                : 'ลูกค้าจะเห็นสถานะว่าคำขอยกเลิก'}
            </p>
            <label className="block text-sm text-slate-600 mb-1">หมายเหตุ (ถ้ามี)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm mb-4"
              placeholder="ใส่หมายเหตุสำหรับลูกค้า..."
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setResolveModal(null); setNote(''); }}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolvingId !== null}
                className={`flex-1 py-2 rounded-lg text-white text-sm font-medium ${
                  resolveModal.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {resolvingId ? 'กำลังดำเนินการ...' : resolveModal.action === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnManagement;
