import React, { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore
import portalLogo from './portal-logo.png';
import { 
  Home, MessageSquare, Gamepad2, Folder, Image, Globe, Sparkles, 
  Wrench, Code2, FileText, Calendar, AlarmClock, Settings, 
  Search, Bell, ChevronDown, Plus, Check, Play, Pause, Trash2, 
  Download, Sparkle, Server, Shield, Brain, Cpu, Database, 
  Battery, AlertCircle, RefreshCw, Send, CheckCircle2, X, Fingerprint,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Dices, Trophy, Trash, CalendarRange, ChefHat,
  ArrowLeft, ArrowRight, Bot, Lock, Volume2, VolumeX, Link, Copy, Eye, Music, ExternalLink
} from 'lucide-react';
import { AudioPlayer, TRACKS } from './components/AudioPlayer';
import { NeonDriftGame } from './components/NeonDriftGame';
import DiceTrayCanvas from './components/DiceTrayCanvas';
import { CookbookContainer } from './components/cookbook/CookbookContainer';
import D20War from './components/D20War';
import CosmicWords from './components/CosmicWords';
import TenGamesArena from './components/TenGamesArena';
import MusicHub from './components/music/MusicHub';

const SPORTS_LEAGUES = {
  mlb: {
    label: 'MLB Baseball',
    url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  },
  eng1: {
    label: 'Premier League',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
  },
  nba: {
    label: 'NBA Basketball',
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  },
  nfl: {
    label: 'NFL Football',
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  },
  nhl: {
    label: 'NHL Hockey',
    url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  },
};

type SportsLeague = keyof typeof SPORTS_LEAGUES;

const THEME_PRESET_COLORS = [
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Grey', hex: '#9ca3af' },
];

const getColorPresetValue = (hexValue: string) => {
  if (!hexValue) return 'custom';
  const match = THEME_PRESET_COLORS.find(c => c.hex.toLowerCase() === hexValue.toLowerCase());
  return match ? match.name.toLowerCase() : 'custom';
};

const handlePresetColorChange = (value: string, setter: (hex: string) => void, storageKey: string) => {
  if (value !== 'custom') {
    const match = THEME_PRESET_COLORS.find(c => c.name.toLowerCase() === value);
    if (match) {
      setter(match.hex);
      localStorage.setItem(storageKey, match.hex);
    }
  }
};

interface ParlayLeg {
  id: string;
  league: SportsLeague;
  eventId: string;
  teamId: string;
  teamName: string;
  opponentName: string;
  matchup: string;
  pickedAt: string;
  status?: string;
}

interface Parlay {
  id: string;
  legs: ParlayLeg[];
  savedAt: string;
  status: 'won' | 'lost' | 'live' | 'pending' | 'push';
}

const store = {
  get(key: string, fallback: any) {
    try {
      const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
      const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
      const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
      const v = localStorage.getItem(finalKey);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key: string, val: any) {
    try {
      const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
      const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
      const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
      localStorage.setItem(finalKey, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  },
};

// Navigation list
const NAV_ITEMS = [
  { id: 'chat', label: 'AI Chat', icon: Bot },
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'cookbook', label: 'Cookbook', icon: ChefHat },
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'utilities', label: 'Utilities', icon: Dices },
];

// Quick Access Items from reference image
const QUICK_ACCESS = [
  { id: 'chat', label: 'AI Chat', icon: Bot, color: 'purple', desc: 'Interact with NextGen 7B model' },
  { id: 'games', label: 'Games', icon: Trophy, color: 'blue', desc: 'Arcade and virtual reality sims' },
  { id: 'files', label: 'Files', icon: Folder, color: 'cyan', desc: 'Secure decentralized storage' },
  { id: 'images', label: 'Images', icon: Image, color: 'emerald', desc: 'AI media canvas & renders' },
  { id: 'browser', label: 'Browser', icon: Globe, color: 'cyan', desc: 'Encrypted sandboxed network' },
  { id: 'music', label: 'Music', icon: Music, color: 'purple', desc: 'Sleek custom Spotify Player' },
  { id: 'utilities', label: 'Utilities', icon: Dices, color: 'purple', desc: 'System alchemical dice basins' },
  { id: 'code', label: 'Code', icon: Code2, color: 'blue', desc: 'Embedded sandbox compiler' },
  { id: 'notes', label: 'Notes', icon: FileText, color: 'amber', desc: 'Dynamic markdown compiler' },
  { id: 'calendar', label: 'Calendar', icon: CalendarRange, color: 'pink', desc: 'Quantum timeline schedule' },
  { id: 'alarms', label: 'Alarms', icon: AlarmClock, color: 'pink', desc: 'Core temporal triggers' },
  { id: 'downloads', label: 'Downloads', icon: Download, color: 'cyan', desc: 'Remote payload manager' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'purple', desc: 'Core UI & trim calibrator' },
];

// Helper: Generate a random string of input length for PKCE
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map((x) => possible[x % possible.length]).join('');
}

// Helper: SHA-256 hash of a string
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

// Helper: Base64URL encode an ArrayBuffer
function base64urlencode(a: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a) as any))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64urlencode(hashed);
}

