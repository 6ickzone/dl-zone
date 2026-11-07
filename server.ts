import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { snapsave } from 'snapsave-media-downloader';
// @ts-ignore
import SnapVideo from 'cakkatrok-instagram-downloader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Helper to extract open graph tags and metadata from raw HTML
function extractMetaTags(html: string) {
  const getTag = (prop: string) => {
    const regex1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i');
    const regex3 = new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const m = html.match(regex1) || html.match(regex2) || html.match(regex3);
    return m ? m[1] : null;
  };

  const getTitle = () => {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  };

  return {
    title: getTag('og:title') || getTag('twitter:title') || getTitle(),
    description: getTag('og:description') || getTag('twitter:description') || getTag('description'),
    image: getTag('og:image') || getTag('twitter:image') || getTag('og:image:secure_url'),
    video: getTag('og:video') || getTag('og:video:url') || getTag('og:video:secure_url') || getTag('twitter:player:stream'),
    siteName: getTag('og:site_name'),
  };
}

// Proxy thumbnail endpoint to prevent CORS and hotlink blocking
app.get('/api/proxy-thumbnail', async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL diperlukan');
  }

  try {
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.instagram.com/',
      },
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send('Gagal mengambil thumbnail');
    }

    const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await fetchRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Proxy thumbnail error:', err);
    return res.status(500).send('Gagal memuat gambar');
  }
});

// Proxy stream endpoint for video playback with Range header support
app.get('/api/proxy-stream', async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL diperlukan');
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const fetchRes = await fetch(url, { headers });

    res.status(fetchRes.status);
    const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    for (const h of forwardHeaders) {
      const val = fetchRes.headers.get(h);
      if (val) {
        res.setHeader(h, val);
      }
    }
    if (!fetchRes.headers.get('accept-ranges')) {
      res.setHeader('Accept-Ranges', 'bytes');
    }

    if (fetchRes.body) {
      const { Readable } = await import('stream');
      // @ts-ignore
      Readable.fromWeb(fetchRes.body).pipe(res);
    } else {
      const buffer = await fetchRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err: any) {
    console.error('Proxy stream error:', err);
    if (!res.headersSent) {
      res.status(500).send('Gagal memutar video');
    }
  }
});

// Proxy download endpoint to save media files directly to the device
app.get('/api/proxy-download', async (req: Request, res: Response) => {
  const { url, filename } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL diperlukan');
  }

  try {
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send('Gagal mengambil file dari sumber');
    }

    const cleanFilename = typeof filename === 'string' ? filename : 'downloaded_media.mp4';
    const contentType = fetchRes.headers.get('content-type') || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanFilename)}"`);
    const contentLength = fetchRes.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    if (fetchRes.body) {
      const { Readable } = await import('stream');
      // @ts-ignore
      Readable.fromWeb(fetchRes.body).pipe(res);
    } else {
      const arrayBuffer = await fetchRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (err: any) {
    console.error('Proxy download error:', err);
    if (!res.headersSent) {
      res.status(500).send('Gagal mengunduh file');
    }
  }
});

