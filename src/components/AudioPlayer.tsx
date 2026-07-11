import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  themeColor: string;
  spotifyToken: string | null;
}

interface SpotifyTrack {
  name: string;
  artist: string;
  albumName: string;
  coverArt: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
  uri: string;
}

// Track definitions
export const TRACKS = [
  { id: 'synth', name: 'Chill Synthwave', genre: 'Synthwave Radio', url: 'https://radio.loficafe.net/listen/chilling/radio.mp3' },
  { id: 'space', name: 'Deep Cosmic Drone', genre: 'Sci-Fi Ambient', url: 'https://live.lofiradio.ru/lofi_mp3_128' },
  { id: 'pulse', name: 'Quantum Pulse', genre: 'Electronic Arp', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
];

export function AudioPlayer({ themeColor, spotifyToken }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [progress, setProgress] = useState(15); // Simulated starting progress %
  
  // Real Streaming Audio Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerIntervalRef = useRef<any>(null);
  
  // Fake animated visualizer bars state
  const [bars, setBars] = useState<number[]>(new Array(16).fill(2));

  // Spotify integration state
  const [spotifyTrack, setSpotifyTrack] = useState<SpotifyTrack | null>(null);

  // Dynamic theme colors
  const getThemeHex = () => {
    switch (themeColor) {
      case 'cyan': return '#06b6d4';
      case 'pink': return '#ec4899';
      case 'emerald': return '#10b981';
      case 'amber': return '#f59e0b';
      default: return '#a855f7'; // purple
    }
  };

  // Poll Spotify playback details
  const fetchSpotifyPlayback = async () => {
    if (!spotifyToken) return;
    try {
      const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      if (res.status === 204 || res.status === 401) {
        setSpotifyTrack(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data && data.item) {
          setSpotifyTrack({
            name: data.item.name,
            artist: data.item.artists.map((a: any) => a.name).join(', '),
            albumName: data.item.album.name,
            coverArt: data.item.album.images?.[0]?.url || '',
            durationMs: data.item.duration_ms,
            progressMs: data.progress_ms,
            isPlaying: data.is_playing,
            uri: data.item.uri
          });
        } else {
          setSpotifyTrack(null);
        }
      }
    } catch (e) {
      console.debug("Failed to fetch Spotify status", e);
    }
  };

  useEffect(() => {
    if (!spotifyToken) {
      setSpotifyTrack(null);
      return;
    }
    // Initial fetch
    fetchSpotifyPlayback();
    // Poll every 3 seconds for active sync
    const interval = setInterval(fetchSpotifyPlayback, 3000);
    return () => clearInterval(interval);
  }, [spotifyToken]);

  // Stop local player if Spotify track is actively loaded
  useEffect(() => {
    if (spotifyTrack) {
      stopSynth();
      setIsPlaying(false);
    }
  }, [spotifyTrack]);

  // Local progress tick for Spotify track to keep progress bar moving smoothly
  useEffect(() => {
    if (!spotifyTrack || !spotifyTrack.isPlaying) return;
    const interval = setInterval(() => {
      setSpotifyTrack(prev => {
        if (!prev) return null;
        const nextProgress = Math.min(prev.progressMs + 1000, prev.durationMs);
        return { ...prev, progressMs: nextProgress };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [spotifyTrack?.isPlaying, spotifyTrack?.uri]);

  // Start sound synthesis (local fallback)
  const startSynth = () => {
    try {
      stopSynth();

      const track = TRACKS[currentTrackIndex];
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = track.url;
      audioRef.current.volume = volume;
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Playback failed:", err);
        });
      }
    } catch (e) {
      console.error("Audio Playback Error: ", e);
    }
  };

  const stopSynth = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startSynth();
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSynth();
      if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    };
  }, []);

  // Main playback control
  const togglePlay = () => {
    if (spotifyTrack) {
      controlSpotify(spotifyTrack.isPlaying ? 'pause' : 'play');
      return;
    }
    if (isPlaying) {
      stopSynth();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setTimeout(() => startSynth(), 50);
    }
  };

  // Skip Tracks
  const handleNext = () => {
    if (spotifyTrack) {
      controlSpotify('next');
      return;
    }
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const handlePrev = () => {
    if (spotifyTrack) {
      controlSpotify('previous');
      return;
    }
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  // Spotify Control Endpoint API Calls
  const controlSpotify = async (endpoint: 'play' | 'pause' | 'next' | 'previous') => {
    if (!spotifyToken) return;
    try {
      const method = (endpoint === 'play' || endpoint === 'pause') ? 'PUT' : 'POST';
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      // Update local state preview instantly for visual responsiveness
      if (spotifyTrack) {
        if (endpoint === 'pause') {
          setSpotifyTrack(prev => prev ? { ...prev, isPlaying: false } : null);
        } else if (endpoint === 'play') {
          setSpotifyTrack(prev => prev ? { ...prev, isPlaying: true } : null);
        }
      }
      setTimeout(fetchSpotifyPlayback, 400);
    } catch (e) {
      console.error(`Failed to control Spotify ${endpoint}:`, e);
    }
  };

  const changeSpotifyVolume = async (newVol: number) => {
    if (!spotifyToken) return;
    try {
      const volPercent = Math.round(newVol * 100);
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volPercent}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
    } catch (e) {
      console.error("Failed to set Spotify volume:", e);
    }
  };

  // Format milliseconds to M:SS
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Track progress and visualizer bar animation
  useEffect(() => {
    const active = isPlaying || (spotifyTrack !== null && spotifyTrack.isPlaying);
    if (active) {
      // Progress simulation bar (only for local lofi mode)
      let progressInterval: any = null;
      if (isPlaying) {
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) return 0;
            return prev + 1;
          });
        }, 1000);
      }

      // Visualizer EQ bars animation
      visualizerIntervalRef.current = setInterval(() => {
        setBars(prev => prev.map(() => Math.floor(Math.random() * 24) + 4));
      }, 100);

      return () => {
        if (progressInterval) clearInterval(progressInterval);
        if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
      };
    } else {
      // Flat equalizer
      setBars(new Array(16).fill(2));
    }
  }, [isPlaying, spotifyTrack?.isPlaying]);

  const spotifyProgressPercent = spotifyTrack ? (spotifyTrack.progressMs / spotifyTrack.durationMs) * 100 : 0;
  const isCurrentlyPlaying = spotifyTrack ? spotifyTrack.isPlaying : isPlaying;

  return (
    <div id="portal-radio" className="flex flex-col md:flex-row items-center justify-between w-full h-full px-4 gap-4">
      {/* Track Info (Dynamically loads Spotify Cover Art) */}
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 min-w-0">
        {spotifyTrack && spotifyTrack.coverArt ? (
          <img 
            src={spotifyTrack.coverArt} 
            alt={spotifyTrack.albumName}
            className="w-10 h-10 rounded-lg border object-cover shrink-0 select-none"
            style={{ 
              borderColor: `${getThemeHex()}50`,
              boxShadow: `0 0 12px ${getThemeHex()}35`
            }}
          />
        ) : (
          <div 
            className="relative w-10 h-10 rounded-full bg-slate-900 border flex items-center justify-center overflow-hidden shrink-0"
            style={{ borderColor: getThemeHex() + '50' }}
          >
            {/* Breathing orbit inside disc */}
            <div 
              className={`w-6 h-6 rounded-full border border-dashed animate-[spin_8s_linear_infinite] flex items-center justify-center`}
              style={{ borderColor: getThemeHex() }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getThemeHex() }} />
            </div>
            {isCurrentlyPlaying && (
              <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[1px] animate-[pulse_1.5s_infinite]" />
            )}
          </div>
        )}
        
        <div className="flex flex-col text-left min-w-0">
          <div className="text-xs font-bold text-slate-100 uppercase tracking-wider truncate max-w-[200px]">
            {spotifyTrack ? spotifyTrack.name : TRACKS[currentTrackIndex].name}
          </div>
          <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap truncate max-w-[180px]">
            {spotifyTrack ? spotifyTrack.artist : `Portal Radio • ${TRACKS[currentTrackIndex].genre}`}
          </div>
        </div>
      </div>

      {/* Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center gap-1.5 w-full md:max-w-md">
        <div className="flex items-center gap-4">
          <button 
            id="radio-prev-btn"
            onClick={handlePrev} 
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer active:scale-90"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button 
            id="radio-play-btn"
            onClick={togglePlay} 
            className="p-2.5 rounded-full bg-slate-900 border text-slate-100 hover:scale-105 active:scale-95 transition-all shadow-md relative group overflow-hidden cursor-pointer"
            style={{ borderColor: getThemeHex() }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" 
              style={{ backgroundColor: getThemeHex() }}
            />
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4 relative z-10" />
            ) : (
              <Play className="w-4 h-4 fill-slate-100 translate-x-[1px] relative z-10" />
            )}
          </button>
          
          <button 
            id="radio-next-btn"
            onClick={handleNext} 
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer active:scale-90"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Slider (Supports live Spotify milliseconds formatting) */}
        <div className="flex items-center gap-2 w-full text-[9px] font-mono text-slate-500">
          <span>{spotifyTrack ? formatTime(spotifyTrack.progressMs) : `0:${String(Math.floor(progress * 1.8)).padStart(2, '0')}`}</span>
          <div className="relative flex-1 h-1 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-300"
              style={{ 
                width: `${spotifyTrack ? spotifyProgressPercent : progress}%`,
                backgroundColor: getThemeHex(),
                boxShadow: `0 0 6px ${getThemeHex()}`
              }}
            />
          </div>
          <span>{spotifyTrack ? formatTime(spotifyTrack.durationMs) : '3:00'}</span>
        </div>
      </div>

      {/* EQ Audio Visualizer Graphic */}
      <div className="hidden md:flex items-end gap-[3px] h-7 px-3 bg-slate-950/40 border border-slate-900/60 rounded-md">
        {bars.map((height, idx) => (
          <div 
            key={idx}
            className="w-[3px] rounded-t-sm transition-all duration-100"
            style={{ 
              height: `${height}px`,
              backgroundColor: getThemeHex(),
              boxShadow: isCurrentlyPlaying ? `0 0 4px ${getThemeHex()}50` : 'none',
              opacity: isCurrentlyPlaying ? 0.85 : 0.3
            }}
          />
        ))}
      </div>

      {/* Volume Controller (Far Right) */}
      <div className="flex items-center gap-2 w-full md:w-32">
        <Volume2 className="w-3.5 h-3.5 text-slate-500" />
        <input 
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setVolume(val);
            if (spotifyTrack) {
              changeSpotifyVolume(val);
            }
          }}
          className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none"
          style={{ 
            accentColor: getThemeHex()
          }}
        />
      </div>
    </div>
  );
}
