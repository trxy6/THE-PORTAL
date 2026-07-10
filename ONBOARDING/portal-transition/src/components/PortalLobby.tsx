import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { PortalTheme } from '../types';
import { Sparkles, Compass, Star } from 'lucide-react';

interface PortalLobbyProps {
  activeTheme: PortalTheme;
  themes: PortalTheme[];
  onThemeSelect: (theme: PortalTheme) => void;
  onActivatePortal: () => void;
}

export default function PortalLobby({
  activeTheme,
  themes,
  onThemeSelect,
  onActivatePortal,
}: PortalLobbyProps) {
  // Generate random drifting stars
  const ambientStars = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * -10,
      twinkleDuration: Math.random() * 3 + 1,
    }));
  }, []);

  // Generate a swirling star spiral (constellation)
  const spiralStars = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => {
      // Golden ratio spiral spacing
      const angle = i * 0.15;
      const radius = 5 + i * 4; // Spreading out
      return {
        id: i,
        angle,
        radius,
        size: Math.random() * 2.5 + 0.8,
        speed: Math.random() * 40 + 20, // rotation period in seconds
        pulseDelay: Math.random() * 2,
      };
    });
  }, []);

  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-center items-center p-6 overflow-hidden transition-all duration-1000 ${activeTheme.gradientBackground}`}>
      
      {/* Background Starfield */}
      <div className="absolute inset-0 pointer-events-none">
        {ambientStars.map((s) => (
          <motion.div
            key={`ambient-${s.id}`}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
            }}
            animate={{
              opacity: [0.1, 0.9, 0.1],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: s.twinkleDuration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: s.delay,
            }}
          />
        ))}
      </div>

      {/* Rotating Star Spiral / Nebular Whirlpool in Background - rounded-full is explicitly set on all containers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-50 rounded-full">
        <motion.div
          className="relative w-[800px] h-[800px] rounded-full flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          {spiralStars.map((s) => {
            // Polar to Cartesian coordinate conversion
            const x = Math.cos(s.angle) * s.radius;
            const y = Math.sin(s.angle) * s.radius;
            return (
              <motion.div
                key={`spiral-${s.id}`}
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
                  opacity: [0.2, 0.8, 0.2],
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

      {/* Cosmic Nebulous Light Orbs */}
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

      {/* Swirling Interactive Portal Arena (Centered with generous negative space) */}
      <div className="relative flex justify-center items-center z-10 py-12">
        
        {/* Pulsing Outer Super-Glow */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 380,
            height: 380,
            background: `radial-gradient(circle, ${activeTheme.primaryColor}1a 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
          animate={{
            scale: [0.85, 1.15, 0.85],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Swirling Particle Ring - clockwise */}
        <motion.div
          className="absolute rounded-full border border-dashed pointer-events-none opacity-40"
          style={{
            width: 350,
            height: 350,
            borderColor: activeTheme.primaryColor,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />

        {/* Swirling Particle Ring - counter-clockwise */}
        <motion.div
          className="absolute rounded-full border border-dotted pointer-events-none opacity-35"
          style={{
            width: 310,
            height: 310,
            borderColor: activeTheme.secondaryColor,
            borderWidth: '2px',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        />

        {/* Orbiting Mini-Moons / Portal Satellites */}
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`satellite-${i}`}
            className="absolute rounded-full pointer-events-none flex items-center justify-center"
            style={{
              width: 270,
              height: 270,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 7 + i * 3,
              repeat: Infinity,
              ease: 'linear',
              delay: i * -2.5,
            }}
          >
            <motion.div
              className="absolute w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center"
              style={{
                top: 0,
                background: `linear-gradient(135deg, ${activeTheme.ringColors[i % activeTheme.ringColors.length]}, #fff)`,
                boxShadow: `0 0 12px ${activeTheme.ringColors[i % activeTheme.ringColors.length]}`,
              }}
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="w-1 h-1 rounded-full bg-white" />
            </motion.div>
          </motion.div>
        ))}

        {/* Dynamic Concentric Swirling Energy Wave Rings */}
        <motion.div
          className="absolute rounded-full border pointer-events-none"
          style={{
            width: 250,
            height: 250,
            borderColor: `${activeTheme.primaryColor}33`,
            borderStyle: 'double',
            borderWidth: '5px',
          }}
          animate={{
            rotate: -360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }}
        />

        <motion.div
          className="absolute rounded-full border border-white/5 pointer-events-none"
          style={{
            width: 220,
            height: 220,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        />

        {/* The Main Portal Core Button */}
        <motion.button
          id="portal-activation-btn"
          onClick={onActivatePortal}
          whileHover="hover"
          whileTap="tap"
          className="relative w-52 h-52 rounded-full flex flex-col justify-center items-center cursor-pointer overflow-hidden group select-none focus:outline-none z-20"
        >
          {/* Constantly swirling cosmic vortex background inside the portal button */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${activeTheme.primaryColor}, ${activeTheme.secondaryColor}, black, ${activeTheme.primaryColor})`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Masking overlay to create a depth hole look */}
          <div className="absolute inset-2 rounded-full bg-slate-950/95 group-hover:bg-slate-950/85 transition-colors duration-500" />

          {/* Liquid Swirling center aura */}
          <motion.div
            className="absolute inset-5 rounded-full opacity-80 mix-blend-screen"
            style={{
              background: `radial-gradient(circle, ${activeTheme.primaryColor} 20%, ${activeTheme.secondaryColor} 60%, transparent 100%)`,
              filter: 'blur(8px)',
            }}
            animate={{
              scale: [0.95, 1.1, 0.95],
              rotate: -360,
            }}
            transition={{
              scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 8, repeat: Infinity, ease: 'linear' }
            }}
            variants={{
              hover: {
                scale: 1.25,
                filter: 'blur(5px)',
              }
            }}
          />

          {/* Glowing particle ring around the button's interior border */}
          <motion.div
            className="absolute inset-4 rounded-full border border-white/10 group-hover:border-white/40 transition-colors"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />

          {/* Animated portal tunnel lines radiating from center */}
          <div className="absolute inset-0 rounded-full pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-300">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`radiant-${idx}`}
                className="absolute w-full h-[1px] bg-white/20 top-1/2 left-0"
                style={{ transform: `rotate(${idx * 22.5}deg)` }}
              />
            ))}
          </div>

          {/* High-Contrast Interactive Foreground Content */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-1.5">
            <motion.div
              variants={{
                hover: {
                  scale: 1.3,
                  rotate: 180,
                  transition: { duration: 0.6, ease: 'easeInOut' }
                }
              }}
              className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner"
            >
              <Sparkles className={`w-5.5 h-5.5 ${activeTheme.accentColor} animate-pulse`} />
            </motion.div>
            
            <span className="text-2.5xl font-display font-black tracking-[0.25em] text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)] pl-[0.25em]">
              PORTAL
            </span>

            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 group-hover:bg-white/20 transition-all">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ backgroundColor: activeTheme.primaryColor }}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2`} style={{ backgroundColor: activeTheme.secondaryColor }}></span>
              </span>
              <span className="text-[8px] font-mono font-bold tracking-widest text-gray-200">
                WARP NOW
              </span>
            </div>
          </div>

          {/* Inner Neon Ring Glow */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 35px ${activeTheme.primaryColor}, 0 0 30px ${activeTheme.secondaryColor}`,
            }}
          />
        </motion.button>
      </div>

    </div>
  );
}
