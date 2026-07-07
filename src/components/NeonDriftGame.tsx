import React, { useState, useEffect, useRef } from 'react';
import { Play, Award, RotateCcw, Volume2, Shield } from 'lucide-react';

interface NeonDriftProps {
  themeColor: string;
}

export function NeonDriftGame({ themeColor }: NeonDriftProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('portal_neondrift_high') || '120');
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Game state variables
  const playerX = useRef(150);
  const keys = useRef<{ [key: string]: boolean }>({});
  const obstacles = useRef<any[]>([]);
  const energyCores = useRef<any[]>([]);
  const particles = useRef<any[]>([]);
  const gameSpeed = useRef(4);
  const scoreRef = useRef(0);

  // Dynamic colors
  const getThemeHex = () => {
    switch (themeColor) {
      case 'cyan': return '#06b6d4';
      case 'pink': return '#ec4899';
      case 'emerald': return '#10b981';
      case 'amber': return '#f59e0b';
      default: return '#a855f7'; // purple
    }
  };

  // Sound generator
  const playSound = (freq: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth', duration: number, endFreq?: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
      }
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  // Start the game loop
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    playerX.current = 150;
    obstacles.current = [];
    energyCores.current = [];
    particles.current = [];
    gameSpeed.current = 4;
    playSound(220, 'sawtooth', 0.2, 440);
  };

  // Listen for controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Canvas Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive sizing inside parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 360;
      }
    };
    resizeCanvas();

    let frameCount = 0;

    const loop = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid lines (Background)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      const offset = (frameCount * 2) % gridSpacing;
      
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = offset; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Handle input / move player
      const speed = 6;
      if (keys.current['ArrowLeft'] || keys.current['a'] || keys.current['A']) {
        playerX.current = Math.max(20, playerX.current - speed);
      }
      if (keys.current['ArrowRight'] || keys.current['d'] || keys.current['D']) {
        playerX.current = Math.min(canvas.width - 20, playerX.current + speed);
      }

      // Spawn obstacles (red barriers)
      if (frameCount % 60 === 0) {
        const size = Math.random() * 40 + 30;
        obstacles.current.push({
          x: Math.random() * (canvas.width - size),
          y: -size,
          width: size,
          height: 14,
          color: '#ef4444'
        });
      }

      // Spawn energy cores (cyan/theme points)
      if (frameCount % 85 === 0) {
        energyCores.current.push({
          x: Math.random() * (canvas.width - 20) + 10,
          y: -15,
          radius: 8,
          color: getThemeHex()
        });
      }

      // Draw and update player (Sleek pixel jet)
      ctx.shadowBlur = 15;
      ctx.shadowColor = getThemeHex();
      
      ctx.fillStyle = getThemeHex();
      ctx.beginPath();
      ctx.moveTo(playerX.current, canvas.height - 45); // Nose
      ctx.lineTo(playerX.current - 15, canvas.height - 15); // Left tail
      ctx.lineTo(playerX.current, canvas.height - 23); // Inner wing
      ctx.lineTo(playerX.current + 15, canvas.height - 15); // Right tail
      ctx.closePath();
      ctx.fill();

      // Exhaust flame particles
      if (frameCount % 3 === 0) {
        particles.current.push({
          x: playerX.current + (Math.random() * 6 - 3),
          y: canvas.height - 15,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 + 2,
          radius: Math.random() * 3 + 1,
          color: getThemeHex() + 'aa',
          life: 1
        });
      }

      // Draw and update Obstacles
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#ef4444';
      obstacles.current.forEach((obs, index) => {
        obs.y += gameSpeed.current;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Glow line overlay on obstacle
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(obs.x, obs.y + 4, obs.width, 2);
        ctx.fillStyle = '#ef4444';

        // Collision Check: Player Jet (approx bounds)
        const py = canvas.height - 45;
        const px = playerX.current;
        if (
          px + 12 > obs.x && 
          px - 12 < obs.x + obs.width &&
          canvas.height - 20 > obs.y &&
          py < obs.y + obs.height
        ) {
          // Crash! Trigger GameOver
          playSound(150, 'sawtooth', 0.6, 40);
          setGameState('gameover');
          
          // Explosion particle wave
          for (let i = 0; i < 40; i++) {
            particles.current.push({
              x: playerX.current,
              y: canvas.height - 30,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              radius: Math.random() * 5 + 2,
              color: i % 2 === 0 ? getThemeHex() : '#ef4444',
              life: 1
            });
          }
        }
      });

      // Draw and update Energy Cores
      ctx.shadowColor = getThemeHex();
      energyCores.current.forEach((core, index) => {
        core.y += gameSpeed.current * 0.85;
        
        // Pulsing glow radius
        const glowRad = core.radius + Math.sin(frameCount / 4) * 2;
        
        ctx.beginPath();
        ctx.arc(core.x, core.y, Math.max(1, glowRad), 0, Math.PI * 2);
        ctx.fillStyle = core.color;
        ctx.fill();

        // Core white center
        ctx.beginPath();
        ctx.arc(core.x, core.y, core.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Collision check with Jet
        const dist = Math.hypot(core.x - playerX.current, core.y - (canvas.height - 30));
        if (dist < core.radius + 18) {
          // Score energy core!
          playSound(600, 'sine', 0.15, 1200);
          scoreRef.current += 10;
          setScore(scoreRef.current);
          energyCores.current.splice(index, 1);

          // Spark particles
          for (let i = 0; i < 8; i++) {
            particles.current.push({
              x: core.x,
              y: core.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              radius: Math.random() * 3 + 1,
              color: '#ffffff',
              life: 0.8
            });
          }
        }
      });

      // Draw & update particles
      particles.current.forEach((part, index) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 0.02;
        
        if (part.life <= 0) {
          particles.current.splice(index, 1);
          return;
        }

        ctx.shadowColor = part.color;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius * part.life, 0, Math.PI * 2);
        ctx.fill();
      });

      // Clear offscreen items
      obstacles.current = obstacles.current.filter(o => o.y < canvas.height + 20);
      energyCores.current = energyCores.current.filter(c => c.y < canvas.height + 20);

      // Increase score slowly over survival time
      if (frameCount % 10 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      // Accelerate game speed slightly
      if (frameCount % 300 === 0) {
        gameSpeed.current += 0.5;
      }

      // Reset shadows
      ctx.shadowBlur = 0;

      if (gameState === 'playing') {
        requestRef.current = requestAnimationFrame(loop);
      }
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, themeColor]);

  // Handle Score highscore save
  useEffect(() => {
    if (gameState === 'gameover' && score > highScore) {
      setHighScore(score);
      localStorage.setItem('portal_neondrift_high', score.toString());
    }
  }, [gameState, score]);

  return (
    <div id="neon-drift-room" className="w-full bg-[#050510] border border-slate-900 rounded-lg overflow-hidden flex flex-col relative">
      {/* Game Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900 bg-slate-950/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 pulse-circle" />
          <span className="font-semibold text-slate-200">NEON DRIFT MULTIPLAYER</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <div>SCORE: <span className="text-white font-bold">{score}</span></div>
          <div>HIGH: <span className="text-slate-400 font-bold">{highScore}</span></div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 min-h-[300px] flex items-center justify-center">
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/80 z-20 text-center">
            <Shield className="w-12 h-12 mb-3 float-animated" style={{ color: getThemeHex() }} />
            <h3 className="text-lg font-bold text-slate-100 tracking-wider">NEON DRIFT</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Dodge red cosmic anomalies. Collect glowing {themeColor} energy cores!
            </p>
            <button 
              id="start-drift-btn"
              onClick={startGame}
              className="mt-5 flex items-center gap-2 px-5 py-2 rounded-md font-bold text-xs bg-slate-900 border text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
              style={{ borderColor: getThemeHex() }}
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              START ENGINE
            </button>
            <div className="text-[10px] text-slate-500 font-mono mt-4">
              USE LEFT / RIGHT ARROWS OR A / D TO STEER
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/90 z-20 text-center">
            <h3 className="text-xl font-extrabold text-red-500 tracking-wider">JET ENGINE DETONATED</h3>
            <p className="text-xs text-slate-400 mt-1">Hull Integrity compromised.</p>
            
            <div className="my-4 p-4 rounded-md border border-slate-900 bg-slate-950/50 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500 font-mono">CORE SCORE RECORDED</span>
              <span className="text-2xl font-black font-mono text-white">{score}</span>
              {score >= highScore && score > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
                  NEW SYSTEMS HIGH RECORD!
                </span>
              )}
            </div>

            <button 
              id="restart-drift-btn"
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2 rounded-md font-bold text-xs bg-slate-900 border text-slate-200 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
              style={{ borderColor: getThemeHex() }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              REPLACE HULL & RETRY
            </button>
          </div>
        )}

        <canvas 
          id="neon-drift-canvas"
          ref={canvasRef} 
          className="w-full h-[360px] block bg-slate-950/30"
        />
      </div>

      {/* Touch Steering Bars for Tablet/Mobile or Mouse Play */}
      <div className="grid grid-cols-2 h-11 border-t border-slate-900 bg-slate-950/60 divide-x divide-slate-900">
        <button 
          id="drift-steer-left"
          onMouseDown={() => { keys.current['ArrowLeft'] = true; }}
          onMouseUp={() => { keys.current['ArrowLeft'] = false; }}
          onMouseLeave={() => { keys.current['ArrowLeft'] = false; }}
          onTouchStart={(e) => { e.preventDefault(); keys.current['ArrowLeft'] = true; }}
          onTouchEnd={() => { keys.current['ArrowLeft'] = false; }}
          className="flex items-center justify-center hover:bg-slate-900/30 text-[10px] font-mono text-slate-400 active:text-white transition-colors"
        >
          ◄ STEER LEFT [A]
        </button>
        <button 
          id="drift-steer-right"
          onMouseDown={() => { keys.current['ArrowRight'] = true; }}
          onMouseUp={() => { keys.current['ArrowRight'] = false; }}
          onMouseLeave={() => { keys.current['ArrowRight'] = false; }}
          onTouchStart={(e) => { e.preventDefault(); keys.current['ArrowRight'] = true; }}
          onTouchEnd={() => { keys.current['ArrowRight'] = false; }}
          className="flex items-center justify-center hover:bg-slate-900/30 text-[10px] font-mono text-slate-400 active:text-white transition-colors"
        >
          STEER RIGHT [D] ►
        </button>
      </div>
    </div>
  );
}
