/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Glasses, Tv, Utensils, Calculator, Gamepad2, Compass, Activity, CloudSun, Mic, ShieldCheck, X, Monitor, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Hand, CornerUpLeft } from 'lucide-react';
import { displaySync, DisplayPairingState } from '../../lib/displaySync';
import GlassesYouTube from './GlassesYouTube';
import GlassesRecipeCompanion from './GlassesRecipeCompanion';
import GlassesNeuralCalculator from './GlassesNeuralCalculator';
import GlassesNeuralGames from './GlassesNeuralGames';

interface PortalDisplayHUDProps {
  onExit?: () => void;
  isSimulator?: boolean;
}

const GLASSES_APPS = [
  { id: 'pecos', name: 'PECOS AI', icon: Mic, badge: 'Voice AI' },
  { id: 'youtube', name: 'YouTube TV', icon: Tv, badge: 'Live Stream' },
  { id: 'recipes', name: 'Recipes', icon: Utensils, badge: 'Step-by-Step' },
  { id: 'calculator', name: 'Calculator', icon: Calculator, badge: 'Neural Grid' },
  { id: 'games', name: 'Neural Games', icon: Gamepad2, badge: 'Band Arcade' },
  { id: 'navigation', name: 'Navigation', icon: Compass, badge: 'Turn-by-Turn' },
  { id: 'sports', name: 'Live Sports', icon: Activity, badge: 'Real Scores' },
  { id: 'weather', name: 'Weather', icon: CloudSun, badge: '72° Clear' },
];

