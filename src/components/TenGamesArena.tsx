import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Shield, User, Award, Play, RotateCw, Trash2, 
  HelpCircle, Eye, EyeOff, Check, X, ArrowRight, Hourglass, 
  Dice5, Search, Zap, Volume2, VolumeX, Swords, Users, Crown 
} from 'lucide-react';

// Game Types
type GameID = 
  | 'cheat' | 'mafia' | 'celebrity' | 'blackjack' 
  | 'categories' | 'grid_domain' | 'dice_duel' 
  | 'labyrinth' | 'chain_reaction' | 'blink';

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  score: number;
}

export default function TenGamesArena() {
  const [activeGame, setActiveGame] = useState<GameID>('cheat');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Traveler (You)', isAI: false, score: 0 },
    { id: '2', name: 'Alchemist AI', isAI: true, score: 0 },
    { id: '3', name: 'Rift Bot', isAI: true, score: 0 }
  ]);

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
    <div className="w-full max-w-5xl mx-auto p-4 bg-[#0d081e]/90 text-[#faebd7] rounded-3xl border border-[#44387a]/40 shadow-2xl relative overflow-hidden backdrop-blur-md">
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

      {/* Game Selector Menu Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6 select-none font-mono text-[10px] font-bold">
        {[
          { id: 'cheat', label: '🃏 Cheat / Doubt', color: 'border-pink-500/30' },
          { id: 'mafia', label: '🐺 Werewolf', color: 'border-fuchsia-500/30' },
          { id: 'celebrity', label: '🎫 Fishbowl', color: 'border-amber-500/30' },
          { id: 'blackjack', label: '🎩 Alchem-21', color: 'border-blue-500/30' },
          { id: 'categories', label: '✏️ Categories', color: 'border-teal-500/30' },
          { id: 'grid_domain', label: '🟩 Grid Domain', color: 'border-emerald-500/30' },
          { id: 'dice_duel', label: '🎲 Dice Duel', color: 'border-yellow-500/30' },
          { id: 'labyrinth', label: '🔦 Fog Escape', color: 'border-cyan-500/30' },
          { id: 'chain_reaction', label: '💥 Chain Burst', color: 'border-indigo-500/30' },
          { id: 'blink', label: '⚡ Blink Tap', color: 'border-rose-500/30' }
        ].map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setActiveGame(g.id as GameID);
              triggerHaptic(10);
              playTone(300 + (Math.random() * 200), 'sine', 0.08);
            }}
            className={`py-2 px-1.5 border rounded-xl transition-all duration-300 ${
              activeGame === g.id 
                ? 'bg-gradient-to-tr from-[#1b1035] to-[#0c051a] border-[#cf4fe6] shadow-[0_0_12px_rgba(207,79,230,0.3)] text-white scale-[1.02]' 
                : `${g.color} bg-black/20 text-[#b4aae2]/70 hover:text-white hover:border-[#cf4fe6]/45`
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* ACTIVE GAME CANVAS / RENDER AREA */}
      <div className="min-h-[420px] bg-[#120826]/40 rounded-2xl border border-[#44387a]/25 p-5 flex flex-col justify-between">
        
        {/* GAME 1: CHEAT (I DOUBT IT) */}
        {activeGame === 'cheat' && <CheatGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 2: MAFIA / WEREWOLF */}
        {activeGame === 'mafia' && <MafiaGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 3: CELEBRITY / FISHBOWL */}
        {activeGame === 'celebrity' && <CelebrityGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 4: ALCHEMICAL BLACKJACK */}
        {activeGame === 'blackjack' && <BlackjackGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 5: COSMIC CATEGORIES */}
        {activeGame === 'categories' && <CategoriesGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 6: GRID DOMAIN */}
        {activeGame === 'grid_domain' && <GridDomainGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 7: DICE DUEL */}
        {activeGame === 'dice_duel' && <DiceDuelGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 8: LABYRINTH LIGHT */}
        {activeGame === 'labyrinth' && <LabyrinthGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 9: CHAIN REACTION */}
        {activeGame === 'chain_reaction' && <ChainReactionGame playTone={playTone} triggerHaptic={triggerHaptic} />}

        {/* GAME 10: BLINK REFLEX TAP */}
        {activeGame === 'blink' && <BlinkGame playTone={playTone} triggerHaptic={triggerHaptic} />}

      </div>
    </div>
  );
}

