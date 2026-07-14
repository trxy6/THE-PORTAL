/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Music, 
  Search, 
  Sparkles, 
  Plus, 
  Library, 
  FolderHeart, 
  ChevronRight, 
  Disc, 
  Link,
  Menu,
  X
} from "lucide-react";
import { Playlist, Track } from "./types";
import { parseSpotifyUrl } from "./EmbeddedSpotify";

interface SidebarProps {
  curatedPlaylists: Playlist[];
  userPlaylists: Playlist[];
  activePlaylistId: string;
  onSelectPlaylist: (playlistId: string, isCustom: boolean, isSpotifyRemote?: boolean) => void;
  onCreatePlaylist: (name: string, description?: string, tracks?: Track[]) => void;
  onLoadExternalUrl: (type: "track" | "playlist" | "album" | "artist", id: string) => void;
  activeTab: "explore" | "curator" | "spotify";
  setActiveTab: (tab: "explore" | "curator" | "spotify") => void;
  
  // Spotify Integration Props
  spotifyToken: string | null;
  spotifyUser: { id: string; display_name: string; imageUrl?: string } | null;
  spotifyPlaylists: Playlist[];
  onConnectSpotify: () => void;
  onDisconnectSpotify: () => void;
  onFetchLikedSongs: () => void;
  showLeftSidebar?: boolean;
}

