/**
 * Persistent Game Cache & Storage Manager for PranaMandala.
 * Synchronizes player progress, scores, unlocked stages/palettes, active canvas strokes,
 * saved artworks, and settings to localStorage (and memory fallback for headless/Node tests).
 */

import { BrushStyleId, Point2D, SessionRecord } from '../game/rules';
import { SupportedLocale } from '../i18n/translations';

export interface CachedStrokeRecord {
  points: Point2D[];
  color: string;
  paletteColors?: string[];
  glowColor: string;
  baseWidth: number;
  brushStyle: BrushStyleId;
  symmetryFold: number;
  mirror: boolean;
  zLayer: number;
  breathExpansionAtDraw: number;
}

export interface PersistedGameState {
  version: number;
  updatedAtISO: string;
  locale: SupportedLocale;
  isDark: boolean;
  lowPowerMode: boolean;
  depth3DIntensity: number; // 0.0 to 1.0
  rainbowCycleMode: boolean;
  currentStageId: number;
  highestStageCleared: number;
  selectedPaletteId: string;
  selectedColor: string;
  selectedBrushStyle: BrushStyleId;
  brushSize: number;
  breathPatternId: string;
  totalScore: number;
  bestStageScore: number;
  resonance: number;
  harmonyPercent: number;
  sankalpa: string;
  sessions: SessionRecord[];
  cachedCanvasStrokes: CachedStrokeRecord[];
}

export const STORAGE_KEY = 'pranamandala_game_cache_v2';

const memoryStore = new Map<string, string>();

function getBackingStore(): {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
} {
  if (
    typeof globalThis !== 'undefined' &&
    'localStorage' in globalThis &&
    globalThis.localStorage
  ) {
    return globalThis.localStorage;
  }
  return {
    getItem: (k) => memoryStore.get(k) ?? null,
    setItem: (k, v) => memoryStore.set(k, v),
    removeItem: (k) => memoryStore.delete(k),
  };
}

export function saveGameCache(state: PersistedGameState): {
  bytesWritten: number;
  timestampISO: string;
} {
  const store = getBackingStore();
  const payload: PersistedGameState = {
    ...state,
    version: 2,
    updatedAtISO: new Date().toISOString(),
  };
  const serialized = JSON.stringify(payload);
  try {
    store.setItem(STORAGE_KEY, serialized);
  } catch {
    // If quota is exceeded by large stroke arrays, trim older strokes and retry
    const trimmed: PersistedGameState = {
      ...payload,
      cachedCanvasStrokes: payload.cachedCanvasStrokes.slice(-30),
    };
    store.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
  return {
    bytesWritten: serialized.length,
    timestampISO: payload.updatedAtISO,
  };
}

export function loadGameCache(): PersistedGameState | null {
  const store = getBackingStore();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGameState;
    if (!parsed || typeof parsed.version !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGameCache(): void {
  const store = getBackingStore();
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function getGameCacheStats(): {
  hasCache: boolean;
  sizeBytes: number;
  sizeKB: string;
  cachedStrokesCount: number;
  sessionsCount: number;
  updatedAtISO: string | null;
} {
  const store = getBackingStore();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        hasCache: false,
        sizeBytes: 0,
        sizeKB: '0.0 KB',
        cachedStrokesCount: 0,
        sessionsCount: 0,
        updatedAtISO: null,
      };
    }
    const parsed = JSON.parse(raw) as PersistedGameState;
    const bytes = raw.length;
    return {
      hasCache: true,
      sizeBytes: bytes,
      sizeKB: `${(bytes / 1024).toFixed(1)} KB`,
      cachedStrokesCount: Array.isArray(parsed.cachedCanvasStrokes)
        ? parsed.cachedCanvasStrokes.length
        : 0,
      sessionsCount: Array.isArray(parsed.sessions) ? parsed.sessions.length : 0,
      updatedAtISO: parsed.updatedAtISO ?? null,
    };
  } catch {
    return {
      hasCache: false,
      sizeBytes: 0,
      sizeKB: '0.0 KB',
      cachedStrokesCount: 0,
      sessionsCount: 0,
      updatedAtISO: null,
    };
  }
}
