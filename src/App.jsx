import React, { useState, useEffect } from "react";

const API_URL = "https://clickup-proxy-api-ten.vercel.app/api/clickup";

// ===== A3 Brand =====
const A3_NAVY = "#001645";
const A3_BLUE = "#0078FF";
const A3_LIGHT = "#EEEFEF";
const A3_GRAY = "#808285";
const WHITE = "#FFFFFF";
const TEXT = "#16325C";
const BORDER = "#DDE3EA";
const ROW_ALT = "#FAFBFC";

const GREEN = "#00A878";
const GREEN_BG = "#DFF6ED";
const YELLOW = "#F2A900";
const YELLOW_BG = "#FFF1CF";
const RED = "#E61E32";
const RED_BG = "#FDE5E8";
const BLUE_BG = "#E7F1FF";
const GRAY_BG = "#EEF1F4";

const font = "'Montserrat', Arial, sans-serif";

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
  if (s.includes("en analisis")) return "EN ANÁLISIS";
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

function formatDateTime(d) {
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}

function dashIfEmpty(v) {
  return v === undefined || v === null || v === "" ? "—" : v;
}

// ---------- Transformación ClickUp -> UI ----------

function buildProjectFromTask(task, entregablesRaw, allTasks) {
  const estado = normalizeEstado(task.status && task.status.status);
  const avance = cfNumberPercent(task, "% Avance");

  const semaforoLabelRaw =
    cfDropdownLabel(task, "Semaforo ejecutivo") ||
    cfDropdownLabel(task, "Semáforo ejecutivo");

  const semaforoKey = semaforoLabelRaw
    ? stripAccents(semaforoLabelRaw.toLowerCase())
    : null;

  const entregables = entregablesRaw
    .filter((e) => e.parent === task.id)
    .sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }))
    .map((e) => buildEntregable(e, allTasks));

  return {
    id: task.id,
    nombre: task.name,
    estado,
    prioridad: normalizePriority(task.priority && task.priority.priority),
    avance,
    sponsor: cfDropdownLabel(task, "Sponsor"),
    focal: cfUsers(task, "Focal"),
    semaforoLabel: semaforoLabelRaw,
    semaforoKey,
    fechaInicio: formatDate(task.start_date),
    fechaObjetivo: cfDate(task, "Fecha objetivo"),
    nuevaFechaObjetivo: cfDate(task, "Nueva fecha objetivo"),
    justificacionDesvio:
      cfText(task, "Justifica desvio") || cfText(task, "Justifica desvío"),
    actualizacion: cfText(task, "Actualización / Novedad"),
    proximoHito:
      cfText(task, "Próximo hito") ||
      cfText(task, "Proximo hito") ||
      cfText(task, "Próximo Hito"),
    fechaUltimaActualizacion: formatDate(task.date_updated),
    rawDateUpdated: task.date_updated ? Number(task.date_updated) : null,
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

// ---------- Estilos ----------

const ESTADO_STYLE = {
  "EN PREPARACIÓN": { bg: GRAY_BG, color: TEXT, label: "En preparación" },
  "EN EJECUCIÓN": { bg: BLUE_BG, color: A3_BLUE, label: "En ejecución" },
  "EN VALIDACIÓN": { bg: BLUE_BG, color: A3_BLUE, label: "En validación" },
  "EN ANÁLISIS": { bg: GRAY_BG, color: TEXT, label: "En análisis" },
  "NO INICIADO": { bg: GRAY_BG, color: A3_GRAY, label: "No iniciado" },
  FINALIZADO: { bg: GREEN_BG, color: GREEN, label: "Finalizado" },
};

function getSituation(project) {
  const k = stripAccents((project.semaforoKey || "").toLowerCase());

  if (k.includes("critico")) {
    return { label: "Crítico", color: RED, bg: RED_BG };
  }

  if (k.includes("con desvio") || k.includes("en riesgo") || k.includes("atencion")) {
    return { label: "En atención", color: YELLOW, bg: YELLOW_BG };
  }

  if (k.includes("en fecha")) {
    return { label: "En fecha", color: GREEN, bg: GREEN_BG };
  }

  return { label: "—", color: A3_GRAY, bg: GRAY_BG };
}

function priorityStyle(p) {
  if (p === "Alta") return { color: RED, bg: RED_BG };
  if (p === "Media") return { color: A3_BLUE, bg: BLUE_BG };
  if (p === "Baja") return { color: TEXT, bg: GRAY_BG };
  return { color: A3_GRAY, bg: GRAY_BG };
}

// ---------- UI ----------

function StatusPill({ bg, color, children, dot = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

function KpiCard({ value, label, tone = "blue", icon }) {
  const map = {
    blue: { fg: A3_BLUE, bg: "#E7F1FF" },
    green: { fg: GREEN, bg: "#DFF6ED" },
    yellow: { fg: YELLOW, bg: "#FFF1CF" },
    red: { fg: RED, bg: "#FDE5E8" },
  };

  const c = map[tone];

  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
        minHeight: 92,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 31,
            lineHeight: 1,
            fontWeight: 700,
            color: A3_NAVY,
            marginBottom: 8,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 14, color: A3_NAVY }}>{label}</div>
      </div>

      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: c.bg,
          display: "grid",
          placeItems: "center",
          color: c.fg,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {icon || "●"}
      </div>
    </div>
  );
}

