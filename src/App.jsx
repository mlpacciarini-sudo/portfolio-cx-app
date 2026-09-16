import React, { useState, useEffect } from "react";

const NAVY = "#141B24";
const PANEL = "#1B2430";
const PANEL_2 = "#212B39";
const LINE = "#2C3846";
const PAPER = "#EDEAE2";
const MUTED = "#8D96A3";
const COPPER = "#C4864A";
const TEAL = "#4F9E93";
const AMBER = "#D8A441";
const RUST = "#C05B41";

const serif = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const sans = "'Inter', 'Helvetica Neue', Arial, sans-serif";

const API_URL = "https://clickup-proxy-api-ten.vercel.app/api/clickup";

// ---------- Estilos por estado / semáforo (idénticos a la versión original) ----------

const ESTADO_STYLE = {
  "EN PREPARACIÓN": { color: AMBER, label: "En preparación" },
  "EN EJECUCIÓN": { color: TEAL, label: "En ejecución" },
  FINALIZADO: { color: "#7BAF8C", label: "Finalizado" },
  "EN VALIDACIÓN": { color: COPPER, label: "En validación" },
  "NO INICIADO": { color: MUTED, label: "No iniciado" },
};
const ESTADO_FALLBACK = { color: MUTED, label: "—" };

const SEMAFORO_STYLE = {
  "en fecha": { color: TEAL, label: "En fecha" },
  "con desvío": { color: AMBER, label: "Con desvío" },
  "en riesgo": { color: AMBER, label: "En riesgo" },
  "crítico": { color: RUST, label: "Crítico" },
};

// ---------- Normalización de datos crudos de ClickUp ----------

function stripAccents(s) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeEstado(rawStatus) {
  const s = stripAccents((rawStatus || "").toLowerCase().trim());
  if (s.includes("no iniciado")) return "NO INICIADO";
  if (s.includes("en preparacion")) return "EN PREPARACIÓN";
  if (s.includes("en ejecucion")) return "EN EJECUCIÓN";
  if (s.includes("en validacion")) return "EN VALIDACIÓN";
  if (s.includes("finalizado") || s.includes("done") || s.includes("closed")) return "FINALIZADO";
  return (rawStatus || "").toUpperCase() || null;
}

function normalizePriority(rawPriority) {
  if (!rawPriority) return "—";
  const p = rawPriority.toLowerCase();
  if (p === "urgent" || p === "high") return "Alta";
  if (p === "normal") return "Media";
  if (p === "low") return "Baja";
  return "—";
}

function findCustomField(task, name) {
  if (!task || !Array.isArray(task.custom_fields)) return undefined;
  return task.custom_fields.find((f) => f.name === name);
}

function cfText(task, name) {
  const f = findCustomField(task, name);
  if (!f || f.value === undefined || f.value === null || f.value === "") return null;
  return String(f.value);
}

function cfNumberPercent(task, name) {
  const f = findCustomField(task, name);
  if (!f || f.value === undefined || f.value === null || f.value === "") return null;
  const n = Number(f.value);
  return Number.isFinite(n) ? n : null;
}

function cfDate(task, name) {
  const f = findCustomField(task, name);
  if (!f || f.value === undefined || f.value === null || f.value === "") return null;
  return formatDate(f.value);
}

function cfDropdownLabel(task, name) {
  const f = findCustomField(task, name);
  if (!f || f.value === undefined || f.value === null || f.value === "") return null;
  const opts = (f.type_config && f.type_config.options) || [];
  const opt = opts.find((o) => o.orderindex === f.value);
  const label = opt ? opt.name : null;
  if (!label) return null;
  if (stripAccents(label.toLowerCase()) === "no aplica") return null;
  return label;
}

function cfUsers(task, name) {
  const f = findCustomField(task, name);
  if (!f || !f.value || !Array.isArray(f.value) || f.value.length === 0) return null;
  const names = f.value.map((u) => {
    if (u && typeof u === "object") return u.username || u.email || `Usuario ${u.id}`;
    return `Usuario ${u}`;
  });
  return names.join(", ");
}

