# Requirements Document — Export PDF

## Introduction

La funcionalidad de exportación a PDF permite al usuario generar un archivo PDF con toda la información de su inventario: todos los contenedores y sus objetos, incluyendo nombre, descripción, ubicación, etiquetas y fotos. El caso de uso principal es que el usuario pueda conservar un respaldo legible de su inventario al cambiar de dispositivo o simplemente como copia de seguridad. El PDF se genera localmente en el dispositivo y se comparte mediante el sistema nativo de compartir (share sheet) de iOS/Android.

## Glossary

- **App**: La aplicación móvil San Alejo.
- **Exportador_PDF**: Módulo de la App responsable de recopilar los datos del inventario, generar el archivo PDF y activar el flujo de compartir.
- **PDF_Inventario**: Archivo PDF generado que contiene la información completa del inventario del usuario.
- **Base_de_Datos**: Instancia local de SQLite gestionada por `expo-sqlite` en el dispositivo del usuario.
- **Contenedor**: Elemento físico de almacenamiento registrado en la App con nombre, descripción y ubicación.
- **Objeto**: Artículo físico guardado dentro de un Contenedor con nombre, descripción, etiquetas y fotos.
- **Etiqueta**: Categoría textual asociada a un Objeto.
- **Foto_Objeto**: Imagen asociada a un Objeto, almacenada como archivo en el sistema de archivos del dispositivo.
- **FileSystem**: Módulo `expo-file-system` utilizado para leer archivos de imagen y escribir el PDF temporal.
- **Share_Sheet**: Interfaz nativa del sistema operativo (iOS/Android) para compartir archivos con otras apps (correo, mensajería, almacenamiento en la nube, etc.).
- **Lista_Contenedores**: Pantalla principal de la App que muestra todos los Contenedores registrados.
- **Indicador_Progreso**: Elemento visual que informa al usuario que la generación del PDF está en curso.

---

## Requirements

### Requirement 1: Acceso a la exportación desde la pantalla principal

**User Story:** Como usuario, quiero acceder a la función de exportar PDF desde la pantalla principal, para que pueda generar un respaldo de mi inventario sin tener que navegar por múltiples pantallas.

#### Acceptance Criteria

1. THE Lista_Contenedores SHALL presentar un control de exportación (botón o ícono) accesible desde la barra de navegación o desde un menú de opciones en la pantalla principal.
2. WHEN el usuario activa el control de exportación, THE App SHALL iniciar el proceso de generación del PDF_Inventario.
3. WHILE la Base_de_Datos no contiene ningún Contenedor, THE App SHALL deshabilitar o no mostrar el control de exportación, o bien mostrar un mensaje informando que no hay datos para exportar.

---

### Requirement 2: Recopilación completa de datos del inventario

**User Story:** Como usuario, quiero que el PDF incluya todos mis contenedores y objetos con todos sus atributos, para que el respaldo sea completo y útil.

#### Acceptance Criteria

1. WHEN el usuario activa la exportación, THE Exportador_PDF SHALL consultar la Base_de_Datos y obtener todos los Contenedores ordenados alfabéticamente por nombre.
2. WHEN el Exportador_PDF obtiene los Contenedores, THE Exportador_PDF SHALL consultar la Base_de_Datos y obtener todos los Objetos de cada Contenedor ordenados alfabéticamente por nombre.
3. WHEN el Exportador_PDF obtiene los Objetos, THE Exportador_PDF SHALL consultar la Base_de_Datos y obtener todas las Etiquetas asociadas a cada Objeto.
4. WHEN el Exportador_PDF obtiene los Objetos, THE Exportador_PDF SHALL consultar la Base_de_Datos y obtener todas las Foto_Objeto asociadas a cada Objeto en su orden definido.
5. THE Exportador_PDF SHALL incluir en el PDF_Inventario el nombre, la descripción y la ubicación de cada Contenedor.
6. THE Exportador_PDF SHALL incluir en el PDF_Inventario el nombre, la descripción, las Etiquetas y las Foto_Objeto de cada Objeto.

---

### Requirement 3: Generación del archivo PDF

**User Story:** Como usuario, quiero que el PDF generado sea legible y esté bien organizado, para que pueda consultarlo fácilmente fuera de la app.

#### Acceptance Criteria

