import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DeliveryMap } from './DeliveryMap';
import { OrderForm } from './OrderForm';
vi.mock('../../services/coverage', async () => ({ ...await vi.importActual<typeof import('../../services/coverage')>('../../services/coverage'), loadCoverage: vi.fn().mockRejectedValue(new Error('archivo corrupto')) }));
it('fallo de carga bloquea teclado/clic y envío del formulario', async () => {
  const onChange = vi.fn(); const onSave = vi.fn();
  render(<><DeliveryMap disabled={false} onChange={onChange} /><OrderForm onSave={onSave} /></>);
  await waitFor(() => expect(screen.getAllByText(/No se pudo cargar o verificar la cobertura/)).toHaveLength(2));
  for (const map of screen.getAllByRole('region', { name: 'Mapa de ubicación de entrega' })) {
    fireEvent.click(map); fireEvent.keyDown(map, { key: 'Enter' });
    expect(map).toHaveAttribute('aria-disabled', 'true');
  }
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole('form', { name: 'Registrar pedido' }));
  expect(onSave).not.toHaveBeenCalled();
});