function formatDate(msValue) {
  if (msValue === undefined || msValue === null || msValue === "") return null;
  const ms = Number(msValue);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function dashIfEmpty(v) {
  return v === undefined || v === null || v === "" ? "—" : v;
}

// ---------- Transformación de un task crudo de ClickUp a la forma que usa la UI ----------

function buildProjectFromTask(task, entregablesRaw, allTasks) {
  const estado = normalizeEstado(task.status && task.status.status);
  const avance = cfNumberPercent(task, "% Avance");
  const semaforoLabelRaw = cfDropdownLabel(task, "Semaforo ejecutivo") || cfDropdownLabel(task, "Semáforo ejecutivo");
  const semaforoKey = semaforoLabelRaw ? stripAccents(semaforoLabelRaw.toLowerCase()) : null;

  const entregables = entregablesRaw
    .filter((e) => e.parent === task.id)
    .sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }))
    .map((e) => buildEntregable(e, allTasks));

  return {
    id: task.id,
    nombre: task.name,
    estado,
    prioridad: normalizePriority(task.priority && task.priority.priority),
    avance: avance,
    sponsor: cfDropdownLabel(task, "Sponsor"),
    focal: cfUsers(task, "Focal"),
    semaforoLabel: semaforoLabelRaw,
    semaforoKey,
    fechaInicio: formatDate(task.start_date),
    fechaObjetivo: cfDate(task, "Fecha objetivo"),
    nuevaFechaObjetivo: cfDate(task, "Nueva fecha objetivo"),
    justificacionDesvio: cfText(task, "Justifica desvio") || cfText(task, "Justifica desvío"),
    actualizacion: cfText(task, "Actualización / Novedad"),
    fechaUltimaActualizacion: formatDate(task.date_updated),
    entregables,
  };
}

function buildEntregable(task, allTasks) {
  const actividades = allTasks
    .filter((a) => a.parent === task.id)
    .sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }))
    .map((a) => ({
      id: a.id,
      nombre: a.name,
      estado: normalizeEstado(a.status && a.status.status),
      avance: cfNumberPercent(a, "% Avance") ?? 0,
    }));
  return {
    id: task.id,
    nombre: task.name,
    actividades,
  };
}

function generarDondeEstamos(p) {
  const partes = [];
  if (p.avance !== null && p.avance !== undefined) {
    partes.push(`El proyecto muestra un avance del ${p.avance}%`);
  } else {
    partes.push("El proyecto no registra un porcentaje de avance cargado");
  }
  const estadoLabel = (ESTADO_STYLE[p.estado] || ESTADO_FALLBACK).label;
  partes.push(`con estado ${estadoLabel.toLowerCase()}`);
  if (p.semaforoLabel) {
    partes.push(`y semáforo ejecutivo "${p.semaforoLabel}"`);
  }
  let resumen = partes.join(", ") + ".";
  if (p.justificacionDesvio) {
    resumen += ` Desvío justificado: ${p.justificacionDesvio}.`;
  }
  if (p.actualizacion) {
    resumen += ` ${p.actualizacion}`;
  }
  return resumen;
}

// ---------- Componentes visuales (idénticos a la versión original) ----------

function Pill({ color, children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        letterSpacing: 0.2,
        color,
        border: `1px solid ${color}55`,
        background: `${color}18`,
        borderRadius: 4,
        padding: "3px 9px",
        fontFamily: sans,
        fontWeight: 500,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {children}
    </span>
  );
}

