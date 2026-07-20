/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Utensils, Timer, Check, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { displaySync, DisplayPairingState } from './displaySync';

interface GlassesRecipeCompanionProps {
  onBack: () => void;
}

export default function GlassesRecipeCompanion({ onBack }: GlassesRecipeCompanionProps) {
  const [recipe, setRecipe] = useState<DisplayPairingState['activeRecipe']>(displaySync.getState().activeRecipe);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(180);

  useEffect(() => {
    const unsub = displaySync.subscribe((s) => {
      if (s.activeRecipe) setRecipe(s.activeRecipe);
    });
    return unsub;
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  // Neural Band Gesture Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (recipe && currentStepIndex < recipe.steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        setTimerActive((prev) => !prev);
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, recipe, onBack]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!recipe) {
    return (
      <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none">
        <div className="my-auto text-center space-y-2">
          <Utensils className="w-8 h-8 text-purple-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Active Recipe</h3>
          <p className="text-xs text-slate-400">Select and send a recipe from your phone to view steps here!</p>
        </div>
        <button onClick={onBack} className="text-xs text-[#8b5cf6] font-bold">← Back to HUD</button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[180px]">
            {recipe.title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-purple-300">
          <span>{recipe.prepTime}</span>
          <span className="bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
            Step {currentStepIndex + 1}/{recipe.steps.length}
          </span>
        </div>
      </div>

      {/* Main Step Card */}
      <div className="my-auto space-y-3">
        <div className="p-4 rounded-2xl bg-black border-2 border-[#8b5cf6] space-y-3 shadow-[0_0_25px_rgba(139,92,246,0.35)] min-h-[160px] flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] font-mono text-purple-300">
            <span>INSTRUCTION STEP {currentStepIndex + 1}</span>
            <span className="text-slate-400">Swipe → Next</span>
          </div>

          <p className="text-sm font-bold text-white leading-relaxed">
            {recipe.steps[currentStepIndex]}
          </p>

          <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">Ingredients:</span>
            <span className="text-[10px] font-bold text-purple-200 truncate max-w-[180px]">
              {recipe.ingredients.slice(0, 3).join(', ')}...
            </span>
          </div>
        </div>

        {/* Step Timer Controller */}
        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${timerActive ? 'text-emerald-400 animate-spin' : 'text-purple-400'}`} />
            <div>
              <span className="text-xs font-mono font-black text-white">{formatTimer(timerSeconds)}</span>
              <p className="text-[8px] text-slate-400 uppercase font-mono">Step Timer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimerActive(!timerActive)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                timerActive ? 'bg-amber-600 text-white' : 'bg-[#8b5cf6] text-white'
              }`}
            >
              {timerActive ? 'Pause' : 'Pinch Start'}
            </button>
            <button
              onClick={() => {
                setTimerActive(false);
                setTimerSeconds(180);
              }}
              className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-purple-500/30 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <button onClick={onBack} className="hover:text-white cursor-pointer">← Back to HUD</button>
        <span>Swipe ← Previous Step</span>
      </div>
    </div>
  );
}
