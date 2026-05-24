# Plan de Implementación: Ordenamiento y Filtros de Contenedores

## Visión General

Implementación incremental que extiende la pantalla principal de San Alejo para soportar ordenamiento (nombre, fecha de creación, cantidad de objetos) y filtrado por ubicación. El orden de las tareas sigue la dependencia natural: migración de BD → repositorio → hook de estado → componente UI → integración en pantalla principal.

## Tareas

- [x] 1. Migración de base de datos v3 → v4 (`fecha_creacion`)
  - Actualizar `DATABASE_VERSION` de 3 a 4 en `src/db/schema.ts`
  - Agregar bloque `if (user_version === 3)` que ejecute `ALTER TABLE contenedor ADD COLUMN fecha_creacion INTEGER NOT NULL DEFAULT 0`
  - Actualizar el `CREATE TABLE contenedor` de la instalación fresca (user_version === 0) para incluir `fecha_creacion INTEGER NOT NULL DEFAULT 0`
  - Actualizar la interfaz `Contenedor` en `src/db/contenedorRepository.ts` para agregar el campo `fecha_creacion: number`
  - _Requisitos: 1.1, 1.3, 1.4_

  - [ ]* 1.1 Test de ejemplo: migración v3→v4 agrega columna y preserva datos
    - Crear `__tests__/unit/schema.test.ts`
    - Verificar que tras la migración los contenedores existentes tienen `fecha_creacion = 0`
    - Verificar que la migración es idempotente (doble ejecución sin error)
    - _Requisitos: 1.1, 1.3, 1.4_

- [x] 2. Actualizar `insertContenedor` para registrar `fecha_creacion`
  - Modificar `insertContenedor` en `src/db/contenedorRepository.ts` para incluir `fecha_creacion` con el valor `Math.floor(Date.now() / 1000)` en el INSERT
  - Actualizar la firma para que `fecha_creacion` sea opcional en el parámetro de entrada (se calcula internamente si no se provee)
  - _Requisitos: 1.2_

  - [ ]* 2.1 Test de propiedad: timestamp de inserción es válido (Propiedad 8)
    - Extender `__tests__/unit/contenedorRepository.test.ts`
    - **Propiedad 8: Timestamp de inserción es válido**
    - Para cualquier contenedor insertado, `fecha_creacion` recuperado debe ser un entero positivo > 0 y ≤ timestamp Unix actual
    - **Valida: Requisito 1.2**

- [x] 3. Implementar nuevas funciones en `contenedorRepository.ts`
  - Agregar los tipos `CriterioOrden`, `DireccionOrden` y la interfaz `FiltroContenedor` en `src/db/contenedorRepository.ts`
  - Implementar `getContenedoresFiltrados(db, filtroUbicacion, criterioOrden, direccionOrden)`:
    - Construir la cláusula ORDER BY validando `criterioOrden` y `direccionOrden` contra conjuntos de valores permitidos (nunca interpolar texto del usuario)
    - Para `criterioOrden === 'cantidad_objetos'` usar subconsulta `(SELECT COUNT(*) FROM objeto WHERE id_contenedor = c.id)`
    - Pasar `filtroUbicacion` siempre como parámetro enlazado (`?`), nunca interpolado
    - Omitir la cláusula WHERE cuando `filtroUbicacion` es null
  - Implementar `getUbicacionesUnicas(db)`: retorna valores de `ubicacion` distintos, no vacíos, ordenados alfabéticamente
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 2.1, 2.2, 2.7, 3.1, 3.2_

  - [ ]* 3.1 Test de propiedad: consistencia de resultados filtrados y ordenados (Propiedad 5)
    - Extender `__tests__/unit/contenedorRepository.test.ts`
    - **Propiedad 5: Consistencia de resultados filtrados y ordenados**
    - Para cualquier conjunto de contenedores y combinación válida de parámetros: (a) si `filtroUbicacion` no es null, todos los elementos tienen `ubicacion` que coincide case-insensitive; (b) el array está ordenado correctamente según criterio y dirección
    - **Valida: Requisitos 2.1, 2.2, 3.2, 3.5, 5.5**

  - [ ]* 3.2 Test de propiedad: filtro null retorna todos los contenedores (Propiedad 6)
    - Extender `__tests__/unit/contenedorRepository.test.ts`
    - **Propiedad 6: Filtro null retorna todos los contenedores**
    - Para cualquier conjunto de contenedores, `getContenedoresFiltrados` con `filtroUbicacion = null` debe retornar todos los contenedores sin restricción de ubicación
    - **Valida: Requisitos 3.3, 5.2**

  - [ ]* 3.3 Test de propiedad: unicidad de ubicaciones (Propiedad 7)
    - Extender `__tests__/unit/contenedorRepository.test.ts`
    - **Propiedad 7: Unicidad de ubicaciones**
    - Para cualquier conjunto de contenedores, `getUbicacionesUnicas` retorna un array sin duplicados con exactamente los valores de `ubicacion` distintos y no vacíos
    - **Valida: Requisito 3.1**

