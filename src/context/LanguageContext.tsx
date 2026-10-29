import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'id';

interface Translations {
  nav: {
    download: string;
    platforms: string;
    faq: string;
    liveStatus: string;
    history: string;
  };
  hero: {
    badge: string;
    headline: string;
    subtitle: string;
    placeholder: string;
    pasteBtn: string;
    downloadBtn: string;
    detectedPlatform: string;
    sampleLinksLabel: string;
    clipboardError: string;
    emptyInputError: string;
    fetchError: string;
    downloadSuccessToast: string;
  };
  result: {
    videoTab: string;
    audioTab: string;
    downloadNow: string;
    downloading: string;
    downloadReady: string;
    directDownload: string;
    preview: string;
    nowPlaying: string;
    copied: string;
    shareLink: string;
    qrCode: string;
    close: string;
    author: string;
    views: string;
    likes: string;
    duration: string;
    recommended: string;
  };
  platforms: {
    heading: string;
    subtitle: string;
    catAll: string;
    catShort: string;
    catVideo: string;
    catAudio: string;
    trySample: string;
    supportedFormats: string;
    close: string;
  };
  faq: {
    heading: string;
    subtitle: string;
    items: Array<{ q: string; a: string }>;
  };
  stats: {
    heading: string;
    subtitle: string;
    onlineUsers: string;
    onlineNow: string;
    downloadsToday: string;
    todayTotal: string;
    avgSpeed: string;
    avgLatency: string;
    serverStatus: string;
    statusOperational: string;
    liveActivity: string;
    userIn: string;
    justNow: string;
    secondsAgo: string;
  };
  history: {
    title: string;
    emptyTitle: string;
    emptyDesc: string;
    totalFiles: string;
    clearBtn: string;
    reDownload: string;
  };
  footer: {
    copyright: string;
    disclaimer: string;
    fastCdn: string;
    download: string;
    platforms: string;
    faq: string;
    liveStatus: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      download: 'Download',
      platforms: 'Platforms',
      faq: 'FAQ',
      liveStatus: 'Live Status',
      history: 'History',
    },
    hero: {
      badge: 'Downloader',
      headline: 'Download Videos&Music',
      subtitle:
        'Supports 17 platforms. Automatically detected from URL, instant high-speed processing, no watermark.',
      placeholder: 'Paste video, music, or reel link here (TikTok, Instagram, FB, YouTube, Spotify, etc.)...',
      pasteBtn: 'Paste',
      downloadBtn: 'Download',
      detectedPlatform: 'Detected platform',
      sampleLinksLabel: 'Sample links:',
      clipboardError: 'Clipboard permission denied. Please paste manually.',
      emptyInputError: 'Please paste a valid video or audio link first.',
      fetchError: 'Failed to process link. Please ensure the post is public and valid.',
      downloadSuccessToast: 'Download started for',
    },
    result: {
      videoTab: 'Video & Photo',
      audioTab: 'Audio & Music',
      downloadNow: 'Download Now',
      downloading: 'Processing...',
      downloadReady: 'Ready',
      directDownload: 'Direct Download',
      preview: 'Preview Player',
      nowPlaying: 'Now Playing',
      copied: 'Link copied to clipboard!',
      shareLink: 'Share Link',
      qrCode: 'Scan QR Code',
      close: 'Close',
      author: 'Creator',
      views: 'Views',
      likes: 'Likes',
      duration: 'Duration',
      recommended: 'Popular',
    },
    platforms: {
      heading: '17 Supported Platforms',
      subtitle: 'All-in-one downloader — paste link, choose resolution, and download with ease.',
      catAll: 'All (17)',
      catShort: 'Shorts & Reels',
      catVideo: 'HD & 4K Video',
      catAudio: 'Music & Audio',
      trySample: 'Try Sample Link',
      supportedFormats: 'Supported Formats',
      close: 'Close',
    },
    faq: {
      heading: 'Frequently Asked Questions',
      subtitle: 'Quick answers about features, usage, and supported formats.',
      items: [
        {
          q: 'Which platforms are supported?',
          a: 'Downloader Zone supports 17 top video and music platforms, including TikTok (watermark-free HD & audio), YouTube (video up to 4K & MP3 320kbps), Instagram (Reels, Stories, Feed photos, and Carousel albums), Facebook (HD videos & Reels), Twitter / X, Threads, Pinterest (original high-res JPG), Spotify, SoundCloud, Apple Music, CapCut, Douyin, Reddit, Bilibili, Vimeo, Twitch, and SnackVideo.',
        },
        {
          q: 'How do I download media?',
          a: 'It takes 3 simple steps: (1) Copy the link of any public video, reel, or song from your favorite app. (2) Paste the link into the input field above and hit the download button. (3) Choose your preferred quality (e.g. 1080p Full HD or 320kbps MP3) and click "Download Now". Your file starts downloading immediately.',
        },
        {
          q: 'How do I copy links from Instagram, TikTok, or Facebook?',
          a: 'Open your social media app, navigate to the post/video you want to save, tap the "Share" button, and select "Copy Link". Then open Downloader Zone and click the "Paste" button.',
        },
        {
          q: 'Why did my download fail or show an error?',
          a: 'Make sure the media is set to Public (not Private or restricted to followers). If the link was copied from a browser, ensure the full URL is included. Our system also automatically switches to fallback resolver servers if a primary API is temporarily rate-limited.',
        },
        {
          q: 'Is Downloader Zone legal to use?',
          a: 'Downloader Zone is intended strictly for personal archiving, educational analysis, and offline viewing of publicly accessible content. We respect intellectual property rights; commercial redistribution or re-uploading without the copyright owner\'s explicit consent is prohibited.',
        },
        {
          q: 'Is this service free with any limits?',
          a: 'Yes, Downloader Zone is 100% free forever. No account registration, no credit card, and no daily download limits. You can download as many files as you need at full server CDN speeds.',
        },
        {
          q: 'Where are files saved on my device?',
          a: 'On Windows and Mac, files are automatically saved to your browser\'s default "Downloads" folder. On Android and iPhone/iPad, downloads appear in your Files app or can be directly saved to your Camera Roll / Photos gallery.',
        },
      ],
    },
    stats: {
      heading: 'Live Status & Real-Time Activity',
      subtitle: 'Current network throughput, active users, and live download requests.',
      onlineUsers: 'Active Users Online',
      onlineNow: 'Live Now',
      downloadsToday: 'Downloads Processed Today',
      todayTotal: 'Today',
      avgSpeed: 'Average Response Time',
      avgLatency: '~1.2s High-Speed CDN',
      serverStatus: 'Global Proxy Engine',
      statusOperational: '99.9% All Nodes Operational',
      liveActivity: 'Recent Download Stream (Live)',
      userIn: 'User from',
      justNow: 'Just now',
      secondsAgo: 's ago',
    },
    history: {
      title: 'Download History',
      emptyTitle: 'No downloads yet in this session.',
      emptyDesc: 'Paste a video or music link above to start downloading.',
      totalFiles: 'Total files',
      clearBtn: 'Clear History',
      reDownload: 'Download again',
    },
    footer: {
      copyright: '© 2026 Downloader Zone. All rights reserved. | Powered by 6ickzone',
      disclaimer:
        'Downloader Zone is a media downloading utility for personal archiving and educational purposes. We do not host or store videos or music on our servers.',
      fastCdn: 'Fast CDN Servers',
      download: 'Download',
      platforms: 'Platforms',
      faq: 'FAQ',
      liveStatus: 'Live Status',
    },
  },
  id: {
    nav: {
      download: 'Download',
      platforms: 'Platform',
      faq: 'FAQ',
      liveStatus: 'Status Terkini',
      history: 'Riwayat',
    },
    hero: {
      badge: 'Downloader',
      headline: 'Download Videos&Music',
      subtitle:
        'Mendukung 17 platform. Dikenali otomatis dari tautan, pemrosesan cepat tanpa watermark dan tanpa registrasi.',
      placeholder: 'Paste link di sini (TikTok, Instagram, FB, YouTube, Spotify, dll)...',
      pasteBtn: 'Paste',
      downloadBtn: 'Download',
      detectedPlatform: 'Platform terdeteksi',
      sampleLinksLabel: 'Contoh link:',
      clipboardError: 'Izin clipboard tidak tersedia. Silakan tempel manual.',
      emptyInputError: 'Silakan tempel tautan video atau audio terlebih dahulu.',
      fetchError: 'Gagal memproses tautan. Pastikan konten bersifat publik dan tautan valid.',
      downloadSuccessToast: 'Berhasil mengunduh',
    },
    result: {
      videoTab: 'Video & Foto',
      audioTab: 'Audio & Musik',
      downloadNow: 'Unduh Sekarang',
      downloading: 'Memproses...',
      downloadReady: 'Siap',
      directDownload: 'Unduh Langsung',
      preview: 'Pemutar Preview',
      nowPlaying: 'Sedang Diputar',
      copied: 'Tautan disalin ke clipboard!',
      shareLink: 'Bagikan Link',
      qrCode: 'Scan Kode QR',
      close: 'Tutup',
      author: 'Kreator',
      views: 'Tayangan',
      likes: 'Suka',
      duration: 'Durasi',
      recommended: 'Populer',
    },
    platforms: {
      heading: '17 Platform yang Didukung',
      subtitle: 'Semua dalam satu tempat — tempel link, pilih kualitas, lalu download dengan praktis.',
      catAll: 'Semua (17)',
      catShort: 'Shorts & Reels',
      catVideo: 'Video HD & 4K',
      catAudio: 'Musik & Audio',
      trySample: 'Coba Contoh Link',
      supportedFormats: 'Format yang Didukung',
      close: 'Tutup',
    },
    faq: {
      heading: 'Pertanyaan Umum',
      subtitle: 'Jawaban singkat untuk hal-hal yang sering ditanyakan pengguna.',
      items: [
        {
          q: 'Platform apa saja yang didukung?',
          a: 'Downloader Zone mendukung 17 platform video dan musik populer di dunia, termasuk TikTok (tanpa watermark), YouTube (video 4K hingga MP3), Instagram (Reels, Story, Feed, Carousel), Facebook (video HD & Reels), X / Twitter, Threads, Pinterest (resolusi original JPG), Spotify, SoundCloud, Apple Music, CapCut, Douyin, Reddit, Bilibili, Vimeo, Twitch, dan SnackVideo.',
        },
        {
          q: 'Bagaimana cara download?',
          a: 'Sangat mudah: (1) Salin URL atau link dari video/musik di aplikasi media sosial yang ingin Anda unduh, (2) Tempel link pada kotak input di atas lalu tekan tombol unduh, (3) Pilih kualitas video atau audio yang diinginkan (misal: 1080p Full HD atau MP3 320kbps), lalu klik "Unduh Sekarang". File langsung tersimpan di perangkat Anda.',
        },
        {
          q: 'Bagaimana cara menyalin link dari Instagram, TikTok, atau Facebook?',
          a: 'Cukup buka aplikasi media sosial Anda, pilih video atau postingan yang ingin diunduh, tekan tombol "Bagikan" (Share), lalu pilih "Salin Tautan" (Copy Link). Setelah itu tempelkan pada Downloader Zone.',
        },
        {
          q: 'Download gagal atau link tidak jalan?',
          a: 'Pastikan akun pemilik video tidak dikunci (Private) dan konten dapat diakses publik. Sistem kami juga dilengkapi auto-fallback ke server resolver cadangan jika salah satu API sedang padat.',
        },
        {
          q: 'Apakah legal?',
          a: 'Downloader Zone adalah alat bantu pengunduhan untuk keperluan arsip pribadi, edukasi, dan konsumsi offline dari konten publik. Kami menghargai hak cipta pemilik konten; dilarang mengomersialkan karya berhak cipta tanpa izin tertulis dari pemilik sah.',
        },
        {
          q: 'Apakah layanan ini gratis dan ada batasan?',
          a: 'Ya, Downloader Zone 100% gratis tanpa biaya, tanpa perlu daftar akun, dan tanpa batasan jumlah unduhan harian.',
        },
        {
          q: 'Di mana file tersimpan setelah download?',
          a: 'Pada komputer (Windows/Mac), file otomatis masuk ke folder "Downloads". Pada perangkat Android atau iPhone, file akan muncul di aplikasi File Manager atau Galeri Foto / Pemutar Musik.',
        },
      ],
    },
    stats: {
      heading: 'Status & Aktivitas Terkini',
      subtitle: 'Metrik jaringan live, pengguna aktif, dan riwayat unduhan real-time.',
      onlineUsers: 'Pengguna Online Saat Ini',
      onlineNow: 'Live Terkini',
      downloadsToday: 'Unduhan Diproses Hari Ini',
      todayTotal: 'Hari Ini',
      avgSpeed: 'Kecepatan Rata-Rata',
      avgLatency: '~1.2s CDN Berkecepatan Tinggi',
      serverStatus: 'Proxy Engine Global',
      statusOperational: '99.9% Node Berjalan Normal',
      liveActivity: 'Aktivitas Unduhan Terkini (Real-Time)',
      userIn: 'Pengguna di',
      justNow: 'Baru saja',
      secondsAgo: 'detik lalu',
    },
    history: {
      title: 'Riwayat Unduhan',
      emptyTitle: 'Belum ada unduhan di sesi ini.',
      emptyDesc: 'Tempel link video atau lagu di atas untuk mulai mengunduh.',
      totalFiles: 'Total berkas',
      clearBtn: 'Bersihkan Riwayat',
      reDownload: 'Unduh Ulang',
    },
    footer: {
      copyright: '© 2026 Downloader Zone. All rights reserved. | Powered by 6ickzone',
      disclaimer:
        'Downloader Zone adalah alat bantu pengunduhan konten publik untuk keperluan arsip pribadi dan edukasi. Kami tidak menyimpan video atau musik di server kami.',
      fastCdn: 'Server CDN Cepat',
      download: 'Download',
      platforms: 'Platform',
      faq: 'FAQ',
      liveStatus: 'Status Terkini',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('dz_lang');
      if (saved === 'id' || saved === 'en') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('dz_lang', lang);
    } catch {
      // ignore
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
