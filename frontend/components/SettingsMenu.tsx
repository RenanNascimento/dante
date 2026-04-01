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
  onHome: () => void;
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
  onHome,
  onClose,
}: SettingsMenuProps) {
  const bg = theme === "dark" ? "bg-zinc-900" : "bg-white";
  const border = theme === "dark" ? "border-zinc-700" : "border-stone-200";
  const label = theme === "dark" ? "text-zinc-400" : "text-stone-400";
  const text = theme === "dark" ? "text-zinc-300" : "text-stone-600";
  const btnBg = theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700" : "bg-stone-100 hover:bg-stone-200";
  const btnDisabled = theme === "dark" ? "disabled:hover:bg-zinc-800" : "disabled:hover:bg-stone-100";

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className={`absolute top-10 left-4 ${bg} border ${border} rounded-lg p-4 w-56`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onHome}
          className={`flex items-center gap-2 w-full mb-4 pb-3 border-b ${border} ${text} cursor-pointer`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
          </svg>
          <span className="text-sm">Home</span>
        </button>

        <p className={`${label} text-xs uppercase tracking-wide mb-3`}>Font Size</p>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              const idx = FONT_SIZES.indexOf(fontSize);
              if (idx > 0) onFontSizeChange(FONT_SIZES[idx - 1]);
            }}
            disabled={fontSize <= FONT_SIZES[0]}
            className={`text-lg w-8 h-8 flex items-center justify-center rounded ${btnBg} disabled:opacity-30 ${btnDisabled} transition-colors cursor-pointer disabled:cursor-default`}
          >
            A
          </button>
          <span className={`${text} text-sm flex-1 text-center`}>{fontSize}%</span>
          <button
            onClick={() => {
              const idx = FONT_SIZES.indexOf(fontSize);
              if (idx < FONT_SIZES.length - 1) onFontSizeChange(FONT_SIZES[idx + 1]);
            }}
            disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
            className={`text-xl w-8 h-8 flex items-center justify-center rounded ${btnBg} disabled:opacity-30 ${btnDisabled} transition-colors cursor-pointer disabled:cursor-default`}
          >
            A
          </button>
        </div>

        <p className={`${label} text-xs uppercase tracking-wide mb-3`}>Theme</p>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onThemeChange("dark")}
            className={`flex-1 py-2 rounded text-sm transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-zinc-600 text-white"
                : "bg-stone-100 text-stone-400 hover:bg-stone-200"
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => onThemeChange("light")}
            className={`flex-1 py-2 rounded text-sm transition-colors cursor-pointer ${
              theme === "light"
                ? "bg-stone-300 text-stone-900"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Light
          </button>
        </div>

        <p className={`${label} text-xs uppercase tracking-wide mb-3`}>Reading</p>
        <button
          onClick={() => onPausePerParagraphChange(!pausePerParagraph)}
          className="flex items-center justify-between w-full cursor-pointer mb-4"
        >
          <span className={`${text} text-sm`}>Pause per paragraph</span>
          <div
            className={`w-9 h-5 rounded-full relative transition-colors ${
              pausePerParagraph ? "bg-blue-500" : (theme === "dark" ? "bg-zinc-700" : "bg-stone-300")
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                pausePerParagraph ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        <p className={`${label} text-xs uppercase tracking-wide mb-3`}>Voice Speed</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSpeakingRateChange(Math.max(0.5, +(speakingRate - 0.05).toFixed(2)))}
            disabled={speakingRate <= 0.5}
            className={`text-sm w-8 h-8 flex items-center justify-center rounded ${btnBg} disabled:opacity-30 ${btnDisabled} transition-colors cursor-pointer disabled:cursor-default`}
          >
            -
          </button>
          <span className={`${text} text-sm flex-1 text-center`}>{speakingRate.toFixed(2)}x</span>
          <button
            onClick={() => onSpeakingRateChange(Math.min(2.0, +(speakingRate + 0.05).toFixed(2)))}
            disabled={speakingRate >= 2.0}
            className={`text-sm w-8 h-8 flex items-center justify-center rounded ${btnBg} disabled:opacity-30 ${btnDisabled} transition-colors cursor-pointer disabled:cursor-default`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
