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
  const [playerPosition, setPlayerPosition] = useState<number>(1); // 0 = left, 1 = center, 2 = right
  const [obstaclePosition, setObstaclePosition] = useState<number>(1);
  const [dodgeScore, setDodgeScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Reflex Pinch State
  const [reflexTarget, setReflexTarget] = useState<boolean>(false);
  const [reflexScore, setReflexScore] = useState<number>(0);
  const [reflexTimer, setReflexTimer] = useState<number>(15);

  // D20 State
  const [d20Result, setD20Result] = useState<number | null>(null);

  // Space Dodge Loop
  useEffect(() => {
    if (activeGame !== 'spaceDodge' || gameOver) return;
    const interval = setInterval(() => {
      setDodgeScore((prev) => prev + 10);
      setObstaclePosition(Math.floor(Math.random() * 3));
    }, 1200);
    return () => clearInterval(interval);
  }, [activeGame, gameOver]);

  // Check collision
  useEffect(() => {
    if (activeGame === 'spaceDodge' && playerPosition === obstaclePosition && dodgeScore > 0) {
      setGameOver(true);
    }
  }, [playerPosition, obstaclePosition, dodgeScore, activeGame]);

  // Reflex Pinch Timer
  useEffect(() => {
    if (activeGame !== 'reflexPinch') return;
    let interval: any = null;
    if (reflexTimer > 0) {
      interval = setInterval(() => {
        setReflexTimer((prev) => prev - 1);
        if (Math.random() > 0.4) setReflexTarget(true);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeGame, reflexTimer]);

  // Gesture Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeGame === 'menu') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          setMenuIndex((prev) => (prev > 0 ? prev - 1 : 2));
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          setMenuIndex((prev) => (prev < 2 ? prev + 1 : 0));
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (menuIndex === 0) {
            setActiveGame('spaceDodge');
            setGameOver(false);
            setDodgeScore(0);
          } else if (menuIndex === 1) {
            setActiveGame('reflexPinch');
            setReflexScore(0);
            setReflexTimer(15);
          } else if (menuIndex === 2) {
            setActiveGame('d20');
            setD20Result(Math.floor(Math.random() * 20) + 1);
          }
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          onBack();
        }
      } else if (activeGame === 'spaceDodge') {
        if (e.key === 'ArrowLeft') {
          setPlayerPosition((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'ArrowRight') {
          setPlayerPosition((prev) => (prev < 2 ? prev + 1 : 2));
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (gameOver) {
            setGameOver(false);
            setDodgeScore(0);
          }
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          setActiveGame('menu');
        }
      } else if (activeGame === 'reflexPinch') {
        if (e.key === 'Enter' || e.key === ' ') {
          if (reflexTarget) {
            setReflexScore((prev) => prev + 100);
            setReflexTarget(false);
          }
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          setActiveGame('menu');
        }
      } else if (activeGame === 'd20') {
        if (e.key === 'Enter' || e.key === ' ') {
          setD20Result(Math.floor(Math.random() * 20) + 1);
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          setActiveGame('menu');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame, menuIndex, gameOver, reflexTarget, onBack]);

  const renderGameContent = () => {
    if (activeGame === 'spaceDodge') {
      return (
        <div className="my-auto space-y-4 text-center">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-purple-300">Space Dodge 2D</span>
            <span className="font-bold text-emerald-400">Score: {dodgeScore}</span>
          </div>

          <div className="h-32 w-full bg-black border-2 border-[#8b5cf6] rounded-2xl relative overflow-hidden flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            {/* Obstacle row */}
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((lane) => (
                <div key={lane} className="h-6 flex items-center justify-center">
                  {obstaclePosition === lane && !gameOver && (
                    <div className="w-5 h-5 rounded-md bg-rose-500 animate-pulse" />
                  )}
                </div>
              ))}
            </div>

            {/* Player row */}
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((lane) => (
                <div key={lane} className="h-6 flex items-center justify-center">
                  {playerPosition === lane && (
                    <div className={`w-6 h-6 rounded-lg border-2 ${gameOver ? 'bg-rose-600 border-white' : 'bg-[#8b5cf6] border-white'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {gameOver ? (
            <div className="space-y-1">
              <p className="text-sm font-black text-rose-400">CRASH! Game Over.</p>
              <p className="text-xs text-purple-300">Pinch to Try Again</p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 font-mono">Swipe ← Left / Right → to Dodge</p>
          )}
        </div>
      );
    }

    if (activeGame === 'reflexPinch') {
      return (
        <div className="my-auto space-y-4 text-center">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-purple-300">Reflex Pinch</span>
            <span className="font-bold text-emerald-400">Score: {reflexScore}</span>
          </div>

          <div
            onClick={() => {
              if (reflexTarget) {
                setReflexScore((prev) => prev + 100);
                setReflexTarget(false);
              }
            }}
            className={`h-32 w-full rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all ${
              reflexTarget
                ? 'bg-emerald-500 border-white shadow-[0_0_30px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-black border-slate-800'
            }`}
          >
            {reflexTarget ? (
              <span className="text-sm font-black text-black uppercase tracking-wider">PINCH NOW!</span>
            ) : (
              <span className="text-xs text-slate-500 font-mono">Wait for Green Flash...</span>
            )}
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Timer: {reflexTimer}s</span>
            <span>Double Pinch: Menu</span>
          </div>
        </div>
      );
    }

    if (activeGame === 'd20') {
      return (
        <div className="my-auto space-y-4 text-center">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-purple-300">Neural D20 Roller</span>
            <span className="text-slate-400">Pinch to Roll</span>
          </div>

          <div
            onClick={() => setD20Result(Math.floor(Math.random() * 20) + 1)}
            className="w-28 h-28 mx-auto rounded-3xl bg-black border-4 border-[#8b5cf6] flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)] cursor-pointer active:scale-95"
          >
            <span className="text-4xl font-black text-white font-mono">{d20Result ?? '?'}</span>
          </div>

          <p className="text-xs font-bold text-purple-300">
            {d20Result === 20 ? '🔥 NATURAL 20 CRITICAL!' : d20Result === 1 ? '💀 NATURAL 1 FAIL!' : 'Pinch or tap to reroll!'}
          </p>
        </div>
      );
    }

    // Arcade Menu
    return (
      <div className="my-auto space-y-2 py-2">
        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-mono tracking-wider">
          <span>Select Mini Game:</span>
          <span>Swipe ↑↓ | Pinch Launch</span>
        </div>

        <div className="space-y-2">
          {[
            { id: 'spaceDodge', name: 'Space Dodge 2D', desc: 'Swipe Left/Right to avoid obstacles' },
            { id: 'reflexPinch', name: 'Reflex Pinch Challenge', desc: 'Test Neural Band reaction speed' },
            { id: 'd20', name: 'D20 Quantum Dice', desc: 'Roll D20 for RPG games' },
          ].map((game, idx) => {
            const isSelected = idx === menuIndex;
            return (
              <div
                key={game.id}
                onClick={() => {
                  setMenuIndex(idx);
                  setActiveGame(game.id as any);
                }}
                className={`p-3 rounded-xl bg-black border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[#8b5cf6] bg-purple-950/20 shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-[#8b5cf6]'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-black text-white">{game.name}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{game.desc}</p>
                </div>
                <Trophy className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-slate-600'}`} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white">Neural Band Arcade</span>
        </div>
        <span className="text-[9px] text-purple-300 font-mono">META HUD v1.0</span>
      </div>

      {/* Main Game Screen */}
      {renderGameContent()}

      {/* Navigation Footer */}
      <div className="border-t border-purple-500/30 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <button
          onClick={() => {
            if (activeGame !== 'menu') setActiveGame('menu');
            else onBack();
          }}
          className="hover:text-white cursor-pointer"
        >
          {activeGame !== 'menu' ? '← Back to Menu' : '← Back to HUD'}
        </button>
        <span className="text-[#8b5cf6]">Gesture Arcade</span>
      </div>
    </div>
  );
}
