# Plan de Implementación: Image Viewer

## Descripción general

Implementación incremental de un visor de imagen reutilizable a pantalla completa para la app San Alejo. El trabajo se organiza en tres bloques: componente base `ImageViewer`, integración con las pantallas que muestran o editan fotos, y batería de pruebas para comportamiento, accesibilidad y tema.

## Tareas

- [x] 1. Crear el componente reutilizable `ImageViewer`
	- [x] 1.1 Crear `src/components/ImageViewer.tsx`
		- Definir las props `uri: string`, `visible: boolean` y `onClose: () => void`
		- Renderizar un `Modal` fullscreen solo cuando `visible` sea `true`
		- Mostrar la imagen con `resizeMode="contain"` y centrado visual
		- Mostrar overlay con `colors.overlay` y botón de cierre con `Ionicons`
		- Exponer `accessibilityRole="button"` y `accessibilityLabel="Cerrar visor de imagen"` en el botón de cierre
		- Aplicar colores del tema activo con `useTheme()`
		- _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 6.4_

	- [x] 1.2 Manejar el estado de error de carga de imagen
		- Mostrar un ícono de error y el texto `No se pudo cargar la imagen` cuando la URI no pueda cargarse
		- Evitar pantalla en blanco cuando la imagen falla
		- Mantener el cierre funcional aunque ocurra el error
		- _Requirements: 5.4_

	- [x] 1.3 Soportar cierre consistente del modal
		- Cerrar al tocar el botón de cierre
		- Cerrar al tocar el overlay fuera de la imagen
		- Cerrar con `onRequestClose` para el botón físico o gesto de atrás en Android
		- No mutar el estado de la pantalla base al cerrar
		- _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Integrar el visor en la pantalla de detalle de contenedor
	- [x] 2.1 Actualizar `src/components/ObjetoItem.tsx`
		- Hacer que la foto sea tocable solo cuando `objeto.foto_uri` no sea `null`
		- Mantener el placeholder sin comportamiento de apertura cuando no hay foto
		- _Requirements: 1.1, 1.4_

	- [x] 2.2 Actualizar `app/contenedor/[id].tsx`
		- Agregar estado local para controlar `ImageViewer`
		- Abrir el visor al tocar la foto de un objeto con `foto_uri`
		- Cerrar el visor sin alterar la lista ni la posición de la pantalla
		- _Requirements: 1.1, 3.1, 3.4_

	- [x] 2.3 Mantener coherencia visual con el detalle
		- Reutilizar el tema activo y los tokens ya existentes
		- Confirmar que el overlay del visor no rompe el layout del detalle
		- _Requirements: 2.2, 2.4, 6.1, 6.2, 6.3, 6.4_

- [x] 3. Integrar el visor en el formulario de objeto
	- [x] 3.1 Actualizar `src/components/ImagePickerButton.tsx`
		- Hacer que la vista previa se pueda tocar cuando `currentUri` exista
		- Conservar el comportamiento actual de selección/captura de imagen
		- _Requirements: 1.2, 1.3_

	- [x] 3.2 Actualizar `app/contenedor/objeto/nuevo.tsx`
		- Agregar estado local para abrir `ImageViewer` desde la vista previa
		- Abrir el visor tanto en modo creación como en edición si hay imagen
		- Mantener intacto el flujo de guardado del formulario
		- _Requirements: 1.3, 5.1_

	- [x] 3.3 Actualizar `app/contenedor/objeto/editar/[id].tsx`
		- Agregar estado local para abrir `ImageViewer` desde la vista previa
		- Abrir el visor con la imagen precargada del objeto
		- Cerrar el visor sin alterar la imagen seleccionada ni el resto del formulario
		- _Requirements: 1.2, 1.3, 3.4_

- [x] 4. Asegurar soporte visual y de accesibilidad
	- [x] 4.1 Verificar contraste y tema en `ImageViewer`
		- Usar `colors.overlay` para dark y light según `useTheme()`
		- Usar `textOnAccent` para el icono de cierre
		- Actualizar colores en caliente si cambia el tema mientras el visor está abierto
		- _Requirements: 2.4, 6.1, 6.2, 6.3, 6.4_

	- [x] 4.2 Verificar accesibilidad del componente
		- Mantener una `accessibilityLabel` descriptiva para la imagen
		- Confirmar que el botón de cierre sea accesible con lector de pantalla
		- Confirmar que el modal bloquee la interacción con la pantalla subyacente
		- _Requirements: 5.5_

- [ ] 5. Escribir pruebas del visor y sus integraciones
	- [ ] 5.1 Escribir unit tests para `ImageViewer`
		- Caso: `visible=false` → no renderiza elementos visuales
		- Caso: `visible=true` → renderiza modal, overlay e imagen
		- Caso: tocar cerrar → llama `onClose`
		- Caso: error de carga → muestra el estado de error
		- Caso: tema oscuro/claro → usa los tokens correctos
		- _Requirements: 2.1, 2.2, 2.3, 2.4, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

	- [ ] 5.2 Escribir pruebas de integración en detalle de contenedor
		- Caso: tocar foto con `foto_uri` → abre el visor
		- Caso: contenedor sin foto → mantiene placeholder sin apertura
		- Caso: cerrar visor → conserva el estado de la pantalla base
		- _Requirements: 1.1, 1.4, 3.1, 3.2, 3.4_

	- [ ] 5.3 Escribir pruebas de integración en formulario de objeto
		- Caso: tocar vista previa → abre el visor
		- Caso: modo creación sin imagen → no abre visor
		- Caso: cerrar visor → no modifica campos ni `foto_uri`
		- _Requirements: 1.2, 1.3, 3.4_

- [ ] 6. Validación final
	- [ ] 6.1 Ejecutar la batería de tests del área tocada
		- Verificar tests de componentes, pantallas y utilidades relacionadas
		- Corregir regresiones solo en el slice afectado
		- _Requirements: todas las aplicables_

	- [ ] 6.2 Revisar consistencia con requirements y design
		- Confirmar que el visor cumple cierre, overlay, error state, accesibilidad y tema
		- Confirmar que no se añadió navegación ni estado global innecesario
		- _Requirements: 2.x, 3.x, 4.x, 5.x, 6.x_
