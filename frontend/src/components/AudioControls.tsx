"use client";

import { useState, useEffect, useRef } from "react";
import { PlayIcon, PauseIcon, SkipBackwardIcon, SkipForwardIcon, SettingsIcon } from "@/assets/icons";

export type LoopMode = 0 | 1 | 2 | 3 | 4;
export type HiddenWordsPercent = 0 | 10;

interface AudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopMode: LoopMode;
  playbackSpeed: number;
  pauseAtPhraseEnd: boolean;
  blurText: boolean;
  hiddenWordsPercent: HiddenWordsPercent;
  onPlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSeek: (time: number) => void;
  onLoopToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onPauseAtPhraseEndToggle: () => void;
  onBlurTextToggle: () => void;
  onHiddenWordsChange: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getLoopLabel(mode: LoopMode): string {
  switch (mode) {
    case 0: return "Off";
    case 1: return "1x";
    case 2: return "2x";
    case 3: return "4x";
    case 4: return "Infinite";
  }
}

function getHiddenWordsLabel(percent: HiddenWordsPercent): string {
  return percent === 0 ? "Off" : "On";
}

export default function AudioControls({
  isPlaying,
  currentTime,
  duration,
  loopMode,
  playbackSpeed,
  pauseAtPhraseEnd,
  blurText,
  hiddenWordsPercent,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onSeek,
  onLoopToggle,
  onSpeedChange,
  onPauseAtPhraseEndToggle,
  onBlurTextToggle,
  onHiddenWordsChange,
}: AudioControlsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!settingsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [settingsOpen]);

  const handleSpeedToggle = () => {
    onSpeedChange(playbackSpeed === 1 ? 0.75 : 1);
  };

  // Check if any setting is active to show indicator on settings button
  const hasActiveSettings = loopMode > 0 || pauseAtPhraseEnd || playbackSpeed !== 1 || blurText || hiddenWordsPercent > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 p-4 shadow-lg">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Skip to current word start */}
          <button
            onClick={onSkipBackward}
            className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Go to current word"
          >
            <SkipBackwardIcon className="w-6 h-6" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8" />
            )}
          </button>

          {/* Skip to next word */}
          <button
            onClick={onSkipForward}
            className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Go to next word"
          >
            <SkipForwardIcon className="w-6 h-6" />
          </button>

          {/* Settings button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen(!settingsOpen);
              }}
              className={`p-3 rounded-full transition-colors relative ${
                hasActiveSettings
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>

            {/* Settings menu */}
            {settingsOpen && (
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden min-w-[180px]">
                {/* Speed toggle */}
                <button
                  onClick={handleSpeedToggle}
                  className="w-full px-4 py-3 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between"
                >
                  <span>Speed</span>
                  <span className={`font-semibold ${playbackSpeed !== 1 ? "text-blue-600 dark:text-blue-400" : ""}`}>
                    {playbackSpeed === 1 ? "Normal" : "Slow"}
                  </span>
                </button>

                {/* Loop toggle */}
                <button
                  onClick={onLoopToggle}
                  className="w-full px-4 py-3 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700"
                >
                  <span>Repeat</span>
                  <span className={`font-semibold ${loopMode > 0 ? "text-blue-600 dark:text-blue-400" : ""}`}>
                    {getLoopLabel(loopMode)}
                  </span>
                </button>

                {/* Pause at phrase end toggle */}
                <button
                  onClick={onPauseAtPhraseEndToggle}
                  className="w-full px-4 py-3 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700"
                >
                  <span>Pause per word</span>
                  <span className={`font-semibold ${pauseAtPhraseEnd ? "text-blue-600 dark:text-blue-400" : ""}`}>
                    {pauseAtPhraseEnd ? "On" : "Off"}
                  </span>
                </button>

                {/* Blur text toggle */}
                <button
                  onClick={onBlurTextToggle}
                  className="w-full px-4 py-3 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700"
                >
                  <span>Blur text</span>
                  <span className={`font-semibold ${blurText ? "text-blue-600 dark:text-blue-400" : ""}`}>
                    {blurText ? "On" : "Off"}
                  </span>
                </button>

                {/* Hidden words toggle */}
                <button
                  onClick={onHiddenWordsChange}
                  className="w-full px-4 py-3 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700"
                >
                  <span>Hidden words</span>
                  <span className={`font-semibold ${hiddenWordsPercent > 0 ? "text-blue-600 dark:text-blue-400" : ""}`}>
                    {getHiddenWordsLabel(hiddenWordsPercent)}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
