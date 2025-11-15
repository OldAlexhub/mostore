import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { items, add, remove, clear, totalItems, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const navigate = useNavigate();

  const dec = (p) => {
    const found = items.find(i => i._id === p._id);
    if (!found) return;
    if (found.qty > 1) add(p, -1);
    else remove(p._id);
  };

  const inc = (p) => add(p, 1);

  const doCheckout = async () => {
    if (items.length === 0) return setMessage('السلة فارغة');
    setLoading(true);
    try {
      const payload = {
        products: items.map(i => ({ product: i._id, qty: i.qty, price: i.Sell })),
        totalPrice,
        couponCode: coupon || undefined
      };
      await api.post('/api/orders', payload);
      setMessage('تم إنشاء الطلب بنجاح');
      clear();
      setTimeout(()=> navigate('/'), 1200);
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;

      // If token expired, try to refresh once then retry the request
      if (status === 401) {
        try {
          await api.post('/api/auth/refresh');
          // retry
          const payload = {
            products: items.map(i => ({ product: i._id, qty: i.qty, price: i.Sell })),
            totalPrice
          };
          await api.post('/api/orders', payload);
          setMessage('تم إنشاء الطلب بنجاح');
          clear();
          setTimeout(()=> navigate('/'), 1200);
          return;
        } catch (refreshErr) {
          const rMsg = refreshErr?.response?.data?.error;
          if (rMsg) setMessage(`فشل إنشاء الطلب — ${rMsg}`);
          else setMessage('فشل إنشاء الطلب — جلسة غير صالحة، الرجاء تسجيل الدخول مرة أخرى');
          return;
        }
      }

      if (serverMsg) setMessage(`فشل إنشاء الطلب — ${serverMsg}`);
      else setMessage('فشل إنشاء الطلب — تأكد من تسجيل الدخول');
    } finally { setLoading(false); }
  };

  const checkCoupon = async () => {
    if (!coupon) return setCouponInfo(null);
    try {
      const res = await api.get(`/promotions/validate?code=${encodeURIComponent(coupon)}&total=${totalPrice}`);
      if (res.ok) setCouponInfo(res.data);
      else setCouponInfo({ error: res.error || 'Invalid' });
    } catch (err) { setCouponInfo({ error: 'Invalid' }); }
  };

  return (
    <main className="container py-4">
      <h3 className="mb-3">سلة المشتريات</h3>
      {message && <div className="alert alert-info">{message}</div>}
      {items.length === 0 ? (
        <div className="text-center py-5">السلة فارغة</div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-md-8">
            {items.map(it => (
              <div key={it._id} className="d-flex align-items-center border rounded p-2 mb-2">
                <div style={{width:80, height:60, background:'#f3f4f6'}} className="d-flex align-items-center justify-content-center me-3">صورة</div>
                <div className="flex-grow-1">
                  <div className="fw-bold">{it.Name}</div>
                  <div className="text-muted">ج.م {it.Sell} × {it.qty} = ج.م {it.Sell * it.qty}</div>
                </div>
                <div className="d-flex align-items-center">
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={()=>dec(it)}>-</button>
                  <div className="px-2">{it.qty}</div>
                  <button className="btn btn-sm btn-outline-secondary ms-2" onClick={()=>inc(it)}>+</button>
                  <button className="btn btn-sm btn-danger ms-3" onClick={()=>remove(it._id)}>حذف</button>
                </div>
              </div>
            ))}
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>العناصر</div>
                <div>{totalItems}</div>
              </div>
              <div className="mb-2">
                <label>Coupon</label>
                <div className="d-flex">
                  <input className="form-control form-control-sm" value={coupon} onChange={e=>setCoupon(e.target.value)} />
                  <button className="btn btn-sm btn-outline-secondary ms-2" onClick={checkCoupon}>Apply</button>
                </div>
                {couponInfo && !couponInfo.error && (
                  <div className="text-success mt-2">Discount: ج.م {couponInfo.discount} — New total: ج.م {couponInfo.total}</div>
                )}
                {couponInfo && couponInfo.error && <div className="text-danger mt-2">{couponInfo.error}</div>}
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>الإجمالي</div>
                <div className="fw-bold">ج.م {couponInfo && !couponInfo.error ? couponInfo.total : totalPrice}</div>
              </div>
              <button className="btn btn-primary w-100" onClick={doCheckout} disabled={loading}>{loading ? 'جارٍ...' : 'إتمام الشراء'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Cart;
