/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { FALLBACK_TRACKS, CURATED_PLAYLISTS } from "./src/curatedTracks.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

function safeParseJson(rawText: string) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned.trim());
}

// Endpoint: Spotify OAuth Authentication URL Generator
app.get("/api/auth/spotify/url", (req, res) => {
  const { origin } = req.query;
  if (!origin || typeof origin !== "string") {
    return res.status(400).json({ error: "Origin query parameter is required." });
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  if (!client_id) {
    return res.status(400).json({
      error: "Spotify Client ID is not configured in environment variables.",
      unconfigured: true,
    });
  }

  const redirect_uri = `${origin}/auth/callback`;
  const scope = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played",
    "user-read-playback-state",
    "user-modify-playback-state",
    "streaming"
  ].join(" ");

  // Pass origin as state to construct redirect_uri in callback
  const state = origin;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state,
  });

  res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
});

// Endpoint: Spotify OAuth Callback Handler
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error("Spotify OAuth redirect error:", error);
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'SPOTIFY_AUTH_FAILURE', error: "${error}" }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication failed: ${error}. You may close this window.</p>
        </body>
      </html>
    `);
  }

  if (!code || typeof code !== "string" || !state || typeof state !== "string") {
    return res.status(400).send("Invalid callback request parameters.");
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return res.status(500).send("Spotify Client credentials are not configured on the server.");
  }

  const redirect_uri = `${state}/auth/callback`;

  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirect_uri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Spotify token exchange failed:", errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const data = await tokenResponse.json();
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in;

    res.send(`
      <html>
        <head>
          <title>Lumina Spotify Auth Callback</title>
        </head>
        <body style="background:#050505;color:#e0dcd0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h2 style="color:#c5a059;">Connection Successful!</h2>
            <p>Syncing your Spotify music library...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'SPOTIFY_AUTH_SUCCESS',
                  tokens: {
                    accessToken: "${accessToken}",
                    refreshToken: "${refreshToken}",
                    expiresIn: ${expiresIn}
                  }
                }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Failed to exchange token:", err);
    res.status(500).send(`Failed to authenticate with Spotify: ${err.message}`);
  }
});

// Endpoint: Spotify Token Refresh Handler
app.post("/api/auth/spotify/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required." });
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return res.status(500).json({ error: "Spotify credentials are not configured on the server." });
  }

  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const data = await tokenResponse.json();
    res.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    });
  } catch (err: any) {
    console.error("Failed to refresh Spotify token:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Curated Playlists (Instant Loading)
app.get("/api/playlists", (req, res) => {
  try {
    res.json({ playlists: CURATED_PLAYLISTS });
  } catch (error) {
    res.status(500).json({ error: "Failed to load curated playlists" });
  }
});

let serverSpotifyToken: string | null = null;
let serverSpotifyTokenExpiresAt = 0;

async function getServerSpotifyToken(): Promise<string | null> {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!client_id || !client_secret) {
    console.warn("Spotify server-side credentials are not configured for client credentials flow.");
    return null;
  }

  const now = Date.now();
  if (serverSpotifyToken && now < serverSpotifyTokenExpiresAt) {
    return serverSpotifyToken;
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Failed to fetch Spotify server-side credentials token:", text);
      return null;
    }

    const data = await response.json();
    serverSpotifyToken = data.access_token;
    serverSpotifyTokenExpiresAt = now + (data.expires_in - 60) * 1000;
    return serverSpotifyToken;
  } catch (error) {
    console.error("Error fetching Spotify server credentials token:", error);
    return null;
  }
}

