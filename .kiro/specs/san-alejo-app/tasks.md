# Plan de Implementación: San Alejo App

## Descripción general

Implementación incremental de la app móvil San Alejo en Expo (React Native) con TypeScript, SQLite local mediante `expo-sqlite`, navegación file-based con Expo Router y arquitectura en capas (UI → Business Logic → Data Access → Database). Las tareas siguen el orden natural de construcción: infraestructura de datos → pantallas principales → formularios → eliminación → búsqueda → edición → tests.

## Tareas

- [x] 1. Inicializar proyecto y configurar dependencias
  - Crear el proyecto Expo con nombre "SanAlejo" usando `npx create-expo-app SanAlejo --template blank-typescript`
  - Instalar dependencias: `expo-sqlite`, `expo-router`, `expo-constants`, `expo-status-bar`
  - Instalar dependencias de testing: `jest`, `jest-expo`, `@testing-library/react-native`, `fast-check`
  - Configurar `jest.config.js` con preset `jest-expo` y soporte para TypeScript
  - Crear la estructura de carpetas: `app/`, `src/db/`, `src/utils/`, `src/components/`, `__tests__/unit/`, `__tests__/components/`, `__tests__/screens/`, `__tests__/smoke/`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implementar capa de base de datos
  - [x] 2.1 Crear `src/db/schema.ts` con `initializeDatabase`
    - Implementar `initializeDatabase(db: SQLiteDatabase): Promise<void>` con `PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON` y `PRAGMA user_version`
    - Crear tabla `contenedor` (id, nombre, descripcion, ubicacion) con `CREATE TABLE IF NOT EXISTS`
    - Crear tabla `objeto` (id, nombre, descripcion, id_contenedor) con `FOREIGN KEY ... ON DELETE CASCADE`
    - Implementar patrón de migración con `PRAGMA user_version = 1`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Smoke tests de inicialización de base de datos
    - Escribir `__tests__/smoke/database.test.ts`
    - Verificar que las tablas `contenedor` y `objeto` existen tras `initializeDatabase`
    - Verificar que `PRAGMA foreign_keys` está activo (retorna 1)
    - _Requirements: 1.1, 1.2_

  - [x] 2.3 Crear `src/db/contenedorRepository.ts`
    - Definir interfaz `Contenedor { id, nombre, descripcion, ubicacion }`
    - Implementar `getAllContenedores`: `SELECT * FROM contenedor ORDER BY nombre ASC`
    - Implementar `getContenedorById`: `SELECT * FROM contenedor WHERE id = ?`
    - Implementar `insertContenedor`: `INSERT INTO contenedor ...` retornando `lastInsertRowId`
    - Implementar `updateContenedor`: `UPDATE contenedor SET ... WHERE id = ?`
    - Implementar `deleteContenedor`: `DELETE FROM contenedor WHERE id = ?`
    - _Requirements: 2.1, 3.5, 3.6, 7.3_

  - [x] 2.4 Escribir property test — Property 1: Ordenamiento de contenedores
    - Escribir en `__tests__/unit/contenedorRepository.test.ts`
    - **Property 1: Ordenamiento de contenedores**
    - **Validates: Requirements 2.1**
    - Usar `fc.array(fc.record({ nombre, descripcion, ubicacion }))` para insertar N contenedores con nombres arbitrarios y verificar que `getAllContenedores` retorna la lista ordenada alfabéticamente por nombre ASC

  - [x] 2.5 Escribir property test — Property 4: Round-trip de inserción de contenedor
    - Escribir en `__tests__/unit/contenedorRepository.test.ts`
    - **Property 4: Round-trip de inserción de contenedor**
    - **Validates: Requirements 3.5**
    - Usar `fc.record({ nombre, descripcion, ubicacion })` con strings no vacíos, insertar y consultar por id, verificar que los valores retornados son idénticos a los insertados

  - [x] 2.6 Escribir property test — Property 5: Round-trip de actualización de contenedor
    - Escribir en `__tests__/unit/contenedorRepository.test.ts`
    - **Property 5: Round-trip de actualización de contenedor**
    - **Validates: Requirements 3.6**
    - Insertar un contenedor, luego actualizar con valores arbitrarios válidos, consultar por id y verificar que los valores retornados son los nuevos valores

  - [x] 2.7 Crear `src/db/objetoRepository.ts`
    - Definir interfaz `Objeto { id, nombre, descripcion, id_contenedor }`
    - Definir interfaz `ObjetoConContenedor extends Objeto { nombre_contenedor }`
    - Implementar `getObjetosByContenedor`: `SELECT * FROM objeto WHERE id_contenedor = ? ORDER BY nombre ASC`
    - Implementar `insertObjeto`: `INSERT INTO objeto ...` retornando `lastInsertRowId`
    - Implementar `updateObjeto`: `UPDATE objeto SET nombre = ?, descripcion = ? WHERE id = ?`
    - Implementar `deleteObjeto`: `DELETE FROM objeto WHERE id = ?`
    - Implementar `searchObjetos`: JOIN con contenedor, filtro LIKE en nombre y descripcion con `COLLATE NOCASE`
    - _Requirements: 4.2, 5.5, 5.6, 6.3, 8.2, 8.3_

  - [x] 2.8 Escribir property test — Property 7: Aislamiento de objetos por contenedor
    - Escribir en `__tests__/unit/objetoRepository.test.ts`
    - **Property 7: Aislamiento de objetos por contenedor**
    - **Validates: Requirements 4.2**
    - Crear dos contenedores, insertar N objetos en el primero y M en el segundo, verificar que `getObjetosByContenedor` retorna exactamente N objetos para el primero y M para el segundo sin mezcla

  - [x] 2.9 Escribir property test — Property 8: Round-trip de inserción de objeto
    - Escribir en `__tests__/unit/objetoRepository.test.ts`
    - **Property 8: Round-trip de inserción de objeto**
    - **Validates: Requirements 5.5**
    - Insertar un objeto con valores arbitrarios válidos y un `id_contenedor` existente, consultar por id y verificar que todos los campos retornados son idénticos a los insertados

  - [x] 2.10 Escribir property test — Property 9: Round-trip de actualización de objeto
    - Escribir en `__tests__/unit/objetoRepository.test.ts`
    - **Property 9: Round-trip de actualización de objeto**
    - **Validates: Requirements 5.6**
    - Insertar un objeto, actualizar con valores arbitrarios válidos, consultar y verificar que los valores retornados son los nuevos valores

  - [x] 2.11 Escribir property test — Property 10: Eliminación en cascada
    - Escribir en `__tests__/unit/objetoRepository.test.ts`
    - **Property 10: Eliminación en cascada de objetos al eliminar contenedor**
    - **Validates: Requirements 7.3**
    - Crear un contenedor con N objetos (N ≥ 0), eliminar el contenedor, verificar que `getObjetosByContenedor` retorna lista vacía para ese `id_contenedor`

