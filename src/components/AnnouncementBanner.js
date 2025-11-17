import { useEffect, useState } from 'react';
import api from '../api';

const fetchAnnouncements = async () => {
  try {
    const res = await api.get('/api/announcements');
    const anns = Array.isArray(res.data) ? res.data : [];
    return anns;
  } catch {
    return [];
  }
};

const isActive = (ann) => {
  if (!ann || !ann.active) return false;
  const now = Date.now();
  if (ann.startsAt) {
    const s = new Date(ann.startsAt).getTime();
    if (Number.isNaN(s) || s > now) return false;
  }
  if (ann.endsAt) {
    const e = new Date(ann.endsAt).getTime();
    if (Number.isNaN(e) || e < now) return false;
  }
  return true;
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchAnnouncements();
      if (mounted) setAnnouncements(Array.isArray(data) ? data : []);
    };
    load();
    const timer = setInterval(load, 1000 * 60 * 5);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  const hideAnnouncement = (key) => {
    const next = new Set(dismissed);
    next.add(key);
    setDismissed(next);
    try { localStorage.setItem('dismissedAnnouncements', JSON.stringify(Array.from(next))); } catch { /* ignore */ }
  };

  const visibleAnnouncements = announcements.filter((ann) => {
    const key = ann._id || ann.text;
    return isActive(ann) && !dismissed.has(key);
  });

  if (!visibleAnnouncements.length) return null;

  return (
    <div style={{ background: '#111827', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }} dir="rtl">
      <div className="container py-2">
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
          {visibleAnnouncements.map((ann) => {
            const key = ann._id || ann.text;
            return (
              <div
                key={key}
                style={{
                  minWidth: 260,
                  background: 'linear-gradient(135deg,#fbbf24,#f97316)',
                  color: '#111827',
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                  position: 'relative',
                  scrollSnapAlign: 'center'
                }}
              >
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#92400e' }}>عرض حصري</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                  {ann.href ? (
                    <a href={ann.href} target="_blank" rel="noreferrer" style={{ color: '#111827', textDecoration: 'none' }}>{ann.text}</a>
                  ) : (
                    ann.text
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#78350f', marginTop: 6 }}>
                  {ann.startsAt ? `يبدأ: ${new Date(ann.startsAt).toLocaleString('ar-EG')}` : 'متاح الآن'}
                  {ann.endsAt ? <div>ينتهي: {new Date(ann.endsAt).toLocaleString('ar-EG')}</div> : null}
                </div>
                <button
                  className="btn btn-sm btn-link"
                  style={{ position: 'absolute', top: 6, left: 8, color: '#9a3412', textDecoration: 'none' }}
                  onClick={() => hideAnnouncement(key)}
                >
                  إخفاء
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
