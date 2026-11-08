import express, { Request, Response as ExpressResponse } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { spawn } from 'child_process';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { mkdtemp, rm, unlink } from 'fs/promises';
import os from 'os';
import ffmpegStatic from 'ffmpeg-static';
import { Ytdl } from '@distube/ytdl-core';
import { snapsave } from 'snapsave-media-downloader';
// @ts-ignore
import SnapVideo from 'cakkatrok-instagram-downloader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const FFMPEG_PATH = ffmpegStatic || 'ffmpeg';

app.use(express.json());

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

type QualityFormat = 'mp4' | 'mp3' | 'zip' | 'jpg' | 'png';

interface Quality {
  id: string;
  label: string;
  resolution?: string;
  bitrate?: string;
  format: QualityFormat;
  fileSize?: string;
  badge?: string;
  isPopular?: boolean;
  downloadUrl: string;
}

interface ResolvedMedia {
  platform: string;
  platformName: string;
  title: string;
  author: string;
  duration?: string;
  thumbnail?: string;
  likes?: string;
  views?: string;
  date?: string;
  mediaType: 'video' | 'audio' | 'image';
  qualities: Quality[];
  audioQualities: Quality[];
  directVideoUrl?: string;
  directAudioUrl?: string;
  embedUrl?: string;
  notice?: string;
}

/* ------------------------------------------------------------------ */
/* URL + response helpers                                             */
/* ------------------------------------------------------------------ */

function normalizeMediaUrl(raw: string): string | null {
  try {
    const withScheme = raw.startsWith('//') ? `https:${raw}` : raw;
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Blocks localhost/private targets so the proxy cannot be used to reach the
 * server's own network (SSRF). Only public http(s) URLs are allowed.
 */
function isPublicHttpUrl(raw: string): boolean {
  const normalized = normalizeMediaUrl(raw);
  if (!normalized) return false;
  try {
    const host = new URL(normalized).hostname.toLowerCase();
    if (!host) return false;
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    if (host.startsWith('[') || host.includes(':')) return false; // IPv6 literal
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      const [a, b] = host.split('.').map(Number);
      if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 192 && b === 168) ||
        (a === 172 && b >= 16 && b <= 31)
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function isPublicUrlOrNull(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return isPublicHttpUrl(raw) ? normalizeMediaUrl(raw) : null;
}

function refererForMediaUrl(rawUrl: string): string {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    if (host.includes('cdninstagram') || host.endsWith('instagram.com')) return 'https://www.instagram.com/';
    if (host.includes('fbcdn') || host.endsWith('facebook.com')) return 'https://www.facebook.com/';
    if (host.includes('tiktok') || host.includes('tikwm')) return 'https://www.tiktok.com/';
    if (host.includes('twimg') || host.endsWith('x.com') || host.endsWith('twitter.com')) return 'https://x.com/';
    if (host.includes('pinimg') || host.endsWith('pinterest.com')) return 'https://www.pinterest.com/';
    if (host.includes('googlevideo') || host.includes('ytimg') || host.endsWith('youtube.com')) return 'https://www.youtube.com/';
    if (host.includes('sndcdn') || host.endsWith('soundcloud.com')) return 'https://soundcloud.com/';
    if (host.includes('scdn') || host.endsWith('spotify.com')) return 'https://open.spotify.com/';
    if (host.includes('vimeocdn') || host.endsWith('vimeo.com')) return 'https://vimeo.com/';
    return 'https://www.google.com/';
  } catch {
    return 'https://www.google.com/';
  }
}

function mediaFetchHeaders(mediaUrl: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    'User-Agent': BROWSER_USER_AGENT,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Referer': refererForMediaUrl(mediaUrl),
    ...extra,
  };
}

async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function formatBytes(bytes: number): string | undefined {
  if (!Number.isFinite(bytes) || bytes <= 0) return undefined;
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Real size of the remote file, when the CDN reports it. */
async function remoteFileSize(url: string): Promise<string | undefined> {
  try {
    const head = await fetchWithTimeout(url, { method: 'HEAD', headers: mediaFetchHeaders(url) }, 6000);
    if (!head.ok) return undefined;
    const value = head.headers.get('content-length');
    if (!value) return undefined;
    return formatBytes(parseInt(value, 10));
  } catch {
    return undefined;
  }
}

const PROXY_DOWNLOAD = '/api/proxy-download';
const PROXY_STREAM = '/api/proxy-stream';
const PROXY_THUMB = '/api/proxy-thumbnail';
const CONVERT = '/api/convert';
const YOUTUBE_VIDEO = '/api/youtube/video';
const YOUTUBE_AUDIO = '/api/youtube/audio';
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || 'kimne78kx3ncx6brgo4mv6wki5h1ko';

function streamUrl(mediaUrl: string): string {
  return `${PROXY_STREAM}?url=${encodeURIComponent(mediaUrl)}`;
}

function downloadUrl(mediaUrl: string, fileName: string): string {
  return `${PROXY_DOWNLOAD}?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(fileName)}`;
}

function thumbUrl(mediaUrl: string): string {
  return `${PROXY_THUMB}?url=${encodeURIComponent(mediaUrl)}`;
}

/** MP3 is produced by ffmpeg from a real media URL, never by renaming a file. */
function convertedMp3(mediaUrl: string, fileNameBase: string): Quality {
  return {
    id: `mp3-${fileNameBase}`,
    label: 'Audio MP3 192 kbps (dikonversi dengan ffmpeg)',
    bitrate: '192 kbps',
    format: 'mp3',
    badge: 'MP3 Asli',
    downloadUrl: `${CONVERT}?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(`${fileNameBase}.mp3`)}`,
  };
}

function safeBaseName(raw: string, fallback = 'media'): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60)
    .replace(/^_+|_+$/g, '');
  return cleaned || fallback;
}

function formatDuration(seconds: number): string | undefined {
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* YouTube helpers                                                    */
/* ------------------------------------------------------------------ */

const ytdl = new Ytdl();
const YT_CACHE_DIR = path.join(os.tmpdir(), 'downloader-zone-media');
mkdirSync(YT_CACHE_DIR, { recursive: true });

const ytInfoCache = new Map<string, { info: any; expires: number }>();
const ytInfoPending = new Map<string, Promise<any>>();
const ytVideoCache = new Map<string, { file: string; dir: string; expires: number }>();
const ytVideoPending = new Map<string, Promise<{ file: string; dir: string; expires: number }>>();
const YT_VIDEO_TTL = 30 * 60 * 1000;

function extractYouTubeId(raw: string): string | null {
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (!host.endsWith('youtube.com')) return null;
    const fromQuery = url.searchParams.get('v');
    if (fromQuery && /^[A-Za-z0-9_-]{11}$/.test(fromQuery)) return fromQuery;
    const match = url.pathname.match(/\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function youTubeErrorMessage(error: any): string {
  const raw = String(error?.message || error || '').toLowerCase();
  if (raw.includes('private')) return 'Video YouTube ini privat dan tidak bisa diakses tanpa izin pemiliknya.';
  if (raw.includes('age') || raw.includes('sign in') || raw.includes('login')) {
    return 'Video YouTube ini dibatasi usia atau memerlukan login, sehingga tidak bisa diunduh.';
  }
  if (raw.includes('upcoming') || raw.includes('premiere')) return 'Video YouTube ini belum tayang (premiere/upcoming).';
  if (raw.includes('live')) return 'Siaran langsung YouTube tidak didukung. Gunakan tautan video yang sudah selesai disiarkan.';
  if (raw.includes('not available') || raw.includes('unavailable') || raw.includes('removed') || raw.includes('404')) {
    return 'Video YouTube tidak tersedia. Mungkin dihapus, diblokir di wilayah server, atau tautannya salah.';
  }
  if (raw.includes('timeout')) return 'YouTube terlalu lama merespons. Coba lagi beberapa saat.';
  return 'YouTube tidak dapat membaca video ini. Pastikan video publik, bukan playlist, dan tautannya masih aktif.';
}

async function getYouTubeInfo(videoId: string): Promise<any> {
  const cached = ytInfoCache.get(videoId);
  if (cached && cached.expires > Date.now()) return cached.info;

  const pending = ytInfoPending.get(videoId);
  if (pending) return pending;

  const task = withTimeout(ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`), 30000, 'YouTube')
    .then((info: any) => {
      const expires = Math.min(Date.now() + 5 * 60 * 1000, Number(info?.expiresAt) || Date.now() + 5 * 60 * 1000);
      ytInfoCache.set(videoId, { info, expires });
      return info;
    })
    .finally(() => ytInfoPending.delete(videoId));

  ytInfoPending.set(videoId, task);
  return task;
}

function bestYouTubeAudio(info: any): any | undefined {
  return info.formats
    .filter((format: any) => format.hasAudio && !format.hasVideo && format.container === 'mp4')
    .sort((a: any, b: any) => Number(b.bitrate || 0) - Number(a.bitrate || 0))[0];
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(FFMPEG_PATH, args);
    let stderr = '';
    process.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-1500);
    });
    process.on('error', reject);
    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg keluar dengan kode ${code}`));
    });
  });
}

