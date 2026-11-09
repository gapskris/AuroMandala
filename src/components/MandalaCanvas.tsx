import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  BRUSH_STYLES,
  BreathPattern,
  BreathPhase,
  BreathStateSnapshot,
  BrushStyleId,
  ColorPalette,
  MasteryRank,
  Point2D,
  SacredStage,
  computeBreathState,
  evaluateStrokeResonance,
  project3DLayerTransform,
} from '../game/rules';
import { CachedStrokeRecord } from '../utils/storage';
import { soundAndHaptics } from '../utils/soundAndHaptics';

export interface MandalaCanvasHandle {
  clearCanvas: () => void;
  undoStroke: () => void;
  triggerSandDissolve: () => void;
  weaveHarmoniousRing: () => void;
  exportDataUrl: () => string | null;
  getStrokes: () => CachedStrokeRecord[];
  loadStrokes: (strokes: CachedStrokeRecord[]) => void;
}

interface MandalaCanvasProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  stage: SacredStage;
  palette: ColorPalette;
  selectedColor: string;
  brushStyle: BrushStyleId;
  brushSize: number;
  depth3DIntensity: number;
  rainbowCycleMode: boolean;
  currentCombo: number;
  breathPattern: BreathPattern;
  isDark: boolean;
  lowPowerMode: boolean;
  initialCachedStrokes?: CachedStrokeRecord[];
  onStrokeComplete: (metrics: {
    resonanceGain: number;
    scoreDelta: number;
    newCombo: number;
    comboMultiplier: number;
    harmonyAccuracy: number;
    masteryRank: MasteryRank;
    totalStrokes: number;
    strokesSnapshot: CachedStrokeRecord[];
  }) => void;
  onBreathPhaseChange: (phase: BreathPhase, snapshot: BreathStateSnapshot) => void;
  breathRingRef: React.RefObject<HTMLCanvasElement | null>;
  breathTimerRef: React.RefObject<HTMLSpanElement | null>;
}

// Zero-GC Pooled Particle Ring Buffer
const MAX_PARTICLES = 180;
const partX = new Float32Array(MAX_PARTICLES);
const partY = new Float32Array(MAX_PARTICLES);
const partVX = new Float32Array(MAX_PARTICLES);
const partVY = new Float32Array(MAX_PARTICLES);
const partLife = new Float32Array(MAX_PARTICLES);
const partMaxLife = new Float32Array(MAX_PARTICLES);
const partSize = new Float32Array(MAX_PARTICLES);
const partColorIdx = new Uint8Array(MAX_PARTICLES);
let particleCursor = 0;

function spawnParticle(
  x: number,
  y: number,
  vx: number,
  vy: number,
  maxLife: number,
  size: number,
  colorIdx: number
) {
  const i = particleCursor;
  particleCursor = (particleCursor + 1) % MAX_PARTICLES;
  partX[i] = x;
  partY[i] = y;
  partVX[i] = vx;
  partVY[i] = vy;
  partLife[i] = maxLife;
  partMaxLife[i] = maxLife;
  partSize[i] = size;
  partColorIdx[i] = colorIdx;
}

