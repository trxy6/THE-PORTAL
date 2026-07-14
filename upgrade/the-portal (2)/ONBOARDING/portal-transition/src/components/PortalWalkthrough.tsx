import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PortalTheme } from '../types';

interface PortalWalkthroughProps {
  activeTheme: PortalTheme;
  onComplete: () => void;
}

export default function PortalWalkthrough({
  activeTheme,
  onComplete,
}: PortalWalkthroughProps) {
  const [phase, setPhase] = useState<'entering' | 'warping' | 'flash' | 'whiteout'>('entering');

  // Sequential cinematic timeline progression
  useEffect(() => {
    // 0.0s -> 1.2s: Opening/Entering portal hole
    const warpTimer = setTimeout(() => {
      setPhase('warping');
    }, 1200);

    // 1.2s -> 3.2s: Entering hyperdrive/warpspeed space
    const flashTimer = setTimeout(() => {
      setPhase('flash');
    }, 3200);

    // 3.2s -> 4.0s: Supernova flash and full whiteout
    const whiteoutTimer = setTimeout(() => {
      setPhase('whiteout');
    }, 4000);

    // 4.0s -> 4.8s: Sequence finished, route to Portal Destination page
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4800);

    return () => {
      clearTimeout(warpTimer);
      clearTimeout(flashTimer);
      clearTimeout(whiteoutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Generate 250 stars shooting and spiraling outwards (extremely high density, swirling path)
  const spaceStars = useMemo(() => {
    return Array.from({ length: 250 }).map((_, i) => {
      const baseAngle = Math.random() * Math.PI * 2;
      // High speed rotational swirling turns
      const swirlRotations = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 4 + 2); 
      return {
        id: i,
        baseAngle,
        swirlRotations,
        speed: Math.random() * 1.0 + 0.4, // Faster, more intense travel speed
        size: Math.random() * 4.0 + 1.0,  // Variable size stars
        color: i % 5 === 0 
          ? '#ffffff' 
          : i % 5 === 1 
            ? activeTheme.primaryColor 
            : i % 5 === 2 
              ? activeTheme.secondaryColor 
              : i % 5 === 3
                ? '#e0f2fe'
                : activeTheme.ringColors[i % activeTheme.ringColors.length],
        delay: Math.random() * -3.0, // negative delay so starfield starts pre-dispersed
      };
    });
  }, [activeTheme]);

  // Concentric spiral tunnel rings (increased count for deeper depth tunnel)
  const tunnelRings = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      color: activeTheme.ringColors[i % activeTheme.ringColors.length],
      duration: 1.5,
      delay: i * 0.10,
    }));
  }, [activeTheme]);

  // Screen-shake magnitude corresponding to gravity warp tension
  const getShakeAnimation = () => {
    if (phase === 'entering') {
      return {
        x: [0, -1, 1, -1, 0],
        y: [0, 1, -1, 1, 0],
        transition: { duration: 0.4, repeat: Infinity },
      };
    }
    if (phase === 'warping') {
      return {
        x: [0, -3, 3, -2, 2, -3, 3, 0],
        y: [0, 3, -3, 2, -2, 3, -3, 0],
        transition: { duration: 0.12, repeat: Infinity },
      };
    }
    if (phase === 'flash') {
      return {
        x: [0, -6, 6, -6, 6, -5, 5, 0],
        y: [0, 6, -6, 6, -6, 5, -5, 0],
        scale: [1, 1.04, 0.96, 1.05, 1],
        transition: { duration: 0.08, repeat: Infinity },
      };
    }
    return {};
  };

  return (
    <motion.div
      animate={getShakeAnimation()}
      className="fixed inset-0 w-full h-full bg-black flex justify-center items-center overflow-hidden z-50 select-none"
    >
      {/* 1. Deep Space backdrop */}
      <div className="absolute inset-0 bg-radial from-slate-950 via-zinc-950 to-black" />

      {/* 2. Swirling Stardust Nebulae Clouds - DESIGNED TO PREVENT RECTANGULAR CORNER CUTS */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none rounded-full">
        <motion.div
          className="absolute w-[250vmax] h-[250vmax] rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at center, transparent 10%, ${activeTheme.primaryColor}33 40%, ${activeTheme.secondaryColor}22 70%, transparent 100%)`,
          }}
          animate={{
            rotate: phase === 'flash' ? [0, 1440] : [0, 360],
            scale: [1, 1.3, 1],
          }}
          transition={{
            rotate: { duration: phase === 'flash' ? 20 : 12, repeat: Infinity, ease: 'linear' },
            scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          }}
        />
      </div>

      {/* 3. 3D Starfield Travel Simulation (Swirling Spirals Star Movement) */}
      {phase !== 'whiteout' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {spaceStars.map((star) => {
            // Generate radial swirling path keyframes
            const keyframesX = [];
            const keyframesY = [];
            const keyframesScale = [];
            const keyframesOpacity = [];
            
            const steps = 8;
            for (let step = 0; step <= steps; step++) {
              const progress = step / steps;
              // Spiral angle increases with progression for dynamic warp swirl
              const currentAngle = star.baseAngle + star.swirlRotations * progress * Math.PI;
              const radius = progress * 1200; // expand outwards further
              
              keyframesX.push(Math.cos(currentAngle) * radius);
              keyframesY.push(Math.sin(currentAngle) * radius);
              keyframesScale.push(0.1 + progress * 5);
              keyframesOpacity.push(progress === 0 ? 0 : progress > 0.85 ? 0 : 0.95);
            }

            return (
              <motion.div
                key={`starfield-${star.id}`}
                className="absolute rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  backgroundColor: star.color,
                }}
                initial={{ x: 0, y: 0, scale: 0.1, opacity: 0 }}
                animate={{
                  x: keyframesX,
                  y: keyframesY,
                  scale: keyframesScale,
                  opacity: keyframesOpacity,
                }}
                transition={{
                  duration: phase === 'flash' ? star.speed * 0.30 : star.speed * 0.8,
                  repeat: Infinity,
                  delay: star.delay,
                  ease: 'easeIn',
                }}
              />
            );
          })}
        </div>
      )}

      {/* 4. Swirling/Spinning Concentric Tunnel Rings */}
      {phase !== 'whiteout' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-full overflow-hidden">
          {tunnelRings.map((ring) => (
            <motion.div
              key={`tunnel-ring-${ring.id}`}
              className="absolute rounded-full border-2"
              style={{
                width: '180px',
                height: '180px',
                borderColor: ring.color,
                boxShadow: `0 0 25px ${ring.color}33, inset 0 0 25px ${ring.color}33`,
              }}
              initial={{ scale: 0.05, opacity: 0, rotate: 0 }}
              animate={{
                scale: [0.05, 1.5, 9, 20],
                opacity: [0, 0.95, 0.6, 0],
                rotate: [0, 360, 720, 1080], // Multi-turn rotational swirling down the tunnel
              }}
              transition={{
                duration: phase === 'flash' ? ring.duration * 0.40 : ring.duration,
                repeat: Infinity,
                delay: ring.delay,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}

      {/* 5. Center Portal vortex singularity pulling camera in */}
      {phase === 'entering' && (
        <motion.div
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, 1.2, 2.6], opacity: [0.2, 1, 0] }}
          transition={{ duration: 1.2, ease: 'easeIn' }}
          className="absolute w-96 h-96 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${activeTheme.secondaryColor} 10%, ${activeTheme.primaryColor}33 60%, transparent 100%)`,
          }}
        >
          {/* Swirling mini spirals inside the opening hole */}
          <motion.div 
            className="w-44 h-44 rounded-full border border-dashed border-white/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* 6. Active Event Horizon black hole singularity */}
      {phase === 'warping' && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: 1 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full pointer-events-none flex items-center justify-center"
          style={{
            background: '#ffffff',
            boxShadow: `0 0 45px 15px ${activeTheme.primaryColor}, 0 0 90px 30px ${activeTheme.secondaryColor}, inset 0 0 10px #ffffff`,
          }}
        >
          {/* Internal rotating core rings */}
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-white/50 border-dotted"
            animate={{ rotate: -360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* 7. Event Horizon Whiteout Supernova (Smooth Radial Gradient Opacity Fade-in without texture clipping bugs) */}
      {phase === 'flash' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeIn' }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, #ffffff 0%, ${activeTheme.primaryColor}dd 40%, ${activeTheme.secondaryColor}aa 75%, transparent 100%)`,
          }}
        />
      )}

      {/* 8. Fullscreen Flash Overlay */}
      <AnimatePresence>
        {phase === 'whiteout' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 bg-white flex flex-col justify-center items-center z-50"
          >
            {/* Immersive radial particle burst */}
            <motion.div
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="w-96 h-96 rounded-full"
              style={{
                background: `radial-gradient(circle, ${activeTheme.primaryColor} 0%, ${activeTheme.secondaryColor}44 50%, transparent 80%)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narrative sci-fi feedback telemetry lines */}
      {phase !== 'whiteout' && (
        <div className="absolute bottom-16 text-center z-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[10px] font-mono tracking-[0.5em] text-white/70"
          >
            {phase === 'entering' && '► INITIATING MOLECULAR DISPERSION'}
            {phase === 'warping' && '► BENDING SPACETIME CONTINUUM • WARP 9.8'}
            {phase === 'flash' && '► BREAKING EVENT HORIZON BOUNDARY'}
          </motion.div>
          <div className="mt-2 text-[9px] font-mono text-white/30 tracking-widest uppercase">
            Gravitational Distortion: {phase === 'entering' ? '1.24 G' : phase === 'warping' ? '18.42 G' : 'MAX LIMIT'}
          </div>
        </div>
      )}
    </motion.div>
  );
}
