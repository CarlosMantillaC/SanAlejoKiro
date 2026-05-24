KKKKK# Plan de Implementación: Multi-Foto por Objeto

## Overview

Implementación incremental de la galería de fotos por objeto en la app San Alejo. El plan sigue el orden natural de dependencias: primero la capa de datos (migración + repositorio), luego los componentes UI nuevos, después la actualización de pantallas existentes y finalmente la integración completa.

## Tasks

- [x] 1. Migración de base de datos a versión 3
  - Actualizar `DATABASE_VERSION` de `2` a `3` en `src/db/schema.ts`
  - Agregar la rama `user_version === 2` en `initializeDatabase()` que:
    - Crea la tabla `objeto_foto` con columnas `id`, `id_objeto` (FK ON DELETE CASCADE), `uri`, `orden`
    - Crea el índice `idx_objeto_foto_id_objeto` sobre `id_objeto`
    - Migra los registros existentes con `foto_uri IS NOT NULL` insertando en `objeto_foto`
    - Establece `PRAGMA user_version = 3`
  - Actualizar la rama `user_version === 0` para que también cree `objeto_foto` en instalaciones nuevas
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.1 Escribir property test: la migración preserva exactamente las fotos existentes
    - **Property 1: La migración preserva exactamente las fotos existentes**
    - Generar conjuntos arbitrarios de objetos con y sin `foto_uri`, ejecutar `initializeDatabase()` sobre una BD en versión 2 y verificar que `objeto_foto` contiene exactamente un registro por cada objeto con `foto_uri` no nula
    - **Validates: Requirements 1.2**
    - Ubicar en `__tests__/unit/schema.test.ts`

  - [ ]* 1.2 Escribir property test: `initializeDatabase()` es idempotente en versión 3
    - **Property 2: La inicialización de la base de datos es idempotente**
    - Ejecutar `initializeDatabase()` dos veces sobre una BD ya en versión 3 y verificar que los registros en `objeto_foto` y `objeto` no se modifican
    - **Validates: Requirements 1.4**
    - Ubicar en `__tests__/unit/schema.test.ts`

  - [ ]* 1.3 Escribir smoke tests: estructura de tabla y CASCADE
    - Verificar que `objeto_foto` se crea con las columnas correctas en instalación nueva
    - Verificar que eliminar un `objeto` elimina en cascada sus registros en `objeto_foto`
    - **Validates: Requirements 1.1, 1.3, 6.3, 7.3**
    - Ubicar en `__tests__/smoke/database.test.ts` (extender el archivo existente)

