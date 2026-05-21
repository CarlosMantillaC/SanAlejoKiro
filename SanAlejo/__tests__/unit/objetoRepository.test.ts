/**
 * Property-based tests for objetoRepository.
 *
 * Validates: Requirements 4.2
 */

import fc from 'fast-check';
import { openDatabaseAsync } from 'expo-sqlite';
import { initializeDatabase } from '../../src/db/schema';
import { insertContenedor, deleteContenedor } from '../../src/db/contenedorRepository';
import {
  getObjetosByContenedor,
  insertObjeto,
  updateObjeto,
  Objeto,
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

// ---------------------------------------------------------------------------
// Property 8: Round-trip de inserción de objeto
// ---------------------------------------------------------------------------

// Feature: san-alejo-app, Property 8: Round-trip de inserción de objeto
describe('Property 8: Round-trip de inserción de objeto', () => {
  it(
    'insertar un objeto y consultarlo por id retorna exactamente los mismos valores',
    async () => {
      /**
       * Validates: Requirements 5.5
       *
       * Para cualquier conjunto de valores válidos (nombre, descripción) y un
       * id_contenedor existente, insertar un objeto y luego consultarlo por su
       * id debe retornar exactamente los mismos valores incluyendo el
       * id_contenedor correcto.
       */
      await fc.assert(
        fc.asyncProperty(
          contenedorArb,
          objetoDataArb,
          async (contenedorData, objetoData) => {
            // Fresh in-memory DB per property run
            const db = await openDatabaseAsync(':memory:');
            await initializeDatabase(db as any);

            // Create a contenedor to satisfy the foreign key constraint
            const idContenedor = await insertContenedor(db as any, contenedorData);

            // Insert the objeto
            const insertedId = await insertObjeto(db as any, {
              ...objetoData,
              id_contenedor: idContenedor,
            });

            // Retrieve all objects for the contenedor and find by id
            const allObjetos = await getObjetosByContenedor(db as any, idContenedor);
            const retrieved: Objeto | undefined = allObjetos.find(
              (o) => o.id === insertedId
            );

            await db.closeAsync();

            // Must exist
            if (!retrieved) return false;

            // All fields must match exactly
            return (
              retrieved.nombre === objetoData.nombre &&
              retrieved.descripcion === objetoData.descripcion &&
              retrieved.id_contenedor === idContenedor
            );
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 9: Round-trip de actualización de objeto
// ---------------------------------------------------------------------------

// Feature: san-alejo-app, Property 9: Round-trip de actualización de objeto
describe('Property 9: Round-trip de actualización de objeto', () => {
  it(
    'actualizar un objeto y consultarlo retorna exactamente los nuevos valores',
    async () => {
      /**
       * Validates: Requirements 5.6
       *
       * Para cualquier objeto existente y cualquier conjunto de nuevos valores
       * válidos, actualizar el objeto y luego consultarlo debe retornar
       * exactamente los nuevos valores.
       */
      await fc.assert(
        fc.asyncProperty(
          contenedorArb,
          objetoDataArb,
          objetoDataArb,
          async (contenedorData, originalData, updatedData) => {
            // Fresh in-memory DB per property run
            const db = await openDatabaseAsync(':memory:');
            await initializeDatabase(db as any);

            // Create a contenedor to satisfy the foreign key constraint
            const idContenedor = await insertContenedor(db as any, contenedorData);

            // Insert the original objeto
            const insertedId = await insertObjeto(db as any, {
              ...originalData,
              id_contenedor: idContenedor,
            });

            // Update with new values
            await updateObjeto(db as any, insertedId, {
              nombre: updatedData.nombre,
              descripcion: updatedData.descripcion,
            });

            // Retrieve and find the updated objeto
            const allObjetos = await getObjetosByContenedor(db as any, idContenedor);
            const retrieved: Objeto | undefined = allObjetos.find(
              (o) => o.id === insertedId
            );

            await db.closeAsync();

            // Must still exist
            if (!retrieved) return false;

            // Fields must reflect the updated values, not the originals
            return (
              retrieved.nombre === updatedData.nombre &&
              retrieved.descripcion === updatedData.descripcion &&
              retrieved.id_contenedor === idContenedor
            );
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 10: Eliminación en cascada de objetos al eliminar contenedor
// ---------------------------------------------------------------------------

// Feature: san-alejo-app, Property 10: Eliminación en cascada de objetos al eliminar contenedor
describe('Property 10: Eliminación en cascada de objetos al eliminar contenedor', () => {
  it(
    'eliminar un contenedor deja getObjetosByContenedor vacío para ese id_contenedor',
    async () => {
      /**
       * Validates: Requirements 7.3
       *
       * Para cualquier contenedor con N objetos (N ≥ 0), eliminar el contenedor
       * debe resultar en que getObjetosByContenedor retorne una lista vacía para
       * ese id_contenedor, gracias a la restricción ON DELETE CASCADE del esquema.
       */
      await fc.assert(
        fc.asyncProperty(
          // N objetos para el contenedor (0..20)
          fc.array(objetoDataArb, { minLength: 0, maxLength: 20 }),
          async (objetos) => {
            // Fresh in-memory DB per property run
            const db = await openDatabaseAsync(':memory:');
            await initializeDatabase(db as any);

            // Create a contenedor
            const idContenedor = await insertContenedor(db as any, {
              nombre: 'Contenedor Cascada',
              descripcion: 'Contenedor para prueba de cascada',
              ubicacion: 'Ubicacion Cascada',
            });

            // Insert N objetos into the contenedor
            for (const obj of objetos) {
              await insertObjeto(db as any, {
                ...obj,
                id_contenedor: idContenedor,
              });
            }

            // Delete the contenedor — should cascade-delete all its objetos
            await deleteContenedor(db as any, idContenedor);

            // Query objetos for the deleted contenedor
            const result = await getObjetosByContenedor(db as any, idContenedor);

            await db.closeAsync();

            // Must return empty array regardless of how many objetos were inserted
            return result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
