/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Sparkles, 
  Play, 
  Plus, 
  Disc, 
  Clock, 
  Music4, 
  TrendingUp,
  Cpu,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Track, Playlist } from "./types";

interface PlayerDashboardProps {
  activePlaylist: Playlist | null;
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
  onAddToPlaylist: (track: Track, playlistId: string) => void;
  userPlaylists: Playlist[];
  activeTab: "explore" | "curator";
  onCuratedPlaylistSelect: (tracks: Track[], name: string, desc: string) => void;
  
  // Spotify integration
  spotifyToken: string | null;
}

export default function PlayerDashboard({
  activePlaylist,
  currentTrack,
  onPlayTrack,
  onAddToPlaylist,
  userPlaylists,
  activeTab,
  onCuratedPlaylistSelect,
  spotifyToken,
}: PlayerDashboardProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // AI Curation state
  const [moodInput, setMoodInput] = useState("");
  const [curatorLoading, setCuratorLoading] = useState(false);
  const [curatorStep, setCuratorStep] = useState(0);
  const [curatedAiPlaylist, setCuratedAiPlaylist] = useState<Playlist | null>(null);

  // Track menus
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Suggested search tags
  const POPULAR_SEARCHES = ["Chill Lofi", "Synthwave", "Taylor Swift", "After Hours", "Hans Zimmer", "Classical Study"];

  // Suggested AI Mood tags
  const AI_MOODS = [
    { text: "Cyberpunk neon drive beats", icon: "🚗" },
    { text: "Late night coding in heavy rain", icon: "🌧️" },
    { text: "Upbeat coffeehouse acoustic jam", icon: "☕" },
    { text: "Deep concentration space ambient", icon: "🚀" },
  ];

  // Progressive curator logs for premium loading feel
  const CURATOR_LOGS = [
    "Spinning up server-side Gemini engine...",
    "Querying global web indexes for trending Spotify links...",
    "Evaluating track acoustic profiles and matching bpm...",
    "Validating secure Spotify embed proxy paths...",
    "Finalizing custom artwork and tracking playlist...",
  ];

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);

    if (spotifyToken) {
      try {
        const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=20`, {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        });
        if (!res.ok) {
          throw new Error(`Spotify search returned status ${res.status}`);
        }
        const data = await res.json();
        if (data && data.tracks && data.tracks.items) {
          const mappedTracks = data.tracks.items.map((item: any) => {
            const durationMinSec = item.duration_ms
              ? `${Math.floor(item.duration_ms / 60000)}:${String(Math.floor((item.duration_ms % 60000) / 1000)).padStart(2, '0')}`
              : "3:00";
            return {
              id: item.id,
              title: item.name,
              artist: item.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
              album: item.album?.name || "Single",
              spotifyId: item.id,
              spotifyUri: item.uri || `spotify:track:${item.id}`,
              imageUrl: item.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
              duration: durationMinSec,
            };
          });
          setSearchResults(mappedTracks);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        console.error("Spotify Search failed, falling back to server:", err);
        await fetchServerSearch();
      } finally {
        setSearching(false);
      }
      return;
    }

    await fetchServerSearch();
  };

  const fetchServerSearch = async () => {
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data && data.tracks) {
        setSearchResults(data.tracks);
      } else {
        throw new Error("Invalid search data returned");
      }
    } catch (err: any) {
      console.error(err);
      setSearchError("Failed to fetch tracks. Falling back to local index.");
    } finally {
      setSearching(false);
    }
  };

  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
    // Submit search programmatically
    setTimeout(() => {
      const button = document.getElementById("search-submit-btn");
      if (button) button.click();
    }, 50);
  };

  const handleCuratorSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalMood = moodInput.trim();
    if (!finalMood) return;

    setCuratorLoading(true);
    setCuratedAiPlaylist(null);
    setCuratorStep(0);

    // Simulated log incrementer
    const timer = setInterval(() => {
      setCuratorStep((prev) => {
        if (prev < CURATOR_LOGS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1800);

    try {
      const res = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: finalMood }),
      });
      clearInterval(timer);

      if (!res.ok) throw new Error("Curator failed");
      const data = await res.json();
      if (data && data.playlist) {
        setCuratedAiPlaylist(data.playlist);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCuratorLoading(false);
    }
  };

  const toggleTrackMenu = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMenuTrackId === trackId) {
      setActiveMenuTrackId(null);
    } else {
      setActiveMenuTrackId(trackId);
    }
  };

  const handleAddToPlaylistAction = (track: Track, playlistId: string) => {
    onAddToPlaylist(track, playlistId);
    setActiveMenuTrackId(null);
  };

  return (
    <div id="player-dashboard-root" className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-[#121212] to-[#050505] text-[#e0dcd0] p-4 md:p-8 overflow-y-auto relative scrollbar-thin">
      {/* Atmospheric Background Glow Element */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#c5a059]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        {activeTab === "explore" ? (
          /* ================= EXPLORE / SEARCH TAB ================= */
          <motion.div
            key="explore-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-5xl mx-auto w-full relative z-10"
          >
            {/* Header / Intro */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif italic tracking-tight text-[#c5a059]">Music Discovery</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Search live database coordinates or explore pre-curated music sectors.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-zinc-400 text-xs">
                <Compass className="w-4 h-4 text-[#c5a059]" />
                <span>Web-Proxy Active</span>
              </div>
            </div>

            {/* Smart Search Bar */}
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="What do you want to play? Search tracks, artists, albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#050505] border border-white/5 focus:border-[#c5a059] text-sm text-[#e0dcd0] rounded-xl pl-12 pr-28 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#c5a059]/10 placeholder-zinc-500 transition duration-300"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 stroke-[2]" />
                <button
                  id="search-submit-btn"
                  type="submit"
                  disabled={searching}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#c5a059] hover:bg-[#c5a059]/90 disabled:opacity-50 text-black font-semibold text-xs px-4 py-2 rounded-lg transition duration-200 shadow-md"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Quick Suggestion Tags */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider font-mono mr-1">Trending:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handlePopularSearchClick(term)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-[#e0dcd0] border border-white/5 px-3 py-1 rounded-full transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>

            {/* Dynamic Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 font-serif italic text-[#c5a059]">
                    <TrendingUp className="w-4 h-4 text-[#c5a059] animate-pulse" />
                    Web Search Results
                  </h3>
                  <button
                    id="clear-results-btn"
                    onClick={() => setSearchResults([])}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                  >
                    Clear Results
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.map((track) => {
                    const isCurrent = currentTrack?.spotifyId === track.spotifyId;
                    return (
                      <div
                        key={track.id}
                        onClick={() => onPlayTrack(track)}
                        className={`group p-3 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 ${
                          isCurrent
                            ? "bg-[#c5a059]/10 border-[#c5a059]/50"
                            : "bg-[#080808]/40 border-white/5 hover:bg-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                            {track.imageUrl ? (
                              <img src={track.imageUrl} alt={track.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                <Music4 className="w-5 h-5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                              <Play className="w-5 h-5 text-[#c5a059] fill-[#c5a059]" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isCurrent ? "text-[#c5a059]" : "text-white"}`}>
                              {track.title}
                            </p>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{track.artist}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-zinc-600 font-mono hidden sm:inline-block mr-1">
                            {track.duration || "--:--"}
                          </span>
                          {/* Menu Trigger */}
                          <div className="relative">
                            <button
                              id={`track-menu-trigger-${track.id}`}
                              onClick={(e) => toggleTrackMenu(track.id, e)}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {activeMenuTrackId === track.id && (
                              <div className="absolute right-0 bottom-full mb-1 w-48 bg-[#080808] border border-white/5 rounded-lg shadow-xl z-50 p-1">
                                <p className="text-[10px] font-bold text-[#c5a059] uppercase tracking-widest px-2.5 py-1.5 border-b border-white/5">
                                  Add to Playlist
                                </p>
                                {userPlaylists.length === 0 ? (
                                  <p className="text-[10px] text-zinc-500 italic p-2">Create custom playlist first</p>
                                ) : (
                                  userPlaylists.map((pl) => (
                                    <button
                                      key={pl.id}
                                      onClick={() => handleAddToPlaylistAction(track, pl.id)}
                                      className="w-full text-left text-xs text-zinc-300 hover:text-[#c5a059] hover:bg-white/5 px-2.5 py-2 rounded transition truncate"
                                    >
                                      {pl.name}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main active playlist section */}
            {activePlaylist && (
              <div className="space-y-4 pt-4">
                <div className="p-6 rounded-2xl bg-[#080808]/60 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#c5a059]/5 blur-[80px] rounded-full pointer-events-none"></div>
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#c5a059]/10 flex items-center justify-center border border-[#c5a059]/20 shadow-inner">
                      <Disc className="w-10 h-10 text-[#c5a059] animate-spin" style={{ animationDuration: "12s" }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#c5a059] bg-[#c5a059]/10 px-2.5 py-0.5 rounded-full border border-[#c5a059]/20">
                        {activePlaylist.isCustom ? "Custom Playlist" : "Global Vibe"}
                      </span>
                      <h3 className="text-xl md:text-2xl font-serif italic text-white mt-1.5">{activePlaylist.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{activePlaylist.description || "Fresh selected hits for you."}</p>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-zinc-500 px-4 py-2 bg-[#050505] rounded-lg border border-white/5 relative z-10">
                    <span>Tracks count: {activePlaylist.tracks.length}</span>
                  </div>
                </div>

                {/* Tracks Table */}
                <div className="bg-[#080808]/40 rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center text-xs font-bold text-zinc-500 uppercase tracking-widest bg-white/[0.02]">
                    <span className="w-10 text-center">#</span>
                    <span className="flex-1">Title</span>
                    <span className="w-28 hidden sm:block">Album</span>
                    <span className="w-14 text-center">
                      <Clock className="w-4 h-4 mx-auto text-zinc-600" />
                    </span>
                    <span className="w-10" />
                  </div>

                  <div className="divide-y divide-white/5">
                    {activePlaylist.tracks.length === 0 ? (
                      <div className="p-8 text-center text-zinc-600 text-xs italic">
                        No songs inside this playlist yet. Use Search above to find tracks and attach them!
                      </div>
                    ) : (
                      activePlaylist.tracks.map((track, i) => {
                        const isCurrent = currentTrack?.spotifyId === track.spotifyId;
                        return (
                          <div
                            key={track.id}
                            onClick={() => onPlayTrack(track)}
                            className={`px-4 py-3 flex items-center gap-4 cursor-pointer group transition-all duration-200 ${
                              isCurrent ? "bg-[#c5a059]/10" : "hover:bg-white/5"
                            }`}
                          >
                            <span className={`w-6 text-center text-xs font-semibold ${isCurrent ? "text-[#c5a059]" : "text-zinc-600 group-hover:text-zinc-400"}`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                              {track.imageUrl && (
                                <img src={track.imageUrl} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-md object-cover bg-zinc-900" />
                              )}
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${isCurrent ? "text-[#c5a059]" : "text-white"}`}>
                                  {track.title}
                                </p>
                                <p className="text-xs text-zinc-500 truncate mt-0.5">{track.artist}</p>
                              </div>
                            </div>
                            <span className="w-28 text-xs text-zinc-500 truncate hidden sm:block">
                              {track.album || "Single"}
                            </span>
                            <span className="w-14 text-center text-xs font-mono text-zinc-500">
                              {track.duration || "--:--"}
                            </span>
                            
                            {/* Action dropdown for Playlists */}
                            <div className="w-10 relative">
                              <button
                                id={`playlist-menu-trigger-${track.id}`}
                                onClick={(e) => toggleTrackMenu(track.id, e)}
                                className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              {activeMenuTrackId === track.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-[#080808] border border-white/5 rounded-lg shadow-2xl z-50 p-1">
                                  <p className="text-[10px] font-bold text-[#c5a059] uppercase tracking-widest px-2.5 py-1.5 border-b border-white/5 font-sans">
                                    Add to Playlist
                                  </p>
                                  {userPlaylists.length === 0 ? (
                                    <p className="text-[10px] text-zinc-500 italic p-2 font-sans">Create custom playlist first</p>
                                  ) : (
                                    userPlaylists.map((pl) => (
                                      <button
                                        key={pl.id}
                                        onClick={() => handleAddToPlaylistAction(track, pl.id)}
                                        className="w-full text-left text-xs text-zinc-300 hover:text-[#c5a059] hover:bg-white/5 px-2.5 py-2 rounded transition truncate font-sans"
                                      >
                                        {pl.name}
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ================= AI MUSIC CURATOR TAB ================= */
          <motion.div
            key="curator-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-2xl mx-auto w-full pt-4 relative z-10"
          >
            {/* Header Description */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c5a059]/10 border border-[#c5a059]/20 rounded-full text-[#c5a059] text-xs font-semibold uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                <span>Gemini Assistant Curation</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight">AI Music Curator</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Describe your mood, active vibe, environment, or tasks. Gemini will compile a tailored 5-track playlist with verified Spotify IDs.
              </p>
            </div>

            {/* Prompt Input Form */}
            <div className="p-6 rounded-2xl bg-[#080808]/80 border border-white/5 shadow-2xl relative overflow-hidden">
              <form onSubmit={(e) => handleCuratorSubmit(e)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">
                    Describe your Vibe / Soundtrack Concept
                  </label>
                  <textarea
                    rows={3}
                    placeholder="E.g., late night coding in heavy rain, deep concentration lo-fi beats..."
                    value={moodInput}
                    onChange={(e) => setMoodInput(e.target.value)}
                    className="w-full bg-[#050505] border border-white/5 focus:border-[#c5a059] text-sm text-[#e0dcd0] rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-[#c5a059]/10 placeholder-zinc-600 transition leading-relaxed resize-none"
                  />
                </div>

                {/* Example Quick-Pick tags */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider font-sans">Tap an example:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AI_MOODS.map((mood) => (
                      <button
                        key={mood.text}
                        type="button"
                        onClick={() => setMoodInput(mood.text)}
                        className="text-xs text-left bg-white/5 hover:bg-white/10 border border-white/5 p-2.5 rounded-xl text-zinc-300 hover:text-[#c5a059] transition flex items-center gap-2 font-sans"
                      >
                        <span className="text-sm shrink-0">{mood.icon}</span>
                        <span className="truncate">{mood.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={curatorLoading || !moodInput.trim()}
                  className="w-full bg-[#c5a059] hover:bg-[#c5a059]/90 disabled:opacity-40 text-black font-semibold text-xs py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg font-sans"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{curatorLoading ? "Analyzing Vibe Spectrum..." : "Curate Soundscape"}</span>
                </button>
              </form>
            </div>

            {/* AI Curating Progress Loader */}
            {curatorLoading && (
              <div className="p-6 rounded-2xl bg-[#080808] border border-[#c5a059]/20 shadow-xl space-y-4 text-center">
                <div className="relative w-12 h-12 mx-auto">
                  <Disc className="w-12 h-12 text-[#c5a059] animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-[#c5a059] animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#c5a059] animate-pulse">
                    {CURATOR_LOGS[curatorStep]}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
                    Searching Spotify database (no developer tokens required)
                  </p>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c5a059] transition-all duration-1000"
                    style={{ width: `${((curatorStep + 1) / CURATOR_LOGS.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Curated AI Playlist Result */}
            {curatedAiPlaylist && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#080808] to-[#c5a059]/5 border border-[#c5a059]/20 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                        Fresh Curation
                      </span>
                      <h3 className="text-lg font-serif italic text-white mt-1">{curatedAiPlaylist.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{curatedAiPlaylist.description}</p>
                    </div>
                    <button
                      id="play-curated-ai-btn"
                      onClick={() =>
                        onCuratedPlaylistSelect(
                          curatedAiPlaylist.tracks,
                          curatedAiPlaylist.name,
                          curatedAiPlaylist.description || ""
                        )
                      }
                      className="bg-[#c5a059] hover:bg-[#c5a059]/90 text-black font-bold text-xs px-4 py-2.5 rounded-lg transition duration-200 shadow-md flex items-center gap-1.5 self-start font-sans"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Play All</span>
                    </button>
                  </div>

                  <div className="mt-6 space-y-2.5">
                    {curatedAiPlaylist.tracks.map((track, idx) => (
                      <div
                        key={track.id}
                        onClick={() => onPlayTrack(track)}
                        className="group p-2.5 rounded-xl bg-[#050505]/60 hover:bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer flex items-center justify-between transition duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono font-medium text-zinc-600 group-hover:text-[#c5a059] transition w-4 text-center">
                            {idx + 1}
                          </span>
                          {track.imageUrl && (
                            <img src={track.imageUrl} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#e0dcd0] truncate group-hover:text-[#c5a059] transition">
                              {track.title}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.artist}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0 pr-2">
                          {track.duration || "--:--"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
