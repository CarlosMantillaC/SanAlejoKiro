# Plan de Implementación — Etiquetas / Categorías

## Overview

Plan incremental para añadir soporte de Etiquetas. Se sigue el orden: especificación, migración DB, repositorios, UI y tests.

## Tasks

- [x] 1. Migración DB
   - Añadir la migración en `src/db/schema.ts` para crear `etiqueta` y `objeto_etiqueta` y sus índices.
   - Ejecutar pruebas de migración (simular DB versiones anteriores y validar que la migración se omite si ya está aplicada).

- [x] 2. Repositorios
   - Crear `src/db/etiquetaRepository.ts` con funciones: `createEtiqueta`, `getEtiquetaById`, `searchEtiquetas`, `listAllEtiquetas`, `deleteEtiqueta`.
   - Crear `src/db/objetoEtiquetaRepository.ts` con funciones: `setEtiquetasForObjeto`, `getEtiquetasForObjeto`, `getObjetoIdsForEtiqueta`.
   - Modificar `src/db/objetoRepository.ts` para soportar `etiquetaIds` en consultas filtradas y para devolver etiquetas asociadas eficientemente.

 - [x] 3. Modelos / Tipos
   - Añadir tipos/Interfaces TS para `Etiqueta` y para las funciones nuevas en los repositorios.

 - [x] 4. UI: Formulario_Objeto
   - Implementar componente `TagPicker` en `src/components/` o adaptar un componente existente.
   - Integrar `TagPicker` en `src/components/FormularioObjeto` (o la pantalla correspondiente) para mostrar/editar etiquetas en creación y edición.
   - Asegurar que la creación de nuevas etiquetas es idempotente y que la asociación se persiste solo al guardar el objeto.

 - [x] 5. UI: Listados y filtros
   - Actualizar `Detalle_Contenedor` y componentes de lista de objetos para mostrar chips de etiquetas.
   - Extender `PanelFiltros` para permitir filtrar por etiquetas (multiselección).
   - Integrar `etiquetaIds` en la llamada a `getObjetosFiltrados` para aplicar el filtro.

- [ ] 6. Tests
   - Añadir pruebas unitarias para `etiquetaRepository` y `objetoEtiquetaRepository` (CRUD y búsqueda de sugerencias).
   - Añadir pruebas de integración para `setEtiquetasForObjeto` y sincronización desde `Formulario_Objeto`.
   - Añadir pruebas UI/RTL para `TagPicker` y para que las etiquetas aparezcan en listados.