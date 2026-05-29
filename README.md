# San Alejo — Inventario de Contenedores

Aplicación móvil para Android e iOS construida con **Expo / React Native** que permite organizar objetos físicos dentro de contenedores (cajas, maletas, cajones, etc.), con soporte para fotos, etiquetas, búsqueda y exportación a PDF.

---

## Capturas de pantalla

| Lista de contenedores | Detalle de contenedor |
|---|---|
| ![Lista de contenedores](../Capturas/1000184692.jpg) | ![Detalle de contenedor con objetos](../Capturas/1000184694.jpg) |

| Formulario nuevo contenedor | Formulario nuevo objeto con galería |
|---|---|
| ![Formulario de nuevo contenedor](../Capturas/1000184677.jpg) | ![Formulario de nuevo objeto con galería de fotos](../Capturas/1000184693.jpg) |

| Búsqueda por nombre y etiquetas | Panel de filtros y ordenamiento |
|---|---|
| ![Búsqueda de objetos por nombre y etiquetas](../Capturas/1000184680.jpg) | ![Panel de filtros y criterios de ordenamiento](../Capturas/1000184681.jpg) |

| Confirmación de eliminación | Estado vacío |
|---|---|
| ![Diálogo de confirmación de eliminación](../Capturas/1000184676.jpg) | ![Estado vacío sin contenedores](../Capturas/1000184678.jpg) |

---

## Características principales

- **Contenedores** — Crea, edita y elimina contenedores con nombre, descripción y ubicación.
- **Objetos** — Agrega objetos a cada contenedor con nombre, descripción, múltiples fotos y etiquetas.
- **Galería de fotos** — Captura desde la cámara o selecciona desde la galería; visor de pantalla completa con gestos.
- **Etiquetas** — Sistema de etiquetas reutilizables para clasificar objetos; limpieza automática de etiquetas huérfanas.
- **Búsqueda** — Búsqueda en tiempo real por nombre y descripción de objetos, con filtrado por etiqueta mediante chips.
- **Filtros y orden** — Panel deslizante para ordenar contenedores por nombre, fecha de creación o cantidad de objetos, y filtrar por ubicación o etiquetas. El estado se persiste en `AsyncStorage`.
- **Exportación PDF** — Genera un PDF del inventario completo con imágenes embebidas en base64 y lo comparte mediante el sistema nativo.
- **Tema claro/oscuro** — Sigue automáticamente el esquema del sistema con tokens de diseño WCAG AA.
- **Base de datos local** — SQLite con migraciones versionadas (v1 → v5); sin dependencia de red.

---

## Tecnologías

| Categoría | Librería / Versión |
|---|---|
| Framework | Expo ~54.0 / React Native 0.81 |
| Navegación | Expo Router ~6.0 (file-based) |
| Base de datos | expo-sqlite ~16.0 |
| Imágenes | expo-image-picker ~17.0, expo-file-system ~19.0 |
| PDF | expo-print ~15.0, expo-sharing ~14.0 |
| Persistencia UI | @react-native-async-storage/async-storage 2.2 |
| Gestos | react-native-gesture-handler ~2.28 |
| Animaciones | react-native-reanimated ~4.1 |
| Testing | Jest 29 + jest-expo, @testing-library/react-native, fast-check |
| Lenguaje | TypeScript ~5.9 |

---

## Estructura del proyecto

