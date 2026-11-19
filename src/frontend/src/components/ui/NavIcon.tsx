// Iconos de navegación en SVG en línea (sin librerías ni descargas, Green IT).
// Son decorativos: el nombre accesible lo aporta siempre el texto del enlace.
const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  plan: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a3 3 0 0 1 3-3h4m5 5v4a3 3 0 0 1-3 3h-4',
  tracking: 'M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  chart: 'M4 20h16M7 16v-5m5 5V7m5 9v-8',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v4h4m5-1v5l3 2',
  orderAdd: 'M12 11v6m-3-3h6M5 7h14l-1 13H6L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
  orders: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  drivers: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 9v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  truck: 'M3 6h11v10H3zm11 4h4l3 3v3h-7m-8 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  users: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6 6 18',
  dot: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
} as const;

export type NavIconName = keyof typeof PATHS;

export function NavIcon({ name, size = 20 }: Readonly<{ name: NavIconName; size?: number }>) {
  return <svg className="nav-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={PATHS[name]} /></svg>;
}
