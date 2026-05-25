import { SQLiteDatabase } from 'expo-sqlite';

export interface Objeto {
  id: number;
  nombre: string;
  descripcion: string;
  id_contenedor: number;
  foto_uri?: string | null;
  etiquetas?: Etiqueta[];
}

export interface ObjetoConContenedor extends Objeto {
  nombre_contenedor: string;
}

export interface Etiqueta {
  id: number;
  nombre: string;
}

export async function getObjetosByContenedor(
  db: SQLiteDatabase,
  id_contenedor: number
): Promise<Objeto[]> {
  return db.getAllAsync<Objeto>(
    `SELECT o.*, (
       SELECT foto_uri FROM objeto_foto f WHERE f.id_objeto = o.id ORDER BY id ASC LIMIT 1
     ) AS foto_uri
     FROM objeto o
     WHERE id_contenedor = ?
     ORDER BY o.nombre ASC`,
    id_contenedor
  );
}

export async function getObjetoById(
  db: SQLiteDatabase,
  id: number
): Promise<Objeto | null> {
  return db.getFirstAsync<Objeto>(
    `SELECT o.*, (
       SELECT foto_uri FROM objeto_foto f WHERE f.id_objeto = o.id ORDER BY id ASC LIMIT 1
     ) AS foto_uri
     FROM objeto o
     WHERE o.id = ?`,
    id
  );
}

export async function insertObjeto(
  db: SQLiteDatabase,
  data: Omit<Objeto, 'id'> & { foto_uri?: string | null }
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO objeto (nombre, descripcion, id_contenedor) VALUES (?, ?, ?)',
    data.nombre,
    data.descripcion,
    data.id_contenedor
  );
  const objetoId = result.lastInsertRowId;

  if (data.foto_uri) {
    await db.runAsync(
      'INSERT INTO objeto_foto (id_objeto, foto_uri) VALUES (?, ?)',
      objetoId,
      data.foto_uri
    );
  }

  return objetoId;
}

export async function updateObjeto(
  db: SQLiteDatabase,
  id: number,
  data: Pick<Objeto, 'nombre' | 'descripcion'> & { foto_uri?: string | null }
): Promise<void> {
  await db.runAsync(
    'UPDATE objeto SET nombre = ?, descripcion = ? WHERE id = ?',
    data.nombre,
    data.descripcion,
    id
  );

  if (Object.prototype.hasOwnProperty.call(data, 'foto_uri')) {
    await db.runAsync('DELETE FROM objeto_foto WHERE id_objeto = ?', id);
    if (data.foto_uri) {
      await db.runAsync(
        'INSERT INTO objeto_foto (id_objeto, foto_uri) VALUES (?, ?)',
        id,
        data.foto_uri
      );
    }
  }
}

export async function deleteObjeto(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM objeto WHERE id = ?', id);
}

export async function getObjetosFotoUriByContenedor(
  db: SQLiteDatabase,
  id_contenedor: number
): Promise<string[]> {
  return db
    .getAllAsync<{ foto_uri: string }>(
      `SELECT f.foto_uri FROM objeto_foto f
       JOIN objeto o ON f.id_objeto = o.id
       WHERE o.id_contenedor = ?`,
      id_contenedor
    )
    .then((rows) => rows.map((r) => r.foto_uri));
}

export async function searchObjetos(
  db: SQLiteDatabase,
  query: string,
  etiquetaIds?: number[]
): Promise<ObjetoConContenedor[]> {
  const pattern = `%${query}%`;
  const baseQuery = `SELECT DISTINCT o.*, c.nombre AS nombre_contenedor
     FROM objeto o
     JOIN contenedor c ON o.id_contenedor = c.id`;

  if (!etiquetaIds || etiquetaIds.length === 0) {
    return db.getAllAsync<ObjetoConContenedor>(
      `${baseQuery}
       WHERE o.nombre LIKE ? COLLATE NOCASE
          OR o.descripcion LIKE ? COLLATE NOCASE
       ORDER BY o.nombre ASC`,
      pattern,
      pattern
    );
  }

  const placeholders = etiquetaIds.map(() => '?').join(',');
  return db.getAllAsync<ObjetoConContenedor>(
    `${baseQuery}
       JOIN objeto_etiqueta oe ON oe.id_objeto = o.id
       WHERE (o.nombre LIKE ? COLLATE NOCASE
          OR o.descripcion LIKE ? COLLATE NOCASE)
         AND oe.id_etiqueta IN (${placeholders})
       ORDER BY o.nombre ASC`,
    ...[pattern, pattern, ...etiquetaIds]
  );
}
