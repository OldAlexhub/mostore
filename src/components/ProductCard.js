import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import getPrimaryImage from '../utils/getPrimaryImage';

const ProductCard = ({ product }) => {
  const { add, decrease } = useCart();
  const toast = useToast();
  const { discount } = useStore();
  const [showAdded, setShowAdded] = useState(false);

  const isGeneralDiscount = discount && discount.active && discount.type === 'general' && discount.value > 0;
  const discountedPrice = isGeneralDiscount ? Math.max(0, (product.Sell || 0) * (1 - discount.value / 100)) : product.Sell;
  const availableQty = Number(product.QTY ?? product.availableQty ?? 0);
  const minQty = Number(product.minQty ?? 0);
  const derivedStatus = availableQty <= 0
    ? 'out_of_stock'
    : (availableQty <= (minQty || 3) ? 'low_stock' : 'in_stock');
  const stockStatus = product.stockStatus || derivedStatus;
  const statusLabel = stockStatus === 'out_of_stock' ? 'نفدت الكمية' : stockStatus === 'low_stock' ? 'كمية محدودة' : 'متوفر';
  const statusClass = stockStatus === 'out_of_stock' ? 'bg-danger' : stockStatus === 'low_stock' ? 'bg-warning text-dark' : 'bg-success';
  const isOutOfStock = stockStatus === 'out_of_stock';

  const handleAdd = () => {
    if (isOutOfStock) {
      if (toast && typeof toast.add === 'function') toast.add('هذا المنتج غير متوفر حالياً');
      return;
    }
    add(product, 1);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 900);
    if (toast && typeof toast.add === 'function') {
      toast.add(`${product.Name} اتضاف للسلة`, { undo: () => decrease(product._id, 1), undoLabel: 'تراجع' });
    }
  };

  const img = getPrimaryImage(product);
  const productId = product?._id || product?.id;
  const detailHref = productId ? `/product/${productId}` : '#';

  return (
    <div className="card h-100 shadow-sm" style={{ position: 'relative', overflow: 'visible' }}>
      <Link to={detailHref} className="d-block text-decoration-none text-dark">
        <div style={{ height: 140, background: '#f3f4f6' }} className="d-flex align-items-center justify-content-center">
          {img ? (
            <img src={img} alt={product.Name || ''} style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain' }} />
          ) : (
            <span className="text-muted">صورة</span>
          )}
        </div>
      </Link>
      <div className="card-body p-2">
        <h6 className="card-title mb-1" style={{ fontSize: 14 }}>
          <Link to={detailHref} className="text-decoration-none text-dark">{product.Name}</Link>
        </h6>
        <span className={`badge ${statusClass}`} style={{ fontSize: 11 }}>{statusLabel}</span>
        <div className="d-flex justify-content-between align-items-center">
          <div className="text-muted">
            {isGeneralDiscount ? (
              <>
                <del style={{ marginLeft: 6 }}>ج.م {product.Sell}</del>
                <strong style={{ color: '#16a34a' }}>ج.م {discountedPrice.toFixed(0)}</strong>
              </>
            ) : (
              <>ج.م {product.Sell}</>
            )}
          </div>
          <button className="btn btn-sm btn-outline-primary" onClick={handleAdd} disabled={isOutOfStock}>
            {isOutOfStock ? 'غير متوفر' : 'أضف للسلة'}
          </button>
        </div>
        {stockStatus === 'low_stock' && <small className="text-warning d-block mt-1">سارع قبل ما تخلص!</small>}
      </div>

      {showAdded && (
        <div style={{ position: 'absolute', top: 8, left: 8, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <div style={{ background: '#198754', color: '#fff', padding: '6px 10px', borderRadius: 20, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8, animation: 'mo-pop 600ms ease-out' }}>
            <span style={{ fontSize: 13 }}>✓</span>
            <span style={{ fontSize: 13 }}>اتضاف للسلة</span>
          </div>
        </div>
      )}

      <style>{`@keyframes mo-pop { 0% { transform: translateY(-10px) scale(0.8); opacity:0 } 60% { transform: translateY(0) scale(1.05); opacity:1 } 100% { transform: translateY(0) scale(1); } }`}</style>
    </div>
  );
};

export default ProductCard;
