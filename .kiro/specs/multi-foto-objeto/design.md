# Design Document — Multi-Foto por Objeto

## Overview

Esta feature extiende la app San Alejo para que cada objeto pueda tener una **galería de fotos** (0-N imágenes) en lugar de una única foto opcional. El cambio abarca cuatro capas:

1. **Base de datos**: nueva tabla `objeto_foto` con relación 1-N respecto a `objeto`, migración de datos existentes desde `foto_uri`.
2. **Capa de datos**: nuevo módulo `fotoRepository` + extensión de `objetoRepository` y `contenedorRepository` para coordinar la eliminación en cascada de archivos.
3. **Componentes UI**: nuevo `GaleriaEditor` (gestión de fotos en formularios) y nuevo `VisorGaleria` (navegación modal con zoom).
4. **Pantallas**: actualización de `nuevo.tsx`, `editar/[id].tsx`, `contenedor/[id].tsx` y `busqueda.tsx` para consumir la nueva capa.

La columna `foto_uri` de la tabla `objeto` **no se elimina** en esta versión; queda como campo legado sin uso activo tras la migración, lo que simplifica el rollback y evita romper código existente que aún la referencia.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Screens / Navigation (expo-router)                             │
│  nuevo.tsx  │  editar/[id].tsx  │  contenedor/[id].tsx  │  busqueda.tsx │
└──────┬──────┴────────┬──────────┴──────────┬────────────┴───────┘
       │               │                     │
       ▼               ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI Components                                                  │
│  GaleriaEditor (nuevo)  │  VisorGaleria (nuevo)                 │
│  ObjetoItem (actualizado)  │  ImagePickerButton (sin cambios)   │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Data Layer                                                     │
│  fotoRepository (nuevo)  │  objetoRepository (extendido)        │
│  contenedorRepository (extendido)                               │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Infrastructure                                                 │
│  schema.ts (migración v3)  │  imageStorage.ts (sin cambios)     │
│  expo-sqlite  │  expo-file-system  │  expo-image-picker         │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de guardado (modo creación)

```
Usuario toca "Agregar foto"
  → ImagePicker devuelve URI temporal
  → copyImageToStorage() copia al directorio persistente
  → GaleriaEditor añade la foto al estado local (pendingPhotos[])
Usuario toca "Guardar"
  → insertObjeto() crea el registro en objeto
  → fotoRepository.insertFotos() inserta N filas en objeto_foto
```

### Flujo de guardado (modo edición)

```
Pantalla carga → fotoRepository.getFotosByObjeto() → estado inicial
Usuario modifica galería (agrega / elimina)
  → cambios solo en estado local (addedPhotos[], removedPhotoIds[])
Usuario toca "Guardar"
  → fotoRepository.syncFotos() en transacción:
      DELETE fotos removidas de objeto_foto
      INSERT fotos nuevas en objeto_foto
      UPDATE orden de fotos restantes
  → deleteImagesFromStorage(removedUris) limpia archivos
Usuario cancela
  → deleteImagesFromStorage(addedPhotos) limpia archivos copiados en esta sesión
```

---

## Components and Interfaces

### `fotoRepository` (nuevo — `src/db/fotoRepository.ts`)

```typescript
export interface FotoObjeto {
  id: number;
  id_objeto: number;
  uri: string;
  orden: number;
}

/** Retorna todas las fotos de un objeto ordenadas por `orden` ASC. */
export async function getFotosByObjeto(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<FotoObjeto[]>

/** Inserta múltiples fotos para un objeto recién creado. */
export async function insertFotos(
  db: SQLiteDatabase,
  id_objeto: number,
  uris: string[]
): Promise<void>

/**
 * Sincroniza la galería de un objeto existente en una transacción:
 * - Elimina los registros con ids en `deletedIds`
 * - Inserta las URIs en `newUris` con orden a partir de `existingCount`
 * - Actualiza el campo `orden` de todas las fotos restantes
 */
export async function syncFotos(
  db: SQLiteDatabase,
  id_objeto: number,
  deletedIds: number[],
  newUris: string[],
  orderedIds: number[]   // ids de fotos existentes en el orden final
): Promise<void>

/** Retorna todas las URIs de fotos de un objeto (para cascade delete). */
export async function getUrisByObjeto(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<string[]>

/** Retorna todas las URIs de fotos de todos los objetos de un contenedor. */
export async function getUrisByContenedor(
  db: SQLiteDatabase,
  id_contenedor: number
): Promise<string[]>

/** Retorna la URI de la foto portada (menor orden) de un objeto, o null. */
export async function getPortadaUri(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<string | null>
```

