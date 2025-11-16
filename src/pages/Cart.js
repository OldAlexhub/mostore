import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { formatEGP } from '../utils/formatCurrency';

const Cart = () => {
  const { items, add, remove, clear, totalItems, totalPrice } = useCart();
  const { discount, shipping } = useStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const navigate = useNavigate();

  const storeDiscountMeta = useMemo(() => {
    if (!discount || !discount.active || discount.value <= 0) return { amount: 0, applies: false };
    const meets = discount.type === 'general' || totalPrice >= (discount.minTotal || 0);
    if (!meets) return { amount: 0, applies: false };
    const amount = Math.round(totalPrice * (discount.value / 100));
    return { amount, applies: true };
  }, [discount, totalPrice]);

  const subtotalAfterStore = Math.max(0, totalPrice - storeDiscountMeta.amount);
  const hasCouponDiscount = couponInfo && !couponInfo.error;
  const payableAfterCoupon = hasCouponDiscount ? Number(couponInfo.total || 0) : subtotalAfterStore;
  const shippingFee = shipping?.enabled ? Number(shipping.amount || 0) : 0;
  const finalTotal = Math.max(0, payableAfterCoupon + shippingFee);

  const dec = (product) => {
    const found = items.find((i) => i._id === product._id);
    if (!found) return;
    if (found.qty > 1) add(product, -1);
    else remove(product._id);
  };

  const inc = (product) => add(product, 1);

  const doCheckout = async () => {
    if (!items.length) return setMessage('سلتك لسه فاضية.');
    if (!guestName || !guestAddress || !guestPhone) {
      return setMessage('من فضلك اكتب الاسم والعنوان ورقم الموبايل كاملين.');
    }
    setLoading(true);
    try {
      const payload = {
        products: items.map((i) => ({ product: i._id, qty: i.qty, price: i.Sell })),
        totalPrice,
        couponCode: coupon || undefined,
        name: guestName,
        address: guestAddress,
        phone: guestPhone
      };
      const res = await api.post('/api/orders', payload);
      clear();
      setCreatedOrder(res.data || null);
      setMessage('تم تسجيل طلبك وهنتواصل معاك قريب.');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'حصل خطأ واحنا بنسجل الطلب.');
    } finally {
      setLoading(false);
    }
  };

  const checkCoupon = async () => {
    if (!coupon) { setCouponInfo(null); return; }
    try {
      const res = await api.get(`/api/promotions/validate?code=${encodeURIComponent(coupon)}&total=${subtotalAfterStore}`);
      setCouponInfo(res.data);
    } catch {
      setCouponInfo({ error: 'الكود غير صالح' });
    }
  };

  return (
    <main className="container py-4" dir="rtl">
      <h3 className="mb-3">سلة الشراء</h3>
      {message && <div className="alert alert-info">{message}</div>}
      {items.length === 0 ? (
        <div className="text-center py-5 text-muted">مافيش منتجات في السلة حالياً.</div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-md-8">
            {items.map((item) => (
              <div key={item._id} className="d-flex align-items-center border rounded p-2 mb-2">
                <div style={{ width: 80, height: 60, background: '#f3f4f6' }} className="d-flex align-items-center justify-content-center ms-2">
                  {(() => {
                    const img = item.imageUrl || item.image || item.images?.[0] || item.productDetails?.imageUrl || '';
                    return img ? (
                      <img src={img} alt={item.Name || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ fontSize: 11, color: '#999' }}>بدون صورة</div>
                    );
                  })()}
                </div>
                <div className="flex-grow-1 me-3">
                  <div className="fw-bold">{item.Name}</div>
                  <div className="text-muted">
                    {formatEGP(item.Sell)} x {item.qty} = {formatEGP(item.Sell * item.qty)}
                  </div>
                </div>
                <div className="d-flex align-items-center ms-auto">
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => dec(item)}>-</button>
                  <div className="px-2">{item.qty}</div>
                  <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => inc(item)}>+</button>
                  <button className="btn btn-sm btn-danger ms-3" onClick={() => remove(item._id)}>حذف</button>
                </div>
              </div>
            ))}
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3">
              <div className="mb-2">
                <label className="form-label">كود الخصم</label>
                <div className="d-flex">
                  <input className="form-control form-control-sm" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                  <button className="btn btn-sm btn-outline-secondary ms-2" onClick={checkCoupon}>تطبيق</button>
                </div>
                {hasCouponDiscount && (
                  <div className="text-success mt-2">
                    تم خصم {formatEGP(couponInfo.discount)} - المجموع بعد الكوبون {formatEGP(payableAfterCoupon)}
                  </div>
                )}
                {couponInfo && couponInfo.error && <div className="text-danger mt-2">{couponInfo.error}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">الاسم</label>
                <input className="form-control form-control-sm mb-2" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                <label className="form-label">العنوان بالتفصيل</label>
                <input className="form-control form-control-sm mb-2" value={guestAddress} onChange={(e) => setGuestAddress(e.target.value)} />
                <label className="form-label">رقم الموبايل</label>
                <input className="form-control form-control-sm" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
              </div>

              <hr />

              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>عدد القطع</div>
                <div>{totalItems}</div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>قيمة المنتجات</div>
                <div>{formatEGP(totalPrice)}</div>
              </div>
              {storeDiscountMeta.applies && (
                <div className="d-flex justify-content-between align-items-center mb-2 text-success">
                  <div>خصم المتجر</div>
                  <div>- {formatEGP(storeDiscountMeta.amount)}</div>
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>بعد الخصومات</div>
                <div>{formatEGP(payableAfterCoupon)}</div>
              </div>
              {shippingFee > 0 && (
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>رسوم الشحن</div>
                  <div>{formatEGP(shippingFee)}</div>
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-semibold">الإجمالي المطلوب</div>
                <div className="fw-bold fs-5">{formatEGP(finalTotal)}</div>
              </div>

              <button className="btn btn-primary w-100" onClick={doCheckout} disabled={loading}>
                {loading ? 'بيتم إنشاء الطلب...' : 'تأكيد الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {createdOrder && (
        <div className="position-fixed top-0 start-0 vw-100 vh-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="card p-4" style={{ minWidth: 320 }}>
            <h5>تم تسجيل الطلب</h5>
            <div>رقم الطلب: <strong>{createdOrder.orderNumber}</strong></div>
            <div className="mt-2">الاسم: {createdOrder.userDetails?.username}</div>
            <div>الموبايل: {createdOrder.userDetails?.phoneNumber}</div>
            <div>العنوان: {createdOrder.userDetails?.Address}</div>
            <div className="mt-2">رسوم الشحن: {formatEGP(createdOrder.shippingFee ?? shippingFee)}</div>
            <div>الإجمالي: <strong>{formatEGP(createdOrder.totalPrice)}</strong></div>
            <div className="mt-3 d-flex">
              <button className="btn btn-secondary ms-2" onClick={() => { setCreatedOrder(null); navigate('/'); }}>متابعة التسوق</button>
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => {
                  setCreatedOrder(null);
                  navigate(`/track/${createdOrder.orderNumber}?phone=${encodeURIComponent(createdOrder.userDetails?.phoneNumber || guestPhone)}`);
                }}
              >
                متابعة الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Cart;
