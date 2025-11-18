import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try{ return JSON.parse(localStorage.getItem('cart')) || []; }catch{ return []; }
  });

  useEffect(()=>{ localStorage.setItem('cart', JSON.stringify(items)); },[items]);

  const add = (product, qty=1) => {
    setItems(prev=>{
      const available = typeof product.QTY === 'number' ? product.QTY : null;
      if (available !== null && available <= 0) return prev;
      const found = prev.find(i=>i._id===product._id);
      if(found) {
        const nextQty = (found.qty || 0) + qty;
        const clamped = available !== null ? Math.min(nextQty, available) : nextQty;
        return prev.map(i=> i._id===product._id ? {...i, qty: clamped} : i);
      }
      const initialQty = available !== null ? Math.min(qty, available) : qty;
      return [...prev, {...product, qty: initialQty}];
    });
  };
  const decrease = (productId, qty = 1) => {
    setItems(prev => prev
      .map(i => i._id === productId ? { ...i, qty: (i.qty || 0) - qty } : i)
      .filter(i => (i.qty || 0) > 0)
    );
  };
  const remove = (id) => setItems(prev => prev.filter(i=>i._id!==id));
  const clear = () => setItems([]);

  const totalItems = items.reduce((s, it) => s + (it.qty || 0), 0);
  const totalPrice = items.reduce((s, it) => s + (it.qty || 0) * (it.Sell || 0), 0);

  return (
    <CartContext.Provider value={{items, add, decrease, remove, clear, totalItems, totalPrice}}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