export default function Sidebar({
  curatedPlaylists,
  userPlaylists,
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onLoadExternalUrl,
  activeTab,
  setActiveTab,
  spotifyToken,
  spotifyUser,
  spotifyPlaylists,
  onConnectSpotify,
  onDisconnectSpotify,
  onFetchLikedSongs,
  showLeftSidebar
}: SidebarProps) {
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showPlaylistInput, setShowPlaylistInput] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [copied, setCopied] = useState(false);
  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";

  const handleCopyRedirectUri = () => {
    if (redirectUri) {
      navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = parseSpotifyUrl(urlInput);
    if (result) {
      onLoadExternalUrl(result.type, result.id);
      setUrlInput("");
      setUrlError(false);
    } else {
      setUrlError(true);
      setTimeout(() => setUrlError(false), 3000);
    }
  };

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setShowPlaylistInput(false);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const NavigationContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0c041a] via-[#05020a] to-[#010103] text-[#e0dcd0]/80 select-none">
      {/* Brand Logo Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white p-1.5 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Music className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-serif italic text-xl text-[#8b5cf6] tracking-tight leading-none">Lumina</h1>
            <span className="text-[9px] text-[#8b5cf6]/60 font-semibold tracking-wider uppercase font-mono mt-0.5 block">Spotify Lite Engine</span>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={toggleMobileSidebar} 
          className="md:hidden text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Paste External Spotify Link */}
      <div className="px-4 py-4 border-b border-white/5 bg-[#0e061c]/20">
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold text-[#8b5cf6] uppercase tracking-widest flex items-center gap-1 font-sans">
              <Link className="w-3 h-3 text-[#8b5cf6]" />
              Paste Spotify Link
            </label>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Paste track, playlist, album..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className={`w-full bg-[#06040d] border ${
                urlError ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/5 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]/10"
              } text-xs text-[#e0dcd0] rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 placeholder-zinc-600 transition`}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#8b5cf6] transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {urlError && (
            <p className="text-[10px] text-red-400 px-1 font-medium animate-pulse">
              Invalid Spotify Link. Please retry!
            </p>
          )}
        </form>
      </div>

      {/* Main Navigation */}
      <div className="px-3 py-4 space-y-1 border-b border-white/5">
        <button
          onClick={() => {
            setActiveTab("explore");
            setIsMobileOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
            activeTab === "explore"
              ? "bg-[#8b5cf6]/15 text-[#8b5cf6] shadow-[0_4px_10px_rgba(139,92,246,0.15)] border-l-2 border-[#8b5cf6]"
              : "text-zinc-400 hover:text-[#8b5cf6] hover:bg-white/5"
          }`}
        >
          <Search className="w-4 h-4 stroke-[2.5] text-[#8b5cf6]" />
          <span>Explore Search</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("curator");
            setIsMobileOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
            activeTab === "curator"
              ? "bg-[#8b5cf6]/15 text-[#8b5cf6] shadow-[0_4px_10px_rgba(139,92,246,0.15)] border-l-2 border-[#8b5cf6]"
              : "text-zinc-400 hover:text-[#8b5cf6] hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4 stroke-[2.5] text-[#8b5cf6]" />
          <span>Gemini AI Curator</span>
        </button>

        {spotifyToken && (
          <button
            onClick={() => {
              setActiveTab("spotify");
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
              activeTab === "spotify"
                ? "bg-[#8b5cf6]/15 text-[#8b5cf6] shadow-[0_4px_10px_rgba(139,92,246,0.15)] border-l-2 border-[#8b5cf6]"
                : "text-zinc-400 hover:text-[#8b5cf6] hover:bg-white/5"
            }`}
          >
            <Library className="w-4 h-4 stroke-[2.5] text-[#8b5cf6]" />
            <span className="flex-1 text-left">My Spotify Library</span>
            <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border border-[#8b5cf6]/10">
              Sync
            </span>
          </button>
        )}
      </div>

      {/* Library Segment */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Local Custom Playlists */}
        <div className="flex flex-col min-h-0 border-b border-white/5 pb-3">
          <div className="px-6 py-3.5 flex items-center justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-sans">
            <span className="flex items-center gap-1.5">
              <FolderHeart className="w-3.5 h-3.5" />
              Custom Setlists
            </span>
            <button
              onClick={() => setShowPlaylistInput(!showPlaylistInput)}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
              title="Create Custom Playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showPlaylistInput && (
            <form onSubmit={handleCreatePlaylistSubmit} className="px-4 py-2 border-b border-white/5 bg-white/[0.01]">
              <input
                type="text"
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1 text-xs text-[#e0dcd0] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]/20 transition"
                autoFocus
              />
            </form>
          )}

          <div className="max-h-[140px] overflow-y-auto px-3 space-y-1 scrollbar-thin">
            {userPlaylists.length === 0 ? (
              <p className="text-[10px] text-zinc-600 px-3 py-2 italic font-mono">No custom setlists yet.</p>
            ) : (
              userPlaylists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    onSelectPlaylist(pl.id, true);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition truncate ${
                    activePlaylistId === pl.id
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{pl.name}</span>
                  <span className="text-[9px] opacity-50 px-1 font-mono font-bold">{pl.tracks.length}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Spotify Playlists Segment */}
        {spotifyToken && (
          <div className="flex flex-col min-h-0 border-b border-white/5 pb-3">
            <div className="px-6 py-3 flex items-center justify-between text-[#8b5cf6] text-xs font-bold uppercase tracking-widest font-serif italic">
              <span className="flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-[#8b5cf6] animate-spin" style={{ animationDuration: "12s" }} />
                Spotify Library
              </span>
            </div>

            <div className="max-h-[180px] overflow-y-auto px-3 space-y-1 scrollbar-thin">
              <button
                onClick={() => {
                  onFetchLikedSongs();
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition truncate ${
                  activePlaylistId === "spotify-liked-songs"
                    ? "bg-emerald-500/10 text-emerald-400 font-bold border-l-2 border-emerald-500"
                    : "text-emerald-400/80 hover:text-emerald-400 hover:bg-white/5"
                }`}
              >
                <span className="truncate">Saved Liked Songs</span>
              </button>

              {spotifyPlaylists
                .filter((pl) => pl.id !== "spotify-liked-songs")
                .map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => {
                      onSelectPlaylist(pl.id, false, true);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition truncate ${
                      activePlaylistId === pl.id
                        ? "bg-white/10 text-white font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{pl.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      {!showLeftSidebar && (
        <button 
          onClick={toggleMobileSidebar}
          className="md:hidden fixed top-20 left-4 z-50 p-2.5 rounded-xl bg-[#0c041a] border border-[#8b5cf6]/20 text-[#8b5cf6] shadow-lg hover:scale-105 active:scale-95 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop Sidebar Column */}
      <aside className="w-64 border-r border-[#8b5cf6]/15 hidden md:block shrink-0 h-full overflow-hidden">
        <NavigationContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay mask */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMobileSidebar} />
          
          {/* Floating Sidebar content panel */}
          <div className="relative w-64 h-full shadow-2xl flex flex-col animate-[slideIn_0.3s_ease-out]">
            <NavigationContent />
          </div>
        </div>
      )}
    </>
  );
}
