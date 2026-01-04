"use client";

import { useState } from "react";

export type LoopMode = 0 | 1 | 2 | 3 | 4;

interface AudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopMode: LoopMode;
  playbackSpeed: number;
  onPlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSeek: (time: number) => void;
  onLoopToggle: () => void;
  onSpeedChange: (speed: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getLoopLabel(mode: LoopMode): string {
  switch (mode) {
    case 0: return "";
    case 1: return "1";
    case 2: return "2";
    case 3: return "4";
    case 4: return "∞";
  }
}

export default function AudioControls({
  isPlaying,
  currentTime,
  duration,
  loopMode,
  playbackSpeed,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onSeek,
  onLoopToggle,
  onSpeedChange,
}: AudioControlsProps) {
  const loopLabel = getLoopLabel(loopMode);
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState(false);

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
        <div className="flex items-center justify-center gap-6">
          {/* Speed control dropdown */}
          <div className="relative">
            <button
              onClick={() => setSpeedDropdownOpen(!speedDropdownOpen)}
              className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1"
              aria-label="Playback speed"
              title="Playback speed"
            >
              {playbackSpeed}x
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform ${speedDropdownOpen ? "rotate-180" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {speedDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                {[0.75, 1, 1.25].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      onSpeedChange(speed);
                      setSpeedDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-sm font-semibold text-left transition-colors ${
                      playbackSpeed === speed
                        ? "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Playback controls - Center */}
          <div className="flex items-center gap-4">
            {/* Skip backward 15s */}
            <button
              onClick={onSkipBackward}
              className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Skip backward 15 seconds"
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
              <span className="text-xs block -mt-1">15</span>
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

            {/* Skip forward 15s */}
            <button
              onClick={onSkipForward}
              className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Skip forward 15 seconds"
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
              <span className="text-xs block -mt-1">15</span>
            </button>
          </div>

          {/* Loop button - Right side */}
          <button
            onClick={onLoopToggle}
            className={`p-3 rounded-full transition-colors relative ${
              loopMode > 0
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            aria-label="Toggle loop mode"
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
                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
              />
            </svg>
            {loopLabel && (
              <span className="absolute -top-1 -right-1 text-xs font-bold bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {loopLabel}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
