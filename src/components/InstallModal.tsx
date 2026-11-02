import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sound } from '../services/sound';
import { X, Smartphone, Globe, Download, CheckCircle2, Share2, Terminal, ExternalLink, Cpu } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'github'>('pwa');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    sound.playPowerup();
    await install();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Play Modes & Installation</h2>
              <p className="text-xs text-slate-400">Play in PWA App Mode, Android APK, or GitHub Web</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pwa'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>PWA APP MODE</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'apk'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>ANDROID APK</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'github'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>GITHUB WEB</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white font-display">Installable Progressive Web App</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Neon Pulse Arcade supports standalone installation on Android, iOS, Windows, macOS, and Linux with full offline caching and full-screen experience.
                </p>
              </div>

              {isInstalled ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-semibold">
                    App is already running in Standalone PWA Mode!
                  </span>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>INSTALL PWA TO HOME SCREEN / DESKTOP</span>
                </button>
              ) : isIOS ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                    <Share2 className="w-4 h-4" />
                    <span>SAFARI INSTALL GUIDE FOR IOS:</span>
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Tap the <strong>Share</strong> button in the Safari toolbar.</li>
                    <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                    <li>Launch the app directly from your home screen icon!</li>
                  </ol>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-300">
                    To install from Chrome, Edge, or Android browser, click the <strong>Install App</strong> icon in your browser URL bar or select <strong>Install App / Add to Home Screen</strong> from the browser menu.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white font-display">Generate Native Android APK</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We have included an automated GitHub Actions workflow (<code className="text-cyan-400">.github/workflows/build-apk.yml</code>) that builds an unsigned APK on every push or manual trigger.
                </p>
              </div>

              {/* Method 1: Instant PWABuilder / Bubblewrap */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold font-display text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                  <span>Method 1: One-Click APK via PWABuilder (No Setup)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Once deployed to your GitHub website, paste your URL into Google's official <strong className="text-slate-200">PWABuilder.com</strong> to download a ready-to-install Android APK with signed credentials.
                </p>
              </div>

              {/* Method 2: Command Line CLI */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold font-display text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                  <span>Method 2: Local CLI Build</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg font-mono text-[11px] text-cyan-300 space-y-1">
                  <div>npm run build</div>
                  <div>npx @bubblewrap/cli build</div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Outputs <code className="text-slate-200">app-release-signed.apk</code> ready to sideload on any Android device.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white font-display">Play Directly on GitHub Pages</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The codebase includes a configured <code className="text-cyan-400">.github/workflows/deploy.yml</code> GitHub Actions workflow that automatically builds and publishes the game directly to your free GitHub Pages URL!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white font-display">How to Enable in Your GitHub Repository:</div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Push your changes to GitHub (<code className="text-cyan-400">git push origin main</code>).</li>
                  <li>On GitHub, go to your repository <strong>Settings</strong> → <strong>Pages</strong>.</li>
                  <li>Under <strong>Build and deployment → Source</strong>, select <strong>GitHub Actions</strong>.</li>
                  <li>Your site will be live at:</li>
                </ol>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-400 text-center font-bold">
                  https://&lt;your-username&gt;.github.io/Fun-Game/
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
