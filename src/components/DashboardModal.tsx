import React, { useState } from 'react';
import {
  X,
  Flame,
  Clock,
  Activity,
  Palette,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Play,
  Trophy,
} from 'lucide-react';
import {
  BRUSH_STYLES,
  COLOR_PALETTES,
  SACRED_STAGES,
  SessionRecord,
  isPaletteUnlocked,
} from '../game/rules';
import {
  MECHANIC_IDEAS_BY_LOCALE,
  SupportedLocale,
  t,
} from '../i18n/translations';

export interface SavedArtwork {
  id: string;
  title: string;
  stageName: string;
  dateISO: string;
  harmonyPercent: number;
  dataUrl: string;
}

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: SupportedLocale;
  sessions: SessionRecord[];
  currentStreak: number;
  longestStreak: number;
  totalScore: number;
  bestStageScore: number;
  totalResonance: number;
  highestStageCleared: number;
  savedArtworks: SavedArtwork[];
  sankalpa: string;
  onUpdateSankalpa: (val: string) => void;
  onSelectStageAndPlay: (stageId: number) => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  locale,
  sessions,
  currentStreak,
  longestStreak,
  totalScore,
  bestStageScore,
  totalResonance,
  highestStageCleared,
  savedArtworks,
  sankalpa,
  onUpdateSankalpa,
  onSelectStageAndPlay,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mechanics' | 'gallery'>('overview');
  const [sankalpaDraft, setSankalpaDraft] = useState(sankalpa);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSec, 0);
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const avgHarmony =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.harmonyPercent, 0) / sessions.length
        )
      : 94;

  const unlockedPalettesCount = COLOR_PALETTES.filter((p) =>
    isPaletteUnlocked(p, highestStageCleared, totalResonance)
  ).length;

  const mechanicsList =
    MECHANIC_IDEAS_BY_LOCALE[locale] ?? MECHANIC_IDEAS_BY_LOCALE.en;

  const handleSaveSankalpa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sankalpaDraft.trim()) return;
    onUpdateSankalpa(sankalpaDraft.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-5 pointer-events-auto"
    >
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-stone-300 dark:border-slate-800 bg-[#F8F5EE] dark:bg-[#0F1523] text-stone-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-slate-800 shrink-0">
          <div>
            <h2
              id="dashboard-modal-title"
              className="text-base sm:text-xl font-bold font-display text-stone-900 dark:text-white"
            >
              {t(locale, 'dashboard.title')}
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              10 Progressive 3D Sacred Stages · Multi-Factor Combo Scoring · 10 Palettes · 6 3D Brushes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(locale, 'close')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-stone-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>{t(locale, 'dashboard.tab.overview')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mechanics')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'mechanics'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>{t(locale, 'dashboard.tab.mechanics')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>
              {t(locale, 'dashboard.tab.gallery')} ({savedArtworks.length})
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <>
              {/* 5-Column Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                    <span>{t(locale, 'hud.score')}</span>
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-amber-600 dark:text-amber-400">
                    {totalScore.toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-stone-500 dark:text-slate-400 font-mono-tabular">
                    Best Run: {bestStageScore.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                    <span>{t(locale, 'dashboard.metric.streak')}</span>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-stone-900 dark:text-white">
                    {currentStreak} {t(locale, 'hud.days')}
                  </div>
                  <div className="mt-1 text-[11px] text-stone-500 dark:text-slate-400">
                    Best: {longestStreak} {t(locale, 'hud.days')} · Active
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                    <span>{t(locale, 'dashboard.metric.minutes')}</span>
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-stone-900 dark:text-white">
                    {totalMinutes} min
                  </div>
                  <div className="mt-1 text-[11px] text-stone-500 dark:text-slate-400">
                    {sessions.length} Sessions Cached
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                    <span>{t(locale, 'dashboard.metric.harmony')}</span>
                    <Sparkles className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400">
                    {avgHarmony}%
                  </div>
                  <div className="mt-1 text-[11px] text-stone-500 dark:text-slate-400 font-mono-tabular">
                    Resonance: {totalResonance}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                    <span>{t(locale, 'dashboard.metric.unlocked')}</span>
                    <Palette className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-stone-900 dark:text-white">
                    {unlockedPalettesCount} / {COLOR_PALETTES.length}
                  </div>
                  <div className="mt-1 text-[11px] text-stone-500 dark:text-slate-400">
                    {BRUSH_STYLES.length} 3D Brushes Ready
                  </div>
                </div>
              </div>

              {/* Sankalpa (Mindful Intention) Form */}
              <form
                onSubmit={handleSaveSankalpa}
                className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3"
              >
                <div className="flex-1">
                  <label
                    htmlFor="sankalpa-input"
                    className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1"
                  >
                    Personal Sankalpa (Daily Meditative Intention · Cached & E2EE Protected)
                  </label>
                  <input
                    id="sankalpa-input"
                    type="text"
                    required
                    value={sankalpaDraft}
                    onChange={(e) => setSankalpaDraft(e.target.value)}
                    placeholder="Enter your mindful intention..."
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#F8F5EE] dark:bg-slate-950 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  {savedNotice ? 'Intention Saved' : 'Save Intention'}
                </button>
              </form>

              {/* 10 Progressive 3D Sacred Geometry Stages & Palettes */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">
                  10-Stage Progressive 3D Sacred Geometry Curriculum & Chromatic Palettes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {SACRED_STAGES.map((stg) => {
                    const pal =
                      COLOR_PALETTES.find((p) => p.id === stg.unlockedPaletteId) ??
                      COLOR_PALETTES[0];
                    const unlocked =
                      stg.id === 1 ||
                      highestStageCleared >= stg.id - 1 ||
                      totalResonance >= stg.minResonanceToUnlock;

                    return (
                      <div
                        key={stg.id}
                        className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between ${
                          unlocked
                            ? 'border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90'
                            : 'border-stone-200/60 dark:border-slate-800/50 bg-stone-100/50 dark:bg-slate-900/40 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 mb-1">
                            <span className="truncate">{stg.sanskritName}</span>
                            <span className="font-mono-tabular text-amber-600 dark:text-amber-400 font-semibold shrink-0 ml-1">
                              {stg.symmetryFold}x · {stg.difficultyMultiplier}x Score
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                            {t(locale, stg.nameKey)}
                          </h4>
                          <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {t(locale, stg.spiritualTeachingKey)}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-stone-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            {pal.colors.slice(0, 5).map((hex) => (
                              <span
                                key={hex}
                                className="w-3 h-3 rounded-full border border-black/20"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            disabled={!unlocked}
                            onClick={() => {
                              onSelectStageAndPlay(stg.id);
                              onClose();
                            }}
                            className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                              unlocked
                                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                                : 'bg-stone-300 dark:bg-slate-800 text-stone-500 dark:text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>
                              {unlocked
                                ? 'Enter'
                                : `${stg.minResonanceToUnlock} Res`}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'mechanics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mechanicsList.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-mono-tabular text-amber-600 dark:text-amber-400 font-semibold">
                        {item.number}. {item.subtitle}
                      </div>
                      <h3 className="text-base font-bold text-stone-900 dark:text-white mt-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-slate-300 mt-2 leading-relaxed">
                        <strong className="text-stone-900 dark:text-slate-100">
                          Spiritual Core:
                        </strong>{' '}
                        {item.spiritualCore}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-slate-300 mt-2 leading-relaxed">
                        <strong className="text-stone-900 dark:text-slate-100">
                          Interactive Mechanic:
                        </strong>{' '}
                        {item.gameplayLoop}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
              {savedArtworks.length === 0 ? (
                <div className="p-10 text-center rounded-xl border border-stone-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50">
                  <p className="text-sm font-medium text-stone-700 dark:text-slate-300">
                    No mandalas saved yet in this session.
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                    While sculpting in the 3D Sacred Geometry Studio, click "Save Art" in the bottom dock to preserve your mandala here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {savedArtworks.map((art) => (
                    <div
                      key={art.id}
                      className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                    >
                      <img
                        src={art.dataUrl}
                        alt={art.title}
                        referrerPolicy="no-referrer"
                        className="w-full aspect-square object-cover bg-[#070A12]"
                      />
                      <div className="p-3.5">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                          {art.title}
                        </h4>
                        <div className="mt-1 flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 font-mono-tabular">
                          <span>{art.stageName}</span>
                          <span>{art.harmonyPercent}% Harmony</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
