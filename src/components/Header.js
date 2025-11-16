import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    const q = (search || '').trim();
    if (!q) return navigate('/products');
    navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="app-topbar" dir="rtl">
      <div className="container d-flex align-items-center py-2">
        <div className="d-flex align-items-center" style={{ minWidth: 180 }}>
          <Link to="/" className="navbar-brand fw-bold me-3" style={{ color: 'var(--brand-contrast)' }}>M&O Store</Link>
        </div>

        <div className="flex-grow-1 d-flex justify-content-center">
          <form className="d-flex w-100" onSubmit={onSearch} style={{ maxWidth: 820 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="form-control app-search" placeholder="ابحث عن القطع المفضلة: فستان، شنطة، طرح..." />
            <button className="btn btn-brand ms-2" type="submit">بحث</button>
          </form>
        </div>

        <div className="d-flex align-items-center ms-3" style={{ gap: 12 }}>
          <Link className="text-white position-relative" to="/cart" aria-label="سلة المشتريات">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-cart" viewBox="0 0 16 16">
              <path d="M0 1.5A.5.5 0 0 1 .5 1h1a.5.5 0 0 1 .485.379L2.89 5H14.5a.5.5 0 0 1 .49.598l-1.5 6A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.49-.402L1.01 1.607 1 1.5H.5z" />
            </svg>
            {totalItems > 0 && (
              <span className="badge bg-danger position-absolute" style={{ top: '-6px', right: '-10px', fontSize: '11px' }}>{totalItems}</span>
            )}
          </Link>
          <Link to="/track" className="btn btn-sm btn-outline-light">تتبع الطلب</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
