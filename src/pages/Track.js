import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api';
import { formatEGP } from '../utils/formatCurrency';
import getPrimaryImage from '../utils/getPrimaryImage';

const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) || '/api';

const deriveServerOrigin = () => {
  try {
    if (API_BASE.startsWith('http')) {
      const url = new URL(API_BASE);
      return url.origin;
    }
  } catch (e) {
    // ignore
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

const SERVER_ORIGIN = deriveServerOrigin();

const withServerOrigin = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('/') && !value.startsWith('//')) {
    return `${SERVER_ORIGIN}${value}`;
  }
  return value;
};

const STATUS_LABELS = {
  pending: 'بانتظار المراجعة',
  paid: 'مدفوع',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'تم الإلغاء',
  refunded: 'مسترد'
};

const GROUP_TITLES = {
  inProgress: 'طلبات قيد التنفيذ',
  completed: 'طلبات مكتملة',
  cancelled: 'طلبات ملغاة'
};

const Track = () => {
  const { orderNumber: paramOrder } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const phoneFromUrl = searchParams.get('phone') || '';

  const [orderNumber, setOrderNumber] = useState(paramOrder || '');
  const [phone, setPhone] = useState(phoneFromUrl);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [order, setOrder] = useState(null);

  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [listData, setListData] = useState(null);
  const [cancelMessage, setCancelMessage] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const currency = useMemo(() => (value) => formatEGP(value ?? 0), []);

  useEffect(() => {
    setOrderNumber(paramOrder || '');
  }, [paramOrder]);

  useEffect(() => {
    setPhone(phoneFromUrl);
  }, [phoneFromUrl]);

  const fetchOrder = useCallback(async (num, phoneValue) => {
    if (!num || !phoneValue) return;
    setDetailLoading(true);
    setDetailError(null);
    setOrder(null);
    try {
      const qp = `?phone=${encodeURIComponent(phoneValue)}`;
      const res = await api.get(`/api/orders/track/${encodeURIComponent(num)}${qp}`);
      setOrder(res.data);
    } catch (err) {
      setDetailError(err?.response?.data?.error || 'تعذر العثور على هذا الطلب.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchOrdersByPhone = useCallback(async (phoneValue) => {
    if (!phoneValue) {
      setListData(null);
      return;
    }
    setListLoading(true);
    setListError(null);
    setCancelMessage(null);
    try {
      const res = await api.get(`/api/orders/track?phone=${encodeURIComponent(phoneValue)}`);
      setListData(res.data);
    } catch (err) {
      setListError(err?.response?.data?.error || 'تعذر جلب الطلبات الخاصة بهذا الرقم.');
      setListData(null);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!phoneFromUrl) {
      setListData(null);
      setOrder(null);
      setDetailError(null);
      return;
    }
    fetchOrdersByPhone(phoneFromUrl);
    if (paramOrder) fetchOrder(paramOrder, phoneFromUrl);
    else {
      setOrder(null);
      setDetailError(null);
    }
  }, [paramOrder, phoneFromUrl, fetchOrder, fetchOrdersByPhone]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!phone) {
      setListError('يرجى كتابة رقم الهاتف المستخدم أثناء الشراء.');
      return;
    }
    const params = new URLSearchParams();
    params.set('phone', phone);
    setSearchParams(params, { replace: true });
    if (orderNumber) navigate(`/track/${orderNumber}?${params.toString()}`);
    else navigate(`/track?${params.toString()}`);
  };

  const handleCancel = async (targetOrderNumber) => {
    if (!phone || !targetOrderNumber) return;
    setCancellingOrder(targetOrderNumber);
    setCancelMessage(null);
    try {
      const res = await api.post(`/api/orders/track/${encodeURIComponent(targetOrderNumber)}/cancel`, { phone });
      setCancelMessage(res.data?.message || 'تم إلغاء الطلب.');
      setOrder((prev) => (prev && prev.orderNumber === targetOrderNumber ? res.data?.order || prev : prev));
      fetchOrdersByPhone(phone);
    } catch (err) {
      setCancelMessage(err?.response?.data?.error || 'تعذر إلغاء الطلب.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const viewOrderDetails = (targetOrderNumber) => {
    if (!phone) {
      setListError('أدخل رقم الهاتف أولاً لعرض تفاصيل الطلب.');
      return;
    }
    const params = new URLSearchParams();
    params.set('phone', phone);
    setSearchParams(params, { replace: true });
    navigate(`/track/${targetOrderNumber}?${params.toString()}`);
    fetchOrder(targetOrderNumber, phone);
    setOrderNumber(targetOrderNumber);
  };

  const groupedKeys = ['inProgress', 'completed', 'cancelled'];

  return (
    <main className="container py-4" dir="rtl">
      <h3 className="mb-3">تتبع الطلبات</h3>
      <p className="text-muted">
        اكتب رقم هاتفك لرؤية كل الطلبات المرتبطة به، ويمكنك إضافة رقم الطلب (اختياري) لعرض تفاصيله مباشرة.
      </p>
      <form onSubmit={onSubmit} className="mb-3">
        <div className="input-group">
          <input
            className="form-control"
            placeholder="رقم الطلب (اختياري)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <input
            className="form-control ms-2"
            placeholder="رقم الهاتف المستخدم في الطلب"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">عرض</button>
        </div>
      </form>

      {listLoading && <div>جاري تحميل الطلبات...</div>}
      {listError && <div className="alert alert-danger">{listError}</div>}
      {cancelMessage && <div className="alert alert-info">{cancelMessage}</div>}

      {orderNumber && detailLoading && <div>جاري البحث عن الطلب المحدد...</div>}
      {orderNumber && detailError && <div className="alert alert-warning">{detailError}</div>}

      {order && (
        <div className="card p-3 mb-4">
          <h5>تفاصيل الطلب #{order.orderNumber}</h5>
          <div>تاريخ الإنشاء: {new Date(order.createdAt).toLocaleString('ar-EG')}</div>
          <div>الحالة: {STATUS_LABELS[order.status] || order.status}</div>
          <hr />
          <div><strong>بيانات العميل</strong></div>
          <div>الاسم: {order.userDetails?.username}</div>
          <div>الهاتف: {order.userDetails?.phoneNumber}</div>
          <div>العنوان: {order.userDetails?.Address}</div>
          <hr />
                    <div><strong>تفاصيل التكلفة</strong></div>
          {order.products && order.products.map((p, idx) => {
            const img = withServerOrigin(getPrimaryImage(p, p.productDetails));
            const name = p.productDetails?.Name || p.productName || p.product?.Name || '-';
            const qty = p.quantity || p.qty || 1;
            const price = Number(p.productDetails?.Sell || p.price || 0);
            return (
              <div key={idx} className="d-flex justify-content-between py-1 align-items-center">
                <div className="d-flex align-items-center" style={{ gap: 12 }}>
                  <div style={{ width: 56, height: 56, background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {img ? <img src={img} alt={name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ fontSize: 11, color: '#999' }}>بدون صورة</div>}
                  </div>
                  <div>{name} × {qty}</div>
                </div>
                <div>{currency(price * qty)}</div>
              </div>
            );
          })}
          <hr />
          <div className="d-flex justify-content-between">
            <div>قيمة المنتجات</div>
            <div>{currency(order.originalTotalPrice ?? order.totalPrice)}</div>
          </div>
          {order.storeDiscountAmount > 0 && (
            <div className="d-flex justify-content-between text-success">
              <div>خصم المتجر</div>
              <div>- {currency(order.storeDiscountAmount)}</div>
            </div>
          )}
          {order.discountAmount > 0 && (
            <div className="d-flex justify-content-between text-success">
              <div>خصم الكوبون</div>
              <div>- {currency(order.discountAmount)}</div>
            </div>
          )}
          {order.shippingFee > 0 && (
            <div className="d-flex justify-content-between">
              <div>رسوم الشحن</div>
              <div>{currency(order.shippingFee)}</div>
            </div>
          )}
          <div className="d-flex justify-content-between fw-bold">
            <div>الإجمالي النهائي</div>
            <div>{currency(order.totalPrice)}</div>
          </div>
{order.canCancel && (
            <div className="mt-3">
              <button
                className="btn btn-outline-danger"
                onClick={() => handleCancel(order.orderNumber)}
                disabled={cancellingOrder === order.orderNumber}
              >
                {cancellingOrder === order.orderNumber ? 'جاري الإلغاء...' : 'إلغاء هذا الطلب'}
              </button>
              {order.cancelableUntil && (
                <div className="text-muted small mt-1">
                  يمكن الإلغاء حتى {new Date(order.cancelableUntil).toLocaleTimeString('ar-EG')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {listData && !listLoading && (
        listData.summary?.total === 0 ? (
          <div className="text-muted">لا توجد طلبات مرتبطة بهذا الرقم.</div>
        ) : (
          <div className="mt-4">
            {groupedKeys.map((key) => (
              listData.grouped?.[key]?.length ? (
                <div key={key} className="mb-4">
                  <h5>{GROUP_TITLES[key]} ({listData.grouped[key].length})</h5>
                  {listData.grouped[key].map((item) => (
                    <div key={item.id} className="card p-3 mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">#{item.orderNumber}</div>
                          <div className="text-muted small">{new Date(item.createdAt).toLocaleString('ar-EG')}</div>
                        </div>
                            <div className="d-flex align-items-center" style={{ gap: 10 }}>
                              {item.firstProductImage ? (
                                <div style={{ width: 48, height: 48, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0' }}>
                                  <img src={withServerOrigin(item.firstProductImage)} alt={`#${item.orderNumber}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                </div>
                              ) : null}
                              <span className="badge bg-light text-dark">{STATUS_LABELS[item.status] || item.status}</span>
                            </div>
                      </div>
                      <div className="mt-2 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                        <div>الإجمالي: <strong>{currency(item.totalPrice)}</strong></div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => viewOrderDetails(item.orderNumber)}>عرض الفاتورة</button>
                          {key === 'inProgress' && item.canCancel && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleCancel(item.orderNumber)}
                              disabled={cancellingOrder === item.orderNumber}
                            >
                              {cancellingOrder === item.orderNumber ? '...' : 'إلغاء الطلب'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            ))}
          </div>
        )
      )}
    </main>
  );
};

export default Track;
