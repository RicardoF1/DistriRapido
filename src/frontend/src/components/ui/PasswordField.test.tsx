import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from './PasswordField';
function Input() { const [value, setValue] = useState(''); return <PasswordField value={value} onChange={setValue} />; }
it('permite introducir frases Unicode válidas de más de 128 unidades UTF16 sin truncarlas', async () => {
  const user = userEvent.setup(); render(<Input />); const input = screen.getByLabelText('Contraseña');
  await user.click(input); const phrase = '🚚'.repeat(65); await user.paste(phrase);
  expect(input).toHaveValue(phrase);
});
