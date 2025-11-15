import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatEGP } from '../utils/formatCurrency';

const Profile = () => {
  const { refresh } = useAuth();
  const { add } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ username: '', Address: '', phoneNumber: '' });
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.get('/api/auth/me');
        if (me.data && me.data.user) setProfile(prev => ({ ...prev, ...me.data.user }));
      } catch (err) {}

      try {
        const res = await api.get('/api/orders/my');
        setOrders(res.data || []);
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  // live clock used for cancellation countdowns
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, []);

  const handleChange = (e) => setProfile(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { username: profile.username, Address: profile.Address, phoneNumber: profile.phoneNumber };
      // include password only if present
      if (profile.password) payload.password = profile.password;
      await api.put('/api/users/me', payload);
      add('تم تحديث الملف الشخصي', { type: 'success' });
      // refresh auth context so header shows new username
      if (refresh) await refresh();
      // remove password field locally
      setProfile(p => ({ ...p, password: '' }));
    } catch (err) {
      const msg = err?.response?.data?.error || 'فشل تحديث الملف الشخصي';
      add(msg, { type: 'danger' });
    } finally { setLoading(false); }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('هل تريد إلغاء هذا الطلب؟')) return;
    try {
      await api.post(`/api/orders/${orderId}/cancel`);
      add('تم إلغاء الطلب', { type: 'success' });
      // refresh orders
      const res = await api.get('/api/orders/my');
      setOrders(res.data || []);
    } catch (err) {
      const msg = err?.response?.data?.error || 'فشل إلغاء الطلب';
      add(msg, { type: 'danger' });
    }
  };

  const isCancelable = (order) => {
    if (!order || order.status !== 'pending') return false;
    const created = new Date(order.createdAt).getTime();
    const thirtyMin = 30 * 60 * 1000;
    return (now - created) <= thirtyMin;
  };

  const remainingMs = (order) => {
    if (!order) return 0;
    const created = new Date(order.createdAt).getTime();
    const thirtyMin = 30 * 60 * 1000;
    return Math.max(0, thirtyMin - (now - created));
  };

  const formatRemaining = (ms) => {
    if (!ms || ms <= 0) return '00:00';
    const total = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60).toString().padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const printInvoice = (order) => {
    try {
      const w = window.open('', '_blank');
      if (!w) throw new Error('Unable to open print window');
      const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>فاتورة الطلب ${order._id}</title>
        <style>body{font-family:Arial,Helvetica,sans-serif;direction:rtl;padding:20px;color:#111} .header{display:flex;justify-content:space-between;align-items:center} .items{width:100%;border-collapse:collapse;margin-top:16px} .items td,.items th{border:1px solid #ddd;padding:8px} .total{font-weight:700;text-align:right;margin-top:12px}</style>
        </head><body>
        <div class="header"><div><h2>M&O Store</h2><div>فاتورة الشراء</div></div><div>طلب #${order._id}</div></div>
        <div style="margin-top:8px;color:#666">تاريخ: ${new Date(order.createdAt).toLocaleString()}</div>
        <h4 style="margin-top:16px">بيانات المستلم</h4>
        <div>${order.userDetails?.username || ''}</div>
        <div style="color:#666">${order.userDetails?.Address || ''}</div>
        <div style="color:#666">هاتف: ${order.userDetails?.phoneNumber || ''}</div>
        <h4 style="margin-top:12px">العناصر</h4>
        <table class="items"><thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th></tr></thead><tbody>
        ${order.products.map(p => `<tr><td>${(p.productDetails && p.productDetails.Name) || 'منتج'}</td><td style="text-align:center">${p.quantity}</td><td style="text-align:right">${formatEGP((p.productDetails && p.productDetails.Sell) || 0)}</td><td style="text-align:right">${formatEGP(((p.productDetails && p.productDetails.Sell) || 0) * p.quantity)}</td></tr>`).join('')}
        </tbody></table>
        <div class="total">المجموع المدفوع: ${formatEGP(order.totalPrice)}</div>
        <script>window.print();setTimeout(()=>window.close(),500);</script>
        </body></html>`;
      w.document.write(html);
      w.document.close();
    } catch (err) {
      add('فشل فتح نافذة الطباعة', { type: 'danger' });
    }
  };

  return (
    <div className="container py-4" dir="rtl">
      <h2 className="mb-3">حسابي</h2>

      <div className="row">
        <div className="col-md-5">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">الملف الشخصي</h5>
              <form onSubmit={saveProfile}>
                <div className="mb-2">
                  <label className="form-label">اسم المستخدم</label>
                  <input name="username" value={profile.username || ''} onChange={handleChange} className="form-control" />
                </div>
                <div className="mb-2">
                  <label className="form-label">العنوان</label>
                  <input name="Address" value={profile.Address || ''} onChange={handleChange} className="form-control" />
                </div>
                <div className="mb-2">
                  <label className="form-label">رقم الهاتف</label>
                  <input name="phoneNumber" value={profile.phoneNumber || ''} onChange={handleChange} className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">كلمة المرور (لتغييرها فقط)</label>
                  <input name="password" value={profile.password || ''} onChange={handleChange} type="password" className="form-control" />
                </div>
                <button className="btn btn-brand" disabled={loading}>{loading ? 'جارٍ...' : 'حفظ التغييرات'}</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">الطلبات</h5>
              {orders.length === 0 ? (
                <div>لا يوجد طلبات بعد</div>
              ) : (
                <div className="list-group">
                  {orders.map(o => (
                    <div key={o._id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div style={{fontWeight:700}}>طلب #{o._id.slice(-6)}</div>
                          <div style={{fontSize:13,color:'#666'}}>{new Date(o.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-end">
                          <div style={{fontWeight:700}}>السعر الإجمالي: {formatEGP(o.totalPrice)}</div>
                          <div style={{fontSize:13, color: o.status === 'cancelled' ? '#c00' : '#0b6'}}>{o.status}</div>
                        </div>
                      </div>

                      <div className="mt-2 d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setExpanded(expanded === o._id ? null : o._id)}>
                          {expanded === o._id ? 'إخفاء الفاتورة' : 'عرض الفاتورة'}
                        </button>
                        {o.status === 'pending' && isCancelable(o) && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => cancelOrder(o._id)}>إلغاء الطلب</button>
                        )}
                        {o.status === 'pending' && !isCancelable(o) && (
                          <div className="text-muted" style={{fontSize:13}}>نافذة الإلغاء انتهت</div>
                        )}
                        <div style={{flex:1}} />
                        <div style={{minWidth:160, textAlign:'right'}}>
                          {o.status === 'pending' && (
                            <div style={{fontSize:12, color:'#666'}}>وقت الإلغاء المتبقي: {formatRemaining(remainingMs(o))}</div>
                          )}
                          {o.status === 'pending' && (
                            <div style={{height:6, background:'#eee', borderRadius:4, overflow:'hidden', marginTop:6}}>
                              {(() => {
                                const pct = Math.round((remainingMs(o) / (30 * 60 * 1000)) * 100);
                                const color = pct > 66 ? '#10b981' : pct > 33 ? '#f59e0b' : '#ef4444';
                                return <div style={{width:`${pct}%`, height:6, background:color}} />;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {expanded === o._id && (
                        <div className="mt-3 border-top pt-3">
                          <div style={{fontWeight:700}}>فاتورة الطلب — رقم الشراء #{o._id}</div>
                          <div style={{fontSize:13,color:'#666'}}>تاريخ الشراء: {new Date(o.createdAt).toLocaleString()}</div>
                          <div className="mt-3">
                            <div style={{fontWeight:700}}>تفاصيل الشحنة</div>
                            <div style={{fontSize:14}}>{o.userDetails?.username}</div>
                            <div style={{fontSize:13,color:'#666'}}>{o.userDetails?.Address}</div>
                            <div style={{fontSize:13,color:'#666'}}>هاتف: {o.userDetails?.phoneNumber}</div>
                          </div>
                          <div className="mt-3">
                            <div style={{fontWeight:700}}>العناصر</div>
                            <div className="mt-2">
                              {o.products.map(p => (
                                <div key={p.product} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                  <div style={{flex:1}}>
                                    <div style={{fontWeight:600}}>{p.productDetails?.Name || 'منتج'}</div>
                                    <div style={{fontSize:13,color:'#666'}}>الكمية: {p.quantity} × السعر: {formatEGP(p.productDetails?.Sell || 0)}</div>
                                  </div>
                                  <div style={{fontWeight:700, minWidth:100, textAlign:'right'}}>{formatEGP((p.productDetails?.Sell || 0) * p.quantity)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3 d-flex justify-content-between align-items-center">
                            <div style={{fontWeight:700}}>المجموع المدفوع: {formatEGP(o.totalPrice)}</div>
                            <div>
                              <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => printInvoice(o)}>طباعة الفاتورة</button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
