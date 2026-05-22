# Requirements Document — Image Viewer

## Introduction

Esta feature agrega un visor de imagen en pantalla completa a la app San Alejo. Cuando el usuario toca la foto de un objeto (ya sea en la pantalla de detalle del contenedor o en el formulario de edición), la imagen se amplía en un modal que ocupa toda la pantalla, permitiendo verla con detalle. El visor es un componente reutilizable que se integra con el sistema de temas existente (dark/light) y no requiere dependencias externas.

## Glossary

- **App**: La aplicación móvil San Alejo.
- **Visor_Imagen**: Modal de pantalla completa que muestra una Foto_Objeto ampliada con soporte de zoom y cierre.
- **Foto_Objeto**: Imagen opcional asociada a un Objeto, almacenada como archivo local cuya ruta se persiste en la columna `foto_uri` de la tabla `objeto`.
- **Objeto**: Artículo físico guardado dentro de un Contenedor. Puede tener una Foto_Objeto asociada.
- **Detalle_Contenedor**: Pantalla que muestra la información de un Contenedor y la lista de Objetos que contiene.
- **Formulario_Objeto**: Pantalla con campos editables para crear o modificar un Objeto, incluyendo su Foto_Objeto.
- **ObjetoItem**: Componente reutilizable que representa un Objeto en la lista del Detalle_Contenedor.
- **ImagePickerButton**: Componente reutilizable que muestra la vista previa de la Foto_Objeto en el Formulario_Objeto.
- **Tema**: Conjunto de tokens de color (fondos, textos, bordes, acentos) que define la apariencia visual de la App. Existen dos variantes: `dark` y `light`.
- **useTheme**: Hook personalizado que permite a cualquier componente acceder al Tema activo.
- **Navegador**: Componente de navegación entre pantallas (Expo Router).

---

## Requirements

### Requirement 1: Abrir el visor al tocar la imagen de un objeto

**User Story:** Como usuario, quiero tocar la foto de un objeto para verla ampliada en pantalla completa, para que pueda identificar el objeto con mayor detalle sin necesidad de editar el registro.

#### Acceptance Criteria

1. WHEN el usuario toca la Foto_Objeto en el ObjetoItem dentro del Detalle_Contenedor, THE Visor_Imagen SHALL abrirse mostrando la imagen a pantalla completa.
2. WHEN el usuario toca la vista previa de la Foto_Objeto en el Formulario_Objeto (modo edición), THE Visor_Imagen SHALL abrirse mostrando la imagen a pantalla completa.
3. WHEN el usuario toca la vista previa de la Foto_Objeto en el Formulario_Objeto (modo creación), THE Visor_Imagen SHALL abrirse mostrando la imagen a pantalla completa.
4. WHILE un Objeto no tiene Foto_Objeto asociada (`foto_uri` es null), THE ObjetoItem SHALL mantener el placeholder de ícono sin comportamiento de apertura del Visor_Imagen.

---

### Requirement 2: Visualización de la imagen en el visor

**User Story:** Como usuario, quiero que la imagen se muestre de forma clara y centrada en el visor, para que pueda apreciar todos los detalles del objeto fotografiado.

#### Acceptance Criteria

1. WHEN el Visor_Imagen está abierto, THE Visor_Imagen SHALL mostrar la imagen ocupando el máximo espacio disponible de la pantalla manteniendo la relación de aspecto original.
2. WHEN el Visor_Imagen está abierto, THE Visor_Imagen SHALL mostrar un fondo oscuro semitransparente (overlay) detrás de la imagen para enfocar la atención del usuario.
3. WHEN el Visor_Imagen está abierto, THE Visor_Imagen SHALL mostrar un botón de cierre claramente visible (ícono "×" o "close") en la esquina superior derecha de la pantalla.
4. WHEN el Visor_Imagen está abierto, THE Visor_Imagen SHALL aplicar los colores del Tema activo (overlay y botón de cierre) mediante el hook `useTheme`.

---

### Requirement 3: Cerrar el visor

**User Story:** Como usuario, quiero poder cerrar el visor de imagen fácilmente, para que pueda volver a la pantalla anterior sin interrupciones en mi flujo de trabajo.

#### Acceptance Criteria

