import { test, expect } from "@playwright/test";

const DASHBOARD_URL =
  process.env.DASHBOARD_URL || "https://portfolio-cx-app.vercel.app/";

const CLICKUP_API_URL =
  process.env.CLICKUP_API_URL ||
  "https://clickup-proxy-api-ten.vercel.app/api/clickup";

// ------------------------------------------------------
// Helpers de datos
// ------------------------------------------------------

function findCustomField(task, name) {
  return Array.isArray(task?.custom_fields)
    ? task.custom_fields.find((f) => f.name === name)
    : undefined;
}

function cfNumber(task, name) {
  const f = findCustomField(task, name);

  if (
    !f ||
    f.value === undefined ||
    f.value === null ||
    f.value === ""
  ) {
    return null;
  }

  const n = Number(f.value);

  return Number.isFinite(n) ? n : null;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function promedio(values) {
  const nums = values.filter(
    (v) => typeof v === "number" && Number.isFinite(v)
  );

  if (nums.length === 0) return null;

  return round1(
    nums.reduce((sum, v) => sum + v, 0) / nums.length
  );
}

function calcularAvanceEntregable(entregable, allTasks) {
  const actividades = allTasks.filter(
    (t) => t.parent === entregable.id
  );

  const avances = actividades.map((a) =>
    cfNumber(a, "% Avance")
  );

  const promedioActividades = promedio(avances);

  return promedioActividades ?? cfNumber(entregable, "% Avance");
}

function calcularAvanceProyecto(proyecto, allTasks) {
  const entregables = allTasks.filter(
    (t) => t.parent === proyecto.id
  );

  const avancesEntregables = entregables.map((e) =>
    calcularAvanceEntregable(e, allTasks)
  );

  const promedioEntregables = promedio(avancesEntregables);

  return promedioEntregables ?? cfNumber(proyecto, "% Avance");
}

async function obtenerDatosClickUp(request) {
  const response = await request.get(CLICKUP_API_URL);

  expect(response.ok()).toBeTruthy();

  const data = await response.json();

  expect(Array.isArray(data.tasks)).toBeTruthy();

  const tasks = data.tasks;

  const projects = tasks.filter((task) => !task.parent);

  return { tasks, projects };
}

// ------------------------------------------------------
// QA funcional completo
// ------------------------------------------------------

test.describe("Portfolio de Proyectos CX - QA funcional completo", () => {

  test("1. El dashboard carga correctamente y sin errores de consola", async ({
    page,
  }) => {
    const consoleErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    await expect(
      page.getByRole("heading", {
        name: "Portfolio de Proyectos CX",
      })
    ).toBeVisible();

    await expect(
      page.getByText("Proyectos activos", { exact: true })
    ).toBeVisible();

    await expect(
      page.getByText("En fecha", { exact: true }).first()
    ).toBeVisible();

    await expect(
      page.getByText("En atención", { exact: true }).first()
    ).toBeVisible();

    await expect(
      page.getByText("Crítico", { exact: true }).first()
    ).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("2. La tabla contiene todas las columnas esperadas", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    const headers = [
      "Proyecto",
      "Responsable",
      "Estado",
      "Situación",
      "Prioridad",
      "% Avance",
      "Fecha objetivo",
      "Nueva fecha",
      "Última novedad",
      "Próximo hito",
      "Acciones",
    ];

    for (const header of headers) {
      await expect(
        page.getByRole("columnheader", {
          name: header,
          exact: true,
        })
      ).toBeVisible();
    }
  });

  test("3. Todos los proyectos de ClickUp aparecen automáticamente en el dashboard", async ({
    page,
    request,
  }) => {
    const { projects } = await obtenerDatosClickUp(request);

    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    const rows = page.locator("tbody tr");

    await expect(rows).toHaveCount(projects.length);

    for (const project of projects) {
      await expect(
        page.getByText(project.name, {
          exact: true,
        })
      ).toBeVisible();
    }
  });

  test("4. Cada proyecto tiene un botón Ver ficha", async ({
    page,
    request,
  }) => {
    const { projects } = await obtenerDatosClickUp(request);

    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    const buttons = page.getByRole("button", {
      name: /Ver ficha/i,
    });

    await expect(buttons).toHaveCount(projects.length);
  });

  test("5. El avance mostrado coincide con el avance calculado desde actividades y entregables", async ({
    page,
    request,
  }) => {
    const { tasks, projects } =
      await obtenerDatosClickUp(request);

    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    const rows = page.locator("tbody tr");

    for (const project of projects) {
      const avanceEsperado =
        calcularAvanceProyecto(project, tasks);

      const row = rows.filter({
        hasText: project.name,
      });

      await expect(row).toHaveCount(1);

      const avanceCell = row.locator("td").nth(5);

      if (avanceEsperado === null) {
        await expect(avanceCell).toContainText("—");
      } else {
        await expect(avanceCell).toContainText(
          `${avanceEsperado}%`
        );
      }
    }
  });

  test("6. Ver ficha abre exactamente el proyecto seleccionado", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    const firstRow = page.locator("tbody tr").first();

    await expect(firstRow).toBeVisible();

    const projectName = (
      await firstRow.locator("td").first().innerText()
    )
      .split("\n")[0]
      .trim();

    await firstRow
      .getByRole("button", {
        name: /Ver ficha/i,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: projectName,
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page.getByText("Resumen ejecutivo", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page.getByText("Entregables e hitos", {
        exact: true,
      })
    ).toBeVisible();
  });

  test("7. Dashboard y ficha mantienen el mismo proyecto y avance", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    const firstRow = page.locator("tbody tr").first();

    const projectName = (
      await firstRow.locator("td").first().innerText()
    )
      .split("\n")[0]
      .trim();

    const avanceDashboard =
      await firstRow.locator("td").nth(5).innerText();

    await firstRow
      .getByRole("button", {
        name: /Ver ficha/i,
      })
      .click();

    await expect(
      page.getByRole("heading", {
        name: projectName,
        exact: true,
      })
    ).toBeVisible();

    if (avanceDashboard.includes("%")) {
      const porcentaje =
        avanceDashboard.match(/\d+(?:[.,]\d+)?%/)?.[0];

      if (porcentaje) {
        await expect(
          page.getByText(porcentaje, {
            exact: true,
          }).first()
        ).toBeVisible();
      }
    }
  });

  test("8. Volver al portfolio funciona correctamente", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    await page
      .getByRole("button", {
        name: /Ver ficha/i,
      })
      .first()
      .click();

    const backButton = page.getByRole("button", {
      name: /Volver al portfolio/i,
    });

    await expect(backButton).toBeVisible();

    await backButton.click();

    await expect(
      page.getByRole("heading", {
        name: "Portfolio de Proyectos CX",
      })
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", {
        name: "Proyecto",
        exact: true,
      })
    ).toBeVisible();
  });

  test("9. Los entregables pueden abrirse y cerrarse", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    await page
      .getByRole("button", {
        name: /Ver ficha/i,
      })
      .first()
      .click();

    await expect(
      page.getByText("Entregables e hitos", {
        exact: true,
      })
    ).toBeVisible();

    const deliverablesSection =
      page.locator("section").last();

    const buttons =
      deliverablesSection.locator("button");

    if ((await buttons.count()) > 0) {
      const firstToggle = buttons.first();

      await firstToggle.click();
      await firstToggle.click();

      await expect(firstToggle).toBeVisible();
    }
  });

  test("10. Un proyecto sin entregables no rompe la ficha", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    const rows = page.locator("tbody tr");

    const total = await rows.count();

    for (let i = 0; i < total; i++) {
      const row = rows.nth(i);

      await row
        .getByRole("button", {
          name: /Ver ficha/i,
        })
        .click();

      const emptyMessage = page.getByText(
        "Este proyecto no tiene entregables cargados en ClickUp.",
        { exact: true }
      );

      if ((await emptyMessage.count()) > 0) {
        await expect(emptyMessage).toBeVisible();

        await page
          .getByRole("button", {
            name: /Volver al portfolio/i,
          })
          .click();

        return;
      }

      await page
        .getByRole("button", {
          name: /Volver al portfolio/i,
        })
        .click();
    }
  });

  test("11. Los datos opcionales vacíos no muestran undefined, null ni NaN", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toContain("null");
    expect(bodyText).not.toContain("NaN");
  });

  test("12. No aparece el mensaje de error de carga", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL, {
      waitUntil: "networkidle",
    });

    await expect(
      page.getByText(
        "No se pudo cargar el Portfolio CX",
        { exact: false }
      )
    ).toHaveCount(0);
  });

});