async function downloadYouTubeFormat(info: any, format: any, destination: string): Promise<void> {
  await pipeline(ytdl.download(info, { format }), createWriteStream(destination));
}

function pruneYouTubeVideoCache(): void {
  const now = Date.now();
  for (const [key, entry] of ytVideoCache) {
    if (entry.expires <= now) {
      ytVideoCache.delete(key);
      rm(entry.dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

async function buildYouTubeVideo(videoId: string, itag: number): Promise<{ file: string; dir: string; expires: number }> {
  const key = `${videoId}:${itag}`;
  const cached = ytVideoCache.get(key);
  if (cached && existsSync(cached.file)) return cached;

  const pending = ytVideoPending.get(key);
  if (pending) return pending;

  const task = (async () => {
    const info = await getYouTubeInfo(videoId);
    const video = info.formats.find((format: any) => Number(format.itag) === itag && format.hasVideo);
    if (!video) throw new Error('Kualitas video YouTube ini tidak tersedia lagi. Proses ulang tautan lalu pilih kualitas lain.');

    const dir = await mkdtemp(path.join(YT_CACHE_DIR, 'yt-'));
    const output = path.join(dir, `${videoId}-${itag}.mp4`);

    try {
      if (video.hasAudio) {
        await downloadYouTubeFormat(info, video, output);
      } else {
        const audio = bestYouTubeAudio(info);
        if (!audio) throw new Error('YouTube tidak menyediakan stream audio untuk video ini.');
        const videoFile = path.join(dir, 'video.mp4');
        const audioFile = path.join(dir, 'audio.m4a');

        await Promise.all([
          downloadYouTubeFormat(info, video, videoFile),
          downloadYouTubeFormat(info, audio, audioFile),
        ]);

        await runFfmpeg([
          '-hide_banner',
          '-loglevel', 'error',
          '-i', videoFile,
          '-i', audioFile,
          '-c', 'copy',
          '-shortest',
          '-movflags', '+faststart',
          output,
        ]);

        await Promise.all([
          unlink(videoFile).catch(() => undefined),
          unlink(audioFile).catch(() => undefined),
        ]);
      }

      const entry = { file: output, dir, expires: Date.now() + YT_VIDEO_TTL };
      ytVideoCache.set(key, entry);
      return entry;
    } catch (error) {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
      throw error;
    }
  })().finally(() => ytVideoPending.delete(key));

  ytVideoPending.set(key, task);
  return task;
}

/* ------------------------------------------------------------------ */
/* HTML metadata helpers                                              */
/* ------------------------------------------------------------------ */

function extractMetaTags(html: string) {
  const getTag = (prop: string) => {
    const regex1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i');
    const regex3 = new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const m = html.match(regex1) || html.match(regex2) || html.match(regex3);
    return m ? decodeHtmlEntities(m[1]) : null;
  };

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

  return {
    title: getTag('og:title') || getTag('twitter:title') || (titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null),
    description: getTag('og:description') || getTag('twitter:description') || getTag('description'),
    image: getTag('og:image') || getTag('twitter:image') || getTag('og:image:secure_url'),
    video: getTag('og:video') || getTag('og:video:url') || getTag('og:video:secure_url') || getTag('twitter:player:stream'),
    siteName: getTag('og:site_name'),
  };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x?[0-9a-f]+;/gi, ' ')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Media response validation                                          */
/* ------------------------------------------------------------------ */

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'weba',
  'audio/flac': 'flac',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4a: 'audio/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

function extensionForContentType(contentType: string): string {
  const base = (contentType || '').split(';')[0].trim().toLowerCase();
  if (CONTENT_TYPE_EXTENSIONS[base]) return CONTENT_TYPE_EXTENSIONS[base];
  if (/^(video|audio|image)\//.test(base)) return base.split('/')[1] || '';
  return '';
}

function isGenericContentType(contentType: string): boolean {
  const base = (contentType || '').split(';')[0].trim().toLowerCase();
  return !base || base === 'application/octet-stream' || base === 'binary/octet-stream';
}

function isNonMediaDocument(contentType: string): boolean {
  const base = (contentType || '').split(';')[0].trim().toLowerCase();
  return base.startsWith('text/') || base.includes('json') || base.includes('xml') || base.includes('html');
}

function detectMediaExtension(chunk: Uint8Array): string {
  if (!chunk || chunk.length < 12) return '';
  const head = (start: number, length: number) =>
    String.fromCharCode(...Array.from(chunk.subarray(start, start + length)));

  if (chunk[0] === 0xff && chunk[1] === 0xd8 && chunk[2] === 0xff) return 'jpg';
  if (chunk[0] === 0x89 && head(1, 3) === 'PNG') return 'png';
  if (head(0, 3) === 'GIF') return 'gif';
  if (head(0, 4) === 'RIFF') {
    const kind = head(8, 4);
    if (kind === 'WEBP') return 'webp';
    if (kind === 'WAVE') return 'wav';
  }
  if (head(4, 4) === 'ftyp') {
    const brand = head(8, 4);
    return brand.startsWith('M4A') ? 'm4a' : 'mp4';
  }
  if (head(0, 4) === 'OggS') return 'ogg';
  if (head(0, 4) === 'fLaC') return 'flac';
  if (chunk[0] === 0x1a && chunk[1] === 0x45 && chunk[2] === 0xdf && chunk[3] === 0xa3) return 'webm';
  if (head(0, 3) === 'ID3' || (chunk[0] === 0xff && (chunk[1] & 0xe0) === 0xe0)) return 'mp3';
  return '';
}

function looksLikeTextDocument(chunk: Uint8Array): boolean {
  if (!chunk || chunk.length === 0) return false;
  const head = Buffer.from(chunk.subarray(0, 120)).toString('utf8').trimStart().toLowerCase();
  return head.startsWith('<') || head.startsWith('{') || head.startsWith('[');
}

function sanitizeDownloadFilename(rawName: string, contentType: string): string {
  const requestedExt = (rawName.match(/\.([a-z0-9]{2,5})$/i)?.[1] || '').toLowerCase();
  let base = path
    .basename(rawName || 'download')
    .replace(/[\\/:*?"<>|\r\n\t]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim();

  if (!base) base = 'download';

  const actualExt = extensionForContentType(contentType);
  if (actualExt) {
    base = requestedExt === actualExt ? base : `${base.replace(/\.[a-z0-9]{2,5}$/i, '')}.${actualExt}`;
  } else if (!requestedExt) {
    base = `${base}.bin`;
  }

  if (base.length > 120) {
    const ext = base.match(/\.[a-z0-9]{2,5}$/i)?.[0] || '';
    base = `${base.slice(0, 120 - ext.length)}${ext}`;
  }

  return base;
}

function contentDispositionFor(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_') || 'download';
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/* ------------------------------------------------------------------ */
/* Thumbnail proxy                                                    */
/* ------------------------------------------------------------------ */

app.get(PROXY_THUMB, async (req: Request, res: ExpressResponse) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Parameter URL wajib diisi.' });
  }
  const mediaUrl = isPublicUrlOrNull(url);
  if (!mediaUrl) {
    return res.status(400).json({ success: false, error: 'URL gambar tidak valid.' });
  }

  try {
    const upstream = await fetchWithTimeout(
      mediaUrl,
      { headers: mediaFetchHeaders(mediaUrl, { Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }) },
      15000
    );

    const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!upstream.ok || !contentType.startsWith('image/')) {
      await upstream.arrayBuffer().catch(() => undefined);
      return res.status(502).json({ success: false, error: 'Thumbnail tidak dapat dimuat dari sumber.' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const buffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy thumbnail error:', err);
    return res.status(502).json({ success: false, error: 'Gagal memuat thumbnail.' });
  }
});

/* ------------------------------------------------------------------ */
/* Stream proxy                                                       */
/* ------------------------------------------------------------------ */

app.get(PROXY_STREAM, async (req: Request, res: ExpressResponse) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Parameter URL wajib diisi.' });
  }
  const mediaUrl = isPublicUrlOrNull(url);
  if (!mediaUrl) {
    return res.status(400).json({ success: false, error: 'URL media tidak valid.' });
  }

  const abortController = new AbortController();
  res.on('close', () => abortController.abort());

  try {
    const headers = mediaFetchHeaders(mediaUrl);
    if (typeof req.headers.range === 'string') headers['Range'] = req.headers.range;

    const upstream = await fetch(mediaUrl, { headers, redirect: 'follow', signal: abortController.signal });
    const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

    if (!upstream.ok) {
      await upstream.arrayBuffer().catch(() => undefined);
      return res.status(502).json({ success: false, error: `Sumber media menolak pemutaran (HTTP ${upstream.status}).` });
    }
    if (isNonMediaDocument(contentType)) {
      await upstream.arrayBuffer().catch(() => undefined);
      return res.status(502).json({ success: false, error: 'Sumber mengembalikan halaman error, bukan media.' });
    }

    res.status(upstream.status === 206 ? 206 : 200);
    for (const header of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }
    if (!upstream.headers.get('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, no-store');

    if (upstream.body) {
      // @ts-ignore undici ReadableStream is compatible with Readable.fromWeb
      await pipeline(Readable.fromWeb(upstream.body), res);
    } else {
      res.end();
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return;
    console.error('Proxy stream error:', err);
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: 'Gagal memutar media dari sumber.' });
    }
  }
});

/* ------------------------------------------------------------------ */
/* Download proxy                                                     */
/* ------------------------------------------------------------------ */

app.all(PROXY_DOWNLOAD, async (req: Request, res: ExpressResponse) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ success: false, error: 'Metode tidak didukung.' });
  }

  const { url, filename } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Parameter URL wajib diisi.' });
  }
  const mediaUrl = isPublicUrlOrNull(url);
  if (!mediaUrl) {
    return res.status(400).json({ success: false, error: 'URL media tidak valid (hanya http/https publik).' });
  }

  const isHeadOnly = req.method === 'HEAD';
  const abortController = new AbortController();
  res.on('close', () => abortController.abort());

  try {
    const upstreamHeaders = mediaFetchHeaders(mediaUrl);
    if (!isHeadOnly && typeof req.headers.range === 'string') {
      upstreamHeaders['Range'] = req.headers.range;
    } else if (isHeadOnly) {
      upstreamHeaders['Range'] = 'bytes=0-0';
    }

    const upstream = await fetch(mediaUrl, {
      headers: upstreamHeaders,
      redirect: 'follow',
      signal: abortController.signal,
    });

    const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

    if (!upstream.ok) {
      await upstream.arrayBuffer().catch(() => undefined);
      return res.status(upstream.status === 416 ? 416 : 502).json({
        success: false,
        error: `Sumber media menolak unduhan (HTTP ${upstream.status}). Tautan CDN mungkin sudah kedaluwarsa atau membutuhkan sesi/cookie. Proses ulang tautan lalu coba lagi.`,
      });
    }

    if (isNonMediaDocument(contentType)) {
      await upstream.arrayBuffer().catch(() => undefined);
      return res.status(502).json({
        success: false,
        error: 'Sumber mengembalikan halaman error, bukan file media. Tautan kemungkinan sudah kedaluwarsa atau butuh login.',
      });
    }

    let effectiveContentType = contentType;
    let firstChunk: Uint8Array | null = null;
    let bodyReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    if (!isHeadOnly && isGenericContentType(contentType) && upstream.body) {
      bodyReader = upstream.body.getReader();
      const first = await bodyReader.read();
      if (first.value && first.value.length > 0) {
        firstChunk = first.value;
        if (looksLikeTextDocument(firstChunk)) {
          await bodyReader.cancel().catch(() => undefined);
          return res.status(502).json({
            success: false,
            error: 'Sumber mengembalikan halaman error, bukan file media. Proses ulang tautan lalu coba lagi.',
          });
        }
        const detected = detectMediaExtension(firstChunk);
        if (detected) effectiveContentType = MIME_BY_EXTENSION[detected] || contentType;
      }
    }

    const upstreamDispositionName = upstream.headers
      .get('content-disposition')
      ?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)?.[1];
    let upstreamName = '';
    if (upstreamDispositionName) {
      try {
        upstreamName = decodeURIComponent(upstreamDispositionName);
      } catch {
        upstreamName = upstreamDispositionName;
      }
    }

    const requestedName = (typeof filename === 'string' && filename.trim()) || upstreamName || 'downloaded_media';

    // Some CDNs (notably Facebook) label valid MP4s as application/octet-stream.
    // Infer the real type from the requested filename so HEAD checks and browsers
    // treat the file as playable media instead of a generic binary.
    if (isGenericContentType(effectiveContentType)) {
      const requestedExt = requestedName.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
      if (requestedExt && MIME_BY_EXTENSION[requestedExt]) {
        effectiveContentType = MIME_BY_EXTENSION[requestedExt];
      }
    }

    const safeFilename = sanitizeDownloadFilename(requestedName, effectiveContentType);

    res.setHeader('Content-Type', effectiveContentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', contentDispositionFor(safeFilename));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Accept-Ranges', 'bytes');

    const contentRange = upstream.headers.get('content-range');
    if (!isHeadOnly && contentRange) res.setHeader('Content-Range', contentRange);

    const contentEncoding = upstream.headers.get('content-encoding');
    const contentLength = upstream.headers.get('content-length');
    const isEncoded = !!contentEncoding && contentEncoding.toLowerCase() !== 'identity';
    if (!isHeadOnly && !isEncoded && contentLength) res.setHeader('Content-Length', contentLength);

    if (isHeadOnly) return res.status(200).end();

    res.status(upstream.status === 206 ? 206 : 200);

    if (bodyReader) {
      const reader = bodyReader;
      const initialChunk = firstChunk;
      const nodeStream = Readable.from(
        (async function* () {
          if (initialChunk) yield Buffer.from(initialChunk);
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value && value.length > 0) yield Buffer.from(value);
          }
        })()
      );
      await pipeline(nodeStream, res);
    } else if (upstream.body) {
      // @ts-ignore undici ReadableStream is compatible with Readable.fromWeb
      await pipeline(Readable.fromWeb(upstream.body), res);
    } else {
      res.end();
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return;
    console.error('Proxy download error:', err);
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: 'Gagal mengunduh file dari sumber. Proses ulang tautan lalu coba lagi.' });
    }
  }
});