export default function App() {
  // --- Spotify Connection States ---
  const [spotifyToken, setSpotifyToken] = useState<string | null>(() => localStorage.getItem("spotify_access_token") || null);
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(() => localStorage.getItem("spotify_refresh_token") || null);
  const [spotifyUser, setSpotifyUser] = useState<{ id: string; display_name: string; imageUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";

  const handleCopyRedirectUri = () => {
    if (redirectUri) {
      navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    } catch (err: any) {
      console.error("Failed to load Spotify details:", err);
    }
  };

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

  const handleDisconnectSpotify = () => {
    setSpotifyToken(null);
    setSpotifyRefreshToken(null);
    setSpotifyUser(null);
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
  };

  const handleConnectSpotify = async () => {
    try {
      const clientId = "6238dcf567664f328bde1570c68f9eae";
      const redirectUri = window.location.origin + window.location.pathname;
      
      const codeVerifier = generateRandomString(64);
      localStorage.setItem("spotify_code_verifier", codeVerifier);

      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const scope = "user-read-private user-read-email user-library-read playlist-read-private playlist-read-collaborative streaming user-modify-playback-state user-read-playback-state";
      
      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
      });

      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const authWindow = window.open(
        authUrl,
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

  useEffect(() => {
    // 1. Initial fetch if token is present
    const savedToken = localStorage.getItem("spotify_access_token");
    if (savedToken && savedToken !== "null" && savedToken !== "undefined") {
      fetchSpotifyData(savedToken);
    }

    // 2. Check if page loaded as a callback redirection URL with ?code=...
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      const exchangeCodeForToken = async () => {
        try {
          const clientId = "6238dcf567664f328bde1570c68f9eae";
          const redirectUri = window.location.origin + window.location.pathname;
          const codeVerifier = localStorage.getItem("spotify_code_verifier") || "";

          const payload = new URLSearchParams({
            client_id: clientId,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          });

          const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: payload.toString(),
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error_description || "Token exchange failed");
          }

          const data = await res.json();
          const { access_token, refresh_token } = data;

          if (window.opener) {
            window.opener.postMessage(
              {
                type: "SPOTIFY_AUTH_SUCCESS",
                tokens: { accessToken: access_token, refreshToken: refresh_token || "" },
              },
              window.location.origin
            );
            window.close();
          } else {
            setSpotifyToken(access_token);
            if (refresh_token) {
              setSpotifyRefreshToken(refresh_token);
              localStorage.setItem("spotify_refresh_token", refresh_token);
            }
            localStorage.setItem("spotify_access_token", access_token);
            fetchSpotifyData(access_token);
            toast("Spotify connected successfully!", "success");
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err: any) {
          console.error("Token exchange failed:", err);
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "SPOTIFY_AUTH_FAILURE",
                error: err.message,
              },
              window.location.origin
            );
            window.close();
          } else {
            toast(`Spotify connection failed: ${err.message}`, "error");
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      };
      exchangeCodeForToken();
    }

    // 3. Listen for postMessage updates from callback popup windows
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === "SPOTIFY_AUTH_SUCCESS") {
        const { accessToken, refreshToken } = event.data.tokens;
        setSpotifyToken(accessToken);
        setSpotifyRefreshToken(refreshToken);
        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_refresh_token", refreshToken);
        fetchSpotifyData(accessToken);
        toast("Spotify connected successfully!", "success");
      } else if (event.data?.type === "SPOTIFY_AUTH_FAILURE") {
        toast(`Spotify connection failed: ${event.data.error || "Unknown Error"}`, "error");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // --- Secure Storage & Sub-tab States ---
  const [settingsSubTab, setSettingsSubTab] = useState<'appearance' | 'spotify' | 'session'>('appearance');
  const [payloadFiles, setPayloadFiles] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<any | null>(null);

  // --- Secure Local IndexedDB Storage Utility ---
  const DB_NAME = 'portal-secure-storage-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'secure-payloads';

  const initSecureDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const saveFileToSecureDB = (file: any): Promise<void> => {
    return initSecureDB().then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(file);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  };

  const getFilesFromSecureDB = (): Promise<any[]> => {
    return initSecureDB().then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    });
  };

  const deleteFileFromSecureDB = (id: string): Promise<void> => {
    return initSecureDB().then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  };

  useEffect(() => {
    getFilesFromSecureDB()
      .then(files => {
        setPayloadFiles(files || []);
      })
      .catch(err => {
        console.error("IndexedDB initialization error:", err);
      });
  }, []);

  const handleSecureUpload = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast("Payload too large (Max 50MB)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      
      const newFileObj = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: sizeStr,
        type: file.type,
        data: dataUrl,
        uploadedAt: new Date().toLocaleString()
      };

      saveFileToSecureDB(newFileObj)
        .then(() => {
          setPayloadFiles(prev => [newFileObj, ...prev]);
          toast("Payload stored securely in local browser storage!", "success");
          haptic(15);
        })
        .catch(err => {
          console.error("Secure save failed:", err);
          toast("Failed to save payload locally.", "error");
        });
    };
    reader.readAsDataURL(file);
  };

  const handleSecureDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to securely delete payload: ${name}?`)) {
      deleteFileFromSecureDB(id)
        .then(() => {
          setPayloadFiles(prev => prev.filter(f => f.id !== id));
          toast("Payload securely purged from local storage.", "success");
          haptic(15);
        })
        .catch(err => {
          console.error("Purge failed:", err);
          toast("Failed to purge payload.", "error");
        });
    }
  };

  // --- User Authentication & Local Storage Scoped States ---
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('portal_current_user') || null);
  const [showStartScreen, setShowStartScreen] = useState(() => !localStorage.getItem('portal_current_user'));
  const [loginTab, setLoginTab] = useState<'login' | 'signup'>('login');
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [signupUser, setSignupUser] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Customizable Profile states
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('portal_user_avatar') || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=128&auto=format&fit=crop";
  });
  const [userStatus, setUserStatus] = useState<'online' | 'idle' | 'dnd' | 'offline'>(() => {
    return (localStorage.getItem('portal_user_status') as any) || 'online';
  });
  const [userStatusMsg, setUserStatusMsg] = useState<string>(() => {
    return localStorage.getItem('portal_user_status_msg') || 'Exploring the rift...';
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Temporary states for edits inside the modal
  const [tempDisplayName, setTempDisplayName] = useState(currentUser || '');
  const [tempAvatar, setTempAvatar] = useState(userAvatar);
  const [tempStatus, setTempStatus] = useState(userStatus);
  const [tempStatusMsg, setTempStatusMsg] = useState(userStatusMsg);

  useEffect(() => {
    if (showProfileModal) {
      setTempDisplayName(currentUser || '');
      setTempAvatar(userAvatar);
      setTempStatus(userStatus);
      setTempStatusMsg(userStatusMsg);
    }
  }, [showProfileModal, currentUser, userAvatar, userStatus, userStatusMsg]);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Theme Mode (Dark Purple / White) ---
  const [portalDarkMode, setPortalDarkMode] = useState<boolean>(() => localStorage.getItem('portal_dark_mode') === 'true');
  const togglePortalDarkMode = () => {
    setPortalDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('portal_dark_mode', String(next));
      return next;
    });
  };

  // --- Sports Board & Parlay Tracker States ---
  const [activeSportsLeague, setActiveSportsLeague] = useState<SportsLeague>('mlb');
  const [sportsGamesMap, setSportsGamesMap] = useState<Record<SportsLeague, any[]>>({
    mlb: [],
    eng1: [],
    nba: [],
    nfl: [],
    nhl: [],
  } as any);
  const sportsGames = sportsGamesMap[activeSportsLeague] || [];
  const [sportsSubTab, setSportsSubTab] = useState<'scores' | 'schedule'>('scores');
  const [sportsDateOffset, setSportsDateOffset] = useState<number>(0);
  const [sportsViewFilter, setSportsViewFilter] = useState<'all' | 'scores' | 'schedule'>('all');
  const [sportsSearchQuery, setSportsSearchQuery] = useState<string>('');
  const [sportsPinnedGames, setSportsPinnedGames] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sportcast_pinned') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [sportsActivityLog, setSportsActivityLog] = useState<Array<{ type: string; msg: string; time: string }>>([
    { type: 'System', msg: 'Secure FreeGate initialized. Loaded 0-cost feed.', time: new Date().toLocaleTimeString() }
  ]);
  const [sportsStatus, setSportsStatus] = useState('Initiating zero-cost feed connection...');
  const [sportsUpdated, setSportsUpdated] = useState('Just Now');
  const [sportsFavorites, setSportsFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sports_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [sportsFavoriteInput, setSportsFavoriteInput] = useState('');
  const [parlaySlip, setParlaySlip] = useState<ParlayLeg[]>([]);
  const [sportsParlays, setSportsParlays] = useState<Parlay[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sports_parlays') || '[]');
    } catch {
      return [];
    }
  });

  // --- Game Selection State ---
  const [selectedGameSuite, setSelectedGameSuite] = useState<'arcade' | 'drift'>('arcade');

  // --- TI-84 Plus CE Graphing Calculator States ---
  const [mathLoaded, setMathLoaded] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [inputVal, setInputVal] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const [history, setHistory] = useState([
    { input: '2 * cos(pi / 3)', output: '1' },
    { input: 'sin(pi / 2) + 5^2', output: '26' }
  ]);
  const [lastAnswer, setLastAnswer] = useState('26');
  const [equations, setEquations] = useState<Record<string, string>>({
    Y1: 'x^2 - 4',
    Y2: '2 * sin(x)',
    Y3: '',
    Y4: ''
  });
  const [activeEqIndex, setActiveEqIndex] = useState('Y1');
  const [windowSettings, setWindowSettings] = useState<Record<string, number>>({
    Xmin: -10,
    Xmax: 10,
    Xscl: 1,
    Ymin: -10,
    Ymax: 10,
    Yscl: 1
  });
  const [activeWindowIndex, setActiveWindowIndex] = useState('Xmin');
  const [tblSettings, setTblSettings] = useState<Record<string, number>>({
    TblStart: 0,
    dTbl: 1
  });
  const [activeTblIndex, setActiveTblIndex] = useState('TblStart');
  const [tableOffset, setTableOffset] = useState(0);
  const [angleMode, setAngleMode] = useState('RADIAN');
  const [numberFormat, setNumberFormat] = useState('NORMAL');
  const [decimalPlaces, setDecimalPlaces] = useState('FLOAT');
  const [is2nd, setIs2nd] = useState(false);
  const [isAlpha, setIsAlpha] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [traceX, setTraceX] = useState(0);
  const [traceEquationIndex, setTraceEquationIndex] = useState('Y1');
  const [programList] = useState(['SNAKE', 'TETRIS']);
  const [activeProgIndex, setActiveProgIndex] = useState(0);

  // ROM Games (within calculator screen) states
  const [snake, setSnake] = useState<Array<{x: number, y: number}>>([]);
  const [snakeDir, setSnakeDir] = useState({ x: 1, y: 0 });
  const [snakeFood, setSnakeFood] = useState({ x: 5, y: 5 });
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeHighScore, setSnakeHighScore] = useState(0);
  const [snakeOver, setSnakeOver] = useState(false);
  const [tetrisBoard, setTetrisBoard] = useState<Array<Array<number>>>([]);
  const [tetrisPiece, setTetrisPiece] = useState<any>(null);
  const [tetrisPos, setTetrisPos] = useState({ x: 0, y: 0 });
  const [tetrisScore, setTetrisScore] = useState(0);
  const [tetrisOver, setTetrisOver] = useState(false);

  // --- Character Sheet & Notes persistence states ---
  const [charSheet, setCharSheet] = useState<Record<string, string>>(() => store.get('char_sheet', {}));

  // --- Oracle & Dimensional Scanner States ---
  const [oracleQuery, setOracleQuery] = useState('');
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleAnswer, setOracleAnswer] = useState('');
  const [showRiftVision, setShowRiftVision] = useState(false);
  const [riftVisionMode, setRiftVisionMode] = useState<'notes' | 'betslip' | 'character' | 'dice' | 'calendar' | 'ask'>('notes');
  const [riftVisionImage, setRiftVisionImage] = useState<string | null>(null);
  const [riftVisionScanning, setRiftVisionScanning] = useState(false);
  const [riftVisionResult, setRiftVisionResult] = useState<string | null>(null);
  const [riftCustomQuestion, setRiftCustomQuestion] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // --- Local Offline AI Status States ---
  const [localAIStatus, setLocalAIStatus] = useState<string>('not_installed');
  const [localAIEngineError, setLocalAIEngineError] = useState<string>('');

  // --- Sub-Tab & View Custom Interface States ---
  const [utilityTab, setUtilityTab] = useState<'dice' | 'sheet' | 'notes' | 'calendar' | 'tasks' | 'calc' | 'timer' | 'cookbook'>('dice');
  const [browserUrl, setBrowserUrl] = useState('https://treydog-ramirez.github.io/dnd-portal/');
  const [browserInput, setBrowserInput] = useState('https://treydog-ramirez.github.io/dnd-portal/');
  const [browserHistory, setBrowserHistory] = useState<string[]>(['https://treydog-ramirez.github.io/dnd-portal/']);
  const [browserLoading, setBrowserLoading] = useState(false);

  useEffect(() => {
    setBrowserInput(browserUrl);
  }, [browserUrl]);
  const [codeSnippet, setCodeSnippet] = useState('// Quantum Mainframe Boot sequence\nfunction boot() {\n  console.log("Calibrating star dust...");\n  return "ONLINE";\n}\nboot();');
  const [codeConsole, setCodeConsole] = useState<string[]>(['>>> Mainframe terminal ready. Input scripts to execute matrix calculations.']);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [calEvents, setCalEvents] = useState<Record<string, string[]>>(() => store.get('cal_events', {}));
  const [calendarEventText, setCalendarEventText] = useState('');
  const [newAlarmTime, setNewAlarmTime] = useState('12:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');

  // --- Cookbook State Variables ---
  const [recipes, setRecipes] = useState<any[]>(() => {
    const saved = localStorage.getItem('portal_recipes');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        title: 'Campfire Elixir (Lofi Chai)',
        category: 'Camp Brew',
        time: '10 mins',
        description: 'Warm Chai tea brewed with star anise, cardamom, and clove, ideal for cold dungeon nights.',
        ingredients: 'Black Tea, Star Anise, Cardamom pods, Milk, Honey',
        instructions: 'Boil spices in water. Add tea leaves, then milk and honey. Simmer for 5 minutes. Strain and serve.',
        effects: '+15 Temp HP, +2 Focus'
      },
      {
        id: '2',
        title: 'Dwarven Trail Bread',
        category: 'Camp Ration',
        time: '45 mins',
        description: 'Dense, nut-packed bread baked with honey and berries that lasts months without spoiling.',
        ingredients: 'Almond flour, Dried cranberries, Honey, Eggs, Walnuts',
        instructions: 'Mix ingredients into a thick dough. Bake at 350°F (175°C) for 35 minutes until golden brown.',
        effects: 'Satisfies hunger for 24 hours'
      },
      {
        id: '3',
        title: 'Mana Draught (Star Fruit Tonic)',
        category: 'Magic Brew',
        time: '5 mins',
        description: 'Sparkling blue elixir brewed from star fruit and mint leaf.',
        ingredients: 'Star fruit syrup, Mint, Sparkling water, Blue spirulina',
        instructions: 'Muddle mint with syrup. Add spirulina, ice, and top with sparkling water. Stir gently.',
        effects: 'Restores +20 Mana'
      }
    ];
  });
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('1');
  const [decryptUrl, setDecryptUrl] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptLogs, setDecryptLogs] = useState<string[]>([]);
  const [recipeActiveSubMode, setRecipeActiveSubMode] = useState<'transcribe' | 'manual'>('transcribe');

  // Manual recipe form state
  const [newRecipeTitle, setNewRecipeTitle] = useState('');
  const [newRecipeCategory, setNewRecipeCategory] = useState('Camp Brew');
  const [newRecipeTime, setNewRecipeTime] = useState('15 mins');
  const [newRecipeDesc, setNewRecipeDesc] = useState('');
  const [newRecipeIngredients, setNewRecipeIngredients] = useState('');
  const [newRecipeInstructions, setNewRecipeInstructions] = useState('');
  const [newRecipeEffects, setNewRecipeEffects] = useState('');

  // Link decoder simulator
  const handleDecodeRecipe = () => {
    if (!decryptUrl.trim()) {
      toast("⚠️ Please enter a recipe link first!");
      return;
    }
    haptic(15);
    setDecrypting(true);
    setDecryptLogs([]);
    
    const logs = [
      "📡 CONNECTING TO EXTERNAL MEDIA PORTAL...",
      "⚡ STREAMING AUDIO FROM CAPTIONS CHANNELS...",
      "🔮 DECRYPTING ALCHEMICAL PARAMETERS...",
      "📝 EXTRACTING PANTRY INGREDIENTS...",
      "✨ COMPILING INSTRUCTIONS VECTOR...",
      "🏆 FUSION COMPLETED SUCCESS!"
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < logs.length) {
        setDecryptLogs(prev => [...prev, logs[currentLogIdx]]);
        currentLogIdx++;
      } else {
        clearInterval(interval);
        // Add new simulated decoded recipe
        const newId = String(Date.now());
        const domain = decryptUrl.includes('tiktok.com') ? 'TikTok' : decryptUrl.includes('youtube.com') ? 'YouTube' : 'Instagram';
        const newDecoded = {
          id: newId,
          title: `Decoded ${domain} Ramen Potion`,
          category: 'Camp Ration',
          time: '15 mins',
          description: `Alchemical ramen variant transcribed from the shared social link: ${decryptUrl}`,
          ingredients: 'Instant Ramen Noodles, Soy Sauce, Sesame Oil, Soft Boiled Egg, Scallions, Chili flakes',
          instructions: 'Cook noodles in boiling water. Stir in soy sauce and sesame oil. Top with scallions, chili flakes, and egg.',
          effects: '+10 Agility, +5 Health restoration'
        };
        const updated = [...recipes, newDecoded];
        setRecipes(updated);
        localStorage.setItem('portal_recipes', JSON.stringify(updated));
        setSelectedRecipeId(newId);
        setDecrypting(false);
        setDecryptUrl('');
        toast("🧙‍♂️ Recipe successfully decoded and stored in Codex!");
      }
    }, 800);
  };

  const handleSaveManualRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeTitle.trim() || !newRecipeIngredients.trim() || !newRecipeInstructions.trim()) {
      toast("⚠️ Please fill in Title, Ingredients, and Instructions!");
      return;
    }
    const newId = String(Date.now());
    const manualRecipe = {
      id: newId,
      title: newRecipeTitle.trim(),
      category: newRecipeCategory,
      time: newRecipeTime.trim(),
      description: newRecipeDesc.trim() || 'Custom alchemical concoction.',
      ingredients: newRecipeIngredients.trim(),
      instructions: newRecipeInstructions.trim(),
      effects: newRecipeEffects.trim() || 'N/A'
    };
    const updated = [...recipes, manualRecipe];
    setRecipes(updated);
    localStorage.setItem('portal_recipes', JSON.stringify(updated));
    setSelectedRecipeId(newId);
    
    // reset form
    setNewRecipeTitle('');
    setNewRecipeDesc('');
    setNewRecipeIngredients('');
    setNewRecipeInstructions('');
    setNewRecipeEffects('');
    setRecipeActiveSubMode('transcribe');
    toast("🏆 Custom recipe successfully enscribed in Codex!");
  };

  const handleDeleteRecipe = (id: string) => {
    haptic(10);
    const updated = recipes.filter(r => r.id !== id);
    setRecipes(updated);
    localStorage.setItem('portal_recipes', JSON.stringify(updated));
    if (selectedRecipeId === id && updated.length > 0) {
      setSelectedRecipeId(updated[0].id);
    }
    toast("Purged alchemical recipe from Codex.");
  };

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lcdScreenRef = useRef<HTMLDivElement | null>(null);
  const riftVideoRef = useRef<HTMLVideoElement | null>(null);
  const riftCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) return 'music';
    return localStorage.getItem('portal_active_tab') || 'home';
  });

  useEffect(() => {
    localStorage.setItem('portal_active_tab', activeTab);
  }, [activeTab]);
  const [themeColor, setThemeColor] = useState('purple'); // breathing trim theme: silver, purple, cyan, pink, emerald, amber
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPalette, setShowSearchPalette] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- Traveler Settings States ---
  const [qrType, setQrType] = useState<'live' | 'github'>('live');
  const [githubUrl, setGithubUrl] = useState(() => {
    return localStorage.getItem('portal_github_site_url') || 'https://Treydog-ramirez.github.io/dnd-portal/';
  });
  const [feedbackList, setFeedbackList] = useState<any[]>(() => {
    try {
      const v = localStorage.getItem('global_feedback_ideas');
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });
  const [feedbackInput, setFeedbackInput] = useState('');
  const [settingsMotion, setSettingsMotion] = useState<boolean>(() => {
    const v = localStorage.getItem('portal_settings_motion');
    return v !== 'false';
  });

  // Soundscape mood & controls
  const [soundscapeMood, setSoundscapeMood] = useState<'space' | 'campfire' | 'chimes'>('space');
  const [soundscapeVol, setSoundscapeVol] = useState<number>(0.04);
  const [soundscapeActive, setSoundscapeActive] = useState<boolean>(false);

  // Background Portal Custom Video
  const [bgVideoUrl, setBgVideoUrl] = useState<string | null>(() => localStorage.getItem('portal_bg_video_url') || null);
  const [bgVideoOpacity, setBgVideoOpacity] = useState<number>(() => parseInt(localStorage.getItem('portal_bg_video_opacity') || '45'));
  const [bgVideoBlur, setBgVideoBlur] = useState<number>(() => parseInt(localStorage.getItem('portal_bg_video_blur') || '0'));
  const [bgVideoBrightness, setBgVideoBrightness] = useState<number>(() => parseInt(localStorage.getItem('portal_bg_video_brightness') || '70'));
  const [bgVideoHue, setBgVideoHue] = useState<number>(() => parseInt(localStorage.getItem('portal_bg_video_hue') || '0'));

  // Feedback, Dice & your data configs
  const [hapticsActive, setHapticsActive] = useState<boolean>(() => {
    const v = localStorage.getItem('portal_haptics_active');
    return v !== 'false';
  });
  const [soundActive, setSoundActive] = useState<boolean>(() => {
    const v = localStorage.getItem('portal_sound_active');
    return v !== 'false';
  });
  const [defaultDie, setDefaultDie] = useState<string>(() => {
    return localStorage.getItem('portal_default_die') || '20';
  });
  const [greetingCoinFlip, setGreetingCoinFlip] = useState<boolean>(() => {
    const v = localStorage.getItem('portal_greeting_coin_flip');
    return v !== 'false';
  });

  // --- Dynamic Theme Customizer States ---
  const [darkThemePreset, setDarkThemePreset] = useState<'purple' | 'red' | 'black' | 'pink' | 'green' | 'custom'>(() => {
    return (localStorage.getItem('portal_dark_theme_preset') as any) || 'purple';
  });
  const [lightThemePreset, setLightThemePreset] = useState<'purple' | 'red' | 'black' | 'pink' | 'green' | 'custom'>(() => {
    return (localStorage.getItem('portal_light_theme_preset') as any) || 'purple';
  });
  const [themeUseGradient, setThemeUseGradient] = useState<boolean>(() => {
    const v = localStorage.getItem('portal_theme_use_gradient');
    return v !== 'false';
  });
  const [customColor1Light, setCustomColor1Light] = useState<string>(() => {
    return localStorage.getItem('portal_custom_color1_light') || '#8b5cf6';
  });
  const [customColor2Light, setCustomColor2Light] = useState<string>(() => {
    return localStorage.getItem('portal_custom_color2_light') || '#a78bfa';
  });
  const [customColor1Dark, setCustomColor1Dark] = useState<string>(() => {
    return localStorage.getItem('portal_custom_color1_dark') || '#8b5cf6';
  });
  const [customColor2Dark, setCustomColor2Dark] = useState<string>(() => {
    return localStorage.getItem('portal_custom_color2_dark') || '#ec4899';
  });
  const [customBgStartDark, setCustomBgStartDark] = useState<string>(() => {
    return localStorage.getItem('portal_custom_bg_start_dark') || '#06000f';
  });
  const [customBgEndDark, setCustomBgEndDark] = useState<string>(() => {
    return localStorage.getItem('portal_custom_bg_end_dark') || '#0d0221';
  });
  const [customBgStartLight, setCustomBgStartLight] = useState<string>(() => {
    return localStorage.getItem('portal_custom_bg_start_light') || '#ffffff';
  });
  const [customBgEndLight, setCustomBgEndLight] = useState<string>(() => {
    return localStorage.getItem('portal_custom_bg_end_light') || '#eedfff';
  });
  const [themePresetViceVersa, setThemePresetViceVersa] = useState<boolean>(() => {
    return localStorage.getItem('portal_theme_preset_vice_versa') === 'true';
  });

  // Theme styling calculation
  const getThemeCSSVariables = () => {
    let color1 = '#8b5cf6';
    let color2 = '#ec4899';
    let bgStart = '#06000f';
    let bgEnd = '#0d0221';
    let cardBg = 'rgba(10, 2, 28, 0.82)';
    let cardBorder = 'rgba(139, 92, 246, 0.25)';

    if (!portalDarkMode) {
      // Light Mode (White-based)
      bgStart = '#ffffff';
      bgEnd = '#f3e8ff';
      cardBg = 'rgba(255, 255, 255, 0.72)';
      cardBorder = 'rgba(139, 92, 246, 0.15)';

      switch (lightThemePreset) {
        case 'purple':
          color1 = '#8b5cf6';
          color2 = '#db2777';
          bgEnd = '#f3e8ff'; // White with Purple gradient
          cardBorder = 'rgba(139, 92, 246, 0.15)';
          break;
        case 'blue':
          color1 = '#3b82f6';
          color2 = '#06b6d4';
          bgEnd = '#eff6ff'; // White with Blue gradient
          cardBorder = 'rgba(59, 130, 246, 0.15)';
          break;
        case 'red':
          color1 = '#dc2626';
          color2 = '#f87171';
          bgEnd = '#fee2e2'; // White with Red gradient
          cardBorder = 'rgba(220, 38, 38, 0.15)';
          break;
        case 'green':
          color1 = '#10b981';
          color2 = '#34d399';
          bgEnd = '#d1fae5'; // White with Green gradient
          cardBorder = 'rgba(16, 185, 129, 0.15)';
          break;
        case 'black':
          color1 = '#1f2937';
          color2 = '#9ca3af';
          bgEnd = '#f3f4f6'; // White with Grey/Black gradient
          cardBorder = 'rgba(31, 41, 55, 0.12)';
          break;
        case 'pink':
          color1 = '#db2777';
          color2 = '#fbcfe8';
          bgEnd = '#fce7f3'; // White with Pink gradient
          cardBorder = 'rgba(219, 39, 119, 0.15)';
          break;
        case 'custom':
          color1 = customColor1Light;
          color2 = customColor2Light;
          bgStart = customBgStartLight;
          bgEnd = customBgEndLight;
          cardBorder = `${customColor1Light}25`;
          break;
      }
    } else {
      // Dark Mode variations
      switch (darkThemePreset) {
        case 'purple':
          color1 = '#8b5cf6';
          color2 = '#ec4899';
          bgStart = '#0d0221';
          bgEnd = '#25023a'; // Purple with Pink gradient background
          cardBg = 'rgba(13, 2, 33, 0.82)';
          cardBorder = 'rgba(139, 92, 246, 0.25)';
          break;
        case 'blue':
          color1 = '#3b82f6';
          color2 = '#06b6d4';
          bgStart = '#020817';
          bgEnd = '#0b1528'; // Blue with Cyan gradient background
          cardBg = 'rgba(2, 8, 23, 0.82)';
          cardBorder = 'rgba(59, 130, 246, 0.25)';
          break;
        case 'red':
          color1 = '#dc2626';
          color2 = '#000000';
          bgStart = '#1a0505';
          bgEnd = '#050000'; // Red with Black gradient background
          cardBg = 'rgba(26, 5, 5, 0.82)';
          cardBorder = 'rgba(220, 38, 38, 0.25)';
          break;
        case 'green':
          color1 = '#10b981';
          color2 = '#db2777';
          bgStart = '#021a0c';
          bgEnd = '#000000'; // Green with Pink gradient background
          cardBg = 'rgba(2, 26, 12, 0.82)';
          cardBorder = 'rgba(16, 185, 129, 0.25)';
          break;
        case 'black':
          color1 = '#ffffff';
          color2 = '#1f2937';
          bgStart = '#050505';
          bgEnd = '#121212';
          cardBg = 'rgba(10, 10, 10, 0.9)';
          cardBorder = 'rgba(255, 255, 255, 0.08)';
          break;
        case 'pink':
          color1 = '#db2777';
          color2 = '#8b5cf6';
          bgStart = '#260218';
          bgEnd = '#0d0008'; // Pink with Purple gradient background
          cardBg = 'rgba(38, 2, 24, 0.82)';
          cardBorder = 'rgba(219, 39, 119, 0.25)';
          break;
        case 'custom':
          color1 = customColor1Dark;
          color2 = customColor2Dark;
          bgStart = customBgStartDark;
          bgEnd = customBgEndDark;
          cardBg = 'rgba(15, 10, 25, 0.85)';
          cardBorder = `${customColor1Dark}35`;
          break;
      }
    }

    if (themePresetViceVersa) {
      const temp = color1;
      color1 = color2;
      color2 = temp;
    }

    const isGradient = themeUseGradient;
    const btnGradient = isGradient ? `linear-gradient(135deg, ${color1}, ${color2})` : color1;

    return {
      '--theme-accent-color-1': color1,
      '--theme-accent-color-2': color2,
      '--theme-bg-gradient-start': bgStart,
      '--theme-bg-gradient-end': bgEnd,
      '--theme-card-bg': cardBg,
      '--theme-card-border': cardBorder,
      '--theme-btn-gradient': btnGradient,
    } as React.CSSProperties;
  };


  const currentThemeStyles = getThemeCSSVariables();

  // Web Audio Refs for Real-time Synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundscapeGainNodeRef = useRef<GainNode | null>(null);
  const soundscapeSourceNodeRef = useRef<any>(null);
  const rumblingOsc1Ref = useRef<OscillatorNode | null>(null);
  const rumblingOsc2Ref = useRef<OscillatorNode | null>(null);
  const soundscapeIntervalRef = useRef<any>(null);

  const cleanupSoundscapeIntervals = () => {
    if (soundscapeIntervalRef.current) {
      clearInterval(soundscapeIntervalRef.current);
      soundscapeIntervalRef.current = null;
    }
  };

  const cleanupSoundscapeNodes = () => {
    if (soundscapeSourceNodeRef.current) {
      try { soundscapeSourceNodeRef.current.stop(); } catch {}
      soundscapeSourceNodeRef.current = null;
    }
    if (rumblingOsc1Ref.current) {
      try { rumblingOsc1Ref.current.stop(); } catch {}
      rumblingOsc1Ref.current = null;
    }
    if (rumblingOsc2Ref.current) {
      try { rumblingOsc2Ref.current.stop(); } catch {}
      rumblingOsc2Ref.current = null;
    }
    if (soundscapeGainNodeRef.current) {
      try { soundscapeGainNodeRef.current.disconnect(); } catch {}
      soundscapeGainNodeRef.current = null;
    }
  };

  const startSoundscape = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      cleanupSoundscapeNodes();

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(soundscapeVol, ctx.currentTime);
      gainNode.connect(ctx.destination);
      soundscapeGainNodeRef.current = gainNode;

      if (soundscapeMood === 'space') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(55.4, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);

        osc1.start();
        osc2.start();

        rumblingOsc1Ref.current = osc1;
        rumblingOsc2Ref.current = osc2;

        let phase = 0;
        soundscapeIntervalRef.current = setInterval(() => {
          phase += 0.05;
          const cutoff = 120 + Math.sin(phase) * 40;
          filter.frequency.linearRampToValueAtTime(cutoff, ctx.currentTime + 0.5);
        }, 500);

      } else if (soundscapeMood === 'campfire') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;

        const baseFilter = ctx.createBiquadFilter();
        baseFilter.type = 'bandpass';
        baseFilter.frequency.setValueAtTime(400, ctx.currentTime);
        baseFilter.Q.setValueAtTime(0.5, ctx.currentTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);

        noiseNode.connect(baseFilter).connect(noiseGain).connect(gainNode);
        noiseNode.start();
        soundscapeSourceNodeRef.current = noiseNode;

        soundscapeIntervalRef.current = setInterval(() => {
          const snapOsc = ctx.createOscillator();
          const snapGain = ctx.createGain();
          snapOsc.type = 'triangle';
          snapOsc.frequency.setValueAtTime(100 + Math.random() * 1000, ctx.currentTime);
          snapGain.gain.setValueAtTime(0.06 * Math.random(), ctx.currentTime);
          snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
          snapOsc.connect(snapGain).connect(gainNode);
          snapOsc.start();
          snapOsc.stop(ctx.currentTime + 0.05);
        }, 180);

      } else if (soundscapeMood === 'chimes') {
        const rootFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        soundscapeIntervalRef.current = setInterval(() => {
          const randomNote = rootFreqs[Math.floor(Math.random() * rootFreqs.length)];
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(randomNote, ctx.currentTime);
          g.gain.setValueAtTime(0.02 + Math.random() * 0.02, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 2.5);
          osc.connect(g).connect(gainNode);
          osc.start();
          osc.stop(ctx.currentTime + 3.0);
        }, 1500);
      }

      setSoundscapeActive(true);
      toast('Ambient Soundscape started! Focus and unwind.', 'success');
    } catch (e) {
      toast('Audio system standby', 'warn');
    }
  };

  const stopSoundscape = () => {
    cleanupSoundscapeIntervals();
    cleanupSoundscapeNodes();
    setSoundscapeActive(false);
    toast('Ambient Soundscape stopped.', 'warn');
  };

  useEffect(() => {
    if (soundscapeGainNodeRef.current && audioCtxRef.current) {
      soundscapeGainNodeRef.current.gain.setValueAtTime(soundscapeVol, audioCtxRef.current.currentTime);
    }
  }, [soundscapeVol]);

  useEffect(() => {
    return () => {
      cleanupSoundscapeIntervals();
      cleanupSoundscapeNodes();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, []);

  const handleBgVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast("Video file too large (Max 50MB)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        try {
          localStorage.setItem('portal_bg_video_url', dataUrl);
          setBgVideoUrl(dataUrl);
          toast("Background Portal video bound successfully!", "success");
        } catch (err) {
          const objUrl = URL.createObjectURL(file);
          setBgVideoUrl(objUrl);
          toast("Video bound for current session (too large for persistent storage).", "warn");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRevertBgVideo = () => {
    localStorage.removeItem('portal_bg_video_url');
    setBgVideoUrl(null);
    toast("Reverted background portal to default Starfield.", "success");
  };
  
  // Sidebar toggles for the user to override responsive hidden states
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [homeSubTab, setHomeSubTab] = useState<'launch' | 'activity' | 'diagnostics'>('launch');

  // Responsive sidebar dynamic adjustment
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      } else if (window.innerWidth < 1200) {
        setShowLeftSidebar(true);
        setShowRightSidebar(false);
      } else {
        setShowLeftSidebar(true);
        setShowRightSidebar(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ambient starfield + alchemical cosmic portal background canvas animation loop
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.getElementById('starfield') as HTMLCanvasElement | null;
    let canvasAnimFrame: number | null = null;
    let starfieldResizeHandler: (() => void) | null = null;
    let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      const sparkleColors = [
        '237,231,246',
        '212,79,230',
        '79,127,230',
        '242,165,216',
        '63,217,199',
      ];
      let stars: any[] = [];
      let flares: any[] = [];
      let meteors: any[] = [];
      let constellationPoints: any[] = [];
      let constellationEdges: any[] = [];

      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        targetX = (e.clientX / window.innerWidth) - 0.5;
        targetY = (e.clientY / window.innerHeight) - 0.5;
      };

      window.addEventListener('mousemove', handleMouseMove);
      mouseMoveHandler = handleMouseMove;

      const spawnMeteor = () => {
        if (reduceMotion || !canvas) return;
        const startLeft = Math.random() > 0.5;
        meteors.push({
          x: startLeft ? Math.random() * canvas.width * 0.4 : 0,
          y: startLeft ? 0 : Math.random() * canvas.height * 0.4,
          vx: Math.random() * 5 + 4,
          vy: Math.random() * 3.5 + 2.5,
          len: Math.random() * 90 + 50,
          life: 1.0,
          decay: Math.random() * 0.015 + 0.01,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        });
      };

      let lastMeteorTime = 0;

      const buildConstellation = () => {
        if (!canvas) return;
        const count = Math.max(7, Math.min(14, Math.floor(canvas.width / 60)));
        constellationPoints = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: canvas.height * 0.32 + Math.random() * canvas.height * 0.62,
          phase: Math.random() * Math.PI * 2,
        }));
        constellationEdges = [];
        constellationPoints.forEach((p, i) => {
          const dists = constellationPoints
            .map((q, j) => ({
              j,
              d: i === j ? Infinity : Math.hypot(p.x - q.x, p.y - q.y),
            }))
            .sort((a, b) => a.d - b.d);
          const linkCount = 1 + Math.floor(Math.random() * 2);
          for (let k = 0; k < linkCount; k++) {
            const target = dists[k];
            if (target && target.d < canvas.width * 0.42) {
              const key = [i, target.j].sort().join('-');
              if (!constellationEdges.find((e) => e.key === key)) {
                constellationEdges.push({ key, a: i, b: target.j });
              }
            }
          }
        });
      };

      const resize = () => {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const count = Math.min(
          110,
          Math.floor((canvas.width * canvas.height) / 10000)
        );
        stars = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.3,
          baseAlpha: Math.random() * 0.5 + 0.15,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.15 + 0.03,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        }));
        buildConstellation();
      };

      const spawnFlare = () => {
        if (reduceMotion || !canvas) return;
        flares.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 1.2,
          life: 0,
          maxLife: 1200 + Math.random() * 800,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        });
      };

      let lastFlareSpawn = 0;

      const draw = (t: number) => {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Smoothly interpolate mouse parallax offset
        mouseX += (targetX - mouseX) * 0.06;
        mouseY += (targetY - mouseY) * 0.06;

        const bx = mouseX * 22;
        const by = mouseY * 22;
        const cx = mouseX * 45;
        const cy = mouseY * 45;
        const fx = mouseX * 70;
        const fy = mouseY * 70;

        // Draw swirling cosmic portal background (subtle transparency matches light UI)
        if (!reduceMotion) {
          const centerX = canvas.width / 2 + mouseX * 35;
          const centerY = canvas.height * 0.45 + mouseY * 35;
          const maxDim = Math.max(canvas.width, canvas.height);
          const portalCoreRad = Math.min(canvas.width, canvas.height) * 0.16;
          
          ctx.save();
          const centralGlow = ctx.createRadialGradient(
            centerX, centerY, 10,
            centerX, centerY, portalCoreRad * 2.8
          );
          // Darkened center, fading to glowing alchemical transparent hues
          centralGlow.addColorStop(0, 'rgba(12, 5, 28, 0.08)');
          centralGlow.addColorStop(0.2, 'rgba(40, 16, 75, 0.05)');
          centralGlow.addColorStop(0.5, 'rgba(212, 79, 230, 0.04)');
          centralGlow.addColorStop(0.8, 'rgba(79, 127, 230, 0.02)');
          centralGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = centralGlow;
          ctx.beginPath();
          ctx.arc(centerX, centerY, portalCoreRad * 2.8, 0, Math.PI * 2);
          ctx.fill();

          // Swirling cosmic logarithmic spiral arms
          const armCount = 3;
          for (let s = 0; s < armCount; s++) {
            ctx.beginPath();
            const startAngle = (t * 0.00018) + (s * (Math.PI * 2) / armCount);
            const pointsList: {x: number; y: number; alpha: number}[] = [];
            
            for (let r = portalCoreRad * 0.8; r < maxDim * 0.75; r += 7) {
              const theta = startAngle + 1.9 * Math.log(r / (portalCoreRad * 0.8));
              const px = centerX + r * Math.cos(theta);
              const py = centerY + r * Math.sin(theta) * 0.58;
              const alpha = (1.0 - (r / (maxDim * 0.75))) * 0.12; // light subtle trails
              pointsList.push({ x: px, y: py, alpha });
            }

            if (pointsList.length > 0) {
              ctx.moveTo(pointsList[0].x, pointsList[0].y);
              for (let pi = 1; pi < pointsList.length; pi++) {
                const pt = pointsList[pi];
                const grad = ctx.createLinearGradient(
                  pointsList[pi-1].x, pointsList[pi-1].y,
                  pt.x, pt.y
                );
                const color = sparkleColors[s % sparkleColors.length];
                grad.addColorStop(0, `rgba(${color}, ${pointsList[pi-1].alpha})`);
                grad.addColorStop(1, `rgba(${color}, ${pt.alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.8 + Math.sin(t * 0.0035 + pi * 0.2) * 0.6;
                ctx.lineTo(pt.x, pt.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pt.x, pt.y);
              }
            }
          }

          // Rings
          const rings = 4;
          for (let ri = 0; ri < rings; ri++) {
            const rotSpeed = 0.00014 * (ri % 2 === 0 ? 1 : -1);
            const rotation = t * rotSpeed + (ri * Math.PI / rings);
            const radX = portalCoreRad * 1.4 + ri * 50;
            const radY = radX * 0.38;
            const color = sparkleColors[ri % sparkleColors.length];
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.shadowBlur = 8 + ri * 4;
            ctx.shadowColor = `rgba(${color}, 0.2)`;
            
            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${color}, ${0.03 - (ri * 0.005)})`;
            ctx.lineWidth = 8 + ri * 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 - (ri * 0.01)})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            
            ctx.restore();
          }
          ctx.restore();
        }

        // Constellations
        ctx.lineWidth = 1;
        constellationEdges.forEach((e) => {
          const a = constellationPoints[e.a];
          const b = constellationPoints[e.b];
          if (!a || !b) return;
          ctx.beginPath();
          ctx.moveTo(a.x + cx, a.y + cy);
          ctx.lineTo(b.x + cx, b.y + cy);
          ctx.strokeStyle = 'rgba(180,170,220,0.12)';
          ctx.stroke();
        });

        constellationPoints.forEach((p) => {
          const pulse = reduceMotion
            ? 0.5
            : 0.4 + Math.sin(t * 0.0006 + p.phase) * 0.25;
          ctx.beginPath();
          ctx.arc(p.x + cx, p.y + cy, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(220,210,255,' + pulse + ')';
          ctx.fill();
        });

        // Stars
        stars.forEach((s) => {
          const twinkle = reduceMotion
            ? s.baseAlpha
            : s.baseAlpha + Math.sin(t * 0.001 * s.speed * 10 + s.phase) * 0.2;
          ctx.beginPath();
          ctx.arc(s.x + bx, s.y + by, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + s.color + ',' + Math.max(0, twinkle) + ')';
          ctx.fill();
        });

        // Flares
        if (!reduceMotion) {
          if (t - lastFlareSpawn > 1200 && flares.length < 10) {
            spawnFlare();
            lastFlareSpawn = t;
          }
          flares = flares.filter((f) => f.life < f.maxLife);
          flares.forEach((f) => {
            f.life += 16;
            const progress = f.life / f.maxLife;
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            const r = f.r * (1 + progress * 0.6);
            ctx.beginPath();
            const grad = ctx.createRadialGradient(
              f.x + fx, f.y + fy, 0,
              f.x + fx, f.y + fy, r * 4
            );
            grad.addColorStop(0, 'rgba(' + f.color + ',' + alpha * 0.7 + ')');
            grad.addColorStop(1, 'rgba(' + f.color + ',0)');
            ctx.fillStyle = grad;
            ctx.arc(f.x + fx, f.y + fy, r * 4, 0, Math.PI * 2);
            ctx.fill();
          });

          // Shooting Stars
          if (t - lastMeteorTime > 6000 + Math.random() * 8000) {
            spawnMeteor();
            lastMeteorTime = t;
          }
          meteors = meteors.filter((m) => m.life > 0);
          meteors.forEach((m) => {
            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;
            if (m.life > 0) {
              ctx.beginPath();
              const grad = ctx.createLinearGradient(
                m.x - m.vx * m.len * 0.12,
                m.y - m.vy * m.len * 0.12,
                m.x, m.y
              );
              grad.addColorStop(0, 'rgba(' + m.color + ',0)');
              grad.addColorStop(1, 'rgba(' + m.color + ',' + m.life * 0.6 + ')');
              ctx.strokeStyle = grad;
              ctx.lineWidth = 1.4;
              ctx.moveTo(m.x - m.vx * m.len * 0.12, m.y - m.vy * m.len * 0.12);
              ctx.lineTo(m.x, m.y);
              ctx.stroke();
            }
          });
        }
        canvasAnimFrame = requestAnimationFrame(draw);
      };

      window.addEventListener('resize', resize);
      starfieldResizeHandler = resize;
      resize();
      canvasAnimFrame = requestAnimationFrame(draw);
    }

    return () => {
      if (canvasAnimFrame) cancelAnimationFrame(canvasAnimFrame);
      if (starfieldResizeHandler) window.removeEventListener('resize', starfieldResizeHandler);
      if (mouseMoveHandler) window.removeEventListener('mousemove', mouseMoveHandler);
    };
  }, []);

  // Hold-to-scan Portal Home Button States
  // --- Core Utility Triggers (Haptic & Toast) ---
  const haptic = useCallback((pattern: number | number[]) => {
    if (typeof (window as any).haptic === 'function') {
      (window as any).haptic(pattern);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const toast = useCallback((msg: string, kind?: string) => {
    if (typeof (window as any).toast === 'function') {
      (window as any).toast(msg, kind);
    } else {
      alert(msg);
    }
  }, []);

  // --- Notification System ---
  const [notiPermission, setNotiPermission] = useState<string>(() => {
    if (typeof Notification !== 'undefined') return Notification.permission;
    return 'default';
  });

  const sendNotification = useCallback((title: string, body: string, delayMs?: number) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const options: any = {
        body,
        icon: './icon.svg',
        badge: './icon.svg',
        vibrate: [100, 50, 100],
      };
      const show = () => {
        new Notification(title, { body: options.body, icon: options.icon });
      };
      if (delayMs) {
        setTimeout(show, delayMs);
      } else {
        show();
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    haptic(15);
    if (typeof Notification === 'undefined') {
      toast("⚠️ Notifications not supported on this device.", "error");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotiPermission(permission);
      if (permission === 'granted') {
        toast("✨ Rift Link Established! Signal Authorized.", "success");
        sendNotification("Rift Connection Active", "You are now connected to the Portal alerts network.");
      } else if (permission === 'denied') {
        toast("⚠️ Signal Disrupted. Permission denied.", "warn");
      }
    } catch (e) {
      toast("⚠️ Signal request failed.", "error");
    }
  };

  // --- Local Offline AI Status Engine & Handlers ---
  const updateLocalAIStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/companion/status');
      if (!res.ok) throw new Error('Status fetch failed');
      const data = await res.json();
      setLocalAIStatus(data.status || 'not_installed');
      setLocalAIEngineError(data.error || '');
    } catch (err) {
      console.error('Failed to update local AI status:', err);
    }
  }, []);

  const triggerLocalAIAction = useCallback(async (action: 'download' | 'start' | 'stop' | 'delete') => {
    haptic(10);
    try {
      const res = await fetch(`/api/companion/${action}`, { method: 'POST' });
      if (res.ok) {
        if (action === 'download') toast('AI Download started in background');
        else if (action === 'start') toast('Starting local AI engine...');
        else if (action === 'stop') toast('Stopped local AI (RAM freed)');
        else if (action === 'delete') toast('Local AI model files deleted', 'warn');
        updateLocalAIStatus();
      } else {
        toast(`Failed to execute: ${action}`, 'error');
      }
    } catch (e) {
      toast(`Network error during ${action}`, 'error');
    }
  }, [updateLocalAIStatus, haptic, toast]);

  // Poll Local AI Status every 4 seconds
  useEffect(() => {
    updateLocalAIStatus();
    const interval = setInterval(updateLocalAIStatus, 4000);
    return () => clearInterval(interval);
  }, [updateLocalAIStatus]);

  // --- Sports Board API & Evaluation System ---
  function normalizeTeamName(name: string) {
    return String(name || '').trim().toLowerCase();
  }

  function teamMatchesFavorite(competitor: any) {
    const haystack = [
      competitor?.team?.displayName,
      competitor?.team?.shortDisplayName,
      competitor?.team?.name,
      competitor?.team?.location,
      competitor?.team?.abbreviation,
    ]
      .map(normalizeTeamName)
      .join(' ');

    return sportsFavorites.some((fav) => haystack.includes(normalizeTeamName(fav)));
  }

  function getRecord(competitor: any) {
    const records = competitor?.records || [];
    const total = records.find((r: any) => r.type === 'total') || records[0];
    return total?.summary || '';
  }

  function formatSportsDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function logSportsActivity(type: string, msg: string) {
    setSportsActivityLog(prev => [
      { type, msg, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49)
    ]);
  }

  const evaluateParlays = useCallback((gamesList: any[], league: SportsLeague) => {
    setSportsParlays(prevParlays => {
      let updated = false;
      const nextParlays = prevParlays.map(parlay => {
        let parlayUpdated = false;
        const nextLegs = parlay.legs.map(leg => {
          if (leg.league !== league) return leg;

          const match = gamesList.find(g => String(g.id) === leg.eventId);
          if (!match) return leg;

          const comp = match.competitions?.[0];
          const statusType = comp?.status?.type || match.status?.type || {};
          const state = statusType.state || '';
          
          const teamComp = comp?.competitors?.find((c: any) => String(c.id) === leg.teamId);
          const oppComp = comp?.competitors?.find((c: any) => String(c.id) !== leg.teamId);

          let newStatus = leg.status || 'pending';

          if (state === 'post') {
            if (teamComp?.winner) {
              newStatus = 'won';
            } else if (oppComp?.winner) {
              newStatus = 'lost';
            } else {
              const teamScore = parseInt(teamComp?.score || '0', 10);
              const oppScore = parseInt(oppComp?.score || '0', 10);
              if (teamScore > oppScore) {
                newStatus = 'won';
              } else if (oppScore > teamScore) {
                newStatus = 'lost';
              } else if (teamScore === oppScore && teamScore > 0) {
                newStatus = 'push';
              }
            }
          } else if (state === 'in') {
            const teamScore = parseInt(teamComp?.score || '0', 10);
            const oppScore = parseInt(oppComp?.score || '0', 10);
            if (teamScore > oppScore) {
              newStatus = 'leading';
            } else if (oppScore > teamScore) {
              newStatus = 'trailing';
            } else {
              newStatus = 'live';
            }
          } else {
            newStatus = 'pending';
          }

          if (newStatus !== leg.status) {
            parlayUpdated = true;
            return { ...leg, status: newStatus };
          }
          return leg;
        });

        let overallStatus: 'won' | 'lost' | 'live' | 'pending' | 'push' = 'pending';
        const hasLost = nextLegs.some(l => l.status === 'lost');
        const hasLive = nextLegs.some(l => l.status === 'live' || l.status === 'leading' || l.status === 'trailing');
        const hasPending = nextLegs.some(l => l.status === 'pending');
        const allWonOrPush = nextLegs.every(l => l.status === 'won' || l.status === 'push');

        if (hasLost) {
          overallStatus = 'lost';
        } else if (allWonOrPush) {
          overallStatus = 'won';
        } else if (hasLive) {
          overallStatus = 'live';
        } else if (hasPending) {
          overallStatus = 'pending';
        }

        if (parlayUpdated || overallStatus !== parlay.status) {
          updated = true;
          return { ...parlay, legs: nextLegs, status: overallStatus };
        }
        return parlay;
      });

      if (updated) {
        localStorage.setItem('sports_parlays', JSON.stringify(nextParlays));
        return nextParlays;
      }
      return prevParlays;
    });
  }, []);

  function generateMockSportsGames(league: SportsLeague): any[] {
    const today = new Date();
    const formattedToday = today.toISOString();

    const leagueTeams: Record<SportsLeague, Array<{ abbr: string; name: string; record: string; logo: string }>> = {
      mlb: [
        { abbr: 'NYY', name: 'Yankees', record: '54-32', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png' },
        { abbr: 'BOS', name: 'Red Sox', record: '46-40', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png' },
        { abbr: 'LAD', name: 'Dodgers', record: '56-33', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png' },
        { abbr: 'SF', name: 'Giants', record: '42-45', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sf.png' },
        { abbr: 'CHC', name: 'Cubs', record: '41-46', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png' },
        { abbr: 'STL', name: 'Cardinals', record: '44-42', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/stl.png' },
      ],
      eng1: [
        { abbr: 'MUN', name: 'Man United', record: '18-6-14', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' },
        { abbr: 'LIV', name: 'Liverpool', record: '24-10-4', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png' },
        { abbr: 'ARS', name: 'Arsenal', record: '28-5-5', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
        { abbr: 'CHE', name: 'Chelsea', record: '18-9-11', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' },
        { abbr: 'MCI', name: 'Man City', record: '28-7-3', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png' },
        { abbr: 'TOT', name: 'Tottenham', record: '20-6-12', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png' },
      ],
      nba: [
        { abbr: 'LAL', name: 'Lakers', record: '44-38', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' },
        { abbr: 'BOS', name: 'Celtics', record: '57-25', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png' },
        { abbr: 'GSW', name: 'Warriors', record: '44-38', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gsw.png' },
        { abbr: 'PHX', name: 'Suns', record: '45-37', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png' },
        { abbr: 'MIL', name: 'Bucks', record: '58-24', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png' },
        { abbr: 'MIA', name: 'Heat', record: '44-38', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png' },
      ],
      nfl: [
        { abbr: 'KC', name: 'Chiefs', record: '12-3', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
        { abbr: 'LV', name: 'Raiders', record: '6-9', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
        { abbr: 'DAL', name: 'Cowboys', record: '10-5', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
        { abbr: 'PHI', name: 'Eagles', record: '11-4', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
        { abbr: 'SF', name: '49ers', record: '12-3', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
        { abbr: 'SEA', name: 'Seahawks', record: '8-7', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
      ],
      nhl: [
        { abbr: 'BOS', name: 'Bruins', record: '47-20-15', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/bos.png' },
        { abbr: 'NYR', name: 'Rangers', record: '55-23-4', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png' },
        { abbr: 'FLA', name: 'Panthers', record: '52-24-6', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/fla.png' },
        { abbr: 'EDM', name: 'Oilers', record: '49-27-6', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/edm.png' },
        { abbr: 'DAL', name: 'Stars', record: '52-21-9', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/dal.png' },
        { abbr: 'VAN', name: 'Canucks', record: '50-23-9', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/van.png' },
      ]
    };

    const teams = leagueTeams[league] || leagueTeams['nfl'];

    let liveDetail = '3rd Quarter';
    let liveAwayScore = '84';
    let liveHomeScore = '91';
    let postDetail = 'Final';
    let postAwayScore = '108';
    let postHomeScore = '97';
    let postAwayWinner = true;
    let postHomeWinner = false;
    let preDetail = 'MON 8:30 PM';

    if (league === 'eng1') {
      liveDetail = "72'";
      liveAwayScore = '1';
      liveHomeScore = '2';
      postDetail = 'FT';
      postAwayScore = '3';
      postHomeScore = '1';
      postAwayWinner = true;
      postHomeWinner = false;
      preDetail = 'SUN 11:30 AM';
    } else if (league === 'mlb') {
      liveDetail = 'Top 7th';
      liveAwayScore = '2';
      liveHomeScore = '4';
      postDetail = 'Final';
      postAwayScore = '6';
      postHomeScore = '3';
      postAwayWinner = true;
      postHomeWinner = false;
      preDetail = 'MON 7:05 PM';
    }

    return [
      {
        id: `mock-${league}-1`,
        date: formattedToday,
        competitions: [
          {
            id: `comp-${league}-1`,
            date: formattedToday,
            status: { type: { state: 'in', detail: liveDetail } },
            competitors: [
              {
                id: `team-${league}-1`,
                homeAway: 'away',
                team: { id: `team-${league}-1`, abbreviation: teams[0].abbr, shortDisplayName: teams[0].name, displayName: `${teams[0].abbr} ${teams[0].name}`, logo: teams[0].logo },
                score: liveAwayScore,
                winner: false,
                records: [{ type: 'total', summary: teams[0].record }]
              },
              {
                id: `team-${league}-2`,
                homeAway: 'home',
                team: { id: `team-${league}-2`, abbreviation: teams[1].abbr, shortDisplayName: teams[1].name, displayName: `${teams[1].abbr} ${teams[1].name}`, logo: teams[1].logo },
                score: liveHomeScore,
                winner: false,
                records: [{ type: 'total', summary: teams[1].record }]
              }
            ]
          }
        ]
      },
      {
        id: `mock-${league}-2`,
        date: formattedToday,
        competitions: [
          {
            id: `comp-${league}-2`,
            date: formattedToday,
            status: { type: { state: 'post', detail: postDetail } },
            competitors: [
              {
                id: `team-${league}-3`,
                homeAway: 'away',
                team: { id: `team-${league}-3`, abbreviation: teams[2].abbr, shortDisplayName: teams[2].name, displayName: `${teams[2].abbr} ${teams[2].name}`, logo: teams[2].logo },
                score: postAwayScore,
                winner: postAwayWinner,
                records: [{ type: 'total', summary: teams[2].record }]
              },
              {
                id: `team-${league}-4`,
                homeAway: 'home',
                team: { id: `team-${league}-4`, abbreviation: teams[3].abbr, shortDisplayName: teams[3].name, displayName: `${teams[3].abbr} ${teams[3].name}`, logo: teams[3].logo },
                score: postHomeScore,
                winner: postHomeWinner,
                records: [{ type: 'total', summary: teams[3].record }]
              }
            ]
          }
        ]
      },
      {
        id: `mock-${league}-3`,
        date: formattedToday,
        competitions: [
          {
            id: `comp-${league}-3`,
            date: formattedToday,
            status: { type: { state: 'pre', detail: preDetail } },
            competitors: [
              {
                id: `team-${league}-5`,
                homeAway: 'away',
                team: { id: `team-${league}-5`, abbreviation: teams[4].abbr, shortDisplayName: teams[4].name, displayName: `${teams[4].abbr} ${teams[4].name}`, logo: teams[4].logo },
                score: '0',
                winner: false,
                records: [{ type: 'total', summary: teams[4].record }]
              },
              {
                id: `team-${league}-6`,
                homeAway: 'home',
                team: { id: `team-${league}-6`, abbreviation: teams[5].abbr, shortDisplayName: teams[5].name, displayName: `${teams[5].abbr} ${teams[5].name}`, logo: teams[5].logo },
                score: '0',
                winner: false,
                records: [{ type: 'total', summary: teams[5].record }]
              }
            ]
          }
        ]
      }
    ];
  }

  const loadSportsScores = useCallback(async (dateOffset: number = sportsDateOffset) => {
    setSportsStatus("Syncing all league schedule networks...");

    let dateParam = "";
    if (dateOffset > 0) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dateOffset);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      dateParam = `?dates=${yyyy}${mm}${dd}`;
    }

    const leagues = Object.keys(SPORTS_LEAGUES) as SportsLeague[];
    let anySuccess = false;

    const fetchedResults = await Promise.all(
      leagues.map(async (league) => {
        const config = SPORTS_LEAGUES[league];
        const fetchUrl = `${config.url}${dateParam}`;
        try {
          const res = await fetch(fetchUrl, { cache: 'no-store' });
          if (!res.ok) throw new Error('Offline');
          const data = await res.json();
          let events = Array.isArray(data?.events) ? data.events : [];
          if (events.length === 0) {
            events = generateMockSportsGames(league);
          } else {
            anySuccess = true;
          }
          return { league, events };
        } catch {
          return { league, events: generateMockSportsGames(league) };
        }
      })
    );

    setSportsGamesMap(prev => {
      const next = { ...prev };
      fetchedResults.forEach(res => {
        next[res.league as SportsLeague] = res.events;
      });
      return next;
    });

    setSportsStatus(anySuccess ? 'Free Live Network Feed Connected' : 'Free Live Network (Simulated Offline Mode)');
    setSportsUpdated(
      new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, [sportsDateOffset]);

  function addSportsFavorite() {
    const value = sportsFavoriteInput.trim();
    if (!value) return;

    const next = sportsFavorites.some(
      (team) => normalizeTeamName(team) === normalizeTeamName(value)
    )
      ? sportsFavorites
      : [...sportsFavorites, value];

    setSportsFavorites(next);
    localStorage.setItem('sports_favorites', JSON.stringify(next));
    setSportsFavoriteInput('');
  }

  function removeSportsFavorite(index: number) {
    const next = sportsFavorites.filter((_, i) => i !== index);
    setSportsFavorites(next);
    localStorage.setItem('sports_favorites', JSON.stringify(next));
  }

  useEffect(() => {
    loadSportsScores(sportsDateOffset);
  }, [activeSportsLeague, sportsDateOffset, loadSportsScores]);

  useEffect(() => {
    if (sportsGames.length > 0) {
      evaluateParlays(sportsGames, activeSportsLeague);
    }
  }, [sportsGames, activeSportsLeague, evaluateParlays]);

  // Helper functions for Parlay Slip
  const addToParlaySlip = (event: any, competition: any, competitor: any) => {
    const isAlreadyIn = parlaySlip.some(leg => leg.teamId === String(competitor.id));
    if (isAlreadyIn) {
      setParlaySlip(prev => prev.filter(leg => leg.teamId !== String(competitor.id)));
      toast(`Removed ${competitor.team?.shortDisplayName || competitor.team?.displayName} from parlay slip.`);
      return;
    }

    const isGameIn = parlaySlip.some(leg => leg.eventId === String(event.id));
    if (isGameIn) {
      toast("⚠️ You already have a pick from this game in your parlay!");
      return;
    }

    const competitors = competition?.competitors || [];
    const opponent = competitors.find((c: any) => String(c.id) !== String(competitor.id));

    const getCompetitorName = (c: any) => {
      return c?.team?.shortDisplayName || c?.team?.displayName || c?.team?.name || 'Team';
    };

    const teamName = getCompetitorName(competitor);
    const opponentName = getCompetitorName(opponent);
    const matchup = event.shortName || event.name || `${teamName} vs ${opponentName}`;

    const newLeg: ParlayLeg = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      league: activeSportsLeague,
      eventId: String(event.id),
      teamId: String(competitor.id),
      teamName,
      opponentName,
      matchup,
      pickedAt: new Date().toISOString()
    };

    setParlaySlip(prev => [...prev, newLeg]);
    toast(`Added ${teamName} to parlay slip.`);
  };

  const isTeamInSlip = (teamId: any) => {
    return parlaySlip.some(leg => leg.teamId === String(teamId));
  };

  const saveParlay = () => {
    if (parlaySlip.length === 0) {
      toast("⚠️ Your parlay slip is empty! Pick some teams first.");
      return;
    }

    const newParlay: Parlay = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      legs: parlaySlip.map(leg => ({ ...leg, status: leg.status || 'pending' })),
      savedAt: new Date().toISOString(),
      status: 'pending'
    };

    const nextParlays = [newParlay, ...sportsParlays];
    setSportsParlays(nextParlays);
    localStorage.setItem('sports_parlays', JSON.stringify(nextParlays));
    setParlaySlip([]);
    toast("🏆 Parlay successfully saved to tracker!");
    evaluateParlays(sportsGames, activeSportsLeague);
  };

  const clearParlaySlip = () => {
    setParlaySlip([]);
    toast("Cleared all picks from slip.");
  };

  const deleteParlay = (parlayId: string) => {
    const nextParlays = sportsParlays.filter(p => p.id !== parlayId);
    setSportsParlays(nextParlays);
    localStorage.setItem('sports_parlays', JSON.stringify(nextParlays));
    toast("Deleted saved parlay.");
  };

  const refreshParlays = async () => {
    toast("🔄 Refreshing parlay outcomes across networks...");
    const uniqueLeagues = Array.from(new Set(sportsParlays.flatMap(p => p.legs.map(l => l.league))));
    if (uniqueLeagues.length === 0) {
      await loadSportsScores();
      return;
    }

    for (const league of uniqueLeagues) {
      const config = SPORTS_LEAGUES[league as keyof typeof SPORTS_LEAGUES];
      if (!config) continue;
      try {
        const res = await fetch(config.url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const games = Array.isArray(data?.events) ? data.events : [];
          evaluateParlays(games, league as any);
        }
      } catch (err) {
        console.error(`Failed to refresh league ${league}:`, err);
      }
    }
    toast("✓ Parlays updated with latest public scores.");
  };

  // --- Auth Handlers ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptic([20, 30]);
    const uId = loginUser.trim().toLowerCase();
    const pinVal = loginPin.trim();
    if (!uId || !pinVal) {
      setAuthError("⚠️ Please fill in all credentials!");
      return;
    }
    const rawUsers = localStorage.getItem('portal_users');
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    const matched = users.find((u: any) => u.userId === uId);
    if (matched && matched.pin === pinVal) {
      localStorage.setItem('portal_current_user', matched.userId);
      setCurrentUser(matched.userId);
      setAuthError('');
      setShowStartScreen(false);
      window.location.reload();
    } else {
      setAuthError("⚠️ Credentials invalid or PIN mismatch!");
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptic([20, 30, 50]);
    const uId = signupUser.trim().toLowerCase();
    const pinVal = signupPin.trim();
    if (uId.length < 3) {
      setAuthError("⚠️ User ID must be at least 3 characters!");
      return;
    }
    if (pinVal.length !== 4) {
      setAuthError("⚠️ PIN must be exactly 4 digits!");
      return;
    }
    const rawUsers = localStorage.getItem('portal_users');
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    const alreadyExists = users.some((u: any) => u.userId && u.userId.toLowerCase() === uId.toLowerCase());
    if (alreadyExists) {
      setAuthError("⚠️ User ID already claimed by another Traveler!");
      return;
    }
    const isCreator = (uId === 'trxy6');
    const newUser = { userId: uId, pin: pinVal, isCreator };
    users.push(newUser);
    localStorage.setItem('portal_users', JSON.stringify(users));
    localStorage.setItem('portal_current_user', uId);
    setCurrentUser(uId);
    setAuthError('');
    setShowStartScreen(false);
    window.location.reload();
  };

  // --- Dimensional Camera & Scanner Helpers ---
  const startRiftCamera = async () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
      } catch (e) {
        console.warn('Environment camera not found, falling back to default camera:', e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      setCameraStream(stream);
      if (riftVideoRef.current) {
        riftVideoRef.current.srcObject = stream;
        riftVideoRef.current.play().catch(err => console.log('Video play interrupted:', err));
      }
    } catch (err) {
      console.error('Camera connection failed:', err);
      toast('Could not bind live video feed. File upload fallback active.', 'info');
    }
  };

  const stopRiftCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const captureRiftSnapshot = () => {
    if (riftVideoRef.current && riftCanvasRef.current) {
      const video = riftVideoRef.current;
      const canvas = riftCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setRiftVisionImage(base64);
        stopRiftCamera();
        haptic([15, 30]);
      }
    }
  };

  useEffect(() => {
    (window as any).openRiftVision = (mode: 'notes' | 'betslip' | 'character' | 'dice' | 'calendar' | 'ask') => {
      setRiftVisionMode(mode);
      setRiftVisionResult(null);
      setRiftVisionImage(null);
      setRiftCustomQuestion('');
      setShowRiftVision(true);
    };
    return () => {
      delete (window as any).openRiftVision;
    };
  }, []);

  useEffect(() => {
    if (showRiftVision) {
      startRiftCamera();
    } else {
      stopRiftCamera();
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showRiftVision]);

  // --- TI-84 CE Calculator Kernels ---
  const formatImpliedMultiplication = (expr: string) => {
    return expr
      .replace(/(\d+)([a-zA-Zπθn])/g, '$1 * $2')
      .replace(/([a-zA-Zπθn])(\d+)/g, '$1 * $2')
      .replace(/\)([\w(π])/g, ') * $1')
      .replace(/([a-zA-Zπθn])\(/g, '$1 * (');
  };

  const sanitizeExpressionForMathJS = (expr: string) => {
    let sanitized = formatImpliedMultiplication(expr);
    sanitized = sanitized
      .replace(/π/g, 'pi')
      .replace(/e\^/g, 'exp')
      .replace(/√\(/g, 'sqrt(')
      .replace(/²/g, '^2')
      .replace(/–/g, '-')
      .replace(/¯/g, '-')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/ln\(/g, 'log(')
      .replace(/log\(/g, 'log10(')
      .replace(/x/g, 'x')
      .replace(/X/g, 'x');

    if (angleMode === 'DEGREE') {
      sanitized = sanitized
        .replace(/sin\(([^)]+)\)/g, 'sin(($1) * deg)')
        .replace(/cos\(([^)]+)\)/g, 'cos(($1) * deg)')
        .replace(/tan\(([^)]+)\)/g, 'tan(($1) * deg)')
        .replace(/asin\(([^)]+)\)/g, 'asin($1) / deg')
        .replace(/acos\(([^)]+)\)/g, 'acos($1) / deg')
        .replace(/atan\(([^)]+)\)/g, 'atan($1) / deg');
    }
    return sanitized;
  };

  const executeCalculation = () => {
    const math = (window as any).math;
    if (!math || !inputVal.trim()) return;

    try {
      const mathFormatted = sanitizeExpressionForMathJS(inputVal);
      const scope = { x: 0, deg: math.unit('deg'), Ans: Number(lastAnswer) || 0 };
      let result = math.evaluate(mathFormatted, scope);

      if (typeof result === 'object' && result.entries) {
        result = result.entries[0];
      }

      let formattedResult = '';
      if (typeof result === 'number') {
        if (decimalPlaces !== 'FLOAT') {
          formattedResult = result.toFixed(parseInt(decimalPlaces));
        } else {
          formattedResult = math.format(result, { precision: 10 });
        }
      } else {
        formattedResult = result.toString();
      }

      setHistory([...history, { input: inputVal, output: formattedResult }]);
      setLastAnswer(formattedResult);
      setInputVal('');
      setCursorIndex(0);
    } catch (err) {
      setErrorMessage(`ERR:SYNTAX \n\nCheck mathematical operators or parenthesis alignment.`);
    }
  };

  const insertToken = (token: string) => {
    if (currentScreen === 'HOME') {
      setInputVal(prev => prev.slice(0, cursorIndex) + token + prev.slice(cursorIndex));
      setCursorIndex(prev => prev + token.length);
    } else if (currentScreen === 'Y_EDIT') {
      setEquations(prev => ({
        ...prev,
        [activeEqIndex]: prev[activeEqIndex] + token
      }));
    } else if (currentScreen === 'WINDOW') {
      const currentVal = windowSettings[activeWindowIndex]?.toString() || '';
      const newVal = parseFloat(currentVal + token) || parseFloat(token) || 0;
      setWindowSettings(prev => ({ ...prev, [activeWindowIndex]: newVal }));
    } else if (currentScreen === 'TBLSET') {
      const currentVal = tblSettings[activeTblIndex]?.toString() || '';
      const newVal = parseFloat(currentVal + token) || parseFloat(token) || 0;
      setTblSettings(prev => ({ ...prev, [activeTblIndex]: newVal }));
    }
  };

  const handleDirectionalArrow = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (currentScreen === 'HOME') {
      if (direction === 'LEFT') setCursorIndex(Math.max(0, cursorIndex - 1));
      if (direction === 'RIGHT') setCursorIndex(Math.min(inputVal.length, cursorIndex + 1));
      if (direction === 'UP' && history.length > 0) {
        setInputVal(history[history.length - 1].input);
        setCursorIndex(history[history.length - 1].input.length);
      }
    } else if (currentScreen === 'Y_EDIT') {
      const list = ['Y1', 'Y2', 'Y3', 'Y4'];
      let curr = list.indexOf(activeEqIndex);
      if (direction === 'UP') setActiveEqIndex(list[(curr - 1 + 4) % 4]);
      if (direction === 'DOWN') setActiveEqIndex(list[(curr + 1) % 4]);
    } else if (currentScreen === 'WINDOW') {
      const list = ['Xmin', 'Xmax', 'Xscl', 'Ymin', 'Ymax', 'Yscl'];
      let curr = list.indexOf(activeWindowIndex);
      if (direction === 'UP') setActiveWindowIndex(list[(curr - 1 + 6) % 6]);
      if (direction === 'DOWN') setActiveWindowIndex(list[(curr + 1) % 6]);
    } else if (currentScreen === 'TBLSET') {
      setActiveTblIndex(activeTblIndex === 'TblStart' ? 'dTbl' : 'TblStart');
    } else if (currentScreen === 'GRAPH') {
      if (!isTracing) {
        setIsTracing(true);
        setTraceX((windowSettings.Xmax + windowSettings.Xmin) / 2);
      } else {
        const step = (windowSettings.Xmax - windowSettings.Xmin) / 40;
        if (direction === 'LEFT') setTraceX(prev => Math.max(windowSettings.Xmin, prev - step));
        if (direction === 'RIGHT') setTraceX(prev => Math.min(windowSettings.Xmax, prev + step));
        if (direction === 'UP') {
          const list = ['Y1', 'Y2', 'Y3', 'Y4'];
          let curr = list.indexOf(traceEquationIndex);
          setTraceEquationIndex(list[(curr - 1 + 4) % 4]);
        }
        if (direction === 'DOWN') {
          const list = ['Y1', 'Y2', 'Y3', 'Y4'];
          let curr = list.indexOf(traceEquationIndex);
          setTraceEquationIndex(list[(curr + 1) % 4]);
        }
      }
    } else if (currentScreen === 'TABLE') {
      if (direction === 'UP') setTableOffset(prev => prev - 1);
      if (direction === 'DOWN') setTableOffset(prev => prev + 1);
    } else if (currentScreen === 'PROGRAM_MENU') {
      if (direction === 'UP') setActiveProgIndex(prev => (prev - 1 + programList.length) % programList.length);
      if (direction === 'DOWN') setActiveProgIndex(prev => (prev + 1) % programList.length);
    } else if (currentScreen === 'S_GAME') {
      if (direction === 'UP' && snakeDir.y === 0) setSnakeDir({ x: 0, y: -1 });
      if (direction === 'DOWN' && snakeDir.y === 0) setSnakeDir({ x: 0, y: 1 });
      if (direction === 'LEFT' && snakeDir.x === 0) setSnakeDir({ x: -1, y: 0 });
      if (direction === 'RIGHT' && snakeDir.x === 0) setSnakeDir({ x: 1, y: 0 });
    } else if (currentScreen === 'TETRIS_GAME') {
      if (direction === 'LEFT') moveTetrisPiece(-1, 0);
      if (direction === 'RIGHT') moveTetrisPiece(1, 0);
      if (direction === 'DOWN') moveTetrisPiece(0, 1);
      if (direction === 'UP') rotateTetrisPiece();
    }
  };

  const handleButtonPress = (keyName: string, label2nd: string | null = null, labelAlpha: string | null = null) => {
    let action = keyName;
    if (is2nd && label2nd) {
      action = label2nd;
      setIs2nd(false);
    } else if (isAlpha && labelAlpha) {
      action = labelAlpha;
      setIsAlpha(false);
    }

    switch (action) {
      case '2ND':
        setIs2nd(!is2nd);
        setIsAlpha(false);
        break;
      case 'ALPHA':
        setIsAlpha(!isAlpha);
        setIs2nd(false);
        break;
      case 'CLEAR':
        if (currentScreen === 'HOME') {
          if (inputVal === '') setHistory([]);
          setInputVal('');
          setCursorIndex(0);
        } else if (currentScreen === 'Y_EDIT') {
          setEquations({ ...equations, [activeEqIndex]: '' });
        } else if (currentScreen === 'WINDOW') {
          setWindowSettings({ ...windowSettings, [activeWindowIndex]: 0 });
        }
        break;
      case 'DEL':
        if (currentScreen === 'HOME') {
          if (cursorIndex > 0) {
            setInputVal(prev => prev.slice(0, cursorIndex - 1) + prev.slice(cursorIndex));
            setCursorIndex(prev => prev - 1);
          }
        } else if (currentScreen === 'Y_EDIT') {
          const currentEq = equations[activeEqIndex] || '';
          setEquations({ ...equations, [activeEqIndex]: currentEq.slice(0, -1) });
        }
        break;
      case 'ENTER':
        if (currentScreen === 'HOME') {
          executeCalculation();
        } else if (currentScreen === 'Y_EDIT') {
          const list = ['Y1', 'Y2', 'Y3', 'Y4'];
          const nextIdx = (list.indexOf(activeEqIndex) + 1) % list.length;
          setActiveEqIndex(list[nextIdx]);
        } else if (currentScreen === 'WINDOW') {
          const list = ['Xmin', 'Xmax', 'Xscl', 'Ymin', 'Ymax', 'Yscl'];
          const nextIdx = (list.indexOf(activeWindowIndex) + 1) % list.length;
          setActiveWindowIndex(list[nextIdx]);
        } else if (currentScreen === 'TBLSET') {
          setActiveTblIndex(activeTblIndex === 'TblStart' ? 'dTbl' : 'TblStart');
        } else if (currentScreen === 'PROGRAM_MENU') {
          const selectedProg = programList[activeProgIndex];
          if (selectedProg === 'SNAKE') {
            initSnakeGame();
            setCurrentScreen('S_GAME');
          } else if (selectedProg === 'TETRIS') {
            initTetrisGame();
            setCurrentScreen('TETRIS_GAME');
          }
        } else if (currentScreen === 'CATALOG') {
          insertToken('sin(');
          setCurrentScreen('HOME');
        }
        break;

      case 'UP': handleDirectionalArrow('UP'); break;
      case 'DOWN': handleDirectionalArrow('DOWN'); break;
      case 'LEFT': handleDirectionalArrow('LEFT'); break;
      case 'RIGHT': handleDirectionalArrow('RIGHT'); break;

      case 'Y=': setCurrentScreen('Y_EDIT'); break;
      case 'WINDOW': setCurrentScreen('WINDOW'); break;
      case 'GRAPH': setCurrentScreen('GRAPH'); setIsTracing(false); break;
      case 'TABLE': setCurrentScreen('TABLE'); break;
      case 'TBLSET': setCurrentScreen('TBLSET'); break;
      case 'MODE': setCurrentScreen('MODE_MENU'); break;
      case 'MATH': setCurrentScreen('MATH_MENU'); break;
      case 'PRGM': setCurrentScreen('PROGRAM_MENU'); break;
      case 'CATALOG': setCurrentScreen('CATALOG'); break;
      case 'QUIT': setCurrentScreen('HOME'); break;

      case 'x':
      case 'X':
        insertToken('x');
        break;
      case 'sin(':
      case 'cos(':
      case 'tan(':
      case 'ln(':
      case 'log(':
        insertToken(action);
        break;
      case 'asin(': insertToken('asin('); break;
      case 'acos(': insertToken('acos('); break;
      case 'atan(': insertToken('atan('); break;
      case 'π': insertToken('π'); break;
      case '√(': insertToken('√('); break;
      case '²': insertToken('²'); break;
      case '^': insertToken('^'); break;
      case '10^': insertToken('10^('); break;
      case 'e^': insertToken('e^('); break;
      case 'Ans': insertToken('Ans'); break;
      case '(-)': insertToken('–'); break;

      default:
        if (action && action.length <= 5) {
          insertToken(action);
        }
        break;
    }
  };

  useEffect(() => {
    if (currentScreen !== 'S_GAME' || snakeOver) return;

    const gameTick = setInterval(() => {
      setSnake(prev => {
        if (prev.length === 0) return prev;
        const head = prev[0];
        const newHead = { x: head.x + snakeDir.x, y: head.y + snakeDir.y };

        if (newHead.x < 0 || newHead.x >= 20 || newHead.y < 0 || newHead.y >= 12) {
          setSnakeOver(true);
          return prev;
        }

        for (let segment of prev) {
          if (segment.x === newHead.x && segment.y === newHead.y) {
            setSnakeOver(true);
            return prev;
          }
        }

        const newSnake = [newHead, ...prev];

        if (newHead.x === snakeFood.x && newHead.y === snakeFood.y) {
          setSnakeScore(s => {
            const next = s + 10;
            if (next > snakeHighScore) setSnakeHighScore(next);
            return next;
          });
          setSnakeFood({
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 12)
          });
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 180);

    return () => clearInterval(gameTick);
  }, [currentScreen, snakeDir, snakeFood, snakeOver, snakeHighScore]);

  const initSnakeGame = () => {
    setSnake([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 }
    ]);
    setSnakeDir({ x: 1, y: 0 });
    setSnakeFood({ x: 10, y: 8 });
    setSnakeScore(0);
    setSnakeOver(false);
  };

  const initTetrisGame = () => {
    const emptyBoard = Array(15).fill(null).map(() => Array(10).fill(0));
    setTetrisBoard(emptyBoard);
    setTetrisScore(0);
    setTetrisOver(false);
    spawnTetrisPiece(emptyBoard);
  };

  const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1], [1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
  ];

  const spawnTetrisPiece = (board: number[][]) => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const newPiece = {
      shape,
      color: '#ef4444'
    };
    setTetrisPiece(newPiece);
    setTetrisPos({ x: 3, y: 0 });

    if (checkCollision(shape, { x: 3, y: 0 }, board)) {
      setTetrisOver(true);
    }
  };

  const checkCollision = (shape: number[][], pos: {x: number, y: number}, board: number[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nextX = pos.x + c;
          const nextY = pos.y + r;
          if (nextX < 0 || nextX >= 10 || nextY >= 15) return true;
          if (nextY >= 0 && board[nextY] && board[nextY][nextX]) return true;
        }
      }
    }
    return false;
  };

  const moveTetrisPiece = (dx: number, dy: number) => {
    if (tetrisOver || !tetrisPiece) return;
    const nextPos = { x: tetrisPos.x + dx, y: tetrisPos.y + dy };
    if (!checkCollision(tetrisPiece.shape, nextPos, tetrisBoard)) {
      setTetrisPos(nextPos);
    } else if (dy > 0) {
      lockTetrisPiece();
    }
  };

  const rotateTetrisPiece = () => {
    if (tetrisOver || !tetrisPiece) return;
    const shape = tetrisPiece.shape;
    const rotated = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
    if (!checkCollision(rotated, tetrisPos, tetrisBoard)) {
      setTetrisPiece({ ...tetrisPiece, shape: rotated });
    }
  };

  const lockTetrisPiece = () => {
    const newBoard = tetrisBoard.map(row => [...row]);
    const shape = tetrisPiece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardY = tetrisPos.y + r;
          const boardX = tetrisPos.x + c;
          if (boardY >= 0 && boardY < 15) {
            newBoard[boardY][boardX] = 1;
          }
        }
      }
    }

    let linesCleared = 0;
    const filteredBoard = newBoard.filter(row => {
      const isFull = row.every(cell => cell === 1);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (filteredBoard.length < 15) {
      filteredBoard.unshift(Array(10).fill(0));
    }

    setTetrisBoard(filteredBoard);
    setTetrisScore(prev => prev + linesCleared * 100);
    spawnTetrisPiece(filteredBoard);
  };

  useEffect(() => {
    if (currentScreen !== 'TETRIS_GAME' || tetrisOver) return;
    const gameTick = setInterval(() => {
      moveTetrisPiece(0, 1);
    }, 700);
    return () => clearInterval(gameTick);
  }, [currentScreen, tetrisPos, tetrisPiece, tetrisBoard, tetrisOver]);

  const renderTableRows = () => {
    const math = (window as any).math;
    if (!math) return [];

    const rows = [];
    const start = tblSettings.TblStart + tableOffset * tblSettings.dTbl;

    const compiled: Record<string, any> = {};
    Object.keys(equations).forEach(k => {
      try {
        const eqStr = equations[k];
        if (eqStr && eqStr.trim()) {
          compiled[k] = math.compile(sanitizeExpressionForMathJS(eqStr));
        }
      } catch (e) {}
    });

    for (let i = 0; i < 7; i++) {
      const x = start + i * tblSettings.dTbl;
      const rowVals: Record<string, string> = { X: x.toFixed(2), Y1: '---', Y2: '---' };

      Object.keys(compiled).forEach(k => {
        try {
          const val = compiled[k].evaluate({ x, deg: math.unit('deg'), Ans: Number(lastAnswer) || 0 });
          rowVals[k] = typeof val === 'number' && !isNaN(val) ? val.toFixed(4) : 'ERR';
        } catch (e) {
          rowVals[k] = 'ERR';
        }
      });

      rows.push(rowVals);
    }
    return rows;
  };

  useEffect(() => {
    const math = (window as any).math;
    if (!math || currentScreen !== 'GRAPH' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#100b26';
    ctx.fillRect(0, 0, width, height);

    const { Xmin, Xmax, Xscl, Ymin, Ymax, Yscl } = windowSettings;

    const toScreenX = (x: number) => ((x - Xmin) / (Xmax - Xmin)) * width;
    const toScreenY = (y: number) => height - ((y - Ymin) / (Ymax - Ymin)) * height;

    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(Xmin / Xscl) * Xscl; x <= Xmax; x += Xscl) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }
    for (let y = Math.ceil(Ymin / Yscl) * Yscl; y <= Ymax; y += Yscl) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    const zeroX = toScreenX(0);
    const zeroY = toScreenY(0);

    ctx.beginPath();
    ctx.moveTo(zeroX, 0);
    ctx.lineTo(zeroX, height);
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308'];
    Object.keys(equations).forEach((eqKey, index) => {
      const equationStr = equations[eqKey];
      if (!equationStr || !equationStr.trim()) return;

      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let parsedEq: any;
      try {
        const mathFormatted = sanitizeExpressionForMathJS(equationStr);
        parsedEq = math.compile(mathFormatted);
      } catch (err) {
        return;
      }

      let first = true;
      const step = (Xmax - Xmin) / 150;
      for (let x = Xmin; x <= Xmax; x += step) {
        try {
          const scope = { x, deg: math.unit('deg'), Ans: Number(lastAnswer) || 0 };
          const y = parsedEq.evaluate(scope);

          if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
            const sx = toScreenX(x);
            const sy = toScreenY(y);

            if (first) {
              ctx.moveTo(sx, sy);
              first = false;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            first = true;
          }
        } catch (err) {
          first = true;
        }
      }
      ctx.stroke();
    });

    if (isTracing) {
      const eqStr = equations[traceEquationIndex];
      if (eqStr && eqStr.trim()) {
        try {
          const mathFormatted = sanitizeExpressionForMathJS(eqStr);
          const yVal = math.evaluate(mathFormatted, { x: traceX, deg: math.unit('deg'), Ans: Number(lastAnswer) || 0 });

          if (typeof yVal === 'number' && !isNaN(yVal)) {
            const sx = toScreenX(traceX);
            const sy = toScreenY(yVal);

            ctx.strokeStyle = '#ffffff';
            ctx.fillStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        } catch (err) {}
      }
    }
  }, [currentScreen, equations, windowSettings, isTracing, traceX, traceEquationIndex, mathLoaded, lastAnswer]);

  useEffect(() => {
    if ((window as any).math) {
      setMathLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.0/math.js';
      script.async = true;
      script.onload = () => {
        setMathLoaded(true);
      };
      script.onerror = () => {
        setErrorMessage("Critical Error: Failed to load TI-84 Math Kernel. Please check internet connection.");
      };
      document.head.appendChild(script);
    }
  }, []);

  // --- Character Sheet Helpers ---
  const getModStr = (statId: string) => {
    const val = parseInt(charSheet[statId] || '10', 10) || 10;
    const mod = Math.floor((val - 10) / 2);
    return (mod >= 0 ? '+' : '') + mod;
  };

  const updateSheetField = (fieldId: string, val: string) => {
    setCharSheet(prev => {
      const next = { ...prev, [fieldId]: val };
      store.set('char_sheet', next);
      return next;
    });
  };

  // --- D20 Combat / Oracle Displays ---
  const [combatRound, setCombatRound] = useState<number>(4);
  const [activeCombatantIndex, setActiveCombatantIndex] = useState<number>(0);
  const [combatants, setCombatants] = useState<any[]>([
    { name: 'ELARA', class: 'Half-Elf Wizard', hp: 22, maxHp: 25, color: '#8b5cf6', avatarType: 'wizard' },
    { name: 'THORGRIM', class: 'Dwarf Fighter', hp: 18, maxHp: 20, color: '#10b981', avatarType: 'fighter' },
    { name: 'LYRA', class: 'Human Rogue', hp: 15, maxHp: 18, color: '#fcd34d', avatarType: 'rogue' },
    { name: 'KAEL', class: 'Dragonborn Paladin', hp: 11, maxHp: 15, color: '#f97316', avatarType: 'paladin' },
    { name: 'DM / ENEMIES', class: 'Dungeon Master', hp: 38, maxHp: 50, color: '#ec4899', avatarType: 'dm' }
  ]);

  const handleHpChange = (index: number, delta: number) => {
    setCombatants(prev => {
      return prev.map((c, idx) => {
        if (idx === index) {
          const nextHp = Math.min(Math.max(0, c.hp + delta), c.maxHp);
          return { ...c, hp: nextHp };
        }
        return c;
      });
    });
    haptic(6);
  };

  const handleEndTurn = () => {
    const nextIndex = (activeCombatantIndex + 1) % combatants.length;
    const nextCombatant = combatants[nextIndex];
    if (nextIndex === 0) {
      setCombatRound(prev => prev + 1);
    }
    setActiveCombatantIndex(nextIndex);
    haptic(15);
    sendNotification("🛡️ Next Combat Turn", `It is now ${nextCombatant.name}'s turn!`);
  };

  const handleOracleConsult = () => {
    haptic([15, 30]);
    const q = oracleQuery.trim();
    if (!q) {
      toast('Please state your query inside the oracle box.', 'warn');
      return;
    }

    setOracleLoading(true);
    setOracleAnswer('');
    
    setTimeout(() => {
      const oracleAnswers = [
        "The runes glow brightly: The path ahead is clear. Go for it! ✨",
        "Shadows cloud the future. Patience is key. Wait for a sign. ⏳",
        "By all indications, the celestial alignments favor this option! 👍",
        "Warning: The energies are highly chaotic. Steer clear for now. 🛑",
        "Do not doubt your instinct; the stars reflect absolute success ahead.",
        "A deep silence from the void. Re-evaluate your focus and try again.",
        "Indeed, the flow of your journey points clearly in that direction.",
        "The elements whisper: No, there is a better quest awaiting you."
      ];
      setOracleLoading(false);
      const index = Math.abs(q.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % oracleAnswers.length;
      setOracleAnswer(`"${q}" → ${oracleAnswers[index]}`);
      haptic([100, 50, 100]);
    }, 1200);
  };

  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const [isScanning, setIsScanning] = useState(false);
  const [showDecoyAi, setShowDecoyAi] = useState(false);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  // Decoy AI chat states
  const [decoyInput, setDecoyInput] = useState('');
  const [decoyHistory, setDecoyHistory] = useState<Array<{role: string, content: string}>>([
    { role: 'system', content: '>>> LOCAL SYNAPTIC BLOCK ENGAGED. DIRECTORY PATH: /sys/core/ai\n>>> USER IDENTIFIED: TREY\n>>> CLASSIFICATION: CLASS-A OPERATOR\n>>> LOCAL DECOY MODEL STATUS: ONLINE & DEPLOYED' },
    { role: 'ai', content: 'Operator Trey, fingerprint authorization accepted. I am your on-device decoy mainframe assistant. Direct connection to local neural nodes is established. What matrix operations shall we coordinate today?' }
  ]);
  const [isDecoyTyping, setIsDecoyTyping] = useState(false);
  const decoyBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll decoy AI chat
  useEffect(() => {
    decoyBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [decoyHistory, showDecoyAi]);

  const handleScanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanProgress(0);
    holdStartTimeRef.current = Date.now();

    const duration = 1000; // 1 second
    const intervalTime = 30; // update every 30ms
    const step = (100 / (duration / intervalTime));

    progressIntervalRef.current = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    scanTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setScanProgress(100);
      setIsScanning(false);
      setShowDecoyAi(true);
      // Clean vibration support
      if (navigator.vibrate) {
        try { navigator.vibrate(200); } catch (_) {}
      }
    }, duration);
  };

  const handleScanEnd = () => {
    if (!isScanning) return;

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const holdDuration = Date.now() - holdStartTimeRef.current;
    setIsScanning(false);
    setScanProgress(0);

    // Short tap/click acts as HOME button
    if (holdDuration < 1000) {
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSendDecoyMessage = (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msg = customMsg || decoyInput;
    if (!msg.trim()) return;

    setDecoyHistory(prev => [...prev, { role: 'user', content: msg }]);
    if (!customMsg) setDecoyInput('');
    setIsDecoyTyping(true);

    setTimeout(() => {
      const msgLower = msg.toLowerCase();
      let reply = '';
      if (msgLower.includes('biometric') || msgLower.includes('diagnostics') || msgLower.includes('fingerprint')) {
        reply = "SCANNER DATA:\n- Ridge pattern: Whorl / Portal Concentric\n- Blood pressure: 120/80 (Optimal)\n- Adrenaline: Elevated (Excitement levels high)\n- Diagnosis: Operator Trey is fully calibrated for hyperdrive.";
      } else if (msgLower.includes('temp') || msgLower.includes('temperature') || msgLower.includes('core')) {
        reply = "CORE METRICS REPORT:\n- CPU Temp: 42°C\n- Memory Temp: 38°C\n- Aux Coolant Level: 92.4%\n- System Integrity: 100% Optimal. No thermal throttling detected.";
      } else if (msgLower.includes('firewall') || msgLower.includes('security') || msgLower.includes('bypass')) {
        reply = "⚠️ SECURITY OVERRIDE TRIGGERED...\n[Bypassing Aux firewall block... Done]\n[Decrypting kernel layer... Done]\n[Generating mainframe credentials... Rejected]\n\nNice try, Operator Trey! The decoy firewall has locked you out. System remains perfectly secure.";
      } else if (msgLower.includes('integrity') || msgLower.includes('mainframe') || msgLower.includes('analyse') || msgLower.includes('analyze')) {
        reply = "DIAGNOSTIC READOUT:\n- Subspace portals: ENGAGED\n- Audio synthesis engine: TUNED\n- Neon Drift simulator: STEADY\n- Local sandbox memory storage: ACTIVE\n- Mainframe is rock solid!";
      } else if (msgLower.includes('hello') || msgLower.includes('hi')) {
        reply = "Greetings, Operator Trey! My synaptic networks are buzzing. Let's calibrate some portals.";
      } else {
        const fallbackAnswers = [
          "Local cognitive mainframe processing complete. Understood: '" + msg + "'. This is a highly responsive simulated decoy response. Systems remain fully optimal.",
          "Auxiliary decoy engine parsed your payload. Command logged. No fatal core conflicts found, Trey.",
          "Failsafe mode active. Understood request. Biometric signature matching indicates high priority action, but simulated decoy protocols are strictly for entertainment. Let's drift some neon cars instead!",
          "Processing your neural inputs... Decoy node replies: Trey, your request has been logged in the local decentralized cache. Ready for the next command."
        ];
        reply = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
      }

      setDecoyHistory(prev => [...prev, { role: 'ai', content: reply }]);
      setIsDecoyTyping(false);
    }, 900);
  };

  // AI assistant states
  const [aiInput, setAiInput] = useState('');
  const [aiHistory, setAiHistory] = useState<Array<{role: string, content: string}>>([
    { role: 'model', content: 'Greeting Operator Trey. Systems calibrated. How may I optimize your workflow today?' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Alarms status state
  const [alarms, setAlarms] = useState([
    { id: 1, time: '7:00 AM', label: 'Morning Alarm', active: true },
    { id: 2, time: '12:30 PM', label: 'Lunch Break', active: true },
    { id: 3, time: '9:00 PM', label: 'Study Time', active: false },
  ]);

  // Today's Plan Checklist
  const [tasks, setTasks] = useState([
    { id: 1, label: 'Math homework', time: '10:00 AM', completed: false },
    { id: 2, label: 'Gym', time: '12:00 PM', completed: true },
    { id: 3, label: 'Study for test', time: '7:00 PM', completed: false },
    { id: 4, label: 'Read chapter 5', time: '9:30 PM', completed: false },
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('12:00 PM');

  // Downloads manager state
  const [downloads, setDownloads] = useState([
    { id: 1, name: 'NextGenPortal_Setup.exe', size: '1.2 GB', progress: 100 },
    { id: 2, name: 'Game_Update_v2.3.zip', size: '850 MB', progress: 80 },
    { id: 3, name: 'AI_Model_7B.gguf', size: '4.2 GB', progress: 100 },
  ]);

  // Recent Activity state
  const [activities, setActivities] = useState([
    { id: '1', type: 'chat', label: 'Physics Homework Help', subtitle: 'AI Chat', time: '2m ago' },
    { id: '2', type: 'games', label: 'Neon Drift Multiplayer', subtitle: 'Game Session', time: '29m ago' },
    { id: '3', type: 'notes', label: 'Workout Plan', subtitle: 'Note', time: '1h ago' },
    { id: '4', type: 'images', label: 'Island Concept Art.png', subtitle: 'Image', time: '2h ago' },
    { id: '5', type: 'files', label: 'Project Portal v2', subtitle: 'Folder', time: '3h ago' },
  ]);

  // Command palette keyboard listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearchPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll chat window down when AI replies
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiHistory]);

  // Dynamic Theme hex colors for badges & custom borders
  const getThemeHex = () => {
    switch (themeColor) {
      case 'silver': return '#94a3b8'; // White-Silver
      case 'purple': return '#8b5cf6'; // Amethyst Purple
      case 'cyan': return '#6366f1'; // Indigo-Violet (replaces cyan)
      case 'pink': return '#cf4fe6'; // Orchid Magenta (replaces pink)
      case 'emerald': return '#86198f'; // Plum Purple (replaces emerald)
      case 'amber': return '#c084fc'; // Lilac Purple (replaces amber)
      default: return '#8b5cf6';
    }
  };

  const getThemeGradient = () => {
    switch (themeColor) {
      case 'silver': return 'from-slate-300 to-slate-500';
      case 'purple': return 'from-purple-600 to-indigo-600';
      case 'cyan': return 'from-indigo-600 to-violet-600';
      case 'pink': return 'from-[#cf4fe6] to-[#ec4899]';
      case 'emerald': return 'from-purple-950 via-purple-900 to-fuchsia-900';
      case 'amber': return 'from-purple-400 to-indigo-400';
      default: return 'from-purple-600 to-indigo-600';
    }
  };

  const renderSidebarIcon = (id: string, isActive: boolean) => {
    const activeColor = getThemeHex();
    const inactiveColor = portalDarkMode ? 'rgba(167, 139, 250, 0.55)' : '#64748b';
    
    switch (id) {
      case 'home':
        return (
          <svg className="w-4 h-4 transition-all duration-300" viewBox="0 0 44 44" style={{ filter: isActive ? 'drop-shadow(0 0 4px rgba(212,175,55,0.4))' : 'none' }}>
            <circle cx="22" cy="22" r="16" fill={isActive ? '#120624' : 'none'} stroke={isActive ? '#d4af37' : inactiveColor} strokeWidth="1.8" />
            <g opacity={isActive ? '0.6' : '0.15'}>
              <path d="M 12,22 A 10,10 0 0 1 32,22" stroke="#4f7fe6" strokeWidth="0.5" fill="none" strokeDasharray="2,2" />
              <circle cx="22" cy="22" r="12" stroke="#4f7fe6" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
            </g>
            <g stroke={isActive ? '#d4af37' : inactiveColor} strokeWidth="1.2" opacity={isActive ? '0.8' : '0.4'}>
              <line x1="22" y1="7" x2="22" y2="9" />
              <line x1="22" y1="35" x2="22" y2="37" />
              <line x1="7" y1="22" x2="9" y2="22" />
              <line x1="35" y1="22" x2="37" y2="22" />
            </g>
            <g stroke={isActive ? '#3fd9c7' : inactiveColor} strokeWidth="1.5" strokeLinecap="round">
              <line x1="22" y1="22" x2="22" y2="13" />
            </g>
            <g stroke={isActive ? '#13efb0' : inactiveColor} strokeWidth="1" strokeLinecap="round">
              <line x1="22" y1="22" x2="14" y2="22" />
            </g>
            <circle cx="22" cy="22" r="2.5" fill={isActive ? '#ffd700' : inactiveColor} stroke={isActive ? '#120624' : 'none'} strokeWidth="0.8" />
          </svg>
        );

      case 'chat':
        return (
          <svg className="w-4 h-4 transition-all duration-300 rounded-full" viewBox="0 0 100 100" style={{ filter: isActive ? 'drop-shadow(0 0 3px rgba(207,79,230,0.6))' : 'none', background: isActive ? '#0a0518' : 'none', border: isActive ? '1px solid rgba(207,79,230,0.3)' : '1px solid transparent' }}>
            <g opacity={isActive ? '0.8' : '0.2'}>
              <path d="M 20,80 Q 5,50 15,25 Q 30,55 45,75 Z" fill={isActive ? '#7c3aed' : inactiveColor} />
              <path d="M 80,80 Q 95,50 85,25 Q 70,55 55,75 Z" fill={isActive ? '#7c3aed' : inactiveColor} />
            </g>
            <path d="M 12,38 C 5,28 10,22 28,32 Z" fill={isActive ? '#8a614d' : inactiveColor} opacity={isActive ? '1' : '0.4'} />
            <path d="M 88,38 C 95,28 90,22 72,32 Z" fill={isActive ? '#8a614d' : inactiveColor} opacity={isActive ? '1' : '0.4'} />
            <path d="M 20,78 Q 50,10 80,78 Q 50,55 20,78 Z" fill={isActive ? '#1e113a' : 'none'} stroke={isActive ? '#5b21b6' : inactiveColor} strokeWidth="1.5" />
            <path d="M 32,45 C 32,40 68,40 68,45 C 68,68 32,68 32,45 Z" fill={isActive ? '#040209' : 'none'} stroke={isActive ? 'transparent' : inactiveColor} strokeWidth="1" />
            <path d="M 34,48 Q 50,54 66,48 L 60,68 Q 50,75 40,68 Z" fill={isActive ? '#311042' : 'none'} />
            <ellipse cx="42" cy="43" rx="4.5" ry="1.5" fill={isActive ? '#e0f7fa' : inactiveColor} />
            <ellipse cx="58" cy="43" rx="4.5" ry="1.5" fill={isActive ? '#e0f7fa' : inactiveColor} />
            <line x1="32" y1="43" x2="52" y2="43" stroke={isActive ? '#06b6d4' : inactiveColor} strokeWidth="1.2" />
            <line x1="48" y1="43" x2="68" y2="43" stroke={isActive ? '#06b6d4' : inactiveColor} strokeWidth="1.2" />
          </svg>
        );

      case 'games':
        return (
          <svg className="w-4 h-4 transition-all duration-300" viewBox="0 0 44 44" style={{ filter: isActive ? 'drop-shadow(0 0 4px rgba(168,85,247,0.5))' : 'none' }}>
            <polygon points="22,5 10,13 10,31 22,39 34,31 34,13" fill={isActive ? '#6d1e9c' : 'none'} stroke={isActive ? '#cf4fe6' : inactiveColor} strokeWidth="1.5" />
            <polygon points="22,5 10,13 22,17" fill={isActive ? '#4d1473' : 'none'} stroke={isActive ? '#cf4fe6' : inactiveColor} strokeWidth="0.8" opacity={isActive ? '0.8' : '0.15'}/>
            <polygon points="34,13 22,5 22,17" fill={isActive ? '#8828bd' : 'none'} stroke={isActive ? '#cf4fe6' : inactiveColor} strokeWidth="0.8" opacity={isActive ? '0.8' : '0.15'}/>
            <polygon points="10,13 10,31 22,23" fill={isActive ? '#3c0f59' : 'none'} stroke={isActive ? '#cf4fe6' : inactiveColor} strokeWidth="0.8" opacity={isActive ? '0.8' : '0.15'}/>
            <polygon points="34,13 34,31 22,23" fill={isActive ? '#581682' : 'none'} stroke={isActive ? '#cf4fe6' : inactiveColor} strokeWidth="0.8" opacity={isActive ? '0.8' : '0.15'}/>
            <polygon points="22,17 10,31 34,31" fill={isActive ? '#a23ad4' : 'none'} stroke={isActive ? '#e15ffd' : inactiveColor} strokeWidth="1.2" />
            <text x="22" y="27" fontFamily="'Cormorant', serif" fontWeight="900" fontSize="10" fill={isActive ? '#faebd7' : inactiveColor} textAnchor="middle" style={{ letterSpacing: '-0.5px' }}>20</text>
          </svg>
        );

      case 'utilities':
        return (
          <svg className="w-4 h-4 transition-all duration-300" viewBox="0 0 44 44" style={{ filter: isActive ? 'drop-shadow(0 0 4px rgba(232,121,249,0.5))' : 'none' }}>
            <rect x="6" y="14" width="32" height="24" rx="4" fill={isActive ? '#1b0e2f' : 'none'} stroke={isActive ? '#e879f9' : inactiveColor} strokeWidth="1.8" />
            <path d="M 16,14 L 16,8 A 3,3 0 0 1 28,8 L 28,14" fill="none" stroke={isActive ? '#e879f9' : inactiveColor} strokeWidth="1.8" />
            <line x1="6" y1="22" x2="38" y2="22" stroke={isActive ? '#e879f9' : inactiveColor} strokeWidth="1.2" strokeDasharray="2,2" opacity={isActive ? '0.6' : '0.2'} />
            <circle cx="22" cy="22" r="3.5" fill={isActive ? '#3fd9c7' : inactiveColor} />
            <path d="M 14,29 L 20,29" stroke={isActive ? '#faebd7' : inactiveColor} strokeWidth="1.5" />
            <path d="M 24,29 L 30,29" stroke={isActive ? '#faebd7' : inactiveColor} strokeWidth="1.5" />
            <path d="M 14,33 L 30,33" stroke={isActive ? '#faebd7' : inactiveColor} strokeWidth="1.5" />
          </svg>
        );

      case 'settings':
        return (
          <svg className="w-4 h-4 transition-all duration-300" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="3" fill={isActive ? activeColor : 'none'} stroke={isActive ? activeColor : inactiveColor} strokeWidth="1.5" />
            <path d="M11 2.5v2.2M11 17.3v2.2M19.5 11h-2.2M4.7 11H2.5M17 5l-1.6 1.6M6.6 15.4 5 17M17 17l-1.6-1.6M6.6 6.6 5 5" stroke={isActive ? activeColor : inactiveColor} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      default:
        // Render standard Lucide icon component, styled to be white if active, slate-500 if inactive
        const NavIcon = NAV_ITEMS.find(n => n.id === id)?.icon || Settings;
        return <NavIcon className="w-4 h-4 transition-all" style={{ color: isActive ? '#ffffff' : undefined }} />;
    }
  };

  const getThemeBreatheClass = () => {
    switch (themeColor) {
      case 'silver': return 'glow-silver';
      case 'cyan': return 'glow-blue'; // Indigo-Violet glow
      case 'pink': return 'glow-pink';  // Orchid Magenta glow
      case 'emerald': return 'glow-purple'; // Plum Core glow
      case 'amber': return 'glow-purple';   // Lilac Mist glow
      default: return 'glow-purple';
    }
  };

  const getAccentBg = () => {
    switch (themeColor) {
      case 'silver': return 'bg-slate-100 border-slate-200 text-slate-700';
      case 'cyan': return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'pink': return 'bg-pink-50 border-pink-100 text-pink-700';
      case 'emerald': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      case 'amber': return 'bg-amber-50 border-amber-100 text-amber-700';
      default: return 'bg-purple-50 border-purple-100 text-purple-700';
    }
  };

  // Chat message submission
  const handleSendChatMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgToSend = customMsg || aiInput;
    if (!msgToSend.trim()) return;

    const userMsg = { role: 'user', content: msgToSend };
    setAiHistory(prev => [...prev, userMsg]);
    if (!customMsg) setAiInput('');
    setIsAiLoading(true);

    try {
      if (localAIStatus === 'ready') {
        const response = await fetch('/api/companion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: msgToSend,
            history: aiHistory,
            attachments: []
          })
        });

        const data = await response.json();
        if (response.ok && data.text) {
          setAiHistory(prev => [...prev, { role: 'model', content: data.text }]);
        } else {
          throw new Error('Local companion failed');
        }
      } else {
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msgToSend,
            history: aiHistory
          })
        });

        const data = await response.json();
        if (response.ok && data.text) {
          setAiHistory(prev => [...prev, { role: 'model', content: data.text }]);
        } else {
          throw new Error('Gemini proxy failed');
        }
      }
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setAiHistory(prev => [...prev, { 
          role: 'model', 
          content: `🔮 **Mainframe Calibration Mode**\n\nI processed your transmission: "${msgToSend}".\n\nTo run live offline companion queries, ensure the local engine is booted on port 5001. To run online queries, verify your Gemini API key in secrets.` 
        }]);
      }, 600);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle tasks
  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks(prev => [
      ...prev,
      { id: Date.now(), label: newTaskText, time: newTaskTime, completed: false }
    ]);
    setNewTaskText('');
  };

  // Filter components for workspace testing
  const filteredQuickAccess = QUICK_ACCESS.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="fixed inset-0 w-full h-full font-sans overflow-hidden select-none"
        style={{ 
          background: 'linear-gradient(135deg, var(--theme-bg-gradient-start, #06000f) 0%, var(--theme-bg-gradient-end, #0d0221) 100%)',
          ...currentThemeStyles
        }}>

        {/* ── ANIMATED COLOUR ORBS ── */}
        <div className="absolute pointer-events-none" style={{
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)',
          top: '-15%', left: '-10%',
          animation: 'orb-drift-a 18s ease-in-out infinite',
        }} />
        <div className="absolute pointer-events-none" style={{
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,38,211,0.22) 0%, transparent 70%)',
          bottom: '-20%', right: '10%',
          animation: 'orb-drift-b 22s ease-in-out infinite',
        }} />
        <div className="absolute pointer-events-none" style={{
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          top: '35%', right: '-5%',
          animation: 'orb-drift-c 14s ease-in-out infinite',
        }} />
        <div className="absolute pointer-events-none" style={{
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)',
          top: '55%', left: '5%',
          animation: 'orb-drift-a 20s ease-in-out infinite reverse',
        }} />

        {/* ── CYBER GRID ── */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'grid-drift 8s linear infinite',
        }} />

        {/* ── STAR CANVAS ── */}
        <canvas id="starfield" className="absolute inset-0 pointer-events-none z-[1]" />

        {/* ── SCAN LINE ── */}
        <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-[2]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(192,38,211,0.8), rgba(168,85,247,0.6), transparent)',
            animation: 'scan-line 6s linear infinite',
          }} />

        {/* ── LAYOUT: split left/right ── */}
        <div className="relative z-10 flex flex-col md:flex-row w-full h-full">

          {/* ════ LEFT: LOGO PANEL ════ */}
          <div className="w-full md:w-1/2 h-[45vh] md:h-full flex flex-col items-center justify-center relative overflow-hidden"
            style={{ borderRight: '1px solid rgba(139,92,246,0.15)' }}>

            {/* Spinning orbital rings around the logo center */}
            <div className="absolute pointer-events-none" style={{
              width: 520, height: 520,
              top: '50%', left: '50%',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: '50%',
              borderTopColor: 'rgba(168,85,247,0.7)',
              animation: 'spin-ring-a 8s linear infinite',
            }} />
            <div className="absolute pointer-events-none" style={{
              width: 420, height: 420,
              top: '50%', left: '50%',
              border: '1px solid rgba(192,38,211,0.2)',
              borderRadius: '50%',
              borderBottomColor: 'rgba(236,72,153,0.65)',
              animation: 'spin-ring-b 12s linear infinite',
            }} />
            <div className="absolute pointer-events-none" style={{
              width: 320, height: 320,
              top: '50%', left: '50%',
              border: '1px dashed rgba(99,102,241,0.2)',
              borderRadius: '50%',
              borderLeftColor: 'rgba(139,92,246,0.5)',
              animation: 'spin-ring-a 20s linear infinite reverse',
            }} />

            {/* Orbiting glowing dots */}
            <div className="absolute pointer-events-none" style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'rgba(168,85,247,1)',
              boxShadow: '0 0 12px 4px rgba(168,85,247,0.8)',
              top: '50%', left: '50%', marginTop: -4, marginLeft: -4,
              animation: 'orbit-cw 8s linear infinite',
            }} />
            <div className="absolute pointer-events-none" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'rgba(236,72,153,1)',
              boxShadow: '0 0 10px 3px rgba(236,72,153,0.8)',
              top: '50%', left: '50%', marginTop: -3, marginLeft: -3,
              animation: 'orbit-ccw 12s linear infinite',
            }} />
            <div className="absolute pointer-events-none" style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'rgba(99,102,241,1)',
              boxShadow: '0 0 8px 2px rgba(99,102,241,0.9)',
              top: '50%', left: '50%', marginTop: -2.5, marginLeft: -2.5,
              animation: 'orbit-slow 20s linear infinite',
            }} />

            {/* The glowing portal logo */}
            <img
              src={portalLogo}
              alt="The Portal Logo"
              style={{ animation: 'logo-levitate 5s ease-in-out infinite' }}
              className="w-[80%] max-w-[400px] md:max-w-[480px] max-h-[38vh] object-contain select-none relative z-10"
            />

            {/* Bottom label */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 z-10"
              style={{ animation: 'fade-up 1.2s ease-out both', animationDelay: '0.4s' }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.35em]"
                style={{ background: 'linear-gradient(90deg,#a78bfa,#e879f9,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                NextGen Desktop OS Shell
              </span>
            </div>
          </div>

          {/* ════ RIGHT: AUTH PANEL ════ */}
          <div className="flex-1 h-[55vh] md:h-full flex items-center justify-center p-4 sm:p-10 relative">

            {/* Form card */}
            <div className="relative w-full max-w-md"
              style={{ animation: 'fade-up 0.8s ease-out both' }}>

              {/* Shimmer border glow */}
              <div className="absolute -inset-[1px] rounded-3xl pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(192,38,211,0.4), rgba(99,102,241,0.5), rgba(236,72,153,0.35))',
                  animation: 'shimmer-border 3s ease-in-out infinite',
                }} />

              <div className="relative rounded-3xl p-8 space-y-6 overflow-hidden"
                style={{
                  background: 'rgba(10,2,28,0.82)',
                  backdropFilter: 'blur(32px)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}>

                {/* Scan line on card */}
                <div className="absolute left-0 right-0 h-[1px] pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)',
                    animation: 'scan-line 4s linear infinite',
                    animationDelay: '2s',
                  }} />

                {/* Title */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-black tracking-[0.15em] uppercase"
                    style={{ background: 'linear-gradient(135deg,#e2d9f3,#c084fc,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    THE PORTAL
                  </h1>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase"
                    style={{ color: 'rgba(167,139,250,0.6)' }}>
                    Traveler Authentication Rift
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex w-full p-1 rounded-xl text-[10px] font-bold"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <button type="button"
                    onClick={() => { haptic(5); setLoginTab('login'); setAuthError(''); }}
                    className="flex-1 py-2 rounded-lg cursor-pointer transition-all duration-300"
                    style={loginTab === 'login' ? {
                      background: 'linear-gradient(135deg,rgba(139,92,246,0.4),rgba(192,38,211,0.3))',
                      color: '#e2d9f3',
                      boxShadow: '0 2px 12px rgba(139,92,246,0.3)',
                      border: '1px solid rgba(139,92,246,0.4)',
                    } : { color: 'rgba(167,139,250,0.45)', border: '1px solid transparent' }}>
                    Traveler Sign In
                  </button>
                  <button type="button"
                    onClick={() => { haptic(5); setLoginTab('signup'); setAuthError(''); }}
                    className="flex-1 py-2 rounded-lg cursor-pointer transition-all duration-300"
                    style={loginTab === 'signup' ? {
                      background: 'linear-gradient(135deg,rgba(139,92,246,0.4),rgba(192,38,211,0.3))',
                      color: '#e2d9f3',
                      boxShadow: '0 2px 12px rgba(139,92,246,0.3)',
                      border: '1px solid rgba(139,92,246,0.4)',
                    } : { color: 'rgba(167,139,250,0.45)', border: '1px solid transparent' }}>
                    Initialize Rift
                  </button>
                </div>

                {/* Error */}
                {authError && (
                  <div className="text-[9px] font-bold text-center px-3 py-2 rounded-xl"
                    style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {authError}
                  </div>
                )}

                {loginTab === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold tracking-widest block"
                        style={{ color: 'rgba(167,139,250,0.7)' }}>Traveler ID</label>
                      <input type="text" value={loginUser}
                        onChange={e => setLoginUser(e.target.value)}
                        placeholder="e.g. trxy6"
                        className="w-full px-4 py-2.5 rounded-xl text-xs outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(139,92,246,0.06)',
                          border: '1px solid rgba(139,92,246,0.25)',
                          color: '#e2d9f3',
                        }}
                        onFocus={e => { e.target.style.border = '1px solid rgba(168,85,247,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                        onBlur={e => { e.target.style.border = '1px solid rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold tracking-widest block"
                        style={{ color: 'rgba(167,139,250,0.7)' }}>Passcode PIN</label>
                      <input type="password" value={loginPin}
                        onChange={e => setLoginPin(e.target.value)}
                        placeholder="••••" maxLength={4}
                        className="w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(139,92,246,0.06)',
                          border: '1px solid rgba(139,92,246,0.25)',
                          color: '#e2d9f3',
                        }}
                        onFocus={e => { e.target.style.border = '1px solid rgba(168,85,247,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                        onBlur={e => { e.target.style.border = '1px solid rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <button type="submit"
                      className="w-full py-3 rounded-xl font-bold text-xs tracking-[0.2em] uppercase text-white cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                      style={{
                        background: 'var(--theme-btn-gradient)',
                        boxShadow: '0 0 24px rgba(139,92,246,0.45), 0 4px 12px rgba(0,0,0,0.3)',
                      }}
                      onMouseEnter={e => { (e.target as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(168,85,247,0.65), 0 4px 16px rgba(0,0,0,0.4)'; }}
                      onMouseLeave={e => { (e.target as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(139,92,246,0.45), 0 4px 12px rgba(0,0,0,0.3)'; }}>
                      <Lock className="w-3.5 h-3.5" />
                      Enter The Portal
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignUpSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold tracking-widest block"
                        style={{ color: 'rgba(167,139,250,0.7)' }}>Claim Traveler ID</label>
                      <input type="text" value={signupUser}
                        onChange={e => setSignupUser(e.target.value)}
                        placeholder="At least 3 characters"
                        className="w-full px-4 py-2.5 rounded-xl text-xs outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(139,92,246,0.06)',
                          border: '1px solid rgba(139,92,246,0.25)',
                          color: '#e2d9f3',
                        }}
                        onFocus={e => { e.target.style.border = '1px solid rgba(168,85,247,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                        onBlur={e => { e.target.style.border = '1px solid rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold tracking-widest block"
                        style={{ color: 'rgba(167,139,250,0.7)' }}>Create Passcode PIN</label>
                      <input type="password" value={signupPin}
                        onChange={e => setSignupPin(e.target.value)}
                        placeholder="Exactly 4 digits" maxLength={4}
                        className="w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(139,92,246,0.06)',
                          border: '1px solid rgba(139,92,246,0.25)',
                          color: '#e2d9f3',
                        }}
                        onFocus={e => { e.target.style.border = '1px solid rgba(168,85,247,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                        onBlur={e => { e.target.style.border = '1px solid rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <button type="submit"
                      className="w-full py-3 rounded-xl font-bold text-xs tracking-[0.2em] uppercase text-white cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                      style={{
                        background: 'var(--theme-btn-gradient)',
                        boxShadow: '0 0 24px rgba(139,92,246,0.45), 0 4px 12px rgba(0,0,0,0.3)',
                      }}
                      onMouseEnter={e => { (e.target as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(168,85,247,0.65), 0 4px 16px rgba(0,0,0,0.4)'; }}
                      onMouseLeave={e => { (e.target as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(139,92,246,0.45), 0 4px 12px rgba(0,0,0,0.3)'; }}>
                      <Plus className="w-3.5 h-3.5" />
                      Open The Rift
                    </button>
                  </form>
                )}

                <div className="text-center text-[8px] font-mono tracking-widest"
                  style={{ color: 'rgba(139,92,246,0.35)' }}>
                  V2.4.0 • ZERO CLOUD DATA LEAKAGE • ENCRYPTED LOCAL STORAGE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div 
      className={`h-screen font-sans flex flex-col relative overflow-hidden selection:bg-indigo-500/20 app-root ${portalDarkMode ? 'portal-dark' : 'text-slate-800'}`}
      style={currentThemeStyles}
    >
      
      {/* Background Portal Looping Custom Video */}
      {bgVideoUrl && (
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          src={bgVideoUrl}
          className="fixed inset-0 w-full h-full object-cover pointer-events-none z-[0]"
          style={{
            opacity: bgVideoOpacity / 100,
            filter: `blur(${bgVideoBlur}px) brightness(${bgVideoBrightness}%) hue-rotate(${bgVideoHue}deg)`
          }}
        />
      )}

      {/* Dark mode animated cosmic orbs — only visible in dark mode via CSS */}
      <div className="dark-orb-a absolute pointer-events-none" style={{ width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)', top: '-15%', left: '-10%', animation: 'orb-drift-a 18s ease-in-out infinite' }} />
      <div className="dark-orb-b absolute pointer-events-none" style={{ width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,38,211,0.18) 0%, transparent 70%)', bottom: '-20%', right: '5%', animation: 'orb-drift-b 22s ease-in-out infinite' }} />
      <div className="dark-orb-c absolute pointer-events-none" style={{ width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 70%)', top: '40%', right: '-5%', animation: 'orb-drift-c 14s ease-in-out infinite' }} />

      {/* Light mode nebula blobs — hidden in dark mode */}
      {!portalDarkMode && <>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/40 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/35 blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px] pointer-events-none" />
      </>}

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none" />

      {/* Ambient Cosmic Starfield Canvas */}
      <canvas id="starfield" />

      {/* TOP HEADER */}
      <header id="main-header" className={`app-header sticky top-0 z-50 backdrop-blur-md border-b px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-500 ${portalDarkMode ? 'bg-[rgba(6,0,15,0.85)] border-purple-500/15' : 'bg-white/50 border-slate-200/45'}`}>
        
        {/* Left: Brand logo, name, & Left Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="p-1.5 rounded-lg hover:bg-slate-200/50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer mr-0.5"
            title="Toggle Left Panel"
          >
            {showLeftSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" style={{ color: getThemeHex() }} />}
          </button>

          <div 
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-1000 relative hidden xs:flex"
            style={{ 
              borderColor: getThemeHex(),
              boxShadow: `0 0 10px ${getThemeHex()}30`
            }}
          >
            {/* Spinning core node */}
            <div className="w-4 h-4 rounded-full border border-dashed animate-[spin_6s_linear_infinite] flex items-center justify-center" style={{ borderColor: getThemeHex() }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getThemeHex() }} />
            </div>
            {/* Outer pulsating wave */}
            <div className="absolute -inset-1 rounded-full border opacity-10 animate-ping" style={{ borderColor: getThemeHex() }} />
          </div>
          <span className={`font-extrabold text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] bg-clip-text text-transparent select-none ${portalDarkMode ? 'bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300' : 'bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-950'}`}>
            THE PORTAL
          </span>
        </div>

        {/* Center: Search Bar (fully interactive with Command Palette overlay) - always visible, beautifully responsive */}
        <div className="relative flex-1 max-w-xs sm:max-w-md md:max-w-lg mx-2 sm:mx-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              id="header-search-input"
              type="text"
              placeholder="Search or ask anything in The Portal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchPalette(true)}
              className="w-full pl-9 pr-12 py-1.5 bg-[#ebedfa]/50 border border-slate-200/40 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400/60 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
            <div className="absolute right-3.5 top-2 px-1.5 py-0.5 rounded border border-slate-200/80 bg-slate-100/80 text-[8px] text-slate-400 font-mono tracking-wider select-none hidden sm:block">
              ⌘ K
            </div>
          </div>

          {/* Inline search dropdown results preview */}
          {searchQuery && (
            <div className="absolute left-0 right-0 mt-2 p-2 bg-white/95 backdrop-blur-md border border-slate-200/65 rounded-lg shadow-2xl z-50">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 px-3 py-1 font-bold">
                Filtered Workspace Panels
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredQuickAccess.length === 0 ? (
                  <div className="text-xs text-slate-400 p-3 text-center">No matching panels found</div>
                ) : (
                  filteredQuickAccess.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-50 text-left transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-700">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Notifications, Right Sidebar Toggle, & User profile */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Dark / White Mode Toggle */}
          <button
            id="theme-mode-toggle-btn"
            title={portalDarkMode ? 'Switch to White Mode' : 'Switch to Purple Mode'}
            onClick={togglePortalDarkMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-pointer transition-all duration-300 text-[10px] font-bold tracking-wider border"
            style={portalDarkMode ? {
              background: 'rgba(139,92,246,0.15)',
              borderColor: 'rgba(139,92,246,0.4)',
              color: '#c4b5fd',
              boxShadow: '0 0 12px rgba(139,92,246,0.2)',
            } : {
              background: 'rgba(235,237,250,0.6)',
              borderColor: 'rgba(148,163,184,0.3)',
              color: '#64748b',
            }}
          >
            <span style={{ fontSize: 13 }}>{portalDarkMode ? '🌙' : '☀️'}</span>
            <span className="hidden sm:inline">{portalDarkMode ? 'Purple' : 'White'}</span>
          </button>

          {/* Accent Color Trim Quick Config buttons */}
          <div className="flex items-center gap-1 bg-[#ebedfa]/45 border border-slate-200/30 p-1.5 rounded-full">
            {(['silver', 'purple', 'cyan', 'pink', 'emerald', 'amber'] as const).map(color => (
              <button 
                key={color}
                title={`Accent: ${color}`}
                onClick={() => setThemeColor(color)}
                className={`w-3 h-3 rounded-full transition-all hover:scale-125 cursor-pointer ${
                  color === 'silver' ? 'bg-slate-400' :
                  color === 'purple' ? 'bg-purple-500' :
                  color === 'cyan' ? 'bg-indigo-500' :
                  color === 'pink' ? 'bg-fuchsia-500' :
                  color === 'emerald' ? 'bg-purple-900' :
                  'bg-purple-300'
                } ${themeColor === color ? 'ring-2 ring-slate-400 scale-110 shadow-lg' : 'opacity-45'}`}
              />
            ))}
          </div>

          {/* Notification bell badge */}
          <button 
            id="bell-notification-btn"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors relative"
            onClick={() => alert("All portal subsystems optimal. 0 outstanding warning alerts.")}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          </button>

          {/* Right Sidebar Toggle */}
          <button 
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            title="Toggle Right Panel"
          >
            {showRightSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" style={{ color: getThemeHex() }} />}
          </button>

          {/* User profile capsule */}
          <div ref={profileMenuRef} className="relative">
            <button 
              onClick={() => { haptic(5); setShowProfileDropdown(!showProfileDropdown); }}
              className={`flex items-center gap-2 pl-2 border-l transition-all duration-300 hover:scale-105 active:scale-98 cursor-pointer outline-none ${portalDarkMode ? 'border-purple-500/20' : 'border-slate-200'}`}
              title="User Account Menu"
            >
              <div className="relative">
                <img 
                  src={userAvatar} 
                  alt="User Avatar" 
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border object-cover transition-all ${portalDarkMode ? 'border-purple-500/40 ring-1 ring-purple-500/20' : 'border-slate-200'}`}
                />
                <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ring-2 ${portalDarkMode ? 'ring-[#0a021c]' : 'ring-white'} ${
                  userStatus === 'online' ? 'bg-emerald-500' :
                  userStatus === 'idle' ? 'bg-amber-500' :
                  userStatus === 'dnd' ? 'bg-rose-500' : 'bg-slate-400'
                }`} />
              </div>
              <span className={`text-xs font-semibold hidden lg:inline ${portalDarkMode ? 'text-purple-200' : 'text-slate-700'}`}>{currentUser || 'Traveler'}</span>
              <ChevronDown className={`w-3.5 h-3.5 hidden lg:block ${portalDarkMode ? 'text-purple-400' : 'text-slate-500'}`} />
            </button>

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div 
                className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-xl p-1.5 z-[9999] animate-[fadeIn_0.15s_ease-out] text-left ${
                  portalDarkMode 
                    ? 'border-purple-500/20 bg-[#0f0724] text-purple-200' 
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div className="p-2 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                  <img src={userAvatar} className="w-8 h-8 rounded-full object-cover border border-slate-200/50" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate">{currentUser || 'Traveler'}</span>
                    <span className="text-[8px] text-slate-400 truncate flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        userStatus === 'online' ? 'bg-emerald-500' :
                        userStatus === 'idle' ? 'bg-amber-500' :
                        userStatus === 'dnd' ? 'bg-rose-500' : 'bg-slate-400'
                      }`} />
                      {userStatus.toUpperCase()} - {userStatusMsg}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptic(10);
                    setShowProfileDropdown(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold hover:bg-purple-500/10 hover:text-purple-400 dark:hover:text-purple-300 transition-all cursor-pointer text-left border-none bg-transparent"
                >
                  👤 Edit Profile
                </button>
                <button
                  onClick={() => {
                    haptic(10);
                    setShowProfileDropdown(false);
                    setActiveTab('settings');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold hover:bg-purple-500/10 hover:text-purple-400 dark:hover:text-purple-300 transition-all cursor-pointer text-left border-none bg-transparent"
                >
                  ⚙️ Portal Settings
                </button>
                <button
                  onClick={() => {
                    haptic(10);
                    setShowProfileDropdown(false);
                    localStorage.removeItem('portal_current_user');
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer text-left border-none bg-transparent"
                >
                  🚪 Lock & Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION COLUMN (LEFT) */}
        <aside id="sidebar-nav" className={`fixed lg:static top-14 bottom-0 left-0 z-40 border-r flex flex-col justify-between overflow-y-auto transition-all duration-300 shadow-2xl lg:shadow-none lg:relative ${
          showLeftSidebar 
            ? 'w-64 p-4 translate-x-0 opacity-100 pointer-events-auto' 
            : 'w-0 lg:w-0 p-0 opacity-0 -translate-x-full lg:translate-x-0 lg:border-r-0 pointer-events-none'
        } ${portalDarkMode
          ? 'border-purple-500/15 bg-[rgba(10,2,28,0.88)] backdrop-blur-2xl'
          : 'border-slate-200/40 bg-gradient-to-b from-[#f8fafc]/95 via-[#f1f5f9]/90 to-[#e2e8f0]/85 backdrop-blur-2xl'
        }`}>
          
          {/* Top navigation container */}
          <div className="space-y-1">
            {/* Sidebar Brand Header matching target screenshot */}
            <div className="flex flex-col items-center justify-center text-center p-5 mb-4 border-b border-slate-100/60 w-full space-y-3">
              {/* Brand Logo Image matching the user provided logo */}
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <img src={portalLogo} alt="Portal Logo" className="w-18 h-18 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.35)] hover:scale-105 transition-all duration-300" />
              </div>
              <div className="flex flex-col items-center">
                <div className={`font-black text-sm tracking-widest uppercase leading-none ${portalDarkMode ? 'text-purple-200' : 'text-slate-800'}`}>THE PORTAL</div>
                <div className={`text-[9px] font-bold mt-1.5 leading-none ${portalDarkMode ? 'text-purple-400/60' : 'text-slate-400'}`}>NextGen Desktop Companion</div>
                <div className={`flex items-center gap-1 mt-2 text-[8px] font-bold px-2 py-0.5 rounded-full w-max ${portalDarkMode ? 'bg-purple-500/10 text-purple-300/60' : 'bg-slate-100 text-slate-500'}`}>
                  <span>✦ trxy6</span>
                </div>
              </div>
            </div>

            <div className={`text-[10px] uppercase tracking-[0.15em] px-3 pb-2 font-bold select-none text-left ${portalDarkMode ? 'text-purple-400/50' : 'text-slate-400'}`}>
              Portal Core
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-tab-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                    isActive 
                      ? `text-white font-bold shadow-md shadow-purple-500/20` 
                      : portalDarkMode
                        ? 'text-purple-300/60 hover:text-purple-100 hover:bg-purple-500/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                  } relative overflow-hidden group`}
                  style={isActive ? {
                    background: 'var(--theme-btn-gradient)',
                    boxShadow: '0 0 16px var(--theme-card-border)',
                  } : undefined}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    {renderSidebarIcon(item.id, isActive)}
                    <span>{item.label}</span>
                  </div>

                  {/* Left accent vertical line for active tab */}
                  {isActive && (
                    <div className="absolute inset-y-0 left-0 w-[4px] rounded-r-md" style={{ backgroundColor: '#ffffff' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Lower Sidebar status card matching the exact spec from the image */}
          <div className="mt-8 space-y-4">
            <div 
              className="p-4 rounded-2xl bg-gradient-to-br from-[#120a24] via-[#1d1135] to-[#0d071a] border relative overflow-hidden transition-all duration-1000 shadow-xl text-left"
              style={{ borderColor: 'var(--theme-card-border)', boxShadow: '0 4px 20px var(--theme-card-border)' }}
            >
              {/* Scanline grid details inside card */}
              <div className="absolute inset-0 cyber-grid-dense opacity-10 pointer-events-none" />
              <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full blur-xl pointer-events-none" style={{ backgroundColor: 'var(--theme-accent-color2)', opacity: 0.1 }} />

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Glowing dynamic robot/brain avatar */}
                  <div className="p-1.5 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-card-border)' }}>
                    {renderSidebarIcon('chat', true)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-white font-extrabold tracking-wide leading-none">NextGenPortal AI</span>
                    <span className="text-[8px] font-bold tracking-widest uppercase mt-0.5" style={{ color: 'var(--theme-accent-color2)' }}>Offline • Unlimited</span>
                  </div>
                </div>
              </div>

              {/* Storage progress bar matching the theme */}
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>Storage</span>
                  <span className="text-white">58%</span>
                </div>
                <div className="w-full h-1.5 bg-[#1b1429] rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: '58%', background: 'var(--theme-btn-gradient)', boxShadow: '0 0 8px var(--theme-card-border)' }} 
                  />
                </div>
              </div>
            </div>

            {/* Creator footer */}
            <div className={`flex items-center gap-2.5 px-3 py-2 border-t pt-4 ${portalDarkMode ? 'border-purple-500/10 text-purple-400/40' : 'border-slate-200/40 text-slate-400'}`}>
              <span className="text-lg leading-none">🔮</span>
              <div className="flex flex-col text-left">
                <span className={`text-[9px] font-bold leading-none ${portalDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>THE PORTAL</span>
                <span className={`text-[8px] mt-0.5 leading-none ${portalDarkMode ? 'text-purple-400/40' : 'text-slate-400'}`}>Built by trxy6</span>
              </div>
            </div>
          </div>
        </aside>

        <main className={`flex-1 flex flex-col min-h-0 relative ${
          activeTab === 'music' ? 'p-0 overflow-hidden' :
          activeTab === 'browser' ? 'p-6 overflow-hidden' :
          'p-6 overflow-y-auto'
        }`}>
          
          {/* Quick tab switch notifications */}
          {activeTab !== 'home' && activeTab !== 'music' && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-950/40 p-2 rounded border border-white/[0.02] max-w-max">
              <span>Workspace Portal</span>
              <span>/</span>
              <span className="text-slate-300 font-bold uppercase tracking-wider">{activeTab} View</span>
              <button onClick={() => setActiveTab('home')} className="text-purple-400 hover:underline pl-2 ml-2 border-l border-white/10">
                Return Home
              </button>
            </div>
          )}

          {/* MAIN HOME VIEW MODULE */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              
              {/* Premium Segmented Control Navigation to completely eliminate vertical scrolling */}
              <div className="border border-slate-200/40 p-1 bg-white/75 backdrop-blur-md rounded-2xl flex items-center justify-between shadow-sm max-w-xl mx-auto w-full">
                <button 
                  onClick={() => setHomeSubTab('launch')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    homeSubTab === 'launch' 
                      ? 'text-white shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  style={homeSubTab === 'launch' ? { background: 'var(--theme-btn-gradient)', boxShadow: '0 0 12px var(--theme-card-border)' } : undefined}
                >
                  🚀 Launchpad
                </button>
                <button 
                  onClick={() => setHomeSubTab('activity')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    homeSubTab === 'activity' 
                      ? 'text-white shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  style={homeSubTab === 'activity' ? { background: 'var(--theme-btn-gradient)', boxShadow: '0 0 12px var(--theme-card-border)' } : undefined}
                >
                  📋 Activity & Plans
                </button>
                <button 
                  onClick={() => setHomeSubTab('diagnostics')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    homeSubTab === 'diagnostics' 
                      ? 'text-white shadow-sm font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  style={homeSubTab === 'diagnostics' ? { background: 'var(--theme-btn-gradient)', boxShadow: '0 0 12px var(--theme-card-border)' } : undefined}
                >
                  ⚡ Telemetry
                </button>
              </div>

              {homeSubTab === 'launch' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* Top Welcome Banner with Space/Cosmic Nebula background */}
                  <div 
                    className={`relative rounded-2xl overflow-hidden shadow-xl p-6 sm:p-8 min-h-[130px] sm:min-h-[200px] flex flex-col justify-between silver-shimmer transition-all duration-300 ${
                      portalDarkMode 
                        ? 'border border-purple-500/20 bg-gradient-to-br from-[#12082b]/80 via-[#0a021c]/90 to-[#1d0a3a]/80' 
                        : 'border border-white/85 bg-gradient-to-r from-[#eef2ff] via-[#f5f3ff] to-[#fdf3f8]'
                    }`}
                    style={portalDarkMode ? { borderColor: 'var(--theme-card-border)', background: 'linear-gradient(135deg, rgba(18, 10, 36, 0.85), rgba(8, 2, 18, 0.95))' } : undefined}
                  >
                    {/* Flowing Portal Wave aurora ribbon */}
                    <div className="portal-wave" />
                    
                    {/* Cosmos Nebula graphic design using pure CSS gradients & glowing shapes */}
                    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 overflow-hidden pointer-events-none">
                      {/* Glowing background */}
                      <div className="absolute right-[-10%] top-[-20%] w-[120%] h-[140%] rounded-full bg-gradient-to-br from-indigo-200/30 via-purple-200/20 to-transparent blur-[80px]" />
                      
                      {/* Holographic Spinning Interactive Globe SVG */}
                      <div className="absolute right-[-30px] sm:right-[10%] top-1/2 -translate-y-1/2 w-32 h-32 sm:w-56 sm:h-56 opacity-25 sm:opacity-85">
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]" style={{ color: 'var(--theme-accent-color1)' }}>
                          {/* Outer orbital rings */}
                          <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="currentColor" strokeWidth="0.25" strokeDasharray="3 3" className="animate-[spin_16s_linear_infinite]" />
                          <ellipse cx="50" cy="50" rx="40" ry="16" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="0.15" className="animate-[spin_24s_linear_infinite_reverse]" />
                          <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="0.2" />
                          
                          {/* Spinning grid lines inside planet */}
                          <circle cx="50" cy="50" r="28" fill="white" stroke="currentColor" strokeWidth="0.5" className="opacity-90" />
                          <path d="M50 22 A28 28 0 0 0 50 78 Z" fill="none" stroke="currentColor" strokeWidth="0.2" className="animate-[pulse_4s_ease-in-out_infinite]" />
                          <path d="M50 22 A28 20 0 0 0 50 78 Z" fill="none" stroke="currentColor" strokeWidth="0.15" />
                          <path d="M50 22 A28 10 0 0 0 50 78 Z" fill="none" stroke="currentColor" strokeWidth="0.1" />
                          <line x1="22" y1="50" x2="78" y2="50" stroke="currentColor" strokeWidth="0.2" />
                          <line x1="26" y1="36" x2="74" y2="36" stroke="rgba(99,102,241,0.3)" strokeWidth="0.15" />
                          <line x1="26" y1="64" x2="74" y2="64" stroke="rgba(99,102,241,0.3)" strokeWidth="0.15" />
                          
                          {/* Glowing satellite nodes */}
                          <circle cx="26" cy="36" r="1.5" fill="currentColor" className="animate-pulse" />
                          <circle cx="74" cy="64" r="1.5" fill="currentColor" className="animate-pulse" />
                          <circle cx="50" cy="22" r="1.5" fill="currentColor" />
                          <circle cx="50" cy="78" r="1.5" fill="currentColor" />
                        </svg>
                      </div>
                      
                      {/* Floating particles */}
                      <div className="absolute top-[20%] right-[50%] w-1.5 h-1.5 bg-indigo-300 rounded-full opacity-50 animate-ping" />
                      <div className="absolute top-[75%] right-[20%] w-1.5 h-1.5 bg-purple-300 rounded-full opacity-60" />
                    </div>

                    <div className="relative z-10 space-y-1.5 text-left w-full max-w-lg">
                      <div className="text-xs font-bold text-amber-600 tracking-wider flex items-center gap-2">
                        Good morning, Trey 👋
                      </div>
                      <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight leading-none mt-1">
                        Everything you need,<br />all in <span style={{ color: getThemeHex() }}>one</span> place.
                      </h1>

                      {/* Embedded Search bar inside the welcome banner matching the target image */}
                      <div className="relative max-w-md w-full mt-4 sm:mt-5">
                        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Ask NextGenPortal AI anything..."
                          onKeyDown={(e: any) => {
                            if (e.key === 'Enter') {
                              setActiveTab('chat');
                            }
                          }}
                          className="w-full pl-10 pr-12 py-2.5 bg-white/80 border border-slate-200/50 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-semibold shadow-sm"
                        />
                        <button 
                          onClick={() => setActiveTab('chat')}
                          className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] hover:brightness-110 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Pill Action Options directly from reference image */}
                    <div className="relative z-10 flex flex-wrap gap-2 mt-4 sm:mt-6">
                      <button 
                        id="pill-chat-ai"
                        onClick={() => setActiveTab('chat')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebedfa]/80 border border-slate-200/50 text-[10px] font-bold text-slate-700 hover:text-slate-900 hover:bg-white hover:border-purple-300 transition-all shadow-sm group cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
                        Chat with AI
                      </button>
                      <button 
                        id="pill-play-game"
                        onClick={() => setActiveTab('games')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebedfa]/80 border border-slate-200/50 text-[10px] font-bold text-slate-700 hover:text-slate-900 hover:bg-white hover:border-blue-300 transition-all shadow-sm group cursor-pointer"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                        Play a Game
                      </button>
                      <button 
                        id="pill-open-file"
                        onClick={() => setActiveTab('files')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebedfa]/80 border border-slate-200/50 text-[10px] font-bold text-slate-700 hover:text-slate-900 hover:bg-white hover:border-cyan-300 transition-all shadow-sm group cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5 text-cyan-600 group-hover:scale-110 transition-transform" />
                        Open a File
                      </button>
                      <button 
                        id="pill-set-alarm"
                        onClick={() => setActiveTab('alarms')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebedfa]/80 border border-slate-200/50 text-[10px] font-bold text-slate-700 hover:text-slate-900 hover:bg-white hover:border-pink-300 transition-all shadow-sm group cursor-pointer"
                      >
                        <AlarmClock className="w-3.5 h-3.5 text-pink-600 group-hover:scale-110 transition-transform" />
                        Set an Alarm
                      </button>
                    </div>
                  </div>

                  {/* Quick Access Section (Exact Grid layout matching image) */}
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quick Access</h2>
                      <button 
                        onClick={() => alert("Arrange panel configuration grid...")} 
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Customize ⚙
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
                      {filteredQuickAccess.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            id={`quick-access-${item.id}`}
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:bg-white/95 dark:hover:bg-slate-900 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:scale-102 hover:shadow-xl cursor-pointer bg-white/45 dark:bg-slate-950/20"
                          >
                            {/* Rounded glowing square icon exactly like reference image */}
                            <div 
                              className="p-3.5 rounded-xl border mb-2.5 sm:mb-3.5 transition-all duration-300 group-hover:scale-112 text-white"
                              style={{ background: 'var(--theme-btn-gradient)', borderColor: 'var(--theme-card-border)', boxShadow: '0 4px 12px var(--theme-card-border)' }}
                            >
                              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-350 tracking-wide group-hover:text-[var(--theme-accent-color1)] transition-colors">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Activity & Promotional Slide Banner side-by-side section matching target screenshot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* Recent Activity Card with themed glassmorphism */}
                    <div className="glass-panel p-5 rounded-2xl border border-indigo-500/15 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/35 transition-all duration-300 flex flex-col text-left group">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest transition-colors group-hover:text-indigo-600">Recent Activity</h3>
                        <button 
                          onClick={() => setHomeSubTab('activity')}
                          className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          View All
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {activities.slice(0, 5).map((act) => {
                          const getIcon = () => {
                            switch (act.type) {
                              case 'chat': return <Bot className="w-3.5 h-3.5 text-purple-600" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.35))' }} />;
                              case 'games': return <Trophy className="w-3.5 h-3.5 text-blue-600" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.35))' }} />;
                              case 'notes': return <FileText className="w-3.5 h-3.5 text-amber-600" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.35))' }} />;
                              case 'images': return <Image className="w-3.5 h-3.5 text-emerald-600" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.35))' }} />;
                              default: return <Folder className="w-3.5 h-3.5 text-cyan-600" style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.35))' }} />;
                            }
                          };

                          const getThematicClasses = () => {
                            switch (act.type) {
                              case 'chat': return 'border-purple-500/10 bg-purple-500/5 hover:border-purple-500/30 hover:bg-purple-500/10';
                              case 'games': return 'border-blue-500/10 bg-blue-500/5 hover:border-blue-500/30 hover:bg-blue-500/10';
                              case 'notes': return 'border-amber-500/10 bg-amber-500/5 hover:border-amber-500/30 hover:bg-amber-500/10';
                              case 'images': return 'border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/30 hover:bg-emerald-500/10';
                              default: return 'border-cyan-500/10 bg-cyan-500/5 hover:border-cyan-500/30 hover:bg-cyan-500/10';
                            }
                          };

                          return (
                            <div 
                              key={act.id} 
                              onClick={() => {
                                setActiveTab(act.type);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-300 group/item cursor-pointer ${getThematicClasses()}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-white border border-slate-200/35 flex items-center justify-center shadow-sm shrink-0">
                                  {getIcon()}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="text-xs font-bold text-slate-700 transition-colors group-hover/item:text-slate-950">{act.label}</span>
                                  <span className="text-[9px] text-slate-400 font-medium mt-0.5">{act.subtitle}</span>
                                </div>
                              </div>
                              <span className="text-[8px] text-slate-400 font-mono pr-2">{act.time}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explore Slide Banner Card matching target screenshot */}
                    <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 relative overflow-hidden flex flex-col justify-end p-5 min-h-[220px] transition-all duration-300 hover:border-purple-500/35 group shadow-sm hover:shadow-xl text-left">
                      {/* Swirling glowing portal circle behind card content */}
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=350')" }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#120a24]/95 via-[#120a24]/65 to-transparent z-0" />
                      
                      <div className="relative z-10 space-y-2 text-left">
                        <h4 className="text-base sm:text-lg font-extrabold text-white tracking-wider leading-tight">Explore. Create. Achieve.</h4>
                        <p className="text-[10px] text-purple-200/80 leading-relaxed max-w-[240px]">
                          Powered by NextGenPortal AI. Unlock full companion parameters.
                        </p>
                        
                        <button 
                          onClick={() => {
                            setActiveTab('chat');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#8b5cf6] text-white hover:brightness-110 text-[9px] font-bold tracking-widest uppercase transition-all shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer w-max"
                        >
                          <span>Discover More</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity Panel matching exact columns & layout from image */}
              {homeSubTab === 'activity' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Activity</h2>
                  <button 
                    onClick={() => alert("Review historic workspace session analytics logs...")}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="glass-panel rounded-2xl border border-slate-200/40 overflow-hidden divide-y divide-slate-100">
                  {activities.map((act) => {
                    // Match icons
                    const getIcon = () => {
                      switch (act.type) {
                        case 'chat': return <MessageSquare className="w-4 h-4 text-purple-600" />;
                        case 'games': return <Gamepad2 className="w-4 h-4 text-blue-600" />;
                        case 'notes': return <FileText className="w-4 h-4 text-amber-600" />;
                        case 'images': return <Image className="w-4 h-4 text-emerald-600" />;
                        default: return <Folder className="w-4 h-4 text-cyan-600" />;
                      }
                    };

                    return (
                      <div 
                        key={act.id} 
                        className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => {
                          setActiveTab(act.type);
                        }}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/30 flex items-center justify-center shadow-sm">
                            {getIcon()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{act.label}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{act.subtitle}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{act.time}</span>
                          <span className="text-slate-300 select-none">❯</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

                  {/* Bottom Row grid (Today's Plan and Downloads list) exactly like reference image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* TODAY'S PLAN */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Today's Plan</h3>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">
                        {tasks.filter(t=>t.completed).length}/{tasks.length} Completed
                      </span>
                    </div>

                    {/* Task checklist container */}
                    <div className="space-y-3.5">
                      {tasks.map(task => (
                        <div 
                          key={task.id} 
                          onClick={() => toggleTask(task.id)}
                          className="flex items-center justify-between group cursor-pointer py-1 select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              task.completed 
                                ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white' 
                                : 'border-slate-300 group-hover:border-[#8b5cf6]'
                            }`}>
                              {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs font-medium transition-all ${
                              task.completed ? 'text-slate-400 line-through font-normal' : 'text-slate-700'
                            }`}>
                              {task.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{task.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add interactive task form in widget bottom */}
                  <form onSubmit={handleAddTask} className="mt-6 pt-4 border-t border-slate-200/50 flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add homework, test study, workout..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      className="flex-1 bg-slate-100/50 border border-slate-200/50 rounded-md px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all"
                    />
                    <input 
                      type="text"
                      placeholder="9:30 PM"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="w-16 bg-slate-100/50 border border-slate-200/50 rounded-md px-2 py-1.5 text-[10px] text-center font-mono text-slate-600 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all"
                    />
                    <button 
                      type="submit" 
                      className="p-1.5 rounded-md bg-[#8b5cf6] hover:bg-indigo-600 text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* DOWNLOADS MANAGER */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-200/40">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Downloads</h3>
                    <button 
                      onClick={() => {
                        setDownloads(prev => prev.map(d => ({ ...d, progress: 100 })));
                        alert("Synchronized and initialized offline cache.");
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {downloads.map(file => (
                      <div key={file.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700 truncate max-w-[180px]">{file.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                        </div>

                        {/* Progress slider bar matching reference */}
                        <div className="relative">
                          <div className="h-1 bg-slate-100 border border-slate-200/20 rounded-full overflow-hidden">
                            <div 
                              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-blue-400 to-[#8b5cf6]"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 mt-1">
                            <span>Status: {file.progress === 100 ? 'Completed' : 'Syncing payload'}</span>
                            <span>{file.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
                </div>
              )}

              {/* Telemetry and Graphic Panels Grid (Bento style) */}
              {homeSubTab === 'diagnostics' && (
                <div className="space-y-3 text-left pt-2 animate-[fadeIn_0.3s_ease-out]">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    Systems Diagnostics & Telemetry
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Card 1: Corporate Mainframe Rack Layout */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mainframe Core Nodes</span>
                        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100">ONLINE</span>
                      </div>
                      
                      {/* Visual Server Racks SVG */}
                      <div className="bg-slate-100/55 border border-slate-200/50 rounded-xl p-3.5 space-y-2.5 font-mono text-[9px] text-slate-400">
                        {[1, 2, 3].map((rackId) => (
                          <div key={rackId} className="flex items-center justify-between p-1.5 bg-white/85 border border-slate-200/30 rounded shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-slate-600 font-semibold">NODE_{rackId}0_U</span>
                            </div>
                            {/* Simulated led indicators */}
                            <div className="flex items-center gap-1">
                              <span className="w-1 h-2 rounded-sm" style={{ backgroundColor: rackId === 1 ? '#10b981' : '#e2e8f0' }} />
                              <span className="w-1 h-2 rounded-sm" style={{ backgroundColor: rackId === 2 ? '#10b981' : '#e2e8f0' }} />
                              <span className="w-1 h-2 rounded-sm animate-pulse" style={{ backgroundColor: '#06b6d4' }} />
                              <span className="w-1 h-2 rounded-sm" style={{ backgroundColor: rackId === 3 ? '#3b82f6' : '#e2e8f0' }} />
                            </div>
                          </div>
                        ))}
                        <div className="text-[8px] text-slate-400 flex justify-between pt-1 select-none font-bold">
                          <span>PORTAL_UNIT_422</span>
                          <span>TEMP: 38.2°C</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Quantum Telemetry Oscilloscope */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantum Core Frequency</span>
                        <span className="text-[9px] font-mono text-cyan-600 bg-cyan-50 border border-cyan-100 px-1.5 rounded font-bold">4.82 GHz</span>
                      </div>

                      {/* Oscilloscope live curves path */}
                      <div className="bg-slate-100/55 border border-slate-200/50 rounded-xl p-2.5 h-28 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 cyber-grid-dense opacity-10" />
                        <svg viewBox="0 0 100 40" className="w-full h-full text-[#8b5cf6] pointer-events-none">
                          {/* Animated wave path */}
                          <path 
                            d="M0 20 Q15 5, 30 20 T60 20 T90 20 T100 20" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="0.75"
                            className="opacity-80"
                          />
                          <path 
                            d="M0 20 Q10 35, 25 20 T50 20 T75 20 T100 20" 
                            fill="none" 
                            stroke="rgba(0, 0, 0, 0.15)" 
                            strokeWidth="0.5"
                            strokeDasharray="4 4"
                          />
                        </svg>
                        {/* Floating overlay text */}
                        <div className="absolute bottom-2 left-3 text-[8px] font-mono text-slate-400">
                          FREQ_SWEEP: ACTIVE
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Calibration Gauges */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subspace Calibrators</span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">100% OK</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1">
                        {[
                          { label: 'CPU', value: '68%', color: 'border-purple-400 text-[#8b5cf6]' },
                          { label: 'COOLANT', value: '92%', color: 'border-blue-400 text-blue-600' },
                          { label: 'NEURAL', value: '99%', color: 'border-teal-400 text-teal-600' }
                        ].map((gauge, index) => (
                          <div key={index} className="flex flex-col items-center justify-center p-2 bg-white/80 border border-slate-200/30 rounded-xl text-center shadow-sm">
                            <div className={`w-10 h-10 rounded-full border-2 ${gauge.color} flex items-center justify-center text-[10px] font-bold font-mono shadow-sm`}>
                              {gauge.value}
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-2">{gauge.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* AI CHAT FULL-SCREEN SUITE */}
          {activeTab === 'chat' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-5 h-[calc(100vh-140px)] flex flex-col justify-between text-left">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-405" />
                    NextGen Chat Sandbox
                  </h2>
                  <p className="text-[10px] text-slate-500">Live Workspace proxy to Gemini 3.5-flash LLM model</p>
                </div>
                <button 
                  onClick={() => setAiHistory([{ role: 'model', content: 'Sandbox conversation memory wiped. Ready to optimize.' }])}
                  className="px-2.5 py-1 rounded bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 text-[10px] transition-colors"
                >
                  Clear History
                </button>
              </div>

              {/* Chat timeline message frame */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {aiHistory.map((h, i) => (
                  <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs ${
                      h.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-slate-50 border border-slate-200/50 text-slate-755 rounded-bl-none'
                    }`}>
                      <div className="font-bold text-[9px] text-slate-400 uppercase tracking-widest mb-1 select-none">
                        {h.role === 'user' ? 'Operator Trey' : 'NextGen AI Core'}
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{h.content}</p>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-xl px-4 py-3 bg-slate-50 border border-slate-200/50 text-slate-500 text-xs flex items-center gap-3">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>NextGen AI matrix synthesizing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Suggestions quick clicks */}
              <div className="flex flex-wrap gap-2 py-3 border-t border-slate-200/30 mt-4">
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Explain quantum physics")}
                  className="px-2.5 py-1 rounded bg-slate-55 border border-slate-200/50 text-[9px] text-slate-500 hover:text-slate-800 hover:border-purple-500/40 cursor-pointer"
                >
                  Explain quantum physics
                </button>
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Write Python code")}
                  className="px-2.5 py-1 rounded bg-slate-55 border border-slate-200/50 text-[9px] text-slate-500 hover:text-slate-800 hover:border-purple-500/40 cursor-pointer"
                >
                  Write Python code
                </button>
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Summarize this document")}
                  className="px-2.5 py-1 rounded bg-slate-55 border border-slate-200/50 text-[9px] text-slate-500 hover:text-slate-800 hover:border-purple-500/40 cursor-pointer"
                >
                  Summarize document
                </button>
              </div>

              {/* Chat Input form and local AI state warnings */}
              <div className="space-y-3">
                {localAIStatus !== 'ready' && (
                  <div className="p-3 bg-slate-50 border border-purple-500/10 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-purple-400">Offline AI Companion status: {localAIStatus.replace('_', ' ').toUpperCase()}</span>
                      <p className="text-[10px] text-slate-500">
                        {localAIStatus === 'not_installed' && 'The 1.5B Qwen model is not downloaded. Run completely offline (~3GB download).'}
                        {localAIStatus === 'downloading' && 'Downloading files from Hugging Face hub (port 5001 Proxy)...'}
                        {localAIStatus === 'installed' && 'Weights cached. Engine is currently offline.'}
                        {localAIStatus === 'loading' && 'Warming up weights into system memory...'}
                        {localAIStatus === 'error' && `Engine failure: ${localAIEngineError || 'Check details in settings.'}`}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {localAIStatus === 'not_installed' && (
                        <button 
                          onClick={() => triggerLocalAIAction('download')}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Download AI
                        </button>
                      )}
                      {localAIStatus === 'installed' && (
                        <button 
                          onClick={() => triggerLocalAIAction('start')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Start Offline AI
                        </button>
                      )}
                      {localAIStatus === 'error' && (
                        <button 
                          onClick={() => triggerLocalAIAction('download')}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Retry Download
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={(e) => handleSendChatMessage(e)} className="flex gap-2">
                  <input 
                    type="text"
                    placeholder={localAIStatus === 'ready' ? "Ask the offline Companion anything..." : "Ask online Gemini proxy..."}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                  />
                  <button 
                    type="submit"
                    disabled={isAiLoading || !aiInput.trim()}
                    className="px-4 py-2 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer active:scale-95 hover:shadow-[0_0_20px_var(--theme-card-border)]"
                    style={{
                      background: 'var(--theme-btn-gradient)',
                      boxShadow: '0 0 12px var(--theme-card-border)',
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
 
          {/* GAMES INTERACTIVE VIEW */}
          {activeTab === 'games' && (
            <div className="space-y-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                    Portal Arcade Chamber
                  </h2>
                  <p className="text-xs text-slate-500">Multiplayer party games, tabletop codex, and canvas arcade play</p>
                </div>
                <button 
                  onClick={() => setActiveTab('home')}
                  className="px-3 py-1 bg-slate-950 border border-white/5 text-[10px] text-slate-400 hover:text-white rounded-md cursor-pointer transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
 
              {/* Game selection toggle */}
              <div className="flex bg-slate-950 p-1.5 rounded-xl border border-white/5 max-w-xs select-none">
                <button 
                  onClick={() => { haptic(10); setSelectedGameSuite('arcade'); }}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer text-center uppercase tracking-wider ${selectedGameSuite === 'arcade' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  style={selectedGameSuite === 'arcade' ? {
                    background: 'var(--theme-btn-gradient)',
                    boxShadow: '0 0 10px var(--theme-card-border)',
                  } : undefined}
                >
                  🕹️ Cabin Arcade
                </button>
                <button 
                  onClick={() => { haptic(10); setSelectedGameSuite('drift'); }}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer text-center uppercase tracking-wider ${selectedGameSuite === 'drift' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  style={selectedGameSuite === 'drift' ? {
                    background: 'var(--theme-btn-gradient)',
                    boxShadow: '0 0 10px var(--theme-card-border)',
                  } : undefined}
                >
                  🏎️ Neon Drift
                </button>
              </div>

              {/* Game Suite Render */}
              <div className="max-w-5xl mx-auto">
                {selectedGameSuite === 'arcade' ? (
                  <TenGamesArena currentUser={currentUser || 'Traveler'} />
                ) : (
                  <NeonDriftGame themeColor={themeColor} />
                )}
              </div>
            </div>
          )}

          {/* DECENTRALIZED FILES MANAGER */}
          {activeTab === 'files' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Folder className="w-4 h-4 text-cyan-400" />
                  Secure Distributed Payload Storage
                </h2>
                <p className="text-[10px] text-slate-500">Decentralized backup nodes on secure local IndexedDB sandbox</p>
              </div>

              {/* On-Device Security Notice */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-350 rounded-xl p-3.5 text-[10.5px] flex items-start gap-2.5 leading-relaxed">
                <span className="text-sm shrink-0">🛡️</span>
                <div>
                  <strong className="font-bold">On-Device Local Sandbox Active</strong>
                  <p className="text-[9.5px] opacity-85 mt-0.5">
                    All file uploads are stored client-side in the browser's local sandbox (IndexedDB database). Absolutely zero data is sent to external servers, ensuring complete privacy and offline security.
                  </p>
                </div>
              </div>

              {/* Upload area */}
              <div 
                onClick={() => document.getElementById('secure-file-picker')?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-cyan-500/40 rounded-xl p-8 text-center hover:bg-slate-50/50 transition-all cursor-pointer group"
              >
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-full max-w-max mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5 text-cyan-400 animate-bounce" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Click or Drop payloads here to upload securely</span>
                <p className="text-[10px] text-slate-500 mt-1">Files are fully encrypted & stored client-side only (Max 50MB).</p>
              </div>
              <input 
                type="file" 
                id="secure-file-picker" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleSecureUpload(file);
                  }
                }} 
              />

              {/* File list */}
              <div className="space-y-2 pt-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Active Workspace Directory</span>
                {payloadFiles.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200/50 rounded-xl bg-slate-50/20">
                    <p className="text-xs text-slate-400 italic">No custom payloads stored yet. Drop or select a file above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {payloadFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <Folder className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">{file.name}</span>
                            <span className="text-[9px] text-slate-500">{file.size} • {file.uploadedAt}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a 
                            href={file.data}
                            download={file.name}
                            onClick={() => haptic(5)}
                            className="p-1 text-slate-500 hover:text-cyan-600 transition-colors"
                            title="Download payload"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button 
                            onClick={() => handleSecureDelete(file.id, file.name)}
                            className="p-1 text-slate-500 hover:text-rose-600 transition-colors"
                            title="Purge securely"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IMAGES MEDIA SUITE */}
          {activeTab === 'images' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Image className="w-4 h-4 text-emerald-400" />
                    Media Engine Canvas
                  </h2>
                  <p className="text-[10px] text-slate-500">Live image processing and secure local sandbox</p>
                </div>
                <button
                  onClick={() => document.getElementById('secure-image-picker')?.click()}
                  className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer font-sans"
                >
                  Upload Local Image
                </button>
                <input 
                  type="file" 
                  id="secure-image-picker" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleSecureUpload(file);
                    }
                  }} 
                />
              </div>

              {/* On-Device Security Notice */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-350 rounded-xl p-3.5 text-[10.5px] flex items-start gap-2.5 leading-relaxed">
                <span className="text-sm shrink-0">🛡️</span>
                <div>
                  <strong className="font-bold">On-Device Local Sandbox Active</strong>
                  <p className="text-[9.5px] opacity-85 mt-0.5">
                    All images and assets uploaded here are stored client-side in the browser's local sandbox (IndexedDB database). Absolutely zero data is sent to external servers, ensuring your media remains completely private.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Generation form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Describe generation prompt</label>
                    <textarea 
                      placeholder="e.g., Highly detailed futuristic workspace portal inside cosmic orbital station, cyberpunk, cinematic..."
                      className="w-full bg-slate-100 border border-slate-200/50 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 h-28"
                    />
                  </div>
                  <button 
                    onClick={() => alert("Image prompt pipeline starting. Live Generation sandbox expects configured API Key.")}
                    className="w-full py-2 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 hover:shadow-[0_0_24px_var(--theme-card-border)]"
                    style={{
                      background: 'var(--theme-btn-gradient)',
                      boxShadow: '0 0 16px var(--theme-card-border)',
                    }}
                  >
                    Synthesize Media Render
                  </button>
                </div>

                {/* Simulated gallery thumbnails matching reference items */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Generated & Uploaded Renders</span>
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {[
                      { id: 'mock1', name: 'Island Concept Art', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256', isUploaded: false },
                      { id: 'mock2', name: 'Orbit Station V1', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=256', isUploaded: false },
                      ...payloadFiles.filter(f => f.type && f.type.startsWith('image/')).map(f => ({ id: f.id, name: f.name, url: f.data, isUploaded: true }))
                    ].map((img) => (
                      <div 
                        key={img.id} 
                        onClick={() => { haptic(5); setPreviewImage(img); }}
                        className="group relative rounded-lg overflow-hidden border border-slate-200/50 aspect-video bg-slate-50 cursor-zoom-in font-sans"
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <span className="text-[10px] font-bold text-white bg-slate-950/80 px-2.5 py-1 rounded border border-white/10 truncate max-w-[90%]">{img.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UTILITIES TAB */}
          {activeTab === 'utilities' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-4 mb-4 select-none">
                {/* ORGANIZER GROUP */}
                <div className="flex items-center bg-slate-100 dark:bg-[#150f2e]/60 rounded-xl border border-slate-200 dark:border-[#44387a]/45 p-0.5 w-full xl:w-auto overflow-x-auto">
                  <span className="text-[9px] font-extrabold text-[#ff7597] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Organizer</span>
                  <div className="flex items-center gap-0.5">
                    <button 
                      onClick={() => { haptic(5); setUtilityTab('notes'); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${utilityTab === 'notes' ? 'bg-[#ff7597]/20 border border-[#ff7597]/40 text-[#ff7597]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Notes
                    </button>
                    <button 
                      onClick={() => { haptic(5); setUtilityTab('calendar'); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${utilityTab === 'calendar' ? 'bg-[#ff7597]/20 border border-[#ff7597]/40 text-[#ff7597]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Calendar
                    </button>
                    <button 
                      onClick={() => { haptic(5); setUtilityTab('tasks'); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${utilityTab === 'tasks' ? 'bg-[#ff7597]/20 border border-[#ff7597]/40 text-[#ff7597]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Tasks
                    </button>
                  </div>
                </div>

                {/* TOOLS GROUP */}
                <div className="flex items-center bg-slate-100 dark:bg-[#150f2e]/60 rounded-xl border border-slate-200 dark:border-[#44387a]/45 p-0.5 w-full xl:w-auto overflow-x-auto">
                  <span className="text-[9px] font-extrabold text-[#3fd9c7] tracking-wider uppercase pl-2.5 pr-1.5 py-1">Tools</span>
                  <div className="flex items-center gap-0.5">
                    <button 
                      onClick={() => { haptic(5); setUtilityTab('dice'); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${utilityTab === 'dice' ? 'bg-[#3fd9c7]/20 border border-[#3fd9c7]/40 text-[#3fd9c7]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Dice
                    </button>
                    <button 
                      onClick={() => { haptic(5); setUtilityTab('sheet'); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${utilityTab === 'sheet' ? 'bg-[#3fd9c7]/20 border border-[#3fd9c7]/40 text-[#3fd9c7]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Codex
                    </button>
                    <button 
                      onClick={() => { haptic(5); setUtilityTab('calc'); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${utilityTab === 'calc' ? 'bg-[#3fd9c7]/20 border border-[#3fd9c7]/40 text-[#3fd9c7]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Calc
                    </button>
                    <button 
                      onClick={() => { haptic(5); setUtilityTab('timer'); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${utilityTab === 'timer' ? 'bg-[#3fd9c7]/20 border border-[#3fd9c7]/40 text-[#3fd9c7]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Timer
                    </button>
                  </div>
                </div>
              </div>

              {/* UTILITY MODULE RENDER */}
              {utilityTab === 'dice' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* Left Column: Canvas Field */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200/50 relative aspect-video flex flex-col">
                      <div className="absolute top-3 left-3 bg-[#0d071c]/90 border border-purple-500/25 px-2.5 py-1 rounded-lg z-10 flex items-center gap-1.5 font-mono text-[9px] font-bold text-[#b4aae2] shadow-md">
                        <Dices className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
                        <span>Interactive Rolling Field</span>
                      </div>
                      <DiceTrayCanvas themeColor={themeColor} />
                    </div>
                  </div>

                  {/* Right Column: Dice Panel controls and roll logs */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Combat Turn Tracker</span>
                      <div className="flex justify-between items-center bg-slate-100 border border-slate-200/60 p-2.5 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-purple-400 uppercase font-mono font-bold">Current Round</span>
                          <span className="text-xl font-black text-slate-700">{combatRound}</span>
                        </div>
                        <button 
                          onClick={handleEndTurn}
                          className="px-3 py-1.5 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 hover:shadow-[0_0_15px_var(--theme-card-border)]"
                          style={{
                            background: 'var(--theme-btn-gradient)',
                            boxShadow: '0 0 10px var(--theme-card-border)',
                          }}
                        >
                          Next Turn &gt;
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-0.5">
                        {combatants.map((c, i) => (
                          <div 
                            key={i} 
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${i === activeCombatantIndex ? 'bg-purple-950/30 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.15)]' : 'bg-transparent border-slate-200/50'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: c.color }}></span>
                              <div className="flex flex-col">
                                <span className={`text-[10px] font-bold ${i === activeCombatantIndex ? 'text-slate-900' : 'text-slate-600'}`}>{c.name}</span>
                                <span className="text-[8px] text-slate-500 font-mono">{c.class}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleHpChange(i, -1)} className="w-5 h-5 bg-slate-100 border border-slate-200/50 hover:bg-rose-100 hover:text-rose-600 text-slate-700 rounded flex items-center justify-center text-[10px] cursor-pointer font-bold">-</button>
                              <span className="text-xs font-mono font-black text-slate-800 px-1">{c.hp} / {c.maxHp}</span>
                              <button onClick={() => handleHpChange(i, 1)} className="w-5 h-5 bg-slate-100 border border-slate-200/50 hover:bg-emerald-100 hover:text-emerald-600 text-slate-700 rounded flex items-center justify-center text-[10px] cursor-pointer font-bold">+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Consult Alchemical Oracle</span>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Should we enter the crypt?"
                          value={oracleQuery}
                          onChange={(e) => setOracleQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleOracleConsult()}
                          className="flex-1 bg-slate-100 border border-slate-200/50 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500/60"
                        />
                        <button 
                          onClick={handleOracleConsult}
                          disabled={oracleLoading}
                          className="px-3 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer active:scale-95 hover:shadow-[0_0_15px_var(--theme-card-border)]"
                          style={{
                            background: 'var(--theme-btn-gradient)',
                            boxShadow: '0 0 10px var(--theme-card-border)',
                          }}
                        >
                          {oracleLoading ? '...' : 'Consult'}
                        </button>
                      </div>
                      {oracleAnswer && (
                        <div className="p-2.5 bg-purple-500/5 border border-purple-500/20 text-slate-800 text-[10px] font-semibold font-mono rounded-lg leading-relaxed whitespace-pre-line">
                          {oracleAnswer}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {utilityTab === 'sheet' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* Identity Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-950 border border-white/5 rounded-xl">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Traveler Name</label>
                      <input 
                        type="text" 
                        value={charSheet['ch-name'] || ''} 
                        onChange={(e) => updateSheetField('ch-name', e.target.value)}
                        className="bg-slate-950 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-lg p-2 text-xs text-slate-100 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Class & Level</label>
                      <input 
                        type="text" 
                        value={charSheet['ch-class'] || ''} 
                        onChange={(e) => updateSheetField('ch-class', e.target.value)}
                        className="bg-slate-950 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-lg p-2 text-xs text-slate-100 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Species</label>
                      <input 
                        type="text" 
                        value={charSheet['ch-species'] || ''} 
                        onChange={(e) => updateSheetField('ch-species', e.target.value)}
                        className="bg-slate-950 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-lg p-2 text-xs text-slate-100 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Background</label>
                      <input 
                        type="text" 
                        value={charSheet['ch-background'] || ''} 
                        onChange={(e) => updateSheetField('ch-background', e.target.value)}
                        className="bg-slate-950 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-lg p-2 text-xs text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  {/* Attributes Grid and Core Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Ability Scores */}
                    <div className="lg:col-span-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'st-str', label: 'Strength', stat: 'str' },
                        { id: 'st-dex', label: 'Dexterity', stat: 'dex' },
                        { id: 'st-con', label: 'Constitution', stat: 'con' },
                        { id: 'st-int', label: 'Intelligence', stat: 'int' },
                        { id: 'st-wis', label: 'Wisdom', stat: 'wis' },
                        { id: 'st-cha', label: 'Charisma', stat: 'cha' }
                      ].map((s) => (
                        <div key={s.id} className="p-3 bg-slate-950 border border-white/5 rounded-xl flex flex-col items-center gap-1.5 relative overflow-hidden">
                          <span className="text-[9px] uppercase text-slate-500 font-bold">{s.label}</span>
                          <input 
                            type="number" 
                            value={charSheet[s.id] || '10'} 
                            onChange={(e) => updateSheetField(s.id, e.target.value)}
                            className="bg-transparent border-none text-center text-xl font-black text-slate-100 w-16 focus:ring-0 outline-none p-0"
                          />
                          <div className="text-xs font-mono font-bold bg-purple-600/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md mt-0.5">
                            {getModStr(s.id)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Middle Column: Core Combat Stats */}
                    <div className="lg:col-span-1 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950 border border-white/5 rounded-xl flex flex-col justify-between">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Armor Class (AC)</span>
                        <input 
                          type="number" 
                          value={charSheet['ch-ac'] || '10'} 
                          onChange={(e) => updateSheetField('ch-ac', e.target.value)}
                          className="bg-transparent border-none text-left text-3xl font-black text-slate-100 focus:ring-0 outline-none p-0 mt-2"
                        />
                      </div>
                      <div className="p-4 bg-slate-950 border border-white/5 rounded-xl flex flex-col justify-between">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Speed (Feet)</span>
                        <input 
                          type="number" 
                          value={charSheet['ch-speed'] || '30'} 
                          onChange={(e) => updateSheetField('ch-speed', e.target.value)}
                          className="bg-transparent border-none text-left text-3xl font-black text-slate-100 focus:ring-0 outline-none p-0 mt-2"
                        />
                      </div>
                      <div className="p-4 bg-slate-950 border border-white/5 rounded-xl flex flex-col justify-between col-span-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Hit Points (HP)</span>
                          <span className="text-[8px] text-slate-400 font-mono">Current / Max</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="number" 
                            value={charSheet['ch-hpcur'] || '10'} 
                            onChange={(e) => updateSheetField('ch-hpcur', e.target.value)}
                            className="bg-transparent border-none text-left text-3xl font-black text-slate-100 w-20 focus:ring-0 outline-none p-0"
                          />
                          <span className="text-xl text-slate-600 font-bold">/</span>
                          <input 
                            type="number" 
                            value={charSheet['ch-hpmax'] || '10'} 
                            onChange={(e) => updateSheetField('ch-hpmax', e.target.value)}
                            className="bg-transparent border-none text-left text-3xl font-black text-slate-300 w-20 focus:ring-0 outline-none p-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Equipment and Sheet Management */}
                    <div className="lg:col-span-1 space-y-4 flex flex-col">
                      <div className="flex-1 p-4 bg-slate-950 border border-white/5 rounded-xl flex flex-col">
                        <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-2">Equipped Gear & Loadout</label>
                        <textarea 
                          value={charSheet['ch-equip'] || ''} 
                          onChange={(e) => updateSheetField('ch-equip', e.target.value)}
                          placeholder="Spellbook, Wand of Magic Missile, explorer package..."
                          className="flex-1 bg-slate-950/40 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500/50 resize-none h-28"
                        />
                      </div>

                      <div className="flex gap-2.5">
                        <button 
                          onClick={() => {
                            haptic(10);
                            const blob = new Blob([JSON.stringify(charSheet, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${charSheet['ch-name'] || 'character'}-sheet.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast('Sheet exported as JSON payload.');
                          }}
                          className="flex-1 py-2 bg-slate-950 border border-white/5 hover:border-purple-500/40 text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
                        >
                          Export Sheet
                        </button>
                        <button 
                          onClick={() => {
                            haptic(10);
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json';
                            input.onchange = (e: any) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                  try {
                                    const parsed = JSON.parse(reader.result as string);
                                    store.set('char_sheet', parsed);
                                    setCharSheet(parsed);
                                    toast('Traveler sheet successfully enscribed from file!');
                                  } catch (err) {
                                    toast('Interference detected. Failed to read sheet.', 'error');
                                  }
                              };
                              reader.readAsText(file);
                            };
                            input.click();
                          }}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
                        >
                          Import Sheet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {utilityTab === 'notes' && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Note list column */}
                    <div className="col-span-1 border-r border-slate-200/50 dark:border-white/5 pr-4 space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Catalog</span>
                      {[
                        { title: 'Workout Plan', time: '1h ago' },
                        { title: 'Weekly Core Standup notes', time: '1d ago' },
                        { title: 'Hardware requirements', time: '4d ago' }
                      ].map((note, idx) => (
                        <button key={idx} className="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 hover:border-amber-500/40 transition-all">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{note.title}</div>
                          <div className="text-[8px] text-slate-500 mt-0.5">{note.time}</div>
                        </button>
                      ))}
                    </div>

                    {/* Working Area */}
                    <div className="col-span-2 space-y-4">
                      <input 
                        type="text" 
                        defaultValue="Workout Plan"
                        className="w-full bg-transparent text-slate-800 dark:text-slate-100 font-bold text-sm focus:outline-none border-b border-slate-200 dark:border-white/5 pb-2"
                      />
                      <textarea 
                        defaultValue={`# Workout Plan\n- 15m warm-up stretch\n- Core routine cycle\n- Weighted dynamic squats (3 sets x 12 reps)\n- Treadmill sprint (Intervals: 20 mins)`}
                        className="w-full bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-lg p-3 text-xs text-slate-800 dark:text-slate-200 h-48 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => alert("Payload compiled and stored to local matrix storage.")}
                          className="px-4 py-1.5 rounded text-white text-xs font-bold transition-all duration-300 cursor-pointer active:scale-95 hover:shadow-[0_0_20px_var(--theme-card-border)]"
                          style={{
                            background: 'var(--theme-btn-gradient)',
                            boxShadow: '0 0 12px var(--theme-card-border)',
                          }}
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {utilityTab === 'calendar' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Month view (Simulation)</span>
                      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                          <span key={d} className="text-slate-500 font-bold py-1">{d}</span>
                        ))}
                        {Array.from({ length: 30 }).map((_, idx) => {
                          const dayVal = idx + 1;
                          const dateStr = `2026-07-${String(dayVal).padStart(2, '0')}`;
                          const isSelected = calendarSelectedDate === dateStr;
                          const hasEvents = calEvents[dateStr] && calEvents[dateStr].length > 0;
                          return (
                            <button
                              key={idx}
                              onClick={() => { haptic(5); setCalendarSelectedDate(dateStr); }}
                              className={`p-2.5 rounded-lg border font-bold transition-all relative cursor-pointer ${
                                isSelected ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md' :
                                'bg-slate-950 border-white/5 text-slate-300 hover:border-white/20'
                              }`}
                            >
                              <span>{dayVal}</span>
                              {hasEvents && !isSelected && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-white/5 rounded-xl space-y-4">
                      <div className="border-b border-white/5 pb-2 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                        Timeline ledger • {calendarSelectedDate}
                      </div>

                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-0.5">
                        {(calEvents[calendarSelectedDate] || []).length === 0 ? (
                          <div className="text-[10px] text-slate-500 italic py-4">No events scheduled.</div>
                        ) : (
                          calEvents[calendarSelectedDate].map((ev, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-900 border border-white/5 p-2 rounded-lg text-xs text-slate-200">
                              <span>{ev}</span>
                              <button 
                                onClick={() => {
                                  haptic(8);
                                  setCalEvents(prev => {
                                    const next = { ...prev };
                                    next[calendarSelectedDate] = next[calendarSelectedDate].filter((_, idx) => idx !== i);
                                    store.set('cal_events', next);
                                    return next;
                                  });
                                  toast('Event cleared.');
                                }}
                                className="text-slate-500 hover:text-red-400 font-bold px-1.5"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <input 
                          type="text" 
                          placeholder="Event description..."
                          value={calendarEventText}
                          onChange={(e) => setCalendarEventText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && calendarEventText.trim()) {
                              haptic(10);
                              setCalEvents(prev => {
                                const next = { ...prev };
                                if (!next[calendarSelectedDate]) next[calendarSelectedDate] = [];
                                next[calendarSelectedDate].push(calendarEventText.trim());
                                store.set('cal_events', next);
                                return next;
                              });
                              setCalendarEventText('');
                              toast('Campaign checkin registered.');
                            }
                          }}
                          className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                        />
                        <button 
                          onClick={() => {
                            if (!calendarEventText.trim()) return;
                            haptic(10);
                            setCalEvents(prev => {
                              const next = { ...prev };
                              if (!next[calendarSelectedDate]) next[calendarSelectedDate] = [];
                              next[calendarSelectedDate].push(calendarEventText.trim());
                              store.set('cal_events', next);
                              return next;
                            });
                            setCalendarEventText('');
                            toast('Campaign checkin registered.');
                          }}
                          className="px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {utilityTab === 'tasks' && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out] max-w-2xl mx-auto">
                  <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alchemical Tasks Tracker</h3>
                      <span className="text-[10px] text-purple-400 font-mono font-semibold">
                        {tasks.filter(t=>t.completed).length}/{tasks.length} Completed
                      </span>
                    </div>

                    {/* Task checklist container */}
                    <div className="space-y-3.5">
                      {tasks.map(task => (
                        <div 
                          key={task.id} 
                          onClick={() => toggleTask(task.id)}
                          className="flex items-center justify-between group cursor-pointer py-1 select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              task.completed 
                                ? 'bg-purple-600 border-purple-600 text-white' 
                                : 'border-slate-700 group-hover:border-purple-500'
                            }`}>
                              {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs font-medium transition-all ${
                              task.completed ? 'text-slate-500 line-through font-normal' : 'text-slate-200'
                            }`}>
                              {task.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{task.time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Add interactive task form */}
                    <form onSubmit={handleAddTask} className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                      <input 
                        type="text"
                        placeholder="Add homework, test study, workout..."
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        className="flex-grow bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60"
                      />
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        + Add Task
                      </button>
                    </form>
                  </div>
                </div>
              )}


              {utilityTab === 'calc' && (
                <div className="flex flex-col md:flex-row gap-6 w-full animate-[fadeIn_0.3s_ease-out]">
              
              {/* Left sidebar info column */}
              <div className="md:w-1/3 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400 animate-pulse" />
                    TI-84 Plus CE OS
                  </h2>
                  <p className="text-[10px] text-slate-500">Dual algebraic engine with ROM loader</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-3 font-mono text-[9px] text-slate-500">
                  <div className="border-b border-slate-200/50 pb-2 text-[10px] font-bold text-[#3fd9c7] uppercase">Interactive Shortcuts</div>
                  <div className="flex justify-between">
                    <span>LAUNCH GAME:</span>
                    <span className="text-[#cf4fe6]">PRGM Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MODE ADJUST:</span>
                    <span className="text-slate-300">MODE Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FUNCTION GRID:</span>
                    <span className="text-slate-300">Y= Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CARTESIAN PLOT:</span>
                    <span className="text-slate-300">GRAPH Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SPREADSHEET:</span>
                    <span className="text-[#3fd9c7]">TABLE Key</span>
                  </div>
                </div>
              </div>

              {/* Right column: Interactive Calculator body */}
              <div className="flex-1 flex justify-center">
                <div className="max-w-[420px] w-full p-4 bg-[#0a051c] border-2 border-purple-500/25 rounded-3xl shadow-2xl relative">
                  
                  {/* Outer border neon flare */}
                  <div className="absolute inset-0 rounded-3xl border border-[#cf4fe6]/20 pointer-events-none" />

                  {/* Calculator LCD Screen Frame */}
                  <div className="p-3 bg-[#0d0722] rounded-2xl border border-purple-500/20 shadow-inner relative overflow-hidden">
                    
                    {/* Retro CRT Grid scanline simulation */}
                    <div className="absolute inset-0 bg-[#0d0722]/40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_3px,3px_100%] pointer-events-none" />
                    
                    {/* Status Bar Header */}
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-[#3fd9c7] border-b border-purple-500/10 pb-1.5 mb-2 relative z-10">
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-[#10092b] border border-purple-500/25 px-1.5 py-0.5 rounded text-[#b4aae2] text-[8px] uppercase">{angleMode}</span>
                        <span className="text-[#3fd9c7]/80">FUNC</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {is2nd && <span className="bg-amber-500 text-slate-950 px-1.5 rounded text-[8px] font-extrabold animate-pulse">2ND</span>}
                        {isAlpha && <span className="bg-emerald-500 text-slate-950 px-1.5 rounded text-[8px] font-extrabold animate-pulse">ALPHA</span>}
                        <span className="text-[#b4aae2]/50">4:20 PM</span>
                        <div className="w-4.5 h-2.5 border border-[#3fd9c7]/50 rounded-sm p-[1.5px] flex items-center bg-[#070414]/80">
                          <div className="h-full bg-gradient-to-r from-[#3fd9c7] to-emerald-400 w-full rounded-2xs"></div>
                        </div>
                      </div>
                    </div>

                    {/* LCD Screen Display Box */}
                    <div ref={lcdScreenRef} className="h-44 p-2.5 font-mono text-xs overflow-y-auto rounded-lg flex flex-col relative select-none border border-[#3fd9c7]/10 z-10 bg-[#0d0722]">
                      
                      {!mathLoaded ? (
                        <div className="flex-grow flex flex-col items-center justify-center font-mono p-2">
                          <div className="text-center space-y-2.5">
                            <div className="text-[9px] font-black tracking-widest animate-pulse text-[#3fd9c7]">TEXAS INSTRUMENTS</div>
                            <div className="text-sm font-black tracking-tight text-white">TI-84 Plus CE</div>
                            <div className="text-[8px] mt-1 font-bold text-[#b4aae2]/80">BOOTING COSMIC OS v6.2...</div>
                            <div className="w-24 h-2.5 border border-purple-500/40 rounded-sm p-[1px] mt-2.5 mx-auto">
                              <div className="h-full bg-gradient-to-r from-[#3fd9c7] to-[#cf4fe6] animate-[loading-bar_1.5s_infinite] rounded-[1px]" style={{ width: '70%' }}></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {errorMessage && (
                            <div className="absolute inset-0 bg-[#0f0a28]/95 z-50 p-3.5 flex flex-col justify-between rounded-lg shadow-lg text-[#faebd7] border border-[#cf4fe6]/60">
                              <div>
                                <h4 className="font-extrabold text-[#cf4fe6] tracking-widest border-b border-[#cf4fe6]/20 pb-1 mb-2 text-[10px] uppercase">Rift Error</h4>
                                <p className="text-[10px] font-bold leading-relaxed whitespace-pre-line text-rose-300">{errorMessage}</p>
                              </div>
                              <button 
                                onClick={() => setErrorMessage(null)} 
                                className="w-full bg-purple-900/60 hover:bg-purple-800/80 text-white font-extrabold text-[9px] py-1.5 rounded-lg border border-purple-500/30 transition-colors cursor-pointer"
                              >
                                1: CLEAR ERROR
                              </button>
                            </div>
                          )}

                          {currentScreen === 'HOME' && (
                            <div className="flex-grow flex flex-col justify-end">
                              <div className="overflow-y-auto space-y-1.5 max-h-28 flex-grow pr-0.5">
                                {history.map((h, i) => (
                                  <div key={i} className="text-[10px]">
                                    <div className="text-left text-[#b4aae2]/85">{h.input}</div>
                                    <div className="text-right font-black text-[#3fd9c7]">{h.output}</div>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t border-purple-500/10 pt-1 mt-1 flex items-center">
                                <span className="text-[#3fd9c7] mr-1.5 font-bold">&gt;</span>
                                <span className="relative inline-block break-all max-w-full font-bold text-white">
                                  {inputVal.slice(0, cursorIndex)}
                                  <span className="bg-[#3fd9c7] text-[#020008] inline-block w-1.5 h-3 text-center animate-pulse">
                                    {inputVal[cursorIndex] || ' '}
                                  </span>
                                  {inputVal.slice(cursorIndex + 1)}
                                </span>
                              </div>
                            </div>
                          )}

                          {currentScreen === 'Y_EDIT' && (
                            <div className="flex-grow flex flex-col">
                              <div className="border-b border-purple-500/20 pb-1 mb-1.5 flex justify-between font-black text-[9px] tracking-wider text-purple-300">
                                <span>Y= EDITOR</span>
                                <span className="text-[#3fd9c7]">PLOT 1 2 3</span>
                              </div>
                              <div className="space-y-1 flex-grow">
                                {['Y1', 'Y2', 'Y3', 'Y4'].map((eqKey) => (
                                  <div 
                                    key={eqKey} 
                                    onClick={() => setActiveEqIndex(eqKey)}
                                    className={`p-1 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${activeEqIndex === eqKey ? 'bg-purple-950/40 border-purple-500/40' : 'border-transparent'}`}
                                  >
                                    <span className="font-bold text-[9px] text-[#b4aae2]">{`\\${eqKey} =`}</span>
                                    <span className="flex-grow ml-2 font-bold font-mono text-white truncate max-w-[170px]">
                                      {equations[eqKey] || <span className="text-[#b4aae2]/20 italic text-[8px]">empty</span>}
                                    </span>
                                    {activeEqIndex === eqKey && <span className="w-1.5 h-1.5 bg-[#3fd9c7] rounded-full animate-pulse"></span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentScreen === 'WINDOW' && (
                            <div className="flex-grow flex flex-col">
                              <div className="border-b border-purple-500/20 pb-1 mb-1.5 font-black text-[9px] tracking-wider text-purple-300">WINDOW CONFIG</div>
                              <div className="grid grid-cols-2 gap-1.5 flex-grow overflow-y-auto pt-0.5">
                                {Object.keys(windowSettings).map((settingKey) => (
                                  <div 
                                    key={settingKey} 
                                    onClick={() => setActiveWindowIndex(settingKey)}
                                    className={`p-1.5 rounded-lg border ${activeWindowIndex === settingKey ? 'bg-purple-950/40 border-purple-500/40' : 'border-transparent'}`}
                                  >
                                    <div className="text-[8px] font-extrabold uppercase text-[#b4aae2]">{settingKey}</div>
                                    <input 
                                      type="number" 
                                      value={windowSettings[settingKey]} 
                                      onChange={(e) => setWindowSettings({ ...windowSettings, [settingKey]: parseFloat(e.target.value) || 0 })}
                                      className="w-full bg-transparent font-bold font-mono text-white border-none outline-none focus:ring-0 p-0 text-[10px]"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentScreen === 'TBLSET' && (
                            <div className="flex-grow flex flex-col justify-between">
                              <div>
                                <div className="border-b border-purple-500/20 pb-1 mb-2 font-black text-[9px] tracking-wider text-purple-300">TABLE SETUP</div>
                                <div className="space-y-2">
                                  <div 
                                    onClick={() => setActiveTblIndex('TblStart')}
                                    className={`p-1.5 rounded-lg border flex items-center justify-between ${activeTblIndex === 'TblStart' ? 'bg-purple-950/40 border-purple-500/40' : 'border-transparent'}`}
                                  >
                                    <span className="font-bold text-[9px] text-[#b4aae2]">TblStart = </span>
                                    <span className="font-bold font-mono text-white">{tblSettings.TblStart}</span>
                                  </div>
                                  <div 
                                    onClick={() => setActiveTblIndex('dTbl')}
                                    className={`p-1.5 rounded-lg border flex items-center justify-between ${activeTblIndex === 'dTbl' ? 'bg-purple-950/40 border-purple-500/40' : 'border-transparent'}`}
                                  >
                                    <span className="font-bold text-[9px] text-[#b4aae2]">DeltaTbl = </span>
                                    <span className="font-bold font-mono text-white">{tblSettings.dTbl}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {currentScreen === 'GRAPH' && (
                            <div className="flex-grow flex flex-col relative rounded-md overflow-hidden border border-purple-500/10">
                              <canvas 
                                ref={canvasRef} 
                                width={380} 
                                height={210} 
                                className="w-full h-full flex-grow bg-[#100b26] cursor-crosshair"
                              />
                              {isTracing && (
                                <div className="absolute bottom-0 inset-x-0 bg-[#070414]/90 border-t border-purple-500/10 text-white text-[8px] font-mono p-1 px-2 flex justify-between">
                                  <span className="font-black text-[#cf4fe6]">{traceEquationIndex}</span>
                                  <span>X={traceX.toFixed(2)}</span>
                                  <span>Y={(() => {
                                    try {
                                      const eq = equations[traceEquationIndex];
                                      if (!eq) return '0.00';
                                      const math = (window as any).math;
                                      const y = math ? math.evaluate(sanitizeExpressionForMathJS(eq), { x: traceX, deg: math.unit('deg'), Ans: Number(lastAnswer) || 0 }) : 0;
                                      return typeof y === 'number' && !isNaN(y) ? y.toFixed(2) : 'ERR';
                                    } catch(e) { return 'ERR'; }
                                  })()}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {currentScreen === 'TABLE' && (
                            <div className="flex-grow flex flex-col">
                              <div className="grid grid-cols-3 font-black text-[9px] tracking-wider text-purple-300 border-b border-purple-500/20 pb-1 mb-1 text-center font-mono">
                                <span className="text-left pl-2">X</span>
                                <span>Y1</span>
                                <span>Y2</span>
                              </div>
                              <div className="flex-grow overflow-y-hidden divide-y divide-purple-500/5 text-center font-mono">
                                {renderTableRows().map((row, i) => (
                                  <div key={i} className="grid grid-cols-3 text-[9px] py-1 font-bold">
                                    <span className="text-left pl-2 text-white bg-purple-950/20">{row.X}</span>
                                    <span className="text-[#f43f5e]">{row.Y1}</span>
                                    <span className="text-[#3b82f6]">{row.Y2}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentScreen === 'MODE_MENU' && (
                            <div className="flex-grow flex flex-col text-[9px] space-y-1.5 overflow-y-auto">
                              <div className="font-black border-b border-purple-500/20 pb-1 mb-1.5 text-[9px] tracking-wider text-purple-300">MODE SETTINGS</div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <span className="font-bold text-[#b4aae2]">ANGLE:</span>
                                <div className="flex space-x-1">
                                  {['RADIAN', 'DEGREE'].map(opt => (
                                    <button 
                                      key={opt}
                                      onClick={() => setAngleMode(opt)}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono border ${angleMode === opt ? 'bg-[#3fd9c7] text-[#020008] border-[#3fd9c7]' : 'bg-[#10092b] text-[#b4aae2]/60 border-purple-500/20'} cursor-pointer`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex justify-between items-center py-0.5">
                                <span className="font-bold text-[#b4aae2]">DECIMALS:</span>
                                <select 
                                  value={decimalPlaces} 
                                  onChange={(e) => setDecimalPlaces(e.target.value)}
                                  className="bg-[#10092b] text-[#3fd9c7] border border-purple-500/20 font-bold font-mono text-[8px] rounded px-1 py-0.5 outline-none"
                                >
                                  <option value="FLOAT">FLOAT</option>
                                  {[0, 1, 2, 3, 4, 5, 6].map(v => <option key={v} value={v.toString()}>{v}</option>)}
                                </select>
                              </div>

                              <div className="flex justify-between items-center py-0.5">
                                <span className="font-bold text-[#b4aae2]">NOTATION:</span>
                                <div className="flex space-x-1">
                                  {['NORMAL', 'SCI'].map(opt => (
                                    <button 
                                      key={opt}
                                      onClick={() => setNumberFormat(opt)}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono border ${numberFormat === opt ? 'bg-[#3fd9c7] text-[#020008] border-[#3fd9c7]' : 'bg-[#10092b] text-[#b4aae2]/60 border-purple-500/20'} cursor-pointer`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {currentScreen === 'MATH_MENU' && (
                            <div className="flex-grow flex flex-col">
                              <div className="border-b border-purple-500/20 pb-1 mb-1.5 font-black text-[9px] tracking-wider text-purple-300">MATH FUNCTIONS</div>
                              <div className="space-y-1 pt-0.5">
                                {[
                                  { l: '1: >Frac', d: 'Convert to fraction', t: 'toFraction(' },
                                  { l: '2: >Dec', d: 'Convert to decimal', t: 'string(' },
                                  { l: '3: abs(', d: 'Absolute value operator', t: 'abs(' },
                                  { l: '4: gcd(', d: 'Greatest common divisor', t: 'gcd(' },
                                  { l: '5: lcm(', d: 'Least common multiple', t: 'lcm(' }
                                ].map((item, i) => (
                                  <div 
                                    key={i} 
                                    onClick={() => {
                                      insertToken(item.t);
                                      setCurrentScreen('HOME');
                                    }}
                                    className="p-1 hover:bg-purple-950/40 rounded-lg cursor-pointer border-b border-purple-500/5 text-[9px] font-bold text-white flex justify-between"
                                  >
                                    <span>{item.l}</span>
                                    <span className="text-[#b4aae2]/40 text-[8px]">{item.d}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentScreen === 'PROGRAM_MENU' && (
                            <div className="flex-grow flex flex-col">
                              <div className="border-b border-purple-500/20 pb-1 mb-2 font-black text-[9px] tracking-wider text-purple-300">EXEC PROGRAM</div>
                              <div className="space-y-1.5 flex-grow">
                                {programList.map((prog, i) => (
                                  <div 
                                    key={prog} 
                                    onClick={() => setActiveProgIndex(i)}
                                    className={`p-1.5 rounded-lg cursor-pointer flex justify-between items-center border ${activeProgIndex === i ? 'bg-purple-950/40 border-purple-500/40' : 'border-transparent'}`}
                                  >
                                    <span className="font-bold text-[10px] text-white">{`${i+1}: ${prog}`}</span>
                                    <span className="text-[8px] text-[#3fd9c7] uppercase bg-[#3fd9c7]/10 px-1 rounded border border-[#3fd9c7]/20 font-mono">ROM</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentScreen === 'CATALOG' && (
                            <div className="flex-grow flex flex-col">
                              <div className="border-b border-purple-500/20 pb-1 mb-2 font-black text-[9px] tracking-wider text-purple-300">CATALOG</div>
                              <div className="space-y-1 flex-grow overflow-y-auto pr-0.5">
                                {[
                                  { n: 'abs(', t: 'abs(' },
                                  { n: 'acos(', t: 'acos(' },
                                  { n: 'asin(', t: 'asin(' },
                                  { n: 'atan(', t: 'atan(' },
                                  { n: 'cos(', t: 'cos(' },
                                  { n: 'sin(', t: 'sin(' },
                                  { n: 'tan(', t: 'tan(' },
                                  { n: 'log(', t: 'log(' }
                                ].map((item) => (
                                  <div 
                                    key={item.n} 
                                    onClick={() => {
                                      insertToken(item.t);
                                      setCurrentScreen('HOME');
                                    }}
                                    className="p-1 hover:bg-purple-950/40 rounded-lg cursor-pointer border-b border-purple-500/5 text-[9px] font-bold text-white"
                                  >
                                    {item.n}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentScreen === 'S_GAME' && (
                            <div className="flex-grow flex flex-col justify-between">
                              <div className="flex justify-between items-center text-[8px] font-bold text-[#b4aae2] border-b border-purple-500/10 pb-1 mb-1.5">
                                <span>SCORE: {snakeScore}</span>
                                <span className="text-[#cf4fe6]">HI: {snakeHighScore}</span>
                              </div>
                              {snakeOver ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center">
                                  <div className="text-[11px] font-black text-rose-400">GAME OVER</div>
                                  <button 
                                    onClick={initSnakeGame} 
                                    className="mt-2 px-3 py-1 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/30 text-white rounded-lg text-[8px] font-bold cursor-pointer"
                                  >
                                    RETRY (ENTER)
                                  </button>
                                </div>
                              ) : (
                                <div className="flex-grow grid grid-cols-20 grid-rows-12 gap-px bg-purple-950/20 p-0.5 border border-purple-500/10 rounded">
                                  {Array.from({ length: 12 }).map((_, r) => (
                                    Array.from({ length: 20 }).map((_, c) => {
                                      const isSnake = snake.some(s => s.x === c && s.y === r);
                                      const isFood = snakeFood.x === c && snakeFood.y === r;
                                      return (
                                        <div 
                                          key={`${r}-${c}`}
                                          className={`w-full h-full rounded-[1px] ${isSnake ? 'bg-[#3fd9c7] shadow-[0_0_2px_#3fd9c7]' : isFood ? 'bg-rose-500 animate-pulse' : 'bg-transparent'}`}
                                          style={{ aspectRatio: '1/1' }}
                                        />
                                      );
                                    })
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {currentScreen === 'TETRIS_GAME' && (
                            <div className="flex-grow flex flex-col justify-between">
                              <div className="flex justify-between items-center text-[8px] font-bold text-[#b4aae2] border-b border-purple-500/10 pb-1 mb-1.5">
                                <span>TETRIS ROM</span>
                                <span>SCORE: {tetrisScore}</span>
                              </div>
                              {tetrisOver ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center">
                                  <div className="text-[11px] font-black text-rose-400">GAME OVER</div>
                                  <button 
                                    onClick={initTetrisGame} 
                                    className="mt-2 px-3 py-1 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/30 text-white rounded-lg text-[8px] font-bold cursor-pointer"
                                  >
                                    RETRY (ENTER)
                                  </button>
                                </div>
                              ) : (
                                <div className="flex-grow grid grid-cols-10 grid-rows-15 gap-px bg-purple-950/20 p-0.5 border border-purple-500/10 rounded max-h-[120px] overflow-hidden">
                                  {Array.from({ length: 15 }).map((_, r) => (
                                    Array.from({ length: 10 }).map((_, c) => {
                                      let hasBlock = tetrisBoard[r]?.[c] === 1;
                                      if (tetrisPiece) {
                                        const shape = tetrisPiece.shape;
                                        const shapeR = r - tetrisPos.y;
                                        const shapeC = c - tetrisPos.x;
                                        if (shapeR >= 0 && shapeR < shape.length && shapeC >= 0 && shapeC < shape[shapeR].length) {
                                          if (shape[shapeR][shapeC]) hasBlock = true;
                                        }
                                      }
                                      return (
                                        <div 
                                          key={`${r}-${c}`}
                                          className={`w-full h-full rounded-[1px] ${hasBlock ? 'bg-[#cf4fe6] shadow-[0_0_2px_#cf4fe6]' : 'bg-transparent'}`}
                                          style={{ aspectRatio: '1/1' }}
                                        />
                                      );
                                    })
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Calculator Pad Keys Layout */}
                  <div className="grid grid-cols-5 gap-1 select-none mt-3">
                    
                    {/* ROW 1: Blue functional row */}
                    {['Y=', 'GRAPH', 'Home', 'TABLE', 'Undo'].map(k => (
                      <button 
                        key={k}
                        onClick={() => { haptic(10); handleButtonPress(k === 'Home' ? 'QUIT' : k); }}
                        className="py-1 bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-[8px] font-bold rounded hover:bg-indigo-900 transition-all cursor-pointer text-center"
                      >
                        {k}
                      </button>
                    ))}

                    {/* ROW 2: 2nd, Mode, Del, D-pad spacer */}
                    <button 
                      onClick={() => { haptic(10); handleButtonPress('2ND'); }} 
                      className={`py-1 text-[8px] font-black rounded transition-all cursor-pointer text-center ${is2nd ? 'bg-amber-500 text-slate-950' : 'bg-amber-900/60 text-amber-300 border border-amber-500/20'}`}
                    >
                      2nd
                    </button>
                    <button 
                      onClick={() => { haptic(10); handleButtonPress('MODE'); }}
                      className="py-1 bg-[#1c1c28] border border-slate-700/30 text-slate-300 text-[8px] font-bold rounded hover:bg-[#2c2c3e] transition-all cursor-pointer text-center"
                    >
                      MODE
                    </button>
                    <button 
                      onClick={() => { haptic(10); handleButtonPress('DEL'); }}
                      className="py-1 bg-[#1c1c28] border border-slate-700/30 text-slate-300 text-[8px] font-bold rounded hover:bg-[#2c2c3e] transition-all cursor-pointer text-center"
                    >
                      DEL
                    </button>
                    
                    {/* Directional Pad spanning 2 columns, 2 rows */}
                    <div className="col-span-2 row-span-2 bg-slate-950/60 border border-purple-500/10 rounded-lg p-1 flex flex-col justify-between items-center h-14">
                      <button onClick={() => { haptic(10); handleButtonPress('UP'); }} className="px-2 py-0.5 bg-slate-800 text-white rounded text-[7px] cursor-pointer">▲</button>
                      <div className="flex gap-2">
                        <button onClick={() => { haptic(10); handleButtonPress('LEFT'); }} className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[7px] cursor-pointer">◀</button>
                        <button onClick={() => { haptic(10); handleButtonPress('RIGHT'); }} className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[7px] cursor-pointer">▶</button>
                      </div>
                      <button onClick={() => { haptic(10); handleButtonPress('DOWN'); }} className="px-2 py-0.5 bg-slate-800 text-white rounded text-[7px] cursor-pointer">▼</button>
                    </div>

                    {/* ROW 3: ALPHA, X, STAT */}
                    <button 
                      onClick={() => { haptic(10); handleButtonPress('ALPHA'); }} 
                      className={`py-1 text-[8px] font-black rounded transition-all cursor-pointer text-center ${isAlpha ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/20'}`}
                    >
                      ALPHA
                    </button>
                    <button 
                      onClick={() => { haptic(10); handleButtonPress('x'); }}
                      className="py-1 bg-[#1c1c28] border border-slate-700/30 text-slate-300 text-[8px] font-bold rounded hover:bg-[#2c2c3e] transition-all cursor-pointer text-center"
                    >
                      X,T,θ,n
                    </button>
                    <button 
                      onClick={() => { haptic(10); handleButtonPress('PRGM'); }}
                      className="py-1 bg-[#1c1c28] border border-slate-700/30 text-slate-300 text-[8px] font-bold rounded hover:bg-[#2c2c3e] transition-all cursor-pointer text-center"
                    >
                      PRGM
                    </button>

                    {/* Standard calculator key grid (5x4 keys) */}
                    {[
                      { l: 'MATH', a: 'MATH' }, { l: 'sin', a: 'sin(' }, { l: 'cos', a: 'cos(' }, { l: 'tan', a: 'tan(' }, { l: '^', a: '^' },
                      { l: 'x²', a: '²' }, { l: 'log', a: 'log(' }, { l: 'ln', a: 'ln(' }, { l: '(', a: '(' }, { l: ')', a: ')' },
                      { l: '7', a: '7' }, { l: '8', a: '8' }, { l: '9', a: '9' }, { l: '÷', a: '/' }, { l: 'CLEAR', a: 'CLEAR' },
                      { l: '4', a: '4' }, { l: '5', a: '5' }, { l: '6', a: '6' }, { l: '×', a: '*' }, { l: 'Ans', a: 'Ans' },
                      { l: '1', a: '1' }, { l: '2', a: '2' }, { l: '3', a: '3' }, { l: '–', a: '-' }, { l: 'ENTER', a: 'ENTER' },
                      { l: '0', a: '0' }, { l: '.', a: '.' }, { l: '(-)', a: '(-)' }, { l: '+', a: '+' }, { l: 'CATALOG', a: 'CATALOG' }
                    ].map((keyItem) => (
                      <button
                        key={keyItem.l}
                        onClick={() => { haptic(10); handleButtonPress(keyItem.a); }}
                        className={`py-1.5 text-[9px] font-bold rounded transition-all cursor-pointer text-center ${
                          keyItem.l === 'ENTER' ? 'bg-[#cf4fe6] hover:bg-[#df5ff6] text-white font-black col-span-1 shadow-[0_0_8px_rgba(207,79,230,0.3)]' :
                          keyItem.l === 'CLEAR' ? 'bg-rose-950/40 border border-rose-500/30 text-rose-400 font-mono' :
                          ['+', '-', '*', '/', '÷', '×', '–'].includes(keyItem.l) ? 'bg-purple-900/40 border border-purple-500/25 text-purple-300 font-mono' :
                          isNaN(Number(keyItem.l)) ? 'bg-[#181236]/80 border border-purple-500/10 text-slate-300 font-mono' :
                          'bg-slate-900 border border-slate-700/20 text-slate-100 hover:bg-slate-800 font-mono'
                        }`}
                      >
                        {keyItem.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

              {utilityTab === 'timer' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Countdown alarms and temporal loops</span>
                    <div className="text-sm font-black text-pink-400 font-mono tracking-wider">
                      {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Active System Alarms</span>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-0.5">
                        {alarms.map((alarm) => (
                          <div key={alarm.id} className="p-3.5 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-between transition-all">
                            <div className="flex flex-col">
                              <span className="text-xl font-black text-slate-100 font-mono tracking-wider">{alarm.time}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">{alarm.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  haptic(8);
                                  setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: !a.active } : a));
                                  toast(`Alarm ${alarm.label} ${!alarm.active ? 'activated' : 'disabled'}.`);
                                }}
                                className={`px-3 py-1 rounded-lg text-[9px] font-bold font-mono transition-all cursor-pointer ${
                                  alarm.active 
                                    ? 'bg-slate-900/60 border' 
                                    : 'bg-slate-900 border border-slate-700/20 text-slate-500'
                                }`}
                                style={alarm.active ? {
                                  borderColor: 'var(--theme-card-border)',
                                  color: 'var(--theme-accent-color1)',
                                } : undefined}
                              >
                                {alarm.active ? 'ACTIVE' : 'MUTED'}
                              </button>
                              <button
                                onClick={() => {
                                  haptic(12);
                                  setAlarms(prev => prev.filter(a => a.id !== alarm.id));
                                  toast('System alarm purged.');
                                }}
                                className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-white/5 rounded-xl space-y-4 self-start">
                      <div className="border-b border-white/5 pb-2 text-[10px] font-bold text-pink-400 uppercase tracking-widest">Register New Time Trigger</div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Trigger Time</label>
                          <input 
                            type="time" 
                            value={newAlarmTime} 
                            onChange={(e) => setNewAlarmTime(e.target.value)}
                            className="bg-slate-950 border border-white/10 hover:border-white/20 focus:border-pink-500/50 rounded-lg p-2 text-xs text-slate-100 outline-none font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Label</label>
                          <input 
                            type="text" 
                            placeholder="Alchemical Wakeup"
                            value={newAlarmLabel} 
                            onChange={(e) => setNewAlarmLabel(e.target.value)}
                            className="bg-slate-950 border border-white/10 hover:border-white/20 focus:border-pink-500/50 rounded-lg p-2 text-xs text-slate-100 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!newAlarmTime) return;
                          haptic(15);
                          const nextAlarm = {
                            id: String(Date.now()),
                            time: newAlarmTime,
                            label: newAlarmLabel.trim() || 'Temporal sync alert',
                            active: true
                          };

                          setAlarms(prev => [...prev, nextAlarm]);
                          setNewAlarmLabel('');
                          toast('Alarm trigger configured successfully!');
                        }}
                        className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        Configure Time Trigger
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BROWSER VIEW (ENCRYPTED SANDBOX) */}
          {activeTab === 'browser' && (
            <div className="glass-panel rounded-2xl border border-purple-500/15 bg-[#070312]/80 backdrop-blur-xl p-4 flex flex-col h-full text-left relative overflow-hidden group shadow-2xl shadow-purple-950/20 animate-[fadeIn_0.4s_ease-out]">
              {/* Top Banner and Navigation Bar */}
              <div className="flex flex-col gap-3 pb-3 border-b border-purple-500/10 shrink-0">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] animate-pulse" />
                    <div>
                      <h2 className="text-xs font-bold text-purple-200 uppercase tracking-widest flex items-center gap-2 font-mono">
                        <Globe className="w-4 h-4 text-[#8b5cf6] animate-[spin_10s_linear_infinite]" />
                        Aether Net Sandboxed Web Browser
                      </h2>
                      <p className="text-[9px] text-slate-500">Secure isolated volume for public research queries</p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-500/20 font-mono text-[9px] text-purple-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>SECURE PROXY ACTIVE</span>
                  </div>
                </div>

                {/* Browser Controls */}
                <div className="flex items-center gap-2 bg-[#0e061c]/60 p-1.5 rounded-xl border border-purple-500/10">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        haptic(5);
                        if (browserHistory.length > 1) {
                          const nextHistory = [...browserHistory];
                          nextHistory.pop(); // remove current
                          const prev = nextHistory[nextHistory.length - 1];
                          setBrowserHistory(nextHistory);
                          setBrowserUrl(prev);
                        } else {
                          toast('No backward history');
                        }
                      }}
                      disabled={browserHistory.length <= 1}
                      className="p-2 bg-purple-950/20 hover:bg-purple-900/30 disabled:opacity-40 disabled:hover:bg-purple-950/20 text-purple-300 rounded-lg transition cursor-pointer"
                      title="Back"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    
                    <button 
                      onClick={() => {
                        haptic(5);
                        setBrowserUrl('https://treydog-ramirez.github.io/dnd-portal/');
                        setBrowserHistory(prev => [...prev, 'https://treydog-ramirez.github.io/dnd-portal/']);
                      }}
                      className="p-2 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 rounded-lg transition cursor-pointer"
                      title="Home"
                    >
                      <Home className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => {
                        haptic(5);
                        setBrowserLoading(true);
                        const current = browserUrl;
                        setBrowserUrl('');
                        setTimeout(() => {
                          setBrowserUrl(current);
                          setBrowserLoading(false);
                        }, 300);
                      }}
                      className="p-2 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 rounded-lg transition cursor-pointer"
                      title="Reload"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${browserLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* URL Input Bar */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      haptic(10);
                      let target = browserInput.trim();
                      if (!target) return;
                      
                      const isUrl = target.includes('.') && !target.includes(' ');
                      if (!isUrl) {
                        target = `https://www.google.com/search?q=${encodeURIComponent(target)}&igu=1`;
                      } else {
                        if (!/^https?:\/\//i.test(target)) {
                          target = `https://${target}`;
                        }
                      }
                      setBrowserUrl(target);
                      setBrowserHistory(prev => [...prev, target]);
                    }}
                    className="flex-grow flex items-center gap-2 bg-black/40 border border-purple-500/10 focus-within:border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-purple-300 font-mono transition duration-300"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#8b5cf6]/80 shrink-0" />
                    <input 
                      type="text" 
                      value={browserInput} 
                      onChange={(e) => setBrowserInput(e.target.value)}
                      placeholder="Enter URL or search query..."
                      className="flex-grow bg-transparent border-none outline-none focus:ring-0 p-0 text-xs text-slate-100 font-mono placeholder-zinc-600"
                    />
                    <button type="submit" className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider font-sans cursor-pointer transition">
                      Go
                    </button>
                  </form>

                  {/* External Open Button */}
                  <a 
                    href={browserUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => haptic(5)}
                    className="p-2 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Open Website in New Tab (Bypasses Frame Blocks)"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Browser Main Frame Area */}
              <div className="flex-grow w-full rounded-xl bg-black overflow-hidden relative border border-purple-500/5 min-h-0">
                {browserLoading && (
                  <div className="absolute inset-0 bg-[#070312]/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
                    <Globe className="w-8 h-8 text-[#8b5cf6] animate-[spin_3s_linear_infinite]" />
                    <span className="text-[10px] font-mono text-purple-400 tracking-wider">LOADING SECURE INSTANCE...</span>
                  </div>
                )}
                
                {browserUrl ? (
                  <iframe
                    src={browserUrl}
                    className="w-full h-full border-none bg-black"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen"
                    onLoad={() => setBrowserLoading(false)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#070312]/50 text-zinc-500 text-xs italic">
                    No page loaded. Enter a URL or search query above.
                  </div>
                )}
              </div>

              {/* Frame Warning Footer */}
              <div className="pt-2 flex justify-between items-center text-[8px] font-mono text-slate-500 select-none shrink-0">
                <span>⚠️ Websites with strict frame headers may block embedding. Use the pop-out button on the right to open directly if a page remains blank.</span>
                <span className="text-purple-400/60 font-bold">PROXY OVERRIDE ACTIVE</span>
              </div>
            </div>
          )}

          {/* MUSIC WORKSPACE (IMMERSIVE MUSIC HUB) */}
          {activeTab === 'music' && (
            <MusicHub portalDarkMode={portalDarkMode} themeColor={themeColor} />
          )}

          {/* CODE WORKSPACE COMPILER */}
          {activeTab === 'code' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  Quantum Mainframe Compiler
                </h2>
                <p className="text-[10px] text-slate-500">Direct workspace scripting terminal sandbox</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3 flex flex-col h-[340px]">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Script Playground (JavaScript)</span>
                  <textarea 
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    className="flex-grow w-full bg-slate-950 border border-white/5 rounded-xl p-4 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        haptic(10);
                        setCodeConsole(prev => [...prev, `>>> Compilation triggered at ${new Date().toLocaleTimeString()}...`]);
                        setTimeout(() => {
                          try {
                            const result = new Function(codeSnippet)();
                            setCodeConsole(prev => [
                              ...prev,
                              `>>> COMPILATION: SUCCESS`,
                              `>>> OUTPUT: ${result !== undefined ? String(result) : 'void'}`
                            ]);
                            toast('Compilation Success!', 'success');
                          } catch (err: any) {
                            setCodeConsole(prev => [
                              ...prev,
                              `>>> COMPILATION: FAILED`,
                              `>>> ERROR: ${err.message}`
                            ]);
                            toast('Compilation Failed.', 'error');
                          }
                        }, 400);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Execute Script
                    </button>
                    <button 
                      onClick={() => {
                        haptic(5);
                        setCodeConsole(['>>> Mainframe console logs cleared.']);
                        toast('Console logs cleared.');
                      }}
                      className="px-4 py-2 bg-slate-950 border border-white/5 hover:border-white/10 text-slate-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear Logs
                    </button>
                  </div>
                </div>

                <div className="space-y-3 flex flex-col h-[340px]">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Mainframe Debug Console</span>
                  <div className="flex-grow w-full bg-slate-950 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-[#b4aae2] overflow-y-auto space-y-1.5">
                    {codeConsole.map((logLine, idx) => (
                      <div 
                        key={idx} 
                        className={
                          logLine.includes('SUCCESS') ? 'text-emerald-400 font-bold' :
                          logLine.includes('FAILED') || logLine.includes('ERROR') ? 'text-rose-400 font-bold' :
                          logLine.includes('OUTPUT') ? 'text-cyan-400 font-black' :
                          'opacity-80'
                        }
                      >
                        {logLine}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COOKBOOK (CRAIVE) TAB */}
          {activeTab === 'cookbook' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left animate-[fadeIn_0.4s_ease-out] flex flex-col h-full overflow-hidden">
              <CookbookContainer />
            </div>
          )}

          {/* SPORTS SCOREBOARD TAB */}
          {activeTab === 'sports' && (
            <div className="glass-panel rounded-2xl border border-white/[0.04] p-6 text-left space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 border-b border-slate-200/50 dark:border-white/5 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    SportCast Real-time Scoreboard
                  </h2>
                  <p className="text-[10px] text-slate-500">Zero-cost live feeds directly from public endpoints</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => { haptic(10); loadSportsScores(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer"
                    style={{ background: 'var(--theme-btn-gradient)' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Fetch Live
                  </button>
                </div>
              </div>

              {/* Online warning */}
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10.5px] font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider">Free live feeds connectivity</h4>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                    SportCast directly streams live updates from public API feeds. An active internet connection is required to sync latest results.
                  </p>
                </div>
              </div>

              {/* Category buttons / League filters */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(SPORTS_LEAGUES).map(([key, league]) => (
                  <button
                    key={key}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all border cursor-pointer ${
                      activeSportsLeague === key 
                        ? 'text-white shadow-md' 
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-900'
                    }`}
                    style={activeSportsLeague === key ? {
                      background: 'var(--theme-btn-gradient)',
                      borderColor: 'var(--theme-accent)',
                    } : undefined}
                    onClick={() => { haptic(8); setActiveSportsLeague(key as SportsLeague); }}
                  >
                    {league.label.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Status/last refreshed */}
              <div className="flex items-center justify-between text-[9px] text-slate-500 bg-slate-50 dark:bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-white/5 select-none font-mono">
                <span>{sportsStatus}</span>
                <span>Updated: {sportsUpdated}</span>
              </div>

              {/* Sub-tabs: Live & Results vs Upcoming Schedule */}
              <div className="flex border-b border-slate-200 dark:border-white/5 select-none">
                <button 
                  className={`flex-grow py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                    sportsSubTab === 'scores' 
                      ? '' 
                      : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  style={sportsSubTab === 'scores' ? {
                    color: 'var(--theme-accent)',
                    borderColor: 'var(--theme-accent)',
                    backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  } : undefined}
                  onClick={() => { haptic(5); setSportsSubTab('scores'); }}
                >
                  🔴 Live & Results
                </button>
                <button 
                  className={`flex-grow py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                    sportsSubTab === 'schedule' 
                      ? 'text-pink-600 border-pink-600 bg-pink-500/5' 
                      : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  onClick={() => { haptic(5); setSportsSubTab('schedule'); }}
                >
                  📅 Upcoming Schedule
                </button>
              </div>

              {/* Grid Layout: Scores vs Pinned & Parlay */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
                {/* Left side: Score lists */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {(() => {
                      const filteredGames = sportsGames.filter((event) => {
                        const competition = event.competitions?.[0];
                        const state = competition?.status?.type?.state || event.status?.type?.state || '';
                        if (sportsSubTab === 'schedule') {
                          return state === 'pre';
                        } else {
                          return state !== 'pre';
                        }
                      });

                      if (filteredGames.length === 0) {
                        return (
                          <div className="col-span-full py-12 text-center text-slate-500 text-[11px] italic border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-transparent">
                            {sportsSubTab === 'schedule' 
                              ? 'No upcoming games scheduled on this league feed.' 
                              : 'No live or recently completed games on this league feed.'}
                          </div>
                        );
                      }

                      return filteredGames.map((event) => {
                        const competition = event.competitions?.[0];
                        const competitors = (competition?.competitors || [])
                          .slice()
                          .sort((a: any) => (a.homeAway === 'away' ? -1 : 1));

                        const statusType = competition?.status?.type || event.status?.type || {};
                        const state = statusType.state || '';
                        const detail = statusType.detail || formatSportsDate(event.date);

                        const isFavorite = competitors.some(teamMatchesFavorite);

                        return (
                          <article
                            key={event.id}
                            className={`p-3.5 border rounded-xl flex flex-col justify-between gap-3 transition-all duration-200 ${
                              isFavorite 
                                ? 'border-teal-500/60 bg-teal-500/5 shadow-[0_0_12px_rgba(20,184,166,0.1)]' 
                                : 'border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 hover:border-purple-500/40'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                              <span className="font-bold text-slate-650 dark:text-slate-400">{SPORTS_LEAGUES[activeSportsLeague].label}</span>
                              <span className={state === 'in' ? 'text-red-500 animate-pulse font-black' : state === 'post' ? 'text-slate-400' : 'text-purple-500'}>
                                {detail || 'Scheduled'}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2">
                              {competitors.map((competitor: any) => {
                                const logoUrl = competitor.team?.logo || competitor.team?.logos?.[0]?.href;

                                return (
                                  <div key={competitor.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 max-w-[70%]">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          haptic(10);
                                          addToParlaySlip(event, competition, competitor);
                                        }}
                                        className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] font-bold transition-all shrink-0 cursor-pointer ${
                                          isTeamInSlip(competitor.id)
                                            ? 'bg-purple-600 border-purple-600 text-white'
                                            : 'bg-black/5 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 hover:border-purple-500/50'
                                        }`}
                                        title={isTeamInSlip(competitor.id) ? "Remove from parlay slip" : "Add to parlay slip"}
                                      >
                                        {isTeamInSlip(competitor.id) ? '✓' : '+'}
                                      </button>
                                      {logoUrl ? (
                                        <img className="w-4 h-4 object-contain shrink-0" src={logoUrl} alt="" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-4 h-4 bg-slate-205 dark:bg-[#1a1138] rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-teal-400 shrink-0">
                                          {competitor.team?.abbreviation || '--'}
                                        </div>
                                      )}
                                      <span className={`text-[11px] font-semibold truncate ${competitor.winner ? 'text-teal-500 font-bold' : 'text-slate-800 dark:text-[#faebd7]'}`}>
                                        {competitor.team?.shortDisplayName || competitor.team?.displayName || 'Team'}
                                      </span>
                                      <span className="text-[8.5px] text-slate-450 font-normal shrink-0">{getRecord(competitor)}</span>
                                    </div>
                                    <span className={`text-[11.5px] font-mono font-black ${state === 'in' ? 'text-teal-500' : 'text-slate-800 dark:text-[#faebd7]'}`}>
                                      {competitor.score || (state === 'pre' ? '-' : '0')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </article>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right side: Pinned favorites and Parlay Slip */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  {/* PINNED FAVORITES WIDGET */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-xl space-y-3.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-teal-400" />
                      Pinned Favorites
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Keywords of teams to highlight instantly in teal across all scoreboard streams.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Yankees, Lakers, Arsenal..." 
                        value={sportsFavoriteInput}
                        onChange={(e) => setSportsFavoriteInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSportsFavorite()}
                        className="flex-grow bg-slate-105 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-800 dark:text-slate-200 focus:border-teal-500/50"
                      />
                      <button 
                        onClick={addSportsFavorite}
                        className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition"
                      >
                        Pin
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {sportsFavorites.length === 0 ? (
                        <div className="text-center py-2 text-[9px] text-slate-500 italic w-full">No pinned keywords yet.</div>
                      ) : (
                        sportsFavorites.map((team, idx) => (
                          <span key={team} className="inline-flex items-center gap-1.5 border border-teal-500/30 bg-teal-500/5 text-slate-700 dark:text-teal-200 rounded-lg px-2.5 py-1 text-[10px] font-mono">
                            <span>{team}</span>
                            <button onClick={() => removeSportsFavorite(idx)} className="text-slate-400 hover:text-red-400 font-bold">×</button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PARLAY TRACKER WIDGET */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-xl space-y-3.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-purple-400" />
                      Parlay Tracker
                    </span>

                    {/* Active Slip */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active Slip</span>
                        {parlaySlip.length > 0 && (
                          <span className="text-[8px] font-mono bg-purple-500/10 text-purple-650 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">{parlaySlip.length} Picks</span>
                        )}
                      </div>

                      {parlaySlip.length === 0 ? (
                        <div className="text-center py-5 px-3 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-[10px] text-slate-400 italic bg-white/20 dark:bg-slate-950/20">
                          Click the "+" next to teams to build a free simulated parlay slip.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {parlaySlip.map((leg) => (
                            <div key={leg.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 text-xs text-slate-805 dark:text-slate-205">
                              <div className="flex flex-col text-left max-w-[80%]">
                                <span className="font-bold truncate">{leg.teamName}</span>
                                <span className="text-[8px] text-slate-500 truncate">vs {leg.opponentName} ({leg.league.toUpperCase()})</span>
                              </div>
                              <button 
                                onClick={() => setParlaySlip(prev => prev.filter(l => l.id !== leg.id))}
                                className="text-slate-400 hover:text-red-400 p-1 font-bold text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-1.5">
                            <button 
                              onClick={() => { haptic(15); saveParlay(); }}
                              className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-bold uppercase transition"
                            >
                              Save Parlay
                            </button>
                            <button 
                              onClick={() => { haptic(10); clearParlaySlip(); }}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold uppercase transition"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Saved Parlays List */}
                    <div className="space-y-2 pt-2.5 border-t border-slate-200 dark:border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Saved Parlays</span>
                        {sportsParlays.length > 0 && (
                          <button 
                            onClick={() => { haptic(10); refreshParlays(); }}
                            className="text-[8px] text-purple-600 dark:text-purple-400 hover:underline uppercase font-bold"
                          >
                            Refresh
                          </button>
                        )}
                      </div>

                      {sportsParlays.length === 0 ? (
                        <div className="text-center py-4 text-[9px] text-slate-500 italic">No saved slips yet.</div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
                          {sportsParlays.slice().reverse().map((parlay) => (
                            <div key={parlay.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-white/5 rounded-xl space-y-2 text-left">
                              <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="text-[8px] text-slate-500 font-mono">{new Date(parlay.savedAt).toLocaleDateString()}</span>
                                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{parlay.legs.length} Leg slip</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                    parlay.status === 'won' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                    parlay.status === 'lost' ? 'bg-red-500/10 text-red-650 border-red-500/20' :
                                    parlay.status === 'live' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' :
                                    'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                  }`}>
                                    {parlay.status}
                                  </span>
                                  <button onClick={() => deleteParlay(parlay.id)} className="text-slate-400 hover:text-red-400">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1 pl-2 border-l-2 border-purple-500/30">
                                {parlay.legs.map((leg) => {
                                  const legStatus = leg.status || 'pending';
                                  return (
                                    <div key={leg.id} className="flex items-center justify-between text-[10px]">
                                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{leg.teamName}</span>
                                      <span className={`text-[8.5px] font-bold uppercase ${
                                        legStatus === 'won' ? 'text-green-500' :
                                        legStatus === 'lost' ? 'text-red-500' :
                                        legStatus === 'live' ? 'text-amber-500 animate-pulse' :
                                        'text-slate-400'
                                      }`}>{legStatus}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="space-y-6 text-left animate-[fadeIn_0.4s_ease-out]">
              
              {/* Header Title */}
              <div>
                <h2 className="text-sm font-bold text-slate-850 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-600" />
                  Systems Customizer Matrix
                </h2>
                <p className="text-[10px] text-slate-500">Calibrate the visual workspace parameters and custom portal modules</p>
              </div>

              {/* Settings Sub-navigation Tabs */}
              <div className="flex bg-slate-100 dark:bg-[#150f2e]/60 rounded-xl border border-slate-200 dark:border-[#44387a]/45 p-0.5 w-full md:w-max overflow-x-auto select-none gap-0.5 font-sans">
                <button 
                  onClick={() => { haptic(5); setSettingsSubTab('appearance'); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${settingsSubTab === 'appearance' ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  🎭 Appearance & Visuals
                </button>
                <button 
                  onClick={() => { haptic(5); setSettingsSubTab('spotify'); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${settingsSubTab === 'spotify' ? 'bg-[#1db954]/20 border border-[#1db954]/40 text-[#1db954]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  🎵 Spotify Connect
                </button>
                <button 
                  onClick={() => { haptic(5); setSettingsSubTab('session'); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${settingsSubTab === 'session' ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  🌌 Rift & Feedback
                </button>
              </div>

              {settingsSubTab === 'session' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* 1. PORTAL SESSION CARD */}
              <div className="glass-panel border border-purple-500/15 bg-purple-500/5 hover:border-purple-500/35 transition-all duration-300 rounded-2xl p-5 space-y-3.5 group">
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Portal Traveler Rift
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700">Active Traveler ID</span>
                    <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
                      {currentUser === 'trxy6' ? '👑 Creator (trxy6)' : `👥 Traveler (${currentUser || 'guest'})`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      haptic(15);
                      localStorage.removeItem('portal_current_user');
                      window.location.reload();
                    }}
                    className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer"
                  >
                    Lock & Logout
                  </button>
                </div>
              </div>

              {/* 2. SHARE PORTAL & TEST SITE CARD */}
              <div className="glass-panel border border-indigo-500/15 bg-indigo-500/5 hover:border-indigo-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Share Portal & Test Site
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Scan this QR code with another device (phone, tablet) to instantly join the same battle chamber or share this web app companion with your players!
                </p>

                {/* QR Selector */}
                <div className="flex w-full bg-[#ebedfa]/50 p-1 rounded-lg border border-slate-200/40">
                  <button 
                    onClick={() => { haptic(10); setQrType('live'); }} 
                    className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest uppercase transition-all rounded-md cursor-pointer ${qrType === 'live' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    This Live Portal
                  </button>
                  <button 
                    onClick={() => { haptic(10); setQrType('github'); }} 
                    className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest uppercase transition-all rounded-md cursor-pointer ${qrType === 'github' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    GitHub Test Site
                  </button>
                </div>

                {/* Selected Share Info and QR Image */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center bg-white/60 p-4 border border-slate-200/40 rounded-xl">
                  {/* QR Image */}
                  <div className="bg-white p-2 rounded-xl border border-slate-200/50 flex items-center justify-center shrink-0 shadow-sm">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        qrType === 'live' ? window.location.href : githubUrl
                      )}`} 
                      alt="Portal QR Code" 
                      className="w-[110px] h-[110px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Share actions */}
                  <div className="flex-1 space-y-2.5 w-full text-center sm:text-left">
                    {qrType === 'live' ? (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">This Live Room URL</span>
                        <span className="text-[9px] text-slate-600 font-mono block break-all mb-2">{window.location.href}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast("Live link copied to clipboard!", "success");
                            haptic(15);
                          }}
                          className="flex items-center justify-center sm:justify-start gap-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg text-[9px] font-bold tracking-widest uppercase cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Live Link
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">My GitHub Pages Site</span>
                        <input 
                          type="url"
                          value={githubUrl}
                          onChange={(e) => {
                            const url = e.target.value;
                            setGithubUrl(url);
                            localStorage.setItem('portal_github_site_url', url);
                          }}
                          placeholder="e.g. https://yourname.github.io/dnd-portal"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex gap-2 justify-center sm:justify-start">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(githubUrl);
                              toast("GitHub link copied!", "success");
                              haptic(15);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg text-[8px] font-bold tracking-widest uppercase cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            Copy Link
                          </button>
                          <a 
                            href={githubUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20 hover:border-purple-500/40 rounded-lg text-[8px] font-bold tracking-widest uppercase"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            Visit Test Site
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. FEEDBACK IDEAS FROM TRAVELERS */}
              <div className="glass-panel border border-fuchsia-500/15 bg-fuchsia-500/5 hover:border-fuchsia-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <div className="flex justify-between items-center pb-2 border-b border-fuchsia-500/10">
                  <span className="text-[10px] uppercase font-bold text-fuchsia-600 tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Traveler Feedback Rift
                  </span>
                  {currentUser === 'trxy6' && (
                    <button
                      onClick={() => {
                        haptic(30);
                        if (confirm("Archive all feature ideas from the rift?")) {
                          localStorage.setItem('global_feedback_ideas', JSON.stringify([]));
                          setFeedbackList([]);
                          toast("Feedback ideas archived successfully!", "success");
                        }
                      }}
                      className="text-[9px] text-rose-500 hover:text-rose-600 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {currentUser === 'trxy6' ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Greetings, Creator trxy6! Below are the feature ideas and suggestions submitted by other travelers to your portal.
                    </p>
                    {feedbackList.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white/40">
                        <p className="text-xs text-slate-400 italic">The rift is silent. No feedback ideas have been inscribed yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {feedbackList.map((item: any) => (
                          <div key={item.id} className="p-3 bg-white border border-slate-200/50 rounded-xl space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-mono">
                              <span className="text-indigo-600 font-bold">From: {item.sender}</span>
                              <span className="text-slate-400">{item.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Have a vision for a new spell, feature, or tool? Enscribe your idea here to beam it directly to the Creator (<span className="text-indigo-600 font-bold">trxy6</span>)'s settings panel!
                    </p>
                    <textarea
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Describe your requested feature, visual enhancement, or idea here..."
                      className="w-full h-20 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                    />
                    <button
                      onClick={() => {
                        haptic(20);
                        if (!feedbackInput.trim()) {
                          toast("Please enscribe some text first!", "warn");
                          return;
                        }
                        const newFeedback = {
                          id: 'fb_' + Date.now(),
                          sender: currentUser || 'anonymous',
                          text: feedbackInput.trim(),
                          timestamp: new Date().toLocaleString()
                        };
                        try {
                          const curRaw = localStorage.getItem('global_feedback_ideas');
                          const curList = curRaw ? JSON.parse(curRaw) : [];
                          curList.unshift(newFeedback);
                          localStorage.setItem('global_feedback_ideas', JSON.stringify(curList));
                          setFeedbackList(curList);
                          setFeedbackInput('');
                          toast("Idea channeled directly to trxy6!", "success");
                        } catch {
                          toast("Idea saved locally (offline mode).", "success");
                        }
                      }}
                      className="w-full py-2 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer active:scale-95 hover:shadow-[0_0_24px_var(--theme-card-border)]"
                      style={{
                        background: 'var(--theme-btn-gradient)',
                        boxShadow: '0 0 16px var(--theme-card-border)',
                      }}
                    >
                      Channel Idea to trxy6
                    </button>
                  </div>
                )}
              </div>
              </div>
              )}

              {settingsSubTab === 'spotify' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* SPOTIFY INTEGRATION SETTINGS MATRIX */}
              <div className="glass-panel border border-emerald-500/15 bg-emerald-500/5 hover:border-emerald-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-500/10">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider flex items-center gap-1.5 font-sans">
                    <Music className="w-3.5 h-3.5" />
                    Spotify Integration Settings
                  </span>
                </div>

                {spotifyUser ? (
                  <div className="flex items-center justify-between bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      {spotifyUser.imageUrl ? (
                        <img
                          src={spotifyUser.imageUrl}
                          alt={spotifyUser.display_name}
                          className="w-10 h-10 rounded-full border border-emerald-500/30 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm font-sans">
                          {spotifyUser.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wide block font-mono">Sync Active</span>
                        <p className="text-xs text-slate-700 font-bold leading-tight font-sans">{spotifyUser.display_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        haptic(15);
                        handleDisconnectSpotify();
                        toast("Spotify account disconnected", "success");
                      }}
                      className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer font-sans"
                    >
                      Disconnect Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      Link your Spotify account to activate library access, sync liked tracks, search the Spotify catalogue, and launch live playback.
                    </p>
                    <button
                      onClick={() => {
                        haptic(20);
                        handleConnectSpotify();
                      }}
                      className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(29,185,84,0.15)] active:scale-95 cursor-pointer font-sans"
                    >
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.135-.668.47-.745 3.856-.88 7.15-.5 9.817 1.133.294.18.385.564.207.857zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.182-.413.125-.848-.107-.973-.52-.125-.413.108-.847.52-.973 3.666-1.114 8.234-.57 11.343 1.344.367.226.488.707.26 1.073zm.107-2.822c-3.26-1.937-8.634-2.115-11.75-1.17-.5.152-1.025-.133-1.177-.633-.153-.5.133-1.026.633-1.178 3.593-1.09 9.513-.883 13.266 1.343.45.267.6.845.333 1.295-.268.453-.846.602-1.295.333z"/>
                      </svg>
                      <span>Connect to Spotify</span>
                    </button>

                    <div className="pt-3 border-t border-slate-200/50 space-y-1.5 text-[10px] font-sans">
                      <div className="flex items-center justify-between text-slate-500 font-mono">
                        <span>REDIRECT URI:</span>
                        <button
                          type="button"
                          onClick={() => {
                            haptic(10);
                            handleCopyRedirectUri();
                          }}
                          className="text-emerald-600 hover:text-emerald-500 font-bold uppercase transition cursor-pointer"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div className="bg-slate-100 border border-slate-200 p-2 rounded-lg text-slate-600 font-mono truncate select-all text-[9px]">
                        {redirectUri}
                      </div>
                      <p className="text-[9px] text-[#8b5cf6]/90 leading-relaxed font-serif italic mt-1">
                        ⚠️ Click <strong>Add</strong> and then <strong>Save</strong> at the very bottom of Spotify's developer settings page, otherwise it won't persist!
                      </p>
                    </div>
                  </div>
                )}
              </div>
              </div>
              )}

              {settingsSubTab === 'appearance' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* 4. APPEARANCE & BACKGROUND PORTAL */}
              <div className="glass-panel border border-purple-500/15 bg-purple-500/5 hover:border-purple-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Appearance & Background Portal
                </span>

                {/* Theme Preset Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-b border-slate-100 dark:border-white/5 text-left">
                  {/* Light Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">☀️ Light Mode Theme Preset</label>
                    <select
                      value={lightThemePreset}
                      onChange={(e) => {
                        haptic(10);
                        const val = e.target.value;
                        setLightThemePreset(val as any);
                        localStorage.setItem('portal_light_theme_preset', val);
                        
                        // Initialize custom states so they can tweak them immediately
                        if (val === 'purple') {
                          setCustomColor1Light('#8b5cf6'); localStorage.setItem('portal_custom_color1_light', '#8b5cf6');
                          setCustomColor2Light('#db2777'); localStorage.setItem('portal_custom_color2_light', '#db2777');
                          setCustomBgStartLight('#ffffff'); localStorage.setItem('portal_custom_bg_start_light', '#ffffff');
                          setCustomBgEndLight('#f3e8ff'); localStorage.setItem('portal_custom_bg_end_light', '#f3e8ff');
                        } else if (val === 'blue') {
                          setCustomColor1Light('#3b82f6'); localStorage.setItem('portal_custom_color1_light', '#3b82f6');
                          setCustomColor2Light('#06b6d4'); localStorage.setItem('portal_custom_color2_light', '#06b6d4');
                          setCustomBgStartLight('#ffffff'); localStorage.setItem('portal_custom_bg_start_light', '#ffffff');
                          setCustomBgEndLight('#eff6ff'); localStorage.setItem('portal_custom_bg_end_light', '#eff6ff');
                        } else if (val === 'red') {
                          setCustomColor1Light('#dc2626'); localStorage.setItem('portal_custom_color1_light', '#dc2626');
                          setCustomColor2Light('#f87171'); localStorage.setItem('portal_custom_color2_light', '#f87171');
                          setCustomBgStartLight('#ffffff'); localStorage.setItem('portal_custom_bg_start_light', '#ffffff');
                          setCustomBgEndLight('#fee2e2'); localStorage.setItem('portal_custom_bg_end_light', '#fee2e2');
                        } else if (val === 'green') {
                          setCustomColor1Light('#10b981'); localStorage.setItem('portal_custom_color1_light', '#10b981');
                          setCustomColor2Light('#34d399'); localStorage.setItem('portal_custom_color2_light', '#34d399');
                          setCustomBgStartLight('#ffffff'); localStorage.setItem('portal_custom_bg_start_light', '#ffffff');
                          setCustomBgEndLight('#d1fae5'); localStorage.setItem('portal_custom_bg_end_light', '#d1fae5');
                        } else if (val === 'black') {
                          setCustomColor1Light('#1f2937'); localStorage.setItem('portal_custom_color1_light', '#1f2937');
                          setCustomColor2Light('#9ca3af'); localStorage.setItem('portal_custom_color2_light', '#9ca3af');
                          setCustomBgStartLight('#ffffff'); localStorage.setItem('portal_custom_bg_start_light', '#ffffff');
                          setCustomBgEndLight('#f3f4f6'); localStorage.setItem('portal_custom_bg_end_light', '#f3f4f6');
                        } else if (val === 'pink') {
                          setCustomColor1Light('#db2777'); localStorage.setItem('portal_custom_color1_light', '#db2777');
                          setCustomColor2Light('#fbcfe8'); localStorage.setItem('portal_custom_color2_light', '#fbcfe8');
                          setCustomBgStartLight('#ffffff'); localStorage.setItem('portal_custom_bg_start_light', '#ffffff');
                          setCustomBgEndLight('#fce7f3'); localStorage.setItem('portal_custom_bg_end_light', '#fce7f3');
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-250 cursor-pointer focus:outline-none focus:border-[#8b5cf6] font-bold transition-all"
                    >
                      <option value="purple">🌌 Purple Preset (White + Purple)</option>
                      <option value="blue">🔵 Blue Preset (White + Blue)</option>
                      <option value="red">🩸 Red Preset (White + Red)</option>
                      <option value="green">🟢 Green Preset (White + Green)</option>
                      <option value="black">🌑 Black Preset (White + Black)</option>
                      <option value="pink">🌸 Pink Preset (White + Pink)</option>
                      <option value="custom">🎨 Custom Color Mix</option>
                    </select>
                  </div>

                  {/* Dark Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">🌌 Dark Mode Theme Preset</label>
                    <select
                      value={darkThemePreset}
                      onChange={(e) => {
                        haptic(10);
                        const val = e.target.value;
                        setDarkThemePreset(val as any);
                        localStorage.setItem('portal_dark_theme_preset', val);
                        
                        // Initialize custom states so they can tweak them immediately
                        if (val === 'purple') {
                          setCustomColor1Dark('#8b5cf6'); localStorage.setItem('portal_custom_color1_dark', '#8b5cf6');
                          setCustomColor2Dark('#ec4899'); localStorage.setItem('portal_custom_color2_dark', '#ec4899');
                          setCustomBgStartDark('#0d0221'); localStorage.setItem('portal_custom_bg_start_dark', '#0d0221');
                          setCustomBgEndDark('#25023a'); localStorage.setItem('portal_custom_bg_end_dark', '#25023a');
                        } else if (val === 'blue') {
                          setCustomColor1Dark('#3b82f6'); localStorage.setItem('portal_custom_color1_dark', '#3b82f6');
                          setCustomColor2Dark('#06b6d4'); localStorage.setItem('portal_custom_color2_dark', '#06b6d4');
                          setCustomBgStartDark('#020817'); localStorage.setItem('portal_custom_bg_start_dark', '#020817');
                          setCustomBgEndDark('#0b1528'); localStorage.setItem('portal_custom_bg_end_dark', '#0b1528');
                        } else if (val === 'red') {
                          setCustomColor1Dark('#dc2626'); localStorage.setItem('portal_custom_color1_dark', '#dc2626');
                          setCustomColor2Dark('#000000'); localStorage.setItem('portal_custom_color2_dark', '#000000');
                          setCustomBgStartDark('#1a0505'); localStorage.setItem('portal_custom_bg_start_dark', '#1a0505');
                          setCustomBgEndDark('#050000'); localStorage.setItem('portal_custom_bg_end_dark', '#050000');
                        } else if (val === 'green') {
                          setCustomColor1Dark('#10b981'); localStorage.setItem('portal_custom_color1_dark', '#10b981');
                          setCustomColor2Dark('#db2777'); localStorage.setItem('portal_custom_color2_dark', '#db2777');
                          setCustomBgStartDark('#021a0c'); localStorage.setItem('portal_custom_bg_start_dark', '#021a0c');
                          setCustomBgEndDark('#000000'); localStorage.setItem('portal_custom_bg_end_dark', '#000000');
                        } else if (val === 'black') {
                          setCustomColor1Dark('#ffffff'); localStorage.setItem('portal_custom_color1_dark', '#ffffff');
                          setCustomColor2Dark('#1f2937'); localStorage.setItem('portal_custom_color2_dark', '#1f2937');
                          setCustomBgStartDark('#050505'); localStorage.setItem('portal_custom_bg_start_dark', '#050505');
                          setCustomBgEndDark('#121212'); localStorage.setItem('portal_custom_bg_end_dark', '#121212');
                        } else if (val === 'pink') {
                          setCustomColor1Dark('#db2777'); localStorage.setItem('portal_custom_color1_dark', '#db2777');
                          setCustomColor2Dark('#8b5cf6'); localStorage.setItem('portal_custom_color2_dark', '#8b5cf6');
                          setCustomBgStartDark('#260218'); localStorage.setItem('portal_custom_bg_start_dark', '#260218');
                          setCustomBgEndDark('#0d0008'); localStorage.setItem('portal_custom_bg_end_dark', '#0d0008');
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-250 cursor-pointer focus:outline-none focus:border-[#8b5cf6] font-bold transition-all"
                    >
                      <option value="purple">🌌 Purple Preset (Purple + Pink)</option>
                      <option value="blue">🔵 Blue Preset (Blue + Cyan)</option>
                      <option value="red">🩸 Red Preset (Red + Black)</option>
                      <option value="green">🟢 Green Preset (Green + Pink)</option>
                      <option value="black">🌑 Black Preset (Monochrome)</option>
                      <option value="pink">🌸 Pink Preset (Pink + Purple)</option>
                      <option value="custom">🎨 Custom Color Mix</option>
                    </select>
                  </div>
                </div>

                {/* Light Mode Custom Color Pickers Panel */}
                {lightThemePreset === 'custom' && (
                  <div className="p-3 bg-white/60 dark:bg-[#12082b]/30 border border-slate-200/40 dark:border-white/5 rounded-xl space-y-3.5 animate-[fadeIn_0.25s_ease-out]">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-[#8b5cf6] block text-left">
                      🎨 Custom Light Mode Color Mix Matrix
                    </span>
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="flex flex-col text-left gap-1">
                          <label className="text-[9px] font-bold text-slate-505 uppercase">Light Main Color</label>
                          <select
                            value={getColorPresetValue(customColor1Light)}
                            onChange={(e) => handlePresetColorChange(e.target.value, setCustomColor1Light, 'portal_custom_color1_light')}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-250 cursor-pointer focus:outline-none"
                          >
                            {THEME_PRESET_COLORS.map(c => (
                              <option key={c.name} value={c.name.toLowerCase()}>{c.name}</option>
                            ))}
                            <option value="custom">🎨 Custom Hex Picker</option>
                          </select>
                          {getColorPresetValue(customColor1Light) === 'custom' && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <input 
                                type="color" 
                                value={customColor1Light} 
                                onChange={(e) => {
                                  setCustomColor1Light(e.target.value);
                                  localStorage.setItem('portal_custom_color1_light', e.target.value);
                                }}
                                className="w-8 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                              />
                              <span className="text-[10px] font-mono text-slate-600 uppercase">{customColor1Light}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col text-left gap-1">
                          <label className="text-[9px] font-bold text-slate-505 uppercase">Light Trim Color</label>
                          <select
                            value={getColorPresetValue(customColor2Light)}
                            onChange={(e) => handlePresetColorChange(e.target.value, setCustomColor2Light, 'portal_custom_color2_light')}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-250 cursor-pointer focus:outline-none"
                          >
                            {THEME_PRESET_COLORS.map(c => (
                              <option key={c.name} value={c.name.toLowerCase()}>{c.name}</option>
                            ))}
                            <option value="custom">🎨 Custom Hex Picker</option>
                          </select>
                          {getColorPresetValue(customColor2Light) === 'custom' && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <input 
                                type="color" 
                                value={customColor2Light} 
                                onChange={(e) => {
                                  setCustomColor2Light(e.target.value);
                                  localStorage.setItem('portal_custom_color2_light', e.target.value);
                                }}
                                className="w-8 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                              />
                              <span className="text-[10px] font-mono text-slate-600 uppercase">{customColor2Light}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 border-t border-slate-200/40 pt-3">
                        <div className="flex flex-col text-left gap-1">
                          <label className="text-[9px] font-bold text-slate-505 uppercase">Background Start</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={customBgStartLight} 
                              onChange={(e) => {
                                setCustomBgStartLight(e.target.value);
                                localStorage.setItem('portal_custom_bg_start_light', e.target.value);
                              }}
                              className="w-8 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                            />
                            <span className="text-[10px] font-mono text-slate-600 uppercase">{customBgStartLight}</span>
                          </div>
                        </div>
                        <div className="flex flex-col text-left gap-1">
                          <label className="text-[9px] font-bold text-slate-505 uppercase">Background End</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={customBgEndLight} 
                              onChange={(e) => {
                                setCustomBgEndLight(e.target.value);
                                localStorage.setItem('portal_custom_bg_end_light', e.target.value);
                              }}
                              className="w-8 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                            />
                            <span className="text-[10px] font-mono text-slate-600 uppercase">{customBgEndLight}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dark Mode Custom Color Pickers Panel */}
                {darkThemePreset === 'custom' && (
                  <div className="p-3 bg-white/60 dark:bg-[#12082b]/30 border border-slate-200/40 dark:border-white/5 rounded-xl space-y-3.5 animate-[fadeIn_0.25s_ease-out]">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-[#8b5cf6] block text-left">
                      🎨 Custom Dark Mode Color Mix Matrix
                    </span>
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="flex flex-col text-left gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Dark Main Color</label>
                          <select
                            value={getColorPresetValue(customColor1Dark)}
                            onChange={(e) => handlePresetColorChange(e.target.value, setCustomColor1Dark, 'portal_custom_color1_dark')}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-250 cursor-pointer focus:outline-none"
                          >
                            {THEME_PRESET_COLORS.map(c => (
                              <option key={c.name} value={c.name.toLowerCase()}>{c.name}</option>
                            ))}
                            <option value="custom">🎨 Custom Hex Picker</option>
                          </select>
                          {getColorPresetValue(customColor1Dark) === 'custom' && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <input 
                                type="color" 
                                value={customColor1Dark} 
                                onChange={(e) => {
                                  setCustomColor1Dark(e.target.value);
                                  localStorage.setItem('portal_custom_color1_dark', e.target.value);
                                }}
                                className="w-8 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
                              />
                              <span className="text-[10px] font-mono text-slate-350 uppercase">{customColor1Dark}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col text-left gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Dark Trim Color</label>
                          <select
                            value={getColorPresetValue(customColor2Dark)}
                            onChange={(e) => handlePresetColorChange(e.target.value, setCustomColor2Dark, 'portal_custom_color2_dark')}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-250 cursor-pointer focus:outline-none"
                          >
                            {THEME_PRESET_COLORS.map(c => (
                              <option key={c.name} value={c.name.toLowerCase()}>{c.name}</option>
                            ))}
                            <option value="custom">🎨 Custom Hex Picker</option>
                          </select>
                          {getColorPresetValue(customColor2Dark) === 'custom' && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <input 
                                type="color" 
                                value={customColor2Dark} 
                                onChange={(e) => {
                                  setCustomColor2Dark(e.target.value);
                                  localStorage.setItem('portal_custom_color2_dark', e.target.value);
                                }}
                                className="w-8 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
                              />
                              <span className="text-[10px] font-mono text-slate-350 uppercase">{customColor2Dark}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 border-t border-slate-200/40 dark:border-white/5 pt-3">
                        <div className="flex flex-col text-left gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Background Start</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={customBgStartDark} 
                              onChange={(e) => {
                                setCustomBgStartDark(e.target.value);
                                localStorage.setItem('portal_custom_bg_start_dark', e.target.value);
                              }}
                              className="w-8 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-slate-350 uppercase">{customBgStartDark}</span>
                          </div>
                        </div>
                        <div className="flex flex-col text-left gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Background End</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={customBgEndDark} 
                              onChange={(e) => {
                                setCustomBgEndDark(e.target.value);
                                localStorage.setItem('portal_custom_bg_end_dark', e.target.value);
                              }}
                              className="w-8 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-slate-350 uppercase">{customBgEndDark}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Portal Theme Mode */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">Portal Theme Mode</span>
                    <span className="text-[9px] text-slate-400">Select between Light (White) or Dark (Purple) cosmic mode.</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#ebedfa]/45 border border-slate-200/30 p-1 rounded-full shrink-0">
                    <button 
                      onClick={() => { haptic(10); if (portalDarkMode) togglePortalDarkMode(); }}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${!portalDarkMode ? 'text-white shadow-sm' : 'text-slate-400 dark:text-slate-200 opacity-60'}`}
                      style={!portalDarkMode ? {
                        background: 'var(--theme-btn-gradient)',
                        boxShadow: '0 0 10px var(--theme-card-border)',
                      } : undefined}
                    >
                      ☀️ Light
                    </button>
                    <button 
                      onClick={() => { haptic(10); if (!portalDarkMode) togglePortalDarkMode(); }}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${portalDarkMode ? 'text-white shadow-sm' : 'text-slate-400 dark:text-slate-200 opacity-60'}`}
                      style={portalDarkMode ? {
                        background: 'var(--theme-btn-gradient)',
                        boxShadow: '0 0 10px var(--theme-card-border)',
                      } : undefined}
                    >
                      🌌 Dark
                    </button>
                  </div>
                </div>

                {/* Motion Toggle */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">Motion & Stars</span>
                    <span className="text-[9px] text-slate-400">Calibrate animations and background ambient starfield drift.</span>
                  </div>
                  <button 
                    onClick={() => {
                      haptic(10);
                      const newVal = !settingsMotion;
                      setSettingsMotion(newVal);
                      localStorage.setItem('portal_settings_motion', String(newVal));
                    }}
                    className={`w-8 h-4 rounded-full relative p-0.5 transition-colors cursor-pointer ${settingsMotion ? 'bg-purple-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settingsMotion ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Custom Video Uploader */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-700">Background Portal Video</span>
                      <span className="text-[9px] text-slate-400 font-medium">Bind a custom looping background media overlay.</span>
                    </div>
                    {bgVideoUrl && (
                      <button 
                        onClick={handleRevertBgVideo}
                        className="text-[9px] font-semibold text-rose-500 hover:underline bg-rose-500/5 px-2 py-1 rounded border border-rose-500/20 cursor-pointer"
                      >
                        Revert to Nebula
                      </button>
                    )}
                  </div>

                  {!bgVideoUrl ? (
                    <div className="border border-dashed border-purple-500/30 bg-purple-500/5 rounded-xl p-4 text-center cursor-pointer hover:bg-purple-500/10 transition-all flex flex-col items-center justify-center gap-2 relative group/dropzone">
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={handleBgVideoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-purple-700">Select or Drag & Drop Background Video</span>
                      <span className="text-[8px] text-slate-400 font-mono">Supports MP4, WEBM (Max 50MB)</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 p-3.5 bg-white/60 border border-slate-200/40 rounded-xl">
                      {/* Opacity slider */}
                      <div className="flex items-center justify-between gap-3 text-[10px]">
                        <span className="text-slate-600 font-medium">Opacity: {bgVideoOpacity}%</span>
                        <input 
                          type="range" 
                          min="5" 
                          max="100" 
                          value={bgVideoOpacity} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setBgVideoOpacity(val);
                            localStorage.setItem('portal_bg_video_opacity', String(val));
                          }}
                          className="w-32 accent-purple-600"
                        />
                      </div>
                      
                      {/* Blur slider */}
                      <div className="flex items-center justify-between gap-3 text-[10px]">
                        <span className="text-slate-600 font-medium">Blur: {bgVideoBlur}px</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="25" 
                          value={bgVideoBlur} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setBgVideoBlur(val);
                            localStorage.setItem('portal_bg_video_blur', String(val));
                          }}
                          className="w-32 accent-purple-600"
                        />
                      </div>

                      {/* Brightness slider */}
                      <div className="flex items-center justify-between gap-3 text-[10px]">
                        <span className="text-slate-600 font-medium">Brightness: {bgVideoBrightness}%</span>
                        <input 
                          type="range" 
                          min="10" 
                          max="150" 
                          value={bgVideoBrightness} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setBgVideoBrightness(val);
                            localStorage.setItem('portal_bg_video_brightness', String(val));
                          }}
                          className="w-32 accent-purple-600"
                        />
                      </div>

                      {/* Hue slider */}
                      <div className="flex items-center justify-between gap-3 text-[10px]">
                        <span className="text-slate-600 font-medium">Hue Shift: {bgVideoHue}°</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="360" 
                          value={bgVideoHue} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setBgVideoHue(val);
                            localStorage.setItem('portal_bg_video_hue', String(val));
                          }}
                          className="w-32 accent-purple-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. FEEDBACK */}
              <div className="glass-panel border border-indigo-500/15 bg-indigo-500/5 hover:border-indigo-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" />
                  Tactile & Audio Feedback
                </span>

                {/* Haptics toggle */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">Haptic Tap Feedback</span>
                    <span className="text-[9px] text-slate-400">Trigger tactile motor rumble responses on Android devices.</span>
                  </div>
                  <button 
                    onClick={() => {
                      haptic(10);
                      const newVal = !hapticsActive;
                      setHapticsActive(newVal);
                      localStorage.setItem('portal_haptics_active', String(newVal));
                    }}
                    className={`w-8 h-4 rounded-full relative p-0.5 transition-colors cursor-pointer ${hapticsActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${hapticsActive ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Sound toggle */}
                <div className="flex justify-between items-center py-1.5">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">Interface Sounds</span>
                    <span className="text-[9px] text-slate-400">Synthesize soft audio tones on dice roll land and action clicks.</span>
                  </div>
                  <button 
                    onClick={() => {
                      haptic(10);
                      const newVal = !soundActive;
                      setSoundActive(newVal);
                      localStorage.setItem('portal_sound_active', String(newVal));
                    }}
                    className={`w-8 h-4 rounded-full relative p-0.5 transition-colors cursor-pointer ${soundActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${soundActive ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* 6. AMBIENT SOUNDSCAPES */}
              <div className="glass-panel border border-purple-500/15 bg-purple-500/5 hover:border-purple-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  Ambient Soundscapes Synthesizer
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Synthesize warm, immersive, background atmosphere loops in real-time completely on your local machine using the Web Audio API.
                </p>

                {/* Select mood */}
                <div className="flex justify-between items-center py-1 text-[11px]">
                  <span className="text-slate-600 font-bold">Select Mood</span>
                  <select 
                    value={soundscapeMood}
                    onChange={(e) => {
                      haptic(5);
                      setSoundscapeMood(e.target.value as any);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-purple-500 w-40"
                  >
                    <option value="space">🌌 Deep Space Hum</option>
                    <option value="campfire">🔥 Cozy Campfire</option>
                    <option value="chimes">🔮 Astral Chimes</option>
                  </select>
                </div>

                {/* Volume slider */}
                <div className="flex justify-between items-center py-1 text-[11px]">
                  <span className="text-slate-600 font-bold flex items-center gap-1">
                    {soundscapeVol === 0 ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-purple-600" />}
                    Volume
                  </span>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.1" 
                    step="0.01" 
                    value={soundscapeVol}
                    onChange={(e) => setSoundscapeVol(parseFloat(e.target.value))}
                    className="w-40 accent-purple-600" 
                  />
                </div>

                {/* Synth button */}
                <button 
                  onClick={() => {
                    haptic(10);
                    if (soundscapeActive) {
                      stopSoundscape();
                    } else {
                      startSoundscape();
                    }
                  }}
                  className="w-full py-2.5 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer active:scale-95 hover:shadow-[0_0_24px_var(--theme-card-border)] flex items-center justify-center gap-1.5"
                  style={{
                    background: 'var(--theme-btn-gradient)',
                    boxShadow: '0 0 16px var(--theme-card-border)',
                  }}
                >
                  {soundscapeActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {soundscapeActive ? 'STOP AMBIENT' : 'PLAY AMBIENT'}
                </button>
              </div>

              {/* 7. DICE OPTIONS */}
              <div className="glass-panel border border-indigo-500/15 bg-indigo-500/5 hover:border-indigo-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Dices className="w-3.5 h-3.5" />
                  Dice Configuration
                </span>

                {/* Default die select */}
                <div className="flex justify-between items-center py-1 text-[11px] border-b border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">Default Die</span>
                    <span className="text-[9px] text-slate-400">Pre-select default polyhedral choice when launching the tray.</span>
                  </div>
                  <select 
                    value={defaultDie}
                    onChange={(e) => {
                      haptic(5);
                      setDefaultDie(e.target.value);
                      localStorage.setItem('portal_default_die', e.target.value);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 w-32"
                  >
                    <option value="2">Coin</option>
                    <option value="4">d4</option>
                    <option value="6">d6</option>
                    <option value="8">d8</option>
                    <option value="10">d10</option>
                    <option value="12">d12</option>
                    <option value="20">d20</option>
                    <option value="100">d100</option>
                  </select>
                </div>

                {/* Auto Coin Greeting flip */}
                <div className="flex justify-between items-center py-1">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">Greeting flip</span>
                    <span className="text-[9px] text-slate-400">Automatically trigger coin flip greetings on startup.</span>
                  </div>
                  <button 
                    onClick={() => {
                      haptic(10);
                      const newVal = !greetingCoinFlip;
                      setGreetingCoinFlip(newVal);
                      localStorage.setItem('portal_greeting_coin_flip', String(newVal));
                    }}
                    className={`w-8 h-4 rounded-full relative p-0.5 transition-colors cursor-pointer ${greetingCoinFlip ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${greetingCoinFlip ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
              </div>
              )}

              {settingsSubTab === 'session' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* 8. YOUR DATA */}
              <div className="glass-panel border border-purple-500/15 bg-purple-500/5 hover:border-purple-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Your Data & Offline Backups
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Everything you enter — notes, sheet, tasks, roll history — stays only on this device. Nothing is sent anywhere. Export to take your data to other devices!
                </p>

                <div className="flex flex-wrap gap-2 pt-1.5">
                  <button 
                    onClick={() => {
                      haptic(15);
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
                      const dlAnchorElem = document.createElement('a');
                      dlAnchorElem.setAttribute("href", dataStr);
                      dlAnchorElem.setAttribute("download", `nextgenportal_backup_${Date.now()}.json`);
                      dlAnchorElem.click();
                      toast("Backup downloaded successfully!", "success");
                    }}
                    className="flex-1 min-w-[110px] py-2 text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all duration-300 active:scale-95 hover:shadow-[0_0_20px_var(--theme-card-border)] flex items-center justify-center gap-1"
                    style={{
                      background: 'var(--theme-btn-gradient)',
                      boxShadow: '0 0 12px var(--theme-card-border)',
                    }}
                  >
                    <Download className="w-3 h-3" />
                    Export Backup
                  </button>
                  <label 
                    className="flex-1 min-w-[110px] py-2 text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all duration-300 active:scale-95 hover:shadow-[0_0_20px_var(--theme-card-border)] text-center flex items-center justify-center gap-1 relative"
                    style={{
                      background: 'var(--theme-btn-gradient)',
                      boxShadow: '0 0 12px var(--theme-card-border)',
                    }}
                  >
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const data = JSON.parse(event.target?.result as string);
                              Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
                              toast("Backup imported! Reloading...", "success");
                              setTimeout(() => window.location.reload(), 1000);
                            } catch {
                              toast("Failed to parse backup file.", "error");
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <Sparkles className="w-3 h-3" />
                    Import Backup
                  </label>
                  <button 
                    onClick={() => {
                      haptic(30);
                      if (confirm("Are you absolutely sure you want to wipe all local data? This cannot be undone.")) {
                        localStorage.clear();
                        toast("All local data wiped. Resetting...", "warn");
                        setTimeout(() => window.location.reload(), 1200);
                      }
                    }}
                    className="flex-1 min-w-[110px] py-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 hover:border-rose-500/40 rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear Data
                  </button>
                </div>
              </div>

              {/* 9. OFFLINE AI BRAIN */}
              <div className="glass-panel border border-indigo-500/15 bg-indigo-500/5 hover:border-indigo-500/35 transition-all duration-300 rounded-2xl p-5 space-y-4 group">
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    Offline Local Companion AI Engine
                  </span>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border shrink-0 ${
                    localAIStatus === 'not_installed' ? 'bg-amber-950/20 text-amber-600 border-amber-500/30' :
                    localAIStatus === 'downloading' ? 'bg-blue-950/20 text-blue-500 border-blue-400/30 animate-pulse' :
                    localAIStatus === 'installed' ? 'bg-teal-950/20 text-teal-600 border-teal-400/30' :
                    localAIStatus === 'loading' ? 'bg-purple-950/20 text-purple-600 border-purple-400/30 animate-pulse' :
                    localAIStatus === 'ready' ? 'bg-green-950/20 text-green-600 border-green-500/30' :
                    'bg-red-950/20 text-red-600 border-red-500/30'
                  }`}>
                    {localAIStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {localAIStatus === 'not_installed' && 'The 1.5B Qwen model is not downloaded. You need a one-time download (~3GB) to run the AI completely offline.'}
                  {localAIStatus === 'downloading' && 'Downloading the 1.5B Qwen model files from Hugging Face... This can take 5-15 minutes depending on your internet connection.'}
                  {localAIStatus === 'installed' && "Model is downloaded and ready to run. Press 'Start' to load it into memory."}
                  {localAIStatus === 'loading' && 'Loading model weights into memory... Please wait.'}
                  {localAIStatus === 'ready' && 'Local offline AI is running and ready to chat. Fully private and unlimited.'}
                  {localAIStatus === 'error' && `Error: ${localAIEngineError || 'Failed to initialize.'}`}
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {localAIStatus === 'not_installed' && (
                    <button
                      onClick={() => triggerLocalAIAction('download')}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Download AI (3GB)
                    </button>
                  )}
                  {localAIStatus === 'downloading' && (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold cursor-not-allowed border border-slate-200"
                    >
                      Downloading files...
                    </button>
                  )}
                  {localAIStatus === 'installed' && (
                    <>
                      <button
                        onClick={() => triggerLocalAIAction('start')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Start Offline AI
                      </button>
                      <button
                        onClick={() => triggerLocalAIAction('delete')}
                        className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Delete Weights
                      </button>
                    </>
                  )}
                  {localAIStatus === 'loading' && (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold cursor-not-allowed animate-pulse border border-slate-200"
                    >
                      Warming up memory...
                    </button>
                  )}
                  {localAIStatus === 'ready' && (
                    <>
                      <button
                        onClick={() => triggerLocalAIAction('stop')}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Stop Offline AI (Free RAM)
                      </button>
                      <button
                        onClick={() => triggerLocalAIAction('delete')}
                        className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Delete Weights
                      </button>
                    </>
                  )}
                  {localAIStatus === 'error' && (
                    <>
                      <button
                        onClick={() => triggerLocalAIAction('download')}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Retry Download
                      </button>
                      <button
                        onClick={() => triggerLocalAIAction('delete')}
                        className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Clean Cache
                      </button>
                    </>
                  )}
                </div>
              </div>
              </div>
              )}

              {settingsSubTab === 'appearance' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* 10. SYSTEM ABOUT INFO */}
                  <div className="glass-panel border border-slate-200 bg-white/40 dark:bg-purple-950/5 dark:border-white/5 rounded-2xl p-5 space-y-2 group">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">About NextGen OS</span>
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      The Portal — a next-generation desktop shell and companion OS for your games and utilities. Roll fair dice, log notes, chat with local offline AI, test pages, and manage backups locally.
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono pt-1">
                      <span>Version 2.4.0 (Aether Core)</span>
                      <span>•</span>
                      <span>Powered by React & Vite</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* AI CHAT ASSISTANT PANEL (RIGHT SIDEBAR COLUMN) EXACTLY MATCHING THE IMAGE SPEC */}
        <aside id="right-panels" className={`fixed xl:static top-14 bottom-0 right-0 z-40 border-l border-slate-200/40 bg-white/75 xl:bg-white/55 backdrop-blur-xl flex flex-col gap-5 overflow-y-auto transition-all duration-300 shadow-2xl xl:shadow-none xl:relative ${
          showRightSidebar 
            ? 'w-72 p-4 translate-x-0 opacity-100 pointer-events-auto' 
            : 'w-0 xl:w-0 p-0 opacity-0 translate-x-full xl:translate-x-0 xl:border-l-0 pointer-events-none'
        }`}>
          
          {/* Section: AI Assistant Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">AI Assistant</span>
              <button 
                onClick={() => alert("Access AI Assistant system config...")} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                •••
              </button>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-cyan-500/15 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/35 transition-all duration-300 space-y-4 group text-left">
              
              {/* Profile Capsule */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full bg-white border flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105"
                  style={{ 
                    borderColor: '#22d3ee50',
                    filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.35))'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-50 to-blue-100" />
                  <div className="w-5 h-5 rounded-full border border-dashed animate-[spin_6s_linear_infinite]" style={{ borderColor: '#06b6d4' }} />
                  {/* Status Indicator */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white pulse-circle bg-emerald-400" />
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800">NextGenPortal</span>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono mt-0.5">
                    <span className="text-slate-400 font-bold uppercase">
                      {localAIStatus === 'ready' ? 'READY' :
                       localAIStatus === 'not_installed' ? 'OFFLINE' :
                       localAIStatus.replace('_', ' ')}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <span className="text-purple-600 font-bold">UNLIMITED</span>
                  </div>
                </div>
              </div>

              {/* Mini conversation frame or Quick prompt input */}
              <form onSubmit={(e) => handleSendChatMessage(e)} className="relative">
                <input 
                  type="text"
                  placeholder="Ask me anything..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="w-full bg-slate-100/50 border border-slate-200/50 rounded-md px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </form>

              {/* Suggestions clicks directly from reference image */}
              <div className="space-y-1.5">
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Explain quantum physics")}
                  className="w-full py-1.5 px-3 rounded bg-slate-50/50 border border-slate-200/30 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left truncate block cursor-pointer"
                >
                  Explain quantum physics
                </button>
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Write Python code")}
                  className="w-full py-1.5 px-3 rounded bg-slate-50/50 border border-slate-200/30 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left truncate block cursor-pointer"
                >
                  Write Python code
                </button>
                <button 
                  onClick={() => handleSendChatMessage(undefined, "Summarize this document")}
                  className="w-full py-1.5 px-3 rounded bg-slate-50/50 border border-slate-200/30 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left truncate block cursor-pointer"
                >
                  Summarize this document
                </button>
              </div>

              {/* Start new chat button */}
              <button 
                id="right-new-chat-btn"
                onClick={() => {
                  setAiHistory([{ role: 'model', content: 'New optimal thread initialized.' }]);
                  setActiveTab('chat');
                }}
                className="w-full py-2 text-white rounded-md text-[10px] font-bold transition-all tracking-wider cursor-pointer active:scale-95 hover:shadow-[0_0_20px_var(--theme-card-border)]"
                style={{
                  background: 'var(--theme-btn-gradient)',
                  boxShadow: '0 0 12px var(--theme-card-border)',
                }}
              >
                Start New Chat
              </button>
            </div>
          </div>

          {/* Section: Upcoming Alarms exactly from reference image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Upcoming Alarms</span>
              <button 
                onClick={() => setActiveTab('alarms')} 
                className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div 
              className="glass-panel p-3 rounded-xl border transition-all duration-300 space-y-3 group text-left bg-white/45 dark:bg-slate-950/20"
              style={{ borderColor: 'var(--theme-card-border)', boxShadow: '0 4px 12px var(--theme-card-border)' }}
            >
              {alarms.map(alarm => (
                <div key={alarm.id} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2.5">
                    <AlarmClock className="w-4 h-4 transition-all duration-300 group-hover:scale-110" style={{ color: 'var(--theme-accent-color1)', filter: 'drop-shadow(0 0 8px var(--theme-card-border))' }} />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{alarm.time}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{alarm.label}</span>
                    </div>
                  </div>

                  {/* Toggle button */}
                  <button 
                    id={`toggle-alarm-${alarm.id}`}
                    onClick={() => {
                      setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: !a.active } : a));
                    }}
                    className="w-8 h-4 rounded-full relative p-0.5 transition-colors cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                    style={alarm.active ? { background: 'var(--theme-btn-gradient)' } : undefined}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-all ${alarm.active ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Games You Play exactly from reference image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Games You Play</span>
              <button 
                onClick={() => setActiveTab('games')} 
                className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div 
              className="glass-panel p-3.5 rounded-xl border transition-all duration-300 space-y-3 group text-left bg-white/45 dark:bg-slate-950/20"
              style={{ borderColor: 'var(--theme-card-border)', boxShadow: '0 4px 12px var(--theme-card-border)' }}
            >
              {[
                { name: 'Neon Drift', category: 'Racing', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=128' },
                { name: 'Void Raiders', category: 'Action', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=128' },
                { name: 'Mystic Realms', category: 'RPG', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=128' },
                { name: 'Puzzle Mind', category: 'Puzzle', img: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=128' }
              ].map((game, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setActiveTab('games');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <img src={game.img} alt={game.name} className="w-10 h-7 rounded object-cover border border-slate-200/30 transition-all" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{game.name}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{game.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: System Status with Glowing Cyan Radial Gauge */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">System Status</span>

            <div className="glass-panel p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/35 transition-all duration-300 space-y-4 group">
              
              {/* Radial Circle Optimal ring */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  {/* Gray background track */}
                  <circle 
                    cx="48" cy="48" r="38" 
                    className="stroke-slate-100 fill-none stroke-[6]"
                  />
                  {/* Glowing active purple/theme ring path */}
                  <circle 
                    cx="48" cy="48" r="38" 
                    className="fill-none stroke-[6]"
                    stroke={getThemeHex()}
                    strokeDasharray="238"
                    strokeDashoffset="0"
                    style={{ filter: `drop-shadow(0 0 6px ${getThemeHex()}50)` }}
                  />
                </svg>

                {/* Core ring status text exactly like image */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-base font-black font-mono text-slate-800 leading-none">100%</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide mt-1">All Systems</span>
                  <span className="text-[8px] font-bold font-mono" style={{ color: getThemeHex() }}>Optimal</span>
                </div>
              </div>

              {/* Status List with dots exactly matching reference color tags */}
              <div className="space-y-2 border-t border-slate-200/50 pt-3 text-[10px] font-mono text-slate-400 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Storage</span>
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    512 GB Free
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Memory</span>
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    8.0 GB
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Battery</span>
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    100%
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Offline AI</span>
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    Ready
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
              </div>

            </div>
          </div>

        </aside>

      </div>

      {/* FOOTER RADIO / MEDIA RAIL AT THE ABSOLUTE BOTTOM */}
      <footer id="bottom-status-rail" className="bg-[#02020a] border-t border-white/[0.04] p-4 relative z-40">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
          
          {/* Left Audio controller suite with real synthesized loop */}
          <div className="flex-1 w-full xl:max-w-2xl">
            <AudioPlayer themeColor={themeColor} />
          </div>

          {/* Right statuses info and system time indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono text-slate-400">
            
            {/* Status Item: Offline AI */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950 border border-white/5">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Offline AI:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                Ready
              </span>
            </div>

            {/* Status Item: No Internet */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950 border border-white/5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>No Internet:</span>
              <span className="text-emerald-400 font-bold">All Systems Go</span>
            </div>

            {/* Simulated Live Clock matching design exactly */}
            <div className="flex flex-col text-right pl-3 border-l border-white/10">
              <span className="text-white font-bold leading-none text-xs">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

          </div>

        </div>
      </footer>

      {/* FULL COMMAND PALETTE POP-UP (CTRL+K OVERLAY) */}
      {showSearchPalette && (
        <div className="fixed inset-0 bg-[#000000b0] backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-xl bg-[#060613] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search className="w-5 h-5 text-purple-400" />
              <input 
                type="text"
                placeholder="Search portal panels, features, or system commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 font-medium"
                autoFocus
              />
              <button 
                onClick={() => setShowSearchPalette(false)}
                className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-[320px] overflow-y-auto">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 px-3 py-2 font-bold select-none">
                Available Portal Systems
              </div>
              <div className="space-y-0.5">
                {QUICK_ACCESS.filter(item => 
                  item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.desc.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowSearchPalette(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-purple-500/15 border border-purple-500/20">
                          <Icon className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{item.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono">/open</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-white/10 bg-slate-950/80 text-[10px] text-slate-500 font-mono flex justify-between items-center select-none">
              <span>Press <kbd className="text-slate-400">ESC</kbd> to close</span>
              <span>Use arrows to navigate</span>
            </div>
          </div>
        </div>
      )}

      {/* INJECT ANIMATION STYLES */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-110%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        @keyframes custom-pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) scale(1.05); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-2px, -1px) scale(1.05); }
          20%, 40%, 60%, 80% { transform: translate(2px, 1px) scale(1.05); }
        }
        .animate-scanline {
          animation: scanline 2.5s linear infinite;
        }
        .animate-custom-pulse {
          animation: custom-pulse 1.8s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.3s linear infinite;
        }
      `}</style>

      {/* FLOATING CLASSIC HARDWARE HOME BUTTON - 1S HOLD TO ENGAGE LOCAL AI */}
      <div className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none transition-all duration-300 ${
        isScanning ? 'opacity-100' : 'opacity-10 hover:opacity-100 focus-within:opacity-100'
      }`}>
        
        <button
          id="portal-fingerprint-button"
          onMouseDown={handleScanStart}
          onMouseUp={handleScanEnd}
          onMouseLeave={handleScanEnd}
          onTouchStart={handleScanStart}
          onTouchEnd={handleScanEnd}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer bg-white/70 border border-slate-300/40 shadow-lg backdrop-blur-md hover:border-slate-400 hover:bg-white active:scale-95"
          title="Hold 1 second for AI, Click for Home"
        >
          {/* Inner classic home button circle */}
          <div className="w-8.5 h-8.5 rounded-full border border-slate-200/50 flex items-center justify-center bg-slate-50/50 shadow-inner">
            <Home 
              className={`w-4.5 h-4.5 transition-colors duration-300 ${
                isScanning ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            />
          </div>
        </button>
      </div>

      {/* CONDITIONALLY RENDERED COGNITIVE DECOY AI MAINFRAME CHATBOT OVERLAY */}
      {showDecoyAi && (
        <div className="fixed inset-0 bg-[#000000bd] backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-lg bg-[#03030c] border border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col h-[520px] max-h-full animate-[fadeIn_0.3s_ease-out] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Holographic scan overlay details */}
            <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

            {/* Modal Header */}
            <div className="p-4 bg-[#050512] border-b border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 font-mono">
                    [COGNITIVE DECOY UNIT ENGAGED]
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">
                    offline on-device hardware sandbox
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowDecoyAi(false)}
                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                title="Close Offline AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal Main Chat Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] text-left scrollbar-thin">
              {decoyHistory.map((msg, idx) => (
                <div key={idx} className="space-y-1">
                  {msg.role === 'system' && (
                    <div className="text-slate-500 whitespace-pre-wrap py-1.5 border-b border-white/[0.02]">
                      {msg.content}
                    </div>
                  )}
                  {msg.role === 'ai' && (
                    <div className="bg-cyan-950/10 border border-cyan-500/10 rounded-xl p-3 text-cyan-300 whitespace-pre-wrap leading-relaxed shadow-sm">
                      <div className="text-[9px] text-cyan-500/70 uppercase tracking-widest font-bold mb-1">
                        &gt; DECOY_AI_CORE
                      </div>
                      {msg.content}
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="bg-purple-950/20 border border-purple-500/10 rounded-xl p-3 text-purple-200 whitespace-pre-wrap leading-relaxed ml-6 shadow-sm">
                      <div className="text-[9px] text-purple-400/70 uppercase tracking-widest font-bold mb-1">
                        &gt; OPERATOR_TREY
                      </div>
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
              {isDecoyTyping && (
                <div className="text-cyan-400 animate-pulse flex items-center gap-1">
                  <span>&gt; DECOY_AI is calculating response matrix</span>
                  <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse" />
                </div>
              )}
              <div ref={decoyBottomRef} />
            </div>

            {/* Quick Micro Diagnostic Triggers */}
            <div className="px-4 py-2 border-t border-white/[0.04] bg-slate-950/50 flex flex-wrap gap-1.5 z-10 select-none">
              <button 
                type="button"
                onClick={() => handleSendDecoyMessage(undefined, "Run biometric diagnostics")}
                className="px-2 py-1 rounded bg-[#07131a] border border-cyan-500/20 text-cyan-400 hover:text-white hover:border-cyan-400/40 text-[9px] font-mono cursor-pointer transition-colors"
              >
                [DIAGNOSTICS]
              </button>
              <button 
                type="button"
                onClick={() => handleSendDecoyMessage(undefined, "Query core temperature")}
                className="px-2 py-1 rounded bg-[#07131a] border border-cyan-500/20 text-cyan-400 hover:text-white hover:border-cyan-400/40 text-[9px] font-mono cursor-pointer transition-colors"
              >
                [TEMPERATURE]
              </button>
              <button 
                type="button"
                onClick={() => handleSendDecoyMessage(undefined, "Bypass security firewall")}
                className="px-2 py-1 rounded bg-[#07131a] border border-cyan-500/20 text-cyan-400 hover:text-white hover:border-cyan-400/40 text-[9px] font-mono cursor-pointer transition-colors"
              >
                [FIREWALL BYPASS]
              </button>
              <button 
                type="button"
                onClick={() => handleSendDecoyMessage(undefined, "Analyze mainframe integrity")}
                className="px-2 py-1 rounded bg-[#07131a] border border-cyan-500/20 text-cyan-400 hover:text-white hover:border-cyan-400/40 text-[9px] font-mono cursor-pointer transition-colors"
              >
                [MAINFRAME COGNITION]
              </button>
            </div>

            {/* Terminal Input block */}
            <form onSubmit={(e) => handleSendDecoyMessage(e)} className="p-3 bg-slate-950 border-t border-white/5 flex gap-2 z-10">
              <input 
                type="text"
                placeholder="Submit query payload command..."
                value={decoyInput}
                onChange={(e) => setDecoyInput(e.target.value)}
                disabled={isDecoyTyping}
                className="flex-1 bg-slate-900 border border-cyan-500/20 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs font-mono text-cyan-100 placeholder-slate-600 focus:outline-none"
              />
              <button 
                type="submit"
                disabled={isDecoyTyping || !decoyInput.trim()}
                className="px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-black font-mono rounded-lg text-xs tracking-wider transition-all"
              >
                EXEC
              </button>
            </form>

            {/* Bottom micro status */}
            <div className="p-2 bg-slate-950/80 border-t border-white/[0.04] text-[8px] text-slate-600 font-mono flex justify-between select-none">
              <span>LOCAL_CACHE_CONNECTED // OK</span>
              <span>HOST: PORTAL_COGNITIVE_AUX</span>
            </div>
          </div>
        </div>
      )}

      {/* SECURE IMAGE LIGHTBOX PREVIEW OVERLAY */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] cursor-zoom-out"
        >
          <div 
            className="relative max-w-4xl max-h-[85vh] overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={previewImage.url} alt={previewImage.name} className="max-w-full max-h-[75vh] rounded-xl object-contain" />
            <div className="mt-3 bg-slate-950/85 backdrop-blur-md rounded-xl p-3 border border-white/5 flex justify-between items-center gap-4">
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-white truncate max-w-[240px] md:max-w-md">{previewImage.name}</span>
                <span className="text-[9px] text-slate-400">Secure Client-Side Local Storage</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <a 
                  href={previewImage.url}
                  download={previewImage.name}
                  onClick={() => haptic(5)}
                  className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer font-sans"
                >
                  Download
                </a>
                {previewImage.isUploaded && (
                  <button 
                    onClick={() => {
                      handleSecureDelete(previewImage.id, previewImage.name);
                      setPreviewImage(null);
                    }}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg border border-rose-500/20 text-[10px] font-bold tracking-widest uppercase cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PROFILE CUSTOMIZATION MODAL */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl flex flex-col gap-5 text-left animate-[scaleIn_0.2s_ease-out] ${
              portalDarkMode 
                ? 'border-purple-500/20 bg-[#12082b]/95 text-purple-200' 
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold tracking-wider uppercase flex items-center gap-1.5">
                👤 Rift Traveler Profile
              </h3>
              <button 
                onClick={() => { haptic(5); setShowProfileModal(false); }}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Picture / Avatar Edit Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <img 
                  src={tempAvatar} 
                  alt="Temp Avatar Preview" 
                  className={`w-20 h-20 rounded-full border-2 object-cover transition-all duration-300 ${
                    portalDarkMode ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-slate-300 ring-4 ring-slate-100'
                  }`}
                />
                <button
                  onClick={() => document.getElementById('temp-avatar-picker')?.click()}
                  className="absolute inset-0 bg-black/55 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                >
                  <Plus className="w-5 h-5 mb-0.5" />
                  Upload custom
                </button>
                <input 
                  type="file" 
                  id="temp-avatar-picker" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setTempAvatar(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Hover avatar to upload, or select a preset below:</span>
              
              {/* Preset avatars selection list */}
              <div className="flex gap-2">
                {[
                  { name: 'cyber', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=128&auto=format&fit=crop' },
                  { name: 'tech', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&auto=format&fit=crop' },
                  { name: 'synth', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=128&auto=format&fit=crop' },
                  { name: 'nebula', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=128&auto=format&fit=crop' }
                ].map((av, idx) => (
                  <button
                    key={idx}
                    onClick={() => { haptic(5); setTempAvatar(av.url); }}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 ${
                      tempAvatar === av.url ? 'border-[#8b5cf6] scale-110 shadow-md' : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img src={av.url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Profile fields */}
            <div className="space-y-4">
              <div className="flex flex-col text-left gap-1">
                <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Display Name</label>
                <input 
                  type="text" 
                  value={tempDisplayName} 
                  onChange={(e) => setTempDisplayName(e.target.value)}
                  placeholder="e.g. trxy6"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#8b5cf6] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col text-left gap-1">
                  <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Status Mode</label>
                  <select 
                    value={tempStatus} 
                    onChange={(e) => setTempStatus(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-[#8b5cf6] dark:text-white cursor-pointer"
                  >
                    <option value="online">🟢 Online</option>
                    <option value="idle">🟡 Idle</option>
                    <option value="dnd">🔴 Do Not Disturb</option>
                    <option value="offline">🌑 Offline</option>
                  </select>
                </div>

                <div className="flex flex-col text-left gap-1">
                  <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Status Message</label>
                  <input 
                    type="text" 
                    value={tempStatusMsg} 
                    onChange={(e) => setTempStatusMsg(e.target.value)}
                    placeholder="Exploring the rift..."
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#8b5cf6] dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Modal buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <button 
                onClick={() => { haptic(5); setShowProfileModal(false); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  haptic(15);
                  if (tempDisplayName.trim()) {
                    setCurrentUser(tempDisplayName.trim());
                    localStorage.setItem('portal_current_user', tempDisplayName.trim());
                  }
                  setUserAvatar(tempAvatar);
                  localStorage.setItem('portal_user_avatar', tempAvatar);
                  setUserStatus(tempStatus);
                  localStorage.setItem('portal_user_status', tempStatus);
                  setUserStatusMsg(tempStatusMsg);
                  localStorage.setItem('portal_user_status_msg', tempStatusMsg);
                  
                  setShowProfileModal(false);
                  toast("Rift Traveler profile synchronized!", "success");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:shadow-lg active:scale-95 animate-pulse-once"
                style={{ background: 'var(--theme-btn-gradient)' }}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
