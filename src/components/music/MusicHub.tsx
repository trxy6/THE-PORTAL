/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Plus,
  Search,
  Music,
  Heart,
  ListMusic,
  Trash2,
  Sparkles,
  Link2,
  Disc,
  Info
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  url: string;
  duration: string;
  genre: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
}

interface MusicHubProps {
  portalDarkMode: boolean;
  themeColor: string;
}

// Ultra-premium built-in royalty-free audio streams
const CURATED_TRACKS: Track[] = [
  {
    id: "lumina-chill",
    title: "Lumina Chillwave",
    artist: "Aether Pilot",
    album: "Atmospheric Pulse",
    imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "6:12",
    genre: "Chillwave"
  },
  {
    id: "midnight-drive",
    title: "Midnight Drive",
    artist: "Synth Runner",
    album: "Neon Horizons",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "7:05",
    genre: "Synthwave"
  },
  {
    id: "aether-flow",
    title: "Aether Flow",
    artist: "Solaris",
    album: "Solar Wind",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "5:44",
    genre: "Lofi Ambient"
  },
  {
    id: "nebula-dream",
    title: "Nebula Dream",
    artist: "Lofi Dreamer",
    album: "Cozy Space Beats",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: "5:02",
    genre: "Lofi Hip Hop"
  },
  {
    id: "cosmic-horizon",
    title: "Cosmic Horizon",
    artist: "Aura Ambient",
    album: "Nebular Waves",
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    duration: "6:03",
    genre: "Ambient"
  }
];

