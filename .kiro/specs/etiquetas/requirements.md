# Documento de Requisitos — Etiquetas / Categorías para Objetos

## Introducción

Esta funcionalidad añade soporte de **Etiquetas** (o Categorías) para los `Objeto` en la app San Alejo. Actualmente un `Objeto` solo tiene `nombre` y `descripcion`. Agregar `Etiquetas` permitirá al usuario clasificar, filtrar y agrupar objetos (ej.: "electrónica", "ropa", "herramientas"). La implementación requiere una nueva tabla `etiqueta` y una relación N:M entre `objeto` y `etiqueta` (tabla puente `objeto_etiqueta`).

---

## Glosario

- **Etiqueta**: Categoría textual con `id` y `nombre` única (p.ej. "electrónica").
- **Objeto**: Registro existente que representa un ítem dentro de un Contenedor.
- **objeto_etiqueta**: Tabla puente que relaciona objetos con etiquetas (N:M).
- **TagPicker**: Componente UI para seleccionar/crear etiquetas en el `Formulario_Objeto`.
- **Panel_Filtros**: Componente que expone filtros en la lista de objetos; se extiende para filtrar por etiquetas.
- **Repositorio_Etiqueta**: Módulo `src/db/etiquetaRepository.ts` que gestiona la tabla `etiqueta`.
- **Repositorio_ObjEtiq**: Módulo `src/db/objetoEtiquetaRepository.ts` que gestiona la tabla puente `objeto_etiqueta`.
- **Base_de_Datos**: SQLite local gestionada por `src/db/schema.ts` y `expo-sqlite`.

---

## Requisitos

### Requisito 1: Esquema de base de datos — tablas `etiqueta` y `objeto_etiqueta`

**User Story:** Como desarrollador, necesito añadir soporte persistente para etiquetas, para permitir relacionarlas con objetos y consultarlas en filtros.

#### Criterios de Aceptación

1. THE Schema SHALL crear la tabla `etiqueta` con columnas: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `nombre` (TEXT NOT NULL UNIQUE) y `fecha_creacion` (INTEGER NOT NULL DEFAULT 0) en la migración correspondiente.
2. THE Schema SHALL crear la tabla puente `objeto_etiqueta` con columnas: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `id_objeto` (INTEGER NOT NULL, FOREIGN KEY referenciando `objeto.id` ON DELETE CASCADE), `id_etiqueta` (INTEGER NOT NULL, FOREIGN KEY referenciando `etiqueta.id` ON DELETE CASCADE) y una restricción UNIQUE sobre `(id_objeto, id_etiqueta)` para evitar duplicados.
3. WHEN la base de datos ya contiene las tablas en la versión esperada, THE Schema SHALL omitir la migración sin modificar datos.
4. THE Repositorio_Etiqueta SHALL normalizar los nombres de etiqueta (trim y colapsar espacios) antes de insertarlos y prohibir etiquetas vacías.

---

### Requisito 2: Gestión de etiquetas desde el Formulario_Objeto

**User Story:** Como usuario, quiero asignar y crear etiquetas al crear o editar un objeto, para clasificarlo inmediatamente.

#### Criterios de Aceptación

1. THE Formulario_Objeto SHALL mostrar una sección `Etiquetas` que permite seleccionar múltiples etiquetas existentes y crear nuevas etiquetas mediante un control tipo `TagPicker` con autocompletado.
2. WHEN el usuario escribe en el `TagPicker`, THE UI SHALL sugerir etiquetas cuyo `nombre` coincida parcialmente (case-insensitive) con el texto ingresado.
3. WHEN el usuario crea una nueva etiqueta desde el `TagPicker`, THE Repositorio_Etiqueta SHALL crear la etiqueta si no existe y devolver su `id` para asociarla al objeto localmente (no persistir asociación hasta guardar el objeto).
4. WHEN el usuario guarda el Formulario_Objeto en modo creación, THE Base_de_Datos SHALL insertar primero el objeto y luego insertar en `objeto_etiqueta` una fila por cada etiqueta asociada.
5. WHEN el usuario guarda el Formulario_Objeto en modo edición, THE Base_de_Datos SHALL sincronizar `objeto_etiqueta` para reflejar el conjunto actual de etiquetas: insertar asociaciones nuevas y eliminar las desasociadas.
6. IF la Base_de_Datos falla al crear o asociar etiquetas, THEN la App SHALL mostrar un mensaje de error y no dejar el Formulario en un estado inconsistente.

