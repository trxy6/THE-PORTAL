/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Music, Sparkles, Loader2 } from "lucide-react";

interface LyricLine {
  time: string; // "M:SS" or "MM:SS"
  text: string;
}

interface LyricsDisplayProps {
  title: string;
  artist: string;
  currentTime: number; // in seconds
  isPlaying: boolean;
}

// Convert "M:SS" timestamp to total seconds
function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return 0;
  const minutes = parseInt(parts[0], 10) || 0;
  const seconds = parseInt(parts[1], 10) || 0;
  return minutes * 60 + seconds;
}

export default function LyricsDisplay({
  title,
  artist,
  currentTime,
  isPlaying,
}: LyricsDisplayProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackKey, setCurrentTrackKey] = useState<string>("");
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const trackKey = `${title}-${artist}`;

  // Reset or fetch lyrics when track changes
  useEffect(() => {
    if (!title || !artist) {
      setLyrics([]);
      return;
    }

    if (trackKey === currentTrackKey) return;

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/lyrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, artist }),
        });
        if (!res.ok) throw new Error("Could not load lyrics");
        const data = await res.json();
        if (data && data.lyrics) {
          setLyrics(data.lyrics);
          setCurrentTrackKey(trackKey);
        } else {
          throw new Error("Invalid lyrics format");
        }
      } catch (err: any) {
        console.error(err);
        setError("Could not load synced lyrics. Tap to retry.");
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [title, artist, trackKey, currentTrackKey]);

  // Find the currently active lyric line
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    const lineTime = parseTimeToSeconds(lyrics[i].time);
    if (currentTime >= lineTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth scroll active line into view
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && isPlaying) {
      const activeEl = activeLineRef.current;
      const containerEl = containerRef.current;

      const activeOffsetTop = activeEl.offsetTop;
      const activeHeight = activeEl.offsetHeight;
      const containerHeight = containerEl.offsetHeight;

      containerEl.scrollTo({
        top: activeOffsetTop - containerHeight / 2 + activeHeight / 2,
        behavior: "smooth",
      });
    }
  }, [activeIndex, isPlaying]);

  if (!title) {
    return (
      <div id="lyrics-empty" className="h-full flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
        <Music className="w-10 h-10 mb-3 text-zinc-600 animate-pulse" />
        <p className="text-sm">Select a song and play to view scrolling synced lyrics.</p>
      </div>
    );
  }

  return (
    <div id="lyrics-container-box" className="h-full flex flex-col bg-[#050505]/60 rounded-xl border border-white/5 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#050505]/40">
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">Live Synced Lyrics</h3>
          <p className="text-sm font-medium text-white truncate max-w-[200px]">{title}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#c5a059] bg-[#c5a059]/10 px-2.5 py-1 rounded-full border border-[#c5a059]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Synced</span>
        </div>
      </div>

      {/* Lyrics Body */}
      <div
        id="lyrics-scroll-body"
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-12 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scroll-smooth"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#c5a059] mb-2" />
            <p className="text-xs tracking-wider font-medium text-zinc-500">Curating Lyrics via Gemini...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 py-12">
            <p className="text-sm mb-3 text-zinc-500">{error}</p>
            <button
              id="retry-lyrics-btn"
              onClick={() => {
                setCurrentTrackKey("");
              }}
              className="text-xs font-semibold text-[#c5a059] hover:text-[#c5a059]/80 transition"
            >
              Retry Connection
            </button>
          </div>
        ) : lyrics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
            <p className="text-sm">No lyrics available for this song yet.</p>
          </div>
        ) : (
          lyrics.map((line, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <div
                key={index}
                ref={isActive ? activeLineRef : null}
                className={`transition-all duration-500 transform py-1 flex items-start gap-4 cursor-pointer rounded-lg px-2 hover:bg-white/5 ${
                  isActive
                    ? "text-white text-lg font-bold scale-[1.02] translate-x-1"
                    : isPast
                    ? "text-zinc-600 text-sm font-medium opacity-65"
                    : "text-zinc-400 text-sm font-medium opacity-85"
                }`}
              >
                <span className={`font-mono text-xs mt-1 shrink-0 ${isActive ? "text-[#c5a059]" : "text-zinc-600"}`}>
                  {line.time}
                </span>
                <p className="leading-relaxed select-none">{line.text}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Mini Visualizer strip at bottom */}
      <div className="h-1 bg-white/5 w-full relative">
        <div
          className="absolute h-full bg-[#c5a059] transition-all duration-300"
          style={{
            width: `${lyrics.length > 0 ? (Math.max(0, activeIndex) / lyrics.length) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}