/* ------------------------------------------------------------------ */
/* Real MP3 conversion with ffmpeg                                    */
/* ------------------------------------------------------------------ */

async function preflightMedia(mediaUrl: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  try {
    const upstream = await fetchWithTimeout(
      mediaUrl,
      { headers: mediaFetchHeaders(mediaUrl, { Range: 'bytes=0-1' }), redirect: 'follow' },
      15000
    );
    const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    await upstream.body?.cancel().catch(() => undefined);

    if (!upstream.ok) {
      return {
        ok: false,
        status: 502,
        error: `Sumber media menolak akses (HTTP ${upstream.status}). Tautan mungkin kedaluwarsa; proses ulang tautan.`,
      };
    }
    if (isNonMediaDocument(contentType)) {
      return { ok: false, status: 502, error: 'Sumber mengembalikan halaman error, bukan media yang bisa dikonversi.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 502, error: 'Tidak dapat menjangkau sumber media untuk konversi.' };
  }
}

app.all(CONVERT, async (req: Request, res: ExpressResponse) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ success: false, error: 'Metode tidak didukung.' });
  }

  const { url, filename } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Parameter URL wajib diisi.' });
  }
  const mediaUrl = isPublicUrlOrNull(url);
  if (!mediaUrl) {
    return res.status(400).json({ success: false, error: 'URL media tidak valid (hanya http/https publik).' });
  }

  const requestedName = typeof filename === 'string' && filename.trim() ? filename : 'audio.mp3';
  const safeFilename = sanitizeDownloadFilename(requestedName.replace(/\.(mp3|m4a|wav|ogg)$/i, '') + '.mp3', 'audio/mpeg');

  const check = await preflightMedia(mediaUrl);
  if (!check.ok) return res.status(check.status).json({ success: false, error: check.error });

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', contentDispositionFor(safeFilename));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method === 'HEAD') return res.status(200).end();

  const abortController = new AbortController();
  let finished = false;

  const ffmpeg = spawn(FFMPEG_PATH, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    'pipe:0',
    '-vn',
    '-ac',
    '2',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    '-f',
    'mp3',
    'pipe:1',
  ]);

  let stderr = '';
  ffmpeg.stderr.on('data', (chunk) => {
    stderr = (stderr + chunk.toString()).slice(-1200);
  });

  const cleanup = () => {
    if (finished) return;
    finished = true;
    abortController.abort();
    if (!ffmpeg.killed) ffmpeg.kill('SIGKILL');
  };
  res.on('close', cleanup);

  try {
    const upstream = await fetch(mediaUrl, {
      headers: mediaFetchHeaders(mediaUrl),
      redirect: 'follow',
      signal: abortController.signal,
    });

    if (!upstream.ok || !upstream.body) {
      ffmpeg.kill('SIGKILL');
      return res.status(502).json({ success: false, error: 'Gagal mengambil media sumber untuk konversi.' });
    }

    // @ts-ignore undici ReadableStream is compatible with Readable.fromWeb
    const source = Readable.fromWeb(upstream.body);
    source.on('error', () => undefined);
    source.pipe(ffmpeg.stdin!);

    ffmpeg.stdin!.on('error', () => undefined);
    ffmpeg.stdout.pipe(res);

    ffmpeg.on('close', (code) => {
      if (finished) return;
      finished = true;
      if (code !== 0) {
        console.error('ffmpeg conversion failed:', stderr);
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            error: 'Konversi audio gagal. Sumber mungkin bukan video/audio yang valid atau tautan sudah kedaluwarsa.',
          });
        } else {
          res.destroy();
        }
      } else {
        res.end();
      }
    });
  } catch (err: any) {
    cleanup();
    if (err?.name === 'AbortError') return;
    console.error('Conversion error:', err);
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: 'Gagal mengonversi media ke MP3.' });
    }
  }
});

