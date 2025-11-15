import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let idCounter = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // add(message, options) where options may include: ms, type, undoLabel, undo (callback)
  const add = useCallback((message, opts = {}) => {
    let options = {};
    if (typeof opts === 'number') options.ms = opts;
    else options = opts || {};
    const { ms = 2500, type = 'success', undo, undoLabel } = options;
    const id = idCounter++;
    const expiry = ms > 0 ? Date.now() + ms : null;
    setToasts(t => [...t, { id, message, type, undo, undoLabel, ms, expiry }]);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  // global timer to update progress bars
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(h);
  }, []);

  // auto-remove expired toasts whenever time advances
  useEffect(() => {
    if (!toasts || toasts.length === 0) return;
    const expired = toasts.filter(t => t.expiry && t.expiry <= now).map(t => t.id);
    if (expired.length) {
      // remove each expired toast
      expired.forEach(id => remove(id));
    }
  }, [toasts, now, remove]);

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div aria-live="polite" aria-atomic="true" style={{position:'fixed', top:20, right:20, pointerEvents:'none', display:'flex', flexDirection:'column', gap:8, zIndex: 1060}}>
        {toasts.map(t => {
          const bgClass = t.type === 'success' ? 'bg-success' : t.type === 'danger' ? 'bg-danger' : 'bg-info';
          const remaining = t.expiry ? Math.max(0, t.expiry - now) : 0;
          const pct = t.ms ? Math.max(0, (remaining / t.ms) * 100) : 0;
          const Icon = () => {
            if (t.type === 'success') return (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.97 10.97l5-5-.707-.707-4.293 4.293L4.707 8.293 4 9l2.97 1.97z"/>
              </svg>
            );
            if (t.type === 'danger') return (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.938 2.016a.13.13 0 0 1 .125 0l6.857 3.99c.11.064.11.243 0 .307L8.063 10.31a.13.13 0 0 1-.125 0L1.08 6.32a.176.176 0 0 1 0-.307l6.857-3.997zM8 5.5a.5.5 0 0 0-.5.5v2.5a.5.5 0 0 0 1 0V6a.5.5 0 0 0-.5-.5zM7.002 11a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/>
              </svg>
            );
            return (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 .945-.252 1.11-.598l.088-.416c.07-.34.22-.412.485-.412h.002c.264 0 .414.073.485.412l.088.416c.165.346.565.598 1.109.598.703 0 1.002-.422.808-1.319l-.738-3.468c-.064-.293-.006-.399.288-.469l.45-.083-.082-.38-2.29-.287z"/>
              </svg>
            );
          };
          return (
            <div key={t.id} className={`toast show align-items-center text-white ${bgClass} border-0`} role="status" aria-live="polite" aria-atomic="true" style={{minWidth:240, pointerEvents:'auto'}}>
              <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
                <div className="d-flex align-items-center" style={{padding:'0.5rem 0.75rem'}}>
                  <div style={{marginRight:8}}><Icon /></div>
                  <div style={{flex:1, minWidth:120}}>{t.message}</div>
                  <div style={{display:'flex', gap:8, marginLeft:12}}>
                    {t.undo && (
                      <button className="btn btn-sm btn-link text-white" onClick={() => { try{ t.undo(); }catch{} remove(t.id); }}>
                        {t.undoLabel || 'تراجع'}
                      </button>
                    )}
                    <button className="btn btn-sm btn-link text-white" onClick={() => remove(t.id)}>×</button>
                  </div>
                </div>
                {t.ms > 0 && (
                  <div style={{height:4, background:'rgba(255,255,255,0.15)', overflow:'hidden'}}>
                    <div style={{height:4, background:'rgba(255,255,255,0.7)', transformOrigin:'left center', transform:`scaleX(${pct/100})`, transition:'transform 140ms linear'}} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
