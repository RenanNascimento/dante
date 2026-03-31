"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Paragraph } from "./useEpub";

export type AudioState = "idle" | "loading" | "playing" | "paused";

interface WordTimepoint {
  word: string;
  timeSeconds: number;
}

interface UseAudioOptions {
  getPageText: () => string;
  getPageParagraphs: () => Paragraph[];
  prepareHighlighting: () => void;
  highlightWord: (index: number) => void;
  clearHighlight: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renditionRef: React.RefObject<any>;
  goNext: () => void;
  pausePerParagraph: boolean;
  fontSize: number;
  speakingRate: number;
}

interface UseAudioReturn {
  audioState: AudioState;
  togglePlayPause: () => void;
  seekBackward: () => void;
  seekForward: () => void;
}

export default function useAudio({
  getPageParagraphs,
  prepareHighlighting,
  highlightWord,
  clearHighlight,
  renditionRef,
  goNext,
  pausePerParagraph,
  fontSize,
  speakingRate,
}: UseAudioOptions): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const timepointsRef = useRef<WordTimepoint[]>([]);
  const lastHighlightedRef = useRef(-1);

  // Paragraph tracking
  const paragraphsRef = useRef<Paragraph[]>([]);
  const paragraphIndexRef = useRef(0);
  const pausePerParagraphRef = useRef(pausePerParagraph);
  pausePerParagraphRef.current = pausePerParagraph;
  const speakingRateRef = useRef(speakingRate);
  speakingRateRef.current = speakingRate;

  // Page turn coordination
  const autoAdvancingRef = useRef(false);
  const manualTurnRef = useRef(false);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    timepointsRef.current = [];
    lastHighlightedRef.current = -1;
  }, []);

  const fullCleanup = useCallback(() => {
    cleanupAudio();
    clearHighlight();
    paragraphsRef.current = [];
    paragraphIndexRef.current = 0;
    manualTurnRef.current = false;
  }, [cleanupAudio, clearHighlight]);

  const playParagraph = useCallback(async (paragraphs: Paragraph[], index: number) => {
    if (index >= paragraphs.length) {
      // All paragraphs on this page done — advance to next page
      fullCleanup();
      setAudioState("idle");
      autoAdvancingRef.current = true;
      goNext();
      return;
    }

    cleanupAudio();
    const paragraph = paragraphs[index];
    setAudioState("loading");

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: paragraph.text, speakingRate: speakingRateRef.current }),
      });

      if (!res.ok) {
        setAudioState("paused");
        return;
      }

      const data = await res.json();
      timepointsRef.current = data.timepoints || [];

      const audioBytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        const t = audio.currentTime;
        const tps = timepointsRef.current;
        let wordIndex = -1;
        for (let i = tps.length - 1; i >= 0; i--) {
          if (tps[i].timeSeconds <= t) {
            wordIndex = i;
            break;
          }
        }
        if (wordIndex !== lastHighlightedRef.current && wordIndex >= 0) {
          lastHighlightedRef.current = wordIndex;
          highlightWord(paragraph.wordOffset + wordIndex);
        }
      };

      audio.onended = () => {
        cleanupAudio();

        if (manualTurnRef.current) {
          // User turned page during playback — start fresh on whatever page is now showing
          manualTurnRef.current = false;
          startFromBeginningRef.current();
          return;
        }

        const nextIdx = index + 1;
        paragraphIndexRef.current = nextIdx;

        if (nextIdx >= paragraphs.length) {
          // Last paragraph done — advance page
          fullCleanup();
          setAudioState("idle");
          autoAdvancingRef.current = true;
          goNext();
        } else if (pausePerParagraphRef.current) {
          setAudioState("paused");
        } else {
          playParagraph(paragraphs, nextIdx);
        }
      };

      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("paused");
    }
  }, [goNext, cleanupAudio, fullCleanup, highlightWord]);

  const startFromBeginning = useCallback(() => {
    const paragraphs = getPageParagraphs();
    if (paragraphs.length === 0) return;

    paragraphsRef.current = paragraphs;
    paragraphIndexRef.current = 0;
    manualTurnRef.current = false;

    prepareHighlighting();
    playParagraph(paragraphs, 0);
  }, [getPageParagraphs, prepareHighlighting, playParagraph]);

  // Ref so onended/onRelocated closures always call the latest version
  const startFromBeginningRef = useRef(startFromBeginning);
  startFromBeginningRef.current = startFromBeginning;

  const togglePlayPause = useCallback(() => {
    if (audioState === "idle") {
      startFromBeginning();
    } else if (audioState === "playing" && audioRef.current) {
      audioRef.current.pause();
      setAudioState("paused");
    } else if (audioState === "paused") {
      if (audioRef.current) {
        audioRef.current.play();
        setAudioState("playing");
      } else {
        playParagraph(paragraphsRef.current, paragraphIndexRef.current);
      }
    }
  }, [audioState, startFromBeginning, playParagraph]);

  const seekBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  }, []);

  const seekForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || 0,
        audioRef.current.currentTime + 10
      );
    }
  }, []);

  // Listen for page relocations
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const onRelocated = () => {
      if (autoAdvancingRef.current) {
        // Auto-advance after finishing a page — play the new page
        autoAdvancingRef.current = false;
        startFromBeginningRef.current();
      } else if (audioState === "playing") {
        // Manual page turn while playing — let audio continue,
        // clear stale highlights, flag so onended starts fresh on the new page
        clearHighlight();
        manualTurnRef.current = true;
      } else if (audioState === "paused") {
        // Manual page turn while paused — reset so next play starts from current page
        fullCleanup();
        setAudioState("idle");
      }
    };

    rendition.on("relocated", onRelocated);
    return () => {
      rendition.off("relocated", onRelocated);
    };
  }, [renditionRef, audioState, clearHighlight, fullCleanup]);

  // Reset audio when font size changes
  const prevFontSizeRef = useRef(fontSize);
  useEffect(() => {
    if (prevFontSizeRef.current !== fontSize) {
      prevFontSizeRef.current = fontSize;
      if (audioState !== "idle") {
        fullCleanup();
        setAudioState("idle");
      }
    }
  }, [fontSize, audioState, fullCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => fullCleanup();
  }, [fullCleanup]);

  return { audioState, togglePlayPause, seekBackward, seekForward };
}
