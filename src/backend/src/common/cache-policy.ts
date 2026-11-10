// Green IT (área 7): políticas de caché HTTP de la API.
// Datos personales, operativos o de sesión: no se almacenan en ninguna caché.
export const NO_STORE = 'no-store';
// Catálogos de baja sensibilidad: solo caché privada del navegador y revalidación obligatoria con ETag.
// Express genera el ETag y responde 304 Not Modified sin reenviar el cuerpo si no cambió.
export const PRIVATE_REVALIDATE = 'private, no-cache';