export const MandalaCanvas = forwardRef<MandalaCanvasHandle, MandalaCanvasProps>(
  (
    {
      gameState,
      stage,
      palette,
      selectedColor,
      brushStyle,
      brushSize,
      depth3DIntensity,
      rainbowCycleMode,
      currentCombo,
      breathPattern,
      isDark,
      lowPowerMode,
      initialCachedStrokes,
      onStrokeComplete,
      onBreathPhaseChange,
      breathRingRef,
      breathTimerRef,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const strokesRef = useRef<CachedStrokeRecord[]>([]);
    const activePointsRef = useRef<Point2D[]>([]);
    const isDrawingRef = useRef<boolean>(false);
    const strokeStartTimeRef = useRef<number>(0);
    const strokeDistancePxRef = useRef<number>(0);
    const dissolveTimerRef = useRef<number>(0);
    const hitstopTimerRef = useRef<number>(0);
    const pointerTiltRef = useRef<{ x: number; y: number }>({ x: 0.2, y: -0.2 });

    const propsRef = useRef({
      gameState,
      stage,
      palette,
      selectedColor,
      brushStyle,
      brushSize,
      depth3DIntensity,
      rainbowCycleMode,
      currentCombo,
      breathPattern,
      isDark,
      lowPowerMode,
      onStrokeComplete,
      onBreathPhaseChange,
    });
    propsRef.current = {
      gameState,
      stage,
      palette,
      selectedColor,
      brushStyle,
      brushSize,
      depth3DIntensity,
      rainbowCycleMode,
      currentCombo,
      breathPattern,
      isDark,
      lowPowerMode,
      onStrokeComplete,
      onBreathPhaseChange,
    };

    const elapsedBreathSecRef = useRef<number>(0);
    const lastBreathPhaseRef = useRef<BreathPhase>('inhale');
    const latestBreathSnapshotRef = useRef<BreathStateSnapshot>(
      computeBreathState(breathPattern, 0)
    );

    // Seed a rich 3-layer multi-color 3D mandala sculpture when starting a fresh stage
    const seedMultiLayer3DMandala = (
      targetStage: SacredStage,
      targetPalette: ColorPalette
    ) => {
      const seeded: CachedStrokeRecord[] = [];
      const layerCount = Math.min(3, targetStage.guideRings.length);

      for (let layer = 0; layer < layerCount; layer++) {
        const ringR = targetStage.guideRings[layer] ?? 0.24 * (layer + 1);
        const pts: Point2D[] = [];
        const steps = 20;
        const arc = (Math.PI * 1.35) / targetStage.symmetryFold;
        for (let a = 0; a <= steps; a++) {
          const t = a / steps;
          const theta = t * arc + layer * 0.08;
          const petalMod =
            0.78 + 0.28 * Math.sin(t * Math.PI * (layer % 2 === 0 ? 1 : 2));
          const r = ringR * petalMod;
          pts.push({ x: Math.cos(theta) * r, y: Math.sin(theta) * r });
        }
        seeded.push({
          points: pts,
          color: targetPalette.colors[layer % targetPalette.colors.length],
          paletteColors: targetPalette.colors,
          glowColor: targetPalette.glowColor,
          baseWidth: 3.2 - layer * 0.3,
          brushStyle: layer === 0 ? 'ribbon3d' : layer === 1 ? 'nebula-aurora' : 'lotus-pearl',
          symmetryFold: targetStage.symmetryFold,
          mirror: targetStage.mirrorSymmetry,
          zLayer: layer + 1,
          breathExpansionAtDraw: 0.72,
        });
      }
      strokesRef.current = seeded;
    };

    const initializedCacheRef = useRef(false);
    useEffect(() => {
      if (
        !initializedCacheRef.current &&
        initialCachedStrokes &&
        initialCachedStrokes.length > 0
      ) {
        strokesRef.current = initialCachedStrokes;
        initializedCacheRef.current = true;
        return;
      }
      initializedCacheRef.current = true;
      seedMultiLayer3DMandala(stage, palette);
    }, [stage.id]);

    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        strokesRef.current = [];
        activePointsRef.current = [];
      },
      undoStroke: () => {
        if (strokesRef.current.length > 0) {
          strokesRef.current.pop();
        }
      },
      getStrokes: () => [...strokesRef.current],
      loadStrokes: (strokes: CachedStrokeRecord[]) => {
        strokesRef.current = [...strokes];
      },
      triggerSandDissolve: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const maxR = Math.min(cx, cy) * 0.78;

        for (let i = 0; i < 110; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * maxR * 0.85;
          spawnParticle(
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist,
            Math.cos(angle) * (45 + Math.random() * 95),
            Math.sin(angle) * (45 + Math.random() * 95) - 35,
            1.1 + Math.random() * 0.9,
            2.8 + Math.random() * 3.2,
            i % 6
          );
        }
        dissolveTimerRef.current = 0.65;
        soundAndHaptics.playAwakeningChord();
        soundAndHaptics.triggerHapticPulse([40, 60, 80, 100]);
        setTimeout(() => {
          strokesRef.current = [];
        }, 260);
      },
      weaveHarmoniousRing: () => {
        const {
          stage: curStage,
          palette: curPalette,
          selectedColor: curColor,
          brushStyle: curBrushStyle,
          brushSize: curBrush,
          rainbowCycleMode: isRainbow,
          currentCombo: comboNow,
          onStrokeComplete: cb,
        } = propsRef.current;

        const strokeIdx = strokesRef.current.length;
        const ringIdx = strokeIdx % curStage.guideRings.length;
        const baseR = curStage.guideRings[ringIdx];
        const pts: Point2D[] = [];
        const steps = 22;
        const petalArc = (Math.PI * 1.4) / curStage.symmetryFold;

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const theta = t * petalArc;
          const wave = Math.sin(t * Math.PI * (strokeIdx % 2 === 0 ? 1 : 2)) * 0.088;
          const r = baseR + wave;
          pts.push({
            x: Math.cos(theta) * r,
            y: Math.sin(theta) * r,
          });
        }

        const breathSnap = latestBreathSnapshotRef.current;
        const chosenColor = isRainbow
          ? curPalette.colors[strokeIdx % curPalette.colors.length]
          : curColor || curPalette.colors[strokeIdx % curPalette.colors.length];

        strokesRef.current.push({
          points: pts,
          color: chosenColor,
          paletteColors: curPalette.colors,
          glowColor: curPalette.glowColor,
          baseWidth: curBrush,
          brushStyle: curBrushStyle,
          symmetryFold: curStage.symmetryFold,
          mirror: curStage.mirrorSymmetry,
          zLayer: (strokeIdx % 5) + 1,
          breathExpansionAtDraw: breathSnap.expansionRadius,
        });

        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const maxR = Math.min(cx, cy) * 0.76;
          for (let k = 0; k < 20; k++) {
            const ang = (k / 20) * Math.PI * 2;
            spawnParticle(
              cx + Math.cos(ang) * baseR * maxR,
              cy + Math.sin(ang) * baseR * maxR,
              Math.cos(ang) * 32,
              Math.sin(ang) * 32,
              0.85,
              3.4,
              k % 6
            );
          }
        }

        const brushSpec =
          BRUSH_STYLES.find((b) => b.id === curBrushStyle) ?? BRUSH_STYLES[0];
        const evalRes = evaluateStrokeResonance({
          strokeRadiusNormalized: baseR,
          radialDeltaNormalized: 0.01,
          strokeSpeedPxPerSec: 330,
          breathState: breathSnap,
          guideRings: curStage.guideRings,
          currentCombo: comboNow,
          stageDifficultyMultiplier: curStage.difficultyMultiplier,
          brushBonusMultiplier: brushSpec.scoreBonusMultiplier,
        });

        hitstopTimerRef.current = 0.035;
        soundAndHaptics.playStrokeResonanceChime(evalRes.harmonyAccuracy, curStage.id);
        soundAndHaptics.triggerHapticPulse([25]);

        cb({
          resonanceGain: evalRes.resonanceGain,
          scoreDelta: evalRes.scoreDelta,
          newCombo: evalRes.newCombo,
          comboMultiplier: evalRes.comboMultiplier,
          harmonyAccuracy: evalRes.harmonyAccuracy,
          masteryRank: evalRes.masteryRank,
          totalStrokes: strokesRef.current.length,
          strokesSnapshot: [...strokesRef.current],
        });
      },
      exportDataUrl: () => {
        return canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = window.innerWidth;
      let height = window.innerHeight;
      let dpr = Math.min(
        window.devicePixelRatio || 1,
        propsRef.current.lowPowerMode ? 1 : 2
      );

      const updateSize = () => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        width = Math.max(280, rect.width || window.innerWidth);
        height = Math.max(280, rect.height || window.innerHeight);
        dpr = Math.min(
          window.devicePixelRatio || 1,
          propsRef.current.lowPowerMode ? 1 : 2
        );
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      };

      updateSize();
      const resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(canvas);

      const screenToMandala = (
        clientX: number,
        clientY: number
      ): { norm: Point2D; rawPx: Point2D } => {
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const maxR = Math.max(105, Math.min(cx, cy) * 0.76);
        const lx = clientX - rect.left;
        const ly = clientY - rect.top;
        return {
          norm: {
            x: (lx - cx) / maxR,
            y: (ly - cy) / maxR,
          },
          rawPx: { x: lx, y: ly },
        };
      };

      let lastRawPt: Point2D | null = null;

      const handlePointerDown = (e: PointerEvent) => {
        if (propsRef.current.gameState !== 'playing') return;
        if (e.button !== undefined && e.button !== 0) return;
        isDrawingRef.current = true;
        strokeStartTimeRef.current = performance.now();
        strokeDistancePxRef.current = 0;

        const { norm, rawPx } = screenToMandala(e.clientX, e.clientY);
        activePointsRef.current = [norm];
        lastRawPt = rawPx;
      };

      const handlePointerMove = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          pointerTiltRef.current = {
            x: ((e.clientX - rect.left) / rect.width - 0.5) * 1.4,
            y: ((e.clientY - rect.top) / rect.height - 0.5) * 1.4,
          };
        }

        if (!isDrawingRef.current || propsRef.current.gameState !== 'playing') return;
        const { norm, rawPx } = screenToMandala(e.clientX, e.clientY);
        const pts = activePointsRef.current;
        if (pts.length > 0) {
          const prev = pts[pts.length - 1];
          const distNorm = Math.hypot(norm.x - prev.x, norm.y - prev.y);
          if (distNorm < 0.006) return;
        }
        if (lastRawPt) {
          strokeDistancePxRef.current += Math.hypot(
            rawPx.x - lastRawPt.x,
            rawPx.y - lastRawPt.y
          );
          if (!propsRef.current.lowPowerMode && Math.random() < 0.5) {
            spawnParticle(
              rawPx.x,
              rawPx.y,
              (Math.random() - 0.5) * 26,
              (Math.random() - 0.5) * 26 - 10,
              0.55,
              2.4,
              pts.length % 6
            );
          }
        }
        lastRawPt = rawPx;
        pts.push(norm);
      };

      const finishStroke = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const pts = activePointsRef.current;
        activePointsRef.current = [];
        lastRawPt = null;

        if (pts.length < 2) return;

        const {
          stage: curStage,
          palette: curPalette,
          selectedColor: curColor,
          brushStyle: curBrushStyle,
          brushSize: curBrush,
          rainbowCycleMode: isRainbow,
          currentCombo: comboNow,
          onStrokeComplete: cb,
        } = propsRef.current;

        const breathSnap = latestBreathSnapshotRef.current;
        const strokeIdx = strokesRef.current.length;
        const chosenColor = isRainbow
          ? curPalette.colors[strokeIdx % curPalette.colors.length]
          : curColor || curPalette.colors[0];

        strokesRef.current.push({
          points: pts,
          color: chosenColor,
          paletteColors: curPalette.colors,
          glowColor: curPalette.glowColor,
          baseWidth: curBrush,
          brushStyle: curBrushStyle,
          symmetryFold: curStage.symmetryFold,
          mirror: curStage.mirrorSymmetry,
          zLayer: (strokeIdx % 5) + 1,
          breathExpansionAtDraw: breathSnap.expansionRadius,
        });

        const durationSec = Math.max(
          0.08,
          (performance.now() - strokeStartTimeRef.current) / 1000
        );
        const speedPxPerSec = strokeDistancePxRef.current / durationSec;

        const startR = Math.hypot(pts[0].x, pts[0].y);
        const endR = Math.hypot(pts[pts.length - 1].x, pts[pts.length - 1].y);
        const avgR = (startR + endR) * 0.5;
        const radialDelta = endR - startR;

        const brushSpec =
          BRUSH_STYLES.find((b) => b.id === curBrushStyle) ?? BRUSH_STYLES[0];
        const evalRes = evaluateStrokeResonance({
          strokeRadiusNormalized: avgR,
          radialDeltaNormalized: radialDelta,
          strokeSpeedPxPerSec: speedPxPerSec,
          breathState: breathSnap,
          guideRings: curStage.guideRings,
          currentCombo: comboNow,
          stageDifficultyMultiplier: curStage.difficultyMultiplier,
          brushBonusMultiplier: brushSpec.scoreBonusMultiplier,
        });

        hitstopTimerRef.current = 0.035;
        soundAndHaptics.playStrokeResonanceChime(
          evalRes.harmonyAccuracy,
          curStage.id
        );
        soundAndHaptics.triggerHapticPulse([18]);

        cb({
          resonanceGain: evalRes.resonanceGain,
          scoreDelta: evalRes.scoreDelta,
          newCombo: evalRes.newCombo,
          comboMultiplier: evalRes.comboMultiplier,
          harmonyAccuracy: evalRes.harmonyAccuracy,
          masteryRank: evalRes.masteryRank,
          totalStrokes: strokesRef.current.length,
          strokesSnapshot: [...strokesRef.current],
        });
      };

      const handleBlur = () => {
        isDrawingRef.current = false;
        activePointsRef.current = [];
        lastRawPt = null;
      };

      canvas.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', finishStroke);
      window.addEventListener('blur', handleBlur);

      let rafId = 0;
      let timerId: ReturnType<typeof setTimeout> | null = null;
      let isCleanedUp = false;
      let lastTime = performance.now();

      const scheduleNextFrame = () => {
        if (isCleanedUp) return;
        timerId = setTimeout(() => {
          if (!isCleanedUp) {
            rafId = requestAnimationFrame(renderFrame);
          }
        }, 22);
      };

      const renderFrame = (now: number) => {
        const rawDt = (now - lastTime) / 1000;
        lastTime = now;
        const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

        const {
          gameState: curState,
          stage: curStage,
          palette: curPalette,
          selectedColor: curColor,
          brushStyle: curBrushStyle,
          brushSize: curBrush,
          depth3DIntensity: depth3d,
          breathPattern: curBreathPattern,
          isDark: darkTheme,
          lowPowerMode: lowPower,
          onBreathPhaseChange: phaseCb,
        } = propsRef.current;

        if (hitstopTimerRef.current > 0) {
          hitstopTimerRef.current = Math.max(0, hitstopTimerRef.current - dt);
        }
        if (dissolveTimerRef.current > 0) {
          dissolveTimerRef.current = Math.max(0, dissolveTimerRef.current - dt);
        }

        const simDt =
          curState === 'paused' || hitstopTimerRef.current > 0 ? 0 : dt;
        elapsedBreathSecRef.current += simDt;

        const breathSnap = computeBreathState(
          curBreathPattern,
          elapsedBreathSecRef.current
        );
        latestBreathSnapshotRef.current = breathSnap;

        if (
          breathSnap.phase !== lastBreathPhaseRef.current &&
          curState === 'playing'
        ) {
          lastBreathPhaseRef.current = breathSnap.phase;
          phaseCb(breathSnap.phase, breathSnap);
          soundAndHaptics.playBreathPhaseChime(
            breathSnap.phase,
            curBreathPattern.baseFrequencyHz
          );
          soundAndHaptics.triggerHapticPulse(
            curBreathPattern.hapticPattern[breathSnap.phase]
          );
        }

        // Update 36x36 breath indicator canvas directly via ref
        if (breathRingRef.current) {
          const bCtx = breathRingRef.current.getContext('2d');
          if (bCtx) {
            bCtx.clearRect(0, 0, 36, 36);
            const r = 6.5 + breathSnap.expansionRadius * 9.5;
            bCtx.fillStyle = 'rgba(245, 158, 11, 0.25)';
            bCtx.strokeStyle = curPalette.colors[0];
            bCtx.lineWidth = 2.2;
            bCtx.beginPath();
            bCtx.arc(18, 18, r, 0, Math.PI * 2);
            bCtx.fill();
            bCtx.stroke();
          }
        }
        if (breathTimerRef.current) {
          const nextTxt = `${breathSnap.remainingPhaseSec}s`;
          if (breathTimerRef.current.textContent !== nextTxt) {
            breathTimerRef.current.textContent = nextTxt;
          }
        }

        ctx.save();
        ctx.scale(dpr, dpr);

        const isDesktopTitle = curState === 'title' && width >= 1024;
        const cx = isDesktopTitle ? width * 0.67 : width / 2;
        const cy =
          curState !== 'title' && height > width
            ? height * 0.45 // On mobile portrait, lift center slightly above bottom thumb dock
            : height / 2;
        const maxR = Math.max(
          105,
          Math.min(width / 2, height / 2) * (isDesktopTitle ? 0.72 : 0.74)
        );

        // Compute orbital + pointer 3D tilt
        const orbitTiltX =
          Math.cos(elapsedBreathSecRef.current * 0.75) * 0.35 +
          pointerTiltRef.current.x * 0.45;
        const orbitTiltY =
          Math.sin(elapsedBreathSecRef.current * 0.6) * 0.35 +
          pointerTiltRef.current.y * 0.45;

        // 1. Multi-Chromatic 3D Sanctuary Backdrop
        ctx.fillStyle = darkTheme ? '#070A12' : '#F8F5EE';
        ctx.fillRect(0, 0, width, height);

        const auraR = maxR * (0.65 + breathSnap.expansionRadius * 0.55);
        const grad = ctx.createRadialGradient(
          cx + orbitTiltX * 18,
          cy + orbitTiltY * 18,
          maxR * 0.04,
          cx,
          cy,
          auraR
        );
        if (darkTheme) {
          grad.addColorStop(0, curPalette.glowColor.replace('0.45', '0.26'));
          grad.addColorStop(0.45, 'rgba(30, 27, 75, 0.28)');
          grad.addColorStop(0.8, 'rgba(15, 23, 42, 0.2)');
          grad.addColorStop(1, 'rgba(7, 10, 18, 0)');
        } else {
          grad.addColorStop(0, curPalette.glowColor.replace('0.45', '0.22'));
          grad.addColorStop(0.6, 'rgba(245, 238, 224, 0.35)');
          grad.addColorStop(1, 'rgba(248, 245, 238, 0)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. 3D Sacred Geometry Stage Blueprint & Archetype Lattice
        const folds = curStage.symmetryFold;
        for (let rIdx = 0; rIdx < curStage.guideRings.length; rIdx++) {
          const ringNorm = curStage.guideRings[rIdx];
          const ringProj = project3DLayerTransform({
            zLayer: rIdx,
            maxLayers: curStage.guideRings.length,
            tiltX: orbitTiltX,
            tiltY: orbitTiltY,
            depthIntensity: depth3d * 0.65,
            breathExpansion: breathSnap.expansionRadius,
          });
          const rCx = cx + ringProj.offsetX;
          const rCy = cy + ringProj.offsetY;
          const ringR = ringNorm * maxR * ringProj.layerScale;

          ctx.strokeStyle =
            curPalette.colors[rIdx % curPalette.colors.length];
          ctx.globalAlpha = darkTheme ? 0.16 : 0.22;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(rCx, rCy, ringR, 0, Math.PI * 2);
          ctx.stroke();

          // Stage Archetype 3D Wireframe Overlays
          if (rIdx === 1 || rIdx === 3) {
            const subCount = Math.min(folds, 16);
            ctx.globalAlpha = darkTheme ? 0.1 : 0.14;
            for (let k = 0; k < subCount; k++) {
              const theta =
                (k * Math.PI * 2) / subCount +
                elapsedBreathSecRef.current * 0.04 * (rIdx % 2 === 0 ? 1 : -1);
              const ox = rCx + Math.cos(theta) * (ringR * 0.48);
              const oy = rCy + Math.sin(theta) * (ringR * 0.48);
              ctx.beginPath();
              if (
                curStage.archetype === 'sri-yantra' ||
                curStage.archetype === 'dodecahedron3d' ||
                curStage.archetype === 'kalachakra'
              ) {
                // Polygonal sacred star chords
                const nextTheta = theta + (Math.PI * 2) / 3;
                ctx.moveTo(ox, oy);
                ctx.lineTo(
                  rCx + Math.cos(nextTheta) * (ringR * 0.48),
                  rCy + Math.sin(nextTheta) * (ringR * 0.48)
                );
              } else {
                ctx.arc(ox, oy, ringR * 0.48, 0, Math.PI * 2);
              }
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;

        // Radial symmetry spokes
        ctx.strokeStyle = darkTheme
          ? 'rgba(226, 232, 240, 0.08)'
          : 'rgba(120, 113, 108, 0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i < folds; i++) {
          const ang = (i * Math.PI * 2) / folds;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(ang) * maxR, cy + Math.sin(ang) * maxR);
          ctx.stroke();
        }

        // 3. Live Breathing 3D Prana Halo Ring
        const breathHaloR = maxR * (0.18 + breathSnap.expansionRadius * 0.68);
        ctx.save();
        ctx.strokeStyle = curPalette.colors[0];
        ctx.globalAlpha = darkTheme ? 0.38 : 0.45;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.arc(
          cx + orbitTiltX * 14,
          cy + orbitTiltY * 14,
          breathHaloR,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();

        // 4. Render 3D Mandala Strokes with Brush Style & Z-Depth Elevation
        const render3DStroke = (strokeObj: CachedStrokeRecord, strokeOrderIdx: number) => {
          const pts = strokeObj.points;
          if (pts.length < 2) return;

          const proj = project3DLayerTransform({
            zLayer: strokeObj.zLayer ?? (strokeOrderIdx % 5) + 1,
            maxLayers: 6,
            tiltX: orbitTiltX,
            tiltY: orbitTiltY,
            depthIntensity: depth3d,
            breathExpansion: breathSnap.expansionRadius,
          });

          const layerCx = cx + proj.offsetX;
          const layerCy = cy + proj.offsetY;
          const layerR = maxR * proj.layerScale;

          const breathPulseWidth =
            strokeObj.baseWidth *
            (0.9 + 0.22 * Math.sin(elapsedBreathSecRef.current * 2.2 + strokeOrderIdx));

          const symFold = strokeObj.symmetryFold;
          const mirror = strokeObj.mirror;
          const stepAng = (Math.PI * 2) / symFold;
          const bStyle = strokeObj.brushStyle || 'ribbon3d';
          const palColors =
            strokeObj.paletteColors && strokeObj.paletteColors.length > 0
              ? strokeObj.paletteColors
              : curPalette.colors;

          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          for (let f = 0; f < symFold; f++) {
            const rot = f * stepAng;
            const cosR = Math.cos(rot);
            const sinR = Math.sin(rot);

            const branchColor =
              bStyle === 'nebula-aurora'
                ? palColors[(f + strokeOrderIdx) % palColors.length]
                : strokeObj.color;

            const drawBranchPath = (mirrorSign: 1 | -1, offsetX: number, offsetY: number) => {
              ctx.beginPath();
              for (let p = 0; p < pts.length; p++) {
                const px = pts[p].x * layerR;
                const py = pts[p].y * mirrorSign * layerR;
                const rx = layerCx + offsetX + px * cosR - py * sinR;
                const ry = layerCy + offsetY + px * sinR + py * cosR;
                if (p === 0) ctx.moveTo(rx, ry);
                else ctx.lineTo(rx, ry);
              }
              ctx.stroke();
            };

            const renderWithBrush = (mirrorSign: 1 | -1) => {
              // Pass A: 3D Depth Drop Shadow (when 3D depth > 0.1)
              if (depth3d > 0.1 && !lowPower) {
                ctx.strokeStyle = darkTheme
                  ? 'rgba(2, 6, 23, 0.62)'
                  : 'rgba(28, 25, 23, 0.22)';
                ctx.lineWidth = breathPulseWidth * 1.35;
                ctx.globalAlpha = 0.6;
                drawBranchPath(
                  mirrorSign,
                  -orbitTiltX * proj.shadowOffset * 0.55,
                  proj.shadowOffset * 0.65
                );
              }

              // Pass B: Outer Chromatic Halo
              if (!lowPower) {
                ctx.strokeStyle = branchColor;
                ctx.lineWidth = breathPulseWidth * 2.1;
                ctx.globalAlpha = darkTheme ? 0.22 : 0.16;
                drawBranchPath(mirrorSign, 0, 0);
              }

              // Pass C: Primary Brush Body
              ctx.strokeStyle = branchColor;
              ctx.globalAlpha = 0.96;
              ctx.lineWidth =
                bStyle === 'calligraphy-gold'
                  ? breathPulseWidth * (1.35 - 0.5 * (f % 2))
                  : breathPulseWidth;
              drawBranchPath(mirrorSign, 0, 0);

              // Pass D: 3D Specular Ridge / Pearl / Crystalline Facet Detail
              if (bStyle === 'ribbon3d' || bStyle === 'calligraphy-gold') {
                ctx.strokeStyle = darkTheme ? '#FFFBEB' : '#FFFFFF';
                ctx.lineWidth = Math.max(0.8, breathPulseWidth * 0.34);
                ctx.globalAlpha = 0.72;
                drawBranchPath(mirrorSign, -1.2, -1.5);
              } else if (bStyle === 'lotus-pearl' || bStyle === 'crystalline') {
                const stride = Math.max(3, Math.floor(pts.length / 4));
                for (let p = 0; p < pts.length; p += stride) {
                  const px = pts[p].x * layerR;
                  const py = pts[p].y * mirrorSign * layerR;
                  const rx = layerCx + px * cosR - py * sinR;
                  const ry = layerCy + px * sinR + py * cosR;
                  const nodeR = breathPulseWidth * 1.15;

                  ctx.fillStyle = branchColor;
                  ctx.globalAlpha = 0.95;
                  ctx.beginPath();
                  if (bStyle === 'crystalline') {
                    ctx.moveTo(rx, ry - nodeR * 1.3);
                    ctx.lineTo(rx + nodeR * 1.3, ry);
                    ctx.lineTo(rx, ry + nodeR * 1.3);
                    ctx.lineTo(rx - nodeR * 1.3, ry);
                    ctx.closePath();
                  } else {
                    ctx.arc(rx, ry, nodeR, 0, Math.PI * 2);
                  }
                  ctx.fill();

                  // 3D specular dot on pearl/crystal
                  ctx.fillStyle = '#FFFFFF';
                  ctx.globalAlpha = 0.85;
                  ctx.beginPath();
                  ctx.arc(
                    rx - nodeR * 0.3,
                    ry - nodeR * 0.3,
                    nodeR * 0.32,
                    0,
                    Math.PI * 2
                  );
                  ctx.fill();
                }
              }
            };

            renderWithBrush(1);
            if (mirror) {
              renderWithBrush(-1);
            }
          }
          ctx.restore();
        };

        for (let s = 0; s < strokesRef.current.length; s++) {
          render3DStroke(strokesRef.current[s], s);
        }

        if (activePointsRef.current.length >= 2) {
          render3DStroke(
            {
              points: activePointsRef.current,
              color: curColor || curPalette.colors[0],
              paletteColors: curPalette.colors,
              glowColor: curPalette.glowColor,
              baseWidth: curBrush,
              brushStyle: curBrushStyle,
              symmetryFold: curStage.symmetryFold,
              mirror: curStage.mirrorSymmetry,
              zLayer: 5,
              breathExpansionAtDraw: breathSnap.expansionRadius,
            },
            strokesRef.current.length
          );
        }

        // 5. 3D Illuminated Bindu Sphere at Center
        const binduR = 6.5 + breathSnap.expansionRadius * 4.5;
        ctx.save();
        ctx.fillStyle = curPalette.colors[0];
        ctx.beginPath();
        ctx.arc(
          cx + orbitTiltX * 22,
          cy + orbitTiltY * 22,
          binduR,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(
          cx + orbitTiltX * 22 - binduR * 0.28,
          cy + orbitTiltY * 22 - binduR * 0.28,
          binduR * 0.35,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        // 6. Zero-GC Pooled Particle Ring Buffer
        for (let i = 0; i < MAX_PARTICLES; i++) {
          if (partLife[i] <= 0) continue;
          partLife[i] -= dt;
          if (partLife[i] <= 0) continue;

          partX[i] += partVX[i] * dt;
          partY[i] += partVY[i] * dt;
          const alpha = Math.max(0, partLife[i] / partMaxLife[i]);
          ctx.fillStyle =
            curPalette.colors[partColorIdx[i] % curPalette.colors.length];
          ctx.globalAlpha = alpha * 0.9;
          ctx.beginPath();
          ctx.arc(partX[i], partY[i], partSize[i] * alpha, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.restore();
        scheduleNextFrame();
      };

      rafId = requestAnimationFrame(renderFrame);

      return () => {
        isCleanedUp = true;
        cancelAnimationFrame(rafId);
        if (timerId !== null) clearTimeout(timerId);
        resizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', finishStroke);
        window.removeEventListener('blur', handleBlur);
      };
    }, []);

    return (
      <div className="fixed inset-0 z-0 overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          data-testid="mandala-canvas"
          aria-label="Interactive 3D Sacred Geometry Mandala Drawing Canvas"
          className="w-full h-full block cursor-crosshair touch-none"
        />
      </div>
    );
  }
);
