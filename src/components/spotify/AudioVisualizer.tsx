/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  color?: string;
  barCount?: number;
}

export default function AudioVisualizer({
  isPlaying,
  color = "#c5a059", // Gold Vibe
  barCount = 32,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const phasesRef = useRef<number[]>([]);

  // Initialize randomized speeds and heights for each bar
  useEffect(() => {
    phasesRef.current = Array.from({ length: barCount }, () => Math.random() * Math.PI * 2);
  }, [barCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-DPI canvas resolution
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let time = 0;

    const draw = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, w, h);

      const spacing = 4;
      const barWidth = (w - spacing * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        // Compute base oscillation
        const speed = isPlaying ? 0.08 + (i % 3) * 0.02 : 0.01;
        phasesRef.current[i] += speed;

        const phase = phasesRef.current[i];
        let amplitude = isPlaying ? 0.5 + Math.sin(phase) * 0.4 : 0.05 + Math.sin(phase) * 0.02;

        // Add some noise for higher natural fluctuation
        if (isPlaying) {
          amplitude += Math.sin(time * 0.05 + i) * 0.1;
        }

        amplitude = Math.max(0.02, Math.min(0.95, amplitude));

        const barHeight = h * amplitude;
        const x = i * (barWidth + spacing);
        const y = h - barHeight;

        // Render sleek rounded bar gradients
        const gradient = ctx.createLinearGradient(x, y, x, h);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.02)");

        ctx.fillStyle = gradient;
        
        // Draw rounded rectangle
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      time += 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [isPlaying, color, barCount]);

  return (
    <div id="visualizer-container" className="w-full h-full min-h-[64px] bg-[#050505]/60 rounded-xl p-3 border border-white/5 backdrop-blur-sm overflow-hidden flex items-end">
      <canvas
        id="visualizer-canvas"
        ref={canvasRef}
        className="w-full h-full block opacity-85 transition-opacity duration-300 hover:opacity-100"
      />
    </div>
  );
}
