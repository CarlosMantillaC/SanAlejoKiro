import { useState, useCallback } from 'react';
import { SQLiteDatabase } from 'expo-sqlite';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { collectInventoryData, buildHtml, buildFileName } from '../utils/exportService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseExportPdfResult {
  isExporting: boolean;
  exportError: string | null;
  handleExport: () => Promise<void>;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook that encapsulates the state and logic for the PDF export process.
 * Requirements: 4.1, 4.2, 5.1, 5.3, 5.4, 6.1, 6.2, 6.3
 */
export function useExportPdf(db: SQLiteDatabase): UseExportPdfResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setExportError(null);
  }, []);

  const handleExport = useCallback(async () => {
    // Requirement 4.1: show progress indicator
    setIsExporting(true);
    setExportError(null);

    // Track the URI for cleanup in finally block.
    // We use a mutable ref-like object so the finally block can always access
    // the most up-to-date URI regardless of which step succeeded.
    let printedUri: string | null = null;
    let finalUri: string | null = null;

    try {
      // Step 1: Collect inventory data — Requirement 6.1
      let data: Awaited<ReturnType<typeof collectInventoryData>>;
      try {
        data = await collectInventoryData(db);
      } catch {
        setExportError('No se pudieron obtener los datos del inventario.');
        return;
      }

      // Step 2: Build HTML — Requirement 6.2
      let html: string;
      try {
        html = await buildHtml(data);
      } catch {
        setExportError('No se pudo generar el PDF.');
        return;
      }

      // Step 3: Generate PDF file — Requirement 6.2, 6.3
      let printResult: { uri: string };
      try {
        printResult = await Print.printToFileAsync({ html });
        printedUri = printResult.uri;
      } catch {
        setExportError('No se pudo generar el PDF.');
        return;
      }

      // Step 4: Rename file with date-based name — Requirement 5.2
      const fileName = buildFileName(new Date());
      const destination = (FileSystem.cacheDirectory ?? '') + fileName;
      try {
        await FileSystem.moveAsync({ from: printedUri, to: destination });
        finalUri = destination;
      } catch {
        // If rename fails, fall back to the original URI from printToFileAsync
        finalUri = printedUri;
      }

      // Step 5: Check sharing availability — Requirement 5.4
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setExportError('No se pudo compartir el archivo en este dispositivo.');
        return;
      }

      // Step 6: Share the file — Requirement 5.1
      try {
        await Sharing.shareAsync(finalUri);
      } catch {
        setExportError('No se pudo compartir el archivo.');
      }
    } finally {
      // Requirement 5.3: always clean up the temporary file
      const uriToDelete = finalUri ?? printedUri;
      if (uriToDelete) {
        await FileSystem.deleteAsync(uriToDelete, { idempotent: true });
      }
      // Requirement 4.2: hide progress indicator
      setIsExporting(false);
    }
  }, [db]);

  return {
    isExporting,
    exportError,
    handleExport,
    clearError,
  };
}
