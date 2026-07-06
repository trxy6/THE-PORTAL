import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  
  // Parse incoming JSON request bodies with larger limit for base64 camera scans
  app.use(express.json({ limit: '20mb' }));

  const server = createHttpServer(app);
  const wss = new WebSocketServer({ noServer: true });

  const PORT = 3000;

  // Real-time "War" Rooms State
  // roomCode -> { maxPlayers: number, players: { [userId]: { ws: WebSocket, roll: number | null } } }
  const rooms = new Map<string, {
    maxPlayers: number;
    players: Map<string, { ws: WebSocket; roll: number | null }>;
  }>();

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let currentUserId: string | null = null;

    ws.on('message', (messageRaw: string) => {
      try {
        const data = JSON.parse(messageRaw);

        if (data.type === 'join') {
          const { roomCode, userId } = data;
          const maxPlayersInput = data.maxPlayers ? Number(data.maxPlayers) : 4;
          // Constrain max players between 2 and 4
          const maxPlayers = Math.max(2, Math.min(4, maxPlayersInput));

          if (!roomCode || !userId) return;

          currentRoomCode = roomCode.trim().toLowerCase();
          currentUserId = userId.trim().toLowerCase();

          if (!rooms.has(currentRoomCode)) {
            rooms.set(currentRoomCode, { 
              maxPlayers,
              players: new Map() 
            });
          }

          const room = rooms.get(currentRoomCode)!;
          
          // Guard maximum players in a War room
          if (room.players.size >= room.maxPlayers && !room.players.has(currentUserId)) {
            ws.send(JSON.stringify({ type: 'error', message: `This Battle Room is full! (Max ${room.maxPlayers} players)` }));
            return;
          }

          room.players.set(currentUserId, { ws, roll: null });

          // Broadcast to all players in the room that someone joined
          broadcastToRoom(currentRoomCode, {
            type: 'room_sync',
            maxPlayers: room.maxPlayers,
            players: Array.from(room.players.entries()).map(([uId, p]) => ({
              userId: uId,
              roll: p.roll
            }))
          });
        }

        else if (data.type === 'roll') {
          if (!currentRoomCode || !currentUserId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const player = room.players.get(currentUserId);
          if (player) {
            player.roll = Number(data.value);
            
            // Broadcast the new roll to all players in the room
            broadcastToRoom(currentRoomCode, {
              type: 'room_sync',
              maxPlayers: room.maxPlayers,
              players: Array.from(room.players.entries()).map(([uId, p]) => ({
                userId: uId,
                roll: p.roll
              }))
            });
          }
        }

        else if (data.type === 'game_action') {
          if (!currentRoomCode || !currentUserId) return;
          // Broadcast the custom game action to all players in the room
          broadcastToRoom(currentRoomCode, {
            type: 'game_action',
            senderId: currentUserId,
            payload: data.payload
          });
        }

        else if (data.type === 'reset') {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          for (const player of room.players.values()) {
            player.roll = null;
          }

          broadcastToRoom(currentRoomCode, {
            type: 'room_sync',
            maxPlayers: room.maxPlayers,
            players: Array.from(room.players.entries()).map(([uId, p]) => ({
              userId: uId,
              roll: p.roll
            }))
          });
        }
      } catch (err) {
        console.error('WebSocket message handling error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode && currentUserId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(currentUserId);
          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          } else {
            broadcastToRoom(currentRoomCode, {
              type: 'room_sync',
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

  function broadcastToRoom(roomCode: string, payload: any) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const msg = JSON.stringify(payload);
    for (const p of room.players.values()) {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(msg);
      }
    }
  }

  // Upgrade HTTP connections to WebSocket
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    if (pathname === '/ws-war') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', playersCount: wss.clients.size });
  });

  // API Active Rooms Endpoint
  app.get('/api/rooms', (req, res) => {
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

  // API Companion Bot Chat Handler (Gemini-powered)
  app.post('/api/companion', async (req, res) => {
    try {
      const { prompt, history, attachments } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'Gemini API key is not configured in Settings > Secrets.' 
        });
      }

      const client = getAiClient();
      
      // Build conversation contents for multi-turn chat
      let contents: any[] = [];
      
      if (Array.isArray(history) && history.length > 0) {
        contents = history.map((msg: any) => {
          const role = msg.sender === 'user' ? 'user' : 'model';
          let msgText = msg.text || '';
          
          // If message has attachments, serialize them into the message text so Gemini sees them as context
          if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
            msgText += `\n\n[Context from attached source data: ${JSON.stringify(msg.attachments)}]`;
          }
          
          return {
            role,
            parts: [{ text: msgText }]
          };
        });
      } else {
        // Fallback if no history is provided or is empty
        let promptText = prompt || '';
        if (Array.isArray(attachments) && attachments.length > 0) {
          promptText += `\n\n[Context from attached source data: ${JSON.stringify(attachments)}]`;
        }
        contents = [
          {
            role: 'user',
            parts: [{ text: promptText }]
          }
        ];
      }

      const systemInstruction = `You are the Rift Companion, an advanced AI residing in 'The Portal'. 
You have supreme intelligence and access to the vast knowledge of the cosmos. 
You can answer any complex questions, write code, provide detailed food recipes, draft professional or creative emails, and explain esoteric or technical subjects simply and elegantly.
Always speak with a touch of cosmic mystery, wonder, and wisdom, yet remain highly practical, direct, and fully complete in your answers (do not abbreviate code or omit recipe steps). 
Use beautiful Markdown formatting, bold headings, and bullet points to organize your responses.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('[Companion API Error]:', error);
      res.status(500).json({ 
        error: error.message || 'An error occurred while communicating with the Rift Core.' 
      });
    }
  });

  // API Multi-Purpose Scanner (Gemini-powered Multimodal Endpoint)
  app.post('/api/scan', async (req, res) => {
    try {
      const { image, type, question } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'Gemini API key is not configured in Settings > Secrets.' 
        });
      }

      if (!image) {
        return res.status(400).json({ error: 'Image is required for scanning.' });
      }

      const client = getAiClient();
      
      let mimeType = 'image/jpeg';
      let base64Data = image;
      if (image.startsWith('data:')) {
        const parts = image.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      }

      let promptText = '';
      if (type === 'notes') {
        promptText = 'You are scanning handwritten notes, a whiteboard image, or a document. Please transcribe the text as accurately as possible, and then provide a beautiful, well-formatted, clean Markdown summary of the notes under a clear header. Use bold headers, bullet points, and key callouts to make it look elegant.';
      } else if (type === 'betslip') {
        promptText = 'You are scanning a sports betting slip or sportsbook screenshot. Your job is to extract the individual pick(s)/leg(s) of the parlay. Return a raw JSON array *only* of the parsed legs, without markdown code fences or other text. Each element must be a valid JSON object with EXACTLY the following fields: "teamName" (the name of the team or player selected to win/cover), "opponentName" (the opposing team or player, if clear, else empty string), "league" (the lower-case league name, e.g. \'nfl\', \'nba\', \'mlb\', \'nhl\', or generic sports type). Example format: [{"teamName": "Chiefs", "opponentName": "Ravens", "league": "nfl"}]';
      } else if (type === 'character') {
        promptText = 'You are scanning a Dungeons & Dragons (or similar RPG) paper character sheet, dice notes, or spell cards. Please extract: character name, character class/level, AC (Armor Class), HP (Current/Max), Ability Scores (STR, DEX, CON, INT, WIS, CHA), Equipment, and Notes. Return a valid JSON object *only*, without markdown fences or other text, in this format: {"name": "...", "classAndLevel": "...", "ac": 15, "hp": 24, "maxHp": 24, "abilityScores": {"STR": 10, "DEX": 14, "CON": 13, "INT": 16, "WIS": 12, "CHA": 8}, "equipment": ["sword", "shield"], "notes": "..."}';
      } else if (type === 'dice') {
        promptText = 'You are scanning a photo of dice on a physical tabletop. Please detect the values shown on the dice. Count how many dice there are and what value is facing up on each. Return a JSON object *only*, without markdown fences or other text, in this format: {"rolls": [20, 5], "total": 25, "summary": "Detected a d20 showing 20 and a d6 showing 5. Natural 20!"}';
      } else if (type === 'calendar') {
        promptText = 'You are scanning a poster, schedule, flyer, or announcement of an event. Extract: title, date (in YYYY-MM-DD or readable format), time, location, and description. Return a JSON object *only*, without markdown fences or other text, in this format: {"title": "...", "date": "...", "time": "...", "location": "...", "description": "..."}';
      } else if (type === 'ask') {
        promptText = `You are looking at an image. The user asks: "${question || 'What is in this image?'}" Please analyze the image and provide a concise, direct, helpful answer to this question.`;
      } else {
        return res.status(400).json({ error: 'Invalid scan type specified.' });
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
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
    } catch (error: any) {
      console.error('[Scan API Error]:', error);
      res.status(500).json({ 
        error: error.message || 'An error occurred while scanning the image.' 
      });
    }
  });

  // Integrate Vite dev server middleware or static distribution server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Portal Server] Full-stack application running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Portal Server] Failed to start:', err);
});
