import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatEGP } from '../utils/formatCurrency';

const MiniCart = ({ className = '' }) => {
  const { items, decrease, remove, totalItems, totalPrice } = useCart();

  return (
    <aside className={className} aria-label="Mini Cart" style={{minWidth:260}}>
      <div className="card">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">السلة <small className="text-muted">{totalItems} عناصر</small></div>
            <div className="text-end">{formatEGP(totalPrice)}</div>
          </div>

          {items.length === 0 && (
            <div className="text-center text-muted py-3">السلة فارغة</div>
          )}

          {items.length > 0 && (
            <div style={{maxHeight:220, overflowY:'auto'}}>
              {items.map(it => (
                <div key={it._id} className="d-flex align-items-center mb-2">
                  <div style={{width:48, height:48, background:'#f3f4f6', borderRadius:6, overflow:'hidden', flexShrink:0}}>
                    {it.image ? <img src={it.image} alt={it.Name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : null}
                  </div>
                  <div className="flex-grow-1 me-2">
                    <div style={{fontSize:13}} className="text-truncate">{it.Name}</div>
                    <div className="text-muted" style={{fontSize:12}}>{formatEGP(it.Sell)} · x{it.qty}</div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>decrease(it._id)}>-</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(it._id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3">
            <Link to="/cart" className="btn btn-sm btn-brand w-100">اذهب للسلة</Link>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default MiniCart;
