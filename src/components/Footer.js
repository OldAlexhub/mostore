import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer bg-dark text-light mt-3">
      <div className="container d-flex justify-content-between align-items-center py-2">
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{fontWeight:700, color:'var(--brand-contrast)'}}>M&O Store</div>
          <div className="text-muted" style={{fontSize:13}}>© {year}</div>
        </div>

        <div style={{display:'flex', gap:16, alignItems:'center'}}>
          <Link to="/products" className="text-muted" style={{fontSize:13}}>المنتجات</Link>
          <Link to="/profile" className="text-muted" style={{fontSize:13}}>حسابي</Link>
          <Link to="/cart" className="text-muted" style={{fontSize:13}}>سلة</Link>
          <div className="text-muted" style={{fontSize:13}}>ج.م</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
