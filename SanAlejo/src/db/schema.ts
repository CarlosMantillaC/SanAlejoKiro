import { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  const DATABASE_VERSION = 2;

  await db.execAsync('PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const user_version = result?.user_version ?? 0;

  if (user_version >= DATABASE_VERSION) return;

  if (user_version === 0) {
    // Instalación nueva: crear tablas con foto_uri incluido desde el inicio
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS contenedor (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre      TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        ubicacion   TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS objeto (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre        TEXT NOT NULL,
        descripcion   TEXT NOT NULL,
        id_contenedor INTEGER NOT NULL,
        foto_uri      TEXT,
        FOREIGN KEY (id_contenedor) REFERENCES contenedor(id) ON DELETE CASCADE
      );
    `);
  } else if (user_version === 1) {
    // Migración de v1 a v2: agregar foto_uri a instalaciones existentes
    await db.execAsync('ALTER TABLE objeto ADD COLUMN foto_uri TEXT;');
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}
