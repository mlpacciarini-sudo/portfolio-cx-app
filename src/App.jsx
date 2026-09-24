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


const RESPONSIVE_CSS = `
  * { box-sizing: border-box; }
  html, body, #root { width: 100%; max-width: 100%; margin: 0; overflow-x: hidden; }

  .a3-shell { width: 100%; max-width: 100%; overflow-x: hidden; }

  .a3-header-inner,
  .project-header-inner {
    width: 100%;
  }

  .portfolio-table-desktop {
    display: block;
    width: 100%;
    max-width: 100%;
  }

  .portfolio-cards-responsive {
    display: none;
  }

  .portfolio-table-desktop table {
    width: 100% !important;
    min-width: 0 !important;
  }

  .portfolio-table-desktop th,
  .portfolio-table-desktop td {
    overflow-wrap: anywhere;
    word-break: normal;
  }

  .portfolio-table-desktop button {
    max-width: 100%;
  }

  .a3-shell button {
    min-height: 40px;
    transition: box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
  }

  .a3-shell button:hover {
    box-shadow: 0 3px 10px rgba(0, 22, 69, 0.10);
  }

  .a3-shell button:active {
    transform: translateY(1px);
  }

  .a3-shell button:focus-visible {
    outline: 3px solid rgba(0, 120, 255, 0.32);
    outline-offset: 2px;
  }

  .kpi-card {
    min-height: 74px !important;
    padding: 13px 16px !important;
    border-radius: 10px !important;
  }

  .kpi-number {
    font-size: 27px !important;
    margin-bottom: 5px !important;
  }

  .kpi-label {
    font-size: 12px !important;
    line-height: 1.2 !important;
  }

  .kpi-icon {
    width: 36px !important;
    height: 36px !important;
    font-size: 15px !important;
  }

  @media (max-width: 1399px) {
    .kpi-grid {
      gap: 12px !important;
      margin-bottom: 16px !important;
    }

    .kpi-card {
      min-height: 70px !important;
      padding: 12px 14px !important;
    }

    .portfolio-main,
    .project-main {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }

    .portfolio-table-desktop th,
    .portfolio-table-desktop td {
      padding-left: 9px !important;
      padding-right: 9px !important;
      font-size: 11px !important;
    }

    .portfolio-table-desktop button {
      padding: 7px 9px !important;
      font-size: 11px !important;
    }

    .portfolio-table-desktop .status-pill {
      padding: 5px 7px !important;
      font-size: 11px !important;
    }
  }

  @media (max-width: 1099px) {
    .portfolio-table-desktop {
      display: none;
    }

    .portfolio-cards-responsive {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      width: 100%;
    }

    .kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .project-detail-head {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
    }

    .project-detail-progress {
      grid-column: 1 / -1;
      border-left: 0 !important;
      border-top: 1px solid #DDE3EA;
      padding-left: 0 !important;
      padding-top: 16px;
    }

    .executive-summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 16px 12px !important;
      overflow-x: visible !important;
    }

    .activity-row,
    .activity-header {
      grid-template-columns: minmax(0, 1fr) 150px 190px !important;
      gap: 12px !important;
    }
  }

  @media (max-width: 767px) {
    .a3-shell button {
      min-height: 44px;
    }

    .mobile-clamp {
      display: -webkit-box !important;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden !important;
    }

    .a3-header,
    .project-header {
      padding: 16px 18px !important;
    }

    .a3-header-inner,
    .project-header-inner {
      align-items: flex-start !important;
      flex-direction: column !important;
      gap: 14px !important;
    }

    .a3-brand-title {
      width: 100%;
      align-items: flex-start !important;
      gap: 14px !important;
    }

    .a3-brand {
      padding-right: 14px !important;
      flex-shrink: 0;
    }

    .a3-page-title {
      font-size: 21px !important;
      line-height: 1.2 !important;
    }

    .a3-updated {
      text-align: left !important;
      width: 100%;
    }

    .portfolio-main,
    .project-main {
      padding: 12px 12px 22px !important;
    }

    .kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      margin-bottom: 12px !important;
    }

    .kpi-card {
      min-height: 62px !important;
      padding: 10px 12px !important;
    }

    .kpi-number {
      font-size: 24px !important;
      margin-bottom: 3px !important;
    }

    .kpi-label {
      font-size: 11px !important;
    }

    .kpi-icon {
      width: 32px !important;
      height: 32px !important;
      font-size: 13px !important;
    }

    .portfolio-cards-responsive {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .project-card {
      padding: 13px !important;
    }

    .project-card-meta {
      grid-template-columns: 1fr 1fr !important;
      gap: 10px !important;
    }

    .project-card-wide {
      grid-column: 1 / -1;
    }

    .mobile-detail-only {
      display: none !important;
    }

    .portfolio-footer {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 10px !important;
    }

    .project-detail-head {
      grid-template-columns: 1fr !important;
      padding: 16px !important;
    }

    .project-detail-progress {
      grid-column: auto;
    }

    .project-detail-title {
      font-size: 23px !important;
    }

    .executive-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px 8px !important;
    }

    .deliverables-title-row {
      align-items: flex-start !important;
      flex-direction: column !important;
      gap: 6px !important;
    }

    .deliverable-button {
      align-items: flex-start !important;
      gap: 10px !important;
    }

    .deliverable-button-meta {
      gap: 8px !important;
    }

    .deliverable-name {
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: clip !important;
    }

    .activity-header {
      display: none !important;
    }

    .activity-row {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 10px !important;
      padding: 14px !important;
    }
  }

  @media (max-width: 359px) {
    .kpi-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 479px) {
    .a3-brand-title {
      flex-direction: column !important;
      gap: 10px !important;
    }

    .a3-brand {
      border-right: 0 !important;
      padding-right: 0 !important;
    }

    .a3-page-title {
      font-size: 20px !important;
    }

    .executive-summary-grid {
      grid-template-columns: 1fr !important;
    }

    .project-card-meta {
      grid-template-columns: 1fr !important;
    }

    .project-card-wide {
      grid-column: auto;
    }
  }
`;

