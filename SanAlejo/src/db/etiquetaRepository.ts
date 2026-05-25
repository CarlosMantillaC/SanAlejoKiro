import { SQLiteDatabase } from 'expo-sqlite';

export interface Etiqueta {
  id: number;
  nombre: string;
}

export async function getAllEtiquetas(db: SQLiteDatabase): Promise<Etiqueta[]> {
  return db.getAllAsync<Etiqueta>('SELECT * FROM etiqueta ORDER BY nombre ASC');
}

export async function insertEtiqueta(db: SQLiteDatabase, nombre: string): Promise<number> {
  const result = await db.runAsync('INSERT INTO etiqueta (nombre) VALUES (?)', nombre);
  return result.lastInsertRowId;
}

export async function insertEtiquetaIfNotExists(db: SQLiteDatabase, nombre: string): Promise<number> {
  await db.runAsync('INSERT OR IGNORE INTO etiqueta (nombre) VALUES (?)', nombre);
  const etiqueta = await db.getFirstAsync<Etiqueta>('SELECT id, nombre FROM etiqueta WHERE nombre = ?', nombre);
  if (!etiqueta) {
    throw new Error('No se pudo crear o recuperar la etiqueta.');
  }
  return etiqueta.id;
}

export async function deleteEtiqueta(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM etiqueta WHERE id = ?', id);
}

export async function getEtiquetasEnUso(db: SQLiteDatabase): Promise<Etiqueta[]> {
  return db.getAllAsync<Etiqueta>(
    `SELECT e.* FROM etiqueta e
     JOIN objeto_etiqueta oe ON e.id = oe.id_etiqueta
     GROUP BY e.id
     ORDER BY e.nombre ASC`
  );
}

export async function getEtiquetasByObjeto(db: SQLiteDatabase, id_objeto: number): Promise<Etiqueta[]> {
  return db.getAllAsync<Etiqueta>(
    `SELECT e.* FROM etiqueta e
     JOIN objeto_etiqueta oe ON e.id = oe.id_etiqueta
     WHERE oe.id_objeto = ?
     ORDER BY e.nombre ASC`,
    id_objeto
  );
}

export async function setEtiquetasObjeto(db: SQLiteDatabase, id_objeto: number, etiquetaIds: number[]): Promise<void> {
  await db.runAsync('DELETE FROM objeto_etiqueta WHERE id_objeto = ?', id_objeto);
  for (const id_etiqueta of etiquetaIds) {
    await db.runAsync(
      'INSERT INTO objeto_etiqueta (id_objeto, id_etiqueta) VALUES (?, ?)',
      id_objeto,
      id_etiqueta
    );
  }
}

export async function getObjetosByEtiqueta(db: SQLiteDatabase, id_etiqueta: number): Promise<number[]> {
  const rows = await db.getAllAsync<{ id_objeto: number }>('SELECT id_objeto FROM objeto_etiqueta WHERE id_etiqueta = ?', id_etiqueta);
  return rows.map((r) => r.id_objeto);
}
