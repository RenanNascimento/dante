"use client";

import { useState, useRef, useEffect } from "react";
import type { Theme } from "@/hooks/useEpub";
import type { AudioState } from "@/hooks/useAudio";

interface ProgressBarProps {
  progress: number;
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
  theme: Theme;
  showStats: boolean;
  audioState: AudioState;
  onTogglePlayPause: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
}

export default function ProgressBar({
  progress,
  currentPage,
  totalPages,
  onGoToPage,
  theme,
  showStats,
  audioState,
  onTogglePlayPause,
  onSeekBackward,
  onSeekForward,
}: ProgressBarProps) {
  const muted = theme === "dark" ? "text-zinc-500" : "text-stone-400";
  const active = theme === "dark" ? "text-zinc-300 hover:text-zinc-100" : "text-stone-500 hover:text-stone-700";

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSubmit = () => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onGoToPage(page);
    }
    setEditing(false);
  };

  return (
    <div className={`flex items-center justify-between px-4 py-2 shrink-0 ${
      theme === "dark" ? "bg-black" : "bg-[#faf5ee]"
    }`}>
      {showStats ? (
        <span className={`text-sm ${muted} w-12`}>{progress}%</span>
      ) : (
        <span className="w-12" />
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={onSeekBackward}
          className={`text-xs transition-colors cursor-pointer ${
            audioState === "playing" || audioState === "paused" ? active : muted
          }`}
          disabled={audioState !== "playing" && audioState !== "paused"}
        >
          -10s
        </button>

        <button
          onClick={onTogglePlayPause}
          className={`text-lg transition-colors cursor-pointer ${active} ${
            audioState === "loading" ? "animate-pulse" : ""
          }`}
          disabled={audioState === "loading"}
        >
          {audioState === "playing" ? "⏸" : "▶"}
        </button>

        <button
          onClick={onSeekForward}
          className={`text-xs transition-colors cursor-pointer ${
            audioState === "playing" || audioState === "paused" ? active : muted
          }`}
          disabled={audioState !== "playing" && audioState !== "paused"}
        >
          +10s
        </button>
      </div>

      {showStats ? (
        editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="w-10 flex justify-end"
          >
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={totalPages}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
              className={`w-10 text-xs text-right bg-transparent border-b outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                theme === "dark" ? "text-zinc-300 border-zinc-500" : "text-stone-600 border-stone-400"
              }`}
            />
          </form>
        ) : (
          <button
            onClick={() => { setInputValue(String(currentPage)); setEditing(true); }}
            className={`text-sm ${muted} cursor-pointer transition-colors ${
              theme === "dark" ? "hover:text-zinc-300" : "hover:text-stone-600"
            }`}
          >
            {currentPage}/{totalPages}
          </button>
        )
      ) : (
        <span className="w-12" />
      )}
    </div>
  );
}
