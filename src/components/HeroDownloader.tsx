import React, { useState } from 'react';
import {
  Link as LinkIcon,
  ArrowDown,
  ClipboardPaste,
  X,
  CloudDownload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { RenderPlatformIcon } from './PlatformIcons';
import { SUPPORTED_PLATFORMS } from '../data/platforms';

interface HeroDownloaderProps {
  urlInput: string;
  onUrlChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  onSelectSample: (url: string) => void;
  onScrollToPlatforms: () => void;
  detectedPlatformName?: string | null;
}

export const HeroDownloader: React.FC<HeroDownloaderProps> = ({
  urlInput,
  onUrlChange,
  onSubmit,
  isLoading,
  onSelectSample,
  onScrollToPlatforms,
  detectedPlatformName,
}) => {
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onUrlChange(text.trim());
        setPasteError(null);
      }
    } catch {
      setPasteError('Izin clipboard tidak tersedia. Silakan tempel manual.');
      setTimeout(() => setPasteError(null), 3000);
    }
  };

  const handleClear = () => {
    onUrlChange('');
  };

  const sampleLinks = [
    { label: 'TikTok', url: 'https://vt.tiktok.com/ZSgqXyE7R/' },
    { label: 'Instagram Reel', url: 'https://www.instagram.com/reel/DeG8AQxT5OD/?mdxt=MTFoeXZscWxkbGRkbw==' },
    { label: 'Facebook Reel', url: 'https://www.facebook.com/share/r/1MisQHQbyR/' },
    { label: 'Spotify Album', url: 'https://open.spotify.com/album/1HaAdGP06ZqMnoxDVhDtBP?si=VWe5GZG1QwipKvGN-2kicw&utm_source=copy-link&nd=1&dlsi=da11d5a5e8fe4fb9' },
    { label: 'Pinterest Foto', url: 'https://pin.it/6v43jV68U' },
    { label: 'YouTube 4K', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  ];

  const primaryPlatforms = ['tiktok', 'youtube', 'instagram', 'facebook', 'spotify', 'twitter'];

  return (
    <section id="download" className="relative pt-12 pb-14 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Screenshot Badge: ☁ Downloader */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 mb-6">
          <CloudDownload className="w-3.5 h-3.5 text-emerald-400" />
          <span>Downloader</span>
        </div>

        {/* Screenshot Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-4 text-balance">
          Download Video, Musik & File Cukup Tempel Link
        </h1>

        {/* Screenshot Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-7 leading-relaxed">
          Mendukung 20 platform. Platform dikenali otomatis dari link, tanpa daftar dan tanpa ribet.
        </p>

        {/* Screenshot Mini Badges Row: TikTok, YouTube, IG, FB, Spotify, X, +14 */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {primaryPlatforms.map((pid) => {
            const p = SUPPORTED_PLATFORMS.find((item) => item.id === pid);
            if (!p) return null;
            return (
              <button
                key={pid}
                onClick={() => onSelectSample(p.sampleUrl)}
                title={`Unduh dari ${p.name}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm border border-slate-700/60"
                style={{ backgroundColor: p.iconColor === '#000000' ? '#141c24' : p.iconColor }}
              >
                <RenderPlatformIcon platformId={p.id} className="w-5 h-5 text-white" />
              </button>
            );
          })}
          <button
            onClick={onScrollToPlatforms}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500/50 text-xs font-bold transition-all hover:scale-105"
            title="Lihat semua 20 platform"
          >
            +14
          </button>
        </div>

        {/* Main Input Form with green download button */}
        <form onSubmit={onSubmit} className="relative max-w-2xl mx-auto">
          <div className="flex items-center rounded-xl bg-[#14212d] border border-slate-700/90 shadow-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden p-1">
            <div className="pl-3.5 pr-2 text-slate-400 shrink-0">
              <LinkIcon className="w-5 h-5 text-emerald-400" />
            </div>

            <input
              type="text"
              value={urlInput}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="Paste link di sini (Instagram, TikTok, FB, YouTube, dll)..."
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base px-2 py-3.5 focus:outline-none"
            />

            {/* Quick Helper Actions: Clear & Paste buttons */}
            <div className="flex items-center gap-1.5 pr-1.5 shrink-0">
              {urlInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
                  title="Hapus"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-700/60"
                title="Tempel dari Clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paste</span>
              </button>

              {/* The emerald green button from screenshot */}
              <button
                type="submit"
                disabled={isLoading}
                className="h-11 w-12 sm:w-14 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md shadow-emerald-500/20 shrink-0 ml-1"
                aria-label="Download sekarang"
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
            <span>Platform terdeteksi: <strong>{detectedPlatformName}</strong></span>
          </div>
        )}

        {/* Quick test sample pills */}
        <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap text-xs text-slate-400">
          <span className="text-slate-500 font-medium">Contoh link:</span>
          {sampleLinks.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSample(sample.url)}
              className="px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