- [x] 3. Implementar módulo de validación
  - [x] 3.1 Crear `src/utils/validator.ts`
    - Definir interfaz `ValidationResult { valid: boolean; errors: Record<string, string> }`
    - Implementar `validateFields(fields: Record<string, string>): ValidationResult`
    - Rechazar campos cuyo `value.trim().length === 0` con mensaje `"El campo \"[key]\" es obligatorio."`
    - _Requirements: 3.3, 3.4, 5.3, 5.4_

  - [x] 3.2 Escribir property test — Property 3: Validación rechaza whitespace
    - Escribir en `__tests__/unit/validator.test.ts`
    - **Property 3: Validación de campos obligatorios rechaza whitespace**
    - **Validates: Requirements 3.3, 5.3**
    - Usar `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0)` y verificar que `validateFields` retorna `valid: false` con el campo en `errors`

  - [x] 3.3 Escribir unit tests para `validateFields`
    - Escribir en `__tests__/unit/validator.test.ts`
    - Caso: todos los campos válidos → `valid: true`, `errors` vacío
    - Caso: un campo vacío → `valid: false`, error solo para ese campo
    - Caso: múltiples campos vacíos → `valid: false`, error para cada campo vacío
    - _Requirements: 3.3, 3.4, 5.3, 5.4_

