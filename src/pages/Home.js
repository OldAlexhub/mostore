import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import bannerImg from '../images/banner.png';

const Home = () => {
  // Arabic translations for common category keys. If a category is already Arabic
  // or not listed here, we fall back to the original value.
  const AR_CATEGORY = {
    dresses: 'فساتين',
    shoes: 'أحذية',
    accessories: 'اكسسوارات',
    new: 'وصل حديثاً',
    sale: 'تخفيضات',
    gift: 'هدايا',
    all: 'الكل'
  };

  const translateCategory = (raw) => {
    if (!raw && raw !== 0) return raw;
    const s = String(raw).trim();
    // if it's already Arabic or contains Arabic letters, return as-is
    if (/[\u0600-\u06FF]/.test(s)) return s;

    const low = s.toLowerCase();
    // direct lookup by simplified key
    const key = low.replace(/[^a-z0-9]+/g, ' ').split(' ')[0];
    if (AR_CATEGORY[key]) return AR_CATEGORY[key];

    // heuristics
    if (low.includes('scarv') || low.includes('hijab')) return 'أوشحة وحجاب';
    if (low.includes('scarf')) return 'أوشحة';
    if (low.includes('cloth') || low.includes('apparel')) return 'ملابس';
    if (low.includes('beaut') || low.includes('cosmet')) return 'منتجات التجميل';
    if (low.includes('accessor')) return 'اكسسوارات';
    if (low.includes('sale')) return 'تخفيضات';
    if (low === 'all' || low === 'الكل') return 'الكل';

    // fallback to original
    return s;
  };

  const [gems, setGems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem('announcementDismissed'); } catch { return false; }
  });

  useEffect(() => {
    let mounted = true;
    api.get('/api/products/hidden-gems?limit=8')
      .then(res => { if (mounted) setGems(res.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => mounted = false;
  }, []);

  const navigate = useNavigate();
  // featured categories shown on home that should open /products with that filter
  const featured = [
    { label: 'الكل', query: '' },
    { label: 'أوشحة وحجاب', query: 'Scarves' },
    { label: 'اكسسوارات', query: 'Accessories' },
    { label: 'ملابس', query: 'Clothes' },
    { label: 'منتجات التجميل', query: 'Beauty' }
  ];
  const categoryMeta = (() => {
    const blocklist = new Set(featured.map(f => f.label));
    const seen = new Set();
    const next = [];
    const labelToRaw = new Map();
    cats.forEach((cat) => {
      const label = translateCategory(cat);
      if (!label) return;
      if (!labelToRaw.has(label)) labelToRaw.set(label, cat);
      if (blocklist.has(label)) return;
      if (seen.has(label)) return;
      seen.add(label);
      next.push({ raw: cat, label });
    });
    return { filtered: next, labelToRaw };
  })();
  const filteredCats = categoryMeta.filtered;
  const labelToRaw = categoryMeta.labelToRaw;
  const goToFeatured = ({ label, query }) => {
    if (label === 'الكل') return navigate('/products');
    const resolved = labelToRaw.get(label) || query || '';
    if (!resolved) return navigate('/products');
    // prefer `Category` query param; Products page accepts `cat` or `Category`
    navigate(`/products?Category=${encodeURIComponent(resolved)}`);
  };

  // fetch announcement (if any)
  useEffect(()=>{
    let mounted = true;
    api.get('/api/announcements')
      .then(res=>{ if (!mounted) return; setAnnouncement(res.data || null); })
      .catch(()=>{})
    return ()=> mounted = false;
  },[]);

  // Fetch distinct Category values to populate the category strip
  useEffect(() => {
    let mounted = true;
    api.get('/api/products')
      .then(res => {
        if (!mounted) return;
        const list = res.data || [];
        const uniq = Array.from(new Set(list.map(p => p.Category).filter(Boolean)));
        setCats(uniq.slice(0, 12));
      })
      .catch(() => {})
    return () => mounted = false;
  }, []);

  return (
    <main className="container py-4">
      <div className="hero-landing mb-3">
          {/* Announcement area (only render if announcement present and not dismissed) */}
          {announcement && !dismissed && (
            <div className="mb-3">
              <div className="alert alert-warning d-flex justify-content-between align-items-center mb-0" role="alert" style={{borderRadius:8}}>
                <div>
                  {announcement.href ? <a href={announcement.href} className="text-decoration-none text-dark">{announcement.text}</a> : <span>{announcement.text}</span>}
                </div>
                <button className="btn btn-sm btn-light" onClick={()=>{ setDismissed(true); try{ localStorage.setItem('announcementDismissed','1'); }catch{} }}>✕</button>
              </div>
            </div>
          )}
        <div className="row g-0 align-items-center">
          {/* image column: shown on right for RTL on md+ */}
          <div className="col-12 col-md-6 order-md-2">
            <div style={{position:'relative', overflow:'hidden', borderRadius:12, height:320}} className="d-none d-md-block">
              <img alt="banner" src={bannerImg} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
              <div style={{position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.05))'}} />
            </div>
            <div className="d-block d-md-none mb-3">
              <img alt="banner" src={bannerImg} style={{width:'100%', borderRadius:8, display:'block'}} />
            </div>
          </div>

          {/* content column */}
          <div className="col-12 col-md-6 order-md-1 text-md-end text-center px-3 px-md-4">
            <h1 className="mb-2" style={{fontSize: '2.1rem', fontWeight:700}}>أهلاً بيك في M&O Store</h1>
            <p className="mb-2 text-muted" style={{fontSize:16}}>أحسن الحاجات بأحسن الأسعار — عروض يومية وتوصيل سريع لحد باب البيت.</p>
            <p className="mb-3 text-muted" style={{fontSize:15}}>تسوق من تشكيلاتنا المُختارة: تخفيضات، منتجات جديدة، وخامات مضمونة.</p>

            <div className="d-flex justify-content-center justify-content-md-end mb-3">
              <Link to="/products" className="btn btn-brand btn-lg">تسوق الآن</Link>
            </div>

            <div className="d-flex justify-content-center justify-content-md-end gap-2 flex-wrap" style={{fontSize:13}}>
              <div className="badge bg-light text-dark border">🚚 شحن مجاني فوق 1000 ج.م</div>
              <div className="badge bg-light text-dark border">↩️ استرجاع خلال 14 يوم</div>
              <div className="badge bg-light text-dark border">💬 دعم 24/7</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="d-flex gap-2 flex-wrap mb-2">
          {featured.map(item => (
            <button key={item.label} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => goToFeatured(item)}>{item.label}</button>
          ))}
        </div>
        <nav className="category-strip" aria-label="Categories">
          <Link to="/products">الكل</Link>
          {filteredCats.map(({ raw, label }) => (
            <Link key={raw || label} to={`/products?Category=${encodeURIComponent(raw || label)}`}>{label}</Link>
          ))}
        </nav>
      </div>

      <section>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>اختيارات فريقنا</h4>
          <small className="text-muted">منتجات مميزة للتصفّح</small>
        </div>

        {loading && <div className="text-center py-4">جارٍ التحميل…</div>}

        {!loading && gems && gems.length === 0 && (
          <div className="text-center text-muted py-4">لا توجد عناصر للعرض حالياً.</div>
        )}

        <div className="row g-3">
          {gems.map(p => (
            <div key={p._id} className="col-6 col-sm-4 col-md-3">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