/* ------------------------------------------------------------------ */
/* Platform resolvers                                                 */
/* ------------------------------------------------------------------ */

function detectPlatform(url: string): string {
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/instagram\.com|instagr\.am/i.test(url)) return 'instagram';
  if (/facebook\.com|fb\.watch|fb\.com/i.test(url)) return 'facebook';
  if (/pinterest\.com|pin\.it/i.test(url)) return 'pinterest';
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/twitch\.tv/i.test(url)) return 'twitch';
  if (/spotify\.com/i.test(url)) return 'spotify';
  if (/music\.apple\.com/i.test(url)) return 'applemusic';
  if (/soundcloud\.com/i.test(url)) return 'soundcloud';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  if (/threads\.net/i.test(url)) return 'threads';
  return 'other';
}

async function resolveTikTok(cleanUrl: string): Promise<ResolvedMedia> {
  const response = await fetchWithTimeout(
    'https://tikwm.com/api/',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url: cleanUrl }),
    },
    20000
  );
  if (!response.ok) throw new Error(`TikTok resolver menolak permintaan (HTTP ${response.status}).`);
  const payload: any = await response.json();
  if (!payload || payload.code !== 0 || !payload.data) {
    throw new Error(payload?.msg || 'TikTok tidak dapat membaca tautan ini. Pastikan video publik dan masih aktif.');
  }

  const item = payload.data;
  const host = 'https://tikwm.com';
  const rawVideo = item.hdplay || item.play || item.wmplay;
  const videoUrl = isPublicUrlOrNull(rawVideo?.startsWith('http') ? rawVideo : `${host}${rawVideo}`);
  if (!videoUrl) throw new Error('TikTok tidak mengembalikan tautan video yang valid.');

  const rawMusic = item.music;
  const musicUrl = isPublicUrlOrNull(rawMusic?.startsWith('http') ? rawMusic : rawMusic ? `${host}${rawMusic}` : null);
  const rawCover = item.cover;
  const coverUrl = isPublicUrlOrNull(rawCover?.startsWith('http') ? rawCover : rawCover ? `${host}${rawCover}` : null);

  const base = safeBaseName(`DownloaderZone_TikTok_${item.id || item.author?.unique_id || 'video'}`, 'tiktok');
  const size = item.size ? formatBytes(Number(item.size)) : await remoteFileSize(videoUrl);
  const resolution = item.height ? `${item.height}p` : undefined;

  return {
    platform: 'tiktok',
    platformName: 'TikTok',
    title: item.title?.trim() || 'Video TikTok',
    author: `@${item.author?.unique_id || item.author?.nickname || 'tiktok_creator'}`,
    duration: item.duration
      ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`
      : undefined,
    thumbnail: coverUrl ? thumbUrl(coverUrl) : undefined,
    likes: item.digg_count ? `${Number(item.digg_count).toLocaleString()} suka` : undefined,
    views: item.play_count ? `${Number(item.play_count).toLocaleString()} tontonan` : undefined,
    date: 'TikTok',
    mediaType: 'video',
    directVideoUrl: streamUrl(videoUrl),
    directAudioUrl: musicUrl ? streamUrl(musicUrl) : undefined,
    qualities: [
      {
        id: 'tiktok-video',
        label: 'Video MP4 tanpa watermark',
        resolution,
        format: 'mp4',
        fileSize: size,
        downloadUrl: downloadUrl(videoUrl, `${base}.mp4`),
        isPopular: true,
        badge: 'Asli',
      },
    ],
    audioQualities: [convertedMp3(videoUrl, base)],
  };
}

async function resolveInstagram(cleanUrl: string): Promise<ResolvedMedia> {
  const isStory = /stories/i.test(cleanUrl);
  const reelMatch = cleanUrl.match(/reel(?:s)?\/([a-zA-Z0-9_-]+)/);
  const postMatch = cleanUrl.match(/\/p\/([a-zA-Z0-9_-]+)/);
  const tvMatch = cleanUrl.match(/\/tv\/([a-zA-Z0-9_-]+)/);
  const shareMatch = cleanUrl.match(/share\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
  const storyMatch = cleanUrl.match(/stories\/([a-zA-Z0-9._-]+)(?:\/(\d+))?/);
  const shortcode = reelMatch?.[1] || postMatch?.[1] || tvMatch?.[1] || shareMatch?.[1] || '';
  const storyUser = storyMatch?.[1] || '';

  let realTitle: string | null = null;
  let realAuthor: string | null = null;
  let realThumb: string | null = null;
  let realVideoUrl: string | null = null;
  let realLikes: string | null = null;
  let realDate: string | null = null;
  let foundMediaList: any[] = [];

  try {
    const snapFn = SnapVideo.default || SnapVideo;
    const snapRes: any = await withTimeout(
      Promise.resolve(snapFn(cleanUrl, { type: isStory ? 'story' : 'media' })),
      20000,
      'Instagram resolver'
    );
    if (snapRes?.media?.length) {
      foundMediaList = snapRes.media;
      const firstVideo = snapRes.media.find((m: any) => m.type === 'video' && m.url);
      if (firstVideo) realVideoUrl = firstVideo.url;
      const firstPhoto = snapRes.media.find((m: any) => m.type === 'photo' && m.url);
      if (firstPhoto) realThumb = firstPhoto.url;
      if (snapRes.raw && typeof snapRes.raw.data === 'string') {
        const thumbMatch = snapRes.raw.data.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (thumbMatch?.[1] && !realThumb) realThumb = thumbMatch[1];
      }
    }
  } catch (err) {
    console.warn('Instagram resolver warning:', (err as Error).message);
  }

  try {
    const page = await fetchWithTimeout(
      cleanUrl,
      {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      15000
    );
    if (page.ok) {
      const html = await page.text();
      const meta = extractMetaTags(html);

      if (meta.title && !meta.title.includes('Login • Instagram')) {
        const authorMatch = meta.title.match(/^([^:]+)\s+on\s+Instagram/i);
        if (authorMatch) realAuthor = `@${authorMatch[1].trim()}`;
        const cleanCap = meta.title
          .replace(/^[^:]+?\s+on\s+Instagram:\s*["“]?/i, '')
          .replace(/["”]?$/, '')
          .trim();
        if (cleanCap && cleanCap !== meta.title) realTitle = cleanCap;
      }

      if (meta.description && !meta.description.includes('Login • Instagram')) {
        const likesMatch = meta.description.match(/(\d[\d,.]*\s*(?:likes|suka))/i);
        if (likesMatch) realLikes = likesMatch[1];
        const dateMatch = meta.description.match(/on\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
        if (dateMatch) realDate = dateMatch[1];
        const handleMatch = meta.description.match(/-\s*([a-zA-Z0-9._-]+)\s+on/i);
        if (handleMatch && !realAuthor) realAuthor = `@${handleMatch[1]}`;
        if (!realTitle) {
          const descCap = meta.description.match(/:\s*["“]([\s\S]+?)["”]?$/);
          if (descCap) realTitle = descCap[1].trim();
        }
      }

      if (meta.image && !realThumb && !meta.image.includes('default-og')) realThumb = meta.image;
      if (meta.video && !realVideoUrl) realVideoUrl = meta.video;
    }
  } catch (err) {
    console.warn('Instagram meta warning:', (err as Error).message);
  }

  if (shortcode && !realVideoUrl) {
    try {
      const mirror = await fetchWithTimeout(
        `https://www.vxinstagram.com/${/reel/i.test(cleanUrl) ? 'reel' : 'p'}/${shortcode}/`,
        { headers: { 'User-Agent': 'facebookexternalhit/1.1' } },
        12000
      );
      if (mirror.ok) {
        const html = await mirror.text();
        const meta = extractMetaTags(html);
        if (meta.video && !realVideoUrl) realVideoUrl = meta.video;
        if (meta.image && !realThumb) realThumb = meta.image;
        if (meta.description && !realTitle) realTitle = meta.description;
        if (meta.title && !realAuthor) realAuthor = meta.title;
      }
    } catch (err) {
      console.warn('Instagram mirror warning:', (err as Error).message);
    }
  }

  const videoUrl = isPublicUrlOrNull(realVideoUrl);
  const imageUrl = isPublicUrlOrNull(realThumb);

  if (isStory && !videoUrl && foundMediaList.length === 0) {
    throw new Error(
      `Instagram Story ${storyUser ? `@${storyUser}` : 'ini'} tidak dapat diunduh. Story mungkin sudah kedaluwarsa (>24 jam) atau akunnya privat.`
    );
  }
  if (!videoUrl && !imageUrl && foundMediaList.length === 0) {
    throw new Error('Konten Instagram tidak dapat diakses. Pastikan postingan publik, bukan story kedaluwarsa, dan tautannya benar.');
  }

  const photoItems = foundMediaList.filter((m: any) => m.type === 'photo' && isPublicHttpUrl(m.url));
  const isImageOnly = !videoUrl && (photoItems.length > 0 || !!imageUrl);
  const base = safeBaseName(`DownloaderZone_Instagram_${storyUser || shortcode || 'media'}`, 'instagram');

  const qualities: Quality[] = [];
  const audioQualities: Quality[] = [];

  if (isImageOnly) {
    if (photoItems.length > 0) {
      photoItems.forEach((photo: any, index: number) => {
        const url = normalizeMediaUrl(photo.url)!;
        qualities.push({
          id: `ig-photo-${index}`,
          label: photoItems.length > 1 ? `Foto carousel ${index + 1} (asli)` : 'Foto asli resolusi penuh',
          format: 'jpg',
          downloadUrl: downloadUrl(url, `${base}_${index + 1}.jpg`),
          isPopular: index === 0,
          badge: 'JPG',
        });
      });
    } else if (imageUrl) {
      qualities.push({
        id: 'ig-photo',
        label: 'Foto asli resolusi penuh',
        format: 'jpg',
        fileSize: await remoteFileSize(imageUrl),
        downloadUrl: downloadUrl(imageUrl, `${base}.jpg`),
        isPopular: true,
        badge: 'JPG',
      });
    }
  } else if (videoUrl) {
    qualities.push({
      id: 'ig-video',
      label: 'Video MP4 kualitas asli',
      format: 'mp4',
      fileSize: await remoteFileSize(videoUrl),
      downloadUrl: downloadUrl(videoUrl, `${base}.mp4`),
      isPopular: true,
      badge: 'MP4',
    });
    audioQualities.push(convertedMp3(videoUrl, base));
  }

  return {
    platform: 'instagram',
    platformName: isStory ? 'Instagram Story' : isImageOnly ? 'Instagram Foto' : /reel/i.test(cleanUrl) ? 'Instagram Reels' : 'Instagram',
    title: realTitle || (isStory ? `Instagram Story @${storyUser || 'creator'}` : isImageOnly ? 'Foto Instagram' : 'Video Instagram'),
    author: realAuthor || (storyUser ? `@${storyUser}` : 'Instagram'),
    duration: undefined,
    thumbnail: imageUrl ? thumbUrl(imageUrl) : photoItems[0] ? thumbUrl(normalizeMediaUrl(photoItems[0].url)!) : undefined,
    likes: realLikes || undefined,
    date: realDate || 'Instagram',
    mediaType: isImageOnly ? 'image' : 'video',
    directVideoUrl: videoUrl ? streamUrl(videoUrl) : undefined,
    qualities,
    audioQualities,
  };
}

