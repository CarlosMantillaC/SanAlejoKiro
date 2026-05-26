import * as FileSystem from 'expo-file-system';
import { buildFileName, readImageAsBase64 } from '../../src/utils/exportService';

// ─── buildFileName ────────────────────────────────────────────────────────────

describe('buildFileName', () => {
  it('formats a mid-year date correctly', () => {
    const date = new Date(2025, 6, 15); // July 15, 2025
    expect(buildFileName(date)).toBe('inventario-san-alejo-2025-07-15.pdf');
  });

  it('zero-pads month and day (January 5)', () => {
    const date = new Date(2025, 0, 5); // January 5, 2025
    expect(buildFileName(date)).toBe('inventario-san-alejo-2025-01-05.pdf');
  });

  it('handles start of year (January 1)', () => {
    const date = new Date(2024, 0, 1); // January 1, 2024
    expect(buildFileName(date)).toBe('inventario-san-alejo-2024-01-01.pdf');
  });

  it('handles end of year (December 31)', () => {
    const date = new Date(2024, 11, 31); // December 31, 2024
    expect(buildFileName(date)).toBe('inventario-san-alejo-2024-12-31.pdf');
  });

  it('uses 4-digit year', () => {
    const date = new Date(2000, 5, 10); // June 10, 2000
    expect(buildFileName(date)).toBe('inventario-san-alejo-2000-06-10.pdf');
  });
});

// ─── readImageAsBase64 ────────────────────────────────────────────────────────

describe('readImageAsBase64', () => {
  const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the base64 string when the file is readable', async () => {
    mockReadAsStringAsync.mockResolvedValueOnce('abc123base64==');
    const result = await readImageAsBase64('file:///some/image.jpg');
    expect(result).toBe('abc123base64==');
    expect(mockReadAsStringAsync).toHaveBeenCalledWith('file:///some/image.jpg', {
      encoding: 'base64',
    });
  });

  it('returns null when the file does not exist (readAsStringAsync throws)', async () => {
    mockReadAsStringAsync.mockRejectedValueOnce(new Error('File not found'));
    const result = await readImageAsBase64('file:///nonexistent/image.jpg');
    expect(result).toBeNull();
  });

  it('returns null when readAsStringAsync throws any error', async () => {
    mockReadAsStringAsync.mockRejectedValueOnce(new Error('Permission denied'));
    const result = await readImageAsBase64('file:///restricted/image.jpg');
    expect(result).toBeNull();
  });
});
