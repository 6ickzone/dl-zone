import { MediaMetadata, SearchSongItem } from '../types';

export const SAMPLE_PRESETS: Record<string, Partial<MediaMetadata>> = {
  tiktok: {
    platform: 'tiktok',
    platformName: 'TikTok (No Watermark)',
    title: 'Dance Challenge Viral Sound 2026 - Trend FYP Indonesia',
    author: '@creative_dance_id',
    duration: '0:34',
    likes: '1.4M',
    views: '8.9M',
    date: '24 Okt 2026',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    qualities: [
      { id: 'tt-hd-nowm', label: 'MP4 HD (Tanpa Watermark)', resolution: '1080p Full HD', format: 'mp4', fileSize: '14.8 MB', isPopular: true, badge: 'Paling Dicari' },
      { id: 'tt-sd-nowm', label: 'MP4 Standar (Tanpa Watermark)', resolution: '720p HD', format: 'mp4', fileSize: '8.2 MB' },
      { id: 'tt-wm', label: 'MP4 Original (Dengan Watermark)', resolution: 'Original', format: 'mp4', fileSize: '14.9 MB' }
    ],
    audioQualities: [
      { id: 'tt-mp3-hq', label: 'Audio MP3 Asli (High Quality)', bitrate: '320 kbps', format: 'mp3', fileSize: '3.1 MB', isPopular: true, badge: 'Audio Jernih' },
      { id: 'tt-mp3-std', label: 'Audio Ringtone Ringan', bitrate: '128 kbps', format: 'mp3', fileSize: '1.4 MB' }
    ]
  },
  youtube: {
    platform: 'youtube',
    platformName: 'YouTube HD',
    title: '4K Cinematic Indonesia - Alam Nusantara & Keindahan Tropis',
    author: 'Wonder Nusantara Channel',
    duration: '4:18',
    likes: '342K',
    views: '4.8M',
    date: '18 Okt 2026',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    qualities: [
      { id: 'yt-4k', label: 'Video 4K Ultra HD', resolution: '2160p 60fps', format: 'mp4', fileSize: '184.5 MB', isPopular: true, badge: 'Ultra HD' },
      { id: 'yt-1080', label: 'Video 1080p Full HD', resolution: '1080p 60fps', format: 'mp4', fileSize: '68.2 MB', isPopular: true },
      { id: 'yt-720', label: 'Video 720p HD', resolution: '720p HD', format: 'mp4', fileSize: '32.4 MB' },
      { id: 'yt-480', label: 'Video 480p (Hemat Data)', resolution: '480p SD', format: 'mp4', fileSize: '16.1 MB' }
    ],
    audioQualities: [
      { id: 'yt-mp3-320', label: 'Audio MP3 Studio Quality', bitrate: '320 kbps', format: 'mp3', fileSize: '9.8 MB', isPopular: true, badge: 'Studio 320k' },
      { id: 'yt-mp3-192', label: 'Audio MP3 Standar', bitrate: '192 kbps', format: 'mp3', fileSize: '5.9 MB' }
    ]
  },
  instagram: {
    platform: 'instagram',
    platformName: 'Instagram Reels',
    title: 'Cinematic Travel Reel - Sunset Aesthetic di Bali Pantai Melasti',
    author: '@wanderlust.bali',
    duration: '0:45',
    likes: '89.2K',
    views: '610K',
    date: '22 Okt 2026',
    thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80',
    qualities: [
      { id: 'ig-reels-1080', label: 'Reels MP4 Full HD', resolution: '1080x1920', format: 'mp4', fileSize: '18.4 MB', isPopular: true, badge: 'Kualitas Asli' },
      { id: 'ig-reels-720', label: 'Reels MP4 Standar', resolution: '720x1280', format: 'mp4', fileSize: '9.2 MB' }
    ],
    audioQualities: [
      { id: 'ig-audio', label: 'Backsound Audio Reels MP3', bitrate: '320 kbps', format: 'mp3', fileSize: '2.8 MB', isPopular: true }
    ]
  },
  facebook: {
    platform: 'facebook',
    platformName: 'Facebook Video',
    title: 'Tips & Tutorial Masak Cepat 10 Menit Menu Rumahan Lezat',
    author: 'Dapur Nusantara Official',
    duration: '3:12',
    likes: '45K',
    views: '890K',
    date: '20 Okt 2026',
    thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    qualities: [
      { id: 'fb-hd', label: 'Facebook Video HD 1080p', resolution: '1080p', format: 'mp4', fileSize: '42.6 MB', isPopular: true, badge: 'HD' },
      { id: 'fb-sd', label: 'Facebook Video SD 480p', resolution: '480p', format: 'mp4', fileSize: '18.2 MB' }
    ],
    audioQualities: [
      { id: 'fb-mp3', label: 'Ekstrak Audio MP3', bitrate: '192 kbps', format: 'mp3', fileSize: '4.4 MB' }
    ]
  },
  spotify: {
    platform: 'spotify',
    platformName: 'Spotify Track',
    title: 'Komang - Raim Laode (Full Original Audio)',
    author: 'Raim Laode',
    duration: '3:42',
    likes: '1.2M',
    views: '84M plays',
    date: '2023 / 2026 Remastered',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    qualities: [],
    audioQualities: [
      { id: 'sp-320', label: 'MP3 Lossless Audio 320kbps (ID3 Tag + Lirik)', bitrate: '320 kbps', format: 'mp3', fileSize: '8.5 MB', isPopular: true, badge: '320 kbps HiFi' },
      { id: 'sp-192', label: 'MP3 Standar 192kbps', bitrate: '192 kbps', format: 'mp3', fileSize: '5.1 MB' },
      { id: 'sp-art', label: 'Cover Art Album High Resolution', resolution: '1400x1400', format: 'jpg', fileSize: '1.2 MB' }
    ]
  }
};

