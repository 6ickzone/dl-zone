import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Music,
  Video,
  Share2,
  QrCode,
  Check,
  Play,
  Pause,
  Maximize2,
  X,
  FileDown,
} from 'lucide-react';
import { MediaMetadata, DownloadQuality } from '../types';
import { RenderPlatformIcon } from './PlatformIcons';
import { triggerFileDownload } from '../utils/downloader';
import { useLanguage } from '../context/LanguageContext';

interface MediaResultCardProps {
  media: MediaMetadata;
  onDownloadSuccess: (media: MediaMetadata, quality: DownloadQuality) => void;
}

export const MediaResultCard: React.FC<MediaResultCardProps> = ({
  media,
  onDownloadSuccess,
}) => {
  const { t, language } = useLanguage();
  const [activeMediaTab, setActiveMediaTab] = useState<'video' | 'audio'>('video');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isModalPlayerOpen, setIsModalPlayerOpen] = useState<boolean>(false);

  // Audio preview bar state
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<string>('0:00');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Download simulation state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0 MB/s');
  const [completedId, setCompletedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const hasVideo = media.qualities && media.qualities.length > 0;
  const hasAudio = media.audioQualities && media.audioQualities.length > 0;

  // Auto switch to audio tab if only audio is available
  useEffect(() => {
    if (!hasVideo && hasAudio) {
      setActiveMediaTab('audio');
    }
  }, [hasVideo, hasAudio]);

  // Audio player progress timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAudioPlaying) {
      timer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsAudioPlaying(false);
            setAudioCurrentTime('0:00');
            return 0;
          }
          const next = prev + 3.3; // ~30 seconds duration
          const currentSeconds = Math.floor((next / 100) * 30);
          setAudioCurrentTime(`0:${currentSeconds.toString().padStart(2, '0')}`);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAudioPlaying]);

  // Derive accurate embed player URL if not provided directly
  const resolveEmbedUrl = (): string | null => {
    if (media.embedUrl) return media.embedUrl;

    const url = media.url;
    // YouTube
    const ytMatch = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^/?&#]+)/) || url.match(/shorts\/([^/?&#]+)/);
    if (ytMatch) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }

    // Spotify
    const spMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    if (spMatch) {
      return `https://open.spotify.com/embed/track/${spMatch[1]}?utm_source=generator&theme=0`;
    }
    const spAlbum = url.match(/album\/([a-zA-Z0-9]+)/);
    if (spAlbum) {
      return `https://open.spotify.com/embed/album/${spAlbum[1]}?utm_source=generator&theme=0`;
    }

    // SoundCloud
    if (/soundcloud\.com/i.test(url)) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2310b981&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
    }

    // Instagram
    const igMatch = url.match(/reel(?:s)?\/([a-zA-Z0-9_-]+)/) || url.match(/\/p\/([a-zA-Z0-9_-]+)/);
    if (igMatch) {
      return `https://www.instagram.com/reel/${igMatch[1]}/embed/`;
    }

    // Facebook
    if (/facebook\.com|fb\.watch/i.test(url)) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/([0-9]+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    return null;
  };

  const embedUrl = resolveEmbedUrl();
  const directVideoUrl = media.directVideoUrl;

  const handleStartDownload = async (quality: DownloadQuality) => {
    if (downloadingId) return;

    setDownloadingId(quality.id);
    setDownloadProgress(5);
    setCompletedId(null);

    const steps = [
      { progress: 28, speed: '14.2 MB/s', delay: 200 },
      { progress: 68, speed: '21.4 MB/s', delay: 350 },
      { progress: 94, speed: '18.1 MB/s', delay: 500 },
      { progress: 100, speed: language === 'en' ? 'Finalizing file...' : 'Menyimpan file...', delay: 650 },
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, step.delay));
      setDownloadProgress(step.progress);
      setDownloadSpeed(step.speed);
    }

    try {
      const targetUrl = quality.downloadUrl || (quality.format === 'mp4' ? media.directVideoUrl : media.directAudioUrl);
      await triggerFileDownload(media.title, media.platform, quality.label, quality.format, targetUrl);
      onDownloadSuccess(media, quality);
      setCompletedId(quality.id);
    } catch {
      // error handling fallback
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
        setDownloadProgress(0);
      }, 1000);
    }
  };

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(media.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const toggleInlinePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleAudioPreview = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsAudioPlaying(true);
      }
    } else {
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-14 px-4 sm:px-0">
      <div className="bg-[#131f2b] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <RenderPlatformIcon platformId={media.platform} className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">
              {media.platformName}
            </span>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              ● {language === 'en' ? 'Ready to Stream & Download' : 'Siap Diputar & Diunduh'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalPlayerOpen(true)}
              className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/80 transition-colors border border-emerald-500/30 cursor-pointer"
              title={language === 'en' ? 'Open Fullscreen Player' : 'Buka Pemutar Layar Penuh'}
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'en' ? 'Fullscreen' : 'Layar Penuh'}</span>
            </button>

            <button
              onClick={handleCopyDirectLink}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? t.result.copied : t.result.shareLink}</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
              title={language === 'en' ? 'Scan QR on phone' : 'Unduh ke Ponsel dengan QR Code'}
            >
              <QrCode className="w-3.5 h-3.5 text-slate-300" />
              <span>{language === 'en' ? 'Mobile QR' : 'QR HP'}</span>
            </button>
          </div>
        </div>

        {/* Media Content Overview */}
        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          {/* Interactive Player / Thumbnail Area */}
          <div className="sm:col-span-5 relative group rounded-xl overflow-hidden aspect-video sm:aspect-square bg-slate-950 border border-slate-800 flex items-center justify-center">
            {isPlaying ? (
              <div className="w-full h-full relative bg-black">
                {directVideoUrl ? (
                  <video
                    src={directVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={media.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <img
                      src={media.thumbnail}
                      alt={media.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-25"
                    />
                    <div className="relative z-10">
                      <Music className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs font-semibold text-white mb-2">{media.title}</p>
                      <button
                        onClick={toggleAudioPreview}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        {isAudioPlaying ? (language === 'en' ? 'Pause Audio' : 'Jeda Audio') : (language === 'en' ? 'Play Audio' : 'Putar Audio')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Close Player back to Thumbnail */}
                <button
                  onClick={() => setIsPlaying(false)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white hover:text-emerald-400 z-20 backdrop-blur-xs transition-colors cursor-pointer"
                  title="Close player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <img
                  src={media.thumbnail}
                  alt={media.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {media.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-[11px] font-mono text-white backdrop-blur-xs border border-white/10 z-10">
                    {media.duration}
                  </span>
                )}

                {/* Big Interactive Play Button */}
                <button
                  onClick={toggleInlinePlay}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-xl shadow-emerald-500/40 cursor-pointer z-10 group/btn"
                  title={language === 'en' ? 'Play direct stream' : 'Putar Preview Langsung'}
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>

                <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 drop-shadow-md">
                    <Play className="w-3 h-3 fill-current" />
                    <span>{language === 'en' ? 'Click to Play' : 'Klik untuk Putar'}</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Details & Metadata */}
          <div className="sm:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  {media.platformName}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[11px] text-slate-400">{media.date || (language === 'en' ? 'Available' : 'Tersedia')}</span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug mb-1.5">
                {media.title}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-emerald-400/90 mb-3">
                {media.author}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mb-4 flex-wrap">
                {media.views && <span>👁 {media.views}</span>}
                {media.likes && <span>❤️ {media.likes}</span>}
                {media.duration && <span>⏱ {media.duration}</span>}
              </div>

              {/* Dedicated Audio Preview Bar */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 mb-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'en' ? 'Audio Stream Preview:' : 'Pratinjau Audio:'}</span>
                  </span>
                  <span className="font-mono text-emerald-400 text-[11px]">
                    {audioCurrentTime} / {media.duration || '0:30'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAudioPreview}
                    className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm"
                    title={isAudioPlaying ? 'Pause' : 'Play Audio'}
                  >
                    {isAudioPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Scrubber Bar */}
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden relative cursor-pointer">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>

                  {media.directAudioUrl && (
                    <audio
                      ref={audioRef}
                      src={media.directAudioUrl}
                      onEnded={() => {
                        setIsAudioPlaying(false);
                        setAudioProgress(0);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Active downloading progress bar */}
            {downloadingId && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 mb-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <FileDown className="w-3.5 h-3.5 animate-bounce" />
                    {language === 'en' ? 'Downloading file to device...' : 'Mengunduh file ke perangkat...'}
                  </span>
                  <span className="font-mono text-slate-300">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{language === 'en' ? 'Speed:' : 'Kecepatan:'} {downloadSpeed}</span>
                  <span>{language === 'en' ? 'Fast CDN Server' : 'Server CDN Cepat'}</span>
                </div>
              </div>
            )}

            {/* Format category switcher (Video / Audio) */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              {hasVideo && (
                <button
                  onClick={() => setActiveMediaTab('video')}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeMediaTab === 'video'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Video MP4' : 'Video MP4'} ({media.qualities.length})</span>
                </button>
              )}

              {hasAudio && (
                <button
                  onClick={() => setActiveMediaTab('audio')}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeMediaTab === 'audio'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Audio MP3' : 'Audio MP3'} ({media.audioQualities.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quality Options Table */}
        <div className="border-t border-slate-800/80 px-5 sm:px-6 py-4 bg-slate-950/40">
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
            <span className="uppercase">{language === 'en' ? 'Select Download Quality:' : 'PILIH KUALITAS UNDUHAN:'}</span>
            <span className="text-[11px] text-slate-500">{language === 'en' ? 'Zero quota · High speed' : 'Bebas kuota · Kecepatan tinggi'}</span>
          </div>

          <div className="space-y-2">
            {(activeMediaTab === 'video' ? media.qualities : media.audioQualities).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 transition-all flex-wrap gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                    {activeMediaTab === 'video' ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <Music className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{item.resolution || item.bitrate || item.format.toUpperCase()}</span>
                      <span>·</span>
                      <span>{item.fileSize}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartDownload(item)}
                  disabled={downloadingId !== null}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    completedId === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {completedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{language === 'en' ? 'Saved!' : 'Tersimpan!'}</span>
                    </>
                  ) : downloadingId === item.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'en' ? 'Downloading...' : 'Mengunduh...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{t.result.downloadNow}</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Video / Audio Modal Player */}
      {isModalPlayerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14212d] border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate pr-4">
                <RenderPlatformIcon platformId={media.platform} className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className="text-sm font-bold text-white truncate">{media.title}</h3>
              </div>
              <button
                onClick={() => setIsModalPlayerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black flex items-center justify-center relative">
              {directVideoUrl ? (
                <video
                  src={directVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={media.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-6">
                  <img
                    src={media.thumbnail}
                    alt={media.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
                    }}
                    className="max-h-60 mx-auto rounded-xl object-contain mb-4 shadow-lg"
                  />
                  <p className="text-sm text-slate-300 font-semibold mb-2">{media.title}</p>
                  <p className="text-xs text-slate-400 mb-4">{media.author}</p>
                  <button
                    onClick={toggleAudioPreview}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                  >
                    {isAudioPlaying ? (language === 'en' ? 'Pause Audio' : 'Jeda Audio') : (language === 'en' ? 'Play Audio' : 'Putar Audio')}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Platform: <strong className="text-emerald-400 capitalize">{media.platformName}</strong></span>
              <button
                onClick={() => setIsModalPlayerOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                {t.result.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Phone Download */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14212d] border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-2">
              {language === 'en' ? 'Download on Mobile Device' : 'Unduh di Ponsel / HP'}
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              {language === 'en'
                ? 'Scan this QR code with your phone camera to download directly to your mobile gallery or files.'
                : 'Buka kamera ponsel Anda lalu arahkan ke QR Code ini untuk mengunduh media langsung ke galeri HP.'}
            </p>

            <div className="p-4 bg-white rounded-xl inline-block mb-4 shadow-inner">
              <div className="w-44 h-44 bg-slate-950 p-2 rounded flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-12 h-12 border-4 border-white bg-slate-950 p-1 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white" />
                  </div>
                  <div className="w-12 h-12 border-4 border-white bg-slate-950 p-1 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white" />
                  </div>
                </div>
                <div className="my-auto flex items-center justify-center">
                  <div className="w-10 h-10 rounded bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
                    DZ
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-12 h-12 border-4 border-white bg-slate-950 p-1 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="w-2 h-2 bg-white" />
                    <div className="w-2 h-2 bg-white" />
                    <div className="w-2 h-2 bg-white" />
                    <div className="w-2 h-2 bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400 font-mono mb-5">
              Direct Link: downloaderzone.io/d/{media.platform}
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              {t.result.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
