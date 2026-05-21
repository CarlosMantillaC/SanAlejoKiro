# Requirements Document

## Introduction

San Alejo es una aplicación móvil desarrollada en Expo (React Native) con almacenamiento local SQLite. Permite a los usuarios registrar contenedores físicos (cajas, maletas, cajones, bolsas) y los objetos guardados dentro de cada uno, con el objetivo de encontrar cualquier objeto sin necesidad de abrir físicamente los contenedores. La app funciona completamente offline y almacena todos los datos en el dispositivo del usuario.

## Glossary

- **App**: La aplicación móvil San Alejo.
- **Contenedor**: Elemento físico de almacenamiento (caja, maleta, cajón, bolsa) registrado en la App. Tiene nombre, descripción y ubicación.
- **Objeto**: Artículo físico guardado dentro de un Contenedor. Tiene nombre y descripción.
- **Base_de_Datos**: Instancia local de SQLite gestionada por expo-sqlite en el dispositivo del usuario.
- **Lista_Contenedores**: Pantalla principal que muestra todos los Contenedores registrados.
- **Detalle_Contenedor**: Pantalla que muestra la información de un Contenedor y la lista de Objetos que contiene.
- **Formulario_Contenedor**: Pantalla con campos editables para crear o modificar un Contenedor.
- **Formulario_Objeto**: Pantalla con campos editables para crear o modificar un Objeto.
- **Navegador**: Componente de navegación entre pantallas (Expo Router o React Navigation).
- **Validador**: Módulo encargado de verificar que los campos obligatorios no estén vacíos antes de persistir datos.
- **Foto_Objeto**: Imagen opcional asociada a un Objeto, almacenada como archivo en el sistema de archivos del dispositivo. Su ruta local se persiste en la columna `foto_uri` de la tabla `objeto`.
- **FileSystem**: Módulo `expo-file-system` utilizado para leer, escribir y eliminar archivos de imagen en el directorio persistente de la App (`FileSystem.documentDirectory + 'images/'`).
- **ImagePicker**: Módulo `expo-image-picker` utilizado para que el usuario capture una foto con la cámara del dispositivo o seleccione una imagen de la galería.

---

## Requirements

### Requirement 1: Inicialización de la base de datos

**User Story:** Como usuario, quiero que la base de datos esté lista al abrir la app, para que pueda registrar contenedores y objetos sin configuración manual.

#### Acceptance Criteria

1. WHEN la App se inicia, THE Base_de_Datos SHALL crear la tabla `contenedor` con columnas `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `nombre` (TEXT NOT NULL), `descripcion` (TEXT NOT NULL) y `ubicacion` (TEXT NOT NULL) si no existe.
2. WHEN la App se inicia, THE Base_de_Datos SHALL crear la tabla `objeto` con columnas `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `nombre` (TEXT NOT NULL), `descripcion` (TEXT NOT NULL) e `id_contenedor` (INTEGER NOT NULL, FOREIGN KEY referenciando `contenedor.id` ON DELETE CASCADE) si no existe.
3. WHEN la App se inicia por primera vez, THE Base_de_Datos SHALL ejecutar los scripts de creación de tablas antes de que cualquier pantalla intente leer o escribir datos.
4. IF la Base_de_Datos no puede inicializarse, THEN THE App SHALL mostrar un mensaje de error indicando que no se pudo abrir el almacenamiento local.

---

### Requirement 2: Listado de contenedores

**User Story:** Como usuario, quiero ver todos mis contenedores en una pantalla principal, para que pueda identificar rápidamente dónde están mis cosas.

#### Acceptance Criteria

1. THE Lista_Contenedores SHALL mostrar todos los Contenedores registrados en la Base_de_Datos ordenados por nombre de forma ascendente.
2. WHEN un Contenedor es mostrado en la Lista_Contenedores, THE Lista_Contenedores SHALL mostrar el nombre, la descripción y la ubicación de ese Contenedor.
3. WHEN la Base_de_Datos no contiene ningún Contenedor, THE Lista_Contenedores SHALL mostrar el mensaje "No hay contenedores. Agrega tu primera caja, maleta o cajón."
4. THE Lista_Contenedores SHALL mostrar un botón flotante de acción con el texto "+" para iniciar la creación de un nuevo Contenedor.
5. WHEN el usuario toca un Contenedor en la Lista_Contenedores, THE Navegador SHALL navegar a la pantalla Detalle_Contenedor del Contenedor seleccionado.
6. WHEN el usuario toca el botón flotante en la Lista_Contenedores, THE Navegador SHALL navegar a la pantalla Formulario_Contenedor en modo creación.
7. WHEN el usuario regresa a la Lista_Contenedores después de crear o editar un Contenedor, THE Lista_Contenedores SHALL reflejar los datos actualizados sin requerir reinicio de la App.

