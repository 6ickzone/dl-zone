import React, { useState } from 'react';
import { ArrowDownToLine, ShieldCheck, Heart, X, ExternalLink, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <>
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
              <button
                onClick={() => setShowCredits(true)}
                className="hover:text-emerald-400 transition-colors text-emerald-400/90 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30 inline" />
                <span>Kredit & Thanks To</span>
              </button>
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

      {/* Credits / Thanks To Modal */}
      {showCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative text-slate-300">
            {/* Close Button */}
            <button
              onClick={() => setShowCredits(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400/30" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Kredit & Ucapan Terima Kasih</h3>
                <p className="text-xs text-slate-400">Apresiasi untuk komunitas open-source dan API publik</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Aplikasi <strong>Downloader Zone</strong> terwujud berkat kontribusi komunitas developer dunia dan proyek open-source berikut:
              </p>

              {/* Media Resolvers & APIs */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-xs">
                  <Code2 className="w-3.5 h-3.5" /> Media Resolvers & Public APIs
                </div>
                <ul className="space-y-1.5 text-slate-400 pl-1">
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>TikWM API</strong> (Ekstraksi video No-Watermark & audio TikTok)</span>
                    <a href="https://tikwm.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>SnapSave Community & library</strong> (Resolver Instagram Reels & Facebook Video HD)</span>
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>Pinterest Pidgets API</strong> (Metadata gambar & resolusi original Pinterest)</span>
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>YouTube, Spotify & SoundCloud oEmbed</strong> (Metadata musik & konten audio/video)</span>
                  </li>
                </ul>
              </div>

              {/* Open Source Frameworks */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-teal-400 flex items-center gap-1.5 text-xs">
                  <Code2 className="w-3.5 h-3.5" /> Open Source Tech Stack
                </div>
                <ul className="space-y-1.5 text-slate-400 pl-1">
                  <li>• <strong>React 19 & Vite</strong> – Frontend ultra-responsif & fast bundling.</li>
                  <li>• <strong>Tailwind CSS v4</strong> – Desain antarmuka dark-neon glassmorphism.</li>
                  <li>• <strong>Express.js</strong> – Backend stream caching & download proxy bypass CORS.</li>
                  <li>• <strong>Lucide React</strong> – Ikon antarmuka modern & konsisten.</li>
                </ul>
              </div>

              {/* Special Thanks */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-indigo-400 flex items-center gap-1.5 text-xs">
                  ✨ Inspirasi Desain & Tim
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Terima kasih kepada <strong>Zeta Download / Zetabot</strong> atas referensi inspirasi tata letak modern, serta <strong>6ickzone</strong> untuk arahan konsep Downloader Zone.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCredits(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