- [x] 4. Checkpoint — Verificar repositorio y migración
  - Asegurar que todos los tests pasan, preguntar al usuario si hay dudas.

- [x] 5. Crear el hook `useSortFilter`
  - Crear `src/hooks/useSortFilter.ts`
  - Definir e implementar la interfaz `SortFilterState`, la constante `DEFAULT_SORT_FILTER` y el tipo de retorno `UseSortFilterReturn`
  - Implementar `setCriterio`: si el criterio nuevo es igual al activo, invertir `direccionOrden`; si es diferente, establecer el nuevo criterio con `direccionOrden = 'asc'`
  - Implementar `setFiltroUbicacion` y `reset`
  - Implementar `isNonDefault`: `true` si y solo si algún valor difiere del predeterminado
  - Implementar persistencia con `@react-native-async-storage/async-storage` bajo la clave `'sortFilter_v1'`; al montar, leer el valor persistido (si no existe o es inválido, usar `DEFAULT_SORT_FILTER`); al cambiar el estado, persistir como JSON
  - Instalar la dependencia `@react-native-async-storage/async-storage` si no está presente
  - _Requisitos: 2.3, 2.4, 2.5, 2.6, 3.3, 3.6, 4.5_

  - [ ]* 5.1 Test de propiedad: round-trip de persistencia del estado de filtros (Propiedad 1)
    - Crear `__tests__/unit/useSortFilter.test.ts`
    - **Propiedad 1: Round-trip de persistencia del estado de filtros**
    - Para cualquier combinación válida de `criterioOrden`, `direccionOrden` y `filtroUbicacion`, persistir el estado y luego cargarlo debe retornar exactamente los mismos valores
    - **Valida: Requisitos 2.6, 3.6**

  - [ ]* 5.2 Test de propiedad: toggle de dirección de orden (Propiedad 2)
    - Extender `__tests__/unit/useSortFilter.test.ts`
    - **Propiedad 2: Toggle de dirección de orden**
    - Para cualquier criterio activo y dirección activa, llamar a `setCriterio` con el mismo criterio debe resultar en la dirección opuesta, manteniendo el mismo criterio
    - **Valida: Requisito 2.4**

  - [ ]* 5.3 Test de propiedad: reset restaura el estado predeterminado (Propiedad 3)
    - Extender `__tests__/unit/useSortFilter.test.ts`
    - **Propiedad 3: Reset restaura el estado predeterminado**
    - Para cualquier estado de filtros, llamar a `reset()` debe resultar en exactamente `{ criterioOrden: 'nombre', direccionOrden: 'asc', filtroUbicacion: null }`
    - **Valida: Requisito 4.5**

  - [ ]* 5.4 Test de propiedad: isNonDefault es consistente con el estado predeterminado (Propiedad 4)
    - Extender `__tests__/unit/useSortFilter.test.ts`
    - **Propiedad 4: isNonDefault es consistente con el estado predeterminado**
    - Para cualquier estado de filtros, `isNonDefault` debe ser `true` si y solo si al menos un valor difiere del predeterminado
    - **Valida: Requisito 4.1**

  - [ ]* 5.5 Test de ejemplo: estado inicial del hook es el predeterminado
    - Extender `__tests__/unit/useSortFilter.test.ts`
    - Verificar que al montar el hook sin estado persistido, `state` es igual a `DEFAULT_SORT_FILTER`
    - _Requisitos: 2.5_

