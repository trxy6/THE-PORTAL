/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Heart, 
  Tv
} from "lucide-react";
import { Track, Playlist } from "./types";
import Sidebar from "./Sidebar";
import PlayerDashboard from "./PlayerDashboard";
import EmbeddedSpotify from "./EmbeddedSpotify";
import AudioVisualizer from "./AudioVisualizer";
import LyricsDisplay from "./LyricsDisplay";
import { CURATED_PLAYLISTS } from "./curatedTracks";

// Helper: Convert time string "M:SS" to seconds
function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr) return 180; // Default 3 minutes
  const parts = durationStr.split(":");
  if (parts.length < 2) return 180;
  const mins = parseInt(parts[0], 10) || 0;
  const secs = parseInt(parts[1], 10) || 0;
  return mins * 60 + secs;
}

// Helper: Format seconds to "M:SS"
function formatSecondsToTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const SPOTIFY_CLIENT_ID = "6238dcf567664f328bde1570c68f9eae";

function generateRandomString(length: number): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map((x) => possible[x % possible.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(a: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a) as any))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(v: string): Promise<string> {
  const hashed = await sha256(v);
  return base64urlencode(hashed);
}

interface SpotifyPlayerProps {
  portalDarkMode: boolean;
  themeColor: string;
}

export default function SpotifyPlayer({ portalDarkMode, themeColor }: SpotifyPlayerProps) {
  // Playlists and Library States
  const [curatedPlaylists, setCuratedPlaylists] = useState<Playlist[]>(CURATED_PLAYLISTS);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(CURATED_PLAYLISTS[0] || null);
  const [activePlaylistId, setActivePlaylistId] = useState<string>(CURATED_PLAYLISTS[0]?.id || "");

  // Playback Control States
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [embedType, setEmbedType] = useState<"track" | "playlist" | "album" | "artist">("track");
  const [embedId, setEmbedId] = useState<string>("");

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [prevVolume, setPrevVolume] = useState<number>(80);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);

  // Tab coordinates
  const [activeTab, setActiveTab] = useState<"explore" | "curator">("explore");

  // Secondary layout toggles
  const [showLyricsPanel, setShowLyricsPanel] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  // Spotify Account Connection States
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<{
    id: string;
    display_name: string;
    imageUrl?: string;
  } | null>(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<Playlist[]>([]);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper: map a raw Spotify track to our internal Track type
  const mapSpotifyTrackToTrack = (t: any): Track => {
    const durationMinSec = t.duration_ms
      ? `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, "0")}`
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
  };

  // Fetch user profile and playlists from the Spotify Web API
  const fetchSpotifyData = async (token: string) => {
    try {
      const userRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        if (userRes.status === 401) {
          await handleSpotifyTokenRefresh();
          return;
        }
        throw new Error("Failed to fetch Spotify user profile");
      }
      const userData = await userRes.json();
      setSpotifyUser({
        id: userData.id,
        display_name: userData.display_name || userData.id,
        imageUrl: userData.images?.[0]?.url,
      });

      const plRes = await fetch("https://api.spotify.com/v1/me/playlists?limit=25", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (plRes.ok) {
        const plData = await plRes.json();
        const playlists: Playlist[] = plData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || `Playlist by ${item.owner?.display_name}`,
          tracks: [], // lazy loaded
          isCustom: false,
          imageUrl: item.images?.[0]?.url,
        }));
        setSpotifyPlaylists(playlists);
      }
    } catch (err: any) {
      console.error("Failed to load Spotify details:", err);
      setSpotifyError(err.message);
    }
  };

  // Exchange code for access token client-side using PKCE
  const exchangeCodeForToken = async (code: string) => {
    try {
      const codeVerifier = localStorage.getItem("spotify_code_verifier") || "";
      const client_id = SPOTIFY_CLIENT_ID;
      const redirect_uri = window.location.origin + window.location.pathname;

      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: client_id,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirect_uri,
          code_verifier: codeVerifier,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Token exchange failed: ${res.statusText} (${errorText})`);
      }

      const data = await res.json();
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;

      setSpotifyToken(accessToken);
      setSpotifyRefreshToken(refreshToken);
      localStorage.setItem("spotify_access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("spotify_refresh_token", refreshToken);
      }
      fetchSpotifyData(accessToken);
    } catch (err: any) {
      console.error("Token exchange failed:", err);
      setSpotifyError(err.message);
    }
  };

  // Refresh token using the client-side PKCE refresh flow (falls back to server if refresh fails)
  const handleSpotifyTokenRefresh = async () => {
    const refresh = localStorage.getItem("spotify_refresh_token");
    if (!refresh) return;

    try {
      const client_id = SPOTIFY_CLIENT_ID;
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: client_id,
          grant_type: "refresh_token",
          refresh_token: refresh,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const accessToken = data.access_token;
        const newRefreshToken = data.refresh_token;

        setSpotifyToken(accessToken);
        localStorage.setItem("spotify_access_token", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("spotify_refresh_token", newRefreshToken);
          setSpotifyRefreshToken(newRefreshToken);
        }
        fetchSpotifyData(accessToken);
      } else {
        // Fallback to server-side refresh if client-side fails
        const serverRes = await fetch("/api/auth/spotify/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (serverRes.ok) {
          const serverData = await serverRes.json();
          setSpotifyToken(serverData.accessToken);
          localStorage.setItem("spotify_access_token", serverData.accessToken);
          fetchSpotifyData(serverData.accessToken);
        } else {
          handleDisconnectSpotify();
        }
      }
    } catch (e) {
      console.error("Failed to refresh Spotify token:", e);
    }
  };

  // Disconnect Spotify Integration
  const handleDisconnectSpotify = () => {
    setSpotifyToken(null);
    setSpotifyRefreshToken(null);
    setSpotifyUser(null);
    setSpotifyPlaylists([]);
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
  };

  // Initiate Spotify OAuth Login Flow using client-side PKCE redirection or local server popup
  const handleConnectSpotify = async () => {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (isLocal) {
      // Local Server Popup Flow (exchanges code securely via backend)
      try {
        const origin = window.location.origin;
        const res = await fetch(`/api/auth/spotify/url?origin=${encodeURIComponent(origin)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to generate auth url");
        }

        const width = 500;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const authWindow = window.open(
          data.url,
          "spotify_auth_popup",
          `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no`
        );

        if (!authWindow) {
          alert("Please enable popups to connect to Spotify.");
        }
      } catch (err: any) {
        console.error("Local Spotify Auth initiation failed, falling back to PKCE:", err);
        runClientPKCEFlow();
      }
    } else {
      // GitHub Pages / Static Host PKCE Redirect Flow
      runClientPKCEFlow();
    }
  };

  const runClientPKCEFlow = async () => {
    try {
      const codeVerifier = generateRandomString(64);
      localStorage.setItem("spotify_code_verifier", codeVerifier);

      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      const scope = [
        "user-read-private",
        "user-read-email",
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-library-read",
        "user-top-read",
        "user-read-recently-played",
        "user-read-playback-state",
        "user-modify-playback-state"
      ].join(" ");

      const client_id = SPOTIFY_CLIENT_ID;
      const redirect_uri = window.location.origin + window.location.pathname;

      const authUrl = `https://accounts.spotify.com/authorize?` + new URLSearchParams({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
      }).toString();

      window.location.href = authUrl;
    } catch (err: any) {
      console.error("Spotify PKCE initiation failed:", err);
      alert(`Connection failed: ${err.message}`);
    }
  };

  // Load Liked Tracks directly from Spotify API
  const fetchSpotifyLikedSongs = async () => {
    const token = spotifyToken || localStorage.getItem("spotify_access_token");
    if (!token) return;
    try {
      const res = await fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const tracks = data.items.map((item: any) => mapSpotifyTrackToTrack(item.track));
        const likedPlaylist: Playlist = {
          id: "spotify-liked-songs",
          name: "Liked Songs",
          description: "Your favorite tracks saved on Spotify",
          tracks: tracks,
          isCustom: false,
        };
        setActivePlaylist(likedPlaylist);
        setActivePlaylistId("spotify-liked-songs");
        setActiveTab("explore");
      } else if (res.status === 401) {
        await handleSpotifyTokenRefresh();
      }
    } catch (e) {
      console.error("Failed to load Spotify liked songs:", e);
    }
  };

  // Load Curated Playlists from server API and Hydrate/Listen for Spotify Auth
  useEffect(() => {
    const fetchCurated = async () => {
      try {
        const res = await fetch("/api/playlists");
        if (res.ok) {
          const data = await res.json();
          if (data && data.playlists) {
            setCuratedPlaylists(data.playlists);
            if (data.playlists.length > 0) {
              setActivePlaylist(data.playlists[0]);
              setActivePlaylistId(data.playlists[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch playlists:", err);
      }
    };
    fetchCurated();

    // Recover User Custom Playlists
    try {
      const saved = localStorage.getItem("spotify_lite_user_playlists");
      if (saved) {
        setUserPlaylists(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }

    // Recover Spotify Tokens
    const savedToken = localStorage.getItem("spotify_access_token");
    const savedRefresh = localStorage.getItem("spotify_refresh_token");
    if (savedToken) {
      setSpotifyToken(savedToken);
      setSpotifyRefreshToken(savedRefresh);
      fetchSpotifyData(savedToken);
    }

    // Check for PKCE redirect code parameter
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      // Clean query string immediately
      window.history.replaceState({}, document.title, window.location.pathname);
      exchangeCodeForToken(code);
    }

    // Listen for Success Message from OAuth Popup (kept for legacy support if local backend is used)
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }
      if (event.data?.type === "SPOTIFY_AUTH_SUCCESS") {
        const { accessToken, refreshToken } = event.data.tokens;
        setSpotifyToken(accessToken);
        setSpotifyRefreshToken(refreshToken);
        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_refresh_token", refreshToken);
        fetchSpotifyData(accessToken);
      } else if (event.data?.type === "SPOTIFY_AUTH_FAILURE") {
        alert(`Spotify Sync failed: ${event.data.error || "Unknown Error"}`);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Save User Custom Playlists to localStorage
  const saveUserPlaylists = (updated: Playlist[]) => {
    setUserPlaylists(updated);
    try {
      localStorage.setItem("spotify_lite_user_playlists", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Timer interval for lyrics and seek synchronization
  useEffect(() => {
    let timerId: any = null;
    if (isPlaying) {
      timerId = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, duration]);

  // Synchronize volume slider with Spotify Web API Player
  useEffect(() => {
    const syncSpotifyVolume = async () => {
      const token = spotifyToken || localStorage.getItem("spotify_access_token");
      if (!token) return;
      try {
        await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error("Failed to sync volume with Spotify API:", e);
      }
    };

    // Debounce to prevent hitting API rate limits during slider drag
    const timer = setTimeout(() => {
      syncSpotifyVolume();
    }, 250);

    return () => clearTimeout(timer);
  }, [volume, spotifyToken]);

  // Handle selecting a playlist from sidebar
  const handleSelectPlaylist = async (id: string, isCustom: boolean, isSpotifyRemote?: boolean) => {
    if (isSpotifyRemote) {
      const pl = spotifyPlaylists.find((p) => p.id === id);
      if (pl) {
        if (pl.tracks.length === 0 && spotifyToken) {
          try {
            const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
              headers: { Authorization: `Bearer ${spotifyToken}` },
            });
            if (tracksRes.ok) {
              const tracksData = await tracksRes.json();
              const mappedTracks = tracksData.items
                .filter((item: any) => item.track)
                .map((item: any) => mapSpotifyTrackToTrack(item.track));

              const updatedPl = { ...pl, tracks: mappedTracks };
              setSpotifyPlaylists((prev) => prev.map((p) => p.id === id ? updatedPl : p));
              setActivePlaylist(updatedPl);
              setActivePlaylistId(id);
            } else if (tracksRes.status === 401) {
              await handleSpotifyTokenRefresh();
            }
          } catch (e) {
            console.error("Failed to fetch Spotify playlist tracks:", e);
          }
        } else {
          setActivePlaylist(pl);
          setActivePlaylistId(id);
        }
      }
    } else if (isCustom) {
      const pl = userPlaylists.find((p) => p.id === id);
      if (pl) {
        setActivePlaylist(pl);
        setActivePlaylistId(id);
      }
    } else {
      const pl = curatedPlaylists.find((p) => p.id === id);
      if (pl) {
        setActivePlaylist(pl);
        setActivePlaylistId(id);
      }
    }
    setActiveTab("explore");
  };

  // Create a new empty custom playlist
  const handleCreatePlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: `custom-pl-${Date.now()}`,
      name,
      description: "My custom track compilation",
      tracks: [],
      isCustom: true,
    };
    const updated = [...userPlaylists, newPlaylist];
    saveUserPlaylists(updated);
  };

  // Load an external Spotify asset directly (from paste bar)
  const handleLoadExternalUrl = (type: "track" | "playlist" | "album" | "artist", id: string) => {
    setEmbedType(type);
    setEmbedId(id);
    setIsPlaying(true);
    setCurrentTime(0);

    if (type === "track") {
      // Mock active track description for lyrics/visualizer fallback
      setCurrentTrack({
        id,
        title: "Pasted Spotify Link",
        artist: "Unknown Artist",
        album: "External Spotify Frame",
        spotifyId: id,
        spotifyUri: `https://open.spotify.com/track/${id}`,
        duration: "3:00",
      });
      setDuration(180);
    } else {
      // If a full playlist/album is pasted, we play the embed player directly
      setCurrentTrack({
        id,
        title: `Pasted Spotify ${type}`,
        artist: "Continuous Playback",
        album: "External Media",
        spotifyId: id,
        spotifyUri: `https://open.spotify.com/${type}/${id}`,
      });
      setDuration(600); // larger time frame
    }
  };

  // Trigger track playing
  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsLiked(false);

    if (track.url) {
      // Play natively via HTML5 Audio
      setEmbedId("");
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.load();
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((e) => {
            console.error("Native playback failed:", e);
            setIsPlaying(false);
          });
      }
    } else {
      // Play via Spotify Embed Iframe
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setEmbedType("track");
      setEmbedId(track.spotifyId);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(parseDurationToSeconds(track.duration));
    }
  };

  // Append track to a custom user playlist
  const handleAddToPlaylist = (track: Track, playlistId: string) => {
    const updated = userPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        // Prevent duplicate songs in custom playlists
        if (pl.tracks.some((t) => t.spotifyId === track.spotifyId)) return pl;
        return {
          ...pl,
          tracks: [...pl.tracks, track],
        };
      }
      return pl;
    });
    saveUserPlaylists(updated);

    // Update active view if it happens to be the updated playlist
    if (activePlaylistId === playlistId) {
      const activePl = updated.find((p) => p.id === playlistId);
      if (activePl) setActivePlaylist(activePl);
    }
  };

  // Skip tracks forward
  const handleSkipForward = () => {
    if (!activePlaylist || !currentTrack) return;
    const tracks = activePlaylist.tracks;
    const currentIndex = tracks.findIndex((t) => t.spotifyId === currentTrack.spotifyId);
    if (currentIndex !== -1 && currentIndex < tracks.length - 1) {
      handlePlayTrack(tracks[currentIndex + 1]);
    } else {
      // Loop to beginning
      if (tracks.length > 0) handlePlayTrack(tracks[0]);
    }
  };

  // Skip tracks backward
  const handleSkipBackward = () => {
    if (!activePlaylist || !currentTrack) return;
    const tracks = activePlaylist.tracks;
    const currentIndex = tracks.findIndex((t) => t.spotifyId === currentTrack.spotifyId);
    if (currentIndex > 0) {
      handlePlayTrack(tracks[currentIndex - 1]);
    } else {
      // Loop to end
      if (tracks.length > 0) handlePlayTrack(tracks[tracks.length - 1]);
    }
  };

  // Play a freshly generated AI playlist
  const handleCuratedPlaylistSelect = (tracks: Track[], name: string, desc: string) => {
    const freshPlaylist: Playlist = {
      id: `ai-temp-${Date.now()}`,
      name,
      description: desc,
      tracks,
    };
    setActivePlaylist(freshPlaylist);
    setActivePlaylistId(freshPlaylist.id);
    setActiveTab("explore");

    // Play the first track immediately
    if (tracks.length > 0) {
      handlePlayTrack(tracks[0]);
    }
  };

  // Toggle audio volume mute state
  const handleVolumeToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      const newVol = prevVolume || 80;
      setVolume(newVol);
      if (audioRef.current) audioRef.current.volume = newVol / 100;
    }
  };

  // Play/pause toggles
  const handlePlayToggle = () => {
    if (!currentTrack) return;

    if (currentTrack.url && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((e) => console.error(e));
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeekChange = (value: number) => {
    setCurrentTime(value);
    if (currentTrack?.url && audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && currentTrack?.url) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (audioRef.current && currentTrack?.url) {
      setDuration(audioRef.current.duration || 180);
    }
  };

  const handleTrackEnded = () => {
    handleSkipForward();
  };

  const isDark = portalDarkMode;
  const bgMain = isDark ? "#06000f" : "#f1f3f9";
  const bgPanel = isDark ? "#0d0221" : "#ffffff";
  const textMain = isDark ? "#e2d9f3" : "#1e293b";
  const textMuted = isDark ? "rgba(167, 139, 250, 0.6)" : "#64748b";

  return (
    <div
      id="spotify-player-root"
      className="w-full h-[calc(100vh-140px)] bg-charcoal-vibe flex flex-col overflow-hidden text-cream-vibe font-sans antialiased rounded-2xl border border-white/[0.04]"
      style={{
        '--theme-accent': themeColor === 'purple' ? '#8b5cf6' :
                          themeColor === 'cyan' ? '#06b6d4' :
                          themeColor === 'pink' ? '#ec4899' :
                          themeColor === 'emerald' ? '#10b981' :
                          themeColor === 'amber' ? '#f59e0b' : '#8b5cf6',
        '--theme-accent-dark': themeColor === 'purple' ? '#6d28d9' :
                               themeColor === 'cyan' ? '#0891b2' :
                               themeColor === 'pink' ? '#db2777' :
                               themeColor === 'emerald' ? '#059669' :
                               themeColor === 'amber' ? '#d97706' : '#6d28d9',
        '--theme-bg-main': bgMain,
        '--theme-bg-panel': bgPanel,
        '--theme-text-main': textMain,
        '--theme-text-muted': textMuted,
      } as React.CSSProperties}
    >
      {/* Upper Content Section (Sidebar + Main panel + Synced Lyrics Right column) */}
      <div className="flex-1 flex min-h-0 relative">
        <Sidebar
          curatedPlaylists={curatedPlaylists}
          userPlaylists={userPlaylists}
          activePlaylistId={activePlaylistId}
          onSelectPlaylist={handleSelectPlaylist}
          onCreatePlaylist={handleCreatePlaylist}
          onLoadExternalUrl={handleLoadExternalUrl}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          spotifyToken={spotifyToken}
          spotifyUser={spotifyUser}
          spotifyPlaylists={spotifyPlaylists}
          onConnectSpotify={handleConnectSpotify}
          onDisconnectSpotify={handleDisconnectSpotify}
          onFetchLikedSongs={fetchSpotifyLikedSongs}
        />

        {/* Dashboard/Search panel */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          <PlayerDashboard
            activePlaylist={activePlaylist}
            currentTrack={currentTrack}
            onPlayTrack={handlePlayTrack}
            onAddToPlaylist={handleAddToPlaylist}
            userPlaylists={userPlaylists}
            activeTab={activeTab}
            onCuratedPlaylistSelect={handleCuratedPlaylistSelect}
            spotifyToken={spotifyToken}
          />
        </main>

        {/* Right Panel: Embedded Player, Visualizer & Lyrics Display (Dynamic toggle) */}
        {showLyricsPanel && (
          <aside className="w-80 hidden lg:flex flex-col border-l border-white/5 bg-[#080808] p-4 space-y-4 shrink-0 overflow-y-auto scrollbar-none select-none">
            {/* Embedded Spotify Iframe Container */}
            <div className="shrink-0">
              <EmbeddedSpotify type={embedType} id={embedId} />
            </div>

            {/* Audio Visualizer */}
            <div className="shrink-0 h-20">
              <AudioVisualizer
                isPlaying={isPlaying}
                color={
                  themeColor === "cyan" ? "#06b6d4" :
                  themeColor === "pink" ? "#ec4899" :
                  themeColor === "emerald" ? "#10b981" :
                  themeColor === "amber" ? "#f59e0b" : "#8b5cf6"
                }
              />
            </div>

            {/* Timed scrolling lyrics */}
            <div className="flex-1 min-h-[250px]">
              <LyricsDisplay
                title={currentTrack?.title || ""}
                artist={currentTrack?.artist || ""}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Persistent Bottom Playback bar */}
      <footer className="h-24 bg-[#0a0a0a] border-t border-white/10 px-8 flex items-center justify-between shrink-0 select-none">
        {/* Track Detail (Left Area) */}
        <div className="flex items-center gap-4 w-1/4 min-w-[150px]">
          {currentTrack ? (
            <>
              {currentTrack.imageUrl ? (
                <img
                  src={currentTrack.imageUrl}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded bg-white/5 object-cover shadow-md shrink-0 border border-white/5"
                />
              ) : (
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded flex items-center justify-center text-[#c5a059] shrink-0 font-bold">
                  •••
                </div>
              )}
              <div className="min-w-0 flex flex-col text-left">
                <h4 className="text-sm font-medium truncate text-white">{currentTrack.title}</h4>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <button
                id="toggle-like-btn"
                onClick={() => setIsLiked(!isLiked)}
                className={`p-1 hover:bg-white/5 rounded-full transition ml-1 shrink-0 ${
                  isLiked ? "text-[#c5a059] animate-pulse" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-[#c5a059]" : ""}`} />
              </button>
            </>
          ) : (
            <div className="text-xs text-zinc-500 italic">No track loaded</div>
          )}
        </div>

        {/* Playback Controls & Progress Seek slider (Center Area) */}
        <div className="flex flex-col items-center gap-2.5 flex-1 max-w-xl">
          <div className="flex items-center gap-8">
            <button
              id="previous-track-btn"
              onClick={handleSkipBackward}
              disabled={!activePlaylist}
              className="opacity-40 hover:opacity-100 disabled:opacity-15 disabled:pointer-events-none transition"
            >
              <SkipBack className="w-4 h-4 fill-current text-white" />
            </button>
            <button
              id="playback-play-toggle-btn"
              onClick={handlePlayToggle}
              disabled={!currentTrack}
              className="w-12 h-12 rounded-full border border-[#c5a059] flex items-center justify-center text-[#c5a059] hover:bg-[#c5a059] hover:text-black transition shadow-md shrink-0"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
            </button>
            <button
              id="next-track-btn"
              onClick={handleSkipForward}
              disabled={!activePlaylist}
              className="opacity-40 hover:opacity-100 disabled:opacity-15 disabled:pointer-events-none transition"
            >
              <SkipForward className="w-4 h-4 fill-current text-white" />
            </button>
          </div>

          {/* Seek Bar */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] opacity-40 tabular-nums w-8 text-right">
              {formatSecondsToTime(currentTime)}
            </span>
            <div className="flex-1 relative group py-2">
              <input
                id="seek-slider"
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                disabled={!currentTrack}
                onChange={(e) => handleSeekChange(parseInt(e.target.value, 10))}
                className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer focus:outline-none accent-[#c5a059] transition rounded-full"
              />
            </div>
            <span className="text-[10px] opacity-40 tabular-nums w-8 text-left">
              {formatSecondsToTime(duration)}
            </span>
          </div>
        </div>

        {/* Options & volume Control (Right Area) */}
        <div className="flex items-center justify-end gap-6 w-1/4">
          {/* Mobile indicator that triggers right columns if needed */}
          <button
            id="toggle-lyrics-panel-btn"
            onClick={() => setShowLyricsPanel(!showLyricsPanel)}
            className={`p-2 hover:bg-white/5 rounded-lg transition ${
              showLyricsPanel ? "text-[#c5a059] bg-[#c5a059]/10" : "text-zinc-400 hover:text-white"
            }`}
            title="Toggle Visualizer & Lyrics"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Volume bars */}
          <div className="flex items-center gap-2 w-32">
            <button
              id="toggle-mute-btn"
              onClick={handleVolumeToggle}
              className="text-zinc-400 hover:text-white transition p-1"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              id="volume-slider"
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="flex-1 h-[2px] bg-white/10 rounded-full appearance-none cursor-pointer accent-[#c5a059] transition"
            />
          </div>
        </div>
      </footer>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={handleTrackEnded}
      />
    </div>
  );
}