function ProgressBar({ value, color }) {
  const v = typeof value === "number" ? value : 0;
  return (
    <div style={{ background: "#0F151C", borderRadius: 3, height: 5, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${v}%`, background: color, height: "100%", borderRadius: 3 }} />
    </div>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderRadius: 6,
        padding: "18px 20px",
        flex: "1 1 150px",
        minWidth: 130,
      }}
    >
      <div style={{ fontFamily: sans, fontSize: 11.5, color: MUTED, letterSpacing: 0.3, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: serif, fontSize: 30, color: accent || PAPER, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function ProjectCard({ project, onOpen }) {
  const est = ESTADO_STYLE[project.estado] || ESTADO_FALLBACK;
  const sem = project.semaforoKey ? SEMAFORO_STYLE[project.semaforoKey] : null;
  return (
    <button
      onClick={() => onOpen(project.id)}
      style={{
        textAlign: "left",
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderRadius: 6,
        padding: "20px 22px",
        cursor: "pointer",
        width: "100%",
        display: "block",
        fontFamily: sans,
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = COPPER + "88")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: serif, fontSize: 19, color: PAPER, marginBottom: 12 }}>{project.nombre}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill color={est.color}>{est.label}</Pill>
            {sem && <Pill color={sem.color}>{sem.label}</Pill>}
            {project.prioridad !== "—" && (
              <span
                style={{
                  fontSize: 12,
                  color: COPPER,
                  border: `1px solid ${COPPER}55`,
                  borderRadius: 4,
                  padding: "3px 9px",
                  fontWeight: 500,
                }}
              >
                Prioridad {project.prioridad}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 90 }}>
          <div style={{ fontFamily: serif, fontSize: 26, color: PAPER }}>
            {project.avance !== null && project.avance !== undefined ? `${project.avance}%` : "—"}
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>avance</div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <ProgressBar value={project.avance} color={est.color} />
      </div>
      {project.actualizacion && (
        <div style={{ marginTop: 14, fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{project.actualizacion}</div>
      )}
      <div style={{ marginTop: 14, fontSize: 12, color: MUTED, display: "flex", justifyContent: "space-between" }}>
        <span>Sponsor: {dashIfEmpty(project.sponsor)}</span>
        <span style={{ color: COPPER }}>Ver ficha ejecutiva →</span>
      </div>
    </button>
  );
}

function FactItem({ label, value }) {
  if (value === undefined || value === null || value === "" || value === "No aplica") return null;
  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, letterSpacing: 0.2 }}>{label}</div>
      <div style={{ fontSize: 14, color: PAPER, fontFamily: sans }}>{value}</div>
    </div>
  );
}

function ActivityRow({ act }) {
  const est = ESTADO_STYLE[act.estado] || ESTADO_FALLBACK;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 0",
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <div style={{ flex: 1, fontSize: 13.5, color: PAPER, fontFamily: sans }}>{act.nombre}</div>
      <div style={{ width: 118, flexShrink: 0 }}>
        <Pill color={est.color}>{est.label}</Pill>
      </div>
      <div style={{ width: 90, flexShrink: 0 }}>
        <ProgressBar value={act.avance} color={est.color} />
      </div>
      <div style={{ width: 34, textAlign: "right", fontSize: 12.5, color: MUTED, flexShrink: 0 }}>{act.avance}%</div>
    </div>
  );
}

function Deliverable({ entregable }) {
  const [open, setOpen] = useState(true);
  const total = entregable.actividades.length;
  const doneAvg = total
    ? Math.round(entregable.actividades.reduce((s, a) => s + (a.avance || 0), 0) / total)
    : 0;
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 6, marginBottom: 10, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: PANEL_2,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "inline-block",
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
              color: COPPER,
              fontSize: 12,
            }}
          >
            ▶
          </span>
          <span style={{ fontFamily: serif, fontSize: 15.5, color: PAPER }}>{entregable.nombre}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: MUTED }}>{total} actividades</span>
          <span style={{ fontFamily: serif, fontSize: 15, color: COPPER, minWidth: 40, textAlign: "right" }}>
            {doneAvg}%
          </span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "4px 18px 6px", background: PANEL }}>
          {entregable.actividades.length === 0 && (
            <div style={{ padding: "10px 0", fontSize: 13, color: MUTED }}>Sin actividades cargadas.</div>
          )}
          {entregable.actividades.map((a) => (
            <ActivityRow key={a.id} act={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ project, onBack }) {
  const est = ESTADO_STYLE[project.estado] || ESTADO_FALLBACK;
  const sem = project.semaforoKey ? SEMAFORO_STYLE[project.semaforoKey] : null;
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          color: MUTED,
          fontSize: 13,
          cursor: "pointer",
          padding: "6px 0",
          marginBottom: 20,
          fontFamily: sans,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = PAPER)}
        onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
      >
        <span style={{ fontSize: 15 }}>←</span> Volver al portfolio
      </button>

      <h1 style={{ fontFamily: serif, fontSize: 28, color: PAPER, margin: "0 0 14px", lineHeight: 1.2 }}>
        {project.nombre}
      </h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        <Pill color={est.color}>{est.label}</Pill>
        {sem && <Pill color={sem.color}>{sem.label}</Pill>}
        {project.prioridad !== "—" && (
          <span
            style={{
              fontSize: 12,
              color: COPPER,
              border: `1px solid ${COPPER}55`,
              borderRadius: 4,
              padding: "3px 9px",
              fontWeight: 500,
              fontFamily: sans,
            }}
          >
            Prioridad {project.prioridad}
          </span>
        )}
      </div>

      {/* Ficha ejecutiva */}
      <div
        style={{
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: 6,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontFamily: serif, fontSize: 15, color: COPPER, marginBottom: 6 }}>Ficha ejecutiva</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            columnGap: 28,
          }}
        >
          <FactItem label="Estado" value={est.label} />
          <FactItem label="Focal" value={project.focal} />
          <FactItem label="Sponsor" value={project.sponsor} />
          <FactItem label="Prioridad" value={project.prioridad === "—" ? null : project.prioridad} />
          <FactItem label="Fecha de inicio" value={project.fechaInicio} />
          <FactItem label="Fecha objetivo" value={project.fechaObjetivo} />
          <FactItem label="Nueva fecha objetivo" value={project.nuevaFechaObjetivo} />
          <FactItem
            label="% de avance"
            value={project.avance !== null && project.avance !== undefined ? `${project.avance}%` : null}
          />
          <FactItem label="Semáforo ejecutivo" value={sem ? sem.label : null} />
          <FactItem label="Justificación de desvío" value={project.justificacionDesvio} />
          <FactItem label="Fecha de última actualización" value={project.fechaUltimaActualizacion} />
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Actualización / Novedad</div>
          <div style={{ fontSize: 14, color: PAPER, lineHeight: 1.6, fontFamily: sans }}>
            {dashIfEmpty(project.actualizacion)}
          </div>
        </div>
      </div>

      {/* Dónde estamos */}
      <div
        style={{
          background: `${COPPER}12`,
          border: `1px solid ${COPPER}44`,
          borderRadius: 6,
          padding: "18px 24px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontFamily: serif, fontSize: 15, color: COPPER, marginBottom: 8 }}>Dónde estamos</div>
        <div style={{ fontSize: 14, color: PAPER, lineHeight: 1.65, fontFamily: sans }}>
          {generarDondeEstamos(project)}
        </div>
      </div>

      {/* Entregables */}
      <div style={{ fontFamily: serif, fontSize: 17, color: PAPER, marginBottom: 14 }}>Entregables y actividades</div>
      {project.entregables.length === 0 ? (
        <div style={{ fontSize: 13, color: MUTED }}>Este proyecto no tiene entregables cargados en ClickUp.</div>
      ) : (
        project.entregables.map((e) => <Deliverable key={e.id} entregable={e} />)
      )}
    </div>
  );
}

// ---------- App principal: fetch de ClickUp + render ----------

export default function PortfolioCX() {
  const [view, setView] = useState("portfolio");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL, { method: "GET" });
        if (!res.ok) {
          throw new Error(`El servicio de ClickUp respondió con estado ${res.status}`);
        }
        const data = await res.json();
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        if (tasks.length === 0) {
          throw new Error("El endpoint respondió sin tareas.");
        }
        const topLevel = tasks.filter((t) => !t.parent);
        const built = topLevel
          .sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }))
          .map((t) => buildProjectFromTask(t, tasks, tasks));
        if (!cancelled) {
          setProjects(built);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "No se pudo conectar con ClickUp.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = projects.length;
  const enFecha = projects.filter((p) => p.semaforoKey === "en fecha").length;
  const conDesvio = projects.filter(
    (p) => p.semaforoKey === "con desvio" || p.semaforoKey === "con desvío" || p.semaforoKey === "en riesgo" || p.semaforoKey === "critico" || p.semaforoKey === "crítico"
  ).length;
  const enEjecucion = projects.filter((p) => p.estado === "EN EJECUCIÓN").length;
  const finalizados = projects.filter((p) => p.estado === "FINALIZADO").length;

  const project = projects.find((p) => p.id === view);

  return (
    <div
      style={{
        background: NAVY,
        minHeight: "100vh",
        padding: "36px 40px 60px",
        fontFamily: sans,
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {loading && (
          <div style={{ color: MUTED, fontFamily: sans, fontSize: 14, padding: "60px 0", textAlign: "center" }}>
            Cargando datos…
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              color: RUST,
              border: `1px solid ${RUST}55`,
              background: `${RUST}15`,
              borderRadius: 6,
              padding: "20px 24px",
              fontFamily: sans,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontFamily: serif, fontSize: 16, marginBottom: 8, color: RUST }}>
              No se pudo cargar el Portfolio CX
            </div>
            No fue posible obtener datos desde ClickUp ({API_URL}). Detalle: {error}
          </div>
        )}

        {!loading && !error && view === "portfolio" && (
          <>
            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: 11.5, color: COPPER, letterSpacing: 1, marginBottom: 8 }}>
                DIRECCIÓN DE EXPERIENCIA DE CLIENTE
              </div>
              <h1 style={{ fontFamily: serif, fontSize: 32, color: PAPER, margin: 0 }}>Portfolio CX</h1>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 34 }}>
              <KpiCard label="Total de proyectos" value={total} />
              <KpiCard label="En fecha" value={enFecha} accent={TEAL} />
              <KpiCard label="Con desvío" value={conDesvio} accent={RUST} />
              <KpiCard label="En ejecución" value={enEjecucion} accent={AMBER} />
              <KpiCard label="Finalizados" value={finalizados} accent="#7BAF8C" />
            </div>

            <div style={{ fontFamily: serif, fontSize: 17, color: PAPER, marginBottom: 14 }}>Proyectos</div>
            {projects.length === 0 ? (
              <div style={{ fontSize: 13, color: MUTED }}>No hay proyectos de nivel superior en la lista de ClickUp.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} onOpen={setView} />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && view !== "portfolio" && project && (
          <ProjectDetail project={project} onBack={() => setView("portfolio")} />
        )}
      </div>
    </div>
  );
}
