import { SQLiteDatabase } from 'expo-sqlite';

export interface Etiqueta {
  id: number;
  nombre: string;
  fecha_creacion: number;
}

function normalizeNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ');
}

/** Crea una etiqueta si no existe (idempotente). Devuelve el registro. */
export async function createEtiqueta(
  db: SQLiteDatabase,
  nombreRaw: string
): Promise<Etiqueta> {
  const nombre = normalizeNombre(nombreRaw);
  if (!nombre) throw new Error('Etiqueta vacía no permitida');

  // Intentar insertar; si falla por UNIQUE, recuperar el registro existente.
  try {
    const result = await db.runAsync(
      'INSERT INTO etiqueta (nombre, fecha_creacion) VALUES (?, ?)',
      nombre,
      Math.floor(Date.now() / 1000)
    );
    const id = result.lastInsertRowId as number;
    const row = await db.getFirstAsync<Etiqueta>('SELECT * FROM etiqueta WHERE id = ?', id);
    // notify listeners that a new etiqueta was created
    try {
      const { publish } = await import('../utils/pubsub');
      publish('etiquetas:changed');
    } catch {
      // ignore
    }
    return row as Etiqueta;
  } catch (e: any) {
    // Si es constraint UNIQUE, intentar devolver el registro existente
    const existing = await db.getFirstAsync<Etiqueta>(
      'SELECT * FROM etiqueta WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
      nombre
    );
    if (existing) return existing;
    throw e;
  }
}

export async function getEtiquetaById(
  db: SQLiteDatabase,
  id: number
): Promise<Etiqueta | null> {
  return db.getFirstAsync<Etiqueta>('SELECT * FROM etiqueta WHERE id = ?', id);
}

export async function searchEtiquetas(
  db: SQLiteDatabase,
  query: string,
  limit = 20
): Promise<Etiqueta[]> {
  const pattern = `%${query}%`;
  return db.getAllAsync<Etiqueta>(
    'SELECT * FROM etiqueta WHERE nombre LIKE ? COLLATE NOCASE ORDER BY nombre ASC LIMIT ?',
    pattern,
    limit
  );
}

export async function listAllEtiquetas(db: SQLiteDatabase): Promise<Etiqueta[]> {
  return db.getAllAsync<Etiqueta>('SELECT * FROM etiqueta ORDER BY nombre ASC');
}

export async function deleteEtiqueta(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM etiqueta WHERE id = ?', id);
}

/** Elimina etiquetas que no están asociadas a ningún objeto. */
export async function deleteUnusedEtiquetas(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `DELETE FROM etiqueta
     WHERE NOT EXISTS (
       SELECT 1 FROM objeto_etiqueta oe WHERE oe.id_etiqueta = etiqueta.id
     )`
  );
  // notify listeners that etiquetas changed
  try {
    // lazy import to avoid circular deps
    const { publish } = await import('../utils/pubsub');
    publish('etiquetas:changed');
  } catch {
    // ignore
  }
}
