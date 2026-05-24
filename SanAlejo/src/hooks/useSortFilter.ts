import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CriterioOrden, DireccionOrden } from '../db/contenedorRepository';

export interface SortFilterState {
  criterioOrden: CriterioOrden;
  direccionOrden: DireccionOrden;
  filtroUbicacion: string | null;
}

export const DEFAULT_SORT_FILTER: SortFilterState = {
  criterioOrden: 'nombre',
  direccionOrden: 'asc',
  filtroUbicacion: null,
};

export interface UseSortFilterReturn {
  state: SortFilterState;
  /** Selecciona un criterio; invierte la dirección si ya estaba activo. */
  setCriterio: (criterio: CriterioOrden) => void;
  setFiltroUbicacion: (ubicacion: string | null) => void;
  reset: () => void;
  /** true si el estado difiere de DEFAULT_SORT_FILTER */
  isNonDefault: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = 'sortFilter_v1';

const VALID_CRITERIOS: CriterioOrden[] = ['nombre', 'fecha_creacion', 'cantidad_objetos'];
const VALID_DIRECCIONES: DireccionOrden[] = ['asc', 'desc'];

function isValidState(value: unknown): value is SortFilterState {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    VALID_CRITERIOS.includes(obj.criterioOrden as CriterioOrden) &&
    VALID_DIRECCIONES.includes(obj.direccionOrden as DireccionOrden) &&
    (obj.filtroUbicacion === null || typeof obj.filtroUbicacion === 'string')
  );
}

function computeIsNonDefault(state: SortFilterState): boolean {
  return (
    state.criterioOrden !== DEFAULT_SORT_FILTER.criterioOrden ||
    state.direccionOrden !== DEFAULT_SORT_FILTER.direccionOrden ||
    state.filtroUbicacion !== DEFAULT_SORT_FILTER.filtroUbicacion
  );
}

export function useSortFilter(): UseSortFilterReturn {
  const [state, setState] = useState<SortFilterState>(DEFAULT_SORT_FILTER);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted state on mount
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw !== null) {
          try {
            const parsed = JSON.parse(raw);
            if (isValidState(parsed)) {
              setState(parsed);
            }
          } catch {
            // Invalid JSON — fall back to defaults (already set)
          }
        }
      })
      .catch(() => {
        // Read failure — fall back to defaults (already set)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist state whenever it changes (skip initial load)
  const persist = useCallback((newState: SortFilterState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {
      // Write failure — ignore silently; in-memory state remains correct
    });
  }, []);

  const setCriterio = useCallback((criterio: CriterioOrden) => {
    setState((prev) => {
      let newState: SortFilterState;
      if (criterio === prev.criterioOrden) {
        // Same criterion — toggle direction
        newState = {
          ...prev,
          direccionOrden: prev.direccionOrden === 'asc' ? 'desc' : 'asc',
        };
      } else {
        // Different criterion — set new criterion with 'asc'
        newState = {
          ...prev,
          criterioOrden: criterio,
          direccionOrden: 'asc',
        };
      }
      persist(newState);
      return newState;
    });
  }, [persist]);

  const setFiltroUbicacion = useCallback((ubicacion: string | null) => {
    setState((prev) => {
      const newState: SortFilterState = { ...prev, filtroUbicacion: ubicacion };
      persist(newState);
      return newState;
    });
  }, [persist]);

  const reset = useCallback(() => {
    setState(DEFAULT_SORT_FILTER);
    persist(DEFAULT_SORT_FILTER);
  }, [persist]);

  return {
    state,
    setCriterio,
    setFiltroUbicacion,
    reset,
    isNonDefault: computeIsNonDefault(state),
    isLoading,
  };
}
