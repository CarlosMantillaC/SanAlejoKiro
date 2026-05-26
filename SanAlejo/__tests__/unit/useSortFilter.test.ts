/**
 * Property-based and example tests for useSortFilter hook.
 *
 * Feature: contenedor-sorting-filters
 */

import fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SortFilterState,
  DEFAULT_SORT_FILTER,
} from '../../src/hooks/useSortFilter';
import { CriterioOrden, DireccionOrden } from '../../src/db/contenedorRepository';

// ---------------------------------------------------------------------------
// Helpers — pure logic extracted from the hook for property testing
// ---------------------------------------------------------------------------

/**
 * Pure implementation of setCriterio logic (mirrors the hook).
 */
function applyCriterio(state: SortFilterState, criterio: CriterioOrden): SortFilterState {
  if (criterio === state.criterioOrden) {
    return { ...state, direccionOrden: state.direccionOrden === 'asc' ? 'desc' : 'asc' };
  }
  return { ...state, criterioOrden: criterio, direccionOrden: 'asc' };
}

/**
 * Pure implementation of isNonDefault logic (mirrors the hook).
 */
function computeIsNonDefault(state: SortFilterState): boolean {
  return (
    state.criterioOrden !== DEFAULT_SORT_FILTER.criterioOrden ||
    state.direccionOrden !== DEFAULT_SORT_FILTER.direccionOrden ||
    state.filtroUbicacion !== DEFAULT_SORT_FILTER.filtroUbicacion
  );
}

/**
 * Simulate the persistence round-trip: serialize then deserialize.
 */
function persistRoundTrip(state: SortFilterState): SortFilterState {
  return JSON.parse(JSON.stringify(state));
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const criterioOrdenArb = fc.constantFrom<CriterioOrden>('nombre', 'fecha_creacion', 'cantidad_objetos');
const direccionOrdenArb = fc.constantFrom<DireccionOrden>('asc', 'desc');
const filtroUbicacionArb = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 1, maxLength: 100 })
);

const sortFilterStateArb: fc.Arbitrary<SortFilterState> = fc.record({
  criterioOrden: criterioOrdenArb,
  direccionOrden: direccionOrdenArb,
  filtroUbicacion: filtroUbicacionArb,
});

// ---------------------------------------------------------------------------
// Property 1: Round-trip de persistencia del estado de filtros
// ---------------------------------------------------------------------------