export const SEARCH_SONGS_DATABASE: SearchSongItem[] = [
  {
    id: 'song-1',
    title: 'Komang',
    artist: 'Raim Laode',
    album: 'Komang - Single',
    duration: '3:42',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    platform: 'spotify',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/water/rain_heavy.ogg',
    qualities: [
      { id: 'q-sp-1', label: 'MP3 320kbps HiFi (Lengkap Tag & Cover)', bitrate: '320 kbps', format: 'mp3', fileSize: '8.5 MB', isPopular: true },
      { id: 'q-sp-2', label: 'MP3 192kbps', bitrate: '192 kbps', format: 'mp3', fileSize: '5.1 MB' }
    ]
  },
  {
    id: 'song-2',
    title: 'Sialan',
    artist: 'Juicy Luicy x Adrian Khalif',
    album: 'Sialan Single Hit',
    duration: '4:05',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
    platform: 'spotify',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/water/air_woosh.ogg',
    qualities: [
      { id: 'q-sp-3', label: 'MP3 320kbps HiFi', bitrate: '320 kbps', format: 'mp3', fileSize: '9.3 MB', isPopular: true },
      { id: 'q-sp-4', label: 'MP4 Video Lirik HD', resolution: '1080p', format: 'mp4', fileSize: '34.2 MB' }
    ]
  },
  {
    id: 'song-3',
    title: 'Nanti Kita Seperti Ini',
    artist: 'Batas Senja',
    album: 'Batas Senja Akustik',
    duration: '3:58',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
    platform: 'youtube',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    qualities: [
      { id: 'q-sp-5', label: 'MP3 320kbps HQ', bitrate: '320 kbps', format: 'mp3', fileSize: '9.1 MB', isPopular: true },
      { id: 'q-sp-6', label: 'MP4 Official Video', resolution: '1080p 60fps', format: 'mp4', fileSize: '52.0 MB' }
    ]
  },
  {
    id: 'song-4',
    title: 'DJ Komang x Gala Gala Remix Viral TikTok',
    artist: 'DJ Mengkane FYP',
    album: 'TikTok Sound Viral 2026',
    duration: '2:50',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    platform: 'soundcloud',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
    qualities: [
      { id: 'q-sp-7', label: 'MP3 Bass Boosted 320kbps', bitrate: '320 kbps', format: 'mp3', fileSize: '6.5 MB', isPopular: true },
      { id: 'q-sp-8', label: 'MP3 Standar', bitrate: '192 kbps', format: 'mp3', fileSize: '3.9 MB' }
    ]
  },
  {
    id: 'song-5',
    title: 'Gala Bunga Matahari',
    artist: 'Sal Priadi',
    album: 'Markers and Such Pens Flashdisks',
    duration: '3:45',
    cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
    platform: 'spotify',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/water/rain_heavy.ogg',
    qualities: [
      { id: 'q-sp-9', label: 'MP3 320kbps HiFi', bitrate: '320 kbps', format: 'mp3', fileSize: '8.6 MB', isPopular: true },
      { id: 'q-sp-10', label: 'MP4 Video Musik Official HD', resolution: '1080p', format: 'mp4', fileSize: '48.1 MB' }
    ]
  },
  {
    id: 'song-6',
    title: 'Faded (Remastered 2026)',
    artist: 'Alan Walker',
    album: 'Different World',
    duration: '3:32',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80',
    platform: 'youtube',
    sampleAudioUrl: 'https://actions.google.com/sounds/v1/water/air_woosh.ogg',
    qualities: [
      { id: 'q-sp-11', label: 'MP3 320kbps Studio', bitrate: '320 kbps', format: 'mp3', fileSize: '8.1 MB', isPopular: true },
      { id: 'q-sp-12', label: 'Video 4K UHD 60fps', resolution: '2160p', format: 'mp4', fileSize: '142 MB' }
    ]
  }
];
