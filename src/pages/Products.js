import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import MiniCart from '../components/MiniCart';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' | 'list' | 'compact'
  const [filterOptions, setFilterOptions] = useState({ categories: [], subcategories: [], materials: [], seasons: [], styles: [] });
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [limit, setLimit] = useState(parseInt(new URLSearchParams(location.search).get('limit') || '24', 10));

  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  const cat = params.get('cat') || '';
  const categoryParam = params.get('Category') || '';
  const subcategoryParam = params.get('Subcategory') || '';
  const materialParam = params.get('Material') || '';
  const seasonParam = params.get('Season') || '';
  const styleParam = params.get('Style') || '';
  const sortParam = params.get('sort') || '';

  const pageParam = parseInt(params.get('page') || '1', 10);
  const limitParam = parseInt(params.get('limit') || '24', 10);

  const csvToArray = v => (v ? v.toString().split(',').map(s => s.trim()).filter(Boolean) : []);
  const categoryArr = csvToArray(params.get('Category') || '');
  const subcategoryArr = csvToArray(params.get('Subcategory') || '');
  const materialArr = csvToArray(params.get('Material') || '');
  const seasonArr = csvToArray(params.get('Season') || '');
  const styleArr = csvToArray(params.get('Style') || '');

  useEffect(()=>{
    let mounted = true;
    setLoading(true);
    setError(null);

    // If there's a search query, use the search endpoint (server applies its own scoring)
    if (q) {
      api.get(`/api/products/search?q=${encodeURIComponent(q)}`)
        .then(res=>{ if(mounted) { setProducts(res.data); setPages(0); setTotal(0); } })
        .catch(err=>{ if(mounted) setError('حدث خطأ أثناء جلب المنتجات'); })
        .finally(()=>{ if(mounted) setLoading(false); });
      return () => mounted = false;
    }

    // Build endpoint with filters/sort and pagination
    let endpoint = '/api/products';
    const qs = new URLSearchParams();
    if (cat) qs.set('cat', cat);
    if (categoryParam) qs.set('Category', categoryParam);
    if (subcategoryParam) qs.set('Subcategory', subcategoryParam);
    if (materialParam) qs.set('Material', materialParam);
    if (seasonParam) qs.set('Season', seasonParam);
    if (styleParam) qs.set('Style', styleParam);
    if (sortParam) qs.set('sort', sortParam);
    // include pagination params so server returns metadata
    if (pageParam && limitParam) {
      qs.set('page', String(pageParam));
      qs.set('limit', String(limitParam));
    }
    const qsStr = qs.toString();
    if (qsStr) endpoint += `?${qsStr}`;

    api.get(endpoint)
      .then(res=>{
        if (!mounted) return;
        if (res.data && Array.isArray(res.data.products)) {
          setProducts(res.data.products);
          setTotal(res.data.total || 0);
          setPages(res.data.pages || 0);
          setLimit(res.data.limit || limitParam);
        } else if (Array.isArray(res.data)) {
          setProducts(res.data);
          setTotal(0);
          setPages(0);
        } else {
          setProducts([]);
          setTotal(0);
          setPages(0);
        }
      })
      .catch(err=>{ if(mounted) setError('حدث خطأ أثناء جلب المنتجات'); })
      .finally(()=>{ if(mounted) setLoading(false); });
    return ()=> mounted = false;
  },[q, cat, categoryParam, subcategoryParam, materialParam, seasonParam, styleParam, sortParam, pageParam, limitParam]);

  // fetch filter options once
  useEffect(()=>{
    let mounted = true;
    api.get('/api/products/filters')
      .then(res=>{ if(mounted) setFilterOptions(res.data); })
      .catch(()=>{});
    return ()=> mounted = false;
  },[]);

  const updateQuery = (key, value) => {
    const p = new URLSearchParams(location.search);
    if (value) p.set(key, value);
    else p.delete(key);
    // when changing filters/sort reset to first page
    if (key !== 'page') p.delete('page');
    navigate(`/products?${p.toString()}`);
  };

  const updateMulti = (key, selectedOptions) => {
    const vals = Array.from(selectedOptions).map(o=>o.value).filter(Boolean);
    updateQuery(key, vals.length ? vals.join(',') : '');
  };

  return (
    <main className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h3 className="mb-0">المنتجات</h3>
              <div className="text-muted small">إجمالي: {total} · عرض {limit} لكل صفحة</div>
            </div>
        <div>
          <div className="btn-group" role="group" aria-label="View">
            <button className={`btn btn-sm ${view==='grid' ? 'btn-brand' : 'btn-outline-secondary'}`} onClick={()=>setView('grid')}>شبكة</button>
            <button className={`btn btn-sm ${view==='list' ? 'btn-brand' : 'btn-outline-secondary'}`} onClick={()=>setView('list')}>قائمة</button>
            <button className={`btn btn-sm ${view==='compact' ? 'btn-brand' : 'btn-outline-secondary'}`} onClick={()=>setView('compact')}>مصغّر</button>
          </div>
        </div>
      </div>
      {/* Filters / Sort */}
      <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
        <select multiple className="form-select form-select-sm me-2" style={{width:160, minHeight:40}} value={categoryArr} onChange={e=>updateMulti('Category', e.target.selectedOptions)}>
          <option value="">كل التصنيفات</option>
          {filterOptions.categories.map(c=> c && <option key={c} value={c}>{c}</option>)}
        </select>
        <select multiple className="form-select form-select-sm me-2" style={{width:160, minHeight:40}} value={subcategoryArr} onChange={e=>updateMulti('Subcategory', e.target.selectedOptions)}>
          <option value="">كل الأنواع</option>
          {filterOptions.subcategories.map(s=> s && <option key={s} value={s}>{s}</option>)}
        </select>
        <select multiple className="form-select form-select-sm me-2" style={{width:160, minHeight:40}} value={materialArr} onChange={e=>updateMulti('Material', e.target.selectedOptions)}>
          <option value="">كل الخامات</option>
          {filterOptions.materials.map(m=> m && <option key={m} value={m}>{m}</option>)}
        </select>
        <select multiple className="form-select form-select-sm me-2" style={{width:140, minHeight:40}} value={seasonArr} onChange={e=>updateMulti('Season', e.target.selectedOptions)}>
          <option value="">كل المواسم</option>
          {filterOptions.seasons.map(s=> s && <option key={s} value={s}>{s}</option>)}
        </select>
        <select multiple className="form-select form-select-sm me-2" style={{width:140, minHeight:40}} value={styleArr} onChange={e=>updateMulti('Style', e.target.selectedOptions)}>
          <option value="">كل الستايلات</option>
          {filterOptions.styles.map(s=> s && <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="form-select form-select-sm ms-auto" style={{width:160}} value={sortParam} onChange={e=>updateQuery('sort', e.target.value)}>
          <option value="">ترتيب افتراضي</option>
          <option value="Sell_asc">من الأرخص للأغلى</option>
          <option value="Sell_desc">من الأغلى للأرخص</option>
        </select>
      </div>
      {loading && <div className="text-center py-5">جارٍ التحميل…</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {view === 'grid' && (
        <div className="row g-3">
          <div className="col-12 col-md-9">
            <div className="row g-3">
              {products && products.map(p => (
                <div key={p._id} className="col-6 col-sm-4 col-md-4 col-lg-3">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
          <div className="d-none d-md-block col-md-3">
            <MiniCart />
          </div>
        </div>
      )}

      {pages > 0 && (
        <nav className="d-flex justify-content-center mt-4" aria-label="Pagination">
          <ul className="pagination">
            <li className={`page-item ${pageParam <= 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={()=> updateQuery('page', Math.max(1, pageParam - 1))}>السابق</button>
            </li>
            {Array.from({ length: pages }).map((_, i) => {
              const p = i + 1;
              if (pages > 10 && Math.abs(p - pageParam) > 4 && p !== 1 && p !== pages) return null;
              return (
                <li key={p} className={`page-item ${p === pageParam ? 'active' : ''}`}>
                  <button className="page-link" onClick={()=> updateQuery('page', p)}>{p}</button>
                </li>
              );
            })}
            <li className={`page-item ${pageParam >= pages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={()=> updateQuery('page', Math.min(pages, pageParam + 1))}>التالي</button>
            </li>
          </ul>
        </nav>
      )}

      {view === 'list' && (
        <div className="list-group">
          {products && products.map(p => (
            <div key={p._id} className="list-group-item d-flex align-items-center">
              <div style={{width:120, height:80, background:'#f3f4f6', borderRadius:6, marginInline:12, display:'flex', alignItems:'center', justifyContent:'center'}}>صورة</div>
              <div className="flex-grow-1">
                <h6 className="mb-1">{p.Name}</h6>
                <div className="text-muted">{p.Category} · {p.Subcategory}</div>
                <div className="mt-2 d-flex justify-content-between align-items-center">
                  <div className="fw-bold">ج.م {p.Sell}</div>
                  <div>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>navigate(`/products/${p._id}`)}>عرض</button>
                    <button className="btn btn-sm btn-brand">أضف</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'compact' && (
        <div className="row g-2">
          {products && products.map(p => (
            <div key={p._id} className="col-6 col-sm-4 col-md-2">
              <div className="card p-2 text-center">
                <div style={{height:80, background:'#f3f4f6'}} className="mb-2 d-flex align-items-center justify-content-center">صورة</div>
                <div style={{fontSize:13}} className="text-truncate">{p.Name}</div>
                <div className="text-muted" style={{fontSize:12}}>ج.م {p.Sell}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Products;
