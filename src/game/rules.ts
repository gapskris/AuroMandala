/**
 * Pure domain logic for PranaMandala: Sacred Geometry & Mindful Breath.
 * Includes 10 progressive Sacred Geometry stages, 10 colorful palettes,
 * 6 3D/artistic brush styles, multi-factor scoring & combo multipliers,
 * and 3D depth projection math.
 */

export type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export type BrushStyleId =
  | 'ribbon3d'
  | 'filament'
  | 'crystalline'
  | 'lotus-pearl'
  | 'nebula-aurora'
  | 'calligraphy-gold'
  | 'folk-petal'
  | 'paisley-swirl';

export interface BrushStyleSpec {
  id: BrushStyleId;
  nameKey: string;
  description: string;
  depthMultiplier: number;
  scoreBonusMultiplier: number;
}

export type GeometryArchetype =
  | 'vesica'
  | 'seed'
  | 'lotus'
  | 'flower'
  | 'sri-yantra'
  | 'fibonacci'
  | 'torus3d'
  | 'dodecahedron3d'
  | 'kalachakra'
  | 'sahasrara3d'
  | 'folk-rosette'
  | 'folk-tulip'
  | 'folk-paisley'
  | 'folk-daisy'
  | 'folk-masterpiece';

export interface BreathPattern {
  id: string;
  nameKey: string;
  subtitleKey: string;
  inhaleSec: number;
  holdInSec: number;
  exhaleSec: number;
  holdOutSec: number;
  hapticPattern: Record<BreathPhase, number[]>;
  baseFrequencyHz: number;
}

export interface SacredStage {
  id: number;
  slug: string;
  nameKey: string;
  sanskritName: string;
  archetype: GeometryArchetype;
  symmetryFold: number;
  mirrorSymmetry: boolean;
  guideRings: number[]; // Normalized radii (0.1 to 0.95)
  petalsPerRing: number;
  targetStrokes: number;
  minResonanceToUnlock: number;
  difficultyMultiplier: number;
  spiritualTeachingKey: string;
  geometryPrincipleKey: string;
  unlockedPaletteId: string;
}

