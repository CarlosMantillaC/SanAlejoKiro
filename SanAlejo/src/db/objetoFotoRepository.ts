import { SQLiteDatabase } from 'expo-sqlite';

export interface ObjetoFoto {
  id: number;
  id_objeto: number;
  foto_uri: string;
}

export async function getFotosByObjeto(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<ObjetoFoto[]> {
  return db.getAllAsync<ObjetoFoto>(
    'SELECT * FROM objeto_foto WHERE id_objeto = ? ORDER BY id ASC',
    id_objeto
  );
}

export async function insertFoto(
  db: SQLiteDatabase,
  id_objeto: number,
  foto_uri: string
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO objeto_foto (id_objeto, foto_uri) VALUES (?, ?)',
    id_objeto, foto_uri
  );
  return result.lastInsertRowId;
}

export async function deleteFoto(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM objeto_foto WHERE id = ?', id);
}

/**
 * Elimina todas las fotos de un objeto y retorna las URIs para limpiar archivos.
 */
export async function deleteFotosByObjeto(
  db: SQLiteDatabase,
  id_objeto: number
): Promise<string[]> {
  const fotos = await getFotosByObjeto(db, id_objeto);
  const uris = fotos.map(f => f.foto_uri);
  await db.runAsync('DELETE FROM objeto_foto WHERE id_objeto = ?', id_objeto);
  return uris;
}

/**
 * Retorna todas las URIs de fotos de objetos pertenecientes a un contenedor.
 * Se usa para limpiar archivos en cascada al eliminar un contenedor.
 */
export async function getFotosUriByContenedor(
  db: SQLiteDatabase,
  id_contenedor: number
): Promise<string[]> {
  const rows = await db.getAllAsync<{ foto_uri: string }>(
    `SELECT of.foto_uri
     FROM objeto_foto of
     JOIN objeto o ON of.id_objeto = o.id
     WHERE o.id_contenedor = ?`,
    id_contenedor
  );
  return rows.map(r => r.foto_uri);
}
