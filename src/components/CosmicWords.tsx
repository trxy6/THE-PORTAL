import React, { useState, useEffect, useRef } from 'react';
import { Sword, Users, RefreshCw, Star, ShieldAlert, Award, Play, HelpCircle, ArrowRight, Zap, CheckCircle, Flame, Send, Trophy } from 'lucide-react';

interface PlayerState {
  userId: string;
  score: number;
}

interface ClueEntry {
  clue: string;
  giver: string;
}

interface CosmicWordItem {
  word: string;
  category: string;
  forbidden: string[];
}

interface CosmicGameState {
  status: 'lobby' | 'clue_giving' | 'guessing' | 'round_end' | 'game_over';
  clueGiver: string;
  secretWord: string;
  category: string;
  forbiddenWords: string[];
  clues: ClueEntry[];
  scores: { [userId: string]: number };
  unplayedGivers: string[];
  roundNum: string;
  currentClueCount: number;
  winner: string | null;
  lastGuessInfo: { guesser: string; guess: string; isCorrect: boolean } | null;
}

interface CosmicWordsProps {
  currentUser: string | null;
}

// 100+ Pre-programmed Cosmic and Fantasy words with their unique Forbidden Taboo words
const COSMIC_WORDS_BANK: CosmicWordItem[] = [
  // --- COSMIC & ASTRONOMY ---
  { word: "SPACESHIP", category: "Cosmic Space", forbidden: ["ROCKET", "ALIEN", "FLY", "VEHICLE", "STAR", "SHIP", "SPACE", "NASA"] },
  { word: "BLACK HOLE", category: "Cosmic Space", forbidden: ["GRAVITY", "LIGHT", "STAR", "SPACE", "DARK", "SINK", "PULL", "HOLE"] },
  { word: "SUPERNOVA", category: "Cosmic Space", forbidden: ["STAR", "EXPLOSION", "DEATH", "BRIGHT", "SPACE", "BLAST", "SHINE", "NOVA"] },
  { word: "ASTRONAUT", category: "Cosmic Space", forbidden: ["NASA", "SPACE", "SUIT", "HELMET", "MOON", "PERSON", "FLY", "PILOT"] },
  { word: "MOON", category: "Cosmic Space", forbidden: ["NIGHT", "ORBIT", "SUN", "LUNAR", "TIDE", "WHITE", "CRATER", "SKY"] },
  { word: "TELESCOPE", category: "Cosmic Space", forbidden: ["STARS", "LOOK", "GLASS", "SKY", "SPACE", "LENS", "SEE", "OBSERVE"] },
  { word: "MARS", category: "Cosmic Space", forbidden: ["RED", "PLANET", "ALIEN", "ROVER", "SPACE", "WAR", "FOURTH", "ELON"] },
  { word: "GRAVITY", category: "Cosmic Space", forbidden: ["FALL", "EARTH", "PULL", "FORCE", "WEIGHT", "DOWN", "NEWTON", "ORBIT"] },
  { word: "METEOR", category: "Cosmic Space", forbidden: ["ROCK", "FALL", "SHOWER", "SPACE", "IMPACT", "CRATER", "STREAK", "SHOOTING"] },
  { word: "GALAXY", category: "Cosmic Space", forbidden: ["MILKY", "STARS", "SPACE", "SYSTEM", "UNIVERSE", "WAY", "ANDROMEDA", "SPIRAL"] },
  { word: "SATELLITE", category: "Cosmic Space", forbidden: ["ORBIT", "SPACE", "SIGNAL", "TV", "DISH", "COMMUNICATION", "ANTENNA", "MOON"] },
  { word: "SPACESUIT", category: "Cosmic Space", forbidden: ["WEAR", "HELMET", "NASA", "ASTRONAUT", "OXYGEN", "CLOTHES", "SUIT", "SPACE"] },
  { word: "NEBULA", category: "Cosmic Space", forbidden: ["CLOUD", "GAS", "SPACE", "STAR", "DUST", "COLOR", "INTERSTELLAR", "BIRTH"] },
  { word: "COMET", category: "Cosmic Space", forbidden: ["TAIL", "ICE", "SPACE", "ROCK", "FLY", "HALLEY", "SHOOTING", "DIRTY"] },
  { word: "ECLIPSE", category: "Cosmic Space", forbidden: ["SUN", "MOON", "DARKNESS", "SHADOW", "ALIGN", "SOLAR", "LUNAR", "BLOCK"] },
  { word: "CONSTELLATION", category: "Cosmic Space", forbidden: ["STARS", "PATTERN", "SKY", "SIGN", "MAP", "ORION", "DIPPER", "CONNECT"] },
  { word: "JUPITER", category: "Cosmic Space", forbidden: ["GIANT", "PLANET", "STORM", "GAS", "RED", "SPOT", "LARGEST", "ORBIT"] },
  { word: "ALIEN", category: "Cosmic Space", forbidden: ["OUTER", "SPACE", "MARTIAN", "UFO", "MONSTER", "EXTRATERRESTRIAL", "GREEN", "LIFE"] },
  { word: "UFO", category: "Cosmic Space", forbidden: ["ALIEN", "FLYING", "SAUCER", "SIGHTING", "SKY", "LIGHT", "ABDUCTION", "SPACE"] },
  { word: "MILKY WAY", category: "Cosmic Space", forbidden: ["GALAXY", "STARS", "SPACE", "CANDY", "HOME", "SPIRAL", "CHOCOLATE", "SYSTEM"] },
  { word: "SOLAR SYSTEM", category: "Cosmic Space", forbidden: ["SUN", "PLANETS", "ORBIT", "SPACE", "EARTH", "GRAVITY", "NINE", "EIGHT"] },
  { word: "PLUTO", category: "Cosmic Space", forbidden: ["PLANET", "DWARF", "COLD", "DOG", "DISNEY", "OUTER", "SMALL", "OUTCAST"] },
  { word: "COSMOS", category: "Cosmic Space", forbidden: ["UNIVERSE", "SPACE", "SAGAN", "STARS", "EVERYTHING", "INFINITY", "ORDER", "CHAOS"] },
  { word: "WARP SPEED", category: "Cosmic Space", forbidden: ["FAST", "TRAVEL", "TREK", "STAR", "LIGHT", "ENGINE", "DRIVE", "SPACE"] },
  { word: "WORMHOLE", category: "Cosmic Space", forbidden: ["PORTAL", "SHORTCUT", "SPACE", "TIME", "TRAVEL", "PHYSICS", "BLACK", "HOLE"] },

  // --- SCI-FI & CYBER TECH ---
  { word: "LASER", category: "Sci-Fi & Cyber Tech", forbidden: ["BEAM", "LIGHT", "RED", "GUN", "SHOOT", "POINTER", "WEAPON", "GLOW"] },
  { word: "CYBORG", category: "Sci-Fi & Cyber Tech", forbidden: ["ROBOT", "HALF", "HUMAN", "MACHINE", "METAL", "CYBERNETIC", "TERMINATOR", "PART"] },
  { word: "TELEPATHY", category: "Sci-Fi & Cyber Tech", forbidden: ["MIND", "READ", "THOUGHTS", "BRAIN", "POWER", "SPEAK", "SILENT", "HEAR"] },
  { word: "FORCEFIELD", category: "Sci-Fi & Cyber Tech", forbidden: ["SHIELD", "ENERGY", "PROTECT", "LASER", "WALL", "DEFENSE", "BARRIER", "BUBBLE"] },
  { word: "HOLOGRAM", category: "Sci-Fi & Cyber Tech", forbidden: ["LIGHT", "IMAGE", "PROJECT", "3D", "VIRTUAL", "BLUE", "SIRI", "DISPLAY"] },
  { word: "ROBOT", category: "Sci-Fi & Cyber Tech", forbidden: ["METAL", "MACHINE", "ANDROID", "COP", "AI", "AUTOMATON", "ASIMOV", "GEAR"] },
  { word: "AI", category: "Sci-Fi & Cyber Tech", forbidden: ["INTELLIGENCE", "COMPUTER", "ROBOT", "MIND", "CHAT", "ARTIFICIAL", "GPT", "SMART"] },
  { word: "CLONE", category: "Sci-Fi & Cyber Tech", forbidden: ["COPY", "DOUBLE", "SAME", "DUPLICATE", "GENETIC", "LAB", "SHEEP", "TWIN"] },
  { word: "MATRIX", category: "Sci-Fi & Cyber Tech", forbidden: ["NEO", "REALITY", "SIMULATION", "GREEN", "CODE", "PILL", "GLITCH", "COMPUTER"] },
  { word: "CYBERPUNK", category: "Sci-Fi & Cyber Tech", forbidden: ["NEON", "FUTURE", "HIGH", "TECH", "LOW", "LIFE", "RAIN", "PUNK"] },
  { word: "JETPACK", category: "Sci-Fi & Cyber Tech", forbidden: ["FLY", "BACKPACK", "ROCKET", "AIR", "WEAR", "FUEL", "BOOST", "THRUST"] },
  { word: "ANDROID", category: "Sci-Fi & Cyber Tech", forbidden: ["PHONE", "GOOGLE", "ROBOT", "HUMAN", "MACHINE", "DATA", "SYNTHETIC", "OS"] },
  { word: "METAVERSE", category: "Sci-Fi & Cyber Tech", forbidden: ["VIRTUAL", "REALITY", "FACEBOOK", "AVATAR", "ONLINE", "WORLD", "DIGITAL", "VR"] },
  { word: "MUTANT", category: "Sci-Fi & Cyber Tech", forbidden: ["GENE", "X-MEN", "NINJA", "TURTLE", "POWER", "RADIATION", "EVOLUTION", "ALTER"] },
  { word: "TIME MACHINE", category: "Sci-Fi & Cyber Tech", forbidden: ["TRAVEL", "PAST", "FUTURE", "DELOREAN", "H.G. WELLS", "CLOCK", "CHRONO", "YEARS"] },
  { word: "STEALTH", category: "Sci-Fi & Cyber Tech", forbidden: ["INVISIBLE", "HIDDEN", "NINJA", "SILENT", "CAMOUFLAGE", "CLOAK", "SHADOW", "SNEAK"] },
  { word: "TELEPORT", category: "Sci-Fi & Cyber Tech", forbidden: ["PORTAL", "MOVE", "INSTANT", "TRAVEL", "SPACE", "BEAM", "HERE", "THERE"] },
  { word: "HOVERBOARD", category: "Sci-Fi & Cyber Tech", forbidden: ["FLY", "SKATEBOARD", "FUTURE", "MARTY", "BACK", "WHEELS", "FLOAT", "RIDE"] },
  { word: "NANOBOT", category: "Sci-Fi & Cyber Tech", forbidden: ["SMALL", "TINY", "ROBOT", "BLOOD", "SCIENCE", "MEDICAL", "CELL", "MICRO"] },
  { word: "RAYGUN", category: "Sci-Fi & Cyber Tech", forbidden: ["LASER", "SHOOT", "BLASTER", "WEAPON", "PSTT", "SPACE", "GUN", "ALIEN"] },
  { word: "SERUM", category: "Sci-Fi & Cyber Tech", forbidden: ["DRINK", "LIQUID", "SUPER", "SOLDIER", "LAB", "INJECTION", "CHEMICAL", "POTION"] },
  { word: "MECH", category: "Sci-Fi & Cyber Tech", forbidden: ["ROBOT", "ARMOR", "SUIT", "PILOT", "GIANT", "ANIME", "METAL", "SUIT"] },
  { word: "SPACE STATION", category: "Sci-Fi & Cyber Tech", forbidden: ["ISS", "NASA", "ORBIT", "HOME", "RESEARCH", "OUTPOST", "SPACE", "STATION"] },
  { word: "LIGHTSABER", category: "Sci-Fi & Cyber Tech", forbidden: ["JEDI", "SWORD", "FORCE", "STAR WARS", "LASER", "GLOW", "VADER", "BLADE"] },
  { word: "DOME", category: "Sci-Fi & Cyber Tech", forbidden: ["GLASS", "ROUND", "ROOF", "CITY", "MARS", "BUBBLE", "COVER", "SHIELD"] },

  // --- MYTH & SPELLCASTING ---
  { word: "DRAGON", category: "Myth & Spellcasting", forbidden: ["FIRE", "WINGS", "SCALES", "MONSTER", "GOLD", "BREATH", "REPTILE", "FLY"] },
  { word: "SPELL", category: "Myth & Spellcasting", forbidden: ["MAGIC", "WAND", "CAST", "WITCH", "WIZARD", "BOOK", "WORDS", "RUNE"] },
  { word: "WAND", category: "Myth & Spellcasting", forbidden: ["WOOD", "MAGIC", "CAST", "SPELL", "HARRY", "POTTER", "STICK", "WIZARD"] },
  { word: "POTION", category: "Myth & Spellcasting", forbidden: ["DRINK", "BOTTLE", "MAGIC", "BREW", "ALCHEMIST", "LIQUID", "HEAL", "CAULDRON"] },
  { word: "CRYSTAL BALL", category: "Myth & Spellcasting", forbidden: ["FUTURE", "GLASS", "GEM", "MAGIC", "SEE", "WITCH", "SPHERE", "BALL"] },
  { word: "SWORD", category: "Myth & Spellcasting", forbidden: ["BLADE", "KNIGHT", "SHARP", "WEAPON", "FIGHT", "SHIELD", "METAL", "EXCALIBUR"] },
  { word: "RUNE", category: "Myth & Spellcasting", forbidden: ["STONE", "SYMBOL", "MAGIC", "ANCIENT", "LETTER", "GRAVEN", "POWER", "WRITING"] },
  { word: "WIZARD", category: "Myth & Spellcasting", forbidden: ["MAGE", "MAGIC", "SPELLS", "WAND", "HAT", "GANDALF", "OLD", "WITCH"] },
  { word: "PORTAL", category: "Myth & Spellcasting", forbidden: ["GATEWAY", "TELEPORT", "DOOR", "DIMENSION", "TRAVEL", "WARP", "OPEN", "BLUE"] },
  { word: "CAULDRON", category: "Myth & Spellcasting", forbidden: ["POT", "WITCH", "BREW", "SOUP", "MAGIC", "LIQUID", "BLACK", "STIR"] },
  { word: "PHOENIX", category: "Myth & Spellcasting", forbidden: ["BIRD", "FIRE", "ASHES", "REBORN", "RED", "BURN", "FEATHER", "IMMORTAL"] },
  { word: "GRYPHON", category: "Myth & Spellcasting", forbidden: ["EAGLE", "LION", "WINGS", "BEAK", "MYTH", "CREATURE", "FLY", "HYBRID"] },
  { word: "UNICORN", category: "Myth & Spellcasting", forbidden: ["HORSE", "HORN", "WHITE", "MAGIC", "RAINBOW", "MYTH", "SINGLE", "FOREST"] },
  { word: "ELIXIR", category: "Myth & Spellcasting", forbidden: ["POTION", "DRINK", "HEALTH", "LIFE", "MAGIC", "CURE", "LIQUID", "GOLDEN"] },
  { word: "KRAKEN", category: "Myth & Spellcasting", forbidden: ["OCEAN", "MONSTER", "SQUID", "OCTOPUS", "GIANT", "SEA", "SHIP", "TENTACLES"] },
  { word: "GOLEM", category: "Myth & Spellcasting", forbidden: ["CLAY", "STONE", "MONSTER", "MAGIC", "ROBOT", "CREATION", "PRAGUE", "PROTECT"] },
  { word: "PEGASUS", category: "Myth & Spellcasting", forbidden: ["HORSE", "WINGS", "FLY", "WHITE", "MYTH", "GREEK", "CREATURE", "HERCULES"] },
  { word: "NECROMANCER", category: "Myth & Spellcasting", forbidden: ["DEAD", "RAISE", "MAGIC", "DARK", "SKULL", "WIZARD", "SKELETON", "GRAVE"] },
  { word: "GARGOYLE", category: "Myth & Spellcasting", forbidden: ["STONE", "ROOF", "WINGED", "STATUE", "MONSTER", "CHURCH", "GOTHIC", "DRAIN"] },
  { word: "ALCHEMIST", category: "Myth & Spellcasting", forbidden: ["GOLD", "METAL", "SCIENCE", "MAGIC", "POTION", "ELIXIR", "BREW", "TRANSFORM"] },
  { word: "BASILISK", category: "Myth & Spellcasting", forbidden: ["SNAKE", "MONSTER", "EYES", "LOOK", "STONE", "GIANT", "HARRY", "SERPENT"] },
  { word: "SPELLBOOK", category: "Myth & Spellcasting", forbidden: ["MAGIC", "BOOK", "SPELLS", "WIZARD", "PAGES", "LEATHER", "READ", "CAST"] },
  { word: "AMULET", category: "Myth & Spellcasting", forbidden: ["NECKLACE", "JEWEL", "MAGIC", "WEAR", "PROTECT", "RING", "CHARM", "STONE"] },
  { word: "CROWN", category: "Myth & Spellcasting", forbidden: ["KING", "QUEEN", "GOLD", "JEWELS", "HEAD", "ROYAL", "POWER", "WEAR"] },
  { word: "TELEKINESIS", category: "Myth & Spellcasting", forbidden: ["MIND", "MOVE", "THINGS", "POWER", "BRAIN", "LIFT", "HANDS", "FORCE"] },

  // --- TIME & DIMENSION ---
  { word: "Eternity", category: "Time & Dimension", forbidden: ["FOREVER", "TIME", "END", "NEVER", "ALWAYS", "INFINITY", "IMMORTAL", "CLOCK"] },
  { word: "Paradox", category: "Time & Dimension", forbidden: ["TIME", "PAST", "FUTURE", "LOGIC", "IMPOSSIBLE", "GRANDFATHER", "LOOP", "ERROR"] },
  { word: "Mirror", category: "Time & Dimension", forbidden: ["GLASS", "REFLECTION", "SEE", "FACE", "LOOK", "REVERSE", "WALL", "DOUBLE"] },
  { word: "Matrix", category: "Time & Dimension", forbidden: ["GRID", "MATH", "SYSTEM", "SIMULATION", "CODE", "NUMBERS", "REALITY", "COMPUTER"] },
  { word: "Rift", category: "Time & Dimension", forbidden: ["TEAR", "CRACK", "SPACE", "TIME", "PORTAL", "OPENING", "CHASM", "BREAK"] },
  { word: "Echo", category: "Time & Dimension", forbidden: ["SOUND", "BOUNCE", "REPEATING", "VOICE", "CAVE", "HEAR", "DELAY", "TALK"] },
  { word: "Chronos", category: "Time & Dimension", forbidden: ["TIME", "GOD", "CLOCK", "CHRONOLOGY", "GREEK", "HOURGLASS", "FATHER", "AGE"] },
  { word: "Shadow", category: "Time & Dimension", forbidden: ["DARK", "LIGHT", "SUN", "SILHOUETTE", "GROUND", "BLACK", "SHAPE", "NIGHT"] },
  { word: "Void", category: "Time & Dimension", forbidden: ["EMPTY", "NOTHING", "DARK", "SPACE", "HOLE", "ABYSS", "VACUUM", "ZERO"] },
  { word: "Labyrinth", category: "Time & Dimension", forbidden: ["MAZE", "LOST", "WALLS", "MINOTAUR", "PUZZLE", "FIND", "PATH", "WAY"] },
  { word: "Obsidian", category: "Time & Dimension", forbidden: ["ROCK", "GLASS", "BLACK", "VOLCANO", "DARK", "SHARP", "DRAGONGLASS", "LAVA"] },
  { word: "Aura", category: "Time & Dimension", forbidden: ["GLOW", "ENERGY", "COLOR", "BODY", "LIGHT", "SPIRIT", "FEELING", "SENSE"] },
  { word: "Siren", category: "Time & Dimension", forbidden: ["SOUND", "ALARM", "LOUD", "SEA", "MERMAID", "SING", "POLICE", "WARN"] },
  { word: "Eclipse", category: "Time & Dimension", forbidden: ["ALIGN", "DARK", "SHADOW", "SUN", "MOON", "SOLAR", "LUNAR", "SKY"] },
  { word: "Mirage", category: "Time & Dimension", forbidden: ["DESERT", "WATER", "ILLUSION", "SEE", "HOT", "FAKE", "VISION", "MIND"] }
];