---

### Requisito 3: Filtrado y búsqueda por etiqueta

**User Story:** Como usuario, quiero filtrar y buscar objetos por una o varias etiquetas, para localizar rápidamente objetos de una categoría.

#### Criterios de Aceptación

1. THE Panel_Filtros SHALL exponer un control para seleccionar una o varias etiquetas activas que filtren la lista de Objetos en el `Detalle_Contenedor` y en la búsqueda global.
2. WHEN se aplica uno o más filtros de etiqueta, THE Repositorio_Objeto SHALL devolver únicamente los objetos que tengan al menos una de las etiquetas seleccionadas (semántica OR) — esto se podrá parametrizar en la implementación si se requiere AND en el futuro.
3. WHEN no hay etiquetas seleccionadas, THE Lista_Objetos SHALL mostrar todos los objetos según los demás filtros ya existentes (orden, ubicación, etc.).
4. THE Repositorio_Objeto SHALL obtener etiquetas asociadas a cada objeto en una consulta eficiente (JOIN o subconsulta) cuando la lista las muestre como chips.

---

### Requisito 4: Visualización y gestión de etiquetas en vistas relevantes

**User Story:** Como usuario, quiero ver las etiquetas asociadas a cada objeto y poder eliminarlas desde la edición, para mantener una clasificación limpia.

#### Criterios de Aceptación

1. WHEN un Objeto es mostrado en el `Detalle_Contenedor` o en la lista, THE UI SHALL mostrar sus etiquetas como chips/labels debajo o junto a la descripción.
2. WHEN el usuario edita un Objeto, THE Formulario_Objeto SHALL permitir quitar etiquetas existentes de la lista antes de guardar.
3. WHEN una etiqueta es eliminada (desde una pantalla de administración opcional o mediante API de administración), THE Base_de_Datos SHALL eliminar las filas en `objeto_etiqueta` por la restricción ON DELETE CASCADE; la App SHALL actualizar la UI en consecuencia.

---

### Requisito 5: Consistencia y eliminación

**User Story:** Como usuario, quiero que al eliminar un objeto o una etiqueta no queden asociaciones huérfanas.

#### Criterios de Aceptación

1. WHEN un Objeto se elimina, THE restricción ON DELETE CASCADE en `objeto_etiqueta` SHALL eliminar automáticamente las asociaciones relacionadas.
2. WHEN una Etiqueta se elimina, THE restricción ON DELETE CASCADE en `objeto_etiqueta` SHALL eliminar automáticamente las asociaciones relacionadas.
3. IF se desea mantener un historial, THEN la implementación deberá documentarlo; la implementación por defecto eliminará asociaciones con la etiqueta borrada.

---

### Requisito 6: Rendimiento y UX

#### Criterios de Aceptación

1. THE consultas para listar objetos con sus etiquetas SHALL ejecutarse de forma eficiente: evitar N+1 queries cargando etiquetas con JOINs o una sola consulta por página de resultados.
2. THE TagPicker SHALL responder con suggestions locales (cacheadas) y no hacer consultas de búsqueda excesivas a la DB en cada tecla (debounce 200-300ms).
3. THE App SHALL soportar un número razonable de etiquetas (centenas) sin degradación notable de la UI en listados ni en el selector.

---

## Notas de implementación opcionales

- Se recomienda normalizar `nombre` de etiqueta a minúsculas para evitar duplicados semánticos, pero mostrar la etiqueta con capitalización tal como la creó el usuario.
- Considerar indexar `objeto_etiqueta.id_etiqueta` y `objeto_etiqueta.id_objeto` para consultas de filtrado.
- Definir la semántica de combinación de múltiples filtros (OR vs AND) como requisito de producto si se desea otra lógica.
