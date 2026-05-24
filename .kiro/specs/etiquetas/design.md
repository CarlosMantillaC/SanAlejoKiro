# Diseño — Etiquetas / Categorías para Objetos

## Resumen técnico

Esta sección detalla el esquema de la base de datos, las APIs de repositorio y los cambios UI propuestos para soportar Etiquetas como entidad y la relación N:M con `Objeto`.

---

## Esquema de base de datos (SQL)

Se propone agregar las siguientes sentencias SQL en la migración:

1. Tabla `etiqueta`:

```sql
CREATE TABLE IF NOT EXISTS etiqueta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  fecha_creacion INTEGER NOT NULL DEFAULT 0
);
```

2. Tabla puente `objeto_etiqueta`:

```sql
CREATE TABLE IF NOT EXISTS objeto_etiqueta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_objeto INTEGER NOT NULL,
  id_etiqueta INTEGER NOT NULL,
  FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE,
  FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id) ON DELETE CASCADE,
  UNIQUE (id_objeto, id_etiqueta)
);
CREATE INDEX IF NOT EXISTS idx_objeto_etiqueta_objeto ON objeto_etiqueta(id_objeto);
CREATE INDEX IF NOT EXISTS idx_objeto_etiqueta_etiqueta ON objeto_etiqueta(id_etiqueta);
```

Notas:
- `nombre` se declara UNIQUE; se recomienda normalizar antes de insert (trim + lowercase) para evitar duplicados semánticos.
- Indexes para consultas de filtrado.

---

## Repositorios y API propuestas

- `etiquetaRepository.ts`
  - `createEtiqueta(nombre: string): Promise<Etiqueta>` — normaliza y crea si no existe (idempotente), devuelve registro.
  - `getEtiquetaById(id: number): Promise<Etiqueta | null>`
  - `searchEtiquetas(query: string, limit?: number): Promise<Etiqueta[]>` — búsqueda case-insensitive para sugerencias.
  - `deleteEtiqueta(id: number): Promise<void>`
  - `listAllEtiquetas(): Promise<Etiqueta[]>` — usada por Panel_Filtros.

- `objetoEtiquetaRepository.ts`
  - `setEtiquetasForObjeto(idObjeto: number, etiquetaIds: number[]): Promise<void>` — sincroniza asociaciones (insert/delete) en una transacción.
  - `getEtiquetasForObjeto(idObjeto: number): Promise<Etiqueta[]>`
  - `getObjetoIdsForEtiqueta(idEtiqueta: number): Promise<number[]>` — util para filtrado.

- Cambios en `objetoRepository.ts`:
  - `getObjetosFiltrados(params)` deberá aceptar parámetros `etiquetaIds?: number[]` para filtrar por etiquetas (OR semantics).
  - Incluir JOIN para recuperar `etiquetas` asociadas o ejecutar consulta adicional por lote para evitar N+1.

---

## Cambios en UI / UX

- `Formulario_Objeto`:
  - Añadir sección `Etiquetas` con `TagPicker` que muestra chips de etiquetas seleccionadas.
  - `TagPicker` ofrece autocompletado usando `etiquetaRepository.searchEtiquetas` (debounce 250ms) y opción "Crear etiqueta" al confirmar texto que no exista.
  - Al crear una nueva etiqueta desde el `TagPicker`, devolver el id y usarlo en el estado local; solo persistir en la DB cuando se guarde el objeto.

- `Detalle_Contenedor` / lista de objetos / vistas de búsqueda:
  - Mostrar etiquetas como chips compactos debajo del nombre/descripcion.
  - Opcionalmente limitar la cantidad de chips mostrados y mostrar un contador "+N".

- `Panel_Filtros`:
  - Añadir selector multiselección de etiquetas (lista con checkbox o TagPicker en modo selección) que aplica filtro global a la lista de objetos.

---

## Migración y compatibilidad

- Añadir migración incremental en `src/db/schema.ts` con siguiente lógica:
  1. Crear tablas `etiqueta` y `objeto_etiqueta` y sus índices.
  2. Establecer `PRAGMA user_version` incrementado.
  3. No hay migración de datos automáticos desde `objeto` porque las etiquetas no existían; si se requiere importar desde CSV/CSV-like, crear una tarea adicional.

---

## Consideraciones de errores y UX

- Manejar errores de inserción (p. ej. UNIQUE violation) capturando el fallo y recuperando el registro existente en `createEtiqueta` para devolver id.
- Debounce en búsqueda de etiquetas y caching local para mejorar rendimiento.
- Tests unitarios para `etiquetaRepository` y `objetoEtiquetaRepository` y pruebas de integración que validen sincronización en `setEtiquetasForObjeto`.
