# Documento de Requisitos

## Introducción

La pantalla principal de San Alejo muestra la lista de contenedores ordenada únicamente por nombre. Cuando el número de contenedores crece, navegar por la lista se vuelve tedioso. Esta funcionalidad agrega controles de **ordenamiento** (por nombre, fecha de creación y cantidad de objetos) y **filtrado por ubicación**, permitiendo al usuario encontrar rápidamente el contenedor que busca.

La implementación requiere también una migración de base de datos para agregar el campo `fecha_creacion` a la tabla `contenedor`, ya que actualmente no existe.

---

## Glosario

- **Lista_Contenedores**: La pantalla principal (`app/index.tsx`) que muestra todos los contenedores del usuario.
- **Contenedor**: Registro en la base de datos con campos `id`, `nombre`, `descripcion`, `ubicacion` y (tras la migración) `fecha_creacion`.
- **Panel_Filtros**: Componente de UI que expone los controles de ordenamiento y filtro de ubicación.
- **Criterio_Orden**: Valor que determina el campo por el cual se ordena la lista. Valores posibles: `nombre`, `fecha_creacion`, `cantidad_objetos`.
- **Direccion_Orden**: Sentido del ordenamiento. Valores posibles: `asc` (ascendente), `desc` (descendente).
- **Filtro_Ubicacion**: Valor de texto que restringe la lista a contenedores cuya ubicación coincida (parcial, sin distinción de mayúsculas).
- **Repositorio_Contenedor**: Módulo `src/db/contenedorRepository.ts` que encapsula el acceso a la tabla `contenedor`.
- **Schema**: Módulo `src/db/schema.ts` que gestiona la inicialización y migración de la base de datos SQLite.

---

## Requisitos

### Requisito 1: Migración de base de datos — campo `fecha_creacion`

**User Story:** Como desarrollador, quiero que la tabla `contenedor` tenga un campo `fecha_creacion`, para poder ordenar los contenedores por fecha de creación.

#### Criterios de Aceptación

1. THE Schema SHALL agregar la columna `fecha_creacion INTEGER NOT NULL DEFAULT 0` a la tabla `contenedor` mediante una migración incremental que preserve los datos existentes.
2. WHEN se inserta un nuevo contenedor, THE Repositorio_Contenedor SHALL registrar la fecha de creación como el timestamp Unix en segundos del momento de la inserción.
3. WHEN la base de datos ya está en la versión que incluye `fecha_creacion`, THE Schema SHALL omitir la migración sin producir errores.
4. WHEN la base de datos se migra desde una versión anterior, THE Schema SHALL asignar `fecha_creacion = 0` a los contenedores existentes como valor de marcador de posición.

---

### Requisito 2: Ordenamiento de la lista de contenedores

**User Story:** Como usuario, quiero ordenar la lista de contenedores por nombre, fecha de creación o cantidad de objetos, para encontrar rápidamente el contenedor que busco.

#### Criterios de Aceptación

1. THE Lista_Contenedores SHALL soportar los criterios de orden `nombre`, `fecha_creacion` y `cantidad_objetos`.
2. THE Lista_Contenedores SHALL soportar las direcciones de orden `asc` y `desc` para cada criterio.
3. WHEN el usuario selecciona un criterio de orden, THE Lista_Contenedores SHALL reordenar la lista aplicando ese criterio en la dirección activa.
4. WHEN el usuario selecciona el mismo criterio de orden que ya está activo, THE Lista_Contenedores SHALL invertir la dirección de orden.
5. WHEN la aplicación se inicia por primera vez, THE Lista_Contenedores SHALL mostrar los contenedores ordenados por `nombre` en dirección `asc`.
6. THE Lista_Contenedores SHALL persistir el criterio de orden y la dirección seleccionados entre sesiones de la aplicación.
7. WHEN se aplica el criterio `cantidad_objetos`, THE Repositorio_Contenedor SHALL calcular la cantidad de objetos de cada contenedor mediante una subconsulta SQL, sin cargar los objetos en memoria.

---

