import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PortalTheme } from '../types';
import { ArrowLeft, RotateCcw, Volume2, Sparkles, Compass } from 'lucide-react';

interface PortalDestinationProps {
  activeTheme: PortalTheme;
  onReset: () => void;
}

// Highly recognizable 32x16 retro pixel-art bat frames
// '.' = transparent, 'k' = outline, 'd' = wing primary, 'l' = wing secondary, 'g' = skin/body, 'y' = ear inner, 'r' = red eyes, 'w' = white highlights/fangs
const BAT_WINGS_UP = [
  "..kk........................kk..", // 0
  ".kyk........................kyk.", // 1
  "kydk........................kdyk", // 2
  "kdddk.......kkggggkk.......kdddk", // 3
  "kdllddk....kggggggggk....kdllddk", // 4
  ".kdllddk..kgggrwwrgggk..kdllddk.", // 5 (red & white eyes)
  "..kdllddk.kggggggggggk.kdllddk..", // 6
  "...kdllddkkgggwgwwgwggkkdllddk...", // 7 (white fangs)
  "..kddllddkkggggggggggkkdlldddk..", // 8
  ".kdddllddk.kggggggggk.kdllddddk.", // 9
  "kddddllddk..kkggggkk..kdlldddddk", // 10
  "kdddddlldk....kkkk....kdlldddddk", // 11
  ".kdddddddk............kdddddddk.", // 12
  "..kkdddddk............kdddddkk..", // 13
  "....kkkkkk............kkkkkk....", // 14
  "..........kkkk....kkkk.........."  // 15 (feet/tail)
];

const BAT_WINGS_DOWN = [
  "................................", // 0
  "............kk....kk............", // 1
  "...........kyk....kyk...........", // 2
  "..........kydk....kdyk..........", // 3
  ".........kdddkkkkkkdddk.........", // 4
  "........kdlldkggggkdlldk........", // 5
  ".......kdllddkrwwrgkdllddk.......", // 6 (eyes in head)
  "......kdlldddkgggggkdlldddk......", // 7
  ".....kdllddddkwgggwkdllddddk.....", // 8 (fangs)
  "....kddllddddkgggggkdlldddddk....", // 9
  "....kkkkdddddkgggggkdddddkkkk....", // 10
  "........kkkkkkkkkkkkkkkk........", // 11
  "............k......k............", // 12
  "............k......k............", // 13
  "...........kk......kk...........", // 14
  "................................"  // 15
];

const FUN_BAT_QUOTES = [
  "WELCOME THROUGH THE PORTAL!",
  "SQUEAK! IS THIS ANOTHER DIMENSION?",
  "WOW, THE STARS SWIRL SO FAST HERE!",
  "DIMENSIONAL JUMP COMPLETED SUCCESSFULLY!",
  "SQUEAK! CLICKS MAKE ME FLAP FASTER!",
  "WARP DRIVE WAS SO INTENSE, SQUEAK!",
  "I AM THE GUARDIAN OF THE PORTAL CODES!",
  "PRESS START TO CONTINUE THE DISCOVERY!"
];

