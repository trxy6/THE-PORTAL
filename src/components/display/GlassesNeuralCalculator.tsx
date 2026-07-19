/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calculator, Delete, RotateCcw } from 'lucide-react';

interface GlassesNeuralCalculatorProps {
  onBack: () => void;
}

const CALCULATOR_GRID = [
  ['C', 'DEL', '/', '*'],
  ['7', '8', '9', '-'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '='],
  ['0', '.', 'AC', '=']
];

export default function GlassesNeuralCalculator({ onBack }: GlassesNeuralCalculatorProps) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [row, setRow] = useState<number>(1);
  const [col, setCol] = useState<number>(0);

  // Neural Band Gesture Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setRow((r) => (r > 0 ? r - 1 : CALCULATOR_GRID.length - 1));
      } else if (e.key === 'ArrowDown') {
        setRow((r) => (r < CALCULATOR_GRID.length - 1 ? r + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setCol((c) => (c > 0 ? c - 1 : CALCULATOR_GRID[0].length - 1));
      } else if (e.key === 'ArrowRight') {
        setCol((c) => (c < CALCULATOR_GRID[0].length - 1 ? c + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        const key = CALCULATOR_GRID[row][col];
        handlePressKey(key);
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [row, col, displayValue, onBack]);

  const handlePressKey = (key: string) => {
    if (key === 'C' || key === 'AC') {
      setDisplayValue('0');
    } else if (key === 'DEL') {
      setDisplayValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (key === '=') {
      try {
        // Safe math evaluation
        const sanitized = displayValue.replace(/[^0-9+\-*/.]/g, '');
        const res = Function(`"use strict"; return (${sanitized})`)();
        setDisplayValue(String(res));
      } catch (err) {
        setDisplayValue('Error');
      }
    } else {
      setDisplayValue((prev) => (prev === '0' || prev === 'Error' ? key : prev + key));
    }
  };

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white">Neural Calculator</span>
        </div>
        <span className="text-[10px] text-purple-300 font-mono">Grid Pinch Control</span>
      </div>

      {/* Screen & Grid */}
      <div className="my-auto space-y-3 py-1 max-w-xs mx-auto w-full">
        {/* Display Screen */}
        <div className="p-3.5 rounded-xl bg-black border-2 border-[#8b5cf6] shadow-[0_0_20px_rgba(139,92,246,0.3)] text-right font-mono">
          <span className="text-[9px] text-slate-500 block uppercase">Result</span>
          <span className="text-xl font-black text-white tracking-wider truncate block">{displayValue}</span>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {CALCULATOR_GRID.map((rItems, rIdx) =>
            rItems.map((cell, cIdx) => {
              const isSelected = rIdx === row && cIdx === col;
              const isOperator = ['/', '*', '-', '+', '='].includes(cell);
              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => {
                    setRow(rIdx);
                    setCol(cIdx);
                    handlePressKey(cell);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-black font-mono transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-purple-950/60 border-2 border-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] ring-1 ring-[#8b5cf6]'
                      : isOperator
                      ? 'bg-purple-900/30 border border-purple-500/30 text-purple-300'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-200'
                  }`}
                >
                  {cell}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-purple-500/30 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <button onClick={onBack} className="hover:text-white cursor-pointer">← Back to HUD</button>
        <span className="text-[#8b5cf6]">Swipe 4-Dir | Pinch Input</span>
      </div>
    </div>
  );
}