async function resolveFacebook(cleanUrl: string): Promise<ResolvedMedia> {
  let mediaList: any[] = [];
  let description = '';
  let preview: string | null = null;

  try {
    const snapRes: any = await withTimeout(Promise.resolve(snapsave(cleanUrl)), 12000, 'Facebook resolver');
    if (snapRes?.success && snapRes.data) {
      mediaList = (snapRes.data.media || []).filter((m: any) => isPublicHttpUrl(m?.url));
      preview = isPublicUrlOrNull(snapRes.data.preview || snapRes.data.thumbnail);
      description = (snapRes.data.description || '').trim();
    }
  } catch (err) {
    console.warn('Facebook resolver warning:', (err as Error).message);
  }

  let meta: ReturnType<typeof extractMetaTags> | null = null;
  if (mediaList.length === 0 || !preview) {
    try {
      const page = await fetchWithTimeout(
        cleanUrl,
        {
          headers: {
            'User-Agent': BROWSER_USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow',
        },
        15000
      );
      if (page.ok) {
        meta = extractMetaTags(await page.text());
        if (!preview && meta.image) preview = isPublicUrlOrNull(meta.image);
        if (mediaList.length === 0 && meta.video) {
          const video = isPublicUrlOrNull(meta.video);
          if (video) mediaList = [{ url: video, resolution: 'Kualitas sumber' }];
        }
      }
    } catch (err) {
      console.warn('Facebook meta warning:', (err as Error).message);
    }
  }

  if (mediaList.length === 0) {
    throw new Error('Video Facebook tidak dapat diambil. Pastikan video publik, bukan dari grup privat, dan tautannya masih aktif.');
  }

  const base = safeBaseName(`DownloaderZone_Facebook_${description || 'video'}`, 'facebook');
  const qualities: Quality[] = [];

  for (let index = 0; index < mediaList.length; index += 1) {
    const media = mediaList[index];
    const url = normalizeMediaUrl(media.url)!;
    const label = media.resolution ? `Video MP4 (${media.resolution})` : index === 0 ? 'Video MP4 kualitas terbaik' : `Video MP4 alternatif ${index + 1}`;
    qualities.push({
      id: `fb-video-${index}`,
      label,
      resolution: media.resolution || undefined,
      format: 'mp4',
      fileSize: index === 0 ? await remoteFileSize(url) : undefined,
      downloadUrl: downloadUrl(url, `${base}_${index + 1}.mp4`),
      isPopular: index === 0,
      badge: 'MP4',
    });
  }

  const firstVideo = normalizeMediaUrl(mediaList[0].url)!;
  const rawTitle = (description || meta?.title || '').trim();
  const title = rawTitle && !/^[.\u2026\s]+$/.test(rawTitle) ? rawTitle : 'Video Facebook';

  return {
    platform: 'facebook',
    platformName: /reel/i.test(cleanUrl) ? 'Facebook Reels' : 'Facebook Video',
    title: title.slice(0, 120),
    author: 'Facebook',
    thumbnail: preview ? thumbUrl(preview) : undefined,
    date: 'Facebook',
    mediaType: 'video',
    directVideoUrl: streamUrl(firstVideo),
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=0`,
    qualities,
    audioQualities: [convertedMp3(firstVideo, base)],
  };
}

async function resolvePinterest(cleanUrl: string): Promise<ResolvedMedia> {
  let finalUrl = cleanUrl;
  if (/pin\.it/i.test(cleanUrl)) {
    try {
      const head = await fetchWithTimeout(cleanUrl, { headers: { 'User-Agent': BROWSER_USER_AGENT }, redirect: 'follow' }, 12000);
      finalUrl = head.url || cleanUrl;
      await head.body?.cancel().catch(() => undefined);
    } catch {
      // keep original URL
    }
  }

  const pinId = finalUrl.match(/pin\/(\d+)/)?.[1] || cleanUrl.match(/pin\/(\d+)/)?.[1] || '';
  if (!pinId) throw new Error('Tautan Pinterest tidak mengandung ID pin yang valid.');

  const pidget = await fetchWithTimeout(
    `https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`,
    { headers: { 'User-Agent': BROWSER_USER_AGENT } },
    12000
  );
  if (!pidget.ok) throw new Error(`Pinterest menolak permintaan (HTTP ${pidget.status}).`);

  const payload: any = await pidget.json();
  const info = Array.isArray(payload?.data) ? payload.data[0] : payload?.data?.[pinId] || payload?.data;
  if (!info) throw new Error('Pin Pinterest tidak ditemukan atau sudah dihapus.');

  const storyPages = info.story_pin_data?.pages;
  const storyImage = storyPages?.[0]?.blocks?.[0]?.image?.images?.originals?.url || storyPages?.[0]?.image?.images?.originals?.url;
  const rawImage =
    storyImage ||
    info.images?.orig?.url ||
    info.images?.['564x']?.url ||
    info.images?.['236x']?.url ||
    info.image;
  const imageUrl = isPublicUrlOrNull(rawImage);
  if (!imageUrl) throw new Error('Pinterest tidak mengembalikan URL gambar asli untuk pin ini.');

  const rawTitle = (info.description || info.board?.name || '').toString().trim();
  const title = (rawTitle || 'Foto Pinterest').slice(0, 120);
  const rawAuthor = (info.pinner?.username || info.pinner?.full_name || info.native_creator?.full_name || '')
    .toString()
    .trim();
  const author = rawAuthor ? (rawAuthor.startsWith('@') ? rawAuthor : `@${rawAuthor}`) : 'Pinterest';
  const base = safeBaseName(`DownloaderZone_Pinterest_${pinId}`, 'pinterest');

  return {
    platform: 'pinterest',
    platformName: 'Pinterest',
    title,
    author,
    thumbnail: thumbUrl(imageUrl),
    date: 'Pinterest',
    mediaType: 'image',
    qualities: [
      {
        id: 'pinterest-image',
        label: 'Foto asli resolusi penuh',
        format: 'jpg',
        fileSize: await remoteFileSize(imageUrl),
        downloadUrl: downloadUrl(imageUrl, `${base}.jpg`),
        isPopular: true,
        badge: 'JPG',
      },
    ],
    audioQualities: [],
  };
}

async function resolveTwitter(cleanUrl: string): Promise<ResolvedMedia> {
  const tweetId = cleanUrl.match(/status\/(\d+)/)?.[1];
  if (!tweetId) throw new Error('Tautan X/Twitter tidak mengandung ID postingan yang valid.');

  const response = await fetchWithTimeout(
    `https://api.fxtwitter.com/status/${tweetId}`,
    { headers: { 'User-Agent': BROWSER_USER_AGENT, Accept: 'application/json' } },
    15000
  );
  if (!response.ok) throw new Error(`Postingan X tidak dapat dibaca (HTTP ${response.status}). Mungkin dihapus atau privat.`);

  const payload: any = await response.json();
  const tweet = payload?.tweet;
  if (!tweet) throw new Error('Postingan X tidak ditemukan.');

  const video = tweet.media?.videos?.find((v: any) => isPublicHttpUrl(v?.url));
  const photos = (tweet.media?.photos || []).filter((p: any) => isPublicHttpUrl(p?.url));
  const thumbnailUrl = isPublicUrlOrNull(video?.thumbnail_url || photos[0]?.url);
  const base = safeBaseName(`DownloaderZone_X_${tweetId}`, 'x');
  const qualities: Quality[] = [];

  if (video) {
    qualities.push({
      id: 'x-video',
      label: 'Video MP4',
      format: 'mp4',
      fileSize: await remoteFileSize(video.url),
      downloadUrl: downloadUrl(video.url, `${base}.mp4`),
      isPopular: true,
      badge: 'MP4',
    });
  }
  photos.forEach((photo: any, index: number) => {
    qualities.push({
      id: `x-photo-${index}`,
      label: photos.length > 1 ? `Foto ${index + 1} (asli)` : 'Foto asli',
      format: 'jpg',
      downloadUrl: downloadUrl(photo.url, `${base}_${index + 1}.jpg`),
      isPopular: !video && index === 0,
      badge: 'JPG',
    });
  });

  if (qualities.length === 0) throw new Error('Postingan X ini tidak berisi video atau foto yang bisa diunduh.');

  return {
    platform: 'twitter',
    platformName: 'X (Twitter)',
    title: tweet.text ? tweet.text.slice(0, 120) : 'Postingan X',
    author: `@${tweet.author?.screen_name || 'twitter_user'}`,
    thumbnail: thumbnailUrl ? thumbUrl(thumbnailUrl) : undefined,
    likes: tweet.likes ? `${tweet.likes.toLocaleString?.() ?? tweet.likes} suka` : undefined,
    views: tweet.views ? `${tweet.views.toLocaleString?.() ?? tweet.views} tontonan` : undefined,
    date: tweet.created_at || 'X',
    mediaType: video ? 'video' : 'image',
    directVideoUrl: video ? streamUrl(video.url) : undefined,
    qualities,
    audioQualities: video ? [convertedMp3(video.url, base)] : [],
  };
}

function extractTwitchClipSlug(raw: string): string | null {
  const direct = raw.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/i)?.[1];
  if (direct) return direct;
  return raw.match(/twitch\.tv\/[^/]+\/clip\/([A-Za-z0-9_-]+)/i)?.[1] || null;
}