function Progress({ value }) {
  const v = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div style={{ minWidth: 78 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: A3_NAVY,
          marginBottom: 6,
        }}
      >
        {typeof value === "number" ? `${value}%` : "—"}
      </div>

      <div
        style={{
          height: 6,
          background: "#E6EAF0",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${v}%`,
            background: A3_BLUE,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function PortfolioTable({ projects, onOpen }) {
  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 1450,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: 190 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 120 }} />
          </colgroup>

          <thead>
            <tr style={{ background: "#F4F6F8" }}>
              {[
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
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "14px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: A3_NAVY,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {projects.map((p, idx) => {
              const est =
                ESTADO_STYLE[p.estado] || {
                  bg: GRAY_BG,
                  color: A3_GRAY,
                  label: dashIfEmpty(p.estado),
                };

              const sit = getSituation(p);
              const pri = priorityStyle(p.prioridad);

              return (
                <tr
                  key={p.id}
                  style={{
                    background: idx % 2 === 0 ? WHITE : ROW_ALT,
                  }}
                >
                  <td style={tdStyle}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: A3_NAVY,
                        marginBottom: 4,
                      }}
                    >
                      {p.nombre}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: A3_GRAY,
                      }}
                    >
                      {dashIfEmpty(p.sponsor)}
                    </div>
                  </td>

                  <td style={tdStyle}>{dashIfEmpty(p.focal)}</td>

                  <td style={tdStyle}>
                    <StatusPill bg={est.bg} color={est.color}>
                      {est.label}
                    </StatusPill>
                  </td>

                  <td style={tdStyle}>
                    <StatusPill bg={sit.bg} color={sit.color} dot>
                      {sit.label}
                    </StatusPill>
                  </td>

                  <td style={tdStyle}>
                    <StatusPill bg={pri.bg} color={pri.color}>
                      {dashIfEmpty(p.prioridad)}
                    </StatusPill>
                  </td>

                  <td style={tdStyle}>
                    <Progress value={p.avance} />
                  </td>

                  <td style={tdStyle}>{dashIfEmpty(p.fechaObjetivo)}</td>

                  <td
                    style={{
                      ...tdStyle,
                      color: p.nuevaFechaObjetivo ? RED : TEXT,
                      fontWeight: p.nuevaFechaObjetivo ? 600 : 400,
                    }}
                  >
                    {dashIfEmpty(p.nuevaFechaObjetivo)}
                  </td>

                  <td style={{ ...tdStyle, lineHeight: 1.45 }}>
                    {dashIfEmpty(p.actualizacion)}
                  </td>

                  <td style={{ ...tdStyle, lineHeight: 1.45 }}>
                    {dashIfEmpty(p.proximoHito)}
                  </td>

                  <td style={tdStyle}>
                    <button
                      onClick={() => onOpen(p.id)}
                      style={{
                        border: `1px solid ${A3_BLUE}`,
                        color: A3_BLUE,
                        background: WHITE,
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: font,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Ver ficha →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tdStyle = {
  padding: "14px",
  fontSize: 12,
  color: TEXT,
  borderBottom: `1px solid ${BORDER}`,
  verticalAlign: "middle",
};

// ---------- Ficha existente, simplificada ----------

function FactItem({ label, value }) {
  if (value === undefined || value === null || value === "" || value === "No aplica")
    return null;

  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 11, color: A3_GRAY, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: A3_NAVY }}>{value}</div>
    </div>
  );
}

function ProjectDetail({ project, onBack }) {
  const est =
    ESTADO_STYLE[project.estado] || {
      bg: GRAY_BG,
      color: A3_GRAY,
      label: dashIfEmpty(project.estado),
    };

  const sit = getSituation(project);

  return (
    <div
      style={{
        background: "#F7F9FB",
        minHeight: "100vh",
        padding: "34px 40px 60px",
        fontFamily: font,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: A3_BLUE,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            marginBottom: 22,
            fontFamily: font,
          }}
        >
          ← Volver al portfolio
        </button>

        <h1
          style={{
            color: A3_NAVY,
            fontSize: 28,
            margin: "0 0 14px",
          }}
        >
          {project.nombre}
        </h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <StatusPill bg={est.bg} color={est.color}>
            {est.label}
          </StatusPill>
          <StatusPill bg={sit.bg} color={sit.color} dot>
            {sit.label}
          </StatusPill>
        </div>

        <div
          style={{
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: "0 28px",
            }}
          >
            <FactItem label="Responsable" value={project.focal} />
            <FactItem label="Sponsor" value={project.sponsor} />
            <FactItem label="Estado" value={est.label} />
            <FactItem label="Situación" value={sit.label} />
            <FactItem label="Prioridad" value={project.prioridad} />
            <FactItem label="% Avance" value={project.avance != null ? `${project.avance}%` : null} />
            <FactItem label="Fecha objetivo" value={project.fechaObjetivo} />
            <FactItem label="Nueva fecha" value={project.nuevaFechaObjetivo} />
            <FactItem label="Próximo hito" value={project.proximoHito} />
            <FactItem label="Última actualización" value={project.fechaUltimaActualizacion} />
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, color: A3_GRAY, marginBottom: 6 }}>
              Última novedad
            </div>
            <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>
              {dashIfEmpty(project.actualizacion)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- App ----------

export default function PortfolioCX() {
  const [view, setView] = useState("portfolio");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(API_URL, { method: "GET" });

        if (!res.ok) {
          throw new Error(
            `El servicio de ClickUp respondió con estado ${res.status}`
          );
        }

        const data = await res.json();
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];

        if (tasks.length === 0) {
          throw new Error("El endpoint respondió sin tareas.");
        }

        const topLevel = tasks.filter((t) => !t.parent);

        const built = topLevel
          .sort((a, b) =>
            a.name.localeCompare(b.name, "es", { numeric: true })
          )
          .map((t) => buildProjectFromTask(t, tasks, tasks));

        if (!cancelled) {
          setProjects(built);
          setLoadedAt(new Date());
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

  const activos = projects.filter((p) => p.estado !== "FINALIZADO").length;
  const enFecha = projects.filter((p) => getSituation(p).label === "En fecha").length;
  const enAtencion = projects.filter((p) => getSituation(p).label === "En atención").length;
  const criticos = projects.filter((p) => getSituation(p).label === "Crítico").length;

  const project = projects.find((p) => p.id === view);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: font,
          color: A3_GRAY,
          background: "#F7F9FB",
        }}
      >
        Cargando datos…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: font,
          background: "#F7F9FB",
          padding: 30,
        }}
      >
        <div
          style={{
            maxWidth: 700,
            background: WHITE,
            border: `1px solid ${RED_BG}`,
            borderRadius: 12,
            padding: 24,
            color: RED,
          }}
        >
          <strong>No se pudo cargar el Portfolio CX.</strong>
          <div style={{ marginTop: 8, color: TEXT }}>{error}</div>
        </div>
      </div>
    );
  }

  if (view !== "portfolio" && project) {
    return <ProjectDetail project={project} onBack={() => setView("portfolio")} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F9FB",
        fontFamily: font,
        color: TEXT,
      }}
    >
      <header
        style={{
          background: A3_NAVY,
          color: WHITE,
          padding: "22px 34px",
        }}
      >
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingRight: 24,
                borderRight: "1px solid rgba(255,255,255,.35)",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: -2,
                }}
              >
                A<span style={{ color: A3_BLUE }}>3</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Mercados</div>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              Portfolio de Proyectos CX
            </h1>
          </div>

          <div
            style={{
              textAlign: "right",
              fontSize: 12,
              lineHeight: 1.45,
              opacity: 0.95,
            }}
          >
            <div>Última actualización</div>
            <div>{formatDateTime(loadedAt)}</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1500, margin: "0 auto", padding: "24px 30px 34px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 18,
            marginBottom: 22,
          }}
        >
          <KpiCard value={activos} label="Proyectos activos" tone="blue" icon="▣" />
          <KpiCard value={enFecha} label="En fecha" tone="green" />
          <KpiCard value={enAtencion} label="En atención" tone="yellow" />
          <KpiCard value={criticos} label="Crítico" tone="red" />
        </div>

        <PortfolioTable projects={projects} onOpen={setView} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            fontSize: 12,
            color: A3_NAVY,
          }}
        >
          <div>{projects.length} proyectos en total</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Mostrar</span>
            <span
              style={{
                border: `1px solid ${BORDER}`,
                background: WHITE,
                borderRadius: 8,
                padding: "7px 10px",
                minWidth: 36,
                textAlign: "center",
              }}
            >
              10
            </span>
            <span>proyectos</span>
          </div>
        </div>
      </main>
    </div>
  );
}
