import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Heart,
  Search,
  Disc,
  Sliders,
  User,
  Power,
  ListMusic,
  ListPlus,
  Loader2,
  RefreshCw,
  HelpCircle
} from "lucide-react";

// PROPS DEFINITION
interface MusicHubProps {
  portalDarkMode: boolean;
  themeColor: string;
}

// TRACK INTERFACE
interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  spotifyUri: string;
  duration: string;
  durationMs: number;
  previewUrl?: string;
}

// DEFAULT CURATED TRACKS (For offline / not connected view)
const CURATED_TRACKS: SpotifyTrack[] = [
  {
    id: "curated-1",
    title: "Aether",
    artist: "Kozmic",
    album: "Nova Horizon",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80",
    spotifyUri: "",
    duration: "3:45",
    durationMs: 225000,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "curated-2",
    title: "Lunar Escape",
    artist: "Nova & Helios",
    album: "Solar Wind",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80",
    spotifyUri: "",
    duration: "4:12",
    durationMs: 252000,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "curated-3",
    title: "Kozmic Void",
    artist: "Aether Group",
    album: "Deep Nebula",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
    spotifyUri: "",
    duration: "3:20",
    durationMs: 200000,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

// OAUTH SETTINGS
const SPOTIFY_CLIENT_ID = "6238dcf567664f328bde1570c68f9eae";

// PKCE HELPER METHODS
function generateRandomString(length: number) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(a: ArrayBuffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a) as any))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default function MusicHub({ portalDarkMode, themeColor }: MusicHubProps) {
  // Authentication & Token States
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("spotify_access_token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem("spotify_refresh_token"));
  const [userProfile, setUserProfile] = useState<any>(null);

  // Library & UI States
  const [likedTracks, setLikedTracks] = useState<SpotifyTrack[]>(() => {
    try {
      const cached = localStorage.getItem("spotify_cached_liked_tracks");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<"liked" | "search">("liked");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playbackQueue, setPlaybackQueue] = useState<SpotifyTrack[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [showQueue, setShowQueue] = useState<boolean>(false);

  // Sync Progress Indicators
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "error">("idle");
  const [syncProgress, setSyncProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  // Player Playback States
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(70);
  const [prevVolume, setPrevVolume] = useState<number>(70);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Web Playback SDK States
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [sdkDeviceId, setSdkDeviceId] = useState<string | null>(null);
  const [isSdkConnected, setIsSdkConnected] = useState<boolean>(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const spotifyPlayerRef = useRef<any>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

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

  // Unified fetchWebApi with refresh concurrency lock
  const fetchWebApi = async (endpoint: string, method = "GET", body?: any): Promise<any> => {
    let activeToken = localStorage.getItem("spotify_access_token") || token;

    const executeRequest = async (tok: string) => {
      return fetch(`https://api.spotify.com/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${tok}`,
          "Content-Type": "application/json"
        },
        method,
        body: body ? JSON.stringify(body) : undefined
      });
    };

    if (!activeToken) return null;
    let res = await executeRequest(activeToken);

    // If 401 Unauthorized, automatically handle token refresh
    if (res.status === 401) {
      if (refreshToken) {
        try {
          // If a refresh is already in progress, reuse the same promise
          if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = (async () => {
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
                const newToken = data.access_token;
                setToken(newToken);
                localStorage.setItem("spotify_access_token", newToken);
                if (data.refresh_token) {
                  setRefreshToken(data.refresh_token);
                  localStorage.setItem("spotify_refresh_token", data.refresh_token);
                }
                return newToken;
              } else {
                handleDisconnect();
                return null;
              }
            })();
          }

          const newToken = await refreshPromiseRef.current;
          refreshPromiseRef.current = null; // Clear lock

          if (newToken) {
            res = await executeRequest(newToken);
          } else {
            return null;
          }
        } catch (e) {
          refreshPromiseRef.current = null;
          console.error("Token refresh lock fail:", e);
          handleDisconnect();
          return null;
        }
      } else {
        handleDisconnect();
        return null;
      }
    }

    if (!res.ok) {
      if (res.status === 204) return null; // No Content success
      const errText = await res.text().catch(() => "");
      throw new Error(`Spotify API error: ${res.status} ${res.statusText} ${errText}`);
    }
    return res.json();
  };

  // Direct fetch helper that doesn't trigger refresh loops (used in catalog loading)
  const apiFetch = async (activeToken: string, endpoint: string, method = "GET", body?: any): Promise<any> => {
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        "Content-Type": "application/json"
      },
      method,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      if (res.status === 204) return null;
      const errText = await res.text().catch(() => "");
      throw new Error(`Spotify API error: ${res.status} ${res.statusText} ${errText}`);
    }
    return res.json();
  };

  // Safe cached token grabber for SDK callback
  const getOrRefreshToken = async (): Promise<string | null> => {
    return localStorage.getItem("spotify_access_token") || token;
  };

  // Initiate OAuth flow with PKCE
  const handleConnectSpotify = async () => {
    try {
      const verifier = generateRandomString(128);
      localStorage.setItem("spotify_code_verifier", verifier);

      const hashed = await sha256(verifier);
      const challenge = base64urlencode(hashed);

      const scopes = [
        "user-read-private",
        "user-read-email",
        "user-library-read",
        "user-top-read",
        "user-read-playback-state",
        "user-modify-playback-state",
        "streaming"
      ].join(" ");

      let redirectUri = window.location.origin + window.location.pathname;
      if (redirectUri.includes("trxy6.github.io/THE-PORTAL") && !redirectUri.endsWith("/")) {
        redirectUri += "/";
      }

      const authUrl = `https://accounts.spotify.com/authorize?` + new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope: scopes,
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: challenge,
        show_dialog: "true"
      }).toString();

      window.location.href = authUrl;
    } catch (e) {
      console.error("Auth start fail:", e);
    }
  };

  // Clean disconnect
  const handleDisconnect = () => {
    if (spotifyPlayerRef.current) {
      try {
        spotifyPlayerRef.current.disconnect();
      } catch (e) {}
    }
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_cached_liked_tracks");
    localStorage.removeItem("spotify_last_sync_time");
    setToken(null);
    setRefreshToken(null);
    setUserProfile(null);
    setLikedTracks([]);
    setCurrentTrack(null);
    setSpotifyPlayer(null);
    setSdkDeviceId(null);
    setIsSdkConnected(false);
    setSyncProgress(null);
  };

  // Intercept Redirect Auth parameters on mount
  useEffect(() => {
    const codeExchange = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code) return;

      // Wipe code parameters immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      const verifier = localStorage.getItem("spotify_code_verifier");
      if (!verifier) return;

      let redirectUri = window.location.origin + window.location.pathname;
      if (redirectUri.includes("trxy6.github.io/THE-PORTAL") && !redirectUri.endsWith("/")) {
        redirectUri += "/";
      }

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
        console.error("Token exchange fail:", e);
      }
    };

    codeExchange();
  }, []);

  // Fetch user profile info
  useEffect(() => {
    if (!token) return;
    fetchWebApi("v1/me")
      .then((profile) => {
        setUserProfile(profile);
      })
      .catch((e) => {
        console.error("Profile check fail:", e);
      });
  }, [token]);

  // Load all Liked Songs sequentially to prevent 429 Rate Limits
  const fetchAllLikedSongs = async (activeToken: string) => {
    setSyncStatus("loading");
    setSyncProgress(null);
    setSyncErrorMsg(null);
    try {
      // 1. Fetch first page to grab total count
      const firstPage = await apiFetch(activeToken, "v1/me/tracks?limit=50&offset=0");
      if (!firstPage || !firstPage.items) {
        setLikedTracks([]);
        setSyncStatus("idle");
        return;
      }

      const total = firstPage.total;
      let allItems = [...firstPage.items];
      setSyncProgress({ loaded: allItems.length, total });

      // 2. Fetch remaining pages sequentially
      for (let offset = 50; offset < total; offset += 50) {
        const pageData = await apiFetch(activeToken, `v1/me/tracks?limit=50&offset=${offset}`);
        if (pageData && pageData.items) {
          allItems = [...allItems, ...pageData.items];
          setSyncProgress({ loaded: allItems.length, total });
        }
        // Small breathing delay to be friendly to Spotify servers
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      // Map to SpotifyTrack structure defensively
      const mapped = allItems
        .filter((item: any) => item && item.track && item.track.id)
        .map((item: any) => {
          const t = item.track;
          const title = t.name || "Unknown Title";
          const artist = Array.isArray(t.artists) ? t.artists.map((a: any) => a?.name || "Unknown").join(", ") : "Unknown Artist";
          const album = t.album?.name || "Unknown Album";
          const imageUrl = t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80";
          const spotifyUri = t.uri || "";
          const durationMs = typeof t.duration_ms === "number" ? t.duration_ms : 0;
          const duration = formatDuration(durationMs);
          const previewUrl = t.preview_url || undefined;

          return {
            id: t.id,
            title,
            artist,
            album,
            imageUrl,
            spotifyUri,
            duration,
            durationMs,
            previewUrl
          };
        });

      setLikedTracks(mapped);
      localStorage.setItem("spotify_cached_liked_tracks", JSON.stringify(mapped));
      localStorage.setItem("spotify_last_sync_time", Date.now().toString());
      setSyncStatus("idle");
      setSyncProgress(null);
    } catch (e: any) {
      console.error("fetchAllLikedSongs fail:", e);
      setSyncStatus("error");
      setSyncErrorMsg(e.message || "Library sync failed");
      setSyncProgress(null);
    }
  };

  // Sync / Load library on mount or token update
  useEffect(() => {
    if (!token) return;
    const t = token;

    const lastSync = localStorage.getItem("spotify_last_sync_time");
    const now = Date.now();

    // Bypass 10-minute sync throttle if likedTracks state is empty
    if (likedTracks.length > 0 && lastSync && now - parseInt(lastSync, 10) < 10 * 60 * 1000) {
      console.log("Spotify library sync loaded from cache (sync throttled)");
      return;
    }

    fetchAllLikedSongs(t);
  }, [token]);

  // Sync catalog lists dynamically based on active tab
  const currentTracksList = useMemo(() => {
    return token ? likedTracks : CURATED_TRACKS;
  }, [likedTracks, token]);

  // Real-time client-side search (requires 0 API requests)
  const filteredTracksList = useMemo(() => {
    if (!searchQuery.trim()) return currentTracksList;
    const q = searchQuery.toLowerCase();
    return currentTracksList.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [currentTracksList, searchQuery]);

  // Web Playback SDK Initialization
  useEffect(() => {
    if (!token) return;

    const scriptId = "spotify-player-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const initPlayer = () => {
      if (spotifyPlayerRef.current) {
        try {
          spotifyPlayerRef.current.disconnect();
        } catch (e) {}
      }

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
        fetch("https://api.spotify.com/v1/me/player", {
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

    if ((window as any).Spotify) {
      initPlayer();
    } else {
      (window as any).onSpotifyWebPlaybackSDKReady = () => {
        initPlayer();
      };
    }

    return () => {
      // Keep player alive while tab persists
    };
  }, [token]);

  // Sync volume adjustments to background Spotify player
  useEffect(() => {
    if (spotifyPlayerRef.current && isSdkConnected) {
      spotifyPlayerRef.current.setVolume(volume / 100).catch(() => {});
    }
  }, [volume, isSdkConnected]);

  // Audio Playback progress tracking
  const handleTimeUpdate = () => {
    if (audioRef.current && !isSdkConnected) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isSdkConnected) {
      setDuration(Math.floor(audioRef.current.duration));
    }
  };

  // Seek bar slide trigger
  const handleSeekChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseInt(e.target.value, 10);
    setCurrentTime(time);

    if (isSdkConnected && spotifyPlayerRef.current) {
      try {
        await spotifyPlayerRef.current.seek(time * 1000);
      } catch (err) {
        console.error("SDK seek fail:", err);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Playback control wrappers
  const handlePlayTrack = async (track: SpotifyTrack, index: number, queue: SpotifyTrack[] = filteredTracksList) => {
    setCurrentTrack(track);
    setPlaybackQueue(queue);
    setCurrentQueueIndex(index);
    setShowQueue(false);

    if (token && isSdkConnected && sdkDeviceId) {
      try {
        await fetchWebApi(`v1/me/player/play?device_id=${sdkDeviceId}`, "PUT", {
          uris: [track.spotifyUri]
        });
        setIsPlaying(true);
      } catch (err) {
        console.warn("Failed to play via Spotify SDK player. Falling back to local preview:", err);
        playLocalPreview(track);
      }
    } else {
      playLocalPreview(track);
    }
  };

  const playLocalPreview = (track: SpotifyTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (track.previewUrl) {
        audioRef.current.src = track.previewUrl;
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((e) => {
            console.error("Local preview failed to play", e);
            setIsPlaying(false);
          });
      } else {
        alert("This track does not have a 30-second preview available. Connect Spotify Premium to play full tracks.");
        setIsPlaying(false);
      }
    }
  };

  const handleTogglePlay = async () => {
    if (!currentTrack) {
      if (filteredTracksList.length > 0) {
        handlePlayTrack(filteredTracksList[0], 0);
      }
      return;
    }

    if (isSdkConnected && spotifyPlayerRef.current) {
      try {
        await spotifyPlayerRef.current.togglePlay();
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error("SDK togglePlay fail:", err);
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipForward = () => {
    if (playbackQueue.length === 0 || currentQueueIndex === -1) return;
    const nextIndex = (currentQueueIndex + 1) % playbackQueue.length;
    handlePlayTrack(playbackQueue[nextIndex], nextIndex, playbackQueue);
  };

  const handleSkipBackward = () => {
    if (playbackQueue.length === 0 || currentQueueIndex === -1) return;
    let prevIndex = currentQueueIndex - 1;
    if (prevIndex < 0) prevIndex = playbackQueue.length - 1;
    handlePlayTrack(playbackQueue[prevIndex], prevIndex, playbackQueue);
  };

  const handleToggleVolumeMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume);
    }
  };

  const handleToggleLikeTrack = async (track: SpotifyTrack, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid playing when clicking heart
    if (!token) return;

    const isLiked = likedTracks.some(t => t.id === track.id);
    try {
      if (isLiked) {
        await fetchWebApi(`v1/me/tracks?ids=${track.id}`, "DELETE");
        setLikedTracks(prev => prev.filter(t => t.id !== track.id));
      } else {
        await fetchWebApi(`v1/me/tracks?ids=${track.id}`, "PUT");
        setLikedTracks(prev => [track, ...prev]);
      }
    } catch (err) {
      console.error("Toggle like fail:", err);
    }
  };

  const handleAddToQueue = async (track: SpotifyTrack, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid playing when clicking plus
    
    setPlaybackQueue((prev) => {
      if (prev.length === 0) {
        setCurrentQueueIndex(0);
        setCurrentTrack(track);
      }
      return [...prev, track];
    });

    if (token && track.spotifyUri) {
      try {
        await fetchWebApi(`v1/me/player/queue?uri=${encodeURIComponent(track.spotifyUri)}`, "POST");
      } catch (err) {
        console.warn("Failed to sync to Spotify queue:", err);
      }
    }
  };

  // Visualizer Animation Hook (Sleek CSS Wave style)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const barCount = 45;
    const barWidth = Math.floor(canvas.width / barCount) - 2;
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

  // Duration formatting helpers
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
      {/* 1. LEFT SIDEBAR: Connection & Library Selection */}
      <div className="lg:col-span-3 flex flex-col gap-5 h-[620px]">
        {/* Connection card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex flex-col gap-3.5 shadow-inner">
          <div className="flex items-center gap-3">
            {userProfile?.images?.[0]?.url ? (
              <img
                src={userProfile.images[0].url}
                alt="Profile"
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

        {/* Collections Sidebar list */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3 flex flex-col gap-2 overflow-hidden">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1 flex items-center gap-1.5 border-b border-white/5 mb-1.5">
            <ListMusic className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
            Spotify Collections
          </h3>

          <button
            onClick={() => {
              setActiveTab("liked");
              setShowQueue(false);
              setSearchQuery("");
            }}
            disabled={!token}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition disabled:opacity-20 disabled:pointer-events-none ${
              activeTab === "liked"
                ? "bg-[var(--theme-accent)] text-white shadow-[0_0_15px_var(--theme-glow)]"
                : "bg-white/[0.01] hover:bg-white/5 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>All Liked Songs</span>
            </div>
            <span className="opacity-70 text-[10px]">{likedTracks.length}</span>
          </button>

          {/* Sync status overlay */}
          {syncStatus === "loading" && syncProgress && (
            <div className="mt-auto bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)]/10 rounded-xl p-3 flex flex-col gap-2 select-none">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--theme-accent)]" />
                <span>Syncing Library...</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--theme-accent)] h-full transition-all duration-300"
                  style={{ width: `${(syncProgress.loaded / syncProgress.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-zinc-400">
                <span>{syncProgress.loaded} / {syncProgress.total} songs</span>
                <span>{Math.round((syncProgress.loaded / syncProgress.total) * 100)}%</span>
              </div>
            </div>
          )}

          {/* Sync error display */}
          {syncStatus === "error" && syncErrorMsg && (
            <div className="mt-auto bg-red-500/5 border border-red-500/10 rounded-xl p-2.5 flex flex-col gap-1 select-none">
              <span className="text-[10px] font-bold text-red-400">Sync Failed:</span>
              <p className="text-[9px] text-zinc-400 break-words leading-tight">{syncErrorMsg}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. CENTER PANEL: Modern Spinning Player */}
      <div className="lg:col-span-5 flex flex-col gap-6 items-center justify-between h-[620px] bg-white/[0.01] border border-white/[0.03] rounded-3xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Spotify Connect Hub</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Active</span>
          </div>
        </div>

        {/* Vinyl spinning album disc */}
        <div className="relative group my-auto flex items-center justify-center">
          <div className={`w-64 h-64 rounded-full bg-black/60 border border-white/5 flex items-center justify-center relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 ${
            isPlaying ? "scale-105" : "scale-100"
          }`}>
            {/* Grooves */}
            <div className="absolute inset-2 border border-white/5 rounded-full" />
            <div className="absolute inset-6 border border-white/5 rounded-full" />
            <div className="absolute inset-10 border border-white/5 rounded-full" />
            <div className="absolute inset-16 border border-white/5 rounded-full" />
            <div className="absolute inset-24 border border-white/5 rounded-full" />

            <div className={`w-32 h-32 rounded-full overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-transform duration-1000 ${
              isPlaying ? "animate-spin-slow" : ""
            }`}>
              <img
                src={currentTrack?.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"}
                alt="Vinyl Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
            <div className="absolute w-6 h-6 rounded-full bg-[#0d0a1b] border-4 border-black/80 flex items-center justify-center" />
          </div>

          {/* Needle Arm */}
          <div
            className="absolute top-[-25px] right-[40px] w-20 h-44 origin-top-left transition-transform duration-700 pointer-events-none"
            style={{
              transform: isPlaying ? "rotate(18deg)" : "rotate(-12deg)",
              backgroundImage: "linear-gradient(to bottom, #4b5563 5%, #1f2937 100%)",
              clipPath: "polygon(0 0, 8px 0, 4px 176px)"
            }}
          />
        </div>

        {/* Current song details */}
        <div className="w-full text-center flex flex-col gap-1 z-10">
          <h2 className="text-lg font-bold text-white truncate max-w-full px-4">
            {currentTrack ? currentTrack.title : "Ready to Play"}
          </h2>
          <p className="text-xs text-zinc-400 truncate max-w-full px-4">
            {currentTrack ? currentTrack.artist : "Select a Liked Song to start syncing"}
          </p>
        </div>

        {/* Playback Controls & Progress bar */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1 bg-white/5 appearance-none rounded-full cursor-pointer accent-[var(--theme-accent)] transition hover:h-1.5"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-medium select-none">
              <span>{formatSeconds(currentTime)}</span>
              <span>{currentTrack ? currentTrack.duration : "0:00"}</span>
            </div>
          </div>

          <div className="flex justify-between items-center px-4">
            {/* Left side volume slider */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleVolumeMute}
                className="p-1.5 text-zinc-500 hover:text-white transition cursor-pointer"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="h-[2px] w-20 bg-white/10 appearance-none rounded-full cursor-pointer accent-[var(--theme-accent)]"
              />
            </div>

            {/* Central Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSkipBackward}
                className="p-2 text-zinc-400 hover:text-white active:scale-95 transition cursor-pointer"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              <button
                onClick={handleTogglePlay}
                className="p-3.5 bg-white text-[#0d0a1b] rounded-full hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button
                onClick={handleSkipForward}
                className="p-2 text-zinc-400 hover:text-white active:scale-95 transition cursor-pointer"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Connection mode indicator */}
            <div className="text-[9px] uppercase font-bold text-zinc-500 border border-white/10 rounded-full px-2.5 py-1 bg-white/[0.02]">
              {token ? (isSdkConnected ? "SDK Session" : "Web Preview") : "Offline"}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL: Songs List Index / Search */}
      <div className="lg:col-span-4 flex flex-col gap-6 h-[620px]">
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 flex flex-col gap-4 overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-white/5 pb-1 select-none">
            <button
              onClick={() => setShowQueue(false)}
              className={`flex-1 text-center py-2 text-xs font-bold transition cursor-pointer ${
                !showQueue
                  ? "text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)]"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Library Tracks
            </button>
            <button
              onClick={() => setShowQueue(true)}
              className={`flex-1 text-center py-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                showQueue
                  ? "text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)]"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Play Queue
              {playbackQueue.length > 0 && (
                <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[9px] text-zinc-400 font-medium">
                  {playbackQueue.length}
                </span>
              )}
            </button>
          </div>

          {!showQueue ? (
            <>
              {/* Client-side Search */}
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

              {/* Scrollable List Area */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {/* RENDER TRACKS LIST */}
                {filteredTracksList.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => handlePlayTrack(t, idx, filteredTracksList)}
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

                    <div className="flex items-center gap-1.5">
                      {token && t.spotifyUri && (
                        <button
                          onClick={(e) => handleAddToQueue(t, e)}
                          className="p-1 text-zinc-500 hover:text-white hover:scale-110 transition cursor-pointer"
                          title="Add to Play Queue"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {token && t.spotifyUri && (
                        <button
                          onClick={(e) => handleToggleLikeTrack(t, e)}
                          className="p-1 hover:scale-110 transition cursor-pointer"
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
                ))}

                {/* Empty views */}
                {!token && (
                  <div className="text-zinc-500 text-center py-16 text-xs flex flex-col items-center gap-2 select-none">
                    <Sliders className="w-8 h-8 opacity-40 text-[var(--theme-accent)]" />
                    <span>Connect your Spotify account to load your library details.</span>
                  </div>
                )}
                {token && filteredTracksList.length === 0 && (
                  <div className="text-zinc-600 text-center py-16 italic text-xs select-none">
                    No tracks found in library
                  </div>
                )}
              </div>
            </>
          ) : (
            /* PLAY QUEUE VIEW */
            <div className="flex-1 flex flex-col gap-4 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
              {/* Now Playing card */}
              {currentTrack && (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">Now Playing</span>
                  <div className="flex items-center gap-3">
                    <img src={currentTrack.imageUrl} alt={currentTrack.title} className="w-10 h-10 rounded object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-[var(--theme-accent)] truncate">{currentTrack.title}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
                    </div>
                    {isPlaying && <Disc className="w-5 h-5 text-[var(--theme-accent)] animate-spin-slow shrink-0" />}
                  </div>
                </div>
              )}

              {/* Queue items list */}
              <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 px-1">Next Up</span>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {playbackQueue.slice(currentQueueIndex + 1).map((t, indexOffset) => {
                    const actualIndex = currentQueueIndex + 1 + indexOffset;
                    return (
                      <div
                        key={`${t.id}-${actualIndex}`}
                        onClick={() => handlePlayTrack(t, actualIndex, playbackQueue)}
                        className="w-full p-2 rounded-xl text-left text-xs flex items-center justify-between hover:bg-white/[0.02] border border-transparent transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={t.imageUrl} alt={t.title} className="w-8 h-8 rounded object-cover shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-white truncate">{t.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{t.artist}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-500 tabular-nums shrink-0">{t.duration}</span>
                      </div>
                    );
                  })}
                  {playbackQueue.length - 1 <= currentQueueIndex && (
                    <div className="text-zinc-600 text-center py-12 italic text-xs select-none">
                      Queue end reached
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Canvas wave visualizer */}
          <div className="h-16 shrink-0 border-t border-white/5 pt-2 flex flex-col gap-1.5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 select-none">Live Frequency EQ</span>
            <canvas ref={canvasRef} className="w-full h-full bg-white/[0.01] rounded-lg" />
          </div>
        </div>
      </div>

      {/* HTML5 Audio Fallback Player */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSkipForward}
      />
    </div>
  );
}
