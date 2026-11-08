import React, { useState } from 'react';
import { SUPPORTED_PLATFORMS } from '../data/platforms';
import { PlatformInfo } from '../types';
import { RenderPlatformIcon } from './PlatformIcons';
import { CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

type Category = 'all' | 'video' | 'short' | 'image';

export const PlatformsGrid: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [activePlatformModal, setActivePlatformModal] = useState<PlatformInfo | null>(null);

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: t.platforms.catAll },
    { id: 'short', label: t.platforms.catShort },
    { id: 'video', label: t.platforms.catVideo },
    { id: 'image', label: t.platforms.catImage },
  ];

  const filteredPlatforms =
    selectedCategory === 'all'
      ? SUPPORTED_PLATFORMS
      : SUPPORTED_PLATFORMS.filter((platform) => platform.category === selectedCategory);

  return (
    <section id="platform" className="pt-10 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {t.platforms.heading}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-7">{t.platforms.subtitle}</p>

        <div className="flex items-center justify-center gap-1.5 mb-8 flex-wrap">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === category.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
          {filteredPlatforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setActivePlatformModal(platform)}
              className="group flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#14212d] hover:bg-[#1b2b3a] border border-slate-700/70 hover:border-emerald-500/60 transition-all transform hover:-translate-y-1 shadow-md cursor-pointer"
              title={`${platform.name}: ${platform.description}`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                style={{ backgroundColor: platform.iconColor === '#000000' ? '#0f172a' : platform.iconColor }}
              >
                <RenderPlatformIcon platformId={platform.id} className="w-6 h-6 text-white" />
              </div>
              <span className="text-[11px] font-medium text-slate-300 mt-2 truncate max-w-full group-hover:text-emerald-400 transition-colors">
                {platform.name}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          {language === 'en'
            ? 'Only platforms with a working, tested resolver are listed. Paste your own public link to start.'
            : 'Hanya platform dengan resolver yang benar-benar berfungsi yang ditampilkan. Tempel tautan publik Anda untuk mulai.'}
        </p>
      </div>

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
                  backgroundColor: activePlatformModal.iconColor === '#000000' ? '#0f172a' : activePlatformModal.iconColor,
                }}
              >
                <RenderPlatformIcon platformId={activePlatformModal.id} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{activePlatformModal.name}</h3>
                <p className="text-xs text-slate-400">
                  {language === 'en' ? 'Direct download supported' : 'Unduhan langsung didukung'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4 leading-relaxed">{activePlatformModal.description}</p>

            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 mb-5">
              <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase">
                {t.platforms.supportedFormats}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activePlatformModal.supportedFormats.map((format) => (
                  <span
                    key={format}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/80"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{format}</span>
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {language === 'en'
                ? 'Copy a public link from this platform and paste it into the field above. No sample links are used.'
                : 'Salin tautan publik dari platform ini lalu tempel di kolom atas. Tidak ada tautan contoh yang dipakai.'}
            </p>

            <button
              onClick={() => setActivePlatformModal(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              {language === 'en' ? 'Got it' : 'Mengerti'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
