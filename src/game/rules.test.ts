import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BREATH_PATTERNS,
  SACRED_STAGES,
  COLOR_PALETTES,
  BRUSH_STYLES,
  computeBreathState,
  computeSymmetryPoints,
  evaluateStrokeResonance,
  calculateStageCompletion,
  isStageUnlocked,
  isPaletteUnlocked,
  calculateMindfulStreak,
  project3DLayerTransform,
} from './rules';

test('SACRED_STAGES and COLOR_PALETTES contain 10 progressive levels and 6 brush styles', () => {
  assert.equal(SACRED_STAGES.length, 10);
  assert.equal(COLOR_PALETTES.length, 10);
  assert.equal(BRUSH_STYLES.length, 6);

  // Verify progressive symmetry folds and difficulty multipliers
  assert.equal(SACRED_STAGES[0].symmetryFold, 6);
  assert.equal(SACRED_STAGES[9].symmetryFold, 36);
  assert.ok(
    SACRED_STAGES[9].difficultyMultiplier > SACRED_STAGES[0].difficultyMultiplier
  );
});

test('computeBreathState transitions accurately across 4-4-4-4 Sama Vritti Box Breath phases', () => {
  const boxBreath = BREATH_PATTERNS[0];

  const sInhale = computeBreathState(boxBreath, 2.0);
  assert.equal(sInhale.phase, 'inhale');
  assert.ok(Math.abs(sInhale.phaseProgress - 0.5) < 0.001);

  const sHoldIn = computeBreathState(boxBreath, 5.5);
  assert.equal(sHoldIn.phase, 'holdIn');
  assert.equal(sHoldIn.expansionRadius, 1.0);

  const sExhale = computeBreathState(boxBreath, 10.0);
  assert.equal(sExhale.phase, 'exhale');

  const sHoldOut = computeBreathState(boxBreath, 14.0);
  assert.equal(sHoldOut.phase, 'holdOut');
  assert.equal(sHoldOut.expansionRadius, 0.28);
});

test('computeSymmetryPoints generates N*2 points when mirror symmetry is enabled', () => {
  const center = { x: 250, y: 250 };
  const point = { x: 350, y: 250 };

  const sixFoldMirrored = computeSymmetryPoints(point, center, 6, true);
  assert.equal(sixFoldMirrored.length, 12);

  const thirtySixFoldMirrored = computeSymmetryPoints(point, center, 36, true);
  assert.equal(thirtySixFoldMirrored.length, 72);
});

test('evaluateStrokeResonance computes scoreDelta, comboMultiplier, and MasteryRank', () => {
  const boxBreath = BREATH_PATTERNS[0];
  const inhaleState = computeBreathState(boxBreath, 1.5);
  const stage1Rings = SACRED_STAGES[0].guideRings;

  const alignedCalmResult = evaluateStrokeResonance({
    strokeRadiusNormalized: 0.48,
    radialDeltaNormalized: 0.04,
    strokeSpeedPxPerSec: 320,
    breathState: inhaleState,
    guideRings: stage1Rings,
    currentCombo: 4,
    stageDifficultyMultiplier: 2.0,
    brushBonusMultiplier: 1.2,
  });

  const erraticOffRingResult = evaluateStrokeResonance({
    strokeRadiusNormalized: 0.95,
    radialDeltaNormalized: -0.25,
    strokeSpeedPxPerSec: 2100,
    breathState: inhaleState,
    guideRings: stage1Rings,
    currentCombo: 0,
    stageDifficultyMultiplier: 1.0,
    brushBonusMultiplier: 1.0,
  });

  assert.ok(alignedCalmResult.resonanceGain > erraticOffRingResult.resonanceGain);
  assert.ok(alignedCalmResult.scoreDelta > erraticOffRingResult.scoreDelta * 2);
  assert.equal(alignedCalmResult.newCombo, 5);
  assert.ok(alignedCalmResult.comboMultiplier > 1.5);
  assert.equal(alignedCalmResult.masteryRank, 'S+ Samadhi');
});

test('project3DLayerTransform scales and offsets layers proportionally to Z depth and tilt', () => {
  const flat = project3DLayerTransform({
    zLayer: 3,
    maxLayers: 5,
    tiltX: 0.5,
    tiltY: -0.5,
    depthIntensity: 0,
    breathExpansion: 0.8,
  });
  assert.equal(flat.offsetX, 0);
  assert.equal(flat.layerScale, 1);

  const deep3d = project3DLayerTransform({
    zLayer: 4,
    maxLayers: 5,
    tiltX: 0.6,
    tiltY: -0.4,
    depthIntensity: 1.0,
    breathExpansion: 1.0,
  });
  assert.ok(deep3d.offsetX > 10);
  assert.ok(deep3d.offsetY < -5);
  assert.ok(deep3d.layerScale > 1.05);
});

test('calculateStageCompletion, unlock rules, and streak computation work accurately', () => {
  assert.equal(calculateStageCompletion(3, 6), 50);
  assert.equal(isStageUnlocked(SACRED_STAGES[0], 0, 0), true);
  assert.equal(isStageUnlocked(SACRED_STAGES[7], 2, 100), false);
  assert.equal(isStageUnlocked(SACRED_STAGES[7], 7, 100), true);
  assert.equal(isPaletteUnlocked(COLOR_PALETTES[9], 9, 1050), true);

  const dates = ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'];
  const streak = calculateMindfulStreak(dates, '2026-11-08');
  assert.equal(streak.currentStreak, 4);
});
