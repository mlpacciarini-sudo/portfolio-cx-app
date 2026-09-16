// Cliente mínimo de la API de ClickUp, usado únicamente por los tests
// "live" de Playwright. Corre en Node, nunca en el navegador: el token
// jamás llega al bundle del frontend.
//
// Requiere la variable de entorno CLICKUP_API_TOKEN (ver .env.example).

const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

// Mapeo numérico oficial de ClickUp: 1=Urgent, 2=High, 3=Normal, 4=Low.
export const PRIORITY_KEY_TO_ID = { urgent: 1, high: 2, normal: 3, low: 4 };
export const PRIORITY_ID_TO_KEY = { 1: "urgent", 2: "high", 3: "normal", 4: "low" };

function getToken() {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) {
    throw new Error(
      "CLICKUP_API_TOKEN no está definida. Copiá .env.example a .env y completá el token."
    );
  }
  return token;
}

async function clickupFetch(path, options = {}) {
  const res = await fetch(`${CLICKUP_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getToken(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ClickUp API respondió ${res.status} en ${path}: ${body}`);
  }
  return res.json();
}

/** Trae la tarea completa desde ClickUp (incluye priority nativo). */
export async function getTask(taskId) {
  return clickupFetch(`/task/${taskId}`);
}

/**
 * Actualiza la prioridad de una tarea.
 * @param {string} taskId
 * @param {number|null} priorityId - 1..4, o null para dejar la tarea sin prioridad.
 */
export async function updateTaskPriority(taskId, priorityId) {
  return clickupFetch(`/task/${taskId}`, {
    method: "PUT",
    body: JSON.stringify({ priority: priorityId }),
  });
}

/**
 * Replica EXACTAMENTE la lógica de normalizePriority() en src/App.jsx.
 * Si ese archivo cambia su mapeo, hay que actualizar esta copia también
 * (se deja el espejo aquí para no importar JSX en el entorno de test de Node).
 */
export function normalizePriorityLabel(rawPriorityKey) {
  if (!rawPriorityKey) return "—";
  const p = rawPriorityKey.toLowerCase();
  if (p === "urgent" || p === "high") return "Alta";
  if (p === "normal") return "Media";
  if (p === "low") return "Baja";
  return "—";
}

/**
 * Elige una prioridad de prueba cuyo label visible en la UI sea
 * distinto al de la prioridad original (criterio dinámico confirmado).
 * @param {string|null} originalKey - "urgent" | "high" | "normal" | "low" | null
 * @returns {string} una de "low" | "normal" | "high" | "urgent"
 */
export function pickDifferentPriorityKey(originalKey) {
  const originalLabel = normalizePriorityLabel(originalKey);
  const candidates = ["low", "normal", "high", "urgent"];
  const different = candidates.find((c) => normalizePriorityLabel(c) !== originalLabel);
  // Con 4 candidatos y 3 labels posibles, siempre hay al menos uno distinto.
  return different ?? "low";
}
