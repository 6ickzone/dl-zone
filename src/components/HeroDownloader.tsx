import React, { useState } from 'react';
import {
  Link as LinkIcon,
  ArrowDown,
  ClipboardPaste,
  X,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { RenderPlatformIcon } from './PlatformIcons';
import { SUPPORTED_PLATFORMS } from '../data/platforms';
import { useLanguage } from '../context/LanguageContext';

interface HeroDownloaderProps {
  urlInput: string;
  onUrlChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  onScrollToPlatforms: () => void;
  detectedPlatformName?: string | null;
}

export const HeroDownloader: React.FC<HeroDownloaderProps> = ({
  urlInput,
  onUrlChange,
  onSubmit,
  isLoading,
  onScrollToPlatforms,
  detectedPlatformName,
}) => {
  const { t, language } = useLanguage();
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onUrlChange(text.trim());
        setPasteError(null);
      }
    } catch {
      setPasteError(t.hero.clipboardError);
      setTimeout(() => setPasteError(null), 3000);
    }
  };

  return (
    <section id="download" className="relative pt-12 pb-14 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 mb-6">
          <CloudDownload className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.hero.badge}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-4 text-balance">
          {t.hero.headline}
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-7 leading-relaxed">
          {t.hero.subtitle}
        </p>

        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {SUPPORTED_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={onScrollToPlatforms}
              title={`${platform.name}: ${platform.supportedFormats.join(', ')}`}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm border border-slate-700/60 cursor-pointer"
              style={{ backgroundColor: platform.iconColor === '#000000' ? '#141c24' : platform.iconColor }}
            >
              <RenderPlatformIcon platformId={platform.id} className="w-5 h-5 text-white" />
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="relative max-w-2xl mx-auto">
          <div className="flex items-center rounded-xl bg-[#14212d] border border-slate-700/90 shadow-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden p-1">
            <div className="pl-3.5 pr-2 text-slate-400 shrink-0">
              <LinkIcon className="w-5 h-5 text-emerald-400" />
            </div>

            <input
              type="text"
              value={urlInput}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder={t.hero.placeholder}
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base px-2 py-3.5 focus:outline-none"
            />

            <div className="flex items-center gap-1.5 pr-1.5 shrink-0">
              {urlInput && (
                <button
                  type="button"
                  onClick={() => onUrlChange('')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-700/60 cursor-pointer"
                title={t.hero.pasteBtn}
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.hero.pasteBtn}</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="h-11 w-12 sm:w-14 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md shadow-emerald-500/20 shrink-0 ml-1"
                aria-label={t.hero.downloadBtn}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowDown className="w-5 h-5 stroke-[2.8]" />
                )}
              </button>
            </div>
          </div>
        </form>

        {pasteError && (
          <p className="text-xs text-amber-400 mt-2 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {pasteError}
          </p>
        )}

        {detectedPlatformName && urlInput && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {t.hero.detectedPlatform}: <strong>{detectedPlatformName}</strong>
            </span>
          </div>
        )}

        <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
          {language === 'en'
            ? 'No sample links or dummy files. Results only come from the URL you paste and files that actually exist at the source.'
            : 'Tidak ada tautan contoh atau file dummy. Hasil hanya muncul dari URL yang Anda tempel dan file yang benar-benar tersedia di sumbernya.'}
        </p>
      </div>
    </section>
  );
};
