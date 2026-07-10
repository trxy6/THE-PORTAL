import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';

interface PortalWalkthroughProps {
  primaryColor?: string;
  secondaryColor?: string;
  onComplete: () => void;
}

export default function PortalWalkthrough({
  primaryColor = '#8b5cf6',
  secondaryColor = '#db2777',
  onComplete,
}: PortalWalkthroughProps) {
  const [phase, setPhase] = useState<'entering' | 'warping' | 'flash' | 'whiteout'>('entering');

  // Sequential cinematic timeline progression matching original spec
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

    // 4.0s -> 4.8s: Sequence finished, trigger completion callback
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
    const ringColors = [primaryColor, secondaryColor, '#a78bfa', '#f472b6', '#60a5fa'];
    return Array.from({ length: 250 }).map((_, i) => {
      const baseAngle = Math.random() * Math.PI * 2;
      const swirlRotations = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 4 + 2); 
      return {
        id: i,
        baseAngle,
        swirlRotations,
        speed: Math.random() * 1.0 + 0.4,
        size: Math.random() * 4.0 + 1.0,
        color: i % 5 === 0 
          ? '#ffffff' 
          : i % 5 === 1 
            ? primaryColor 
            : i % 5 === 2 
              ? secondaryColor 
              : i % 5 === 3
                ? '#e0f2fe'
                : ringColors[i % ringColors.length],
        delay: Math.random() * -3.0, // negative delay to start pre-dispersed
      };
    });
  }, [primaryColor, secondaryColor]);

  // Concentric spiral tunnel rings
  const tunnelRings = useMemo(() => {
    const ringColors = [primaryColor, secondaryColor, '#a78bfa', '#f472b6', '#60a5fa'];
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      color: ringColors[i % ringColors.length],
      duration: 1.5,
      delay: i * 0.10,
    }));
  }, [primaryColor, secondaryColor]);

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
      className="fixed inset-0 w-full h-full bg-black flex justify-center items-center overflow-hidden z-[99999] select-none"
    >
      {/* 1. Deep Space backdrop */}
      <div className="absolute inset-0 bg-radial from-slate-950 via-zinc-950 to-black" />

      {/* 2. Swirling Stardust Nebulae Clouds */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none rounded-full">
        <motion.div
          className="absolute w-[250vmax] h-[250vmax] rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at center, transparent 10%, ${primaryColor}33 40%, ${secondaryColor}22 70%, transparent 100%)`,
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

      {/* 3. 3D Starfield Travel Simulation */}
      {phase !== 'whiteout' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {spaceStars.map((star) => {
            const keyframesX = [];
            const keyframesY = [];
            const keyframesScale = [];
            const keyframesOpacity = [];
            
            const steps = 8;
            for (let step = 0; step <= steps; step++) {
              const progress = step / steps;
              const currentAngle = star.baseAngle + star.swirlRotations * progress * Math.PI;
              const radius = progress * 1200;
              
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
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{
                scale: [0.1, 8.5],
                opacity: [0, 0.85, 0],
              }}
              transition={{
                duration: phase === 'flash' ? ring.duration * 0.4 : ring.duration,
                repeat: Infinity,
                delay: ring.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* 5. Post-Warp flash bang/whiteout overlay */}
      {phase === 'whiteout' && (
        <motion.div
          className="absolute inset-0 bg-white z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
        />
      )}
    </motion.div>
  );
}
