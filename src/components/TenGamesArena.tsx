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
}

function CheatGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHands, setBots] = useState<Record<string, Card[]>>({ AI_1: [], AI_2: [] });
  const [pile, setPile] = useState<Card[]>([]);
  const [targetValue, setTargetValue] = useState<string>('A');
  const [log, setLog] = useState<string>('The round has started! Discard cards matching the target value.');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const initGame = () => {
    const freshDeck: Card[] = [];
    let counter = 0;
    VALUES.forEach(val => {
      for (let i = 0; i < 4; i++) {
        freshDeck.push({ id: `card-${counter++}`, value: val });
      }
    });
    const shuffled = freshDeck.sort(() => Math.random() - 0.5);
    setPlayerHand(shuffled.slice(0, 12));
    setBots({
      AI_1: shuffled.slice(12, 24),
      AI_2: shuffled.slice(24, 36)
    });
    setPile([]);
    setTargetValue('A');
    setSelectedCards([]);
    setLog('All hands dealt! Cards distributed. Your turn to place an "A".');
    playTone(523, 'triangle', 0.2);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardSelect = (cardId: string) => {
    triggerHaptic(6);
    setSelectedCards(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const handleDiscard = (bluff: boolean) => {
    if (selectedCards.length === 0) return;
    triggerHaptic(15);
    playTone(349, 'sine', 0.15);

    const actualDiscards = playerHand.filter(c => selectedCards.includes(c.id));
    setPlayerHand(prev => prev.filter(c => !selectedCards.includes(c.id)));
    setPile(prev => [...prev, ...actualDiscards]);
    setSelectedCards([]);

    const claimsLie = actualDiscards.some(c => c.value !== targetValue);
    setLog(`You placed ${actualDiscards.length} card(s) claiming they are "${targetValue}"s.`);

    setTimeout(() => {
      const doubtThreshold = claimsLie ? 0.65 : 0.15;
      if (Math.random() < doubtThreshold) {
        triggerHaptic([80, 50, 100]);
        if (claimsLie) {
          setPlayerHand(prev => [...prev, ...pile, ...actualDiscards]);
          setPile([]);
          playTone(220, 'sawtooth', 0.5);
          setLog(`Alchemist AI yelled "I DOUBT IT!" and caught your bluff! You pick up the entire discard pile.`);
        } else {
          setBots(prev => ({
            ...prev,
            AI_1: [...prev.AI_1, ...pile, ...actualDiscards]
          }));
          setPile([]);
          playTone(880, 'sine', 0.3);
          setLog(`Alchemist AI shouted "I DOUBT IT!" but you were telling the truth! AI_1 must pick up the entire pile!`);
        }
      } else {
        const nextIndex = (VALUES.indexOf(targetValue) + 1) % VALUES.length;
        setTargetValue(VALUES[nextIndex]);
        setLog(`No one doubted your claim. It is now AI_1's turn to place "${VALUES[nextIndex]}"s.`);
        runAITurn(VALUES[nextIndex]);
      }
    }, 1500);
  };

  const runAITurn = (nextTarget: string) => {
    setTimeout(() => {
      const hand = botHands.AI_1;
      if (hand.length === 0) {
        setLog(`AI_1 is out of cards and has won!`);
        return;
      }
      const matching = hand.filter(c => c.value === nextTarget);
      let discards: Card[] = [];

      if (matching.length > 0 && Math.random() > 0.3) {
        discards = [matching[0]];
      } else {
        discards = [hand[Math.floor(Math.random() * hand.length)]];
      }

      setBots(prev => ({
        ...prev,
        AI_1: prev.AI_1.filter(c => !discards.map(d => d.id).includes(c.id))
      }));
      setPile(prev => [...prev, ...discards]);

      setLog(`AI_1 placed ${discards.length} card(s) claiming they are "${nextTarget}"s.`);
      playTone(440, 'sine', 0.1);
    }, 1200);
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3">
        <span className="text-[12px] font-bold text-pink-400">🃏 Cheat (I Doubt It)</span>
        <button onClick={initGame} className="text-[10px] text-pink-400/80 hover:text-white transition">Reset Deck</button>
      </div>

      <div className="bg-black/30 p-3 rounded-xl min-h-[90px] text-xs leading-relaxed font-mono flex items-center justify-center text-center">
        {log}
      </div>

      <div className="grid grid-cols-3 gap-2 my-4 text-center">
        <div className="bg-[#120a2c]/60 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[9px] uppercase tracking-wider block text-slate-400">Target Card</span>
          <span className="text-xl font-bold text-pink-400 font-mono">{targetValue}</span>
        </div>
        <div className="bg-[#120a2c]/60 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[9px] uppercase tracking-wider block text-slate-400">Pile Size</span>
          <span className="text-xl font-bold text-white font-mono">{pile.length}</span>
        </div>
        <div className="bg-[#120a2c]/60 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[9px] uppercase tracking-wider block text-slate-400">AI Hands</span>
          <span className="text-xs font-mono block text-slate-300 mt-1">AI 1: {botHands.AI_1.length} | AI 2: {botHands.AI_2.length}</span>
        </div>
      </div>

      <div>
        <span className="text-[10px] uppercase font-bold tracking-widest block text-slate-400 mb-2">Your Hand (Tap to select)</span>
        <div className="flex gap-1.5 overflow-x-auto pb-3">
          {playerHand.map((card) => {
            const isSelected = selectedCards.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => handleCardSelect(card.id)}
                className={`w-10 h-14 rounded-lg font-mono text-sm font-bold flex flex-col justify-between p-1.5 border transition-all shrink-0 ${
                  isSelected 
                    ? 'bg-pink-500 text-white border-white -translate-y-1.5 shadow-[0_4px_10px_rgba(236,72,153,0.3)]' 
                    : 'bg-[#1b1236]/80 text-[#faebd7] border-[#44387a]/40'
                }`}
              >
                <span>{card.value}</span>
                <span className="text-right text-[10px]">♠</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2.5 mt-3 select-none">
          <button
            onClick={() => handleDiscard(false)}
            disabled={selectedCards.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase transition disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
          >
            Declare Truthful 🕊️
          </button>
          <button
            onClick={() => handleDiscard(true)}
            disabled={selectedCards.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-[#2e1c3c] border border-pink-500/40 hover:bg-pink-500/20 text-pink-300 text-xs font-bold uppercase transition disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
          >
            Declare Bluff 🤫
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. SOCIAL DEDUCTION GAME (MAFIA / WEREWOLF)
// ==========================================
function MafiaGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [phase, setPhase] = useState<'setup' | 'night' | 'discussion' | 'game_over'>('setup');
  const [role, setRole] = useState<string>('Villager');
  const [log, setLog] = useState<string>('Welcome to Labyrinth Werewolf. Set up your cabin game.');
  const [alibiLog, setAlibiLog] = useState<string>('');
  const [aiStatuses, setAiStatuses] = useState<Record<string, { alive: boolean; role: string }>>({
    'Alchemist Bot': { alive: true, role: 'Werewolf' },
    'Rift Bot': { alive: true, role: 'Villager' },
    'Sage Bot': { alive: true, role: 'Villager' }
  });

  const startGame = () => {
    triggerHaptic(20);
    playTone(587, 'sine', 0.25);
    const roles = ['Werewolf', 'Villager', 'Seer', 'Villager'];
    const shuffled = roles.sort(() => Math.random() - 0.5);
    setRole(shuffled[0] || 'Villager');
    setPhase('night');
    setLog(`Night has fallen. Close your eyes. (Device haptic vibrations will alert roles)`);
    setAlibiLog('');
  };

  const handleNightKill = (target: string) => {
    triggerHaptic([100, 50, 100]);
    playTone(200, 'sawtooth', 0.35);

    setAiStatuses(prev => ({
      ...prev,
      [target]: { ...prev[target], alive: false }
    }));

    setPhase('discussion');
    setLog(`Daybreak. Alibi reports received. Unfortunately, ${target} was found eliminated at the swamp border.`);
    setAlibiLog(`AI conversations logged: 'I saw strange mist near the swamp. Alchemist Bot was acting weird.'`);
  };

  const handleVote = (target: string) => {
    triggerHaptic(15);
    playTone(440, 'triangle', 0.15);

    setAiStatuses(prev => ({
      ...prev,
      [target]: { ...prev[target], alive: false }
    }));

    setPhase('night');
    setLog(`The village council has banished ${target}. Night has fallen once more.`);
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-fuchsia-400">🐺 Werewolf / Mafia deduction</span>
        <span className="text-[9px] font-mono text-fuchsia-400/80">Narrator Mode Active</span>
      </div>

      <div className="bg-black/30 p-3.5 rounded-xl min-h-[90px] text-xs leading-relaxed font-mono text-center flex flex-col justify-center items-center">
        <p className="font-semibold text-white">{log}</p>
        {alibiLog && <p className="text-[10px] text-fuchsia-300/80 mt-1">{alibiLog}</p>}
      </div>

      {phase === 'setup' ? (
        <div className="text-center py-6 select-none">
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">This module automatically serves as the Cabin "Dungeon Master" Narrator so everyone in the car or room can participate together!</p>
          <button
            onClick={startGame}
            className="w-full max-w-xs py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(217,70,239,0.25)] cursor-pointer focus:outline-none"
          >
            Begin Night Phase 🌌
          </button>
        </div>
      ) : (
        <div className="space-y-4 my-3">
          <div className="bg-[#120a2c]/60 px-6 py-4 rounded-xl border border-purple-500/10 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Your Secret Assignment</span>
            <span className="text-xs font-bold text-fuchsia-400 font-mono tracking-widest uppercase">{role}</span>
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Select target character</span>
            {Object.keys(aiStatuses).map((name) => {
              const status = aiStatuses[name];
              if (!status.alive) return null;
              return (
                <div key={name} className="flex justify-between items-center px-4 py-3 rounded-xl bg-[#120a24]/40 border border-[#44387a]/25 hover:border-fuchsia-500/35 transition-all duration-300">
                  <span className="text-xs font-bold">{name}</span>
                  {phase === 'night' && role === 'Werewolf' ? (
                    <button
                      onClick={() => handleNightKill(name)}
                      className="px-3.5 py-1.5 bg-transparent border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all duration-200 cursor-pointer"
                    >
                      Eliminate ⚔️
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVote(name)}
                      className="px-3.5 py-1.5 bg-transparent border border-fuchsia-500/40 text-fuchsia-400 hover:bg-fuchsia-600 hover:text-white rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all duration-200 cursor-pointer"
                    >
                      Banished ⚖️
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. CELEBRITY / FISHBOWL 3-ROUND PARTY GAME
// ==========================================
function CelebrityGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [words, setWords] = useState<string[]>(['Dungeon Master', 'Gollum', 'Baby Yoda', 'Hogwarts', 'Espresso']);
  const [wordInput, setWordInput] = useState<string>('');
  const [activeWord, setActiveWord] = useState<string>('Ready');
  const [gameRound, setGameRound] = useState<number>(1);
  const [teamScore, setTeamScore] = useState<Record<string, number>>({ Team_A: 0, Team_B: 0 });
  const [turn, setTurn] = useState<string>('Team_A');
  const [timer, setTimer] = useState<number>(30);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
        if (timer === 5) {
          triggerHaptic([50, 50]);
          playTone(880, 'triangle', 0.1);
        }
      }, 1000);
    } else if (timer === 0) {
      setIsRunning(false);
      triggerHaptic([100, 100, 200]);
      playTone(220, 'sine', 0.5);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const addWord = () => {
    if (!wordInput.trim()) return;
    triggerHaptic(8);
    setWords([...words, wordInput.trim()]);
    setWordInput('');
  };

  const startTurn = () => {
    triggerHaptic(15);
    setIsRunning(true);
    setTimer(30);
    drawNextWord();
  };

  const drawNextWord = () => {
    if (words.length === 0) {
      return;
    }
    const idx = Math.floor(Math.random() * words.length);
    setActiveWord(words[idx] || 'Empty');
  };

  const handleCorrect = () => {
    triggerHaptic(10);
    playTone(523, 'sine', 0.08);
    setTeamScore(prev => ({
      ...prev,
      [turn]: prev[turn] + 1
    }));
    drawNextWord();
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-amber-400">🎫 Celebrity / Fishbowl Arena</span>
        <span className="text-[9px] font-mono text-amber-400/80">Round {gameRound}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-center select-none font-mono">
        <div className="bg-[#120a2c]/60 p-2 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">Team A Score</span>
          <span className="text-base font-bold text-amber-400">{teamScore.Team_A}</span>
        </div>
        <div className="bg-[#120a2c]/60 p-2 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">Team B Score</span>
          <span className="text-base font-bold text-purple-400">{teamScore.Team_B}</span>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center items-center py-4 bg-black/20 rounded-xl mb-4 text-center">
        {isRunning ? (
          <>
            <span className="text-3xl font-extrabold text-[#faebd7] tracking-wider uppercase mb-1 px-4">{activeWord}</span>
            <span className="text-sm font-mono text-red-400 font-bold mt-2">⏱️ 00:{timer < 10 ? `0${timer}` : timer}</span>
          </>
        ) : (
          <div className="text-center px-4 max-w-sm">
            <span className="text-sm font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">LOBBY PAUSED</span>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">Hand the device to the guesser. Press "Start Turn" to begin the countdown.</p>
            <button
              onClick={startTurn}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
            >
              Start Turn ▶️
            </button>
          </div>
        )}
      </div>

      {isRunning && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleCorrect}
            className="flex-grow py-2.5 bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-wide cursor-pointer"
          >
            ✓ Got It!
          </button>
          <button
            onClick={() => { triggerHaptic(5); drawNextWord(); }}
            className="px-4 py-2.5 bg-black/20 border border-slate-500/30 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wide cursor-pointer"
          >
            Skip
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
          placeholder="Type word to add..."
          className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-slate-600 rounded-xl px-3 py-2 flex-grow text-xs focus:outline-none focus:border-amber-400 font-sans"
        />
        <button
          onClick={addWord}
          className="px-4 bg-[#2e1d16] hover:bg-[#3d271f] text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs uppercase cursor-pointer"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 4. ALCHEMICAL BLACKJACK CARD GAME (21)
// ==========================================
function BlackjackGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [dealerHand, setDealerHand] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'dealer_turn' | 'outcome'>('betting');
  const [log, setLog] = useState<string>('Press deal to challenge the virtual Alchemist bot!');

  const drawCard = () => {
    const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
    return cards[Math.floor(Math.random() * cards.length)] || 10;
  };

  const startGame = () => {
    triggerHaptic(20);
    playTone(587, 'sine', 0.2);
    setPlayerHand([drawCard(), drawCard()]);
    setDealerHand([drawCard(), drawCard()]);
    setGameStatus('playing');
    setLog('Make your choice: Stand or receive another potion card?');
  };

  const handleHit = () => {
    triggerHaptic(10);
    playTone(349, 'triangle', 0.12);
    const newHand = [...playerHand, drawCard()];
    setPlayerHand(newHand);
    
    const score = getScore(newHand);
    if (score > 21) {
      setGameStatus('outcome');
      setLog(`You busted at ${score}! Alchemist Bot wins this challenge.`);
      playTone(220, 'sawtooth', 0.4);
    }
  };

  const handleStand = () => {
    triggerHaptic(15);
    setGameStatus('dealer_turn');
    setLog('Alchemist bot is evaluating... Shuffling deck.');

    setTimeout(() => {
      let currentDealer = [...dealerHand];
      while (getScore(currentDealer) < 17) {
        currentDealer.push(drawCard());
      }
      setDealerHand(currentDealer);
      evaluateWinner(playerHand, currentDealer);
    }, 1200);
  };

  const getScore = (hand: number[]) => {
    let sum = hand.reduce((acc, curr) => acc + curr, 0);
    let aces = hand.filter(c => c === 11).length;
    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces -= 1;
    }
    return sum;
  };

  const evaluateWinner = (pHand: number[], dHand: number[]) => {
    const pScore = getScore(pHand);
    const dScore = getScore(dHand);
    setGameStatus('outcome');

    if (dScore > 21) {
      setLog(`Alchemist bot busted at ${dScore}! You win the round! 🏆`);
      playTone(659, 'sine', 0.35);
    } else if (pScore > dScore) {
      setLog(`Victory! Your hand (${pScore}) beats the Alchemist bot (${dScore})! 🏆`);
      playTone(659, 'sine', 0.35);
    } else if (dScore > pScore) {
      setLog(`Defeat! Alchemist bot (${dScore}) out-flipped your hand (${pScore}).`);
      playTone(220, 'sawtooth', 0.4);
    } else {
      setLog(`A standoff! Both hands tied at ${pScore}. Push.`);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-blue-400">🎩 Alchem-21 (Alchemical Blackjack)</span>
        <span className="text-[9px] font-mono text-blue-400/80">Dealer stands on 17</span>
      </div>

      <div className="bg-black/30 p-3 rounded-xl min-h-[90px] text-xs leading-relaxed font-mono text-center flex items-center justify-center">
        {log}
      </div>

      <div className="grid grid-cols-2 gap-4 my-4 font-mono select-none">
        {/* Dealer Area */}
        <div className="bg-[#120a2c]/60 p-3 rounded-xl border border-purple-500/10 text-center">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400 mb-1.5">Alchemist Bot</span>
          <div className="flex justify-center gap-1">
            {dealerHand.map((c, idx) => (
              <span key={idx} className="px-2 py-3 bg-[#24174d] rounded-lg border border-slate-700/30 text-xs font-bold font-mono">
                {gameStatus === 'playing' && idx === 1 ? '?' : c}
              </span>
            ))}
          </div>
          {gameStatus === 'outcome' && <span className="text-xs font-black block text-blue-400 mt-2">Score: {getScore(dealerHand)}</span>}
        </div>

        {/* Player Area */}
        <div className="bg-[#120a2c]/60 p-3 rounded-xl border border-purple-500/10 text-center">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400 mb-1.5">Your Potion Cards</span>
          <div className="flex justify-center gap-1">
            {playerHand.map((c, idx) => (
              <span key={idx} className="px-2 py-3 bg-blue-500/10 rounded-lg border border-blue-500/30 text-xs font-bold font-mono text-blue-300">
                {c}
              </span>
            ))}
          </div>
          {playerHand.length > 0 && <span className="text-xs font-black block text-blue-400 mt-2">Score: {getScore(playerHand)}</span>}
        </div>
      </div>

      <div className="select-none">
        {gameStatus === 'betting' || gameStatus === 'outcome' ? (
          <button
            onClick={startGame}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition cursor-pointer"
          >
            Deal Potion Hand 🃏
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleHit}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Hit 🧪
            </button>
            <button
              onClick={handleStand}
              className="flex-grow py-3 bg-slate-800 hover:bg-slate-700 text-[#faebd7] text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Stand 🛡️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. COSMIC CATEGORIES (SCATTERGORIES BLITZ)
// ==========================================
function CategoriesGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [activeLetter, setActiveLetter] = useState<string>('R');
  const [timer, setTimer] = useState<number>(45);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<string[]>([]);

  const CATEGORIES = [
    'A mystical creature',
    'A dungeon defense tool',
    'A wizard spell suffix',
    'Cabin trip staple item',
    'A hot beverage flavor'
  ];

  const startRound = () => {
    triggerHaptic(20);
    playTone(523, 'sine', 0.25);
    const letters = 'ABCDEFGHJKLMNOPRSTWY';
    setActiveLetter(letters[Math.floor(Math.random() * letters.length)] || 'R');
    setTimer(45);
    setGameActive(true);
    setInputs({});
    setResults([]);
  };

  useEffect(() => {
    let interval: any = null;
    if (gameActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
        if (timer === 10) {
          triggerHaptic([60, 60]);
          playTone(880, 'triangle', 0.1);
        }
      }, 1000);
    } else if (timer === 0 && gameActive) {
      setGameActive(false);
      triggerHaptic([100, 100, 200]);
      playTone(220, 'sine', 0.5);
      calculateScore();
    }
    return () => clearInterval(interval);
  }, [gameActive, timer]);

  const calculateScore = () => {
    const scoreLog: string[] = [];
    CATEGORIES.forEach(cat => {
      const userVal = inputs[cat] || '';
      if (!userVal.toLowerCase().startsWith(activeLetter.toLowerCase())) {
        scoreLog.push(`❌ "${cat}": Input did not start with '${activeLetter}' (0pts)`);
      } else {
        scoreLog.push(`✓ "${cat}": Correct! (10pts)`);
      }
    });
    setResults(scoreLog);
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-teal-400">✏️ Cosmic Categories (Scattergories)</span>
        <span className="text-[9px] font-mono text-teal-400/80">45s Blitz Challenge</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-center select-none font-mono">
        <div className="bg-[#120a2c]/60 p-2 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">Roll Letter</span>
          <span className="text-xl font-bold text-teal-400">{activeLetter}</span>
        </div>
        <div className="bg-[#120a2c]/60 p-2 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">Timer Count</span>
          <span className="text-xl font-bold text-red-400">{timer}s</span>
        </div>
      </div>

      {!gameActive && results.length === 0 ? (
        <div className="text-center py-6 select-none">
          <p className="text-xs text-slate-400 mb-4">Roll a letter and type words matching each alchemical classification before time runs out!</p>
          <button
            onClick={startRound}
            className="w-full max-w-xs py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition cursor-pointer"
          >
            Roll Active Letter 🎲
          </button>
        </div>
      ) : (
        <div className="space-y-3 flex-grow overflow-y-auto max-h-[220px] pr-1 my-2">
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-black/20 border border-[#44387a]/20">
              <span className="text-[10px] text-slate-400 font-bold block mb-1.5">{cat}</span>
              {gameActive ? (
                <input
                  type="text"
                  placeholder={`Starting with '${activeLetter}'...`}
                  value={inputs[cat] || ''}
                  onChange={(e) => setInputs({ ...inputs, [cat]: e.target.value })}
                  className="w-full bg-black/45 border border-[#44387a]/40 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-teal-400"
                />
              ) : (
                <p className="text-xs font-bold text-[#faebd7] font-mono">{inputs[cat] || <span className="text-slate-600 italic">No Answer</span>}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && !gameActive && (
        <div className="bg-[#120a2c]/80 p-3 rounded-xl border border-teal-500/20 mb-3 space-y-1 font-mono text-[10px]">
          {results.map((res, i) => <p key={i} className="text-left text-slate-300">{res}</p>)}
          <button
            onClick={startRound}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-wider rounded-lg mt-2 cursor-pointer"
          >
            Play Again 🔄
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
// 7. DICE DUEL PUSH YOUR LUCK DICE GAME
// ==========================================
function DiceDuelGame({ playTone, triggerHaptic, joined, currentUser, connectedPlayers, lastAction, sendGameAction }: GameSyncProps) {
  const [bankedScore, setBankedScore] = useState<number>(0);
  const [currentTurnScore, setCurrentTurnScore] = useState<number>(0);
  const [activeDie, setActiveDie] = useState<number>(5);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [log, setLog] = useState<string>('Shake the device or click "Roll Die" to begin!');
  
  const [duelTurn, setDuelTurn] = useState<number>(1);
  const playerList = connectedPlayers ? connectedPlayers.map(p => p.userId).sort() : [];
  const myIndex = playerList.indexOf(currentUser || '');
  const myPlayerNum = myIndex !== -1 ? myIndex + 1 : 1;
  const opponentName = playerList[myPlayerNum === 1 ? 1 : 0] || 'Opponent';

  const handleRoll = () => {
    if (isRolling) return;
    if (joined && duelTurn !== myPlayerNum) {
      if (triggerHaptic) triggerHaptic([50, 50]);
      setLog(`It's not your turn! Wait for ${opponentName}.`);
      return;
    }

    setIsRolling(true);
    if (triggerHaptic) triggerHaptic([30, 40, 30]);
    if (playTone) playTone(260, 'triangle', 0.2);

    let rolls = 0;
    const interval = setInterval(() => {
      setActiveDie(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 8) {
        clearInterval(interval);
        finalizeRoll();
      }
    }, 80);
  };

  const finalizeRoll = () => {
    const finalVal = Math.floor(Math.random() * 6) + 1;
    setActiveDie(finalVal);
    setIsRolling(false);

    let nextTurnScore = currentTurnScore;
    let nextDuelTurn = duelTurn;
    let logMsg = '';

    if (finalVal === 1) {
      if (triggerHaptic) triggerHaptic([150, 80, 150]);
      if (playTone) playTone(180, 'sawtooth', 0.4);
      nextTurnScore = 0;
      logMsg = `Oh no! Rolled a "1" and bust! Turn passes.`;
      nextDuelTurn = joined ? (duelTurn === 1 ? 2 : 1) : 1;
    } else {
      if (triggerHaptic) triggerHaptic(10);
      if (playTone) playTone(523, 'sine', 0.1);
      nextTurnScore = currentTurnScore + finalVal;
      logMsg = `You rolled a ${finalVal}! Bank safety coins or roll again.`;
    }

    setCurrentTurnScore(nextTurnScore);
    setDuelTurn(nextDuelTurn);
    setLog(logMsg);

    if (joined && sendGameAction) {
      sendGameAction({
        type: 'duel_roll_result',
        value: finalVal,
        currentTurnScore: nextTurnScore,
        duelTurn: nextDuelTurn,
        log: logMsg
      });
    }
  };

  const handleBank = () => {
    if (currentTurnScore === 0) return;
    if (joined && duelTurn !== myPlayerNum) return;

    if (triggerHaptic) triggerHaptic(20);
    if (playTone) playTone(659, 'sine', 0.3);
    const nextBanked = bankedScore + currentTurnScore;
    setBankedScore(nextBanked);
    setCurrentTurnScore(0);
    const nextTurn = joined ? (duelTurn === 1 ? 2 : 1) : 1;
    setDuelTurn(nextTurn);
    const logMsg = `Banked ${currentTurnScore} score! Turn passes.`;
    setLog(logMsg);

    if (joined && sendGameAction) {
      sendGameAction({
        type: 'duel_bank_result',
        bankedScore: nextBanked,
        duelTurn: nextTurn,
        log: logMsg
      });
    }
  };

  useEffect(() => {
    if (joined && lastAction && lastAction.senderId !== currentUser) {
      const { type, value, currentTurnScore: incomingTurnScore, duelTurn: incomingTurn, bankedScore: incomingBanked, log: incomingLog } = lastAction.payload;
      if (type === 'duel_roll_result') {
        setActiveDie(value);
        setCurrentTurnScore(incomingTurnScore);
        setDuelTurn(incomingTurn);
        setLog(incomingLog);
      } else if (type === 'duel_bank_result') {
        setBankedScore(incomingBanked);
        setCurrentTurnScore(0);
        setDuelTurn(incomingTurn);
        setLog(incomingLog);
      } else if (type === 'duel_reset') {
        resetScoresLocal();
      }
    }
  }, [lastAction, joined, currentUser]);

  const resetScoresLocal = () => {
    setBankedScore(0);
    setCurrentTurnScore(0);
    setDuelTurn(1);
    setLog('Dice Duel reset. Let the games begin!');
  };

  const triggerReset = () => {
    resetScoresLocal();
    if (joined && sendGameAction) {
      sendGameAction({ type: 'duel_reset' });
    }
  };

  const renderDieDots = (val: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    const dots = dotsMap[val] || [];
    return (
      <div className={`grid grid-cols-3 gap-2.5 p-3 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#fbbf24] via-[#d97706] to-[#fbbf24] border-2 border-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] relative overflow-hidden transition-all duration-300 transform ${isRolling ? 'animate-bounce' : 'hover:scale-105'}`}>
        <div className="absolute inset-0.5 rounded-2xl border border-white/25 pointer-events-none"></div>
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center w-2 h-2">
            {dots.includes(i) && (
              <span className="w-2 h-2 rounded-full bg-slate-950 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.6)]"></span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-yellow-400">🎲 Dice Duel (Push Your Luck)</span>
        <button onClick={triggerReset} className="text-[10px] text-yellow-400/80 hover:text-white transition cursor-pointer">Reset Scores</button>
      </div>

      <div className="bg-black/30 p-2.5 rounded-xl min-h-[40px] text-[11px] leading-relaxed font-mono text-center">
        {log}
      </div>

      <div className="my-4 flex flex-col items-center justify-center py-4 select-none">
        {renderDieDots(activeDie)}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-center select-none font-mono">
        <div className="bg-[#120a2c]/60 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">Potion Hand</span>
          <span className="text-xl font-bold text-red-400">{currentTurnScore}</span>
        </div>
        <div className="bg-[#120a2c]/60 p-2.5 rounded-xl border border-purple-500/10">
          <span className="text-[8px] uppercase tracking-wider block text-slate-400">Banked Score</span>
          <span className="text-xl font-bold text-yellow-400">{bankedScore}</span>
        </div>
      </div>

      <div className="flex gap-2 select-none">
        <button
          onClick={handleRoll}
          disabled={isRolling || (joined && duelTurn !== myPlayerNum)}
          className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-45"
        >
          {joined && duelTurn !== myPlayerNum ? 'Waiting for opponent...' : 'Roll Potion Die 🎲'}
        </button>
        <button
          onClick={handleBank}
          disabled={currentTurnScore === 0 || (joined && duelTurn !== myPlayerNum)}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-500/25 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-45"
        >
          Bank 🕊️
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 8. LABYRINTH LIGHT FOG FANTASY ESCAPE
// ==========================================
function LabyrinthGame({ playTone, triggerHaptic, joined, currentUser, lastAction, sendGameAction }: GameSyncProps) {
  const [gridSize] = useState<number>(6);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [exitPos] = useState({ x: 5, y: 5 });
  const [battery, setBattery] = useState<number>(100);
  const [won, setWon] = useState<boolean>(false);

  const handleMove = (dx: number, dy: number) => {
    if (won || battery <= 0) return;
    const nextX = Math.min(Math.max(0, playerPos.x + dx), gridSize - 1);
    const nextY = Math.min(Math.max(0, playerPos.y + dy), gridSize - 1);
    
    if (nextX === playerPos.x && nextY === playerPos.y) return;

    triggerHaptic(8);
    playTone(400, 'triangle', 0.08);

    setPlayerPos({ x: nextX, y: nextY });
    setBattery(b => Math.max(0, b - 4));

    if (nextX === exitPos.x && nextY === exitPos.y) {
      setWon(true);
      triggerHaptic([50, 100, 150]);
      playTone(659, 'sine', 0.4);
    }
  };

  const handleReset = () => {
    triggerHaptic(20);
    setPlayerPos({ x: 0, y: 0 });
    setBattery(100);
    setWon(false);
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-cyan-400">🔦 Fog Escape Labyrinth</span>
        <button onClick={handleReset} className="text-[10px] text-cyan-400/80 hover:text-white transition">Reset Maze</button>
      </div>

      <div className="bg-black/30 p-2.5 rounded-xl min-h-[40px] text-[11px] leading-relaxed font-mono text-center mb-3">
        {won ? (
          <span className="text-emerald-400 font-bold">🎉 Success! You escaped the dark fog!</span>
        ) : battery <= 0 ? (
          <span className="text-red-400 font-bold">💀 Flashlight Battery Dead! You got lost in the fog.</span>
        ) : (
          <span>Reach the exit (🏁) at bottom-right. Every move drains your flashlight!</span>
        )}
      </div>

      <div className="flex justify-center my-2 select-none">
        <div className="grid grid-cols-6 gap-1 p-2 bg-[#120a24]/80 rounded-2xl border border-cyan-500/25">
          {Array.from({ length: gridSize }).map((_, y) => (
            Array.from({ length: gridSize }).map((_, x) => {
              const isPlayer = playerPos.x === x && playerPos.y === y;
              const isExit = exitPos.x === x && exitPos.y === y;
              const distance = Math.abs(playerPos.x - x) + Math.abs(playerPos.y - y);
              const isVisible = distance <= 1.5;

              return (
                <div
                  key={`${y}-${x}`}
                  className={`w-10 h-10 rounded-lg border transition-all duration-300 flex items-center justify-center text-xs font-bold ${
                    isPlayer
                      ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                      : isExit && isVisible
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : isVisible
                          ? 'bg-[#1b1236]/80 border-[#44387a]/40 text-[#b4aae2]'
                          : 'bg-black/90 border-transparent text-slate-800'
                  }`}
                >
                  {isPlayer ? '👤' : isExit && isVisible ? '🏁' : isVisible ? '' : '🌫️'}
                </div>
              );
            })
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 mt-2">
        <div className="flex justify-between items-center w-full max-w-[260px] text-[10px] font-mono">
          <span>Battery: <span className={battery > 20 ? 'text-cyan-400' : 'text-red-500 animate-pulse'}>{battery}%</span></span>
        </div>

        <div className="grid grid-cols-3 gap-1 w-32 select-none">
          <div />
          <button onClick={() => handleMove(0, -1)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer">▲</button>
          <div />
          <button onClick={() => handleMove(-1, 0)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer">◀</button>
          <button onClick={handleReset} className="py-2 bg-cyan-700/30 text-cyan-300 rounded-lg text-[9px] font-extrabold cursor-pointer">RST</button>
          <button onClick={() => handleMove(1, 0)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer">▶</button>
          <div />
          <button onClick={() => handleMove(0, 1)} className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer">▼</button>
          <div />
        </div>
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
  const [currentNum, setCurrentNum] = useState<number>(() => Math.floor(Math.random() * 20) + 1);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(() => Number(localStorage.getItem('game_best') || '0'));
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [log, setLog] = useState<string>('Guess if the next roll will be higher or lower than the current D20!');

  const handleGuess = (direction: 'higher' | 'lower') => {
    if (isRolling) return;
    setIsRolling(true);
    if (triggerHaptic) triggerHaptic([30, 30]);
    if (playTone) playTone(320, 'triangle', 0.15);

    let rolls = 0;
    const interval = setInterval(() => {
      setCurrentNum(Math.floor(Math.random() * 20) + 1);
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        const finalNum = Math.floor(Math.random() * 20) + 1;
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
        <span className="text-[12px] font-bold text-amber-400">🎲 Hi-Lo D20 Guessing</span>
        <button onClick={triggerReset} className="text-[10px] text-amber-400/80 hover:text-white transition cursor-pointer">Reset Streak</button>
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
              <button onClick={() => adjScore(idx, -1)} className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-500/20 hover:bg-red-500/25 text-red-400 font-bold text-xs cursor-pointer focus:outline-none transition">-1</button>
              <button onClick={() => adjScore(idx, 1)} className="w-7 h-7 rounded-lg bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs cursor-pointer focus:outline-none transition">+1</button>
              <button onClick={() => adjScore(idx, 5)} className="w-9 h-7 rounded-lg bg-[#44387a]/20 border border-[#44387a]/40 hover:bg-[#44387a]/35 text-purple-300 font-bold text-[10px] cursor-pointer focus:outline-none transition">+5</button>
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
