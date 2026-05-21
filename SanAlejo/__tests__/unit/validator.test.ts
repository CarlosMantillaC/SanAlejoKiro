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

// ---------------------------------------------------------------------------
// Unit tests for validateFields
// Requirements: 3.3, 3.4, 5.3, 5.4
// ---------------------------------------------------------------------------

describe('validateFields — unit tests', () => {
  // Caso: todos los campos válidos → valid: true, errors vacío
  it('retorna valid: true y errors vacío cuando todos los campos tienen contenido válido', () => {
    const result = validateFields({
      nombre: 'Caja de herramientas',
      descripcion: 'Herramientas de carpintería',
      ubicacion: 'Garaje',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('retorna valid: true con un único campo válido', () => {
    const result = validateFields({ nombre: 'Maleta azul' });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  // Caso: un campo vacío → valid: false, error solo para ese campo
  it('retorna valid: false con error solo para el campo vacío cuando un campo está vacío', () => {
    const result = validateFields({
      nombre: '',
      descripcion: 'Descripción válida',
      ubicacion: 'Sala',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('nombre');
    expect(result.errors['nombre']).toBe('El campo "nombre" es obligatorio.');
    expect(result.errors).not.toHaveProperty('descripcion');
    expect(result.errors).not.toHaveProperty('ubicacion');
  });

  it('retorna valid: false con error solo para el campo vacío cuando otro campo está vacío', () => {
    const result = validateFields({
      nombre: 'Nombre válido',
      descripcion: '',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('descripcion');
    expect(result.errors['descripcion']).toBe('El campo "descripcion" es obligatorio.');
    expect(result.errors).not.toHaveProperty('nombre');
  });

  // Caso: múltiples campos vacíos → valid: false, error para cada campo vacío
  it('retorna valid: false con error para cada campo vacío cuando múltiples campos están vacíos', () => {
    const result = validateFields({
      nombre: '',
      descripcion: '',
      ubicacion: 'Bodega',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('nombre');
    expect(result.errors).toHaveProperty('descripcion');
    expect(result.errors).not.toHaveProperty('ubicacion');
    expect(Object.keys(result.errors)).toHaveLength(2);
  });

  it('retorna valid: false con error para todos los campos cuando todos están vacíos', () => {
    const result = validateFields({
      nombre: '',
      descripcion: '',
      ubicacion: '',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('nombre');
    expect(result.errors).toHaveProperty('descripcion');
    expect(result.errors).toHaveProperty('ubicacion');
    expect(Object.keys(result.errors)).toHaveLength(3);
  });

  // Mensaje de error con el nombre correcto del campo
  it('incluye el nombre del campo en el mensaje de error', () => {
    const result = validateFields({ ubicacion: '' });

    expect(result.errors['ubicacion']).toBe('El campo "ubicacion" es obligatorio.');
  });

  // Campos con solo espacios también son inválidos (complementa Property 3)
  it('retorna valid: false para un campo con solo espacios', () => {
    const result = validateFields({ nombre: '   ' });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('nombre');
  });

  // Objeto vacío (sin campos) → válido por defecto
  it('retorna valid: true cuando no se pasan campos', () => {
    const result = validateFields({});

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });
});