export default function MusicHub({ portalDarkMode, themeColor }: MusicHubProps) {
  // Audio state
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("portal_music_custom_tracks");
    if (saved) {
      try {
        return [...CURATED_TRACKS, ...JSON.parse(saved)];
      } catch (e) {
        return CURATED_TRACKS;
      }
    }
    return CURATED_TRACKS;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("portal_music_playlists");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: "all-songs",
        name: "All Songs",
        description: "Your entire music library",
        tracks: CURATED_TRACKS
      }
    ];
  });

  const [activePlaylistId, setActivePlaylistId] = useState<string>("all-songs");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(CURATED_TRACKS[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(60);
  const [prevVolume, setPrevVolume] = useState<number>(60);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(372); // Default to track 1 duration
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLiked, setIsLiked] = useState<boolean>(false);

  // New item inputs
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [customTrackUrl, setCustomTrackUrl] = useState<string>("");
  const [customTrackTitle, setCustomTrackTitle] = useState<string>("");
  const [customTrackArtist, setCustomTrackArtist] = useState<string>("");
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Get matching theme color variables
  const themeHex = useMemo(() => {
    switch (themeColor) {
      case "cyan": return "#06b6d4";
      case "pink": return "#ec4899";
      case "emerald": return "#10b981";
      case "amber": return "#f59e0b";
      case "purple":
      default:
        return "#8b5cf6";
    }
  }, [themeColor]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Load custom tracks into main playlist
  useEffect(() => {
    const custom = tracks.filter(t => !CURATED_TRACKS.some(c => c.id === t.id));
    localStorage.setItem("portal_music_custom_tracks", JSON.stringify(custom));

    // Keep "All Songs" playlist updated
    setPlaylists(prev => prev.map(p => {
      if (p.id === "all-songs") {
        return { ...p, tracks };
      }
      return p;
    }));
  }, [tracks]);

  // Persist playlists
  useEffect(() => {
    localStorage.setItem("portal_music_playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Selected playlist tracks
  const activePlaylist = useMemo(() => {
    if (activePlaylistId === "all-songs") {
      return {
        id: "all-songs",
        name: "All Songs",
        description: "Your entire music library",
        tracks
      };
    }
    return playlists.find(p => p.id === activePlaylistId) || {
      id: "all-songs",
      name: "All Songs",
      description: "Your entire music library",
      tracks
    };
  }, [activePlaylistId, playlists, tracks]);

  // Filtered tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return activePlaylist.tracks;
    const q = searchQuery.toLowerCase();
    return activePlaylist.tracks.filter(
      t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }, [activePlaylist.tracks, searchQuery]);

  // Playback control functions
  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handlePlayToggle = () => {
    if (!currentTrack) return;
    if (audioRef.current) {
      // If the audio element has no source loaded yet, load currentTrack url
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        audioRef.current.src = currentTrack.url;
        audioRef.current.load();
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.error("Playback toggle failed:", e);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleSkipForward = () => {
    if (!currentTrack || activePlaylist.tracks.length === 0) return;
    const currentIndex = activePlaylist.tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < activePlaylist.tracks.length - 1) {
      handlePlayTrack(activePlaylist.tracks[currentIndex + 1]);
    } else {
      handlePlayTrack(activePlaylist.tracks[0]); // Loop to beginning
    }
  };

  const handleSkipBackward = () => {
    if (!currentTrack || activePlaylist.tracks.length === 0) return;
    const currentIndex = activePlaylist.tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      handlePlayTrack(activePlaylist.tracks[currentIndex - 1]);
    } else {
      handlePlayTrack(activePlaylist.tracks[activePlaylist.tracks.length - 1]); // Loop to end
    }
  };

  const handleSeekChange = (value: number) => {
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const handleVolumeToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 60);
    }
  };

  // Create new custom playlist
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName,
      description: "Custom user playlist",
      tracks: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setNewPlaylistName("");
  };

  // Add song to playlist
  const handleAddSongToPlaylist = (track: Track, playlistId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.tracks.some(t => t.id === track.id)) return p;
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    }));
  };

  // Delete playlist
  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === "all-songs") return;
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (activePlaylistId === id) {
      setActivePlaylistId("all-songs");
    }
  };

  // Add custom URL stream track
  const handleAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTrackUrl.trim() || !customTrackTitle.trim()) return;

    const newTrack: Track = {
      id: `custom-${Date.now()}`,
      title: customTrackTitle,
      artist: customTrackArtist.trim() || "Independent Creator",
      album: "Local Upload",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
      url: customTrackUrl,
      duration: "Stream",
      genre: "Streaming Audio"
    };

    setTracks(prev => [...prev, newTrack]);
    setCustomTrackUrl("");
    setCustomTrackTitle("");
    setCustomTrackArtist("");
  };

  // Audio elements handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 180);
    }
  };

  // Canvas Realtime Equalizer Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const barCount = 20;
    const barWidth = canvas.width / barCount - 2;
    const barsArray: { x: number; height: number; targetHeight: number; speed: number }[] = [];

    for (let i = 0; i < barCount; i++) {
      barsArray.push({
        x: i * (barWidth + 2),
        height: 2,
        targetHeight: 2,
        speed: 0.15 + Math.random() * 0.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      barsArray.forEach((bar, index) => {
        if (isPlaying) {
          // React dynamically to mock frequencies with randomized peaks
          const peak = Math.sin(Date.now() * 0.005 + index) * 0.5 + 0.5;
          bar.targetHeight = peak * (canvas.height - 10) + 5;
        } else {
          bar.targetHeight = 3;
        }

        // Interpolate height for buttery smooth movements
        bar.height += (bar.targetHeight - bar.height) * bar.speed;

        // Draw visualizer bar gradients
        const gradient = ctx.createLinearGradient(bar.x, canvas.height - bar.height, bar.x, canvas.height);
        gradient.addColorStop(0, themeHex);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.05)");

        ctx.fillStyle = gradient;
        
        // Draw round bars
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bar.x, canvas.height - bar.height, barWidth, bar.height, [barWidth / 2, barWidth / 2, 0, 0]);
        } else {
          ctx.rect(bar.x, canvas.height - bar.height, barWidth, bar.height);
        }
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, themeHex]);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div
      id="portal-music-hub"
      className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#04020a]/80 text-[#e2d9f3] rounded-2xl border border-white/[0.04] p-6 backdrop-blur-xl animate-[fadeIn_0.5s_ease-out]"
      style={{
        "--theme-glow": `${themeHex}66`,
        "--theme-accent": themeHex
      } as React.CSSProperties}
    >
      {/* LEFT COLUMN: Library & Playlists */}
      <div className="lg:col-span-3 flex flex-col gap-6 h-[600px]">
        {/* Playlists card */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex flex-col gap-4 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ListMusic className="w-4 h-4 text-[var(--theme-accent)]" />
              Library Hub
            </h3>
          </div>

          {/* Playlist list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {/* All Songs Static Selection */}
            <button
              onClick={() => setActivePlaylistId("all-songs")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activePlaylistId === "all-songs"
                  ? "bg-[var(--theme-accent)] text-white shadow-[0_0_15px_var(--theme-glow)]"
                  : "bg-white/[0.02] hover:bg-white/5 text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>All Tracks</span>
              </div>
              <span className="opacity-70">{tracks.length}</span>
            </button>

            {/* Custom Playlists */}
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setActivePlaylistId(pl.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${
                  activePlaylistId === pl.id
                    ? "bg-[var(--theme-accent)] text-white shadow-[0_0_15px_var(--theme-glow)]"
                    : "bg-white/[0.02] hover:bg-white/5 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <ListMusic className="w-4 h-4 shrink-0" />
                  <span className="truncate">{pl.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="opacity-70 group-hover:hidden">{pl.tracks.length}</span>
                  <button
                    onClick={(e) => handleDeletePlaylist(pl.id, e)}
                    className="p-1 hover:bg-black/20 rounded hidden group-hover:block transition"
                    title="Delete Playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))}
          </div>

          {/* Create new playlist form */}
          <form onSubmit={handleCreatePlaylist} className="mt-auto border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New Playlist Name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-accent)] transition text-white"
              />
              <button
                type="submit"
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-[var(--theme-accent)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CENTER COLUMN: Spin Vinyl & Player Controls */}
      <div className="lg:col-span-5 flex flex-col gap-6 items-center justify-between h-[600px] bg-white/[0.01] border border-white/[0.03] rounded-3xl p-6 relative overflow-hidden">
        {/* Top Now Playing header */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Immersive Audio</span>
          </div>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition ${
              isLiked ? "text-[var(--theme-accent)]" : "text-zinc-400"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-[var(--theme-accent)]" : ""}`} />
          </button>
        </div>

        {/* Dynamic Spinning Vinyl Disc */}
        <div className="relative my-auto flex items-center justify-center group z-10">
          <div
            className={`w-64 h-64 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative transition-transform duration-[4000ms] ease-linear ${
              isPlaying ? "animate-[spin_10s_linear_infinite]" : "rotate-12"
            }`}
          >
            {/* Grooves */}
            <div className="absolute inset-2 rounded-full border border-white/[0.04] pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-white/[0.03] pointer-events-none" />
            <div className="absolute inset-10 rounded-full border border-white/[0.03] pointer-events-none" />
            <div className="absolute inset-14 rounded-full border border-white/[0.03] pointer-events-none" />
            <div className="absolute inset-20 rounded-full border border-white/[0.02] pointer-events-none" />

            {/* Glowing theme center album art ring */}
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-900 transition-all duration-300 group-hover:scale-105"
              style={{
                boxShadow: `0 0 25px var(--theme-glow)`
              }}
            >
              {currentTrack ? (
                <img
                  src={currentTrack.imageUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                  <Disc className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Middle hole */}
            <div className="absolute w-6 h-6 rounded-full bg-[#04020a] border-2 border-zinc-950" />
          </div>

          {/* Vinyl Arm indicator */}
          <div
            className="absolute top-0 right-0 w-24 h-24 origin-top-left transition-all duration-[800ms] pointer-events-none"
            style={{
              transform: isPlaying ? "rotate(15deg) translate(20px, -5px)" : "rotate(-12deg) translate(5px, -15px)"
            }}
          >
            <div className="w-1.5 h-16 bg-zinc-600 rounded-full shadow absolute top-0 left-0" />
            <div className="w-4 h-4 bg-zinc-400 rounded border border-zinc-500 shadow absolute top-16 -left-1" />
          </div>
        </div>

        {/* Current track information */}
        <div className="text-center z-10 w-full">
          {currentTrack ? (
            <>
              <h2 className="text-lg font-bold text-white tracking-wide truncate">{currentTrack.title}</h2>
              <p className="text-sm text-zinc-400 mt-1 font-medium truncate">{currentTrack.artist}</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-zinc-500 italic">No Song Loaded</h2>
              <p className="text-sm text-zinc-600 mt-1">Select a track from the library</p>
            </>
          )}
        </div>

        {/* Playback Progress Slider */}
        <div className="w-full flex flex-col gap-1 z-10">
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] text-zinc-500 tabular-nums w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeekChange(parseFloat(e.target.value))}
              disabled={!currentTrack}
              className="flex-1 h-[3px] bg-white/10 appearance-none rounded-full cursor-pointer focus:outline-none accent-[var(--theme-accent)]"
            />
            <span className="text-[10px] text-zinc-500 tabular-nums w-8 text-left">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Controls Hub */}
        <div className="flex items-center justify-between w-full z-10 pt-2 border-t border-white/5">
          {/* Mute/Volume slider */}
          <div className="flex items-center gap-2 w-28">
            <button
              onClick={handleVolumeToggle}
              className="text-zinc-400 hover:text-white transition p-1"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="flex-1 h-[2px] bg-white/10 appearance-none rounded-full cursor-pointer accent-[var(--theme-accent)]"
            />
          </div>

          {/* Main playback skip buttons */}
          <div className="flex items-center gap-6">
            <button
              onClick={handleSkipBackward}
              disabled={!currentTrack}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-white disabled:opacity-20 disabled:pointer-events-none"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={handlePlayToggle}
              disabled={!currentTrack}
              className="w-14 h-14 bg-[var(--theme-accent)] hover:scale-105 text-white flex items-center justify-center rounded-full transition shadow-[0_0_20px_var(--theme-glow)] cursor-pointer"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
            </button>
            <button
              onClick={handleSkipForward}
              disabled={!currentTrack}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-white disabled:opacity-20 disabled:pointer-events-none"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Custom Genre pill */}
          <div className="text-[10px] uppercase font-bold text-zinc-500 border border-white/10 rounded-full px-2.5 py-1 tracking-wider bg-white/[0.02]">
            {currentTrack?.genre || "Lofi Beats"}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Tracks Index & Custom Links */}
      <div className="lg:col-span-4 flex flex-col gap-6 h-[600px]">
        {/* Tracks List Card */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {activePlaylist.name} Index
            </h3>
            {/* Search Input */}
            <div className="relative w-36">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-8 pr-2 py-1 text-xs focus:outline-none focus:border-[var(--theme-accent)] transition text-white"
              />
            </div>
          </div>

          {/* Tracks list */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {filteredTracks.map((t, idx) => (
              <div
                key={t.id}
                onClick={() => handlePlayTrack(t)}
                className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition cursor-pointer group ${
                  currentTrack?.id === t.id
                    ? "bg-white/[0.05] border border-[var(--theme-accent)]/20"
                    : "hover:bg-white/[0.02] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded overflow-hidden bg-white/5 shrink-0 flex items-center justify-center text-zinc-600 relative">
                    <img
                      src={t.imageUrl}
                      alt={t.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {currentTrack?.id === t.id && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[var(--theme-accent)]">
                        <Disc className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <p className={`font-semibold truncate ${currentTrack?.id === t.id ? "text-[var(--theme-accent)]" : "text-white"}`}>
                      {t.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{t.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 tabular-nums">{t.duration}</span>
                  {/* Playlist add buttons */}
                  {activePlaylistId === "all-songs" && playlists.length > 0 && (
                    <div className="opacity-0 group-hover:opacity-100 transition relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddSongToPlaylist(t, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none"
                      >
                        <option value="">Add to...</option>
                        {playlists.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredTracks.length === 0 && (
              <div className="text-zinc-600 text-center italic py-8 text-xs">
                No songs match search
              </div>
            )}
          </div>

          {/* Equalizer canvas */}
          <div className="h-16 shrink-0 border-t border-white/5 pt-2 flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">Live Frequency Bars</span>
            <canvas ref={canvasRef} className="w-full h-full bg-white/[0.01] rounded-lg" />
          </div>
        </div>

        {/* Paste Audio Stream link form */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Link2 className="w-4 h-4 text-[var(--theme-accent)]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Paste External Stream</h4>
          </div>

          <form onSubmit={handleAddCustomTrack} className="flex flex-col gap-2">
            <input
              type="url"
              placeholder="Direct MP3 Audio URL..."
              value={customTrackUrl}
              onChange={(e) => setCustomTrackUrl(e.target.value)}
              className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-accent)] transition text-white"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Song Title..."
                value={customTrackTitle}
                onChange={(e) => setCustomTrackTitle(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-accent)] transition text-white"
                required
              />
              <input
                type="text"
                placeholder="Artist..."
                value={customTrackArtist}
                onChange={(e) => setCustomTrackArtist(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-accent)] transition text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-white/5 hover:bg-white/10 hover:text-[var(--theme-accent)] border border-white/10 rounded-xl text-xs transition font-semibold cursor-pointer"
            >
              Add Track to Library
            </button>
          </form>
        </div>
      </div>

      {/* Hidden standard Audio Tag */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSkipForward}
      />
    </div>
  );
}
