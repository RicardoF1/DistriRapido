export const formatDateTime = (value: string | null) => value ? new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'Sin registro';
