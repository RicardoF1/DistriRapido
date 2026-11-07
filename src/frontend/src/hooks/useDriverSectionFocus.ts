import { useEffect, useRef } from 'react';
import { revealDriverSection } from '../features/drivers/driver-sections';
import { useLocationHash } from './useLocationHash';

/** Desplaza y enfoca la sección del panel indicada por el hash cuando el contenido ya está listo. */
export function useDriverSectionFocus(ready: boolean) {
  const hash = useLocationHash();
  const revealedHash = useRef<string | null>(null);

  // La restauración automática de Atrás/Adelante deshacía el desplazamiento a la sección; se recupera al salir del panel.
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  // Al cargar con hash, o al cambiarlo con enlace, Atrás o Adelante, se desplaza y enfoca la sección una sola vez.
  useEffect(() => {
    if (!ready || revealedHash.current === hash) return;
    revealedHash.current = hash;
    revealDriverSection(hash);
  }, [hash, ready]);
}
