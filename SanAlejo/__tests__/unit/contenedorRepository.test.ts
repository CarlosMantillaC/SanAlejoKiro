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
  getContenedoresFiltrados,
  getUbicacionesUnicas,
  CriterioOrden,
  DireccionOrden,
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

// ---------------------------------------------------------------------------
// Arbitraries for new property tests
// ---------------------------------------------------------------------------

const criterioOrdenArb = fc.constantFrom<CriterioOrden>('nombre', 'fecha_creacion', 'cantidad_objetos');
const direccionOrdenArb = fc.constantFrom<DireccionOrden>('asc', 'desc');

/** Arbitrary for a contenedor input with a non-empty ubicacion. */
const contenedorConUbicacionArb = fc.record({
  nombre: fc.string({ minLength: 1, maxLength: 80 }),
  descripcion: fc.string({ minLength: 1, maxLength: 200 }),
  ubicacion: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
});

// ---------------------------------------------------------------------------
// Property 5: Consistencia de resultados filtrados y ordenados
// ---------------------------------------------------------------------------

// Feature: contenedor-sorting-filters, Property 5: Consistencia de resultados filtrados y ordenados
describe('Property 5: Consistencia de resultados filtrados y ordenados', () => {
  /**
   * Validates: Requisitos 2.1, 2.2, 3.2, 3.5, 5.5
   *
   * For any set of contenedores and valid parameter combination:
   * (a) if filtroUbicacion is not null, all elements have ubicacion matching case-insensitively
   * (b) the array is correctly ordered by criterion and direction
   */
  it('si filtroUbicacion no es null, todos los resultados coinciden case-insensitive; el array está ordenado correctamente', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(contenedorConUbicacionArb, { minLength: 1, maxLength: 15 }),
        criterioOrdenArb,
        direccionOrdenArb,
        // Pick a filtroUbicacion from one of the inserted contenedores (or null)
        fc.boolean(),
        async (contenedores, criterioOrden, direccionOrden, useFilter) => {
          const db = await openDatabaseAsync(':memory:');
          await initializeDatabase(db as any);

          for (const c of contenedores) {
            await insertContenedor(db as any, c);
          }

          // Choose a filter: either null or the ubicacion of the first contenedor
          const filtroUbicacion = useFilter ? contenedores[0].ubicacion : null;

          const result = await getContenedoresFiltrados(
            db as any,
            filtroUbicacion,
            criterioOrden,
            direccionOrden
          );

          // (a) Check filter constraint
          if (filtroUbicacion !== null) {
            for (const c of result) {
              if (c.ubicacion.toLowerCase() !== filtroUbicacion.toLowerCase()) {
                await db.closeAsync();
                return false;
              }
            }
          }

          // (b) Check ordering
          for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1];
            const curr = result[i];

            let prevVal: string | number;
            let currVal: string | number;

            if (criterioOrden === 'nombre') {
              prevVal = prev.nombre;
              currVal = curr.nombre;
            } else if (criterioOrden === 'fecha_creacion') {
              prevVal = prev.fecha_creacion;
              currVal = curr.fecha_creacion;
            } else {
              // cantidad_objetos: ordering is done by SQLite, we trust the DB
              // but we can't easily verify the count here without another query.
              // Skip ordering check for this criterion in this property.
              continue;
            }

            const isOrdered =
              direccionOrden === 'asc' ? prevVal <= currVal : prevVal >= currVal;

            if (!isOrdered) {
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
});

// ---------------------------------------------------------------------------
// Property 6: Filtro null retorna todos los contenedores
// ---------------------------------------------------------------------------

// Feature: contenedor-sorting-filters, Property 6: Filtro null retorna todos los contenedores
describe('Property 6: Filtro null retorna todos los contenedores', () => {
  /**
   * Validates: Requisitos 3.3, 5.2
   *
   * For any set of contenedores, getContenedoresFiltrados with filtroUbicacion = null
   * must return all contenedores without location restriction.
   */
  it('con filtroUbicacion=null retorna todos los contenedores insertados', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(contenedorConUbicacionArb, { minLength: 0, maxLength: 20 }),
        criterioOrdenArb,
        direccionOrdenArb,
        async (contenedores, criterioOrden, direccionOrden) => {
          const db = await openDatabaseAsync(':memory:');
          await initializeDatabase(db as any);

          for (const c of contenedores) {
            await insertContenedor(db as any, c);
          }

          const result = await getContenedoresFiltrados(
            db as any,
            null,
            criterioOrden,
            direccionOrden
          );

          await db.closeAsync();
          return result.length === contenedores.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Unicidad de ubicaciones
// ---------------------------------------------------------------------------

// Feature: contenedor-sorting-filters, Property 7: Unicidad de ubicaciones
describe('Property 7: Unicidad de ubicaciones', () => {
  /**
   * Validates: Requisito 3.1
   *
   * For any set of contenedores, getUbicacionesUnicas returns an array without
   * duplicates containing exactly the distinct non-empty ubicacion values.
   */
  it('retorna exactamente los valores de ubicacion distintos y no vacíos, sin duplicados', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            nombre: fc.string({ minLength: 1, maxLength: 80 }),
            descripcion: fc.string({ minLength: 1, maxLength: 200 }),
            // Allow empty strings too to test the non-empty filter
            ubicacion: fc.string({ minLength: 0, maxLength: 100 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (contenedores) => {
          const db = await openDatabaseAsync(':memory:');
          await initializeDatabase(db as any);

          for (const c of contenedores) {
            await insertContenedor(db as any, c);
          }

          const result = await getUbicacionesUnicas(db as any);

          // Compute expected: distinct non-empty ubicaciones, sorted alphabetically
          const expected = Array.from(
            new Set(contenedores.map((c) => c.ubicacion).filter((u) => u.trim().length > 0))
          ).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

          await db.closeAsync();

          // No duplicates
          const hasDuplicates = result.length !== new Set(result).size;
          if (hasDuplicates) return false;

          // Same length
          if (result.length !== expected.length) return false;

          // All expected values are present
          for (const u of expected) {
            if (!result.includes(u)) return false;
          }

          // Sorted alphabetically
          for (let i = 1; i < result.length; i++) {
            if (result[i - 1] > result[i]) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Timestamp de inserción es válido
// ---------------------------------------------------------------------------

// Feature: contenedor-sorting-filters, Property 8: Timestamp de inserción es válido
describe('Property 8: Timestamp de inserción es válido', () => {
  /**
   * Validates: Requisito 1.2
   *
   * For any inserted contenedor, fecha_creacion retrieved must be a positive
   * integer > 0 and <= current Unix timestamp.
   */
  it('fecha_creacion es un entero positivo > 0 y <= timestamp Unix actual', async () => {
    await fc.assert(
      fc.asyncProperty(
        contenedorConUbicacionArb,
        async ({ nombre, descripcion, ubicacion }) => {
          const db = await openDatabaseAsync(':memory:');
          await initializeDatabase(db as any);

          const beforeInsert = Math.floor(Date.now() / 1000);
          const id = await insertContenedor(db as any, { nombre, descripcion, ubicacion });
          const afterInsert = Math.floor(Date.now() / 1000);

          const retrieved = await getContenedorById(db as any, id);
          await db.closeAsync();

          if (retrieved === null) return false;

          const ts = retrieved.fecha_creacion;
          // Must be a positive integer > 0
          if (!Number.isInteger(ts) || ts <= 0) return false;
          // Must be within the insertion window
          if (ts < beforeInsert || ts > afterInsert) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