export interface ColorPalette {
  id: string;
  nameKey: string;
  chakraName: string;
  spiritualStateKey: string;
  requiredStageId: number;
  colors: string[];
  glowColor: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface SymmetryPoint extends Point2D {
  foldIndex: number;
  isMirrored: boolean;
}

export interface BreathStateSnapshot {
  phase: BreathPhase;
  phaseProgress: number; // 0.0 to 1.0 within current phase
  expansionRadius: number; // 0.25 (fully exhaled) to 1.0 (fully inhaled)
  cycleTimeSec: number;
  remainingPhaseSec: number;
  idealStrokeSpeedNormalized: number;
}

export type MasteryRank = 'S+ Samadhi' | 'S Siddha' | 'A+ Dhyana' | 'A Dharana' | 'B Pratyahara';

export interface ScoreEvaluation {
  resonanceGain: number;
  scoreDelta: number;
  newCombo: number;
  comboMultiplier: number;
  harmonyAccuracy: number;
  ringAlignedIndex: number;
  masteryRank: MasteryRank;
}

export interface SessionRecord {
  id: string;
  dateISO: string; // YYYY-MM-DD
  stageId: number;
  durationSec: number;
  resonanceScore: number;
  totalScore?: number;
  harmonyPercent: number;
  strokesCount: number;
  breathCyclesCompleted: number;
  paletteUsed: string;
}

export const BRUSH_STYLES: BrushStyleSpec[] = [
  {
    id: 'ribbon3d',
    nameKey: 'brush.ribbon3d',
    description: '3D Extruded Silk Ribbon with specular ridge and elevation shadow',
    depthMultiplier: 1.35,
    scoreBonusMultiplier: 1.15,
  },
  {
    id: 'crystalline',
    nameKey: 'brush.crystalline',
    description: '3D Faceted Prism Geometry with diamond bevel highlights',
    depthMultiplier: 1.45,
    scoreBonusMultiplier: 1.2,
  },
  {
    id: 'lotus-pearl',
    nameKey: 'brush.lotusPearl',
    description: '3D Iridescent Spheres with radial 3D shading along symmetry axes',
    depthMultiplier: 1.3,
    scoreBonusMultiplier: 1.15,
  },
  {
    id: 'nebula-aurora',
    nameKey: 'brush.nebulaAurora',
    description: 'Prismatic Multi-Color Aurora cycling dynamically through palette hues',
    depthMultiplier: 1.25,
    scoreBonusMultiplier: 1.1,
  },
  {
    id: 'calligraphy-gold',
    nameKey: 'brush.calligraphyGold',
    description: 'Sacred Chisel Foil with angle-reactive metallic width and rim light',
    depthMultiplier: 1.2,
    scoreBonusMultiplier: 1.1,
  },
  {
    id: 'filament',
    nameKey: 'brush.filament',
    description: 'Pure Luminous Prana Filament for fine geometric precision',
    depthMultiplier: 1.0,
    scoreBonusMultiplier: 1.0,
  },
  {
    id: 'folk-petal',
    nameKey: 'brush.folkPetal',
    description: 'Folk Botanical Petal with teardrop contour and breath-reactive curvature',
    depthMultiplier: 1.3,
    scoreBonusMultiplier: 1.25,
  },
  {
    id: 'paisley-swirl',
    nameKey: 'brush.paisleySwirl',
    description: 'Royal Paisley & Goblet Ribbon with angle-sensitive flourish and gold trim',
    depthMultiplier: 1.35,
    scoreBonusMultiplier: 1.25,
  },
];

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'sama-vritti',
    nameKey: 'breath.samaVritti.name',
    subtitleKey: 'breath.samaVritti.subtitle',
    inhaleSec: 4,
    holdInSec: 4,
    exhaleSec: 4,
    holdOutSec: 4,
    hapticPattern: {
      inhale: [40, 80, 60],
      holdIn: [25],
      exhale: [60, 90, 30],
      holdOut: [20],
    },
    baseFrequencyHz: 432,
  },
  {
    id: 'prana-relax',
    nameKey: 'breath.pranaRelax.name',
    subtitleKey: 'breath.pranaRelax.subtitle',
    inhaleSec: 4,
    holdInSec: 7,
    exhaleSec: 8,
    holdOutSec: 0,
    hapticPattern: {
      inhale: [50, 70, 50],
      holdIn: [30, 120, 30],
      exhale: [80, 100, 40, 100, 20],
      holdOut: [],
    },
    baseFrequencyHz: 528,
  },
  {
    id: 'coherent-flow',
    nameKey: 'breath.coherentFlow.name',
    subtitleKey: 'breath.coherentFlow.subtitle',
    inhaleSec: 5,
    holdInSec: 0,
    exhaleSec: 5,
    holdOutSec: 0,
    hapticPattern: {
      inhale: [45, 90, 45],
      holdIn: [],
      exhale: [45, 90, 45],
      holdOut: [],
    },
    baseFrequencyHz: 639,
  },
  {
    id: 'turiya-ascension',
    nameKey: 'breath.turiyaAscension.name',
    subtitleKey: 'breath.turiyaAscension.subtitle',
    inhaleSec: 6,
    holdInSec: 6,
    exhaleSec: 6,
    holdOutSec: 3,
    hapticPattern: {
      inhale: [50, 80, 50, 80],
      holdIn: [35, 90, 35],
      exhale: [70, 90, 50],
      holdOut: [25],
    },
    baseFrequencyHz: 741,
  },
];

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'folk-terracotta-jewel',
    nameKey: 'palette.folkTerracotta.name',
    chakraName: 'Muladhara · Anahata Folk Fusion',
    spiritualStateKey: 'palette.folkTerracotta.state',
    requiredStageId: 1,
    colors: ['#D35933', '#F4B341', '#45A59E', '#226888', '#13384D', '#FDF2D6'],
    glowColor: 'rgba(211, 89, 51, 0.48)',
  },
  {
    id: 'saffron-bindu',
    nameKey: 'palette.saffronBindu.name',
    chakraName: 'Muladhara · Svadhisthana',
    spiritualStateKey: 'palette.saffronBindu.state',
    requiredStageId: 1,
    colors: ['#F59E0B', '#FB923C', '#FBBF24', '#F43F5E', '#38BDF8', '#FDE68A'],
    glowColor: 'rgba(245, 158, 11, 0.45)',
  },
  {
    id: 'lotus-anahata',
    nameKey: 'palette.lotusAnahata.name',
    chakraName: 'Anahata Heart',
    spiritualStateKey: 'palette.lotusAnahata.state',
    requiredStageId: 2,
    colors: ['#10B981', '#34D399', '#14B8A6', '#F59E0B', '#EC4899', '#A7F3D0'],
    glowColor: 'rgba(16, 185, 129, 0.45)',
  },
  {
    id: 'pranic-vishuddha',
    nameKey: 'palette.pranicVishuddha.name',
    chakraName: 'Vishuddha Ether',
    spiritualStateKey: 'palette.pranicVishuddha.state',
    requiredStageId: 3,
    colors: ['#0EA5E9', '#38BDF8', '#818CF8', '#2DD4BF', '#F472B6', '#BAE6FD'],
    glowColor: 'rgba(14, 165, 233, 0.45)',
  },
  {
    id: 'solar-manipura',
    nameKey: 'palette.solarManipura.name',
    chakraName: 'Surya · Manipura',
    spiritualStateKey: 'palette.solarManipura.state',
    requiredStageId: 4,
    colors: ['#EAB308', '#F43F5E', '#FB923C', '#A855F7', '#22D3EE', '#FEF08A'],
    glowColor: 'rgba(234, 179, 8, 0.45)',
  },
  {
    id: 'cosmic-sahasrara',
    nameKey: 'palette.cosmicSahasrara.name',
    chakraName: 'Ajna · Sahasrara',
    spiritualStateKey: 'palette.cosmicSahasrara.state',
    requiredStageId: 5,
    colors: ['#A855F7', '#EC4899', '#6366F1', '#2DD4BF', '#FBBF24', '#E9D5FF'],
    glowColor: 'rgba(168, 85, 247, 0.45)',
  },
  {
    id: 'suvarna-fibonacci',
    nameKey: 'palette.suvarnaFibonacci.name',
    chakraName: 'Hiranyagarbha Golden Womb',
    spiritualStateKey: 'palette.suvarnaFibonacci.state',
    requiredStageId: 6,
    colors: ['#FBBF24', '#10B981', '#F97316', '#38BDF8', '#E879F9', '#FEF3C7'],
    glowColor: 'rgba(251, 191, 36, 0.48)',
  },
  {
    id: 'turiya-aurora',
    nameKey: 'palette.turiyaAurora.name',
    chakraName: 'Turiya Fourth Dimension',
    spiritualStateKey: 'palette.turiyaAurora.state',
    requiredStageId: 7,
    colors: ['#2DD4BF', '#818CF8', '#F472B6', '#FBBF24', '#34D399', '#C4B5FD'],
    glowColor: 'rgba(45, 212, 191, 0.48)',
  },
  {
    id: 'akasha-prism',
    nameKey: 'palette.akashaPrism.name',
    chakraName: 'Akasha Crystalline Lattice',
    spiritualStateKey: 'palette.akashaPrism.state',
    requiredStageId: 8,
    colors: ['#38BDF8', '#C084FC', '#FB7185', '#FACC15', '#4ADE80', '#E0F2FE'],
    glowColor: 'rgba(56, 189, 248, 0.48)',
  },
  {
    id: 'kalachakra-nectar',
    nameKey: 'palette.kalachakraNectar.name',
    chakraName: 'Kalachakra Temporal Mandala',
    spiritualStateKey: 'palette.kalachakraNectar.state',
    requiredStageId: 9,
    colors: ['#F43F5E', '#F59E0B', '#10B981', '#0EA5E9', '#A855F7', '#FFE4E6'],
    glowColor: 'rgba(244, 63, 94, 0.48)',
  },
  {
    id: 'nirvana-rainbow',
    nameKey: 'palette.nirvanaRainbow.name',
    chakraName: 'Vajra Rainbow Body',
    spiritualStateKey: 'palette.nirvanaRainbow.state',
    requiredStageId: 10,
    colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#B983FF', '#FF9F45'],
    glowColor: 'rgba(255, 217, 61, 0.5)',
  },
];