- [ ] 4. Checkpoint — Verificar capa de datos y validación
  - Asegurarse de que todos los tests de la capa de datos y validación pasan. Consultar al usuario si surgen dudas.

- [ ] 5. Implementar componentes reutilizables de UI
  - [ ] 5.1 Crear `src/components/FAB.tsx`
    - Componente `FAB` con prop `onPress: () => void` y texto "+"
    - Posicionado como botón flotante (position absolute, bottom/right)
    - Accesible con `accessibilityLabel` y `accessibilityRole="button"`
    - _Requirements: 2.4, 2.6_

  - [ ] 5.2 Crear `src/components/ConfirmDialog.tsx`
    - Componente `ConfirmDialog` con props: `visible`, `message`, `onConfirm`, `onCancel`
    - Renderizar `Modal` con el mensaje y botones "Cancelar" y "Eliminar"
    - _Requirements: 6.2, 6.5, 7.2, 7.5_

  - [ ] 5.3 Crear `src/components/ContenedorItem.tsx`
    - Componente `ContenedorItem` con props: `contenedor: Contenedor`, `onPress`, `onDelete`
    - Mostrar nombre, descripción y ubicación del contenedor
    - Incluir botón o acción de eliminación que dispara `onDelete`
    - _Requirements: 2.2, 7.1_

  - [ ] 5.4 Crear `src/components/ObjetoItem.tsx`
    - Componente `ObjetoItem` con props: `objeto: Objeto`, `onEdit`, `onDelete`
    - Mostrar nombre y descripción del objeto
    - Incluir acciones de edición y eliminación
    - _Requirements: 4.3, 6.1, 9.3_

  - [ ]* 5.5 Escribir unit tests para `ConfirmDialog`
    - Escribir en `__tests__/components/ConfirmDialog.test.tsx`
    - Caso: `visible=false` → no renderiza el diálogo
    - Caso: `visible=true` → muestra el mensaje y los botones
    - Caso: presionar "Cancelar" → llama `onCancel` sin llamar `onConfirm`
    - Caso: presionar "Eliminar" → llama `onConfirm`
    - _Requirements: 6.2, 6.5, 7.2, 7.5_

- [ ] 6. Implementar Root Layout y pantalla principal (Lista de Contenedores)
  - [ ] 6.1 Crear `app/_layout.tsx`
    - Envolver la app con `SQLiteProvider` usando `databaseName="san-alejo.db"`, `onInit={initializeDatabase}` y `useSuspense`
    - Agregar `Suspense` con fallback de `ActivityIndicator`
    - Manejar errores de inicialización con `onError` mostrando mensaje "No se pudo abrir el almacenamiento local."
    - Renderizar `<Stack />` de Expo Router dentro del provider
    - _Requirements: 1.3, 1.4_

  - [ ] 6.2 Crear `app/index.tsx` — Lista de Contenedores
    - Obtener instancia de BD con `useSQLiteContext`
    - Cargar contenedores con `getAllContenedores` en `useEffect` y almacenar en estado local
    - Renderizar `FlatList` con `ContenedorItem` para cada contenedor
    - Mostrar mensaje "No hay contenedores. Agrega tu primera caja, maleta o cajón." cuando la lista está vacía
    - Renderizar `FAB` que navega a `/contenedor/nuevo`
    - Al tocar un `ContenedorItem`, navegar a `/contenedor/[id]`
    - Recargar la lista al volver a la pantalla usando `useFocusEffect`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 6.3 Escribir property test — Property 2: Completitud de datos en lista de contenedores
    - Escribir en `__tests__/screens/ListaContenedores.test.tsx`
    - **Property 2: Completitud de datos en lista de contenedores**
    - **Validates: Requirements 2.2**
    - Para cualquier contenedor con nombre, descripción y ubicación arbitrarios, verificar que el componente `ContenedorItem` renderiza los tres campos visibles en pantalla

  - [ ]* 6.4 Escribir unit tests para Lista de Contenedores
    - Escribir en `__tests__/screens/ListaContenedores.test.tsx`
    - Caso: lista vacía → muestra mensaje de estado vacío
    - Caso: lista con contenedores → renderiza un ítem por contenedor
    - Caso: tocar un ítem → navega a la ruta correcta
    - Caso: tocar FAB → navega a `/contenedor/nuevo`
    - _Requirements: 2.3, 2.5, 2.6_

