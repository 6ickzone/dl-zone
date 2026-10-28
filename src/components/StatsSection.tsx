import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface StatsSectionProps {
  userCount?: number;
  downloadCount?: number;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  userCount = 98,
  downloadCount = 74,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    users: number;
    downloads: number;
  } | null>(null);

  // Live real-time activity ticker
  const [recentActivities, setRecentActivities] = useState([
    { location: 'Jakarta', platform: 'TikTok No Watermark (1080p)', time: '3 detik lalu' },
    { location: 'Surabaya', platform: 'YouTube MP3 320kbps', time: '18 detik lalu' },
    { location: 'Bandung', platform: 'Instagram Reels MP4', time: '42 detik lalu' },
  ]);

  useEffect(() => {
    const locations = ['Jakarta', 'Bandung', 'Medan', 'Surabaya', 'Semarang', 'Makassar', 'Denpasar', 'Yogyakarta'];
    const platforms = [
      'TikTok MP4 Tanpa Watermark',
      'YouTube Video 1080p HD',
      'Spotify MP3 320kbps HiFi',
      'Instagram Reels Original',
      'Google Drive Bypass File',
      'CapCut Template Clean'
    ];

    const interval = setInterval(() => {
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      setRecentActivities((prev) => [
        { location: loc, platform: plat, time: 'Baru saja' },
        prev[0],
        prev[1],
      ]);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="statistik" className="pt-6 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-center mb-8">
          Statistik
        </h2>

        {/* The Card matching screenshot 1:1 */}
        <div className="bg-[#131f2b] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Indicators */}
          <div className="flex items-center justify-center gap-8 sm:gap-14 mb-8">
            {/* Green: Pengguna */}
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {userCount}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  Pengguna
                </span>
              </div>
            </div>

            {/* Cyan/Blue: Download sukses */}
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-[#38bdf8] shadow-sm shadow-sky-400/50" />
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {downloadCount}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  Download sukses
                </span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart recreating the screenshot's exact curve */}
          <div className="relative w-full h-56 sm:h-64 my-2 select-none">
            {/* Grid lines and Y-axis labels */}
            <div className="absolute inset-0 flex flex-col justify-between text-[11px] text-slate-500 font-mono pointer-events-none pb-6">
              <div className="flex items-center w-full">
                <span className="w-8">200</span>
                <div className="flex-1 h-px bg-slate-800/80 ml-2" />
              </div>
              <div className="flex items-center w-full">
                <span className="w-8">150</span>
                <div className="flex-1 h-px bg-slate-800/80 ml-2" />
              </div>
              <div className="flex items-center w-full">
                <span className="w-8">100</span>
                <div className="flex-1 h-px bg-slate-800/80 ml-2" />
              </div>
              <div className="flex items-center w-full">
                <span className="w-8">50</span>
                <div className="flex-1 h-px bg-slate-800/80 ml-2" />
              </div>
              <div className="flex items-center w-full">
                <span className="w-8">0</span>
                <div className="flex-1 h-px bg-slate-800/80 ml-2" />
              </div>
            </div>

            {/* SVG SVG Drawing area */}
            <svg
              className="absolute inset-0 w-full h-full pl-10 pb-6 overflow-visible"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fills */}
              <path
                d="M 10 195 L 340 195 C 380 195 410 140 450 102 L 485 102 L 485 195 Z"
                fill="url(#userGrad)"
              />
              <path
                d="M 10 195 L 340 195 C 380 195 410 160 450 126 L 485 126 L 485 195 Z"
                fill="url(#dlGrad)"
              />

              {/* Green Line: Pengguna (Ends at ~98, y around 102) */}
              <path
                d="M 10 195 Q 200 195 340 195 C 380 195 405 130 450 102 L 485 102"
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Cyan/Blue Line: Download sukses (Ends at ~74, y around 126) */}
              <path
                d="M 10 195 Q 200 195 340 195 C 380 195 405 150 450 126 L 485 126"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* End Point Dots matching screenshot */}
              <circle cx="485" cy="102" r="4.5" fill="#34d399" className="animate-pulse" />
              <circle cx="485" cy="126" r="4.5" fill="#38bdf8" />
            </svg>

            {/* X-axis date labels matching screenshot */}
            <div className="absolute bottom-0 left-10 right-0 flex justify-between text-[11px] text-slate-500 font-mono">
              <span>27 Sep</span>
              <span>12 Okt</span>
              <span>26 Okt</span>
            </div>
          </div>

          {/* Screenshot Bottom Annotation text */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              26 Okt (hari ini): <strong className="text-emerald-400">{userCount} pengguna</strong> ·{' '}
              <strong className="text-[#38bdf8]">{downloadCount} download sukses</strong>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Dihitung sejak 23 Oktober 2026 · Garis menunjukkan total 30 hari terakhir.
            </p>
          </div>

          {/* Real-time download activity stream */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aktivitas Unduhan Terkini:</span>
            </div>
            <div className="space-y-1.5">
              {recentActivities.map((act, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px] py-1 px-2.5 rounded bg-slate-900/40 text-slate-300 font-mono"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>Pengguna di <strong>{act.location}</strong>: {act.platform}</span>
                  </span>
                  <span className="text-slate-500 shrink-0 ml-2">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