- [x] 2. Implementar `fotoRepository` (`src/db/fotoRepository.ts`)
  - Definir la interfaz `FotoObjeto { id, id_objeto, uri, orden }`
  - Implementar `getFotosByObjeto(db, id_objeto)`: SELECT ordenado por `orden` ASC
  - Implementar `insertFotos(db, id_objeto, uris)`: INSERT de N filas con `orden` 0-indexed
  - Implementar `syncFotos(db, id_objeto, deletedIds, newUris, orderedIds)`: transacción que elimina, inserta y actualiza `orden`
  - Implementar `getUrisByObjeto(db, id_objeto)`: SELECT de URIs para cascade delete
  - Implementar `getUrisByContenedor(db, id_contenedor)`: JOIN con `objeto` para obtener todas las URIs del contenedor
  - Implementar `getPortadaUri(db, id_objeto)`: SELECT con `ORDER BY orden ASC LIMIT 1`
  - _Requirements: 2.5, 2.6, 3.4, 3.5, 6.1, 7.1_

  - [ ]* 2.1 Escribir property test: `insertFotos` + `getFotosByObjeto` round-trip
    - **Property 5: insertFotos persiste exactamente las fotos con el orden correcto**
    - Para cualquier lista de URIs de longitud N ≥ 0, verificar que `getFotosByObjeto` retorna N registros con `uri[i]` y `orden = i`
    - **Validates: Requirements 2.5, 2.6**
    - Ubicar en `__tests__/unit/fotoRepository.test.ts`

  - [ ]* 2.2 Escribir property test: `syncFotos` sincroniza el estado exacto
    - **Property 7: syncFotos sincroniza la BD con el estado exacto de la galería**
    - Para cualquier estado inicial y conjunto de cambios (IDs a eliminar, URIs nuevas, orden final), verificar que `getFotosByObjeto` refleja exactamente el estado esperado tras `syncFotos`
    - **Validates: Requirements 3.4**
    - Ubicar en `__tests__/unit/fotoRepository.test.ts`

  - [ ]* 2.3 Escribir property test: `getUrisByObjeto` retorna URIs exactas
    - **Property 13: getUrisByObjeto retorna exactamente las URIs de las fotos del objeto**
    - Para cualquier objeto con N fotos, verificar que `getUrisByObjeto` retorna exactamente N URIs sin duplicados ni omisiones
    - **Validates: Requirements 6.1**
    - Ubicar en `__tests__/unit/fotoRepository.test.ts`

  - [ ]* 2.4 Escribir property test: `getUrisByContenedor` retorna URIs de todos los objetos
    - **Property 14: getUrisByContenedor retorna exactamente las URIs de todos los objetos del contenedor**
    - Para cualquier contenedor con M objetos con N_j fotos cada uno, verificar que `getUrisByContenedor` retorna exactamente ∑N_j URIs
    - **Validates: Requirements 7.1**
    - Ubicar en `__tests__/unit/fotoRepository.test.ts`

  - [ ]* 2.5 Escribir property test: `getPortadaUri` retorna la foto de menor orden
    - **Property 11: La portada se actualiza correctamente tras eliminar la foto de menor orden**
    - Para cualquier conjunto de fotos con órdenes arbitrarios (N ≥ 2), verificar que tras eliminar la de menor orden, `getPortadaUri` retorna la URI de la que tenía el segundo menor orden
    - **Validates: Requirements 4.3**
    - Ubicar en `__tests__/unit/fotoRepository.test.ts`

- [x] 3. Checkpoint — Verificar capa de datos
  - Asegurar que todos los tests de `schema.test.ts` y `fotoRepository.test.ts` pasan. Consultar al usuario si hay dudas antes de continuar.

- [x] 4. Extender `objetoRepository` con variantes que incluyen portada
  - Definir `ObjetoConPortada extends Objeto { portada_uri: string | null }`
  - Implementar `getObjetosConPortadaByContenedor(db, id_contenedor)`: SELECT con subconsulta de portada
  - Definir `ObjetoConContenedorYPortada extends ObjetoConContenedor { portada_uri: string | null }`
  - Implementar `searchObjetosConPortada(db, query)`: búsqueda con subconsulta de portada
  - Mantener las funciones originales `getObjetosByContenedor` y `searchObjetos` sin modificar (compatibilidad con tests existentes)
  - _Requirements: 4.1, 4.2, 8.1, 8.2, 8.3_

  - [ ]* 4.1 Escribir property test: `searchObjetosConPortada` retorna la portada de menor orden
    - **Property 15: searchObjetosConPortada retorna la portada de menor orden para cada resultado**
    - Para cualquier conjunto de objetos con múltiples fotos, verificar que `portada_uri` en cada resultado es la URI del registro con menor `orden`
    - **Validates: Requirements 8.3**
    - Ubicar en `__tests__/unit/objetoRepository.test.ts` (extender el archivo existente)

