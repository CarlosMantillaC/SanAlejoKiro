# Plan de Implementación: Export PDF

## Visión general

Implementar la exportación del inventario completo a PDF desde la pantalla principal de la app. La lógica de recopilación de datos y construcción de HTML se encapsula en `exportService.ts` (funciones puras, altamente testeables). El hook `useExportPdf.ts` orquesta el flujo completo (estado, llamadas a `expo-print` / `expo-sharing`, limpieza del archivo temporal). La pantalla `app/index.tsx` añade el botón en el header, el overlay de progreso y el diálogo de error.

El stack de implementación es TypeScript + React Native (Expo). Las dependencias `expo-print` y `expo-sharing` deben instalarse antes de comenzar.

---

## Tareas

- [x] 1. Instalar dependencias y crear mocks de test
  - Instalar `expo-print` y `expo-sharing` con `npx expo install expo-print expo-sharing`
  - Crear `SanAlejo/__mocks__/expo-print.js` con el mock de `Print.printToFileAsync`
  - Crear `SanAlejo/__mocks__/expo-sharing.js` con los mocks de `shareAsync` e `isAvailableAsync`
  - _Requirements: 3.1, 5.1_

- [x] 2. Implementar `exportService.ts` — tipos, `buildFileName` y `readImageAsBase64`
  - Crear `SanAlejo/src/utils/exportService.ts`
  - Definir e exportar las interfaces `FotoData`, `ObjetoData`, `ContenedorData`, `InventarioData`
  - Implementar `buildFileName(date: Date): string` — devuelve `inventario-san-alejo-YYYY-MM-DD.pdf`
  - Implementar `readImageAsBase64(uri: string): Promise<string | null>` — lee con `FileSystem.readAsStringAsync` en base64; retorna `null` si falla
  - _Requirements: 3.8, 5.2_

  - [ ]* 2.1 Escribir tests de ejemplo para `buildFileName` y `readImageAsBase64`
    - Verificar formato de fecha con casos concretos (inicio de año, fin de año, mes con cero)
    - Verificar que `readImageAsBase64` retorna `null` cuando el archivo no existe (mock de `expo-file-system`)
    - Archivo: `SanAlejo/__tests__/unit/exportService.test.ts`
    - _Requirements: 3.8, 5.2_

  - [ ]* 2.2 Escribir test de propiedad para `buildFileName`
    - **Property 6: El nombre de archivo siempre sigue el formato correcto**
    - Para cualquier `Date` válido, `buildFileName` debe devolver un string que coincida con `inventario-san-alejo-YYYY-MM-DD.pdf`
    - **Validates: Requirements 5.2**
    - Archivo: `SanAlejo/__tests__/unit/exportService.property.test.ts`

- [x] 3. Implementar `collectInventoryData` en `exportService.ts`
  - Añadir la función `collectInventoryData(db: SQLiteDatabase): Promise<InventarioData>`
  - Consultar todos los contenedores ordenados alfabéticamente por nombre (`ORDER BY nombre ASC`)
  - Para cada contenedor, consultar sus objetos ordenados alfabéticamente por nombre
  - Para cada objeto, consultar sus etiquetas y sus fotos (ordenadas por `orden ASC`)
  - Calcular `totalObjetos` como suma de objetos de todos los contenedores
  - Asignar `generadoEn: new Date()`
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.1 Escribir tests de propiedad para el ordenamiento de `collectInventoryData`
    - **Property 1: Contenedores ordenados alfabéticamente**
    - Para cualquier conjunto de contenedores con nombres arbitrarios, los contenedores devueltos deben estar ordenados por nombre ASC
    - **Validates: Requirements 2.1**
    - **Property 2: Objetos de cada contenedor ordenados alfabéticamente**
    - Para cualquier contenedor con objetos de nombres arbitrarios, los objetos devueltos deben estar ordenados por nombre ASC
    - **Validates: Requirements 2.2**
    - Archivo: `SanAlejo/__tests__/unit/exportService.property.test.ts`

