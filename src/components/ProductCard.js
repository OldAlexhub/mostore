
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product }) => {
  const { add, decrease } = useCart();
  const { add: addToast } = useToast();
  const [showAdded, setShowAdded] = useState(false);

  const handleAdd = () => {
    add(product, 1);
    // show small animation
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 900);
    addToast(`${product.Name} أضيفت إلى السلة`, { undo: () => decrease(product._id, 1), undoLabel: 'تراجع' });
  };

  return (
    <div className="card h-100 shadow-sm" style={{position:'relative', overflow:'visible'}}>
      <div style={{height:140,background:'#f3f4f6'}} className="d-flex align-items-center justify-content-center">
        <span className="text-muted">صورة</span>
      </div>
      <div className="card-body p-2">
        <h6 className="card-title mb-1" style={{fontSize:14}}>{product.Name}</h6>
        <div className="d-flex justify-content-between align-items-center">
          <div className="text-muted">ج.م {product.Sell}</div>
          <button className="btn btn-sm btn-outline-primary" onClick={handleAdd}>أضف إلى السلة</button>
        </div>
      </div>

      {showAdded && (
        <div style={{position:'absolute', top:8, left:8, transform:'translateY(-50%)', pointerEvents:'none'}}>
          <div style={{background:'#198754', color:'#fff', padding:'6px 10px', borderRadius:20, boxShadow:'0 6px 18px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', gap:8, animation:'mo-pop 600ms ease-out'}}>
            <span style={{fontSize:14}}>✓</span>
            <span style={{fontSize:13}}>تمت الإضافة</span>
          </div>
        </div>
      )}

      <style>{`@keyframes mo-pop { 0% { transform: translateY(-10px) scale(0.8); opacity:0 } 60% { transform: translateY(0) scale(1.05); opacity:1 } 100% { transform: translateY(0) scale(1); } }`}</style>
    </div>
  );
}

export default ProductCard;