---

### Requirement 3: Creación y edición de contenedores

**User Story:** Como usuario, quiero registrar un nuevo contenedor con nombre, descripción y ubicación, para que pueda identificarlo y localizarlo físicamente.

#### Acceptance Criteria

1. THE Formulario_Contenedor SHALL presentar campos de texto editables para `nombre`, `descripcion` y `ubicacion`.
2. THE Formulario_Contenedor SHALL presentar un botón "Guardar" para persistir los datos ingresados.
3. WHEN el usuario toca "Guardar" en el Formulario_Contenedor, THE Validador SHALL verificar que los campos `nombre`, `descripcion` y `ubicacion` no estén vacíos ni contengan únicamente espacios en blanco.
4. IF el Validador detecta que algún campo obligatorio está vacío, THEN THE Formulario_Contenedor SHALL mostrar un mensaje de error indicando cuál campo está incompleto sin cerrar el formulario.
5. WHEN todos los campos son válidos y el usuario toca "Guardar" en modo creación, THE Base_de_Datos SHALL insertar un nuevo registro en la tabla `contenedor` con los valores ingresados.
6. WHEN todos los campos son válidos y el usuario toca "Guardar" en modo edición, THE Base_de_Datos SHALL actualizar el registro existente en la tabla `contenedor` con los nuevos valores.
7. WHEN la Base_de_Datos confirma la inserción o actualización exitosa, THE Navegador SHALL regresar a la pantalla anterior y THE Lista_Contenedores SHALL mostrar el Contenedor creado o actualizado.
8. IF la Base_de_Datos falla al insertar o actualizar, THEN THE Formulario_Contenedor SHALL mostrar un mensaje de error indicando que no se pudo guardar el Contenedor.

---

### Requirement 4: Detalle del contenedor

**User Story:** Como usuario, quiero ver el detalle de un contenedor y la lista de objetos que contiene, para que pueda saber qué hay dentro sin abrirlo físicamente.

#### Acceptance Criteria

1. THE Detalle_Contenedor SHALL mostrar el nombre, la descripción y la ubicación del Contenedor seleccionado.
2. THE Detalle_Contenedor SHALL mostrar todos los Objetos cuyo `id_contenedor` coincida con el `id` del Contenedor seleccionado.
3. WHEN un Objeto es mostrado en el Detalle_Contenedor, THE Detalle_Contenedor SHALL mostrar el nombre y la descripción de ese Objeto.
4. WHEN el Contenedor no tiene Objetos registrados, THE Detalle_Contenedor SHALL mostrar el mensaje "Este contenedor está vacío. Agrega los objetos que hay dentro."
5. THE Detalle_Contenedor SHALL mostrar un botón "Agregar objeto" para iniciar la creación de un nuevo Objeto en ese Contenedor.
6. WHEN el usuario toca "Agregar objeto" en el Detalle_Contenedor, THE Navegador SHALL navegar a la pantalla Formulario_Objeto en modo creación con el `id_contenedor` del Contenedor actual.
7. WHEN el usuario regresa al Detalle_Contenedor después de agregar o editar un Objeto, THE Detalle_Contenedor SHALL reflejar los datos actualizados sin requerir reinicio de la App.

---

### Requirement 5: Creación y edición de objetos

**User Story:** Como usuario, quiero registrar un objeto dentro de un contenedor con nombre y descripción, para que pueda encontrarlo después sin abrir el contenedor.

#### Acceptance Criteria