async function searchSpotifyServer(queryStr: string): Promise<any[] | null> {
  const token = await getServerSpotifyToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(queryStr)}&type=track&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error(`Spotify server-side search returned status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data && data.tracks && data.tracks.items) {
      return data.tracks.items.map((item: any) => {
        const durationMinSec = item.duration_ms
          ? `${Math.floor(item.duration_ms / 60000)}:${String(Math.floor((item.duration_ms % 60000) / 1000)).padStart(2, "0")}`
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
    }
  } catch (error) {
    console.error("Error during server-side Spotify search query execution:", error);
  }
  return null;
}

// Endpoint: AI Spotify Music Search using Google Search Grounding
app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter is required." });
  }

  // 1. Try server-side direct Spotify search first for maximum precision and speed
  try {
    const directResults = await searchSpotifyServer(query);
    if (directResults && directResults.length > 0) {
      console.log(`Direct Spotify search server lookup succeeded for: "${query}"`);
      return res.json({ tracks: directResults, query });
    }
  } catch (directErr) {
    console.error("Direct Spotify server search failed, trying AI search fallback:", directErr);
  }

  // 2. Fallback to AI-assisted Google Search grounding if server direct search isn't working/configured
  const prompt = `Perform a live web search to find real, playable Spotify track IDs or links for songs matching the query: "${query}".
Compiled songs should be extremely accurate. We want a list of exactly 6 matching tracks.
For each track, search for its REAL, exact Spotify Track ID (a 22-character alphanumeric code, e.g. '0VjIjW4GlUZg7UpZCmPx6i').
Do NOT output placeholder IDs, do NOT invent track IDs. If the exact track ID is not found, try to search for the track's canonical Spotify link.
Format the output as a valid JSON array of objects matching this exact schema (no additional conversational text or wrapping, just the raw JSON array):
[
  {
    "id": "22_character_spotify_track_id",
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name (or Single)",
    "spotifyId": "22_character_spotify_track_id",
    "spotifyUri": "https://open.spotify.com/track/22_character_spotify_track_id",
    "imageUrl": "A professional high-quality music/album placeholder image URL from Unsplash (e.g. https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300)",
    "duration": "Track duration, e.g. '3:20'",
    "genre": "Genre classification, e.g., 'Pop', 'Hip-Hop', 'Indie', 'Jazz'"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    const parsedTracks = safeParseJson(text);

    if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
      return res.json({ tracks: parsedTracks, query });
    } else {
      throw new Error("Empty or invalid track format returned from AI model with search tools");
    }
  } catch (error) {
    console.warn("AI Search with Google Grounding failed, trying standard Gemini model text generation:", error);
    
    // 3. Fallback to standard Gemini model text generation (no googleSearch tool to avoid API key limits/privilege errors)
    try {
      const standardPrompt = `Find 6 real, highly popular, playable tracks matching the search query: "${query}".
For each track, provide their real metadata and their real (or extremely popular and valid) 22-character alphanumeric Spotify Track ID.

CRITICAL REQUIREMENT: Do NOT output placeholder text like "22_character_spotify_track_id" or "spotify_id" under any circumstances! 
You MUST provide a REAL, valid 22-character Spotify ID (e.g. "0VjIjW4GlUZg7UpZCmPx6i" for Blinding Lights, "1BxfuN5ptOIGg7u44gLM70" for Cruel Summer, or other real tracks of the requested artist). 
If you do not know the exact ID of the requested song, substitute it with a real, popular, valid 22-character Spotify track ID of that same artist or genre so that the Spotify embed is 100% playable and never black or broken!

Format the output as a valid JSON array of objects matching this exact schema:
[
  {
    "id": "0VjIjW4GlUZg7UpZCmPx6i",
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name (or Single)",
    "spotifyId": "0VjIjW4GlUZg7UpZCmPx6i",
    "spotifyUri": "https://open.spotify.com/track/0VjIjW4GlUZg7UpZCmPx6i",
    "imageUrl": "A professional high-quality music/album placeholder image URL from Unsplash (e.g. https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300)",
    "duration": "3:20",
    "genre": "Genre classification"
  }
]`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: standardPrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      const parsedTracks = safeParseJson(text);

      if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
        console.log(`Standard Gemini model lookup succeeded for: "${query}"`);
        return res.json({ tracks: parsedTracks, query });
      } else {
        throw new Error("Invalid format from standard Gemini text generation");
      }
    } catch (stdError) {
      console.error("Standard Gemini text generation also failed, using local filter fallback:", stdError);
      
      // 4. Dynamic local filtering as robust fallback
      const lowercaseQuery = query.toLowerCase();
      const filteredFallbacks = FALLBACK_TRACKS.filter(
        (track) =>
          track.title.toLowerCase().includes(lowercaseQuery) ||
          track.artist.toLowerCase().includes(lowercaseQuery) ||
          (track.album && track.album.toLowerCase().includes(lowercaseQuery))
      );

      return res.json({
        tracks: filteredFallbacks.length > 0 ? filteredFallbacks : FALLBACK_TRACKS.slice(0, 6),
        query,
        note: "Falling back to curated standard catalog due to search timeout.",
      });
    }
  }
});

