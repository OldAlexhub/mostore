import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer text-light mt-4" dir="rtl" style={{ background: 'radial-gradient(circle at top, #6a3cb8, #2a1f4d)', borderTop: '4px solid rgba(255,255,255,0.25)' }}>
      <div className="container py-4">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-md-4">
            <div style={{ fontWeight: 700, fontSize: 20 }}>M&O Store</div>
            <p className="text-muted mb-2" style={{ fontSize: 13 }}>© {year} — كل الحقوق محفوظة.</p>
            <p className="mb-0" style={{ fontSize: 14 }}>شارع مسجد سيدي بشر قدام جراج النقل العام جنب كافيتريا الفارس.</p>
          </div>
          <div className="col-12 col-md-4">
            <h6 className="text-uppercase text-muted" style={{ fontSize: 11, letterSpacing: 2 }}>روابط سريعة</h6>
            <div className="d-flex flex-column gap-1">
              <Link to="/products" className="text-light text-decoration-none" style={{ fontSize: 13 }}>تسوق المنتجات</Link>
              <Link to="/cart" className="text-light text-decoration-none" style={{ fontSize: 13 }}>السلة</Link>
              <Link to="/track" className="text-light text-decoration-none" style={{ fontSize: 13 }}>تتبع طلبك</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <h6 className="text-uppercase text-muted" style={{ fontSize: 11, letterSpacing: 2 }}>ابقَ على تواصل</h6>
            <p className="mb-1" style={{ fontSize: 13 }}>خدمة العملاء 24/7 عبر الشات أو صفحاتنا.</p>
            <div style={{ fontSize: 12, color: '#c7bdf2' }}>مرحب بيك دايماً في الفرع، ونضمن لك تجربة تسوق مريحة وأنيقة.</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
