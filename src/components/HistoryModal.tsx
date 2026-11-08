import React, { useState } from 'react';
import { X, Trash2, Download, History, FileVideo, Music, AlertCircle, Loader2 } from 'lucide-react';
import { DownloadHistoryItem } from '../types';
import { triggerFileDownload } from '../utils/downloader';
import { useLanguage } from '../context/LanguageContext';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DownloadHistoryItem[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  const { t, language } = useLanguage();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReDownload = async (item: DownloadHistoryItem) => {
    if (pendingId) return;
    setPendingId(item.id);
    setError(null);
    try {
      await triggerFileDownload(item.title, item.platform, item.quality, item.format, item.downloadUrl);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : language === 'en'
            ? 'The source link has expired. Process the original link again.'
            : 'Tautan sumber sudah kedaluwarsa. Proses ulang tautan aslinya.'
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#14212d] border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">{t.history.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="overflow-y-auto py-4 flex-1 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{t.history.emptyTitle}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t.history.emptyDesc}
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 transition-all gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0">
                    {item.format === 'mp4' ? (
                      <FileVideo className="w-4 h-4" />
                    ) : (
                      <Music className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      <span className="uppercase text-emerald-400">{item.platform}</span> ·{' '}
                      {item.quality} · {item.fileSize}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleReDownload(item)}
                  disabled={pendingId !== null}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  title={t.history.reDownload}
                >
                  {pendingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400 font-mono">
              {t.history.totalFiles}: {history.length}
            </span>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.history.clearBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
