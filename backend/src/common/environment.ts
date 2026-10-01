export function jwtLifetime(value: string): number {
  const match = /^(\d+)(s|m|h)?$/.exec(value);
  if (!match) throw new Error('JWT_EXPIRES_IN debe expresarse en segundos, minutos o horas.');
  const seconds = Number(match[1]) * (match[2] === 'h' ? 3600 : match[2] === 'm' ? 60 : 1);
  if (seconds < 60 || seconds > 86400) throw new Error('JWT_EXPIRES_IN debe estar entre 60 segundos y 24 horas.');
  return seconds;
}

export function validateEnvironment(env: Record<string, unknown>) {
  const secret = String(env.JWT_SECRET ?? '');
  if (secret.length < 32 || /replace|cambiar|placeholder/i.test(secret)) {
    throw new Error('Configura JWT_SECRET con un valor aleatorio de al menos 32 caracteres.');
  }
  const database = String(env.DATABASE_URL ?? '');
  if (!database.startsWith('postgresql://') && !database.startsWith('postgres://')) {
    throw new Error('DATABASE_URL debe apuntar a PostgreSQL.');
  }
  const origin = String(env.FRONTEND_ORIGIN ?? 'http://localhost:5173');
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
    throw new Error('FRONTEND_ORIGIN debe ser un origen HTTP/HTTPS exacto, sin ruta.');
  }
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválido.');
  const expiresIn = jwtLifetime(String(env.JWT_EXPIRES_IN ?? '15m'));
  return { ...env, JWT_SECRET: secret, JWT_EXPIRES_SECONDS: expiresIn, FRONTEND_ORIGIN: origin, PORT: port };
}
