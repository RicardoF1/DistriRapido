import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { isEmail } from 'class-validator';
import { ROLE_NAMES } from '../src/roles/roles';

async function bootstrapAdministrator() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !isEmail(email) || email.length > 255 || !password || password.length < 12 || password.length > 128) {
    throw new Error('Configura BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD (12–128 caracteres) en el entorno local.');
  }
  const prisma = new PrismaClient();
  try {
    const password_hash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.$transaction(async (tx) => {
      for (const nombre of Object.values(ROLE_NAMES)) {
        await tx.rol.upsert({ where: { nombre }, update: {}, create: { nombre, descripcion: `Rol de acceso: ${nombre}` } });
      }
      const rol = await tx.rol.findUniqueOrThrow({ where: { nombre: ROLE_NAMES.administrator } });
      const existing = await tx.usuario.findUnique({ where: { email } });
      if (existing) throw new Error('La cuenta ya existe; el bootstrap no modifica usuarios existentes.');
      await tx.usuario.create({ data: { email, password_hash, rol_id: rol.rol_id } });
    });
    console.info('Administrador de desarrollo creado. No se muestran credenciales.');
  } finally { await prisma.$disconnect(); }
}
bootstrapAdministrator().catch(() => {
  console.error('No se creó el administrador. Revisa las variables locales, la conexión y que la cuenta no exista.');
  process.exitCode = 1;
});
