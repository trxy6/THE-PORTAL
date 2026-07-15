import { useEffect, useId, useRef, useState } from 'react';
import DiceBox from '@3d-dice/dice-box';

export default function LocalDiceBox() {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const canvasId = `local-dice-${rawId}`;
  const containerId = `local-dice-container-${rawId}`;
  const box = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [sides, setSides] = useState(20);
  const [count, setCount] = useState(1);
  const [result, setResult] = useState('Loading local dice…');

  useEffect(() => {
    const dice = new DiceBox({ id: canvasId, container: `#${containerId}`, assetPath: '/assets/', theme: 'default', themeColor: '#6f4c86', scale: 5, enableShadows: true, offscreen: false });
    dice.onRollComplete = (roll: any) => {
      const values = (Array.isArray(roll) ? roll : Object.values(roll || {})).map((d: any) => d.value ?? d.result).filter((v: unknown) => v !== undefined);
      setResult(values.length > 1 ? `${values.join(' + ')} = ${values.reduce((a: number, b: number) => a + b, 0)}` : `Rolled ${values[0] ?? '—'}`);
    };
    dice.init().then(() => { box.current = dice; setReady(true); setResult('Ready'); }).catch(() => setResult('Could not load local dice'));
    return () => dice.clear?.();
  }, [canvasId, containerId]);

  const roll = () => { if (ready) { setResult('Rolling…'); box.current.roll(`${count}d${sides}`); } };
  return <section className="card p-5 bg-[#130924]/85 border border-[#3b1e60]/80 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl w-full flex flex-col items-center">
    <div id={containerId} className="relative w-[240px] h-[240px] rounded-full border border-[#cf4fe6]/20 bg-black/35 overflow-hidden"><canvas id={canvasId} width="240" height="240" className="absolute inset-0 w-full h-full rounded-full cursor-pointer z-10" onClick={roll} /></div>
    <div className="mt-3 text-xs font-mono font-bold text-[#faebd7]">{result}</div>
    <div className="mt-3 flex gap-2 w-full"><select value={sides} onChange={e => setSides(Number(e.target.value))} className="flex-1 bg-black/40 border border-[#3d2766]/50 rounded-lg px-2 text-xs text-white">{[4,6,8,10,12,20,100].map(n => <option key={n} value={n}>d{n}</option>)}</select><button onClick={roll} className="px-4 py-2 rounded-lg bg-[#6f4c86] text-white text-xs font-bold">Roll dice</button><button onClick={() => setCount(Math.min(6, count + 1))} className="px-4 py-2 rounded-lg bg-black/40 border border-[#3d2766]/50 text-white text-xs font-bold">Add die</button></div>
  </section>;
}
