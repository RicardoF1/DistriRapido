import {
  expect,
  test,
  type Page,
} from '@playwright/test';

const driverId =
  'b9a0b3e9-f147-4cb7-b18c-43b6161b51f3';

const availabilityId =
  '7bd3470d-ee10-4876-83fa-62595b7da17f';

type AvailabilityState =
  | 'DISPONIBLE'
  | 'NO_DISPONIBLE';

interface Availability {
  disponibilidad_id: string;
  conductor_id: string;
  inicio: string;
  fin: string;
  estado: AvailabilityState;
  creado_en: string;
  actualizado_en: string;
  conductor: {
    conductor_id: string;
    nombre_completo: string;
    dni: string;
    estado: 'ACTIVO';
  };
}

async function mockApi(
  page: Page,
  origin: string,
  role = 'Administrador',
) {
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  };

  const driver = {
    conductor_id: driverId,
    nombre_completo: 'Conductor E2E',
    dni: '70000001',
    licencia_categoria: 'A-IIb',
    anios_experiencia: 3,
    telefono: '999111222',
    usuario_id: null,
    estado: 'ACTIVO' as const,
  };

  let items: Availability[] = [
    {
      disponibilidad_id: availabilityId,
      conductor_id: driverId,
      inicio: '2026-10-10T13:00:00.000Z',
      fin: '2026-10-10T22:00:00.000Z',
      estado: 'DISPONIBLE',
      creado_en: '2026-10-09T16:32:47.016Z',
      actualizado_en: '2026-10-09T16:32:47.016Z',
      conductor: {
        conductor_id: driverId,
        nombre_completo: driver.nombre_completo,
        dni: driver.dni,
        estado: driver.estado,
      },
    },
  ];

  await page.route(
    '**/auth/me',
    (route) =>
      route.fulfill({
        headers,
        json: {
          usuario_id:
            '33826409-5ca3-463d-ba2d-92b8d74da59f',
          email: 'admin@distrirapido.local',
          rol: {
            nombre: role,
          },
          expiresAt: Date.now() + 900_000,
        },
      }),
  );

  await page.route(
    '**/admin/summary',
    (route) =>
      route.fulfill({
        headers,
        json: {
          totalOrders: 0,
          pendingOrders: 0,
          totalUsers: 1,
          ordersByState: [],
        },
      }),
  );

  await page.route(
    '**/drivers**',
    async (route) => {
      const request = route.request();

      if (request.method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: {
            ...headers,
            'Access-Control-Allow-Methods':
              'GET,POST,PATCH',
            'Access-Control-Allow-Headers':
              'Content-Type',
          },
        });
      }

      return route.fulfill({
        headers,
        json: {
          items: [driver],
          total: 1,
          page: 1,
          pageSize: 20,
        },
      });
    },
  );

  await page.route(
    '**/availability**',
    async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: {
            ...headers,
            'Access-Control-Allow-Methods':
              'GET,POST,PATCH',
            'Access-Control-Allow-Headers':
              'Content-Type',
          },
        });
      }

      if (method === 'POST') {
        const body = request.postDataJSON() as {
          conductor_id: string;
          inicio: string;
          fin: string;
          estado: AvailabilityState;
        };

        const overlap = items.some(
          (item) =>
            item.conductor_id ===
              body.conductor_id &&
            new Date(item.inicio) <
              new Date(body.fin) &&
            new Date(item.fin) >
              new Date(body.inicio),
        );

        if (overlap) {
          return route.fulfill({
            status: 409,
            headers,
            json: {
              statusCode: 409,
              message:
                'El conductor ya tiene una disponibilidad que se superpone con el intervalo indicado.',
            },
          });
        }

        const created: Availability = {
          disponibilidad_id:
            '00000000-0000-4000-8000-000000000009',
          ...body,
          creado_en:
            '2026-10-09T17:00:00.000Z',
          actualizado_en:
            '2026-10-09T17:00:00.000Z',
          conductor: {
            conductor_id: driverId,
            nombre_completo:
              driver.nombre_completo,
            dni: driver.dni,
            estado: driver.estado,
          },
        };

        items = [...items, created];

        return route.fulfill({
          status: 201,
          headers,
          json: created,
        });
      }

      if (method === 'PATCH') {
        const id = url.pathname.split('/').pop();
        const body = request.postDataJSON();

        items = items.map((item) =>
          item.disponibilidad_id === id
            ? {
                ...item,
                ...body,
                actualizado_en:
                  '2026-10-09T17:30:00.000Z',
              }
            : item,
        );

        const updated = items.find(
          (item) =>
            item.disponibilidad_id === id,
        );

        return route.fulfill({
          headers,
          json: updated,
        });
      }

      const idMatch = url.pathname.match(
        /\/availability\/([^/]+)$/,
      );

      if (idMatch) {
        const item = items.find(
          (candidate) =>
            candidate.disponibilidad_id ===
            idMatch[1],
        );

        return route.fulfill({
          status: item ? 200 : 404,
          headers,
          json:
            item ?? {
              statusCode: 404,
              message:
                'Registro de disponibilidad no encontrado.',
            },
        });
      }

      return route.fulfill({
        headers,
        json: {
          items,
          total: items.length,
          page: 1,
          pageSize: 20,
        },
      });
    },
  );
}