- [ ] 7. Implementar Formulario de Contenedor (crear y editar)
  - [ ] 7.1 Crear `app/contenedor/nuevo.tsx` — Formulario contenedor (modo creación)
    - Renderizar campos `TextInput` para nombre, descripción y ubicación
    - Botón "Guardar" que llama a `validateFields` antes de persistir
    - Si validación falla, mostrar mensajes de error por campo sin cerrar el formulario
    - Si validación pasa, llamar `insertContenedor` y navegar de regreso con `router.back()`
    - Manejar errores de BD mostrando "No se pudo guardar el contenedor."
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8_

  - [ ] 7.2 Crear `app/contenedor/editar/[id].tsx` — Formulario contenedor (modo edición)
    - Leer `id` de los parámetros de ruta con `useLocalSearchParams`
    - Cargar datos actuales del contenedor con `getContenedorById` y precargar los campos
    - Botón "Guardar" que llama a `validateFields` y luego `updateContenedor`
    - Manejar errores de validación y de BD igual que en modo creación
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 9.2, 9.5_

  - [ ]* 7.3 Escribir unit tests para Formulario de Contenedor
    - Escribir en `__tests__/screens/FormularioContenedor.test.tsx`
    - Caso: campos vacíos al guardar → muestra errores de validación
    - Caso: campos con solo espacios → muestra errores de validación
    - Caso: campos válidos → llama al repositorio y navega de regreso
    - Caso: error de BD → muestra mensaje de error sin navegar
    - Caso (modo edición): campos precargados con valores actuales del contenedor
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.8, 9.5_

- [ ] 8. Implementar pantalla Detalle del Contenedor
  - [ ] 8.1 Crear `app/contenedor/[id].tsx` — Detalle del Contenedor
    - Leer `id` de los parámetros de ruta con `useLocalSearchParams`
    - Cargar datos del contenedor con `getContenedorById` y objetos con `getObjetosByContenedor`
    - Mostrar nombre, descripción y ubicación del contenedor en la cabecera
    - Renderizar `FlatList` con `ObjetoItem` para cada objeto
    - Mostrar mensaje "Este contenedor está vacío. Agrega los objetos que hay dentro." cuando no hay objetos
    - Botón "Agregar objeto" que navega a `/contenedor/objeto/nuevo?id_contenedor=[id]`
    - Botón de edición en la barra de navegación que navega a `/contenedor/editar/[id]`
    - Recargar datos al volver a la pantalla usando `useFocusEffect`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.1, 9.2_

  - [ ] 8.2 Agregar eliminación de objetos en `app/contenedor/[id].tsx`
    - Al tocar la acción de eliminar en `ObjetoItem`, mostrar `ConfirmDialog` con "¿Eliminar este objeto?"
    - Al confirmar, llamar `deleteObjeto` y recargar la lista de objetos
    - Al cancelar, cerrar el diálogo sin modificar datos
    - Manejar errores de BD mostrando "No se pudo eliminar el objeto."
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 8.3 Escribir unit tests para Detalle del Contenedor
    - Escribir en `__tests__/screens/DetalleContenedor.test.tsx`
    - Caso: contenedor sin objetos → muestra mensaje de estado vacío
    - Caso: contenedor con objetos → renderiza un ítem por objeto
    - Caso: tocar "Agregar objeto" → navega con `id_contenedor` correcto
    - Caso: tocar editar contenedor → navega a la ruta de edición
    - Caso: confirmar eliminación de objeto → llama `deleteObjeto` y actualiza lista
    - Caso: cancelar eliminación → no modifica datos
    - _Requirements: 4.4, 4.6, 6.2, 6.5, 9.1_

  - [ ]* 8.4 Escribir property test — Property 6: Completitud de datos en detalle de contenedor
    - Escribir en `__tests__/screens/DetalleContenedor.test.tsx`
    - **Property 6: Completitud de datos en detalle de contenedor**
    - **Validates: Requirements 4.1, 4.3**
    - Para cualquier contenedor con datos arbitrarios y N objetos asociados, verificar que la pantalla renderiza nombre, descripción y ubicación del contenedor, y nombre y descripción de cada objeto

