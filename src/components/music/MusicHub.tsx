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
  Heart, 
  Tv,
  ListMusic,
  X
} from "lucide-react";
import { Track, Playlist } from "./types";
import Sidebar from "./Sidebar";
import PlayerDashboard from "./PlayerDashboard";
import AudioVisualizer from "./AudioVisualizer";
import LyricsDisplay from "./LyricsDisplay";

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

interface MusicHubProps {
  portalDarkMode: boolean;
  themeColor: string;
}

export default function MusicHub({ portalDarkMode, themeColor }: MusicHubProps) {
  // Playlists and Library States
  const [curatedPlaylists, setCuratedPlaylists] = useState<Playlist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string>("");

  // Playback Control States
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [embedType, setEmbedType] = useState<"track" | "playlist" | "album" | "artist">("track");
  const [embedId, setEmbedId] = useState<string>("");

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [prevVolume, setPrevVolume] = useState<number>(80);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  const previewModeRef = useRef<boolean>(false);
  useEffect(() => {
    previewModeRef.current = previewMode;
  }, [previewMode]);

  // Tab coordinates
  const [activeTab, setActiveTab] = useState<"explore" | "curator" | "spotify">("explore");

  // Secondary layout toggles
  const [showLyricsPanel, setShowLyricsPanel] = useState<boolean>(true);
  const [rightPanelTab, setRightPanelTab] = useState<"lyrics" | "queue">("lyrics");
  const [queue, setQueue] = useState<Track[]>([]);
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
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string | null>(null);
  const spotifyPlayerRef = useRef<any>(null);

  const [likedSongsStatus, setLikedSongsStatus] = useState<{ loaded: number; total: number; loading: boolean }>({ loaded: 0, total: 0, loading: false });

  // Map theme color to visualizer color
  const visualizerColor = useMemo(() => {
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

  // Progressive background fetch for Liked Songs
  const startProgressiveLikedSongsFetch = async (token: string, existingTracks: Track[] = []) => {
    if (likedSongsStatus.loading && existingTracks.length === 0) return;

    setLikedSongsStatus({ loaded: existingTracks.length, total: 0, loading: true });

    try {
      const firstPageUrl = `https://api.spotify.com/v1/me/tracks?limit=50&offset=${existingTracks.length}`;
      const res = await fetch(firstPageUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          await handleSpotifyTokenRefresh();
        }
        setLikedSongsStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const data = await res.json();
      const totalSongs = data.total;
      
      const firstPageTracks = (data.items || [])
        .filter((item: any) => item?.track)
        .map((item: any) => mapSpotifyTrackToTrack(item.track));

      let accumulatedTracks = [...existingTracks, ...firstPageTracks];
      setLikedSongsStatus({ loaded: accumulatedTracks.length, total: totalSongs, loading: accumulatedTracks.length < totalSongs });

      const updatePlaylistState = (tracks: Track[]) => {
        try {
          localStorage.setItem("spotify_liked_songs_tracks", JSON.stringify(tracks));
          localStorage.setItem("spotify_liked_songs_total", String(totalSongs));
        } catch (e) {
          console.error("Failed to write liked songs cache:", e);
        }
        
        setSpotifyPlaylists((prev) =>
          prev.map((p) => {
            if (p.id === "spotify-liked-songs") {
              return { ...p, tracks };
            }
            return p;
          })
        );
        setActivePlaylist((prevActive) => {
          if (prevActive && prevActive.id === "spotify-liked-songs") {
            return { ...prevActive, tracks };
          }
          return prevActive;
        });
      };

      updatePlaylistState(accumulatedTracks);

      let nextUrl = data.next;
      while (nextUrl) {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const pageRes = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!pageRes.ok) {
          if (pageRes.status === 401) {
            await handleSpotifyTokenRefresh();
          }
          break;
        }

        const pageData = await pageRes.json();
        const pageTracks = (pageData.items || [])
          .filter((item: any) => item?.track)
          .map((item: any) => mapSpotifyTrackToTrack(item.track));

        accumulatedTracks = [...accumulatedTracks, ...pageTracks];
        setLikedSongsStatus({
          loaded: accumulatedTracks.length,
          total: totalSongs,
          loading: accumulatedTracks.length < totalSongs,
        });

        updatePlaylistState(accumulatedTracks);
        nextUrl = pageData.next;
      }

      setLikedSongsStatus({
        loaded: accumulatedTracks.length,
        total: totalSongs,
        loading: false,
      });

    } catch (err) {
      console.error("Progressive fetch of Liked Songs failed:", err);
      setLikedSongsStatus(prev => ({ ...prev, loading: false }));
    }
  };

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

      // Pagination loop to fetch ALL user playlists (up to 500)
      let playlists: Playlist[] = [];
      
      let cachedTracks: Track[] = [];
      let cachedTotal = 0;
      try {
        const stored = localStorage.getItem("spotify_liked_songs_tracks");
        const storedTotalStr = localStorage.getItem("spotify_liked_songs_total");
        if (stored) {
          cachedTracks = JSON.parse(stored);
        }
        if (storedTotalStr) {
          cachedTotal = parseInt(storedTotalStr, 10);
        }
      } catch (e) {
        console.error("Failed to parse cached liked songs:", e);
      }

      setLikedSongsStatus({
        loaded: cachedTracks.length,
        total: cachedTotal || cachedTracks.length,
        loading: false,
      });

      // Prepend virtual Liked Songs playlist
      const likedSongsPlaylist: Playlist = {
        id: "spotify-liked-songs",
        name: "Liked Songs",
        description: "Your favorite tracks saved on Spotify",
        tracks: cachedTracks,
        isCustom: false,
        imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
      };
      playlists.push(likedSongsPlaylist);

      let nextUrl: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";
      let pagesFetched = 0;

      while (nextUrl && pagesFetched < 10) {
        const plRes = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!plRes.ok) {
          if (plRes.status === 401) {
            await handleSpotifyTokenRefresh();
          }
          break;
        }
        const plData = await plRes.json();
        if (plData.items) {
          const pagePlaylists = plData.items
            .filter((item: any) => item !== null)
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description || `Playlist by ${item.owner?.display_name || "Spotify User"}`,
              tracks: [], // lazy loaded
              isCustom: false,
              imageUrl: item.images?.[0]?.url,
            }));
          playlists = [...playlists, ...pagePlaylists];
        }
        nextUrl = plData.next;
        pagesFetched++;
      }
      setSpotifyPlaylists(playlists);
    } catch (err: any) {
      console.error("Failed to load Spotify details:", err);
      setSpotifyError(err.message);
    }
  };

  // Refresh token using client-side PKCE flow directly (completely serverless for GitHub Pages)
  const handleSpotifyTokenRefresh = async () => {
    const refresh = localStorage.getItem("spotify_refresh_token");
    if (!refresh) return;

    try {
      const clientId = "6238dcf567664f328bde1570c68f9eae";
      const payload = new URLSearchParams({
        client_id: clientId,
        grant_type: "refresh_token",
        refresh_token: refresh,
      });

      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      if (res.ok) {
        const data = await res.json();
        const nextToken = data.access_token;
        const nextRefresh = data.refresh_token || refresh;

        setSpotifyToken(nextToken);
        localStorage.setItem("spotify_access_token", nextToken);
        setSpotifyRefreshToken(nextRefresh);
        localStorage.setItem("spotify_refresh_token", nextRefresh);

        fetchSpotifyData(nextToken);
      } else {
        handleDisconnectSpotify();
      }
    } catch (e) {
      console.error("Failed to refresh Spotify token:", e);
      handleDisconnectSpotify();
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

  // Initiate Spotify OAuth Login Flow (Direct Provider URL in Popup)
  const handleConnectSpotify = async () => {
    try {
      const origin = window.location.origin;
      const res = await fetch(`/api/auth/spotify/url?origin=${encodeURIComponent(origin)}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.unconfigured) {
          alert("Spotify API credentials are not configured on the server yet.\n\nPlease define SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the Secrets panel inside your AI Studio Settings menu.");
          return;
        }
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
      console.error("Spotify Auth initiation failed:", err);
      alert(`Connection failed: ${err.message}`);
    }
  };

  // Load Liked Tracks directly from Spotify API
  const fetchSpotifyLikedSongs = async () => {
    const token = spotifyToken || localStorage.getItem("spotify_access_token");
    if (!token) return;
    
    setActivePlaylistId("spotify-liked-songs");
    const pl = spotifyPlaylists.find((p) => p.id === "spotify-liked-songs");
    if (pl) {
      setActivePlaylist(pl);
    } else {
      const fallbackPl: Playlist = {
        id: "spotify-liked-songs",
        name: "Liked Songs",
        description: "Your favorite tracks saved on Spotify",
        tracks: [],
        isCustom: false,
      };
      setActivePlaylist(fallbackPl);
    }
    setActiveTab("explore");

    const currentTracks = pl?.tracks || [];
    if (currentTracks.length === 0 && !likedSongsStatus.loading) {
      startProgressiveLikedSongsFetch(token);
    }
  };

  useEffect(() => {
    (window as any).triggerSpotifyLikedSongsResync = () => {
      const token = spotifyToken || localStorage.getItem("spotify_access_token");
      if (token) {
        startProgressiveLikedSongsFetch(token, []);
      }
    };
    return () => {
      delete (window as any).triggerSpotifyLikedSongsResync;
    };
  }, [spotifyToken]);

  // Initialize Spotify Web Playback SDK Player when a token is available
  useEffect(() => {
    if (!spotifyToken) {
      if (spotifyPlayerRef.current) {
        spotifyPlayerRef.current.disconnect();
        spotifyPlayerRef.current = null;
      }
      setSpotifyDeviceId(null);
      return;
    }

    const scriptId = "spotify-player-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      if (spotifyPlayerRef.current) return;

      const player = new (window as any).Spotify.Player({
        name: "Lumina Studio Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(spotifyToken);
        },
        volume: volume / 100,
      });

      spotifyPlayerRef.current = player;

      player.addListener("initialization_error", ({ message }: { message: string }) => {
        console.error("Spotify Web Playback SDK initialization error:", message);
      });
      player.addListener("authentication_error", ({ message }: { message: string }) => {
        console.error("Spotify Web Playback SDK authentication error:", message);
        handleSpotifyTokenRefresh();
      });
      player.addListener("account_error", ({ message }: { message: string }) => {
        console.warn("Spotify Web Playback SDK account type warning (requires Spotify Premium):", message);
      });
      player.addListener("playback_error", ({ message }: { message: string }) => {
        console.error("Spotify Web Playback SDK playback failure:", message);
      });

      player.addListener("player_state_changed", (state: any) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setDuration(Math.floor(state.duration / 1000));
        const posSec = Math.floor(state.position / 1000);
        setCurrentTime(posSec);

        if (!state.paused && previewModeRef.current && posSec >= 30) {
          player.pause().catch((err: any) => console.debug("Auto-paused due to preview mode:", err));
        }
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Spotify Web Playback SDK is connected. Device ID:", device_id);
        setSpotifyDeviceId(device_id);

        fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false,
          }),
        }).catch((err) => console.debug("Auto-transfer session attempt:", err));
      });

      player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("Spotify Web Playback device has gone offline:", device_id);
        setSpotifyDeviceId(null);
      });

      player.connect();
    };

    if ((window as any).Spotify && !spotifyPlayerRef.current) {
      (window as any).onSpotifyWebPlaybackSDKReady();
    }

    return () => {
    };
  }, [spotifyToken]);

  // Handle local Web SDK player volume updates
  useEffect(() => {
    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.setVolume(volume / 100).catch((err: any) => {
        console.debug("Failed to set Spotify Web Playback volume:", err);
      });
    }
  }, [volume]);

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
    if (savedToken && savedToken !== "null" && savedToken !== "undefined") {
      setSpotifyToken(savedToken);
      setSpotifyRefreshToken(savedRefresh && savedRefresh !== "null" && savedRefresh !== "undefined" ? savedRefresh : null);
      fetchSpotifyData(savedToken);
    }

    // Listen for Success Message from OAuth Popup
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
          const nextTime = prev + 1;

          // If in preview mode, cap play time at 30 seconds
          if (previewMode && nextTime >= 30) {
            setIsPlaying(false);
            if (spotifyPlayerRef.current) {
              spotifyPlayerRef.current.pause().catch((err: any) => console.debug("SDK pause error:", err));
            } else if (spotifyToken) {
              const controlUrl = spotifyDeviceId
                ? `https://api.spotify.com/v1/me/player/pause?device_id=${spotifyDeviceId}`
                : `https://api.spotify.com/v1/me/player/pause`;
              fetch(controlUrl, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${spotifyToken}`,
                  "Content-Type": "application/json",
                },
              }).catch((err) => console.debug("Spotify remote pause attempt:", err));
            }
            return 30; // Cap at 30
          }

          if (nextTime >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, duration, previewMode, spotifyToken, spotifyDeviceId]);

  // Handle selecting a playlist from sidebar
  const handleSelectPlaylist = async (id: string, isCustom: boolean, isSpotifyRemote?: boolean) => {
    if (isSpotifyRemote) {
      const pl = spotifyPlaylists.find((p) => p.id === id);
      if (pl) {
        if (pl.tracks.length === 0 && spotifyToken) {
          try {
            if (id === "spotify-liked-songs") {
              setActivePlaylist(pl);
              setActivePlaylistId(id);
              startProgressiveLikedSongsFetch(spotifyToken);
            } else {
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
  const handleCreatePlaylist = (name: string, description?: string, tracks?: Track[]) => {
    const newPlaylist: Playlist = {
      id: `custom-pl-${Date.now()}`,
      name,
      description: description || "My custom track compilation",
      tracks: tracks || [],
      isCustom: true,
    };
    const updated = [...userPlaylists, newPlaylist];
    saveUserPlaylists(updated);
    setActivePlaylist(newPlaylist);
    setActivePlaylistId(newPlaylist.id);
    setActiveTab("explore");
  };

  // Load an external Spotify asset directly (from paste bar)
  const handleLoadExternalUrl = async (type: "track" | "playlist" | "album" | "artist", id: string) => {
    setEmbedType(type);
    setEmbedId(id);
    setIsPlaying(true);
    setCurrentTime(0);

    const token = spotifyToken || localStorage.getItem("spotify_access_token");

    if (token) {
      try {
        if (type === "track") {
          const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const trackData = await res.json();
            const durationMinSec = trackData.duration_ms
              ? `${Math.floor(trackData.duration_ms / 60000)}:${String(Math.floor((trackData.duration_ms % 60000) / 1000)).padStart(2, '0')}`
              : "3:00";
            const fetchedTrack: Track = {
              id: trackData.id,
              title: trackData.name,
              artist: trackData.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
              album: trackData.album?.name || "Single",
              spotifyId: trackData.id,
              spotifyUri: trackData.uri || `spotify:track:${trackData.id}`,
              imageUrl: trackData.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
              duration: durationMinSec,
            };
            setCurrentTrack(fetchedTrack);
            setDuration(parseDurationToSeconds(durationMinSec));
            return;
          }
        } else if (type === "playlist") {
          const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (playlistRes.ok) {
            const playlistData = await playlistRes.json();
            const playlistName = playlistData.name || "Custom Playlist";
            
            let tracks: Track[] = [];
            let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100`;
            let pagesFetched = 0;
            
            while (nextUrl && pagesFetched < 15) {
              const tracksRes = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!tracksRes.ok) break;
              const data = await tracksRes.json();
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
                tracks = [...tracks, ...pageTracks];
              }
              nextUrl = data.next;
              pagesFetched++;
            }

            if (tracks.length > 0) {
              const newPlaylist: Playlist = {
                id: `spotify-import-${id}`,
                name: playlistName,
                description: playlistData.description || `Imported Spotify playlist.`,
                tracks,
                isCustom: true,
              };
              
              if (!userPlaylists.some(pl => pl.id === newPlaylist.id)) {
                const updated = [...userPlaylists, newPlaylist];
                saveUserPlaylists(updated);
              }
              
              setActivePlaylist(newPlaylist);
              setActivePlaylistId(newPlaylist.id);
              setCurrentTrack(tracks[0]);
              setEmbedType("track");
              setEmbedId(tracks[0].spotifyId);
              setDuration(parseDurationToSeconds(tracks[0].duration));
              setActiveTab("explore");
              return;
            }
          }
        } else if (type === "album") {
          const albumRes = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (albumRes.ok) {
            const albumData = await albumRes.json();
            const albumName = albumData.name || "Custom Album";
            const albumImg = albumData.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300";
            
            if (albumData.tracks && albumData.tracks.items) {
              const tracks = albumData.tracks.items.map((t: any) => {
                const durationMinSec = t.duration_ms
                  ? `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`
                  : "3:00";
                return {
                  id: t.id,
                  title: t.name,
                  artist: t.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
                  album: albumName,
                  spotifyId: t.id,
                  spotifyUri: t.uri || `spotify:track:${t.id}`,
                  imageUrl: albumImg,
                  duration: durationMinSec,
                };
              });

              const newPlaylist: Playlist = {
                id: `spotify-album-import-${id}`,
                name: albumName,
                description: `Imported Spotify album by ${albumData.artists?.[0]?.name || "Unknown Artist"}.`,
                tracks,
                isCustom: true,
              };
              
              if (!userPlaylists.some(pl => pl.id === newPlaylist.id)) {
                const updated = [...userPlaylists, newPlaylist];
                saveUserPlaylists(updated);
              }
              
              setActivePlaylist(newPlaylist);
              setActivePlaylistId(newPlaylist.id);
              setCurrentTrack(tracks[0]);
              setEmbedType("track");
              setEmbedId(tracks[0].spotifyId);
              setDuration(parseDurationToSeconds(tracks[0].duration));
              setActiveTab("explore");
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load rich details for external Spotify asset:", err);
      }
    }

    // Fallback/Non-authenticated logic (plays iframe embed directly)
    if (type === "track") {
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
      setCurrentTrack({
        id,
        title: `Pasted Spotify ${type}`,
        artist: "Continuous Playback",
        album: "External Media",
        spotifyId: id,
        spotifyUri: `https://open.spotify.com/${type}/${id}`,
      });
      setDuration(600);
    }
  };

  // Trigger track playing
  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setEmbedType("track");
    setEmbedId(track.spotifyId);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(parseDurationToSeconds(track.duration));
    setIsLiked(false);
    setShowLyricsPanel(true);

    if (spotifyToken) {
      const playUrl = spotifyDeviceId
        ? `https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`
        : "https://api.spotify.com/v1/me/player/play";
      fetch(playUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [track.spotifyUri || `spotify:track:${track.spotifyId}`],
        }),
      }).catch((err) => console.debug("Spotify remote play attempt:", err));
    }
  };

  // Append track to a custom user playlist
  const handleAddToPlaylist = (track: Track, playlistId: string) => {
    const updated = userPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        if (pl.tracks.some((t) => t.spotifyId === track.spotifyId)) return pl;
        return {
          ...pl,
          tracks: [...pl.tracks, track],
        };
      }
      return pl;
    });
    saveUserPlaylists(updated);

    if (activePlaylistId === playlistId) {
      const activePl = updated.find((p) => p.id === playlistId);
      if (activePl) setActivePlaylist(activePl);
    }
  };

  // Skip tracks forward
  const handleSkipForward = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((prev) => prev.slice(1));
      handlePlayTrack(nextTrack);
      return;
    }
    if (!activePlaylist || !currentTrack) return;
    const tracks = activePlaylist.tracks;
    const currentIndex = tracks.findIndex((t) => t.spotifyId === currentTrack.spotifyId);
    if (currentIndex !== -1 && currentIndex < tracks.length - 1) {
      handlePlayTrack(tracks[currentIndex + 1]);
    } else {
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

    if (tracks.length > 0) {
      handlePlayTrack(tracks[0]);
    }
  };

  // Toggle audio volume mute state
  const handleVolumeToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 80);
    }
  };

  // Play/pause simulated state toggles
  const handlePlayToggle = () => {
    if (currentTrack) {
      const nextPlayingState = !isPlaying;
      setIsPlaying(nextPlayingState);

      if (spotifyToken) {
        const endpoint = nextPlayingState ? "play" : "pause";
        const controlUrl = spotifyDeviceId
          ? `https://api.spotify.com/v1/me/player/${endpoint}?device_id=${spotifyDeviceId}`
          : `https://api.spotify.com/v1/me/player/${endpoint}`;
        fetch(controlUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
            "Content-Type": "application/json",
          },
        }).catch((err) => console.debug(`Spotify remote ${endpoint} attempt:`, err));
      }
    }
  };

  // Synchronize volume change to active Spotify device (with debouncing)
  useEffect(() => {
    if (!spotifyToken) return;
    
    const controller = new AbortController();
    const updateDeviceVolume = async () => {
      try {
        const volumeUrl = spotifyDeviceId
          ? `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}&device_id=${spotifyDeviceId}`
          : `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`;
        await fetch(volumeUrl, {
          method: "PUT",
          headers: { 
            Authorization: `Bearer ${spotifyToken}`,
            "Content-Type": "application/json"
          },
          signal: controller.signal,
        });
      } catch (err) {
        console.debug("Spotify live volume sync:", err);
      }
    };

    const timer = setTimeout(updateDeviceVolume, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [volume, spotifyToken, spotifyDeviceId]);

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    setRightPanelTab("queue");
  };

  return (
    <div id="music-hub-container" className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#0c041a] via-[#04020a] to-[#010103] relative text-[#e0dcd0] font-sans antialiased">
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
            onAddToQueue={handleAddToQueue}
            spotifyToken={spotifyToken}
            spotifyPlaylists={spotifyPlaylists}
            onCreatePlaylist={handleCreatePlaylist}
            likedSongsStatus={likedSongsStatus}
          />
        </main>

        {/* Right Panel: Embedded Player, Visualizer & Synced Lyrics / Queue */}
        {showLyricsPanel && (
          <aside className="w-80 flex flex-col border-l border-[#8b5cf6]/15 bg-[#06030d]/90 backdrop-blur-md p-4 space-y-4 shrink-0 overflow-y-auto scrollbar-none select-none fixed lg:relative right-0 top-0 bottom-24 lg:bottom-0 h-[calc(100vh-6rem)] lg:h-auto z-40 shadow-2xl lg:shadow-none animate-fade-in">
            {/* Mobile Close Button Header */}
            <div className="flex items-center justify-between lg:hidden border-b border-white/10 pb-3 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#8b5cf6] font-mono">Player Console</span>
              <button
                onClick={() => setShowLyricsPanel(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tab Selector: Lyrics vs. Queue */}
            <div className="flex bg-[#0a0518] p-1 rounded-xl border border-white/5 shrink-0 relative z-10">
              <button
                onClick={() => setRightPanelTab("lyrics")}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
                  rightPanelTab === "lyrics"
                    ? "bg-[#8b5cf6] text-white shadow-md font-bold shadow-[#8b5cf6]/25"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Lyrics
              </button>
              <button
                onClick={() => setRightPanelTab("queue")}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  rightPanelTab === "queue"
                    ? "bg-[#8b5cf6] text-white shadow-md font-bold shadow-[#8b5cf6]/25"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>Queue</span>
                {queue.length > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                    rightPanelTab === "queue" ? "bg-black text-[#8b5cf6]" : "bg-white/10 text-zinc-300"
                  }`}>
                    {queue.length}
                  </span>
                )}
              </button>
            </div>

            {/* Spinning Vinyl Disc */}
            {currentTrack && (
              <div className="flex flex-col items-center justify-center p-2 shrink-0 select-none">
                <div className="relative group my-2 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full bg-black/60 border border-white/5 flex items-center justify-center relative shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500">
                    {/* Grooves */}
                    <div className="absolute inset-1 border border-white/5 rounded-full" />
                    <div className="absolute inset-3 border border-white/5 rounded-full" />
                    <div className="absolute inset-6 border border-white/5 rounded-full" />
                    <div className="absolute inset-10 border border-white/5 rounded-full" />
                    <div className="absolute inset-15 border border-white/5 rounded-full" />

                    <div className={`w-20 h-20 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform duration-1000 ${
                      isPlaying ? "animate-spin-slow" : ""
                    }`}>
                      <img
                        src={currentTrack.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80"}
                        alt="Vinyl Cover"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                    <div className="absolute w-4 h-4 rounded-full bg-[#0d0a1b] border-2 border-black/80 flex items-center justify-center" />
                  </div>

                  {/* Needle Arm */}
                  <div
                    className="absolute top-[-10px] right-[25px] w-10 h-24 origin-top-left transition-transform duration-700 pointer-events-none animate-needle-arm"
                    style={{
                      transform: isPlaying ? "rotate(18deg)" : "rotate(-12deg)",
                      backgroundImage: "linear-gradient(to bottom, #4b5563 5%, #1f2937 100%)",
                      clipPath: "polygon(0 0, 4px 0, 2px 96px)"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Audio Visualizer */}
            <div className="shrink-0 h-20">
              <AudioVisualizer isPlaying={isPlaying} color={visualizerColor} volume={volume} />
            </div>

            {rightPanelTab === "lyrics" ? (
              /* Timed scrolling lyrics */
              <div className="flex-1 min-h-[200px] overflow-hidden">
                <LyricsDisplay
                  title={currentTrack?.title || ""}
                  artist={currentTrack?.artist || ""}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                />
              </div>
            ) : (
              /* Play Queue */
              <div className="flex-1 flex flex-col min-h-[200px] overflow-hidden bg-[#050505]/40 border border-white/5 rounded-2xl p-3 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                  <span className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-widest font-mono">
                    Upcoming Tracks
                  </span>
                  {queue.length > 0 && (
                    <button
                      onClick={() => setQueue([])}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 transition uppercase tracking-wider font-mono"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {queue.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <ListMusic className="w-8 h-8 text-zinc-600 mb-2 stroke-[1.5]" />
                      <p className="text-xs text-zinc-500 italic">Queue is empty</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Click options on explore tracks to add.</p>
                    </div>
                  ) : (
                    queue.map((track, i) => (
                      <div
                        key={`${track.id}-${i}`}
                        className="group p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 transition"
                      >
                        <div 
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            setQueue((prev) => prev.filter((_, idx) => idx !== i));
                            handlePlayTrack(track);
                          }}
                        >
                          {track.imageUrl && (
                            <img src={track.imageUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate group-hover:text-[#8b5cf6] transition">
                              {track.title}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.artist}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setQueue((prev) => prev.filter((_, idx) => idx !== i))}
                          className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0"
                          title="Remove from queue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Persistent Bottom Playback bar */}
      <footer className="h-24 bg-gradient-to-r from-[#0c041a] to-[#04020a] border-t border-[#8b5cf6]/20 px-8 flex items-center justify-between shrink-0 select-none">
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
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded flex items-center justify-center text-[#8b5cf6] shrink-0 font-bold">
                  •••
                </div>
              )}
              <div className="min-w-0 flex flex-col">
                <h4 className="text-sm font-medium truncate text-white">{currentTrack.title}</h4>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <button
                id="toggle-like-btn"
                onClick={() => setIsLiked(!isLiked)}
                className={`p-1 hover:bg-white/5 rounded-full transition ml-1 shrink-0 ${
                  isLiked ? "text-[#8b5cf6] animate-pulse" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-[#8b5cf6]" : ""}`} />
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
              className="opacity-40 hover:opacity-100 disabled:opacity-15 disabled:pointer-events-none transition cursor-pointer"
            >
              <SkipBack className="w-4 h-4 fill-current text-white" />
            </button>
            <button
              id="playback-play-toggle-btn"
              onClick={handlePlayToggle}
              disabled={!currentTrack}
              className="w-12 h-12 rounded-full border border-[#8b5cf6] flex items-center justify-center text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white transition shadow-[0_0_15px_rgba(139,92,246,0.25)] shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
            </button>
            <button
              id="next-track-btn"
              onClick={handleSkipForward}
              disabled={!activePlaylist}
              className="opacity-40 hover:opacity-100 disabled:opacity-15 disabled:pointer-events-none transition cursor-pointer"
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
                max={previewMode ? Math.min(duration, 30) : duration}
                value={currentTime}
                disabled={!currentTrack}
                onChange={(e) => setCurrentTime(parseInt(e.target.value, 10))}
                className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer focus:outline-none accent-[#8b5cf6] transition rounded-full"
              />
            </div>
            <span className="text-[10px] opacity-40 tabular-nums w-8 text-left">
              {formatSecondsToTime(previewMode ? Math.min(duration, 30) : duration)}
            </span>
          </div>
        </div>

        {/* Options & volume Control (Right Area) */}
        <div className="flex items-center justify-end gap-6 w-1/4">
          {/* Preview Limit Toggle */}
          <button
            id="toggle-preview-mode-btn"
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-300 border cursor-pointer ${
              previewMode
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                : "bg-white/5 text-zinc-500 border-white/5 hover:text-zinc-300 hover:border-white/10"
            }`}
            title="When active, tracks are capped at 30 seconds"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${previewMode ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
            30s Preview
          </button>

          {/* Mobile indicator that triggers right columns if needed */}
          <button
            id="toggle-lyrics-panel-btn"
            onClick={() => setShowLyricsPanel(!showLyricsPanel)}
            className={`p-2 hover:bg-white/5 rounded-lg transition cursor-pointer ${
              showLyricsPanel ? "text-[#8b5cf6] bg-[#8b5cf6]/10" : "text-zinc-400 hover:text-white"
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
              className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
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
              className="flex-1 h-[2px] bg-white/10 rounded-full appearance-none cursor-pointer accent-[#8b5cf6] transition"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