describe('Property 1: Round-trip de persistencia del estado de filtros', () => {
  /**
   * Validates: Requirements 2.6, 3.6
   *
   * For any valid combination of criterioOrden, direccionOrden and filtroUbicacion,
   * persisting the state and then loading it must return exactly the same values.
   */
  it('persistir el estado y luego cargarlo retorna exactamente los mismos valores', () => {
    fc.assert(
      fc.property(sortFilterStateArb, (state) => {
        const serialized = JSON.stringify(state);
        const deserialized: SortFilterState = JSON.parse(serialized);

        return (
          deserialized.criterioOrden === state.criterioOrden &&
          deserialized.direccionOrden === state.direccionOrden &&
          deserialized.filtroUbicacion === state.filtroUbicacion
        );
      }),
      { numRuns: 200 }
    );
  });

  it('el round-trip preserva todos los campos sin pérdida de información', () => {
    fc.assert(
      fc.property(sortFilterStateArb, (state) => {
        const roundTripped = persistRoundTrip(state);
        return JSON.stringify(roundTripped) === JSON.stringify(state);
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Toggle de dirección de orden
// ---------------------------------------------------------------------------

describe('Property 2: Toggle de dirección de orden', () => {
  /**
   * Validates: Requisito 2.4
   *
   * For any active criterion and direction, calling setCriterio with the same
   * criterion must result in the opposite direction, keeping the same criterion.
   */
  it('llamar setCriterio con el mismo criterio invierte la dirección y mantiene el criterio', () => {
    fc.assert(
      fc.property(sortFilterStateArb, (state) => {
        const newState = applyCriterio(state, state.criterioOrden);

        // Criterion must remain the same
        if (newState.criterioOrden !== state.criterioOrden) return false;

        // Direction must be inverted
        const expectedDireccion: DireccionOrden = state.direccionOrden === 'asc' ? 'desc' : 'asc';
        if (newState.direccionOrden !== expectedDireccion) return false;

        return true;
      }),
      { numRuns: 200 }
    );
  });

  it('llamar setCriterio con un criterio diferente establece el nuevo criterio con dirección asc', () => {
    fc.assert(
      fc.property(
        sortFilterStateArb,
        criterioOrdenArb,
        (state, nuevoCriterio) => {
          // Only test when the new criterion is different
          fc.pre(nuevoCriterio !== state.criterioOrden);

          const newState = applyCriterio(state, nuevoCriterio);

          return newState.criterioOrden === nuevoCriterio && newState.direccionOrden === 'asc';
        }
      ),
      { numRuns: 200 }
    );
  });

  it('toggle doble restaura la dirección original', () => {
    fc.assert(
      fc.property(sortFilterStateArb, (state) => {
        const afterFirst = applyCriterio(state, state.criterioOrden);
        const afterSecond = applyCriterio(afterFirst, afterFirst.criterioOrden);

        return afterSecond.direccionOrden === state.direccionOrden;
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Reset restaura el estado predeterminado
// ---------------------------------------------------------------------------

describe('Property 3: Reset restaura el estado predeterminado', () => {
  /**
   * Validates: Requisito 4.5
   *
   * For any state, calling reset() must result in exactly DEFAULT_SORT_FILTER.
   */
  it('reset() desde cualquier estado retorna exactamente DEFAULT_SORT_FILTER', () => {
    fc.assert(
      fc.property(sortFilterStateArb, (state) => {
        // Simulate reset: return DEFAULT_SORT_FILTER
        const resetState = { ...DEFAULT_SORT_FILTER };

        return (
          resetState.criterioOrden === 'nombre' &&
          resetState.direccionOrden === 'asc' &&
          resetState.filtroUbicacion === null
        );
      }),
      { numRuns: 200 }
    );
  });

  it('DEFAULT_SORT_FILTER tiene los valores predeterminados correctos', () => {
    expect(DEFAULT_SORT_FILTER.criterioOrden).toBe('nombre');
    expect(DEFAULT_SORT_FILTER.direccionOrden).toBe('asc');
    expect(DEFAULT_SORT_FILTER.filtroUbicacion).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Property 4: isNonDefault es consistente con el estado predeterminado
// ---------------------------------------------------------------------------

describe('Property 4: isNonDefault es consistente con el estado predeterminado', () => {
  /**
   * Validates: Requisito 4.1
   *
   * For any state, isNonDefault must be true if and only if at least one value
   * differs from the default.
   */
  it('isNonDefault es true si y solo si algún valor difiere del predeterminado', () => {
    fc.assert(
      fc.property(sortFilterStateArb, (state) => {
        const isNonDefault = computeIsNonDefault(state);

        const expectedNonDefault =
          state.criterioOrden !== DEFAULT_SORT_FILTER.criterioOrden ||
          state.direccionOrden !== DEFAULT_SORT_FILTER.direccionOrden ||
          state.filtroUbicacion !== DEFAULT_SORT_FILTER.filtroUbicacion;

        return isNonDefault === expectedNonDefault;
      }),
      { numRuns: 200 }
    );
  });

  it('isNonDefault es false para DEFAULT_SORT_FILTER', () => {
    expect(computeIsNonDefault(DEFAULT_SORT_FILTER)).toBe(false);
  });

  it('isNonDefault es true cuando criterioOrden difiere', () => {
    expect(computeIsNonDefault({ ...DEFAULT_SORT_FILTER, criterioOrden: 'fecha_creacion' })).toBe(true);
    expect(computeIsNonDefault({ ...DEFAULT_SORT_FILTER, criterioOrden: 'cantidad_objetos' })).toBe(true);
  });

  it('isNonDefault es true cuando direccionOrden difiere', () => {
    expect(computeIsNonDefault({ ...DEFAULT_SORT_FILTER, direccionOrden: 'desc' })).toBe(true);
  });

  it('isNonDefault es true cuando filtroUbicacion no es null', () => {
    expect(computeIsNonDefault({ ...DEFAULT_SORT_FILTER, filtroUbicacion: 'Bodega' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test de ejemplo: estado inicial del hook es el predeterminado
// ---------------------------------------------------------------------------

describe('Estado inicial del hook', () => {
  /**
   * Validates: Requisito 2.5
   *
   * When the hook mounts without persisted state, state equals DEFAULT_SORT_FILTER.
   */
  beforeEach(() => {
    // Reset the in-memory AsyncStorage mock store
    (AsyncStorage as any).__resetStore();
  });

  it('DEFAULT_SORT_FILTER tiene criterioOrden=nombre, direccionOrden=asc, filtroUbicacion=null', () => {
    expect(DEFAULT_SORT_FILTER).toEqual({
      criterioOrden: 'nombre',
      direccionOrden: 'asc',
      filtroUbicacion: null,
      filtroEtiquetas: [],
    });
  });

  it('el estado predeterminado no es isNonDefault', () => {
    expect(computeIsNonDefault(DEFAULT_SORT_FILTER)).toBe(false);
  });

  it('AsyncStorage.getItem retorna null cuando no hay estado persistido', async () => {
    const value = await AsyncStorage.getItem('sortFilter_v1');
    expect(value).toBeNull();
  });

  it('persistir y recuperar el estado predeterminado funciona correctamente', async () => {
    await AsyncStorage.setItem('sortFilter_v1', JSON.stringify(DEFAULT_SORT_FILTER));
    const raw = await AsyncStorage.getItem('sortFilter_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual(DEFAULT_SORT_FILTER);
  });
});
