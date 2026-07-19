/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Gamepad2, Sparkles, Trophy, Zap, RefreshCw } from 'lucide-react';

interface GlassesNeuralGamesProps {
  onBack: () => void;
}

export default function GlassesNeuralGames({ onBack }: GlassesNeuralGamesProps) {
  const [activeGame, setActiveGame] = useState<'menu' | 'spaceDodge' | 'reflexPinch' | 'd20'>('menu');
  const [menuIndex, setMenuIndex] = useState<number>(0);

  // Space Dodge State
  const [shipPos, setShipPos] = useState<number>(1); // 0 = left, 1 = center, 2 = right
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Reflex Pinch State
  const [targetActive, setTargetActive] = useState<boolean>(false);
  const [reflexScore, setReflexScore] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  // D20 State
  const [d20Roll, setD20Roll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Menu Neural Band Listener
  useEffect(() => {
    if (activeGame !== 'menu') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setMenuIndex((prev) => (prev > 0 ? prev - 1 : 2));
      } else if (e.key === 'ArrowDown') {
        setMenuIndex((prev) => (prev < 2 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (menuIndex === 0) setActiveGame('spaceDodge');
        if (menuIndex === 1) setActiveGame('reflexPinch');
        if (menuIndex === 2) setActiveGame('d20');
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame, menuIndex, onBack]);

  // Space Dodge Listener
  useEffect(() => {
    if (activeGame !== 'spaceDodge') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setShipPos((p) => Math.max(0, p - 1));
      } else if (e.key === 'ArrowRight') {
        setShipPos((p) => Math.min(2, p + 1));
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        setActiveGame('menu');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame]);

  // Space Dodge Loop
  useEffect(() => {
    if (activeGame !== 'spaceDodge' || gameOver) return;
    const interval = setInterval(() => {
      setScore((s) => s + 10);
    }, 500);
    return () => clearInterval(interval);
  }, [activeGame, gameOver]);

  // Reflex Pinch Listener
  useEffect(() => {
    if (activeGame !== 'reflexPinch') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (targetActive) {
          const delta = Date.now() - startTime;
          setReactionTime(delta);
          setReflexScore((s) => s + 100);
          setTargetActive(false);
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        setActiveGame('menu');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame, targetActive, startTime]);

  // Trigger Reflex Target randomly
  useEffect(() => {
    if (activeGame !== 'reflexPinch' || targetActive) return;
    const timer = setTimeout(() => {
      setTargetActive(true);
      setStartTime(Date.now());
    }, 1500 + Math.random() * 2000);
    return () => clearTimeout(timer);
  }, [activeGame, targetActive]);

  // D20 Roll Listener
  useEffect(() => {
    if (activeGame !== 'd20') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        rollDice();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        setActiveGame('menu');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame]);

  const rollDice = () => {
    setIsRolling(true);
    setTimeout(() => {
      const res = Math.floor(Math.random() * 20) + 1;
      setD20Roll(res);
      setIsRolling(false);
    }, 600);
  };

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white">Neural Arcade</span>
        </div>
        <span className="text-[9px] text-purple-300 font-mono">Band Gesture Controls</span>
      </div>

      {/* Main Game Screen */}
      {activeGame === 'menu' && (
        <div className="my-auto space-y-3 py-2">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-black text-white uppercase">Select Neural Arcade Game</h3>
            <p className="text-[10px] text-slate-400">Swipe to highlight game, pinch to launch.</p>
          </div>

          <div className="space-y-2 max-w-xs mx-auto">
            {[
              { id: 'spaceDodge', name: '🚀 Cyber Space Dodge', desc: 'Swipe Left/Right to dodge cosmic debris' },
              { id: 'reflexPinch', name: '⚡ Reflex Pinch Challenge', desc: 'Pinch instantly when purple target lights up' },
              { id: 'd20', name: '🎲 Quantum D20 Roller', desc: 'Pinch to roll 20-sided dice for RPG checks' },
            ].map((g, idx) => {
              const isSelected = idx === menuIndex;
              return (
                <div
                  key={g.id}
                  onClick={() => {
                    setMenuIndex(idx);
                    if (idx === 0) setActiveGame('spaceDodge');
                    if (idx === 1) setActiveGame('reflexPinch');
                    if (idx === 2) setActiveGame('d20');
                  }}
                  className={`p-3 rounded-xl bg-black border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#8b5cf6] bg-purple-950/20 shadow-[0_0_20px_rgba(139,92,246,0.35)] ring-1 ring-[#8b5cf6]'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-black text-white">{g.name}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{g.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Space Dodge */}
      {activeGame === 'spaceDodge' && (
        <div className="my-auto space-y-3 text-center">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-2">
            <span>SCORE: {score}</span>
            <span>SWIPE LEFT/RIGHT</span>
          </div>

          <div className="h-44 w-full bg-slate-950 border-2 border-[#8b5cf6] rounded-xl flex flex-col justify-end p-4 relative overflow-hidden shadow-[0_0_25px_rgba(139,92,246,0.3)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />

            {/* 3 Lanes */}
            <div className="grid grid-cols-3 gap-2 w-full h-full items-end pb-2">
              <div className="flex flex-col items-center justify-end h-full">
                {shipPos === 0 && <span className="text-2xl animate-bounce">🚀</span>}
              </div>
              <div className="flex flex-col items-center justify-end h-full">
                {shipPos === 1 && <span className="text-2xl animate-bounce">🚀</span>}
              </div>
              <div className="flex flex-col items-center justify-end h-full">
                {shipPos === 2 && <span className="text-2xl animate-bounce">🚀</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reflex Pinch */}
      {activeGame === 'reflexPinch' && (
        <div className="my-auto space-y-4 text-center">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-2">
            <span>SCORE: {reflexScore}</span>
            <span>{reactionTime ? `LAST: ${reactionTime}ms` : 'WAIT FOR TARGET'}</span>
          </div>

          <div
            onClick={() => {
              if (targetActive) {
                const delta = Date.now() - startTime;
                setReactionTime(delta);
                setReflexScore((s) => s + 100);
                setTargetActive(false);
              }
            }}
            className={`w-36 h-36 mx-auto rounded-full border-4 transition-all flex flex-col items-center justify-center cursor-pointer ${
              targetActive
                ? 'bg-[#8b5cf6] border-white shadow-[0_0_40px_rgba(139,92,246,0.8)] scale-105 animate-pulse'
                : 'bg-black border-slate-800'
            }`}
          >
            {targetActive ? (
              <span className="text-sm font-black text-white uppercase tracking-wider">PINCH NOW!</span>
            ) : (
              <span className="text-xs text-slate-500 font-mono">READY...</span>
            )}
          </div>
        </div>
      )}

      {/* D20 Roller */}
      {activeGame === 'd20' && (
        <div className="my-auto space-y-4 text-center">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Pinch to Roll D20</span>

          <div
            onClick={rollDice}
            className={`w-36 h-36 mx-auto rounded-3xl bg-black border-2 border-[#8b5cf6] shadow-[0_0_30px_rgba(139,92,246,0.4)] flex flex-col items-center justify-center cursor-pointer transition-transform ${
              isRolling ? 'animate-spin' : ''
            }`}
          >
            <span className="text-4xl font-black text-purple-300 font-mono">
              {d20Roll !== null ? d20Roll : '20'}
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase mt-1">
              {d20Roll === 20 ? 'CRITICAL HIT!' : d20Roll === 1 ? 'NATURAL 1!' : 'D20 DIE'}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-purple-500/30 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <button
          onClick={() => {
            if (activeGame === 'menu') onBack();
            else setActiveGame('menu');
          }}
          className="hover:text-white cursor-pointer"
        >
          ← {activeGame === 'menu' ? 'Back to HUD' : 'Arcade Menu'}
        </button>
        <span className="text-[#8b5cf6]">Neural Band Game Engine</span>
      </div>
    </div>
  );
}
