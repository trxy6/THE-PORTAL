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
import { Playlist, Track } from "../types";
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left truncate transition ${
                  activePlaylistId === "spotify-liked-songs"
                    ? "bg-[#8b5cf6]/15 text-[#8b5cf6] font-semibold"
                    : "text-zinc-400 hover:text-[#8b5cf6] hover:bg-white/5"
                }`}
              >
                <FolderHeart className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                <span className="truncate flex-1">Liked Songs</span>
              </button>

              {spotifyPlaylists.filter(pl => pl.id !== "spotify-liked-songs").map((pl) => {
                const isActive = activePlaylistId === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      onSelectPlaylist(pl.id, false, true);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left truncate transition ${
                      isActive
                        ? "bg-[#8b5cf6]/15 text-[#8b5cf6] font-semibold"
                        : "text-zinc-400 hover:text-[#8b5cf6] hover:bg-white/5"
                    }`}
                  >
                    {pl.imageUrl ? (
                      <img src={pl.imageUrl} alt={pl.name} className="w-4 h-4 rounded-sm object-cover shrink-0" />
                    ) : (
                      <Library className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    )}
                    <span className="truncate flex-1">{pl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* User Playlists Segment */}
        <div className="px-6 py-4 flex items-center justify-between text-[#8b5cf6]/50 text-xs font-bold uppercase tracking-widest font-serif italic">
          <span className="flex items-center gap-1.5">
            <FolderHeart className="w-3.5 h-3.5 text-[#8b5cf6]" />
            My Playlists
          </span>
          <button
            onClick={() => setShowPlaylistInput(!showPlaylistInput)}
            className="text-zinc-400 hover:text-[#8b5cf6] transition p-1 hover:bg-white/5 rounded-md"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Create playlist mini-form */}
        {showPlaylistInput && (
          <form onSubmit={handleCreatePlaylistSubmit} className="px-4 pb-3">
            <input
              type="text"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full bg-[#06040d] border border-white/5 text-xs text-[#e0dcd0] rounded-md px-2 py-1.5 focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]/10 transition"
              autoFocus
            />
          </form>
        )}

        {/* User Playlists List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin">
          {userPlaylists.length === 0 ? (
            <p className="text-zinc-600 text-center text-[11px] py-4 italic">
              No custom playlists yet. Click the + to create one!
            </p>
          ) : (
            userPlaylists.map((pl) => {
              const isActive = activePlaylistId === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => {
                    onSelectPlaylist(pl.id, true);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left truncate transition ${
                    isActive
                      ? "bg-white/5 text-[#8b5cf6]"
                      : "text-zinc-400 hover:text-[#e2d9f3] hover:bg-white/5"
                  }`}
                >
                  <FolderHeart className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#8b5cf6]" : "text-zinc-600"}`} />
                  <span className="truncate flex-1">{pl.name}</span>
                  <span className="text-[9px] font-mono bg-[#050505] px-1.5 py-0.5 rounded text-zinc-500 border border-white/5 shrink-0">
                    {pl.tracks.length}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Spotify Connection Panel */}
      <div className="px-4 py-3 border-t border-white/5 bg-[#0e061c]/30">
        {spotifyUser ? (
          <div className="flex items-center gap-3 bg-[#8b5cf6]/5 p-3 rounded-xl border border-[#8b5cf6]/10">
            {spotifyUser.imageUrl ? (
              <img
                src={spotifyUser.imageUrl}
                alt={spotifyUser.display_name}
                className="w-8 h-8 rounded-full border border-[#8b5cf6]/30 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] font-bold flex items-center justify-center text-xs">
                {spotifyUser.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-zinc-500 font-medium font-mono uppercase tracking-wider">Sync Active</p>
              <p className="text-xs text-white font-bold truncate leading-tight">{spotifyUser.display_name}</p>
            </div>
            <button
              onClick={onDisconnectSpotify}
              className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold uppercase transition px-1.5 py-0.5 hover:bg-red-500/10 rounded"
              title="Disconnect Spotify"
            >
              Exit
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#8b5cf6]/15 to-[#0e061c]/40 border border-[#8b5cf6]/20 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
              <p className="text-[10px] text-[#8b5cf6] font-bold uppercase tracking-wider font-mono">Spotify Connection</p>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Connect your personal Spotify account to stream your real playlists & tracks natively.
            </p>
            <button
              onClick={onConnectSpotify}
              className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(29,185,84,0.15)] active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.135-.668.47-.745 3.856-.88 7.15-.5 9.817 1.133.294.18.385.564.207.857zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.182-.413.125-.848-.107-.973-.52-.125-.413.108-.847.52-.973 3.666-1.114 8.234-.57 11.343 1.344.367.226.488.707.26 1.073zm.107-2.822c-3.26-1.937-8.634-2.115-11.75-1.17-.5.152-1.025-.133-1.177-.633-.153-.5.133-1.026.633-1.178 3.593-1.09 9.513-.883 13.266 1.343.45.267.6.845.333 1.295-.268.453-.846.602-1.295.333z"/>
              </svg>
              <span>Connect Spotify</span>
            </button>

            <div className="pt-2 border-t border-white/5 space-y-1 text-[10px]">
              <div className="flex items-center justify-between text-zinc-500 font-mono">
                <span>REDIRECT URI:</span>
                <button
                  type="button"
                  onClick={handleCopyRedirectUri}
                  className="text-emerald-500 hover:text-emerald-400 font-medium font-sans uppercase transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="bg-black/40 border border-white/5 p-1.5 rounded text-zinc-400 font-mono truncate select-all text-[9px]">
                {redirectUri}
              </div>
              <p className="text-[9px] text-[#8b5cf6]/80 leading-normal font-serif italic mt-1">
                ⚠️ Click <strong>Add</strong> and then <strong>Save</strong> at the very bottom of Spotify's developer settings page, otherwise it won't persist!
              </p>
            </div>
          </div>
        )}
      </div>


    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar with logo and toggle */}
      <div className="md:hidden bg-gradient-to-r from-[#0c041a] to-[#04020a] text-white h-14 border-b border-white/5 px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-[#8b5cf6] text-white p-1 rounded-full">
            <Music className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-serif italic text-base text-[#8b5cf6] tracking-tight">Lumina</span>
        </div>
        <button
          onClick={toggleMobileSidebar}
          className="text-zinc-400 hover:text-[#8b5cf6] p-1 rounded-lg focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:block w-64 h-full shrink-0 border-r border-[#8b5cf6]/10 bg-[#04020a]">
        <NavigationContent />
      </aside>

      {/* Mobile Sidebar (Slide-out drawer overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] md:hidden backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#04020a] h-full shadow-2xl transition-transform duration-300 transform translate-x-0 border-r border-[#8b5cf6]/10">
            <NavigationContent />
          </div>
        </div>
      )}
    </>
  );
}
