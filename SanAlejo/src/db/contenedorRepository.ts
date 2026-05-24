import { SQLiteDatabase } from 'expo-sqlite';
import { deleteImageFromStorage } from '../utils/imageStorage';

export interface Contenedor {
  id: number;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  fecha_creacion: number; // timestamp Unix en segundos
}

export type CriterioOrden = 'nombre' | 'fecha_creacion' | 'cantidad_objetos';
export type DireccionOrden = 'asc' | 'desc';

export interface FiltroContenedor {
  filtroUbicacion: string | null;
  criterioOrden: CriterioOrden;
  direccionOrden: DireccionOrden;
}

export async function getAllContenedores(db: SQLiteDatabase): Promise<Contenedor[]> {
  return db.getAllAsync<Contenedor>(
    'SELECT * FROM contenedor ORDER BY nombre ASC'
  );
}

export async function getContenedorById(db: SQLiteDatabase, id: number): Promise<Contenedor | null> {
  return db.getFirstAsync<Contenedor>(
    'SELECT * FROM contenedor WHERE id = ?', id
  );
}

export async function insertContenedor(
  db: SQLiteDatabase,
  data: Omit<Contenedor, 'id'> & { fecha_creacion?: number }
): Promise<number> {
  const fecha_creacion = data.fecha_creacion ?? Math.floor(Date.now() / 1000);
  const result = await db.runAsync(
    'INSERT INTO contenedor (nombre, descripcion, ubicacion, fecha_creacion) VALUES (?, ?, ?, ?)',
    data.nombre, data.descripcion, data.ubicacion, fecha_creacion
  );
  return result.lastInsertRowId;
}

export async function updateContenedor(
  db: SQLiteDatabase,
  id: number,
  data: Omit<Contenedor, 'id'>
): Promise<void> {
  await db.runAsync(
    'UPDATE contenedor SET nombre = ?, descripcion = ?, ubicacion = ? WHERE id = ?',
    data.nombre, data.descripcion, data.ubicacion, id
  );
}

export async function deleteContenedor(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM contenedor WHERE id = ?', id);
}

/**
 * Retorna contenedores filtrados por ubicación y ordenados según los parámetros.
 * La cláusula ORDER BY se construye con valores de enumeración validados,
 * nunca interpolando texto arbitrario del usuario.
 */
export async function getContenedoresFiltrados(
  db: SQLiteDatabase,
  filtroUbicacion: string | null,
  criterioOrden: CriterioOrden,
  direccionOrden: DireccionOrden
): Promise<Contenedor[]> {
  // Whitelist mapping for ORDER BY column expression
  const criterioMap: Record<CriterioOrden, string> = {
    nombre: 'c.nombre',
    fecha_creacion: 'c.fecha_creacion',
    cantidad_objetos: '(SELECT COUNT(*) FROM objeto WHERE id_contenedor = c.id)',
  };

  // Whitelist mapping for direction
  const direccionMap: Record<DireccionOrden, string> = {
    asc: 'ASC',
    desc: 'DESC',
  };

  // Validate against whitelists (TypeScript types already constrain this,
  // but we guard at runtime too for safety)
  const columnaOrden = criterioMap[criterioOrden];
  const direccionSQL = direccionMap[direccionOrden];

  if (!columnaOrden || !direccionSQL) {
    throw new Error(`Parámetros de orden inválidos: ${criterioOrden}, ${direccionOrden}`);
  }

  if (filtroUbicacion !== null) {
    return db.getAllAsync<Contenedor>(
      `SELECT c.* FROM contenedor c WHERE LOWER(c.ubicacion) = LOWER(?) ORDER BY ${columnaOrden} ${direccionSQL}`,
      filtroUbicacion
    );
  } else {
    return db.getAllAsync<Contenedor>(
      `SELECT c.* FROM contenedor c ORDER BY ${columnaOrden} ${direccionSQL}`
    );
  }
}

/**
 * Retorna los valores de ubicación únicos (no vacíos) presentes en la tabla.
 * Ordenados alfabéticamente.
 */
export async function getUbicacionesUnicas(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ ubicacion: string }>(
    `SELECT DISTINCT ubicacion FROM contenedor WHERE ubicacion IS NOT NULL AND TRIM(ubicacion) != '' ORDER BY ubicacion ASC`
  );
  return rows.map((r) => r.ubicacion);
}

/**
 * Elimina un contenedor y antes limpia todos los archivos de imagen
 * de sus objetos. Retorna las URIs procesadas (para logging/tests).
 * Usa Promise.allSettled para tolerar fallos parciales en FileSystem.
 * Si algún archivo no pudo eliminarse, `hadFileErrors` será `true`.
 */
export async function deleteContenedorConFotos(
  db: SQLiteDatabase,
  id: number,
  fotoRepo: { getUrisByContenedor: (db: SQLiteDatabase, id_contenedor: number) => Promise<string[]> }
): Promise<{ uris: string[]; hadFileErrors: boolean }> {
  // 1. Get all photo URIs for this container's objects
  const uris = await fotoRepo.getUrisByContenedor(db, id);

  // 2. Delete files from FileSystem (tolerate partial failures)
  let hadFileErrors = false;
  if (uris.length > 0) {
    const results = await Promise.allSettled(uris.map(uri => deleteImageFromStorage(uri)));
    hadFileErrors = results.some(r => r.status === 'rejected');
  }

  // 3. Delete the container record (CASCADE deletes objects and objeto_foto rows)
  await deleteContenedor(db, id);

  // 4. Return the URIs that were processed and whether any file deletions failed
  return { uris, hadFileErrors };
}
