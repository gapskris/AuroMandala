import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveGameCache,
  loadGameCache,
  clearGameCache,
  getGameCacheStats,
  PersistedGameState,
} from './storage';

test('saveGameCache, loadGameCache, and getGameCacheStats persist and restore full game state', () => {
  clearGameCache();
  assert.equal(loadGameCache(), null);

  const sampleState: PersistedGameState = {
    version: 2,
    updatedAtISO: '2026-11-08T01:00:00.000Z',
    locale: 'en',
    isDark: true,
    lowPowerMode: false,
    depth3DIntensity: 0.85,
    rainbowCycleMode: true,
    currentStageId: 6,
    highestStageCleared: 6,
    selectedPaletteId: 'suvarna-fibonacci',
    selectedColor: '#FBBF24',
    selectedBrushStyle: 'ribbon3d',
    brushSize: 4,
    breathPatternId: 'sama-vritti',
    totalScore: 18450,
    bestStageScore: 6200,
    resonance: 420,
    harmonyPercent: 96,
    sankalpa: 'Harmonize breath and sacred proportion',
    sessions: [],
    cachedCanvasStrokes: [
      {
        points: [
          { x: 0.1, y: 0.1 },
          { x: 0.2, y: 0.25 },
        ],
        color: '#FBBF24',
        glowColor: 'rgba(251, 191, 36, 0.48)',
        baseWidth: 4,
        brushStyle: 'ribbon3d',
        symmetryFold: 20,
        mirror: true,
        zLayer: 2,
        breathExpansionAtDraw: 0.75,
      },
    ],
  };

  const writeResult = saveGameCache(sampleState);
  assert.ok(writeResult.bytesWritten > 100);

  const loaded = loadGameCache();
  assert.ok(loaded);
  assert.equal(loaded.currentStageId, 6);
  assert.equal(loaded.totalScore, 18450);
  assert.equal(loaded.selectedBrushStyle, 'ribbon3d');
  assert.equal(loaded.cachedCanvasStrokes.length, 1);

  const stats = getGameCacheStats();
  assert.equal(stats.hasCache, true);
  assert.equal(stats.cachedStrokesCount, 1);

  clearGameCache();
  assert.equal(getGameCacheStats().hasCache, false);
});
