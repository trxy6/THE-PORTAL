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
  Search,
  Music,
  Heart,
  ListMusic,
  Sparkles,
  Disc,
  User,
  Power,
  Sliders,
  ExternalLink
} from "lucide-react";

// Spotify Client Config
const SPOTIFY_CLIENT_ID = "6238dcf567664f328bde1570c68f9eae";

interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  spotifyUri: string;
  duration: string;
  durationMs: number;
  previewUrl?: string | null;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
}

interface MusicHubProps {
  portalDarkMode: boolean;
  themeColor: string;
}

const CURATED_TRACKS: SpotifyTrack[] = [
  {
    id: "curated-1",
    title: "Lumina Chillwave",
    artist: "Aether",
    album: "Solar Wind",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80",
    spotifyUri: "",
    duration: "6:12",
    durationMs: 372000,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "curated-2",
    title: "Midnight Drive",
    artist: "Kozmic",
    album: "Synth Wave",
    imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80",
    spotifyUri: "",
    duration: "7:05",
    durationMs: 425000,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "curated-3",
    title: "Aether Flow",
    artist: "Lunar",
    album: "Deep Ambient",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=80",
    spotifyUri: "",
    duration: "5:44",
    durationMs: 344000,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    id: "curated-4",
    title: "Nebula Dream",
    artist: "Nova",
    album: "Nebular Waves",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80",
    spotifyUri: "",
    duration: "5:02",
    durationMs: 302000,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
  {
    id: "curated-5",
    title: "Cosmic Horizon",
    artist: "Helios",
    album: "Starlight Voyage",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&q=80",
    spotifyUri: "",
    duration: "6:02",
    durationMs: 362000,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
  }
];

// PKCE Cryptographic Helpers
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
  return btoa(String.fromCharCode(...new Uint8Array(a)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(v: string): Promise<string> {
  const hashed = await sha256(v);
  return base64urlencode(hashed);
}

export default function MusicHub({ portalDarkMode, themeColor }: MusicHubProps) {
  // Auth Token States
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("spotify_access_token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem("spotify_refresh_token"));
  const [userProfile, setUserProfile] = useState<any>(null);

  // Library Data States
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [likedTracks, setLikedTracks] = useState<SpotifyTrack[]>([]);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [currentTracksList, setCurrentTracksList] = useState<SpotifyTrack[]>(() => {
    try {
      const t = localStorage.getItem("spotify_access_token");
      return t ? [] : CURATED_TRACKS;
    } catch (e) {
      return CURATED_TRACKS;
    }
  });
  
  // Selection States
  const [activeTab, setActiveTab] = useState<"liked" | "playlists" | "artists" | "search">("liked");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(70);
  const [prevVolume, setPrevVolume] = useState<number>(70);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Search States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // UI state
  const [activePlaybackStatus, setActivePlaybackStatus] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");

  // Web Playback SDK States
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [sdkDeviceId, setSdkDeviceId] = useState<string | null>(null);
  const [isSdkConnected, setIsSdkConnected] = useState<boolean>(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const spotifyPlayerRef = useRef<any>(null);

  // Theme Helpers
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

  // Native audio progress handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(Math.floor(audioRef.current.duration));
    }
  };

  // 1. OAUTH FLOW HANDLERS
  const handleConnectSpotify = async () => {
    try {
      const verifier = generateRandomString(64);
      localStorage.setItem("spotify_code_verifier", verifier);

      const challenge = await generateCodeChallenge(verifier);
      const scope = [
        "user-read-private",
        "user-read-email",
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-library-read",
        "user-top-read",
        "user-read-playback-state",
        "user-modify-playback-state",
        "streaming" // Critical scope for Web Playback SDK
      ].join(" ");

      const redirectUri = window.location.origin + window.location.pathname;

      const authUrl = `https://accounts.spotify.com/authorize?` + new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: challenge,
      }).toString();

      window.location.href = authUrl;
    } catch (e) {
      console.error("Auth flow failed", e);
    }
  };

  const handleDisconnect = () => {
    if (spotifyPlayerRef.current) {
      try {
        spotifyPlayerRef.current.disconnect();
      } catch (e) {}
    }
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    setToken(null);
    setRefreshToken(null);
    setUserProfile(null);
    setPlaylists([]);
    setLikedTracks([]);
    setTopArtists([]);
    setCurrentTrack(null);
    setSpotifyPlayer(null);
    setSdkDeviceId(null);
    setIsSdkConnected(false);
  };

  // Intercept Redirect code parameters
  useEffect(() => {
    const codeExchange = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code) return;

      // Clean query string immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      const verifier = localStorage.getItem("spotify_code_verifier");
      if (!verifier) return;

      const redirectUri = window.location.origin + window.location.pathname;

      try {
        const res = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
            code_verifier: verifier
          })
        });

        if (res.ok) {
          const data = await res.json();
          setToken(data.access_token);
          setRefreshToken(data.refresh_token);
          localStorage.setItem("spotify_access_token", data.access_token);
          if (data.refresh_token) {
            localStorage.setItem("spotify_refresh_token", data.refresh_token);
          }
        }
      } catch (e) {
        console.error("Failed to exchange token", e);
      }
    };

    codeExchange();
  }, []);

  const getOrRefreshToken = async (): Promise<string | null> => {
    let activeToken = localStorage.getItem("spotify_access_token") || token;
    const activeRefresh = localStorage.getItem("spotify_refresh_token") || refreshToken;

    if (!activeToken) return null;

    try {
      const checkRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (checkRes.ok) {
        return activeToken;
      }
    } catch (e) {}

    if (activeRefresh) {
      try {
        const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: "refresh_token",
            refresh_token: activeRefresh
          })
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.access_token;
          setToken(newToken);
          localStorage.setItem("spotify_access_token", newToken);
          if (data.refresh_token) {
            setRefreshToken(data.refresh_token);
            localStorage.setItem("spotify_refresh_token", data.refresh_token);
          }
          return newToken;
        }
      } catch (e) {
        console.error("SDK token auto-refresh failed", e);
      }
    }
    return null;
  };

  // Fetch API with Auth Header and Auto Refresh
  const fetchWebApi = async (endpoint: string, method = "GET", body?: any): Promise<any> => {
    let activeToken = token;
    if (!activeToken) return null;

    const executeRequest = async (t: string) => {
      return fetch(`https://api.spotify.com/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json"
        },
        method,
        body: body ? JSON.stringify(body) : undefined
      });
    };

    let res = await executeRequest(activeToken);

    // If 401, trigger automatic token refresh
    if (res.status === 401 && refreshToken) {
      try {
        const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: "refresh_token",
            refresh_token: refreshToken
          })
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          activeToken = data.access_token;
          setToken(activeToken);
          localStorage.setItem("spotify_access_token", data.access_token);
          if (data.refresh_token) {
            setRefreshToken(data.refresh_token);
            localStorage.setItem("spotify_refresh_token", data.refresh_token);
          }
          // Retry initial request with new token
          res = await executeRequest(activeToken);
        } else {
          handleDisconnect();
          return null;
        }
      } catch (e) {
        console.error("Failed to refresh token", e);
        handleDisconnect();
        return null;
      }
    }

    if (!res.ok) {
      if (res.status === 204) return null; // No Content success
      throw new Error(`Spotify API error: ${res.statusText}`);
    }
    return res.json();
  };

  // 2. SPOTIFY WEB PLAYBACK SDK INITIALIZATION
  useEffect(() => {
    if (!token) return;

    // Inject Spotify Web Playback SDK Script
    const scriptId = "spotify-player-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // Set callback window handler
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).Spotify.Player({
        name: "The Portal Player",
        getOAuthToken: async (cb: any) => {
          const activeTok = await getOrRefreshToken();
          cb(activeTok);
        },
        volume: volume / 100
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Spotify Web Playback SDK ready with Device ID:", device_id);
        setSdkDeviceId(device_id);
        setIsSdkConnected(true);
        
        // Auto-transfer playback directly to this browser tab device!
        fetch(`https://api.spotify.com/v1/me/player`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false
          })
        }).catch(() => {});
      });

      player.addListener("not_ready", () => {
        setIsSdkConnected(false);
        setSdkDeviceId(null);
      });

      // Synchronize player states automatically (album art, position, playing state)
      player.addListener("player_state_changed", (state: any) => {
        if (!state) return;
        
        const activeTrack = state.track_window.current_track;
        if (activeTrack) {
          setCurrentTrack({
            id: activeTrack.id,
            title: activeTrack.name,
            artist: activeTrack.artists.map((a: any) => a.name).join(", "),
            album: activeTrack.album.name,
            imageUrl: activeTrack.album.images[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
            spotifyUri: activeTrack.uri,
            duration: formatDuration(state.duration),
            durationMs: state.duration
          });
        }
        
        setIsPlaying(!state.paused);
        setDuration(Math.floor(state.duration / 1000));
        setCurrentTime(Math.floor(state.position / 1000));
      });

      player.addListener("initialization_error", (e: any) => console.warn(e));
      player.addListener("authentication_error", (e: any) => console.warn(e));
      player.addListener("account_error", (e: any) => {
        console.warn("Spotify Playback SDK Account Error. Playback SDK is only available for Spotify Premium accounts.", e);
        setIsSdkConnected(false);
      });

      player.connect();
      setSpotifyPlayer(player);
      spotifyPlayerRef.current = player;
    };

    return () => {
      // Don't disconnect here on every load, keep player alive while tab persists
    };
  }, [token]);

  // Sync volume adjustments to background Spotify player
  useEffect(() => {
    if (spotifyPlayerRef.current && isSdkConnected) {
      spotifyPlayerRef.current.setVolume(volume / 100).catch(() => {});
    }
  }, [volume, isSdkConnected]);

  // 3. DATA FETCHERS
  // Fetch user profile info
  useEffect(() => {
    if (!token) return;
    fetchWebApi("v1/me")
      .then((profile) => {
        setUserProfile(profile);
      })
      .catch((e) => console.error(e));
  }, [token]);

  // Fetch Liked Songs (Saved Tracks) with pagination support
  const fetchAllLikedSongs = async () => {
    if (!token) return;
    setActivePlaybackStatus("loading");
    try {
      let url = "v1/me/tracks?limit=50";
      let allTracks: SpotifyTrack[] = [];
      
      // Fetch up to 4 pages (200 songs)
      for (let page = 0; page < 4; page++) {
        const data = await fetchWebApi(url);
        if (data && data.items && data.items.length > 0) {
          const mapped = data.items.map((item: any) => ({
            id: item.track.id,
            title: item.track.name,
            artist: item.track.artists.map((a: any) => a.name).join(", "),
            album: item.track.album.name,
            imageUrl: item.track.album.images[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
            spotifyUri: item.track.uri,
            duration: formatDuration(item.track.duration_ms),
            durationMs: item.track.duration_ms,
            previewUrl: item.track.preview_url
          }));
          allTracks = [...allTracks, ...mapped];
          if (data.next) {
            const urlObj = new URL(data.next);
            url = urlObj.pathname.substring(1) + urlObj.search;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      setLikedTracks(allTracks);
      if (activeTab === "liked") {
        setCurrentTracksList(allTracks);
      }
      setActivePlaybackStatus("idle");
    } catch (e) {
      console.error(e);
      setActivePlaybackStatus("error");
    }
  };

  // Fetch Playlists with pagination support
  const fetchAllPlaylists = async () => {
    if (!token) return;
    try {
      let url = "v1/me/playlists?limit=50";
      let allPlaylists: SpotifyPlaylist[] = [];

      for (let page = 0; page < 5; page++) { // Fetch up to 5 pages (250 playlists)
        const data = await fetchWebApi(url);
        if (data && data.items && data.items.length > 0) {
          const mapped = data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || "Spotify Playlist",
            imageUrl: item.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
            trackCount: item.tracks.total
          }));
          allPlaylists = [...allPlaylists, ...mapped];
          if (data.next) {
            const urlObj = new URL(data.next);
            url = urlObj.pathname.substring(1) + urlObj.search;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      setPlaylists(allPlaylists);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLikeTrack = async (track: SpotifyTrack, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid playing when clicking heart
    if (!token) return;

    const isLiked = likedTracks.some(t => t.id === track.id);
    try {
      if (isLiked) {
        // Remove from library
        await fetchWebApi(`v1/me/tracks?ids=${track.id}`, "DELETE");
        setLikedTracks(prev => prev.filter(t => t.id !== track.id));
        if (activeTab === "liked") {
          setCurrentTracksList(prev => prev.filter(t => t.id !== track.id));
        }
      } else {
        // Add to library
        await fetchWebApi(`v1/me/tracks?ids=${track.id}`, "PUT");
        const updated = [track, ...likedTracks];
        setLikedTracks(updated);
        if (activeTab === "liked") {
          setCurrentTracksList(updated);
        }
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  // Fetch Top/Followed Artists
  const fetchTopArtists = async () => {
    if (!token) return;
    try {
      const data = await fetchWebApi("v1/me/top/artists?limit=50");
      if (data && data.items) {
        const mapped = data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.images[0]?.url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300",
          genres: item.genres
        }));
        setTopArtists(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load playlists, top artists, and liked songs on successful connection
  useEffect(() => {
    if (token) {
      fetchAllLikedSongs();
      fetchAllPlaylists();
      fetchTopArtists();
    }
  }, [token]);

  // Load tracks for selected playlist
  const handleSelectPlaylist = async (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActivePlaybackStatus("loading");
    try {
      const data = await fetchWebApi(`v1/playlists/${playlistId}/tracks?limit=50`);
      if (data && data.items) {
        const mapped = data.items.filter((item: any) => item.track).map((item: any) => ({
          id: item.track.id,
          title: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(", "),
          album: item.track.album.name,
          imageUrl: item.track.album.images[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
          spotifyUri: item.track.uri,
          duration: formatDuration(item.track.duration_ms),
          durationMs: item.track.duration_ms,
          previewUrl: item.track.preview_url
        }));
        setCurrentTracksList(mapped);
      }
      setActivePlaybackStatus("idle");
    } catch (e) {
      console.error(e);
      setActivePlaybackStatus("error");
    }
  };

  // Sync catalog lists dynamically based on selected tabs
  useEffect(() => {
    if (activeTab === "liked") {
      setCurrentTracksList(token ? likedTracks : CURATED_TRACKS);
      setSelectedPlaylistId(null);
    } else if (activeTab === "playlists" && playlists.length > 0 && !selectedPlaylistId) {
      handleSelectPlaylist(playlists[0].id);
    }
  }, [activeTab, likedTracks, token]);

  // Real-time catalog search
  useEffect(() => {
    if (!token || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delaySearch = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await fetchWebApi(`v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=20`);
        if (data && data.tracks && data.tracks.items) {
          const mapped = data.tracks.items.map((item: any) => ({
            id: item.id,
            title: item.name,
            artist: item.artists.map((a: any) => a.name).join(", "),
            album: item.album.name,
            imageUrl: item.album.images[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
            spotifyUri: item.uri,
            duration: formatDuration(item.duration_ms),
            durationMs: item.duration_ms,
            previewUrl: item.preview_url
          }));
          setSearchResults(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, token]);

  // 4. MUSIC PLAYBACK ACTIVE DEVICE CONTROLS
  const handlePlayTrack = async (track: SpotifyTrack) => {
    setCurrentTrack(track);
    setIsPlaying(false);
    setDuration(Math.floor(track.durationMs / 1000));
    setCurrentTime(0);

    // Stop local standard audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    // A. If Spotify Web Playback SDK is connected, play full song directly on virtual device!
    if (isSdkConnected && sdkDeviceId && token && track.spotifyUri) {
      try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${sdkDeviceId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uris: [track.spotifyUri]
          })
        });
        setIsPlaying(true);
        return;
      } catch (e) {
        console.warn("Failed to play on Spotify Web SDK Device, falling back to native previews...", e);
      }
    }

    // B. Fallback Mode: Play 30-second preview URL natively using browser <audio> tag
    if (audioRef.current) {
      const sourceUrl = track.previewUrl || CURATED_TRACKS[0].previewUrl;
      if (sourceUrl) {
        audioRef.current.src = sourceUrl;
        audioRef.current.load();
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((e) => console.error("Playback fallback play failed:", e));
      }
    }
  };

  const handlePlayToggle = async () => {
    if (!currentTrack) return;
    
    // A. If Spotify Web Playback SDK is connected, toggle play/pause natively
    if (spotifyPlayerRef.current && isSdkConnected) {
      try {
        await spotifyPlayerRef.current.togglePlay();
        return;
      } catch (e) {}
    }

    // B. Toggle local audio tag playback
    if (audioRef.current && audioRef.current.src) {
      if (audioRef.current.paused) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipForward = async () => {
    if (spotifyPlayerRef.current && isSdkConnected) {
      try {
        await spotifyPlayerRef.current.nextTrack();
        return;
      } catch (e) {}
    }

    const list = activeTab === "search" ? searchResults : currentTracksList;
    if (!currentTrack || list.length === 0) return;
    const idx = list.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1 && idx < list.length - 1) {
      handlePlayTrack(list[idx + 1]);
    } else {
      handlePlayTrack(list[0]);
    }
  };

  const handleSkipBackward = async () => {
    if (spotifyPlayerRef.current && isSdkConnected) {
      try {
        await spotifyPlayerRef.current.previousTrack();
        return;
      } catch (e) {}
    }

    const list = activeTab === "search" ? searchResults : currentTracksList;
    if (!currentTrack || list.length === 0) return;
    const idx = list.findIndex(t => t.id === currentTrack.id);
    if (idx > 0) {
      handlePlayTrack(list[idx - 1]);
    } else {
      handlePlayTrack(list[list.length - 1]);
    }
  };

  const handleVolumeToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 70);
    }
  };

  // Sync volume with native audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Local simulated progress tick when music is active and SDK is NOT connected
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && duration > 0 && !isSdkConnected) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            handleSkipForward();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration, currentTrack, isSdkConnected]);

  // Equalizer canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const barCount = 24;
    const barWidth = Math.max(2, canvas.width / barCount - 2);
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
          const peak = Math.sin(Date.now() * 0.005 + index) * 0.5 + 0.5;
          bar.targetHeight = peak * (canvas.height - 10) + 5;
        } else {
          bar.targetHeight = 3;
        }

        bar.height += (bar.targetHeight - bar.height) * bar.speed;

        const gradient = ctx.createLinearGradient(bar.x, canvas.height - bar.height, bar.x, canvas.height);
        gradient.addColorStop(0, themeHex);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.03)");

        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          const radius = Math.max(0, barWidth / 2);
          ctx.roundRect(bar.x, canvas.height - bar.height, barWidth, bar.height, [radius, radius, 0, 0]);
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

  // Duration Formatting helper
  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  const formatSeconds = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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
      {/* 1. LEFT PANEL: Library, Playlists & Connection */}
      <div className="lg:col-span-3 flex flex-col gap-5 h-[620px]">
        {/* Connection status card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex flex-col gap-3.5 shadow-inner">
          <div className="flex items-center gap-3">
            {userProfile?.images?.[0]?.url ? (
              <img
                src={userProfile.images[0].url}
                alt={userProfile.display_name}
                className="w-10 h-10 rounded-full border border-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                <User className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                {userProfile ? userProfile.display_name : "Spotify Sync"}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                {userProfile ? `Linked: ${userProfile.email}` : "Offline"}
              </p>
            </div>
          </div>

          {token ? (
            <button
              onClick={handleDisconnect}
              className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              Disconnect Spotify
            </button>
          ) : (
            <button
              onClick={handleConnectSpotify}
              className="w-full py-2 bg-[var(--theme-accent)] hover:scale-[1.02] text-white rounded-xl text-xs font-bold transition shadow-[0_0_15px_var(--theme-glow)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Disc className="w-4 h-4 animate-spin-slow" />
              Connect Spotify
            </button>
          )}
        </div>

        {/* Tab selection links */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3 flex flex-col gap-1.5 overflow-hidden">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1 flex items-center gap-1.5 border-b border-white/5 mb-1.5">
            <ListMusic className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
            Spotify Collections
          </h3>

          <button
            onClick={() => setActiveTab("liked")}
            disabled={!token}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition disabled:opacity-20 disabled:pointer-events-none ${
              activeTab === "liked"
                ? "bg-[var(--theme-accent)] text-white shadow-[0_0_15px_var(--theme-glow)]"
                : "bg-white/[0.01] hover:bg-white/5 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5" />
              <span>All Liked Songs</span>
            </div>
            <span className="opacity-70 text-[10px]">{likedTracks.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("playlists")}
            disabled={!token}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition disabled:opacity-20 disabled:pointer-events-none ${
              activeTab === "playlists"
                ? "bg-[var(--theme-accent)] text-white shadow-[0_0_15px_var(--theme-glow)]"
                : "bg-white/[0.01] hover:bg-white/5 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5" />
              <span>Playlists</span>
            </div>
            <span className="opacity-70 text-[10px]">{playlists.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("artists")}
            disabled={!token}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition disabled:opacity-20 disabled:pointer-events-none ${
              activeTab === "artists"
                ? "bg-[var(--theme-accent)] text-white shadow-[0_0_15px_var(--theme-glow)]"
                : "bg-white/[0.01] hover:bg-white/5 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>Top Artists</span>
            </div>
            <span className="opacity-70 text-[10px]">{topArtists.length}</span>
          </button>

          {/* Dynamic list of playlists underneath if tab is selected */}
          {activeTab === "playlists" && playlists.length > 0 && (
            <div className="flex-1 overflow-y-auto mt-2 border-t border-white/5 pt-2 space-y-1 pr-0.5 scrollbar-thin">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleSelectPlaylist(pl.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] truncate flex items-center gap-2 transition ${
                    selectedPlaylistId === pl.id
                      ? "bg-white/5 text-[var(--theme-accent)] font-semibold border-l-2 border-[var(--theme-accent)]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{pl.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. CENTER PANEL: Spinning Disc / Web Playback SDK Host */}
      <div className="lg:col-span-5 flex flex-col gap-6 items-center justify-between h-[620px] bg-white/[0.01] border border-white/[0.03] rounded-3xl p-6 relative overflow-hidden">
        {/* Top Header info */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Spotify Connect Hub</span>
          </div>
          {isSdkConnected && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Portal Player Active</span>
            </div>
          )}
        </div>

        {/* SPINNING VINYL DISC VISUALIZER */}
        <div className="relative my-auto flex items-center justify-center group z-10 animate-[fadeIn_0.4s_ease-out]">
          <div
            className={`w-64 h-64 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center shadow-[0_0_55px_rgba(0,0,0,0.85)] relative transition-transform duration-[4000ms] ease-linear ${
              isPlaying ? "animate-[spin_10s_linear_infinite]" : "rotate-12"
            }`}
          >
            {/* Record Grooves */}
            <div className="absolute inset-2 rounded-full border border-white/[0.04] pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-white/[0.03] pointer-events-none" />
            <div className="absolute inset-10 rounded-full border border-white/[0.03] pointer-events-none" />
            <div className="absolute inset-14 rounded-full border border-white/[0.03] pointer-events-none" />
            <div className="absolute inset-20 rounded-full border border-white/[0.02] pointer-events-none" />

            {/* Glowing album art cover art center */}
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

            {/* Center hole */}
            <div className="absolute w-6 h-6 rounded-full bg-[#04020a] border-2 border-zinc-950" />
          </div>

          {/* Arm Needle indicator */}
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
              <h2 className="text-lg font-bold text-white tracking-wide truncate flex items-center justify-center gap-1.5 px-4">
                {currentTrack.title}
                <a
                  href={currentTrack.spotifyUri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-white transition"
                  title="Open on Spotify client app"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h2>
              <p className="text-sm text-zinc-400 mt-1 font-medium truncate px-4">{currentTrack.artist}</p>
              {activePlaybackStatus === "loading" && (
                <p className="text-[10px] text-[var(--theme-accent)] uppercase tracking-wider font-bold mt-1.5 animate-pulse">Connecting API...</p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-zinc-500 italic">No Song Loaded</h2>
              <p className="text-sm text-zinc-600 mt-1">Select a track from the list</p>
            </>
          )}
        </div>

        {/* Playback Progress Slider */}
        <div className="w-full flex flex-col gap-1 z-10">
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] text-zinc-500 tabular-nums w-8 text-right">
              {formatSeconds(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={async (e) => {
                const newPosSec = parseInt(e.target.value, 10);
                setCurrentTime(newPosSec);
                if (spotifyPlayerRef.current && isSdkConnected) {
                  spotifyPlayerRef.current.seek(newPosSec * 1000).catch(() => {});
                } else if (audioRef.current && audioRef.current.src) {
                  audioRef.current.currentTime = newPosSec;
                }
              }}
              disabled={!currentTrack}
              className="flex-1 h-[3px] bg-white/10 appearance-none rounded-full cursor-pointer focus:outline-none accent-[var(--theme-accent)]"
            />
            <span className="text-[10px] text-zinc-500 tabular-nums w-8 text-left">
              {formatSeconds(duration)}
            </span>
          </div>
        </div>

        {/* Bottom player controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full z-10 pt-4 border-t border-white/5">
          {/* Mute/Volume slider */}
          <div className="flex items-center gap-2.5 w-full sm:w-28 justify-center sm:justify-start">
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
              className="flex-1 h-[2px] max-w-[80px] bg-white/10 appearance-none rounded-full cursor-pointer accent-[var(--theme-accent)]"
            />
          </div>

          {/* Main playback control buttons */}
          <div className="flex items-center gap-6 justify-center">
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

          {/* Connect status label */}
          <div className="hidden sm:block text-[10px] uppercase font-bold text-zinc-500 border border-white/10 rounded-full px-2.5 py-1 tracking-wider bg-white/[0.02]">
            {token ? (isSdkConnected ? "SDK Session" : "API Connected") : "Offline"}
          </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL: Tracks Index / Catalog Search */}
      <div className="lg:col-span-4 flex flex-col gap-6 h-[620px]">
        {/* Tracks List Card */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 select-none">
              <Sliders className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {activeTab === "liked" ? "Liked Tracks" : activeTab === "artists" ? "Top Artists" : activeTab === "search" ? "Search Results" : "Playlist Index"}
              </h3>
            </div>
          </div>

          {/* Search Input bar */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search artists, songs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "search") setActiveTab("search");
              }}
              disabled={!token}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[var(--theme-accent)] transition text-white placeholder-zinc-500"
            />
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {activeTab === "artists" ? (
              /* RENDER ARTISTS LIST */
              topArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="w-full p-2.5 rounded-xl text-left text-xs flex items-center gap-3 border border-transparent bg-white/[0.01]"
                >
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{artist.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5 uppercase tracking-wider">{artist.genres.slice(0, 2).join(", ") || "Artist"}</p>
                  </div>
                </div>
              ))
            ) : (
              /* RENDER TRACKS LIST (Liked, playlists or search) */
              (activeTab === "search" ? searchResults : currentTracksList).map((t) => (
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
                          <Disc className="w-4 h-4 animate-spin-slow" />
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
                    {token && t.spotifyUri && (
                      <button
                        onClick={(e) => handleToggleLikeTrack(t, e)}
                        className="p-1.5 hover:scale-110 transition cursor-pointer"
                        title={likedTracks.some(lt => lt.id === t.id) ? "Remove from Liked Songs" : "Save to Liked Songs"}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            likedTracks.some(lt => lt.id === t.id)
                              ? "text-pink-500 fill-current"
                              : "text-zinc-500 hover:text-white"
                          }`}
                        />
                      </button>
                    )}
                    <span className="text-[10px] text-zinc-500 tabular-nums shrink-0">{t.duration}</span>
                  </div>
                </div>
              ))
            )}

            {/* Empty displays */}
            {!token && (
              <div className="text-zinc-500 text-center py-12 text-xs flex flex-col items-center gap-2">
                <Sliders className="w-8 h-8 opacity-40 text-[var(--theme-accent)]" />
                <span>Connect your Spotify account to load your library details.</span>
              </div>
            )}
            {token && activeTab !== "artists" && (activeTab === "search" ? searchResults : currentTracksList).length === 0 && (
              <div className="text-zinc-600 text-center py-12 italic text-xs">
                {isSearching ? "Searching catalog..." : "No tracks found in collection"}
              </div>
            )}
          </div>

          {/* Equalizer canvas */}
          <div className="h-16 shrink-0 border-t border-white/5 pt-2 flex flex-col gap-1.5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">Live Frequency EQ</span>
            <canvas ref={canvasRef} className="w-full h-full bg-white/[0.01] rounded-lg" />
          </div>
        </div>
      </div>

      {/* Native HTML5 Audio Element for previews and curated tracks */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSkipForward}
      />
    </div>
  );
}
