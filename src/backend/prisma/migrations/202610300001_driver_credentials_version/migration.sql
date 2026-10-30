-- Independent additive credential revocation. Does not change password hashes or links.
ALTER TABLE "usuarios" ADD COLUMN "credentials_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_credentials_version_nonnegative" CHECK ("credentials_version" >= 0);
