/**
 * Property-based tests for objetoRepository.
 *
 * Validates: Requirements 4.2
 */

import fc from 'fast-check';
import { openDatabaseAsync } from 'expo-sqlite';
import { initializeDatabase } from '../../src/db/schema';
import { insertContenedor } from '../../src/db/contenedorRepository';
import {
  getObjetosByContenedor,
  insertObjeto,
} from '../../src/db/objetoRepository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Arbitrary for a valid contenedor input. */
const contenedorArb = fc.record({
  nombre: fc.string({ minLength: 1, maxLength: 80 }),
  descripcion: fc.string({ minLength: 1, maxLength: 200 }),
  ubicacion: fc.string({ minLength: 1, maxLength: 100 }),
});

/** Arbitrary for a valid objeto input (id_contenedor will be set at runtime). */
const objetoDataArb = fc.record({
  nombre: fc.string({ minLength: 1, maxLength: 80 }),
  descripcion: fc.string({ minLength: 1, maxLength: 200 }),
});

// ---------------------------------------------------------------------------
// Property 7: Aislamiento de objetos por contenedor
// ---------------------------------------------------------------------------

// Feature: san-alejo-app, Property 7: Aislamiento de objetos por contenedor
describe('Property 7: Aislamiento de objetos por contenedor', () => {
  it(
    'getObjetosByContenedor retorna exactamente los objetos del contenedor indicado sin mezcla',
    async () => {
      /**
       * Validates: Requirements 4.2
       *
       * Para cualquier par de contenedores con N y M objetos respectivamente,
       * getObjetosByContenedor debe retornar exactamente N objetos para el
       * primer contenedor y M para el segundo, sin mezcla entre ellos.
       */
      await fc.assert(
        fc.asyncProperty(
          // N objetos para el primer contenedor (0..15)
          fc.array(objetoDataArb, { minLength: 0, maxLength: 15 }),
          // M objetos para el segundo contenedor (0..15)
          fc.array(objetoDataArb, { minLength: 0, maxLength: 15 }),
          async (objetosA, objetosB) => {
            // Fresh in-memory DB per property run
            const db = await openDatabaseAsync(':memory:');
            await initializeDatabase(db as any);

            // Create two independent contenedores
            const idContenedorA = await insertContenedor(db as any, {
              nombre: 'Contenedor A',
              descripcion: 'Primer contenedor',
              ubicacion: 'Ubicacion A',
            });
            const idContenedorB = await insertContenedor(db as any, {
              nombre: 'Contenedor B',
              descripcion: 'Segundo contenedor',
              ubicacion: 'Ubicacion B',
            });

            // Insert N objetos into contenedor A
            for (const obj of objetosA) {
              await insertObjeto(db as any, {
                ...obj,
                id_contenedor: idContenedorA,
              });
            }

            // Insert M objetos into contenedor B
            for (const obj of objetosB) {
              await insertObjeto(db as any, {
                ...obj,
                id_contenedor: idContenedorB,
              });
            }

            // Query each contenedor independently
            const resultA = await getObjetosByContenedor(db as any, idContenedorA);
            const resultB = await getObjetosByContenedor(db as any, idContenedorB);

            await db.closeAsync();

            // Exact count match
            if (resultA.length !== objetosA.length) return false;
            if (resultB.length !== objetosB.length) return false;

            // All objects in resultA must belong to contenedor A
            if (resultA.some((o) => o.id_contenedor !== idContenedorA)) return false;

            // All objects in resultB must belong to contenedor B
            if (resultB.some((o) => o.id_contenedor !== idContenedorB)) return false;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
