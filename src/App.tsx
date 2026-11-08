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
import { HistoryModal } from './components/HistoryModal';
import { Footer } from './components/Footer';
import { MediaMetadata, DownloadQuality, DownloadHistoryItem } from './types';
import { detectPlatformFromUrl, fetchLinkMetadata } from './utils/downloader';
import { Check } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function MainApp() {
  const { t } = useLanguage();
  const [urlInput, setUrlInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mediaResult, setMediaResult] = useState<MediaMetadata | null>(null);
  const [detectedPlatformName, setDetectedPlatformName] = useState<string | null>(null);

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

  useEffect(() => {
    if (urlInput.trim()) {
      const platform = detectPlatformFromUrl(urlInput);
      setDetectedPlatformName(platform ? platform.name : null);
    } else {
      setDetectedPlatformName(null);
    }
  }, [urlInput]);

  useEffect(() => {
    try {
      localStorage.setItem('dz_history', JSON.stringify(history));
    } catch {
      // Storage can be unavailable (private mode); history is optional.
    }
  }, [history]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleProcessLink = async (targetUrl?: string) => {
    const linkToProcess = (targetUrl || urlInput).trim();
    if (!linkToProcess) {
      showToast(t.hero.emptyInputError);
      return;
    }

    setIsLoading(true);
    setMediaResult(null);

    try {
      const metadata = await fetchLinkMetadata(linkToProcess);
      setMediaResult(metadata);
      setTimeout(() => {
        window.scrollTo({ top: 360, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : t.hero.fetchError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleProcessLink();
  };

  const handleDownloadSuccess = (
    mediaInfo: MediaMetadata | { title: string; platform: string },
    quality: DownloadQuality
  ) => {
    const newItem: DownloadHistoryItem = {
      id: `hist-${Date.now()}`,
      title: mediaInfo.title,
      platform: mediaInfo.platform,
      format: quality.format,
      quality: quality.label,
      fileSize: quality.fileSize || '-',
      timestamp: Date.now(),
      downloadUrl: quality.downloadUrl,
    };
    setHistory((prev) => [newItem, ...prev]);
    showToast(`${t.hero.downloadSuccessToast} "${mediaInfo.title.slice(0, 28)}..."`);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('dz_history');
    } catch {
      // ignore
    }
  };

  const scrollToPlatforms = () => {
    const el = document.getElementById('platform');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0b1219] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 stroke-[3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar onOpenHistory={() => setIsHistoryOpen(true)} historyCount={history.length} />

      <main>
        <HeroDownloader
          urlInput={urlInput}
          onUrlChange={setUrlInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onScrollToPlatforms={scrollToPlatforms}
          detectedPlatformName={detectedPlatformName}
        />

        {mediaResult && (
          <MediaResultCard media={mediaResult} onDownloadSuccess={handleDownloadSuccess} />
        )}

        <PlatformsGrid />
        <FaqSection />
      </main>

      <Footer />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
