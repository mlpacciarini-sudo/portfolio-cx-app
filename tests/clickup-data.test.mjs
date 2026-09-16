import test from "node:test";
import assert from "node:assert/strict";

const API_URL =
  process.env.CLICKUP_API_URL ||
  "https://clickup-proxy-api-ten.vercel.app/api/clickup";

const VALID_ESTADOS = new Set([
  "NO INICIADO",
  "EN PREPARACIÓN",
  "EN EJECUCIÓN",
  "EN VALIDACIÓN",
  "EN ANÁLISIS",
  "FINALIZADO",
]);

const VALID_SITUACIONES = new Set([
  "En fecha",
  "En atención",
  "Crítico",
]);

const VALID_PRIORIDADES = new Set([
  "Alta",
  "Media",
  "Baja",
]);

function stripAccents(s) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeEstado(rawStatus) {
  const s = stripAccents((rawStatus || "").toLowerCase().trim());

  if (s.includes("no iniciado")) return "NO INICIADO";
  if (s.includes("en preparacion")) return "EN PREPARACIÓN";
  if (s.includes("en ejecucion")) return "EN EJECUCIÓN";
  if (s.includes("en validacion")) return "EN VALIDACIÓN";
  if (s.includes("en analisis")) return "EN ANÁLISIS";
  if (s.includes("finalizado") || s.includes("done") || s.includes("closed")) {
    return "FINALIZADO";
  }

  return (rawStatus || "").toUpperCase() || null;
}

function normalizePriority(rawPriority) {
  if (!rawPriority) return null;

  const p = rawPriority.toLowerCase();

  if (p === "urgent" || p === "high") return "Alta";
  if (p === "normal") return "Media";
  if (p === "low") return "Baja";

  return null;
}

function findCustomField(task, name) {
  return Array.isArray(task?.custom_fields)
    ? task.custom_fields.find((f) => f.name === name)
    : undefined;
}

function cfNumber(task, name) {
  const f = findCustomField(task, name);

  if (!f || f.value === undefined || f.value === null || f.value === "") {
    return null;
  }

  const n = Number(f.value);
  return Number.isFinite(n) ? n : null;
}

function cfUsers(task, name) {
  const f = findCustomField(task, name);

  if (!f || !Array.isArray(f.value) || f.value.length === 0) {
    return null;
  }

  return f.value;
}

function cfDropdownLabel(task, name) {
  const f = findCustomField(task, name);

  if (!f || f.value === undefined || f.value === null || f.value === "") {
    return null;
  }

  const options = f.type_config?.options || [];
  const option = options.find((o) => o.orderindex === f.value);

  return option?.name || null;
}

function getSituacion(task) {
  const raw =
    cfDropdownLabel(task, "Semaforo ejecutivo") ||
    cfDropdownLabel(task, "Semáforo ejecutivo");

  if (!raw) return null;

  const k = stripAccents(raw.toLowerCase());

  if (k.includes("critico")) return "Crítico";

  if (
    k.includes("con desvio") ||
    k.includes("en riesgo") ||
    k.includes("atencion")
  ) {
    return "En atención";
  }

  if (k.includes("en fecha")) return "En fecha";

  return raw;
}

function getNuevaFechaRaw(task) {
  const f = findCustomField(task, "Nueva fecha objetivo");

  if (!f || f.value === undefined || f.value === null || f.value === "") {
    return null;
  }

  return f.value;
}

function isValidTimestampDate(value) {
  const n = Number(value);

  if (!Number.isFinite(n)) return false;

  const d = new Date(n);

  return !Number.isNaN(d.getTime());
}

async function getProjects() {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  assert.equal(
    response.ok,
    true,
    `El endpoint respondió ${response.status} ${response.statusText}`
  );

  const data = await response.json();

  assert.ok(Array.isArray(data.tasks), "La respuesta no contiene data.tasks[]");

  return data.tasks.filter((task) => !task.parent);
}

let projects;

test.before(async () => {
  projects = await getProjects();
});

