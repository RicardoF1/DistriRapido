import type { ButtonHTMLAttributes } from 'react';
export function LoadingButton({ loading, loadingLabel = 'Validando acceso…', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean; loadingLabel?: string }) {
  return <button {...props} className="button button-primary" disabled={loading || props.disabled} aria-busy={loading}>
    {loading ? <><span className="spinner" aria-hidden="true" />{loadingLabel}</> : children}
  </button>;
}
