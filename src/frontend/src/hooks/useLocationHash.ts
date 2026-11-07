import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const documentHash = () => window.location.hash;

/** Hash real del documento: los enlaces de ancla nativos, Atrás y Adelante lo cambian sin pasar por el router. */
export function useLocationHash() {
  const location = useLocation();
  const [hash, setHash] = useState(documentHash);
  useEffect(() => { setHash(documentHash()); }, [location]);
  useEffect(() => {
    const update = () => setHash(documentHash());
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => { window.removeEventListener('hashchange', update); window.removeEventListener('popstate', update); };
  }, []);
  return hash;
}