async function resolveTwitch(cleanUrl: string): Promise<ResolvedMedia> {
  const slug = extractTwitchClipSlug(cleanUrl);
  if (!slug) {
    if (/twitch\.tv\/videos\//i.test(cleanUrl)) {
      throw new Error('VOD Twitch belum didukung. Gunakan tautan klip Twitch (clips.twitch.tv/...).');
    }
    throw new Error('Gunakan tautan klip Twitch, misalnya https://clips.twitch.tv/... atau https://twitch.tv/channel/clip/...');
  }

  const query = `query($slug: ID!) {
    clip(slug: $slug) {
      id
      title
      durationSeconds
      thumbnailURL
      viewCount
      createdAt
      broadcaster { displayName }
      videoQualities { quality frameRate sourceURL }
      playbackAccessToken(params: { platform: "web", playerBackend: "mediaplayer", playerType: "clips" }) {
        signature
        value
      }
    }
  }`;

  const response = await fetchWithTimeout(
    'https://gql.twitch.tv/gql',
    {
      method: 'POST',
      headers: {
        'Client-Id': TWITCH_CLIENT_ID,
        'Content-Type': 'application/json',
        'User-Agent': BROWSER_USER_AGENT,
      },
      body: JSON.stringify({ query, variables: { slug } }),
    },
    20000
  );

  if (!response.ok) throw new Error(`Twitch menolak permintaan (HTTP ${response.status}). Coba lagi nanti.`);
  const payload: any = await response.json();
  if (payload?.errors?.length) throw new Error(payload.errors[0]?.message || 'Twitch tidak dapat membaca klip ini.');

  const clip = payload?.data?.clip;
  if (!clip) throw new Error('Klip Twitch tidak ditemukan. Pastikan klip publik dan tautannya masih aktif.');

  const token = clip.playbackAccessToken;
  if (!token?.signature || !token?.value) {
    throw new Error('Twitch tidak memberikan akses pemutaran untuk klip ini. Klip mungkin privat atau sudah dihapus.');
  }

  const signedUrl = (sourceUrl: string): string | null => {
    try {
      const url = new URL(sourceUrl);
      url.searchParams.set('sig', token.signature);
      url.searchParams.set('token', token.value);
      return url.toString();
    } catch {
      return null;
    }
  };

  const seen = new Set<string>();
  const formats = (clip.videoQualities || [])
    .filter((format: any) => {
      const quality = String(format.quality || '');
      return /^\d+$/.test(quality) && !seen.has(quality) && (seen.add(quality), true);
    })
    .sort((a: any, b: any) => Number(b.quality) - Number(a.quality));

  const signedFormats = formats
    .map((format: any) => ({ ...format, signed: signedUrl(format.sourceURL) }))
    .filter((format: any) => format.signed);

  if (signedFormats.length === 0) throw new Error('Twitch tidak mengembalikan file MP4 untuk klip ini.');

  const base = safeBaseName(`DownloaderZone_Twitch_${clip.id || slug}`, 'twitch');
  const sizes = await Promise.all(signedFormats.map((format: any) => remoteFileSize(format.signed)));
  const qualities: Quality[] = signedFormats.map((format: any, index: number) => ({
    id: `twitch-${format.quality}`,
    label: `Video MP4 ${format.quality}p`,
    resolution: `${format.quality}p`,
    format: 'mp4',
    fileSize: sizes[index],
    downloadUrl: downloadUrl(format.signed, `${base}_${format.quality}p.mp4`),
    isPopular: index === 0,
    badge: index === 0 ? 'HD' : 'MP4',
  }));

  const title = (clip.title || '').trim() || 'Klip Twitch';
  return {
    platform: 'twitch',
    platformName: 'Twitch Clips',
    title: title.slice(0, 120),
    author: clip.broadcaster?.displayName || 'Twitch',
    duration: formatDuration(Number(clip.durationSeconds)),
    thumbnail: isPublicUrlOrNull(clip.thumbnailURL) ? thumbUrl(clip.thumbnailURL) : undefined,
    views: clip.viewCount ? `${Number(clip.viewCount).toLocaleString('id-ID')} tontonan` : undefined,
    date: 'Twitch',
    mediaType: 'video',
    embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}`,
    qualities,
    audioQualities: [convertedMp3(signedFormats[0].signed, base)],
  };
}

async function resolveYouTube(cleanUrl: string): Promise<ResolvedMedia> {
  const videoId = extractYouTubeId(cleanUrl);
  if (!videoId) {
    if (/\/playlist|list=/i.test(cleanUrl)) {
      throw new Error('Playlist YouTube belum didukung. Gunakan tautan satu video.');
    }
    throw new Error('Tautan YouTube tidak mengandung ID video yang valid. Salin ulang tautan video dari tombol Share.');
  }

  let info: any;
  try {
    info = await getYouTubeInfo(videoId);
  } catch (error) {
    throw new Error(youTubeErrorMessage(error));
  }

  const details = info?.videoDetails;
  if (!details) throw new Error('YouTube tidak mengembalikan detail video.');
  if (details.isLive) throw new Error('Siaran langsung YouTube tidak didukung. Gunakan video yang sudah selesai disiarkan.');
  if (details.isUpcoming) throw new Error('Video YouTube ini belum tayang.');
  if (details.isAgeRestricted) throw new Error('Video YouTube ini dibatasi usia dan tidak bisa diunduh tanpa login.');

  const formatsByHeight = new Map<number, any>();
  for (const format of info.formats || []) {
    const height = Number(format.height);
    const codec = String(format.videoCodec || '');
    if (!format.hasVideo || format.container !== 'mp4' || !Number.isFinite(height) || height < 144) continue;
    // Prefer H.264 so the merged MP4 plays in browsers and common desktop players.
    if (codec && !codec.startsWith('avc1')) continue;
    if (!formatsByHeight.has(height)) formatsByHeight.set(height, format);
  }

  const videoFormats = [...formatsByHeight.values()]
    .filter((format) => Number(format.height) <= 1080)
    .sort((a, b) => Number(b.height) - Number(a.height))
    .slice(0, 3);

  if (videoFormats.length === 0) throw new Error('YouTube tidak menyediakan stream MP4 untuk video ini.');
  const audio = bestYouTubeAudio(info);
  const audioSize = Number(audio?.contentLength) || 0;
  const durationSeconds = Number(details.lengthSeconds) || 0;
  const base = safeBaseName(`DownloaderZone_YouTube_${details.title || videoId}`, 'youtube');

  const qualities: Quality[] = videoFormats.map((format, index) => {
    const height = Number(format.height);
    const totalSize = (Number(format.contentLength) || 0) + audioSize;
    return {
      id: `youtube-${format.itag}`,
      label: `Video MP4 ${height}p (audio digabung)`,
      resolution: `${height}p`,
      format: 'mp4',
      fileSize: formatBytes(totalSize),
      downloadUrl: `${YOUTUBE_VIDEO}?id=${videoId}&itag=${format.itag}&filename=${encodeURIComponent(`${base}_${height}p.mp4`)}`,
      isPopular: index === 0,
      badge: index === 0 ? 'HD' : 'MP4',
    };
  });

  const thumbnails = [...(details.thumbnails || [])].sort((a: any, b: any) => Number(b.width) - Number(a.width));
  const thumbnail = isPublicUrlOrNull(thumbnails[0]?.url) ? thumbUrl(thumbnails[0].url) : undefined;

  return {
    platform: 'youtube',
    platformName: 'YouTube',
    title: details.title || 'Video YouTube',
    author: details.author?.name || 'YouTube',
    duration: formatDuration(durationSeconds),
    thumbnail,
    views: details.viewCount ? `${Number(details.viewCount).toLocaleString('id-ID')} tontonan` : undefined,
    date: details.uploadDate || 'YouTube',
    mediaType: 'video',
    embedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    qualities,
    audioQualities: [
      {
        id: 'youtube-mp3',
        label: 'Audio MP3 192 kbps (dikonversi dengan ffmpeg)',
        bitrate: '192 kbps',
        format: 'mp3',
        fileSize: formatBytes(Math.round((durationSeconds * 192000) / 8)),
        badge: 'MP3 Asli',
        downloadUrl: `${YOUTUBE_AUDIO}?id=${videoId}&filename=${encodeURIComponent(`${base}.mp3`)}`,
      },
    ],
  };
}

async function resolveGeneric(cleanUrl: string): Promise<ResolvedMedia> {
  const page = await fetchWithTimeout(
    cleanUrl,
    {
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    },
    15000
  );
  if (!page.ok) throw new Error(`Halaman tidak dapat dibuka (HTTP ${page.status}).`);

  const html = await page.text();
  const meta = extractMetaTags(html);
  const videoUrl = isPublicUrlOrNull(meta.video);
  const imageUrl = isPublicUrlOrNull(meta.image);
  if (!videoUrl && !imageUrl) throw new Error('Halaman ini tidak menyediakan file video/foto yang bisa diunduh langsung.');

  const host = new URL(cleanUrl).hostname.replace(/^www\./, '');
  const base = safeBaseName(`DownloaderZone_${host}_${meta.title || 'media'}`, 'media');
  const qualities: Quality[] = [];

  if (videoUrl) {
    qualities.push({
      id: 'generic-video',
      label: 'Video MP4 dari sumber',
      format: 'mp4',
      fileSize: await remoteFileSize(videoUrl),
      downloadUrl: downloadUrl(videoUrl, `${base}.mp4`),
      isPopular: true,
      badge: 'MP4',
    });
  }
  if (imageUrl) {
    qualities.push({
      id: 'generic-image',
      label: 'Gambar asli',
      format: 'jpg',
      downloadUrl: downloadUrl(imageUrl, `${base}.jpg`),
      isPopular: !videoUrl,
      badge: 'JPG',
    });
  }

  return {
    platform: 'other',
    platformName: meta.siteName || host,
    title: meta.title || `Media dari ${host}`,
    author: host,
    thumbnail: imageUrl ? thumbUrl(imageUrl) : undefined,
    date: host,
    mediaType: videoUrl ? 'video' : 'image',
    directVideoUrl: videoUrl ? streamUrl(videoUrl) : undefined,
    qualities,
    audioQualities: videoUrl ? [convertedMp3(videoUrl, base)] : [],
  };
}

async function resolveSpotify(cleanUrl: string): Promise<ResolvedMedia> {
  const response = await fetchWithTimeout(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`,
    { headers: { 'User-Agent': BROWSER_USER_AGENT } },
    12000
  );
  if (!response.ok) throw new Error('Spotify tidak dapat membaca tautan ini. Pastikan tautannya publik.');

  const data: any = await response.json();
  const imageUrl = isPublicUrlOrNull(data.thumbnail_url);
  const base = safeBaseName(`DownloaderZone_Spotify_${data.title || 'cover'}`, 'spotify');
  const qualities: Quality[] = imageUrl
    ? [
        {
          id: 'spotify-cover',
          label: 'Cover art asli',
          format: 'jpg',
          fileSize: await remoteFileSize(imageUrl),
          downloadUrl: downloadUrl(imageUrl, `${base}.jpg`),
          isPopular: true,
          badge: 'JPG',
        },
      ]
    : [];

  return {
    platform: 'spotify',
    platformName: 'Spotify',
    title: data.title || 'Spotify',
    author: data.author_name || 'Spotify',
    thumbnail: imageUrl ? thumbUrl(imageUrl) : undefined,
    date: 'Spotify',
    mediaType: 'audio',
    embedUrl: data.iframe_url || undefined,
    qualities,
    audioQualities: [],
    notice:
      'Spotify melindungi audio dengan DRM, jadi file lagu tidak bisa diunduh. Cover art asli tetap bisa diunduh.',
  };
}

