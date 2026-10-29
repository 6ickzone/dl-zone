import React, { useState } from 'react';
import { SUPPORTED_PLATFORMS } from '../data/platforms';
import { PlatformInfo } from '../types';
import { RenderPlatformIcon } from './PlatformIcons';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PlatformsGridProps {
  onSelectPlatform: (sampleUrl: string) => void;
}

export const PlatformsGrid: React.FC<PlatformsGridProps> = ({ onSelectPlatform }) => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'short' | 'video' | 'audio'>('all');
  const [activePlatformModal, setActivePlatformModal] = useState<PlatformInfo | null>(null);

  const categories = [
    { id: 'all', label: t.platforms.catAll },
    { id: 'short', label: t.platforms.catShort },
    { id: 'video', label: t.platforms.catVideo },
    { id: 'audio', label: t.platforms.catAudio },
  ];

  const filteredPlatforms = selectedCategory === 'all'
    ? SUPPORTED_PLATFORMS
    : SUPPORTED_PLATFORMS.filter((p) => p.category === selectedCategory);

  return (
    <section id="platform" className="pt-10 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {t.platforms.heading}
        </h2>
        {/* Section Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-7">
          {t.platforms.subtitle}
        </p>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-1.5 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as unknown as typeof selectedCategory)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid: 17 platform tiles */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3 sm:gap-4 mb-6">
          {filteredPlatforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlatformModal(p)}
              className="group flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#14212d] hover:bg-[#1b2b3a] border border-slate-700/70 hover:border-emerald-500/60 transition-all transform hover:-translate-y-1 shadow-md cursor-pointer"
              title={`${p.name}: ${p.description}`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                style={{ backgroundColor: p.iconColor === '#000000' ? '#0f172a' : p.iconColor }}
              >
                <RenderPlatformIcon platformId={p.id} className="w-6 h-6 text-white" />
              </div>
              <span className="text-[11px] font-medium text-slate-300 mt-2 truncate max-w-full group-hover:text-emerald-400 transition-colors">
                {p.name}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          {language === 'en'
            ? 'Click any platform to view supported formats and try sample links.'
            : 'Klik salah satu platform untuk melihat fitur unduhan & coba tautan sampel.'}
        </p>
      </div>

      {/* Platform Info Modal */}
      {activePlatformModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14212d] border border-slate-700 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setActivePlatformModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{
                  backgroundColor:
                    activePlatformModal.iconColor === '#000000'
                      ? '#0f172a'
                      : activePlatformModal.iconColor,
                }}
              >
                <RenderPlatformIcon
                  platformId={activePlatformModal.id}
                  className="w-6 h-6 text-white"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{activePlatformModal.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                    Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'en' ? 'Fully supported by Downloader Zone' : 'Didukung penuh oleh Downloader Zone'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {activePlatformModal.description}
            </p>

            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 mb-5">
              <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase">
                {t.platforms.supportedFormats}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activePlatformModal.supportedFormats.map((fmt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/80"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{fmt}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onSelectPlatform(activePlatformModal.sampleUrl);
                  setActivePlatformModal(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>{language === 'en' ? `Try ${activePlatformModal.name} Link` : `Coba Download Link ${activePlatformModal.name}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