export default function PortalDestination({
  activeTheme,
  onReset,
}: PortalDestinationProps) {
  const [jumpsCount, setJumpsCount] = useState<number>(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isSqueaking, setIsSqueaking] = useState(false);

  // wing flapping alternator speed
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev === 0 ? 1 : 0));
    }, 320);
    return () => clearInterval(interval);
  }, []);

  // Safe client-side counter loading and execution
  useEffect(() => {
    const savedJumps = localStorage.getItem('dimensional_jumps_count');
    if (savedJumps) {
      const count = parseInt(savedJumps, 10) + 1;
      setJumpsCount(count);
      localStorage.setItem('dimensional_jumps_count', count.toString());
    } else {
      localStorage.setItem('dimensional_jumps_count', '1');
      setJumpsCount(1);
    }
  }, []);

  const handleResetCounter = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem('dimensional_jumps_count', '0');
    setJumpsCount(0);
    playRetroBeep(200, 100, 0.2);
  };

  // Synth retro audio beep squeak
  const playRetroBeep = (startFreq = 600, endFreq = 900, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'triangle'; // pure retro wave
      osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      console.warn("Audio Context blocked or unsupported:", err);
    }
  };

  const handleBatInteraction = () => {
    setIsSqueaking(true);
    playRetroBeep(520, 1150, 0.18);
    setQuoteIndex((prev) => (prev + 1) % FUN_BAT_QUOTES.length);
    setTimeout(() => setIsSqueaking(false), 250);
  };

  // Floating background geometries for digital depth
  const floatingObjects = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      size: Math.random() * 12 + 6,
      rotation: Math.random() * 360,
      duration: Math.random() * 12 + 8,
    }));
  }, []);

  // Starfield backdrop
  const fieldStars = useMemo(() => {
    return Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
    }));
  }, []);

  // Swirling star spiral constellation matching the lobby's background precisely
  const spiralStars = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => {
      const angle = i * 0.15;
      const radius = 5 + i * 4;
      return {
        id: i,
        angle,
        radius,
        size: Math.random() * 2.5 + 0.8,
        speed: Math.random() * 40 + 20,
        pulseDelay: Math.random() * 2,
      };
    });
  }, []);

  // Pixel coloring helper
  const getColor = (char: string) => {
    switch (char) {
      case 'k': return '#090a0f'; // Crisp dark black outline
      case 'd': return activeTheme.primaryColor; // Current dynamic primary color
      case 'l': return activeTheme.secondaryColor; // Current dynamic secondary color
      case 'g': return '#3c244d'; // Plum colored skin body
      case 'y': return '#f59e0b'; // Gold colored ears inner
      case 'r': return '#f43f5e'; // Vibrant neon ruby red eyes
      case 'w': return '#ffffff'; // White fangs & eye shine
      default: return null;
    }
  };

  const currentFrameMatrix = currentFrame === 0 ? BAT_WINGS_UP : BAT_WINGS_DOWN;

  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-between items-center p-6 md:p-12 overflow-hidden ${activeTheme.gradientBackground} text-white select-none`}>
      
      {/* Inline styles for scrolling the perspective grid perfectly */}
      <style>{`
        @keyframes grid-scroll-anim {
          from { background-position: 0 0; }
          to { background-position: 0 40px; }
        }
      `}</style>

      {/* Rotating Star Spiral / Nebular Whirlpool matching the lobby's exact constellation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-40 rounded-full">
        <motion.div
          className="relative w-[800px] h-[800px] rounded-full flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          {spiralStars.map((s) => {
            const x = Math.cos(s.angle) * s.radius;
            const y = Math.sin(s.angle) * s.radius;
            return (
              <motion.div
                key={`dest-spiral-${s.id}`}
                className="absolute rounded-full"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  backgroundColor: s.id % 2 === 0 ? activeTheme.primaryColor : activeTheme.secondaryColor,
                  boxShadow: `0 0 8px ${s.id % 2 === 0 ? activeTheme.primaryColor : activeTheme.secondaryColor}`,
                }}
                animate={{
                  opacity: [0.15, 0.75, 0.15],
                  scale: [0.9, 1.4, 0.9],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: s.pulseDelay,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Cosmic Nebulous Light Orbs for depth */}
      <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden">
        <motion.div
          className="absolute rounded-full filter blur-[120px] opacity-25"
          style={{
            width: '450px',
            height: '450px',
            left: '10%',
            top: '20%',
            background: `radial-gradient(circle, ${activeTheme.primaryColor} 0%, transparent 80%)`,
          }}
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full filter blur-[140px] opacity-20"
          style={{
            width: '500px',
            height: '500px',
            right: '10%',
            bottom: '15%',
            background: `radial-gradient(circle, ${activeTheme.secondaryColor} 0%, transparent 80%)`,
          }}
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* 1. Cyber Synthwave Perspective Grid Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        {/* Sky glow */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-color-dodge transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${activeTheme.secondaryColor}bb 0%, ${activeTheme.primaryColor}22 65%, #000000 100%)`,
          }}
        />

        {/* Dense Starfield */}
        {fieldStars.map((star) => (
          <div
            key={`field-star-${star.id}`}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}

        {/* 3D Cyber Grid Floor stretching out to infinite perspective */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250vw] h-[55vh] origin-top opacity-50"
          style={{
            transform: 'perspective(240px) rotateX(68deg)',
            background: `linear-gradient(to right, ${activeTheme.primaryColor}55 1.5px, transparent 1.5px), linear-gradient(to bottom, ${activeTheme.primaryColor}55 1.5px, transparent 1.5px)`,
            backgroundSize: '40px 40px',
            animation: 'grid-scroll-anim 2.2s linear infinite',
          }}
        />

        {/* Electric Neon Horizon laser divider line */}
        <div 
          className="absolute bottom-[55vh] left-0 right-0 h-[2px] opacity-80 shadow-[0_0_20px_rgba(255,255,255,0.9)]"
          style={{
            background: `linear-gradient(to right, transparent, ${activeTheme.secondaryColor}, #ffffff, ${activeTheme.primaryColor}, transparent)`,
          }}
        />
      </div>

      {/* Floating Crystals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingObjects.map((obj) => (
          <motion.div
            key={obj.id}
            className="absolute rounded-full border flex items-center justify-center bg-white/5 backdrop-blur-sm"
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              width: `${obj.size}px`,
              height: `${obj.size}px`,
              borderColor: `${activeTheme.primaryColor}33`,
            }}
            animate={{
              y: [0, -40, 0],
              rotate: [obj.rotation, obj.rotation + 180, obj.rotation + 360],
              opacity: [0.15, 0.5, 0.15],
            }}
            transition={{
              duration: obj.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Retro Styled Game HUD Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="z-10 flex justify-between items-center w-full max-w-5xl"
      >
        <button
          onClick={onReset}
          className="flex items-center gap-3 px-4 py-2.5 border-4 border-white bg-black hover:bg-white hover:text-black font-retro text-[9px] tracking-widest transition-all shadow-[5px_5px_0px_0px_rgba(255,255,255,0.25)] active:translate-y-1 active:shadow-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> ESCAPE LOBBY
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 border-4 border-yellow-500 bg-neutral-950 font-retro text-[8px] text-yellow-400 tracking-wider shadow-[4px_4px_0px_0px_rgba(234,179,8,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          <span>PORTAL ACTIVE</span>
        </div>
      </motion.div>

      {/* Central Ethereal Content - Interactive Floating Bat & Pokemon TextBox */}
      <div className="my-auto z-10 flex flex-col items-center justify-center max-w-2xl text-center relative py-6">
        
        {/* Pokémon Style Dialogue Text Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-12 mx-4 flex flex-col items-center select-none"
        >
          <div className="bg-white border-8 border-black text-black p-5 pr-8 min-w-[280px] sm:min-w-[420px] max-w-xs sm:max-w-md md:max-w-xl font-retro select-none relative shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] rounded-none">
            {/* Pokémon double line layout */}
            <div className="absolute inset-1 border-4 border-double border-black pointer-events-none" />
            
            {/* Small corner block accents */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-black" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-black" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-black" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-black" />

            <p className="font-retro text-[10px] sm:text-[11px] leading-relaxed tracking-widest text-neutral-900 uppercase text-left font-bold pl-3 pr-2 py-1">
              {FUN_BAT_QUOTES[quoteIndex]}
            </p>

            {/* Pokémon style blinking click progress down triangle */}
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-3 right-4 font-retro text-[10px] text-red-600 font-bold"
            >
              ▼
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Animated 64-bit style Pixel Art Bat */}
        <motion.div
          animate={{
            y: isSqueaking ? [-8, 4, -8] : [-12, 12, -12],
            scale: isSqueaking ? [1, 1.15, 1] : [1, 1.02, 1],
          }}
          transition={{
            y: { duration: isSqueaking ? 0.25 : 3.2, repeat: isSqueaking ? 1 : Infinity, ease: 'easeInOut' },
            scale: { duration: 0.25, ease: 'easeInOut' }
          }}
          onClick={handleBatInteraction}
          className="relative w-72 h-36 cursor-pointer group flex items-center justify-center select-none"
        >
          {/* Ambient Portal Whirlpool aura behind the bat */}
          <div className="absolute w-48 h-48 rounded-full bg-radial from-white/10 to-transparent blur-xl pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />
          
          <motion.div
            className="absolute rounded-full border border-dashed pointer-events-none opacity-20"
            style={{
              width: 210,
              height: 210,
              borderColor: activeTheme.primaryColor,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />

          {/* Render the beautifully structured 32x16 Pixel Art Grid Bat SVG */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 32 16"
            className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
            style={{ shapeRendering: 'crispEdges' }}
          >
            {currentFrameMatrix.map((row, rIdx) => {
              return row.split('').map((char, cIdx) => {
                const fill = getColor(char);
                if (!fill) return null;
                return (
                  <rect
                    key={`pixel-${rIdx}-${cIdx}`}
                    x={cIdx}
                    y={rIdx}
                    width={1.05}
                    height={1.05}
                    fill={fill}
                  />
                );
              });
            })}
          </svg>

          {/* Squeak hover trigger label */}
          <div className="absolute -bottom-6 bg-black/70 border border-white/20 backdrop-blur-sm px-3.5 py-1 rounded-full text-[8px] font-retro tracking-widest text-neutral-300 pointer-events-none group-hover:scale-105 group-hover:border-white/50 transition-all flex items-center gap-1.5 shadow-lg">
            <Volume2 className="w-3 h-3 text-white" /> CLICK TO SQUEAK
          </div>
        </motion.div>

      </div>

      {/* Statistics NES Style Frame (Dimensional Jump Counter) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="z-10 mt-6 p-4 border-4 border-white bg-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)] max-w-sm w-full flex flex-row items-center justify-between"
      >
        <div className="flex flex-col text-left gap-1">
          <span className="text-[7px] font-retro uppercase tracking-wider text-neutral-500">
            METRICS REGISTER
          </span>
          <span className="text-[9px] font-retro text-white tracking-widest">
            DIMENSIONAL JUMPS
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className={`text-2xl font-retro font-black ${activeTheme.accentColor}`}>
              {jumpsCount}
            </span>
          </div>

          <button
            onClick={handleResetCounter}
            title="Reset jumps counter"
            className="p-1.5 border-2 border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white hover:border-white transition-all cursor-pointer active:scale-90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Retro Sci-fi Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="z-10 text-center flex flex-col items-center gap-1 mt-6"
      >
        <span className="text-[7px] font-retro tracking-widest text-neutral-500 uppercase">
          STEADY STATE ACTIVE • RETRO TERMINAL SECURE
        </span>
      </motion.div>
    </div>
  );
}
