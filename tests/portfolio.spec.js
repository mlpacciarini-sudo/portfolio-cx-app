import { test, expect } from "@playwright/test";
import { mockClickUpSuccess, mockClickUpFailure, mockClickUpEmpty } from "./mock-clickup.js";

test.describe("Portfolio CX — pantalla inicial", () => {
  test("muestra 'Cargando datos…' antes de resolver el fetch", async ({ page }) => {
    await page.route("**/api/clickup", async (route) => {
      await new Promise((r) => setTimeout(r, 800)); // fuerza a que el loading sea observable
      route.fulfill({ status: 200, contentType: "application/json", body: '{"tasks":[]}' });
    });
    await page.goto("/");
    await expect(page.getByText("Cargando datos…")).toBeVisible();
  });

  test("renderiza el título y los 5 KPIs con datos reales del mock", async ({ page }) => {
    await mockClickUpSuccess(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Portfolio CX" })).toBeVisible();

    // Con el fixture: 2 proyectos, 1 en fecha + 1 sin semáforo cargado,
    // 1 en preparación, 0 en ejecución, 0 finalizados a nivel proyecto.
    await expect(page.getByText("Total de proyectos")).toBeVisible();
    await expect(page.getByText("En fecha", { exact: true })).toBeVisible();
    await expect(page.getByText("Con desvío", { exact: true })).toBeVisible();
    await expect(page.getByText("En ejecución", { exact: true })).toBeVisible();
    await expect(page.getByText("Finalizados")).toBeVisible();

    // Las dos tarjetas de proyecto de nivel superior están presentes.
    await expect(page.getByText("Proyecto QA — Rediseño de onboarding")).toBeVisible();
    await expect(page.getByText("Proyecto QA — Sin datos ejecutivos cargados")).toBeVisible();
  });

  test("no muestra las tareas hijas (entregables/actividades) como tarjetas de portfolio", async ({ page }) => {
    await mockClickUpSuccess(page);
    await page.goto("/");
    await expect(page.getByText("Entregable 1.1")).not.toBeVisible();
    await expect(page.getByText("Actividad 1.1.1")).not.toBeVisible();
  });

  test("muestra un mensaje de error claro si el endpoint falla", async ({ page }) => {
    await mockClickUpFailure(page, 500);
    await page.goto("/");
    await expect(page.getByText("No se pudo cargar el Portfolio CX")).toBeVisible();
    await expect(page.getByText(/No fue posible obtener datos desde ClickUp/)).toBeVisible();
    // No debe haber datos ficticios de respaldo.
    await expect(page.getByText("Total de proyectos")).not.toBeVisible();
  });

  test("maneja una respuesta 200 sin tareas sin inventar datos", async ({ page }) => {
    await mockClickUpEmpty(page);
    await page.goto("/");
    await expect(page.getByText("No se pudo cargar el Portfolio CX")).toBeVisible();
  });
});