test("1. El endpoint responde correctamente", async () => {
  assert.ok(Array.isArray(projects));
});

test("2. Llegan proyectos desde ClickUp", () => {
  assert.ok(
    projects.length > 0,
    "No llegó ningún proyecto de nivel superior desde ClickUp"
  );
});

test("3. Cada proyecto tiene nombre, estado, focal y % avance", () => {
  const errors = [];

  for (const task of projects) {
    const nombre = task.name?.trim();
    const estado = normalizeEstado(task.status?.status);
    const focal = cfUsers(task, "Focal");
    const avance = cfNumber(task, "% Avance");

    if (!nombre) errors.push(`[${task.id}] falta nombre`);
    if (!estado) errors.push(`[${nombre || task.id}] falta estado`);
    if (!focal) errors.push(`[${nombre || task.id}] falta Focal`);
    if (avance === null) errors.push(`[${nombre || task.id}] falta % Avance`);
  }

  assert.deepEqual(
    errors,
    [],
    `Hay proyectos con datos obligatorios faltantes:\n${errors.join("\n")}`
  );
});

test("4. El % de avance está entre 0 y 100", () => {
  const errors = [];

  for (const task of projects) {
    const avance = cfNumber(task, "% Avance");

    if (avance !== null && (avance < 0 || avance > 100)) {
      errors.push(`${task.name}: ${avance}%`);
    }
  }

  assert.deepEqual(
    errors,
    [],
    `Hay porcentajes de avance fuera de rango:\n${errors.join("\n")}`
  );
});

test("5. Estado, Situación y Prioridad usan solo valores válidos", () => {
  const errors = [];

  for (const task of projects) {
    const estado = normalizeEstado(task.status?.status);
    const situacion = getSituacion(task);
    const prioridad = normalizePriority(task.priority?.priority);

    if (!VALID_ESTADOS.has(estado)) {
      errors.push(`${task.name}: Estado inválido "${estado}"`);
    }

    if (!situacion) {
      errors.push(`${task.name}: falta Situación / Semáforo ejecutivo`);
    } else if (!VALID_SITUACIONES.has(situacion)) {
      errors.push(`${task.name}: Situación inválida "${situacion}"`);
    }

    if (!prioridad) {
      errors.push(`${task.name}: falta Prioridad`);
    } else if (!VALID_PRIORIDADES.has(prioridad)) {
      errors.push(`${task.name}: Prioridad inválida "${prioridad}"`);
    }
  }

  assert.deepEqual(
    errors,
    [],
    `Hay valores fuera del catálogo esperado:\n${errors.join("\n")}`
  );
});

test("6. Si existe Nueva fecha objetivo, contiene una fecha válida", () => {
  const errors = [];

  for (const task of projects) {
    const rawDate = getNuevaFechaRaw(task);

    if (rawDate !== null && !isValidTimestampDate(rawDate)) {
      errors.push(`${task.name}: Nueva fecha inválida "${rawDate}"`);
    }
  }

  assert.deepEqual(
    errors,
    [],
    `Hay valores inválidos en Nueva fecha objetivo:\n${errors.join("\n")}`
  );
});

test("7. No hay proyectos duplicados por ID ni por nombre", () => {
  const ids = new Set();
  const names = new Set();
  const duplicateIds = [];
  const duplicateNames = [];

  for (const task of projects) {
    if (ids.has(task.id)) {
      duplicateIds.push(task.id);
    }
    ids.add(task.id);

    const normalizedName = stripAccents(task.name || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    if (names.has(normalizedName)) {
      duplicateNames.push(task.name);
    }
    names.add(normalizedName);
  }

  assert.deepEqual(
    duplicateIds,
    [],
    `Hay IDs de proyecto duplicados: ${duplicateIds.join(", ")}`
  );

  assert.deepEqual(
    duplicateNames,
    [],
    `Hay nombres de proyecto duplicados: ${duplicateNames.join(", ")}`
  );
});
