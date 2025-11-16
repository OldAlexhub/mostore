import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import SEO from '../components/SEO';
import { formatEGP } from '../utils/formatCurrency';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/api/products/${encodeURIComponent(id)}`)
      .then(res => {
        if (!mounted) return;
        setProduct(res.data);
      })
      .catch(() => { if (mounted) setError('تعذر تحميل المنتج'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="text-center py-4">جارٍ التحميل…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!product) return <div className="text-center text-muted py-4">لا يوجد منتج.</div>;

  const img = product.imageUrl || product.image || product.images?.[0] || product.productDetails?.imageUrl || '';

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
      price: product.Sell != null ? String(product.Sell) : undefined,
      availability: product.QTY > 0 ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock'
    }
  };

  return (
    <>
      <SEO title={product.Name} description={product.Description} image={img} jsonLd={jsonLd} canonical={typeof window !== 'undefined' ? window.location.href : undefined} />
      <main className="container py-4" dir="rtl">
        <div className="row g-4">
          <div className="col-12 col-md-6 text-center">
            <div style={{ background:'#f7f7f7', padding:20, borderRadius:8 }}>
              {img ? <img src={img} alt={product.Name} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }} /> : <div className="text-muted">بدون صورة</div>}
            </div>
          </div>
          <div className="col-12 col-md-6">
            <h1>{product.Name}</h1>
            <div className="mb-3 text-muted">{[product.Category, product.Subcategory].filter(Boolean).join(' • ')}</div>
            <div className="mb-3" style={{ fontSize: 20, fontWeight: 700 }}>{formatEGP(product.Sell)}</div>
            <div className="mb-3">{product.Description}</div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductDetail;
