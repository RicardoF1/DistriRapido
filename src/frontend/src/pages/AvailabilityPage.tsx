import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { AvailabilityForm } from '../features/availability/AvailabilityForm';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { availabilityApi } from '../services/availability-api';
import type {
  AvailabilityPage as AvailabilityPageData,
  AvailabilityRecord,
  AvailabilityState,
  AvailabilityValues,
} from '../types/availability';

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(value));
}

export function AvailabilityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { acceptSession } = useAuth();

  const [data, setData] =
    useState<AvailabilityPageData>();
  const [record, setRecord] =
    useState<AvailabilityRecord>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');

  const creating =
    window.location.pathname.endsWith('/nuevo');

  const editing =
    window.location.pathname.endsWith('/editar');

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');
    setRecord(undefined);

    const request =
      creating
        ? Promise.resolve(undefined)
        : id
          ? availabilityApi.get(
              id,
              controller.signal,
            )
          : availabilityApi.list(
              page,
              estado,
              inicio
                ? new Date(inicio).toISOString()
                : '',
              fin
                ? new Date(fin).toISOString()
                : '',
              controller.signal,
            );

    request
      .then((result) => {
        if (controller.signal.aborted) return;

        if (
          result &&
          'items' in result
        ) {
          setData(result);
        } else {
          setRecord(
            result as
              | AvailabilityRecord
              | undefined,
          );
        }
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        if (
          cause instanceof ApiError &&
          cause.status === 401
        ) {
          acceptSession(null);
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo cargar la disponibilidad.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    acceptSession,
    attempt,
    creating,
    estado,
    fin,
    id,
    inicio,
    page,
  ]);

  async function save(
    values: AvailabilityValues,
  ) {
    try {
      if (id) {
        await availabilityApi.update(
          id,
          values,
        );
      } else {
        await availabilityApi.create(values);
      }

      setNotice(
        id
          ? 'Disponibilidad actualizada correctamente.'
          : 'Disponibilidad registrada correctamente.',
      );

      navigate('/disponibilidad');
      setAttempt((current) => current + 1);
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        cause.status === 401
      ) {
        acceptSession(null);
      }

      throw cause;
    }
  }

  function clearFilters() {
    setEstado('');
    setInicio('');
    setFin('');
    setPage(1);
    setAttempt((current) => current + 1);
  }

  function statusLabel(
    value: AvailabilityState,
  ): string {
    return value === 'DISPONIBLE'
      ? 'Disponible'
      : 'No disponible';
  }

  return (
    <section className="users-panel availability-panel">
      <div className="page-heading">
        <div>
          <h1>
            {creating
              ? 'Registrar disponibilidad'
              : editing
                ? 'Editar disponibilidad'
                : id
                  ? 'Consultar disponibilidad'
                  : 'Disponibilidad operativa'}
          </h1>

          {!creating && !id && (
            <p>
              Registra las jornadas operativas de los
              conductores antes de iniciar la planificación.
            </p>
          )}
        </div>

        {!creating && !id ? (
          <Link
            className="button button-primary"
            to="/disponibilidad/nuevo"
          >
            Registrar disponibilidad
          </Link>
        ) : (
          <Link to="/disponibilidad">
            Volver a disponibilidad
          </Link>
        )}
      </div>

      {notice && (
        <p role="status">{notice}</p>
      )}

      {!creating && !id && (
        <form
          className="driver-filters availability-filters"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setAttempt(
              (current) => current + 1,
            );
          }}
        >
          <label>
            Estado
            <select
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value);
                setPage(1);
              }}
            >
              <option value="">
                Todos
              </option>
              <option value="DISPONIBLE">
                Disponible
              </option>
              <option value="NO_DISPONIBLE">
                No disponible
              </option>
            </select>
          </label>

          <label>
            Inicio del periodo
            <input
              type="datetime-local"
              value={inicio}
              onChange={(event) =>
                setInicio(event.target.value)
              }
            />
          </label>

          <label>
            Fin del periodo
            <input
              type="datetime-local"
              value={fin}
              onChange={(event) =>
                setFin(event.target.value)
              }
            />
          </label>

          <button
            className="button button-secondary"
            type="submit"
          >
            Filtrar
          </button>

          <button
            className="button button-secondary"
            type="button"
            onClick={clearFilters}
          >
            Limpiar
          </button>
        </form>
      )}

      {loading ? (
        <p role="status">
          Cargando disponibilidad...
        </p>
      ) : error ? (
        <>
          <p role="alert">{error}</p>

          <button
            className="button button-secondary"
            onClick={() =>
              setAttempt(
                (current) => current + 1,
              )
            }
          >
            Reintentar
          </button>
        </>
      ) : creating || editing ? (
        <AvailabilityForm
          key={id ?? 'new'}
          initial={record}
          onSave={save}
        />
      ) : record ? (
        <>
          <dl className="driver-detail availability-detail">
            <div>
              <dt>Conductor</dt>
              <dd>
                {record.conductor.nombre_completo}
              </dd>
            </div>

            <div>
              <dt>DNI</dt>
              <dd>{record.conductor.dni}</dd>
            </div>

            <div>
              <dt>Inicio</dt>
              <dd>
                {formatDateTime(record.inicio)}
              </dd>
            </div>

            <div>
              <dt>Fin</dt>
              <dd>
                {formatDateTime(record.fin)}
              </dd>
            </div>

            <div>
              <dt>Estado operativo</dt>
              <dd>
                {statusLabel(record.estado)}
              </dd>
            </div>

            <div>
              <dt>Última actualización</dt>
              <dd>
                {formatDateTime(
                  record.actualizado_en,
                )}
              </dd>
            </div>
          </dl>

          <div className="driver-actions">
            <Link
              className="button button-primary"
              to={`/disponibilidad/${record.disponibilidad_id}/editar`}
            >
              Editar disponibilidad
            </Link>
          </div>
        </>
      ) : data ? (
        <>
          <p>
            {data.total}{' '}
            {data.total === 1
              ? 'registro encontrado'
              : 'registros encontrados'}
          </p>

          {!data.items.length ? (
            <p>
              No hay disponibilidades para esta consulta.
            </p>
          ) : (
            <div
              className="table-scroll"
              role="region"
              aria-label="Listado de disponibilidades"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>Conductor</th>
                    <th>DNI</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {data.items.map(
                    (availability) => (
                      <tr
                        key={
                          availability.disponibilidad_id
                        }
                      >
                        <td>
                          {
                            availability
                              .conductor
                              .nombre_completo
                          }
                        </td>
                        <td>
                          {
                            availability
                              .conductor.dni
                          }
                        </td>
                        <td>
                          {formatDateTime(
                            availability.inicio,
                          )}
                        </td>
                        <td>
                          {formatDateTime(
                            availability.fin,
                          )}
                        </td>
                        <td>
                          {statusLabel(
                            availability.estado,
                          )}
                        </td>
                        <td>
                          <Link
                            to={`/disponibilidad/${availability.disponibilidad_id}`}
                          >
                            Consultar
                          </Link>
                          {' · '}
                          <Link
                            to={`/disponibilidad/${availability.disponibilidad_id}/editar`}
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="driver-actions">
            <button
              className="button button-secondary"
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  (current) => current - 1,
                )
              }
            >
              Anterior
            </button>

            <span>Página {page}</span>

            <button
              className="button button-secondary"
              disabled={
                page * data.pageSize >=
                data.total
              }
              onClick={() =>
                setPage(
                  (current) => current + 1,
                )
              }
            >
              Siguiente
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