1. THE Formulario_Objeto SHALL presentar campos de texto editables para `nombre` y `descripcion`.
2. THE Formulario_Objeto SHALL presentar un botón "Guardar" para persistir los datos ingresados.
3. WHEN el usuario toca "Guardar" en el Formulario_Objeto, THE Validador SHALL verificar que los campos `nombre` y `descripcion` no estén vacíos ni contengan únicamente espacios en blanco.
4. IF el Validador detecta que algún campo obligatorio está vacío, THEN THE Formulario_Objeto SHALL mostrar un mensaje de error indicando cuál campo está incompleto sin cerrar el formulario.
5. WHEN todos los campos son válidos y el usuario toca "Guardar" en modo creación, THE Base_de_Datos SHALL insertar un nuevo registro en la tabla `objeto` con los valores ingresados y el `id_contenedor` correspondiente.
6. WHEN todos los campos son válidos y el usuario toca "Guardar" en modo edición, THE Base_de_Datos SHALL actualizar el registro existente en la tabla `objeto` con los nuevos valores.
7. WHEN la Base_de_Datos confirma la inserción o actualización exitosa, THE Navegador SHALL regresar al Detalle_Contenedor y THE Detalle_Contenedor SHALL mostrar el Objeto creado o actualizado.
8. IF la Base_de_Datos falla al insertar o actualizar, THEN THE Formulario_Objeto SHALL mostrar un mensaje de error indicando que no se pudo guardar el Objeto.
9. THE Formulario_Objeto SHALL presentar un control opcional para asociar una Foto_Objeto al Objeto, de modo que el campo `foto_uri` pueda quedar en null si el usuario no selecciona ninguna imagen.

---

### Requirement 6: Eliminación de objetos

**User Story:** Como usuario, quiero eliminar un objeto de un contenedor, para que el inventario refleje el estado real del contenedor.

#### Acceptance Criteria

1. THE Detalle_Contenedor SHALL ofrecer una acción de eliminación por cada Objeto listado (mediante botón, swipe o long press).
2. WHEN el usuario activa la acción de eliminación sobre un Objeto, THE App SHALL mostrar un diálogo de confirmación con el texto "¿Eliminar este objeto?" y opciones "Cancelar" y "Eliminar".
3. WHEN el usuario confirma la eliminación en el diálogo, THE Base_de_Datos SHALL eliminar el registro correspondiente de la tabla `objeto`.
4. WHEN la Base_de_Datos confirma la eliminación exitosa, THE Detalle_Contenedor SHALL actualizar la lista de Objetos sin requerir reinicio de la App.
5. WHEN el usuario cancela en el diálogo de confirmación, THE App SHALL cerrar el diálogo sin modificar ningún dato.
6. IF la Base_de_Datos falla al eliminar el Objeto, THEN THE App SHALL mostrar un mensaje de error indicando que no se pudo eliminar el Objeto.

---

### Requirement 7: Eliminación de contenedores

**User Story:** Como usuario, quiero eliminar un contenedor completo junto con todos sus objetos, para que pueda mantener el inventario limpio cuando ya no use ese contenedor.

#### Acceptance Criteria

1. THE Lista_Contenedores SHALL ofrecer una acción de eliminación por cada Contenedor listado (mediante botón, swipe o long press).
2. WHEN el usuario activa la acción de eliminación sobre un Contenedor, THE App SHALL mostrar un diálogo de confirmación con el texto "¿Eliminar este contenedor y todos sus objetos?" y opciones "Cancelar" y "Eliminar".
3. WHEN el usuario confirma la eliminación en el diálogo, THE Base_de_Datos SHALL eliminar el registro de la tabla `contenedor` y, mediante la restricción ON DELETE CASCADE, eliminar todos los registros de la tabla `objeto` cuyo `id_contenedor` coincida con el `id` del Contenedor eliminado.
4. WHEN la Base_de_Datos confirma la eliminación exitosa, THE Lista_Contenedores SHALL actualizar la lista de Contenedores sin requerir reinicio de la App.
5. WHEN el usuario cancela en el diálogo de confirmación, THE App SHALL cerrar el diálogo sin modificar ningún dato.
6. IF la Base_de_Datos falla al eliminar el Contenedor, THEN THE App SHALL mostrar un mensaje de error indicando que no se pudo eliminar el Contenedor.

---

### Requirement 8: Búsqueda de objetos

**User Story:** Como usuario, quiero buscar un objeto por nombre o descripción a través de todos los contenedores, para que pueda encontrar rápidamente en qué contenedor está guardado.

#### Acceptance Criteria

1. THE App SHALL proveer una pantalla o barra de búsqueda accesible desde la Lista_Contenedores.
2. WHEN el usuario ingresa texto en la barra de búsqueda, THE Base_de_Datos SHALL ejecutar una consulta que filtre Objetos cuyo `nombre` o `descripcion` contengan el texto ingresado (búsqueda insensible a mayúsculas/minúsculas).
3. WHEN la búsqueda retorna resultados, THE App SHALL mostrar cada Objeto encontrado junto con el nombre del Contenedor al que pertenece.
4. WHEN la búsqueda no retorna resultados, THE App SHALL mostrar el mensaje "No se encontraron objetos con ese nombre o descripción."
5. WHEN el usuario toca un resultado de búsqueda, THE Navegador SHALL navegar al Detalle_Contenedor del Contenedor al que pertenece ese Objeto.
6. WHEN el campo de búsqueda está vacío, THE App SHALL mostrar la Lista_Contenedores completa sin filtrar.