async function resolveAppleMusic(cleanUrl: string): Promise<ResolvedMedia> {
  const page = await fetchWithTimeout(
    cleanUrl,
    { headers: { 'User-Agent': BROWSER_USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' } },
    15000
  );
  if (!page.ok) throw new Error(`Apple Music menolak permintaan (HTTP ${page.status}).`);

  const meta = extractMetaTags(await page.text());
  const imageUrl = isPublicUrlOrNull(meta.image);
  if (!meta.title && !imageUrl) throw new Error('Halaman Apple Music tidak dapat dibaca.');

  const base = safeBaseName(`DownloaderZone_AppleMusic_${meta.title || 'cover'}`, 'applemusic');
  const qualities: Quality[] = imageUrl
    ? [
        {
          id: 'apple-cover',
          label: 'Cover art asli',
          format: 'jpg',
          fileSize: await remoteFileSize(imageUrl),
          downloadUrl: downloadUrl(imageUrl, `${base}.jpg`),
          isPopular: true,
          badge: 'JPG',
        },
      ]
    : [];

  return {
    platform: 'applemusic',
    platformName: 'Apple Music',
    title: (meta.title || 'Apple Music').replace(/ on Apple Music/i, '').trim(),
    author: meta.siteName || 'Apple Music',
    thumbnail: imageUrl ? thumbUrl(imageUrl) : undefined,
    date: 'Apple Music',
    mediaType: 'audio',
    qualities,
    audioQualities: [],
    notice: 'Apple Music melindungi audio dengan DRM, jadi file lagu tidak bisa diunduh. Cover art asli tetap bisa diunduh.',
  };
}

/* ------------------------------------------------------------------ */
/* YouTube media endpoints                                            */
/* ------------------------------------------------------------------ */

app.get(YOUTUBE_VIDEO, async (req: Request, res: ExpressResponse) => {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const itag = Number(req.query.itag);
  if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !Number.isInteger(itag) || itag <= 0) {
    return res.status(400).json({ success: false, error: 'Permintaan video YouTube tidak valid.' });
  }

  const requestedName = typeof req.query.filename === 'string' && req.query.filename.trim()
    ? req.query.filename
    : `DownloaderZone_YouTube_${id}.mp4`;
  const safeFilename = sanitizeDownloadFilename(requestedName, 'video/mp4');

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', contentDispositionFor(safeFilename));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method === 'HEAD') return res.status(200).end();

  pruneYouTubeVideoCache();
  try {
    const entry = await buildYouTubeVideo(id, itag);
    res.download(entry.file, safeFilename, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({ success: false, error: 'Gagal mengirim file video YouTube.' });
      }
    });
  } catch (error: any) {
    console.error('YouTube video error:', error?.message || error);
    if (!res.headersSent) {
      return res.status(422).json({ success: false, error: youTubeErrorMessage(error) });
    }
    res.destroy();
  }
});

