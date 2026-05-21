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
  getContenedorById,
  insertContenedor,
  updateContenedor,
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

// ---------------------------------------------------------------------------
// Property 4: Round-trip de inserción de contenedor
// ---------------------------------------------------------------------------

// Feature: san-alejo-app, Property 4: Round-trip de inserción de contenedor
describe('Property 4: Round-trip de inserción de contenedor', () => {
  it('insertar un contenedor y recuperarlo por id retorna exactamente los mismos datos', async () => {
    /**
     * Validates: Requirements 2.1
     */
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          nombre: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
          descripcion: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
          ubicacion: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        }),
        async ({ nombre, descripcion, ubicacion }) => {
          // Fresh in-memory DB per property run
          const db = await openDatabaseAsync(':memory:');
          await initializeDatabase(db as any);

          // Insert and capture the returned id
          const id = await insertContenedor(db as any, { nombre, descripcion, ubicacion });

          // Retrieve by id
          const retrieved = await getContenedorById(db as any, id);

          await db.closeAsync();

          // Must not be null and all fields must match exactly
          if (retrieved === null) return false;
          return (
            retrieved.nombre === nombre &&
            retrieved.descripcion === descripcion &&
            retrieved.ubicacion === ubicacion
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Round-trip de actualización de contenedor
// ---------------------------------------------------------------------------

// Feature: san-alejo-app, Property 5: Round-trip de actualización de contenedor
describe('Property 5: Round-trip de actualización de contenedor', () => {
  it('actualizar un contenedor y recuperarlo por id retorna exactamente los nuevos valores', async () => {
    /**
     * Validates: Requirements 3.6
     *
     * For any existing contenedor and any set of valid new values, updating
     * the contenedor and then querying it by id must return exactly the new
     * values — not the original ones.
     */
    await fc.assert(
      fc.asyncProperty(
        // Original data
        fc.record({
          nombre: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
          descripcion: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
          ubicacion: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        }),
        // New (updated) data
        fc.record({
          nombre: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
          descripcion: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
          ubicacion: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        }),
        async (original, updated) => {
          // Fresh in-memory DB per property run
          const db = await openDatabaseAsync(':memory:');
          await initializeDatabase(db as any);

          // Insert the original contenedor
          const id = await insertContenedor(db as any, original);

          // Update with new values
          await updateContenedor(db as any, id, updated);

          // Retrieve by id
          const retrieved = await getContenedorById(db as any, id);

          await db.closeAsync();

          // Must not be null and all fields must reflect the updated values
          if (retrieved === null) return false;
          return (
            retrieved.nombre === updated.nombre &&
            retrieved.descripcion === updated.descripcion &&
            retrieved.ubicacion === updated.ubicacion
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
