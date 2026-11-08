export type PlatformId =
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'pinterest'
  | 'twitter'
  | 'youtube'
  | 'threads'
  | 'spotify'
  | 'soundcloud'
  | 'applemusic'
  | 'capcut'
  | 'douyin'
  | 'reddit'
  | 'bilibili'
  | 'vimeo'
  | 'twitch'
  | 'snackvideo'
  | 'other';

export interface PlatformInfo {
  id: PlatformId;
  name: string;
  badge: string;
  category: 'video' | 'audio' | 'short' | 'image';
  iconColor: string;
  textColor: string;
  bgColor: string;
  accentColor: string;
  description: string;
  supportedFormats: string[];
  urlPattern: RegExp;
  iconName: string;
}

export interface DownloadQuality {
  id: string;
  label: string;
  resolution?: string;
  bitrate?: string;
  format: 'mp4' | 'mp3' | 'zip' | 'jpg' | 'png';
  fileSize?: string;
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
  duration?: string;
  thumbnail?: string;
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
  notice?: string;
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  platform: string;
  format: DownloadQuality['format'];
  quality: string;
  timestamp: number;
  fileSize: string;
  downloadUrl?: string;
}
