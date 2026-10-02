import type { RoleOption } from '../../types/users';
export function RoleSelect({ roles, value, onChange, error }: { roles: RoleOption[]; value: string; onChange: (value: string) => void; error?: string }) {
  return <div className="form-field"><label htmlFor="user-role">Rol</label><select id="user-role" value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'role-error' : undefined}>
    <option value="">Selecciona un rol</option>{roles.map((role) => <option key={role.rol_id} value={role.rol_id}>{role.nombre}</option>)}
  </select>{error && <p className="field-error" id="role-error">{error}</p>}</div>;
}
