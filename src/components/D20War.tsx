import React, { useState, useEffect, useRef } from 'react';
import { Sword, Users, Wifi, RefreshCw, Trophy, Coins, Dice5, Volume2 } from 'lucide-react';

interface PlayerState {
  userId: string;
  roll: number | null;
}

interface ActiveRoom {
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  playersList: string[];
}

interface D20WarProps {
  currentUser: string | null;
}

export default function D20War({ currentUser }: D20WarProps) {
  // Mode selection: 'war' | 'coin'
  const [gameMode, setGameMode] = useState<'war' | 'coin'>('war');

  // War State
  const [roomCode, setRoomCode] = useState(() => {
    return localStorage.getItem('war_room_code') || 'rift-chamber';
  });
  const [maxPlayersChoice, setMaxPlayersChoice] = useState<number>(4);
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [maxPlayersInRoom, setMaxPlayersInRoom] = useState<number>(4);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [rollingValue, setRollingValue] = useState(20);
  const socketRef = useRef<WebSocket | null>(null);

  // Active rooms from server
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Heads or Tails State
  const [coinSide, setCoinSide] = useState<'heads' | 'tails' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<'Heads' | 'Tails' | null>(null);
  const [coinStats, setCoinStats] = useState({ heads: 0, tails: 0, total: 0 });

  // Sound triggering helper
  const triggerAudioTone = (freq: number, durationMs: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
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

  // Fetch rooms every 4 seconds when not in a room
  useEffect(() => {
    if (!joined) {
      fetchActiveRooms();
      const interval = setInterval(fetchActiveRooms, 4000);
      return () => clearInterval(interval);
    }
  }, [joined]);

  // Connect to the WebSocket room
  const connectToBattle = (customRoom?: string, customMaxPlayers?: number) => {
    if (!currentUser) {
      setErrorMessage("⚠️ Please login or enscribe a rune on the home screen first!");
      toast("⚠️ Please login first!", "error");
      return;
    }

    const targetRoom = customRoom || roomCode.trim();
    if (!targetRoom) {
      setErrorMessage("⚠️ Please enter a room code!");
      return;
    }

    setErrorMessage('');
    setStatus('connecting');
    localStorage.setItem('war_room_code', targetRoom);

    // Disconnect old socket if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-war`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('connected');
      // Join room with max players choice
      socket.send(JSON.stringify({
        type: 'join',
        roomCode: targetRoom,
        userId: currentUser,
        maxPlayers: customMaxPlayers || maxPlayersChoice
      }));
      setJoined(true);
      toast(`⚔️ Connected to Battle Room: ${targetRoom}`, 'success');
      haptic([15, 30]);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_sync') {
          setPlayers(data.players);
          if (data.maxPlayers) {
            setMaxPlayersInRoom(data.maxPlayers);
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
      setErrorMessage('⚠️ Socket connection error. Try again.');
    };
  };

  const leaveBattle = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    setJoined(false);
    setPlayers([]);
    setStatus('disconnected');
    toast('🏳️ Left Battle Chamber', 'warn');
    haptic(10);
    fetchActiveRooms();
  };

  // Roll D20 for War
  const performRoll = () => {
    if (!socketRef.current || status !== 'connected') return;

    setIsRolling(true);
    haptic([10, 10, 10, 10]);
    triggerAudioTone(600, 150);

    let rollInterval: any;
    let duration = 0;
    
    rollInterval = setInterval(() => {
      setRollingValue(Math.floor(Math.random() * 20) + 1);
      duration += 60;
      if (duration >= 900) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 20) + 1;
        setRollingValue(finalValue);
        setIsRolling(false);
        
        socketRef.current?.send(JSON.stringify({
          type: 'roll',
          value: finalValue
        }));
        
        haptic([40, 60]);
        toast(`🎲 You rolled a D20: ${finalValue}!`, 'info');
      }
    }, 60);
  };

  // Reset rolls for another round
  const resetBattle = () => {
    if (socketRef.current && status === 'connected') {
      socketRef.current.send(JSON.stringify({ type: 'reset' }));
      haptic(15);
      toast('🔄 Next Clash prepared! Roll whenever ready.', 'info');
    }
  };

  // Flip Coin
  const flipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    haptic([10, 15, 10, 15]);
    triggerAudioTone(880, 100);

    let count = 0;
    const interval = setInterval(() => {
      setCoinSide(Math.random() > 0.5 ? 'heads' : 'tails');
      count++;
      if (count > 12) {
        clearInterval(interval);
        const finalSide = Math.random() > 0.5 ? 'heads' : 'tails';
        setCoinSide(finalSide);
        setFlipResult(finalSide === 'heads' ? 'Heads' : 'Tails');
        setIsFlipping(false);
        setCoinStats(prev => {
          const next = {
            heads: prev.heads + (finalSide === 'heads' ? 1 : 0),
            tails: prev.tails + (finalSide === 'tails' ? 1 : 0),
            total: prev.total + 1
          };
          return next;
        });
        haptic([50, 70]);
        toast(`🪙 Coin landed on: ${finalSide.toUpperCase()}!`, 'success');
      }
    }, 70);
  };

  // Automatically disconnect socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Compute 4-player game outcomes
  // Every active player in room must have a non-null roll
  const allRolled = players.length >= 2 && players.every(p => p.roll !== null);
  
  let winText = '';
  let winGlow = '';
  if (allRolled) {
    const highestRoll = Math.max(...players.map(p => p.roll || 0));
    const winners = players.filter(p => p.roll === highestRoll);
    
    if (winners.length === 1) {
      const isMeWinner = winners[0].userId === currentUser?.toLowerCase();
      if (isMeWinner) {
        winText = `🏆 VICTORY! You won with a majestic roll of ${highestRoll}! ✨`;
        winGlow = 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-950/20';
      } else {
        winText = `💀 DEFEAT! Player "${winners[0].userId.toUpperCase()}" won with ${highestRoll}!`;
        winGlow = 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)] bg-rose-950/20';
      }
    } else {
      // Tie
      const winnerNames = winners.map(w => w.userId.toUpperCase()).join(' & ');
      winText = `⚡ CLASH! A tie between ${winnerNames} with ${highestRoll}!`;
      winGlow = 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-950/20';
    }
  }

  return (
    <section className="card border border-[#cf4fe6]/25 bg-gradient-to-b from-[#140a24]/90 to-[#0e061c]/90 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-fade-in select-none">
      
      {/* Mini Segmented Control for Sub Modes */}
      <div className="flex gap-2.5 mb-4 border-b border-[#cf4fe6]/15 pb-3">
        <button
          onClick={() => { setGameMode('war'); haptic(10); }}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${gameMode === 'war' ? 'bg-[#cf4fe6]/20 text-white border border-[#cf4fe6]/45' : 'text-[#b4aae2]/50 hover:text-[#b4aae2] border border-transparent'}`}
        >
          <Sword className="w-3.5 h-3.5" /> ⚔️ MULTIPLAYER WAR (D20)
        </button>
        <button
          onClick={() => { setGameMode('coin'); haptic(10); }}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${gameMode === 'coin' ? 'bg-[#3fd9c7]/20 text-white border border-[#3fd9c7]/45' : 'text-[#b4aae2]/50 hover:text-[#b4aae2] border border-transparent'}`}
        >
          <Coins className="w-3.5 h-3.5" /> 🪙 HEADS OR TAILS
        </button>
      </div>

      {gameMode === 'coin' ? (
        <div className="space-y-4 text-center animate-fade-in">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#3fd9c7] mb-1">🪙 High-Fantasy Coin Flip</p>
            <span className="text-[9px] text-[#b4aae2]/50 font-mono tracking-wider">TEST YOUR FATE AGAINST THE COSMIC COIN</span>
          </div>

          {/* Interactive Golden Coin */}
          <div className="flex justify-center py-6">
            <button
              onClick={flipCoin}
              disabled={isFlipping}
              className={`w-28 h-28 rounded-full bg-gradient-to-tr from-[#ffd700] to-[#b38f1d] border-4 border-[#ffd700]/40 flex items-center justify-center shadow-[0_0_25px_rgba(255,215,0,0.3)] transition-transform duration-100 transform active:scale-95 ${isFlipping ? 'animate-spin' : ''}`}
              style={{ perspective: '1000px' }}
            >
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#faebd7]/50 flex flex-col items-center justify-center text-[#faebd7] font-bold">
                {coinSide === 'heads' ? (
                  <>
                    <span className="text-3xl">👑</span>
                    <span className="text-[9px] uppercase tracking-wider mt-1 font-mono">HEADS</span>
                  </>
                ) : coinSide === 'tails' ? (
                  <>
                    <span className="text-3xl">🔮</span>
                    <span className="text-[9px] uppercase tracking-wider mt-1 font-mono">TAILS</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl animate-bounce">🪙</span>
                    <span className="text-[8px] uppercase tracking-widest mt-1 font-mono">TAP TO FLIP</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Result Splash */}
          {flipResult && (
            <div className="p-3 bg-[#1c1136]/60 border border-[#3fd9c7]/20 rounded-xl max-w-xs mx-auto animate-fade-in">
              <span className="text-xs font-bold text-[#3fd9c7] block">RESULT: {flipResult.toUpperCase()}</span>
              <span className="text-[9px] text-[#b4aae2]/60 block mt-1">The cosmic ley-lines have spoken.</span>
            </div>
          )}

          {/* Statistics tracker */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#120826]/60 border border-[#cf4fe6]/10 text-xs text-[#b4aae2] max-w-sm mx-auto">
            <div className="text-center">
              <span className="block text-[8px] uppercase tracking-wider text-[#b4aae2]/50 font-semibold">Heads</span>
              <span className="font-mono text-white text-sm font-bold">{coinStats.heads}</span>
            </div>
            <div className="text-center border-x border-[#cf4fe6]/10">
              <span className="block text-[8px] uppercase tracking-wider text-[#b4aae2]/50 font-semibold">Tails</span>
              <span className="font-mono text-white text-sm font-bold">{coinStats.tails}</span>
            </div>
            <div className="text-center">
              <span className="block text-[8px] uppercase tracking-wider text-[#b4aae2]/50 font-semibold">Total</span>
              <span className="font-mono text-white text-sm font-bold">{coinStats.total}</span>
            </div>
          </div>
        </div>
      ) : (
        /* MULTIPLAYER WAR MODE */
        <div className="space-y-4 animate-fade-in">
          {!joined ? (
            <div className="space-y-4">
              <p className="text-xs text-[#b4aae2] leading-relaxed">
                Connect and roll fair D20 dice with up to 4 players simultaneously. Pick your battle room or enter a new custom code!
              </p>

              {errorMessage && (
                <div className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-lg p-2.5 text-center uppercase tracking-wide">
                  {errorMessage}
                </div>
              )}

              {/* Lobby Configuration / Input Box */}
              <div className="p-4 rounded-xl bg-[#120826]/50 border border-[#cf4fe6]/15 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-[#b4aae2] font-bold block mb-1">Battle Chamber Code</label>
                    <input 
                      type="text"
                      placeholder="e.g. dragons-den"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                      className="w-full bg-[#1c1136] border border-[#cf4fe6]/20 rounded-xl px-3 py-2 text-xs text-[#faebd7] placeholder-[#b4aae2]/20 focus:outline-none focus:border-[#cf4fe6]"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-[#b4aae2] font-bold block mb-1">Pick Max Players</label>
                    <select
                      value={maxPlayersChoice}
                      onChange={(e) => setMaxPlayersChoice(Number(e.target.value))}
                      className="w-full bg-[#1c1136] border border-[#cf4fe6]/20 rounded-xl px-3 py-2 text-xs text-[#b4aae2] focus:outline-none focus:border-[#cf4fe6]"
                    >
                      <option value={2}>2 Players Clash</option>
                      <option value={3}>3 Players Clash</option>
                      <option value={4}>4 Players Clash (Recommended)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => connectToBattle()}
                  disabled={status === 'connecting'}
                  className="w-full py-2.5 bg-gradient-to-r from-[#cf4fe6] to-[#3fd9c7] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(207,79,230,0.25)]"
                >
                  ⚔️ JOIN OR CREATE CHAMBER
                </button>
              </div>

              {/* ACTIVE ROOMS LIST */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] uppercase tracking-widest text-[#cf4fe6] font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#cf4fe6]" /> Active Battle Rooms
                  </span>
                  <button 
                    onClick={fetchActiveRooms}
                    disabled={roomsLoading}
                    className="text-[8px] font-mono uppercase tracking-widest text-[#3fd9c7] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${roomsLoading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {activeRooms.length === 0 ? (
                  <div className="text-center p-4 border border-[#cf4fe6]/10 rounded-xl bg-[#120826]/30">
                    <span className="text-[9px] text-[#b4aae2]/30 italic uppercase font-mono">No active battles currently. Spawn one above!</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {activeRooms.map((r) => (
                      <div key={r.roomCode} className="flex justify-between items-center p-2 rounded-xl bg-[#1c1136]/60 border border-[#cf4fe6]/10 text-xs">
                        <div>
                          <span className="font-mono font-bold text-white uppercase tracking-wide">⚔️ {r.roomCode}</span>
                          <span className="text-[8px] text-[#b4aae2]/50 block font-mono">TRAVELERS: {r.playersList.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">{r.playerCount} / {r.maxPlayers}</span>
                          <button
                            onClick={() => connectToBattle(r.roomCode, r.maxPlayers)}
                            disabled={r.playerCount >= r.maxPlayers}
                            className="px-2 py-1 bg-[#3fd9c7]/10 hover:bg-[#3fd9c7]/20 border border-[#3fd9c7]/20 hover:border-[#3fd9c7]/40 text-[#3fd9c7] text-[8px] font-bold rounded-lg uppercase tracking-wider transition-all"
                          >
                            {r.playerCount >= r.maxPlayers ? 'FULL' : 'JOIN'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ACTIVE BATTLE ROOM */
            <div className="space-y-4">
              <div className="flex justify-between items-center p-2 rounded-xl bg-[#1c1136]/60 border border-[#cf4fe6]/10 text-xs text-[#b4aae2]">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#cf4fe6] font-bold">ROOM: {roomCode}</span>
                <div className="flex items-center gap-1 font-semibold text-[10px] text-[#3fd9c7]">
                  <Users className="w-3 h-3 animate-pulse" />
                  <span>{players.length} / {maxPlayersInRoom} TRAVELERS PRESENT</span>
                </div>
              </div>

              {/* GRID OF PLAYERS (Supports up to 4 columns beautifully) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {players.map((p) => {
                  const isMe = p.userId === currentUser?.toLowerCase();
                  return (
                    <div 
                      key={p.userId} 
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                        p.roll !== null 
                          ? 'border-emerald-500/35 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                          : 'border-[#cf4fe6]/15 bg-[#170e30]/40'
                      }`}
                    >
                      <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-[#3fd9c7] truncate max-w-full">
                        {p.userId} {isMe ? '(You)' : ''}
                      </span>
                      
                      <div className="h-16 flex items-center justify-center my-1.5">
                        {isMe && isRolling ? (
                          <span className="text-3xl font-extrabold text-[#3fd9c7] animate-spin font-mono">{rollingValue}</span>
                        ) : p.roll !== null ? (
                          <span className="text-4xl font-extrabold text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.45)] animate-bounce">
                            {p.roll}
                          </span>
                        ) : (
                          <span className="text-[8px] text-[#b4aae2]/30 italic font-mono uppercase tracking-wider">THINKING...</span>
                        )}
                      </div>

                      {isMe && p.roll === null && (
                        <button
                          onClick={performRoll}
                          disabled={isRolling}
                          className="py-1 px-2.5 bg-gradient-to-r from-[#cf4fe6] to-[#4f7fe6] text-white rounded-lg text-[9px] font-extrabold tracking-widest uppercase cursor-pointer hover:scale-105 active:scale-[0.98] transition-all"
                        >
                          🎲 ROLL
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Placeholders for remaining empty spots */}
                {Array.from({ length: Math.max(0, maxPlayersInRoom - players.length) }).map((_, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-dashed border-[#cf4fe6]/10 bg-[#120826]/20 flex flex-col items-center justify-center text-center opacity-40">
                    <span className="text-[8px] font-mono tracking-widest text-[#b4aae2] uppercase font-semibold">EMPTY SLOT</span>
                    <div className="h-16 flex items-center justify-center my-1.5">
                      <span className="text-lg">⏳</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* GAME OUTCOME BOARD */}
              {allRolled && (
                <div className={`p-4 rounded-xl border text-center transition-all animate-fade-in flex flex-col items-center justify-center gap-1.5 ${winGlow}`}>
                  <span className="text-xs font-extrabold tracking-widest text-white uppercase">{winText}</span>
                  <button 
                    onClick={resetBattle}
                    className="mt-1 px-4 py-1.5 bg-[#faebd7]/10 hover:bg-[#faebd7]/20 border border-[#faebd7]/20 rounded-lg text-[9px] font-mono font-bold tracking-widest text-[#faebd7] uppercase transition-all flex items-center gap-1.5 cursor-pointer mx-auto"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} /> PREPARE NEXT CLASH
                  </button>
                </div>
              )}

              {/* Retreat Panel Controls */}
              <div className="pt-2 border-t border-[#cf4fe6]/10 flex justify-between items-center">
                <button
                  onClick={leaveBattle}
                  className="text-[9px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 uppercase tracking-widest cursor-pointer"
                >
                  🏳️ RETREAT FROM CHAMBER
                </button>
                
                {players.length < maxPlayersInRoom && (
                  <span className="text-[8px] font-mono text-[#b4aae2]/50 uppercase tracking-wider animate-pulse">
                    Waiting for slot travelers to spawn...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
