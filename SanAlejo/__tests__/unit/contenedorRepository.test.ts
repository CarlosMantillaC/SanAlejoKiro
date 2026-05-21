/**
 * Property-based tests for contenedorRepository.
 *
 * Validates: Requirements 2.1
 */

import fc from 'fast-check';
import { openDatabaseAsync } from 'expo-sqlite';
import { initializeDatabase } from '../../src/db/schema';
import {
  getAllContenedores,
  insertContenedor,
} from '../../src/db/contenedorRepository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Arbitrary for a valid contenedor input (all fields non-empty after trim). */
const contenedorArb = fc.record({
  nombre: fc.string({ minLength: 1, maxLength: 80 }),
  descripcion: fc.string({ minLength: 1, maxLength: 200 }),
  ubicacion: fc.string({ minLength: 1, maxLength: 100 }),
});

// ---------------------------------------------------------------------------
// Property 1: Ordenamiento de contenedores
// ---------------------------------------------------------------------------

// Feature: san-alejo-app, Property 1: Ordenamiento de contenedores
describe('Property 1: getAllContenedores retorna contenedores ordenados por nombre ASC', () => {
  it('la lista retornada está ordenada alfabéticamente por nombre sin importar el orden de inserción', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(contenedorArb, { minLength: 0, maxLength: 20 }),
        async (contenedores) => {
          // Fresh in-memory DB for each run
          const db = await openDatabaseAsync(':memory:');
          await initializeDatabase(db as any);

          // Insert all generated contenedores in the given (arbitrary) order
          for (const c of contenedores) {
            await insertContenedor(db as any, c);
          }

          // Retrieve via the repository
          const result = await getAllContenedores(db as any);

          // The result must be sorted by nombre ASC (locale-insensitive binary
          // comparison, matching SQLite's default ORDER BY behaviour)
          for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1].nombre;
            const curr = result[i].nombre;
            if (prev > curr) {
              await db.closeAsync();
              return false;
            }
          }

          await db.closeAsync();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('el número de contenedores retornados coincide con los insertados', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(contenedorArb, { minLength: 0, maxLength: 20 }),
        async (contenedores) => {
          const db = await openDatabaseAsync(':memory:');
          await initializeDatabase(db as any);

          for (const c of contenedores) {
            await insertContenedor(db as any, c);
          }

          const result = await getAllContenedores(db as any);

          await db.closeAsync();
          return result.length === contenedores.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
