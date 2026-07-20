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
  ['0', '.', '00', 'AC']
];

export default function GlassesNeuralCalculator({ onBack }: GlassesNeuralCalculatorProps) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedCol, setSelectedCol] = useState<number>(0);

  // Neural Band Gesture Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setSelectedRow((prev) => (prev > 0 ? prev - 1 : CALCULATOR_GRID.length - 1));
      } else if (e.key === 'ArrowDown') {
        setSelectedRow((prev) => (prev < CALCULATOR_GRID.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setSelectedCol((prev) => (prev > 0 ? prev - 1 : CALCULATOR_GRID[0].length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedCol((prev) => (prev < CALCULATOR_GRID[0].length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        handleButtonPress(CALCULATOR_GRID[selectedRow][selectedCol]);
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRow, selectedCol, displayValue, onBack]);

  const handleButtonPress = (val: string) => {
    if (val === 'C' || val === 'AC') {
      setDisplayValue('0');
    } else if (val === 'DEL') {
      setDisplayValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === '=') {
      try {
        const cleanExpr = displayValue.replace(/×/g, '*').replace(/÷/g, '/');
        // Evaluate simple arithmetic safely
        const result = Function(`'use strict'; return (${cleanExpr})`)();
        setDisplayValue(String(result));
      } catch (err) {
        setDisplayValue('Error');
      }
    } else {
      setDisplayValue((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
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
        <span className="text-[9px] text-purple-300 font-mono">Hands-Free Grid</span>
      </div>

      {/* Calculator Display Screen */}
      <div className="my-auto space-y-2">
        <div className="p-3.5 rounded-2xl bg-black border-2 border-[#8b5cf6] text-right shadow-[0_0_20px_rgba(139,92,246,0.3)]">
          <div className="text-[9px] font-mono text-purple-300">CALC OUTPUT</div>
          <div className="text-xl font-black font-mono text-white truncate tracking-wider">
            {displayValue}
          </div>
        </div>

        {/* 5x4 Grid */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {CALCULATOR_GRID.map((row, rIdx) =>
            row.map((btn, cIdx) => {
              const isSelected = rIdx === selectedRow && cIdx === selectedCol;
              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => {
                    setSelectedRow(rIdx);
                    setSelectedCol(cIdx);
                    handleButtonPress(btn);
                  }}
                  className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-[#8b5cf6] bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.6)] ring-2 ring-[#8b5cf6]'
                      : 'border-slate-800 bg-black text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {btn}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-purple-500/30 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <button onClick={onBack} className="hover:text-white cursor-pointer">← Back to HUD</button>
        <span>Swipe Directions | Pinch Select</span>
      </div>
    </div>
  );
}