test(
  'lista, registra y edita disponibilidad',
  async ({ page, baseURL }) => {
    await mockApi(
      page,
      new URL(baseURL!).origin,
    );

    await page.goto('/disponibilidad');

    await expect(
      page.getByRole('heading', {
        name: 'Disponibilidad operativa',
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText('Conductor E2E'),
    ).toBeVisible();

    await expect(
      page.getByRole('link', {
        name: 'Disponibilidad',
        exact: true,
      }),
    ).toBeVisible();

    await page
      .getByRole('link', {
        name: 'Registrar disponibilidad',
      })
      .click();

    await page
      .getByLabel('Conductor')
      .selectOption(driverId);

    await page
      .getByLabel('Inicio de la jornada')
      .fill('2026-10-11T08:00');

    await page
      .getByLabel('Fin de la jornada')
      .fill('2026-10-11T17:00');

    await page
      .getByRole('button', {
        name: 'Guardar disponibilidad',
      })
      .click();

    await expect(page).toHaveURL(
      /\/disponibilidad$/,
    );

    await expect(
      page.getByText(
        'Disponibilidad registrada correctamente.',
      ),
    ).toBeVisible();

    await expect(
      page.getByText('2 registros encontrados'),
    ).toBeVisible();

    const secondRow = page
      .getByRole('row')
      .filter({
        hasText: '11/10/26',
      });

    await secondRow
      .getByRole('link', {
        name: 'Editar',
      })
      .click();

    await page
      .getByLabel('Estado operativo')
      .selectOption('NO_DISPONIBLE');

    await page
      .getByRole('button', {
        name: 'Guardar disponibilidad',
      })
      .click();

    await expect(page).toHaveURL(
      /\/disponibilidad$/,
    );

    await expect(
      page.getByText(
        'Disponibilidad actualizada correctamente.',
      ),
    ).toBeVisible();
  },
);

test(
  'muestra conflicto por una jornada superpuesta',
  async ({ page, baseURL }) => {
    await mockApi(
      page,
      new URL(baseURL!).origin,
    );

    await page.goto('/disponibilidad/nuevo');

    await page
      .getByLabel('Conductor')
      .selectOption(driverId);

    await page
      .getByLabel('Inicio de la jornada')
      .fill('2026-10-10T12:00');

    await page
      .getByLabel('Fin de la jornada')
      .fill('2026-10-10T18:00');

    await page
      .getByRole('button', {
        name: 'Guardar disponibilidad',
      })
      .click();

    await expect(
      page.getByRole('alert'),
    ).toContainText(
      'se superpone con el intervalo indicado',
    );

    await expect(page).toHaveURL(
      /\/disponibilidad\/nuevo$/,
    );
  },
);

for (const role of [
  'Usuario Final / Conductor',
  'Auditor Externo',
]) {
  test(
    `bloquea disponibilidad para ${role}`,
    async ({ page, baseURL }) => {
      await mockApi(
        page,
        new URL(baseURL!).origin,
        role,
      );

      await page.goto('/disponibilidad');

      await expect(page).toHaveURL(
        /\/acceso\//,
      );

      await expect(
        page.getByRole('link', {
          name: 'Disponibilidad',
          exact: true,
        }),
      ).toHaveCount(0);
    },
  );
}

for (const width of [390, 768, 1440]) {
  test(
    `disponibilidad responsive ${width}`,
    async ({ page, baseURL }) => {
      await page.setViewportSize({
        width,
        height: 900,
      });

      await mockApi(
        page,
        new URL(baseURL!).origin,
      );

      await page.goto('/disponibilidad');

      await expect(
        page.getByRole('heading', {
          name: 'Disponibilidad operativa',
          exact: true,
        }),
      ).toBeVisible();

      if (width < 1024) {
        await page
          .getByRole('button', {
            name: /Abrir men/,
          })
          .click();

        await expect(
          page.getByRole('link', {
            name: 'Disponibilidad',
            exact: true,
          }),
        ).toBeVisible();
      }

      const hasOverflow =
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            window.innerWidth,
        );

      expect(hasOverflow).toBe(false);
    },
  );
}


