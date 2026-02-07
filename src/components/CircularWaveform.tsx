"use client";

import { useEffect, useRef, useState } from "react";

function drawCircularWaveform(
  ctx: CanvasRenderingContext2D,
  size: number,
  peaks: Float32Array,
  progress: number,
  color: string
) {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = 40;
  const maxBarW = 48;
  const barCount = peaks.length;

  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const isActive = i < progress * barCount;
    const amp = peaks[i] ?? 0;
    const barLen = innerR + maxBarW * amp;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = isActive ? color : color + "40";
    ctx.fillRect(innerR, -1.5, barLen - innerR, 3);
    ctx.restore();
  }
}

interface CircularWaveformProps {
  audioUrl: string;
  color?: string;
}

export default function CircularWaveform({ audioUrl, color = "#6366f1" }: CircularWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const peaksRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;

    setError(null);
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const size = 140;
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = size * dpr;
    canvasRef.current.height = size * dpr;
    canvasRef.current.style.width = `${size}px`;
    canvasRef.current.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(audioUrl);
        const buf = await res.arrayBuffer();
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(buf);
        if (cancelled) return;

        const channel = decoded.getChannelData(0);
        const len = channel.length;
        const blockSize = Math.floor(len / 120);
        const peaks = new Float32Array(120);
        for (let i = 0; i < 120; i++) {
          let sum = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize && start + j < len; j++) {
            sum += Math.abs(channel[start + j]);
          }
          peaks[i] = blockSize > 0 ? sum / blockSize : 0;
        }
        const max = Math.max(...Array.from(peaks), 0.001);
        for (let i = 0; i < peaks.length; i++) {
          peaks[i] /= max;
        }
        peaksRef.current = peaks;
        setDuration(decoded.duration);
        drawCircularWaveform(ctx, size, peaks, 0, color);
      } catch (e) {
        if (!cancelled) setError("Could not load waveform");
      }
    };

    load();
    return () => {
      cancelled = true;
      peaksRef.current = null;
    };
  }, [audioUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const peaks = peaksRef.current;
    if (!canvas || !peaks) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 140;
    drawCircularWaveform(ctx, size, peaks, 0, color);
  }, [color]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-full p-1 ring-1 ring-slate-200 bg-slate-100">
        <canvas
          ref={canvasRef}
          className="rounded-full"
          style={{ width: 140, height: 140 }}
        />
      </div>
      {error && <p className="text-sm text-amber-500">{error}</p>}
    </div>
  );
}
