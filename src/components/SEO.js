import { useEffect } from 'react';

const DEFAULT_DESCRIPTION = 'MO Store - تسوّق ملابس واحتياجاتك بسهولة مع شحن لكل المحافظات وسياسة استرجاع مرنة.';
const DEFAULT_TITLE = 'MO Store';

function ensureMeta(attrName, attrValue, content) {
  if (!content) return null;
  const selector = `meta[${attrName}="${attrValue}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return el;
}

const SEO = ({ title, description, canonical, image, jsonLd, noindex = false }) => {
  useEffect(() => {
    const finalTitle = title ? `${title} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    const prevTitle = document.title;
    document.title = finalTitle;

    const viewport = ensureMeta('name', 'viewport', 'width=device-width, initial-scale=1');
    const desc = ensureMeta('name', 'description', description || DEFAULT_DESCRIPTION);
    const ogTitle = ensureMeta('property', 'og:title', finalTitle);
    const ogDesc = ensureMeta('property', 'og:description', description || DEFAULT_DESCRIPTION);
    const ogType = ensureMeta('property', 'og:type', 'website');
    const ogImage = image ? ensureMeta('property', 'og:image', image) : null;
    const twitter = ensureMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    const robots = noindex ? ensureMeta('name', 'robots', 'noindex,nofollow') : null;

    // canonical link
    let canonicalEl = null;
    if (canonical) {
      canonicalEl = document.head.querySelector('link[rel="canonical"]');
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonical);
    }

    // JSON-LD
    let jsonEl = null;
    if (jsonLd) {
      jsonEl = document.createElement('script');
      jsonEl.type = 'application/ld+json';
      jsonEl.id = 'seo-json-ld';
      jsonEl.text = JSON.stringify(jsonLd);
      document.head.appendChild(jsonEl);
    }

    return () => {
      // revert title
      document.title = prevTitle;
      // cleanup JSON-LD and canonical if we added them
      if (jsonEl && jsonEl.parentNode) jsonEl.parentNode.removeChild(jsonEl);
      if (canonical && canonicalEl && canonicalEl.parentNode) canonicalEl.parentNode.removeChild(canonicalEl);
      // Don't remove global meta tags (viewport) to avoid breaking other parts; only clear ones we set explicitly
      if (robots && robots.parentNode) robots.parentNode.removeChild(robots);
      if (ogImage && ogImage.parentNode) ogImage.parentNode.removeChild(ogImage);
      // Note: leaving description/og:title to be overwritten by next mount; removing them could be noisy
    };
  }, [title, description, canonical, image, jsonLd, noindex]);

  return null;
};

export default SEO;
