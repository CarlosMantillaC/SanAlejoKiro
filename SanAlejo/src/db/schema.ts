import { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  const DATABASE_VERSION = 3;

  // Enable foreign keys (must be outside any transaction)
  await db.runAsync('PRAGMA foreign_keys = ON');

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const user_version = result?.user_version ?? 0;

  if (user_version >= DATABASE_VERSION) {
    // Defensive check: ensure objeto_foto exists for devices that reached
    // user_version=3 without the table being created (e.g. mid-migration crash)
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS objeto_foto (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        id_objeto INTEGER NOT NULL,
        uri       TEXT NOT NULL,
        orden     INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE
      )
    `);
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_objeto_foto_id_objeto ON objeto_foto (id_objeto)'
    );
    return;
  }

  if (user_version === 0) {
    // Fresh install: create all tables
    await db.runAsync('PRAGMA journal_mode = WAL');
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS contenedor (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre      TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        ubicacion   TEXT NOT NULL
      )
    `);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS objeto (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre        TEXT NOT NULL,
        descripcion   TEXT NOT NULL,
        id_contenedor INTEGER NOT NULL,
        foto_uri      TEXT,
        FOREIGN KEY (id_contenedor) REFERENCES contenedor(id) ON DELETE CASCADE
      )
    `);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS objeto_foto (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        id_objeto INTEGER NOT NULL,
        uri       TEXT NOT NULL,
        orden     INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE
      )
    `);
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_objeto_foto_id_objeto ON objeto_foto (id_objeto)'
    );
  }

  if (user_version === 1) {
    // v1 → v2: add foto_uri column
    await db.runAsync('ALTER TABLE objeto ADD COLUMN foto_uri TEXT');
  }

  if (user_version === 1 || user_version === 2) {
    // v1/v2 → v3: create objeto_foto and migrate existing foto_uri data
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS objeto_foto (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        id_objeto INTEGER NOT NULL,
        uri       TEXT NOT NULL,
        orden     INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (id_objeto) REFERENCES objeto(id) ON DELETE CASCADE
      )
    `);
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_objeto_foto_id_objeto ON objeto_foto (id_objeto)'
    );
    await db.runAsync(`
      INSERT INTO objeto_foto (id_objeto, uri, orden)
        SELECT id, foto_uri, 0 FROM objeto WHERE foto_uri IS NOT NULL
    `);
  }

  await db.runAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