1. WHEN el usuario toca el botón de cierre en el Visor_Imagen, THE Visor_Imagen SHALL cerrarse y THE App SHALL mostrar la pantalla desde la que se abrió el visor sin pérdida de estado.
2. WHEN el usuario toca el área del overlay fuera de la imagen en el Visor_Imagen, THE Visor_Imagen SHALL cerrarse.
3. WHEN el usuario presiona el botón físico o gesto de "atrás" del dispositivo (Android), THE Visor_Imagen SHALL cerrarse sin navegar a una pantalla diferente.
4. WHEN el Visor_Imagen se cierra, THE App SHALL restaurar el estado de la pantalla anterior exactamente como estaba antes de abrir el visor (scroll position, campos de formulario, etc.).

---

### Requirement 4: Zoom y navegación dentro del visor

**User Story:** Como usuario, quiero poder hacer zoom sobre la imagen en el visor, para que pueda examinar detalles pequeños del objeto fotografiado.

#### Acceptance Criteria

1. WHEN el Visor_Imagen está abierto, THE Visor_Imagen SHALL permitir al usuario hacer zoom mediante el gesto de pellizco (pinch-to-zoom) con un factor máximo de 4× respecto al tamaño inicial.
2. WHEN el usuario aplica zoom en el Visor_Imagen, THE Visor_Imagen SHALL permitir desplazar la imagen con el dedo (pan) para ver las áreas que quedan fuera de la pantalla.
3. WHEN el usuario hace doble toque sobre la imagen en el Visor_Imagen, THE Visor_Imagen SHALL alternar entre el tamaño inicial (1×) y el zoom al 2×.
4. WHEN el nivel de zoom en el Visor_Imagen es mayor que 1×, THE Visor_Imagen SHALL mostrar la imagen desplazable sin que el gesto de pan active el cierre del visor.
5. WHEN el nivel de zoom en el Visor_Imagen regresa a 1× mediante pellizco o doble toque, THE Visor_Imagen SHALL recentrar la imagen automáticamente.

---

### Requirement 5: Componente reutilizable ImageViewer

**User Story:** Como desarrollador, quiero un componente `ImageViewer` reutilizable y autocontenido, para que pueda integrarse en cualquier pantalla de la app sin duplicar lógica.

#### Acceptance Criteria

1. THE App SHALL proveer un componente `ImageViewer` con las props `uri: string`, `visible: boolean` y `onClose: () => void`.
2. WHEN la prop `visible` del `ImageViewer` es `false`, THE ImageViewer SHALL no renderizar ningún elemento visual en el árbol de componentes.
3. WHEN la prop `visible` del `ImageViewer` es `true`, THE ImageViewer SHALL renderizar el modal de pantalla completa con la imagen especificada en la prop `uri`.
4. IF la imagen especificada en la prop `uri` no puede cargarse, THEN THE ImageViewer SHALL mostrar un ícono de error y el texto "No se pudo cargar la imagen" en lugar de la imagen.
5. THE ImageViewer SHALL ser accesible: el botón de cierre SHALL tener `accessibilityRole="button"` y `accessibilityLabel="Cerrar visor de imagen"`, y la imagen SHALL tener `accessibilityLabel` descriptivo.

---

### Requirement 6: Integración con el sistema de temas

**User Story:** Como usuario, quiero que el visor de imagen respete el tema visual de la app (oscuro o claro), para que la experiencia sea coherente con el resto de la interfaz.

#### Acceptance Criteria

1. WHILE el Tema activo es `dark`, THE ImageViewer SHALL usar el color `overlay` del tema oscuro (`rgba(0,0,0,0.65)`) como fondo del modal.
2. WHILE el Tema activo es `light`, THE ImageViewer SHALL usar el color `overlay` del tema claro (`rgba(0,0,0,0.45)`) como fondo del modal.
3. WHEN el Tema activo cambia mientras el Visor_Imagen está abierto, THE ImageViewer SHALL actualizar los colores del overlay y del botón de cierre para reflejar el nuevo Tema sin cerrar el visor.
4. THE ImageViewer SHALL usar el color `textOnAccent` del Tema activo para el ícono del botón de cierre, garantizando contraste suficiente sobre el overlay.
