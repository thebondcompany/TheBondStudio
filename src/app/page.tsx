"use client";

import { useEffect, useState } from "react";
import AudioUploader from "@/components/AudioUploader";
import BrandingEditor from "@/components/BrandingEditor";
import VideoPreview from "@/components/VideoPreview";
import TranscriptEditor from "@/components/TranscriptEditor";
import InfoTooltip from "@/components/InfoTooltip";
import { computeAmplitudeCurve } from "@/lib/amplitudeCurve";
import { DEFAULT_BRANDING } from "@/types";
import type { BrandingTemplate } from "@/types";
import type { SubtitleSegment } from "@/types";

import type { AmplitudeCurve } from "@/lib/amplitudeCurve";

import Image from 'next/image'
import logo from './logo.png'
import defaultBg from './defaultbg.png'

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [amplitudeCurve, setAmplitudeCurve] = useState<AmplitudeCurve | null>(null);
  const [branding, setBranding] = useState<BrandingTemplate>(() => ({
    ...DEFAULT_BRANDING,
    logoUrl: null,
    waveformColor: "#ffffff",
    videoBackgroundImageUrl: defaultBg.src,
    videoBackgroundBlur: 4,
    videoBackgroundOverlay: 70,
    waveformStyle: "bars",
    subtitleStyle: {
      ...DEFAULT_BRANDING.subtitleStyle,
      highlightColor: "#fbca04",
    },
  }));
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState<string | null>(null);
  const [transcribePercent, setTranscribePercent] = useState<number>(0);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [useSmallModel, setUseSmallModel] = useState(false);

  useEffect(() => {
    if (!audioUrl || isTranscribing) {
      if (!audioUrl) setAmplitudeCurve(null);
      return;
    }
    let cancelled = false;
    computeAmplitudeCurve(audioUrl, 30)
      .then((curve) => {
        if (!cancelled) setAmplitudeCurve(curve);
      })
      .catch(() => {
        if (!cancelled) setAmplitudeCurve(null);
      });
    return () => {
      cancelled = true;
    };
  }, [audioUrl, isTranscribing]);

  const handleFileSelect = (file: File) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setSegments([]);
    setTranscribeError(null);
  };

  async function handleTranscribe() {
    if (!audioUrl) return;

    setIsTranscribing(true);
    setTranscribeError(null);
    setTranscribeProgress("Starting...");
    setTranscribePercent(0);
    setAmplitudeCurve(null);

    let durationSeconds: number | undefined;
    try {
      durationSeconds = await new Promise<number>((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => reject(new Error("Could not load audio"));
      });
    } catch {
      durationSeconds = undefined;
    }

    try {
      const { transcribeAudio } = await import("@/lib/transcribeClient");
      const { segments: nextSegments } = await transcribeAudio(audioUrl, {
        durationSeconds,
        useSmallModel,
        onProgress: (p) => {
          setTranscribeProgress(p.label);
          setTranscribePercent(p.percent);
        },
      });
      setSegments(nextSegments);
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTranscribing(false);
      setTranscribeProgress(null);
      setTranscribePercent(0);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 md:py-12 app-shell">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="space-y-3 pb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center p-1 justify-center">
                <Image
                  src={logo}
                  alt="App logo"
                  className="h-24 w-24 object-contain"
                />
              </div>
              <div>
                <h1 className="text-[22px] md:text-[28px] font-semibold tracking-tight text-slate-900">
                  Audio → Video Studio
                </h1>
                <p className="text-[14px] font-semibold uppercase tracking-[0.05em] text-slate-500 ">
                  PODCAST TO YOUTUBE‑READY VIDEO
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm md:text-[15px] text-slate-600 max-w-2xl leading-relaxed">
            Drop in an episode, fine‑tune your branding, and export a clean, ready‑to‑upload video — all in one place.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                1. Upload Audio
              </h2>
              <InfoTooltip label="Audio upload help">
                Supports MP3, WAV, or M4A. For best transcription and waveform quality, use high‑bitrate audio without heavy compression.
              </InfoTooltip>
            </div>
            <AudioUploader
              onFileSelect={handleFileSelect}
              isProcessing={isTranscribing}
              fileName={audioFile?.name ?? null}
            />
          </section>

          {audioUrl && (
            <section className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  
                  <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                    2. Subtitles
                  </h2>
                </div>
                <InfoTooltip label="Transcription help">
                  Generate a local Whisper transcription. Higher‑accuracy mode improves results on difficult audio but is slower.
                </InfoTooltip>
              </div>
              <div className="space-y-5 mb-3 mt-4">
                <div className="flex flex-col gap-2">
                    
                    <button
                      onClick={handleTranscribe}
                      disabled={isTranscribing}
                      className="mb-0 px-5 py-2.5 rounded-xl bg-slate-900 text-slate-50 font-medium transition-colors w-fit disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-black"
                    >
                      {isTranscribing
                        ? "Transcribing..."
                        : "Generate Subtitles (With Whisper AI)"}
                    </button>
                    <label className="mt-0 flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSmallModel}
                        onChange={(e) => setUseSmallModel(e.target.checked)}
                        disabled={isTranscribing}
                          className="ms-2 rounded border-slate-300 bg-white text-slate-900 focus:ring-slate-900"
                        />
                        Higher accuracy (Whisper small, slower)
                    </label>
                    {isTranscribing && transcribeProgress && (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">
                          {transcribeProgress}
                          {transcribePercent > 0 && transcribePercent < 100 && (
                            <span className="text-slate-800 font-medium ml-1">
                              ({transcribePercent}%)
                            </span>
                          )}
                        </p>
                        <div className="h-2 w-full max-w-sm rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-slate-900 rounded-full transition-[width] duration-300"
                            style={{ width: `${transcribePercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {transcribeError && (
                  <p className="text-sm text-red-500">{transcribeError}</p>
                )}
                {segments.length > 0 && (
                  <div className="space-y-4">
                    <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
                      {segments.length} subtitle segment{segments.length !== 1 ? "s" : ""} generated
                    </div>
                    <TranscriptEditor
                      segments={segments}
                      onChange={setSegments}
                      audioDuration={audioDuration}
                    />
                  </div>
                )}
              
            </section>
          )}
        </div>

        {audioUrl && (
          <>
            <section className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                  3. Preview &amp; Export Video
                </h2>
                <InfoTooltip label="Preview controls">
                  The preview canvas is fully interactive. Drag elements to adjust layout, scrub with the slider, then export when you are happy with the framing.
                </InfoTooltip>
              </div>
              <div className="space-y-4">
                <VideoPreview
                  audioUrl={audioUrl}
                  segments={segments}
                  branding={branding}
                  amplitudeCurve={amplitudeCurve}
                  onLayoutChange={(layout) => setBranding((b) => ({ ...b, layout }))}
                  onDurationLoaded={setAudioDuration}
                />
              </div>
            </section>

            <section className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                  4. Branding &amp; Video Settings
                </h2>
                <InfoTooltip label="Branding help">
                  Adjust your podcast title, logo, subtitles, waveform, and background so exported videos match your channel branding.
                </InfoTooltip>
              </div>
              <BrandingEditor branding={branding} onChange={setBranding} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