function ResponsiveStyles() {
  return <style>{RESPONSIVE_CSS}</style>;
}

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
  if (s.includes("on hold") || s.includes("en pausa")) return "EN PAUSA";
  if (s.includes("finalizado") || s.includes("done") || s.includes("closed")) return "FINALIZADO";
  return (rawStatus || "").toUpperCase() || null;
}

function estadoDesdeHijos(hijos, estadoActual) {
  if (!hijos.length) return estadoActual;
  if (hijos.every((h) => h.estado === "FINALIZADO")) return "FINALIZADO";
  if (estadoActual === "EN PAUSA") return "EN PAUSA";
  if (hijos.every((h) => h.estado === "NO INICIADO")) {
    return ["EN PREPARACIÓN", "EN ANÁLISIS"].includes(estadoActual)
      ? estadoActual
      : "NO INICIADO";
  }
  if (
    hijos.some((h) => h.estado === "EN PAUSA") &&
    hijos.every((h) => ["NO INICIADO", "EN PAUSA", "FINALIZADO"].includes(h.estado))
  ) return "EN PAUSA";
  return "EN EJECUCIÓN";
}

function avanceDesdeEstado(estado, avanceManual) {
  if (estado === "FINALIZADO") return 100;
  if (estado === "NO INICIADO") return 0;
  return typeof avanceManual === "number" && avanceManual >= 0 && avanceManual <= 100
    ? avanceManual
    : null;
}

function promedioAvances(hijos) {
  if (!hijos.length || hijos.some((n) => typeof n !== "number" || !Number.isFinite(n))) return null;
  return Math.round((hijos.reduce((sum, n) => sum + n, 0) / hijos.length) * 10) / 10;
}

