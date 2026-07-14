import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  themeColor: string;
}

// Track definitions
export const TRACKS = [
  { id: 'synth', name: 'Chill Synthwave', genre: 'Synthwave Beat' },
  { id: 'space', name: 'Deep Cosmic Drone', genre: 'Sci-Fi Ambient' },
  { id: 'pulse', name: 'Quantum Pulse', genre: 'Electronic Arp' },
];

export function AudioPlayer({ themeColor }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [progress, setProgress] = useState(15); // Simulated starting progress %
  
  // Audio synthesis nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<any[]>([]);
  const synthIntervalRef = useRef<any>(null);
  const visualizerIntervalRef = useRef<any>(null);
  
  // Fake animated visualizer bars state
  const [bars, setBars] = useState<number[]>(new Array(16).fill(2));

  // Dynamic theme colors
  const getThemeHex = () => {
    switch (themeColor) {
      case 'cyan': return '#06b6d4';
      case 'pink': return '#ec4899';
      case 'emerald': return '#10b981';
      case 'amber': return '#f59e0b';
      default: return '#a855f7'; // purple
    }
  };

  // Start sound synthesis
  const startSynth = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Clear any previous nodes
      stopSynth();

      const track = TRACKS[currentTrackIndex];
      
      if (track.id === 'space') {
        // Generate a deep ambient drone using 2 detuned oscillators
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(65.41, ctx.currentTime); // C2
        osc1.detune.setValueAtTime(-15, ctx.currentTime);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(65.41, ctx.currentTime);
        osc2.detune.setValueAtTime(15, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.15, ctx.currentTime + 1.5);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        synthNodesRef.current = [osc1, osc2, gainNode];
      } else if (track.id === 'pulse' || track.id === 'synth') {
        // Arpeggiator synth sequence loop
        const synthLoop = () => {
          const notes = track.id === 'pulse' 
            ? [110.00, 130.81, 146.83, 164.81, 196.00, 220.00] // A minor chord notes (A2, C3, D3, E3, G3, A3)
            : [130.81, 164.81, 196.00, 246.94, 261.63, 329.63]; // C major 7 notes (C3, E3, G3, B3, C4, E4)
          
          let index = 0;
          
          synthIntervalRef.current = setInterval(() => {
            if (!ctx || ctx.state === 'suspended') return;
            const noteFreq = notes[index % notes.length];
            index++;

            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            const filterNode = ctx.createBiquadFilter();

            osc.type = track.id === 'pulse' ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(noteFreq, ctx.currentTime);
            
            filterNode.type = 'lowpass';
            filterNode.frequency.setValueAtTime(800, ctx.currentTime);
            filterNode.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);

            noteGain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
            noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

            osc.connect(filterNode);
            filterNode.connect(noteGain);
            noteGain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          }, track.id === 'pulse' ? 200 : 400); // Sequence rhythm speed
        };
        synthLoop();
      }
    } catch (e) {
      console.error("Audio Synthesis Error: ", e);
    }
  };

  // Stop synthesis nodes
  const stopSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    synthNodesRef.current.forEach(node => {
      try {
        node.stop();
      } catch (e) {}
      try {
        node.disconnect();
      } catch (e) {}
    });
    synthNodesRef.current = [];
  };

  // Update volume on nodes
  useEffect(() => {
    if (isPlaying) {
      // Refresh sound with new volume
      startSynth();
    }
  }, [volume, currentTrackIndex]);

  // Main playback control
  const togglePlay = () => {
    if (isPlaying) {
      stopSynth();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setTimeout(() => startSynth(), 50);
    }
  };

  // Skip Tracks
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  // Track progress and visualizer bar animation
  useEffect(() => {
    if (isPlaying) {
      // Progress simulation bar
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 1000);

      // Visualizer EQ bars animation
      visualizerIntervalRef.current = setInterval(() => {
        setBars(prev => prev.map(() => Math.floor(Math.random() * 24) + 4));
      }, 100);

      return () => {
        clearInterval(progressInterval);
        if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
      };
    } else {
      // Flat equalizer
      setBars(new Array(16).fill(2));
    }
  }, [isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSynth();
      if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    };
  }, []);

  return (
    <div id="portal-radio" className="flex flex-col md:flex-row items-center justify-between w-full h-full px-4 gap-4">
      {/* Track Info */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div 
          className="relative w-10 h-10 rounded-full bg-slate-900 border flex items-center justify-center overflow-hidden"
          style={{ borderColor: getThemeHex() + '50' }}
        >
          {/* Breathing orbit inside disc */}
          <div 
            className={`w-6 h-6 rounded-full border border-dashed animate-[spin_8s_linear_infinite] flex items-center justify-center`}
            style={{ borderColor: getThemeHex() }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getThemeHex() }} />
          </div>
          {isPlaying && (
            <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[1px] animate-[pulse_1.5s_infinite]" />
          )}
        </div>
        
        <div className="flex flex-col text-left">
          <div className="text-xs font-bold text-slate-100 uppercase tracking-wider truncate max-w-[150px]">
            {TRACKS[currentTrackIndex].name}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Portal Radio • {TRACKS[currentTrackIndex].genre}
          </div>
        </div>
      </div>

      {/* Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center gap-1.5 w-full md:max-w-md">
        <div className="flex items-center gap-4">
          <button 
            id="radio-prev-btn"
            onClick={handlePrev} 
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button 
            id="radio-play-btn"
            onClick={togglePlay} 
            className="p-2.5 rounded-full bg-slate-900 border text-slate-100 hover:scale-105 active:scale-95 transition-all shadow-md relative group overflow-hidden"
            style={{ borderColor: getThemeHex() }}
          >
            {/* Animated background glow on play */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" 
              style={{ backgroundColor: getThemeHex() }}
            />
            {isPlaying ? (
              <Pause className="w-4 h-4 relative z-10" />
            ) : (
              <Play className="w-4 h-4 fill-slate-100 translate-x-[1px] relative z-10" />
            )}
          </button>
          
          <button 
            id="radio-next-btn"
            onClick={handleNext} 
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Slider */}
        <div className="flex items-center gap-2 w-full text-[9px] font-mono text-slate-500">
          <span>0:{String(Math.floor(progress * 1.8)).padStart(2, '0')}</span>
          <div className="relative flex-1 h-1 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-1000"
              style={{ 
                width: `${progress}%`,
                backgroundColor: getThemeHex(),
                boxShadow: `0 0 6px ${getThemeHex()}`
              }}
            />
          </div>
          <span>3:00</span>
        </div>
      </div>

      {/* EQ Audio Visualizer Graphic (Center Right) */}
      <div className="hidden md:flex items-end gap-[3px] h-7 px-3 bg-slate-950/40 border border-slate-900/60 rounded-md">
        {bars.map((height, idx) => (
          <div 
            key={idx}
            className="w-[3px] rounded-t-sm transition-all duration-100"
            style={{ 
              height: `${height}px`,
              backgroundColor: getThemeHex(),
              boxShadow: isPlaying ? `0 0 4px ${getThemeHex()}50` : 'none',
              opacity: isPlaying ? 0.85 : 0.3
            }}
          />
        ))}
      </div>

      {/* Volume Controller (Far Right) */}
      <div className="flex items-center gap-2 w-full md:w-32">
        <Volume2 className="w-3.5 h-3.5 text-slate-500" />
        <input 
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none"
          style={{ 
            accentColor: getThemeHex()
          }}
        />
      </div>
    </div>
  );
}
