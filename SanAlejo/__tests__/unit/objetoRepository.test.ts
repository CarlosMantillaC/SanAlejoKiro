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
  getObjetoById,
  getObjetosFotoUriByContenedor,
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
                foto_uri: null,
              });
            }

            // Insert M objetos into contenedor B
            for (const obj of objetosB) {
              await insertObjeto(db as any, {
                ...obj,
                id_contenedor: idContenedorB,
                foto_uri: null,
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
              foto_uri: null,
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
              foto_uri: null,
            });

            // Update with new values
            await updateObjeto(db as any, insertedId, {
              nombre: updatedData.nombre,
              descripcion: updatedData.descripcion,
              foto_uri: null,
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
                foto_uri: null,
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

// ---------------------------------------------------------------------------
// Property 14: Round-trip de foto en objeto
// ---------------------------------------------------------------------------

// Feature: san-alejo-app, Property 14: Round-trip de foto en objeto
describe('Property 14: Round-trip de foto en objeto', () => {
  it(
    'insertar un objeto con foto_uri y consultarlo por id retorna la misma ruta (o null)',
    async () => {
      /**
       * Validates: Requirements 10.5, 10.6
       *
       * Para cualquier objeto con foto_uri (incluyendo null), insertar el objeto
       * y luego consultarlo por su id debe retornar exactamente la misma ruta de
       * foto (o null) que fue persistida.
       */
      const fotoUriArb = fc.oneof(
        fc.constant(null),
        fc.string({ minLength: 1, maxLength: 200 }).map(s => `file:///images/${s}.jpg`)
      );

      await fc.assert(
        fc.asyncProperty(
          contenedorArb,
          objetoDataArb,
          fotoUriArb,
          async (contenedorData, objetoData, fotoUri) => {
            // Fresh in-memory DB per property run
            const db = await openDatabaseAsync(':memory:');
            await initializeDatabase(db as any);

            // Create a contenedor to satisfy the foreign key constraint
            const idContenedor = await insertContenedor(db as any, contenedorData);

            // Insert the objeto with foto_uri
            const insertedId = await insertObjeto(db as any, {
              ...objetoData,
              id_contenedor: idContenedor,
              foto_uri: fotoUri,
            });

            // Retrieve by id using getObjetoById
            const retrieved = await getObjetoById(db as any, insertedId);

            await db.closeAsync();

            // Must exist and foto_uri must match exactly
            return retrieved !== null && retrieved.foto_uri === fotoUri;
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// getObjetosFotoUriByContenedor: solo retorna rutas no nulas
// ---------------------------------------------------------------------------

describe('getObjetosFotoUriByContenedor', () => {
  it(
    'retorna solo las rutas foto_uri no nulas de los objetos del contenedor',
    async () => {
      /**
       * Validates: Requirements 10.10
       *
       * Para cualquier contenedor con objetos que tienen foto_uri nulo o no nulo,
       * getObjetosFotoUriByContenedor debe retornar exactamente las rutas no nulas.
       */
      const fotoUriArb = fc.oneof(
        fc.constant(null),
        fc.string({ minLength: 1, maxLength: 100 }).map(s => `file:///images/${s}.jpg`)
      );

      const objetoConFotoArb = fc.record({
        nombre: fc.string({ minLength: 1, maxLength: 80 }),
        descripcion: fc.string({ minLength: 1, maxLength: 200 }),
        foto_uri: fotoUriArb,
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(objetoConFotoArb, { minLength: 0, maxLength: 15 }),
          async (objetos) => {
            const db = await openDatabaseAsync(':memory:');
            await initializeDatabase(db as any);

            const idContenedor = await insertContenedor(db as any, {
              nombre: 'Contenedor Fotos',
              descripcion: 'Para prueba de fotos',
              ubicacion: 'Ubicacion Fotos',
            });

            for (const obj of objetos) {
              await insertObjeto(db as any, {
                nombre: obj.nombre,
                descripcion: obj.descripcion,
                id_contenedor: idContenedor,
                foto_uri: obj.foto_uri,
              });
            }

            const uris = await getObjetosFotoUriByContenedor(db as any, idContenedor);

            await db.closeAsync();

            // Expected: only non-null foto_uri values
            const expectedUris = objetos
              .map(o => o.foto_uri)
              .filter((u): u is string => u !== null);

            // Count must match
            if (uris.length !== expectedUris.length) return false;

            // All returned uris must be non-null strings
            return uris.every(u => typeof u === 'string' && u.length > 0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