function nombreEstado(estado) {
  return ESTADO_STYLE[estado]?.label || estado || "Sin estado";
}

function alertasDeAvance(nombre, estado, manual, calculado, tieneHijos) {
  const alertas = [];
  if (manual !== null && (manual < 0 || manual > 100)) {
    alertas.push(`${nombre}: el % Avance en ClickUp está fuera de 0–100.`);
  } else if (estado === "NO INICIADO" && manual !== null && manual !== 0) {
    alertas.push(`${nombre}: figura No iniciado, pero tiene ${manual}% cargado en ClickUp.`);
  } else if (estado === "FINALIZADO" && manual !== null && manual !== 100) {
    alertas.push(`${nombre}: figura Finalizado, pero tiene ${manual}% cargado en ClickUp.`);
  } else if (!tieneHijos && !["NO INICIADO", "FINALIZADO"].includes(estado) && manual === null) {
    alertas.push(`${nombre}: falta cargar % Avance en ClickUp.`);
  }
  if (tieneHijos && manual !== null && calculado !== null && Math.abs(manual - calculado) > 0.1) {
    alertas.push(`${nombre}: ClickUp indica ${manual}% y las actividades calculan ${calculado}%.`);
  }
  return alertas;
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
  const estadoClickUp = normalizeEstado(task.status && task.status.status);
  const avanceManualProyecto = cfNumberPercent(task, "% Avance");

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

  const estado = estadoDesdeHijos(entregables, estadoClickUp);

  const avancesEntregables = entregables.map((e) => e.avanceCalculado);

  const avanceCalculado =
    avancesEntregables.length > 0
      ? promedioAvances(avancesEntregables)
      : avanceDesdeEstado(estado, avanceManualProyecto);

  const alertasClickUp = [];
  if (estadoClickUp !== estado) {
    alertasClickUp.push(`Proyecto: en ClickUp figura ${nombreEstado(estadoClickUp)}; según sus entregables corresponde ${nombreEstado(estado)}.`);
  }
  if (semaforoKey?.includes("en fecha") && getSituation({ estado, estrategico: cfDropdownLabel(task, "Estratégico"), semaforoKey, fechaObjetivo: cfDate(task, "Fecha objetivo"), nuevaFechaObjetivo: cfDate(task, "Nueva fecha objetivo") }).detail?.includes("vencido")) {
    alertasClickUp.push("Proyecto: el semáforo en ClickUp dice En fecha, pero la fecha objetivo vigente ya venció.");
  }
  alertasClickUp.push(...alertasDeAvance("Proyecto", estadoClickUp, avanceManualProyecto, avanceCalculado, entregables.length > 0));
  entregables.forEach((e) => alertasClickUp.push(...e.alertasClickUp));

  return {
    id: task.id,
    nombre: task.name,
    estado,
    estrategico: cfDropdownLabel(task, "Estratégico") || "Sin definir",
    avance: avanceCalculado,
    avanceManual: avanceManualProyecto,
    alertasClickUp,
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
  const estadoClickUp = normalizeEstado(task.status && task.status.status);
  const avanceManualEntregable = cfNumberPercent(task, "% Avance");

  const actividades = allTasks
    .filter((a) => a.parent === task.id)
    .sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }))
    .map((a) => ({
      id: a.id,
      nombre: a.name,
      estado: normalizeEstado(a.status && a.status.status),
      avanceManual: cfNumberPercent(a, "% Avance"),
      avance: avanceDesdeEstado(
        normalizeEstado(a.status && a.status.status),
        cfNumberPercent(a, "% Avance")
      ),
    }));

  const estado = estadoDesdeHijos(
    actividades,
    estadoClickUp
  );

  const avancesActividades = actividades.map((a) => a.avance);

  const avanceCalculado =
    avancesActividades.length > 0
      ? promedioAvances(avancesActividades)
      : avanceDesdeEstado(estado, avanceManualEntregable);

  const alertasClickUp = [];
  if (estadoClickUp !== estado) {
    alertasClickUp.push(`Entregable ${task.name}: en ClickUp figura ${nombreEstado(estadoClickUp)}; según sus actividades corresponde ${nombreEstado(estado)}.`);
  }
  alertasClickUp.push(...alertasDeAvance(`Entregable ${task.name}`, estadoClickUp, avanceManualEntregable, avanceCalculado, actividades.length > 0));
  actividades.forEach((a) => {
    alertasClickUp.push(...alertasDeAvance(`Actividad ${a.nombre}`, a.estado, a.avanceManual, a.avance, false));
  });

  return {
    id: task.id,
    nombre: task.name,
    estado,
    avanceCalculado,
    avanceManual: avanceManualEntregable,
    alertasClickUp,
    actividades,
  };
}

