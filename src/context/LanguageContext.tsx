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
    catImage: string;
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
        'Paste a public link from TikTok, Instagram, Facebook, X, Pinterest, YouTube, or Twitch. Files are fetched from the source; MP3 is converted with ffmpeg.',
      placeholder: 'Paste a public TikTok, Instagram, Facebook, X, Pinterest, YouTube, or Twitch link...',
      pasteBtn: 'Paste',
      downloadBtn: 'Download',
      detectedPlatform: 'Detected platform',
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
      heading: 'Supported Platforms',
      subtitle: 'Only platforms with tested, working resolvers. Every listed file comes from the source link you provide.',
      catAll: 'All',
      catShort: 'Shorts & Reels',
      catVideo: 'Video',
      catImage: 'Photo',
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
          a: 'Direct downloads are supported for public TikTok, Instagram, Facebook, X, Pinterest, YouTube, and Twitch clips. YouTube videos are merged from their original video and audio streams up to 1080p. Spotify and Apple Music still return original cover art only because their audio is DRM-protected; SoundCloud and Vimeo require HLS/DASH access and are not advertised as download sources.',
        },
        {
          q: 'How do I download media?',
          a: 'Copy the link of a public post, paste it into the field above, press the download button, then choose a real file option. TikTok, Instagram, Facebook, X, YouTube, and Twitch media can also be converted to a real MP3 by ffmpeg. The server checks the source before the browser saves anything.',
        },
        {
          q: 'How do I copy links from Instagram, TikTok, or Facebook?',
          a: 'Open your social media app, navigate to the post/video you want to save, tap the "Share" button, and select "Copy Link". Then open Downloader Zone and click the "Paste" button.',
        },
        {
          q: 'Why did my download fail or show an error?',
          a: 'Make sure the post is public and the link is still active. Signed CDN links expire, and private accounts cannot be read. The app shows the exact source error instead of saving a broken file; re-process the original link to get fresh URLs.'
        },
        {
          q: 'Is Downloader Zone legal to use?',
          a: 'Downloader Zone is intended strictly for personal archiving, educational analysis, and offline viewing of publicly accessible content. We respect intellectual property rights; commercial redistribution or re-uploading without the copyright owner\'s explicit consent is prohibited.',
        },
        {
          q: 'Is this service free with any limits?',
          a: 'Yes. There is no account registration and no download counter. The only limits come from the source platform: private posts, expired links, and DRM-protected music cannot be downloaded.',
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
      fastCdn: 'Direct source streaming',
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
        'Tempel tautan publik dari TikTok, Instagram, Facebook, X, Pinterest, YouTube, atau Twitch. File diambil dari sumbernya; MP3 dikonversi dengan ffmpeg.',
      placeholder: 'Tempel tautan publik TikTok, Instagram, Facebook, X, Pinterest, YouTube, atau Twitch...',
      pasteBtn: 'Paste',
      downloadBtn: 'Download',
      detectedPlatform: 'Platform terdeteksi',
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
      heading: 'Platform yang Didukung',
      subtitle: 'Hanya platform dengan resolver yang sudah diuji. Setiap file berasal dari tautan yang Anda berikan.',
      catAll: 'Semua',
      catShort: 'Shorts & Reels',
      catVideo: 'Video',
      catImage: 'Foto',
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
          a: 'Unduhan langsung didukung untuk tautan publik TikTok, Instagram, Facebook, X, Pinterest, YouTube, dan klip Twitch. Video YouTube digabung dari stream video dan audio aslinya hingga 1080p. Spotify dan Apple Music hanya mengembalikan cover art karena audionya ber-DRM; SoundCloud dan Vimeo memerlukan akses HLS/DASH sehingga tidak ditampilkan sebagai sumber unduhan.',
        },
        {
          q: 'Bagaimana cara download?',
          a: 'Salin tautan postingan publik, tempel di kolom atas, tekan tombol unduh, lalu pilih file yang tersedia. Video TikTok, Instagram, Facebook, X, YouTube, dan Twitch juga bisa dikonversi menjadi MP3 asli oleh ffmpeg. Server memeriksa sumbernya sebelum browser menyimpan file.',
        },
        {
          q: 'Bagaimana cara menyalin link dari Instagram, TikTok, atau Facebook?',
          a: 'Cukup buka aplikasi media sosial Anda, pilih video atau postingan yang ingin diunduh, tekan tombol "Bagikan" (Share), lalu pilih "Salin Tautan" (Copy Link). Setelah itu tempelkan pada Downloader Zone.',
        },
        {
          q: 'Download gagal atau link tidak jalan?',
          a: 'Pastikan postingan publik dan tautannya masih aktif. Tautan CDN yang ditandatangani bisa kedaluwarsa, dan akun privat tidak bisa dibaca. Aplikasi menampilkan error dari sumber, bukan menyimpan file rusak; proses ulang tautan asli untuk mendapatkan URL baru.'
        },
        {
          q: 'Apakah legal?',
          a: 'Downloader Zone adalah alat bantu pengunduhan untuk keperluan arsip pribadi, edukasi, dan konsumsi offline dari konten publik. Kami menghargai hak cipta pemilik konten; dilarang mengomersialkan karya berhak cipta tanpa izin tertulis dari pemilik sah.',
        },
        {
          q: 'Apakah layanan ini gratis dan ada batasan?',
          a: 'Ya. Tidak perlu daftar akun dan tidak ada penghitung unduhan. Batasan hanya datang dari platform sumber: postingan privat, tautan kedaluwarsa, dan musik ber-DRM tidak bisa diunduh.',
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
      fastCdn: 'Streaming dari sumber asli',
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