// ==========================================
// 1. CHEAT / I DOUBT IT DECEPTION CARD GAME
// ==========================================
function CheatGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
  const [deck, setDeck] = useState<string[]>([]);
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [botHands, setBots] = useState<Record<string, string[]>>({ AI_1: [], AI_2: [] });
  const [pile, setPile] = useState<string[]>([]);
  const [targetValue, setTargetValue] = useState<string>('A');
  const [log, setLog] = useState<string>('The round has started! Discard cards matching the target value.');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const initGame = () => {
    const freshDeck: string[] = [];
    VALUES.forEach(val => {
      freshDeck.push(val, val, val, val);
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

  const handleCardSelect = (card: string) => {
    triggerHaptic(6);
    setSelectedCards(prev => 
      prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
    );
  };

  const handleDiscard = (bluff: boolean) => {
    if (selectedCards.length === 0) return;
    triggerHaptic(15);
    playTone(349, 'sine', 0.15);

    const actualDiscards = [...selectedCards];
    setPlayerHand(prev => prev.filter(c => !actualDiscards.includes(c)));
    setPile(prev => [...prev, ...actualDiscards]);
    setSelectedCards([]);

    const claimsLie = actualDiscards.some(c => c !== targetValue);
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
      const matching = hand.filter(c => c === nextTarget);
      let discards: string[] = [];

      if (matching.length > 0 && Math.random() > 0.3) {
        discards = [matching[0]];
      } else {
        discards = [hand[Math.floor(Math.random() * hand.length)]];
      }

      setBots(prev => ({
        ...prev,
        AI_1: prev.AI_1.filter(c => !discards.includes(c))
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
          {playerHand.map((card, idx) => {
            const isSelected = selectedCards.includes(card);
            return (
              <button
                key={idx}
                onClick={() => handleCardSelect(card)}
                className={`w-10 h-14 rounded-lg font-mono text-sm font-bold flex flex-col justify-between p-1.5 border transition-all shrink-0 ${
                  isSelected 
                    ? 'bg-pink-500 text-white border-white -translate-y-1.5 shadow-[0_4px_10px_rgba(236,72,153,0.3)]' 
                    : 'bg-[#1b1236]/80 text-[#faebd7] border-[#44387a]/40'
                }`}
              >
                <span>{card}</span>
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
function MafiaGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
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
          <div className="bg-[#120a2c]/60 p-3 rounded-xl border border-purple-500/10 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Your Secret Assignment</span>
            <span className="text-xs font-bold text-fuchsia-400 font-mono tracking-widest uppercase">{role}</span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Select target character</span>
            {Object.keys(aiStatuses).map((name) => {
              const status = aiStatuses[name];
              if (!status.alive) return null;
              return (
                <div key={name} className="flex justify-between items-center p-2 rounded-xl bg-[#120a24]/40 border border-[#44387a]/25 hover:border-fuchsia-500/35 transition">
                  <span className="text-xs font-bold">{name}</span>
                  {phase === 'night' && role === 'Werewolf' ? (
                    <button
                      onClick={() => handleNightKill(name)}
                      className="px-3 py-1 bg-red-600/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                    >
                      Eliminate ⚔️
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVote(name)}
                      className="px-3 py-1 bg-fuchsia-600/20 hover:bg-fuchsia-500 text-fuchsia-300 hover:text-white border border-fuchsia-500/30 rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer"
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
function CelebrityGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
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
function BlackjackGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
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
function CategoriesGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
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
function GridDomainGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
  const [grid, setGrid] = useState<number[]>([]);
  const [turn, setTurn] = useState<number>(1);
  const [log, setLog] = useState<string>('Click adjacent grid areas to lock in your domain.');

  const size = 5;

  const resetBoard = () => {
    triggerHaptic(20);
    playTone(440, 'triangle', 0.2);
    setGrid(Array(size * size).fill(0));
    setTurn(1);
    setLog('Blue Player 1, claim your initial corner tile!');
  };

  useEffect(() => {
    resetBoard();
  }, []);

  const handleTileClick = (idx: number) => {
    if (grid[idx] !== 0) return;
    triggerHaptic(10);
    playTone(turn === 1 ? 523 : 349, 'sine', 0.12);

    const nextGrid = [...grid];
    nextGrid[idx] = turn;
    setGrid(nextGrid);

    const nextTurn = turn === 1 ? 2 : 1;
    setTurn(nextTurn);
    setLog(`${nextTurn === 1 ? 'Blue Player 1' : 'Red Alchemist'} select your territory grid.`);

    if (nextTurn === 2) {
      setTimeout(() => {
        const emptyIndices = nextGrid.map((val, i) => val === 0 ? i : -1).filter(v => v !== -1);
        if (emptyIndices.length > 0) {
          const aiChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)] as number;
          nextGrid[aiChoice] = 2;
          setGrid(nextGrid);
          setTurn(1);
          setLog('Blue Player 1, click your next domain node!');
          triggerHaptic(12);
          playTone(349, 'sine', 0.12);
        }
      }, 1000);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-emerald-400">🟩 Grid Domain (Territory Capture)</span>
        <button onClick={resetBoard} className="text-[10px] text-emerald-400/80 hover:text-white transition">Clear Board</button>
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
          <span>Player 1 (Blue)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-red-600 rounded-full border border-red-400"></span>
          <span>Alchemist (Red)</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. DICE DUEL PUSH YOUR LUCK DICE GAME
// ==========================================
function DiceDuelGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
  const [bankedScore, setBankedScore] = useState<number>(0);
  const [currentTurnScore, setCurrentTurnScore] = useState<number>(0);
  const [activeDie, setActiveDie] = useState<number>(5);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [log, setLog] = useState<string>('Shake the device or click "Roll Die" to begin!');

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    triggerHaptic([30, 40, 30]);
    playTone(260, 'triangle', 0.2);

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

    if (finalVal === 1) {
      triggerHaptic([150, 80, 150]);
      playTone(180, 'sawtooth', 0.4);
      setCurrentTurnScore(0);
      setLog('Oh no! You rolled a "1" and bust! Your turn score is wiped out.');
    } else {
      triggerHaptic(10);
      playTone(523, 'sine', 0.1);
      setCurrentTurnScore(prev => prev + finalVal);
      setLog(`You rolled a ${finalVal}! Add to your turn potion score or "Bank Potion" safety coins.`);
    }
  };

  const handleBank = () => {
    if (currentTurnScore === 0) return;
    triggerHaptic(20);
    playTone(659, 'sine', 0.3);
    setBankedScore(prev => prev + currentTurnScore);
    setCurrentTurnScore(0);
    setLog(`Successfully banked ${currentTurnScore} score into safety coins! Challenge continues.`);
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-yellow-400">🎲 Dice Duel (Push Your Luck)</span>
        <button onClick={() => { setBankedScore(0); setCurrentTurnScore(0); }} className="text-[10px] text-yellow-400/80 hover:text-white transition">Reset Scores</button>
      </div>

      <div className="bg-black/30 p-2.5 rounded-xl min-h-[40px] text-[11px] leading-relaxed font-mono text-center">
        {log}
      </div>

      <div className="my-4 flex flex-col items-center justify-center py-4 select-none">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2e1d16] to-[#0e071c] border-2 border-yellow-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.22)] ${isRolling ? 'animate-bounce' : ''}`}>
          <span className="text-3xl font-bold font-mono text-yellow-300">{activeDie}</span>
        </div>
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
          disabled={isRolling}
          className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-45"
        >
          Roll Potion Die 🎲
        </button>
        <button
          onClick={handleBank}
          disabled={currentTurnScore === 0}
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
function LabyrinthGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
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
function ChainReactionGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
  const [board, setBoard] = useState<Array<{ count: number; owner: number }>>(
    Array(25).fill(null).map(() => ({ count: 0, owner: 0 }))
  );
  const [turn, setTurn] = useState<number>(1);
  const [log, setLog] = useState<string>('Tap cells to place your orbs. Overload a cell to trigger a Chain Burst!');
  const [isExploding, setIsExploding] = useState<boolean>(false);

  const size = 5;

  const resetBoard = () => {
    triggerHaptic(20);
    playTone(523, 'sine', 0.15);
    setBoard(Array(25).fill(null).map(() => ({ count: 0, owner: 0 })));
    setTurn(1);
    setLog('Blue Player 1, start the reaction by placing your first orb!');
  };

  const getNeighbors = (idx: number) => {
    const r = Math.floor(idx / size);
    const c = idx % size;
    const neighbors = [];
    if (r > 0) neighbors.push(idx - size);
    if (r < size - 1) neighbors.push(idx + size);
    if (c > 0) neighbors.push(idx - 1);
    if (c < size - 1) neighbors.push(idx + 1);
    return neighbors;
  };

  const getCriticalMass = (idx: number) => {
    const r = Math.floor(idx / size);
    const c = idx % size;
    let limit = 4;
    if ((r === 0 || r === size - 1) && (c === 0 || c === size - 1)) {
      limit = 2;
    } else if (r === 0 || r === size - 1 || c === 0 || c === size - 1) {
      limit = 3;
    }
    return limit;
  };

  const handleTileClick = async (idx: number) => {
    if (isExploding) return;
    const cell = board[idx];
    if (cell.owner !== 0 && cell.owner !== turn) {
      return;
    }

    triggerHaptic(10);
    playTone(turn === 1 ? 523 : 349, 'triangle', 0.1);

    setIsExploding(true);
    let nextBoard = board.map((c, i) => i === idx ? { count: c.count + 1, owner: turn } : { ...c });
    setBoard(nextBoard);

    nextBoard = await runCascade(nextBoard, turn);
    setBoard(nextBoard);
    setIsExploding(false);

    const p1Count = nextBoard.filter(c => c.owner === 1).length;
    const p2Count = nextBoard.filter(c => c.owner === 2).length;
    const totalPlaced = nextBoard.reduce((acc, c) => acc + c.count, 0);

    if (totalPlaced > 2) {
      if (p1Count === 0) {
        setLog('Red Alchemist wins the chain burst duel! 🏆');
        playTone(349, 'sawtooth', 0.4);
        return;
      } else if (p2Count === 0) {
        setLog('Blue Player 1 wins the chain burst duel! 🏆');
        playTone(523, 'sine', 0.4);
        return;
      }
    }

    const nextTurn = turn === 1 ? 2 : 1;
    setTurn(nextTurn);
    setLog(`${nextTurn === 1 ? 'Blue Player 1' : 'Red Alchemist'}'s turn to place.`);

    if (nextTurn === 2) {
      setTimeout(async () => {
        const eligible = nextBoard.map((c, i) => (c.owner === 0 || c.owner === 2) ? i : -1).filter(v => v !== -1);
        if (eligible.length > 0) {
          const aiChoice = eligible[Math.floor(Math.random() * eligible.length)];
          triggerHaptic(10);
          playTone(349, 'triangle', 0.1);
          let aiBoard = nextBoard.map((c, i) => i === aiChoice ? { count: c.count + 1, owner: 2 } : { ...c });
          setBoard(aiBoard);
          aiBoard = await runCascade(aiBoard, 2);
          setBoard(aiBoard);
          setTurn(1);
          setLog('Blue Player 1, place your next orb!');
        }
      }, 1200);
    }
  };

  const runCascade = async (currBoard: Array<{ count: number; owner: number }>, activePlayer: number) => {
    let boardState = currBoard.map(c => ({ ...c }));
    let unstable = true;
    let iterations = 0;

    while (unstable && iterations < 15) {
      unstable = false;
      const unstableIndices = [];
      for (let i = 0; i < boardState.length; i++) {
        if (boardState[i].count >= getCriticalMass(i)) {
          unstableIndices.push(i);
        }
      }

      if (unstableIndices.length > 0) {
        unstable = true;
        iterations++;
        triggerHaptic(15);
        playTone(300 + iterations * 50, 'sawtooth', 0.08);

        unstableIndices.forEach(idx => {
          const neighbors = getNeighbors(idx);
          const limit = getCriticalMass(idx);
          boardState[idx].count -= limit;
          if (boardState[idx].count === 0) {
            boardState[idx].owner = 0;
          }

          neighbors.forEach(nIdx => {
            boardState[nIdx].count += 1;
            boardState[nIdx].owner = activePlayer;
          });
        });

        setBoard([...boardState]);
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }
    return boardState;
  };

  return (
    <div className="flex-grow flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[#44387a]/20 mb-3 select-none">
        <span className="text-[12px] font-bold text-indigo-400">💥 Chain Burst Duel</span>
        <button onClick={resetBoard} className="text-[10px] text-indigo-400/80 hover:text-white transition">Reset</button>
      </div>

      <div className="bg-black/30 p-2.5 rounded-xl min-h-[40px] text-[11px] leading-relaxed font-mono text-center mb-3">
        {log}
      </div>

      <div className="flex justify-center my-2 select-none">
        <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#120a24]/80 rounded-2xl border border-indigo-500/25">
          {board.map((cell, idx) => {
            const limit = getCriticalMass(idx);
            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                className={`w-12 h-12 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center cursor-pointer focus:outline-none ${
                  cell.owner === 1
                    ? 'bg-blue-600 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                    : cell.owner === 2
                      ? 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : 'bg-[#1b1236]/80 border-[#44387a]/40 hover:border-[#cf4fe6]/50'
                }`}
              >
                {cell.count > 0 && (
                  <span className="text-white text-xs font-black animate-pulse">
                    {Array(cell.count).fill('●').join('')}
                  </span>
                )}
                <span className="text-[7px] opacity-40 mt-0.5">{limit}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. BLINK REFLEX TAP GAME
// ==========================================
function BlinkGame({ playTone, triggerHaptic }: { playTone: any, triggerHaptic: any }) {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'blinked' | 'result'>('idle');
  const [log, setLog] = useState<string>('Test your reflex time. Click start, wait for green, and TAP!');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('blink_highscore') || '999');
  });
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const startReflexTest = () => {
    triggerHaptic(15);
    playTone(523, 'sine', 0.1);
    setGameState('waiting');
    setLog('Focus... wait for it...');
    setReactionTime(null);

    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setGameState('blinked');
      setLog('TAP NOW! ⚡');
      startTimeRef.current = performance.now();
      triggerHaptic([80, 80]);
      playTone(880, 'sine', 0.15);
    }, delay);
  };

  const handleTap = () => {
    if (gameState === 'waiting') {
      clearTimeout(timerRef.current);
      setGameState('idle');
      triggerHaptic([150, 100]);
      playTone(220, 'sawtooth', 0.4);
      setLog('TOO EARLY! Wait for the screen to blink green.');
    } else if (gameState === 'blinked') {
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTimeRef.current);
      setReactionTime(elapsed);
      setGameState('result');
      triggerHaptic(25);
      playTone(659, 'sine', 0.2);

      if (elapsed < highScore) {
        setHighScore(elapsed);
        localStorage.setItem('blink_highscore', elapsed.toString());
        setLog(`New personal record! ${elapsed} ms! ⚡🏆`);
      } else {
        setLog(`Your reflex response time: ${elapsed} ms.`);
      }
    }
  };

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