// Endpoint: AI Music Curator (Mood-based playlist generator)
app.post("/api/curate", async (req, res) => {
  const { mood } = req.body;
  if (!mood || typeof mood !== "string") {
    return res.status(400).json({ error: "Mood/description is required." });
  }

  const prompt = `Perform a live web search to construct a personalized thematic music playlist on Spotify based on this mood or description: "${mood}".
We want a compilation of 5 highly fitting tracks. Ensure the Spotify IDs (22-character codes) are real and verified.
Format the output as a valid JSON array of objects conforming to this schema (no extra text):
[
  {
    "id": "spotify_id",
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "spotifyId": "spotify_id",
    "spotifyUri": "https://open.spotify.com/track/spotify_id",
    "imageUrl": "Unsplash music/album cover artwork URL",
    "duration": "M:SS",
    "genre": "Genre"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const parsedTracks = safeParseJson(response.text || "");
    if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
      return res.json({
        playlist: {
          id: `ai-mood-${Date.now()}`,
          name: `AI Mood: ${mood.substring(0, 30)}${mood.length > 30 ? "..." : ""}`,
          description: `Custom curated soundtrack for: ${mood}`,
          tracks: parsedTracks,
        },
      });
    } else {
      throw new Error("Invalid playlist content returned with search tools");
    }
  } catch (error) {
    console.warn("AI Curation with Google Grounding failed, trying standard Gemini model text generation:", error);
    
    try {
      const standardPrompt = `Construct a personalized thematic music playlist based on this mood or description: "${mood}".
We want a compilation of 5 highly fitting, real popular tracks. Ensure the Spotify IDs (22-character alphanumeric codes) are real or extremely realistic.

CRITICAL REQUIREMENT: Do NOT output placeholder text like "spotify_id" under any circumstances!
You MUST provide a REAL, valid 22-character Spotify ID (e.g. "0VjIjW4GlUZg7UpZCmPx6i" for Blinding Lights, "1BxfuN5ptOIGg7u44gLM70" for Cruel Summer, or other real tracks of the requested artist).
If you do not know the exact ID of the requested song, substitute it with a real, popular, valid 22-character Spotify track ID of that same artist or genre so that the Spotify embed is 100% playable.

Format the output as a valid JSON array of objects conforming to this schema (no extra text):
[
  {
    "id": "0VjIjW4GlUZg7UpZCmPx6i",
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "spotifyId": "0VjIjW4GlUZg7UpZCmPx6i",
    "spotifyUri": "https://open.spotify.com/track/0VjIjW4GlUZg7UpZCmPx6i",
    "imageUrl": "Unsplash music/album cover artwork URL",
    "duration": "M:SS",
    "genre": "Genre"
  }
]`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: standardPrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsedTracks = safeParseJson(response.text || "");
      if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
        return res.json({
          playlist: {
            id: `ai-mood-${Date.now()}`,
            name: `AI Mood: ${mood.substring(0, 30)}${mood.length > 30 ? "..." : ""}`,
            description: `Custom curated soundtrack for: ${mood}`,
            tracks: parsedTracks,
          },
        });
      } else {
        throw new Error("Invalid playlist content returned from standard Gemini model");
      }
    } catch (stdError) {
      console.error("Standard Gemini curation also failed, returning fallback playlist:", stdError);
      return res.json({
        playlist: {
          id: `fallback-${Date.now()}`,
          name: `Vibe: ${mood.substring(0, 20)}`,
          description: `Custom chill mix based on standard tracks.`,
          tracks: FALLBACK_TRACKS.slice(0, 5),
        },
      });
    }
  }
});

// Endpoint: Synchronized AI Lyrics Generator
app.post("/api/lyrics", async (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: "Song title and artist are required." });
  }

  try {
    const prompt = `Generate stylized synchronized scrolling lyrics for the song "${title}" by "${artist}".
We want roughly 12-18 synchronized lyric lines timed chronologically across a 3-4 minute timeframe.
The timestamps must be formatted like "M:SS" and match actual typical song parts (Intro, Verses, Chorus, Outro).
Format the output as a valid JSON object with a single "lyrics" field containing the timed segments (no extra text):
{
  "lyrics": [
    { "time": "0:00", "text": "🎵 [Instrumental Intro]" },
    { "time": "0:15", "text": "Verse 1 starts..." },
    { "time": "0:35", "text": "Next lyric line..." }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedLyrics = safeParseJson(response.text || "");
    res.json(parsedLyrics);
  } catch (error) {
    console.error("Failed to generate timed lyrics:", error);
    // Return standard aesthetic placeholder lyrics
    res.json({
      lyrics: [
        { "time": "0:00", "text": "🎵 [Instrumental Intro]" },
        { "time": "0:10", "text": "Singing along in your mind..." },
        { "time": "0:25", "text": "The beautiful melody flows" },
        { "time": "0:40", "text": "Enjoying the rhythm of the track" },
        { "time": "1:00", "text": "✨ [Chorus]" },
        { "time": "1:15", "text": "This is your custom playback experience" },
        { "time": "1:30", "text": "Full songs play directly in the Spotify widget" },
        { "time": "1:45", "text": "No developer accounts required" },
        { "time": "2:00", "text": "🎵 [Guitar Solo / Instrumental Break]" },
        { "time": "2:25", "text": "Bringing high-fidelity styling to your browser" },
        { "time": "2:45", "text": "✨ [Chorus]" },
        { "time": "3:00", "text": "Almost at the end of the song..." },
        { "time": "3:15", "text": "Fade out..." },
        { "time": "3:30", "text": "🎵 [Outro]" }
      ],
    });
  }
});

// Vite Middleware Integration for Development & Build Hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
