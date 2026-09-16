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
  "EN PAUSA",
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
  if (s.includes("on hold") || s.includes("en pausa")) return "EN PAUSA";
  if (
    s.includes("finalizado") ||
    s.includes("done") ||
    s.includes("closed")
  ) {
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

  const avancesActividades = actividades.map((a) =>
    cfNumber(a, "% Avance")
  );

  const promedioActividades = promedio(avancesActividades);

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

async function getData() {
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

  assert.ok(
    Array.isArray(data.tasks),
    "La respuesta no contiene data.tasks[]"
  );

  return {
    tasks: data.tasks,
    projects: data.tasks.filter((task) => !task.parent),
  };
}

let tasks;
let projects;

test.before(async () => {
  const data = await getData();
  tasks = data.tasks;
  projects = data.projects;
});

test("1. El endpoint responde correctamente", () => {
  assert.ok(Array.isArray(tasks));
});

test("2. Llegan proyectos desde ClickUp", () => {
  assert.ok(
    projects.length > 0,
    "No llegó ningún proyecto de nivel superior desde ClickUp"
  );
});

test("3. Cada proyecto tiene nombre, estado y focal", () => {
  const errors = [];

  for (const task of projects) {
    const nombre = task.name?.trim();
    const estado = normalizeEstado(task.status?.status);
    const focal = cfUsers(task, "Focal");

    if (!nombre) errors.push(`[${task.id}] falta nombre`);
    if (!estado) errors.push(`[${nombre || task.id}] falta estado`);
    if (!focal) errors.push(`[${nombre || task.id}] falta Focal`);
  }

  assert.deepEqual(
    errors,
    [],
    `Hay proyectos con datos obligatorios faltantes:\n${errors.join("\n")}`
  );
});

test(
  "4. Todos los proyectos actuales y futuros tienen avance calculable entre 0 y 100",
  () => {
    const errors = [];

    for (const project of projects) {
      const avance = calcularAvanceProyecto(project, tasks);

      if (avance === null) {
        errors.push(`${project.name}: no se pudo calcular % Avance`);
        continue;
      }

      if (avance < 0 || avance > 100) {
        errors.push(
          `${project.name}: avance calculado fuera de rango (${avance}%)`
        );
      }
    }

    assert.deepEqual(
      errors,
      [],
      `Hay problemas con el avance calculado:\n${errors.join("\n")}`
    );
  }
);

test(
  "5. Las actividades usadas para calcular avance tienen % Avance válido",
  () => {
    const errors = [];

    for (const project of projects) {
      const entregables = tasks.filter(
        (t) => t.parent === project.id
      );

      for (const entregable of entregables) {
        const actividades = tasks.filter(
          (t) => t.parent === entregable.id
        );

        for (const actividad of actividades) {
          const avance = cfNumber(actividad, "% Avance");

          if (avance === null) {
            errors.push(
              `${project.name} > ${entregable.name} > ${actividad.name}: falta % Avance`
            );
          } else if (avance < 0 || avance > 100) {
            errors.push(
              `${project.name} > ${entregable.name} > ${actividad.name}: ${avance}% fuera de rango`
            );
          }
        }
      }
    }

    assert.deepEqual(
      errors,
      [],
      `Hay actividades con % Avance inválido o faltante:\n${errors.join("\n")}`
    );
  }
);

test(
  "6. Estado, Situación y Prioridad usan solo valores válidos",
  () => {
    const errors = [];

    for (const task of projects) {
      const estado = normalizeEstado(task.status?.status);
      const situacion = getSituacion(task);
      const prioridad = normalizePriority(
        task.priority?.priority
      );

      if (!VALID_ESTADOS.has(estado)) {
        errors.push(
          `${task.name}: Estado inválido "${estado}"`
        );
      }

      if (!situacion) {
        errors.push(
          `${task.name}: falta Situación / Semáforo ejecutivo`
        );
      } else if (!VALID_SITUACIONES.has(situacion)) {
        errors.push(
          `${task.name}: Situación inválida "${situacion}"`
        );
      }

      if (!prioridad) {
        errors.push(`${task.name}: falta Prioridad`);
      } else if (!VALID_PRIORIDADES.has(prioridad)) {
        errors.push(
          `${task.name}: Prioridad inválida "${prioridad}"`
        );
      }
    }

    assert.deepEqual(
      errors,
      [],
      `Hay valores fuera del catálogo esperado:\n${errors.join("\n")}`
    );
  }
);

test(
  "7. Si existe Nueva fecha objetivo, contiene una fecha válida",
  () => {
    const errors = [];

    for (const task of projects) {
      const rawDate = getNuevaFechaRaw(task);

      if (
        rawDate !== null &&
        !isValidTimestampDate(rawDate)
      ) {
        errors.push(
          `${task.name}: Nueva fecha inválida "${rawDate}"`
        );
      }
    }

    assert.deepEqual(
      errors,
      [],
      `Hay valores inválidos en Nueva fecha objetivo:\n${errors.join("\n")}`
    );
  }
);

test("8. No hay proyectos duplicados por ID ni por nombre", () => {
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
