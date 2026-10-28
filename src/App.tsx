/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroDownloader } from './components/HeroDownloader';
import { MediaResultCard } from './components/MediaResultCard';
import { PlatformsGrid } from './components/PlatformsGrid';
import { FaqSection } from './components/FaqSection';
import { StatsSection } from './components/StatsSection';
import { HistoryModal } from './components/HistoryModal';
import { Footer } from './components/Footer';
import {
  MediaMetadata,
  DownloadQuality,
  DownloadHistoryItem,
} from './types';
import { detectPlatformFromUrl, fetchLinkMetadata } from './utils/downloader';
import { Check } from 'lucide-react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mediaResult, setMediaResult] = useState<MediaMetadata | null>(null);
  const [detectedPlatformName, setDetectedPlatformName] = useState<string | null>(null);

  // Download stats matching the screenshot: 98 Pengguna, 74 Download sukses
  const [userCount, setUserCount] = useState<number>(98);
  const [downloadCount, setDownloadCount] = useState<number>(74);

  // History & toast
  const [history, setHistory] = useState<DownloadHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('dz_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update detected platform when user types or pastes URL
  useEffect(() => {
    if (urlInput.trim()) {
      const p = detectPlatformFromUrl(urlInput);
      setDetectedPlatformName(p ? p.name : null);
    } else {
      setDetectedPlatformName(null);
    }
  }, [urlInput]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dz_history', JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }
  }, [history]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleProcessLink = async (targetUrl?: string) => {
    const linkToProcess = targetUrl || urlInput;
    if (!linkToProcess.trim()) {
      showToast('Silakan tempel tautan video atau audio terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setMediaResult(null);

    try {
      const metadata = await fetchLinkMetadata(linkToProcess);
      setMediaResult(metadata);

      // Scroll smoothly to result card
      setTimeout(() => {
        window.scrollTo({
          top: 360,
          behavior: 'smooth',
        });
      }, 100);
    } catch (err) {
      console.error(err);
      showToast('Gagal memproses link. Pastikan tautan valid dan publik.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleProcessLink();
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
    handleProcessLink(sampleUrl);
  };

  const handleDownloadSuccess = (
    mediaInfo: MediaMetadata | { title: string; platform: string },
    quality: DownloadQuality
  ) => {
    setDownloadCount((prev) => prev + 1);
    const newItem: DownloadHistoryItem = {
      id: `hist-${Date.now()}`,
      title: mediaInfo.title,
      platform: mediaInfo.platform,
      format: quality.format,
      quality: quality.label,
      fileSize: quality.fileSize,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev]);
    showToast(`Berhasil mengunduh "${mediaInfo.title.slice(0, 28)}..."`);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('dz_history');
    } catch {
      // Ignore
    }
  };

  const scrollToPlatforms = () => {
    const el = document.getElementById('platform');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#0b1219] text-slate-100 selection:bg-emerald-500 selection:text-slate-950'
          : 'bg-slate-900 text-slate-100'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      <main>
        {/* Hero Section */}
        <HeroDownloader
          urlInput={urlInput}
          onUrlChange={setUrlInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onSelectSample={handleSelectSample}
          onScrollToPlatforms={scrollToPlatforms}
          detectedPlatformName={detectedPlatformName}
        />

        {/* Media Result Preview (When Link Pasted) */}
        {mediaResult && (
          <MediaResultCard
            media={mediaResult}
            onDownloadSuccess={(media, quality) =>
              handleDownloadSuccess(media, quality)
            }
          />
        )}

        {/* 20 Platform Section */}
        <PlatformsGrid onSelectPlatform={handleSelectSample} />

        {/* Pertanyaan Umum (FAQ) Section */}
        <FaqSection />

        {/* Statistik Section with Screenshot-identical line chart */}
        <StatsSection userCount={userCount} downloadCount={downloadCount} />
      </main>

      {/* Footer */}
      <Footer />

      {/* History Modal Drawer */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