// ---------- Estilos ----------

const ESTADO_STYLE = {
  "EN PREPARACIÓN": { bg: GRAY_BG, color: TEXT, label: "En preparación" },
  "EN EJECUCIÓN": { bg: BLUE_BG, color: A3_BLUE, label: "En ejecución" },
  "EN VALIDACIÓN": { bg: BLUE_BG, color: A3_BLUE, label: "En validación" },
  "EN ANÁLISIS": { bg: GRAY_BG, color: TEXT, label: "En análisis" },
  "EN PAUSA": { bg: YELLOW_BG, color: YELLOW, label: "En pausa" },
  "NO INICIADO": { bg: GRAY_BG, color: A3_GRAY, label: "No iniciado" },
  FINALIZADO: { bg: GREEN_BG, color: GREEN, label: "Finalizado" },
};

function getSituation(project) {
  const k = stripAccents((project.semaforoKey || "").toLowerCase());
  const target = project.nuevaFechaObjetivo || project.fechaObjetivo;
  const parts = target && /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(target);
  const dueDate = parts
    ? new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]))
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue =
    project.estado !== "FINALIZADO" &&
    dueDate &&
    dueDate.getDate() === Number(parts[1]) &&
    dueDate.getMonth() === Number(parts[2]) - 1 &&
    dueDate.getFullYear() === Number(parts[3]) &&
    dueDate < today;
  const strategic = stripAccents(String(project.estrategico || "").toLowerCase()) === "si";

  if (k.includes("critico")) {
    return { label: "Crítico", color: RED, bg: RED_BG, detail: overdue ? "Plazo vencido" : null };
  }

  if (overdue && strategic) {
    return { label: "Crítico", color: RED, bg: RED_BG, detail: "Estratégico · plazo vencido" };
  }

  if (k.includes("con desvio") || k.includes("en riesgo") || k.includes("atencion")) {
    return { label: "En atención", color: YELLOW, bg: YELLOW_BG, detail: overdue ? "Plazo vencido" : null };
  }

  if (overdue) {
    return { label: "En atención", color: YELLOW, bg: YELLOW_BG, detail: "Plazo vencido" };
  }

  if (k.includes("en fecha")) {
    return { label: "En fecha", color: GREEN, bg: GREEN_BG };
  }

  return { label: "—", color: A3_GRAY, bg: GRAY_BG };
}

function strategicStyle(value) {
  const normalized = stripAccents(String(value || "").toLowerCase());
  if (normalized === "si") return { color: A3_BLUE, bg: BLUE_BG };
  if (normalized === "no") return { color: TEXT, bg: GRAY_BG };
  return { color: A3_GRAY, bg: GRAY_BG };
}

// ---------- UI ----------

