"use client";

import { useState, useEffect, useRef } from "react";

export type LoopMode = 0 | 1 | 2 | 3 | 4;

interface AudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopMode: LoopMode;
  playbackSpeed: number;
  pauseAtPhraseEnd: boolean;
  blurText: boolean;
  onPlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSeek: (time: number) => void;
  onLoopToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onPauseAtPhraseEndToggle: () => void;
  onBlurTextToggle: () => void;
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

export default function AudioControls({
  isPlaying,
  currentTime,
  duration,
  loopMode,
  playbackSpeed,
  pauseAtPhraseEnd,
  blurText,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onSeek,
  onLoopToggle,
  onSpeedChange,
  onPauseAtPhraseEndToggle,
  onBlurTextToggle,
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
  const hasActiveSettings = loopMode > 0 || pauseAtPhraseEnd || playbackSpeed !== 1 || blurText;

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062a1.125 1.125 0 011.683.977v8.123z"
              />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                />
              </svg>
            )}
          </button>

          {/* Skip to next word */}
          <button
            onClick={onSkipForward}
            className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Go to next word"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z"
              />
            </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.212-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