export const SACRED_STAGES: SacredStage[] = [
  {
    id: 1,
    slug: 'bindu-vesica',
    nameKey: 'stage.1.name',
    sanskritName: 'Bindu & Vesica Piscis',
    archetype: 'vesica',
    symmetryFold: 6,
    mirrorSymmetry: true,
    guideRings: [0.22, 0.48, 0.72],
    petalsPerRing: 6,
    targetStrokes: 6,
    minResonanceToUnlock: 0,
    difficultyMultiplier: 1.0,
    spiritualTeachingKey: 'stage.1.teaching',
    geometryPrincipleKey: 'stage.1.geometry',
    unlockedPaletteId: 'saffron-bindu',
  },
  {
    id: 2,
    slug: 'seed-of-life',
    nameKey: 'stage.2.name',
    sanskritName: 'Bija · Seed of Life',
    archetype: 'seed',
    symmetryFold: 8,
    mirrorSymmetry: true,
    guideRings: [0.2, 0.42, 0.64, 0.82],
    petalsPerRing: 8,
    targetStrokes: 8,
    minResonanceToUnlock: 50,
    difficultyMultiplier: 1.2,
    spiritualTeachingKey: 'stage.2.teaching',
    geometryPrincipleKey: 'stage.2.geometry',
    unlockedPaletteId: 'lotus-anahata',
  },
  {
    id: 3,
    slug: 'anahata-lotus',
    nameKey: 'stage.3.name',
    sanskritName: 'Anahata · Twelve-Petal Lotus',
    archetype: 'lotus',
    symmetryFold: 12,
    mirrorSymmetry: true,
    guideRings: [0.18, 0.36, 0.56, 0.75, 0.88],
    petalsPerRing: 12,
    targetStrokes: 10,
    minResonanceToUnlock: 110,
    difficultyMultiplier: 1.4,
    spiritualTeachingKey: 'stage.3.teaching',
    geometryPrincipleKey: 'stage.3.geometry',
    unlockedPaletteId: 'pranic-vishuddha',
  },
  {
    id: 4,
    slug: 'flower-of-life',
    nameKey: 'stage.4.name',
    sanskritName: 'Prana Matrix · Flower of Life',
    archetype: 'flower',
    symmetryFold: 16,
    mirrorSymmetry: true,
    guideRings: [0.16, 0.32, 0.48, 0.64, 0.8, 0.92],
    petalsPerRing: 16,
    targetStrokes: 12,
    minResonanceToUnlock: 190,
    difficultyMultiplier: 1.65,
    spiritualTeachingKey: 'stage.4.teaching',
    geometryPrincipleKey: 'stage.4.geometry',
    unlockedPaletteId: 'solar-manipura',
  },
  {
    id: 5,
    slug: 'sri-yantra-star',
    nameKey: 'stage.5.name',
    sanskritName: 'Sri Yantra & Metatron Star',
    archetype: 'sri-yantra',
    symmetryFold: 24,
    mirrorSymmetry: true,
    guideRings: [0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 0.94],
    petalsPerRing: 24,
    targetStrokes: 14,
    minResonanceToUnlock: 280,
    difficultyMultiplier: 1.9,
    spiritualTeachingKey: 'stage.5.teaching',
    geometryPrincipleKey: 'stage.5.geometry',
    unlockedPaletteId: 'cosmic-sahasrara',
  },
  {
    id: 6,
    slug: 'golden-fibonacci',
    nameKey: 'stage.6.name',
    sanskritName: 'Suvarna · Golden Fibonacci Spiral',
    archetype: 'fibonacci',
    symmetryFold: 20,
    mirrorSymmetry: true,
    guideRings: [0.15, 0.24, 0.39, 0.52, 0.63, 0.78, 0.91],
    petalsPerRing: 20,
    targetStrokes: 15,
    minResonanceToUnlock: 390,
    difficultyMultiplier: 2.1,
    spiritualTeachingKey: 'stage.6.teaching',
    geometryPrincipleKey: 'stage.6.geometry',
    unlockedPaletteId: 'suvarna-fibonacci',
  },
  {
    id: 7,
    slug: 'turiya-torus',
    nameKey: 'stage.7.name',
    sanskritName: 'Turiya · 3D Hyper-Torus Vortex',
    archetype: 'torus3d',
    symmetryFold: 28,
    mirrorSymmetry: true,
    guideRings: [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.85, 0.94],
    petalsPerRing: 28,
    targetStrokes: 16,
    minResonanceToUnlock: 520,
    difficultyMultiplier: 2.35,
    spiritualTeachingKey: 'stage.7.teaching',
    geometryPrincipleKey: 'stage.7.geometry',
    unlockedPaletteId: 'turiya-aurora',
  },
  {
    id: 8,
    slug: 'akasha-dodecahedron',
    nameKey: 'stage.8.name',
    sanskritName: 'Akasha · 3D Platonic Dodecahedron',
    archetype: 'dodecahedron3d',
    symmetryFold: 30,
    mirrorSymmetry: true,
    guideRings: [0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.94],
    petalsPerRing: 30,
    targetStrokes: 18,
    minResonanceToUnlock: 670,
    difficultyMultiplier: 2.6,
    spiritualTeachingKey: 'stage.8.teaching',
    geometryPrincipleKey: 'stage.8.geometry',
    unlockedPaletteId: 'akasha-prism',
  },
  {
    id: 9,
    slug: 'kalachakra-wheel',
    nameKey: 'stage.9.name',
    sanskritName: 'Kala · Kalachakra Time Palace',
    archetype: 'kalachakra',
    symmetryFold: 32,
    mirrorSymmetry: true,
    guideRings: [0.12, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.87, 0.95],
    petalsPerRing: 32,
    targetStrokes: 20,
    minResonanceToUnlock: 840,
    difficultyMultiplier: 2.85,
    spiritualTeachingKey: 'stage.9.teaching',
    geometryPrincipleKey: 'stage.9.geometry',
    unlockedPaletteId: 'kalachakra-nectar',
  },
  {
    id: 10,
    slug: 'sahasrara-crown',
    nameKey: 'stage.10.name',
    sanskritName: 'Sahasrara · 3D Crown Lotus Dome',
    archetype: 'sahasrara3d',
    symmetryFold: 36,
    mirrorSymmetry: true,
    guideRings: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.89, 0.96],
    petalsPerRing: 36,
    targetStrokes: 22,
    minResonanceToUnlock: 1050,
    difficultyMultiplier: 3.2,
    spiritualTeachingKey: 'stage.10.teaching',
    geometryPrincipleKey: 'stage.10.geometry',
    unlockedPaletteId: 'nirvana-rainbow',
  },
  {
    id: 11,
    slug: 'folk-rosette',
    nameKey: 'stage.11.name',
    sanskritName: 'Padma Bindu · Central Rosette',
    archetype: 'folk-rosette',
    symmetryFold: 8,
    mirrorSymmetry: true,
    guideRings: [0.12, 0.18, 0.25],
    petalsPerRing: 8,
    targetStrokes: 6,
    minResonanceToUnlock: 0,
    difficultyMultiplier: 1.1,
    spiritualTeachingKey: 'stage.11.teaching',
    geometryPrincipleKey: 'stage.11.geometry',
    unlockedPaletteId: 'folk-terracotta-jewel',
  },
  {
    id: 12,
    slug: 'folk-tulip',
    nameKey: 'stage.12.name',
    sanskritName: 'Kalashesha · Royal Tulip Arches',
    archetype: 'folk-tulip',
    symmetryFold: 8,
    mirrorSymmetry: true,
    guideRings: [0.26, 0.38, 0.46],
    petalsPerRing: 8,
    targetStrokes: 8,
    minResonanceToUnlock: 60,
    difficultyMultiplier: 1.3,
    spiritualTeachingKey: 'stage.12.teaching',
    geometryPrincipleKey: 'stage.12.geometry',
    unlockedPaletteId: 'folk-terracotta-jewel',
  },
  {
    id: 13,
    slug: 'folk-paisley',
    nameKey: 'stage.13.name',
    sanskritName: 'Kalka & Bija · Paisley Whispers',
    archetype: 'folk-paisley',
    symmetryFold: 8,
    mirrorSymmetry: true,
    guideRings: [0.46, 0.56, 0.66, 0.72],
    petalsPerRing: 8,
    targetStrokes: 10,
    minResonanceToUnlock: 130,
    difficultyMultiplier: 1.5,
    spiritualTeachingKey: 'stage.13.teaching',
    geometryPrincipleKey: 'stage.13.geometry',
    unlockedPaletteId: 'folk-terracotta-jewel',
  },
  {
    id: 14,
    slug: 'folk-daisy',
    nameKey: 'stage.14.name',
    sanskritName: 'Suryamukhi · Marigold Daisy Crown',
    archetype: 'folk-daisy',
    symmetryFold: 8,
    mirrorSymmetry: true,
    guideRings: [0.72, 0.81, 0.89],
    petalsPerRing: 8,
    targetStrokes: 12,
    minResonanceToUnlock: 220,
    difficultyMultiplier: 1.75,
    spiritualTeachingKey: 'stage.14.teaching',
    geometryPrincipleKey: 'stage.14.geometry',
    unlockedPaletteId: 'folk-terracotta-jewel',
  },
  {
    id: 15,
    slug: 'folk-masterpiece',
    nameKey: 'stage.15.name',
    sanskritName: 'Maha Rajasthani · Royal Folk Masterpiece',
    archetype: 'folk-masterpiece',
    symmetryFold: 8,
    mirrorSymmetry: true,
    guideRings: [0.18, 0.38, 0.56, 0.72, 0.86, 0.94],
    petalsPerRing: 8,
    targetStrokes: 16,
    minResonanceToUnlock: 350,
    difficultyMultiplier: 2.2,
    spiritualTeachingKey: 'stage.15.teaching',
    geometryPrincipleKey: 'stage.15.geometry',
    unlockedPaletteId: 'folk-terracotta-jewel',
  },
];