app.get(YOUTUBE_AUDIO, async (req: Request, res: ExpressResponse) => {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ success: false, error: 'Permintaan audio YouTube tidak valid.' });
  }

  const requestedName = typeof req.query.filename === 'string' && req.query.filename.trim()
    ? req.query.filename
    : `DownloaderZone_YouTube_${id}.mp3`;
  const safeFilename = sanitizeDownloadFilename(requestedName.replace(/\.mp3$/i, '') + '.mp3', 'audio/mpeg');

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', contentDispositionFor(safeFilename));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method === 'HEAD') return res.status(200).end();

  let info: any;
  try {
    info = await getYouTubeInfo(id);
  } catch (error: any) {
    return res.status(422).json({ success: false, error: youTubeErrorMessage(error) });
  }

  const audio = bestYouTubeAudio(info);
  if (!audio) {
    return res.status(422).json({ success: false, error: 'YouTube tidak menyediakan stream audio untuk video ini.' });
  }

  const ffmpeg = spawn(FFMPEG_PATH, [
    '-hide_banner',
    '-loglevel', 'error',
    '-i', 'pipe:0',
    '-vn',
    '-ac', '2',
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    '-f', 'mp3',
    'pipe:1',
  ]);

  let finished = false;
  let source: any = null;
  let stderr = '';
  ffmpeg.stderr.on('data', (chunk) => {
    stderr = (stderr + chunk.toString()).slice(-1200);
  });

  const cleanup = () => {
    if (finished) return;
    finished = true;
    if (source && typeof source.destroy === 'function') source.destroy();
    if (!ffmpeg.killed) ffmpeg.kill('SIGKILL');
  };
  res.on('close', cleanup);
  ffmpeg.stdin!.on('error', () => undefined);

  try {
    source = ytdl.download(info, { format: audio });
    source.on('error', (error: Error) => {
      console.error('YouTube audio source error:', error.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, error: 'Gagal mengambil audio dari YouTube.' });
      } else {
        res.destroy();
      }
    });
    source.pipe(ffmpeg.stdin!);
    ffmpeg.stdout.pipe(res);

    ffmpeg.on('close', (code) => {
      if (finished) return;
      finished = true;
      if (code !== 0) {
        console.error('YouTube ffmpeg failed:', stderr);
        if (!res.headersSent) {
          res.status(502).json({ success: false, error: 'Konversi audio YouTube gagal.' });
        } else {
          res.destroy();
        }
      } else {
        res.end();
      }
    });
  } catch (error: any) {
    cleanup();
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: 'Gagal mengonversi audio YouTube ke MP3.' });
    }
  }
});

/* ------------------------------------------------------------------ */
/* Parse endpoint                                                     */
/* ------------------------------------------------------------------ */

app.post('/api/parse', async (req: Request, res: ExpressResponse) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL wajib diisi.' });
  }

  const cleanUrl = url.trim();
  if (!isPublicHttpUrl(cleanUrl)) {
    return res.status(400).json({ success: false, error: 'Tautan tidak valid. Gunakan URL http/https publik.' });
  }

  const platform = detectPlatform(cleanUrl);

  try {
    let media: ResolvedMedia;

    switch (platform) {
      case 'tiktok':
        media = await resolveTikTok(cleanUrl);
        break;
      case 'instagram':
        media = await resolveInstagram(cleanUrl);
        break;
      case 'facebook':
        media = await resolveFacebook(cleanUrl);
        break;
      case 'pinterest':
        media = await resolvePinterest(cleanUrl);
        break;
      case 'twitter':
        media = await resolveTwitter(cleanUrl);
        break;
      case 'spotify':
        media = await resolveSpotify(cleanUrl);
        break;
      case 'applemusic':
        media = await resolveAppleMusic(cleanUrl);
        break;
      case 'youtube':
        media = await resolveYouTube(cleanUrl);
        break;
      case 'twitch':
        media = await resolveTwitch(cleanUrl);
        break;
      case 'soundcloud':
        throw new Error('SoundCloud membutuhkan API key resmi untuk mengakses file audio. Unduhan tidak tersedia.');
      case 'vimeo':
        throw new Error('Vimeo tidak menyediakan file progresif publik untuk tautan ini. Unduhan tidak tersedia.');
      case 'threads':
        media = await resolveGeneric(cleanUrl);
        break;
      default:
        media = await resolveGeneric(cleanUrl);
    }

    return res.json({ success: true, ...media });
  } catch (error: any) {
    console.error('Parse error:', error?.message || error);
    return res.status(422).json({
      success: false,
      error: error?.message || 'Gagal memproses tautan. Pastikan konten publik dan tautannya masih aktif.',
    });
  }
});

/* ------------------------------------------------------------------ */
/* App server                                                         */
/* ------------------------------------------------------------------ */

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: ExpressResponse) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
