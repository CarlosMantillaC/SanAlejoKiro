/**
 * Smoke tests for database initialization.
 *
 * Validates: Requirements 1.1, 1.2
 *
 * These tests verify that:
 * - The `contenedor` table is created after initializeDatabase (Req 1.1)
 * - The `objeto` table is created after initializeDatabase (Req 1.1)
 * - Foreign keys are enabled (PRAGMA foreign_keys = 1) (Req 1.2)
 */

import { openDatabaseAsync } from 'expo-sqlite';
import { initializeDatabase } from '../../src/db/schema';

describe('Database initialization smoke tests', () => {
  it('creates the contenedor table', async () => {
    const db = await openDatabaseAsync(':memory:');
    await initializeDatabase(db as any);

    const row = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='contenedor'"
    );

    expect(row).not.toBeNull();
    expect(row?.name).toBe('contenedor');
  });

  it('creates the objeto table', async () => {
    const db = await openDatabaseAsync(':memory:');
    await initializeDatabase(db as any);

    const row = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='objeto'"
    );

    expect(row).not.toBeNull();
    expect(row?.name).toBe('objeto');
  });

  it('enables foreign keys (PRAGMA foreign_keys = 1)', async () => {
    const db = await openDatabaseAsync(':memory:');
    await initializeDatabase(db as any);

    const row = await db.getFirstAsync<{ foreign_keys: number }>(
      'PRAGMA foreign_keys'
    );

    expect(row).not.toBeNull();
    expect(row?.foreign_keys).toBe(1);
  });
});
