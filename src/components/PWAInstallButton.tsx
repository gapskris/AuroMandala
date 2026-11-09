import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Install Offline App"
        className="min-h-[40px] px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
        >
          <div className="w-full max-w-md rounded-2xl border border-stone-300 dark:border-slate-700 bg-[#F8F5EE] dark:bg-[#111726] p-6 text-stone-900 dark:text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                <h3 id="pwa-install-title" className="text-base font-semibold font-display">
                  Install PranaMandala (iOS, Android & Desktop)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install guide"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-stone-700 dark:text-slate-300">
              <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Service Worker Active · {isOnline ? 'Online & Cached for Offline Use' : 'Running in Offline Sanctuary Mode'}
                </span>
              </p>

              <div className="p-3 rounded-xl bg-stone-200/60 dark:bg-slate-900/90 space-y-1.5">
                <p className="font-semibold text-stone-900 dark:text-white text-xs">
                  iPhone & iPad (iOS Safari)
                </p>
                <p className="text-xs leading-relaxed">
                  1. Tap the <strong>Share</strong> icon in the Safari toolbar.<br />
                  2. Select <strong>Add to Home Screen</strong> to launch full-screen offline.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-200/60 dark:bg-slate-900/90 space-y-1.5">
                <p className="font-semibold text-stone-900 dark:text-white text-xs">
                  Android & Desktop (Chrome / Edge)
                </p>
                <p className="text-xs leading-relaxed">
                  1. Click the <strong>Install App</strong> icon in the browser address bar or menu.<br />
                  2. All sacred geometry stages, audio bowls, and encrypted progress work 100% offline.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
