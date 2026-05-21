import { SQLiteDatabase } from 'expo-sqlite';

export interface Objeto {
  id: number;
  nombre: string;
  descripcion: string;
  id_contenedor: number;
  foto_uri: string | null;
}

export interface ObjetoConContenedor extends Objeto {
  nombre_contenedor: string;
}

export async function getObjetosByContenedor(
  db: SQLiteDatabase,
  id_contenedor: number
): Promise<Objeto[]> {
  return db.getAllAsync<Objeto>(
    'SELECT * FROM objeto WHERE id_contenedor = ? ORDER BY nombre ASC',
    id_contenedor
  );
}

export async function getObjetoById(
  db: SQLiteDatabase,
  id: number
): Promise<Objeto | null> {
  return db.getFirstAsync<Objeto>(
    'SELECT * FROM objeto WHERE id = ?', id
  );
}

export async function insertObjeto(
  db: SQLiteDatabase,
  data: Omit<Objeto, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO objeto (nombre, descripcion, id_contenedor, foto_uri) VALUES (?, ?, ?, ?)',
    data.nombre, data.descripcion, data.id_contenedor, data.foto_uri
  );
  return result.lastInsertRowId;
}

export async function updateObjeto(
  db: SQLiteDatabase,
  id: number,
  data: Pick<Objeto, 'nombre' | 'descripcion' | 'foto_uri'>
): Promise<void> {
  await db.runAsync(
    'UPDATE objeto SET nombre = ?, descripcion = ?, foto_uri = ? WHERE id = ?',
    data.nombre, data.descripcion, data.foto_uri, id
  );
}

export async function deleteObjeto(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM objeto WHERE id = ?', id);
}

/**
 * Retorna todas las rutas de foto no nulas de los objetos de un contenedor.
 * Se usa para limpiar archivos en cascada antes de eliminar el contenedor.
 */
export async function getObjetosFotoUriByContenedor(
  db: SQLiteDatabase,
  id_contenedor: number
): Promise<string[]> {
  const rows = await db.getAllAsync<{ foto_uri: string }>(
    'SELECT foto_uri FROM objeto WHERE id_contenedor = ? AND foto_uri IS NOT NULL',
    id_contenedor
  );
  return rows.map(r => r.foto_uri);
}

export async function searchObjetos(
  db: SQLiteDatabase,
  query: string
): Promise<ObjetoConContenedor[]> {
  const pattern = `%${query}%`;
  return db.getAllAsync<ObjetoConContenedor>(
    `SELECT o.*, c.nombre AS nombre_contenedor
     FROM objeto o
     JOIN contenedor c ON o.id_contenedor = c.id
     WHERE o.nombre LIKE ? COLLATE NOCASE
        OR o.descripcion LIKE ? COLLATE NOCASE
     ORDER BY o.nombre ASC`,
    pattern, pattern
  );
}
