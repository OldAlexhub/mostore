import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import MiniCart from '../components/MiniCart';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatEGP } from '../utils/formatCurrency';

const csvToArray = (value) => (value ? value.toString().split(',').map(v => v.trim()).filter(Boolean) : []);

const buildFilterState = (search) => {
  const params = new URLSearchParams(search);
  const q = params.get('q') || '';
  const legacyCat = params.get('cat') || '';
  const sortParam = params.get('sort') || '';
  const pageParam = parseInt(params.get('page') || '1', 10);
  const limitParam = parseInt(params.get('limit') || '24', 10);

  const getFilterArray = (key) => {
    const repeated = params.getAll(key);
    if (repeated.length > 1) return repeated.filter(Boolean);
    const single = params.get(key);
    return csvToArray(single || '');
  };

  let categoryArr = getFilterArray('Category');
  if (!categoryArr.length && legacyCat) categoryArr = csvToArray(legacyCat);
  const subcategoryArr = getFilterArray('Subcategory');
  const materialArr = getFilterArray('Material');
  const seasonArr = getFilterArray('Season');
  const styleArr = getFilterArray('Style');

  return {
    q,
    sortParam,
    pageParam,
    limitParam,
    categoryArr,
    subcategoryArr,
    materialArr,
    seasonArr,
    styleArr
  };
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ categories: [], subcategories: [], materials: [], seasons: [], styles: [] });
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [, setLimit] = useState(parseInt(new URLSearchParams(location.search).get('limit') || '24', 10));
  const { add } = useCart();
  const toast = useToast();
  const { discount } = useStore();

  const filterState = useMemo(() => buildFilterState(location.search), [location.search]);
  const {
    q,
    sortParam,
    pageParam,
    limitParam,
    categoryArr,
    subcategoryArr,
    materialArr,
    seasonArr,
    styleArr
  } = filterState;

  const categoryKey = categoryArr.join('|');
  const subcategoryKey = subcategoryArr.join('|');
  const materialKey = materialArr.join('|');
  const seasonKey = seasonArr.join('|');
  const styleKey = styleArr.join('|');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    if (q) {
      api.get(`/api/products/search?q=${encodeURIComponent(q)}`)
        .then((res) => {
          if (!mounted) return;
          setProducts(res.data);
          setPages(0);
          setTotal(res.data?.length || 0);
        })
        .catch(() => { if (mounted) setError('معرفناش نحمّل نتايج البحث دلوقتي.'); })
        .finally(() => { if (mounted) setLoading(false); });
      return () => { mounted = false; };
    }

    let endpoint = '/api/products';
    const qs = new URLSearchParams();
    const map = {
      Category: categoryArr,
      Subcategory: subcategoryArr,
      Material: materialArr,
      Season: seasonArr,
      Style: styleArr
    };
    Object.entries(map).forEach(([key, arr]) => {
      if (!arr || !arr.length) return;
      qs.set(key, arr.join(','));
    });
    if (sortParam) qs.set('sort', sortParam);
    if (pageParam && limitParam) {
      qs.set('page', String(pageParam));
      qs.set('limit', String(limitParam));
    }
    const qsString = qs.toString();
    if (qsString) endpoint += `?${qsString}`;

    api.get(endpoint)
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res.data?.products)) {
          setProducts(res.data.products);
          setTotal(res.data.total || 0);
          setPages(res.data.pages || 0);
          setLimit(res.data.limit || limitParam);
        } else if (Array.isArray(res.data)) {
          setProducts(res.data);
          setTotal(res.data.length);
          setPages(0);
        } else {
          setProducts([]);
          setTotal(0);
          setPages(0);
        }
      })
      .catch(() => { if (mounted) setError('في مشكلة بسيطة واحنا بنحمّل المنتجات.'); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [q, categoryKey, subcategoryKey, materialKey, seasonKey, styleKey, sortParam, pageParam, limitParam, categoryArr, subcategoryArr, materialArr, seasonArr, styleArr]);

  useEffect(() => {
    let mounted = true;
    api.get('/api/products/filters')
      .then((res) => { if (mounted) setFilterOptions(res.data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const updateQuery = (key, value) => {
    const next = new URLSearchParams(location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'Category') next.delete('cat');
    if (key !== 'page') next.delete('page');
    navigate(`/products?${next.toString()}`);
  };

  const getCurrentSelection = (key) => {
    const searchParams = new URLSearchParams(location.search);
    const repeated = searchParams.getAll(key).filter(Boolean);
    if (repeated.length > 1) return repeated;
    const single = searchParams.get(key);
    return csvToArray(single || '');
  };

  const updateQueryArray = (key, values = []) => {
    const next = new URLSearchParams(location.search);
    if (key === 'Category') next.delete('cat');
    next.delete('page');
    if (!values.length) {
      next.delete(key);
    } else {
      next.set(key, values.join(','));
    }
    navigate(`/products?${next.toString()}`);
  };

  const toggleFilterValue = (key, value) => {
    const current = getCurrentSelection(key);
    const exists = current.includes(value);
    const next = exists ? current.filter(v => v !== value) : [...current, value];
    updateQueryArray(key, next);
  };

  const clearFilterGroup = (key) => {
    updateQueryArray(key, []);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams(location.search);
    ['Category', 'Subcategory', 'Material', 'Season', 'Style', 'cat'].forEach(field => next.delete(field));
    next.delete('page');
    navigate(`/products?${next.toString()}`);
  };

  const hasGeneralDiscount = discount && discount.active && discount.type === 'general' && discount.value > 0;
  const getPriceMeta = (product) => {
    if (!hasGeneralDiscount) return { original: product.Sell, current: product.Sell, discounted: false };
    const current = Math.max(0, (product.Sell || 0) * (1 - discount.value / 100));
    return { original: product.Sell, current, discounted: true };
  };

  const quickAdd = (product) => {
    add(product, 1);
    if (toast && typeof toast.add === 'function') {
      toast.add(`${product.Name} اتضاف للسلة`);
    }
  };

  const formatArabicNumber = (value) => {
    if (typeof value === 'number') return value.toLocaleString('ar-EG');
    if (!value) return '٠';
    return value;
  };

  const selectedFilters = {
    Category: categoryArr,
    Subcategory: subcategoryArr,
    Material: materialArr,
    Season: seasonArr,
    Style: styleArr
  };

  const filterGroups = [
    { key: 'Category', label: 'الأقسام', options: filterOptions.categories },
    { key: 'Subcategory', label: 'التصنيفات الفرعية', options: filterOptions.subcategories },
    { key: 'Material', label: 'الخامات', options: filterOptions.materials },
    { key: 'Season', label: 'الموسم', options: filterOptions.seasons },
    { key: 'Style', label: 'الستايل', options: filterOptions.styles }
  ];

  const activeFilters = filterGroups.flatMap(group => {
    const values = selectedFilters[group.key] || [];
    return values.map(value => ({ key: group.key, label: group.label, value }));
  });

  const hasActiveFilters = activeFilters.length > 0;

  const removeFilterChip = (key, value) => {
    const current = getCurrentSelection(key);
    const next = current.filter(v => v !== value);
    updateQueryArray(key, next);
  };

  // removed unused helpers (scrollProductList, heroHighlights, quickCategoryPills)
  const featureBadges = ['شحن لكل المحافظات', 'استرجاع خلال ١٤ يوم', 'دفع عند الاستلام'];
  const viewOptions = [
    { id: 'grid', label: 'شبكي', caption: 'نظرة سريعة' },
    { id: 'list', label: 'تفاصيل', caption: 'وصف وسعر' },
    { id: 'compact', label: 'مكثف', caption: 'أكبر عدد' }
  ];

  const showingCount = formatArabicNumber(products.length);
  const totalCount = formatArabicNumber(total || products.length);
  const summaryLabel = q ? `نتايج عن "${q}"` : 'كل القطع المتاحة دلوقتي';

  // JSON-LD product list (first N items) for better SEO when crawled
  const buildProductsJsonLd = (items = []) => {
    const products = (items || []).slice(0, 10).map(p => ({
      '@type': 'Product',
      name: p.Name || '',
      image: p.imageUrl || p.image || (p.images && p.images[0]) || p.productDetails?.imageUrl || undefined,
      sku: p.Number || p.number || p._id || undefined,
      offers: p.Sell ? { '@type': 'Offer', priceCurrency: 'EGP', price: String(p.Sell), availability: 'http://schema.org/InStock' } : undefined
    }));
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.map((prod, i) => ({ '@type': 'ListItem', position: i + 1, item: prod }))
    };
  };

  return (
    <>
      <SEO
        title={q ? `نتايج البحث: ${q}` : 'المنتجات'}
        description={`تصفّح ${total || products.length} من منتجات M&O Store. فلتر بحث متقدم، شحن لكل المحافظات، واسترجاع خلال ١٤ يوم.`}
        canonical={typeof window !== 'undefined' ? window.location.href : undefined}
        jsonLd={buildProductsJsonLd(products)}
      />
      <main className="container py-4 products-page" dir="rtl">

      <div className="products-toolbar card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-3 align-items-center">
            <div>
              <p className="text-muted small mb-1">{summaryLabel}</p>
              <h4 className="mb-0">بنوريك {showingCount} من {totalCount} قطعة</h4>
            </div>
            <div className="ms-auto d-flex flex-wrap gap-2 align-items-center">
                <button className="btn btn-outline-secondary d-xl-none btn-sm me-2" onClick={() => setShowFilters(s => !s)}>{showFilters ? 'إخفاء الفلاتر' : 'الفلاتر'}</button>
                <select className="form-select form-select-sm" style={{ width: 180 }} value={sortParam} onChange={e => updateQuery('sort', e.target.value)}>
                <option value="">رتب حسب المميز</option>
                <option value="Sell_asc">السعر من الأرخص للأغلى</option>
                <option value="Sell_desc">السعر من الأغلى للأرخص</option>
              </select>
              <div className="btn-group" role="group" aria-label="تغيير العرض">
                {viewOptions.map(option => (
                  <button
                    key={option.id}
                    className={`btn btn-sm view-toggle ${view === option.id ? 'btn-brand' : 'btn-outline-secondary'}`}
                    onClick={() => setView(option.id)}
                  >
                    <div className="fw-semibold">{option.label}</div>
                    <small className="text-muted">{option.caption}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-3">
            {featureBadges.map(feature => (
              <span key={feature} className="toolbar-feature badge rounded-pill">{feature}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-4 align-items-start">
        <aside className="col-12 col-xl-3 order-2 order-xl-2 d-none d-xl-block">
          <div className="products-filters card border-0 shadow-sm mb-4" style={{ position: 'sticky', top: 24 }}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <p className="text-muted small mb-0">فلترة سريعة</p>
                  <h5 className="mb-0">حدد اللي في دماغك</h5>
                </div>
                <button className="btn btn-link btn-sm text-decoration-none" disabled={!hasActiveFilters} onClick={clearAllFilters}>
                  امسح الكل
                </button>
              </div>
              {filterGroups.map(group => (
                <details key={group.key} className="filter-block" open={(selectedFilters[group.key] || []).length > 0 || group.key === 'Category'}>
                  <summary>
                    <div>
                      <span className="fw-semibold d-block">{group.label}</span>
                      <small className="text-muted">{formatArabicNumber((selectedFilters[group.key] || []).length)} مختارين</small>
                    </div>
                    <span className="chevron" aria-hidden="true">▾</span>
                  </summary>
                  <div className="filter-options">
                    {(group.options || []).length === 0 && (
                      <div className="text-muted small">بنحمّل الاختيارات...</div>
                    )}
                    {group.options && group.options.filter(Boolean).map(option => (
                      <label key={option} className="form-check d-flex align-items-center gap-2 products-filter-option">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={(selectedFilters[group.key] || []).includes(option)}
                          onChange={() => toggleFilterValue(group.key, option)}
                        />
                        <span className="form-check-label flex-grow-1">{option}</span>
                      </label>
                    ))}
                    {(selectedFilters[group.key] || []).length > 0 && (
                      <button className="btn btn-link btn-sm text-muted mt-2 p-0" onClick={() => clearFilterGroup(group.key)}>
                        امسح {group.label}
                      </button>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
          
        </aside>

        <section className="col-12 col-xl-9 order-1 order-xl-1">
          <div className="d-flex">
            <div className="mini-cart-left-wrapper d-none d-xl-block me-3" style={{ width: 260, position: 'sticky', top: 24 }}>
              <MiniCart />
            </div>
            <div className="flex-grow-1 products-main">
          {/* Mobile-only filters panel (shows above products) */}
          {showFilters && (
            <div className="card mb-3 d-xl-none">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="mb-0">فلاتر</h6>
                  <button className="btn btn-link" onClick={() => setShowFilters(false)}>إغلاق</button>
                </div>
                {filterGroups.map(group => (
                  <details key={`m-${group.key}`} className="filter-block" open={(selectedFilters[group.key] || []).length > 0 || group.key === 'Category'}>
                    <summary>
                      <div>
                        <span className="fw-semibold d-block">{group.label}</span>
                        <small className="text-muted">{formatArabicNumber((selectedFilters[group.key] || []).length)} مختارين</small>
                      </div>
                      <span className="chevron" aria-hidden="true">▾</span>
                    </summary>
                    <div className="filter-options">
                      {(group.options || []).length === 0 && (
                        <div className="text-muted small">بنحمّل الاختيارات...</div>
                      )}
                      {group.options && group.options.filter(Boolean).map(option => (
                        <label key={option} className="form-check d-flex align-items-center gap-2 products-filter-option">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={(selectedFilters[group.key] || []).includes(option)}
                            onChange={() => toggleFilterValue(group.key, option)}
                          />
                          <span className="form-check-label flex-grow-1">{option}</span>
                        </label>
                      ))}
                      {(selectedFilters[group.key] || []).length > 0 && (
                        <button className="btn btn-link btn-sm text-muted mt-2 p-0" onClick={() => clearFilterGroup(group.key)}>
                          امسح {group.label}
                        </button>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
          {hasActiveFilters && (
            <div className="active-filters d-flex flex-wrap gap-2 mb-3">
              {activeFilters.map(({ key, value }) => (
                <span key={`${key}-${value}`} className="badge rounded-pill bg-light text-dark d-flex align-items-center gap-2">
                  <span>{value}</span>
                  <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={() => removeFilterChip(key, value)} type="button" aria-label={`إزالة ${value}`}>
                    ✕
                  </button>
                </span>
              ))}
              <button className="btn btn-sm btn-outline-secondary" onClick={clearAllFilters}>امسح كل الفلاتر</button>
            </div>
          )}

          {loading && <div className="text-center py-5">ثانية بنرتب الرفوف...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !products.length && !error && (
            <div className="text-center text-muted py-5">
              <h5>ولا قطعة مطابقة دلوقتي</h5>
              <p className="mb-3">غيّر الفلاتر أو امسحها وشوف اقتراحات أكتر.</p>
              <button className="btn btn-brand-outline btn-sm" onClick={clearAllFilters}>رجّع الفلاتر للوضع العادي</button>
            </div>
          )}

          {view === 'grid' && products.length > 0 && (
            <div className="row g-3">
              {products.map(product => (
                <div key={product._id} className="col-6 col-md-4 col-lg-3">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {view === 'list' && products.length > 0 && (
            <div className="list-group shadow-sm">
              {products.map(product => {
                const priceMeta = getPriceMeta(product);
                return (
                  <div key={product._id} className="list-group-item py-4">
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                      <div className="products-list-thumb bg-light rounded flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 96, height: 96 }}>
                        {(() => {
                          const img = product.imageUrl || product.image || product.images?.[0] || product.productDetails?.imageUrl || '';
                          return img ? <img src={img} alt={product.Name || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ fontSize: 11, color: '#999' }}>بدون صورة</div>;
                        })()}
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="mb-1">{product.Name}</h5>
                        <div className="text-muted">{[product.Category, product.Subcategory].filter(Boolean).join(' • ')}</div>
                      </div>
                      <div className="text-end ms-auto">
                        <div className="fw-bold">
                          {priceMeta.discounted ? (
                            <>
                              <del className="text-muted me-2">{formatEGP(priceMeta.original)}</del>
                              <span className="text-success">{formatEGP(priceMeta.current)}</span>
                            </>
                          ) : formatEGP(priceMeta.current)}
                        </div>
                        <button className="btn btn-sm btn-brand mt-2" onClick={() => quickAdd(product)}>إضافة سريعة</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'compact' && products.length > 0 && (
            <div className="row g-2">
              {products.map(product => (
                <div key={product._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <div className="card p-2 text-center h-100">
                      <div className="products-compact-thumb bg-light mb-2 d-flex align-items-center justify-content-center rounded" style={{ height: 72 }}>
                        {(() => {
                          const img = product.imageUrl || product.image || product.images?.[0] || product.productDetails?.imageUrl || '';
                          return img ? <img src={img} alt={product.Name || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ fontSize: 11, color: '#999' }}>بدون صورة</div>;
                        })()}
                      </div>
                    <div className="text-truncate fw-semibold" style={{ fontSize: 13 }}>{product.Name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{formatEGP(product.Sell)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pages > 0 && (
            <nav className="d-flex justify-content-center mt-4" aria-label="التصفح">
              <ul className="pagination">
                <li className={`page-item ${pageParam <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => updateQuery('page', Math.max(1, pageParam - 1))}>السابق</button>
                </li>
                {Array.from({ length: pages }).map((_, index) => {
                  const page = index + 1;
                  if (pages > 10 && Math.abs(page - pageParam) > 4 && page !== 1 && page !== pages) return null;
                  return (
                    <li key={page} className={`page-item ${page === pageParam ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => updateQuery('page', page)}>{page}</button>
                    </li>
                  );
                })}
                <li className={`page-item ${pageParam >= pages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => updateQuery('page', Math.min(pages, pageParam + 1))}>التالي</button>
                </li>
              </ul>
            </nav>
          )}
            </div>
          </div>
        </section>
      </div>
    </main>
    </>
  );
};

export default Products;

