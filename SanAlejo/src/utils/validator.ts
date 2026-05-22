export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Verifica que todos los campos requeridos tengan contenido no vacío
 * y no compuesto únicamente de espacios en blanco.
 */
export function validateFields(
  fields: Record<string, string>
): ValidationResult {
  // Use a null-prototype object so prototype keys like __proto__ are safe
  const errors: Record<string, string> = Object.create(null);

  for (const [key, value] of Object.entries(fields)) {
    if (value.trim().length === 0) {
      errors[key] = `El campo "${key}" es obligatorio.`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
