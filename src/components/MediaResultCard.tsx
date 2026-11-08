import React, { useState } from 'react';
import {
  Download,
  Music,
  Video,
  Image as ImageIcon,
  Share2,
  Check,
  X,
  Eye,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { MediaMetadata, DownloadQuality } from '../types';
import { RenderPlatformIcon } from './PlatformIcons';
import { triggerFileDownload } from '../utils/downloader';
import { useLanguage } from '../context/LanguageContext';

interface MediaResultCardProps {
  media: MediaMetadata;
  onDownloadSuccess: (media: MediaMetadata, quality: DownloadQuality) => void;
}

function formatIcon(format: DownloadQuality['format']) {
  if (format === 'jpg' || format === 'png') return <ImageIcon className="w-4 h-4" />;
  if (format === 'mp3') return <Music className="w-4 h-4" />;
  return <Video className="w-4 h-4" />;
}

export const MediaResultCard: React.FC<MediaResultCardProps> = ({ media, onDownloadSuccess }) => {
  const { t, language } = useLanguage();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const isImage = media.mediaType === 'image';
  const isAudioOnly = media.mediaType === 'audio' && !media.directVideoUrl;
  const hasVideoPreview = !!media.directVideoUrl;
  const hasAudioPreview = !!media.directAudioUrl;
  const hasThumbnail = !!media.thumbnail;

  const handleStartDownload = async (quality: DownloadQuality) => {
    if (pendingId) return;

    setPendingId(quality.id);
    setCompletedId(null);
    setDownloadError(null);

    try {
      await triggerFileDownload(
        media.title,
        media.platform,
        quality.label,
        quality.format,
        quality.downloadUrl
      );
      onDownloadSuccess(media, quality);
      setCompletedId(quality.id);
    } catch (err) {
      setDownloadError(
        err instanceof Error && err.message
          ? err.message
          : language === 'en'
            ? 'The file could not be downloaded. Re-process the link and try again.'
            : 'File gagal diunduh. Proses ulang tautan lalu coba lagi.'
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(media.url).then(
      () => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      },
      () => setDownloadError(language === 'en' ? 'Could not copy the link.' : 'Gagal menyalin tautan.')
    );
  };

  const renderQualityGroup = (title: string, qualities: DownloadQuality[]) => {
    if (qualities.length === 0) return null;
    return (
      <div className="mb-5 last:mb-0">
        <div className="text-xs font-semibold text-slate-400 mb-3 uppercase">{title}</div>
        <div className="space-y-2">
          {qualities.map((quality) => (
            <div
              key={quality.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 transition-all flex-wrap gap-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                  {formatIcon(quality.format)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{quality.label}</span>
                    {quality.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {quality.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>{quality.resolution || quality.bitrate || quality.format.toUpperCase()}</span>
                    {quality.fileSize && (
                      <>
                        <span>·</span>
                        <span>{quality.fileSize}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartDownload(quality)}
                disabled={pendingId !== null}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                  completedId === quality.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                }`}
              >
                {completedId === quality.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{language === 'en' ? 'Started' : 'Dimulai'}</span>
                  </>
                ) : pendingId === quality.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'en' ? 'Checking file...' : 'Memeriksa file...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {quality.format === 'mp3'
                        ? language === 'en'
                          ? 'Download MP3'
                          : 'Unduh MP3'
                        : t.result.downloadNow}
                    </span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto mb-14 px-4 sm:px-0">
      <div className="bg-[#131f2b] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all">
        <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <RenderPlatformIcon platformId={media.platform} className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">{media.platformName}</span>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              {media.qualities.length + media.audioQualities.length}{' '}
              {language === 'en' ? 'files available' : 'file tersedia'}
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? t.result.copied : t.result.shareLink}</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          <div className="sm:col-span-5 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            {hasVideoPreview ? (
              <video
                src={media.directVideoUrl}
                poster={media.thumbnail}
                controls
                playsInline
                preload="metadata"
                className="w-full aspect-square object-contain bg-black"
              />
            ) : isAudioOnly && hasAudioPreview ? (
              <div className="p-4">
                {hasThumbnail && (
                  <img
                    src={media.thumbnail}
                    alt={media.title}
                    referrerPolicy="no-referrer"
                    className="w-full aspect-square object-cover rounded-lg mb-3"
                  />
                )}
                <div className="flex items-center gap-2 mb-2 text-xs text-slate-300 font-semibold">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'en' ? 'Audio preview' : 'Pratinjau audio'}</span>
                </div>
                <audio src={media.directAudioUrl} controls className="w-full" />
              </div>
            ) : hasThumbnail ? (
              <img
                src={media.thumbnail}
                alt={media.title}
                referrerPolicy="no-referrer"
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square flex flex-col items-center justify-center text-slate-600 gap-2">
                {isImage ? <ImageIcon className="w-10 h-10" /> : <Video className="w-10 h-10" />}
                <span className="text-xs">{language === 'en' ? 'No preview available' : 'Pratinjau tidak tersedia'}</span>
              </div>
            )}
          </div>

          <div className="sm:col-span-7">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{media.platformName}</span>
              {media.date && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] text-slate-400">{media.date}</span>
                </>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug mb-1.5">{media.title}</h2>
            {media.author && <p className="text-xs sm:text-sm font-semibold text-emerald-400/90 mb-3">{media.author}</p>}

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mb-4 flex-wrap">
              {media.views && <span>👁 {media.views}</span>}
              {media.likes && <span>❤️ {media.likes}</span>}
              {media.duration && <span>⏱ {media.duration}</span>}
            </div>

            {media.notice && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 mb-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed">{media.notice}</p>
              </div>
            )}

            {downloadError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200 leading-relaxed flex-1">{downloadError}</p>
                <button
                  onClick={() => setDownloadError(null)}
                  className="p-0.5 rounded text-red-300 hover:text-white hover:bg-red-900/60 transition-colors cursor-pointer shrink-0"
                  aria-label={t.result.close}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {media.embedUrl && !hasVideoPreview && (
              <a
                href={media.embedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white mb-4"
              >
                <Eye className="w-3.5 h-3.5" />
                {language === 'en' ? 'Open source page' : 'Buka halaman sumber'}
              </a>
            )}

            {media.qualities.length === 0 && media.audioQualities.length === 0 && (
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? 'No downloadable file was found for this link.'
                  : 'Tidak ada file yang bisa diunduh dari tautan ini.'}
              </p>
            )}
          </div>
        </div>

        {(media.qualities.length > 0 || media.audioQualities.length > 0) && (
          <div className="border-t border-slate-800/80 px-5 sm:px-6 py-4 bg-slate-950/40">
            {renderQualityGroup(
              isImage
                ? language === 'en'
                  ? 'Photo file'
                  : 'File foto'
                : language === 'en'
                  ? 'Media file'
                  : 'File media',
              media.qualities
            )}
            {renderQualityGroup(language === 'en' ? 'Audio (real MP3 conversion)' : 'Audio (konversi MP3 nyata)', media.audioQualities)}
            <p className="text-[11px] text-slate-500 mt-3">
              {language === 'en'
                ? 'Every file is fetched from the source you provided; MP3 is encoded by ffmpeg from that file.'
                : 'Setiap file diambil dari sumber yang Anda berikan; MP3 dienkode ffmpeg dari file tersebut.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