```
SanAlejo/
├── app/                        # Rutas (Expo Router file-based)
│   ├── _layout.tsx             # Root layout: SQLiteProvider + ThemeProvider
│   ├── index.tsx               # Pantalla principal — lista de contenedores
│   ├── busqueda.tsx            # Búsqueda global de objetos
│   └── contenedor/
│       ├── [id].tsx            # Detalle de contenedor
│       ├── nuevo.tsx           # Formulario nuevo contenedor
│       ├── editar/[id].tsx     # Formulario editar contenedor
│       └── objeto/
│           ├── nuevo.tsx       # Formulario nuevo objeto
│           └── editar/[id].tsx # Formulario editar objeto
├── src/
│   ├── components/             # Componentes reutilizables
│   │   ├── ContenedorItem.tsx  # Tarjeta de contenedor en la lista
│   │   ├── ObjetoItem.tsx      # Tarjeta de objeto en el detalle
│   │   ├── GaleriaEditor.tsx   # Editor de fotos con scroll horizontal
│   │   ├── VisorGaleria.tsx    # Visor de fotos a pantalla completa
│   │   ├── PanelFiltros.tsx    # Bottom sheet de filtros y orden
│   │   ├── TagPicker.tsx       # Selector de etiquetas con autocompletado
│   │   ├── ImagePickerButton.tsx
│   │   ├── ImageViewer.tsx
│   │   ├── FAB.tsx             # Botón flotante de acción
│   │   └── ConfirmDialog.tsx   # Diálogo de confirmación
│   ├── context/
│   │   └── ThemeContext.tsx    # Proveedor de tema claro/oscuro
│   ├── db/                     # Capa de acceso a datos
│   │   ├── schema.ts           # Inicialización y migraciones SQLite
│   │   ├── contenedorRepository.ts
│   │   ├── objetoRepository.ts
│   │   ├── fotoRepository.ts
│   │   ├── etiquetaRepository.ts
│   │   └── objetoEtiquetaRepository.ts
│   ├── hooks/
│   │   ├── useSortFilter.ts    # Estado de filtros persistido en AsyncStorage
│   │   └── useExportPdf.ts     # Lógica de generación y compartición de PDF
│   ├── utils/
│   │   ├── imageStorage.ts     # Copia/eliminación de imágenes en FileSystem
│   │   ├── exportService.ts    # Recolección de datos y generación de HTML/PDF
│   │   ├── pubsub.ts           # Bus de eventos ligero (etiquetas:changed)
│   │   └── validator.ts        # Validación de campos de formulario
│   └── theme.ts                # Design tokens: colores, tipografía, espaciado
├── __tests__/                  # Suite de pruebas
│   ├── unit/                   # Repositorios, servicios, hooks
│   ├── components/             # Componentes con React Testing Library
│   ├── screens/                # Pantallas integradas
│   └── smoke/                  # Verificación de base de datos y config EAS
└── __mocks__/                  # Mocks de módulos nativos para Jest
```

---

## Base de datos

La base de datos SQLite (`san-alejo.db`) se inicializa en el primer arranque y se migra automáticamente. Versión actual: **v5**.

### Esquema

```sql
-- Contenedores físicos (cajas, maletas, cajones…)
CREATE TABLE contenedor (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT NOT NULL,
  descripcion    TEXT NOT NULL,
  ubicacion      TEXT NOT NULL,
  fecha_creacion INTEGER NOT NULL DEFAULT 0   -- timestamp Unix (segundos)
);

-- Objetos dentro de un contenedor
CREATE TABLE objeto (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  descripcion   TEXT NOT NULL,
  id_contenedor INTEGER NOT NULL REFERENCES contenedor(id) ON DELETE CASCADE,
  foto_uri      TEXT   -- columna legacy; las fotos activas están en objeto_foto
);

-- Fotos de un objeto (múltiples, ordenadas)
CREATE TABLE objeto_foto (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  id_objeto INTEGER NOT NULL REFERENCES objeto(id) ON DELETE CASCADE,
  uri       TEXT NOT NULL,
  orden     INTEGER NOT NULL DEFAULT 0
);

-- Catálogo de etiquetas únicas
CREATE TABLE etiqueta (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT NOT NULL UNIQUE,
  fecha_creacion INTEGER NOT NULL DEFAULT 0
);

-- Relación N:M objeto ↔ etiqueta
CREATE TABLE objeto_etiqueta (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  id_objeto   INTEGER NOT NULL REFERENCES objeto(id) ON DELETE CASCADE,
  id_etiqueta INTEGER NOT NULL REFERENCES etiqueta(id) ON DELETE CASCADE,
  UNIQUE (id_objeto, id_etiqueta)
);
```

### Historial de migraciones

| Versión | Cambio |
|---|---|
| v1 | Tablas `contenedor` y `objeto` iniciales |
| v2 | Columna `foto_uri` en `objeto` |
| v3 | Tabla `objeto_foto`; migración de `foto_uri` existentes |
| v4 | Columna `fecha_creacion` en `contenedor` |
| v5 | Tablas `etiqueta` y `objeto_etiqueta` |

---

## Arquitectura

### Navegación

