import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { driversApi } from '../../services/drivers-api';
import type { Driver } from '../../types/drivers';
import type {
  AvailabilityRecord,
  AvailabilityValues,
} from '../../types/availability';

function toLocalInput(value?: string): string {
  if (!value) return '';

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(
    date.getTime() - offset * 60_000,
  );

  return local.toISOString().slice(0, 16);
}

function initialValues(
  initial?: AvailabilityRecord,
): AvailabilityValues {
  return {
    conductor_id: initial?.conductor_id ?? '',
    inicio: toLocalInput(initial?.inicio),
    fin: toLocalInput(initial?.fin),
    estado: initial?.estado ?? 'DISPONIBLE',
  };
}

export function AvailabilityForm({
  initial,
  onSave,
}: {
  initial?: AvailabilityRecord;
  onSave: (
    values: AvailabilityValues,
  ) => Promise<unknown>;
}) {
  const [values, setValues] = useState(
    initialValues(initial),
  );
  const [drivers, setDrivers] = useState<Driver[]>(
    [],
  );
  const [loadingDrivers, setLoadingDrivers] =
    useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    driversApi
      .list(
        1,
        '',
        'ACTIVO',
        controller.signal,
      )
      .then((response) => {
        setDrivers(response.items);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'No se pudieron cargar los conductores.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingDrivers(false);
        }
      });

    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (
      !values.conductor_id ||
      !values.inicio ||
      !values.fin
    ) {
      setError(
        'Selecciona un conductor y completa el inicio y fin.',
      );
      return;
    }

    const inicio = new Date(values.inicio);
    const fin = new Date(values.fin);

    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fin.getTime()) ||
      fin <= inicio
    ) {
      setError(
        'La fecha y hora de fin debe ser posterior al inicio.',
      );
      return;
    }

    setSaving(true);

    try {
      await onSave({
        ...values,
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo guardar la disponibilidad.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="driver-form availability-form"
      onSubmit={submit}
    >
      <fieldset disabled={saving}>
        <legend>
          Datos de disponibilidad operativa
        </legend>

        <div className="driver-fields">
          <label className="form-field">
            Conductor
            <select
              required
              disabled={loadingDrivers}
              value={values.conductor_id}
              onChange={(event) =>
                setValues({
                  ...values,
                  conductor_id: event.target.value,
                })
              }
            >
              <option value="">
                {loadingDrivers
                  ? 'Cargando conductores...'
                  : 'Selecciona un conductor'}
              </option>

              {drivers.map((driver) => (
                <option
                  key={driver.conductor_id}
                  value={driver.conductor_id}
                >
                  {driver.nombre_completo} · DNI{' '}
                  {driver.dni}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Inicio de la jornada
            <input
              required
              type="datetime-local"
              value={values.inicio}
              onChange={(event) =>
                setValues({
                  ...values,
                  inicio: event.target.value,
                })
              }
            />
          </label>

          <label className="form-field">
            Fin de la jornada
            <input
              required
              type="datetime-local"
              value={values.fin}
              onChange={(event) =>
                setValues({
                  ...values,
                  fin: event.target.value,
                })
              }
            />
          </label>

          <label className="form-field">
            Estado operativo
            <select
              value={values.estado}
              onChange={(event) =>
                setValues({
                  ...values,
                  estado: event.target
                    .value as AvailabilityValues['estado'],
                })
              }
            >
              <option value="DISPONIBLE">
                DISPONIBLE
              </option>
              <option value="NO_DISPONIBLE">
                NO DISPONIBLE
              </option>
            </select>
          </label>
        </div>
      </fieldset>

      {error && <p role="alert">{error}</p>}

      <button
        className="button button-primary"
        disabled={saving || loadingDrivers}
      >
        {saving
          ? 'Guardando...'
          : 'Guardar disponibilidad'}
      </button>
    </form>
  );
}