- [x] 5. Extender `contenedorRepository` con eliminación que limpia fotos
  - Implementar `deleteContenedorConFotos(db, id, fotoRepo)` en `src/db/contenedorRepository.ts`:
    - Obtiene todas las URIs del contenedor via `fotoRepo.getUrisByContenedor`
    - Elimina los archivos con `deleteImagesFromStorage` (usando `Promise.allSettled` para tolerar fallos parciales)
    - Elimina el registro del contenedor en BD (el CASCADE elimina objetos y fotos automáticamente)
    - Retorna las URIs procesadas
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 6. Implementar el componente `GaleriaEditor` (`src/components/GaleriaEditor.tsx`)
  - Definir la interfaz `FotoLocal { id: number | null, uri: string, isNew: boolean }`
  - Definir las props `GaleriaEditorProps { fotos, onFotosChange, onPermissionDenied, onError }`
  - Renderizar las miniaturas en un `ScrollView` horizontal con botón de eliminar (ícono de papelera) por foto
  - Incluir un botón "Agregar foto" que muestre opciones de cámara y galería usando `ImagePickerButton` o llamando directamente a `expo-image-picker`
  - Al seleccionar imagen: llamar `copyImageToStorage`, crear `FotoLocal` con `isNew: true` y llamar `onFotosChange` con la foto añadida al final
  - Al eliminar foto: llamar `onFotosChange` con la foto removida del array (sin tocar BD ni FileSystem)
  - Manejar errores de permiso llamando `onPermissionDenied` y errores de copia llamando `onError`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8, 3.2, 3.3_

  - [ ]* 6.1 Escribir property test: `GaleriaEditor` renderiza fotos en el orden correcto
    - **Property 3: GaleriaEditor muestra las fotos en el orden correcto**
    - Para cualquier lista de `FotoLocal`, verificar que las miniaturas se renderizan en el mismo orden que se pasan como prop
    - **Validates: Requirements 2.1, 3.1**
    - Ubicar en `__tests__/components/GaleriaEditor.test.tsx`

  - [ ]* 6.2 Escribir property test: agregar foto la coloca al final
    - **Property 4: Agregar una foto la coloca al final de la galería**
    - Para cualquier estado de galería con N fotos y cualquier URI nueva, verificar que tras la selección la galería tiene N+1 fotos y la nueva está en la última posición con `isNew = true`
    - **Validates: Requirements 2.4, 3.2**
    - Ubicar en `__tests__/components/GaleriaEditor.test.tsx`

  - [ ]* 6.3 Escribir property test: eliminar foto del estado local no modifica BD
    - **Property 6: Eliminar una foto del estado local no modifica la base de datos**
    - Para cualquier galería con N fotos (N ≥ 1) y cualquier índice válido, verificar que tras eliminar la foto el estado tiene N-1 fotos y `onFotosChange` fue llamado sin que se haya invocado ninguna operación de BD
    - **Validates: Requirements 3.3**
    - Ubicar en `__tests__/components/GaleriaEditor.test.tsx`

  - [ ]* 6.4 Escribir unit tests de ejemplo para `GaleriaEditor`
    - Verificar que se muestra mensaje al denegar permiso (Req. 2.7)
    - Verificar que se muestra mensaje al fallar la copia de archivo (Req. 2.8)
    - Ubicar en `__tests__/components/GaleriaEditor.test.tsx`

- [x] 7. Implementar el componente `VisorGaleria` (`src/components/VisorGaleria.tsx`)
  - Definir las props `VisorGaleriaProps { fotos: Array<{ uri: string }>, initialIndex, visible, onClose }`
  - Implementar un `FlatList` horizontal con `pagingEnabled` para navegar entre fotos
  - Cada ítem del `FlatList` reutiliza la lógica de zoom/pan de `ImageViewer` (pinch, doble tap, arrastre) sin el wrapper `Modal`
  - Mostrar indicador de posición `"{índice + 1} / {total}"` actualizado al cambiar de foto
  - Mostrar botón de cierre accesible
  - Si una foto falla al cargar, mostrar estado de error local (ícono + texto) sin cerrar el modal
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 7.1 Escribir property test: `VisorGaleria` renderiza fotos en orden con indicador correcto
    - **Property 12: VisorGaleria muestra las fotos en el orden correcto con indicador preciso**
    - Para cualquier lista de fotos de longitud N ≥ 1 y cualquier índice inicial i, verificar que el indicador muestra `"{i+1} / {N}"` y las fotos están en el orden correcto
    - **Validates: Requirements 5.2, 5.3**
    - Ubicar en `__tests__/components/VisorGaleria.test.tsx`

  - [ ]* 7.2 Escribir unit test de ejemplo: error de carga por foto sin cerrar modal
    - Verificar que si una foto falla al cargar, el modal permanece abierto y las otras fotos son navegables
    - **Validates: Requirements 5.6**
    - Ubicar en `__tests__/components/VisorGaleria.test.tsx`

