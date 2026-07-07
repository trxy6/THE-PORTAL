import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Shield, User, Award, Play, RotateCw, Trash2, 
  HelpCircle, Eye, EyeOff, Check, X, ArrowRight, Hourglass, 
  Dice5, Search, Zap, Volume2, VolumeX, Swords, Users, Crown 
} from 'lucide-react';
import D20War from './D20War';
import CosmicWords from './CosmicWords';

// Game Types
type GameID = 
  | 'cheat' | 'mafia' | 'celebrity' | 'blackjack' 
  | 'categories' | 'grid_domain' | 'dice_duel' 
  | 'labyrinth' | 'chain_reaction' | 'blink'
  | 'war' | 'cosmic' | 'hilow' | 'scorepad' | 'astrolabe';

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  score: number;
}

interface GameSyncProps {
  playTone?: any;
  triggerHaptic?: any;
  socket?: WebSocket | null;
  joined?: boolean;
  currentUser?: string;
  connectedPlayers?: { userId: string; roll: number | null }[];
  lastAction?: { senderId: string; payload: any } | null;
  sendGameAction?: (payload: any) => void;
}

interface TenGamesArenaProps {
  currentUser?: string | null;
}

export default function TenGamesArena({ currentUser = 'Traveler' }: TenGamesArenaProps) {
  const [activeGame, setActiveGame] = useState<GameID>('war'); // Default to D20 War
  const [filterCategory, setFilterCategory] = useState<'all' | 'chance' | 'social' | 'board'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Traveler (You)', isAI: false, score: 0 },
    { id: '2', name: 'Alchemist AI', isAI: true, score: 0 },
    { id: '3', name: 'Rift Bot', isAI: true, score: 0 }
  ]);

  // WebSocket Connection States
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('arcade_room_code') || 'rift-chamber');
  const [joined, setJoined] = useState(false);
  const [maxPlayersChoice, setMaxPlayersChoice] = useState<number>(4);
  const [connectedPlayers, setConnectedPlayers] = useState<{ userId: string; roll: number | null }[]>([]);
  const [lastAction, setLastAction] = useState<{ senderId: string; payload: any } | null>(null);

  const connectToRoom = (targetRoom: string) => {
    if (!currentUser) return;
    setSocketStatus('connecting');
    localStorage.setItem('arcade_room_code', targetRoom);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-war`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setSocketStatus('connected');
      setSocket(ws);
      ws.send(JSON.stringify({
        type: 'join',
        roomCode: targetRoom,
        userId: currentUser,
        maxPlayers: maxPlayersChoice
      }));
      setJoined(true);
      triggerHaptic([15, 30]);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_sync') {
          setConnectedPlayers(data.players);
        } else if (data.type === 'game_action') {
          setLastAction({ senderId: data.senderId, payload: data.payload });
        }
      } catch (e) {
        console.error("Arcade socket message error", e);
      }
    };

    ws.onclose = () => {
      setSocketStatus('disconnected');
      setSocket(null);
      setJoined(false);
      setConnectedPlayers([]);
    };
  };

  const disconnectFromRoom = () => {
    if (socket) {
      socket.close();
    }
  };

  const sendGameAction = (payload: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'game_action',
        payload
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  // Utility: Haptics fallback
  const triggerHaptic = (pattern: number | number[]) => {
    if (!hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Utility: Synthesizer feedback
  const playTone = (freq: number, type: OscillatorType = 'sine', duration = 0.1) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio synthesis suspended or unsupported.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-[#0c061a]/75 text-[#faebd7] rounded-2xl border border-[#cf4fe6]/15 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-300">
      {/* Background radial atmosphere */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#cf4fe6]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3fd9c7]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-center pb-4 border-b border-[#2e2454] mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#cf4fe6]/20 text-[#cf4fe6] border border-[#cf4fe6]/30 text-[9px] font-bold tracking-[0.2em] uppercase font-mono animate-pulse">Lobby Ready</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#3fd9c7]/20 text-[#3fd9c7] border border-[#3fd9c7]/30 text-[9px] font-bold tracking-[0.2em] uppercase font-mono">100% Free</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider uppercase mt-1 text-transparent bg-clip-text bg-gradient-to-r from-[#ffe9b8] via-[#cf4fe6] to-[#3fd9c7]">
            The Cabin Arcade
          </h1>
          <p className="text-xs text-[#b4aae2]/70 font-sans mt-0.5">Offline-first solo & family-friendly co-op group party suite.</p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 select-none font-mono">
          <button 
            onClick={() => { setSoundEnabled(!soundEnabled); triggerHaptic(10); }}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${soundEnabled ? 'border-[#3fd9c7]/50 bg-[#3fd9c7]/10 text-[#3fd9c7]' : 'border-[#44387a]/40 bg-black/20 text-slate-500'}`}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button 
            onClick={() => { setHapticsEnabled(!hapticsEnabled); triggerHaptic(20); }}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${hapticsEnabled ? 'border-[#cf4fe6]/50 bg-[#cf4fe6]/10 text-[#cf4fe6]' : 'border-[#44387a]/40 bg-black/20 text-slate-500'}`}
            title="Toggle Haptics"
          >
            📳
          </button>
        </div>
      </div>

      {/* Universal Multiplayer Connection Panel */}
      <div className="mb-6 p-4 rounded-xl border border-[#3fd9c7]/15 bg-[#120a2c]/55 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3fd9c7] animate-ping"></div>
          <div>
            <span className="text-[11px] font-bold text-[#3fd9c7] uppercase tracking-wider block leading-none">Arcade Rift Portal</span>
            <span className="text-[9px] text-[#b4aae2]/70 mt-1 block">Connect with friends using the same room code to sync all games!</span>
          </div>
        </div>

        {joined ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/35">
              <span className="text-[9px] font-bold text-emerald-400 font-mono">
                🔮 ROOM: {roomCode.toUpperCase()} ({connectedPlayers.length}/{maxPlayersChoice})
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {connectedPlayers.map((p, i) => (
                <span key={i} className="text-[9.5px] font-bold font-mono px-2 py-1 rounded bg-[#cf4fe6]/10 border border-[#cf4fe6]/30 text-[#faebd7]">
                  {p.userId === currentUser ? '👑 (You)' : p.userId}
                </span>
              ))}
            </div>

            <button
              onClick={disconnectFromRoom}
              className="px-3.5 py-1.5 bg-transparent border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-[10px] uppercase font-bold tracking-wider transition cursor-pointer"
            >
              Close Connection
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="Enter room code..."
              className="bg-black/40 border border-[#44387a]/45 rounded-lg px-3 py-1.5 text-xs font-mono text-[#faebd7] placeholder-[#b4aae2]/30 focus:outline-none focus:border-[#3fd9c7]"
            />
            <div className="flex items-center gap-1 bg-black/20 border border-[#44387a]/20 rounded-lg p-0.5">
              <span className="text-[8px] text-slate-500 px-2 uppercase font-bold">Max</span>
              <select
                value={maxPlayersChoice}
                onChange={(e) => setMaxPlayersChoice(Number(e.target.value))}
                className="bg-transparent border-none text-xs text-amber-400 font-mono py-1 px-1 focus:outline-none cursor-pointer"
              >
                <option value={2}>2 Players</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
              </select>
            </div>
            <button
              onClick={() => connectToRoom(roomCode)}
              disabled={socketStatus === 'connecting'}
              className="px-4 py-2 bg-gradient-to-r from-[#3fd9c7] to-[#cf4fe6] text-slate-950 font-bold rounded-lg text-[10.5px] uppercase tracking-wider hover:brightness-110 transition cursor-pointer shadow-[0_0_12px_rgba(63,217,199,0.2)]"
            >
              {socketStatus === 'connecting' ? 'Channelling...' : '⚡ Sync Room'}
            </button>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap font-mono text-[9px] uppercase tracking-wider select-none">
        {[
          { id: 'all', label: '⚡ ALL GAMES' },
          { id: 'chance', label: '🎲 CHANCE & DICE' },
          { id: 'social', label: '🔮 SOCIAL & WORDS' },
          { id: 'board', label: '🟩 BOARD & TOOLS' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id as any)}
            className={`px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              filterCategory === cat.id 
                ? 'border-[#3fd9c7] bg-[#3fd9c7]/15 text-[#3fd9c7] shadow-[0_0_8px_rgba(63,217,199,0.15)] font-bold'
                : 'border-[#44387a]/20 bg-[#120826]/40 text-[#b4aae2]/65 hover:text-white hover:border-[#3fd9c7]/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Game Selector Menu Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-6 select-none font-mono text-[10px] font-bold">
        {[
          // Chance & Dice category
          { id: 'war', label: '⚔️ D20 War', category: 'chance', desc: 'Real-time online multiplayer D20 roll battles' },
          { id: 'hilow', label: '🎲 Hi-Lo', category: 'chance', desc: 'Predict if the next roll of the polyhedral D20 will be higher or lower' },
          { id: 'dice_duel', label: '🎲 Dice Duel', category: 'chance', desc: 'Push-your-luck golden potion dice collection duel' },
          { id: 'blackjack', label: '🎩 Alchem-21', category: 'chance', desc: 'Offline card blackjack game vs Alchemist AI' },
          { id: 'blink', label: '⚡ Blink Tap', category: 'chance', desc: 'Reaction timer tapping game' },

          // Social & Words category
          { id: 'mafia', label: '🐺 Werewolf', category: 'social', desc: 'Narrator-driven role assignment party game' },
          { id: 'cheat', label: '🃏 Cheat / Doubt', category: 'social', desc: 'Card shedding game of bluffing vs bots' },
          { id: 'celebrity', label: '🎫 Fishbowl', category: 'social', desc: 'Word guessing party game in rounds' },
          { id: 'categories', label: '✏️ Categories', category: 'social', desc: 'Word category naming battle against time' },
          { id: 'cosmic', label: '🔮 Cosmic Words', category: 'social', desc: 'Multiplayer word clue and anagram guessing' },

          // Board & Tools category
          { id: 'grid_domain', label: '🟩 Grid Domain', category: 'board', desc: 'Territory capture tactical strategy game' },
          { id: 'labyrinth', label: '🔦 Fog Escape', category: 'board', desc: 'Fog of war grid escape labyrinth' },
          { id: 'chain_reaction', label: '💥 Chain Burst', category: 'board', desc: 'Physics-based ball bouncing match' },
          { id: 'astrolabe', label: '💫 Astrolabe', category: 'board', desc: 'Random group choice spinner' },
          { id: 'scorepad', label: '📝 Scorepad', category: 'board', desc: 'Board game scores and tracker tool' }
        ]
        .filter(g => filterCategory === 'all' || g.category === filterCategory)
        .map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setActiveGame(g.id as GameID);
              triggerHaptic(10);
              playTone(300 + (Math.random() * 200), 'sine', 0.08);
            }}
            className={`py-3 px-2 border rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(207,79,230,0.15)] text-center flex flex-col justify-center items-center gap-1 min-h-[58px] ${
              activeGame === g.id 
                ? 'bg-gradient-to-tr from-[#1b1035] to-[#0c051a] border-[#cf4fe6] shadow-[0_0_12px_rgba(207,79,230,0.3)] text-white scale-[1.02]' 
                : 'border-[#44387a]/25 bg-black/20 text-[#b4aae2]/70 hover:text-white hover:border-[#cf4fe6]/45'
            }`}
            title={g.desc}
          >
            <span className="text-[10.5px] leading-tight">{g.label}</span>
          </button>
        ))}
      </div>

      {/* ACTIVE GAME CANVAS / RENDER AREA */}
      <div className="min-h-[440px] bg-[#090314]/55 rounded-2xl border border-[#3fd9c7]/10 p-6 flex flex-col justify-between backdrop-blur-md">
        
        {/* GAME 1: CHEAT (I DOUBT IT) */}
        {activeGame === 'cheat' && (
          <CheatGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 2: MAFIA / WEREWOLF */}
        {activeGame === 'mafia' && (
          <MafiaGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 3: CELEBRITY / FISHBOWL */}
        {activeGame === 'celebrity' && (
          <CelebrityGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 4: ALCHEMICAL BLACKJACK */}
        {activeGame === 'blackjack' && (
          <BlackjackGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 5: CATEGORIES */}
        {activeGame === 'categories' && (
          <CategoriesGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 6: GRID DOMAIN */}
        {activeGame === 'grid_domain' && (
          <GridDomainGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 7: DICE DUEL */}
        {activeGame === 'dice_duel' && (
          <DiceDuelGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 8: FOG ESCAPE */}
        {activeGame === 'labyrinth' && (
          <LabyrinthGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 9: CHAIN BURST */}
        {activeGame === 'chain_reaction' && (
          <ChainReactionGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 10: BLINK TAP */}
        {activeGame === 'blink' && (
          <BlinkGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 11: D20 WAR */}
        {activeGame === 'war' && <D20War currentUser={currentUser} />}

        {/* GAME 12: COSMIC WORDS */}
        {activeGame === 'cosmic' && <CosmicWords currentUser={currentUser} />}

        {/* GAME 13: HI-LO */}
        {activeGame === 'hilow' && (
          <HiLoGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 14: SCOREPAD */}
        {activeGame === 'scorepad' && (
          <ScorepadGame 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

        {/* GAME 15: ASTROLABE */}
        {activeGame === 'astrolabe' && (
          <AstrolabeGame 
            playTone={playTone} 
            triggerHaptic={triggerHaptic} 
            joined={joined} 
            currentUser={currentUser} 
            connectedPlayers={connectedPlayers} 
            lastAction={lastAction} 
            sendGameAction={sendGameAction} 
          />
        )}

      </div>
    </div>
  );
}

// ==========================================
// 1. CHEAT / I DOUBT IT DECEPTION CARD GAME
// ==========================================
interface Card {
  id: string;
  value: string;
  suit?: string;
}

function CheatGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHands, setBots] = useState<Record<string, Card[]>>({ AI_1: [], AI_2: [] });
  const [pile, setPile] = useState<Card[]>([]);
  const [targetValue, setTargetValue] = useState<string>('A');
  const [log, setLog] = useState<string>('Welcome to the Deception Chamber. Shuffle the deck to begin.');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [turnOwner, setTurnOwner] = useState<string>('Player'); // 'Player', 'AI_1', 'AI_2'
  const [lastPlay, setLastPlay] = useState<{ player: string; count: number; declared: string; actual: Card[] } | null>(null);
  const [doubtPeriod, setDoubtPeriod] = useState<boolean>(false);

  const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUITS = ['♥', '♦', '♣', '♠'];

  const initGame = () => {
    const freshDeck: Card[] = [];
    let counter = 0;
    VALUES.forEach(val => {
      SUITS.forEach(suit => {
        freshDeck.push({ id: `card-${counter++}`, value: val, suit });
      });
    });
    const shuffled = freshDeck.sort(() => Math.random() - 0.5);
    
    setPlayerHand(shuffled.slice(0, 17));
    setBots({
      AI_1: shuffled.slice(17, 34),
      AI_2: shuffled.slice(34, 52)
    });
    setPile([]);
    setTargetValue('A');
    setSelectedCards([]);
    setTurnOwner('Player');
    setLastPlay(null);
    setDoubtPeriod(false);
    setLog('52-card deck dealt! You received 17 cards. Play cards face down claiming they are "A"s.');
    if (playTone) playTone(523, 'triangle', 0.25);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardSelect = (cardId: string) => {
    if (turnOwner !== 'Player' || doubtPeriod) return;
    if (triggerHaptic) triggerHaptic(6);
    setSelectedCards(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const nextTarget = (current: string) => {
    const idx = VALUES.indexOf(current);
    return VALUES[(idx + 1) % VALUES.length];
  };

  const handlePlayerDiscard = () => {
    if (selectedCards.length === 0 || turnOwner !== 'Player' || doubtPeriod) return;
    if (triggerHaptic) triggerHaptic(15);
    if (playTone) playTone(349, 'sine', 0.15);

    const actualDiscards = playerHand.filter(c => selectedCards.includes(c.id));
    setPlayerHand(prev => prev.filter(c => !selectedCards.includes(c.id)));
    setPile(prev => [...prev, ...actualDiscards]);
    setSelectedCards([]);

    const claimsLie = actualDiscards.some(c => c.value !== targetValue);
    const newPlay = { player: 'Player', count: actualDiscards.length, declared: targetValue, actual: actualDiscards };
    setLastPlay(newPlay);
    setDoubtPeriod(true);
    setLog(`You placed ${actualDiscards.length} card(s) claiming they are "${targetValue}"s. Waiting to see if anyone doubts...`);

    if (joined && sendGameAction) {
      sendGameAction({ type: 'cheat_play', play: newPlay });
    }

    // Trigger AI doubt decision
    setTimeout(() => {
      const isBluff = claimsLie;
      const doubtThreshold = isBluff ? 0.65 : 0.18;
      if (Math.random() < doubtThreshold) {
        // AI calls doubt!
        resolveDoubt('AI_1');
      } else {
        // No doubt called, proceed to next turn
        setDoubtPeriod(false);
        const nextVal = nextTarget(targetValue);
        setTargetValue(nextVal);
        setTurnOwner('AI_1');
        runAITurn(nextVal, 'AI_1');
      }
    }, 2000);
  };

  const callDoubt = () => {
    if (!doubtPeriod || !lastPlay) return;
    resolveDoubt('Player');
  };

  const resolveDoubt = (challenger: string) => {
    if (!lastPlay) return;
    setDoubtPeriod(false);
    const isBluff = lastPlay.actual.some(c => c.value !== lastPlay.declared);

    if (isBluff) {
      // Bluffer takes the whole pile
      const bluffer = lastPlay.player;
      setLog(`🔍 DUBIOUS BLUFF EXPOSED! ${challenger} called cheat! ${bluffer} lied and must pick up all ${pile.length} cards from the center pile!`);
      if (bluffer === 'Player') {
        setPlayerHand(prev => [...prev, ...pile]);
      } else {
        setBots(prev => ({
          ...prev,
          [bluffer]: [...prev[bluffer], ...pile]
        }));
      }
      if (triggerHaptic) triggerHaptic([80, 50, 100]);
      if (playTone) playTone(220, 'sawtooth', 0.5);
    } else {
      // Challenger was wrong, challenger takes the whole pile
      setLog(`🔍 HONEST PLAY PROVEN! ${challenger} falsely accused ${lastPlay.player}! ${challenger} must pick up all ${pile.length} cards!`);
      if (challenger === 'Player') {
        setPlayerHand(prev => [...prev, ...pile]);
      } else {
        setBots(prev => ({
          ...prev,
          [challenger]: [...prev[challenger], ...pile]
        }));
      }
      if (triggerHaptic) triggerHaptic(15);
      if (playTone) playTone(659, 'sine', 0.25);
    }

    setPile([]);
    setLastPlay(null);
    const nextVal = nextTarget(targetValue);
    setTargetValue(nextVal);

    // Switch turns
    const currentIdx = ['Player', 'AI_1', 'AI_2'].indexOf(lastPlay.player);
    const nextTurn = ['Player', 'AI_1', 'AI_2'][(currentIdx + 1) % 3];
    setTurnOwner(nextTurn);
    if (nextTurn !== 'Player') {
      runAITurn(nextVal, nextTurn);
    }
  };

  const runAITurn = (nextVal: string, owner: string) => {
    setTimeout(() => {
      const hand = botHands[owner] || [];
      if (hand.length === 0) {
        setLog(`Game Over! ${owner} successfully discarded all cards and won the match!`);
        return;
      }

      // AI decides to bluff or play truthfully
      const matching = hand.filter(c => c.value === nextVal);
      let discards: Card[] = [];
      const playsLie = matching.length === 0 || Math.random() < 0.25;

      if (!playsLie && matching.length > 0) {
        discards = matching.slice(0, Math.floor(Math.random() * matching.length) + 1);
      } else {
        const randomCount = Math.floor(Math.random() * 2) + 1;
        const shuffledHand = [...hand].sort(() => Math.random() - 0.5);
        discards = shuffledHand.slice(0, Math.min(randomCount, hand.length));
      }

      setBots(prev => ({
        ...prev,
        [owner]: prev[owner].filter(c => !discards.map(d => d.id).includes(c.id))
      }));
      setPile(prev => [...prev, ...discards]);

      const newPlay = { player: owner, count: discards.length, declared: nextVal, actual: discards };
      setLastPlay(newPlay);
      setDoubtPeriod(true);
      setLog(`${owner} placed ${discards.length} card(s) claiming they are "${nextVal}"s. Accuse them of lying or let them pass...`);
      if (playTone) playTone(440, 'triangle', 0.12);

      // AI peer doubts with random check
      setTimeout(() => {
        const peer = owner === 'AI_1' ? 'AI_2' : 'AI_1';
        const peerBluffDoubtChance = playsLie ? 0.55 : 0.12;
        if (Math.random() < peerBluffDoubtChance) {
          resolveDoubt(peer);
        } else {
          setDoubtPeriod(false);
          const nextTargetVal = nextTarget(nextVal);
          setTargetValue(nextTargetVal);
          const nextOwner = owner === 'AI_1' ? 'AI_2' : 'Player';
          setTurnOwner(nextOwner);
          if (nextOwner !== 'Player') {
            runAITurn(nextTargetVal, nextOwner);
          } else {
            setLog(`No one doubted ${owner}'s claim. Your turn to place "${nextTargetVal}"s.`);
          }
        }
      }, 2500);

    }, 1500);
  };

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-pink-400">🃏 Cheat / I Doubt It</span>
        <button onClick={initGame} className="text-[10px] text-pink-400/80 hover:text-white transition cursor-pointer">Shuffle & Deal</button>
      </div>

      <div className="bg-[#120a24]/85 border border-[#44387a]/40 p-3 rounded-xl min-h-[90px] text-xs leading-relaxed font-mono flex items-center justify-center text-center">
        {log}
      </div>

      <div className="grid grid-cols-4 gap-2.5 my-3.5 text-center">
        <div className="bg-black/30 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">Target Value</span>
          <span className="text-lg font-black text-pink-400 font-mono">{targetValue}</span>
        </div>
        <div className="bg-black/30 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">Center Pile</span>
          <span className="text-lg font-black text-white font-mono">{pile.length}</span>
        </div>
        <div className="bg-black/30 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">AI 1 Cards</span>
          <span className="text-lg font-black text-[#cf4fe6] font-mono">{botHands.AI_1.length}</span>
        </div>
        <div className="bg-black/30 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">AI 2 Cards</span>
          <span className="text-lg font-black text-[#3fd9c7] font-mono">{botHands.AI_2.length}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Your Hand ({playerHand.length} cards)</span>
          {turnOwner === 'Player' && !doubtPeriod && <span className="text-[9.5px] font-bold text-pink-400 animate-pulse uppercase">Your Turn! ⚡</span>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 pt-1 select-none scrollbar-thin">
          {playerHand.map((card) => {
            const isSelected = selectedCards.includes(card.id);
            const isRed = card.suit === '♥' || card.suit === '♦';
            return (
              <button
                key={card.id}
                onClick={() => handleCardSelect(card.id)}
                className={`w-11 h-16 rounded-xl font-mono text-sm font-black flex flex-col justify-between p-2 border transition-all shrink-0 cursor-pointer ${
                  isSelected 
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white border-white -translate-y-2 shadow-[0_5px_15px_rgba(236,72,153,0.4)]' 
                    : 'bg-[#1b1236]/80 text-[#faebd7] border-[#44387a]/45 hover:border-pink-500/50'
                }`}
              >
                <span className="text-left text-xs leading-none">{card.value}</span>
                <span className={`text-right text-base leading-none self-end ${isSelected ? 'text-white' : isRed ? 'text-red-400' : 'text-slate-300'}`}>{card.suit}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2.5 select-none mt-2">
          {doubtPeriod && turnOwner !== 'Player' ? (
            <button
              onClick={callDoubt}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:brightness-110 active:scale-95 text-white text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
            >
              🚨 Call Cheat! (I Doubt It)
            </button>
          ) : (
            <button
              onClick={handlePlayerDiscard}
              disabled={selectedCards.length === 0 || turnOwner !== 'Player' || doubtPeriod}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              Place Selected Cards Face Down
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. SOCIAL DEDUCTION GAME (MAFIA / WEREWOLF)
// ==========================================
function MafiaGame({ playTone, triggerHaptic }: GameSyncProps) {
  type WPhase = 'setup' | 'role_reveal' | 'night_intro' | 'night_wolf' | 'night_seer' | 'night_doctor' | 'day_reveal' | 'day_vote' | 'game_over';

  interface WPlayer {
    name: string;
    role: 'Werewolf' | 'Villager' | 'Seer' | 'Doctor';
    alive: boolean;
    protected: boolean;
  }

  interface ChatMessage {
    id: string;
    sender: 'Narrator' | 'System' | 'Action';
    text: string;
  }

  const [playerCount, setPlayerCount] = useState(5);
  const [playerNames, setPlayerNames] = useState<string[]>(['Alex', 'Blake', 'Casey', 'Dana', 'Evan', 'Faye', 'Gus', 'Hana']);
  const [players, setPlayers] = useState<WPlayer[]>([]);
  const [phase, setPhase] = useState<WPhase>('setup');
  const [revealIdx, setRevealIdx] = useState(0);
  const [showRole, setShowRole] = useState(false);

  // Narrator Chat Log State
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(false);

  // Night State
  const [nightKill, setNightKill] = useState<string | null>(null);
  const [doctorSave, setDoctorSave] = useState<string | null>(null);
  const [seerResult, setSeerResult] = useState<string | null>(null);
  const [voteTally, setVoteTally] = useState<Record<string, number>>({});
  const [eliminatedLast, setEliminatedLast] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  // Web Audio Synth Drones
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const startAmbientDrone = () => {
    if (!ambientEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopAmbientDrone();

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, ctx.currentTime); // Low A hum

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, ctx.currentTime); // Dark filtered hum

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5); // Slow fade-in

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      droneOscRef.current = osc;
      droneGainRef.current = gain;
    } catch (e) {
      console.error(e);
    }
  };

  const stopAmbientDrone = () => {
    try {
      if (droneOscRef.current) {
        droneOscRef.current.stop();
        droneOscRef.current.disconnect();
        droneOscRef.current = null;
      }
      if (droneGainRef.current) {
        droneGainRef.current.disconnect();
        droneGainRef.current = null;
      }
    } catch (e) {}
  };

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.7; // Spooky deep tone
      utterance.rate = 0.85; // Measured pace
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  const pushMessage = (sender: 'Narrator' | 'System' | 'Action', text: string) => {
    setChatLog(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, sender, text }]);
    if (sender === 'Narrator') {
      speak(text);
    }
  };

  // Auto-scroll chat log
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Clean up sound drone on unmount
  useEffect(() => {
    return () => {
      stopAmbientDrone();
    };
  }, []);

  const buildRoles = (count: number): WPlayer['role'][] => {
    const wolves = count <= 5 ? 1 : count <= 7 ? 2 : 3;
    const roles: WPlayer['role'][] = [];
    for (let i = 0; i < wolves; i++) roles.push('Werewolf');
    roles.push('Seer');
    roles.push('Doctor');
    while (roles.length < count) roles.push('Villager');
    return roles.sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    if (triggerHaptic) triggerHaptic(30);
    if (playTone) playTone(220, 'sawtooth', 0.4);

    const roles = buildRoles(playerCount);
    const newPlayers: WPlayer[] = Array.from({ length: playerCount }).map((_, i) => ({
      name: playerNames[i]?.trim() || `Player ${i + 1}`,
      role: roles[i]!,
      alive: true,
      protected: false
    }));

    setPlayers(newPlayers);
    setRevealIdx(0);
    setNightKill(null);
    setDoctorSave(null);
    setSeerResult(null);
    setVoteTally({});
    setEliminatedLast(null);
    setWinner(null);
    setShowRole(false);
    setChatLog([]);
    setPhase('role_reveal');

    setTimeout(() => {
      pushMessage('System', '🔮 Alchemical Narrator Bot initialized.');
      pushMessage('Narrator', `Let's reveal your secret alignment. Hand the device to ${newPlayers[0]?.name}.`);
    }, 100);
  };

  const revealNext = () => {
    if (triggerHaptic) triggerHaptic(12);
    setShowRole(false);
    const next = revealIdx + 1;
    if (next >= players.length) {
      setPhase('night_intro');
      startAmbientDrone();
      pushMessage('System', '🌑 All alignments revealed. Transitioning to Night Phase.');
      pushMessage('Narrator', 'Night falls upon the cabin. Everyone, close your eyes. No peeking.');
    } else {
      setRevealIdx(next);
      pushMessage('Narrator', `Pass the device to ${players[next]?.name}.`);
    }
  };

  const proceedToNightActions = () => {
    setPhase('night_wolf');
    if (playTone) playTone(110, 'sine', 0.5);
    pushMessage('Narrator', 'Werewolves, wake up. Open your eyes. Select a victim to eliminate.');
  };

  const wolfKill = (target: string) => {
    if (triggerHaptic) triggerHaptic([80, 50, 80]);
    if (playTone) playTone(160, 'sawtooth', 0.3);
    setNightKill(target);

    // Check if Seer is alive
    const seerAlive = players.some(p => p.alive && p.role === 'Seer');
    if (seerAlive) {
      setPhase('night_seer');
      pushMessage('Narrator', 'Werewolves, close your eyes. Seer, wake up. Open your eyes. Choose someone to investigate.');
    } else {
      // Skip Seer
      const doctorAlive = players.some(p => p.alive && p.role === 'Doctor');
      if (doctorAlive) {
        setPhase('night_doctor');
        pushMessage('Narrator', 'Seer is not present or eliminated. Doctor, wake up. Open your eyes. Choose someone to protect.');
      } else {
        resolveNight(target, null);
      }
    }
  };

  const seerCheck = (target: string) => {
    const p = players.find(p => p.name === target);
    const isWolf = p?.role === 'Werewolf';
    setSeerResult(`${target} is → ${isWolf ? '🐺 WEREWOLF' : '🕊️ VILLAGER'}`);

    if (triggerHaptic) triggerHaptic(20);
    if (playTone) playTone(330, 'sine', 0.2);

    const doctorAlive = players.some(p => p.alive && p.role === 'Doctor');
    if (doctorAlive) {
      setPhase('night_doctor');
      pushMessage('Narrator', 'Seer, close your eyes. Doctor, wake up. Open your eyes. Choose someone to protect.');
    } else {
      resolveNight(nightKill!, null);
    }
  };

  const doctorProtect = (target: string) => {
    if (triggerHaptic) triggerHaptic(15);
    if (playTone) playTone(440, 'sine', 0.25);
    setDoctorSave(target);
    resolveNight(nightKill!, target);
  };

  const resolveNight = (kill: string, save: string | null) => {
    stopAmbientDrone();
    setPhase('day_reveal');

    const saved = kill === save;
    const newPlayers = players.map(p => ({
      ...p,
      alive: p.name === kill && !saved ? false : p.alive
    }));
    setPlayers(newPlayers);

    const storyMessage = saved
      ? `✨ Morning rises. The Werewolves targeted ${kill}, but the Doctor successfully saved them! Nobody died.`
      : `☠️ Morning rises. A cold body is discovered near the fireplace. ${kill} has been eliminated.`;

    setEliminatedLast(saved ? null : kill);
    pushMessage('Narrator', storyMessage);

    const isOver = checkVictory(newPlayers);
    if (!isOver) {
      setVoteTally({});
    }
  };

  const handleVote = (voter: string, candidate: string) => {
    if (triggerHaptic) triggerHaptic(10);
    setVoteTally(prev => ({
      ...prev,
      [voter]: prev[voter] === candidate ? '' : candidate // toggle vote
    }));
  };

  const banishCandidate = (candidate: string) => {
    if (triggerHaptic) triggerHaptic([100, 50, 100]);
    if (playTone) playTone(200, 'sawtooth', 0.4);

    const newPlayers = players.map(p => ({
      ...p,
      alive: p.name === candidate ? false : p.alive
    }));
    setPlayers(newPlayers);

    pushMessage('Narrator', `⚖️ The village holds a trial. By majority consensus, ${candidate} is banished from the cabin.`);

    const isOver = checkVictory(newPlayers);
    if (!isOver) {
      setPhase('night_intro');
      startAmbientDrone();
      setTimeout(() => {
        pushMessage('Narrator', 'Night falls once again. Everyone, close your eyes. The shadows lengthen.');
      }, 2000);
    }
  };

  const checkVictory = (ps: WPlayer[]) => {
    const aliveWolves = ps.filter(p => p.alive && p.role === 'Werewolf').length;
    const aliveVillagers = ps.filter(p => p.alive && p.role !== 'Werewolf').length;

    if (aliveWolves === 0) {
      setWinner('Villagers');
      setPhase('game_over');
      pushMessage('Narrator', '🎉 VILLAGE WINS! All Werewolves have been successfully banished!');
      if (playTone) playTone(523, 'sine', 0.5);
      return true;
    }
    if (aliveWolves >= aliveVillagers) {
      setWinner('Werewolves');
      setPhase('game_over');
      pushMessage('Narrator', '🐺 WEREWOLVES WIN! The beasts have overrun the cabin!');
      if (playTone) playTone(130, 'sawtooth', 0.6);
      return true;
    }
    return false;
  };

  const handleNameChange = (idx: number, name: string) => {
    const nextNames = [...playerNames];
    nextNames[idx] = name;
    setPlayerNames(nextNames);
  };

  const alive = players.filter(p => p.alive);

  return (
    <div className="flex-grow flex flex-col justify-between select-none max-h-[500px]">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-fuchsia-400">🐺 Werewolf Narrator Bot</span>
        {phase !== 'setup' && (
          <button
            onClick={() => {
              stopAmbientDrone();
              setPhase('setup');
            }}
            className="text-[10px] text-fuchsia-400/80 hover:text-white transition cursor-pointer"
          >
            ← Leave Game
          </button>
        )}
      </div>

      {/* Setup Screen */}
      {phase === 'setup' && (
        <div className="flex-grow flex flex-col justify-between overflow-y-auto pr-1">
          <div className="space-y-4">
            <p className="text-[11px] text-slate-400 leading-relaxed text-center">
              An offline Narrator Bot guides the game with ambient music, voice output, and interactive terminal story logs.
            </p>

            {/* Players count selector */}
            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-fuchsia-500/15">
              <span className="text-[11px] text-slate-300 font-bold font-mono">PLAYER TOTAL:</span>
              <div className="flex gap-1.5">
                {[4, 5, 6, 7, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono border transition cursor-pointer ${
                      playerCount === n ? 'bg-fuchsia-600 border-fuchsia-400 text-white' : 'bg-black/40 border-[#44387a]/30 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVoiceEnabled(v => !v)}
                className={`py-2 rounded-xl text-[10px] font-bold font-mono border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  voiceEnabled
                    ? 'bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.15)]'
                    : 'bg-black/30 border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
              >
                <span>{voiceEnabled ? '🔊 VOICE: ON' : '🔇 VOICE: OFF'}</span>
              </button>

              <button
                onClick={() => setAmbientEnabled(a => !a)}
                className={`py-2 rounded-xl text-[10px] font-bold font-mono border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  ambientEnabled
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                    : 'bg-black/30 border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
              >
                <span>{ambientEnabled ? '🎵 MUSIC: ON' : '🔇 MUSIC: OFF'}</span>
              </button>
            </div>

            {/* Customize Names */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Names:</span>
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {Array.from({ length: playerCount }).map((_, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={playerNames[idx] || ''}
                    onChange={e => handleNameChange(idx, e.target.value)}
                    placeholder={`Player ${idx + 1}`}
                    className="bg-black/40 border border-[#44387a]/30 text-white rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-fuchsia-400"
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full mt-4 py-3 bg-gradient-to-r from-fuchsia-700 to-purple-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition shadow-[0_0_15px_rgba(217,70,239,0.3)]"
          >
            🌑 Summon alignments
          </button>
        </div>
      )}

      {/* Game Terminal / Chat Screen */}
      {phase !== 'setup' && (
        <div className="flex-grow flex flex-col justify-between overflow-hidden">
          {/* Narrator Interactive Chat Log */}
          <div className="flex-grow bg-[#090314]/90 border border-fuchsia-950/50 rounded-xl p-3 overflow-y-auto max-h-[220px] mb-3 space-y-2.5 shadow-inner">
            {chatLog.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col text-[11px] font-mono leading-relaxed ${
                  msg.sender === 'Narrator'
                    ? 'text-fuchsia-200 border-l-2 border-fuchsia-500/60 pl-2'
                    : msg.sender === 'System'
                      ? 'text-cyan-400/80 bg-cyan-950/10 px-2 py-0.5 rounded border border-cyan-950/20'
                      : 'text-amber-400'
                }`}
              >
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                  {msg.sender === 'Narrator' ? '🔊 Narrator Bot' : msg.sender === 'System' ? '👾 System' : '📜 Action log'}
                </span>
                <p>{msg.text}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Contextual Action Areas */}

          {/* 1. Role Reveal Screen */}
          {phase === 'role_reveal' && players[revealIdx] && (
            <div className="bg-black/30 border border-[#44387a]/20 rounded-xl p-3.5 flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
                🕵️ Pass to {players[revealIdx].name}
              </span>
              {!showRole ? (
                <button
                  onClick={() => {
                    setShowRole(true);
                    if (triggerHaptic) triggerHaptic(20);
                  }}
                  className="px-6 py-2.5 bg-indigo-700/80 hover:bg-indigo-600 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                >
                  👁️ Check alignment
                </button>
              ) : (
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">
                      {players[revealIdx].role === 'Werewolf' ? '🐺' : players[revealIdx].role === 'Seer' ? '🔮' : players[revealIdx].role === 'Doctor' ? '💉' : '🏡'}
                    </span>
                    <span className="text-lg font-black text-fuchsia-300 uppercase font-mono">{players[revealIdx].role}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {players[revealIdx].role === 'Werewolf' && 'Work secretly with other wolves to target villagers each night.'}
                    {players[revealIdx].role === 'Seer' && 'Each night investigate one player to reveal if they are a werewolf.'}
                    {players[revealIdx].role === 'Doctor' && 'Each night select one player to protect from werewolf elimination.'}
                    {players[revealIdx].role === 'Villager' && 'Participate in daytime group discussion to banish the hidden beasts.'}
                  </p>
                  <button
                    onClick={revealNext}
                    className="mt-3 px-5 py-2 bg-fuchsia-700 hover:bg-fuchsia-600 text-white text-[10px] font-bold uppercase rounded-xl cursor-pointer"
                  >
                    {revealIdx + 1 < players.length ? `Pass to ${players[revealIdx + 1]?.name}` : 'Begin nightfall 🌑'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Night Intro Screen */}
          {phase === 'night_intro' && (
            <div className="bg-black/30 border border-purple-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-3 font-mono">The cabin grows silent. Close all eyes.</p>
              <button
                onClick={proceedToNightActions}
                className="px-8 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold uppercase rounded-xl cursor-pointer transition shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse"
              >
                Proceed to Werewolf Turn
              </button>
            </div>
          )}

          {/* 3. Werewolf Night Vote */}
          {phase === 'night_wolf' && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-fuchsia-300 uppercase tracking-widest block text-center mb-1">
                🐺 Pass device to Werewolves. Choose targets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {players.filter(p => p.alive).map(p => (
                  <button
                    key={p.name}
                    onClick={() => wolfKill(p.name)}
                    className="py-2.5 rounded-xl bg-red-950/20 border border-red-500/20 hover:border-red-400 hover:bg-red-900/30 text-xs font-bold text-slate-200 cursor-pointer font-mono transition"
                  >
                    Eliminate {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Seer Investigation */}
          {phase === 'night_seer' && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-cyan-300 uppercase tracking-widest block text-center mb-1">
                🔮 Pass to Seer. Inspect a suspect:
              </span>
              {seerResult ? (
                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-cyan-300 font-mono mb-2">{seerResult}</p>
                  <button
                    onClick={() => seerCheck(players.find(p => p.alive && p.role === 'Seer')?.name || '')}
                    className="px-6 py-2 bg-cyan-700 text-white text-[10px] font-bold uppercase rounded-xl cursor-pointer"
                  >
                    Confirm & Proceed
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {players.filter(p => p.alive && p.role !== 'Seer').map(p => (
                    <button
                      key={p.name}
                      onClick={() => seerCheck(p.name)}
                      className="py-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-900/30 text-xs font-bold text-slate-200 cursor-pointer font-mono transition"
                    >
                      Inspect {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Doctor Protection */}
          {phase === 'night_doctor' && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest block text-center mb-1">
                💉 Pass to Doctor. Protect one player:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {players.filter(p => p.alive).map(p => (
                  <button
                    key={p.name}
                    onClick={() => doctorProtect(p.name)}
                    className="py-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-400 hover:bg-emerald-900/30 text-xs font-bold text-slate-200 cursor-pointer font-mono transition"
                  >
                    Protect {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Day Reveal */}
          {phase === 'day_reveal' && (
            <div className="bg-black/30 border border-amber-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-2.5 font-mono">Gather the survivors. Open all eyes.</p>
              <button
                onClick={() => setPhase('day_vote')}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Proceed to trial vote ⚖️
              </button>
            </div>
          )}

          {/* 7. Day Vote and Accusations */}
          {phase === 'day_vote' && (
            <div className="space-y-3 overflow-y-auto max-h-[160px] pr-1">
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block text-center">
                ⚖️ Village trial. Cast votes or banish:
              </span>
              <div className="space-y-1.5">
                {players.filter(p => p.alive).map(p => {
                  const votesForMe = Object.values(voteTally).filter(v => v === p.name).length;
                  return (
                    <div key={p.name} className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 font-mono">{p.name}</span>
                        {votesForMe > 0 && (
                          <span className="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded-full font-mono">
                            🗳️ {votesForMe}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {/* Voter selectors */}
                        <div className="flex gap-1">
                          {players.filter(v => v.alive).map(voter => {
                            const isVotingMe = voteTally[voter.name] === p.name;
                            return (
                              <button
                                key={voter.name}
                                onClick={() => handleVote(voter.name, p.name)}
                                className={`w-5 h-5 rounded text-[8px] font-mono font-bold flex items-center justify-center border transition cursor-pointer ${
                                  isVotingMe
                                    ? 'bg-red-600 border-red-400 text-white'
                                    : 'bg-black/30 border-slate-800 text-slate-500 hover:text-slate-400'
                                }`}
                                title={`${voter.name}'s vote`}
                              >
                                {voter.name.slice(0, 1)}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => banishCandidate(p.name)}
                          className="px-2 py-1 bg-red-900/30 border border-red-500/30 hover:bg-red-900/60 text-[9px] font-bold uppercase rounded text-red-400 cursor-pointer transition"
                        >
                          Banish ⚖️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. Game Over Screen */}
          {phase === 'game_over' && (
            <div className="text-center py-3 space-y-3">
              <div className="text-5xl">{winner === 'Werewolves' ? '🐺' : '🏡'}</div>
              <div className={`text-sm font-black uppercase tracking-widest font-mono ${winner === 'Werewolves' ? 'text-red-400' : 'text-emerald-400'}`}>
                {winner} victory!
              </div>
              <div className="text-[9px] font-mono text-slate-400 space-y-0.5 max-h-[85px] overflow-y-auto bg-black/20 p-2 rounded-xl border border-slate-800">
                {players.map(p => (
                  <div key={p.name} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-amber-300 uppercase">{p.role} {p.alive ? '(survived)' : '(died)'}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPhase('setup')}
                className="w-full py-2.5 bg-fuchsia-700 hover:bg-fuchsia-600 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Begin new simulation 🔄
              </button>
            </div>
          )}

          {/* Stats Bar */}
          {phase !== 'game_over' && (
            <div className="flex justify-between text-[9px] font-mono text-slate-500 border-t border-[#44387a]/25 pt-2 mt-2">
              <span>ALIVE: {alive.length} SURVIVORS</span>
              <span>WOLVES: {players.filter(p => p.alive && p.role === 'Werewolf').length} HIDDEN</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. CELEBRITY / FISHBOWL 3-ROUND PARTY GAME
// ==========================================
function CelebrityGame({ playTone, triggerHaptic }: GameSyncProps) {
  type FPhase = 'setup' | 'playing' | 'end_of_turn' | 'end_of_round' | 'game_over';
  const ROUNDS = ['🗣️ Describe It', '1️⃣ One Word', '🎭 Act It Out'];
  const TURN_DURATION = 45;

  const [masterWordList, setMasterWordList] = useState<string[]>([
    'Elon Musk', 'Baby Yoda', 'Gandalf', 'Hogwarts', 'Spider-Man',
    'Cappuccino', 'TikTok', 'Rubik\'s Cube', 'Area 51', 'Tom Hanks'
  ]);
  const [wordInput, setWordInput] = useState('');
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [activeWord, setActiveWord] = useState<string>('');
  const [round, setRound] = useState(0); // 0=setup, 1/2/3 = game rounds
  const [turn, setTurn] = useState<'A' | 'B'>('A');
  const [scores, setScores] = useState({ A: [0, 0, 0], B: [0, 0, 0] });
  const [timer, setTimer] = useState(TURN_DURATION);
  const [phase, setPhase] = useState<FPhase>('setup');
  const [turnScore, setTurnScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    if (timer <= 0) {
      setIsRunning(false);
      if (triggerHaptic) triggerHaptic([200, 100, 200]);
      if (playTone) playTone(220, 'sawtooth', 0.4);
      setPhase('end_of_turn');
      return;
    }
    const id = setInterval(() => {
      setTimer(t => {
        if (t === 6) {
          if (triggerHaptic) triggerHaptic([40, 40]);
          if (playTone) playTone(880, 'triangle', 0.08);
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, timer]);

  const addWord = () => {
    const w = wordInput.trim();
    if (!w || masterWordList.includes(w)) return;
    if (triggerHaptic) triggerHaptic(8);
    setMasterWordList(prev => [...prev, w]);
    setWordInput('');
  };

  const startGame = () => {
    if (masterWordList.length < 4) return;
    if (triggerHaptic) triggerHaptic(20);
    if (playTone) playTone(523, 'sine', 0.2);
    const bowl = [...masterWordList].sort(() => Math.random() - 0.5);
    setRemainingWords(bowl);
    setRound(1);
    setTurn('A');
    setScores({ A: [0, 0, 0], B: [0, 0, 0] });
    setPhase('end_of_turn'); // Start with "pass device to team A" screen
    setTurnScore(0);
  };

  const startTurn = () => {
    if (remainingWords.length === 0) {
      endRound();
      return;
    }
    if (triggerHaptic) triggerHaptic(15);
    if (playTone) playTone(440, 'sine', 0.12);
    const word = remainingWords[Math.floor(Math.random() * remainingWords.length)] || '';
    setActiveWord(word);
    setTimer(TURN_DURATION);
    setTurnScore(0);
    setIsRunning(true);
    setPhase('playing');
  };

  const gotIt = () => {
    if (!isRunning) return;
    if (triggerHaptic) triggerHaptic(10);
    if (playTone) playTone(587, 'sine', 0.1);
    const newRemaining = remainingWords.filter(w => w !== activeWord);
    setRemainingWords(newRemaining);
    const newTurnScore = turnScore + 1;
    setTurnScore(newTurnScore);

    if (newRemaining.length === 0) {
      // Bowl empty — end turn early, then end round
      setIsRunning(false);
      setPhase('end_of_turn');
      commitTurnScore(turn, round - 1, newTurnScore);
      return;
    }
    const nextWord = newRemaining[Math.floor(Math.random() * newRemaining.length)] || '';
    setActiveWord(nextWord);
  };

  const commitTurnScore = (t: 'A' | 'B', rIdx: number, score: number) => {
    setScores(prev => {
      const updated = { ...prev };
      const arr = [...updated[t]];
      arr[rIdx] = (arr[rIdx] || 0) + score;
      updated[t] = arr as [number, number, number];
      return updated;
    });
  };

  const endTurn = () => {
    // Save score
    commitTurnScore(turn, round - 1, turnScore);
    setTurnScore(0);

    if (remainingWords.length === 0) {
      endRound();
      return;
    }

    const nextTurn: 'A' | 'B' = turn === 'A' ? 'B' : 'A';
    setTurn(nextTurn);
    setPhase('end_of_turn');
  };

  const endRound = () => {
    if (round >= 3) {
      setPhase('game_over');
      if (triggerHaptic) triggerHaptic([100, 50, 100, 50, 200]);
      if (playTone) playTone(659, 'sine', 0.5);
    } else {
      setPhase('end_of_round');
    }
  };

  const nextRound = () => {
    if (triggerHaptic) triggerHaptic(15);
    const newBowl = [...masterWordList].sort(() => Math.random() - 0.5);
    setRemainingWords(newBowl);
    setRound(r => r + 1);
    setTurn('A');
    setPhase('end_of_turn');
  };

  const totalA = scores.A.reduce((a, b) => a + b, 0);
  const totalB = scores.B.reduce((a, b) => a + b, 0);

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-amber-400">🎫 Fishbowl (Celebrity)</span>
        <span className="text-[9px] font-mono text-amber-400/80">
          {round > 0 ? `Round ${round}/3: ${ROUNDS[round - 1]}` : 'Setup'}
        </span>
      </div>

      {/* Scores */}
      {round > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-center font-mono">
          <div className={`p-2 rounded-xl border ${turn === 'A' && phase === 'playing' ? 'border-amber-400 bg-amber-500/10' : 'border-purple-500/10 bg-[#120a2c]/50'}`}>
            <div className="text-[8px] uppercase tracking-wider text-slate-400">Team A</div>
            <div className="text-xl font-black text-amber-400">{totalA}</div>
          </div>
          <div className={`p-2 rounded-xl border ${turn === 'B' && phase === 'playing' ? 'border-purple-400 bg-purple-500/10' : 'border-purple-500/10 bg-[#120a2c]/50'}`}>
            <div className="text-[8px] uppercase tracking-wider text-slate-400">Team B</div>
            <div className="text-xl font-black text-purple-400">{totalB}</div>
          </div>
        </div>
      )}

      {phase === 'setup' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-400 leading-relaxed text-center">Add names/words to the bowl, then press Start. Fishbowl has 3 rounds: Describe → One Word → Act It Out!</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={wordInput}
              onChange={e => setWordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWord()}
              placeholder="Add a name or word..."
              className="flex-grow bg-black/40 border border-[#44387a]/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
            <button onClick={addWord} className="px-4 bg-amber-600/30 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-600/50 transition">+ Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto">
            {masterWordList.map((w, i) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-[#1a1030] border border-amber-500/20 text-[10px] font-mono text-amber-200">
                {w}
              </span>
            ))}
          </div>
          <button
            onClick={startGame}
            disabled={masterWordList.length < 4}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-xl transition cursor-pointer disabled:opacity-40"
          >
            🎭 Start Fishbowl! ({masterWordList.length} words)
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="flex flex-col items-center gap-4 flex-grow justify-center">
          <div className="w-full bg-gradient-to-br from-amber-900/40 to-orange-900/30 border border-amber-500/25 rounded-2xl p-6 text-center">
            <div className="text-[9px] text-amber-400/70 uppercase tracking-widest mb-2 font-mono">{ROUNDS[round - 1]}</div>
            <div className="text-3xl font-extrabold text-[#faebd7] uppercase tracking-wide">{activeWord}</div>
            <div className="text-xs text-amber-300 mt-1 font-mono">Team {turn} • +{turnScore} this turn</div>
          </div>
          <div className={`text-3xl font-black font-mono ${timer <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
            ⏱ {timer}s
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={gotIt} className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black rounded-xl cursor-pointer transition shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              ✓ Got It!
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setPhase('end_of_turn');
                commitTurnScore(turn, round - 1, turnScore);
              }}
              className="px-4 py-3 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-700 transition"
            >
              End Turn
            </button>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">{remainingWords.length} words left in bowl</div>
        </div>
      )}

      {phase === 'end_of_turn' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="text-4xl">{turn === 'A' ? '🔶' : '🟣'}</div>
          <p className="text-sm font-bold text-amber-300 uppercase tracking-widest">Team {turn}'s Turn</p>
          <p className="text-xs text-slate-400">{ROUNDS[round - 1]}</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            {round === 1 ? 'Describe the word using any words (no rhymes/initials).' :
             round === 2 ? 'You may only say ONE word as a clue.' :
             'Act it out silently — no words, no sounds!'}
          </p>
          <button onClick={startTurn} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer transition">
            ▶ Start Turn
          </button>
          <div className="text-[9px] text-slate-500 font-mono">{remainingWords.length} words remaining</div>
        </div>
      )}

      {phase === 'end_of_round' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="text-2xl font-black text-amber-400">Round {round} Complete!</div>
          <div className="grid grid-cols-2 gap-3 w-full font-mono text-sm">
            {(['A', 'B'] as const).map(t => (
              <div key={t} className={`p-3 rounded-xl border ${t === 'A' ? 'border-amber-500/30 bg-amber-900/20' : 'border-purple-500/30 bg-purple-900/20'}`}>
                <div className={`text-lg font-black ${t === 'A' ? 'text-amber-400' : 'text-purple-400'}`}>Team {t}</div>
                {scores[t].map((s, i) => (
                  <div key={i} className="text-[9px] text-slate-400">{ROUNDS[i]?.split(' ').pop()}: {s}</div>
                ))}
              </div>
            ))}
          </div>
          <button onClick={nextRound} className="px-8 py-3 bg-gradient-to-r from-amber-600 to-purple-600 text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer">
            ▶ Round {round + 1}: {ROUNDS[round]}
          </button>
        </div>
      )}

      {phase === 'game_over' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="text-5xl">{totalA > totalB ? '🔶' : totalB > totalA ? '🟣' : '🤝'}</div>
          <div className="text-xl font-black text-[#faebd7]">
            {totalA > totalB ? 'Team A Wins!' : totalB > totalA ? 'Team B Wins!' : 'It\'s a Tie!'}
          </div>
          <div className="text-2xl font-mono font-black">
            <span className="text-amber-400">{totalA}</span> — <span className="text-purple-400">{totalB}</span>
          </div>
          <button onClick={() => { setRound(0); setPhase('setup'); }} className="px-6 py-2.5 bg-amber-600 text-white text-xs font-bold uppercase rounded-xl cursor-pointer">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}


// ==========================================
// 4. ALCHEMICAL BLACKJACK CARD GAME (21)
// ==========================================
interface BJCard { value: string; suit: string; numVal: number; }

function BlackjackGame({ playTone, triggerHaptic }: GameSyncProps) {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const RED_SUITS = ['♥', '♦'];

  const buildDeck = (): BJCard[] => {
    const deck: BJCard[] = [];
    for (let d = 0; d < 4; d++) { // 4-deck shoe
      for (const suit of SUITS) {
        for (const val of VALUES) {
          const numVal = val === 'A' ? 11 : ['J','Q','K'].includes(val) ? 10 : parseInt(val);
          deck.push({ value: val, suit, numVal });
        }
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const [shoe, setShoe] = useState<BJCard[]>(() => buildDeck());
  const [playerHand, setPlayerHand] = useState<BJCard[]>([]);
  const [dealerHand, setDealerHand] = useState<BJCard[]>([]);
  const [splitHand, setSplitHand] = useState<BJCard[]>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'dealer_turn' | 'outcome'>('idle');
  const [log, setLog] = useState('Welcome to Alchem-21. Press Deal to challenge the Alchemist Bot!');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [pushes, setPushes] = useState(0);
  const [doubled, setDoubled] = useState(false);
  const [hasSplit, setHasSplit] = useState(false);
  const [activeSplit, setActiveSplit] = useState<'main' | 'split'>('main');

  const shoeRef = useRef<BJCard[]>(shoe);
  const draw = (): BJCard => {
    if (shoeRef.current.length < 10) {
      shoeRef.current = buildDeck();
    }
    const card = shoeRef.current.pop()!;
    setShoe([...shoeRef.current]);
    return card;
  };

  const calcScore = (hand: BJCard[]): number => {
    let sum = hand.reduce((a, c) => a + c.numVal, 0);
    let aces = hand.filter(c => c.value === 'A').length;
    while (sum > 21 && aces > 0) { sum -= 10; aces--; }
    return sum;
  };

  const startGame = () => {
    if (triggerHaptic) triggerHaptic(20);
    if (playTone) playTone(440, 'sine', 0.15);
    const p = [draw(), draw()];
    const d = [draw(), draw()];
    setPlayerHand(p);
    setDealerHand(d);
    setSplitHand([]);
    setDoubled(false);
    setHasSplit(false);
    setActiveSplit('main');
    setGameStatus('playing');

    const pScore = calcScore(p);
    if (pScore === 21) {
      setLog('⚡ BLACKJACK! Natural 21 — Alchemist Bot must now reveal.');
      dealerPlay(p, d, false);
    } else {
      setLog(`Your score: ${pScore}. Hit, Stand, or Double Down?`);
    }
  };

  const handleHit = () => {
    if (gameStatus !== 'playing') return;
    if (triggerHaptic) triggerHaptic(10);
    if (playTone) playTone(349, 'triangle', 0.1);
    const newCard = draw();
    const newHand = hasSplit && activeSplit === 'split' ? [...splitHand, newCard] : [...playerHand, newCard];
    if (hasSplit && activeSplit === 'split') {
      setSplitHand(newHand);
    } else {
      setPlayerHand(newHand);
    }
    const score = calcScore(newHand);
    if (score > 21) {
      if (triggerHaptic) triggerHaptic([150, 80, 150]);
      if (playTone) playTone(200, 'sawtooth', 0.4);
      setLog(`💥 Bust at ${score}! Alchemist Bot wins.`);
      setLosses(l => l + 1);
      setGameStatus('outcome');
    } else {
      setLog(`Score: ${score}. Hit, Stand, or Double Down?`);
    }
  };

  const handleStand = () => {
    if (gameStatus !== 'playing') return;
    if (hasSplit && activeSplit === 'main') {
      setActiveSplit('split');
      setLog(`Split hand — now playing Split Hand. Score: ${calcScore(splitHand)}`);
      return;
    }
    if (triggerHaptic) triggerHaptic(15);
    dealerPlay(playerHand, dealerHand, hasSplit);
  };

  const handleDouble = () => {
    if (gameStatus !== 'playing' || playerHand.length !== 2) return;
    if (triggerHaptic) triggerHaptic(25);
    if (playTone) playTone(523, 'sine', 0.2);
    const newCard = draw();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDoubled(true);
    const score = calcScore(newHand);
    if (score > 21) {
      setLog(`💥 Bust at ${score} on double! (Doubled bet lost)`);
      setLosses(l => l + 1);
      setGameStatus('outcome');
    } else {
      setLog(`Double down! Drew ${newCard.value}${newCard.suit}. Standing on ${score}...`);
      dealerPlay(newHand, dealerHand, false);
    }
  };

  const handleSplit = () => {
    if (gameStatus !== 'playing' || playerHand.length !== 2) return;
    if (playerHand[0]?.numVal !== playerHand[1]?.numVal) return;
    if (triggerHaptic) triggerHaptic(15);
    const [c1, c2] = playerHand;
    setPlayerHand([c1, draw()]);
    setSplitHand([c2, draw()]);
    setHasSplit(true);
    setActiveSplit('main');
    setLog('Hand split! Play your main hand first, then the split hand.');
  };

  const dealerPlay = (pHand: BJCard[], dHand: BJCard[], isSplit: boolean) => {
    setGameStatus('dealer_turn');
    setLog('Alchemist Bot reveals hand...');
    if (triggerHaptic) triggerHaptic(10);

    setTimeout(() => {
      let current = [...dHand];
      while (calcScore(current) < 17) current.push(draw());
      setDealerHand(current);

      const pScore = calcScore(pHand);
      const dScore = calcScore(current);
      let resultMsg = '';
      setGameStatus('outcome');

      if (dScore > 21) {
        resultMsg = `🏆 Alchemist Bot busts at ${dScore}! You win!${doubled ? ' (2x)' : ''}`;
        setWins(w => w + 1);
        if (playTone) playTone(659, 'sine', 0.4);
      } else if (pScore > dScore) {
        resultMsg = `🏆 Victory! ${pScore} beats ${dScore}!${doubled ? ' (2x payout)' : ''}`;
        setWins(w => w + 1);
        if (playTone) playTone(659, 'sine', 0.4);
      } else if (dScore > pScore) {
        resultMsg = `💀 Alchemist Bot wins: ${dScore} vs ${pScore}.`;
        setLosses(l => l + 1);
        if (playTone) playTone(180, 'sawtooth', 0.5);
      } else {
        resultMsg = `🤝 Push! Both tied at ${pScore}.`;
        setPushes(p => p + 1);
      }
      setLog(resultMsg);
      if (triggerHaptic) triggerHaptic([50, 30, 80]);
    }, 1400);
  };

  const renderCard = (card: BJCard, faceDown = false) => {
    const isRed = RED_SUITS.includes(card.suit);
    return (
      <div
        className={`w-11 h-16 rounded-xl border-2 flex flex-col justify-between p-1.5 font-mono font-black shrink-0 select-none transition-all
          ${faceDown
            ? 'bg-gradient-to-br from-blue-900 to-indigo-800 border-blue-500/40'
            : `bg-gradient-to-b from-slate-50 to-slate-100 border-slate-300 shadow-md`
          }`}
      >
        {faceDown ? (
          <div className="w-full h-full flex items-center justify-center text-blue-400/60 text-xl">🂠</div>
        ) : (
          <>
            <span className={`text-xs leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.value}</span>
            <span className={`text-base leading-none self-end ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.suit}</span>
          </>
        )}
      </div>
    );
  };

  const canSplit = gameStatus === 'playing' && playerHand.length === 2 && playerHand[0]?.numVal === playerHand[1]?.numVal && !hasSplit;

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-blue-400">🎩 Alchem-21 (Blackjack)</span>
        <div className="flex gap-2 text-[9px] font-mono">
          <span className="text-emerald-400">W:{wins}</span>
          <span className="text-red-400">L:{losses}</span>
          <span className="text-slate-400">P:{pushes}</span>
        </div>
      </div>

      <div className={`p-3 rounded-xl min-h-[50px] text-xs leading-relaxed font-mono text-center flex items-center justify-center mb-3 border ${gameStatus === 'outcome' && log.includes('🏆') ? 'border-emerald-500/30 bg-emerald-900/20' : gameStatus === 'outcome' ? 'border-red-500/20 bg-red-900/10' : 'border-[#44387a]/20 bg-black/20'}`}>
        {log}
      </div>

      {/* Dealer Hand */}
      <div className="mb-3">
        <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">
          Alchemist Bot {gameStatus !== 'playing' && dealerHand.length > 0 ? `— ${calcScore(dealerHand)}` : ''}
        </div>
        <div className="flex gap-2 flex-wrap">
          {dealerHand.map((card, i) => (
            <div key={i}>{renderCard(card, gameStatus === 'playing' && i === 1)}</div>
          ))}
        </div>
      </div>

      {/* Player Hand(s) */}
      <div className="mb-3">
        <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">
          Your Hand — {calcScore(playerHand)}
          {playerHand.length === 2 && calcScore(playerHand) === 21 ? ' ⚡ BLACKJACK!' : ''}
        </div>
        <div className="flex gap-2 flex-wrap">
          {playerHand.map((card, i) => <div key={i}>{renderCard(card)}</div>)}
        </div>
        {hasSplit && (
          <div className="mt-2">
            <div className={`text-[9px] uppercase tracking-widest font-bold mb-1.5 ${activeSplit === 'split' ? 'text-amber-400' : 'text-slate-500'}`}>
              Split Hand — {calcScore(splitHand)} {activeSplit === 'split' ? '← Active' : ''}
            </div>
            <div className="flex gap-2 flex-wrap">
              {splitHand.map((card, i) => <div key={i}>{renderCard(card)}</div>)}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(gameStatus === 'idle' || gameStatus === 'outcome') && (
          <button onClick={startGame} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            🃏 Deal New Hand
          </button>
        )}
        {gameStatus === 'playing' && (
          <>
            <button onClick={handleHit} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer">Hit</button>
            <button onClick={handleStand} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer">Stand</button>
            {playerHand.length === 2 && (
              <button onClick={handleDouble} className="px-4 py-3 bg-amber-600/30 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase rounded-xl transition cursor-pointer hover:bg-amber-600/50">2x</button>
            )}
            {canSplit && (
              <button onClick={handleSplit} className="px-4 py-3 bg-purple-600/30 border border-purple-500/40 text-purple-400 text-xs font-bold uppercase rounded-xl transition cursor-pointer hover:bg-purple-600/50">Split</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. COSMIC CATEGORIES (SCATTERGORIES BLITZ)
// ==========================================
function CategoriesGame({ playTone, triggerHaptic }: GameSyncProps) {
  type CatPhase = 'setup' | 'playing_A' | 'playing_B' | 'scoring' | 'results';

  const ALL_CATEGORIES = [
    'Famous Person', 'Animal', 'Food or Drink', 'Movie or TV Show',
    'Thing you find in a kitchen', 'Country or City', 'Sports or Game',
    'Song or Band', 'Brand or Company', 'Occupation / Job',
    'Thing at a party', 'Thing in nature'
  ];

  const LETTERS = 'BCDFGHJKLMNPRSTWY';
  const ROUND_DURATION = 90;

  const pickCategories = () => {
    const shuffled = [...ALL_CATEGORIES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  };

  const [letter, setLetter] = useState('S');
  const [categories, setCategories] = useState<string[]>(() => pickCategories());
  const [phase, setPhase] = useState<CatPhase>('setup');
  const [answersA, setAnswersA] = useState<Record<string, string>>({});
  const [answersB, setAnswersB] = useState<Record<string, string>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState(ROUND_DURATION);
  const [round, setRound] = useState(1);
  const [scoresA, setScoresA] = useState<number[]>([0, 0, 0]);
  const [scoresB, setScoresB] = useState<number[]>([0, 0, 0]);
  const [maxRounds] = useState(3);

  useEffect(() => {
    if (phase !== 'playing_A' && phase !== 'playing_B') return;
    if (timer <= 0) {
      if (triggerHaptic) triggerHaptic([200, 100, 200]);
      if (playTone) playTone(220, 'sawtooth', 0.4);
      endTurn();
      return;
    }
    const id = setInterval(() => {
      setTimer(t => {
        if (t === 11) {
          if (triggerHaptic) triggerHaptic([40, 40]);
          if (playTone) playTone(880, 'triangle', 0.08);
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, timer]);

  const startRound = () => {
    if (triggerHaptic) triggerHaptic(20);
    if (playTone) playTone(523, 'sine', 0.2);
    const newLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)] || 'S';
    const newCats = pickCategories();
    setLetter(newLetter);
    setCategories(newCats);
    setAnswersA({});
    setAnswersB({});
    setInputs({});
    setTimer(ROUND_DURATION);
    setPhase('playing_A');
  };

  const endTurn = () => {
    if (phase === 'playing_A') {
      setAnswersA({ ...inputs });
      setInputs({});
      setTimer(ROUND_DURATION);
      setPhase('playing_B');
    } else if (phase === 'playing_B') {
      const bAnswers = { ...inputs };
      setAnswersB(bAnswers);
      // Score this round
      scoreRound(answersA, bAnswers);
      setPhase('scoring');
    }
  };

  const scoreRound = (aAns: Record<string, string>, bAns: Record<string, string>) => {
    let aTotal = 0, bTotal = 0;
    for (const cat of categories) {
      const aVal = (aAns[cat] || '').trim().toLowerCase();
      const bVal = (bAns[cat] || '').trim().toLowerCase();
      const aValid = aVal.startsWith(letter.toLowerCase()) && aVal.length > 1;
      const bValid = bVal.startsWith(letter.toLowerCase()) && bVal.length > 1;
      const unique = aVal !== bVal;

      if (aValid) aTotal += (unique ? 2 : 1);
      if (bValid) bTotal += (unique ? 2 : 1);
    }
    const rIdx = round - 1;
    setScoresA(prev => { const n = [...prev]; n[rIdx] = aTotal; return n; });
    setScoresB(prev => { const n = [...prev]; n[rIdx] = bTotal; return n; });
  };

  const nextRound = () => {
    if (round >= maxRounds) {
      setPhase('results');
    } else {
      setRound(r => r + 1);
      setPhase('setup');
    }
  };

  const restart = () => {
    setRound(1);
    setScoresA([0, 0, 0]);
    setScoresB([0, 0, 0]);
    setPhase('setup');
    setAnswersA({}); setAnswersB({}); setInputs({});
  };

  const totalA = scoresA.reduce((a, b) => a + b, 0);
  const totalB = scoresB.reduce((a, b) => a + b, 0);

  const isPlaying = phase === 'playing_A' || phase === 'playing_B';
  const currentTeam = phase === 'playing_A' ? 'A' : 'B';

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-2">
        <span className="text-[12px] font-bold text-teal-400">✏️ Cosmic Categories</span>
        <div className="flex gap-2 text-[9px] font-mono">
          <span className="text-teal-300">Rd {round}/{maxRounds}</span>
          <button onClick={restart} className="text-teal-400/70 hover:text-white cursor-pointer transition">Restart</button>
        </div>
      </div>

      {/* Score bar */}
      <div className="grid grid-cols-2 gap-2 mb-2 text-center font-mono">
        <div className={`p-1.5 rounded-xl border ${phase === 'playing_A' ? 'border-teal-400/50 bg-teal-900/20' : 'border-[#44387a]/20 bg-black/20'}`}>
          <div className="text-[8px] text-slate-400 uppercase">Team A</div>
          <div className="text-lg font-black text-teal-400">{totalA}</div>
        </div>
        <div className={`p-1.5 rounded-xl border ${phase === 'playing_B' ? 'border-cyan-400/50 bg-cyan-900/20' : 'border-[#44387a]/20 bg-black/20'}`}>
          <div className="text-[8px] text-slate-400 uppercase">Team B</div>
          <div className="text-lg font-black text-cyan-400">{totalB}</div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            Team A answers all 6 categories first (90 sec), then passes device to Team B. Unique answers score 2pts — matching answers score 1pt each!
          </p>
          <p className="text-[10px] text-teal-300 font-mono">Round {round} of {maxRounds}</p>
          <button
            onClick={startRound}
            className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer transition shadow-[0_0_20px_rgba(20,184,166,0.2)]"
          >
            🎲 Roll Letter & Start
          </button>
        </div>
      )}

      {isPlaying && (
        <>
          <div className="flex items-center gap-3 mb-2 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-xl font-black text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]">
                {letter}
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Team {currentTeam}'s Turn</div>
                <div className={`text-sm font-black font-mono ${timer <= 15 ? 'text-red-400 animate-pulse' : 'text-teal-300'}`}>{timer}s</div>
              </div>
            </div>
            <button
              onClick={endTurn}
              className="px-4 py-2 bg-teal-700/40 border border-teal-500/40 text-teal-300 text-xs font-bold uppercase rounded-xl cursor-pointer hover:bg-teal-700/60 transition"
            >
              Done ✓
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[240px] pr-1">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center gap-2 bg-black/20 border border-[#44387a]/20 rounded-xl px-2 py-1.5">
                <span className="text-[9px] text-slate-400 font-bold w-28 shrink-0 leading-tight">{cat}</span>
                <input
                  type="text"
                  value={inputs[cat] || ''}
                  onChange={e => setInputs(prev => ({ ...prev, [cat]: e.target.value }))}
                  placeholder={`Starts with "${letter}"...`}
                  className="flex-grow bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none border-b border-[#44387a]/30 focus:border-teal-400 transition py-0.5"
                />
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'playing_B' && (
        <div className="text-[9px] text-center text-slate-500 mt-1 font-mono">Team A is done. Team B — take the device and fill in your answers!</div>
      )}

      {phase === 'scoring' && (
        <div className="flex flex-col gap-2 py-2">
          <div className="text-center text-xs font-bold text-teal-400 uppercase tracking-widest mb-1">Round {round} Results — Letter "{letter}"</div>
          <div className="space-y-1.5 overflow-y-auto max-h-[200px]">
            {categories.map((cat, i) => {
              const aVal = (answersA[cat] || '').trim();
              const bVal = (answersB[cat] || '').trim();
              const aValid = aVal.toLowerCase().startsWith(letter.toLowerCase()) && aVal.length > 1;
              const bValid = bVal.toLowerCase().startsWith(letter.toLowerCase()) && bVal.length > 1;
              const unique = aVal.toLowerCase() !== bVal.toLowerCase();
              return (
                <div key={i} className="bg-black/20 border border-[#44387a]/20 rounded-xl p-2 text-[10px] font-mono">
                  <div className="text-slate-500 uppercase text-[8px] mb-1">{cat}</div>
                  <div className="flex justify-between gap-2">
                    <span className={`${aValid ? (unique ? 'text-teal-400' : 'text-amber-400') : 'text-slate-600 line-through'}`}>
                      A: {aVal || '—'} {aValid ? (unique ? '+2' : '+1') : '0'}
                    </span>
                    <span className={`${bValid ? (unique ? 'text-cyan-400' : 'text-amber-400') : 'text-slate-600 line-through'}`}>
                      B: {bVal || '—'} {bValid ? (unique ? '+2' : '+1') : '0'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={nextRound}
            className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer mt-1"
          >
            {round >= maxRounds ? '🏆 See Final Results' : `▶ Round ${round + 1}`}
          </button>
        </div>
      )}

      {phase === 'results' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="text-5xl">{totalA > totalB ? '🔷' : totalB > totalA ? '🌊' : '🤝'}</div>
          <div className="text-lg font-black text-[#faebd7]">
            {totalA > totalB ? 'Team A Wins!' : totalB > totalA ? 'Team B Wins!' : "It's a Tie!"}
          </div>
          <div className="text-2xl font-mono font-black">
            <span className="text-teal-400">{totalA}</span> — <span className="text-cyan-400">{totalB}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-slate-400 w-full max-w-xs">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-black/20 rounded-lg p-1.5 border border-[#44387a]/20">
                <div className="text-slate-500">Rd {i + 1}</div>
                <div><span className="text-teal-400">{scoresA[i]}</span> v <span className="text-cyan-400">{scoresB[i]}</span></div>
              </div>
            ))}
          </div>
          <button onClick={restart} className="px-6 py-2.5 bg-teal-600 text-white text-xs font-bold uppercase rounded-xl cursor-pointer">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}


// ==========================================
// 6. GRID DOMAIN TERRITORY CAPTURE BOARD GAME
// ==========================================
function GridDomainGame({ playTone, triggerHaptic, joined, currentUser, connectedPlayers, lastAction, sendGameAction }: GameSyncProps) {
  const [grid, setGrid] = useState<number[]>([]);
  const [turn, setTurn] = useState<number>(1);
  const [log, setLog] = useState<string>('Click adjacent grid areas to lock in your domain.');
  const [gameOver, setGameOver] = useState<boolean>(false);

  const size = 5;

  const playerList = connectedPlayers ? connectedPlayers.map(p => p.userId).sort() : [];
  const myIndex = playerList.indexOf(currentUser || '');
  const myPlayerNum = myIndex !== -1 ? myIndex + 1 : 1; 
  const opponentName = playerList[myPlayerNum === 1 ? 1 : 0] || 'Opponent';

  const resetBoard = () => {
    if (triggerHaptic) triggerHaptic(20);
    if (playTone) playTone(440, 'triangle', 0.2);
    resetBoardLocal();
    if (joined && sendGameAction) {
      sendGameAction({ type: 'grid_reset' });
    }
  };

  const resetBoardLocal = () => {
    setGrid(Array(size * size).fill(0));
    setTurn(1);
    setGameOver(false);
    if (joined) {
      setLog(myPlayerNum === 1 ? 'Blue Player 1 (You) — click anywhere to claim your first tile!' : `Waiting for ${playerList[0] || 'Player 1'} to start...`);
    } else {
      setLog('Blue Player 1, claim your first tile anywhere!');
    }
  };

  useEffect(() => {
    resetBoardLocal();
  }, [joined, connectedPlayers]);

  const getAdjacentIndices = (idx: number) => {
    const r = Math.floor(idx / size);
    const c = idx % size;
    const adj = [];
    if (r > 0) adj.push(idx - size);
    if (r < size - 1) adj.push(idx + size);
    if (c > 0) adj.push(idx - 1);
    if (c < size - 1) adj.push(idx + 1);
    return adj;
  };

  const hasClaimedTiles = (g: number[], player: number) => {
    return g.some(cell => cell === player);
  };

  const isValidMove = (idx: number, player: number, currentGrid: number[]) => {
    if (currentGrid[idx] !== 0) return false;
    if (!hasClaimedTiles(currentGrid, player)) return true;
    
    const adj = getAdjacentIndices(idx);
    return adj.some(aIdx => currentGrid[aIdx] === player);
  };

  const checkVictory = (currentGrid: number[]) => {
    const emptyCount = currentGrid.filter(cell => cell === 0).length;
    const hasValidMoveP1 = currentGrid.some((_, i) => isValidMove(i, 1, currentGrid));
    const hasValidMoveP2 = currentGrid.some((_, i) => isValidMove(i, 2, currentGrid));

    if (emptyCount === 0 || (!hasValidMoveP1 && !hasValidMoveP2)) {
      const p1Count = currentGrid.filter(cell => cell === 1).length;
      const p2Count = currentGrid.filter(cell => cell === 2).length;
      
      setGameOver(true);
      if (p1Count > p2Count) {
        setLog(`Game Over! Player 1 (Blue) wins: ${p1Count} to ${p2Count}! 🏆`);
        if (playTone) playTone(659, 'sine', 0.4);
      } else if (p2Count > p1Count) {
        setLog(`Game Over! Player 2 (Red) wins: ${p2Count} to ${p1Count}! 🏆`);
        if (playTone) playTone(220, 'sawtooth', 0.4);
      } else {
        setLog(`Game Over! A tie match: ${p1Count} to ${p2Count}!`);
      }
      return true;
    }
    return false;
  };

  const handleTileClick = (idx: number) => {
    if (gameOver || grid[idx] !== 0) return;
    
    if (joined && turn !== myPlayerNum) {
      if (triggerHaptic) triggerHaptic([50, 50]);
      setLog(`It's not your turn! Wait for ${opponentName}.`);
      return;
    }

    if (!isValidMove(idx, turn, grid)) {
      if (triggerHaptic) triggerHaptic([50, 50]);
      setLog('Invalid move! Tiles must be placed adjacent to your existing domain.');
      return;
    }

    if (triggerHaptic) triggerHaptic(10);
    if (playTone) playTone(turn === 1 ? 523 : 349, 'sine', 0.12);

    const nextGrid = [...grid];
    nextGrid[idx] = turn;
    setGrid(nextGrid);

    if (checkVictory(nextGrid)) return;

    const nextTurn = turn === 1 ? 2 : 1;
    setTurn(nextTurn);

    if (joined) {
      setLog(`Claimed tile! Waiting for ${opponentName}...`);
      if (sendGameAction) {
        sendGameAction({ type: 'grid_move', index: idx, playerNum: myPlayerNum });
      }
    } else {
      setLog(`Alchemist AI is calculating territory...`);
      setTimeout(() => {
        const validMoves = nextGrid
          .map((_, i) => isValidMove(i, 2, nextGrid) ? i : -1)
          .filter(v => v !== -1);

        if (validMoves.length > 0) {
          const aiChoice = validMoves[Math.floor(Math.random() * validMoves.length)];
          nextGrid[aiChoice] = 2;
          setGrid(nextGrid);
          if (triggerHaptic) triggerHaptic(12);
          if (playTone) playTone(349, 'sine', 0.12);

          if (checkVictory(nextGrid)) return;
        }

        setTurn(1);
        setLog('Blue Player 1, click an adjacent tile to claim domain!');
      }, 1000);
    }
  };

  useEffect(() => {
    if (joined && lastAction && lastAction.senderId !== currentUser) {
      const { type, index, playerNum } = lastAction.payload;
      if (type === 'grid_move') {
        const nextGrid = [...grid];
        nextGrid[index] = playerNum;
        setGrid(nextGrid);
        if (!checkVictory(nextGrid)) {
          const nextTurn = playerNum === 1 ? 2 : 1;
          setTurn(nextTurn);
          setLog(myPlayerNum === nextTurn ? 'Your turn! Claim an adjacent tile.' : `Waiting for ${opponentName}...`);
        }
      } else if (type === 'grid_reset') {
        resetBoardLocal();
      }
    }
  }, [lastAction, joined, currentUser]);

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-emerald-400">🟩 Grid Domain (Territory Capture)</span>
        <button onClick={resetBoard} className="text-[10px] text-emerald-400/80 hover:text-white transition cursor-pointer">Clear Board</button>
      </div>

      <div className="bg-black/30 p-2.5 rounded-xl min-h-[40px] text-[11px] leading-relaxed font-mono text-center mb-3">
        {log}
      </div>

      <div className="flex justify-center my-2 select-none">
        <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#120a24]/80 rounded-2xl border border-emerald-500/25">
          {grid.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleTileClick(idx)}
              className={`w-12 h-12 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer focus:outline-none ${
                cell === 1 
                  ? 'bg-blue-600 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                  : cell === 2 
                    ? 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                    : 'bg-[#1b1236]/80 border-[#44387a]/40 hover:border-[#cf4fe6]/50'
              }`}
            >
              {cell !== 0 && <span className="text-white text-xs font-black">{cell === 1 ? '🕊️' : '🔥'}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono select-none mt-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full border border-blue-400"></span>
          <span>{joined ? (playerList[0] || 'Player 1') : 'Player 1 (Blue)'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-red-600 rounded-full border border-red-400"></span>
          <span>{joined ? (playerList[1] || 'Player 2') : 'Alchemist Bot (Red)'}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ==========================================
// 7. FARKLE DICE GAME (PUSH YOUR LUCK)
// ==========================================
function DiceDuelGame({ playTone, triggerHaptic }: GameSyncProps) {
  const TARGET = 10000;
  const DICE_COUNT = 6;

  type Die = { value: number; held: boolean; scored: boolean };

  const [dice, setDice] = useState<Die[]>(() => Array(DICE_COUNT).fill(null).map(() => ({ value: 1, held: false, scored: false })));
  const [turnScore, setTurnScore] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [gamePhase, setGamePhase] = useState<'idle' | 'rolled' | 'farkle' | 'won'>('idle');
  const [log, setLog] = useState('Welcome to Farkle! First to 10,000 wins. Roll 6 dice, set aside scorers, then bank or keep going!');
  const [isRolling, setIsRolling] = useState(false);
  const [rollsThisTurn, setRollsThisTurn] = useState(0);
  const [canRollAgain, setCanRollAgain] = useState(false);

  const calcFarkleScore = (vals: number[]): number => {
    const counts: Record<number, number> = {};
    for (const v of vals) counts[v] = (counts[v] || 0) + 1;

    let score = 0;
    // Straight 1-6
    if (vals.length === 6 && [1,2,3,4,5,6].every(n => counts[n] === 1)) return 1500;
    // Three pairs
    const pairs = Object.values(counts).filter(c => c === 2).length;
    if (vals.length === 6 && pairs === 3) return 1500;
    // Six of a kind
    const sixOf = Object.entries(counts).find(([,c]) => c === 6);
    if (sixOf) return sixOf[0] === '1' ? 8000 : parseInt(sixOf[0]) * 1000;
    // Five of a kind
    const fiveOf = Object.entries(counts).find(([,c]) => c === 5);
    if (fiveOf) return fiveOf[0] === '1' ? 4000 : parseInt(fiveOf[0]) * 500;
    // Four of a kind
    const fourOf = Object.entries(counts).find(([,c]) => c === 4);
    if (fourOf) return fourOf[0] === '1' ? 2000 : parseInt(fourOf[0]) * 200;

    // Three of a kind
    for (const [face, count] of Object.entries(counts)) {
      if (count >= 3) {
        score += face === '1' ? 1000 : parseInt(face) * 100;
        counts[face as any] -= 3;
      }
    }
    // Single 1s and 5s
    score += (counts[1] || 0) * 100;
    score += (counts[5] || 0) * 50;
    return score;
  };

  const rollDice = () => {
    if (isRolling || gamePhase === 'won') return;
    setIsRolling(true);
    if (triggerHaptic) triggerHaptic([30, 40, 30]);
    if (playTone) playTone(260, 'triangle', 0.15);

    const unscored = dice.filter(d => !d.held && !d.scored);
    const rollCount = unscored.length > 0 ? unscored.length : DICE_COUNT; // hot dice reset

    let frames = 0;
    const anim = setInterval(() => {
      setDice(prev => prev.map((d, i) => {
        if (d.held || d.scored) return d;
        return { ...d, value: Math.floor(Math.random() * 6) + 1 };
      }));
      frames++;
      if (frames >= 10) {
        clearInterval(anim);
        finalizeDice(rollCount);
      }
    }, 70);
  };

  const finalizeDice = (rollCount: number) => {
    const finalDice = dice.map((d, i) => {
      if (d.held || d.scored) return d;
      return { ...d, value: Math.floor(Math.random() * 6) + 1 };
    });
    setDice(finalDice);
    setIsRolling(false);
    setRollsThisTurn(r => r + 1);

    const freeVals = finalDice.filter(d => !d.held && !d.scored).map(d => d.value);
    const rollScore = calcFarkleScore(freeVals);

    if (rollScore === 0) {
      // FARKLE!
      if (triggerHaptic) triggerHaptic([200, 100, 200, 100, 200]);
      if (playTone) playTone(150, 'sawtooth', 0.5);
      setTurnScore(0);
      setGamePhase('farkle');
      setLog(`💀 FARKLE! No scoring dice. Turn score lost. Player ${turn === 1 ? 2 : 1}'s turn.`);
      setCanRollAgain(false);
    } else {
      if (triggerHaptic) triggerHaptic(15);
      if (playTone) playTone(523, 'sine', 0.1);
      setGamePhase('rolled');
      setCanRollAgain(false);
      setLog(`Rolled: potential +${rollScore} pts. Hold scoring dice, then Bank or Roll Again!`);
    }
  };

  const toggleHold = (idx: number) => {
    if (gamePhase !== 'rolled' || dice[idx]?.scored) return;
    if (triggerHaptic) triggerHaptic(6);
    const updated = dice.map((d, i) => i === idx ? { ...d, held: !d.held } : d);
    setDice(updated);
    // Recalc potential
    const heldVals = updated.filter(d => d.held && !d.scored).map(d => d.value);
    const potentialScore = heldVals.length > 0 ? calcFarkleScore(heldVals) : 0;
    if (potentialScore > 0) setCanRollAgain(true);
    else setCanRollAgain(false);
    setLog(potentialScore > 0 ? `Held dice worth: +${potentialScore}. Bank or keep rolling!` : 'Select scoring dice to hold before continuing.');
  };

  const bankScore = () => {
    if (canRollAgain === false && gamePhase === 'rolled') return;
    const heldVals = dice.filter(d => d.held && !d.scored).map(d => d.value);
    const scored = calcFarkleScore(heldVals);
    if (scored === 0) { setLog('Hold scoring dice first!'); return; }

    if (triggerHaptic) triggerHaptic([50, 30, 80]);
    if (playTone) playTone(659, 'sine', 0.3);

    const newTurnTotal = turnScore + scored;
    let p1New = p1Score, p2New = p2Score;
    if (turn === 1) p1New = p1Score + newTurnTotal;
    else p2New = p2Score + newTurnTotal;

    if (p1New >= TARGET || p2New >= TARGET) {
      setP1Score(p1New); setP2Score(p2New);
      setGamePhase('won');
      setLog(`🏆 PLAYER ${turn} WINS WITH ${turn === 1 ? p1New : p2New} POINTS!`);
      if (triggerHaptic) triggerHaptic([100, 50, 100, 50, 200]);
      if (playTone) playTone(659, 'sine', 0.6);
      return;
    }

    if (turn === 1) setP1Score(p1New); else setP2Score(p2New);
    setTurnScore(0);
    setRollsThisTurn(0);
    setCanRollAgain(false);
    const nextTurn = turn === 1 ? 2 : 1;
    setTurn(nextTurn as 1 | 2);
    setDice(Array(DICE_COUNT).fill(null).map(() => ({ value: 1, held: false, scored: false })));
    setGamePhase('idle');
    setLog(`💰 Banked +${newTurnTotal}! Player ${nextTurn}'s turn. Roll 6 dice!`);
  };

  const rollAgain = () => {
    if (!canRollAgain) { setLog('You must hold at least one scoring die before rolling again!'); return; }
    const heldVals = dice.filter(d => d.held && !d.scored).map(d => d.value);
    const scored = calcFarkleScore(heldVals);

    if (scored === 0) { setLog('Hold scoring dice first!'); return; }

    setTurnScore(ts => ts + scored);
    const updated = dice.map(d => d.held ? { ...d, scored: true, held: false } : d);
    const allScored = updated.every(d => d.scored);
    if (allScored) {
      // Hot dice — reset all for next roll
      setDice(Array(DICE_COUNT).fill(null).map(() => ({ value: 1, held: false, scored: false })));
      if (playTone) playTone(880, 'sine', 0.3);
      setLog('🔥 HOT DICE! All dice scored — roll all 6 again!');
    } else {
      setDice(updated);
    }
    setCanRollAgain(false);
    setGamePhase('idle');
  };

  const passTurn = () => {
    const nextTurn = turn === 1 ? 2 : 1;
    setTurn(nextTurn as 1 | 2);
    setTurnScore(0);
    setRollsThisTurn(0);
    setDice(Array(DICE_COUNT).fill(null).map(() => ({ value: 1, held: false, scored: false })));
    setGamePhase('idle');
    setCanRollAgain(false);
    setLog(`Player ${nextTurn}'s turn. Roll the dice!`);
  };

  const resetGame = () => {
    setP1Score(0); setP2Score(0); setTurnScore(0);
    setTurn(1); setGamePhase('idle'); setRollsThisTurn(0);
    setDice(Array(DICE_COUNT).fill(null).map(() => ({ value: 1, held: false, scored: false })));
    setLog('New game! Player 1 — roll the dice!');
    setCanRollAgain(false);
  };

  const renderDie = (die: Die, idx: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4], 2: [0, 8], 3: [0, 4, 8],
      4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
    };
    const dots = dotsMap[die.value] || [];
    return (
      <button
        key={idx}
        onClick={() => toggleHold(idx)}
        disabled={die.scored || gamePhase !== 'rolled' || isRolling}
        className={`relative w-12 h-12 rounded-xl grid grid-cols-3 gap-1 p-2 border-2 transition-all cursor-pointer select-none
          ${die.scored
            ? 'bg-slate-700/50 border-slate-600/30 opacity-40 cursor-not-allowed'
            : die.held
              ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-yellow-200 shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-110'
              : 'bg-gradient-to-tr from-[#fbbf24] via-[#d97706] to-[#fbbf24] border-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95'
          } ${isRolling && !die.held && !die.scored ? 'animate-bounce' : ''}`}
      >
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dots.includes(i) && (
              <span className={`w-1.5 h-1.5 rounded-full ${die.held ? 'bg-amber-900' : 'bg-slate-950'}`} />
            )}
          </div>
        ))}
        {die.scored && <div className="absolute inset-0 rounded-xl flex items-center justify-center text-[8px] font-bold text-emerald-400">✓</div>}
      </button>
    );
  };

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-yellow-400">🎲 Farkle (Push Your Luck)</span>
        <button onClick={resetGame} className="text-[10px] text-yellow-400/80 hover:text-white transition cursor-pointer">New Game</button>
      </div>

      {/* Score display */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-center font-mono">
        <div className={`p-2.5 rounded-xl border ${turn === 1 ? 'border-yellow-400/60 bg-yellow-900/20' : 'border-purple-500/10 bg-[#120a2c]/50'}`}>
          <div className="text-[8px] uppercase tracking-wider text-slate-400">Player 1 {turn === 1 && gamePhase !== 'won' ? '← Turn' : ''}</div>
          <div className="text-xl font-black text-yellow-400">{p1Score}</div>
          {turn === 1 && turnScore > 0 && <div className="text-[9px] text-amber-300">+{turnScore} pending</div>}
        </div>
        <div className={`p-2.5 rounded-xl border ${turn === 2 ? 'border-yellow-400/60 bg-yellow-900/20' : 'border-purple-500/10 bg-[#120a2c]/50'}`}>
          <div className="text-[8px] uppercase tracking-wider text-slate-400">Player 2 {turn === 2 && gamePhase !== 'won' ? '← Turn' : ''}</div>
          <div className="text-xl font-black text-amber-500">{p2Score}</div>
          {turn === 2 && turnScore > 0 && <div className="text-[9px] text-amber-300">+{turnScore} pending</div>}
        </div>
      </div>

      {/* Log */}
      <div className={`p-2.5 rounded-xl min-h-[42px] text-[11px] font-mono text-center mb-3 border ${gamePhase === 'farkle' ? 'border-red-500/30 bg-red-900/15 text-red-300' : gamePhase === 'won' ? 'border-emerald-500/30 bg-emerald-900/15' : 'border-[#44387a]/20 bg-black/20'}`}>
        {log}
      </div>

      {/* Dice */}
      <div className="flex justify-center gap-2.5 my-3 flex-wrap">
        {dice.map((die, i) => renderDie(die, i))}
      </div>
      {gamePhase === 'rolled' && <p className="text-[9px] text-center text-slate-500 font-mono -mt-1 mb-2">Tap dice to hold them for scoring</p>}

      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        {gamePhase === 'won' ? (
          <button onClick={resetGame} className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer">
            🎲 Play Again
          </button>
        ) : gamePhase === 'farkle' ? (
          <button onClick={passTurn} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase rounded-xl cursor-pointer transition">
            Pass Turn ➡
          </button>
        ) : (
          <>
            <button
              onClick={rollDice}
              disabled={isRolling || (gamePhase === 'rolled' && !canRollAgain)}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-amber-500 hover:brightness-110 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-40"
            >
              {isRolling ? 'Rolling...' : gamePhase === 'idle' ? '🎲 Roll Dice' : canRollAgain ? '🔄 Roll Again' : 'Hold Dice First'}
            </button>
            {gamePhase === 'rolled' && canRollAgain && (
              <button onClick={rollAgain} className="px-4 py-3 bg-amber-600/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase rounded-xl cursor-pointer hover:bg-amber-600/30 transition">
                Confirm Hold
              </button>
            )}
            {(turnScore > 0 || (gamePhase === 'rolled' && canRollAgain)) && (
              <button onClick={bankScore} className="px-4 py-3 bg-emerald-700/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase rounded-xl cursor-pointer hover:bg-emerald-600/40 transition">
                💰 Bank
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-2">
        <span>1s=100 • 5s=50 • 3-of-kind=face×100 • Straight=1500</span>
        <span>Target: {TARGET.toLocaleString()}</span>
      </div>
    </div>
  );
}



// ==========================================
// 8. LABYRINTH LIGHT FOG FANTASY ESCAPE
// ==========================================
function LabyrinthGame({ playTone, triggerHaptic }: GameSyncProps) {
  const GRID = 9; // 9x9 maze
  const FOG_RADIUS = 2;

  // Wall encoding: each cell has N/E/S/W walls as bitmask (1=N, 2=E, 4=S, 8=W)
  const generateMaze = (): number[][] => {
    const walls: number[][] = Array(GRID).fill(null).map(() => Array(GRID).fill(15)); // all walls
    const visited: boolean[][] = Array(GRID).fill(null).map(() => Array(GRID).fill(false));

    const carve = (y: number, x: number) => {
      visited[y][x] = true;
      const dirs = [[0,-1,1,4],[1,0,2,8],[0,1,4,1],[-1,0,8,2]].sort(() => Math.random() - 0.5); // [dx,dy,removeFromCurrent,removeFromNeighbor]
      for (const [dx, dy, rmCurr, rmNeighbor] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID && !visited[ny][nx]) {
          walls[y][x] &= ~rmCurr;
          walls[ny][nx] &= ~rmNeighbor;
          carve(ny, nx);
        }
      }
    };
    carve(0, 0);
    return walls;
  };

  const placePowerups = (maze: number[][]): {torches: string[], traps: string[]} => {
    const torches: string[] = [], traps: string[] = [];
    const all: string[] = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      if ((y !== 0 || x !== 0) && (y !== GRID-1 || x !== GRID-1)) all.push(`${y},${x}`);
    }
    const shuffled = all.sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4; i++) torches.push(shuffled[i]!);
    for (let i = 4; i < 8; i++) traps.push(shuffled[i]!);
    return { torches, traps };
  };

  const [maze, setMaze] = useState<number[][]>(() => generateMaze());
  const [torches, setTorches] = useState<string[]>([]);
  const [traps, setTraps] = useState<string[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [exitPos] = useState({ x: GRID - 1, y: GRID - 1 });
  const [battery, setBattery] = useState(100);
  const [visionBoost, setVisionBoost] = useState(0); // extra radius from torches
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  useEffect(() => {
    const m = generateMaze();
    setMaze(m);
    const { torches: t, traps: tr } = placePowerups(m);
    setTorches(t);
    setTraps(tr);
  }, []);

  const canMove = (y: number, x: number, dy: number, dx: number): boolean => {
    // Check wall: N=1, E=2, S=4, W=8
    if (dy === -1) return !(maze[y][x]! & 1); // moving north, check N wall
    if (dx === 1)  return !(maze[y][x]! & 2); // moving east
    if (dy === 1)  return !(maze[y][x]! & 4); // moving south
    if (dx === -1) return !(maze[y][x]! & 8); // moving west
    return false;
  };

  const handleMove = (dx: number, dy: number) => {
    if (won || battery <= 0) return;
    const nextX = playerPos.x + dx;
    const nextY = playerPos.y + dy;
    if (nextX < 0 || nextX >= GRID || nextY < 0 || nextY >= GRID) return;
    if (!canMove(playerPos.y, playerPos.x, dy, dx)) {
      if (triggerHaptic) triggerHaptic([20]);
      if (playTone) playTone(200, 'sawtooth', 0.05);
      return;
    }

    if (triggerHaptic) triggerHaptic(6);
    if (playTone) playTone(440, 'triangle', 0.05);

    const key = `${nextY},${nextX}`;
    let newBattery = battery - 3;
    let newBoost = visionBoost;

    if (traps.includes(key)) {
      newBattery = Math.max(0, newBattery - 20);
      if (triggerHaptic) triggerHaptic([100, 50, 100]);
      if (playTone) playTone(150, 'sawtooth', 0.3);
      setTraps(prev => prev.filter(t => t !== key));
    }

    if (torches.includes(key)) {
      newBoost = Math.min(2, newBoost + 1);
      newBattery = Math.min(100, newBattery + 15);
      if (triggerHaptic) triggerHaptic([50, 30, 80]);
      if (playTone) playTone(659, 'sine', 0.2);
      setTorches(prev => prev.filter(t => t !== key));
    }

    setPlayerPos({ x: nextX, y: nextY });
    setBattery(Math.max(0, newBattery));
    setVisionBoost(newBoost);
    setMoves(m => m + 1);

    if (nextX === exitPos.x && nextY === exitPos.y) {
      setWon(true);
      if (triggerHaptic) triggerHaptic([50, 100, 150, 100, 200]);
      if (playTone) playTone(659, 'sine', 0.5);
      setBestMoves(prev => prev === null || moves + 1 < prev ? moves + 1 : prev);
    }
  };

  const handleReset = () => {
    if (triggerHaptic) triggerHaptic(20);
    const newMaze = generateMaze();
    setMaze(newMaze);
    const { torches: t, traps: tr } = placePowerups(newMaze);
    setTorches(t);
    setTraps(tr);
    setPlayerPos({ x: 0, y: 0 });
    setBattery(100);
    setVisionBoost(0);
    setMoves(0);
    setWon(false);
  };

  const effectiveRadius = FOG_RADIUS + visionBoost;
  const cellSize = Math.floor(280 / GRID); // ~31px per cell for 9x9

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-2">
        <span className="text-[12px] font-bold text-cyan-400">🔦 Fog Escape Labyrinth</span>
        <div className="flex gap-3 text-[9px] font-mono text-slate-400">
          <span>Moves: {moves}</span>
          {bestMoves && <span className="text-cyan-400">Best: {bestMoves}</span>}
          <button onClick={handleReset} className="text-cyan-400/80 hover:text-white transition cursor-pointer">New Maze</button>
        </div>
      </div>

      <div className={`p-2 rounded-xl text-[11px] font-mono text-center mb-2 border ${won ? 'border-emerald-500/30 bg-emerald-900/20' : battery <= 0 ? 'border-red-500/30 bg-red-900/20' : 'border-cyan-500/15 bg-black/20'}`}>
        {won
          ? `🎉 Escaped in ${moves} moves! ${bestMoves && moves <= bestMoves ? '🏆 New Best!' : ''}`
          : battery <= 0
            ? '💀 Out of battery! Lost in the fog. Press New Maze.'
            : `🔦 Reach the exit (bottom-right). 🕯️ = torch, ⚡ = trap!`}
      </div>

      {/* Maze grid */}
      <div className="flex justify-center my-1">
        <div
          style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, ${cellSize}px)` }}
          className="p-1 bg-[#050d1a]/80 rounded-xl border border-cyan-500/20"
        >
          {Array.from({ length: GRID }).map((_, y) =>
            Array.from({ length: GRID }).map((_, x) => {
              const isPlayer = playerPos.x === x && playerPos.y === y;
              const isExit = exitPos.x === x && exitPos.y === y;
              const dist = Math.max(Math.abs(playerPos.x - x), Math.abs(playerPos.y - y)); // Chebyshev
              const isVisible = dist <= effectiveRadius;
              const key = `${y},${x}`;
              const hasTorch = torches.includes(key);
              const hasTrap = traps.includes(key);
              const w = maze[y]?.[x] ?? 15;

              return (
                <div
                  key={key}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderTop: (w & 1) ? '2px solid rgba(6,182,212,0.4)' : '2px solid transparent',
                    borderRight: (w & 2) ? '2px solid rgba(6,182,212,0.4)' : '2px solid transparent',
                    borderBottom: (w & 4) ? '2px solid rgba(6,182,212,0.4)' : '2px solid transparent',
                    borderLeft: (w & 8) ? '2px solid rgba(6,182,212,0.4)' : '2px solid transparent',
                    fontSize: cellSize * 0.45,
                  }}
                  className={`flex items-center justify-center transition-all duration-200
                    ${isPlayer ? 'bg-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.5)]' :
                      isExit && isVisible ? 'bg-emerald-600/25' :
                      isVisible ? 'bg-[#051020]/60' :
                      'bg-black/80'}`}
                >
                  {isPlayer ? '🧙'
                    : !isVisible ? ''
                    : isExit ? '🚪'
                    : hasTorch ? '🕯️'
                    : hasTrap ? '⚡'
                    : ''}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Battery bar */}
      <div className="flex items-center gap-2 px-1 my-1">
        <span className="text-[9px] font-mono text-cyan-400 whitespace-nowrap">🔦 {battery}%</span>
        <div className="flex-grow h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${battery > 40 ? 'bg-cyan-500' : battery > 20 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`}
            style={{ width: `${battery}%` }}
          />
        </div>
        <span className="text-[9px] font-mono text-slate-500">Vision: +{visionBoost}</span>
      </div>

      {/* D-pad */}
      <div className="grid grid-cols-3 gap-1 w-28 mx-auto mt-1">
        <div />
        <button onClick={() => handleMove(0, -1)} className="py-2 bg-slate-800 hover:bg-cyan-900/50 hover:border-cyan-500/30 border border-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer active:scale-90 transition">▲</button>
        <div />
        <button onClick={() => handleMove(-1, 0)} className="py-2 bg-slate-800 hover:bg-cyan-900/50 hover:border-cyan-500/30 border border-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer active:scale-90 transition">◀</button>
        <button onClick={handleReset} className="py-2 bg-cyan-900/30 border border-cyan-500/20 text-cyan-300 rounded-lg text-[9px] font-extrabold cursor-pointer active:scale-90 transition">RST</button>
        <button onClick={() => handleMove(1, 0)} className="py-2 bg-slate-800 hover:bg-cyan-900/50 hover:border-cyan-500/30 border border-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer active:scale-90 transition">▶</button>
        <div />
        <button onClick={() => handleMove(0, 1)} className="py-2 bg-slate-800 hover:bg-cyan-900/50 hover:border-cyan-500/30 border border-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer active:scale-90 transition">▼</button>
        <div />
      </div>
    </div>
  );
}


// ==========================================
// 9. CHAIN REACTION (CHAIN BURST)
// ==========================================
interface ReactBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  exploded: boolean;
  explosionRadius: number;
  explosionDuration: number;
}

function ChainReactionGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [explodedCount, setExplodedCount] = useState<number>(0);
  const [clicksCount, setClicksCount] = useState<number>(0);
  const [log, setLog] = useState<string>('Click once to drop an explosion core. Trigger chain pops!');
  
  const BALLS_COUNT = 25;
  const TARGET_POPS = 12;
  const MAX_EXPLOSION_RADIUS = 32;

  // We keep a mutable ref for animation frames to avoid React state lag during requestAnimationFrame
  const ballsRef = useRef<ReactBall[]>([]);

  const initGame = () => {
    triggerHaptic(20);
    playTone(523, 'sine', 0.15);
    setGameState('playing');
    setExplodedCount(0);
    setClicksCount(0);
    setLog(`Pop at least ${TARGET_POPS} balls to win the level!`);

    const freshBalls: ReactBall[] = [];
    const colors = ['#f43f5e', '#cf4fe6', '#3fd9c7', '#3b82f6', '#eab308', '#10b981'];

    for (let i = 0; i < BALLS_COUNT; i++) {
      freshBalls.push({
        x: 30 + Math.random() * 320,
        y: 30 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 3 || 1.5,
        vy: (Math.random() - 0.5) * 3 || 1.5,
        radius: 6,
        color: colors[i % colors.length],
        exploded: false,
        explosionRadius: 0,
        explosionDuration: 0
      });
    }
    ballsRef.current = freshBalls;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updateFrame = () => {
      ctx.fillStyle = '#0f0926';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let activeExplosion = false;
      const currentBalls = ballsRef.current;

      currentBalls.forEach((ball) => {
        if (!ball.exploded) {
          ball.x += ball.vx;
          ball.y += ball.vy;

          if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) ball.vx *= -1;
          if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) ball.vy *= -1;

          currentBalls.forEach((other) => {
            if (other.exploded && other.explosionDuration < 120) {
              const dx = ball.x - other.x;
              const dy = ball.y - other.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < ball.radius + other.explosionRadius) {
                ball.exploded = true;
                ball.explosionRadius = 4;
                ball.explosionDuration = 0;
                triggerHaptic(8);
                playTone(400 + Math.random() * 600, 'sine', 0.08);
              }
            }
          });

          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
          ctx.fillStyle = ball.color;
          ctx.fill();
        } else {
          ball.explosionDuration += 1;
          if (ball.explosionDuration < 40) {
            ball.explosionRadius += (MAX_EXPLOSION_RADIUS - ball.explosionRadius) * 0.1;
          } else if (ball.explosionDuration < 100) {
            // Stationary peak
          } else if (ball.explosionDuration < 120) {
            ball.explosionRadius -= ball.explosionRadius * 0.2;
          }

          if (ball.explosionDuration < 120) {
            activeExplosion = true;

            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.explosionRadius, 0, 2 * Math.PI);
            ctx.fillStyle = `${ball.color}40`;
            ctx.strokeStyle = ball.color;
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();
          }
        }
      });

      const totalExploded = currentBalls.filter(b => b.exploded).length;
      setExplodedCount(totalExploded);

      if (clicksCount > 0 && !activeExplosion) {
        if (totalExploded >= TARGET_POPS) {
          setGameState('won');
          setLog(`Victory! Pop score: ${totalExploded}/${BALLS_COUNT}! 🏆`);
          playTone(659, 'sine', 0.4);
        } else {
          setGameState('lost');
          setLog(`Defeat. Pop score: ${totalExploded}/${BALLS_COUNT}. Needed ${TARGET_POPS}.`);
          playTone(220, 'sawtooth', 0.45);
        }
        return;
      }

      animId = requestAnimationFrame(updateFrame);
    };

    animId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animId);
  }, [gameState, clicksCount]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || clicksCount > 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    triggerHaptic(15);
    playTone(349, 'triangle', 0.15);

    setClicksCount(1);
    ballsRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 0,
      color: '#ffffff',
      exploded: true,
      explosionRadius: 4,
      explosionDuration: 0
    });
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-indigo-400">💥 Chain Burst (Reflex React)</span>
        <button onClick={initGame} className="text-[10px] text-indigo-400/80 hover:text-white transition">Reset Game</button>
      </div>

      <div className="bg-black/30 p-2.5 rounded-xl min-h-[40px] text-[11px] leading-relaxed font-mono text-center mb-3">
        {log}
      </div>

      <div className="flex-grow flex justify-center items-center select-none relative mb-3">
        {(gameState === 'idle' || gameState === 'won' || gameState === 'lost') && (
          <div className="absolute inset-0 bg-[#0f0926]/90 rounded-2xl flex flex-col items-center justify-center p-4 border border-indigo-500/25 z-10">
            <span className="text-sm font-mono text-[#faebd7] font-bold mb-3">
              {gameState === 'won' ? 'LEVEL COMPLETED' : gameState === 'lost' ? 'ROUND FAIL' : 'CHAIN REACTION'}
            </span>
            <button
              onClick={initGame}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer"
            >
              Start Game ▶️
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={380}
          height={220}
          onClick={handleCanvasClick}
          className="bg-[#0f0926] rounded-2xl border border-indigo-500/15 cursor-crosshair w-full max-w-[380px] h-[220px]"
        />
      </div>

      <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1 select-none">
        <span>Target Pops: {TARGET_POPS}</span>
        <span className="text-indigo-400 font-bold">Pops Score: {explodedCount}</span>
      </div>
    </div>
  );
}

// ==========================================
// 10. BLINK REFLEX TAP GAME
// ==========================================
function BlinkGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'blinked' | 'result'>('idle');
  const [log, setLog] = useState<string>('Test your reflex time. Click start, wait for green, and TAP!');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('blink_highscore') || '999');
  });
  const [opponentTime, setOpponentTime] = useState<number | null>(null);
  const [opponentName, setOpponentName] = useState<string>('');

  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const startReflexTest = () => {
    if (triggerHaptic) triggerHaptic(15);
    if (playTone) playTone(523, 'sine', 0.1);
    
    const delay = 1500 + Math.random() * 3000;
    
    if (joined && sendGameAction) {
      sendGameAction({ type: 'blink_start', delay });
    }
    
    startBlinkSequence(delay);
  };

  const startBlinkSequence = (delay: number) => {
    setGameState('waiting');
    setLog('Focus... wait for it...');
    setReactionTime(null);
    setOpponentTime(null);

    timerRef.current = setTimeout(() => {
      setGameState('blinked');
      setLog('TAP NOW! ⚡');
      startTimeRef.current = performance.now();
      if (triggerHaptic) triggerHaptic([80, 80]);
      if (playTone) playTone(880, 'sine', 0.15);
    }, delay);
  };

  const handleTap = () => {
    if (gameState === 'waiting') {
      clearTimeout(timerRef.current);
      setGameState('idle');
      if (triggerHaptic) triggerHaptic([150, 100]);
      if (playTone) playTone(220, 'sawtooth', 0.4);
      setLog('TOO EARLY! Wait for the screen to blink green.');
      if (joined && sendGameAction) {
        sendGameAction({ type: 'blink_early' });
      }
    } else if (gameState === 'blinked') {
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTimeRef.current);
      setReactionTime(elapsed);
      setGameState('result');
      if (triggerHaptic) triggerHaptic(25);
      if (playTone) playTone(659, 'sine', 0.2);

      if (elapsed < highScore) {
        setHighScore(elapsed);
        localStorage.setItem('blink_highscore', elapsed.toString());
      }

      if (joined && sendGameAction) {
        sendGameAction({ type: 'blink_tapped', name: currentUser, elapsed });
      }

      evaluateWinner(elapsed, opponentTime);
    }
  };

  const evaluateWinner = (myTime: number | null, oppTime: number | null) => {
    if (!joined) {
      if (myTime !== null) {
        setLog(`Your reflex response time: ${myTime} ms.`);
      }
      return;
    }
    
    if (myTime !== null && oppTime !== null) {
      if (myTime < oppTime) {
        setLog(`Victory! You tapped in ${myTime}ms (Opponent: ${oppTime}ms) ⚡🏆`);
      } else if (oppTime < myTime) {
        setLog(`Defeat! Opponent tapped in ${oppTime}ms (You: ${myTime}ms) 💀`);
      } else {
        setLog(`Tie Match! Both tapped in ${myTime}ms!`);
      }
    } else if (myTime !== null) {
      setLog(`You tapped in ${myTime}ms! Waiting for opponent...`);
    }
  };

  useEffect(() => {
    if (joined && lastAction && lastAction.senderId !== currentUser) {
      const { type, delay, name, elapsed } = lastAction.payload;
      if (type === 'blink_start') {
        startBlinkSequence(delay);
      } else if (type === 'blink_early') {
        clearTimeout(timerRef.current);
        setGameState('idle');
        setLog('Opponent tapped early! Restart the reflex test.');
      } else if (type === 'blink_tapped') {
        setOpponentTime(elapsed);
        setOpponentName(name);
        evaluateWinner(reactionTime, elapsed);
      }
    }
  }, [lastAction, joined, currentUser, reactionTime]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-rose-400">⚡ Blink Reflex Tap</span>
        <span className="text-[9px] font-mono text-rose-400">Record: {highScore} ms</span>
      </div>

      <div className="bg-black/30 p-2.5 rounded-xl min-h-[40px] text-[11px] leading-relaxed font-mono text-center">
        {log}
      </div>

      <div className="my-6 flex items-center justify-center select-none">
        <button
          onClick={handleTap}
          className={`w-36 h-36 rounded-full border-4 transition-all duration-150 flex flex-col items-center justify-center cursor-pointer ${
            gameState === 'waiting'
              ? 'bg-amber-600/30 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse'
              : gameState === 'blinked'
                ? 'bg-emerald-500 border-white shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-[1.05]'
                : 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400 hover:bg-rose-500/10'
          }`}
        >
          <span className="text-white text-xs font-black tracking-widest uppercase">
            {gameState === 'waiting' ? 'WAIT...' : gameState === 'blinked' ? 'TAP! ⚡' : 'TARGET'}
          </span>
          {reactionTime !== null && (
            <span className="text-white text-lg font-bold font-mono mt-1">{reactionTime} ms</span>
          )}
        </button>
      </div>

      <div className="select-none">
        {gameState !== 'waiting' && gameState !== 'blinked' && (
          <button
            onClick={startReflexTest}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition cursor-pointer"
          >
            Start Reflex Test ▶️
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 11. HI-LO D20 DECISION GAME
// ==========================================
function HiLoGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  type DMode = { label: string; sides: number };
  const MODES: DMode[] = [
    { label: 'D6', sides: 6 },
    { label: 'D12', sides: 12 },
    { label: 'D20', sides: 20 },
    { label: 'D100', sides: 100 },
  ];
  const [mode, setMode] = useState<DMode>(MODES[2]!);
  const [currentNum, setCurrentNum] = useState<number>(() => Math.floor(Math.random() * 20) + 1);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(() => Number(localStorage.getItem('game_best') || '0'));
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [log, setLog] = useState<string>('Guess if the next roll will be higher or lower!');

  const handleGuess = (direction: 'higher' | 'lower') => {
    if (isRolling) return;
    setIsRolling(true);
    if (triggerHaptic) triggerHaptic([30, 30]);
    if (playTone) playTone(320, 'triangle', 0.15);

    let rolls = 0;
    const interval = setInterval(() => {
      setCurrentNum(Math.floor(Math.random() * mode.sides) + 1);
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        const finalNum = Math.floor(Math.random() * mode.sides) + 1;
        setCurrentNum(finalNum);
        setIsRolling(false);

        const isCorrect = direction === 'higher' ? finalNum >= currentNum : finalNum <= currentNum;
        let nextStreak = streak;
        let nextBest = bestStreak;
        let logMsg = '';

        if (isCorrect) {
          nextStreak = streak + 1;
          if (nextStreak > bestStreak) {
            nextBest = nextStreak;
            localStorage.setItem('game_best', String(nextBest));
          }
          logMsg = `Rolled ${finalNum}! Correct – keep the streak going!`;
          if (triggerHaptic) triggerHaptic(15);
          if (playTone) playTone(587, 'sine', 0.15);
        } else {
          nextStreak = 0;
          logMsg = `Rolled ${finalNum}! Streak broken. Try again!`;
          if (triggerHaptic) triggerHaptic([120, 80, 120]);
          if (playTone) playTone(220, 'sawtooth', 0.35);
        }

        setStreak(nextStreak);
        setBestStreak(nextBest);
        setLog(logMsg);

        if (joined && sendGameAction) {
          sendGameAction({
            type: 'hilo_guess_result',
            currentNum: finalNum,
            streak: nextStreak,
            bestStreak: nextBest,
            log: logMsg
          });
        }
      }
    }, 70);
  };

  useEffect(() => {
    if (joined && lastAction && lastAction.senderId !== currentUser) {
      const { type, currentNum: num, streak: str, bestStreak: bStr, log: incomingLog } = lastAction.payload;
      if (type === 'hilo_guess_result') {
        setCurrentNum(num);
        setStreak(str);
        setBestStreak(bStr);
        setLog(incomingLog);
      } else if (type === 'hilo_reset') {
        setStreak(0);
        setLog('Guess if the next roll will be higher or lower!');
      }
    }
  }, [lastAction, joined, currentUser]);

  const triggerReset = () => {
    setStreak(0);
    setLog('Guess if the next roll will be higher or lower!');
    if (joined && sendGameAction) {
      sendGameAction({ type: 'hilo_reset' });
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-amber-400">🎲 Hi-Lo Dice Guessing</span>
        <button onClick={triggerReset} className="text-[10px] text-amber-400/80 hover:text-white transition cursor-pointer">Reset</button>
      </div>

      {/* Difficulty selector */}
      <div className="flex gap-1.5 mb-2 justify-center">
        {MODES.map(m => (
          <button
            key={m.label}
            onClick={() => { setMode(m); setCurrentNum(Math.floor(Math.random() * m.sides) + 1); setStreak(0); }}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border transition cursor-pointer ${mode.label === m.label ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-black/30 border-[#44387a]/30 text-slate-400 hover:text-white'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="bg-black/30 p-2.5 rounded-xl min-h-[40px] text-[11px] leading-relaxed font-mono text-center mb-4">
        {log}
      </div>

      <div className="flex flex-col items-center justify-center py-4 relative">
        <div className={`relative w-24 h-24 flex items-center justify-center transition-transform duration-300 ${isRolling ? 'animate-spin' : 'hover:scale-105'}`}>
          <svg className="w-full h-full text-amber-400/85 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.25)]" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="50,5 95,28 95,72 50,95 5,72 5,28" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <polygon points="5,28 95,28 50,50 5,28" fill="rgba(251,191,36,0.03)" stroke="currentColor" strokeWidth="1.2" />
            <polygon points="5,72 95,72 50,50 5,72" fill="rgba(251,191,36,0.03)" stroke="currentColor" strokeWidth="1.2" />
            <polygon points="50,5 50,50 95,28 50,5" fill="rgba(251,191,36,0.03)" stroke="currentColor" strokeWidth="1.2" />
            <polygon points="50,95 50,50 95,72 50,95" fill="rgba(251,191,36,0.03)" stroke="currentColor" strokeWidth="1.2" />
            <polygon points="5,28 50,50 5,72 5,28" fill="rgba(251,191,36,0.03)" stroke="currentColor" strokeWidth="1.2" />
            <polygon points="95,28 50,50 95,72 95,28" fill="rgba(251,191,36,0.03)" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="absolute text-2xl font-black font-mono text-amber-200 mt-0.5">{currentNum}</span>
        </div>
      </div>

      <div className="flex gap-4 mt-2">
        <button
          onClick={() => handleGuess('lower')}
          className="flex-grow py-2.5 bg-red-600/20 hover:bg-red-600/35 border border-red-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
        >
          ▼ Lower
        </button>
        <button
          onClick={() => handleGuess('higher')}
          className="flex-grow py-2.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
        >
          ▲ Higher
        </button>
      </div>

      <div className="flex justify-around mt-4 pt-3 border-t border-[#44387a]/25 text-center">
        <div>
          <div className="text-lg font-black text-slate-100 font-mono">{streak}</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Current Streak</div>
        </div>
        <div>
          <div className="text-lg font-black text-amber-400 font-mono">{bestStreak}</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Best Streak</div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 12. BOARD GAME SCOREPAD TRACKER
// ==========================================
function ScorepadGame({ triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [players, setPlayers] = useState<{ name: string; score: number }[]>(() => {
    try {
      const stored = localStorage.getItem('boardgame_scores');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { name: 'Player 1', score: 0 },
      { name: 'Player 2', score: 0 }
    ];
  });
  const [newName, setNewName] = useState('');

  const save = (list: typeof players) => {
    setPlayers(list);
    localStorage.setItem('boardgame_scores', JSON.stringify(list));
    if (joined && sendGameAction) {
      sendGameAction({ type: 'scorepad_update', playersList: list });
    }
  };

  useEffect(() => {
    if (joined && lastAction && lastAction.senderId !== currentUser) {
      const { type, playersList } = lastAction.payload;
      if (type === 'scorepad_update') {
        setPlayers(playersList);
        localStorage.setItem('boardgame_scores', JSON.stringify(playersList));
      }
    }
  }, [lastAction, joined, currentUser]);

  const adjScore = (idx: number, delta: number) => {
    const list = [...players];
    if (list[idx]) {
      list[idx].score += delta;
      save(list);
      if (triggerHaptic) triggerHaptic(10);
    }
  };

  const delPlayer = (idx: number) => {
    const list = players.filter((_, i) => i !== idx);
    save(list);
    if (triggerHaptic) triggerHaptic(15);
  };

  const addPlayer = () => {
    const name = newName.trim();
    if (!name) return;
    if (players.length >= 8) return;
    const list = [...players, { name, score: 0 }];
    save(list);
    setNewName('');
    if (triggerHaptic) triggerHaptic(12);
  };

  const resetScores = () => {
    const list = players.map(p => ({ ...p, score: 0 }));
    save(list);
    if (triggerHaptic) triggerHaptic(50);
  };

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-teal-400">📝 Scorepad Tracker</span>
        <button onClick={resetScores} className="text-[10px] text-teal-400/80 hover:text-white transition cursor-pointer">Reset Scores</button>
      </div>

      <div className="flex-grow flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
        {players.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#140a2b]/60 border border-[#44387a]/30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-teal-300 uppercase">{p.name}</span>
              <span className="text-xs font-mono font-black text-amber-400 bg-black/35 px-2 py-0.5 rounded-md min-w-[28px] text-center">{p.score}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => adjScore(idx, -5)} className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-500/20 hover:bg-red-500/25 text-red-400 font-bold text-[9px] cursor-pointer focus:outline-none transition">-5</button>
              <button onClick={() => adjScore(idx, -1)} className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-500/20 hover:bg-red-500/25 text-red-400 font-bold text-xs cursor-pointer focus:outline-none transition">-1</button>
              <button onClick={() => adjScore(idx, 1)} className="w-7 h-7 rounded-lg bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs cursor-pointer focus:outline-none transition">+1</button>
              <button onClick={() => adjScore(idx, 5)} className="w-8 h-7 rounded-lg bg-[#44387a]/20 border border-[#44387a]/40 hover:bg-[#44387a]/35 text-purple-300 font-bold text-[10px] cursor-pointer focus:outline-none transition">+5</button>
              <button onClick={() => adjScore(idx, 10)} className="w-9 h-7 rounded-lg bg-amber-600/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 font-bold text-[10px] cursor-pointer focus:outline-none transition">+10</button>
              <button onClick={() => delPlayer(idx)} className="w-6 h-7 text-slate-500 hover:text-red-400 font-bold text-sm cursor-pointer focus:outline-none transition">×</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 mt-3 pt-3 border-t border-[#44387a]/20">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New player..."
          className="flex-grow bg-black/40 border border-[#44387a]/40 rounded-xl px-3 py-2 text-xs font-mono text-[#faebd7] placeholder-[#b4aae2]/40 focus:outline-none focus:border-teal-500 transition"
        />
        <button
          onClick={addPlayer}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 13. ASTROLABE GROUP SPINNER
// ==========================================
function AstrolabeGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [choices, setChoices] = useState<string>('Yes, No, Doubt, Reroll, Portal Warp, Wild Magic');
  const [selected, setSelected] = useState<string>('READY');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  const handleSpin = () => {
    if (isSpinning) return;
    if (triggerHaptic) triggerHaptic([10, 40, 80]);
    const options = choices.split(',').map(o => o.trim()).filter(Boolean);
    if (options.length === 0) return;

    const finalWord = options[Math.floor(Math.random() * options.length)]?.toUpperCase() || 'READY';

    if (joined && sendGameAction) {
      sendGameAction({ type: 'astrolabe_spin', choices, finalWord });
    }

    startSpinAnimation(choices, finalWord);
  };

  const startSpinAnimation = (optText: string, finalWord: string) => {
    const options = optText.split(',').map(o => o.trim()).filter(Boolean);
    setIsSpinning(true);
    setSelected('...');
    if (playTone) playTone(260, 'sine', 0.1);

    const interval = setInterval(() => {
      const tempWord = options[Math.floor(Math.random() * options.length)];
      setSelected(tempWord || '');
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      setSelected(finalWord);
      setIsSpinning(false);
      if (triggerHaptic) triggerHaptic([100, 200]);
      if (playTone) playTone(523, 'sine', 0.25);
    }, 2000);
  };

  useEffect(() => {
    if (joined && lastAction && lastAction.senderId !== currentUser) {
      const { type, choices: incomingChoices, finalWord } = lastAction.payload;
      if (type === 'astrolabe_spin') {
        setChoices(incomingChoices);
        startSpinAnimation(incomingChoices, finalWord);
      }
    }
  }, [lastAction, joined, currentUser]);

  return (
    <div className="flex-grow flex flex-col justify-between select-none">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-purple-400">🔮 Astrolabe Decision Spinner</span>
        <button onClick={() => setSelected('READY')} className="text-[10px] text-purple-400/80 hover:text-white transition cursor-pointer">Reset</button>
      </div>

      <div className="flex justify-center items-center my-2 relative">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className={`absolute w-full h-full text-purple-500/20 ${isSpinning ? 'animate-spin' : ''}`} style={{ animationDuration: isSpinning ? '0.6s' : '15s' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#cf4fe6" strokeWidth="1" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="#3fd9c7" strokeWidth="0.8" strokeDasharray="2 4" />
            <polygon points="50,8 46,15 54,15" fill="#13efb0" />
          </svg>
          <div className="text-center z-10 max-w-[90px] px-2 break-words">
            <p className="text-[10px] font-black text-amber-300 uppercase tracking-tight break-words leading-tight">{selected}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-[#44387a]/20">
        <textarea
          rows={2}
          value={choices}
          onChange={(e) => setChoices(e.target.value)}
          placeholder="Comma-separated choices..."
          className="w-full bg-black/40 border border-[#44387a]/40 rounded-xl px-3 py-2 text-[11px] font-mono text-[#faebd7] placeholder-[#b4aae2]/40 focus:outline-none focus:border-purple-500 transition resize-none"
        />
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 active:scale-95 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition duration-200 cursor-pointer"
        >
          💫 Revolve Astrolabe
        </button>
      </div>
    </div>
  );
}