/**
 * Computes 3D perspective projection offset and scale for a mandala layer at `zLayer` (0..5)
 * given normalized tilt angles (`tiltX`, `tiltY` in -1..1) and `depthIntensity` (0..1).
 */
export function project3DLayerTransform(params: {
  zLayer: number;
  maxLayers: number;
  tiltX: number;
  tiltY: number;
  depthIntensity: number;
  breathExpansion: number;
}): {
  offsetX: number;
  offsetY: number;
  layerScale: number;
  shadowOffset: number;
  elevationZ: number;
} {
  const {
    zLayer,
    maxLayers,
    tiltX,
    tiltY,
    depthIntensity,
    breathExpansion,
  } = params;

  const safeMax = Math.max(1, maxLayers);
  const normalizedZ = (zLayer % safeMax) / safeMax; // 0 (bottom) to ~0.85 (top)
  const elevationZ =
    normalizedZ * depthIntensity * (0.85 + breathExpansion * 0.3);

  const offsetX = tiltX * elevationZ * 38;
  const offsetY = tiltY * elevationZ * 38;
  const layerScale = 1 + elevationZ * 0.09;
  const shadowOffset = Math.round(4 + elevationZ * 16);

  return {
    offsetX,
    offsetY,
    layerScale,
    shadowOffset,
    elevationZ,
  };
}