Expo Router gestiona las rutas mediante el sistema de archivos. El layout raíz (`_layout.tsx`) envuelve toda la app con:

1. `GestureHandlerRootView` — soporte de gestos nativo.
2. `ThemeProvider` — tema claro/oscuro reactivo al sistema.
3. `SQLiteProvider` con `useSuspense` — la base de datos se inicializa antes de renderizar cualquier pantalla.

### Capa de datos

Cada entidad tiene su propio repositorio con funciones puras que reciben la instancia `SQLiteDatabase` como primer argumento. No hay ORM; las consultas son SQL directo con parámetros enlazados para prevenir inyección.

El repositorio de contenedores implementa `getContenedoresFiltrados` con una whitelist de columnas para `ORDER BY`, garantizando que ningún valor de usuario se interpole directamente en el SQL.

### Almacenamiento de imágenes

Las fotos se copian al directorio persistente de la app (`FileSystem.documentDirectory/images/`) con nombres únicos basados en timestamp. Al eliminar un objeto o contenedor, los archivos se borran del sistema de archivos antes de eliminar el registro de la base de datos. Los fallos parciales de borrado se toleran con `Promise.allSettled`.

### Exportación PDF

El hook `useExportPdf` orquesta el proceso en seis pasos:

1. Recolectar datos del inventario desde SQLite.
2. Construir el HTML con imágenes embebidas como `data:image/jpeg;base64,…`.
3. Generar el PDF con `expo-print`.
4. Renombrar el archivo con la fecha (`inventario-san-alejo-YYYY-MM-DD.pdf`).
5. Compartir con `expo-sharing`.
6. Limpiar el archivo temporal en el bloque `finally`.

### Tema

El sistema de diseño define dos paletas (`darkColors` / `lightColors`) con contraste WCAG AA (≥ 4.5:1) y tokens compartidos de tipografía, espaciado, radios y sombras. El tema se resuelve automáticamente con `useColorScheme` de React Native.

---

## Instalación y desarrollo

### Requisitos

- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`) o `npx expo`
- Para dispositivo físico: app **Expo Go** o build de desarrollo con EAS

### Pasos

```bash
# Instalar dependencias
cd SanAlejo
npm install

# Iniciar el servidor de desarrollo
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

### Build con EAS

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Build de desarrollo (Android)
eas build --profile development --platform android

# Build de producción
eas build --profile production --platform all
```

La configuración de EAS está en `eas.json`. El `projectId` es `2523f7e7-39a4-4440-8fce-ae860203f973` bajo el owner `carlosmantillac`.

---

## Testing

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm run test:watch
```

### Cobertura de tests

| Directorio | Qué prueba |
|---|---|
| `__tests__/unit/` | Repositorios SQLite, `exportService`, `imageStorage`, `useSortFilter`, `validator` |
| `__tests__/unit/exportService.property.test.ts` | Tests de propiedad con `fast-check` |
| `__tests__/components/` | `ObjetoItem`, `PanelFiltros`, `ImageViewer`, `ThemeProvider` |
| `__tests__/screens/` | `DetalleContenedor`, `FormularioObjeto` (integración) |
| `__tests__/smoke/` | Inicialización de base de datos, configuración EAS |

Los módulos nativos (`expo-sqlite`, `expo-file-system`, `expo-image-picker`, `expo-print`, `expo-sharing`, `react-native-gesture-handler`, `@react-native-async-storage/async-storage`) tienen mocks en `__mocks__/`.

---

## Permisos requeridos

| Permiso | Uso |
|---|---|
| `READ_MEDIA_IMAGES` / `MEDIA_LIBRARY` | Seleccionar fotos de la galería |
| `CAMERA` | Capturar fotos con la cámara |

Los permisos se solicitan en el momento de uso (no al arrancar la app).

---

## Configuración del proyecto

| Archivo | Propósito |
|---|---|
| `app.json` | Configuración Expo: nombre, íconos, splash, plugins, orientación |
| `eas.json` | Perfiles de build EAS (development, preview, production) |
| `tsconfig.json` | Configuración TypeScript con paths de Expo |
| `metro.config.js` | Configuración del bundler Metro |
| `jest.config.js` | Configuración Jest con preset `jest-expo` |

---

## Licencia

Proyecto privado — todos los derechos reservados.
