"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ReadingContent } from "@/data/mockContent";
import TextDisplay from "./TextDisplay";
import AudioControls, { LoopMode } from "./AudioControls";
import ThemeToggle from "./ThemeToggle";

interface ShadowReaderProps {
  content: ReadingContent;
}

function getMaxRounds(loopMode: LoopMode): number {
  switch (loopMode) {
    case 0: return 1; // no repeat
    case 1: return 2; // play twice (initial + 1 repeat)
    case 2: return 3; // play three times (initial + 2 repeats)
    case 3: return 5; // play five times (initial + 4 repeats)
    case 4: return Infinity;
  }
}


export default function ShadowReader({ content }: ShadowReaderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopMode, setLoopMode] = useState<LoopMode>(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [pauseAtPhraseEnd, setPauseAtPhraseEnd] = useState(false);
  // Refs to always have latest values in event handlers
  const loopModeRef = useRef(loopMode);
  const currentRoundRef = useRef(currentRound);
  const pauseAtPhraseEndRef = useRef(pauseAtPhraseEnd);
  const lastPausedAtIndexRef = useRef<number | null>(null);

  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);
  useEffect(() => {
    pauseAtPhraseEndRef.current = pauseAtPhraseEnd;
  }, [pauseAtPhraseEnd]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }

      // Pause at phrase end logic
      if (pauseAtPhraseEndRef.current && !audio.paused) {
        // Check if we've passed the end of a phrase
        for (let i = 0; i < content.words.length; i++) {
          const word = content.words[i];
          // If we just crossed the endTime of a word and haven't paused here yet
          if (
            time >= word.endTime &&
            time < word.endTime + 0.1 && // small window to catch the end
            lastPausedAtIndexRef.current !== i
          ) {
            audio.pause();
            setIsPlaying(false);
            lastPausedAtIndexRef.current = i;
            break;
          }
        }
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      const maxRounds = getMaxRounds(loopModeRef.current);
      if (loopModeRef.current > 0 && currentRoundRef.current < maxRounds) {
        setCurrentRound((prev) => prev + 1);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          }
        }, 100); // slight delay to ensure state updates
      } else {
        setIsPlaying(false);
        setCurrentRound(1);
      }
    };

    // Only add listeners once
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleDurationChange);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("canplaythrough", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    // Check if duration is already available
    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleDurationChange);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("canplaythrough", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []); // only run once

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 15);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 15);
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleLoopToggle = () => {
    setLoopMode((prev) => {
      const next = ((prev + 1) % 5) as LoopMode;
      setCurrentRound(1);
      return next;
    });
  };

  const handleSpeedChange = (speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handlePauseAtPhraseEndToggle = () => {
    setPauseAtPhraseEnd((prev) => !prev);
    // Reset the last paused index when toggling
    lastPausedAtIndexRef.current = null;
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={content.audioUrl} preload="metadata" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="w-12" /> {/* Space for sidebar hamburger button */}
          <h1 className="text-xl font-semibold truncate px-2">{content.title}</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Text content */}
      <main className="max-w-3xl mx-auto p-6 md:p-12">
        <TextDisplay words={content.words} currentTime={currentTime} />
      </main>

      {/* Audio controls */}
      <AudioControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        loopMode={loopMode}
        playbackSpeed={playbackSpeed}
        pauseAtPhraseEnd={pauseAtPhraseEnd}
        onPlayPause={handlePlayPause}
        onSkipBackward={handleSkipBackward}
        onSkipForward={handleSkipForward}
        onSeek={handleSeek}
        onLoopToggle={handleLoopToggle}
        onSpeedChange={handleSpeedChange}
        onPauseAtPhraseEndToggle={handlePauseAtPhraseEndToggle}
      />
    </div>
  );
}
