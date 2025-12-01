import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import bannerImg from '../images/banner.png';

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
  if (/[\u0600-\u06FF]/.test(s)) return s;
  const low = s.toLowerCase();
  const key = low.replace(/[^a-z0-9]+/g, ' ').split(' ')[0];
  if (AR_CATEGORY[key]) return AR_CATEGORY[key];
  if (low.includes('scarv') || low.includes('hijab')) return 'أوشحة وحجاب';
  if (low.includes('scarf')) return 'أوشحة';
  if (low.includes('cloth') || low.includes('apparel')) return 'ملابس';
  if (low.includes('beaut') || low.includes('cosmet')) return 'منتجات التجميل';
  if (low.includes('accessor')) return 'اكسسوارات';
  if (low.includes('sale')) return 'تخفيضات';
  if (low === 'all' || low === 'الكل') return 'الكل';
  return s;
};

const normalizeLabel = (value) => {
  if (!value && value !== 0) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\u0600-\u06FFA-Za-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const DEFAULT_HERO = {
  header: 'أهلاً بيك في M&O Store',
  sentence1: 'أحسن المنتجات بأحسن الأسعار — عروض يومية وتوصيل سريع لحد باب البيت.',
  sentence2: 'تسوق من تشكيلاتنا المُختارة: تخفيضات، منتجات جديدة، وخامات مضمونة.',
  sentence3: 'تعالى نورنا في شارع مسجد سيدي بشر امام جراج النقل العام بجوار كافيتريا الفارس.',
  contactLabel: 'كلمنا على واتساب',
  whatsappNumber: '+201008508808'
};

const Home = () => {

  const [heroContent, setHeroContent] = useState(DEFAULT_HERO);
  const [gems, setGems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/api/products/hidden-gems?limit=8')
      .then(res => { if (mounted) setGems(res.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => mounted = false;
  }, []);

  useEffect(() => {
    let mounted = true;
    api.get('/api/hero')
      .then(res => {
        if (!mounted) return;
        const data = res.data || {};
        setHeroContent({ ...DEFAULT_HERO, ...data });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const navigate = useNavigate();
  // featured categories shown on home that should open /products with that filter
  // NOTE: previously this included a static fallback list. We now rely solely
  // on dynamically discovered categories from the products API.
  const [featured, setFeatured] = useState([]);
  const categoryMeta = (() => {
    const blocklist = new Set(featured.map(f => normalizeLabel(f.label)));
    const seen = new Set();
    const next = [];
    const labelToRaw = new Map();
    cats.forEach((cat) => {
      const label = translateCategory(cat);
      if (!label) return;
      const normalized = normalizeLabel(label);
      if (!labelToRaw.has(label)) labelToRaw.set(label, cat);
      if (!labelToRaw.has(normalized)) labelToRaw.set(normalized, cat);
      if (blocklist.has(normalized)) return;
      if (seen.has(normalized)) return;
      seen.add(normalized);
      next.push({ raw: cat, label });
    });
    return { filtered: next, labelToRaw };
  })();
  const labelToRaw = categoryMeta.labelToRaw;
  const goToFeatured = ({ label, query }) => {
    if (label === 'الكل') return navigate('/products');
    const normalized = normalizeLabel(label);
    const resolved = labelToRaw.get(label) || labelToRaw.get(normalized) || query || '';
    if (!resolved) return navigate('/products');
    // prefer `Category` query param; Products page accepts `cat` or `Category`
    navigate(`/products?Category=${encodeURIComponent(resolved)}`);
  };

  // Fetch distinct Category values to populate the category strip
  useEffect(() => {
    let mounted = true;
    api.get('/api/products')
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data?.products) ? res.data.products : Array.isArray(res.data) ? res.data : [];
        const uniq = Array.from(new Set(list.map(p => p.Category).filter(Boolean)));
        setCats(uniq.slice(0, 12));

        // pick top categories that actually have products
        const counts = new Map();
        list.forEach(p => {
          const raw = p.Category;
          if (!raw) return;
          const normalized = normalizeLabel(raw);
          if (!normalized) return;
          counts.set(raw, (counts.get(raw) || 0) + 1);
        });

        const dynamicFeatured = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([raw]) => ({ label: translateCategory(raw), query: raw }))
          .filter(item => item.label)
          .slice(0, 6);

        // Only use categories discovered from products (no static fallbacks).
        const seen = new Set();
        const merged = [];
        const pushUnique = (item) => {
          const normalized = normalizeLabel(item.label);
          if (!normalized || seen.has(normalized)) return;
          seen.add(normalized);
          merged.push(item);
        };

        dynamicFeatured.forEach(pushUnique);

        // Ensure a dynamic "All" entry is present at the start so users can
        // always return to the full product listing. Do not re-introduce other
        // static fallbacks — this is the only injected static item.
        const allEntry = { label: 'الكل', query: '' };
        const allNormalized = normalizeLabel(allEntry.label);
        if (!merged.some(it => normalizeLabel(it.label) === allNormalized)) {
          merged.unshift(allEntry);
        } else {
          // if 'الكل' exists but not at start, move it to the front
          const idx = merged.findIndex(it => normalizeLabel(it.label) === allNormalized);
          if (idx > 0) {
            const [found] = merged.splice(idx, 1);
            merged.unshift(found);
          }
        }

        if (merged.length) setFeatured(merged);
      })
      .catch(() => {})
    return () => mounted = false;
  }, []);

  return (
    <>
      <SEO title="الرئيسية" description="M&O Store - منتجات مميزة." />
      <main className="container py-4">
      <div className="hero-landing mb-3">
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
            <h1 className="mb-2" style={{fontSize: '2.1rem', fontWeight:700}}>{heroContent.header}</h1>
            <p className="mb-2 text-muted" style={{fontSize:16}}>{heroContent.sentence1}</p>
            <p className="mb-3 text-muted" style={{fontSize:15}}>{heroContent.sentence2}</p>
            <p className="mb-3 text-muted" style={{fontSize:15}}>{heroContent.sentence3}</p>
            <div className="d-flex align-items-center justify-content-center justify-content-md-end gap-2 mb-3" style={{fontSize:15}}>
              <span>{heroContent.contactLabel}</span>
              {heroContent.whatsappNumber && (
                <a
                  href={`https://wa.me/${heroContent.whatsappNumber.replace(/^\+/, '')}`}
                  className="text-decoration-none fw-semibold d-flex align-items-center gap-1"
                  style={{color:'#25D366'}}
                >
                  <span style={{fontSize:20}}>🟢</span>
                  {heroContent.whatsappNumber.startsWith('+') ? heroContent.whatsappNumber : `+${heroContent.whatsappNumber}`}
                </a>
              )}
            </div>

            <div className="d-flex justify-content-center justify-content-md-end mb-3">
              <Link to="/products" className="btn btn-brand btn-lg">تسوق الآن</Link>
            </div>

            <div className="d-flex justify-content-center justify-content-md-end gap-2 flex-wrap" style={{fontSize:13}}>
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
    </>
  );
};

export default Home;

