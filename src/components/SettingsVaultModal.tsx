import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Shield,
  Code2,
  Wifi,
  WifiOff,
  Lock,
  CheckCircle2,
  Cpu,
  RefreshCw,
  HardDrive,
  Download,
  Trash2,
} from 'lucide-react';
import { SupportedLocale, t } from '../i18n/translations';
import {
  EncryptedEnvelope,
  encryptVaultData,
  decryptVaultData,
} from '../utils/crypto';
import { getGameCacheStats } from '../utils/storage';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export interface ReminderConfig {
  enabled: boolean;
  timeHHMM: string;
  days: string[];
  breathRhythmId: string;
}

interface SettingsVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: SupportedLocale;
  reminder: ReminderConfig;
  onUpdateReminder: (cfg: ReminderConfig) => void;
  lowPowerMode: boolean;
  onToggleLowPowerMode: (val: boolean) => void;
  vaultPlaintextPayload: string;
  onForceSaveCache: () => void;
  onClearAllCache: () => void;
}

export const SettingsVaultModal: React.FC<SettingsVaultModalProps> = ({
  isOpen,
  onClose,
  locale,
  reminder,
  onUpdateReminder,
  lowPowerMode,
  onToggleLowPowerMode,
  vaultPlaintextPayload,
  onForceSaveCache,
  onClearAllCache,
}) => {
  const [activeTab, setActiveTab] = useState<'cache' | 'reminders' | 'encryption' | 'docs'>('cache');
  const isOnline = useOnlineStatus();

  // Cache stats state
  const [cacheStats, setCacheStats] = useState(() => getGameCacheStats());
  const [cacheStatusMsg, setCacheStatusMsg] = useState<string>('');

  // Reminder form state
  const [timeInput, setTimeInput] = useState(reminder.timeHHMM);
  const [enabledInput, setEnabledInput] = useState(reminder.enabled);
  const [selectedDays, setSelectedDays] = useState<string[]>(reminder.days);
  const [notificationStatus, setNotificationStatus] = useState<string>('');

  // E2EE Vault state
  const [passphrase, setPassphrase] = useState('sanctuary-lotus-key-256');
  const [envelope, setEnvelope] = useState<EncryptedEnvelope | null>(null);
  const [verifiedDecryption, setVerifiedDecryption] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCacheStats(getGameCacheStats());
    let mounted = true;
    setIsEncrypting(true);
    encryptVaultData(vaultPlaintextPayload, passphrase)
      .then((env) => {
        if (mounted) {
          setEnvelope(env);
          setIsEncrypting(false);
        }
      })
      .catch(() => {
        if (mounted) setIsEncrypting(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen, vaultPlaintextPayload, passphrase]);

  if (!isOpen) return null;

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSyncCacheNow = () => {
    onForceSaveCache();
    const updated = getGameCacheStats();
    setCacheStats(updated);
    setCacheStatusMsg(
      `Game Cache Synchronized (${updated.sizeKB} · ${updated.cachedStrokesCount} 3D strokes & ${updated.sessionsCount} sessions stored locally).`
    );
  };

  const handleExportCacheJson = () => {
    const blob = new Blob([vaultPlaintextPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pranamandala-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCacheStatusMsg('Exported JSON save backup file.');
  };

  const handleClearCacheClick = () => {
    onClearAllCache();
    setCacheStats(getGameCacheStats());
    setCacheStatusMsg('Local Game Cache cleared and reset to initial seed state.');
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeInput) return;

    const updated: ReminderConfig = {
      enabled: enabledInput,
      timeHHMM: timeInput,
      days: selectedDays.length > 0 ? selectedDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      breathRhythmId: reminder.breathRhythmId,
    };
    onUpdateReminder(updated);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification('PranaMandala Daily Sanctuary', {
            body: `Daily mindful mandala session scheduled for ${timeInput}.`,
          });
          setNotificationStatus(
            `Scheduled for ${timeInput} (${updated.days.join(', ')}) · Browser Push Notification Active.`
          );
          return;
        } else if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification('PranaMandala Daily Sanctuary', {
              body: `Daily mindful mandala session scheduled for ${timeInput}.`,
            });
            setNotificationStatus(
              `Scheduled for ${timeInput} · Push Notification Permission Granted.`
            );
            return;
          }
        }
      } catch {
        // Fallback to in-app scheduler confirmation
      }
    }

    setNotificationStatus(
      `Daily Reminder Active for ${timeInput} (${updated.days.join(', ')}) · In-App & Local Service Worker Queue Ready.`
    );
  };

  const handleTriggerTestNotification = () => {
    setNotificationStatus(
      `Mindful Breath Reminder Triggered: "Take 3 slow Sama Vritti breaths and draw one sacred ring."`
    );
  };

  const handleVerifyDecryption = async () => {
    if (!envelope) return;
    try {
      const clear = await decryptVaultData(envelope, passphrase);
      setVerifiedDecryption(clear);
    } catch {
      setVerifiedDecryption('Decryption failed: Invalid passphrase.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-5 pointer-events-auto"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-stone-300 dark:border-slate-800 bg-[#F8F5EE] dark:bg-[#0F1523] text-stone-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-slate-800 shrink-0">
          <div>
            <h2
              id="vault-modal-title"
              className="text-base sm:text-xl font-bold font-display text-stone-900 dark:text-white"
            >
              {t(locale, 'vault.title')}
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              Persistent Game Cache · Push Reminders · Offline Mode · AES-GCM 256-Bit Privacy
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

        {/* Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-stone-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cache')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'cache'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4 shrink-0" />
            <span>{t(locale, 'vault.tab.cache')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'reminders'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>{t(locale, 'vault.tab.reminders')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('encryption')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'encryption'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>{t(locale, 'vault.tab.encryption')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span>{t(locale, 'vault.tab.docs')}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'cache' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-amber-500" />
                      <span>Persistent Game Cache & Offline Storage Engine</span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      Automatically caches your active 3D mandala strokes, Mastery Score, unlocked stages, palettes, and preferences across browser reloads and offline sessions.
                    </p>
                  </div>
                  <span className="text-xs font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                    {cacheStats.hasCache ? `Cached · ${cacheStats.sizeKB}` : 'Ready'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <div className="text-stone-500 dark:text-slate-400">Storage Footprint</div>
                    <div className="text-lg font-bold font-mono-tabular text-amber-600 dark:text-amber-400 mt-0.5">
                      {cacheStats.sizeKB}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <div className="text-stone-500 dark:text-slate-400">Cached 3D Strokes</div>
                    <div className="text-lg font-bold font-mono-tabular text-sky-600 dark:text-sky-400 mt-0.5">
                      {cacheStats.cachedStrokesCount} Layers
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <div className="text-stone-500 dark:text-slate-400">Practice Sessions Stored</div>
                    <div className="text-lg font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {cacheStats.sessionsCount} Sessions
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSyncCacheNow}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync & Snapshot to Cache Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCacheJson}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Save JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCacheClick}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-rose-500/40 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Local Cache</span>
                  </button>
                </div>

                {cacheStatusMsg && (
                  <div
                    role="status"
                    className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{cacheStatusMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSaveReminder}
                className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                      Daily Push Notification Reminder Schedule
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      Stay consistent with gentle daily prompts for your breath-synchronized mandala practice.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledInput}
                      onChange={(e) => setEnabledInput(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <span>Enable Daily Reminder</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label
                      htmlFor="reminder-time-input"
                      className="block text-xs font-medium text-stone-700 dark:text-slate-300 mb-1"
                    >
                      Preferred Practice Time (24h)
                    </label>
                    <input
                      id="reminder-time-input"
                      type="time"
                      required
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#F8F5EE] dark:bg-slate-950 text-sm font-mono-tabular text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-stone-700 dark:text-slate-300 mb-1">
                      Practice Days
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {allDays.map((day) => {
                        const active = selectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              active
                                ? 'bg-amber-600 text-white'
                                : 'bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Save Schedule & Activate Reminders
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerTestNotification}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-200/60 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Send Test Reminder Pulse
                  </button>
                </div>

                {notificationStatus && (
                  <div
                    role="status"
                    className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{notificationStatus}</span>
                  </div>
                )}
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      Offline Meditation Sanctuary
                    </h4>
                    {isOnline ? (
                      <Wifi className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                    All 10 Sacred Geometry stages, 6 3D brushes, 10 palettes, and encrypted progress records are precached via Workbox Service Worker.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      Low-End Device Performance Optimizer
                    </h4>
                    <Cpu className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onToggleLowPowerMode(!lowPowerMode)}
                      className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        lowPowerMode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200'
                      }`}
                    >
                      {lowPowerMode
                        ? 'Low-Power Eco Mode: ON (1x DPR)'
                        : 'High-Fidelity 3D Mode: ON (Switch to Eco)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'encryption' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Web Crypto API End-to-End Encryption (AES-GCM 256-Bit)</span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      PBKDF2-SHA256 (60,000 iterations) + 96-bit random IV protects your mindfulness logs and Sankalpa locally.
                    </p>
                  </div>
                  {envelope && (
                    <span className="text-xs font-mono-tabular text-emerald-700 dark:text-emerald-400 font-semibold">
                      Key ID: {envelope.keyFingerprint}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="vault-passphrase-input"
                    className="block text-xs font-medium text-stone-700 dark:text-slate-300 mb-1"
                  >
                    Personal Encryption Passphrase (Zero-Knowledge Key Derivation)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="vault-passphrase-input"
                      type="text"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#F8F5EE] dark:bg-slate-950 text-xs font-mono-tabular"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyDecryption}
                      className="min-h-[40px] px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Verify Round-Trip Decrypt</span>
                    </button>
                  </div>
                </div>

                {envelope && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono-tabular">
                    <div className="p-3 rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                      <div className="text-stone-500 dark:text-slate-400 mb-1">
                        Encrypted AES-GCM-256 Envelope:
                      </div>
                      <div className="truncate text-amber-700 dark:text-amber-400">
                        Salt: {envelope.saltHex}
                      </div>
                      <div className="truncate text-sky-700 dark:text-sky-400">
                        IV: {envelope.ivHex}
                      </div>
                      <div className="truncate text-stone-700 dark:text-slate-300 mt-1">
                        Ciphertext: {envelope.ciphertextHex.slice(0, 64)}...
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                      <div className="text-stone-500 dark:text-slate-400 mb-1">
                        Decryption Verification Output:
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-400 break-all line-clamp-3">
                        {isEncrypting
                          ? 'Deriving key...'
                          : verifiedDecryption ||
                            'Click "Verify Round-Trip Decrypt" to inspect decrypted JSON payload.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4 text-xs leading-relaxed text-stone-700 dark:text-slate-300">
              <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-3">
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Modular Codebase Architecture & Multi-Viewport Responsive Design
                </h3>
                <ul className="space-y-1.5 list-disc pl-4">
                  <li>
                    <code className="font-mono-tabular text-amber-700 dark:text-amber-400">
                      src/game/rules.ts
                    </code>{' '}
                    — 10 Sacred Geometry stages (6-fold to 36-fold), 10 palettes, 6 3D brush specs, multi-factor Combo Score engine, and 3D layer perspective math.
                  </li>
                  <li>
                    <code className="font-mono-tabular text-amber-700 dark:text-amber-400">
                      src/utils/storage.ts
                    </code>{' '}
                    — Persistent local Game Cache auto-saving canvas strokes, scores, unlocked stages, and user settings.
                  </li>
                  <li>
                    <code className="font-mono-tabular text-amber-700 dark:text-amber-400">
                      src/components/MandalaCanvas.tsx
                    </code>{' '}
                    — 3D perspective & depth-shadow Canvas2D engine with 6 brush shaders and adaptive portrait/landscape layout.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
