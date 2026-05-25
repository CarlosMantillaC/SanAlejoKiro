import * as FileSystem from 'expo-file-system';
import { SQLiteDatabase } from 'expo-sqlite';
import { Contenedor } from '../db/contenedorRepository';
import { Objeto } from '../db/objetoRepository';

export interface BackupData {
  version: number;
  exportedAt: string;
  contenedores: Contenedor[];
  objetos: Objeto[];
  nota?: string;
}

/**
 * Exporta todos los datos de la BD a un archivo JSON.
 * Retorna la ruta del archivo generado.
 */
export async function exportarDatos(db: SQLiteDatabase): Promise<string> {
  const contenedores = await db.getAllAsync<Contenedor>(
    'SELECT * FROM contenedor ORDER BY nombre ASC'
  );
  const objetos = await db.getAllAsync<Objeto>(
    'SELECT * FROM objeto ORDER BY id ASC'
  );

  const hayFotos = objetos.some(o => o.foto_uri !== null);

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    contenedores,
    objetos,
    nota: hayFotos
      ? 'Las fotos de los objetos no se incluyen en el backup. Transfiérelas manualmente si es necesario.'
      : undefined,
  };

  const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const fileName = `san-alejo-backup-${fecha}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
}

/**
 * Valida que el JSON tiene la estructura esperada de un backup.
 */
export function validarBackup(json: unknown): json is BackupData {
  if (typeof json !== 'object' || json === null) return false;
  const obj = json as Record<string, unknown>;
  if (typeof obj.version !== 'number') return false;
  if (typeof obj.exportedAt !== 'string') return false;
  if (!Array.isArray(obj.contenedores)) return false;
  if (!Array.isArray(obj.objetos)) return false;
  return true;
}

/**
 * Importa datos desde un archivo JSON de backup.
 * Reemplaza TODOS los datos existentes en una transacción atómica.
 */
export async function importarDatos(db: SQLiteDatabase, filePath: string): Promise<void> {
  const contenido = await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let backup: unknown;
  try {
    backup = JSON.parse(contenido);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  if (!validarBackup(backup)) {
    throw new Error('El archivo no tiene el formato de backup esperado.');
  }

  // Transacción atómica: eliminar todo e insertar los datos del backup
  await db.withTransactionAsync(async () => {
    // Eliminar en orden correcto (objetos primero por FK)
    await db.runAsync('DELETE FROM objeto');
    await db.runAsync('DELETE FROM contenedor');

    // Insertar contenedores
    for (const c of backup.contenedores) {
      await db.runAsync(
        'INSERT INTO contenedor (id, nombre, descripcion, ubicacion, created_at) VALUES (?, ?, ?, ?, ?)',
        c.id, c.nombre, c.descripcion, c.ubicacion, c.created_at ?? 0
      );
    }

    // Insertar objetos (foto_uri se importa como null — las fotos no se respaldan)
    for (const o of backup.objetos) {
      await db.runAsync(
        'INSERT INTO objeto (id, nombre, descripcion, id_contenedor, foto_uri) VALUES (?, ?, ?, ?, ?)',
        o.id, o.nombre, o.descripcion, o.id_contenedor, null
      );
    }
  });
}
