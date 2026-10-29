import React from 'react';
import { ArrowDownToLine, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-800/80 bg-[#0a0f14] text-slate-400 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black">
              <ArrowDownToLine className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-lg font-extrabold italic tracking-tight text-white">
              Downloader <span className="text-emerald-400 font-black not-italic text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">zone</span>
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-5 text-xs sm:text-sm font-medium text-slate-400 flex-wrap justify-center">
            <a href="#download" className="hover:text-emerald-400 transition-colors">
              {t.footer.download}
            </a>
            <a href="#platform" className="hover:text-emerald-400 transition-colors">
              {t.footer.platforms}
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              {t.footer.faq}
            </a>
            <a href="#statistik" className="hover:text-emerald-400 transition-colors">
              {t.footer.liveStatus}
            </a>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.footer.fastCdn}</span>
            </span>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <p>
            {t.footer.copyright}
          </p>
          <p className="max-w-md text-[11px] leading-relaxed text-slate-500">
            {t.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