- [x] 8. Actualizar `ObjetoItem` para usar `ObjetoConPortada`
  - Cambiar el tipo de la prop `objeto` de `Objeto` a `ObjetoConPortada` en `src/components/ObjetoItem.tsx`
  - Reemplazar `objeto.foto_uri` por `objeto.portada_uri` en la lógica de renderizado de miniatura
  - Mantener el comportamiento de placeholder cuando `portada_uri` es `null`
  - _Requirements: 4.1, 4.2_

  - [ ]* 8.1 Escribir property test: `ObjetoItem` muestra portada o placeholder según `portada_uri`
    - **Property 10: ObjetoItem muestra la portada correcta para cualquier objeto**
    - Para cualquier `ObjetoConPortada`, verificar que si `portada_uri` es no nula se renderiza `Image` con esa URI, y si es nula se renderiza el ícono de placeholder
    - **Validates: Requirements 4.1, 4.2, 8.1, 8.2**
    - Ubicar en `__tests__/components/ObjetoItem.test.tsx` (extender el archivo existente)

- [x] 9. Checkpoint — Verificar componentes y repositorios extendidos
  - Asegurar que todos los tests de componentes y repositorios pasan. Consultar al usuario si hay dudas antes de continuar.

- [x] 10. Actualizar la pantalla `nuevo.tsx` para usar `GaleriaEditor`
  - Reemplazar el estado `fotoUri: string | null` por `fotos: FotoLocal[]` en `app/contenedor/objeto/nuevo.tsx`
  - Reemplazar el bloque `ImagePickerButton` + `ImageViewer` por el componente `GaleriaEditor`
  - Al guardar: llamar `insertObjeto` (sin `foto_uri`) y luego `insertFotos(db, nuevoId, fotos.map(f => f.uri))`
  - Al cancelar (navegar atrás sin guardar): llamar `deleteImagesFromStorage` con las URIs de fotos con `isNew: true`
  - Manejar errores de BD mostrando el banner de error existente
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 10.1 Escribir property test: al guardar, `deleteImagesFromStorage` recibe exactamente las URIs removidas
    - **Property 8: Al guardar, se eliminan del FileSystem exactamente las fotos removidas**
    - Para cualquier conjunto de fotos marcadas para eliminación, verificar que `deleteImagesFromStorage` es invocado con exactamente esas URIs
    - **Validates: Requirements 3.5**
    - Ubicar en `__tests__/screens/FormularioObjeto.test.tsx` (extender el archivo existente)

  - [ ]* 10.2 Escribir property test: al cancelar, `deleteImagesFromStorage` recibe exactamente las fotos nuevas
    - **Property 9: Al cancelar, se eliminan del FileSystem exactamente las fotos nuevas no guardadas**
    - Para cualquier conjunto de fotos con `isNew = true`, verificar que al cancelar `deleteImagesFromStorage` es invocado con exactamente esas URIs
    - **Validates: Requirements 3.6**
    - Ubicar en `__tests__/screens/FormularioObjeto.test.tsx` (extender el archivo existente)

  - [ ]* 10.3 Escribir unit test de ejemplo: error de BD al guardar muestra mensaje y no navega
    - Verificar que si `insertFotos` falla, se muestra el banner de error y no se llama `router.back()`
    - **Validates: Requirements 3.7**
    - Ubicar en `__tests__/screens/FormularioObjeto.test.tsx` (extender el archivo existente)

