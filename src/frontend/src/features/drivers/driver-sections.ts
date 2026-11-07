export const DRIVER_SECTIONS = [
  { id: 'mi-cuenta', label: 'Mi cuenta' },
  { id: 'mi-jornada', label: 'Mi jornada' },
  { id: 'mis-rutas', label: 'Mis rutas' },
  { id: 'mis-entregas', label: 'Mis entregas' },
] as const;

const SECTION_IDS: ReadonlySet<string> = new Set(DRIVER_SECTIONS.map(section => section.id));

/** Desplaza y enfoca la sección del panel indicada por el hash; ignora hashes ajenos al panel. */
export function revealDriverSection(hash: string): boolean {
  const id = hash.replace(/^#/, '');
  if (!SECTION_IDS.has(id)) return false;
  const section = document.getElementById(id);
  if (!section) return false;
  section.scrollIntoView({ block: 'start' });
  section.focus({ preventScroll: true });
  return true;
}
