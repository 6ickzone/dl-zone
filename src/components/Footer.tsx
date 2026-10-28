import React from 'react';
import { ArrowDownToLine, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
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
          <div className="flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-400 flex-wrap justify-center">
            <a href="#download" className="hover:text-emerald-400 transition-colors">
              Download
            </a>
            <a href="#platform" className="hover:text-emerald-400 transition-colors">
              20 Platform
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
            <a href="#statistik" className="hover:text-emerald-400 transition-colors">
              Statistik
            </a>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Server CDN Cepat</span>
            </span>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <p>
            © 2026 Downloader Zone. All rights reserved. | Powered by 6ickzone
          </p>
          <p className="max-w-md text-[11px] leading-relaxed text-slate-500">
            Downloader zone adalah alat bantu pengunduhan konten publik untuk keperluan arsip pribadi dan edukasi. Kami tidak menyimpan video atau musik di server kami.
          </p>
        </div>
      </div>
    </footer>
  );
};