/**
 * Computes the exact breathing phase, progress (0..1), and expansion radius (0.25..1.0)
 * at any given elapsed time `elapsedSec` for a `BreathPattern`.
 */
export function computeBreathState(
  pattern: BreathPattern,
  elapsedSec: number
): BreathStateSnapshot {
  const totalCycle =
    pattern.inhaleSec +
    pattern.holdInSec +
    pattern.exhaleSec +
    pattern.holdOutSec;

  if (totalCycle <= 0) {
    return {
      phase: 'inhale',
      phaseProgress: 0,
      expansionRadius: 0.6,
      cycleTimeSec: 0,
      remainingPhaseSec: 0,
      idealStrokeSpeedNormalized: 0.5,
    };
  }

  const safeElapsed = Math.max(0, elapsedSec);
  const t = safeElapsed % totalCycle;

  const inhaleEnd = pattern.inhaleSec;
  const holdInEnd = inhaleEnd + pattern.holdInSec;
  const exhaleEnd = holdInEnd + pattern.exhaleSec;

  if (t < inhaleEnd) {
    const progress = t / pattern.inhaleSec;
    const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
    return {
      phase: 'inhale',
      phaseProgress: progress,
      expansionRadius: 0.28 + eased * 0.72,
      cycleTimeSec: totalCycle,
      remainingPhaseSec: Math.ceil(pattern.inhaleSec - t),
      idealStrokeSpeedNormalized: 0.65,
    };
  }

  if (t < holdInEnd && pattern.holdInSec > 0) {
    const localT = t - inhaleEnd;
    const progress = localT / pattern.holdInSec;
    return {
      phase: 'holdIn',
      phaseProgress: progress,
      expansionRadius: 1.0,
      cycleTimeSec: totalCycle,
      remainingPhaseSec: Math.ceil(pattern.holdInSec - localT),
      idealStrokeSpeedNormalized: 0.25,
    };
  }

  if (t < exhaleEnd) {
    const localT = t - holdInEnd;
    const progress = localT / pattern.exhaleSec;
    const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
    return {
      phase: 'exhale',
      phaseProgress: progress,
      expansionRadius: 1.0 - eased * 0.72,
      cycleTimeSec: totalCycle,
      remainingPhaseSec: Math.ceil(pattern.exhaleSec - localT),
      idealStrokeSpeedNormalized: 0.55,
    };
  }

  const localT = t - exhaleEnd;
  const progress = pattern.holdOutSec > 0 ? localT / pattern.holdOutSec : 0;
  return {
    phase: 'holdOut',
    phaseProgress: progress,
    expansionRadius: 0.28,
    cycleTimeSec: totalCycle,
    remainingPhaseSec: Math.max(1, Math.ceil(pattern.holdOutSec - localT)),
    idealStrokeSpeedNormalized: 0.2,
  };
}