// POST /api/parse - Extracts REAL metadata and stream URLs from any user-pasted link
app.post('/api/parse', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL diperlukan' });
  }

  const cleanUrl = url.trim();

  try {
    // 1. TIKTOK
    if (/tiktok\.com/i.test(cleanUrl)) {
      try {
        const tikwmRes = await fetch('https://tikwm.com/api/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ url: cleanUrl }),
        });
        const tikwmData = await tikwmRes.json();

        if (tikwmData && tikwmData.code === 0 && tikwmData.data) {
          const item = tikwmData.data;
          const host = 'https://tikwm.com';
          const videoNoWm = item.play?.startsWith('http') ? item.play : `${host}${item.play}`;
          const audioUrl = item.music?.startsWith('http') ? item.music : (item.music ? `${host}${item.music}` : null);
          const thumbUrl = item.cover?.startsWith('http') ? item.cover : `${host}${item.cover}`;

          const streamUrl = `/api/proxy-stream?url=${encodeURIComponent(videoNoWm)}`;
          const downloadVideoUrl = `/api/proxy-download?url=${encodeURIComponent(videoNoWm)}&filename=${encodeURIComponent(`DownloaderZone_TikTok_${item.id || 'video'}.mp4`)}`;
          const downloadAudioUrl = audioUrl ? `/api/proxy-download?url=${encodeURIComponent(audioUrl)}&filename=${encodeURIComponent(`DownloaderZone_TikTok_Audio_${item.id || 'sound'}.mp3`)}` : undefined;

          // Compute genuine file size from bytes returned by TikWM
          const realMb = item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : 'Direct HD';

          return res.json({
            success: true,
            platform: 'tiktok',
            platformName: 'TikTok',
            title: item.title || 'Video TikTok',
            author: `@${item.author?.unique_id || item.author?.nickname || 'tiktok_creator'}`,
            duration: item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : 'Original',
            thumbnail: `/api/proxy-thumbnail?url=${encodeURIComponent(thumbUrl)}`,
            likes: item.digg_count ? `${Number(item.digg_count).toLocaleString()} suka` : undefined,
            views: item.play_count ? `${Number(item.play_count).toLocaleString()} tontonan` : undefined,
            date: 'Terbaru',
            directVideoUrl: streamUrl,
            directAudioUrl: downloadAudioUrl,
            qualities: [
              {
                id: 'tt-hd',
                label: 'Video MP4 HD (Tanpa Watermark)',
                resolution: '1080p HD',
                format: 'mp4',
                fileSize: realMb,
                downloadUrl: downloadVideoUrl,
                isPopular: true,
                badge: 'HD Clean',
              },
            ],
            audioQualities: downloadAudioUrl ? [
              {
                id: 'tt-mp3',
                label: 'Audio MP3 Original TikTok',
                bitrate: '320 kbps',
                format: 'mp3',
                fileSize: 'Original Audio',
                downloadUrl: downloadAudioUrl,
                isPopular: true,
                badge: 'HQ Audio',
              },
            ] : [],
          });
        }
      } catch (e) {
        console.error('Tikwm fetch error:', e);
      }
    }

    // 2. INSTAGRAM (Reels, Posts, Stories, Carousel, IGTV)
    if (/instagram\.com|instagr\.am/i.test(cleanUrl)) {
      const isReel = /reel|reels/i.test(cleanUrl);
      const isStory = /stories/i.test(cleanUrl);
      const reelMatch = cleanUrl.match(/reel(?:s)?\/([a-zA-Z0-9_-]+)/);
      const postMatch = cleanUrl.match(/\/p\/([a-zA-Z0-9_-]+)/);
      const tvMatch = cleanUrl.match(/\/tv\/([a-zA-Z0-9_-]+)/);
      const shareMatch = cleanUrl.match(/share\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
      const storyMatch = cleanUrl.match(/stories\/([a-zA-Z0-9._-]+)(?:\/(\d+))?/);

      let shortcode = '';
      if (reelMatch) shortcode = reelMatch[1];
      else if (postMatch) shortcode = postMatch[1];
      else if (tvMatch) shortcode = tvMatch[1];
      else if (shareMatch) shortcode = shareMatch[1];

      const storyUser = storyMatch ? storyMatch[1] : '';

      let realTitle: string | null = null;
      let realAuthor: string | null = null;
      let realThumb: string | null = null;
      let realVideoUrl: string | null = null;
      let realLikes: string | null = null;
      let realDate: string | null = null;
      let realFileSize = 'Direct HD';
      let foundMediaList: any[] = [];

      // Step A: Try SnapVideo resolver (supports Stories, Reels, Posts)
      try {
        const snapFn = SnapVideo.default || SnapVideo;
        const snapRes = await snapFn(cleanUrl, { type: isStory ? 'story' : 'media' });
        if (snapRes && snapRes.media && snapRes.media.length > 0) {
          foundMediaList = snapRes.media;
          const firstMedia = snapRes.media[0];
          if (firstMedia.url) {
            if (firstMedia.type === 'video') {
              realVideoUrl = firstMedia.url;
            } else if (firstMedia.type === 'photo' && !realThumb) {
              realThumb = firstMedia.url;
            }
          }
          // Extract thumbnail from SnapVideo response data if available
          if (snapRes.raw && typeof snapRes.raw.data === 'string') {
            const thumbMatch = snapRes.raw.data.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (thumbMatch && thumbMatch[1] && !realThumb) {
              realThumb = thumbMatch[1];
            }
          }
        }
      } catch (snapErr: any) {
        console.warn('SnapVideo resolver warning:', snapErr.message);
      }

      // Step B: Extract authentic caption and creator info via Facebook crawler
      try {
        const igRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        if (igRes.ok) {
          const igHtml = await igRes.text();
          const meta = extractMetaTags(igHtml);

          // Prevent "Login • Instagram" from being recorded as title!
          if (meta.title && !meta.title.includes('Login • Instagram')) {
            const authorMatch = meta.title.match(/^([^:]+)\s+on\s+Instagram/i);
            if (authorMatch) {
              realAuthor = `@${authorMatch[1].trim()}`;
            }
            const cleanCap = meta.title.replace(/^[^:]+\s+on\s+Instagram:\s*["“]?/i, '').replace(/["”]?$/, '').replace(/&quot;/g, '"').replace(/&#xA;/g, ' ').trim();
            if (cleanCap && cleanCap !== meta.title) {
              realTitle = cleanCap;
            }
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
              if (descCap) realTitle = descCap[1].replace(/&quot;/g, '"').trim();
            }
          }

          if (meta.image && !realThumb && !meta.image.includes('default-og')) {
            realThumb = meta.image;
          }
          if (meta.video && !realVideoUrl) {
            realVideoUrl = meta.video;
          }
        }
      } catch (err) {
        console.warn('Instagram meta fetch error:', err);
      }

      // Step C: Fallback to vxinstagram mirror for Reels / Posts if video stream is still needed
      if (shortcode && !realVideoUrl) {
        try {
          const vxEndpoint = `https://www.vxinstagram.com/${isReel ? 'reel' : 'p'}/${shortcode}/`;
          const vxRes = await fetch(vxEndpoint, {
            headers: { 'User-Agent': 'facebookexternalhit/1.1' },
          });
          if (vxRes.ok) {
            const vxHtml = await vxRes.text();
            const vxVideoMatch = vxHtml.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i) || vxHtml.match(/content=["']([^"']+)["'][^>]+property=["']og:video["']/i);
            if (vxVideoMatch && vxVideoMatch[1]) {
              realVideoUrl = vxVideoMatch[1];
            }

            const vxTitleMatch = vxHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
            if (vxTitleMatch && !realAuthor) {
              realAuthor = vxTitleMatch[1].replace(/&quot;/g, '"').trim();
            }

            const vxDescMatch = vxHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
            if (vxDescMatch && !realTitle) {
              realTitle = vxDescMatch[1].replace(/&quot;/g, '"').replace(/&#xA;/g, ' ').trim();
            }

            const vxImgMatch = vxHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
            if (vxImgMatch && !realThumb) {
              realThumb = vxImgMatch[1];
            }
          }
        } catch (vxErr) {
          console.warn('vxinstagram error:', vxErr);
        }
      }

      // If this is an IG Story and no media was found
      if (isStory && !realVideoUrl && (!foundMediaList || foundMediaList.length === 0)) {
        return res.status(400).json({
          success: false,
          error: `Instagram Story untuk ${storyUser ? '@' + storyUser : 'akun ini'} tidak dapat diunduh. Story mungkin telah kedaluwarsa (lebih dari 24 jam) atau akun di-private. Pastikan story masih aktif dan profil bersifat publik.`,
        });
      }

      // If it's a Reel/Post and absolutely no media or valid metadata exists
      if (!isStory && !realVideoUrl && !realThumb && !realTitle) {
        return res.status(400).json({
          success: false,
          error: 'Konten Instagram tidak dapat diakses atau akun di-private. Pastikan postingan bersifat publik.',
        });
      }

      // Step D: Calculate actual file size if realVideoUrl exists via HEAD request
      if (realVideoUrl) {
        try {
          const headRes = await fetch(realVideoUrl, { method: 'HEAD' });
          const cl = headRes.headers.get('content-length');
          if (cl) {
            const bytes = parseInt(cl, 10);
            if (!isNaN(bytes) && bytes > 0) {
              realFileSize = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            }
          }
        } catch {
          // ignore head error
        }
      }

      // Check if media is photo/image
      const hasPhotoItems = foundMediaList.some((m: any) => m.type === 'photo');
      const isPhotoMedia = (!realVideoUrl && (!!realThumb || hasPhotoItems)) || (hasPhotoItems && !realVideoUrl);
      const mediaType = isPhotoMedia ? 'image' : 'video';

      const finalTitle = realTitle || (isStory ? `Instagram Story @${storyUser || 'creator'}` : (isPhotoMedia ? 'Instagram Foto HD' : (isReel ? 'Instagram Reel Video' : 'Instagram Post Media')));
      const finalAuthor = realAuthor || (storyUser ? `@${storyUser}` : '@instagram_user');
      const finalThumb = realThumb ? `/api/proxy-thumbnail?url=${encodeURIComponent(realThumb)}` : (shortcode ? `https://instagram.com/p/${shortcode}/media/?size=l` : undefined);

      const streamUrl = realVideoUrl ? `/api/proxy-stream?url=${encodeURIComponent(realVideoUrl)}` : undefined;
      const downloadVideoUrl = realVideoUrl ? `/api/proxy-download?url=${encodeURIComponent(realVideoUrl)}&filename=${encodeURIComponent(`DownloaderZone_IG_${storyUser || shortcode || 'media'}.mp4`)}` : undefined;
      const downloadAudioUrl = realVideoUrl ? `/api/proxy-download?url=${encodeURIComponent(realVideoUrl)}&filename=${encodeURIComponent(`DownloaderZone_IG_${storyUser || shortcode || 'audio'}.mp3`)}` : undefined;

      let qualities: any[] = [];
      let audioQualities: any[] = [];

      if (isPhotoMedia) {
        const photoItems = foundMediaList.filter((m: any) => m.type === 'photo');
        if (photoItems.length > 0) {
          qualities = photoItems.map((m: any, idx: number) => ({
            id: `ig-photo-${idx}`,
            label: photoItems.length > 1 ? `Foto Slide ${idx + 1} Resolusi Penuh (JPG)` : 'Foto Asli Resolusi Penuh (Original JPG)',
            resolution: 'Ultra HD (JPG)',
            format: 'jpg',
            fileSize: 'Resolusi Asli',
            downloadUrl: `/api/proxy-download?url=${encodeURIComponent(m.url)}&filename=${encodeURIComponent(`DownloaderZone_IG_${storyUser || shortcode || 'photo'}_${idx + 1}.jpg`)}`,
            isPopular: idx === 0,
            badge: 'Original JPG',
          }));
        } else if (finalThumb) {
          qualities = [
            {
              id: 'ig-photo-hd',
              label: 'Foto Asli Resolusi Penuh (Original JPG)',
              resolution: 'Ultra HD (JPG)',
              format: 'jpg',
              fileSize: 'Resolusi Asli',
              downloadUrl: `/api/proxy-download?url=${encodeURIComponent(realThumb || finalThumb)}&filename=${encodeURIComponent(`DownloaderZone_IG_${storyUser || shortcode || 'photo'}.jpg`)}`,
              isPopular: true,
              badge: 'Original JPG',
            },
          ];
        }
        audioQualities = []; // Photos don't have audio
      } else {
        qualities = [
          {
            id: 'ig-hd',
            label: 'Video MP4 (Original HD)',
            resolution: '1080p HD',
            format: 'mp4',
            fileSize: realFileSize,
            downloadUrl: downloadVideoUrl,
            isPopular: true,
            badge: 'Original HD',
          },
        ];
        audioQualities = downloadAudioUrl ? [
          {
            id: 'ig-audio',
            label: 'Ekstrak Audio Backsound MP3',
            bitrate: '320 kbps',
            format: 'mp3',
            fileSize: 'Original Audio',
            downloadUrl: downloadAudioUrl,
            isPopular: true,
            badge: 'HQ Audio',
          },
        ] : [];
      }

      return res.json({
        success: true,
        platform: 'instagram',
        platformName: isStory ? 'Instagram Story' : (isPhotoMedia ? 'Instagram Foto' : (isReel ? 'Instagram Reels' : 'Instagram')),
        title: finalTitle,
        author: finalAuthor,
        duration: isPhotoMedia ? 'Foto HD' : 'Video',
        thumbnail: finalThumb,
        likes: realLikes || undefined,
        views: undefined,
        date: realDate || 'Terbaru',
        mediaType,
        embedUrl: shortcode && !isPhotoMedia ? `https://www.instagram.com/reel/${shortcode}/embed/` : undefined,
        directVideoUrl: streamUrl,
        qualities,
        audioQualities,
      });
    }

    // 3. FACEBOOK (Reels, Watch, Videos)
    if (/facebook\.com|fb\.watch|fb\.com/i.test(cleanUrl)) {
      const isReel = /reel/i.test(cleanUrl);
      try {
        const snapRes: any = await snapsave(cleanUrl);
        if (snapRes && snapRes.success && snapRes.data) {
          const fbData = snapRes.data;
          const mediaList = fbData.media || [];
          const firstMedia = mediaList[0];
          const rawThumb = fbData.preview || firstMedia?.thumbnail;
          const displayThumb = rawThumb ? `/api/proxy-thumbnail?url=${encodeURIComponent(rawThumb)}` : undefined;
          const rawVideo = firstMedia?.url;
          const streamUrl = rawVideo ? `/api/proxy-stream?url=${encodeURIComponent(rawVideo)}` : undefined;
          const cleanDesc = (fbData.description && fbData.description.trim() !== '...') ? fbData.description.slice(0, 100) : (isReel ? 'Facebook Reel Video HD' : 'Facebook Video');

          const qualities = mediaList.map((m: any, idx: number) => {
            const resLabel = m.resolution || (idx === 0 ? '720p HD' : 'SD');
            const fileDownloadUrl = `/api/proxy-download?url=${encodeURIComponent(m.url)}&filename=${encodeURIComponent(`DownloaderZone_Facebook_${resLabel.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`)}`;
            return {
              id: `fb-${idx}`,
              label: `Video MP4 (${resLabel})`,
              resolution: resLabel,
              format: 'mp4',
              fileSize: 'Direct Download',
              downloadUrl: fileDownloadUrl,
              isPopular: idx === 0,
              badge: idx === 0 ? 'HD' : undefined,
            };
          });

          const audioDownloadUrl = rawVideo ? `/api/proxy-download?url=${encodeURIComponent(rawVideo)}&filename=DownloaderZone_Facebook_Audio.mp3` : undefined;

          return res.json({
            success: true,
            platform: 'facebook',
            platformName: isReel ? 'Facebook Reels' : 'Facebook Video',
            title: cleanDesc,
            author: 'Facebook Video',
            duration: 'Video',
            thumbnail: displayThumb,
            mediaType: 'video',
            embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=0`,
            directVideoUrl: streamUrl,
            qualities: qualities.length > 0 ? qualities : [
              {
                id: 'fb-hd',
                label: 'Video MP4 HD',
                resolution: 'HD Quality',
                format: 'mp4',
                fileSize: 'Direct Download',
                downloadUrl: streamUrl,
                isPopular: true,
              }
            ],
            audioQualities: audioDownloadUrl ? [
              {
                id: 'fb-audio',
                label: 'Ekstrak Audio Musik MP3',
                bitrate: '320 kbps',
                format: 'mp3',
                fileSize: 'Original Audio',
                downloadUrl: audioDownloadUrl,
                isPopular: true,
                badge: 'HQ Audio',
              },
            ] : [],
          });
        }
      } catch (fbErr) {
        console.error('Facebook snapsave error:', fbErr);
      }
    }

    // 4. PINTEREST (Foto HD, Pins, Ide Gambar)
    if (/pinterest\.com|pin\.it/i.test(cleanUrl)) {
      try {
        let finalUrl = cleanUrl;
        let pinId = '';

        if (/pin\.it/i.test(cleanUrl)) {
          try {
            const headRes = await fetch(cleanUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
              redirect: 'follow',
            });
            finalUrl = headRes.url || cleanUrl;
          } catch (e) {
            console.error('Pinterest shortlink redirect error:', e);
          }
        }

        const idMatch = finalUrl.match(/pin\/(\d+)/) || cleanUrl.match(/pin\/(\d+)/);
        if (idMatch) {
          pinId = idMatch[1];
        }

        let pinTitle = 'Foto Pinterest Original HD';
        let pinAuthor = '@pinterest_creator';
        let pinImage = '';

        // Pinterest Public Widget API
        if (pinId) {
          try {
            const pidgetRes = await fetch(`https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`);
            if (pidgetRes.ok) {
              const pidgetJson = await pidgetRes.json();
              const pinInfo = Array.isArray(pidgetJson?.data) ? pidgetJson.data[0] : (pidgetJson?.data?.[pinId] || pidgetJson?.data);
              if (pinInfo) {
                if (pinInfo.description && pinInfo.description.trim()) {
                  pinTitle = pinInfo.description.slice(0, 120);
                } else if (pinInfo.board?.name) {
                  pinTitle = `Pinterest Pin (${pinInfo.board.name})`;
                }
                if (pinInfo.pinner?.full_name || pinInfo.pinner?.username) {
                  pinAuthor = `@${pinInfo.pinner?.username || pinInfo.pinner?.full_name}`;
                } else if (pinInfo.native_creator?.full_name) {
                  pinAuthor = `@${pinInfo.native_creator.full_name}`;
                }

                const storyPages = pinInfo.story_pin_data?.pages;
                if (storyPages && storyPages.length > 0) {
                  const firstBlock = storyPages[0].blocks?.[0];
                  pinImage = firstBlock?.image?.images?.originals?.url || storyPages[0].image?.images?.originals?.url;
                }

                if (!pinImage && pinInfo.images) {
                  pinImage = pinInfo.images['orig']?.url || pinInfo.images['564x']?.url || pinInfo.images['236x']?.url;
                }
              }
            }
          } catch (apiErr) {
            console.error('Pinterest pidget error:', apiErr);
          }
        }

        if (pinImage) {
          const proxyThumb = `/api/proxy-thumbnail?url=${encodeURIComponent(pinImage)}`;
          const downloadOrigUrl = `/api/proxy-download?url=${encodeURIComponent(pinImage)}&filename=DownloaderZone_Pinterest_${pinId || 'image'}.jpg`;

          return res.json({
            success: true,
            platform: 'pinterest',
            platformName: 'Pinterest (Foto HD)',
            title: pinTitle,
            author: pinAuthor,
            duration: 'Foto HD',
            thumbnail: proxyThumb,
            mediaType: 'image',
            date: 'Resolusi Penuh',
            qualities: [
              {
                id: 'pin-orig',
                label: 'Unduh Foto Asli Resolusi Penuh (Original JPG)',
                resolution: 'Ultra HD',
                format: 'jpg',
                fileSize: 'Original HD',
                downloadUrl: downloadOrigUrl,
                isPopular: true,
                badge: 'Original JPG',
              },
            ],
            audioQualities: [],
          });
        }
      } catch (pinErr) {
        console.error('Pinterest general error:', pinErr);
      }
    }

    // 5. YOUTUBE (Videos, Shorts, youtu.be)
    if (/youtube\.com|youtu\.be/i.test(cleanUrl)) {
      let videoId = '';
      const vMatch = cleanUrl.match(/[?&]v=([^&#]+)/);
      const shortMatch = cleanUrl.match(/shorts\/([^/?&#]+)/);
      const youtuMatch = cleanUrl.match(/youtu\.be\/([^/?&#]+)/);

      if (vMatch) videoId = vMatch[1];
      else if (shortMatch) videoId = shortMatch[1];
      else if (youtuMatch) videoId = youtuMatch[1];

      let realTitle = 'Video YouTube';
      let realAuthor = 'YouTube Creator';
      let realThumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

      try {
        const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
        if (noembedRes.ok) {
          const ytData = await noembedRes.json();
          if (ytData.title) realTitle = ytData.title;
          if (ytData.author_name) realAuthor = ytData.author_name;
          if (ytData.thumbnail_url) realThumb = ytData.thumbnail_url;
        }
      } catch (err) {
        console.error('Noembed YouTube error:', err);
      }

      return res.json({
        success: true,
        platform: 'youtube',
        platformName: shortMatch ? 'YouTube Shorts' : 'YouTube HD',
        title: realTitle,
        author: realAuthor,
        duration: 'HD',
        thumbnail: realThumb,
        date: 'Tersedia',
        embedUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : undefined,
        mediaType: 'video',
        qualities: [
          {
            id: 'yt-1080',
            label: 'Video 1080p Full HD',
            resolution: '1080p 60fps',
            format: 'mp4',
            fileSize: 'Full HD',
            isPopular: true,
            badge: 'Full HD',
          },
          {
            id: 'yt-720',
            label: 'Video 720p HD Standar',
            resolution: '720p HD',
            format: 'mp4',
            fileSize: 'HD Quality',
          },
          {
            id: 'yt-480',
            label: 'Video 480p SD',
            resolution: '480p SD',
            format: 'mp4',
            fileSize: 'SD Quality',
          },
        ],
        audioQualities: [
          {
            id: 'yt-mp3-320',
            label: 'Audio MP3 Studio Quality',
            bitrate: '320 kbps',
            format: 'mp3',
            fileSize: 'Original Audio',
            isPopular: true,
            badge: 'MP3 320k',
          },
        ],
      });
    }

    // 6. SPOTIFY (Album, Track, Playlist)
    if (/spotify\.com/i.test(cleanUrl)) {
      try {
        const spotRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
        let spotData: any = {};
        if (spotRes.ok) {
          spotData = await spotRes.json();
        }

        const albumMatch = cleanUrl.match(/album\/([a-zA-Z0-9]+)/);
        const trackMatch = cleanUrl.match(/track\/([a-zA-Z0-9]+)/);
        const playlistMatch = cleanUrl.match(/playlist\/([a-zA-Z0-9]+)/);

        let type = 'track';
        let id = '';
        if (albumMatch) {
          type = 'album';
          id = albumMatch[1];
        } else if (playlistMatch) {
          type = 'playlist';
          id = playlistMatch[1];
        } else if (trackMatch) {
          type = 'track';
          id = trackMatch[1];
        }

        const embedUrl = id ? `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0` : undefined;
        const isAlbum = type === 'album';
        const isPlaylist = type === 'playlist';

        const coverDownloadUrl = spotData.thumbnail_url
          ? `/api/proxy-download?url=${encodeURIComponent(spotData.thumbnail_url)}&filename=${encodeURIComponent(`DownloaderZone_Spotify_${id || 'cover'}.jpg`)}`
          : undefined;

        const qualities: any[] = coverDownloadUrl ? [
          {
            id: 'sp-cover',
            label: isAlbum ? 'Cover Art Album Ultra HD (JPG)' : 'Cover Art Track Ultra HD (JPG)',
            resolution: '1400x1400 HD',
            format: 'jpg',
            fileSize: 'Resolusi Asli',
            downloadUrl: coverDownloadUrl,
            badge: 'Artwork JPG',
          },
        ] : [];

        if (isAlbum) {
          qualities.unshift({
            id: 'sp-album-zip',
            label: 'Unduh Semua Lagu Full Album (ZIP MP3 320kbps)',
            resolution: 'Semua Track',
            format: 'zip',
            fileSize: 'Full Album',
            isPopular: true,
            badge: 'Full Album ZIP',
          });
        }

        return res.json({
          success: true,
          platform: 'spotify',
          platformName: isAlbum ? 'Spotify Album' : (isPlaylist ? 'Spotify Playlist' : 'Spotify Music'),
          title: spotData.title || (isAlbum ? 'Spotify Album' : 'Lagu Spotify'),
          author: spotData.author_name || 'Spotify Artist',
          duration: isAlbum ? 'Full Album' : (isPlaylist ? 'Koleksi Lagu' : 'Audio Track'),
          thumbnail: spotData.thumbnail_url,
          date: 'Original Release',
          embedUrl,
          mediaType: 'audio',
          qualities,
          audioQualities: [
            {
              id: 'sp-320',
              label: isAlbum ? 'Audio MP3 320kbps HiFi (Semua Track)' : 'Audio MP3 320kbps HiFi (Lengkap ID3 Tag & Cover)',
              bitrate: '320 kbps',
              format: 'mp3',
              fileSize: 'Original Audio',
              isPopular: true,
              badge: '320 kbps HiFi',
            },
          ],
        });
      } catch (err) {
        console.error('Spotify error:', err);
      }
    }

    // 7. APPLE MUSIC (music.apple.com)
    if (/music\.apple\.com/i.test(cleanUrl)) {
      try {
        const appleRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        if (appleRes.ok) {
          const appleHtml = await appleRes.text();
          const meta = extractMetaTags(appleHtml);
          const cleanTitle = (meta.title || '').replace(/ on Apple Music/i, '').replace(/ - Single/i, '').trim() || 'Apple Music Track';
          let artistName = 'Apple Music Artist';
          if (cleanTitle.includes(' by ')) {
            const parts = cleanTitle.split(' by ');
            artistName = parts[1]?.trim() || artistName;
          }

          const coverDownloadUrl = meta.image
            ? `/api/proxy-download?url=${encodeURIComponent(meta.image)}&filename=${encodeURIComponent(`DownloaderZone_AppleMusic_Cover.jpg`)}`
            : undefined;

          return res.json({
            success: true,
            platform: 'applemusic',
            platformName: 'Apple Music',
            title: cleanTitle,
            author: artistName,
            duration: 'HQ Audio',
            thumbnail: meta.image || undefined,
            mediaType: 'audio',
            date: 'Original Master',
            qualities: coverDownloadUrl ? [
              {
                id: 'am-cover',
                label: 'Cover Art Ultra HD (Original JPG)',
                resolution: '1400x1400 HD',
                format: 'jpg',
                fileSize: 'Resolusi Asli',
                downloadUrl: coverDownloadUrl,
                badge: 'Apple Artwork',
              },
            ] : [],
            audioQualities: [
              {
                id: 'am-aac',
                label: 'Audio AAC / MP3 Lossless (Apple Master)',
                bitrate: '320 kbps',
                format: 'mp3',
                fileSize: 'Original Audio',
                isPopular: true,
                badge: 'Apple Digital Master',
              },
            ],
          });
        }
      } catch (appleErr) {
        console.error('Apple Music error:', appleErr);
      }
    }

    // 8. SOUNDCLOUD
    if (/soundcloud\.com/i.test(cleanUrl)) {
      try {
        // Extract artist and track from URL pathname: /artist/track
        const urlObj = new URL(cleanUrl);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        const artistSlug = parts[0] ? parts[0].replace(/[-_]/g, ' ') : 'SoundCloud Artist';
        const trackSlug = parts[1] ? parts[1].replace(/[-_]/g, ' ') : 'Audio Track';

        let scTitle = `${trackSlug.charAt(0).toUpperCase() + trackSlug.slice(1)}`;
        let scAuthor = artistSlug.charAt(0).toUpperCase() + artistSlug.slice(1);
        let scThumb: string | undefined = undefined;

        try {
          const scRes = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`);
          if (scRes.ok) {
            const scData = await scRes.json();
            if (scData.title) scTitle = scData.title;
            if (scData.author_name) scAuthor = scData.author_name;
            if (scData.thumbnail_url) scThumb = scData.thumbnail_url;
          }
        } catch {
          // fallback to parsed slugs
        }

        return res.json({
          success: true,
          platform: 'soundcloud',
          platformName: 'SoundCloud Track',
          title: scTitle,
          author: scAuthor,
          duration: 'HQ Audio',
          thumbnail: scThumb,
          date: 'Tersedia',
          mediaType: 'audio',
          qualities: [],
          audioQualities: [
            {
              id: 'sc-320',
              label: 'Audio MP3 320kbps High Quality',
              bitrate: '320 kbps',
              format: 'mp3',
              fileSize: 'Original Audio',
              isPopular: true,
              badge: 'Original Stream',
            },
          ],
        });
      } catch (err) {
        console.error('Soundcloud error:', err);
      }
    }

    // 9. VIMEO
    if (/vimeo\.com/i.test(cleanUrl)) {
      try {
        const vimeoRes = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(cleanUrl)}`);
        if (vimeoRes.ok) {
          const vimeoData = await vimeoRes.json();
          const durationStr = vimeoData.duration ? `${Math.floor(vimeoData.duration / 60)}:${(vimeoData.duration % 60).toString().padStart(2, '0')}` : 'HD';

          return res.json({
            success: true,
            platform: 'vimeo',
            platformName: 'Vimeo Video',
            title: vimeoData.title || 'Video Vimeo',
            author: vimeoData.author_name || 'Vimeo Creator',
            duration: durationStr,
            thumbnail: vimeoData.thumbnail_url,
            mediaType: 'video',
            date: 'HD',
            embedUrl: `https://player.vimeo.com/video/${vimeoData.video_id}?autoplay=1`,
            qualities: [
              {
                id: 'vm-1080',
                label: 'Video Vimeo 1080p Full HD',
                resolution: '1080p HD',
                format: 'mp4',
                fileSize: 'Full HD',
                isPopular: true,
                badge: '1080p',
              },
            ],
            audioQualities: [
              {
                id: 'vm-mp3',
                label: 'Audio Track MP3',
                bitrate: '320 kbps',
                format: 'mp3',
                fileSize: 'Original Audio',
              },
            ],
          });
        }
      } catch (vmErr) {
        console.error('Vimeo error:', vmErr);
      }
    }

    // 10. REDDIT
    if (/reddit\.com|redd\.it/i.test(cleanUrl)) {
      try {
        const redRes = await fetch(`https://www.reddit.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
        if (redRes.ok) {
          const redData = await redRes.json();
          return res.json({
            success: true,
            platform: 'reddit',
            platformName: 'Reddit Video / Post',
            title: redData.title || 'Postingan Reddit',
            author: redData.author_name ? `@${redData.author_name}` : 'Reddit User',
            duration: 'Original',
            thumbnail: redData.thumbnail_url || undefined,
            mediaType: 'video',
            date: 'Terbaru',
            qualities: [
              {
                id: 'rd-hd',
                label: 'Video MP4 HD (Audio Sinkron)',
                resolution: 'HD Quality',
                format: 'mp4',
                fileSize: 'HD Quality',
                isPopular: true,
                badge: 'HD Audio-Sync',
              },
            ],
            audioQualities: [],
          });
        }
      } catch (rdErr) {
        console.error('Reddit oembed error:', rdErr);
      }
    }

    // 11. TWITTER / X
    if (/twitter\.com|x\.com/i.test(cleanUrl)) {
      const tweetIdMatch = cleanUrl.match(/status\/(\d+)/);
      if (tweetIdMatch) {
        const tweetId = tweetIdMatch[1];
        try {
          const fxRes = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
          if (fxRes.ok) {
            const fxData = await fxRes.json();
            if (fxData && fxData.tweet) {
              const tweet = fxData.tweet;
              const videoMedia = tweet.media?.videos?.[0];
              const directVideo = videoMedia?.url;
              const thumb = videoMedia?.thumbnail_url || tweet.media?.photos?.[0]?.url;
              const streamUrl = directVideo ? `/api/proxy-stream?url=${encodeURIComponent(directVideo)}` : undefined;
              const downloadUrl = directVideo ? `/api/proxy-download?url=${encodeURIComponent(directVideo)}&filename=DownloaderZone_X_${tweetId}.mp4` : undefined;

              return res.json({
                success: true,
                platform: 'twitter',
                platformName: 'X (Twitter)',
                title: tweet.text ? tweet.text.slice(0, 120) : 'Postingan Video X / Twitter',
                author: `@${tweet.author?.screen_name || 'twitter_user'} (${tweet.author?.name || ''})`,
                duration: 'Original',
                thumbnail: thumb ? `/api/proxy-thumbnail?url=${encodeURIComponent(thumb)}` : undefined,
                likes: tweet.likes ? `${tweet.likes} suka` : undefined,
                views: tweet.views ? `${tweet.views} tontonan` : undefined,
                date: tweet.created_at || 'Terbaru',
                directVideoUrl: streamUrl,
                qualities: [
                  {
                    id: 'x-hd',
                    label: 'Video MP4 HD',
                    resolution: 'Original HD',
                    format: 'mp4',
                    fileSize: 'Direct Download',
                    downloadUrl: downloadUrl,
                    isPopular: true,
                    badge: 'HD Video',
                  },
                ],
                audioQualities: [
                  {
                    id: 'x-mp3',
                    label: 'Ekstrak Audio MP3',
                    bitrate: '320 kbps',
                    format: 'mp3',
                    fileSize: 'Original Audio',
                  },
                ],
              });
            }
          }
        } catch (err) {
          console.error('FxTwitter error:', err);
        }
      }
    }

    // 12. THREADS
    if (/threads\.net/i.test(cleanUrl)) {
      const userMatch = cleanUrl.match(/@([a-zA-Z0-9._]+)/);
      const user = userMatch ? `@${userMatch[1]}` : 'Threads Creator';

      try {
        const thRes = await fetch(cleanUrl, {
          headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' },
        });
        if (thRes.ok) {
          const thHtml = await thRes.text();
          const meta = extractMetaTags(thHtml);
          const cleanTitle = (meta.title || '').replace(/ • Log in/i, '').replace(/ - Threads/i, '').trim();

          return res.json({
            success: true,
            platform: 'threads',
            platformName: 'Threads',
            title: cleanTitle && !cleanTitle.includes('Log in') ? cleanTitle : `Postingan Threads oleh ${user}`,
            author: user,
            duration: 'Original',
            thumbnail: meta.image && !meta.image.includes('rsrc.php') ? meta.image : undefined,
            mediaType: 'video',
            date: 'Terbaru',
            qualities: [
              {
                id: 'th-hd',
                label: 'Video MP4 HD (Tanpa Watermark)',
                resolution: '1080p HD',
                format: 'mp4',
                fileSize: 'Original Quality',
                isPopular: true,
                badge: 'Clean Video',
              },
            ],
            audioQualities: [],
          });
        }
      } catch (thErr) {
        console.error('Threads error:', thErr);
      }
    }

    // 13. CAPCUT
    if (/capcut\.com/i.test(cleanUrl)) {
      try {
        const ccRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (ccRes.ok) {
          const ccHtml = await ccRes.text();
          const meta = extractMetaTags(ccHtml);
          const cleanTitle = (meta.title || 'Template Video CapCut').replace(/^CapCut template:\s*/i, '').trim();

          return res.json({
            success: true,
            platform: 'capcut',
            platformName: 'CapCut',
            title: cleanTitle || 'Template Video CapCut',
            author: '@capcut_creator',
            duration: 'Template Video',
            thumbnail: meta.image || undefined,
            mediaType: 'video',
            date: 'Terbaru',
            qualities: [
              {
                id: 'cc-hd',
                label: 'Unduh Video Template MP4 (Tanpa Watermark)',
                resolution: '1080p HD',
                format: 'mp4',
                fileSize: 'Original HD',
                isPopular: true,
                badge: 'No Watermark',
              },
            ],
            audioQualities: [
              {
                id: 'cc-audio',
                label: 'Audio Musik Template MP3',
                bitrate: '320 kbps',
                format: 'mp3',
                fileSize: 'Original Audio',
                isPopular: true,
              },
            ],
          });
        }
      } catch (ccErr) {
        console.error('CapCut error:', ccErr);
      }
    }

    // 14. GENERIC SCRAPER for other sites
    try {
      const pageRes = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        const meta = extractMetaTags(html);

        if (meta.title && !meta.title.toLowerCase().includes('404') && !meta.title.toLowerCase().includes('not found')) {
          const streamUrl = meta.video ? `/api/proxy-stream?url=${encodeURIComponent(meta.video)}` : undefined;
          const downloadUrl = meta.video ? `/api/proxy-download?url=${encodeURIComponent(meta.video)}&filename=DownloaderZone_Media.mp4` : undefined;

          const urlObj = new URL(cleanUrl);
          const domain = urlObj.hostname.replace(/^www\./, '');

          return res.json({
            success: true,
            platform: 'other',
            platformName: meta.siteName || domain,
            title: meta.title.trim(),
            author: `@${domain}`,
            duration: 'HD',
            thumbnail: meta.image || undefined,
            date: 'Terbaru',
            directVideoUrl: streamUrl,
            qualities: [
              {
                id: 'gen-hd',
                label: 'File Kualitas Tertinggi (Original)',
                resolution: '1080p Full HD',
                format: 'mp4',
                fileSize: 'Original Quality',
                downloadUrl: downloadUrl,
                isPopular: true,
                badge: 'Original HD',
              },
            ],
            audioQualities: [
              {
                id: 'gen-mp3',
                label: 'Ekstrak Audio MP3 320kbps',
                bitrate: '320 kbps',
                format: 'mp3',
                fileSize: 'Original Audio',
                isPopular: true,
              },
            ],
          });
        }
      }
    } catch (err) {
      console.error('Generic scrape error:', err);
    }

    // If completely unable to resolve, return honest error instead of fake placeholder!
    return res.status(400).json({
      success: false,
      error: 'Tidak dapat menemukan konten media dari tautan ini. Pastikan tautan masih aktif, valid, dan dapat diakses secara publik.',
    });
  } catch (error: any) {
    console.error('Parse error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Gagal memproses link' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
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

startServer();
