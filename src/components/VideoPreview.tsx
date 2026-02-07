"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { drawVideoFrame } from "@/lib/drawVideoFrame";
import type { AmplitudeCurve } from "@/lib/amplitudeCurve";
import { DEFAULT_LAYOUT } from "@/types";
import type { SubtitleSegment } from "@/types";
import type { BrandingTemplate } from "@/types";
import type { VideoLayout } from "@/types";

interface VideoPreviewProps {
  audioUrl: string;
  segments: SubtitleSegment[];
  branding: BrandingTemplate;
  amplitudeCurve?: AmplitudeCurve | null;
  onLayoutChange?: (layout: VideoLayout) => void;
  onDurationLoaded?: (duration: number) => void;
}

export default function VideoPreview({ audioUrl, segments, branding, amplitudeCurve, onLayoutChange, onDurationLoaded }: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  type DragTarget = "logo" | "title" | "waveform" | "subtitle" | "progressBar";
  const [dragging, setDragging] = useState<DragTarget | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const backgroundImgRef = useRef<HTMLImageElement | null>(null);
  const layoutRef = useRef<VideoLayout>(DEFAULT_LAYOUT);

  const width = 1920;
  const height = 1080;
  const layout: VideoLayout = { ...DEFAULT_LAYOUT, ...(branding.layout ?? {}) };
  layoutRef.current = layout;
  const logoScale = layout.logo.scale ?? 1;
  const logoSize = 120 * logoScale;

  useEffect(() => {
    if (!branding.logoUrl) {
      logoImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      logoImgRef.current = img;
    };
    img.onerror = () => {
      logoImgRef.current = null;
    };
    img.src = branding.logoUrl;
    return () => {
      logoImgRef.current = null;
    };
  }, [branding.logoUrl]);

  const [bgImageReady, setBgImageReady] = useState(0);
  useEffect(() => {
    if (!branding.videoBackgroundImageUrl) {
      backgroundImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      backgroundImgRef.current = img;
      setBgImageReady((n) => n + 1);
    };
    img.onerror = () => {
      backgroundImgRef.current = null;
    };
    img.src = branding.videoBackgroundImageUrl;
    return () => {
      backgroundImgRef.current = null;
    };
  }, [branding.videoBackgroundImageUrl]);

  const draw = useCallback(
    (time: number, dur?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      drawVideoFrame({
        ctx,
        width,
        height,
        time,
        duration: (dur ?? duration) || 1,
        branding,
        segments,
        logoImg: logoImgRef.current,
        backgroundImg: backgroundImgRef.current,
        amplitudeCurve: amplitudeCurve ?? undefined,
      });
    },
    [branding, segments, duration, amplitudeCurve]
  );

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    source.connect(ctx.destination);
    audioContextRef.current = ctx;
    audioSourceRef.current = source;

    const onLoaded = () => {
      const dur = audio.duration;
      setDuration(dur);
      onDurationLoaded?.(dur);
    };
    const onError = () => setError("Could not load audio");
    const onTimeUpdate = () => setCurrentTime(audio.currentTime ?? 0);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);

    if (audio.readyState >= 1) {
      onLoaded();
    }

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audioRef.current = null;
      audioContextRef.current = null;
      audioSourceRef.current = null;
      ctx.close();
    };
  }, [audioUrl, onDurationLoaded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !canvasRef.current || !duration) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const time = audio.currentTime ?? 0;
    setCurrentTime(time);
    drawVideoFrame({
      ctx,
      width,
      height,
      time,
      duration,
      branding,
      segments,
      logoImg: logoImgRef.current,
      backgroundImg: backgroundImgRef.current,
      amplitudeCurve: amplitudeCurve ?? undefined,
    });
  }, [branding, segments, duration, amplitudeCurve, bgImageReady]);

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;

    const audio = audioRef.current;
    let rafId: number;

    const animate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      draw(time, audio.duration);
      if (!audio.ended && !audio.paused) {
        rafId = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, draw]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    const ctx = audioContextRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        if (ctx?.state === "suspended") await ctx.resume();
        await audio.play();
        setIsPlaying(true);
      } catch {
        setError("Playback failed");
      }
    }
  }, [isPlaying]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    return { x: nx, y: ny };
  }, []);

  const hitTest = useCallback(
    (nx: number, ny: number): DragTarget | null => {
      if (!branding.logoUrl) {
        // No logo – skip logo hit test so we don't drag empty space
      } else {
        const logoW = logoSize / width;
        const logoH = logoSize / height;
        if (
          nx >= layout.logo.x &&
          nx <= layout.logo.x + logoW &&
          ny >= layout.logo.y &&
          ny <= layout.logo.y + logoH
        ) {
          return "logo";
        }
      }
      if (branding.titleVisible) {
        const titleY = layout.title.y;
        if (nx >= layout.title.x && nx <= layout.title.x + 0.35 && ny >= titleY - 0.04 && ny <= titleY + 0.04) {
          return "title";
        }
      }
      const wx = layout.waveform.centerX;
      const wy = layout.waveform.centerY;
      const waveformScale = layout.waveform?.scale ?? 1;
      const rx = (220 * waveformScale) / width;
      const ry = (220 * waveformScale) / height;
      if (((nx - wx) / rx) ** 2 + ((ny - wy) / ry) ** 2 <= 1) return "waveform";
      const subY = layout.subtitle.centerY;
      if (ny >= subY - 0.06 && ny <= subY + 0.06) return "subtitle";
      const barY = layout.progressBar.y;
      if (ny >= barY - 0.02 && ny <= barY + 0.02) return "progressBar";
      return null;
    },
    [layout, branding.logoUrl, branding.titleVisible, branding.progressBarVisible]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current || !onLayoutChange) return;
      const { x: nx, y: ny } = getCanvasCoords(e, containerRef.current);
      const hit = hitTest(nx, ny);
      if (hit) {
        e.preventDefault();
        setDragging(hit);
      }
    },
    [getCanvasCoords, hitTest, onLayoutChange]
  );

  useEffect(() => {
    if (!dragging || !onLayoutChange || !containerRef.current) return;

    let rafId: number | null = null;
    let pending: { x: number; y: number } | null = null;

    const flush = () => {
      if (pending === null) return;
      const { x: clampedX, y: clampedY } = pending;
      pending = null;
      const latest = layoutRef.current;
      if (dragging === "logo") {
        const logoW = logoSize / width;
        const logoH = logoSize / height;
        const x = Math.max(0, Math.min(1 - logoW, clampedX));
        const y = Math.max(0, Math.min(1 - logoH, clampedY));
        onLayoutChange({ ...latest, logo: { x, y } });
      } else if (dragging === "title") {
        onLayoutChange({ ...latest, title: { x: clampedX, y: clampedY } });
      } else if (dragging === "waveform") {
        onLayoutChange({ ...latest, waveform: { ...latest.waveform, centerX: clampedX, centerY: clampedY } });
      } else if (dragging === "subtitle") {
        onLayoutChange({ ...latest, subtitle: { centerY: clampedY } });
      } else if (dragging === "progressBar") {
        onLayoutChange({ ...latest, progressBar: { y: clampedY } });
      }
    };

    const onMove = (e: MouseEvent) => {
      const { x, y } = getCanvasCoords(e, containerRef.current!);
      pending = {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      };
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          flush();
        });
      }
    };
    const onUp = () => {
      setDragging(null);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (pending !== null) flush();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [dragging, layout, onLayoutChange, getCanvasCoords]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragging) return;
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, x / rect.width));
      const time = fraction * duration;
      audio.currentTime = time;
      setCurrentTime(time);
      draw(time, duration);
    },
    [duration, draw, dragging]
  );

  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    setExporting(true);
    setError(null);
    setExportProgress(0);

    const FPS = 30;
    const totalFrames = Math.ceil(duration * FPS);

    try {
      setExportProgress(2);
      const ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setExportProgress(5);
      const audioData = await fetchFile(audioUrl);
      await ffmpeg.writeFile("audio.mp3", audioData);

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = width;
      exportCanvas.height = height;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      for (let i = 0; i < totalFrames; i++) {
        const time = i / FPS;
        drawVideoFrame({
          ctx,
          width,
          height,
          time,
          duration,
          branding,
          segments,
          logoImg: logoImgRef.current,
          backgroundImg: backgroundImgRef.current,
          amplitudeCurve: amplitudeCurve ?? undefined,
        });

        const blob = await new Promise<Blob>((resolve, reject) => {
          exportCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.92);
        });
        const buffer = await blob.arrayBuffer();
        const name = `f${String(i).padStart(6, "0")}.jpg`;
        await ffmpeg.writeFile(name, new Uint8Array(buffer));

        const pct = 5 + (i / totalFrames) * 75;
        setExportProgress(pct);

        if (i % 30 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      setExportProgress(82);
      await ffmpeg.exec([
        "-framerate",
        String(FPS),
        "-i",
        "f%06d.jpg",
        "-i",
        "audio.mp3",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "output.mp4",
      ]);

      setExportProgress(95);
      const outData = await ffmpeg.readFile("output.mp4");
      const outBlob = new Blob([outData], { type: "video/mp4" });
      const url = URL.createObjectURL(outBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `podcast-video-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      for (let i = 0; i < totalFrames; i++) {
        try {
          await ffmpeg.deleteFile(`f${String(i).padStart(6, "0")}.jpg`);
        } catch {
          /* ignore */
        }
      }
      try {
        await ffmpeg.deleteFile("audio.mp3");
        await ffmpeg.deleteFile("output.mp4");
      } catch {
        /* ignore */
      }

      setExportProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [duration, branding, segments, amplitudeCurve]);

  const durationMinutes = duration > 0 ? duration / 60 : 0;
  const exportMin = durationMinutes <= 0 ? 0 : Math.max(1, Math.round(durationMinutes * 0.6));
  const exportMax = durationMinutes <= 0 ? 0 : Math.min(60, Math.round(durationMinutes * 2));

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">
        <p>
          {branding.logoUrl
            ? "Preview (same as export). Drag the logo, waveform, title, or subtitle to reposition."
            : "Preview (same as export). Add a logo in Branding settings below, then drag any element to reposition."}
          {" "}
          Use the progress bar to scrub through the video.
        </p>
      </div>
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-800 mb-2">Export runs locally and can take a while — keep this tab open.</p>
        <p className="text-xs text-slate-600 mb-2">Rough guide:</p>
        <ul className="text-xs text-slate-600 space-y-0.5 mb-2">
          <li><strong className="text-slate-700">5 min</strong> audio → about <strong>3–8 min</strong> export</li>
          <li><strong className="text-slate-700">30 min</strong> audio → about <strong>15–45 min</strong> export</li>
          <li><strong className="text-slate-700">Up to 1 h</strong> audio → <strong>up to ~1 h</strong> export</li>
        </ul>
        {duration > 0 && (
          <p className="text-xs text-slate-700">
            For this audio ({formatTime(duration)}): about <strong>{exportMin}–{exportMax} min</strong>.
          </p>
        )}
      </div>
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden bg-black border border-slate-200 shadow-md"
        style={{
          maxWidth: "100%",
          aspectRatio: `${width} / ${height}`,
        }}
        onPointerDown={handlePointerDown}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`w-full h-full object-contain ${onLayoutChange ? "cursor-move" : "cursor-pointer"}`}
          onClick={handleSeek}
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 pt-4 bg-gradient-to-t from-black/90 to-transparent">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={duration > 0 ? currentTime : 0}
            onInput={(e) => {
              const t = parseFloat((e.target as HTMLInputElement).value);
              setCurrentTime(t);
              if (audioRef.current && duration > 0) {
                audioRef.current.currentTime = t;
                draw(t, duration);
              }
            }}
            className="w-full h-2 rounded-full bg-zinc-700/80 cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-indigo-400 [&::-webkit-slider-thumb]:transition-colors [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(63 63 70 / 0.8) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(63 63 70 / 0.8) 100%)`,
            }}
          />
          <div className="flex items-center justify-between mt-2 gap-4">
            <span className="text-xs text-slate-600 font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                disabled={exporting}
                className="px-5 py-2 rounded-xl bg-slate-900 text-slate-50 text-sm font-medium shadow-lg hover:bg-black disabled:opacity-50"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-medium shadow-lg disabled:opacity-50"
              >
                {exporting ? `Exporting ${Math.round(exportProgress)}%` : "Download MP4"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {exporting && (
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-[width] duration-300"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