- [x] 4. Implementar `buildHtml` en `exportService.ts`
  - Añadir la función `buildHtml(data: InventarioData): Promise<string>`
  - Generar encabezado con título "Inventario San Alejo", fecha/hora de generación, total de contenedores y total de objetos
  - Generar una sección por contenedor con nombre, descripción y ubicación
  - Para cada objeto: nombre, descripción, etiquetas (si las hay) e imágenes (si las hay)
  - Llamar a `readImageAsBase64` para cada foto e incrustar como data URI `data:image/jpeg;base64,...`; omitir si retorna `null`
  - Cuando un contenedor no tiene objetos, incluir indicación de vacío
  - Cuando un objeto no tiene fotos, omitir la sección de imágenes sin dejar espacio vacío
  - Aplicar `max-width: 100%` a todas las imágenes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 4.1 Escribir tests de ejemplo para `buildHtml`
    - Verificar que omite sección de imágenes cuando `fotos` está vacío (Requirement 3.5)
    - Verificar que incluye indicador de vacío cuando `objetos` está vacío (Requirement 3.2)
    - Verificar que incluye `max-width: 100%` en imágenes (Requirement 3.4)
    - Archivo: `SanAlejo/__tests__/unit/exportService.test.ts`
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ]* 4.2 Escribir tests de propiedad para `buildHtml`
    - **Property 3: El HTML generado contiene todos los datos de cada contenedor**
    - Para cualquier `InventarioData`, el HTML debe contener nombre, descripción y ubicación de cada contenedor
    - **Validates: Requirements 2.5, 3.1**
    - **Property 4: El HTML generado contiene todos los datos de cada objeto**
    - Para cualquier `InventarioData`, el HTML debe contener nombre, descripción y todas las etiquetas de cada objeto
    - **Validates: Requirements 2.6, 3.3**
    - **Property 5: El encabezado del HTML contiene el título y los conteos correctos**
    - Para cualquier `InventarioData`, el HTML debe contener "Inventario San Alejo", el número total de contenedores y el número total de objetos
    - **Validates: Requirements 3.6, 3.7**
    - Archivo: `SanAlejo/__tests__/unit/exportService.property.test.ts`

- [x] 5. Checkpoint — Verificar que todos los tests de `exportService` pasan
  - Ejecutar `jest --testPathPattern="exportService" --runInBand` y confirmar que todos los tests pasan
  - Asegurarse de que no hay errores de TypeScript en `exportService.ts`
  - Preguntar al usuario si hay dudas antes de continuar.

- [x] 6. Implementar `useExportPdf` hook
  - Crear `SanAlejo/src/hooks/useExportPdf.ts`
  - Definir e implementar la interfaz `UseExportPdfResult` con `isExporting`, `exportError`, `handleExport`, `clearError`
  - En `handleExport`:
    1. Establecer `isExporting = true`, `exportError = null`
    2. Llamar a `collectInventoryData(db)`
    3. Llamar a `buildHtml(data)`
    4. Llamar a `Print.printToFileAsync({ html })`
    5. Renombrar el archivo con `FileSystem.moveAsync` usando `buildFileName(new Date())`
    6. Verificar `Sharing.isAvailableAsync()`; si es `false`, lanzar error con mensaje apropiado
    7. Llamar a `shareAsync(uri)`
    8. En bloque `finally`: llamar a `FileSystem.deleteAsync(uri, { idempotent: true })` y establecer `isExporting = false`
  - Capturar errores de cada etapa y asignar mensajes específicos a `exportError`
  - _Requirements: 4.1, 4.2, 5.1, 5.3, 5.4, 6.1, 6.2, 6.3_

  - [ ]* 6.1 Escribir tests de ejemplo para `useExportPdf`
    - Verificar que `handleExport` llama a `shareAsync` con el URI correcto tras generación exitosa (Requirement 5.1)
    - Verificar que `handleExport` llama a `deleteAsync` tras compartir (Requirement 5.3)
    - Verificar que `handleExport` llama a `deleteAsync` en caso de error (limpieza garantizada)
    - Verificar que error de BD establece `exportError` con mensaje apropiado (Requirement 6.1)
    - Verificar que error de `printToFileAsync` establece `exportError` con mensaje apropiado (Requirement 6.2)
    - Archivo: `SanAlejo/__tests__/unit/useExportPdf.test.ts`
    - _Requirements: 5.1, 5.3, 6.1, 6.2_

- [x] 7. Modificar `app/index.tsx` — botón de exportación, overlay de progreso y diálogo de error
  - Importar `useExportPdf` y llamarlo con `db`
  - Añadir botón de exportación (ícono `share-outline` de Ionicons) al `headerRight` de `Stack.Screen`, junto a los botones existentes
  - Deshabilitar el botón cuando `contenedores.length === 0` o cuando `isExporting === true`
  - Añadir overlay de progreso: `Modal` o `View` absoluto con `ActivityIndicator` y texto "Generando PDF…", visible cuando `isExporting === true`
  - Añadir diálogo de error usando el componente `ConfirmDialog` existente (o un `Modal` simple) con el mensaje de `exportError` y botón "Reintentar" que llama a `handleExport` y botón "Cerrar" que llama a `clearError`
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 6.4_

- [x] 8. Checkpoint final — Verificar que todos los tests pasan
  - Ejecutar `jest --runInBand` y confirmar que todos los tests pasan sin errores
  - Verificar que no hay errores de TypeScript en los archivos modificados/creados
  - Preguntar al usuario si hay dudas antes de dar por completada la implementación.

---

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos para trazabilidad.
- Los checkpoints garantizan validación incremental antes de continuar.
- Los tests de propiedad usan `fast-check` (ya instalado) y se ubican en `exportService.property.test.ts`.
- Los tests de ejemplo usan Jest + `@testing-library/react-native` y se ubican en los archivos `*.test.ts` correspondientes.
- `expo-print` y `expo-sharing` deben instalarse con `npx expo install` (no `npm install`) para garantizar compatibilidad de versiones con el SDK de Expo instalado.
