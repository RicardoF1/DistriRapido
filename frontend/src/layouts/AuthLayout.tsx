import type { ReactNode } from 'react';
import { BrandLogo } from '../components/BrandLogo';
export function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="auth-layout" id="main-content">
    <header className="brand-header">
      <BrandLogo />
      <h1>EcoRuta Huancayo</h1>
      <p>Plataforma de gestión logística<br />de última milla</p>
      <span className="location-badge"><span aria-hidden="true" />Huancayo · Valle del Mantaro</span>
    </header>
    <section className="auth-card" aria-labelledby="login-title">{children}</section>
    <footer className="auth-footer">Huancayo GreenRoute Logistics</footer>
  </main>;
}
