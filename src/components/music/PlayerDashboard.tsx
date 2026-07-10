/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
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
  Compass,
  ArrowDownToLine,
  CheckCircle2,
  Users,
  Music,
  Heart,
  ListMusic,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Track, Playlist } from "./types";

interface PlayerDashboardProps {
  activePlaylist: Playlist | null;
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
  onAddToPlaylist: (track: Track, playlistId: string) => void;
  userPlaylists: Playlist[];
  activeTab: "explore" | "curator" | "spotify";
  onCuratedPlaylistSelect: (tracks: Track[], name: string, desc: string) => void;
  onAddToQueue: (track: Track) => void;
  
  // Spotify integration
  spotifyToken: string | null;
  spotifyPlaylists: Playlist[];
  onCreatePlaylist: (name: string, description?: string, tracks?: Track[]) => void;
  likedSongsStatus?: { loaded: number; total: number; loading: boolean };
}

export default function PlayerDashboard({
  activePlaylist,
  currentTrack,
  onPlayTrack,
  onAddToPlaylist,
  userPlaylists,
  activeTab,
  onCuratedPlaylistSelect,
  onAddToQueue,
  spotifyToken,
  spotifyPlaylists,
  onCreatePlaylist,
  likedSongsStatus,
}: PlayerDashboardProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Search inside playlist state
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");

  // Reset playlist filter on playlist changes
  useEffect(() => {
    setPlaylistSearchQuery("");
  }, [activePlaylist?.id]);

  // Memoized filter for playlist tracks
  const filteredPlaylistTracks = useMemo(() => {
    if (!activePlaylist) return [];
    if (!playlistSearchQuery.trim()) return activePlaylist.tracks;
    
    const query = playlistSearchQuery.toLowerCase().trim();
    return activePlaylist.tracks.filter((track) => {
      const titleMatch = track.title?.toLowerCase().includes(query);
      const artistMatch = track.artist?.toLowerCase().includes(query);
      const albumMatch = track.album?.toLowerCase().includes(query);
      return titleMatch || artistMatch || albumMatch;
    });
  }, [activePlaylist, playlistSearchQuery]);

  const performServerSearch = async (queryStr: string) => {
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryStr }),
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

  const performSearch = async (queryStr: string) => {
    const q = queryStr.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError(null);

    if (spotifyToken && spotifyToken !== "null" && spotifyToken !== "undefined") {
      try {
        const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=20`, {
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
        await performServerSearch(q);
      } finally {
        setSearching(false);
      }
      return;
    }

    await performServerSearch(q);
  };

  // Live-as-you-type search effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, spotifyToken]);

  // Spotify library sync state
  const [spotifyTopTracks, setSpotifyTopTracks] = useState<Track[]>([]);
  const [spotifyTopArtists, setSpotifyTopArtists] = useState<any[]>([]);
  const [spotifyRecentTracks, setSpotifyRecentTracks] = useState<Track[]>([]);
  const [loadingSpotifyLibrary, setLoadingSpotifyLibrary] = useState(false);
  const [importingPlaylistId, setImportingPlaylistId] = useState<string | null>(null);
  const [importedStatus, setImportedStatus] = useState<Record<string, boolean>>({});

  const fetchSpotifyLibrary = async () => {
    if (!spotifyToken) return;
    setLoadingSpotifyLibrary(true);
    try {
      // 1. Fetch top tracks
      const topTracksRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=15", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
      let topTracks: Track[] = [];
      if (topTracksRes.ok) {
        const data = await topTracksRes.json();
        topTracks = data.items.map((item: any) => {
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
        setSpotifyTopTracks(topTracks);
      }

      // 2. Fetch top artists
      const topArtistsRes = await fetch("https://api.spotify.com/v1/me/top/artists?limit=12", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
      if (topArtistsRes.ok) {
        const data = await topArtistsRes.json();
        setSpotifyTopArtists(data.items || []);
      }

      // 3. Fetch recently played tracks
      const recentTracksRes = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=10", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
      if (recentTracksRes.ok) {
        const data = await recentTracksRes.json();
        const recentTracks = data.items.map((item: any) => {
          const t = item.track;
          const durationMinSec = t.duration_ms
            ? `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`
            : "3:00";
          return {
            id: t.id,
            title: t.name,
            artist: t.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
            album: t.album?.name || "Single",
            spotifyId: t.id,
            spotifyUri: t.uri || `spotify:track:${t.id}`,
            imageUrl: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
            duration: durationMinSec,
          };
        });
        setSpotifyRecentTracks(recentTracks);
      }
    } catch (err) {
      console.error("Failed to load full Spotify library details:", err);
    } finally {
      setLoadingSpotifyLibrary(false);
    }
  };

  useEffect(() => {
    if (activeTab === "spotify" && spotifyToken) {
      fetchSpotifyLibrary();
    }
  }, [activeTab, spotifyToken]);

  const handleImportPlaylist = async (playlistId: string, playlistName: string, autoPlayFirstTrack: boolean = false) => {
    if (!spotifyToken) return;
    setImportingPlaylistId(playlistId);
    try {
      let mappedTracks: Track[] = [];
      if (playlistId === "spotify-liked-songs") {
        const likedPl = spotifyPlaylists.find((p) => p.id === "spotify-liked-songs");
        if (likedPl && likedPl.tracks.length > 0) {
          mappedTracks = likedPl.tracks;
        } else {
          let nextUrl: string | null = "https://api.spotify.com/v1/me/tracks?limit=50";
          while (nextUrl) {
            const res = await fetch(nextUrl, {
              headers: { Authorization: `Bearer ${spotifyToken}` },
            });
            if (!res.ok) break;
            const data = await res.json();
            if (data.items) {
              const pageTracks = data.items
                .filter((item: any) => item.track)
                .map((item: any) => {
                  const t = item.track;
                  const durationMinSec = t.duration_ms
                    ? `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`
                    : "3:00";
                  return {
                    id: t.id,
                    title: t.name,
                    artist: t.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
                    album: t.album?.name || "Single",
                    spotifyId: t.id,
                    spotifyUri: t.uri || `spotify:track:${t.id}`,
                    imageUrl: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
                    duration: durationMinSec,
                  };
                });
              mappedTracks = [...mappedTracks, ...pageTracks];
            }
            nextUrl = data.next;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      } else {
        const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        });
        if (tracksRes.ok) {
          const data = await tracksRes.json();
          mappedTracks = data.items
            .filter((item: any) => item.track)
            .map((item: any) => {
              const t = item.track;
              const durationMinSec = t.duration_ms
                ? `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`
                : "3:00";
              return {
                id: t.id,
                title: t.name,
                artist: t.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
                album: t.album?.name || "Single",
                spotifyId: t.id,
                spotifyUri: t.uri || `spotify:track:${t.id}`,
                imageUrl: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
                duration: durationMinSec,
              };
            });
        }
      }

      if (mappedTracks.length > 0) {
        onCreatePlaylist(`Synced: ${playlistName}`, `Cloned from your Spotify account.`, mappedTracks);
        
        if (autoPlayFirstTrack) {
          onPlayTrack(mappedTracks[0]);
        }

        setImportedStatus((prev) => ({ ...prev, [playlistId]: true }));
        setTimeout(() => {
          setImportedStatus((prev) => ({ ...prev, [playlistId]: false }));
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to import playlist:", err);
    } finally {
      setImportingPlaylistId(null);
    }
  };

  const handleImportArtistTopTracks = async (artistId: string, artistName: string, autoPlayFirstTrack: boolean = false) => {
    if (!spotifyToken) return;
    try {
      const tracksRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=from_token`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
      if (tracksRes.ok) {
        const data = await tracksRes.json();
        const mappedTracks: Track[] = data.tracks.map((t: any) => {
          const durationMinSec = t.duration_ms
            ? `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`
            : "3:00";
          return {
            id: t.id,
            title: t.name,
            artist: t.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
            album: t.album?.name || "Single",
            spotifyId: t.id,
            spotifyUri: t.uri || `spotify:track:${t.id}`,
            imageUrl: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
            duration: durationMinSec,
          };
        });

        onCreatePlaylist(`Best of ${artistName}`, `Official Spotify top tracks curated in-app.`, mappedTracks);
        
        if (autoPlayFirstTrack && mappedTracks.length > 0) {
          onPlayTrack(mappedTracks[0]);
        }

        setImportedStatus((prev) => ({ ...prev, [artistId]: true }));
        setTimeout(() => {
          setImportedStatus((prev) => ({ ...prev, [artistId]: false }));
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to import artist tracks:", err);
    }
  };

  const handleImportAllLikedSongs = async () => {
    if (!spotifyToken) return;
    setImportedStatus((prev) => ({ ...prev, ["liked-all-loading"]: true }));
    try {
      let tracks: Track[] = [];
      const likedPl = spotifyPlaylists.find((p) => p.id === "spotify-liked-songs");
      if (likedPl && likedPl.tracks.length > 0) {
        tracks = likedPl.tracks;
      } else {
        let nextUrl: string | null = "https://api.spotify.com/v1/me/tracks?limit=50";
        while (nextUrl) {
          const res = await fetch(nextUrl, {
            headers: { Authorization: `Bearer ${spotifyToken}` },
          });
          if (!res.ok) {
            console.error(`Failed to fetch page of liked songs: ${res.status}`);
            break;
          }
          const data = await res.json();
          if (data.items) {
            const pageTracks: Track[] = data.items
              .filter((item: any) => item.track)
              .map((item: any) => {
                const t = item.track;
                const durationMinSec = t.duration_ms
                  ? `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`
                  : "3:00";
                return {
                  id: t.id,
                  title: t.name,
                  artist: t.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
                  album: t.album?.name || "Single",
                  spotifyId: t.id,
                  spotifyUri: t.uri || `spotify:track:${t.id}`,
                  imageUrl: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
                  duration: durationMinSec,
                };
              });
            tracks = [...tracks, ...pageTracks];
          }
          nextUrl = data.next;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (tracks.length > 0) {
        onCreatePlaylist(`My Liked Tracks`, `Cloned favorite tracks from your Spotify account.`, tracks);
        setImportedStatus((prev) => ({ ...prev, ["liked-all"]: true }));
        setTimeout(() => {
          setImportedStatus((prev) => ({ ...prev, ["liked-all"]: false }));
        }, 3000);
      } else {
        alert("We couldn't find any liked songs in your Spotify library. Try adding some favorite tracks on Spotify first!");
      }
    } catch (err) {
      console.error("Failed to import liked songs:", err);
    } finally {
      setImportedStatus((prev) => ({ ...prev, ["liked-all-loading"]: false }));
    }
  };

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
    { text: "Late night coding in heavy rain", icon: "🌧" },
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
    performSearch(searchQuery);
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
    <div id="player-dashboard-root" className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-[#0e0420] via-[#05020a] to-[#010103] text-[#e0dcd0] p-4 md:p-8 overflow-y-auto relative scrollbar-thin">
      {/* Atmospheric Background Glow Elements */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#8b5cf6]/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] bg-[#6d28d9]/8 blur-[150px] rounded-full pointer-events-none z-0"></div>

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
                <h2 className="text-2xl md:text-3xl font-serif italic tracking-tight text-[#8b5cf6]">Music Discovery</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Search live database coordinates or explore pre-curated music sectors.
                </p>
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
                  className="w-full bg-[#0a0518] border border-white/5 focus:border-[#8b5cf6] text-sm text-[#e0dcd0] rounded-xl pl-12 pr-28 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#8b5cf6]/20 placeholder-zinc-500 transition duration-300"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 stroke-[2]" />
                <button
                  id="search-submit-btn"
                  type="submit"
                  disabled={searching}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-lg transition duration-200 shadow-md"
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
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 font-serif italic text-[#8b5cf6]">
                    <TrendingUp className="w-4 h-4 text-[#8b5cf6] animate-pulse" />
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
                            ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/50"
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
                              <Play className="w-5 h-5 text-[#8b5cf6] fill-[#8b5cf6]" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isCurrent ? "text-[#8b5cf6]" : "text-white"}`}>
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
                              title="More Options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {activeMenuTrackId === track.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-[#080808] border border-white/5 rounded-lg shadow-2xl z-50 p-1 font-sans">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToQueue(track);
                                    setActiveMenuTrackId(null);
                                  }}
                                  className="w-full text-left text-xs text-zinc-300 hover:text-[#8b5cf6] hover:bg-white/5 px-2.5 py-2 rounded transition flex items-center gap-2 font-sans"
                                >
                                  <ListMusic className="w-3.5 h-3.5 text-[#8b5cf6]" />
                                  <span>Add to Queue</span>
                                </button>
                                
                                <div className="border-t border-white/5 my-1" />
                                <p className="text-[10px] font-bold text-[#8b5cf6]/80 uppercase tracking-widest px-2.5 py-1.5 font-sans">
                                  Playlists
                                </p>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const name = prompt("Enter new playlist name:");
                                    if (name && name.trim()) {
                                      onCreatePlaylist(name.trim(), "My custom selection", [track]);
                                    }
                                    setActiveMenuTrackId(null);
                                  }}
                                  className="w-full text-left text-xs text-[#8b5cf6] hover:bg-[#8b5cf6]/10 px-2.5 py-1.5 rounded transition font-semibold flex items-center gap-1.5 font-sans"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Create Playlist</span>
                                </button>

                                {userPlaylists.length > 0 && (
                                  <div className="max-h-28 overflow-y-auto mt-1 border-t border-white/5 pt-1 space-y-0.5 scrollbar-thin">
                                    {userPlaylists.map((pl) => (
                                      <button
                                        key={pl.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddToPlaylistAction(track, pl.id);
                                        }}
                                        className="w-full text-left text-xs text-zinc-300 hover:text-[#8b5cf6] hover:bg-white/5 px-2.5 py-1.5 rounded transition truncate font-sans block"
                                      >
                                        {pl.name}
                                      </button>
                                    ))}
                                  </div>
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
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#8b5cf6]/5 blur-[80px] rounded-full pointer-events-none"></div>
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#8b5cf6]/10 flex items-center justify-center border border-[#8b5cf6]/20 shadow-inner">
                      <Disc className="w-10 h-10 text-[#8b5cf6] animate-spin" style={{ animationDuration: "12s" }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#8b5cf6] bg-[#8b5cf6]/10 px-2.5 py-0.5 rounded-full border border-[#8b5cf6]/20">
                        {activePlaylist.id === "spotify-liked-songs" ? "Spotify Library" : (activePlaylist.isCustom ? "Custom Playlist" : "Global Vibe")}
                      </span>
                      <h3 className="text-xl md:text-2xl font-serif italic text-white mt-1.5">{activePlaylist.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{activePlaylist.description || "Fresh selected hits for you."}</p>
                      
                      {activePlaylist.id === "spotify-liked-songs" && likedSongsStatus?.loading && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[11px] text-emerald-400 font-mono">
                              Syncing {likedSongsStatus.loaded} of {likedSongsStatus.total || "2,535"} songs...
                            </span>
                          </div>
                          {likedSongsStatus.total > 0 && (
                            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-300" 
                                style={{ width: `${(likedSongsStatus.loaded / likedSongsStatus.total) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 relative z-10">
                    {activePlaylist.id === "spotify-liked-songs" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof (window as any).triggerSpotifyLikedSongsResync === 'function') {
                            (window as any).triggerSpotifyLikedSongsResync();
                          }
                        }}
                        disabled={likedSongsStatus?.loading}
                        className="text-xs font-bold text-black bg-[#1db954] hover:bg-[#1ed760] disabled:bg-zinc-800 disabled:text-zinc-500 px-4 py-2 rounded-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer font-sans"
                      >
                        <Disc className={`w-3.5 h-3.5 ${likedSongsStatus?.loading ? 'animate-spin' : ''}`} />
                        <span>{likedSongsStatus?.loading ? 'Syncing...' : 'Sync Spotify'}</span>
                      </button>
                    )}
                    <div className="text-xs font-mono text-zinc-500 px-4 py-2 bg-[#050505] rounded-lg border border-white/5">
                      <span>Tracks count: {activePlaylist.tracks.length}</span>
                    </div>
                  </div>
                </div>

                {/* Tracks Table */}
                <div className="bg-[#080808]/40 rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                  {activePlaylist.tracks.length > 0 && (
                    <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
                        <input
                          type="text"
                          placeholder="Search inside playlist..."
                          value={playlistSearchQuery}
                          onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                          className="w-full bg-[#050505] border border-white/5 focus:border-[#8b5cf6]/50 text-xs text-[#e0dcd0] rounded-lg pl-9 pr-8 py-2 focus:outline-none placeholder-zinc-500 transition duration-200"
                        />
                        {playlistSearchQuery && (
                          <button
                            onClick={() => setPlaylistSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300 transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}

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
                    ) : filteredPlaylistTracks.length === 0 ? (
                      <div className="p-8 text-center text-zinc-600 text-xs italic">
                        No matching tracks found for &ldquo;{playlistSearchQuery}&rdquo;
                      </div>
                    ) : (
                      filteredPlaylistTracks.map((track, i) => {
                        const isCurrent = currentTrack?.spotifyId === track.spotifyId;
                        return (
                          <div
                            key={track.id}
                            onClick={() => onPlayTrack(track)}
                            className={`px-4 py-3 flex items-center gap-4 cursor-pointer group transition-all duration-200 ${
                              isCurrent ? "bg-[#8b5cf6]/10" : "hover:bg-white/5"
                            }`}
                          >
                            <span className={`w-6 text-center text-xs font-semibold ${isCurrent ? "text-[#8b5cf6]" : "text-zinc-600 group-hover:text-zinc-400"}`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                              {track.imageUrl && (
                                <img src={track.imageUrl} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-md object-cover bg-zinc-900" />
                              )}
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${isCurrent ? "text-[#8b5cf6]" : "text-white"}`}>
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
                                title="More Options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {activeMenuTrackId === track.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-[#080808] border border-white/5 rounded-lg shadow-2xl z-50 p-1 font-sans">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAddToQueue(track);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full text-left text-xs text-zinc-300 hover:text-[#8b5cf6] hover:bg-white/5 px-2.5 py-2 rounded transition flex items-center gap-2 font-sans"
                                  >
                                    <ListMusic className="w-3.5 h-3.5 text-[#8b5cf6]" />
                                    <span>Add to Queue</span>
                                  </button>
                                  
                                  <div className="border-t border-white/5 my-1" />
                                  <p className="text-[10px] font-bold text-[#8b5cf6]/80 uppercase tracking-widest px-2.5 py-1.5 font-sans">
                                    Playlists
                                  </p>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const name = prompt("Enter new playlist name:");
                                      if (name && name.trim()) {
                                        onCreatePlaylist(name.trim(), "My custom selection", [track]);
                                      }
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full text-left text-xs text-[#8b5cf6] hover:bg-[#8b5cf6]/10 px-2.5 py-1.5 rounded transition font-semibold flex items-center gap-1.5 font-sans"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Create Playlist</span>
                                  </button>

                                  {userPlaylists.length > 0 && (
                                    <div className="max-h-28 overflow-y-auto mt-1 border-t border-white/5 pt-1 space-y-0.5 scrollbar-thin">
                                      {userPlaylists.map((pl) => (
                                        <button
                                          key={pl.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToPlaylistAction(track, pl.id);
                                          }}
                                          className="w-full text-left text-xs text-zinc-300 hover:text-[#8b5cf6] hover:bg-white/5 px-2.5 py-1.5 rounded transition truncate font-sans block"
                                        >
                                          {pl.name}
                                        </button>
                                      ))}
                                    </div>
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
        ) : activeTab === "curator" ? (
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-full text-[#8b5cf6] text-xs font-semibold uppercase tracking-wider font-mono">
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
                    className="w-full bg-[#050505] border border-white/5 focus:border-[#8b5cf6] text-sm text-[#e0dcd0] rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-[#8b5cf6]/10 placeholder-zinc-600 transition leading-relaxed resize-none"
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
                        className="text-xs text-left bg-white/5 hover:bg-white/10 border border-white/5 p-2.5 rounded-xl text-zinc-300 hover:text-[#8b5cf6] transition flex items-center gap-2 font-sans"
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
                  className="w-full bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 disabled:opacity-40 text-white font-semibold text-xs py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)] font-sans"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{curatorLoading ? "Analyzing Vibe Spectrum..." : "Curate Soundscape"}</span>
                </button>
              </form>
            </div>

            {/* AI Curating Progress Loader */}
            {curatorLoading && (
              <div className="p-6 rounded-2xl bg-[#080808] border border-[#8b5cf6]/20 shadow-xl space-y-4 text-center">
                <div className="relative w-12 h-12 mx-auto">
                  <Disc className="w-12 h-12 text-[#8b5cf6] animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-[#8b5cf6] animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#8b5cf6] animate-pulse">
                    {CURATOR_LOGS[curatorStep]}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
                    Searching Spotify database (no developer tokens required)
                  </p>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8b5cf6] transition-all duration-1000"
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
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#080808] to-[#8b5cf6]/5 border border-[#8b5cf6]/20 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#8b5cf6] px-2 py-0.5 rounded font-bold uppercase tracking-widest">
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
                      className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition duration-200 shadow-md flex items-center gap-1.5 self-start font-sans"
                    >
                      <Play className="w-4 h-4 fill-white" />
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
                          <span className="text-xs font-mono font-medium text-zinc-600 group-hover:text-[#8b5cf6] transition w-4 text-center">
                            {idx + 1}
                          </span>
                          {track.imageUrl && (
                            <img src={track.imageUrl} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#e0dcd0] truncate group-hover:text-[#8b5cf6] transition">
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
        ) : (
          /* ================= SPOTIFY LIBRARY SYNC CENTER ================= */
          <motion.div
            key="spotify-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-5xl mx-auto w-full relative z-10"
          >
            {/* Header banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-950 to-[#8b5cf6]/5 border border-[#8b5cf6]/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#8b5cf6]/5 blur-[80px] rounded-full pointer-events-none"></div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center border border-[#8b5cf6]/20 shadow-inner">
                    <Disc className="w-8 h-8 text-[#8b5cf6] animate-spin" style={{ animationDuration: "6s" }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6] px-2.5 py-0.5 rounded font-bold uppercase tracking-widest">
                      Spotify Integration Active
                    </span>
                    <h3 className="text-xl font-serif italic text-white mt-1">My Spotify Library Curation</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Clone your personal playlists, saved songs, and favorite artist discographies directly into offline custom compile sets.
                    </p>
                  </div>
                </div>
                {spotifyToken && (
                  <button
                    onClick={handleImportAllLikedSongs}
                    disabled={importedStatus["liked-all"] || importedStatus["liked-all-loading"]}
                    className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 disabled:bg-[#8b5cf6]/20 disabled:text-[#8b5cf6] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-200 shadow-md flex items-center gap-1.5 shrink-0 self-start sm:self-center font-sans"
                  >
                    {importedStatus["liked-all-loading"] ? (
                      <>
                        <Disc className="w-4 h-4 text-white animate-spin" />
                        <span>Syncing Liked Songs...</span>
                      </>
                    ) : importedStatus["liked-all"] ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                        <span>Liked Songs Synced!</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-4 h-4 text-white" />
                        <span>Sync Liked Songs to App</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {loadingSpotifyLibrary ? (
              /* Loading Screen */
              <div className="p-12 text-center space-y-4">
                <div className="relative w-12 h-12 mx-auto">
                  <Disc className="w-12 h-12 text-[#8b5cf6] animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-[#8b5cf6] animate-pulse" />
                </div>
                <p className="text-xs text-zinc-400 animate-pulse">Syncing personal lists, recently played, and artist metrics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* COLUMN 1: Playlists (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <ListMusic className="w-4 h-4 text-[#8b5cf6]" />
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">Spotify Playlists ({spotifyPlaylists.length})</h4>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                    {spotifyPlaylists.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#080808]/40 border border-white/5 text-center text-zinc-500 text-xs italic">
                        No public playlists found in your library.
                      </div>
                    ) : (
                      spotifyPlaylists.map((pl) => {
                        const isImporting = importingPlaylistId === pl.id;
                        const isImported = importedStatus[pl.id];
                        return (
                          <div
                            key={pl.id}
                            onClick={() => handleImportPlaylist(pl.id, pl.name, true)}
                            className="p-3 rounded-xl bg-[#080808]/40 hover:bg-[#080808]/80 border border-white/5 flex items-center justify-between gap-4 transition duration-200 cursor-pointer hover:border-[#8b5cf6]/20"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded overflow-hidden bg-zinc-900 shrink-0">
                                {pl.imageUrl ? (
                                  <img src={pl.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                    <Disc className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{pl.name}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                                  {pl.tracks.length} tracks
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImportPlaylist(pl.id, pl.name, false);
                              }}
                              disabled={isImporting || isImported}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                                isImported
                                  ? "bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20"
                                  : "bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white"
                              }`}
                            >
                              {isImporting ? (
                                <Disc className="w-3.5 h-3.5 text-white animate-spin mx-auto" />
                              ) : isImported ? (
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#8b5cf6]" /> Cloned</span>
                              ) : (
                                <span className="flex items-center gap-1"><ArrowDownToLine className="w-3 h-3" /> Import</span>
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COLUMN 2: Top / Recently Played Tracks (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Top Songs */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-[#8b5cf6] fill-[#8b5cf6]/20" />
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">Top Songs & Liked tracks</h4>
                      </div>
                    </div>

                    <div className="bg-[#080808]/40 rounded-xl border border-white/5 divide-y divide-white/5 max-h-[350px] overflow-y-auto scrollbar-thin">
                      {spotifyTopTracks.length === 0 ? (
                        <div className="p-8 text-center text-zinc-600 text-xs italic">
                          No top tracks returned. Start listening on Spotify to seed these!
                        </div>
                      ) : (
                        spotifyTopTracks.map((track, idx) => {
                          const isCurrent = currentTrack?.spotifyId === track.spotifyId;
                          return (
                            <div
                              key={`${track.id}-${idx}`}
                              className="p-3 flex items-center justify-between gap-4 group hover:bg-white/[0.02] cursor-pointer transition"
                              onClick={() => onPlayTrack(track)}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-xs font-mono font-semibold w-4 text-center ${isCurrent ? "text-[#8b5cf6]" : "text-zinc-600"}`}>
                                  {idx + 1}
                                </span>
                                {track.imageUrl && (
                                  <img src={track.imageUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className={`text-xs font-semibold truncate ${isCurrent ? "text-[#8b5cf6]" : "text-white"}`}>
                                    {track.title}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.artist}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono text-zinc-600 mr-2">{track.duration || "3:00"}</span>
                                {/* Add to playlist dropdown */}
                                <div className="relative font-sans">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTrackMenu(track.id, e);
                                    }}
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
                                    title="More Options"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                  {activeMenuTrackId === track.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#080808] border border-white/5 rounded-lg shadow-2xl z-50 p-1 font-sans">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onAddToQueue(track);
                                          setActiveMenuTrackId(null);
                                        }}
                                        className="w-full text-left text-xs text-zinc-300 hover:text-[#8b5cf6] hover:bg-white/5 px-2.5 py-2 rounded transition flex items-center gap-2 font-sans"
                                      >
                                        <ListMusic className="w-3.5 h-3.5 text-[#8b5cf6]" />
                                        <span>Add to Queue</span>
                                      </button>
                                      
                                      <div className="border-t border-white/5 my-1" />
                                      <p className="text-[10px] font-bold text-[#8b5cf6]/80 uppercase tracking-widest px-2.5 py-1.5 font-sans">
                                        Playlists
                                      </p>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const name = prompt("Enter new playlist name:");
                                          if (name && name.trim()) {
                                            onCreatePlaylist(name.trim(), "My custom selection", [track]);
                                          }
                                          setActiveMenuTrackId(null);
                                        }}
                                        className="w-full text-left text-xs text-[#8b5cf6] hover:bg-[#8b5cf6]/10 px-2.5 py-1.5 rounded transition font-semibold flex items-center gap-1.5 font-sans"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>+ Create Playlist</span>
                                      </button>

                                      {userPlaylists.length > 0 && (
                                        <div className="max-h-28 overflow-y-auto mt-1 border-t border-white/5 pt-1 space-y-0.5 scrollbar-thin">
                                          {userPlaylists.map((pl) => (
                                            <button
                                              key={pl.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToPlaylistAction(track, pl.id);
                                              }}
                                              className="w-full text-left text-xs text-zinc-300 hover:text-[#8b5cf6] hover:bg-white/5 px-2.5 py-1.5 rounded transition truncate font-sans block"
                                            >
                                              {pl.name}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Top Artists (Grid) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Users className="w-4 h-4 text-[#8b5cf6]" />
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">My Favorite Artists & Discographies</h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {spotifyTopArtists.slice(0, 8).map((artist) => {
                        const hasCover = artist.images?.[0]?.url;
                        const artistImported = importedStatus[artist.id];
                        return (
                          <div
                            key={artist.id}
                            onClick={() => handleImportArtistTopTracks(artist.id, artist.name, true)}
                            className="p-3 rounded-xl bg-[#080808]/40 border border-white/5 flex flex-col items-center text-center space-y-2 relative group hover:border-[#8b5cf6]/20 transition duration-300 cursor-pointer"
                          >
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-900 border border-white/5 relative shrink-0">
                              {hasCover ? (
                                <img src={hasCover} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                  <Users className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 w-full">
                              <p className="text-[11px] font-semibold text-white truncate px-1">{artist.name}</p>
                              <p className="text-[9px] text-zinc-500 mt-0.5 truncate uppercase tracking-wider font-mono">
                                {artist.genres?.[0] || "Artist"}
                              </p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImportArtistTopTracks(artist.id, artist.name, false);
                              }}
                              disabled={artistImported}
                              className={`w-full py-1 text-[9px] font-bold rounded-lg transition mt-1 flex items-center justify-center gap-1 ${
                                artistImported
                                  ? "bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/15 font-sans"
                                  : "bg-white/5 hover:bg-[#8b5cf6] hover:text-white text-zinc-300 font-sans"
                              }`}
                            >
                              {artistImported ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-[#8b5cf6]" />
                                  <span>Cloned</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Best Of</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
