import { SQLiteDatabase } from 'expo-sqlite';

export interface FotoObjeto {
  id: number;
  id_objeto: number;
  uri: string;
  orden: number;
}

/** Retorna todas las fotos de un objeto ordenadas por `orden` ASC. */
export async function getFotosByObjeto(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<FotoObjeto[]> {
  return db.getAllAsync<FotoObjeto>(
    'SELECT * FROM objeto_foto WHERE id_objeto = ? ORDER BY orden ASC',
    id_objeto
  );
}

/** Inserta múltiples fotos para un objeto recién creado. */
export async function insertFotos(
  db: SQLiteDatabase,
  id_objeto: number,
  uris: string[]
): Promise<void> {
  if (uris.length === 0) return;

  await db.runAsync('BEGIN');
  try {
    for (let i = 0; i < uris.length; i++) {
      await db.runAsync(
        'INSERT INTO objeto_foto (id_objeto, uri, orden) VALUES (?, ?, ?)',
        id_objeto,
        uris[i],
        i
      );
    }
    await db.runAsync('COMMIT');
  } catch (e) {
    await db.runAsync('ROLLBACK');
    throw e;
  }
}

/**
 * Sincroniza la galería de un objeto existente en una transacción:
 * - Elimina los registros con ids en `deletedIds`
 * - Inserta las URIs en `newUris` con nuevos ids
 * - Actualiza el campo `orden` de todas las fotos restantes según `orderedIds`
 *   (ids de fotos existentes en el orden final) seguidos de las nuevas fotos
 */
export async function syncFotos(
  db: SQLiteDatabase,
  id_objeto: number,
  deletedIds: number[],
  newUris: string[],
  orderedIds: number[]
): Promise<void> {
  await db.runAsync('BEGIN');
  try {
    // Step 1: Delete photos with ids in deletedIds
    if (deletedIds.length > 0) {
      const placeholders = deletedIds.map(() => '?').join(', ');
      await db.runAsync(
        `DELETE FROM objeto_foto WHERE id IN (${placeholders})`,
        ...deletedIds
      );
    }

    // Step 2: Insert new photos and collect their new ids
    const newIds: number[] = [];
    for (const uri of newUris) {
      const result = await db.runAsync(
        'INSERT INTO objeto_foto (id_objeto, uri, orden) VALUES (?, ?, ?)',
        id_objeto,
        uri,
        0 // temporary orden, will be updated in step 3
      );
      newIds.push(result.lastInsertRowId);
    }

    // Step 3: Build final order: orderedIds (existing photos) + newIds (just inserted)
    const finalOrder = [...orderedIds, ...newIds];

    // Update orden for each photo based on its position in the final order
    for (let i = 0; i < finalOrder.length; i++) {
      await db.runAsync(
        'UPDATE objeto_foto SET orden = ? WHERE id = ?',
        i,
        finalOrder[i]
      );
    }

    await db.runAsync('COMMIT');
  } catch (e) {
    await db.runAsync('ROLLBACK');
    throw e;
  }
}

/** Retorna todas las URIs de fotos de un objeto (para cascade delete). */
export async function getUrisByObjeto(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<string[]> {
  const rows = await db.getAllAsync<{ uri: string }>(
    'SELECT uri FROM objeto_foto WHERE id_objeto = ?',
    id_objeto
  );
  return rows.map(r => r.uri);
}

/** Retorna todas las URIs de fotos de todos los objetos de un contenedor. */
export async function getUrisByContenedor(
  db: SQLiteDatabase,
  id_contenedor: number
): Promise<string[]> {
  const rows = await db.getAllAsync<{ uri: string }>(
    `SELECT of.uri FROM objeto_foto of
     JOIN objeto o ON of.id_objeto = o.id
     WHERE o.id_contenedor = ?`,
    id_contenedor
  );
  return rows.map(r => r.uri);
}

/** Retorna la URI de la foto portada (menor orden) de un objeto, o null. */
export async function getPortadaUri(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<string | null> {
  const row = await db.getFirstAsync<{ uri: string }>(
    'SELECT uri FROM objeto_foto WHERE id_objeto = ? ORDER BY orden ASC LIMIT 1',
    id_objeto
  );
  return row?.uri ?? null;
}
