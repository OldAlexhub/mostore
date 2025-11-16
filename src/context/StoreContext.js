import { createContext, useContext, useEffect, useState } from 'react';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [storeConfig, setStoreConfig] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/store/discount');
        if (!mounted) return;
        if (!res.ok) { setStoreConfig(null); return; }
        const data = await res.json();
        setStoreConfig(data);
      } catch {
        if (mounted) setStoreConfig(null);
      }
    };
    load();
    const interval = setInterval(load, 1000 * 60 * 10);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <StoreContext.Provider value={{
      discount: storeConfig,
      shipping: storeConfig?.shipping || { enabled: false, amount: 0 }
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

export default StoreContext;