- [x] 6. Crear el componente `PanelFiltros`
  - Crear `src/components/PanelFiltros.tsx`
  - Implementar como `Modal` con `animationType="slide"` (bottom sheet manual), siguiendo el patrón de `ConfirmDialog.tsx`
  - Usar `useTheme()` para todos los colores
  - Cabecera: título "Ordenar y filtrar" + botón cerrar (`accessibilityRole="button"`)
  - Sección "Ordenar por": tres botones de selección (`nombre`, `Fecha de creación`, `Cantidad de objetos`) con indicador de dirección (↑/↓) en el botón activo; cada botón debe tener `accessibilityRole="button"` y `accessibilityLabel` descriptivo
  - Sección "Filtrar por ubicación": chips/botones con las ubicaciones únicas; ocultar la sección completa si `ubicaciones.length === 0`
  - Botón "Restablecer": visible solo si `isNonDefault` es `true`
  - _Requisitos: 3.1, 3.4, 4.3, 4.5, 4.6, 4.7_

  - [ ]* 6.1 Test de ejemplo: PanelFiltros oculta selector cuando ubicaciones=[]
    - Crear `__tests__/components/PanelFiltros.test.tsx`
    - Verificar que la sección de ubicaciones no se renderiza cuando `ubicaciones` es un array vacío
    - _Requisitos: 3.4_

  - [ ]* 6.2 Test de ejemplo: botón de filtro existe y es accesible
    - Extender `__tests__/screens/DetalleContenedor.test.tsx` o crear `__tests__/screens/ListaContenedores.test.tsx`
    - Verificar que el botón de filtro en la cabecera tiene `accessibilityRole="button"` y `accessibilityLabel`
    - _Requisitos: 4.3_

- [x] 7. Checkpoint — Verificar hook y componente PanelFiltros
  - Asegurar que todos los tests pasan, preguntar al usuario si hay dudas.

- [x] 8. Integrar en `app/index.tsx`
  - Importar `useSortFilter`, `PanelFiltros`, `getContenedoresFiltrados` y `getUbicacionesUnicas`
  - Reemplazar la llamada a `getAllContenedores` por `getContenedoresFiltrados` usando el estado del hook
  - Agregar estado `panelVisible: boolean` y `ubicaciones: string[]`
  - Llamar a `getUbicacionesUnicas` al abrir el panel para poblar el selector de ubicación
  - Agregar botón de filtro en `headerRight` (junto al de búsqueda) con badge/punto visual cuando `isNonDefault` es `true`; el botón debe tener `accessibilityRole="button"` y `accessibilityLabel`
  - Actualizar `ListEmptyComponent` para distinguir "sin contenedores" (sin filtros activos) de "sin resultados con filtros activos" (con opción de limpiar filtros llamando a `reset()`)
  - Renderizar `<PanelFiltros>` pasando el estado del hook y los callbacks correspondientes
  - _Requisitos: 2.3, 2.4, 2.6, 3.2, 3.3, 3.5, 3.6, 4.1, 4.3, 4.4_

  - [ ]* 8.1 Test de ejemplo: index.tsx muestra mensaje de vacío con opción de limpiar filtros
    - Extender `__tests__/screens/DetalleContenedor.test.tsx` o crear `__tests__/screens/ListaContenedores.test.tsx`
    - Verificar que cuando la lista está vacía con filtros activos se muestra el mensaje apropiado y el botón de limpiar filtros
    - _Requisitos: 4.4_

- [x] 9. Checkpoint final — Asegurar que todos los tests pasan
  - Ejecutar la suite completa de tests, preguntar al usuario si hay dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad (fast-check, ya instalado) validan propiedades universales de corrección
- Los tests de ejemplo validan comportamientos específicos de UI y migración
- `@react-native-async-storage/async-storage` debe instalarse como dependencia de producción antes de implementar la tarea 5
