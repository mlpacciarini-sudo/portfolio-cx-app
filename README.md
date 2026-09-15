# Portfolio CX — Dashboard ejecutivo

App React (Vite) que muestra el Portfolio CX conectado en vivo al proxy de
ClickUp:

```
https://clickup-proxy-api-ten.vercel.app/api/clickup
```

No usa datos simulados: si el endpoint no responde, el dashboard muestra un
mensaje de error explícito en lugar de datos ficticios.

## Estructura

```
portfolio-cx-app/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── src/
    ├── main.jsx
    └── App.jsx      ← dashboard completo (mismo diseño, misma lógica)
```

## Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 — al cargar, hace `fetch` al endpoint de ClickUp
y renderiza el Portfolio CX con datos reales.

## Desplegar en Vercel

### Opción A — desde la CLI

```bash
npm install -g vercel
cd portfolio-cx-app
vercel
```

Seguí las preguntas del asistente (framework detectado: Vite). Al finalizar
obtenés una URL pública (`https://tu-proyecto.vercel.app`).

Para producción:

```bash
vercel --prod
```

### Opción B — desde GitHub + Vercel Dashboard

1. Subí esta carpeta a un repositorio de GitHub.
2. En https://vercel.com → "Add New Project" → importá el repo.
3. Vercel detecta automáticamente Vite (build command `npm run build`,
   output `dist`). No hace falta configurar nada más — ya está en
   `vercel.json`.
4. "Deploy". En un par de minutos tenés la URL pública.

## QA automatizado (Playwright)

Hay dos suites, separadas a propósito porque prueban cosas distintas:

- **`playwright.config.js`** → tests de UI con datos mockeados (`tests/portfolio.spec.js`),
  deterministas, corren contra un `npm run dev` local. `npm run test:e2e`.
- **`playwright.live.config.js`** → smoke test end-to-end **real**, contra ClickUp,
  el proxy y la app ya desplegada. `npm run test:e2e:live`.

### Test live: round-trip de Prioridad

`tests/live/priority-roundtrip.spec.js` valida que un cambio de Prioridad hecho
directamente en ClickUp (tarea `86akexbw4`) se propaga correctamente hasta el
dashboard desplegado, pasando por el proxy.

Pasos: lee la tarea y guarda su prioridad actual → elige un valor de prueba cuyo
label visible ("Alta"/"Media"/"Baja") sea distinto al original → lo aplica por
API → hace polling al proxy (hasta 60s, cada 3s) hasta ver el cambio → abre
`https://portfolio-cx-app.vercel.app/` → espera a que termine "Cargando
datos…" → busca el proyecto por nombre y valida la Prioridad mostrada → **en
un `finally`, restaura siempre la prioridad original en ClickUp**, incluso si
el test falla. Si algo falla, adjunta al reporte un screenshot y un JSON con
el valor esperado/obtenido y la etapa (`test.step`) donde ocurrió.

Setup:

```bash
cp .env.example .env
# completar CLICKUP_API_TOKEN en .env (nunca se commitea, nunca llega al frontend)
npm run test:e2e:live
```

Este test modifica temporalmente un dato real en ClickUp. Por ahora se corre
solo local (no está en CI); si más adelante se agrega a CI, el token debe
viajar como secret, nunca como variable versionada.

## Notas

- No hay ningún token de ClickUp en el código. Toda la comunicación pasa
  por el proxy de solo lectura en Vercel indicado arriba.
- Al no correr dentro del sandbox de artifacts de Claude, el `fetch()` al
  proxy funciona sin restricciones de red (a diferencia del artifact en
  claude.ai).
- Cada carga o recarga de la página vuelve a consultar el endpoint, por lo
  que los cambios hechos en ClickUp se reflejan automáticamente.
