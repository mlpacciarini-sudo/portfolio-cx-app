import { test, expect } from "@playwright/test";

const DASHBOARD_URL =
  process.env.DASHBOARD_URL || "https://portfolio-cx-app.vercel.app/";

test.describe("Portfolio de Proyectos CX - pruebas funcionales", () => {
  test("1. El dashboard carga sin errores visibles", async ({ page }) => {
    const consoleErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { name: "Portfolio de Proyectos CX" })
    ).toBeVisible();

    await expect(page.getByText("Proyectos activos")).toBeVisible();
    await expect(page.getByText("En fecha", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("En atención", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Crítico", { exact: true }).first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("2. La tabla muestra proyectos y las columnas esperadas", async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });

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
        page.getByRole("columnheader", { name: header, exact: true })
      ).toBeVisible();
    }

    const buttons = page.getByRole("button", { name: /Ver ficha/i });
    await expect(buttons.first()).toBeVisible();
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test("3. Ver ficha abre el proyecto seleccionado", async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });

    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    const projectName = (
      await firstRow.locator("td").first().innerText()
    ).split("\n")[0].trim();

    await firstRow.getByRole("button", { name: /Ver ficha/i }).click();

    await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
    await expect(page.getByText("Resumen ejecutivo", { exact: true })).toBeVisible();
    await expect(page.getByText("Entregables e hitos", { exact: true })).toBeVisible();
  });

  test("4. Volver al portfolio regresa al dashboard", async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: /Ver ficha/i }).first().click();

    const backButton = page.getByRole("button", { name: /Volver al portfolio/i });
    await expect(backButton).toBeVisible();

    await backButton.click();

    await expect(
      page.getByRole("heading", { name: "Portfolio de Proyectos CX" })
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: "Proyecto", exact: true })
    ).toBeVisible();
  });

  test("5. Los entregables pueden desplegarse o contraerse", async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: /Ver ficha/i }).first().click();

    const deliverableSection = page.getByText("Entregables e hitos", { exact: true });
    await expect(deliverableSection).toBeVisible();

    const toggleButtons = page.locator("section").last().locator("button");

    if ((await toggleButtons.count()) > 0) {
      const firstToggle = toggleButtons.first();

      await firstToggle.click();
      await firstToggle.click();

      await expect(firstToggle).toBeVisible();
    }
  });

  test("6. No aparece mensaje de error de carga", async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });

    await expect(
      page.getByText("No se pudo cargar el Portfolio CX", { exact: false })
    ).toHaveCount(0);
  });
});