/**
 * Generates N-fold rotational symmetry points (plus optional bilateral mirror reflections)
 * around a center `(cx, cy)`.
 */
export function computeSymmetryPoints(
  point: Point2D,
  center: Point2D,
  symmetryFold: number,
  mirror: boolean
): SymmetryPoint[] {
  const folds = Math.max(1, Math.min(64, Math.floor(symmetryFold)));
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const baseAngle = Math.atan2(dy, dx);
  const stepAngle = (Math.PI * 2) / folds;

  const results: SymmetryPoint[] = [];

  for (let i = 0; i < folds; i++) {
    const angle = baseAngle + i * stepAngle;
    results.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      foldIndex: i,
      isMirrored: false,
    });

    if (mirror) {
      const mirrorAngle = -baseAngle + i * stepAngle;
      results.push({
        x: center.x + Math.cos(mirrorAngle) * radius,
        y: center.y + Math.sin(mirrorAngle) * radius,
        foldIndex: i,
        isMirrored: true,
      });
    }
  }

  return results;
}

export function getMasteryRank(harmonyPercent: number, combo: number): MasteryRank {
  if (harmonyPercent >= 95 && combo >= 4) return 'S+ Samadhi';
  if (harmonyPercent >= 91) return 'S Siddha';
  if (harmonyPercent >= 85) return 'A+ Dhyana';
  if (harmonyPercent >= 76) return 'A Dharana';
  return 'B Pratyahara';
}