function StatusPill({ bg, color, children, dot = false }) {
  return (
    <span
      className="status-pill"
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
      className="kpi-card"
      style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: "13px 16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.035)",
        minHeight: 74,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          className="kpi-number"
          style={{
            fontSize: 27,
            lineHeight: 1,
            fontWeight: 700,
            color: A3_NAVY,
            marginBottom: 5,
          }}
        >
          {value}
        </div>
        <div className="kpi-label" style={{ fontSize: 12, lineHeight: 1.2, color: A3_NAVY }}>{label}</div>
      </div>

      <div
        className="kpi-icon"
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: c.bg,
          display: "grid",
          placeItems: "center",
          color: c.fg,
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
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
      className="portfolio-table-desktop"
      style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "100%" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 0,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>

          <thead>
            <tr style={{ background: "#F4F6F8" }}>
              {[
                "Proyecto",
                "Responsable",
                "Estado",
                "Situación",
                "Estratégico",
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
              const strategic = strategicStyle(p.estrategico);

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
                    {p.alertasClickUp.length > 0 && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9A5700", marginTop: 5 }}>
                        ⚠ Revisar ClickUp ({p.alertasClickUp.length})
                      </div>
                    )}
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
                    {sit.detail && <div style={{ fontSize: 11, color: sit.color, marginTop: 4 }}>{sit.detail}</div>}
                  </td>

                  <td style={tdStyle}>
                    <StatusPill bg={strategic.bg} color={strategic.color}>
                      {dashIfEmpty(p.estrategico)}
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


function ProjectCards({ projects, onOpen }) {
  return (
    <div className="portfolio-cards-responsive">
      {projects.map((p) => {
        const est =
          ESTADO_STYLE[p.estado] || {
            bg: GRAY_BG,
            color: A3_GRAY,
            label: dashIfEmpty(p.estado),
          };
        const sit = getSituation(p);
        const strategic = strategicStyle(p.estrategico);

        return (
          <article
            key={p.id}
            className="project-card"
            style={{
              background: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 18,
              boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: A3_NAVY,
                    fontWeight: 700,
                    fontSize: 16,
                    overflowWrap: "anywhere",
                  }}
                >
                  {p.nombre}
                </div>
                <div style={{ color: A3_GRAY, fontSize: 11, marginTop: 4 }}>
                  {dashIfEmpty(p.sponsor)}
                </div>
                {p.alertasClickUp.length > 0 && (
                  <div style={{ color: "#9A5700", fontSize: 11, fontWeight: 700, marginTop: 5 }}>
                    ⚠ Revisar ClickUp ({p.alertasClickUp.length})
                  </div>
                )}
              </div>

              <button
                aria-label={`Ver ficha de ${p.nombre}`}
                onClick={() => onOpen(p.id)}
                style={{
                  border: `1px solid ${A3_BLUE}`,
                  color: A3_BLUE,
                  background: WHITE,
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: font,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Ver ficha →
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <StatusPill bg={est.bg} color={est.color}>
                {est.label}
              </StatusPill>
              <StatusPill bg={sit.bg} color={sit.color} dot>
                {sit.label}
              </StatusPill>
              {sit.detail && <span style={{ color: sit.color, fontSize: 11, alignSelf: "center" }}>{sit.detail}</span>}
              <StatusPill bg={strategic.bg} color={strategic.color}>
                {dashIfEmpty(p.estrategico)}
              </StatusPill>
            </div>

            <div
              className="project-card-meta"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              <div>
                <div style={cardLabelStyle}>Responsable</div>
                <div style={cardValueStyle}>{dashIfEmpty(p.focal)}</div>
              </div>

              <div>
                <div style={cardLabelStyle}>% Avance</div>
                <Progress value={p.avance} />
              </div>

              <div>
                <div style={cardLabelStyle}>Fecha objetivo</div>
                <div style={cardValueStyle}>{dashIfEmpty(p.fechaObjetivo)}</div>
              </div>

              <div>
                <div style={cardLabelStyle}>Nueva fecha</div>
                <div
                  style={{
                    ...cardValueStyle,
                    color: p.nuevaFechaObjetivo ? RED : TEXT,
                    fontWeight: p.nuevaFechaObjetivo ? 700 : 600,
                  }}
                >
                  {dashIfEmpty(p.nuevaFechaObjetivo)}
                </div>
              </div>

              <div className="project-card-wide mobile-detail-only" style={{ gridColumn: "1 / -1" }}>
                <div style={cardLabelStyle}>Última novedad</div>
                <div className="mobile-clamp" title={dashIfEmpty(p.actualizacion)} style={cardValueStyle}>{dashIfEmpty(p.actualizacion)}</div>
              </div>

              <div className="project-card-wide mobile-detail-only" style={{ gridColumn: "1 / -1" }}>
                <div style={cardLabelStyle}>Próximo hito</div>
                <div className="mobile-clamp" title={dashIfEmpty(p.proximoHito)} style={cardValueStyle}>{dashIfEmpty(p.proximoHito)}</div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const cardLabelStyle = {
  color: A3_GRAY,
  fontSize: 11,
  fontWeight: 600,
  marginBottom: 5,
};

const cardValueStyle = {
  color: TEXT,
  fontSize: 13,
  lineHeight: 1.45,
  fontWeight: 600,
  overflowWrap: "anywhere",
};

const tdStyle = {
  padding: "14px",
  fontSize: 12,
  color: TEXT,
  borderBottom: `1px solid ${BORDER}`,
  verticalAlign: "middle",
};

// ---------- Ficha de proyecto ----------

function SummaryItem({ icon, label, value, tone = "blue", emphasis = false }) {
  if (value === undefined || value === null || value === "" || value === "No aplica") {
    return null;
  }

  const tones = {
    blue: { fg: A3_BLUE, bg: BLUE_BG },
    red: { fg: RED, bg: RED_BG },
    yellow: { fg: YELLOW, bg: YELLOW_BG },
  };

  const c = tones[tone] || tones.blue;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        minWidth: 0,
        padding: "2px 14px 2px 0",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: c.bg,
          color: c.fg,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          fontSize: 17,
          fontWeight: 700,
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: A3_GRAY,
            marginBottom: 5,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13,
            color: emphasis ? RED : A3_NAVY,
            lineHeight: 1.45,
            fontWeight: emphasis ? 700 : 600,
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity }) {
  const est =
    ESTADO_STYLE[activity.estado] || {
      bg: GRAY_BG,
      color: A3_GRAY,
      label: dashIfEmpty(activity.estado),
    };

  return (
    <div
      className="activity-row"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px, 1fr) 180px 250px",
        gap: 20,
        alignItems: "center",
        padding: "11px 14px",
        borderTop: `1px solid ${BORDER}`,
        background: WHITE,
      }}
    >
      <div style={{ fontSize: 13, color: TEXT }}>{activity.nombre}</div>

      <div>
        <StatusPill bg={est.bg} color={est.color} dot>
          {est.label}
        </StatusPill>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 42,
            fontSize: 12,
            fontWeight: 700,
            color: A3_NAVY,
            flexShrink: 0,
          }}
        >
          {activity.avance != null ? `${activity.avance}%` : "—"}
        </div>

        <div
          style={{
            height: 7,
            background: "#E6EAF0",
            borderRadius: 999,
            overflow: "hidden",
            flex: 1,
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, activity.avance ?? 0))}%`,
              height: "100%",
              background: A3_BLUE,
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Deliverable({ entregable, number, initialOpen = false }) {
  const [open, setOpen] = useState(initialOpen);
  const count = entregable.actividades.length;

  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        overflow: "hidden",
        background: WHITE,
        marginTop: 10,
      }}
    >
      <button
        className="deliverable-button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          border: "none",
          background: WHITE,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          cursor: "pointer",
          fontFamily: font,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: number === 1 ? A3_BLUE : "#758AA8",
              color: WHITE,
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {number}
          </div>

          <div
            className="deliverable-name"
            style={{
              color: A3_NAVY,
              fontSize: 14,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entregable.nombre}
          </div>
        </div>

        <div className="deliverable-button-meta" style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <span
            style={{
              background: BLUE_BG,
              color: TEXT,
              padding: "5px 9px",
              borderRadius: 999,
              fontSize: 11,
            }}
          >
            {count} {count === 1 ? "actividad" : "actividades"}
          </span>
          <span style={{ color: A3_NAVY, fontSize: 16 }}>{open ? "⌃" : "⌄"}</span>
        </div>
      </button>

      {open && (
        <div>
          <div
            className="activity-header"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(260px, 1fr) 180px 250px",
              gap: 20,
              padding: "9px 14px",
              background: "#F4F6F8",
              color: A3_NAVY,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <div>Actividad</div>
            <div>Estado</div>
            <div>% Avance</div>
          </div>

          {count === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: A3_GRAY }}>
              Sin actividades cargadas.
            </div>
          ) : (
            entregable.actividades.map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProjectHeader() {
  return (
    <header
      className="project-header"
      style={{
        background: A3_NAVY,
        color: WHITE,
        padding: "22px 34px",
      }}
    >
      <div
        className="project-header-inner"
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div className="a3-brand-title" style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            className="a3-brand"
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

          <div
            className="a3-page-title"
            style={{
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Portfolio de Proyectos CX
          </div>
        </div>
      </div>
    </header>
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
  const strategic = strategicStyle(project.estrategico);

  return (
    <div
      className="a3-shell"
      style={{
        minHeight: "100vh",
        background: "#F7F9FB",
        fontFamily: font,
        color: TEXT,
      }}
    >
      <ResponsiveStyles />
      <ProjectHeader />

      <main
        className="project-main"
        style={{
          maxWidth: 1500,
          margin: "0 auto",
          padding: "18px 30px 40px",
        }}
      >
        <button
          aria-label="Volver al portfolio"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: A3_BLUE,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            padding: "4px 0",
            marginBottom: 14,
            fontFamily: font,
          }}
        >
          ← Volver al portfolio
        </button>

        {/* Cabecera del proyecto */}
        <section
          className="project-detail-head"
          style={{
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "18px 20px",
            display: "grid",
            gridTemplateColumns: "minmax(300px, 1.3fr) minmax(600px, 2fr) 250px",
            gap: 20,
            alignItems: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          }}
        >
          <h1
            className="project-detail-title"
            style={{
              margin: 0,
              color: A3_NAVY,
              fontSize: 27,
              lineHeight: 1.15,
              fontWeight: 700,
            }}
          >
            {project.nombre}
          </h1>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatusPill bg={est.bg} color={est.color}>
              Estado: {est.label}
            </StatusPill>

            <StatusPill bg={sit.bg} color={sit.color}>
              Situación: {sit.label}
            </StatusPill>
            {sit.detail && <span style={{ color: sit.color, fontSize: 12, alignSelf: "center" }}>{sit.detail}</span>}

            <StatusPill bg={strategic.bg} color={strategic.color}>
              Estratégico: {project.estrategico}
            </StatusPill>
          </div>

          <div
            className="project-detail-progress"
            style={{
              borderLeft: `1px solid ${BORDER}`,
              paddingLeft: 22,
            }}
          >
            <div style={{ fontSize: 11, color: A3_GRAY, marginBottom: 6, fontWeight: 600 }}>
              % Avance
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  color: A3_NAVY,
                  fontSize: 28,
                  fontWeight: 700,
                  minWidth: 62,
                }}
              >
                {project.avance != null ? `${project.avance}%` : "—"}
              </div>

              <div
                style={{
                  flex: 1,
                  height: 9,
                  background: "#E6EAF0",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, project.avance || 0))}%`,
                    height: "100%",
                    background: A3_BLUE,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {project.alertasClickUp.length > 0 && (
          <section aria-label="Revisar ClickUp" style={{ background: YELLOW_BG, border: `1px solid ${YELLOW}`, borderRadius: 10, marginTop: 12, padding: "14px 18px", color: TEXT }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠ Revisar ClickUp</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.5 }}>
              {project.alertasClickUp.map((alerta, i) => <li key={i}>{alerta}</li>)}
            </ul>
          </section>
        )}

        {/* Resumen ejecutivo */}
        <section
          style={{
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "16px 18px 18px",
            marginTop: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: A3_NAVY,
              marginBottom: 16,
            }}
          >
            Resumen ejecutivo
          </div>

          <div
            className="executive-summary-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(150px, 1fr))",
              gap: 0,
              overflowX: "auto",
            }}
          >
            <SummaryItem icon="♙" label="Responsable" value={project.focal} />
            <SummaryItem icon="♟" label="Sponsor" value={project.sponsor} />
            <SummaryItem icon="□" label="Fecha objetivo" value={project.fechaObjetivo} />
            <SummaryItem
              icon="□"
              label="Nueva fecha"
              value={project.nuevaFechaObjetivo}
              tone="red"
              emphasis={Boolean(project.nuevaFechaObjetivo)}
            />
            <SummaryItem icon="⚑" label="Próximo hito" value={project.proximoHito} />
            <SummaryItem
              icon="▤"
              label="Última novedad"
              value={
                project.actualizacion
                  ? `${project.fechaUltimaActualizacion || ""}${project.fechaUltimaActualizacion ? " — " : ""}${project.actualizacion}`
                  : null
              }
            />
            <SummaryItem
              icon="△"
              label="Bloqueo / alerta"
              value={project.justificacionDesvio}
              tone="yellow"
            />
          </div>
        </section>

        {/* Entregables */}
        <section
          style={{
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "16px 18px 18px",
            marginTop: 16,
            boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="deliverables-title-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: A3_NAVY,
              }}
            >
              Entregables e hitos
            </div>

            <div style={{ fontSize: 12, color: A3_GRAY }}>
              {project.entregables.length}{" "}
              {project.entregables.length === 1 ? "entregable" : "entregables"} en total
            </div>
          </div>

          {project.entregables.length === 0 ? (
            <div style={{ marginTop: 14, fontSize: 13, color: A3_GRAY }}>
              Este proyecto no tiene entregables cargados en ClickUp.
            </div>
          ) : (
            project.entregables.map((e, index) => (
              <Deliverable
                key={e.id}
                entregable={e}
                number={index + 1}
                initialOpen={index === 0}
              />
            ))
          )}
        </section>
      </main>
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
      className="a3-shell"
      style={{
        minHeight: "100vh",
        background: "#F7F9FB",
        fontFamily: font,
        color: TEXT,
      }}
    >
      <ResponsiveStyles />
      <header
        className="a3-header"
        style={{
          background: A3_NAVY,
          color: WHITE,
          padding: "22px 34px",
        }}
      >
        <div
          className="a3-header-inner"
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div className="a3-brand-title" style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              className="a3-brand"
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
              className="a3-page-title"
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
            className="a3-updated"
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

      <main className="portfolio-main" style={{ maxWidth: 1500, margin: "0 auto", padding: "24px 30px 34px" }}>
        <div
          className="kpi-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <KpiCard value={activos} label="Proyectos activos" tone="blue" icon="▣" />
          <KpiCard value={enFecha} label="En fecha" tone="green" />
          <KpiCard value={enAtencion} label="En atención" tone="yellow" />
          <KpiCard value={criticos} label="Crítico" tone="red" />
        </div>

        <PortfolioTable projects={projects} onOpen={setView} />
        <ProjectCards projects={projects} onOpen={setView} />

        <div
          className="portfolio-footer"
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
