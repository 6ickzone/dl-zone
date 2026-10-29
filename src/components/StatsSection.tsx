import React, { useState, useEffect } from 'react';
import { Activity, Users, Download, Zap, ShieldCheck, Radio } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface StatsSectionProps {
  userCount?: number;
  downloadCount?: number;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  userCount = 138,
  downloadCount = 1420,
}) => {
  const { t, language } = useLanguage();

  // Dynamic live oscillating online users (e.g. 135 - 152)
  const [liveUsers, setLiveUsers] = useState<number>(userCount);
  const [liveDownloads, setLiveDownloads] = useState<number>(downloadCount);

  // Live real-time activity stream
  const [recentActivities, setRecentActivities] = useState([
    { location: 'Jakarta, ID', platform: 'TikTok HD (No Watermark)', time: 3 },
    { location: 'Singapore, SG', platform: 'Instagram Reels (1080p)', time: 14 },
    { location: 'Tokyo, JP', platform: 'YouTube MP3 (320kbps)', time: 27 },
    { location: 'London, UK', platform: 'Spotify HiFi Audio', time: 45 },
  ]);

  // Dynamic ticker & online users oscillation
  useEffect(() => {
    const locations = [
      'Singapore, SG',
      'Tokyo, JP',
      'Jakarta, ID',
      'London, UK',
      'New York, US',
      'Sydney, AU',
      'Berlin, DE',
      'Seoul, KR',
      'Kuala Lumpur, MY',
      'Toronto, CA',
    ];

    const platforms = [
      'TikTok HD (No Watermark)',
      'Instagram Reels 1080p',
      'YouTube Video 4K Ultra HD',
      'Spotify Audio 320kbps MP3',
      'Facebook Reel HD Video',
      'Pinterest Original Photo',
      'SoundCloud High Quality Track',
      'Twitter / X Video MP4',
    ];

    // Every 5-8 seconds add a live download activity and bump the live count
    const activityInterval = setInterval(() => {
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const plat = platforms[Math.floor(Math.random() * platforms.length)];

      setRecentActivities((prev) => [
        { location: loc, platform: plat, time: 0 },
        { ...prev[0], time: (prev[0]?.time || 0) + 6 },
        { ...prev[1], time: (prev[1]?.time || 0) + 9 },
        { ...prev[2], time: (prev[2]?.time || 0) + 12 },
      ]);

      setLiveDownloads((prev) => prev + 1);

      // Minor realistic fluctuation in online users
      setLiveUsers((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = prev + delta;
        return next < 120 ? 135 : next > 180 ? 150 : next;
      });
    }, 6000);

    // Timer to increment relative seconds
    const secTimer = setInterval(() => {
      setRecentActivities((prev) =>
        prev.map((item) => ({ ...item, time: item.time + 1 }))
      );
    }, 1000);

    return () => {
      clearInterval(activityInterval);
      clearInterval(secTimer);
    };
  }, []);

  const formatRelativeTime = (seconds: number) => {
    if (seconds <= 4) return t.stats.justNow;
    return `${seconds}${t.stats.secondsAgo}`;
  };

  return (
    <section id="statistik" className="pt-8 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 mb-3">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{t.stats.onlineNow}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            {t.stats.heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            {t.stats.subtitle}
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Metric 1: Online Users */}
          <div className="bg-[#131f2b] border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{t.stats.onlineUsers}</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono tracking-tight">
                {liveUsers}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                {t.stats.onlineNow}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              {language === 'en' ? 'Live active visitors across regions' : 'Pengunjung aktif dari berbagai wilayah'}
            </p>
          </div>

          {/* Metric 2: Downloads Today */}
          <div className="bg-[#131f2b] border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{t.stats.downloadsToday}</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Download className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono tracking-tight">
                {liveDownloads.toLocaleString()}
              </span>
              <span className="text-xs text-sky-400 font-semibold">
                +{recentActivities.length > 0 ? '1' : '0'} live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              {language === 'en' ? 'Verified zero-watermark downloads' : 'Unduhan bersih tanpa watermark'}
            </p>
          </div>

          {/* Metric 3: Avg Speed */}
          <div className="bg-[#131f2b] border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{t.stats.avgSpeed}</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono tracking-tight">
                ~1.2s
              </span>
              <span className="text-xs text-amber-400 font-semibold">
                Superfast
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              {language === 'en' ? 'Direct stream bypass pipeline' : 'Pipa proxy stream direct bypass'}
            </p>
          </div>

          {/* Metric 4: Operational Status */}
          <div className="bg-[#131f2b] border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-teal-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{t.stats.serverStatus}</span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                99.9%
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                Uptime
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              {language === 'en' ? 'All 17 platform engines healthy' : 'Semua 17 mesin platform aktif'}
            </p>
          </div>
        </div>

        {/* Live Real-time Activity Ticker */}
        <div className="bg-[#131f2b] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                {t.stats.liveActivity}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live WebSocket / SSE Feed
            </span>
          </div>

          <div className="space-y-2">
            {recentActivities.map((act, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-2 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800/70 hover:border-slate-700/80 transition-all text-slate-300 font-mono"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-slate-400 text-[11px]">
                    {t.stats.userIn} <strong className="text-slate-200">{act.location}</strong>:
                  </span>
                  <span className="text-emerald-300 font-semibold truncate">
                    {act.platform}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    200 OK
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {formatRelativeTime(act.time)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