export default function CosmicWords({ currentUser }: CosmicWordsProps) {
  // Lobby/Joining states
  const [roomCode, setRoomCode] = useState(() => {
    return localStorage.getItem('cosmic_room_code') || 'nexus-chamber';
  });
  const [maxPlayersChoice, setMaxPlayersChoice] = useState<number>(4);
  const [joined, setJoined] = useState(false);
  const [playersList, setPlayersList] = useState<string[]>([]);
  const [maxPlayersInRoom, setMaxPlayersInRoom] = useState<number>(4);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Game State (Synced via server)
  const [gameState, setGameState] = useState<CosmicGameState>({
    status: 'lobby',
    clueGiver: '',
    secretWord: '',
    category: '',
    forbiddenWords: [],
    clues: [],
    scores: {},
    unplayedGivers: [],
    roundNum: '0',
    currentClueCount: 0,
    winner: null,
    lastGuessInfo: null
  });

  // Client-only local inputs
  const [clueInput, setClueInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showRules, setShowRules] = useState(false);

  // Active rooms list
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  interface ActiveRoom {
    roomCode: string;
    playerCount: number;
    maxPlayers: number;
    playersList: string[];
  }

  // Sound triggering helper
  const triggerAudioTone = (freq: number, durationMs: number, type: OscillatorType = 'sine') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  };

  const toast = (msg: string, kind?: string) => {
    if (typeof (window as any).toast === 'function') {
      (window as any).toast(msg, kind);
    }
  };

  const haptic = (pattern: number | number[]) => {
    if (typeof (window as any).haptic === 'function') {
      (window as any).haptic(pattern);
    }
  };

  // Fetch active rooms on mount or manually
  const fetchActiveRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data && Array.isArray(data.rooms)) {
        setActiveRooms(data.rooms);
      }
    } catch (err) {
      console.error("Failed to fetch active rooms:", err);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (!joined) {
      fetchActiveRooms();
      const interval = setInterval(fetchActiveRooms, 4000);
      return () => clearInterval(interval);
    }
  }, [joined]);

  // Connect to WS
  const connectToCosmicLobby = (customRoom?: string, customMaxPlayers?: number) => {
    if (!currentUser) {
      setErrorMessage("⚠️ Please login or enscribe a rune on the home screen first!");
      toast("⚠️ Please login first!", "error");
      return;
    }

    const targetRoom = customRoom || roomCode.trim();
    if (!targetRoom) {
      setErrorMessage("⚠️ Please enter a chamber room code!");
      return;
    }

    setErrorMessage('');
    setStatus('connecting');
    localStorage.setItem('cosmic_room_code', targetRoom);

    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-war`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('connected');
      socket.send(JSON.stringify({
        type: 'join',
        roomCode: targetRoom,
        userId: currentUser,
        maxPlayers: customMaxPlayers || maxPlayersChoice
      }));
      setJoined(true);
      toast(`🔮 Connected to Cosmic Chamber: ${targetRoom}`, 'success');
      haptic([20, 40]);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_sync') {
          // Keep list of present players
          const presentUserIds = data.players.map((p: any) => p.userId);
          setPlayersList(presentUserIds);
          if (data.maxPlayers) {
            setMaxPlayersInRoom(data.maxPlayers);
          }

          // If the game state scores doesn't contain a present player, we initialize them
          setGameState(prev => {
            const newScores = { ...prev.scores };
            presentUserIds.forEach((uId: string) => {
              if (newScores[uId] === undefined) {
                newScores[uId] = 0;
              }
            });
            return {
              ...prev,
              scores: newScores
            };
          });

        } else if (data.type === 'game_action') {
          const action = data.payload;
          if (action.actionType === 'state_update') {
            setGameState(action.gameState);
            
            // Play responsive sounds based on new state statuses
            if (action.gameState.status === 'round_end') {
              if (action.gameState.lastGuessInfo?.isCorrect) {
                triggerAudioTone(880, 400, 'triangle'); // success high note
              } else {
                triggerAudioTone(300, 400, 'sawtooth'); // sad note
              }
            } else if (action.gameState.status === 'guessing') {
              triggerAudioTone(523.25, 200); // clear clue note C5
            }
          } else if (action.actionType === 'toast_message') {
            toast(action.message, action.kind);
          }
        } else if (data.type === 'error') {
          setErrorMessage(data.message);
          setJoined(false);
          setStatus('disconnected');
          toast(`⚠️ ${data.message}`, 'error');
        }
      } catch (e) {
        console.error("Error parsing socket message", e);
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      setJoined(false);
    };

    socket.onerror = () => {
      setStatus('disconnected');
      setErrorMessage('⚠️ Connection rift closed unexpectedly.');
    };
  };

  const leaveChamber = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    setJoined(false);
    setPlayersList([]);
    setStatus('disconnected');
    setGameState({
      status: 'lobby',
      clueGiver: '',
      secretWord: '',
      category: '',
      forbiddenWords: [],
      clues: [],
      scores: {},
      unplayedGivers: [],
      roundNum: '0',
      currentClueCount: 0,
      winner: null,
      lastGuessInfo: null
    });
    toast('🔮 Departed the Nexus Lobby', 'warn');
    haptic(10);
    fetchActiveRooms();
  };

  // Helper to send game action state to the whole room
  const sendGameStateUpdate = (updatedState: CosmicGameState, extraToast?: { message: string, kind: string }) => {
    if (socketRef.current && status === 'connected') {
      socketRef.current.send(JSON.stringify({
        type: 'game_action',
        payload: {
          actionType: 'state_update',
          gameState: updatedState
        }
      }));

      if (extraToast) {
        socketRef.current.send(JSON.stringify({
          type: 'game_action',
          payload: {
            actionType: 'toast_message',
            message: extraToast.message,
            kind: extraToast.kind
          }
        }));
      }
    }
  };

  // Start a new game of Cosmic Words
  const startNewGame = () => {
    if (playersList.length < 2) {
      toast("⚠️ At least 2 players must be inside the chamber to begin!", "error");
      return;
    }

    haptic([30, 15, 30]);
    triggerAudioTone(587.33, 300); // D5 star start note

    // Pick random first Clue Giver from present players
    const randGiver = playersList[Math.floor(Math.random() * playersList.length)];
    
    // Pick random secret word
    const randomWordItem = COSMIC_WORDS_BANK[Math.floor(Math.random() * COSMIC_WORDS_BANK.length)];

    // Initialize scores
    const initialScores: { [userId: string]: number } = {};
    playersList.forEach(p => {
      initialScores[p] = 0;
    });

    const newGameState: CosmicGameState = {
      status: 'clue_giving',
      clueGiver: randGiver,
      secretWord: randomWordItem.word,
      category: randomWordItem.category,
      forbiddenWords: randomWordItem.forbidden,
      clues: [],
      scores: initialScores,
      unplayedGivers: playersList.filter(p => p !== randGiver),
      roundNum: '1',
      currentClueCount: 0,
      winner: null,
      lastGuessInfo: null
    };

    sendGameStateUpdate(newGameState, {
      message: `🌌 The Rift opens! ${randGiver.toUpperCase()} is the first Clue Giver!`,
      kind: 'success'
    });
  };

  // Move to next round / next Clue Giver
  const setupNextRound = () => {
    let nextGiver = '';
    let remaining = [...gameState.unplayedGivers];

    // If everyone has been Clue Giver once, reset the cycle list but keep scores!
    if (remaining.length === 0) {
      remaining = playersList.filter(p => p !== gameState.clueGiver);
      if (remaining.length === 0) {
        // Only 1 player remains, pick them
        nextGiver = playersList[0];
      } else {
        nextGiver = remaining[Math.floor(Math.random() * remaining.length)];
        remaining = remaining.filter(p => p !== nextGiver);
      }
    } else {
      nextGiver = remaining[Math.floor(Math.random() * remaining.length)];
      remaining = remaining.filter(p => p !== nextGiver);
    }

    const randomWordItem = COSMIC_WORDS_BANK[Math.floor(Math.random() * COSMIC_WORDS_BANK.length)];
    const nextRoundNo = parseInt(gameState.roundNum || '1', 10) + 1;

    const updatedState: CosmicGameState = {
      ...gameState,
      status: 'clue_giving',
      clueGiver: nextGiver,
      secretWord: randomWordItem.word,
      category: randomWordItem.category,
      forbiddenWords: randomWordItem.forbidden,
      clues: [],
      unplayedGivers: remaining,
      roundNum: String(nextRoundNo),
      currentClueCount: 0,
      lastGuessInfo: null
    };

    setClueInput('');
    setGuessInput('');
    setValidationError('');

    sendGameStateUpdate(updatedState, {
      message: `🔄 Round ${nextRoundNo} begins! ${nextGiver.toUpperCase()} is casting clues!`,
      kind: 'info'
    });
  };

  // Submit clue (Clue Giver only)
  const submitClue = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    const rawClue = clueInput.trim();

    if (!rawClue) return;

    // Validation 1: Exactly one word
    if (rawClue.includes(' ') || rawClue.includes('-')) {
      setValidationError("⚠️ Clue must be exactly ONE single word! No spaces or hyphens.");
      haptic([40, 10]);
      return;
    }

    const clueLower = rawClue.toLowerCase();
    const secretLower = gameState.secretWord.toLowerCase();

    // Validation 2: Cannot contain or be equal to secret word
    if (clueLower === secretLower || secretLower.includes(clueLower) || clueLower.includes(secretLower)) {
      setValidationError(`⚠️ Forged rune invalid! Clue cannot contain or equal the secret word ("${gameState.secretWord}")!`);
      haptic([40, 10]);
      return;
    }

    // Validation 3: Cannot match any forbidden words
    const isForbidden = gameState.forbiddenWords.some(fw => fw.toLowerCase() === clueLower);
    if (isForbidden) {
      setValidationError("⚠️ TABOO DETECTED! You used a forbidden cosmic keyword!");
      haptic([40, 10]);
      return;
    }

    // Success - add clue to list
    const newClues = [...gameState.clues, { clue: rawClue, giver: gameState.clueGiver }];
    const nextCount = gameState.currentClueCount + 1;

    const updatedState: CosmicGameState = {
      ...gameState,
      status: 'guessing',
      clues: newClues,
      currentClueCount: nextCount
    };

    setClueInput('');
    sendGameStateUpdate(updatedState, {
      message: `✨ Clue #${nextCount} materialized: "${rawClue.toUpperCase()}"! Guessers, submit your visions!`,
      kind: 'success'
    });
    haptic(15);
  };

  // Submit guess (Guessers only)
  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const rawGuess = guessInput.trim();
    if (!rawGuess || !currentUser) return;

    const isCorrect = rawGuess.toLowerCase() === gameState.secretWord.toLowerCase();
    setGuessInput('');

    if (isCorrect) {
      // Guess is correct! Award points based on clue count
      // 1st Clue Correct: +15 points to guesser and clueGiver
      // 2nd Clue Correct: +10 points to guesser and clueGiver
      // 3rd Clue Correct: +5 points to guesser and clueGiver
      const pointsAwarded = Math.max(5, 20 - (gameState.currentClueCount * 5));

      const newScores = { ...gameState.scores };
      newScores[currentUser.toLowerCase()] = (newScores[currentUser.toLowerCase()] || 0) + pointsAwarded;
      newScores[gameState.clueGiver.toLowerCase()] = (newScores[gameState.clueGiver.toLowerCase()] || 0) + pointsAwarded;

      const updatedState: CosmicGameState = {
        ...gameState,
        status: 'round_end',
        scores: newScores,
        lastGuessInfo: {
          guesser: currentUser,
          guess: rawGuess,
          isCorrect: true
        }
      };

      sendGameStateUpdate(updatedState, {
        message: `🎉 MAGNIFICENT! ${currentUser.toUpperCase()} correctly guessed "${gameState.secretWord.toUpperCase()}"! Both gain +${pointsAwarded} Cosmic Points!`,
        kind: 'success'
      });
      haptic([50, 100, 50, 100]);
    } else {
      // Incorrect guess
      // Check if everyone has submitted their guess or if we just log it
      const updatedState: CosmicGameState = {
        ...gameState,
        lastGuessInfo: {
          guesser: currentUser,
          guess: rawGuess,
          isCorrect: false
        }
      };

      // If we reached max clues and this was a wrong guess, allow the clue giver to give another hint
      // If we are at 3 clues, let's keep giving wrong guesses or let Clue Giver end the round if everyone is stuck.
      sendGameStateUpdate(updatedState, {
        message: `🔮 "${rawGuess.toUpperCase()}" is incorrect. The cosmic alignment rejects this vision!`,
        kind: 'warn'
      });
      haptic(20);
    }
  };

  // End round empty-handed
  const endRoundStuck = () => {
    const updatedState: CosmicGameState = {
      ...gameState,
      status: 'round_end',
      lastGuessInfo: {
        guesser: 'NO ONE',
        guess: 'N/A',
        isCorrect: false
      }
    };

    sendGameStateUpdate(updatedState, {
      message: `⏳ No one decoded the runes. The secret word was "${gameState.secretWord.toUpperCase()}". Preparing next round...`,
      kind: 'info'
    });
    haptic(15);
  };

  // Complete game & determine absolute champion
  const finishGameAndCrownWinner = () => {
    let highestScore = -1;
    let winnerName = 'No One';

    Object.keys(gameState.scores).forEach((name) => {
      const pts = Number(gameState.scores[name]);
      if (pts > highestScore) {
        highestScore = pts;
        winnerName = name;
      }
    });

    const updatedState: CosmicGameState = {
      ...gameState,
      status: 'game_over',
      winner: winnerName
    };

    sendGameStateUpdate(updatedState, {
      message: `👑 The Cosmic game has ended! CROWNING CHAMPION: ${winnerName.toUpperCase()} with ${highestScore} points!`,
      kind: 'success'
    });
    haptic([30, 50, 30, 50, 100]);
  };

  // Restart everything back to lobby
  const resetToLobby = () => {
    const updatedState: CosmicGameState = {
      status: 'lobby',
      clueGiver: '',
      secretWord: '',
      category: '',
      forbiddenWords: [],
      clues: [],
      scores: {},
      unplayedGivers: [],
      roundNum: '0',
      currentClueCount: 0,
      winner: null,
      lastGuessInfo: null
    };
    sendGameStateUpdate(updatedState, {
      message: "🔄 Game reset to lobby. New travelers can now enter!",
      kind: 'info'
    });
  };

  // Flags for current client's role in the game
  const isMeClueGiver = currentUser?.toLowerCase() === gameState.clueGiver.toLowerCase();

  return (
    <section className="card border border-[#3fd9c7]/25 bg-gradient-to-b from-[#0b0416] to-[#120624] rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] select-none">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start border-b border-[#3fd9c7]/15 pb-3.5 mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#3fd9c7] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#3fd9c7] animate-pulse" /> 🔮 COSMIC WORDS LOBBY
          </span>
          <span className="text-[8px] text-[#b4aae2]/50 font-mono block tracking-wider mt-0.5">THE MULTIPLAYER SCI-FI CLUE & GUESSING GAME</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setShowRules(!showRules); haptic(10); }}
            className="px-2.5 py-1 bg-[#cf4fe6]/10 hover:bg-[#cf4fe6]/20 border border-[#cf4fe6]/25 hover:border-[#cf4fe6]/45 text-[#cf4fe6] rounded-xl text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" /> {showRules ? 'Hide Rules' : 'Game Rules'}
          </button>
        </div>
      </div>

      {/* DETAILED GAME RULES SLIDE */}
      {showRules && (
        <div className="p-4 bg-[#170c30] border border-[#cf4fe6]/20 rounded-xl mb-4 text-xs space-y-2.5 animate-fade-in leading-relaxed text-[#b4aae2]">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#cf4fe6] block">📜 Spellbinding Rules</span>
          <p>
            1. **One Clue Giver**: Each round, one player is selected as the Giver. They see the secret word and **5 Taboo Forbidden Words** they cannot use.
          </p>
          <p>
            2. **One-Word Clues**: The Giver must type a **single word** as a hint. It cannot equal or contain the secret word.
          </p>
          <p>
            3. **Points Scaling**: The guessers try to decode the word. 
            - Guessed on **1st Clue**: **+15 points** for both the Guesser and Clue Giver!
            - Guessed on **2nd Clue**: **+10 points** each!
            - Guessed on **3rd Clue**: **+5 points** each!
          </p>
          <p>
            4. **Perfect Sync**: Play seamlessly with up to 4 players simultaneously over your secure portal space.
          </p>
        </div>
      )}

      {/* LOBBY / DISCONNECTED VIEW */}
      {!joined ? (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-[#b4aae2] leading-relaxed">
            Channel your cerebral focus. Connect to a custom Nexus Chamber or choose an existing active game room to guess ancient space runes with friends!
          </p>

          {errorMessage && (
            <div className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-lg p-2.5 text-center uppercase tracking-wide">
              {errorMessage}
            </div>
          )}

          {/* Setup Config Block */}
          <div className="p-4 rounded-xl bg-[#120826]/50 border border-[#3fd9c7]/15 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[8px] uppercase tracking-wider text-[#3fd9c7] font-bold block mb-1">Nexus Chamber Code</label>
                <input 
                  type="text"
                  placeholder="e.g. nebula-omega"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  className="w-full bg-[#1c1136] border border-[#3fd9c7]/20 rounded-xl px-3 py-2 text-xs text-[#faebd7] placeholder-[#b4aae2]/20 focus:outline-none focus:border-[#3fd9c7]"
                />
              </div>

              <div>
                <label className="text-[8px] uppercase tracking-wider text-[#3fd9c7] font-bold block mb-1">Select Players Cap</label>
                <select
                  value={maxPlayersChoice}
                  onChange={(e) => setMaxPlayersChoice(Number(e.target.value))}
                  className="w-full bg-[#1c1136] border border-[#3fd9c7]/20 rounded-xl px-3 py-2 text-xs text-[#b4aae2] focus:outline-none focus:border-[#3fd9c7]"
                >
                  <option value={2}>2 Players Chamber</option>
                  <option value={3}>3 Players Chamber</option>
                  <option value={4}>4 Players Chamber (Recommended)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => connectToCosmicLobby()}
              disabled={status === 'connecting'}
              className="w-full py-2.5 bg-gradient-to-r from-[#3fd9c7] to-[#cf4fe6] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(63,217,199,0.25)]"
            >
              🔮 ENTER THE COSMIC CHAMBER
            </button>
          </div>

          {/* ACTIVE CHAMBERS SECTION */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] uppercase tracking-widest text-[#3fd9c7] font-bold flex items-center gap-1">
                <Users className="w-3 h-3 text-[#3fd9c7]" /> Open Portal Chambers
              </span>
              <button 
                onClick={fetchActiveRooms}
                disabled={roomsLoading}
                className="text-[8px] font-mono uppercase tracking-widest text-[#cf4fe6] hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${roomsLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {activeRooms.length === 0 ? (
              <div className="text-center p-4 border border-[#3fd9c7]/10 rounded-xl bg-[#120826]/30">
                <span className="text-[9px] text-[#b4aae2]/30 italic uppercase font-mono">No active cosmic chambers. Instantiate one above!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {activeRooms.map((r) => (
                  <div key={r.roomCode} className="flex justify-between items-center p-2.5 rounded-xl bg-[#1c1136]/60 border border-[#3fd9c7]/10 text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#3fd9c7] uppercase tracking-wide">🌌 {r.roomCode}</span>
                      <span className="text-[8px] text-[#b4aae2]/50 block font-mono">LOBBYISTS: {r.playersList.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#3fd9c7] font-bold">{r.playerCount} / {r.maxPlayers}</span>
                      <button
                        onClick={() => connectToCosmicLobby(r.roomCode, r.maxPlayers)}
                        disabled={r.playerCount >= r.maxPlayers}
                        className="px-2 py-1 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/20 border border-[#3fd9c7]/20 hover:border-[#3fd9c7]/40 text-[#3fd9c7] text-[8px] font-bold rounded-lg uppercase tracking-wider transition-all"
                      >
                        {r.playerCount >= r.maxPlayers ? 'FULL' : 'ENTER'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CONNECTED MULTIPLAYER PANEL */
        <div className="space-y-4 animate-fade-in">
          
          {/* ROOM META */}
          <div className="flex justify-between items-center p-2 rounded-xl bg-[#1c1136]/60 border border-[#3fd9c7]/10 text-xs text-[#b4aae2]">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#3fd9c7] font-bold">CHAMBER: {roomCode}</span>
            <div className="flex items-center gap-1 font-semibold text-[10px] text-[#cf4fe6]">
              <Users className="w-3.5 h-3.5 animate-pulse" />
              <span>{playersList.length} / {maxPlayersInRoom} TRAVELERS PRESENT</span>
            </div>
          </div>

          {/* LOBBY STATE (Waiting to start) */}
          {gameState.status === 'lobby' && (
            <div className="text-center p-6 bg-[#170e2b]/50 border border-[#cf4fe6]/15 rounded-xl space-y-4">
              <Star className="w-10 h-10 text-[#3fd9c7] animate-spin mx-auto opacity-80" style={{ animationDuration: '10s' }} />
              <div>
                <span className="text-[11px] uppercase tracking-widest font-extrabold text-white block">Awaiting Spellcasting...</span>
                <span className="text-[9px] text-[#b4aae2]/60 font-mono uppercase tracking-wider block mt-1">Need at least 2 travelers to initiate</span>
              </div>

              {/* Present players chips */}
              <div className="flex flex-wrap gap-2 justify-center py-2">
                {playersList.map(p => (
                  <span key={p} className="px-2.5 py-1 bg-[#3fd9c7]/10 border border-[#3fd9c7]/20 text-[#3fd9c7] font-mono text-[9px] uppercase tracking-wider rounded-lg font-bold">
                    👤 {p}
                  </span>
                ))}
              </div>

              {playersList.length >= 2 ? (
                <button
                  onClick={startNewGame}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#3fd9c7] to-[#cf4fe6] hover:brightness-110 text-white font-extrabold tracking-widest uppercase rounded-xl text-xs flex items-center justify-center gap-1.5 mx-auto transition-transform active:scale-95 cursor-pointer shadow-lg"
                >
                  <Play className="w-3.5 h-3.5" /> INITIATE COSMIC WORDS GAME
                </button>
              ) : (
                <span className="text-[9px] text-amber-400 font-mono uppercase tracking-widest block animate-pulse">
                  ⚠️ Waiting for more travelers to cross the portal threshold...
                </span>
              )}
            </div>
          )}

          {/* ACTIVE GAME STATES */}
          {gameState.status !== 'lobby' && (
            <div className="space-y-4">
              
              {/* CURRENT TURN INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#170a2d]/60 border border-[#cf4fe6]/15 rounded-xl text-xs">
                <div>
                  <span className="text-[8px] uppercase tracking-widest text-[#cf4fe6] font-bold block mb-0.5">Current Role Assignment</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm uppercase font-mono">
                      {isMeClueGiver ? '🔮 YOU ARE CLUE GIVER!' : `👤 GIVER: ${gameState.clueGiver.toUpperCase()}`}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#b4aae2]/50 block font-mono mt-0.5">ROUND {gameState.roundNum} • CLUES CAST: {gameState.currentClueCount}/3</span>
                </div>

                <div className="sm:border-l sm:border-[#cf4fe6]/10 sm:pl-3">
                  <span className="text-[8px] uppercase tracking-widest text-[#3fd9c7] font-bold block mb-0.5">Ancient Runes Category</span>
                  <span className="font-bold text-[#3fd9c7] text-sm uppercase block font-mono">{gameState.category}</span>
                  <span className="text-[9px] text-[#b4aae2]/50 block font-mono mt-0.5">Potential points for correct guess: {Math.max(5, 20 - (gameState.currentClueCount * 5))} pts</span>
                </div>
              </div>

              {/* CORE CLUE GIVER VIEW (Giver sees the secret word & taboo list) */}
              {gameState.status === 'clue_giving' && isMeClueGiver && (
                <div className="p-4 bg-[#140624] border border-[#cf4fe6]/25 rounded-xl space-y-3.5 animate-fade-in shadow-inner">
                  <div className="text-center">
                    <span className="text-[9px] uppercase tracking-widest text-[#cf4fe6] font-extrabold block mb-1">🤫 YOUR SECRET COSMIC WORD</span>
                    <span className="text-3xl font-black text-white uppercase tracking-widest font-mono drop-shadow-[0_0_15px_rgba(207,79,230,0.4)]">
                      {gameState.secretWord}
                    </span>
                  </div>

                  {/* FORBIDDEN TABOO LIST */}
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-red-400 flex items-center gap-1.5 mb-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> FORBIDDEN TABOO WORDS (Cannot use as clues)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {gameState.forbiddenWords.map(w => (
                        <span key={w} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-400 font-mono uppercase tracking-wider font-bold">
                          ❌ {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SUBMIT ONE-WORD CLUE */}
                  <form onSubmit={submitClue} className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-[#b4aae2] font-semibold block">Enscribe Your One-Word Clue</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={clueInput}
                        onChange={(e) => setClueInput(e.target.value.replace(/[^a-zA-Z]/g, ''))} // only allow alphabetical
                        placeholder="Type single word hint..."
                        className="flex-1 bg-[#1c1136] border border-[#cf4fe6]/30 rounded-xl px-3 py-2 text-xs text-[#faebd7] placeholder-[#b4aae2]/20 focus:outline-none focus:border-[#cf4fe6] uppercase font-mono font-bold"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-[#cf4fe6] to-[#3fd9c7] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer"
                      >
                        CAST CLUE ✨
                      </button>
                    </div>
                    {validationError && (
                      <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wide mt-1 animate-pulse">{validationError}</p>
                    )}
                  </form>
                </div>
              )}

              {/* GUESSERS IN THE CLUE_GIVING STAGE (Waiting for Clue Giver to submit hint) */}
              {gameState.status === 'clue_giving' && !isMeClueGiver && (
                <div className="p-6 bg-[#120826]/40 border border-[#cf4fe6]/10 rounded-xl text-center space-y-3.5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#cf4fe6]/10 border border-[#cf4fe6]/20 text-[#cf4fe6] animate-bounce">
                    🔮
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-[#b4aae2] block">TRANSMITTING COSMIC FREQUENCIES...</span>
                    <span className="text-[9px] text-[#b4aae2]/50 font-mono uppercase tracking-wider block mt-1">
                      {gameState.clueGiver.toUpperCase()} is writing a clever 1-word clue!
                    </span>
                  </div>
                </div>
              )}

              {/* ACTIVE GUESSING STAGE (A clue is visible, guessers enter guesses) */}
              {gameState.status === 'guessing' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* MATERIALIZED CLUES SO FAR */}
                  <div className="p-4 bg-[#140624]/80 border border-[#3fd9c7]/25 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase tracking-widest text-[#3fd9c7] font-extrabold block">✨ TRANSMITTED CLUES</span>
                    <div className="space-y-2">
                      {gameState.clues.map((clueItem, index) => (
                        <div key={index} className="flex items-center gap-2 bg-[#1c1136]/80 p-2.5 rounded-xl border border-[#3fd9c7]/15">
                          <span className="w-5 h-5 rounded-full bg-[#3fd9c7]/20 border border-[#3fd9c7]/40 text-[#3fd9c7] flex items-center justify-center font-mono text-[10px] font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-black font-mono text-white tracking-widest uppercase">{clueItem.clue}</span>
                          <span className="text-[8px] text-[#b4aae2]/40 ml-auto font-mono">CAST BY {clueItem.giver.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GUESSER FORM */}
                  {!isMeClueGiver ? (
                    <form onSubmit={submitGuess} className="p-4 bg-[#120826]/80 border border-[#cf4fe6]/20 rounded-xl space-y-3 shadow-md">
                      <span className="text-[9px] uppercase tracking-widest text-[#cf4fe6] font-bold block">🌌 SUBMIT YOUR VISION GUESS</span>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={guessInput}
                          onChange={(e) => setGuessInput(e.target.value)}
                          placeholder="Type your one-word guess..."
                          className="flex-1 bg-[#1c1136] border border-[#cf4fe6]/30 rounded-xl px-3 py-2 text-xs text-[#faebd7] placeholder-[#b4aae2]/20 focus:outline-none focus:border-[#cf4fe6] uppercase font-mono font-bold"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-[#3fd9c7] to-[#4f7fe6] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> BEAM GUESS
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* CLUE GIVER CANNOT GUESS - WAITING STAGE */
                    <div className="p-4 bg-[#120826]/40 border border-[#cf4fe6]/10 rounded-xl text-center space-y-2">
                      <span className="text-[10px] uppercase tracking-widest text-[#b4aae2] font-semibold block">GUESSERS ARE ATTEMPTING TO DECODE THE RUNES</span>
                      <span className="text-[9px] text-[#b4aae2]/50 font-mono uppercase block">You gave: "{gameState.clues[gameState.clues.length - 1]?.clue.toUpperCase()}". Let them guess!</span>
                      
                      {/* Clue giver option to add another clue or end round if players are completely stuck */}
                      <div className="flex gap-2 justify-center pt-2">
                        {gameState.currentClueCount < 3 && (
                          <button
                            onClick={() => {
                              const updatedState: CosmicGameState = {
                                ...gameState,
                                status: 'clue_giving'
                              };
                              sendGameStateUpdate(updatedState);
                              haptic(10);
                            }}
                            className="px-3 py-1 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/20 text-[#3fd9c7] border border-[#3fd9c7]/25 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all"
                          >
                            ➕ GIVE ANOTHER CLUE (DROP SCORE POTENTIAL)
                          </button>
                        )}
                        <button
                          onClick={endRoundStuck}
                          className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all"
                        >
                          🛑 END ROUND (THEY ARE STUCK)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RECENT GUESS VISUAL FEEDBACK LOG */}
                  {gameState.lastGuessInfo && (
                    <div className={`p-2.5 rounded-xl border text-center text-xs animate-fade-in ${gameState.lastGuessInfo.isCorrect ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-950/20 border-rose-500/20 text-rose-400'}`}>
                      <span className="font-mono uppercase tracking-wider text-[9px] block">
                        🛰️ {gameState.lastGuessInfo.guesser.toUpperCase()} guessed "{gameState.lastGuessInfo.guess.toUpperCase()}" — {gameState.lastGuessInfo.isCorrect ? '✅ CORRECT!' : '❌ WRONG!'}
                      </span>
                    </div>
                  )}

                </div>
              )}

              {/* ROUND END STAGE (Result show) */}
              {gameState.status === 'round_end' && (
                <div className="p-5 bg-[#170e2d]/80 border border-[#3fd9c7]/30 rounded-xl text-center space-y-4 animate-fade-in">
                  <Award className="w-10 h-10 text-amber-400 animate-bounce mx-auto" />
                  
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#3fd9c7] font-extrabold block">ROUND {gameState.roundNum} DECODED</span>
                    <span className="text-2xl font-black text-white uppercase font-mono tracking-widest block mt-1">
                      SECRET: {gameState.secretWord}
                    </span>
                    <span className="text-xs text-[#b4aae2]/70 block mt-1">
                      {gameState.lastGuessInfo?.isCorrect 
                        ? `🎉 Decoded correctly by traveler "${gameState.lastGuessInfo.guesser.toUpperCase()}"!` 
                        : '💀 The Ley-lines collapsed. No correct guesses materialized.'}
                    </span>
                  </div>

                  <div className="flex gap-2.5 justify-center">
                    <button
                      onClick={setupNextRound}
                      className="px-5 py-2 bg-gradient-to-r from-[#3fd9c7] to-[#cf4fe6] hover:brightness-110 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase transition-transform active:scale-95 cursor-pointer"
                    >
                      🔄 START NEXT ROUND <ArrowRight className="w-3 h-3 inline ml-1" />
                    </button>
                    {isMeClueGiver && (
                      <button
                        onClick={finishGameAndCrownWinner}
                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all"
                      >
                        👑 END GAME & TALLY CHAMPION
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* GAME OVER STAGE (Leaderboard Crown) */}
              {gameState.status === 'game_over' && (
                <div className="p-5 bg-gradient-to-b from-[#140c24] to-amber-950/20 border border-amber-500/40 rounded-xl text-center space-y-4 animate-fade-in shadow-xl">
                  <Trophy className="w-12 h-12 text-amber-400 animate-pulse mx-auto" />
                  
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 font-extrabold block">👑 CHAMPION CROWNED</span>
                    <span className="text-3xl font-black text-white uppercase tracking-wider font-mono block mt-1">
                      {gameState.winner?.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#b4aae2]/70 block mt-1">Has accumulated the highest mystical cerebral energy!</span>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={resetToLobby}
                      className="px-4 py-2 bg-[#faebd7]/10 hover:bg-[#faebd7]/20 border border-[#faebd7]/20 text-[#faebd7] rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                    >
                      🔄 BACK TO LOBBY
                    </button>
                  </div>
                </div>
              )}

              {/* LIVE SCOREBOARD (Interactive widget) */}
              <div className="p-3.5 bg-[#120826]/70 border border-[#cf4fe6]/15 rounded-xl space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-[#cf4fe6] font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Mystic SCOREBOARD
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(gameState.scores).map(([name, pts]) => {
                    const isGiver = name.toLowerCase() === gameState.clueGiver.toLowerCase();
                    return (
                      <div key={name} className="flex justify-between items-center p-2 rounded-lg bg-[#1c1136]/50 border border-[#cf4fe6]/10">
                        <span className="font-mono text-[10px] font-bold text-[#b4aae2] uppercase truncate max-w-[80px]">
                          {name} {isGiver ? '🔮' : '👤'}
                        </span>
                        <span className="font-mono text-xs text-white font-black">{pts} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* LEAVE / ABORT CHAMBER CONTROL */}
          <div className="pt-2 border-t border-[#3fd9c7]/10 flex justify-between items-center">
            <button
              onClick={leaveChamber}
              className="text-[9px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 uppercase tracking-widest cursor-pointer"
            >
              🏳️ LEAVE THE NEXUS
            </button>
            
            {gameState.status === 'lobby' && (
              <span className="text-[8px] font-mono text-[#b4aae2]/50 uppercase tracking-wider animate-pulse">
                Awaiting more travelers to spawn slots...
              </span>
            )}
          </div>

        </div>
      )}

    </section>
  );
}
