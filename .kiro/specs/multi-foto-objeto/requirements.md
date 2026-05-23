# Requirements Document — Multi-Foto por Objeto

## Introduction

Esta funcionalidad extiende la app San Alejo para permitir que cada objeto tenga una galería de fotos en lugar de una única imagen. Actualmente la tabla `objeto` tiene una columna `foto_uri` (TEXT nullable) que limita cada objeto a una sola foto. La nueva funcionalidad introduce una tabla separada `objeto_foto` con relación 1-N respecto a `objeto`, permitiendo agregar, visualizar, reordenar y eliminar múltiples fotos por objeto. El campo `foto_uri` existente se mantiene durante la migración para preservar compatibilidad con datos existentes y se migra a la nueva tabla.

## Glossary

- **App**: La aplicación móvil San Alejo.
- **Objeto**: Artículo físico registrado dentro de un Contenedor. Tiene nombre, descripción y, opcionalmente, una galería de fotos.
- **Galeria_Objeto**: Conjunto ordenado de fotos asociadas a un Objeto, almacenadas en la tabla `objeto_foto`.
- **Foto_Objeto**: Imagen individual dentro de la Galeria_Objeto de un Objeto. Tiene un `id`, un `id_objeto` (FK), una `uri` (ruta local en el FileSystem) y un `orden` (INTEGER) que determina su posición en la galería.
- **Foto_Portada**: La Foto_Objeto con el menor valor de `orden` dentro de la Galeria_Objeto de un Objeto. Se usa como miniatura representativa en el listado del Detalle_Contenedor.
- **Base_de_Datos**: Instancia local de SQLite gestionada por expo-sqlite en el dispositivo del usuario.
- **FileSystem**: Módulo `expo-file-system` utilizado para copiar y eliminar archivos de imagen en el directorio persistente de la App (`FileSystem.documentDirectory + 'images/'`).
- **ImagePicker**: Módulo `expo-image-picker` utilizado para capturar fotos con la cámara o seleccionar imágenes de la galería del dispositivo.
- **Formulario_Objeto**: Pantalla con campos editables para crear o modificar un Objeto, incluyendo la gestión de su Galeria_Objeto.
- **Detalle_Contenedor**: Pantalla que muestra la información de un Contenedor y la lista de Objetos que contiene.
- **Visor_Galeria**: Componente modal que permite navegar entre las fotos de la Galeria_Objeto de un Objeto con soporte de zoom y deslizamiento horizontal.
- **fotoRepository**: Módulo de acceso a datos que encapsula todas las operaciones SQL sobre la tabla `objeto_foto`.
- **objetoRepository**: Módulo de acceso a datos existente que gestiona la tabla `objeto`. Se extiende para coordinar la eliminación en cascada de fotos.

---

## Requirements

### Requirement 1: Migración de base de datos a versión 3

**User Story:** Como usuario existente de la app, quiero que mis datos actuales (incluyendo la foto única que ya tenía cada objeto) se preserven al actualizar la app, para que no pierda ninguna información al pasar a la nueva versión.

#### Acceptance Criteria

