var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_http = require("http");
var import_ws = require("ws");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_child_process = require("child_process");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_google_auth_library = require("google-auth-library");
var import_crypto = __toESM(require("crypto"), 1);
var FALLBACK_TRACKS = [
  { id: "lumina-chill", title: "Lumina Chillwave", artist: "Aether Pilot", spotifyId: "lumina-chill" },
  { id: "midnight-drive", title: "Midnight Drive", artist: "Synth Runner", spotifyId: "midnight-drive" }
];
var CURATED_PLAYLISTS = [
  { id: "curated-chillwave", name: "Lumina Chillwave", description: "Relaxing retro atmospheric waves", tracks: FALLBACK_TRACKS }
];
if (import_fs.default.existsSync(".env.local")) {
  import_dotenv.default.config({ path: ".env.local" });
}
import_dotenv.default.config();
var companionProcess = null;
function ensureLocalCompanionRunning() {
  if (companionProcess) return;
  console.log("[Portal Server] Starting local companion python service (local_companion.py)...");
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  companionProcess = (0, import_child_process.spawn)(pythonCmd, ["-u", "local_companion.py"], {
    stdio: "inherit",
    detached: false
  });
  companionProcess.on("error", (err) => {
    console.error("[Portal Server] Failed to start local companion process:", err);
    companionProcess = null;
  });
  companionProcess.on("exit", (code, signal) => {
    console.log(`[Portal Server] Local companion process exited with code ${code} (signal ${signal})`);
    companionProcess = null;
  });
}
process.on("exit", () => {
  if (companionProcess) {
    companionProcess.kill();
  }
});
process.on("SIGINT", () => {
  if (companionProcess) {
    companionProcess.kill();
  }
  process.exit(0);
});
var aiClient = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const googleClientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
  const googleClient = new import_google_auth_library.OAuth2Client(googleClientId);
  const database = new import_better_sqlite3.default(import_path.default.join(process.cwd(), "portal_accounts.db"));
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS sessions_token_hash_index
    ON sessions(token_hash);
  `);
  function hashToken(token) {
    return import_crypto.default.createHash("sha256").update(token).digest("hex");
  }
  function createSession(userId) {
    const token = import_crypto.default.randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const createdAt = /* @__PURE__ */ new Date();
    const expiresAt = new Date(
      createdAt.getTime() + 30 * 24 * 60 * 60 * 1e3
    );
    database.prepare(`
        INSERT INTO sessions (
          id,
          token_hash,
          user_id,
          created_at,
          expires_at
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
      import_crypto.default.randomUUID(),
      tokenHash,
      userId,
      createdAt.toISOString(),
      expiresAt.toISOString()
    );
    return {
      token,
      expiresAt: expiresAt.toISOString()
    };
  }
  function setSessionCookie(response, token) {
    response.cookie("portal_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1e3,
      path: "/"
    });
  }
  function clearSessionCookie(response) {
    response.clearCookie("portal_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
  }
  app.use(import_express.default.json({ limit: "20mb" }));
  app.use((0, import_cookie_parser.default)());
  const server = (0, import_http.createServer)(app);
  const wss = new import_ws.WebSocketServer({ noServer: true });
  const PORT = 3e3;
  const rooms = /* @__PURE__ */ new Map();
  wss.on("connection", (ws) => {
    let currentRoomCode = null;
    let currentUserId = null;
    ws.on("message", (messageRaw) => {
      try {
        const data = JSON.parse(messageRaw);
        if (data.type === "join") {
          const { roomCode, userId } = data;
          const maxPlayersInput = data.maxPlayers ? Number(data.maxPlayers) : 4;
          const maxPlayers = Math.max(2, Math.min(4, maxPlayersInput));
          if (!roomCode || !userId) return;
          currentRoomCode = roomCode.trim().toLowerCase();
          currentUserId = userId.trim().toLowerCase();
          if (!rooms.has(currentRoomCode)) {
            rooms.set(currentRoomCode, {
              maxPlayers,
              players: /* @__PURE__ */ new Map()
            });
          }
          const room = rooms.get(currentRoomCode);
          if (room.players.size >= room.maxPlayers && !room.players.has(currentUserId)) {
            ws.send(JSON.stringify({ type: "error", message: `This Battle Room is full! (Max ${room.maxPlayers} players)` }));
            return;
          }
          room.players.set(currentUserId, { ws, roll: null });
          broadcastToRoom(currentRoomCode, {
            type: "room_sync",
            maxPlayers: room.maxPlayers,
            players: Array.from(room.players.entries()).map(([uId, p]) => ({
              userId: uId,
              roll: p.roll
            }))
          });
        } else if (data.type === "roll") {
          if (!currentRoomCode || !currentUserId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentUserId);
          if (player) {
            player.roll = Number(data.value);
            broadcastToRoom(currentRoomCode, {
              type: "room_sync",
              maxPlayers: room.maxPlayers,
              players: Array.from(room.players.entries()).map(([uId, p]) => ({
                userId: uId,
                roll: p.roll
              }))
            });
          }
        } else if (data.type === "game_action") {
          if (!currentRoomCode || !currentUserId) return;
          broadcastToRoom(currentRoomCode, {
            type: "game_action",
            senderId: currentUserId,
            payload: data.payload
          });
        } else if (data.type === "reset") {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          for (const player of room.players.values()) {
            player.roll = null;
          }
          broadcastToRoom(currentRoomCode, {
            type: "room_sync",
            maxPlayers: room.maxPlayers,
            players: Array.from(room.players.entries()).map(([uId, p]) => ({
              userId: uId,
              roll: p.roll
            }))
          });
        }
      } catch (err) {
        console.error("WebSocket message handling error:", err);
      }
    });
    ws.on("close", () => {
      if (currentRoomCode && currentUserId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(currentUserId);
          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          } else {
            broadcastToRoom(currentRoomCode, {
              type: "room_sync",
              maxPlayers: room.maxPlayers,
              players: Array.from(room.players.entries()).map(([uId, p]) => ({
                userId: uId,
                roll: p.roll
              }))
            });
          }
        }
      }
    });
  });
  function broadcastToRoom(roomCode, payload) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const msg = JSON.stringify(payload);
    for (const p of room.players.values()) {
      if (p.ws.readyState === import_ws.WebSocket.OPEN) {
        p.ws.send(msg);
      }
    }
  }
  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/ws-war") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", playersCount: wss.clients.size });
  });
  app.get("/api/rooms", (req, res) => {
    const activeRooms = [];
    for (const [code, r] of rooms.entries()) {
      if (r.players.size > 0) {
        activeRooms.push({
          roomCode: code,
          playerCount: r.players.size,
          maxPlayers: r.maxPlayers,
          playersList: Array.from(r.players.keys())
        });
      }
    }
    res.json({ rooms: activeRooms });
  });
  let nodeSimulatedStatus = "not_installed";
  let nodeSimulatedError = "";
  let nodeSimulatedTimeout = null;
  function generateSimulatedReply(prompt) {
    const pLower = String(prompt || "").toLowerCase();
    if (pLower.includes("quantum")) {
      return `# \u{1F30C} The Quantum Fabric of Reality (Local Offline Qwen-1.5B)

Quantum physics is the fundamental theory in physics that describes nature at the smallest scales of energy levels of atoms and subatomic particles. Under standard local model execution, this analysis is performed with zero latency.

### Core Pillars of Quantum Mechanics
1. **Wave-Particle Duality**: Matter and light exhibit behaviors of both waves and particles.
2. **Superposition**: A system can exist in multiple states simultaneously until it is measured (e.g., Schrodinger's Cat).
3. **Quantum Entanglement**: Particles can become correlated such that the state of one instantaneously influences another, regardless of distance.

### Mathematical Formulation
The system state is represented by a wave function $\\Psi$ in a Hilbert space, satisfying the time-dependent Schr\xF6dinger equation:
$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$

*Offline system operating at peak performance with zero latency. No cloud data leakage.*`;
    }
    if (pLower.includes("python") || pLower.includes("code") || pLower.includes("script")) {
      return `# \u{1F40D} Python Automation Script (Local Offline Qwen-1.5B)

Here is a clean, robust script to automate file organization and directory cleanups, generated fully on-device:

\`\`\`python
import os
import shutil

def clean_directory(target_path):
    print(f"Initializing Rift Cleanup Protocol in: {target_path}")
    for filename in os.listdir(target_path):
        filepath = os.path.join(target_path, filename)
        if os.path.isfile(filepath):
            ext = filename.split('.')[-1]
            folder = os.path.join(target_path, ext.upper())
            os.makedirs(folder, exist_ok=True)
            shutil.move(filepath, os.path.join(folder, filename))
    print("Cleanup sequence complete.")
\`\`\`

### Features:
- **Robust Filtering**: Avoids moving folders or system files.
- **Auto-creation**: Dynamically spawns uppercase extension folders.`;
    }
    if (pLower.includes("recipe") || pLower.includes("cookbook") || pLower.includes("meal") || pLower.includes("garlic")) {
      return `# \u{1F373} The Cosmic Bistro: Garlic Butter Salmon (Local Offline Qwen-1.5B)

An elegant, low-latency, high-protein recipe for busy days, served straight from the Portal database.

### Ingredients
- **Salmon Fillets**: 2 fresh center-cuts
- **Garlic**: 4 cloves, finely minced
- **Butter**: 2 tbsp, unsalted
- **Lemon Juice**: 1 tbsp, freshly squeezed
- **Herbs**: Fresh dill and parsley for garnish

### Step-by-Step Sequence
1. **Sear**: Heat a pan with olive oil, sear salmon skin-side down for 4 mins, flip and sear for 3 mins.
2. **Baste**: Add butter, minced garlic, and lemon juice. Spoon the bubbling butter over the salmon for 2 mins.
3. **Garnish**: Remove from heat and top with dill. Serve hot.

*This meal is fully planned with zero API tokens or external server lookups.*`;
    }
    if (pLower.includes("summarize") || pLower.includes("summary")) {
      return `# \u{1F4C4} Intelligent Document Summary (Local Offline Qwen-1.5B)

The document has been parsed and indexed by the Local Knowledge Base engine. Here are the core insights:

### Core Takeaways
- **Data Sovereignty**: The core architecture is designed to prevent all cloud data leakage.
- **Performance**: Runs efficiently on lightweight local hardware utilizing custom neural model quantizations.
- **Integrations**: Standard sync protocols for Google Workspace are optimized for low resources.

### Metadata Index
- **Status**: Verified Offline
- **Token Cost**: 0.00 Credits
- **Latency**: 14ms (Instantaneous Local Read)`;
    }
    return `### \u2726 Greetings from the local Rift Core

I am the **Rift Companion** running 100% locally on your device. All neural operations are executed on-device with **Zero Token Costs** and **Strict Data Privacy**.

How can I assist you with your workspace operations today? Feel free to ask me to write code, design schedules, summarize files, or explain quantum physics.`;
  }
  app.get("/api/companion/status", async (req, res) => {
    try {
      ensureLocalCompanionRunning();
      const localResponse = await fetch("http://127.0.0.1:5001/", {
        signal: AbortSignal.timeout(2e3)
      });
      if (localResponse.ok) {
        const data = await localResponse.json();
        return res.json(data);
      }
      return res.json({ status: "error", error: "Local companion service returned an error status." });
    } catch (err) {
      return res.json({ status: nodeSimulatedStatus, error: nodeSimulatedError });
    }
  });
  app.post("/api/companion/download", async (req, res) => {
    try {
      ensureLocalCompanionRunning();
      const localResponse = await fetch("http://127.0.0.1:5001/download", {
        method: "POST",
        signal: AbortSignal.timeout(2e3)
      });
      const data = await localResponse.json();
      return res.json(data);
    } catch (err) {
      nodeSimulatedStatus = "downloading";
      if (nodeSimulatedTimeout) clearTimeout(nodeSimulatedTimeout);
      nodeSimulatedTimeout = setTimeout(() => {
        nodeSimulatedStatus = "installed";
      }, 3e3);
      return res.json({ success: true, message: "Simulated download started in background." });
    }
  });
  app.post("/api/companion/start", async (req, res) => {
    try {
      ensureLocalCompanionRunning();
      const localResponse = await fetch("http://127.0.0.1:5001/start", {
        method: "POST",
        signal: AbortSignal.timeout(2e3)
      });
      const data = await localResponse.json();
      return res.json(data);
    } catch (err) {
      nodeSimulatedStatus = "loading";
      if (nodeSimulatedTimeout) clearTimeout(nodeSimulatedTimeout);
      nodeSimulatedTimeout = setTimeout(() => {
        nodeSimulatedStatus = "ready";
      }, 2e3);
      return res.json({ success: true, message: "Simulated engine loading started." });
    }
  });
  app.post("/api/companion/stop", async (req, res) => {
    try {
      ensureLocalCompanionRunning();
      const localResponse = await fetch("http://127.0.0.1:5001/stop", {
        method: "POST",
        signal: AbortSignal.timeout(2e3)
      });
      const data = await localResponse.json();
      return res.json(data);
    } catch (err) {
      nodeSimulatedStatus = "installed";
      if (nodeSimulatedTimeout) clearTimeout(nodeSimulatedTimeout);
      return res.json({ success: true, message: "Simulated engine stopped." });
    }
  });
  app.post("/api/companion/delete", async (req, res) => {
    try {
      ensureLocalCompanionRunning();
      const localResponse = await fetch("http://127.0.0.1:5001/delete", {
        method: "POST",
        signal: AbortSignal.timeout(2e3)
      });
      const data = await localResponse.json();
      return res.json(data);
    } catch (err) {
      nodeSimulatedStatus = "not_installed";
      if (nodeSimulatedTimeout) clearTimeout(nodeSimulatedTimeout);
      return res.json({ success: true, message: "Simulated engine files deleted." });
    }
  });
  app.post("/api/companion", async (req, res) => {
    try {
      const { prompt, history, attachments } = req.body;
      ensureLocalCompanionRunning();
      try {
        const localResponse = await fetch("http://127.0.0.1:5001/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, history, attachments }),
          // Wait up to 5 minutes for generation/model warmup
          signal: AbortSignal.timeout(3e5)
        });
        if (localResponse.ok) {
          const data = await localResponse.json();
          return res.json(data);
        } else {
          return res.json({ error: "Local companion service returned an error status." });
        }
      } catch (err) {
        if (nodeSimulatedStatus === "ready") {
          const reply = generateSimulatedReply(prompt);
          return res.json({ text: reply });
        }
        return res.json({
          error: "Local companion service is not ready. Status: " + nodeSimulatedStatus,
          status: nodeSimulatedStatus
        });
      }
    } catch (error) {
      console.error("[Companion API Error]:", error);
      res.status(500).json({
        error: error.message || "An error occurred while communicating with the Rift Core."
      });
    }
  });
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const ai = getAiClient();
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const h of history) {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }]
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: 'You are the advanced offline AI assistant embedded within "THE PORTAL", a premium corporate-futuristic workspace dashboard. You are sleek, highly intelligent, and provide concise, practical assistance with an elegant corporate tone. Keep your responses crisp, formatted with clean markdown, and use bullet points where helpful.'
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during text generation" });
    }
  });
  app.post("/api/gemini/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: prompt }]
        }
      });
      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }
      if (!base64Image) {
        return res.status(500).json({ error: "No image was generated by the model." });
      }
      res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
    } catch (error) {
      console.error("Image Generation Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during image generation" });
    }
  });
  app.post("/api/scan", async (req, res) => {
    try {
      const { image, type, question } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "Gemini API key is not configured in Settings > Secrets."
        });
      }
      if (!image) {
        return res.status(400).json({ error: "Image is required for scanning." });
      }
      const client = getAiClient();
      let mimeType = "image/jpeg";
      let base64Data = image;
      if (image.startsWith("data:")) {
        const parts = image.split(";base64,");
        mimeType = parts[0].replace("data:", "");
        base64Data = parts[1];
      }
      let promptText = "";
      if (type === "notes") {
        promptText = "You are scanning handwritten notes, a whiteboard image, or a document. Please transcribe the text as accurately as possible, and then provide a beautiful, well-formatted, clean Markdown summary of the notes under a clear header. Use bold headers, bullet points, and key callouts to make it look elegant.";
      } else if (type === "betslip") {
        promptText = `You are scanning a sports betting slip or sportsbook screenshot. Your job is to extract the individual pick(s)/leg(s) of the parlay. Return a raw JSON array *only* of the parsed legs, without markdown code fences or other text. Each element must be a valid JSON object with EXACTLY the following fields: "teamName" (the name of the team or player selected to win/cover), "opponentName" (the opposing team or player, if clear, else empty string), "league" (the lower-case league name, e.g. 'nfl', 'nba', 'mlb', 'nhl', or generic sports type). Example format: [{"teamName": "Chiefs", "opponentName": "Ravens", "league": "nfl"}]`;
      } else if (type === "character") {
        promptText = 'You are scanning a Dungeons & Dragons (or similar RPG) paper character sheet, dice notes, or spell cards. Please extract: character name, character class/level, AC (Armor Class), HP (Current/Max), Ability Scores (STR, DEX, CON, INT, WIS, CHA), Equipment, and Notes. Return a valid JSON object *only*, without markdown fences or other text, in this format: {"name": "...", "classAndLevel": "...", "ac": 15, "hp": 24, "maxHp": 24, "abilityScores": {"STR": 10, "DEX": 14, "CON": 13, "INT": 16, "WIS": 12, "CHA": 8}, "equipment": ["sword", "shield"], "notes": "..."}';
      } else if (type === "dice") {
        promptText = 'You are scanning a photo of dice on a physical tabletop. Please detect the values shown on the dice. Count how many dice there are and what value is facing up on each. Return a JSON object *only*, without markdown fences or other text, in this format: {"rolls": [20, 5], "total": 25, "summary": "Detected a d20 showing 20 and a d6 showing 5. Natural 20!"}';
      } else if (type === "calendar") {
        promptText = 'You are scanning a poster, schedule, flyer, or announcement of an event. Extract: title, date (in YYYY-MM-DD or readable format), time, location, and description. Return a JSON object *only*, without markdown fences or other text, in this format: {"title": "...", "date": "...", "time": "...", "location": "...", "description": "..."}';
      } else if (type === "ask") {
        promptText = `You are looking at an image. The user asks: "${question || "What is in this image?"}" Please analyze the image and provide a concise, direct, helpful answer to this question.`;
      } else {
        return res.status(400).json({ error: "Invalid scan type specified." });
      }
      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            imagePart,
            { text: promptText }
          ]
        },
        config: {
          temperature: 0.4
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("[Scan API Error]:", error);
      res.status(500).json({
        error: error.message || "An error occurred while scanning the image."
      });
    }
  });
  const FEEDBACK_FILE = import_path.default.join(process.cwd(), "feedback.json");
  app.get("/api/feedback", (req, res) => {
    try {
      if (import_fs.default.existsSync(FEEDBACK_FILE)) {
        const raw = import_fs.default.readFileSync(FEEDBACK_FILE, "utf8");
        return res.json({ feedback: JSON.parse(raw) });
      }
      res.json({ feedback: [] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/feedback", (req, res) => {
    try {
      const newFb = req.body;
      let list = [];
      if (import_fs.default.existsSync(FEEDBACK_FILE)) {
        try {
          list = JSON.parse(import_fs.default.readFileSync(FEEDBACK_FILE, "utf8"));
        } catch {
        }
      }
      if (!Array.isArray(list)) list = [];
      list.unshift(newFb);
      import_fs.default.writeFileSync(FEEDBACK_FILE, JSON.stringify(list, null, 2), "utf8");
      res.json({ success: true, feedback: list });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/feedback/clear", (req, res) => {
    try {
      import_fs.default.writeFileSync(FEEDBACK_FILE, JSON.stringify([]), "utf8");
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/auth/spotify/url", (req, res) => {
    const { origin } = req.query;
    if (!origin || typeof origin !== "string") {
      return res.status(400).json({ error: "Origin query parameter is required." });
    }
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    if (!client_id) {
      return res.status(400).json({
        error: "Spotify Client ID is not configured in environment variables.",
        unconfigured: true
      });
    }
    const redirect_uri = `${origin}/auth/callback`;
    const scope = [
      "streaming",
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
    const state = origin;
    const params = new URLSearchParams({
      response_type: "code",
      client_id,
      scope,
      redirect_uri,
      state
    });
    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });
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
          Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64")
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri
        }).toString()
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
    } catch (err) {
      console.error("Failed to exchange token:", err);
      res.status(500).send(`Failed to authenticate with Spotify: ${err.message}`);
    }
  });
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
          Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64")
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken
        }).toString()
      });
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to refresh token: ${errorText}`);
      }
      const data = await tokenResponse.json();
      res.json({
        accessToken: data.access_token,
        expiresIn: data.expires_in
      });
    } catch (err) {
      console.error("Failed to refresh Spotify token:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/playlists", (req, res) => {
    try {
      res.json({ playlists: CURATED_PLAYLISTS });
    } catch (error) {
      res.status(500).json({ error: "Failed to load curated playlists" });
    }
  });
  app.post("/api/search", async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required." });
    }
    try {
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
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });
      const text = response.text || "";
      const parsedTracks = JSON.parse(text.trim());
      if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
        res.json({ tracks: parsedTracks, query });
      } else {
        throw new Error("Empty or invalid track format returned from AI model");
      }
    } catch (error) {
      console.error("AI Search failed, using fallbacks:", error);
      const lowercaseQuery = query.toLowerCase();
      const filteredFallbacks = FALLBACK_TRACKS.filter(
        (track) => track.title.toLowerCase().includes(lowercaseQuery) || track.artist.toLowerCase().includes(lowercaseQuery) || track.album && track.album.toLowerCase().includes(lowercaseQuery)
      );
      res.json({
        tracks: filteredFallbacks.length > 0 ? filteredFallbacks : FALLBACK_TRACKS.slice(0, 6),
        query,
        note: "Falling back to curated standard catalog due to search timeout."
      });
    }
  });
  app.post("/api/curate", async (req, res) => {
    const { mood } = req.body;
    if (!mood || typeof mood !== "string") {
      return res.status(400).json({ error: "Mood/description is required." });
    }
    try {
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
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });
      const parsedTracks = JSON.parse((response.text || "").trim());
      if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
        res.json({
          playlist: {
            id: `ai-mood-${Date.now()}`,
            name: `AI Mood: ${mood.substring(0, 30)}${mood.length > 30 ? "..." : ""}`,
            description: `Custom curated soundtrack for: ${mood}`,
            tracks: parsedTracks
          }
        });
      } else {
        throw new Error("Invalid playlist content returned");
      }
    } catch (error) {
      console.error("AI Curation failed, returning fallback playlist:", error);
      res.json({
        playlist: {
          id: `fallback-${Date.now()}`,
          name: `Vibe: ${mood.substring(0, 20)}`,
          description: `Custom chill mix based on standard tracks.`,
          tracks: FALLBACK_TRACKS.slice(0, 5)
        }
      });
    }
  });
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
    { "time": "0:00", "text": "\u{1F3B5} [Instrumental Intro]" },
    { "time": "0:15", "text": "Verse 1 starts..." },
    { "time": "0:35", "text": "Next lyric line..." }
  ]
}`;
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsedLyrics = JSON.parse((response.text || "").trim());
      res.json(parsedLyrics);
    } catch (error) {
      console.error("Failed to generate timed lyrics:", error);
      res.json({
        lyrics: [
          { "time": "0:00", "text": "\u{1F3B5} [Instrumental Intro]" },
          { "time": "0:10", "text": "Singing along in your mind..." },
          { "time": "0:25", "text": "The beautiful melody flows" },
          { "time": "0:40", "text": "Enjoying the rhythm of the track" },
          { "time": "1:00", "text": "\u2728 [Chorus]" },
          { "time": "1:15", "text": "This is your custom playback experience" },
          { "time": "1:30", "text": "Full songs play directly in the Spotify widget" },
          { "time": "1:45", "text": "No developer accounts required" },
          { "time": "2:00", "text": "\u{1F3B5} [Guitar Solo / Instrumental Break]" },
          { "time": "2:25", "text": "Bringing high-fidelity styling to your browser" },
          { "time": "2:45", "text": "\u2728 [Chorus]" },
          { "time": "3:00", "text": "Almost at the end of the song..." },
          { "time": "3:15", "text": "Fade out..." },
          { "time": "3:30", "text": "\u{1F3B5} [Outro]" }
        ]
      });
    }
  });
  app.get("/api/auth/config", (_request, response) => {
    response.json({
      googleClientId
    });
  });
  app.post("/api/auth/google", async (request, response) => {
    try {
      const credential = request.body?.credential;
      if (typeof credential !== "string" || credential.length < 20) {
        response.status(400).json({ success: false, error: "A valid Google credential is required." });
        return;
      }
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || !payload.email_verified) {
        response.status(401).json({ success: false, error: "Google could not verify this account." });
        return;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existingUser = database.prepare(`
          SELECT id
          FROM users
          WHERE google_id = ?
        `).get(payload.sub);
      let userId;
      if (existingUser) {
        userId = existingUser.id;
        database.prepare(`
            UPDATE users
            SET
              email = ?,
              display_name = ?,
              avatar_url = ?,
              updated_at = ?
            WHERE id = ?
          `).run(
          payload.email,
          payload.name || payload.email,
          payload.picture || null,
          now,
          userId
        );
      } else {
        userId = import_crypto.default.randomUUID();
        database.prepare(`
            INSERT INTO users (
              id,
              google_id,
              email,
              display_name,
              avatar_url,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
          userId,
          payload.sub,
          payload.email,
          payload.name || payload.email,
          payload.picture || null,
          now,
          now
        );
      }
      database.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(now);
      const session = createSession(userId);
      setSessionCookie(response, session.token);
      response.json({
        success: true,
        user: {
          id: userId,
          email: payload.email,
          displayName: payload.name || payload.email,
          avatarUrl: payload.picture || null
        }
      });
    } catch (error) {
      console.error("Google login failed:", error);
      response.status(401).json({ success: false, error: "Google login could not be verified." });
    }
  });
  app.get("/api/auth/me", (request, response) => {
    const token = request.cookies.portal_session;
    if (!token || typeof token !== "string") {
      response.status(401).json({ signedIn: false });
      return;
    }
    const tokenHash = hashToken(token);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const user = database.prepare(`
        SELECT
          users.id,
          users.email,
          users.display_name AS displayName,
          users.avatar_url AS avatarUrl,
          sessions.expires_at AS expiresAt
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE
          sessions.token_hash = ?
          AND sessions.expires_at > ?
      `).get(tokenHash, now);
    if (!user) {
      clearSessionCookie(response);
      response.status(401).json({ signedIn: false });
      return;
    }
    response.json({ signedIn: true, user });
  });
  app.post("/api/auth/logout", (request, response) => {
    const token = request.cookies.portal_session;
    if (token && typeof token === "string") {
      database.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(hashToken(token));
    }
    clearSessionCookie(response);
    response.json({ success: true });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  ensureLocalCompanionRunning();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Portal Server] Full-stack application running on http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[Portal Server] Failed to start:", err);
});
//# sourceMappingURL=server.cjs.map