---

### Requirement 9: Edición de contenedores y objetos existentes

**User Story:** Como usuario, quiero editar el nombre, descripción o ubicación de un contenedor o la información de un objeto, para que el inventario refleje cambios en la realidad.

#### Acceptance Criteria

1. THE Detalle_Contenedor SHALL ofrecer una acción de edición para el Contenedor actual (mediante botón o ícono en la barra de navegación).
2. WHEN el usuario activa la acción de edición sobre un Contenedor, THE Navegador SHALL navegar al Formulario_Contenedor en modo edición con los datos actuales del Contenedor precargados.
3. THE Detalle_Contenedor SHALL ofrecer una acción de edición por cada Objeto listado.
4. WHEN el usuario activa la acción de edición sobre un Objeto, THE Navegador SHALL navegar al Formulario_Objeto en modo edición con los datos actuales del Objeto precargados.
5. WHEN el Formulario_Contenedor o el Formulario_Objeto se abre en modo edición, THE Formulario_Contenedor SHALL mostrar los valores actuales en los campos correspondientes para que el usuario pueda modificarlos.

---

### Requirement 10: Fotos de objetos

**User Story:** Como usuario, quiero tomar o seleccionar una foto para cada objeto, para que pueda identificarlo visualmente sin necesidad de abrir el contenedor.

#### Acceptance Criteria

1. WHEN la App se inicia, THE Base_de_Datos SHALL agregar la columna `foto_uri` (TEXT, nullable) a la tabla `objeto` si no existe, de modo que los registros existentes conserven `foto_uri = null`.
2. THE Formulario_Objeto SHALL presentar un control que permita al usuario seleccionar una Foto_Objeto mediante la cámara del dispositivo o la galería de imágenes, siendo este campo opcional.
3. WHEN el usuario activa el control de foto en el Formulario_Objeto, THE ImagePicker SHALL mostrar opciones para "Tomar foto" (cámara) y "Seleccionar de galería".
4. WHEN el usuario captura o selecciona una imagen mediante el ImagePicker, THE FileSystem SHALL copiar el archivo de imagen al directorio `FileSystem.documentDirectory + 'images/'` y THE Formulario_Objeto SHALL mostrar una vista previa de la Foto_Objeto seleccionada.
5. WHEN todos los campos son válidos y el usuario toca "Guardar" en el Formulario_Objeto con una Foto_Objeto seleccionada, THE Base_de_Datos SHALL persistir la ruta local del archivo de imagen en la columna `foto_uri` del registro `objeto` correspondiente.
6. WHEN todos los campos son válidos y el usuario toca "Guardar" en el Formulario_Objeto sin haber seleccionado ninguna Foto_Objeto, THE Base_de_Datos SHALL persistir `null` en la columna `foto_uri` del registro `objeto` correspondiente.
7. WHEN un Objeto con `foto_uri` no nulo es mostrado en el Detalle_Contenedor, THE Detalle_Contenedor SHALL mostrar la Foto_Objeto junto al nombre y la descripción de ese Objeto.
8. WHEN el Formulario_Objeto se abre en modo edición para un Objeto con `foto_uri` no nulo, THE Formulario_Objeto SHALL mostrar la Foto_Objeto actual como vista previa y permitir al usuario reemplazarla o eliminarla.
9. WHEN el usuario confirma la eliminación de un Objeto cuyo `foto_uri` no es null, THE FileSystem SHALL eliminar el archivo de imagen ubicado en la ruta `foto_uri` del sistema de archivos del dispositivo antes de que THE Base_de_Datos elimine el registro de la tabla `objeto`.
10. WHEN el usuario confirma la eliminación de un Contenedor, THE FileSystem SHALL eliminar todos los archivos de imagen referenciados por los `foto_uri` no nulos de los Objetos pertenecientes a ese Contenedor antes de que THE Base_de_Datos elimine el registro de la tabla `contenedor`.
11. IF el ImagePicker no obtiene permiso para acceder a la cámara o a la galería, THEN THE App SHALL mostrar un mensaje informando al usuario que debe conceder el permiso correspondiente en la configuración del dispositivo.
12. IF el FileSystem falla al copiar, leer o eliminar un archivo de imagen, THEN THE App SHALL mostrar un mensaje de error indicando que no se pudo procesar la foto, sin interrumpir la operación principal sobre el Objeto o el Contenedor.
