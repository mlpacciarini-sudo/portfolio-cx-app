import fixture from "./fixtures/clickup-response.mock.json" assert { type: "json" };

const CLICKUP_URL = "https://clickup-proxy-api-ten.vercel.app/api/clickup";

/**
 * Intercepta la llamada al proxy de ClickUp para que los tests sean
 * deterministas y no dependan del contenido real de la lista.
 */
export async function mockClickUpSuccess(page, overrideBody) {
  await page.route(CLICKUP_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrideBody ?? fixture),
    })
  );
}

export async function mockClickUpFailure(page, status = 500) {
  await page.route(CLICKUP_URL, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: "Simulated failure for QA" }),
    })
  );
}

export async function mockClickUpEmpty(page) {
  await page.route(CLICKUP_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tasks: [] }),
    })
  );
}

export { fixture, CLICKUP_URL };
