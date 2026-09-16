PRUEBAS AUTOMÁTICAS DE DATOS DE CLICKUP

Archivo:
tests/clickup-data.test.mjs

Qué valida:
1. El endpoint responde.
2. Llegan proyectos.
3. Cada proyecto tiene nombre, estado, focal y % avance.
4. % avance entre 0 y 100.
5. Estado, Situación y Prioridad usan valores permitidos.
6. Nueva fecha objetivo es válida si existe.
7. No hay proyectos duplicados por ID ni por nombre.

Cómo ejecutarlo localmente:
node --test tests/clickup-data.test.mjs

Requisito:
Node.js 18 o superior, porque usa fetch nativo y node:test.

Opcional:
Se puede cambiar el endpoint sin editar el archivo:
CLICKUP_API_URL="https://otro-endpoint/api/clickup" node --test tests/clickup-data.test.mjs

Catálogos esperados:
Estado:
- NO INICIADO
- EN PREPARACIÓN
- EN EJECUCIÓN
- EN VALIDACIÓN
- EN ANÁLISIS
- FINALIZADO

Situación:
- En fecha
- En atención
- Crítico

Prioridad:
- Alta
- Media
- Baja

IMPORTANTE:
Estas pruebas son intencionalmente estrictas: si un proyecto no tiene Focal,
% Avance, Situación o Prioridad, la prueba falla. Esto sirve como control de
calidad de los datos que alimentan el dashboard.
