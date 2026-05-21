/**
 * Manual mock for expo-sqlite using better-sqlite3 for real SQL execution in tests.
 * This allows smoke tests to run in a Node.js/Jest environment without native modules.
 */
const BetterSQLite = require('better-sqlite3');

class MockSQLiteDatabase {
  constructor(db) {
    this._db = db;
  }

  async execAsync(source) {
    // better-sqlite3 exec() runs multiple statements separated by semicolons
    this._db.exec(source);
  }

  async getFirstAsync(source, ...params) {
    const stmt = this._db.prepare(source);
    const row = stmt.get(...params.flat());
    return row ?? null;
  }

  async getAllAsync(source, ...params) {
    const stmt = this._db.prepare(source);
    return stmt.all(...params.flat());
  }

  async runAsync(source, ...params) {
    const stmt = this._db.prepare(source);
    const info = stmt.run(...params.flat());
    return { lastInsertRowId: info.lastInsertRowid, changes: info.changes };
  }

  async closeAsync() {
    this._db.close();
  }
}

async function openDatabaseAsync(name) {
  // Use ':memory:' for in-memory databases in tests
  const dbPath = name === ':memory:' ? ':memory:' : ':memory:';
  const db = new BetterSQLite(dbPath);
  return new MockSQLiteDatabase(db);
}

module.exports = {
  openDatabaseAsync,
  MockSQLiteDatabase,
};