### `objetoRepository` — extensiones

```typescript
// Tipo extendido para incluir la foto portada en listados
export interface ObjetoConPortada extends Objeto {
  portada_uri: string | null;
}

// Reemplaza getObjetosByContenedor para incluir portada via LEFT JOIN
export async function getObjetosConPortadaByContenedor(
  db: SQLiteDatabase,
  id_contenedor: number
): Promise<ObjetoConPortada[]>

// Reemplaza searchObjetos para incluir portada
export interface ObjetoConContenedorYPortada extends ObjetoConContenedor {
  portada_uri: string | null;
}
export async function searchObjetosConPortada(
  db: SQLiteDatabase,
  query: string
): Promise<ObjetoConContenedorYPortada[]>
```

Las funciones originales `getObjetosByContenedor` y `searchObjetos` se mantienen por compatibilidad con tests existentes pero las pantallas migran a las nuevas variantes.

### `contenedorRepository` — extensiones

```typescript
/**
 * Elimina un contenedor y antes limpia todos los archivos de imagen
 * de sus objetos. Retorna las URIs eliminadas (para logging/tests).
 */
export async function deleteContenedorConFotos(
  db: SQLiteDatabase,
  id: number,
  fotoRepo: { getUrisByContenedor: typeof getUrisByContenedor }
): Promise<string[]>
```

La función `deleteContenedor` existente se mantiene; las pantallas que eliminan contenedores migran a `deleteContenedorConFotos`.

### `GaleriaEditor` (nuevo — `src/components/GaleriaEditor.tsx`)

Componente controlado que gestiona la lista de fotos en el formulario de objeto.

```typescript
export interface FotoLocal {
  /** null para fotos nuevas aún no persistidas */
  id: number | null;
  uri: string;
  /** true si fue copiada en esta sesión (candidata a limpieza si se cancela) */
  isNew: boolean;
}

interface GaleriaEditorProps {
  fotos: FotoLocal[];
  onFotosChange: (fotos: FotoLocal[]) => void;
  onPermissionDenied: () => void;
  onError: (msg: string) => void;
}
```

Internamente usa `ImagePickerButton` para la captura/selección y renderiza las miniaturas en un `ScrollView` horizontal con botón de eliminar por foto.

### `VisorGaleria` (nuevo — `src/components/VisorGaleria.tsx`)

Modal de navegación de galería. Reutiliza la lógica de zoom/pan de `ImageViewer` pero añade navegación horizontal entre fotos.

```typescript
interface VisorGaleriaProps {
  fotos: Array<{ uri: string }>;
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}
```

Internamente usa un `FlatList` horizontal con `pagingEnabled` para el deslizamiento entre fotos. Cada ítem renderiza la lógica de zoom/pan extraída de `ImageViewer` (o reutiliza `ImageViewer` embebido sin el Modal wrapper).

### `ObjetoItem` — actualización de props

```typescript
interface ObjetoItemProps {
  objeto: ObjetoConPortada;   // cambia de Objeto a ObjetoConPortada
  onEdit: () => void;
  onDelete: () => void;
  onPressFoto?: () => void;
}
```

El componente usa `objeto.portada_uri` en lugar de `objeto.foto_uri` para la miniatura.

---

## Data Models

### Tabla `objeto_foto` (nueva)

```sql
CREATE TABLE IF NOT EXISTS objeto_foto (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  id_objeto  INTEGER NOT NULL,
  uri        TEXT    NOT NULL,
  orden      INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_objeto_foto_id_objeto
  ON objeto_foto (id_objeto);
```

El índice en `id_objeto` optimiza las consultas de galería y portada, que siempre filtran por este campo.

### Migración v2 → v3 (`schema.ts`)

```typescript
// Dentro de initializeDatabase(), rama user_version === 2:
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS objeto_foto (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    id_objeto  INTEGER NOT NULL,
    uri        TEXT    NOT NULL,
    orden      INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_objeto_foto_id_objeto
    ON objeto_foto (id_objeto);
`);

// Migrar foto_uri existentes
await db.execAsync(`
  INSERT INTO objeto_foto (id_objeto, uri, orden)
  SELECT id, foto_uri, 0
  FROM objeto
  WHERE foto_uri IS NOT NULL;
`);

await db.execAsync('PRAGMA user_version = 3;');
```

La constante `DATABASE_VERSION` pasa de `2` a `3`.

### Consulta de portada (usada en listados y búsqueda)

```sql
-- Portada de un objeto específico
SELECT uri
FROM objeto_foto
WHERE id_objeto = ?
ORDER BY orden ASC
LIMIT 1;

