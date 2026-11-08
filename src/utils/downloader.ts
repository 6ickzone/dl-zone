import { SUPPORTED_PLATFORMS } from '../data/platforms';
import { MediaMetadata, PlatformId, PlatformInfo, DownloadQuality } from '../types';

export function detectPlatformFromUrl(url: string): PlatformInfo | null {
  const cleanUrl = url.trim().toLowerCase();
  for (const platform of SUPPORTED_PLATFORMS) {
    if (platform.urlPattern.test(cleanUrl)) {
      return platform;
    }
  }
  return null;
}

function isRealDownload(quality: DownloadQuality): boolean {
  return typeof quality.downloadUrl === 'string' && quality.downloadUrl.startsWith('/api/');
}

/**
 * Resolves metadata and real file URLs from the user's link through the
 * backend. There is intentionally no client-side fallback: if the server
 * cannot read the link, the UI shows the error instead of inventing data.
 */
export async function fetchLinkMetadata(rawUrl: string): Promise<MediaMetadata> {
  const url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Tautan tidak valid. Tempel URL lengkap yang diawali http:// atau https://.');
  }

  const detected = detectPlatformFromUrl(url);
  let response: Response;
  try {
    response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new Error('Tidak dapat menghubungi server pemroses. Periksa koneksi lalu coba lagi.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'API pemroses tidak tersedia di alamat ini. Aplikasi memerlukan server Node (bukan hosting statis) agar dapat mengambil file dari tautan.'
    );
  }

  const data: any = await response.json().catch(() => null);
  if (!data) {
    throw new Error('Server mengembalikan respons yang tidak bisa dibaca.');
  }
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Gagal memproses tautan ini.');
  }

  const qualities: DownloadQuality[] = Array.isArray(data.qualities)
    ? data.qualities.filter(isRealDownload)
    : [];
  const audioQualities: DownloadQuality[] = Array.isArray(data.audioQualities)
    ? data.audioQualities.filter(isRealDownload)
    : [];

  if (qualities.length === 0 && audioQualities.length === 0 && !data.notice) {
    throw new Error('Tautan ini tidak menghasilkan file yang bisa diunduh.');
  }

  return {
    id: `media-${Date.now()}`,
    url,
    platform: (data.platform as PlatformId) || detected?.id || 'other',
    platformName: data.platformName || detected?.name || 'Media',
    title: data.title || 'Media',
    author: data.author || '',
    duration: data.duration,
    thumbnail: data.thumbnail,
    likes: data.likes,
    views: data.views,
    date: data.date,
    qualities,
    audioQualities,
    directVideoUrl: data.directVideoUrl,
    directAudioUrl: data.directAudioUrl,
    embedUrl: data.embedUrl,
    mediaType: data.mediaType || 'video',
    notice: data.notice,
  };
}

const INTERNAL_DOWNLOAD_ENDPOINTS = [
  '/api/proxy-download',
  '/api/convert',
  '/api/youtube/video',
  '/api/youtube/audio',
];

/**
 * Wraps an external media URL in the download proxy. Internal endpoints
 * (including the ffmpeg converter) are kept exactly as the server built them.
 */
function buildDownloadEndpoint(downloadUrl: string, fileName: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

  let parsed: URL;
  try {
    parsed = new URL(downloadUrl, origin);
  } catch {
    throw new Error('Tautan unduhan tidak valid.');
  }

  if (parsed.origin === origin && INTERNAL_DOWNLOAD_ENDPOINTS.includes(parsed.pathname)) {
    return parsed.toString();
  }

  let upstreamUrl = downloadUrl;
  if (parsed.origin === origin && parsed.pathname.startsWith('/api/')) {
    const innerUrl = parsed.searchParams.get('url');
    if (!innerUrl) throw new Error('Tautan media tidak valid.');
    upstreamUrl = innerUrl;
  }

  const normalized = new URL(upstreamUrl, origin);
  if (normalized.protocol !== 'http:' && normalized.protocol !== 'https:') {
    throw new Error('Sumber ini tidak menyediakan tautan unduhan langsung.');
  }

  const params = new URLSearchParams({ url: normalized.toString(), filename: fileName });
  return `/api/proxy-download?${params.toString()}`;
}

/**
 * Verifies the server can produce a real media file before the browser
 * navigates to the download URL.
 */
async function assertDownloadReady(endpoint: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(endpoint, { method: 'HEAD', cache: 'no-store' });
  } catch {
    throw new Error('Tidak dapat menghubungi server unduhan. Periksa koneksi lalu coba lagi.');
  }

  if (!response.ok) {
    let message = '';
    try {
      const data = await response.json();
      if (data && typeof data.error === 'string') message = data.error;
    } catch {
      message = (await response.text().catch(() => '')).slice(0, 240);
    }
    throw new Error(message || `Sumber menolak unduhan (HTTP ${response.status}).`);
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase().split(';')[0];
  if (!contentType.startsWith('video/') && !contentType.startsWith('audio/') && !contentType.startsWith('image/')) {
    throw new Error('Sumber tidak mengembalikan file media. Proses ulang tautan lalu coba lagi.');
  }
}

export async function triggerFileDownload(
  title: string,
  platform: string,
  qualityLabel: string,
  format: 'mp4' | 'mp3' | 'zip' | 'jpg' | 'png',
  downloadUrl?: string
): Promise<void> {
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().substring(0, 40) || 'media';
  const fileName = `DownloaderZone_${platform}_${sanitizedTitle}.${format}`;

  if (!downloadUrl) {
    throw new Error(
      `Tautan unduhan ${qualityLabel} tidak tersedia dari sumber ini. Proses ulang tautan atau pilih kualitas lain.`
    );
  }

  const endpoint = buildDownloadEndpoint(downloadUrl, fileName);
  await assertDownloadReady(endpoint);

  const link = document.createElement('a');
  link.href = endpoint;
  link.setAttribute('download', fileName);
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
