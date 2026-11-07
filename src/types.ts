export type PlatformId =
  | 'tiktok'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'threads'
  | 'pinterest'
  | 'spotify'
  | 'soundcloud'
  | 'applemusic'
  | 'capcut'
  | 'douyin'
  | 'reddit'
  | 'bilibili'
  | 'vimeo'
  | 'twitch'
  | 'snackvideo';

export interface PlatformInfo {
  id: PlatformId;
  name: string;
  badge: string;
  category: 'video' | 'audio' | 'short';
  iconColor: string;
  textColor: string;
  bgColor: string;
  accentColor: string;
  description: string;
  supportedFormats: string[];
  urlPattern: RegExp;
  sampleUrl: string;
  iconName: string;
}

export interface DownloadQuality {
  id: string;
  label: string;
  resolution?: string;
  bitrate?: string;
  format: 'mp4' | 'mp3' | 'zip' | 'jpg' | 'png';
  fileSize: string;
  badge?: string;
  isPopular?: boolean;
  downloadUrl?: string;
}

export interface MediaMetadata {
  id: string;
  url: string;
  platform: PlatformId;
  platformName: string;
  title: string;
  author: string;
  authorAvatar?: string;
  duration?: string;
  thumbnail: string;
  likes?: string;
  views?: string;
  date?: string;
  qualities: DownloadQuality[];
  audioQualities: DownloadQuality[];
  previewUrl?: string;
  directVideoUrl?: string;
  directAudioUrl?: string;
  embedUrl?: string;
  mediaType?: 'video' | 'audio' | 'image';
}

export interface SearchSongItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
  platform: 'spotify' | 'youtube' | 'soundcloud';
  sampleAudioUrl: string;
  qualities: DownloadQuality[];
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  platform: string;
  format: string;
  quality: string;
  timestamp: number;
  fileSize: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
