"use client";

import type { Theme } from "@/hooks/useEpub";

interface SettingsMenuProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  pausePerParagraph: boolean;
  onPausePerParagraphChange: (value: boolean) => void;
  speakingRate: number;
  onSpeakingRateChange: (rate: number) => void;
  onClose: () => void;
}

const FONT_SIZES = [75, 85, 100, 115, 130, 150];

export default function SettingsMenu({
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
  pausePerParagraph,
  onPausePerParagraphChange,
  speakingRate,
  onSpeakingRateChange,
  onClose,
}: SettingsMenuProps) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute top-10 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-4 w-56"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Font Size</p>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              const idx = FONT_SIZES.indexOf(fontSize);
              if (idx > 0) onFontSizeChange(FONT_SIZES[idx - 1]);
            }}
            disabled={fontSize <= FONT_SIZES[0]}
            className="text-lg w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-default"
          >
            A
          </button>
          <span className="text-zinc-300 text-sm flex-1 text-center">{fontSize}%</span>
          <button
            onClick={() => {
              const idx = FONT_SIZES.indexOf(fontSize);
              if (idx < FONT_SIZES.length - 1) onFontSizeChange(FONT_SIZES[idx + 1]);
            }}
            disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
            className="text-xl w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-default"
          >
            A
          </button>
        </div>

        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Theme</p>
        <div className="flex gap-2">
          <button
            onClick={() => onThemeChange("dark")}
            className={`flex-1 py-2 rounded text-sm transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-zinc-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => onThemeChange("light")}
            className={`flex-1 py-2 rounded text-sm transition-colors cursor-pointer ${
              theme === "light"
                ? "bg-zinc-300 text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Light
          </button>
        </div>

        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3 mt-4">Reading</p>
        <button
          onClick={() => onPausePerParagraphChange(!pausePerParagraph)}
          className="flex items-center justify-between w-full cursor-pointer"
        >
          <span className="text-zinc-300 text-sm">Pause per paragraph</span>
          <div
            className={`w-9 h-5 rounded-full relative transition-colors ${
              pausePerParagraph ? "bg-blue-500" : "bg-zinc-700"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                pausePerParagraph ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3 mt-4">Voice Speed</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSpeakingRateChange(Math.max(0.5, +(speakingRate - 0.05).toFixed(2)))}
            disabled={speakingRate <= 0.5}
            className="text-sm w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-default"
          >
            -
          </button>
          <span className="text-zinc-300 text-sm flex-1 text-center">{speakingRate.toFixed(2)}x</span>
          <button
            onClick={() => onSpeakingRateChange(Math.min(2.0, +(speakingRate + 0.05).toFixed(2)))}
            disabled={speakingRate >= 2.0}
            className="text-sm w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-default"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
