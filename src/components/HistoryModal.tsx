import React from 'react';
import { X, Trash2, Download, History, ExternalLink, FileVideo, Music } from 'lucide-react';
import { DownloadHistoryItem } from '../types';
import { triggerFileDownload } from '../utils/downloader';

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
  if (!isOpen) return null;

  const handleReDownload = (item: DownloadHistoryItem) => {
    triggerFileDownload(
      item.title,
      item.platform,
      item.quality,
      item.format as 'mp4' | 'mp3' | 'zip' | 'jpg'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#14212d] border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Riwayat Unduhan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto py-4 flex-1 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Belum ada unduhan di sesi ini.</p>
              <p className="text-xs text-slate-500 mt-1">
                Tempel link video atau lagu untuk mulai mengunduh.
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
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 shrink-0 transition-colors cursor-pointer"
                  title="Unduh Ulang"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400 font-mono">
              Total: {history.length} file
            </span>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Riwayat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
