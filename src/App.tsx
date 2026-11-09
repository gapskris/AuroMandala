/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Compass,
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
  Undo2,
  Bookmark,
  Check,
  Play,
  Globe,
  Vibrate,
  Layers,
  Palette as PaletteIcon,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  BREATH_PATTERNS,
  BRUSH_STYLES,
  BreathPhase,
  BrushStyleId,
  COLOR_PALETTES,
  MasteryRank,
  SACRED_STAGES,
  SessionRecord,
  calculateMindfulStreak,
  calculateStageCompletion,
  getInitialSeedSessions,
  isPaletteUnlocked,
  isStageUnlocked,
} from './game/rules';
import {
  LOCALE_OPTIONS,
  SupportedLocale,
  t,
} from './i18n/translations';
import {
  MandalaCanvas,
  MandalaCanvasHandle,
} from './components/MandalaCanvas';
import { TitleScreen } from './components/TitleScreen';
import { DashboardModal, SavedArtwork } from './components/DashboardModal';
import {
  ReminderConfig,
  SettingsVaultModal,
} from './components/SettingsVaultModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { soundAndHaptics } from './utils/soundAndHaptics';
import {
  CachedStrokeRecord,
  clearGameCache,
  loadGameCache,
  saveGameCache,
} from './utils/storage';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface RunSnapshot {
  stageName: string;
  sanskritName: string;
  stageScoreEarned: number;
  totalScore: number;
  maxComboMultiplier: number;
  masteryRank: MasteryRank;
  resonanceEarned: number;
  harmonyAccuracy: number;
  strokesHarmonized: number;
  unlockedPaletteName: string;
  teachingText: string;
}

