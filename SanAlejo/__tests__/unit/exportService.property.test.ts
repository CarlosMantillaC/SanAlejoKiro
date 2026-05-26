import * as fc from 'fast-check';
import { buildFileName } from '../../src/utils/exportService';

/**
 * Property 6: El nombre de archivo siempre sigue el formato correcto
 *
 * Para cualquier objeto Date válido, buildFileName debe devolver un string
 * que coincida con el patrón inventario-san-alejo-YYYY-MM-DD.pdf, donde
 * YYYY, MM y DD corresponden al año, mes y día de la fecha proporcionada.
 *
 * Validates: Requirements 5.2
 */
describe('exportService — property tests', () => {
  describe('Property 6: buildFileName always follows the correct format', () => {
    it('returns a string matching inventario-san-alejo-YYYY-MM-DD.pdf for any valid Date', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary valid dates (year 1970–2099, any month/day)
          fc.date({ min: new Date(1970, 0, 1), max: new Date(2099, 11, 31) }),
          (date) => {
            const result = buildFileName(date);

            // Must match the overall pattern
            const pattern = /^inventario-san-alejo-\d{4}-\d{2}-\d{2}\.pdf$/;
            if (!pattern.test(result)) return false;

            // Extract the date parts from the filename
            const match = result.match(
              /^inventario-san-alejo-(\d{4})-(\d{2})-(\d{2})\.pdf$/
            );
            if (!match) return false;

            const [, yearStr, monthStr, dayStr] = match;
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10);
            const day = parseInt(dayStr, 10);

            // Verify the extracted values match the input date
            return (
              year === date.getFullYear() &&
              month === date.getMonth() + 1 &&
              day === date.getDate()
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
