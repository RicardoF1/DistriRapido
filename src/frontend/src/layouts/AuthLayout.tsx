import type { ReactNode } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import avif640 from '../assets/login/login-landscape-640.avif';
import avif1024 from '../assets/login/login-landscape-1024.avif';
import avif1672 from '../assets/login/login-landscape-1672.avif';
import webp640 from '../assets/login/login-landscape-640.webp';
import webp1024 from '../assets/login/login-landscape-1024.webp';
import webp1672 from '../assets/login/login-landscape-1672.webp';
import jpg1672 from '../assets/login/login-landscape-1672.jpg';

// Green IT (área 3): paisaje decorativo en AVIF/WebP adaptativos con JPEG de respaldo,
// en lugar del PNG de 1,9 MB que se descargaba como fondo CSS.
export const LOGIN_LANDSCAPE = {
  avif: `${avif640} 640w, ${avif1024} 1024w, ${avif1672} 1672w`,
  webp: `${webp640} 640w, ${webp1024} 1024w, ${webp1672} 1672w`,
  fallback: jpg1672,
};

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="login-background">
    <picture className="login-backdrop" aria-hidden="true">
      <source type="image/avif" srcSet={LOGIN_LANDSCAPE.avif} sizes="100vw" />
      <source type="image/webp" srcSet={LOGIN_LANDSCAPE.webp} sizes="100vw" />
      <img src={LOGIN_LANDSCAPE.fallback} alt="" width={1672} height={941} decoding="async" fetchPriority="high" />
    </picture>
    <main className="auth-layout" id="main-content">
      <header className="brand-header">
        <BrandLogo />
        <h1>EcoRuta Huancayo</h1>
        <p>Plataforma de gestión logística<br />de última milla</p>
        <span className="location-badge"><span aria-hidden="true" />Huancayo · Valle del Mantaro</span>
      </header>
      <section className="auth-card" aria-labelledby="login-title">{children}</section>
      <footer className="auth-footer">Huancayo GreenRoute Logistics</footer>
    </main>
  </div>;
}
