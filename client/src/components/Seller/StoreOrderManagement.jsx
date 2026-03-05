import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import { authStorage } from '../../utils/authStorage';
import { getOrderStatusLabel } from '../../constants/orderStatus';

const StoreOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(new Set());
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [acceptOrderConfirmOrderId, setAcceptOrderConfirmOrderId] = useState(null);
  const [notifyRiderPromptOrderId, setNotifyRiderPromptOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const token = authStorage.getToken();
      
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await axios.get(`/api/my/store/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Load orders error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดคำสั่งซื้อ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(prev => new Set(prev).add(orderId));
      const token = authStorage.getToken();

      await axios.put(
        `/api/my/store/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('อัพเดตสถานะสำเร็จ');
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, oderStatus: newStatus } : order
      ));
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId, newOrderStatus) => {
    try {
      setUpdatingStatus(prev => new Set(prev).add(`logistics-${orderId}`));
      const { data } = await apiClient.put(`/api/orders/${orderId}/status`, { status: newOrderStatus });
      toast.success('อัพเดตสถานะขนส่งสำเร็จ');
      if (data.order) {
        setOrders(prev => prev.map(order =>
          order.id === orderId
            ? { ...order, orderStatus: data.order.orderStatus, shipment: data.order.shipment }
            : order
        ));
      }
    } catch (error) {
      console.error('Update order status error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
    } finally {
      setUpdatingStatus(prev => {
        const next = new Set(prev);
        next.delete(`logistics-${orderId}`);
        return next;
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Not Process': { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-800', icon: 'fas fa-clock' },
      'Processing': { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800', icon: 'fas fa-spinner' },
      'Shipped': { label: 'จัดส่งแล้ว', color: 'bg-purple-100 text-purple-800', icon: 'fas fa-truck' },
      'Delivered': { label: 'จัดส่งสำเร็จ', color: 'bg-green-100 text-green-800', icon: 'fas fa-check-circle' },
      'Cancelled': { label: 'ยกเลิก', color: 'bg-red-100 text-red-800', icon: 'fas fa-times-circle' }
    };
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: 'fas fa-question' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusInfo.color}`}>
        <i className={statusInfo.icon}></i>
        {statusInfo.label}
      </span>
    );
  };


  const getPaymentMethodBadge = (method) => {
    const methodMap = {
      'cash': { label: 'เก็บเงินปลายทาง', icon: 'fas fa-money-bill-wave', color: 'bg-green-100 text-green-800' },
      'credit_card': { label: 'บัตรเครดิต/เดบิต', icon: 'fas fa-credit-card', color: 'bg-blue-100 text-blue-800' },
      'qr_code': { label: 'QR Code', icon: 'fas fa-qrcode', color: 'bg-purple-100 text-purple-800' }
    };

    const methodInfo = methodMap[method] || { label: method, icon: 'fas fa-wallet', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${methodInfo.color}`}>
        <i className={methodInfo.icon}></i>
        {methodInfo.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการคำสั่งซื้อ</h1>
              <p className="text-gray-600 mt-1">ดูและจัดการคำสั่งซื้อที่เกี่ยวข้องกับร้านค้าของคุณ</p>
            </div>
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-sync-alt"></i>
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'Not Process', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'ทั้งหมด' : getStatusBadge(status).props.children[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600 text-lg font-medium">ไม่มีคำสั่งซื้อ</p>
              <p className="text-gray-500 mt-2">ยังไม่มีคำสั่งซื้อที่เกี่ยวข้องกับร้านค้าของคุณ</p>
            </div>
          ) : (
            orders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          คำสั่งซื้อ #{order.id}
                        </h3>
                        {getStatusBadge(order.oderStatus)}
                        {order.orderStatus && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 flex items-center gap-1.5">
                            <i className="fas fa-shipping-fast"></i>
                            {getOrderStatusLabel(order.orderStatus)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-user text-gray-400"></i>
                          <span>{order.orderedBy?.name || order.orderedBy?.email || 'ไม่ระบุชื่อ'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar text-gray-400"></i>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-money-bill-wave text-gray-400"></i>
                          <span className="font-semibold text-orange-600">฿{order.storeOrderTotal?.toLocaleString() || order.cartTotal?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <i className={`fas fa-chevron-${expandedOrder === order.id ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Order Details (Expanded) */}
                {expandedOrder === order.id && (
                  <div className="p-6 bg-gray-50 space-y-6">
                    {/* Products */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">สินค้าในคำสั่งซื้อ</h4>
                      <div className="space-y-3">
                        {order.storeProducts?.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 flex items-start gap-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {item.product?.images?.[0] ? (
                                <img
                                  src={item.product.images[0].url || item.product.images[0].secure_url}
                                  alt={item.product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <i className="fas fa-image text-gray-400"></i>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">{item.product?.title || 'สินค้า'}</h5>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>จำนวน: {item.count}</span>
                                <span>ราคา: ฿{item.price.toLocaleString()}</span>
                                <span className="font-semibold text-orange-600">
                                  รวม: ฿{(item.price * item.count).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Information */}
                    {order.payments && order.payments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">ข้อมูลการชำระเงิน</h4>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                          {order.payments.map((payment, idx) => (
                            <div key={idx} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  {getPaymentMethodBadge(payment.method)}
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    payment.status === 'completed' 
                                      ? 'bg-green-100 text-green-800'
                                      : payment.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {payment.status === 'completed' ? 'ชำระเงินแล้ว' : payment.status === 'pending' ? 'รอชำระเงิน' : 'ชำระเงินล้มเหลว'}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                  ฿{payment.amount?.toLocaleString()}
                                </span>
                              </div>
                              
                              {/* Payment Slip (QR Code Image) */}
                              {payment.paymentSlipUrl && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 flex items-center gap-2">
                                      <i className="fas fa-qrcode"></i>
                                      สลีปการโอนเงิน
                                    </span>
                                    <button
                                      onClick={() => setViewingSlip(payment.paymentSlipUrl)}
                                      className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                                    >
                                      <i className="fas fa-eye"></i>
                                      ดูรูปสลีป
                                    </button>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                    <img
                                      src={payment.paymentSlipUrl}
                                      alt="Payment slip"
                                      className="w-full h-32 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setViewingSlip(payment.paymentSlipUrl)}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">ข้อมูลลูกค้า</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-user text-gray-400 w-5"></i>
                          <span className="text-gray-600">ชื่อ:</span>
                          <span className="font-medium text-gray-900">{order.orderedBy?.name || 'ไม่ระบุ'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-envelope text-gray-400 w-5"></i>
                          <span className="text-gray-600">อีเมล:</span>
                          <span className="font-medium text-gray-900">{order.orderedBy?.email || 'ไม่ระบุ'}</span>
                        </div>
                        {order.orderedBy?.phone && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-phone text-gray-400 w-5"></i>
                            <span className="text-gray-600">เบอร์โทร:</span>
                            <span className="font-medium text-gray-900">{order.orderedBy.phone}</span>
                          </div>
                        )}
                        {order.shippingAddress && (
                          <div className="flex items-start gap-2">
                            <i className="fas fa-map-marker-alt text-gray-400 w-5 mt-0.5"></i>
                            <div>
                              <span className="text-gray-600">ที่อยู่จัดส่ง:</span>
                              <p className="text-gray-900 whitespace-pre-line">{order.shippingAddress}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Logistics: กดยืนยันรับออเดอร์ แล้วปุ่มจะเปลี่ยนเป็น แจ้งหาไรเดอร์ */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <i className="fas fa-shipping-fast text-orange-500"></i>
                        จัดการขนส่ง
                      </h4>
                      {(order.orderStatus == null || ['PENDING', 'VERIFYING', 'PENDING_CONFIRMATION'].includes(order.orderStatus)) ? (
                        <p className="text-xs text-gray-500 mb-3">ออเดอร์เข้าร้านแล้ว — กดยืนยันรับออเดอร์ก่อน แล้วปุ่มจะเปลี่ยนเป็น แจ้งหาไรเดอร์</p>
                      ) : order.orderStatus === 'PROCESSING' ? (
                        <p className="text-xs text-emerald-600 mb-3">คุณยอมรับออเดอร์นี้แล้ว — เมื่อพร้อมส่งให้กดปุ่ม แจ้งหาไรเดอร์</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {/* 1. ปุ่มยืนยันรับออเดอร์ — กดแล้วเด้งโมดัล ยืนยันในโมดัลถึงจะรับ → 2. ปุ่มเปลี่ยนเป็นแจ้งหาไรเดอร์ */}
                        {(order.orderStatus == null || ['PENDING', 'VERIFYING', 'PENDING_CONFIRMATION'].includes(order.orderStatus)) && (
                          <button
                            onClick={() => setAcceptOrderConfirmOrderId(order.id)}
                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                          >
                            <i className="fas fa-check-circle"></i>
                            ยืนยันการรับออเดอร์
                          </button>
                        )}
                        {/* ปุ่มแจ้งหาไรเดอร์ — กดแล้วเด้งโมดัลให้ยืนยันอีกครั้ง */}
                        {order.orderStatus === 'PROCESSING' && (
                          <button
                            onClick={() => setNotifyRiderPromptOrderId(order.id)}
                            className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                          >
                            <i className="fas fa-motorcycle"></i>
                            แจ้งหาไรเดอร์
                          </button>
                        )}
                        {!['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.orderStatus) && (
                          <button
                            onClick={() => {
                              if (window.confirm('ยกเลิกคำสั่งซื้อนี้?')) handleUpdateOrderStatus(order.id, 'CANCELLED');
                            }}
                            disabled={updatingStatus.has(`logistics-${order.id}`)}
                            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                          >
                            <i className="fas fa-times-circle"></i>
                            ยกเลิก
                          </button>
                        )}
                        {updatingStatus.has(`logistics-${order.id}`) && (
                          <span className="px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
                            <i className="fas fa-spinner fa-spin"></i> กำลังอัพเดต...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Update Actions (legacy) */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">อัพเดตสถานะ (แบบเดิม)</h4>
                      <div className="flex flex-wrap gap-2">
                        {order.oderStatus !== 'Not Process' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Not Process')}
                            disabled={updatingStatus.has(order.id)}
                            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <i className="fas fa-clock"></i>
                            รอดำเนินการ
                          </button>
                        )}
                        {order.oderStatus !== 'Processing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Processing')}
                            disabled={updatingStatus.has(order.id)}
                            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <i className="fas fa-spinner"></i>
                            กำลังดำเนินการ
                          </button>
                        )}
                        {order.oderStatus !== 'Shipped' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Shipped')}
                            disabled={updatingStatus.has(order.id)}
                            className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <i className="fas fa-truck"></i>
                            จัดส่งแล้ว
                          </button>
                        )}
                        {order.oderStatus !== 'Delivered' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                            disabled={updatingStatus.has(order.id)}
                            className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <i className="fas fa-check-circle"></i>
                            จัดส่งสำเร็จ
                          </button>
                        )}
                        {order.oderStatus !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              if (window.confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกคำสั่งซื้อนี้?')) {
                                handleUpdateStatus(order.id, 'Cancelled');
                              }
                            }}
                            disabled={updatingStatus.has(order.id)}
                            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <i className="fas fa-times-circle"></i>
                            ยกเลิก
                          </button>
                        )}
                        {updatingStatus.has(order.id) && (
                          <span className="px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
                            <i className="fas fa-spinner fa-spin"></i>
                            กำลังอัพเดต...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 1. โมดัลยืนยันรับออเดอร์ — กดปุ่มยืนยันรับออเดอร์ → เด้ง → กดยืนยันถึงจะรับ */}
      {acceptOrderConfirmOrderId && (() => {
        const order = orders.find(o => o.id === acceptOrderConfirmOrderId);
        if (!order) return null;
        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-[55] flex items-center justify-center p-4"
            onClick={() => setAcceptOrderConfirmOrderId(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">ยืนยันรับออเดอร์</h3>
                  <p className="text-xs text-gray-500">คำสั่งซื้อ #{order.id}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                ยืนยันรับออเดอร์นี้? หลังยืนยัน ปุ่มจะเปลี่ยนเป็น แจ้งหาไรเดอร์ เมื่อพร้อมส่งให้กดแจ้งหาไรเดอร์
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAcceptOrderConfirmOrderId(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateOrderStatus(order.id, 'PROCESSING');
                    setAcceptOrderConfirmOrderId(null);
                  }}
                  disabled={updatingStatus.has(`logistics-${order.id}`)}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingStatus.has(`logistics-${order.id}`) ? (
                    <><i className="fas fa-spinner fa-spin"></i> กำลังอัพเดต...</>
                  ) : (
                    <><i className="fas fa-check"></i> ยืนยัน</>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3–4. โมดัลยืนยันแจ้งหาไรเดอร์ — กดปุ่มแจ้งหาไรเดอร์ → เด้ง → กดยืนยันถึงจะแจ้งหาไรเดอร์ */}
      {notifyRiderPromptOrderId && (() => {
        const order = orders.find(o => o.id === notifyRiderPromptOrderId);
        if (!order) return null;
        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-[55] flex items-center justify-center p-4"
            onClick={() => setNotifyRiderPromptOrderId(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <i className="fas fa-motorcycle text-teal-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">แจ้งหาไรเดอร์</h3>
                  <p className="text-xs text-gray-500">คำสั่งซื้อ #{order.id}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                ยืนยันแจ้งหาไรเดอร์สำหรับคำสั่งซื้อนี้? ระบบจะค้นหาไรเดอร์มารับสินค้าที่ร้าน
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setNotifyRiderPromptOrderId(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateOrderStatus(order.id, 'READY_FOR_PICKUP');
                    setNotifyRiderPromptOrderId(null);
                  }}
                  disabled={updatingStatus.has(`logistics-${order.id}`)}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingStatus.has(`logistics-${order.id}`) ? (
                    <><i className="fas fa-spinner fa-spin"></i> กำลังอัพเดต...</>
                  ) : (
                    <><i className="fas fa-check"></i> ยืนยัน</>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payment Slip Modal */}
      {viewingSlip && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingSlip(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">สลีปการโอนเงิน</h3>
              <button
                onClick={() => setViewingSlip(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <img
                src={viewingSlip}
                alt="Payment slip"
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreOrderManagement;

