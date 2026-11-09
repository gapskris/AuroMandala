import React from 'react';
import { Moon, Sun, Globe, Compass, ShieldCheck, Play } from 'lucide-react';
import { LOCALE_OPTIONS, SupportedLocale, t } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  locale: SupportedLocale;
  onLocaleChange: (loc: SupportedLocale) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onStartGame: () => void;
  onOpenDashboard: () => void;
  onOpenVault: () => void;
  streakDays: number;
  totalResonance: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  locale,
  onLocaleChange,
  isDark,
  onToggleTheme,
  onStartGame,
  onOpenDashboard,
  onOpenVault,
  streakDays,
  totalResonance,
}) => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-10 lg:p-12">
      {/* Top Utility Row: Language, Theme, and PWA Install */}
      <div className="flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-3 text-xs font-medium text-stone-600 dark:text-slate-400">
          <span className="font-mono-tabular text-amber-600 dark:text-amber-400 font-semibold">
            {streakDays} {t(locale, 'hud.days')} {t(locale, 'hud.streak')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">
            {totalResonance} {t(locale, 'hud.resonance')}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <PWAInstallButton />

          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 absolute left-3 pointer-events-none" />
            <select
              aria-label="Select Language"
              value={locale}
              onChange={(e) => onLocaleChange(e.target.value as SupportedLocale)}
              className="min-h-[40px] pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#F8F5EE]/95 dark:bg-[#111726]/95 text-stone-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.nativeName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="min-h-[40px] min-w-[40px] px-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#F8F5EE]/95 dark:bg-[#111726]/95 text-stone-800 dark:text-slate-200 hover:border-amber-500/60 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Asymmetric Negative-Space Title Lockup & Menu Actions */}
      <div className="my-auto max-w-xl pointer-events-auto">
        <div className="p-6 sm:p-8 rounded-2xl border border-stone-300/80 dark:border-slate-800/90 bg-[#F8F5EE]/92 dark:bg-[#0B0F19]/90 shadow-2xl">
          {/* Custom Inline SVG Title Emblem Lockup */}
          <div className="flex items-center gap-4 mb-4">
            <svg
              viewBox="0 0 64 64"
              className="w-14 h-14 shrink-0"
              aria-hidden="true"
            >
              <circle
                cx="32"
                cy="32"
                r="29"
                fill="none"
                stroke="#D97706"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx="32"
                cy="32"
                r="21"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.75"
              />
              <g stroke="#10B981" strokeWidth="1.4" fill="none" opacity="0.9">
                <ellipse cx="32" cy="32" rx="19" ry="7.5" />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="19"
                  ry="7.5"
                  transform="rotate(45 32 32)"
                />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="19"
                  ry="7.5"
                  transform="rotate(90 32 32)"
                />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="19"
                  ry="7.5"
                  transform="rotate(135 32 32)"
                />
              </g>
              <polygon
                points="32,14 47,40 17,40"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="1.4"
              />
              <polygon
                points="32,50 47,24 17,24"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="1.4"
              />
              <circle cx="32" cy="32" r="4" fill="#F59E0B" />
            </svg>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display text-stone-900 dark:text-stone-100 text-balance">
                {t(locale, 'app.title')}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                {t(locale, 'app.subtitle')}
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-stone-700 dark:text-slate-300 leading-relaxed mb-6">
            {t(locale, 'title.tagline')}
          </p>

          {/* <= 3 Menu Actions as required by game_title_and_hud.md */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartGame();
              }}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-600/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>{t(locale, 'title.startBtn')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenDashboard}
              className="min-h-[48px] px-4 py-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-100/90 dark:bg-slate-900/90 hover:border-amber-500/60 text-stone-800 dark:text-slate-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t(locale, 'title.dashboardBtn')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenVault}
              className="min-h-[48px] px-4 py-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-100/90 dark:bg-slate-900/90 hover:border-emerald-500/60 text-stone-800 dark:text-slate-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t(locale, 'title.vaultBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Flat Borderless Control Hint Line in Bottom Safe Margin */}
      <div className="text-xs text-stone-600 dark:text-slate-400 font-medium tracking-wide">
        {t(locale, 'title.controlsHint')}
      </div>
    </div>
  );
};
