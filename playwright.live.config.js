import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests/live",
  timeout: 90_000, // el propio test incluye un polling de hasta 60s
  fullyParallel: false, // este test muta un recurso compartido en ClickUp: nunca en paralelo
  retries: 0, // un retry automático complicaría la restauración de la prioridad original
  reporter: "html",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Sin webServer: este config corre contra la app ya desplegada en Vercel,
  // no contra un servidor local.
});
