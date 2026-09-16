import { test, expect } from "@playwright/test";
import {
  getTask,
  updateTaskPriority,
  PRIORITY_KEY_TO_ID,
  PRIORITY_ID_TO_KEY,
  normalizePriorityLabel,
  pickDifferentPriorityKey,
} from "./utils/clickup-client.js";

const TASK_ID = "86akexbw4";
const PROXY_URL = "https://clickup-proxy-api-ten.vercel.app/api/clickup";
const APP_URL = "https://portfolio-cx-app.vercel.app/";

const POLL_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 3_000;

test.describe("Prioridad — sincronización ClickUp → proxy → dashboard", () => {
  test("un cambio de prioridad en ClickUp se refleja correctamente en el dashboard", async ({ page }) => {
    let originalPriorityId = null; // lo que había ANTES en ClickUp (para restaurar)
    let taskName = null;
    let testPriorityKey = null;
    let expectedLabel = null;

    try {
      // --- Paso 1-2: tarea actual y prioridad original -------------------
      await test.step("1-2. Leer tarea en ClickUp y guardar prioridad original", async () => {
        const task = await getTask(TASK_ID);
        taskName = task.name;
        originalPriorityId = task.priority ? Number(task.priority.id) : null;
      });

      const originalKey = originalPriorityId ? PRIORITY_ID_TO_KEY[originalPriorityId] : null;
      testPriorityKey = pickDifferentPriorityKey(originalKey);
      expectedLabel = normalizePriorityLabel(testPriorityKey);

      // --- Paso 3: cambiar prioridad por API ------------------------------
      await test.step("3. Cambiar prioridad en ClickUp a un valor de prueba", async () => {
        await updateTaskPriority(TASK_ID, PRIORITY_KEY_TO_ID[testPriorityKey]);
      });

      // --- Paso 4-5: poll al proxy hasta ver el cambio --------------------
      await test.step("4-5. Poll al proxy hasta que refleje la nueva prioridad", async () => {
        await expect
          .poll(
            async () => {
              const res = await fetch(PROXY_URL);
              if (!res.ok) return null;
              const data = await res.json();
              const t = (data.tasks || []).find((x) => x.id === TASK_ID);
              return t?.priority?.priority ?? null;
            },
            {
              timeout: POLL_TIMEOUT_MS,
              intervals: [POLL_INTERVAL_MS],
              message: `El proxy no reflejó la prioridad "${testPriorityKey}" dentro de ${POLL_TIMEOUT_MS / 1000}s`,
            }
          )
          .toBe(testPriorityKey);
      });

      // --- Paso 6-7: abrir la app y esperar fin de carga ------------------
      await test.step("6-7. Abrir el dashboard y esperar a que termine 'Cargando datos…'", async () => {
        await page.goto(APP_URL);
        await expect(page.getByText("Cargando datos…")).toBeHidden({ timeout: 30_000 });
      });

      // --- Paso 8-9: ubicar el proyecto y validar la prioridad mostrada ---
      await test.step("8-9. Ubicar el proyecto por nombre y validar la Prioridad visible", async () => {
        const projectCard = page.locator("button", { hasText: taskName });
        await expect(projectCard).toBeVisible({ timeout: 10_000 });
        await expect(projectCard).toContainText(`Prioridad ${expectedLabel}`);
      });
    } catch (err) {
      // --- Paso 10: adjuntar evidencia de la falla ------------------------
      await test.info().attach("clickup-priority-roundtrip-failure.json", {
        body: JSON.stringify(
          {
            taskId: TASK_ID,
            taskName,
            testPriorityKeyEnviado: testPriorityKey,
            labelEsperado: expectedLabel,
            error: err instanceof Error ? err.message : String(err),
          },
          null,
          2
        ),
        contentType: "application/json",
      });
      try {
        await page.screenshot({ path: `test-results/priority-roundtrip-failure.png`, fullPage: true });
        await test.info().attach("screenshot-en-la-falla.png", {
          path: `test-results/priority-roundtrip-failure.png`,
          contentType: "image/png",
        });
      } catch {
        // Si la falla ocurrió antes de que existiera `page` navegable, no hay screenshot posible.
      }
      throw err;
    } finally {
      // --- Paso 11: restaurar SIEMPRE la prioridad original de ClickUp ---
      await test.step("11. Restaurar la prioridad original en ClickUp", async () => {
        await updateTaskPriority(TASK_ID, originalPriorityId);
      });
    }
  });
});