1. THE Exportador_PDF SHALL generar el PDF_Inventario con una sección por cada Contenedor, donde cada sección incluya el nombre, la descripción y la ubicación del Contenedor seguidos de la lista de sus Objetos.
2. WHEN un Contenedor no tiene Objetos, THE Exportador_PDF SHALL incluir en la sección del Contenedor una indicación de que está vacío.
3. WHEN un Objeto tiene Etiquetas asociadas, THE Exportador_PDF SHALL incluir las Etiquetas del Objeto en la sección correspondiente del PDF_Inventario.
4. WHEN un Objeto tiene Foto_Objeto asociadas, THE Exportador_PDF SHALL incluir las imágenes del Objeto en el PDF_Inventario con dimensiones que no excedan el ancho de la página.
5. WHEN un Objeto no tiene Foto_Objeto, THE Exportador_PDF SHALL omitir la sección de imágenes para ese Objeto sin mostrar espacios vacíos.
6. THE Exportador_PDF SHALL incluir en el PDF_Inventario una portada o encabezado con el título "Inventario San Alejo" y la fecha y hora de generación del documento.
7. THE Exportador_PDF SHALL incluir en el PDF_Inventario el número total de Contenedores y el número total de Objetos en el encabezado o portada.
8. IF el FileSystem no puede leer el archivo de una Foto_Objeto, THEN THE Exportador_PDF SHALL omitir esa imagen del PDF_Inventario y continuar con la generación del resto del documento.

---

### Requirement 4: Indicador de progreso durante la generación

**User Story:** Como usuario, quiero ver un indicador de que el PDF se está generando, para que sepa que la app está trabajando y no haya tocado algo que no debía.

#### Acceptance Criteria

1. WHEN el usuario activa la exportación, THE App SHALL mostrar un Indicador_Progreso que bloquee la interacción con la pantalla mientras el PDF_Inventario se está generando.
2. WHEN la generación del PDF_Inventario finaliza (con éxito o con error), THE App SHALL ocultar el Indicador_Progreso.
3. WHILE el Indicador_Progreso está visible, THE App SHALL mostrar un texto descriptivo como "Generando PDF…" para informar al usuario sobre la operación en curso.

---

### Requirement 5: Compartir el PDF generado

**User Story:** Como usuario, quiero poder compartir o guardar el PDF generado usando las opciones nativas de mi dispositivo, para que pueda enviarlo por correo, guardarlo en la nube o en el almacenamiento local.

#### Acceptance Criteria

1. WHEN el PDF_Inventario se genera exitosamente, THE App SHALL activar la Share_Sheet del sistema operativo con el archivo PDF_Inventario adjunto.
2. THE Exportador_PDF SHALL guardar el PDF_Inventario en un directorio temporal del dispositivo con un nombre de archivo que incluya la fecha de generación, con el formato `inventario-san-alejo-YYYY-MM-DD.pdf`.
3. WHEN el usuario completa o cancela la acción en la Share_Sheet, THE App SHALL eliminar el archivo PDF_Inventario temporal del directorio temporal del dispositivo.
4. IF la Share_Sheet no está disponible en el dispositivo, THEN THE App SHALL mostrar un mensaje de error indicando que no se pudo compartir el archivo.

---

### Requirement 6: Manejo de errores en la exportación

**User Story:** Como usuario, quiero recibir un mensaje claro si la exportación falla, para que sepa qué ocurrió y pueda intentarlo de nuevo.

#### Acceptance Criteria

1. IF la Base_de_Datos falla al consultar los datos durante la exportación, THEN THE App SHALL ocultar el Indicador_Progreso y mostrar un mensaje de error indicando que no se pudieron obtener los datos del inventario.
2. IF el Exportador_PDF falla al generar el archivo PDF, THEN THE App SHALL ocultar el Indicador_Progreso y mostrar un mensaje de error indicando que no se pudo generar el PDF.
3. IF el FileSystem falla al escribir el archivo PDF temporal, THEN THE App SHALL ocultar el Indicador_Progreso y mostrar un mensaje de error indicando que no se pudo guardar el archivo.
4. WHEN se muestra un mensaje de error de exportación, THE App SHALL ofrecer al usuario la posibilidad de cerrar el mensaje y reintentar la exportación.
