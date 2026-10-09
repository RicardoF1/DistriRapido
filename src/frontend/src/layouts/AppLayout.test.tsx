import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../features/auth/auth-context';
import { loginResponse } from '../test/fixtures';
import { AppLayout } from './AppLayout';
import { vi } from 'vitest';
it.each(['Administrador', 'Operador / Técnico', 'Usuario Final / Conductor', 'Auditor Externo'])('navegación autorizada y borrador estable: %s', async role => {
  const session = { expiresAt: Date.now() + 900000, user: { ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role } } };
  render(<MemoryRouter><AuthContext.Provider value={{ session, acceptSession: vi.fn(), restoring: false, restoreError: '', retryRestore: vi.fn(), logout: vi.fn() }}><AppLayout title="Prueba"><input aria-label="Borrador" defaultValue="Conservar" /></AppLayout></AuthContext.Provider></MemoryRouter>);
  expect(screen.queryByRole('link', { name: 'Usuarios' }) !== null).toBe(role === 'Administrador');
  expect(screen.queryByRole('link', { name: 'Registrar pedido' }) !== null).toBe(['Administrador', 'Operador / Técnico'].includes(role));
  const draft = screen.getByLabelText('Borrador');
  await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
  await userEvent.keyboard('{Escape}');
  expect(screen.getByLabelText('Borrador')).toBe(draft);
  expect(draft).toHaveValue('Conservar');
  expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveFocus();
});
