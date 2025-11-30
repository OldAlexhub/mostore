import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import MiniCart from '../components/MiniCart';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatEGP } from '../utils/formatCurrency';
import getPrimaryImage from '../utils/getPrimaryImage';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const { add } = useCart();
  const { discount } = useStore();
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api.get(`/api/products/${encodeURIComponent(id)}`)
      .then(res => {
        if (!mounted) return;
        setProduct(res.data);
        setReviews(Array.isArray(res.data?.reviews) ? res.data.reviews : []);
        setActiveImageIndex(0);
      })
      .catch(() => { if (mounted) setError('تعذر تحميل المنتج'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!product || !product.Category) {
      setSimilarProducts([]);
      return;
    }
    let mounted = true;
    setSimilarLoading(true);
    const qs = new URLSearchParams();
    qs.set('Category', product.Category);
    qs.set('limit', '8');
    api.get(`/api/products?${qs.toString()}`)
      .then(res => {
        if (!mounted) return;
        const payload = Array.isArray(res.data?.products)
          ? res.data.products
          : Array.isArray(res.data) ? res.data : [];
        const filtered = payload.filter(p => p._id !== product._id).slice(0, 4);
        setSimilarProducts(filtered);
      })
      .catch(() => { if (mounted) setSimilarProducts([]); })
      .finally(() => { if (mounted) setSimilarLoading(false); });

    return () => { mounted = false; };
  }, [product]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const sources = [
      product.imageUrl,
      product.secondaryImageUrl,
      ...(Array.isArray(product.imageGallery) ? product.imageGallery : []),
      ...(Array.isArray(product.images) ? product.images : []),
      product.image,
      product.productDetails?.imageUrl
    ];
    const unique = [];
    const seen = new Set();
    sources.forEach((src) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      unique.push(src);
    });
    return unique.slice(0, 20);
  }, [product]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!product) return;
    setReviewSubmitting(true);
    setReviewError(null);
    api.post(`/api/products/${product._id}/reviews`, {
      customerName: reviewForm.name,
      rating: Number(reviewForm.rating),
      comment: reviewForm.comment
    })
      .then(res => {
        if (!res || !res.data) return;
        setReviews(prev => [res.data, ...prev]);
        setReviewForm({ name: '', rating: 5, comment: '' });
      })
      .catch(() => setReviewError('لم نتمكن من حفظ تقييمك، حاول مرة أخرى.'))
      .finally(() => setReviewSubmitting(false));
  };

  const renderStars = (value) => {
    const stars = [];
    for (let i = 1; i <= 5; i += 1) stars.push(<span key={i}>{i <= value ? '★' : '☆'}</span>);
    return stars;
  };

  const isGeneralDiscount = discount && discount.active && discount.type === 'general' && (discount.value || 0) > 0;
  const discountedPrice = isGeneralDiscount ? Math.max(0, (product?.Sell || 0) * (1 - discount.value / 100)) : product?.Sell;
  const availableQty = Number(product?.QTY ?? 0);
  const minQty = Number(product?.minQty ?? 0);
  const derivedStatus = availableQty <= 0
    ? 'out_of_stock'
    : (availableQty <= (minQty || 3) ? 'low_stock' : 'in_stock');
  const stockStatus = product?.stockStatus || derivedStatus;
  const statusLabel = stockStatus === 'out_of_stock' ? 'غير متوفر' : stockStatus === 'low_stock' ? 'كمية محدودة' : 'متوفر في المخزون';
  const statusClass = stockStatus === 'out_of_stock' ? 'bg-danger' : stockStatus === 'low_stock' ? 'bg-warning text-dark' : 'bg-success';
  const isOutOfStock = stockStatus === 'out_of_stock';

  const handleAddToCart = () => {
    if (!product) return;
    if (isOutOfStock) {
      if (toast && typeof toast.add === 'function') toast.add('هذا المنتج غير متوفر حالياً');
      return;
    }
    add(product, 1);
    if (toast && typeof toast.add === 'function') {
      toast.add(`${product.Name} اتضاف للسلة`);
    }
  };

  if (loading) return <div className="text-center py-4">جارٍ التحميل…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!product) return <div className="text-center text-muted py-4">لا يوجد منتج.</div>;

  const rawImg = gallery[activeImageIndex] || gallery[0] || product.imageUrl || '';
  const img = getPrimaryImage(rawImg, product);

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.Name || '',
    image: img ? [img] : undefined,
    sku: product.Number || product.number || product._id,
    description: product.Description || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EGP',
      availability: product.QTY > 0 ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock'
    }
  };

  return (
    <>
      <SEO title={product.Name} description={product.Description} image={img} jsonLd={jsonLd} canonical={typeof window !== 'undefined' ? window.location.href : undefined} />
      <main className="container py-4" dir="rtl">
        <div className="mb-3">
          <Link to="/products" className="text-decoration-none">&larr; عودة إلى قائمة المنتجات</Link>
        </div>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="row g-4">
              <div className="col-12 col-md-6 text-center">
                <div style={{ background: '#f7f7f7', padding: 20, borderRadius: 8, minHeight: 360 }} className="d-flex align-items-center justify-content-center">
                  {img ? <img src={img} alt={product.Name} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }} /> : <div className="text-muted">بدون صورة</div>}
                </div>
            {gallery.length > 1 && (
              <div className="d-flex justify-content-center gap-2 flex-wrap mt-3">
                {gallery.map((url, idx) => (
                  <button key={`${url}-${idx}`} type="button" className={`btn p-1 ${activeImageIndex === idx ? 'border border-primary' : 'border'}`} onClick={() => setActiveImageIndex(idx)} style={{ background: '#fff' }}>
                    <img src={getPrimaryImage(url, product)} alt={`عرض ${idx + 1}`} style={{ height: 80, width: 80, objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
              </div>
              <div className="col-12 col-md-6">
                <h1>{product.Name}</h1>
                <div className="mb-3 text-muted">{[product.Category, product.Subcategory].filter(Boolean).join(' • ')}</div>
                <div className="mb-2">
                  <span className={`badge ${statusClass}`} style={{ fontSize: 12 }}>{statusLabel}</span>
                  {stockStatus === 'low_stock' && <small className="text-warning ms-2">سارع قبل نفاد الكمية!</small>}
                </div>
                <div className="mb-3">
                  {isGeneralDiscount ? (
                    <div className="d-flex flex-column align-items-start gap-1">
                      <span className="text-muted" style={{ textDecoration: 'line-through' }}>{formatEGP(product.Sell)}</span>
                      <span className="fs-3 fw-bold text-success">{formatEGP(discountedPrice)}</span>
                      <small className="text-success">خصم {discount.value}% ساري حالياً</small>
                    </div>
                  ) : (
                    <span className="fs-3 fw-bold text-primary">{formatEGP(product.Sell)}</span>
                  )}
                </div>
                <div className="mb-3">
                  <button className="btn btn-brand btn-lg w-100" onClick={handleAddToCart} disabled={isOutOfStock}>
                    {isOutOfStock ? 'غير متوفر حالياً' : 'أضف إلى السلة'}
                  </button>
                </div>
                <div className="mb-3">{product.Description}</div>
                <ul className="list-unstyled small text-muted">
                  <li><strong>حالة المخزون:</strong> {statusLabel}</li>
                  <li><strong>الكمية المتاحة:</strong> {availableQty}</li>
                  {product.Material && <li><strong>الخامة:</strong> {product.Material}</li>}
                  {product.Season && <li><strong>الموسم:</strong> {product.Season}</li>}
                  {product.Style && <li><strong>الستايل:</strong> {product.Style}</li>}
                </ul>
              </div>
            </div>

            <section className="mt-5">
          <h3 className="mb-3">آراء العملاء</h3>
          {reviews.length === 0 && <p className="text-muted">كن أول من يشارك تجربته مع هذا المنتج.</p>}
          {reviews.map((rev, idx) => (
            <div key={`${rev.customerName}-${rev.createdAt}-${idx}`} className="border rounded p-3 mb-3 bg-light">
              <div className="d-flex justify-content-between flex-wrap">
                <strong>{rev.customerName}</strong>
                <small className="text-muted">{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}</small>
              </div>
              <div className="text-warning">{renderStars(rev.rating)}</div>
              {rev.comment && <p className="mb-0">{rev.comment}</p>}
            </div>
          ))}

          <div className="card p-3">
            <h5 className="mb-3">أضف تقييمك</h5>
            {reviewError && <div className="alert alert-danger py-2">{reviewError}</div>}
            <form onSubmit={handleSubmitReview}>
              <div className="mb-2">
                <label className="form-label">اسمك</label>
                <input className="form-control" value={reviewForm.name} onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))} placeholder="اسمك (اختياري)" />
              </div>
              <div className="mb-2">
                <label className="form-label">التقييم</label>
                <select className="form-select" value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                  {[5, 4, 3, 2, 1].map(val => <option key={val} value={val}>{val} / 5</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">تعليقك</label>
                <textarea className="form-control" rows={3} value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>{reviewSubmitting ? 'جارٍ الإرسال...' : 'إرسال التقييم'}</button>
            </form>
          </div>
        </section>

        <section className="mt-5">
          <h3 className="mb-3">منتجات مشابهة</h3>
          {similarLoading && <div className="text-muted">جارٍ تحميل المنتجات المشابهة...</div>}
          {!similarLoading && similarProducts.length === 0 && <div className="text-muted">لا يوجد منتجات مشابهة حالياً.</div>}
          <div className="row g-3">
            {similarProducts.map(item => (
              <div key={item._id} className="col-6 col-md-3">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </section>
          </div>
          <div className="col-12 col-lg-4">
            <div className="position-sticky" style={{ top: 90 }}>
              <MiniCart />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductDetail;
