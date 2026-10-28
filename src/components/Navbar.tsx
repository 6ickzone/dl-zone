import React from 'react';
import { ArrowDownToLine, Moon, Sun, History, Sparkles } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  onToggleTheme,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-200 border-slate-800/80 bg-[#0d151c]/90 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title */}
        <a
          href="#"
          className="flex items-center gap-2 group whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ArrowDownToLine className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold italic tracking-tight text-white flex items-center gap-1.5">
            Downloader <span className="text-emerald-400 font-black not-italic text-sm px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">zone</span>
          </span>
        </a>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <a
            href="#download"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            Download
          </a>
          <a
            href="#platform"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            Platform
          </a>
          <a
            href="#faq"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            FAQ
          </a>
          <a
            href="#statistik"
            className="hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            Statistik
          </a>
        </nav>

        {/* Zone 3: Actions - Riwayat & Dark/Light Switch */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700/80 bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 transition-colors"
            title="Riwayat Unduhan"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Riwayat</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-500 text-slate-950">
                {historyCount}
              </span>
            )}
          </button>

          {/* Screenshot-matched toggle switch */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer select-none"
            aria-label="Toggle tema gelap/terang"
          >
            <div
              className={`w-7 h-4 rounded-full flex items-center p-0.5 transition-colors ${
                isDarkMode ? 'bg-emerald-500 justify-end' : 'bg-slate-600 justify-start'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
            </div>
            <span className="text-xs text-slate-300 font-medium">
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
