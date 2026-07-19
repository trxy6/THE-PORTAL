/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Utensils, Timer, Check, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { displaySync, DisplayPairingState } from '../../lib/displaySync';

interface GlassesRecipeCompanionProps {
  onBack: () => void;
}

export default function GlassesRecipeCompanion({ onBack }: GlassesRecipeCompanionProps) {
  const [recipe, setRecipe] = useState<DisplayPairingState['activeRecipe']>(displaySync.getState().activeRecipe);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(180); // 3 min default timer
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    const unsub = displaySync.subscribe((s) => {
      if (s.activeRecipe) setRecipe(s.activeRecipe);
    });
    return unsub;
  }, []);

  // Timer countdown hook
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Neural Band Gesture Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!recipe) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentStepIndex((prev) => (prev < recipe.steps.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === ' ' || e.key === 'Enter') {
        // Pinch toggles step timer
        setIsTimerRunning((prev) => !prev);
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recipe, onBack]);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!recipe) {
    return (
      <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none">
        <div className="my-auto text-center space-y-3">
          <Utensils className="w-8 h-8 text-purple-400 mx-auto" />
          <h3 className="text-sm font-black text-white uppercase">No Recipe Pushed Yet</h3>
          <p className="text-xs text-slate-400">Import a recipe from your phone using "Send to Glasses".</p>
        </div>
        <button onClick={onBack} className="text-xs text-purple-400 font-bold hover:underline cursor-pointer">
          ← Return to HUD
        </button>
      </div>
    );
  }

  const totalSteps = recipe.steps.length;
  const currentStepText = recipe.steps[currentStepIndex];

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[180px]">
            {recipe.title}
          </span>
        </div>
        <span className="text-[10px] text-purple-300 font-mono">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
      </div>

      {/* Main Step Card */}
      <div className="my-auto space-y-4 py-2">
        <div className="p-5 rounded-2xl bg-black border-2 border-[#8b5cf6] shadow-[0_0_25px_rgba(139,92,246,0.35)] ring-1 ring-[#8b5cf6]/50 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
              STEP {currentStepIndex + 1} INSTRUCTION
            </span>
            <div className="flex items-center gap-1">
              {recipe.steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStepIndex ? 'bg-[#8b5cf6] w-4' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm font-bold text-white leading-relaxed">{currentStepText}</p>

          {/* Cooking Step Timer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <Timer className={`w-4 h-4 ${isTimerRunning ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
              <span className={isTimerRunning ? 'text-purple-300' : 'text-slate-400'}>
                {formatTimer(timerSeconds)}
              </span>
            </div>

            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                isTimerRunning
                  ? 'bg-purple-900/40 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-purple-500'
              }`}
            >
              {isTimerRunning ? 'Pause Timer' : 'Pinch to Start Timer'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-purple-500/30 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <button onClick={onBack} className="hover:text-white cursor-pointer">← Back to HUD</button>
        <span className="text-[#8b5cf6]">Swipe → Next Step | Pinch Timer</span>
      </div>
    </div>
  );
}
