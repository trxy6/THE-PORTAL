/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Tv, Play, Pause, SkipForward, Radio, Search, CheckCircle2 } from 'lucide-react';
import { displaySync } from '../../lib/displaySync';

interface GlassesYouTubeProps {
  onBack: () => void;
  activeItemIndex?: number;
}

const DEMO_YOUTUBE_VIDEOS = [
  { id: 'v1', title: 'Meta Ray-Ban Display & Neural Band Full Demo', channel: 'Tech Pulse', duration: '12:40', isTv: false },
  { id: 'v2', title: 'Live Sports Central - ESPN HD', channel: 'YouTube TV Live', duration: 'LIVE', isTv: true },
  { id: 'v3', title: 'PECOS AI Integration & Quantum Computing', channel: 'Portal AI Channel', duration: '08:15', isTv: false },
  { id: 'v4', title: 'NBC News NOW Live Stream', channel: 'YouTube TV Live', duration: 'LIVE', isTv: true },
  { id: 'v5', title: 'Cyberpunk Lo-Fi Chill Radio 24/7', channel: 'Cosmic Beats', duration: 'LIVE', isTv: false },
];

export default function GlassesYouTube({ onBack }: GlassesYouTubeProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [playingVideo, setPlayingVideo] = useState<typeof DEMO_YOUTUBE_VIDEOS[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Neural Band Gesture Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (playingVideo) {
        if (e.key === ' ' || e.key === 'Enter') {
          setIsPlaying((prev) => !prev);
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          setPlayingVideo(null);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : DEMO_YOUTUBE_VIDEOS.length - 1));
      } else if (e.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev < DEMO_YOUTUBE_VIDEOS.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        setPlayingVideo(DEMO_YOUTUBE_VIDEOS[selectedIndex]);
        setIsPlaying(true);
        displaySync.sendMediaToGlasses({
          type: DEMO_YOUTUBE_VIDEOS[selectedIndex].isTv ? 'youtubetv' : 'youtube',
          videoId: DEMO_YOUTUBE_VIDEOS[selectedIndex].id,
          title: DEMO_YOUTUBE_VIDEOS[selectedIndex].title,
          channelName: DEMO_YOUTUBE_VIDEOS[selectedIndex].channel,
          isPlaying: true,
        });
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, playingVideo, onBack]);

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white">YouTube & YouTube TV</span>
        </div>
        <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Phone Pre-Logged
        </span>
      </div>

      {/* Main Content Area */}
      {playingVideo ? (
        <div className="my-auto space-y-3">
          {/* Simulated Video Player */}
          <div className="relative w-full aspect-video bg-purple-950/40 border-2 border-[#8b5cf6] rounded-xl flex flex-col items-center justify-center p-4 text-center overflow-hidden shadow-[0_0_25px_rgba(139,92,246,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${playingVideo.isTv ? 'bg-rose-600 text-white' : 'bg-purple-600 text-white'}`}>
                {playingVideo.isTv ? '🔴 YOUTUBE TV LIVE' : '▶ YOUTUBE STREAM'}
              </span>
              <h3 className="text-sm font-black text-white leading-tight max-w-xs">{playingVideo.title}</h3>
              <p className="text-[10px] text-slate-300 font-medium">{playingVideo.channel}</p>
            </div>

            <div className="mt-4 flex items-center gap-3 relative z-10">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
            <span>Pinch: {isPlaying ? 'Pause' : 'Play'}</span>
            <span>Double Pinch: Return to Feed</span>
          </div>
        </div>
      ) : (
        <div className="my-auto space-y-2 py-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            <span>Select Channel / Video:</span>
            <span>Swipe ↑↓ | Pinch Select</span>
          </div>

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
            {DEMO_YOUTUBE_VIDEOS.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setPlayingVideo(item);
                  }}
                  className={`p-3 rounded-xl bg-black border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#8b5cf6] bg-purple-950/20 shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-[#8b5cf6]'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.isTv ? 'bg-rose-950/60 border border-rose-500/40 text-rose-400' : 'bg-purple-950/60 border border-purple-500/40 text-purple-400'}`}>
                      {item.isTv ? <Radio className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{item.channel}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono font-bold shrink-0 ${item.isTv ? 'text-rose-400' : 'text-slate-400'}`}>
                    {item.duration}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="border-t border-purple-500/30 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <button onClick={onBack} className="hover:text-white cursor-pointer">← Back to HUD</button>
        <span className="text-[#8b5cf6]">Meta Display Tube Engine</span>
      </div>
    </div>
  );
}