1. WHEN la App se inicia con una base de datos en versión 2, THE Base_de_Datos SHALL crear la tabla `objeto_foto` con columnas `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `id_objeto` (INTEGER NOT NULL, FOREIGN KEY referenciando `objeto.id` ON DELETE CASCADE), `uri` (TEXT NOT NULL) y `orden` (INTEGER NOT NULL DEFAULT 0).
2. WHEN la App se inicia con una base de datos en versión 2, THE Base_de_Datos SHALL migrar cada registro de la tabla `objeto` cuyo campo `foto_uri` no sea NULL insertando una fila en `objeto_foto` con `id_objeto` igual al `id` del objeto, `uri` igual al valor de `foto_uri` y `orden` igual a 0.
3. WHEN la migración a versión 3 se completa, THE Base_de_Datos SHALL establecer `PRAGMA user_version = 3`.
4. WHEN la App se inicia con una base de datos ya en versión 3 o superior, THE Base_de_Datos SHALL omitir la migración sin modificar ningún dato existente.
5. IF la Base_de_Datos no puede completar la migración, THEN THE App SHALL mostrar un mensaje de error indicando que no se pudo actualizar el almacenamiento local.

---

### Requirement 2: Agregar múltiples fotos en el Formulario_Objeto

**User Story:** Como usuario, quiero poder agregar varias fotos a un objeto desde el formulario de creación o edición, para que pueda documentar el objeto desde distintos ángulos o con distintos niveles de detalle.

#### Acceptance Criteria

1. THE Formulario_Objeto SHALL presentar una sección de galería que muestre todas las Foto_Objeto asociadas al Objeto en el orden definido por el campo `orden`.
2. THE Formulario_Objeto SHALL presentar un control para agregar una nueva Foto_Objeto mediante la cámara del dispositivo o la galería de imágenes, sin límite máximo de fotos por objeto.
3. WHEN el usuario activa el control de agregar foto en el Formulario_Objeto, THE ImagePicker SHALL mostrar opciones para "Tomar foto" (cámara) y "Seleccionar de galería".
4. WHEN el usuario captura o selecciona una imagen mediante el ImagePicker, THE FileSystem SHALL copiar el archivo de imagen al directorio `FileSystem.documentDirectory + 'images/'` y THE Formulario_Objeto SHALL mostrar la nueva Foto_Objeto al final de la galería.
5. WHEN el usuario toca "Guardar" en el Formulario_Objeto en modo creación con al menos una Foto_Objeto, THE Base_de_Datos SHALL insertar un registro en `objeto_foto` por cada Foto_Objeto con el `id_objeto` del objeto recién creado, la `uri` correspondiente y el `orden` según la posición en la galería (0-indexed).
6. WHEN el usuario toca "Guardar" en el Formulario_Objeto en modo creación sin ninguna Foto_Objeto, THE Base_de_Datos SHALL insertar el objeto sin registros asociados en `objeto_foto`.
7. IF el ImagePicker no obtiene permiso para acceder a la cámara o a la galería, THEN THE App SHALL mostrar un mensaje informando al usuario que debe conceder el permiso correspondiente en la configuración del dispositivo.
8. IF el FileSystem falla al copiar un archivo de imagen, THEN THE App SHALL mostrar un mensaje de error indicando que no se pudo procesar la foto, sin interrumpir el guardado del resto de los datos del Objeto.

---

### Requirement 3: Editar la galería de fotos de un objeto existente

**User Story:** Como usuario, quiero poder agregar, eliminar y reordenar las fotos de un objeto existente desde el formulario de edición, para que la galería refleje siempre el estado actual del objeto.

#### Acceptance Criteria

1. WHEN el Formulario_Objeto se abre en modo edición, THE Formulario_Objeto SHALL cargar y mostrar todas las Foto_Objeto existentes del Objeto ordenadas por el campo `orden`.
2. WHEN el usuario agrega una nueva Foto_Objeto en modo edición, THE Formulario_Objeto SHALL mostrar la nueva foto al final de la galería sin persistir el cambio hasta que el usuario toque "Guardar".
3. WHEN el usuario elimina una Foto_Objeto de la galería en modo edición, THE Formulario_Objeto SHALL remover visualmente la foto de la galería sin persistir el cambio hasta que el usuario toque "Guardar".
4. WHEN el usuario toca "Guardar" en el Formulario_Objeto en modo edición, THE Base_de_Datos SHALL sincronizar la tabla `objeto_foto` para que refleje exactamente el estado de la galería mostrada: eliminando los registros de fotos removidas, insertando los registros de fotos nuevas y actualizando el campo `orden` de todas las fotos restantes.
5. WHEN el usuario toca "Guardar" en el Formulario_Objeto en modo edición y se eliminaron Foto_Objeto, THE FileSystem SHALL eliminar los archivos de imagen correspondientes a las fotos removidas del sistema de archivos del dispositivo.
6. WHEN el usuario cancela la edición (navega atrás sin guardar), THE Formulario_Objeto SHALL eliminar del FileSystem los archivos de imagen que fueron copiados durante esa sesión de edición pero no guardados, para evitar archivos huérfanos.
7. IF la Base_de_Datos falla al sincronizar la galería, THEN THE Formulario_Objeto SHALL mostrar un mensaje de error indicando que no se pudieron guardar los cambios, sin modificar los datos existentes en la Base_de_Datos.

---

### Requirement 4: Foto de portada en el listado de objetos

**User Story:** Como usuario, quiero ver una miniatura representativa de cada objeto en el listado del contenedor, para que pueda identificar visualmente los objetos de un vistazo.

#### Acceptance Criteria

1. WHEN un Objeto con al menos una Foto_Objeto es mostrado en el Detalle_Contenedor, THE Detalle_Contenedor SHALL mostrar la Foto_Portada (la foto con menor valor de `orden`) como miniatura junto al nombre y descripción del Objeto.
2. WHEN un Objeto sin Foto_Objeto es mostrado en el Detalle_Contenedor, THE Detalle_Contenedor SHALL mostrar el ícono de placeholder existente en lugar de una miniatura.
3. WHEN el usuario elimina la Foto_Portada de un Objeto y el Objeto tiene otras fotos, THE Detalle_Contenedor SHALL mostrar la siguiente foto (la de menor `orden` restante) como nueva Foto_Portada.
4. WHEN el usuario elimina todas las Foto_Objeto de un Objeto, THE Detalle_Contenedor SHALL mostrar el ícono de placeholder para ese Objeto.

---

### Requirement 5: Visor de galería por objeto

**User Story:** Como usuario, quiero poder ver todas las fotos de un objeto en pantalla completa y navegar entre ellas deslizando horizontalmente, para que pueda examinar cada foto con detalle.

#### Acceptance Criteria

1. WHEN el usuario toca la Foto_Portada de un Objeto en el Detalle_Contenedor, THE Visor_Galeria SHALL abrirse mostrando la Foto_Portada como foto inicial.
2. THE Visor_Galeria SHALL mostrar todas las Foto_Objeto del Objeto en el orden definido por el campo `orden`, permitiendo navegar entre ellas mediante deslizamiento horizontal.
3. THE Visor_Galeria SHALL mostrar un indicador de posición (por ejemplo, "2 / 5") que refleje la foto actualmente visible y el total de fotos en la galería.
4. WHILE el Visor_Galeria está abierto, THE Visor_Galeria SHALL permitir aplicar zoom (pellizco y doble toque) y desplazamiento (arrastre) sobre la foto actualmente visible, de forma equivalente al ImageViewer existente.
5. THE Visor_Galeria SHALL presentar un botón de cierre accesible que cierre el modal y regrese al Detalle_Contenedor.
6. IF una Foto_Objeto no puede cargarse (archivo no encontrado o error de lectura), THEN THE Visor_Galeria SHALL mostrar un estado de error para esa foto sin cerrar el visor ni afectar la navegación a otras fotos de la galería.

---

### Requirement 6: Eliminación de objetos con múltiples fotos

**User Story:** Como usuario, quiero que al eliminar un objeto se eliminen también todos sus archivos de imagen del dispositivo, para que no queden archivos huérfanos ocupando espacio de almacenamiento.

#### Acceptance Criteria

1. WHEN el usuario confirma la eliminación de un Objeto, THE fotoRepository SHALL obtener todas las `uri` de los registros en `objeto_foto` cuyo `id_objeto` coincida con el `id` del Objeto a eliminar.
2. WHEN el usuario confirma la eliminación de un Objeto, THE FileSystem SHALL eliminar todos los archivos de imagen referenciados por las `uri` obtenidas antes de que THE Base_de_Datos elimine el registro de la tabla `objeto`.
3. WHEN la restricción ON DELETE CASCADE de la tabla `objeto_foto` se activa al eliminar un Objeto, THE Base_de_Datos SHALL eliminar automáticamente todos los registros de `objeto_foto` cuyo `id_objeto` coincida con el `id` del Objeto eliminado.
4. IF el FileSystem falla al eliminar uno o más archivos de imagen, THEN THE App SHALL continuar con la eliminación del registro en la Base_de_Datos y mostrar un mensaje informativo indicando que algunos archivos de imagen no pudieron eliminarse.

---

### Requirement 7: Eliminación de contenedores con objetos que tienen múltiples fotos

**User Story:** Como usuario, quiero que al eliminar un contenedor se eliminen también todos los archivos de imagen de todos sus objetos, para que el dispositivo no acumule archivos huérfanos.

#### Acceptance Criteria

1. WHEN el usuario confirma la eliminación de un Contenedor, THE fotoRepository SHALL obtener todas las `uri` de los registros en `objeto_foto` cuyos `id_objeto` correspondan a Objetos cuyo `id_contenedor` coincida con el `id` del Contenedor a eliminar.
2. WHEN el usuario confirma la eliminación de un Contenedor, THE FileSystem SHALL eliminar todos los archivos de imagen referenciados por las `uri` obtenidas antes de que THE Base_de_Datos elimine el registro de la tabla `contenedor`.
3. WHEN la restricción ON DELETE CASCADE de la tabla `objeto` se activa al eliminar un Contenedor, THE Base_de_Datos SHALL eliminar automáticamente todos los registros de `objeto` y, por la restricción ON DELETE CASCADE de `objeto_foto`, todos los registros de `objeto_foto` asociados.
4. IF el FileSystem falla al eliminar uno o más archivos de imagen, THEN THE App SHALL continuar con la eliminación del Contenedor en la Base_de_Datos y mostrar un mensaje informativo indicando que algunos archivos de imagen no pudieron eliminarse.

---

### Requirement 8: Búsqueda de objetos con múltiples fotos

**User Story:** Como usuario, quiero que los resultados de búsqueda sigan mostrando una miniatura representativa de cada objeto encontrado, para que la experiencia de búsqueda sea consistente con el listado del contenedor.

#### Acceptance Criteria

1. WHEN la búsqueda retorna un Objeto con al menos una Foto_Objeto, THE App SHALL mostrar la Foto_Portada de ese Objeto junto al resultado de búsqueda.
2. WHEN la búsqueda retorna un Objeto sin Foto_Objeto, THE App SHALL mostrar el ícono de placeholder para ese resultado.
3. THE Base_de_Datos SHALL obtener la Foto_Portada de cada Objeto resultado mediante una subconsulta o JOIN que seleccione la `uri` del registro en `objeto_foto` con el menor `orden` para ese `id_objeto`.