export default function App() {
  const todayISO = '2026-11-08';

  const cachedBoot = useRef(loadGameCache());

  const initialGameState: GameState =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1'
      ? 'playing'
      : 'title';

  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [locale, setLocale] = useState<SupportedLocale>(
    cachedBoot.current?.locale ?? 'en'
  );
  const [isDark, setIsDark] = useState<boolean>(
    cachedBoot.current?.isDark ?? true
  );
  const [lowPowerMode, setLowPowerMode] = useState<boolean>(
    cachedBoot.current?.lowPowerMode ?? false
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hapticVisualPulse, setHapticVisualPulse] = useState<boolean>(false);

  // 3D & Sacred Geometry State (hydrated from Game Cache when available)
  const [currentStageId, setCurrentStageId] = useState<number>(
    cachedBoot.current?.currentStageId ?? 1
  );
  const [highestStageCleared, setHighestStageCleared] = useState<number>(
    cachedBoot.current?.highestStageCleared ?? 3
  );
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(
    cachedBoot.current?.selectedPaletteId ?? 'saffron-bindu'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    cachedBoot.current?.selectedColor ?? COLOR_PALETTES[0].colors[0]
  );
  const [selectedBrushStyle, setSelectedBrushStyle] = useState<BrushStyleId>(
    cachedBoot.current?.selectedBrushStyle ?? 'ribbon3d'
  );
  const [brushSize, setBrushSize] = useState<number>(
    cachedBoot.current?.brushSize ?? 3.5
  );
  const [depth3DIntensity, setDepth3DIntensity] = useState<number>(
    cachedBoot.current?.depth3DIntensity ?? 0.85
  );
  const [rainbowCycleMode, setRainbowCycleMode] = useState<boolean>(
    cachedBoot.current?.rainbowCycleMode ?? true
  );
  const [breathPatternId, setBreathPatternId] = useState<string>(
    cachedBoot.current?.breathPatternId ?? 'sama-vritti'
  );
  const [currentBreathPhase, setCurrentBreathPhase] =
    useState<BreathPhase>('inhale');

  // Scoring, Combo & HUD Telemetry
  const [totalScore, setTotalScore] = useState<number>(
    cachedBoot.current?.totalScore ?? 17890
  );
  const [stageScore, setStageScore] = useState<number>(0);
  const [bestStageScore, setBestStageScore] = useState<number>(
    cachedBoot.current?.bestStageScore ?? 5680
  );
  const [currentCombo, setCurrentCombo] = useState<number>(2);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1.3);
  const [masteryRank, setMasteryRank] = useState<MasteryRank>('S Siddha');
  const [resonance, setResonance] = useState<number>(
    cachedBoot.current?.resonance ?? 180
  );
  const [sessionResonance, setSessionResonance] = useState<number>(0);
  const [harmonyPercent, setHarmonyPercent] = useState<number>(
    cachedBoot.current?.harmonyPercent ?? 94
  );
  const [strokesInStage, setStrokesInStage] = useState<number>(
    cachedBoot.current?.cachedCanvasStrokes?.length || 3
  );
  const [cachedStrokes, setCachedStrokes] = useState<CachedStrokeRecord[]>(
    cachedBoot.current?.cachedCanvasStrokes ?? []
  );

  // Modals & Drawers
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isDesktopStudioCollapsed, setIsDesktopStudioCollapsed] =
    useState<boolean>(false);
  const [isMobileStudioOpen, setIsMobileStudioOpen] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  // Persistent Mindfulness History, Sankalpa, Gallery & Reminders
  const [sessions, setSessions] = useState<SessionRecord[]>(
    () => cachedBoot.current?.sessions ?? getInitialSeedSessions(todayISO)
  );
  const [sankalpa, setSankalpa] = useState<string>(
    cachedBoot.current?.sankalpa ??
      'May every breath anchor my attention in calm, compassionate presence.'
  );
  const [savedArtworks, setSavedArtworks] = useState<SavedArtwork[]>([]);
  const [reminder, setReminder] = useState<ReminderConfig>({
    enabled: true,
    timeHHMM: '20:30',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    breathRhythmId: 'sama-vritti',
  });

  const [runSnapshot, setRunSnapshot] = useState<RunSnapshot | null>(null);

  const canvasRef = useRef<MandalaCanvasHandle | null>(null);
  const breathRingRef = useRef<HTMLCanvasElement | null>(null);
  const breathTimerRef = useRef<HTMLSpanElement | null>(null);
  const isOnline = useOnlineStatus();

  const currentStage =
    SACRED_STAGES.find((s) => s.id === currentStageId) ?? SACRED_STAGES[0];
  const currentPalette =
    COLOR_PALETTES.find((p) => p.id === selectedPaletteId) ?? COLOR_PALETTES[0];
  const currentBreathPattern =
    BREATH_PATTERNS.find((b) => b.id === breathPatternId) ?? BREATH_PATTERNS[0];

  const streakInfo = calculateMindfulStreak(
    sessions.map((s) => s.dateISO),
    todayISO
  );
  const stageCompletion = calculateStageCompletion(
    strokesInStage,
    currentStage.targetStrokes
  );

  // Auto-save game state and canvas strokes to persistent local Game Cache
  const persistCurrentState = useCallback(
    (overrideStrokes?: CachedStrokeRecord[]) => {
      const liveStrokes =
        overrideStrokes ?? canvasRef.current?.getStrokes() ?? cachedStrokes;
      saveGameCache({
        version: 2,
        updatedAtISO: new Date().toISOString(),
        locale,
        isDark,
        lowPowerMode,
        depth3DIntensity,
        rainbowCycleMode,
        currentStageId,
        highestStageCleared,
        selectedPaletteId,
        selectedColor,
        selectedBrushStyle,
        brushSize,
        breathPatternId,
        totalScore,
        bestStageScore,
        resonance,
        harmonyPercent,
        sankalpa,
        sessions,
        cachedCanvasStrokes: liveStrokes,
      });
    },
    [
      cachedStrokes,
      locale,
      isDark,
      lowPowerMode,
      depth3DIntensity,
      rainbowCycleMode,
      currentStageId,
      highestStageCleared,
      selectedPaletteId,
      selectedColor,
      selectedBrushStyle,
      brushSize,
      breathPatternId,
      totalScore,
      bestStageScore,
      resonance,
      harmonyPercent,
      sankalpa,
      sessions,
    ]
  );

  useEffect(() => {
    persistCurrentState();
  }, [persistCurrentState]);

  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const startGameplay = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.dataset.state = 'playing';
    setGameState('playing');
    soundAndHaptics.playBreathPhaseChime(
      'inhale',
      currentBreathPattern.baseFrequencyHz
    );
  }, [currentBreathPattern.baseFrequencyHz]);

  const triggerStageAwakening = useCallback(
    (
      finalStrokes: number,
      finalHarmony: number,
      earnedRes: number,
      earnedStageScore: number
    ) => {
      const unlockedPal =
        COLOR_PALETTES.find((p) => p.id === currentStage.unlockedPaletteId) ??
        currentPalette;

      const stageBonus = Math.round(500 * currentStage.difficultyMultiplier);
      const finalRunScore = Math.max(850, earnedStageScore + stageBonus);
      const updatedTotalScore = totalScore + stageBonus;

      setTotalScore(updatedTotalScore);
      setBestStageScore((prev) => Math.max(prev, finalRunScore));

      setRunSnapshot({
        stageName: t(locale, currentStage.nameKey),
        sanskritName: currentStage.sanskritName,
        stageScoreEarned: finalRunScore,
        totalScore: updatedTotalScore,
        maxComboMultiplier: comboMultiplier,
        masteryRank,
        resonanceEarned: Math.max(24, earnedRes),
        harmonyAccuracy: finalHarmony,
        strokesHarmonized: finalStrokes,
        unlockedPaletteName: t(locale, unlockedPal.nameKey),
        teachingText: t(locale, currentStage.spiritualTeachingKey),
      });

      setHighestStageCleared((prev) => Math.max(prev, currentStage.id));
      setSessions((prev) => [
        ...prev,
        {
          id: `sess-${Date.now()}`,
          dateISO: todayISO,
          stageId: currentStage.id,
          durationSec: 360,
          resonanceScore: Math.max(24, earnedRes),
          totalScore: finalRunScore,
          harmonyPercent: finalHarmony,
          strokesCount: finalStrokes,
          breathCyclesCompleted: 18,
          paletteUsed: currentPalette.id,
        },
      ]);

      soundAndHaptics.playAwakeningChord();
      soundAndHaptics.triggerHapticPulse([40, 80, 120]);
      document.body.dataset.state = 'gameover';
      setGameState('gameover');
    },
    [
      currentStage,
      currentPalette,
      totalScore,
      comboMultiplier,
      masteryRank,
      locale,
      todayISO,
    ]
  );

  const handleStrokeComplete = useCallback(
    (metrics: {
      resonanceGain: number;
      scoreDelta: number;
      newCombo: number;
      comboMultiplier: number;
      harmonyAccuracy: number;
      masteryRank: MasteryRank;
      totalStrokes: number;
      strokesSnapshot: CachedStrokeRecord[];
    }) => {
      setResonance((prev) => prev + metrics.resonanceGain);
      setSessionResonance((prev) => prev + metrics.resonanceGain);
      setTotalScore((prev) => prev + metrics.scoreDelta);
      setStageScore((prev) => prev + metrics.scoreDelta);
      setCurrentCombo(metrics.newCombo);
      setComboMultiplier(metrics.comboMultiplier);
      setMasteryRank(metrics.masteryRank);
      setHarmonyPercent((prev) =>
        Math.round(prev * 0.65 + metrics.harmonyAccuracy * 0.35)
      );
      setStrokesInStage(metrics.totalStrokes);
      setCachedStrokes(metrics.strokesSnapshot);
    },
    []
  );

  const handleBreathPhaseChange = useCallback((phase: BreathPhase) => {
    setCurrentBreathPhase(phase);
    setHapticVisualPulse(true);
    setTimeout(() => setHapticVisualPulse(false), 380);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDashboardOpen || isVaultOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (gameState === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startGameplay();
        return;
      }

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (gameState === 'playing') {
          e.preventDefault();
          document.body.dataset.state = 'paused';
          setGameState('paused');
        } else if (gameState === 'paused') {
          e.preventDefault();
          document.body.dataset.state = 'playing';
          setGameState('playing');
        }
      } else if (e.key.toLowerCase() === 'm') {
        setIsMuted((prev) => {
          const next = !prev;
          soundAndHaptics.isMuted = next;
          return next;
        });
      } else if (e.key.toLowerCase() === 'r' && gameState === 'playing') {
        canvasRef.current?.triggerSandDissolve();
        setStrokesInStage(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isDashboardOpen, isVaultOpen, startGameplay]);

  const handleSaveArtwork = () => {
    const dataUrl = canvasRef.current?.exportDataUrl();
    if (!dataUrl) return;
    setSavedArtworks((prev) => [
      {
        id: `art-${Date.now()}`,
        title: `${currentStage.sanskritName} #${prev.length + 1}`,
        stageName: t(locale, currentStage.nameKey),
        dateISO: todayISO,
        harmonyPercent,
        dataUrl,
      },
      ...prev,
    ]);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  const handleSelectStage = (stageId: number) => {
    const target = SACRED_STAGES.find((s) => s.id === stageId);
    if (!target) return;
    if (!isStageUnlocked(target, highestStageCleared, resonance)) return;
    setCurrentStageId(stageId);
    setStrokesInStage(3);
    setSessionResonance(0);
    setStageScore(0);
    const matchingPalette = COLOR_PALETTES.find(
      (p) => p.id === target.unlockedPaletteId
    );
    if (
      matchingPalette &&
      isPaletteUnlocked(matchingPalette, highestStageCleared, resonance)
    ) {
      setSelectedPaletteId(matchingPalette.id);
      setSelectedColor(matchingPalette.colors[0]);
    }
  };

  const handleClearAllCache = () => {
    clearGameCache();
    setTotalScore(17890);
    setResonance(180);
    setCurrentStageId(1);
    setHighestStageCleared(3);
    canvasRef.current?.clearCanvas();
    setStrokesInStage(0);
  };

  const vaultPlaintextPayload = JSON.stringify({
    sankalpa,
    streakDays: streakInfo.currentStreak,
    totalScore,
    bestStageScore,
    resonance,
    highestStageCleared,
    currentStageId,
    selectedBrushStyle,
    depth3DIntensity,
    sessionsCount: sessions.length,
    reminderTime: reminder.timeHHMM,
  });

  const breathPhaseLabelKey =
    currentBreathPhase === 'inhale'
      ? 'breath.inhale'
      : currentBreathPhase === 'holdIn'
      ? 'breath.holdIn'
      : currentBreathPhase === 'exhale'
      ? 'breath.exhale'
      : 'breath.holdOut';

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#F8F5EE] dark:bg-[#070A12] text-stone-900 dark:text-stone-100">
      {/* Isolated 3D Sacred Geometry Mandala Canvas */}
      <MandalaCanvas
        ref={canvasRef}
        gameState={gameState}
        stage={currentStage}
        palette={currentPalette}
        selectedColor={selectedColor}
        brushStyle={selectedBrushStyle}
        brushSize={brushSize}
        depth3DIntensity={depth3DIntensity}
        rainbowCycleMode={rainbowCycleMode}
        currentCombo={currentCombo}
        breathPattern={currentBreathPattern}
        isDark={isDark}
        lowPowerMode={lowPowerMode}
        initialCachedStrokes={cachedStrokes}
        onStrokeComplete={handleStrokeComplete}
        onBreathPhaseChange={handleBreathPhaseChange}
        breathRingRef={breathRingRef}
        breathTimerRef={breathTimerRef}
      />

      {/* Offline Banner when disconnected */}
      {!isOnline && (
        <div
          role="status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-lg pointer-events-none"
        >
          {t(locale, 'offline.badge')}
        </div>
      )}

      {/* TITLE SCREEN STATE */}
      {gameState === 'title' && (
        <TitleScreen
          locale={locale}
          onLocaleChange={setLocale}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onStartGame={startGameplay}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onOpenVault={() => setIsVaultOpen(true)}
          streakDays={streakInfo.currentStreak}
          totalResonance={resonance}
        />
      )}

      {/* PLAYING HUD SHELL (Responsive across Mobile Portrait, Mobile/Tablet Landscape & PC Desktop) */}
      {gameState !== 'title' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2 sm:p-4">
          {/* Top Perimeter Row */}
          <div className="flex items-start justify-between gap-2">
            {/* Top-Left Telemetry & Multi-Factor Score Cluster */}
            <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-2 rounded-2xl border border-stone-300/80 dark:border-slate-800/90 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 shadow-lg overflow-x-auto max-w-[66vw] sm:max-w-none">
              <div className="shrink-0">
                <div className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-stone-500 dark:text-slate-400 uppercase">
                  {t(locale, 'hud.score')}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    data-testid="hud-score"
                    className="text-base sm:text-xl font-bold font-mono-tabular text-amber-600 dark:text-amber-400 leading-tight"
                  >
                    {Math.round(totalScore).toLocaleString()}
                  </span>
                  <span
                    data-testid="hud-combo"
                    className="text-[10px] sm:text-xs font-bold font-mono-tabular text-fuchsia-600 dark:text-fuchsia-400"
                  >
                    {comboMultiplier.toFixed(1)}x
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-stone-300/70 dark:bg-slate-800 shrink-0" />

              <div className="shrink-0">
                <div className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-stone-500 dark:text-slate-400 uppercase">
                  {t(locale, 'hud.resonance')}
                </div>
                <div
                  data-testid="hud-resonance"
                  className="text-base sm:text-xl font-bold font-mono-tabular text-sky-600 dark:text-sky-400 leading-tight"
                >
                  {Math.round(resonance)}
                </div>
              </div>

              <div className="hidden md:block h-6 w-px bg-stone-300/70 dark:bg-slate-800 shrink-0" />

              <div className="hidden md:block shrink-0">
                <div className="text-[10px] font-semibold tracking-wider text-stone-500 dark:text-slate-400 uppercase">
                  {t(locale, 'hud.harmony')}
                </div>
                <div
                  data-testid="hud-harmony"
                  className="text-xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 leading-tight"
                >
                  {Math.round(harmonyPercent)}%
                </div>
              </div>

              <div className="h-6 w-px bg-stone-300/70 dark:bg-slate-800 shrink-0" />

              <div className="shrink-0">
                <div className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-stone-500 dark:text-slate-400 uppercase">
                  {t(locale, 'hud.stageProgress')}
                </div>
                <div
                  data-testid="hud-completion"
                  className="text-base sm:text-xl font-bold font-mono-tabular text-stone-900 dark:text-white leading-tight"
                >
                  {stageCompletion}%
                </div>
              </div>
            </div>

            {/* Top-Center Live Pranayama Breath & Haptic Rhythm Guide */}
            <div className="pointer-events-auto hidden xl:flex items-center gap-3 px-4 py-2 rounded-2xl border border-stone-300/80 dark:border-slate-800/90 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 shadow-lg">
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                <canvas
                  ref={breathRingRef}
                  width={36}
                  height={36}
                  aria-hidden="true"
                  className="w-9 h-9 block"
                />
                <span
                  ref={breathTimerRef}
                  className="absolute text-[10px] font-bold font-mono-tabular text-stone-900 dark:text-white"
                >
                  4s
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    {t(locale, breathPhaseLabelKey)}
                  </span>
                  <span
                    title="Haptic Rhythm Pulse Active"
                    className={`inline-flex items-center gap-1 text-[10px] font-mono-tabular px-1.5 py-0.5 rounded ${
                      hapticVisualPulse
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    <Vibrate className="w-3 h-3" />
                    <span>{masteryRank}</span>
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-slate-400">
                  {t(locale, currentStage.nameKey)} ·{' '}
                  {t(locale, currentStage.geometryPrincipleKey)}
                </div>
              </div>
            </div>

            {/* Top-Right Compact Utility Controls */}
            <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5">
              <div className="hidden lg:block">
                <PWAInstallButton />
              </div>

              <button
                type="button"
                data-testid="open-dashboard-btn"
                onClick={() => setIsDashboardOpen(true)}
                aria-label={t(locale, 'title.dashboardBtn')}
                className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-300/80 dark:border-slate-800 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 hover:border-amber-500 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="hidden md:inline">
                  {t(locale, 'title.dashboardBtn')}
                </span>
              </button>

              <button
                type="button"
                data-testid="open-vault-btn"
                onClick={() => setIsVaultOpen(true)}
                aria-label={t(locale, 'title.vaultBtn')}
                className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-300/80 dark:border-slate-800 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 hover:border-emerald-500 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="hidden 2xl:inline">
                  {t(locale, 'title.vaultBtn')}
                </span>
              </button>

              <div className="relative hidden sm:flex items-center">
                <Globe className="w-3.5 h-3.5 text-amber-500 absolute left-2 pointer-events-none" />
                <select
                  aria-label="Language"
                  value={locale}
                  onChange={(e) =>
                    setLocale(e.target.value as SupportedLocale)
                  }
                  className="min-h-[40px] pl-6 pr-2 py-1.5 rounded-xl border border-stone-300/80 dark:border-slate-800 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 text-xs font-semibold shadow-md cursor-pointer"
                >
                  {LOCALE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                tabIndex={-1}
                aria-label={isDark ? 'Light Theme' : 'Dark Theme'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setIsDark((d) => !d);
                }}
                className="min-h-[40px] min-w-[40px] rounded-xl border border-stone-300/80 dark:border-slate-800 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 hover:border-amber-500 flex items-center justify-center shadow-md transition-colors cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-700" />
                )}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setIsMuted((prev) => {
                    const next = !prev;
                    soundAndHaptics.isMuted = next;
                    return next;
                  });
                }}
                className="hidden sm:flex min-h-[40px] min-w-[40px] rounded-xl border border-stone-300/80 dark:border-slate-800 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 hover:border-amber-500 items-center justify-center shadow-md transition-colors cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                )}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Dissolve & Reset Mandala [R]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  canvasRef.current?.triggerSandDissolve();
                  setStrokesInStage(0);
                }}
                className="min-h-[40px] min-w-[40px] rounded-xl border border-stone-300/80 dark:border-slate-800 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 hover:border-amber-500 flex items-center justify-center shadow-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Pause Session [P]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  document.body.dataset.state = 'paused';
                  setGameState('paused');
                }}
                className="min-h-[40px] min-w-[40px] rounded-xl border border-stone-300/80 dark:border-slate-800 bg-[#F8F5EE]/94 dark:bg-[#0F1523]/94 hover:border-amber-500 flex items-center justify-center shadow-md transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Left-Edge Floating 3D Studio Pod (Docked on Left Perimeter on Desktop lg+, Popover above Dock on Mobile/Tablet) */}
          <aside
            aria-label="3D Sacred Studio Controls"
            data-testid="studio-side-pod"
            className={`pointer-events-auto z-20 rounded-2xl border border-stone-300/85 dark:border-slate-800/95 bg-[#F8F5EE]/95 dark:bg-[#0F1523]/95 p-3 shadow-2xl flex-col gap-2.5 fixed max-lg:bottom-16 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:w-[min(92vw,320px)] lg:left-4 lg:top-1/2 lg:-translate-y-1/2 lg:w-56 ${
              isMobileStudioOpen ? 'flex' : 'hidden'
            } ${!isDesktopStudioCollapsed ? 'lg:flex' : 'lg:hidden'}`}
          >
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span>3D Studio</span>
              </div>
              <button
                type="button"
                aria-label="Close Studio Controls"
                onClick={() => {
                  setIsMobileStudioOpen(false);
                  setIsDesktopStudioCollapsed(true);
                }}
                className="w-6 h-6 rounded-lg hover:bg-stone-200/70 dark:hover:bg-slate-800 flex items-center justify-center text-stone-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 1. 10 Sacred Stages Selector */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="dock-stage-select"
                className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400"
              >
                {t(locale, 'dock.stage')} ({currentStage.symmetryFold}x)
              </label>
              <select
                id="dock-stage-select"
                aria-label={t(locale, 'dock.stage')}
                value={currentStageId}
                onChange={(e) => handleSelectStage(Number(e.target.value))}
                className="w-full min-h-[34px] px-2.5 py-1 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
              >
                {SACRED_STAGES.map((stg) => {
                  const unlocked = isStageUnlocked(
                    stg,
                    highestStageCleared,
                    resonance
                  );
                  return (
                    <option key={stg.id} value={stg.id} disabled={!unlocked}>
                      {t(locale, stg.nameKey)} ({stg.symmetryFold}x)
                      {!unlocked
                        ? ` · Lock (${stg.minResonanceToUnlock} Res)`
                        : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. 6 3D Brush Styles Selector */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="dock-brush-style-select"
                className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400"
              >
                {t(locale, 'dock.brushStyle')}
              </label>
              <select
                id="dock-brush-style-select"
                aria-label={t(locale, 'dock.brushStyle')}
                value={selectedBrushStyle}
                onChange={(e) =>
                  setSelectedBrushStyle(e.target.value as BrushStyleId)
                }
                className="w-full min-h-[34px] px-2.5 py-1 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
              >
                {BRUSH_STYLES.map((bs) => (
                  <option key={bs.id} value={bs.id}>
                    {t(locale, bs.nameKey)} ({bs.scoreBonusMultiplier}x)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. 10 Color Palettes Selector */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="dock-palette-select"
                className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400"
              >
                {t(locale, 'dock.palette')}
              </label>
              <select
                id="dock-palette-select"
                aria-label={t(locale, 'dock.palette')}
                value={selectedPaletteId}
                onChange={(e) => {
                  const pid = e.target.value;
                  const pal = COLOR_PALETTES.find((p) => p.id === pid);
                  if (pal) {
                    setSelectedPaletteId(pid);
                    setSelectedColor(pal.colors[0]);
                  }
                }}
                className="w-full min-h-[34px] px-2.5 py-1 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
              >
                {COLOR_PALETTES.map((pal) => {
                  const unlocked = isPaletteUnlocked(
                    pal,
                    highestStageCleared,
                    resonance
                  );
                  return (
                    <option key={pal.id} value={pal.id} disabled={!unlocked}>
                      {t(locale, pal.nameKey)}
                      {!unlocked ? ' (Locked)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 4. Pranayama Breath Rhythm Selector */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="dock-breath-select"
                className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400"
              >
                {t(locale, 'dock.breath')}
              </label>
              <select
                id="dock-breath-select"
                aria-label={t(locale, 'dock.breath')}
                value={breathPatternId}
                onChange={(e) => setBreathPatternId(e.target.value)}
                className="w-full min-h-[34px] px-2.5 py-1 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
              >
                {BREATH_PATTERNS.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {t(locale, bp.nameKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. 3D Depth Slider */}
            <div className="flex flex-col gap-1 pt-0.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="depth-3d-slider"
                  className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1"
                >
                  <Layers className="w-3 h-3 text-amber-500" />
                  <span>{t(locale, 'dock.depth3d')}</span>
                </label>
                <span className="text-[11px] font-bold font-mono-tabular text-amber-600 dark:text-amber-400">
                  {Math.round(depth3DIntensity * 100)}%
                </span>
              </div>
              <input
                id="depth-3d-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={depth3DIntensity}
                onChange={(e) => setDepth3DIntensity(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </aside>

          {/* Compact Bottom-Center Floating Swatch & Action Pill (w-fit mx-auto — never stretches across screen) */}
          <div
            data-testid="bottom-compact-dock"
            className="pointer-events-auto mx-auto w-fit max-w-[96vw] rounded-2xl border border-stone-300/85 dark:border-slate-800/95 bg-[#F8F5EE]/95 dark:bg-[#0F1523]/95 px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-2xl flex items-center gap-1.5 sm:gap-2.5"
          >
            {/* Studio Pod Toggle Button (toggles Left Pod on Desktop or Popover on Mobile/Tablet) */}
            <button
              type="button"
              data-testid="toggle-studio-pod-btn"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setIsMobileStudioOpen((prev) => !prev);
                } else {
                  setIsDesktopStudioCollapsed((prev) => !prev);
                }
              }}
              aria-label="Toggle 3D Studio Controls"
              className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isMobileStudioOpen || !isDesktopStudioCollapsed
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                  : 'border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Studio</span>
              <span className="text-[10px] font-mono-tabular px-1 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {currentStage.symmetryFold}x
              </span>
            </button>

            <div className="h-5 w-px bg-stone-300/70 dark:bg-slate-800 shrink-0" />

            {/* Active 6 Color Swatches + Rainbow Cycle Toggle */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <div className="flex items-center gap-1">
                {currentPalette.colors.map((hex, idx) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Select Color Swatch ${idx + 1}`}
                    onClick={() => {
                      setSelectedColor(hex);
                      setRainbowCycleMode(false);
                    }}
                    className={`w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 rounded-full border-2 transition-transform cursor-pointer ${
                      selectedColor === hex && !rainbowCycleMode
                        ? 'scale-110 border-stone-900 dark:border-white shadow-md'
                        : 'border-transparent opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setRainbowCycleMode((r) => !r)}
                aria-label={t(locale, 'dock.rainbow')}
                title={t(locale, 'dock.rainbow')}
                className={`min-h-[34px] px-2 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  rainbowCycleMode
                    ? 'border-fuchsia-500/60 bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-200'
                    : 'border-stone-300 dark:border-slate-700 text-stone-600 dark:text-slate-400'
                }`}
              >
                <PaletteIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">
                  {t(locale, 'dock.rainbow')}
                </span>
              </button>
            </div>

            <div className="h-5 w-px bg-stone-300/70 dark:bg-slate-800 shrink-0" />

            {/* Compact Action Buttons: Weave, Undo, Save, Complete */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                data-testid="weave-ring-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  canvasRef.current?.weaveHarmoniousRing();
                }}
                aria-label="Weave Sacred Ring"
                title="Weave Sacred Ring"
                className="min-h-[36px] px-2.5 py-1 rounded-xl border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Weave</span>
              </button>

              <button
                type="button"
                data-testid="undo-stroke-btn"
                onClick={() => canvasRef.current?.undoStroke()}
                aria-label={t(locale, 'dock.undoBtn')}
                title={t(locale, 'dock.undoBtn')}
                className="min-h-[36px] min-w-[34px] px-2 py-1 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                data-testid="save-artwork-btn"
                onClick={handleSaveArtwork}
                aria-label={t(locale, 'dock.saveBtn')}
                title={t(locale, 'dock.saveBtn')}
                className="min-h-[36px] min-w-[34px] px-2 py-1 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {savedToast ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                data-testid="complete-stage-btn"
                onClick={() =>
                  triggerStageAwakening(
                    strokesInStage,
                    harmonyPercent,
                    sessionResonance || 48,
                    stageScore || 1200
                  )
                }
                aria-label={t(locale, 'dock.completeBtn')}
                className="min-h-[36px] px-2.5 sm:px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Bless</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSED STATUS MODAL */}
      {gameState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
        >
          <div className="w-full max-w-md rounded-2xl border border-stone-300 dark:border-slate-800 bg-[#F8F5EE] dark:bg-[#0F1523] p-6 text-stone-900 dark:text-white shadow-2xl">
            <h2
              id="pause-modal-title"
              className="text-xl font-bold font-display text-center"
            >
              {t(locale, 'modal.pause.title')}
            </h2>
            <p className="text-xs text-stone-600 dark:text-slate-400 text-center mt-1.5">
              {t(locale, 'modal.pause.subtitle')}
            </p>

            <div className="grid grid-cols-3 gap-2.5 my-5">
              <div className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-center">
                <div className="text-[10px] text-stone-500 dark:text-slate-400 uppercase">
                  {t(locale, 'hud.score')}
                </div>
                <div className="text-base font-bold font-mono-tabular text-amber-600 dark:text-amber-400 mt-0.5">
                  {Math.round(totalScore).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-center">
                <div className="text-[10px] text-stone-500 dark:text-slate-400 uppercase">
                  {t(locale, 'hud.harmony')}
                </div>
                <div className="text-base font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {Math.round(harmonyPercent)}%
                </div>
              </div>
              <div className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-center">
                <div className="text-[10px] text-stone-500 dark:text-slate-400 uppercase">
                  {t(locale, 'hud.combo')}
                </div>
                <div className="text-base font-bold font-mono-tabular text-fuchsia-600 dark:text-fuchsia-400 mt-0.5">
                  {comboMultiplier.toFixed(1)}x
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  document.body.dataset.state = 'playing';
                  setGameState('playing');
                }}
                className="w-full min-h-[46px] rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t(locale, 'modal.pause.resume')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  canvasRef.current?.clearCanvas();
                  setStrokesInStage(0);
                  document.body.dataset.state = 'playing';
                  setGameState('playing');
                }}
                className="w-full min-h-[44px] rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t(locale, 'modal.pause.restart')}
              </button>

              <button
                type="button"
                onClick={() => {
                  document.body.dataset.state = 'title';
                  setGameState('title');
                }}
                className="w-full min-h-[44px] rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-xs font-medium text-stone-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                {t(locale, 'modal.pause.titleScreen')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / STAGE CLEAR ('gameover') STATUS MODAL */}
      {gameState === 'gameover' && runSnapshot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="victory-modal-title"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-[#F8F5EE] dark:bg-[#0F1523] p-6 sm:p-7 text-stone-900 dark:text-white shadow-2xl">
            <div className="text-center">
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {runSnapshot.sanskritName} · {runSnapshot.masteryRank}
              </div>
              <h2
                id="victory-modal-title"
                className="text-2xl font-bold font-display mt-1"
              >
                {t(locale, 'modal.victory.title')}
              </h2>
              <p className="text-xs text-stone-600 dark:text-slate-300 mt-1">
                {t(locale, 'modal.victory.subtitle')}
              </p>
            </div>

            {/* 3 Tabular-Nums Mastery Metric Tiles */}
            <div className="grid grid-cols-3 gap-3 my-5">
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-center">
                <div className="text-[10px] text-stone-500 dark:text-slate-400 uppercase">
                  Stage Score
                </div>
                <div className="text-xl font-bold font-mono-tabular text-amber-600 dark:text-amber-400 mt-1">
                  +{runSnapshot.stageScoreEarned.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-center">
                <div className="text-[10px] text-stone-500 dark:text-slate-400 uppercase">
                  {t(locale, 'hud.harmony')}
                </div>
                <div className="text-xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 mt-1">
                  {runSnapshot.harmonyAccuracy}%
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-center">
                <div className="text-[10px] text-stone-500 dark:text-slate-400 uppercase">
                  Peak Combo
                </div>
                <div className="text-xl font-bold font-mono-tabular text-fuchsia-600 dark:text-fuchsia-400 mt-1">
                  {runSnapshot.maxComboMultiplier.toFixed(1)}x
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-stone-700 dark:text-slate-200 leading-relaxed mb-5">
              <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                Contemplative Insight · Awakened Palette: {runSnapshot.unlockedPaletteName}
              </div>
              <p>{runSnapshot.teachingText}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-start="true"
                onClick={(e) => {
                  e.currentTarget.blur();
                  const nextId =
                    currentStageId < SACRED_STAGES.length
                      ? currentStageId + 1
                      : 1;
                  handleSelectStage(nextId);
                  document.body.dataset.state = 'playing';
                  setGameState('playing');
                }}
                className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t(locale, 'modal.victory.nextStage')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  document.body.dataset.state = 'playing';
                  setGameState('playing');
                }}
                className="min-h-[46px] px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t(locale, 'modal.victory.replay')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS, SCORING & 10-STAGE CURRICULUM DASHBOARD MODAL */}
      <DashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        locale={locale}
        sessions={sessions}
        currentStreak={streakInfo.currentStreak}
        longestStreak={streakInfo.longestStreak}
        totalScore={totalScore}
        bestStageScore={bestStageScore}
        totalResonance={resonance}
        highestStageCleared={highestStageCleared}
        savedArtworks={savedArtworks}
        sankalpa={sankalpa}
        onUpdateSankalpa={setSankalpa}
        onSelectStageAndPlay={(stageId) => {
          handleSelectStage(stageId);
          startGameplay();
        }}
      />

      {/* GAME CACHE, DAILY REMINDERS & E2EE PRIVACY VAULT MODAL */}
      <SettingsVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        locale={locale}
        reminder={reminder}
        onUpdateReminder={setReminder}
        lowPowerMode={lowPowerMode}
        onToggleLowPowerMode={setLowPowerMode}
        vaultPlaintextPayload={vaultPlaintextPayload}
        onForceSaveCache={() => persistCurrentState()}
        onClearAllCache={handleClearAllCache}
      />
    </main>
  );
}