export default function PortalDisplayHUD({ onExit, isSimulator = false }: PortalDisplayHUDProps) {
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [syncState, setSyncState] = useState<DisplayPairingState>(displaySync.getState());
  const [pecosListening, setPecosListening] = useState<boolean>(false);
  const [pecosResponse, setPecosResponse] = useState<string>('PECOS is active. Speak or pinch to ask.');

  useEffect(() => {
    const unsub = displaySync.subscribe((s) => setSyncState(s));
    return unsub;
  }, []);

  // Neural Band Gesture Listener for HUD Grid
  useEffect(() => {
    if (activeApp !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        dispatchGesture('up');
      } else if (e.key === 'ArrowDown') {
        dispatchGesture('down');
      } else if (e.key === 'ArrowLeft') {
        dispatchGesture('left');
      } else if (e.key === 'ArrowRight') {
        dispatchGesture('right');
      } else if (e.key === 'Enter' || e.key === ' ') {
        dispatchGesture('pinch');
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        dispatchGesture('back');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeApp, selectedIndex, onExit]);

  const dispatchGesture = (type: 'up' | 'down' | 'left' | 'right' | 'pinch' | 'back') => {
    if (activeApp !== null) {
      const simulatedKey =
        type === 'up'
          ? 'ArrowUp'
          : type === 'down'
          ? 'ArrowDown'
          : type === 'left'
          ? 'ArrowLeft'
          : type === 'right'
          ? 'ArrowRight'
          : type === 'pinch'
          ? 'Enter'
          : 'Escape';
      window.dispatchEvent(new KeyboardEvent('keydown', { key: simulatedKey }));
      return;
    }

    if (type === 'up') {
      setSelectedIndex((prev) => (prev >= 2 ? prev - 2 : prev));
    } else if (type === 'down') {
      setSelectedIndex((prev) => (prev + 2 < GLASSES_APPS.length ? prev + 2 : prev));
    } else if (type === 'left') {
      setSelectedIndex((prev) => (prev % 2 !== 0 ? prev - 1 : prev));
    } else if (type === 'right') {
      setSelectedIndex((prev) => (prev % 2 === 0 && prev + 1 < GLASSES_APPS.length ? prev + 1 : prev));
    } else if (type === 'pinch') {
      const app = GLASSES_APPS[selectedIndex];
      if (app.id === 'pecos') {
        triggerPecosVoice();
      } else {
        setActiveApp(app.id);
      }
    } else if (type === 'back') {
      if (onExit) onExit();
    }
  };

  const triggerPecosVoice = () => {
    setPecosListening(true);
    setPecosResponse('Listening to Neural Band & Mic...');
    setTimeout(() => {
      setPecosListening(false);
      setPecosResponse('PECOS: "Current sports scores updated. 3 recipes ready on glasses!"');
    }, 2000);
  };

  const renderActiveApp = () => {
    if (activeApp === 'youtube') {
      return <GlassesYouTube onBack={() => setActiveApp(null)} />;
    }
    if (activeApp === 'recipes') {
      return <GlassesRecipeCompanion onBack={() => setActiveApp(null)} />;
    }
    if (activeApp === 'calculator') {
      return <GlassesNeuralCalculator onBack={() => setActiveApp(null)} />;
    }
    if (activeApp === 'games') {
      return <GlassesNeuralGames onBack={() => setActiveApp(null)} />;
    }

    return (
      <div className="w-full h-full bg-black text-white flex flex-col justify-between p-4 font-sans select-none overflow-hidden">
        {/* Top Status Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Glasses className="w-4 h-4 text-purple-400" /> PORTAL HUD
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-purple-300">
            <span className="bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
              PIN: {syncState.pin}
            </span>
            {onExit && (
              <button onClick={onExit} className="hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* PECOS Assistant Quick Banner */}
        <div className="bg-purple-950/30 border border-purple-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs my-1 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <div className="flex items-center gap-2 overflow-hidden">
            <Mic className={`w-4 h-4 shrink-0 ${pecosListening ? 'text-rose-400 animate-bounce' : 'text-purple-400'}`} />
            <span className="text-[11px] font-bold text-slate-200 truncate">{pecosResponse}</span>
          </div>
          <button
            onClick={triggerPecosVoice}
            className="text-[9px] bg-[#8b5cf6] text-white px-2 py-1 rounded-md font-bold uppercase shrink-0 cursor-pointer"
          >
            {pecosListening ? 'Listening' : 'Pinch PECOS'}
          </button>
        </div>

        {/* Main Apps Grid (2 columns for 600x600 Display) */}
        <div className="my-auto space-y-2 py-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>Glass Apps Suite:</span>
            <span>Swipe (Scroll) | Pinch (Select)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {GLASSES_APPS.map((app, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = app.icon;
              return (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    if (app.id === 'pecos') triggerPecosVoice();
                    else setActiveApp(app.id);
                  }}
                  className={`p-3 rounded-xl bg-black border transition-all cursor-pointer flex flex-col justify-between h-24 relative overflow-hidden ${
                    isSelected
                      ? 'border-[#8b5cf6] bg-purple-950/30 shadow-[0_0_20px_rgba(139,92,246,0.4)] ring-2 ring-[#8b5cf6]'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#8b5cf6] text-white' : 'bg-purple-950/40 text-purple-400 border border-purple-500/30'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-mono font-bold uppercase text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded border border-purple-500/30">
                      {app.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-white">{app.name}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-purple-500/30 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Auth Synced via Phone
          </span>
          <span className="text-[#8b5cf6]">Ray-Ban Display OS</span>
        </div>
      </div>
    );
  };

  // If in Simulator mode, wrap in a desktop simulator frame with interactive band controls
  if (isSimulator) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white flex flex-col items-center justify-center p-4 font-sans select-none overflow-y-auto">
        <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-6">
          {/* Glasses Frame Viewport Container (600x600 display ratio) */}
          <div className="relative">
            <div className="w-[360px] h-[360px] md:w-[480px] md:h-[480px] bg-black border-4 border-[#8b5cf6] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.5)] ring-2 ring-[#8b5cf6]/50 relative">
              <div className="absolute top-2 right-3 z-50 bg-purple-600 text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                600x600 Ray-Ban Optics
              </div>
              {renderActiveApp()}
            </div>
          </div>

          {/* Desktop Neural Band Controller Dock */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-purple-500/40 space-y-4 max-w-xs w-full shadow-[0_0_30px_rgba(139,92,246,0.25)]">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-purple-400" /> Neural Band Dock
              </span>
              <span className="text-[9px] text-purple-300 font-mono font-bold">SIMULATOR</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Test gesture controls directly on your computer screen or use your keyboard arrow keys!
            </p>

            {/* D-Pad Directional Controls */}
            <div className="grid grid-cols-3 gap-2 py-1 max-w-[180px] mx-auto">
              <div />
              <button
                onClick={() => dispatchGesture('up')}
                className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/50 hover:bg-[#8b5cf6] text-white flex items-center justify-center cursor-pointer transition active:scale-95 shadow-md"
                title="Swipe Up"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onClick={() => dispatchGesture('left')}
                className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/50 hover:bg-[#8b5cf6] text-white flex items-center justify-center cursor-pointer transition active:scale-95 shadow-md"
                title="Swipe Left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => dispatchGesture('pinch')}
                className="p-3 rounded-xl bg-[#8b5cf6] hover:bg-purple-600 text-white font-black text-xs flex items-center justify-center cursor-pointer transition active:scale-95 shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                title="Pinch Select"
              >
                PINCH
              </button>
              <button
                onClick={() => dispatchGesture('right')}
                className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/50 hover:bg-[#8b5cf6] text-white flex items-center justify-center cursor-pointer transition active:scale-95 shadow-md"
                title="Swipe Right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div />
              <button
                onClick={() => dispatchGesture('down')}
                className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/50 hover:bg-[#8b5cf6] text-white flex items-center justify-center cursor-pointer transition active:scale-95 shadow-md"
                title="Swipe Down"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div />
            </div>

            {/* Back Gesture */}
            <button
              onClick={() => dispatchGesture('back')}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-500 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CornerUpLeft className="w-4 h-4 text-purple-400" /> Double Pinch (Back)
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="w-full py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[10px] font-bold text-rose-300 hover:bg-rose-900/60 transition cursor-pointer"
              >
                Exit Desktop Simulator
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return renderActiveApp();
}