-- Listado de objetos con portada (JOIN)
SELECT o.*,
       (SELECT uri FROM objeto_foto
        WHERE id_objeto = o.id
        ORDER BY orden ASC
        LIMIT 1) AS portada_uri
FROM objeto o
WHERE o.id_contenedor = ?
ORDER BY o.nombre ASC;
```

### Tipos TypeScript actualizados

```typescript
// FotoObjeto — entidad de la tabla objeto_foto
export interface FotoObjeto {
  id: number;
  id_objeto: number;
  uri: string;
  orden: number;
}

// ObjetoConPortada — usado en listados y búsqueda
export interface ObjetoConPortada extends Objeto {
  portada_uri: string | null;
}
```

---

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema — esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquinas.*

---

### Property 1: La migración preserva exactamente las fotos existentes

*Para cualquier* conjunto de objetos en una base de datos en versión 2 (algunos con `foto_uri` no nula, otros con `foto_uri` nula), después de ejecutar `initializeDatabase()`, la tabla `objeto_foto` debe contener exactamente un registro por cada objeto que tenía `foto_uri` no nula, con `uri` igual al valor de `foto_uri` y `orden` igual a 0. Los objetos sin `foto_uri` no deben generar ningún registro.

**Validates: Requirements 1.2**

---

### Property 2: La inicialización de la base de datos es idempotente

*Para cualquier* estado de datos en una base de datos ya en versión 3, ejecutar `initializeDatabase()` nuevamente no debe modificar ningún registro existente en `objeto_foto` ni en `objeto`.

**Validates: Requirements 1.4**

---

### Property 3: GaleriaEditor muestra las fotos en el orden correcto

*Para cualquier* lista de `FotoLocal` con valores de `orden` arbitrarios, el componente `GaleriaEditor` debe renderizar las miniaturas en el mismo orden en que se le pasan, y al cargar el formulario de edición con fotos obtenidas de la BD (ordenadas por `orden` ASC), las miniaturas deben aparecer en ese mismo orden.

**Validates: Requirements 2.1, 3.1**

---

### Property 4: Agregar una foto la coloca al final de la galería

*Para cualquier* estado de la galería con N fotos y cualquier URI de imagen nueva, después de que el usuario selecciona la imagen, la galería debe tener N+1 fotos y la nueva foto debe aparecer en la última posición con `isNew = true`.

**Validates: Requirements 2.4, 3.2**

---

### Property 5: insertFotos persiste exactamente las fotos con el orden correcto

*Para cualquier* lista de URIs de longitud N ≥ 0, después de llamar `insertFotos(db, id_objeto, uris)`, una llamada a `getFotosByObjeto(db, id_objeto)` debe retornar exactamente N registros donde el registro en la posición i tiene `uri = uris[i]` y `orden = i`.

**Validates: Requirements 2.5, 2.6**

---

### Property 6: Eliminar una foto del estado local no modifica la base de datos

*Para cualquier* galería con N fotos (N ≥ 1) y cualquier índice válido i, después de eliminar la foto en la posición i del estado local del `GaleriaEditor`, el estado local debe tener N-1 fotos y la foto eliminada no debe aparecer, pero la tabla `objeto_foto` en la BD no debe haber sido modificada.

**Validates: Requirements 3.3**

---

### Property 7: syncFotos sincroniza la BD con el estado exacto de la galería

*Para cualquier* estado inicial de fotos en `objeto_foto` y cualquier conjunto de cambios (IDs a eliminar, URIs nuevas a insertar, orden final), después de llamar `syncFotos()`, una llamada a `getFotosByObjeto()` debe retornar exactamente el conjunto de fotos que refleja el estado final esperado: sin las fotos eliminadas, con las fotos nuevas añadidas, y con los valores de `orden` actualizados según la posición en la lista final.

**Validates: Requirements 3.4**

---

### Property 8: Al guardar, se eliminan del FileSystem exactamente las fotos removidas

*Para cualquier* conjunto de fotos marcadas para eliminación (con sus URIs), al confirmar el guardado, `deleteImagesFromStorage` debe ser invocado con exactamente ese conjunto de URIs — ni más ni menos.

**Validates: Requirements 3.5**

---

### Property 9: Al cancelar, se eliminan del FileSystem exactamente las fotos nuevas no guardadas

*Para cualquier* conjunto de fotos con `isNew = true` presentes en el estado del formulario al momento de cancelar, `deleteImagesFromStorage` debe ser invocado con exactamente las URIs de esas fotos — ni más ni menos.

**Validates: Requirements 3.6**

---

### Property 10: ObjetoItem muestra la portada correcta para cualquier objeto

*Para cualquier* `ObjetoConPortada`, si `portada_uri` es no nula, el componente `ObjetoItem` debe renderizar un elemento `Image` con `source.uri` igual a `portada_uri`; si `portada_uri` es nula, debe renderizar el ícono de placeholder en lugar de una imagen.

**Validates: Requirements 4.1, 4.2, 8.1, 8.2**

---

### Property 11: La portada se actualiza correctamente tras eliminar la foto de menor orden

*Para cualquier* conjunto de fotos de un objeto con órdenes arbitrarios (N ≥ 2), después de eliminar la foto con el menor valor de `orden`, `getPortadaUri()` debe retornar la URI de la foto que tenía el segundo menor valor de `orden` en el conjunto original.

**Validates: Requirements 4.3**

---

### Property 12: VisorGaleria muestra las fotos en el orden correcto con indicador preciso

*Para cualquier* lista de fotos de longitud N ≥ 1 y cualquier índice inicial i (0 ≤ i < N), el `VisorGaleria` debe: (a) renderizar las fotos en el mismo orden que se le pasan, y (b) mostrar el texto de indicador `"{i+1} / {N}"` para la foto en la posición i.

**Validates: Requirements 5.2, 5.3**

---

### Property 13: getUrisByObjeto retorna exactamente las URIs de las fotos del objeto

*Para cualquier* objeto con N fotos insertadas en `objeto_foto`, `getUrisByObjeto(db, id_objeto)` debe retornar exactamente las N URIs de esas fotos — sin duplicados ni omisiones.

**Validates: Requirements 6.1**

---

### Property 14: getUrisByContenedor retorna exactamente las URIs de todos los objetos del contenedor

*Para cualquier* contenedor con M objetos, donde el objeto j tiene N_j fotos, `getUrisByContenedor(db, id_contenedor)` debe retornar exactamente ∑N_j URIs — la unión de todas las URIs de fotos de todos los objetos del contenedor, sin duplicados ni omisiones.

**Validates: Requirements 7.1**

---

### Property 15: searchObjetosConPortada retorna la portada de menor orden para cada resultado

*Para cualquier* conjunto de objetos con múltiples fotos en `objeto_foto`, `searchObjetosConPortada()` debe retornar para cada objeto un campo `portada_uri` igual a la `uri` del registro de `objeto_foto` con el menor valor de `orden` para ese `id_objeto`.

**Validates: Requirements 8.3**

---

## Error Handling

### Errores de migración de base de datos (Req. 1.5)

Si `initializeDatabase()` lanza una excepción durante la migración v2→v3, el `_layout.tsx` debe capturarla y mostrar un mensaje de error bloqueante al usuario indicando que no se pudo actualizar el almacenamiento local. La app no debe continuar con la navegación normal en este estado.

**Estrategia**: `try/catch` en el `useEffect` de inicialización en `_layout.tsx`. El estado de error se renderiza en lugar del `<Slot />` de navegación.

### Errores de FileSystem al copiar imágenes (Req. 2.8)

Si `copyImageToStorage()` falla, el formulario muestra un banner de error no bloqueante y continúa. La foto no se agrega a la galería. El guardado del resto de los datos del objeto no se interrumpe.

### Errores de FileSystem al eliminar imágenes (Req. 6.4, 7.4)

Si `deleteImagesFromStorage()` falla (parcial o totalmente), la eliminación del registro en BD continúa de todas formas. Se muestra un mensaje informativo al usuario indicando que algunos archivos de imagen no pudieron eliminarse. Los archivos huérfanos quedan en el FileSystem pero no afectan la integridad de la BD.

**Estrategia**: `try/catch` separado para la eliminación de archivos, con `Promise.allSettled` en lugar de `Promise.all` para tolerar fallos parciales.

### Errores de sincronización de galería (Req. 3.7)

Si `syncFotos()` falla, el formulario muestra un banner de error y no navega hacia atrás. Los datos en BD permanecen sin cambios (la transacción hace rollback automático). Los archivos de imagen copiados en esta sesión **no** se eliminan (el usuario puede reintentar).

### Errores de carga de imagen en VisorGaleria (Req. 5.6)

Si una imagen no puede cargarse (archivo no encontrado), el ítem del `FlatList` muestra un estado de error local (ícono + texto) sin cerrar el modal ni afectar la navegación a otras fotos.

### Permisos denegados (Req. 2.7)

Si el usuario deniega el permiso de cámara o galería, se muestra un mensaje informativo indicando que debe conceder el permiso en la configuración del dispositivo. No se interrumpe ninguna operación en curso.

---

## Testing Strategy

### Enfoque dual: tests unitarios + tests basados en propiedades

El proyecto ya tiene `fast-check ^4.8.0` instalado como devDependency, por lo que se usará directamente para los property-based tests.

**Tests unitarios** (Jest + `@testing-library/react-native`):
- Verifican comportamientos específicos, casos de error y flujos de UI concretos.
- Cubren los criterios clasificados como EXAMPLE y SMOKE.
- Se ubican en `__tests__/unit/` y `__tests__/components/`.

**Property-based tests** (fast-check):
- Verifican las 15 propiedades definidas en la sección anterior.
- Cada test ejecuta mínimo **100 iteraciones** (configuración por defecto de fast-check).
- Se ubican en `__tests__/unit/` para tests de repositorio y `__tests__/components/` para tests de componentes.
- Cada test incluye un comentario de trazabilidad:
  ```
  // Feature: multi-foto-objeto, Property N: <texto de la propiedad>
  ```

### Tests de repositorio (`fotoRepository`)

| Test | Tipo | Propiedad |
|------|------|-----------|
| `insertFotos` + `getFotosByObjeto` round-trip | PBT | Property 5 |
| `syncFotos` sincroniza estado exacto | PBT | Property 7 |
| `getUrisByObjeto` retorna URIs exactas | PBT | Property 13 |
| `getUrisByContenedor` retorna URIs de todos los objetos | PBT | Property 14 |
| `getPortadaUri` retorna la de menor orden | PBT | Property 11 |
| `searchObjetosConPortada` retorna portada correcta | PBT | Property 15 |

### Tests de migración (`schema.ts`)

| Test | Tipo | Propiedad |
|------|------|-----------|
| Migración v2→v3 preserva foto_uri existentes | PBT | Property 1 |
| `initializeDatabase()` es idempotente en v3 | PBT | Property 2 |
| Tabla `objeto_foto` creada con estructura correcta | SMOKE | Req. 1.1, 1.3 |
| ON DELETE CASCADE elimina registros de `objeto_foto` | SMOKE | Req. 6.3, 7.3 |

### Tests de componentes

| Test | Tipo | Propiedad |
|------|------|-----------|
| `GaleriaEditor` renderiza fotos en orden correcto | PBT | Property 3 |
| `GaleriaEditor` agrega foto al final | PBT | Property 4 |
| `GaleriaEditor` elimina foto del estado local sin tocar BD | PBT | Property 6 |
| `ObjetoItem` muestra portada o placeholder según `portada_uri` | PBT | Property 10 |
| `VisorGaleria` renderiza fotos en orden con indicador correcto | PBT | Property 12 |
| `VisorGaleria` muestra estado de error por foto sin cerrar modal | EXAMPLE | Req. 5.6 |
| `GaleriaEditor` muestra mensaje al denegar permiso | EXAMPLE | Req. 2.7 |
| `GaleriaEditor` muestra mensaje al fallar copia de archivo | EXAMPLE | Req. 2.8 |

### Tests de pantallas (integración de componentes)

| Test | Tipo | Propiedad |
|------|------|-----------|
| Al guardar, `deleteImagesFromStorage` recibe URIs removidas | PBT | Property 8 |
| Al cancelar, `deleteImagesFromStorage` recibe URIs nuevas | PBT | Property 9 |
| Al guardar con error de BD, se muestra mensaje y no se navega | EXAMPLE | Req. 3.7 |
| Al eliminar objeto con error de FileSystem, BD se actualiza y se muestra mensaje | EXAMPLE | Req. 6.4 |
| Al eliminar contenedor con error de FileSystem, BD se actualiza y se muestra mensaje | EXAMPLE | Req. 7.4 |

### Generadores fast-check para este feature

```typescript
// URI de imagen local
const fcUri = fc.string({ minLength: 5 }).map(s => `file:///images/${s}.jpg`);

// FotoLocal (estado del GaleriaEditor)
const fcFotoLocal = fc.record({
  id: fc.option(fc.integer({ min: 1 }), { nil: null }),
  uri: fcUri,
  isNew: fc.boolean(),
});

// FotoObjeto (entidad de BD)
const fcFotoObjeto = (id_objeto: number) => fc.record({
  id: fc.integer({ min: 1 }),
  id_objeto: fc.constant(id_objeto),
  uri: fcUri,
  orden: fc.integer({ min: 0, max: 100 }),
});

// Lista de URIs para insertFotos
const fcUriList = fc.array(fcUri, { minLength: 0, maxLength: 20 });
```
