import { useEffect, useState } from 'react';

const fetchAnnouncement = async () => {
  try {
    const res = await fetch('/api/announcements', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
};

const isActive = (ann) => {
  if (!ann) return false;
  if (!ann.active) return false;
  const now = Date.now();
  if (ann.startsAt) {
    const s = new Date(ann.startsAt).getTime();
    if (isNaN(s) || s > now) return false;
  }
  if (ann.endsAt) {
    const e = new Date(ann.endsAt).getTime();
    if (isNaN(e) || e < now) return false;
  }
  return true;
};

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchAnnouncement();
      if (!mounted) return;
      if (!data) { setAnnouncement(null); return; }
      // backend may return an array or single object
      const ann = Array.isArray(data) ? (data[0] || null) : data;
      setAnnouncement(ann);
    };
    load();
    // refresh every 5 minutes
    const t = setInterval(load, 1000 * 60 * 5);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  if (!announcement || !visible) return null;
  if (!isActive(announcement)) return null;

  return (
    <div style={{background:'#fff8e1', borderBottom:'1px solid #f0e6b8'}}>
      <div className="container d-flex align-items-center py-2" style={{gap:12}}>
        <div style={{flex:1}}>
          {announcement.href ? (
            <a href={announcement.href} target="_blank" rel="noreferrer" style={{textDecoration:'none', color:'#333', fontWeight:700}}>{announcement.text}</a>
          ) : (
            <div style={{fontWeight:700, color:'#333'}}>{announcement.text}</div>
          )}
          <div style={{fontSize:12, color:'#666'}}>
            {announcement.startsAt ? `Starts: ${new Date(announcement.startsAt).toLocaleString()} ` : ''}
            {announcement.endsAt ? ` · Ends: ${new Date(announcement.endsAt).toLocaleString()}` : ''}
          </div>
        </div>
        <div>
          <button className="btn btn-sm btn-outline-secondary" onClick={()=>setVisible(false)}>Dismiss</button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
