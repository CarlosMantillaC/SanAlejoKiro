/**
 * Property-based tests for validator utility.
 *
 * **Validates: Requirements 3.3, 5.3**
 */

// Feature: san-alejo-app, Property 3: Validación de campos obligatorios rechaza whitespace

import fc from 'fast-check';
import { validateFields } from '../../src/utils/validator';

// ---------------------------------------------------------------------------
// Property 3: Validación de campos obligatorios rechaza whitespace
// ---------------------------------------------------------------------------

describe('Property 3: Validación de campos obligatorios rechaza whitespace', () => {
  it('validateFields retorna valid: false y el campo en errors cuando el valor es solo whitespace', () => {
    // Feature: san-alejo-app, Property 3: Validación de campos obligatorios rechaza whitespace
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // field name
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 }).map(chars => chars.join('')), // whitespace-only value
        (fieldName, whitespaceValue) => {
          const result = validateFields({ [fieldName]: whitespaceValue });

          return result.valid === false && fieldName in result.errors;
        }
      ),
      { numRuns: 100 }
    );
  });
});
