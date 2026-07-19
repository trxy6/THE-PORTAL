/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Glasses, CheckCircle2, ShieldCheck, Zap, ArrowRight, X, KeyRound, Radio } from 'lucide-react';
import { displaySync, DisplayPairingState } from '../../lib/displaySync';
import PortalDisplayHUD from './PortalDisplayHUD';

interface DisplayModeLandingProps {
  onClose?: () => void;
}

export default function DisplayModeLanding({ onClose }: DisplayModeLandingProps) {
  const [mode, setMode] = useState<'selection' | 'phone' | 'glasses'>('selection');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [pairingState, setPairingState] = useState<DisplayPairingState>(displaySync.getState());
  const [pinInput, setPinInput] = useState<string>('');
  const [pairError, setPairError] = useState<string>('');
  const [pairSuccess, setPairSuccess] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = displaySync.subscribe((s) => {
      setPairingState(s);
    });
    return unsubscribe;
  }, []);

  // Neural Band Gesture Listener for Selection Screen
  useEffect(() => {
    if (mode !== 'selection') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setSelectedIndex(0);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setSelectedIndex(1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (selectedIndex === 0) {
          setMode('phone');
        } else {
          setMode('glasses');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedIndex]);

  const handlePairSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPairError('');
    const success = displaySync.pairWithPin(pinInput || pairingState.pin);
    if (success) {
      setPairSuccess(true);
      setTimeout(() => setPairSuccess(false), 3000);
    } else {
      setPairError('Invalid pairing PIN. Check the code displayed on your glasses.');
    }
  };

  if (mode === 'glasses' || (pairingState.isPaired && mode === 'glasses')) {
    return <PortalDisplayHUD onExit={() => setMode('selection')} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl text-white flex flex-col justify-between p-6 select-none font-sans overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-purple-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-900/40 border border-purple-500/60 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Glasses className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
              Portal Display Mode
              <span className="text-[10px] bg-purple-600/30 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                META HUD v1.0
              </span>
            </h2>
            <p className="text-xs text-slate-400">Ray-Ban Display & Neural Band Ecosystem</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-purple-500 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode Selection */}
      {mode === 'selection' && (
        <div className="max-w-2xl mx-auto w-full my-auto space-y-6 text-center py-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Select Your Device Mode</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Neural Band swipe to navigate, pinch to select. Use your phone to sign in once to all services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Option 1: Phone */}
            <div
              onClick={() => setMode('phone')}
              onMouseEnter={() => setSelectedIndex(0)}
              className={`p-6 rounded-2xl bg-black border transition-all cursor-pointer text-left space-y-4 relative overflow-hidden group ${
                selectedIndex === 0
                  ? 'border-[#8b5cf6] shadow-[0_0_25px_rgba(139,92,246,0.45)] ring-2 ring-[#8b5cf6]/50 translate-y-[-2px]'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                {selectedIndex === 0 && (
                  <span className="text-[10px] bg-[#8b5cf6] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                    Pinch / Enter
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  📱 I am on my Phone
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Log in to YouTube, YouTube TV & PECOS. Type pairing PINs and push recipes or videos directly to glasses.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-purple-300 font-bold">
                <span>Configure & Connect</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Option 2: Glasses */}
            <div
              onClick={() => setMode('glasses')}
              onMouseEnter={() => setSelectedIndex(1)}
              className={`p-6 rounded-2xl bg-black border transition-all cursor-pointer text-left space-y-4 relative overflow-hidden group ${
                selectedIndex === 1
                  ? 'border-[#8b5cf6] shadow-[0_0_25px_rgba(139,92,246,0.45)] ring-2 ring-[#8b5cf6]/50 translate-y-[-2px]'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Glasses className="w-6 h-6" />
                </div>
                {selectedIndex === 1 && (
                  <span className="text-[10px] bg-[#8b5cf6] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                    Pinch / Enter
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  👓 I am on my Glasses
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Pure black high-contrast HUD optimized for Ray-Ban Display. Hands-free Neural Band controls only.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-purple-300 font-bold">
                <span>Launch Glasses HUD</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode: Phone Setup & Pairing Hub */}
      {mode === 'phone' && (
        <div className="max-w-xl mx-auto w-full my-auto space-y-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMode('selection')}
              className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1"
            >
              ← Back to mode selection
            </button>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> Realtime Sync Active
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> Phone Pre-Authentication Dashboard
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Log in once on your phone. All credentials and sessions automatically sync to your Ray-Ban Display without typing on the glasses.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="font-bold flex items-center gap-2">
                  🔴 YouTube & YouTube TV Account
                </span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="font-bold flex items-center gap-2">
                  🤖 PECOS AI Assistant Session
                </span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              </div>
            </div>
          </div>

          {/* Pairing Input */}
          <div className="p-5 rounded-2xl bg-black border border-[#8b5cf6] shadow-[0_0_20px_rgba(139,92,246,0.2)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-400" /> Pair Display Glasses
              </span>
              {pairingState.isPaired && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                   Glasses Connected
                </span>
              )}
            </div>

            <form onSubmit={handlePairSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Enter PIN e.g. ${pairingState.pin}`}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#8b5cf6]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg"
                >
                  Pair Device
                </button>
              </div>

              {pairError && <p className="text-[10px] text-rose-400 font-bold">{pairError}</p>}
              {pairSuccess && <p className="text-[10px] text-emerald-400 font-bold">Pairing successful! Glasses linked.</p>}
            </form>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Target Glasses Pairing PIN:</span>
              <span className="font-mono font-bold text-purple-300 text-sm tracking-widest">{pairingState.pin}</span>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setPinInput(pairingState.pin);
                  displaySync.pairWithPin(pairingState.pin);
                  setPairSuccess(true);
                }}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 underline cursor-pointer"
              >
                Auto-Pair Current PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer Guidance */}
      <div className="border-t border-slate-800 pt-3 text-center text-[10px] text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2">
        <span>Optical Display Mode: Pure Black Background `#000000` + White Text + Purple Active Trim</span>
        <span>Neural Band Protocol: Swipe (Scroll) | Pinch (Select) | Double Pinch (Back)</span>
      </div>
    </div>
  );
}