- [ ] 9. Implementar Formulario de Objeto (crear y editar)
  - [ ] 9.1 Crear `app/contenedor/objeto/nuevo.tsx` — Formulario objeto (modo creación)
    - Leer `id_contenedor` de los query params con `useLocalSearchParams`
    - Renderizar campos `TextInput` para nombre y descripción
    - Botón "Guardar" que llama a `validateFields` antes de persistir
    - Si validación falla, mostrar mensajes de error por campo sin cerrar el formulario
    - Si validación pasa, llamar `insertObjeto` con `id_contenedor` y navegar de regreso
    - Manejar errores de BD mostrando "No se pudo guardar el objeto."
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8_

  - [ ] 9.2 Crear `app/contenedor/objeto/editar/[id].tsx` — Formulario objeto (modo edición)
    - Leer `id` de los parámetros de ruta con `useLocalSearchParams`
    - Cargar datos actuales del objeto y precargar los campos nombre y descripción
    - Botón "Guardar" que llama a `validateFields` y luego `updateObjeto`
    - Manejar errores de validación y de BD igual que en modo creación
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8, 9.4, 9.5_

  - [ ]* 9.3 Escribir unit tests para Formulario de Objeto
    - Escribir en `__tests__/screens/FormularioObjeto.test.tsx`
    - Caso: campos vacíos al guardar → muestra errores de validación
    - Caso: campos con solo espacios → muestra errores de validación
    - Caso: campos válidos → llama al repositorio y navega de regreso
    - Caso: error de BD → muestra mensaje de error sin navegar
    - Caso (modo edición): campos precargados con valores actuales del objeto
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.8, 9.5_

  - [ ]* 9.4 Escribir property test — Property 13: Precarga de datos en modo edición
    - Escribir en `__tests__/screens/FormularioContenedor.test.tsx` y `__tests__/screens/FormularioObjeto.test.tsx`
    - **Property 13: Precarga de datos en modo edición**
    - **Validates: Requirements 9.5**
    - Para cualquier contenedor u objeto con datos arbitrarios, verificar que abrir el formulario en modo edición inicializa los campos con exactamente los valores actuales del registro

- [ ] 10. Checkpoint — Verificar pantallas principales y formularios
  - Asegurarse de que todos los tests de pantallas y formularios pasan. Consultar al usuario si surgen dudas.