/**
 * Evaluates stroke resonance AND computes the full multi-dimensional game score:
 * - Proximity to sacred geometry guide rings
 * - Breath-stroke calmness & directional alignment
 * - Consecutive Harmony Combo Multiplier (1.0x up to 3.0x)
 * - Stage Difficulty Multiplier & 3D Brush Bonus
 */
export function evaluateStrokeResonance(params: {
  strokeRadiusNormalized: number;
  radialDeltaNormalized: number;
  strokeSpeedPxPerSec: number;
  breathState: BreathStateSnapshot;
  guideRings: number[];
  currentCombo?: number;
  stageDifficultyMultiplier?: number;
  brushBonusMultiplier?: number;
}): ScoreEvaluation {
  const {
    strokeRadiusNormalized,
    radialDeltaNormalized,
    strokeSpeedPxPerSec,
    breathState,
    guideRings,
    currentCombo = 0,
    stageDifficultyMultiplier = 1.0,
    brushBonusMultiplier = 1.0,
  } = params;

  let minRingDist = 1;
  let nearestRingIdx = 0;
  for (let i = 0; i < guideRings.length; i++) {
    const d = Math.abs(strokeRadiusNormalized - guideRings[i]);
    if (d < minRingDist) {
      minRingDist = d;
      nearestRingIdx = i;
    }
  }
  const geometryScore = Math.max(0, 1 - minRingDist * 2.5);

  const calmSpeedScore =
    strokeSpeedPxPerSec <= 650
      ? 1.0
      : Math.max(0.35, 1 - (strokeSpeedPxPerSec - 650) / 1600);

  let phaseBonus = 0.85;
  if (breathState.phase === 'inhale' && radialDeltaNormalized >= -0.02) {
    phaseBonus = 1.0;
  } else if (breathState.phase === 'exhale' && radialDeltaNormalized <= 0.02) {
    phaseBonus = 1.0;
  } else if (
    (breathState.phase === 'holdIn' || breathState.phase === 'holdOut') &&
    Math.abs(radialDeltaNormalized) <= 0.05
  ) {
    phaseBonus = 1.0;
  }

  const combined =
    geometryScore * 0.4 + calmSpeedScore * 0.35 + phaseBonus * 0.25;
  const harmonyAccuracy = Math.min(
    100,
    Math.max(60, Math.round(68 + combined * 32))
  );
  const resonanceGain = Math.max(6, Math.round(8 + combined * 17));

  // Update combo streak: harmony >= 84% increments combo; otherwise decays gracefully
  const newCombo =
    harmonyAccuracy >= 84 ? currentCombo + 1 : Math.max(0, currentCombo - 1);
  const comboMultiplier = Number(
    Math.min(3.0, 1.0 + newCombo * 0.15).toFixed(2)
  );

  // Full game score delta combining base points, harmony, combo, stage difficulty, and 3D brush bonus
  const basePoints = 100 + resonanceGain * 6;
  const scoreDelta = Math.round(
    basePoints *
      comboMultiplier *
      stageDifficultyMultiplier *
      brushBonusMultiplier
  );

  const masteryRank = getMasteryRank(harmonyAccuracy, newCombo);

  return {
    resonanceGain,
    scoreDelta,
    newCombo,
    comboMultiplier,
    harmonyAccuracy,
    ringAlignedIndex: nearestRingIdx,
    masteryRank,
  };
}