- [x] 11. Actualizar la pantalla `editar/[id].tsx` para usar `GaleriaEditor`
  - Reemplazar el estado `fotoUri: string | null` por `fotos: FotoLocal[]` en `app/contenedor/objeto/editar/[id].tsx`
  - Al cargar: llamar `getFotosByObjeto(db, id)` y mapear a `FotoLocal[]` con `isNew: false`
  - Reemplazar el bloque `ImagePickerButton` + `ImageViewer` por el componente `GaleriaEditor`
  - Al guardar: llamar `syncFotos(db, id, deletedIds, newUris, orderedIds)` y luego `deleteImagesFromStorage(removedUris)`
  - Al cancelar: llamar `deleteImagesFromStorage` con las URIs de fotos con `isNew: true`
  - Manejar errores de BD mostrando el banner de error existente
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 12. Actualizar la pantalla `contenedor/[id].tsx` para usar galería multi-foto
  - Cambiar la llamada de `getObjetosByContenedor` a `getObjetosConPortadaByContenedor` en `app/contenedor/[id].tsx`
  - Actualizar el tipo del estado `objetos` de `Objeto[]` a `ObjetoConPortada[]`
  - Reemplazar `ImageViewer` por `VisorGaleria` para la visualización de fotos
  - Al tocar la portada de un objeto: abrir `VisorGaleria` con todas las fotos del objeto (cargar via `getFotosByObjeto`) y `initialIndex = 0`
  - Actualizar `handleConfirmarEliminar`: reemplazar la eliminación de `foto_uri` por `getUrisByObjeto` + `deleteImagesFromStorage` (con `Promise.allSettled`) antes de `deleteObjeto`
  - Mostrar mensaje informativo si falla la eliminación de archivos (sin bloquear la eliminación del registro)
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 12.1 Escribir unit test de ejemplo: al eliminar objeto con error de FileSystem, BD se actualiza y se muestra mensaje
    - Verificar que si `deleteImagesFromStorage` falla, `deleteObjeto` se ejecuta igualmente y se muestra un mensaje informativo
    - **Validates: Requirements 6.4**
    - Ubicar en `__tests__/screens/DetalleContenedor.test.tsx` (extender el archivo existente)

- [x] 13. Actualizar la pantalla `busqueda.tsx` para mostrar portada en resultados
  - Cambiar la llamada de `searchObjetos` a `searchObjetosConPortada` en `app/busqueda.tsx`
  - Actualizar el tipo del estado `resultados` de `ObjetoConContenedor[]` a `ObjetoConContenedorYPortada[]`
  - Agregar miniatura de portada en cada `resultCard`: si `portada_uri` es no nula mostrar `Image`, si es nula mostrar el ícono de placeholder
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 14. Actualizar la pantalla `app/index.tsx` y `contenedor/editar/[id].tsx` para usar `deleteContenedorConFotos`
  - Localizar los puntos donde se llama `deleteContenedor` en las pantallas de listado y edición de contenedores
  - Reemplazar por `deleteContenedorConFotos(db, id, fotoRepository)` pasando el módulo `fotoRepository`
  - Mostrar mensaje informativo si falla la eliminación de archivos (sin bloquear la eliminación del registro)
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 14.1 Escribir unit test de ejemplo: al eliminar contenedor con error de FileSystem, BD se actualiza y se muestra mensaje
    - Verificar que si `deleteImagesFromStorage` falla, `deleteContenedor` se ejecuta igualmente y se muestra un mensaje informativo
    - **Validates: Requirements 7.4**
    - Ubicar en el test de pantalla correspondiente

- [x] 15. Checkpoint final — Verificar integración completa
  - Ejecutar la suite completa de tests con `jest --runInBand` y asegurar que todos pasan
  - Verificar que los tests existentes en `__tests__/` no se rompieron por los cambios
  - Consultar al usuario si hay dudas antes de dar por completada la implementación.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los property-based tests usan `fast-check` (ya instalado como devDependency)
- Los generadores sugeridos en el diseño (`fcUri`, `fcFotoLocal`, `fcFotoObjeto`, `fcUriList`) deben definirse como helpers compartidos en cada archivo de test
- La columna `foto_uri` de la tabla `objeto` **no se elimina** en esta versión; queda como campo legado
- Las funciones originales `getObjetosByContenedor` y `searchObjetos` se mantienen para no romper tests existentes
- `syncFotos` debe ejecutarse dentro de una transacción SQLite para garantizar atomicidad (usar `db.withTransactionAsync`)
- Para la eliminación de archivos usar siempre `Promise.allSettled` (no `Promise.all`) para tolerar fallos parciales
