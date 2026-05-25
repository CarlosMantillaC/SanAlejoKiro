import { SQLiteDatabase } from 'expo-sqlite';

export interface Contenedor {
  id: number;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  created_at: number;
}

export type OrdenContenedor = 'nombre' | 'fecha' | 'cantidad_objetos';

function buildGetAllQuery(orden: OrdenContenedor, filtroUbicacion?: string): { sql: string; params: string[] } {
  const whereClause = filtroUbicacion && filtroUbicacion.trim().length > 0
    ? 'WHERE ubicacion LIKE ? COLLATE NOCASE'
    : '';

  let orderClause: string;
  switch (orden) {
    case 'fecha':
      orderClause = 'ORDER BY created_at DESC';
      break;
    case 'cantidad_objetos':
      orderClause = 'ORDER BY (SELECT COUNT(*) FROM objeto WHERE id_contenedor = contenedor.id) DESC';
      break;
    case 'nombre':
    default:
      orderClause = 'ORDER BY nombre ASC';
      break;
  }

  const sql = `SELECT * FROM contenedor ${whereClause} ${orderClause}`.trim();
  const params = whereClause ? [`%${filtroUbicacion!.trim()}%`] : [];

  return { sql, params };
}

export async function getAllContenedores(
  db: SQLiteDatabase,
  orden: OrdenContenedor = 'nombre',
  filtroUbicacion?: string
): Promise<Contenedor[]> {
  const { sql, params } = buildGetAllQuery(orden, filtroUbicacion);
  return db.getAllAsync<Contenedor>(sql, ...params);
}

export async function getContenedorById(db: SQLiteDatabase, id: number): Promise<Contenedor | null> {
  return db.getFirstAsync<Contenedor>(
    'SELECT * FROM contenedor WHERE id = ?', id
  );
}

export async function insertContenedor(
  db: SQLiteDatabase,
  data: Omit<Contenedor, 'id' | 'created_at'>
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO contenedor (nombre, descripcion, ubicacion, created_at) VALUES (?, ?, ?, ?)',
    data.nombre, data.descripcion, data.ubicacion, Date.now()
  );
  return result.lastInsertRowId;
}

export async function updateContenedor(
  db: SQLiteDatabase,
  id: number,
  data: Omit<Contenedor, 'id' | 'created_at'>
): Promise<void> {
  await db.runAsync(
    'UPDATE contenedor SET nombre = ?, descripcion = ?, ubicacion = ? WHERE id = ?',
    data.nombre, data.descripcion, data.ubicacion, id
  );
}

export async function deleteContenedor(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM contenedor WHERE id = ?', id);
}