### Requisito 3: Filtrado por ubicación

**User Story:** Como usuario, quiero filtrar la lista de contenedores por ubicación, para ver solo los contenedores que están en un lugar específico.

#### Criterios de Aceptación

1. THE Panel_Filtros SHALL presentar al usuario la lista de valores de ubicación únicos presentes en los contenedores existentes.
2. WHEN el usuario selecciona una ubicación del Panel_Filtros, THE Lista_Contenedores SHALL mostrar únicamente los contenedores cuya ubicación coincida con el valor seleccionado (comparación exacta, sin distinción de mayúsculas).
3. WHEN el usuario deselecciona la ubicación activa, THE Lista_Contenedores SHALL mostrar todos los contenedores sin restricción de ubicación.
4. WHEN no existe ningún contenedor con ubicación registrada, THE Panel_Filtros SHALL ocultar el selector de ubicación.
5. WHEN se aplica un filtro de ubicación, THE Lista_Contenedores SHALL mantener activo el criterio de orden y la dirección seleccionados.
6. THE Lista_Contenedores SHALL persistir el filtro de ubicación activo entre sesiones de la aplicación.

---

### Requisito 4: Panel de controles de ordenamiento y filtro

**User Story:** Como usuario, quiero acceder a los controles de ordenamiento y filtro desde la pantalla principal, para ajustar la vista sin abandonar la lista.

#### Criterios de Aceptación

1. THE Lista_Contenedores SHALL mostrar un indicador visual cuando hay algún filtro u orden no predeterminado activo.
2. WHEN el usuario interactúa con el Panel_Filtros, THE Lista_Contenedores SHALL actualizar la lista en menos de 300 ms desde la interacción.
3. THE Panel_Filtros SHALL ser accesible mediante un botón en la barra de navegación o en la cabecera de la lista.
4. WHEN la lista de contenedores está vacía tras aplicar filtros, THE Lista_Contenedores SHALL mostrar un mensaje que indique que no hay contenedores para los filtros activos y ofrezca la opción de limpiar los filtros.
5. THE Panel_Filtros SHALL mostrar un botón para restablecer todos los filtros y el orden a sus valores predeterminados (`nombre` / `asc` / sin filtro de ubicación).
6. WHERE el tema visual activo es oscuro, THE Panel_Filtros SHALL usar los tokens de color del tema oscuro definidos en `src/theme.ts`.
7. WHERE el tema visual activo es claro, THE Panel_Filtros SHALL usar los tokens de color del tema claro definidos en `src/theme.ts`.

---

### Requisito 5: Consulta combinada con orden y filtro

**User Story:** Como desarrollador, quiero que el Repositorio_Contenedor exponga una función que combine filtro de ubicación, criterio de orden y dirección en una sola consulta SQL, para mantener la lógica de acceso a datos centralizada.

#### Criterios de Aceptación

1. THE Repositorio_Contenedor SHALL exponer una función `getContenedoresFiltrados` que acepte los parámetros `filtroUbicacion` (string o null), `criterioOrden` (Criterio_Orden) y `direccionOrden` (Direccion_Orden).
2. WHEN `filtroUbicacion` es null, THE Repositorio_Contenedor SHALL omitir la cláusula WHERE de ubicación en la consulta SQL.
3. WHEN `criterioOrden` es `cantidad_objetos`, THE Repositorio_Contenedor SHALL ordenar por el resultado de una subconsulta `(SELECT COUNT(*) FROM objeto WHERE id_contenedor = contenedor.id)`.
4. THE Repositorio_Contenedor SHALL construir la cláusula ORDER BY usando únicamente los valores permitidos de Criterio_Orden y Direccion_Orden, sin interpolar texto arbitrario del usuario en la consulta SQL.
5. FOR ALL combinaciones válidas de `filtroUbicacion`, `criterioOrden` y `direccionOrden`, THE Repositorio_Contenedor SHALL retornar un array de Contenedor ordenado y filtrado de forma consistente con los parámetros recibidos (propiedad de consistencia de resultados).