export function calculateStageCompletion(
  strokesCompleted: number,
  targetStrokes: number
): number {
  if (targetStrokes <= 0) return 100;
  return Math.min(
    100,
    Math.round((Math.max(0, strokesCompleted) / targetStrokes) * 100)
  );
}

export function isStageUnlocked(
  stage: SacredStage,
  highestStageCleared: number,
  totalResonance: number
): boolean {
  if (stage.id === 1) return true;
  return (
    highestStageCleared >= stage.id - 1 ||
    totalResonance >= stage.minResonanceToUnlock
  );
}

export function isPaletteUnlocked(
  palette: ColorPalette,
  highestStageCleared: number,
  totalResonance: number
): boolean {
  if (palette.requiredStageId <= 1) return true;
  const requiredStage = SACRED_STAGES.find(
    (s) => s.id === palette.requiredStageId
  );
  if (!requiredStage) return true;
  return (
    highestStageCleared >= palette.requiredStageId - 1 ||
    totalResonance >= requiredStage.minResonanceToUnlock
  );
}

export function calculateMindfulStreak(
  sessionDatesISO: string[],
  todayISO: string
): { currentStreak: number; longestStreak: number; practicedToday: boolean } {
  if (sessionDatesISO.length === 0) {
    return { currentStreak: 0, longestStreak: 0, practicedToday: false };
  }

  const uniqueSorted = Array.from(new Set(sessionDatesISO)).sort();
  const practicedToday = uniqueSorted.includes(todayISO);

  let longest = 1;
  let running = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    const prev = new Date(uniqueSorted[i - 1] + 'T00:00:00Z').getTime();
    const curr = new Date(uniqueSorted[i] + 'T00:00:00Z').getTime();
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      running++;
      if (running > longest) longest = running;
    } else if (diffDays > 1) {
      running = 1;
    }
  }

  const todayMs = new Date(todayISO + 'T00:00:00Z').getTime();
  const lastDateStr = uniqueSorted[uniqueSorted.length - 1];
  const lastMs = new Date(lastDateStr + 'T00:00:00Z').getTime();
  const daysSinceLast = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));

  if (daysSinceLast > 1) {
    return {
      currentStreak: 0,
      longestStreak: longest,
      practicedToday: false,
    };
  }

  let current = 1;
  for (let i = uniqueSorted.length - 1; i > 0; i--) {
    const curr = new Date(uniqueSorted[i] + 'T00:00:00Z').getTime();
    const prev = new Date(uniqueSorted[i - 1] + 'T00:00:00Z').getTime();
    const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      current++;
    } else {
      break;
    }
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(longest, current),
    practicedToday,
  };
}

export function getInitialSeedSessions(todayISO: string): SessionRecord[] {
  const today = new Date(todayISO + 'T00:00:00Z');
  const dayMinus = (n: number) => {
    const d = new Date(today.getTime() - n * 86400000);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      id: 'seed-1',
      dateISO: dayMinus(3),
      stageId: 1,
      durationSec: 420,
      resonanceScore: 95,
      totalScore: 2850,
      harmonyPercent: 89,
      strokesCount: 18,
      breathCyclesCompleted: 26,
      paletteUsed: 'saffron-bindu',
    },
    {
      id: 'seed-2',
      dateISO: dayMinus(2),
      stageId: 2,
      durationSec: 540,
      resonanceScore: 118,
      totalScore: 4120,
      harmonyPercent: 92,
      strokesCount: 24,
      breathCyclesCompleted: 33,
      paletteUsed: 'lotus-anahata',
    },
    {
      id: 'seed-3',
      dateISO: dayMinus(1),
      stageId: 3,
      durationSec: 660,
      resonanceScore: 145,
      totalScore: 5680,
      harmonyPercent: 95,
      strokesCount: 30,
      breathCyclesCompleted: 41,
      paletteUsed: 'pranic-vishuddha',
    },
    {
      id: 'seed-4',
      dateISO: todayISO,
      stageId: 4,
      durationSec: 480,
      resonanceScore: 132,
      totalScore: 5240,
      harmonyPercent: 94,
      strokesCount: 22,
      breathCyclesCompleted: 30,
      paletteUsed: 'solar-manipura',
    },
  ];
}
