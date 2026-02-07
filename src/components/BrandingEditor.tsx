"use client";

import {
  DEFAULT_BRANDING,
  DEFAULT_LAYOUT,
  DEFAULT_TITLE_STYLE,
  type BrandingTemplate,
  type SubtitleStyle,
  type TitleStyle,
  type VideoLayout,
  type WaveformStyle,
} from "@/types";
import InfoTooltip from "@/components/InfoTooltip";

interface BrandingEditorProps {
  branding: BrandingTemplate;
  onChange: (branding: BrandingTemplate) => void;
}

export default function BrandingEditor({ branding, onChange }: BrandingEditorProps) {
  const handleChange = (field: keyof BrandingTemplate, value: string | null) => {
    onChange({ ...branding, [field]: value });
  };

  const titleStyle: TitleStyle = branding.titleStyle ?? DEFAULT_TITLE_STYLE;
  const subtitleStyle = branding.subtitleStyle ?? DEFAULT_BRANDING.subtitleStyle;
  const handleSubtitleStyle = (field: keyof SubtitleStyle, value: string | number) => {
    onChange({
      ...branding,
      subtitleStyle: { ...subtitleStyle, [field]: value },
    });
  };

  const layout = branding.layout ?? DEFAULT_LAYOUT;
  const logoLayout = layout.logo ?? DEFAULT_LAYOUT.logo;
  const waveformLayout = layout.waveform ?? DEFAULT_LAYOUT.waveform;
  const handleLayoutLogo = (updates: Partial<VideoLayout["logo"]>) => {
    onChange({
      ...branding,
      layout: { ...layout, logo: { ...logoLayout, ...updates } },
    });
  };
  const handleLayoutWaveform = (updates: Partial<VideoLayout["waveform"]>) => {
    onChange({
      ...branding,
      layout: { ...layout, waveform: { ...waveformLayout, ...updates } },
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => handleChange("logoUrl", reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">

        <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Podcast Title</label>
              <InfoTooltip label="Podcast title">
                This title appears inside the exported video. Use your show name or episode title so the video feels native to your channel.
              </InfoTooltip>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={!!branding.titleVisible}
                onChange={(e) => handleChange("titleVisible", e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-slate-900"
              />
              <span>Add title on video</span>
            </label>
          </div>
          <input
            type="text"
            value={branding.podcastName}
            onChange={(e) => handleChange("podcastName", e.target.value)}
            placeholder="My Podcast"
            className="input-field w-full"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Title style</h4>
          <InfoTooltip label="Title style">
            Fine‑tune how your show title appears in the frame. Keep it large and high‑contrast so it is readable on phones.
          </InfoTooltip>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
            <div className="flex gap-1">
              <input
                type="color"
                value={titleStyle.color ?? DEFAULT_TITLE_STYLE.color}
                onChange={(e) =>
                  onChange({
                    ...branding,
                    titleStyle: { ...titleStyle, color: e.target.value },
                  })
                }
                className="color-picker"
              />
              <input
                type="text"
                value={titleStyle.color ?? DEFAULT_TITLE_STYLE.color}
                onChange={(e) =>
                  onChange({
                    ...branding,
                    titleStyle: { ...titleStyle, color: e.target.value },
                  })
                }
                className="input-field flex-1 min-w-0 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Size</label>
            <input
              type="number"
              min={24}
              max={96}
              value={titleStyle.fontSize ?? DEFAULT_TITLE_STYLE.fontSize}
              onChange={(e) =>
                onChange({
                  ...branding,
                  titleStyle: {
                    ...titleStyle,
                    fontSize: Number(e.target.value) || DEFAULT_TITLE_STYLE.fontSize,
                  },
                })
              }
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Weight</label>
            <select
              value={titleStyle.fontWeight ?? DEFAULT_TITLE_STYLE.fontWeight}
              onChange={(e) =>
                onChange({
                  ...branding,
                  titleStyle: { ...titleStyle, fontWeight: Number(e.target.value) || 700 },
                })
              }
              className="select-combo w-full"
            >
              <option value={400}>Regular</option>
              <option value={600}>Semibold</option>
              <option value={700}>Bold</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-medium text-slate-600 mb-2">Logo</label>
          <InfoTooltip label="Logo">
            Upload a square or circular logo (at least 512×512px) for the sharpest result in your exported videos.
          </InfoTooltip>
        </div>
        <div className="flex items-center gap-3">
          {branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-900 file:text-white hover:file:bg-black"
          />
          {branding.logoUrl && (
            <button
              type="button"
              onClick={() => handleChange("logoUrl", null)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
        {branding.logoUrl && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Size</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={25}
                max={200}
                step={5}
                value={Math.round((logoLayout.scale ?? 1) * 100)}
                onChange={(e) => handleLayoutLogo({ scale: Number(e.target.value) / 100 })}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-slate-900"
              />
              <span className="text-xs text-zinc-500 tabular-nums w-12 text-right">
                {Math.round((logoLayout.scale ?? 1) * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Drag the logo in the preview to reposition.</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Subtitle style</h4>
          <InfoTooltip label="Subtitle style">
            Adjust readability and emphasis for subtitles. High contrast colors and a slightly heavier weight are easier to read on mobile.
          </InfoTooltip>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Font</label>
            <div className="space-y-1">
              <select
                value={subtitleStyle.font ?? "system-ui"}
                onChange={(e) => handleSubtitleStyle("font", e.target.value)}
                className="select-combo w-full"
              >
                <option value="system-ui">System UI</option>
                <option value="Georgia">Georgia</option>
                <option value="serif">Serif</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="'Times New Roman'">Times New Roman</option>
                <option value="Inter">Inter</option>
                <option value="'Open Sans'">Open Sans</option>
                <option value="Roboto">Roboto</option>
                <option value="Lato">Lato</option>
              </select>
              <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!subtitleStyle.uppercase}
                  onChange={(e) => handleSubtitleStyle("uppercase", e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-slate-900 focus:ring-slate-900"
                />
                <span>Uppercase subtitles</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Size</label>
            <input
              type="number"
              min={20}
              max={80}
              value={subtitleStyle.fontSize ?? 42}
              onChange={(e) => handleSubtitleStyle("fontSize", Number(e.target.value) || 42)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Font weight</label>
            <select
              value={subtitleStyle.fontWeight ?? 400}
              onChange={(e) => handleSubtitleStyle("fontWeight", Number(e.target.value) || 400)}
              className="select-combo w-full"
            >
              <option value={300}>Light (300)</option>
              <option value={400}>Regular (400)</option>
              <option value={500}>Medium (500)</option>
              <option value={600}>Semibold (600)</option>
              <option value={700}>Bold (700)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
            <div className="flex gap-1">
              <input
                type="color"
                value={subtitleStyle.color ?? "#ffffff"}
                onChange={(e) => handleSubtitleStyle("color", e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={subtitleStyle.color ?? "#ffffff"}
                onChange={(e) => handleSubtitleStyle("color", e.target.value)}
                className="input-field flex-1 min-w-0 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Highlight</label>
            <div className="flex gap-1">
              <input
                type="color"
                value={subtitleStyle.highlightColor ?? branding.primaryColor}
                onChange={(e) => handleSubtitleStyle("highlightColor", e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={subtitleStyle.highlightColor ?? branding.primaryColor}
                onChange={(e) => handleSubtitleStyle("highlightColor", e.target.value)}
                className="input-field flex-1 min-w-0 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Stroke width</label>
            <input
              type="number"
              min={0}
              max={8}
              value={subtitleStyle.strokeWidth ?? 0}
              onChange={(e) => handleSubtitleStyle("strokeWidth", Number(e.target.value) || 0)}
              className="input-field w-full"
            />
          </div>
        </div>

        {(subtitleStyle.strokeWidth ?? 0) > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Stroke color</label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={subtitleStyle.strokeColor ?? "#000000"}
                  onChange={(e) => handleSubtitleStyle("strokeColor", e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={subtitleStyle.strokeColor ?? "#000000"}
                  onChange={(e) => handleSubtitleStyle("strokeColor", e.target.value)}
                  className="input-field flex-1 min-w-0 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2 border-t border-slate-200">
          <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={!!subtitleStyle.transcriptDecoration}
              onChange={(e) => handleSubtitleStyle("transcriptDecoration", e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-slate-900 focus:ring-slate-900"
            />
            <span>Transcript decoration</span>
          </label>
          {subtitleStyle.transcriptDecoration && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Decoration opacity</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={subtitleStyle.transcriptDecorationOpacity ?? 30}
                  onChange={(e) =>
                    handleSubtitleStyle("transcriptDecorationOpacity", Number(e.target.value) || 30)
                  }
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-slate-900"
                />
                <span className="text-xs text-slate-600 tabular-nums w-10">
                  {subtitleStyle.transcriptDecorationOpacity ?? 30}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Other words: white at opacity. Current word: full white.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Waveform</h4>
          <InfoTooltip label="Waveform">
            Choose a waveform style that matches your brand. Simpler shapes feel more minimal; dynamic ones feel more energetic.
          </InfoTooltip>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="sm:w-1/3">
            <label className="block text-[11px] font-medium text-slate-600 mb-2">Style</label>
            <select
              value={branding.waveformStyle ?? "bars"}
              onChange={(e) => handleChange("waveformStyle", e.target.value as WaveformStyle)}
              className="select-combo w-full"
            >
              <optgroup label="Classic">
                <option value="bars">Bars (circular)</option>
                <option value="dots">Dots</option>
                <option value="ring">Pulsing ring</option>
                <option value="linear">Linear strip</option>
              </optgroup>
              <optgroup label="Modern">
                <option value="waves">Smooth waves</option>
                <option value="waveLine">Wave line</option>
                <option value="stacked">Stacked waves</option>
                <option value="equalizer">Equalizer</option>
                <option value="waveform">Waveform trace</option>
                <option value="pulseRings">Pulse rings</option>
                <option value="neonArc">Neon arc</option>
                <option value="blob">Blob</option>
                <option value="helix">Helix</option>
                <option value="bounce">Bounce</option>
                <option value="liquid">Liquid</option>
                <option value="starburst">Starburst</option>
                <option value="particles">Particles</option>
                <option value="ribbon">Ribbon</option>
                <option value="minimal">Minimal</option>
                <option value="glow">Glow</option>
              </optgroup>
              <optgroup label="Effects">
                <option value="spectrum">Spectrum</option>
                <option value="orb">Orb</option>
                <option value="ripple">Ripple</option>
              </optgroup>
            </select>
          </div>

          <div className="sm:w-1/3">
            <label className="block text-[11px] font-medium text-slate-600 mb-2">Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={Math.round((waveformLayout.scale ?? 1) * 100)}
                onChange={(e) => handleLayoutWaveform({ scale: Number(e.target.value) / 100 })}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-slate-900"
              />
              <span className="text-xs text-slate-600 tabular-nums w-10 text-right">
                {Math.round((waveformLayout.scale ?? 1) * 100)}%
              </span>
            </div>
          </div>

          <div className="sm:flex-1">
            <label className="block text-[11px] font-medium text-slate-600 mb-2">Color</label>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={branding.waveformColor ?? branding.primaryColor}
                onChange={(e) => handleChange("waveformColor", e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={branding.waveformColor ?? branding.primaryColor}
                onChange={(e) => handleChange("waveformColor", e.target.value)}
                className="input-field flex-1 min-w-0 font-mono"
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Drag the waveform in the preview to reposition it.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-medium text-slate-600 mb-2">Video background</label>
          <InfoTooltip label="Video background">
            Use a subtle dark background or a soft image with blur. Avoid busy images so subtitles and waveforms stay readable.
          </InfoTooltip>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={branding.videoBackgroundColor ?? "#0a0a0a"}
            onChange={(e) => onChange({ ...branding, videoBackgroundColor: e.target.value })}
            className="color-picker"
          />
          <input
            type="text"
            value={branding.videoBackgroundColor ?? "#0a0a0a"}
            onChange={(e) => onChange({ ...branding, videoBackgroundColor: e.target.value })}
            className="input-field flex-1 min-w-0 font-mono"
          />
        </div>
        <p className="text-[11px] text-slate-500">Solid color when no image is set</p>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Background image</label>
          <div className="flex items-center gap-3">
            {branding.videoBackgroundImageUrl && (
              <img
                src={branding.videoBackgroundImageUrl}
                alt="Background"
                className="w-16 h-10 rounded object-cover border border-slate-300"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () =>
                    onChange({ ...branding, videoBackgroundImageUrl: reader.result as string });
                  reader.readAsDataURL(file);
                }
              }}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-900 file:text-white hover:file:bg-black"
            />
            {branding.videoBackgroundImageUrl && (
              <button
                type="button"
                onClick={() => onChange({ ...branding, videoBackgroundImageUrl: null })}
                className="text-xs text-red-500 hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
          {branding.videoBackgroundImageUrl && (
            <div className="space-y-3 mt-3">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branding.videoBackgroundBlurEnabled !== false}
                    onChange={(e) =>
                      onChange({ ...branding, videoBackgroundBlurEnabled: e.target.checked })
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-slate-900"
                  />
                  <span>Blur</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branding.videoBackgroundOverlayEnabled !== false}
                    onChange={(e) =>
                      onChange({ ...branding, videoBackgroundOverlayEnabled: e.target.checked })
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-slate-900"
                  />
                  <span>Black overlay</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {branding.videoBackgroundBlurEnabled !== false && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Blur amount</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={40}
                        step={2}
                        value={branding.videoBackgroundBlur ?? 12}
                        onChange={(e) =>
                          onChange({ ...branding, videoBackgroundBlur: Number(e.target.value) || 12 })
                        }
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-slate-900"
                      />
                      <span className="text-xs text-slate-600 tabular-nums w-8">
                        {branding.videoBackgroundBlur ?? 12}px
                      </span>
                    </div>
                  </div>
                )}
                {branding.videoBackgroundOverlayEnabled !== false && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Overlay opacity</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={90}
                        step={5}
                        value={branding.videoBackgroundOverlay ?? 55}
                        onChange={(e) =>
                          onChange({ ...branding, videoBackgroundOverlay: Number(e.target.value) || 55 })
                        }
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-slate-900"
                      />
                      <span className="text-xs text-slate-600 tabular-nums w-10">
                        {branding.videoBackgroundOverlay ?? 55}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(DEFAULT_BRANDING)}
        className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        Reset to defaults
      </button>
    </div>
  );
}
