import { SQLiteDatabase } from 'expo-sqlite';
import { Etiqueta } from './etiquetaRepository';

/** Sincroniza las etiquetas asociadas a un objeto.
 * - Inserta las asociaciones nuevas (INSERT OR IGNORE)
 * - Elimina las asociaciones que ya no están
 */
export async function setEtiquetasForObjeto(
  db: SQLiteDatabase,
  id_objeto: number,
  etiquetaIds: number[]
): Promise<void> {
  await db.runAsync('BEGIN');
  try {
    if (etiquetaIds.length === 0) {
      await db.runAsync('DELETE FROM objeto_etiqueta WHERE id_objeto = ?', id_objeto);
    } else {
      // Delete associations not in the new list
      const placeholders = etiquetaIds.map(() => '?').join(', ');
      await db.runAsync(
        `DELETE FROM objeto_etiqueta WHERE id_objeto = ? AND id_etiqueta NOT IN (${placeholders})`,
        id_objeto,
        ...etiquetaIds
      );

      // Insert or ignore new associations
      for (const id_etiqueta of etiquetaIds) {
        await db.runAsync(
          'INSERT OR IGNORE INTO objeto_etiqueta (id_objeto, id_etiqueta) VALUES (?, ?)',
          id_objeto,
          id_etiqueta
        );
      }
    }

    await db.runAsync('COMMIT');
  } catch (e) {
    await db.runAsync('ROLLBACK');
    throw e;
  }
}

export async function getEtiquetasForObjeto(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<Etiqueta[]> {
  return db.getAllAsync<Etiqueta>(
    `SELECT e.* FROM etiqueta e
     JOIN objeto_etiqueta oe ON e.id = oe.id_etiqueta
     WHERE oe.id_objeto = ?
     ORDER BY e.nombre ASC`,
    id_objeto
  );
}

export async function getObjetoIdsForEtiqueta(
  db: SQLiteDatabase,
  id_etiqueta: number
): Promise<number[]> {
  const rows = await db.getAllAsync<{ id_objeto: number }>(
    'SELECT id_objeto FROM objeto_etiqueta WHERE id_etiqueta = ?',
    id_etiqueta
  );
  return rows.map(r => r.id_objeto);
}

/** Retorna un Map de `id_objeto` -> `Etiqueta[]` para los objetos indicados. */
export async function getEtiquetasForObjetos(
  db: SQLiteDatabase,
  objetoIds: number[]
): Promise<Map<number, import('./etiquetaRepository').Etiqueta[]>> {
  if (objetoIds.length === 0) return new Map();
  const placeholders = objetoIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{
    id_objeto: number;
    id: number;
    nombre: string;
    fecha_creacion: number;
  }>(
    `SELECT oe.id_objeto, e.id, e.nombre, e.fecha_creacion
     FROM objeto_etiqueta oe
     JOIN etiqueta e ON oe.id_etiqueta = e.id
     WHERE oe.id_objeto IN (${placeholders})
     ORDER BY e.nombre ASC`,
    ...objetoIds
  );

  const map = new Map<number, import('./etiquetaRepository').Etiqueta[]>();
  for (const r of rows) {
    const arr = map.get(r.id_objeto) ?? [];
    arr.push({ id: r.id, nombre: r.nombre, fecha_creacion: r.fecha_creacion });
    map.set(r.id_objeto, arr);
  }
  return map;
}
