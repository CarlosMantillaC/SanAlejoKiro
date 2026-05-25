import { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  const DATABASE_VERSION = 6;

  await db.execAsync('PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const user_version = result?.user_version ?? 0;

  if (user_version >= DATABASE_VERSION) return;

  if (user_version === 0) {
    // Instalación nueva: crear tablas con todas las columnas desde el inicio
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS contenedor (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre      TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        ubicacion   TEXT NOT NULL,
        created_at  INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS objeto (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre        TEXT NOT NULL,
        descripcion   TEXT NOT NULL,
        id_contenedor INTEGER NOT NULL,
        FOREIGN KEY (id_contenedor) REFERENCES contenedor(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS objeto_foto (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        id_objeto  INTEGER NOT NULL,
        foto_uri   TEXT NOT NULL,
        FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS etiqueta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS objeto_etiqueta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_objeto INTEGER NOT NULL,
        id_etiqueta INTEGER NOT NULL,
        FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE,
        FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id) ON DELETE CASCADE
      );
    `);
  } else if (user_version === 1) {
    // Migración v1 → v2: agregar foto_uri a objeto
    await db.execAsync('ALTER TABLE objeto ADD COLUMN foto_uri TEXT;');
  }

  if (user_version < 3) {
    // Migración v2 → v3: agregar created_at a contenedor
    await db.execAsync('ALTER TABLE contenedor ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;');
  }

  if (user_version < 4) {
    // Migración v3 → v4: crear tabla objeto_foto y migrar foto_uri existentes
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS objeto_foto (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        id_objeto  INTEGER NOT NULL,
        foto_uri   TEXT NOT NULL,
        FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE
      );
    `);
    // Migrar foto_uri existentes de objeto a objeto_foto
    await db.execAsync(`
      INSERT INTO objeto_foto (id_objeto, foto_uri)
      SELECT id, foto_uri FROM objeto WHERE foto_uri IS NOT NULL;
    `);
    // Recrear tabla objeto sin columna foto_uri
    await db.execAsync(`
      CREATE TABLE objeto_new (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre        TEXT NOT NULL,
        descripcion   TEXT NOT NULL,
        id_contenedor INTEGER NOT NULL,
        FOREIGN KEY (id_contenedor) REFERENCES contenedor(id) ON DELETE CASCADE
      );
      INSERT INTO objeto_new (id, nombre, descripcion, id_contenedor)
      SELECT id, nombre, descripcion, id_contenedor FROM objeto;
      DROP TABLE objeto;
      ALTER TABLE objeto_new RENAME TO objeto;
    `);
  }

  if (user_version < 5) {
    // Migración v4 → v5: crear tablas de etiquetas y relación objeto_etiqueta
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS etiqueta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS objeto_etiqueta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_objeto INTEGER NOT NULL,
        id_etiqueta INTEGER NOT NULL,
        FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE,
        FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id) ON DELETE CASCADE
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}