- [ ] 11. Implementar eliminación de contenedores
  - [ ] 11.1 Agregar eliminación de contenedores en `app/index.tsx`
    - Al tocar la acción de eliminar en `ContenedorItem`, mostrar `ConfirmDialog` con "¿Eliminar este contenedor y todos sus objetos?"
    - Al confirmar, llamar `deleteContenedor` y recargar la lista de contenedores
    - Al cancelar, cerrar el diálogo sin modificar datos
    - Manejar errores de BD mostrando "No se pudo eliminar el contenedor."
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 11.2 Escribir unit tests para eliminación de contenedores
    - Escribir en `__tests__/screens/ListaContenedores.test.tsx`
    - Caso: confirmar eliminación → llama `deleteContenedor` y actualiza lista
    - Caso: cancelar eliminación → no modifica datos ni llama al repositorio
    - Caso: error de BD al eliminar → muestra mensaje de error
    - _Requirements: 7.2, 7.4, 7.5, 7.6_

- [ ] 12. Implementar pantalla de Búsqueda
  - [ ] 12.1 Crear `app/busqueda.tsx` — Búsqueda global de objetos
    - Renderizar `TextInput` como barra de búsqueda
    - Al cambiar el texto, llamar `searchObjetos` con el query y almacenar resultados en estado local
    - Renderizar `FlatList` con cada resultado mostrando nombre del objeto y nombre del contenedor
    - Mostrar mensaje "No se encontraron objetos con ese nombre o descripción." cuando no hay resultados y el query no está vacío
    - Al tocar un resultado, navegar a `/contenedor/[id_contenedor]`
    - Cuando el campo está vacío, mostrar lista vacía (sin resultados)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 12.2 Agregar acceso a búsqueda desde `app/index.tsx`
    - Agregar botón o ícono de búsqueda en la barra de navegación de la Lista de Contenedores
    - Al tocar, navegar a `/busqueda`
    - _Requirements: 8.1_

  - [ ]* 12.3 Escribir property test — Property 11: Búsqueda case-insensitive
    - Escribir en `__tests__/unit/objetoRepository.test.ts`
    - **Property 11: Búsqueda case-insensitive retorna todos los coincidentes**
    - **Validates: Requirements 8.2**
    - Para cualquier texto de búsqueda no vacío y conjunto de objetos, verificar que `searchObjetos` retorna exactamente los objetos cuyo nombre o descripción contienen el texto (ignorando mayúsculas/minúsculas), sin omitir ni incluir de más

  - [ ]* 12.4 Escribir property test — Property 12: Resultados incluyen nombre del contenedor
    - Escribir en `__tests__/unit/objetoRepository.test.ts`
    - **Property 12: Resultados de búsqueda incluyen nombre del contenedor**
    - **Validates: Requirements 8.3**
    - Para cualquier resultado de `searchObjetos`, verificar que cada objeto retornado incluye el campo `nombre_contenedor` con el nombre correcto del contenedor al que pertenece

  - [ ]* 12.5 Escribir unit tests para pantalla de Búsqueda
    - Escribir en `__tests__/screens/Busqueda.test.tsx`
    - Caso: campo vacío → no muestra resultados
    - Caso: búsqueda sin resultados → muestra mensaje de estado vacío
    - Caso: búsqueda con resultados → muestra nombre del objeto y nombre del contenedor
    - Caso: tocar resultado → navega al detalle del contenedor correcto
    - _Requirements: 8.4, 8.5, 8.6_

- [ ] 13. Checkpoint final — Verificar integración completa
  - Asegurarse de que todos los tests pasan (smoke, unit, property-based, componentes, pantallas). Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los property tests usan `fast-check` con mínimo 100 iteraciones (`{ numRuns: 100 }`)
- Cada property test debe incluir el comentario: `// Feature: san-alejo-app, Property N: <texto>`
- Los tests de repositorio usan BD en memoria: `SQLite.openDatabaseAsync(':memory:')`
- Los tests de componentes y pantallas usan mocks de `expo-router` y de los repositorios
- `PRAGMA foreign_keys = ON` debe ejecutarse en cada conexión; el `onInit` de `SQLiteProvider` es el lugar correcto
