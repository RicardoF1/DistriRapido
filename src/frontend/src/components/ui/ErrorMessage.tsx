import { useEffect, useRef } from 'react';
export function ErrorMessage({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, [message]);
  return <div className="error-message" role="alert" tabIndex={-1} ref={ref}>{message}</div>;
}
