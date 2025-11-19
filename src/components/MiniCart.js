import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { formatEGP } from '../utils/formatCurrency';
import getPrimaryImage from '../utils/getPrimaryImage';

const MiniCart = ({ className = '' }) => {
  const { items, decrease, remove, totalItems, totalPrice } = useCart();
  const { discount, shipping } = useStore();

  const storeDiscountMeta = (() => {
    if (!discount || !discount.active || (discount.value || 0) <= 0) {
      return { amount: 0, applies: false };
    }
    const meetsThreshold = discount.type === 'general' || totalPrice >= (discount.minTotal || 0);
    if (!meetsThreshold) return { amount: 0, applies: false };
    const amount = Math.round(totalPrice * (discount.value / 100));
    return { amount, applies: amount > 0 };
  })();

  const shippingFee = shipping?.enabled ? Number(shipping.amount || 0) : 0;
  const payableTotal = Math.max(0, totalPrice - storeDiscountMeta.amount);
  const totalWithShipping = payableTotal + shippingFee;

  return (
    <aside className={className} aria-label="ملخص السلة" style={{ minWidth: 260 }} dir="rtl">
      <div className="card">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">
              السلة <small className="text-muted">{totalItems} قطعة</small>
            </div>
            <div className="text-end">{formatEGP(payableTotal)}</div>
          </div>
          {storeDiscountMeta.applies && (
            <div className="d-flex justify-content-between align-items-center text-success small mb-2">
              <div>خصم المتجر</div>
              <div>- {formatEGP(storeDiscountMeta.amount)}</div>
            </div>
          )}
          {shippingFee > 0 && (
            <div className="d-flex justify-content-between align-items-center small mb-2">
              <div>رسوم الشحن</div>
              <div>{formatEGP(shippingFee)}</div>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center fw-semibold mb-3">
            <div>الإجمالي</div>
            <div>{formatEGP(totalWithShipping)}</div>
          </div>

          {items.length === 0 && (
            <div className="text-center text-muted py-3">السلة فاضية.</div>
          )}

          {items.length > 0 && (
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {items.map((item) => {
                const img = getPrimaryImage(item, item.productDetails);
                return (
                <div key={item._id} className="d-flex align-items-center gap-3 mb-3">
                  <div className="d-flex align-items-center justify-content-center bg-light text-muted rounded" style={{ width: 48, height: 48, flexShrink: 0 }}>
                    {img ? (
                      <img src={img} alt={item.Name || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ fontSize: 11, color: '#999' }}>صورة</div>
                    )}
                  </div>
                  <div className="flex-grow-1 text-end">
                    <div className="fw-semibold" style={{ fontSize: 13 }}>{item.Name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {formatEGP(item.Sell)} × {item.qty}
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-2" style={{ minWidth: 80 }}>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(item._id)} style={{ fontSize: 12 }}>حذف</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => decrease(item._id)} style={{ fontSize: 12 }}>تقليل</button>
                  </div>
                </div>
              );})}
            </div>
          )}

          <div className="mt-3">
            <Link to="/cart" className="btn btn-sm btn-brand w-100">استكمال الدفع</Link>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default MiniCart;
