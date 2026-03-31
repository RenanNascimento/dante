"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import useEpub, { type Theme } from "@/hooks/useEpub";
import useAudio from "@/hooks/useAudio";
import useTextSelection from "@/hooks/useTextSelection";
import { generateBookKey, loadSettings, saveSettings } from "@/hooks/useBookStorage";
import ProgressBar from "./ProgressBar";
import SettingsMenu from "./SettingsMenu";
import SelectionTooltip from "./SelectionTooltip";
import LookupModal from "./LookupModal";

interface ReaderProps {
  data: ArrayBuffer;
  onClose: () => void;
}

interface LoadedSettings {
  bookKey: string;
  initialCfi?: string;
  initialFontSize: number;
  initialTheme: Theme;
  initialSpeakingRate: number;
  initialPausePerParagraph: boolean;
}

interface LookupState {
  text: string;
  action: "meaning";
  x: number;
  y: number;
}

export default function Reader({ data, onClose }: ReaderProps) {
  const [loaded, setLoaded] = useState<LoadedSettings | null>(null);

  useEffect(() => {
    (async () => {
      const key = await generateBookKey(data);
      const saved = loadSettings(key);
      setLoaded({
        bookKey: key,
        initialCfi: saved?.cfi || undefined,
        initialFontSize: saved?.fontSize ?? 100,
        initialTheme: saved?.theme ?? "dark",
        initialSpeakingRate: saved?.speakingRate ?? 0.75,
        initialPausePerParagraph: saved?.pausePerParagraph ?? false,
      });
    })();
  }, [data]);

  if (!loaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <span className="text-zinc-500">Loading...</span>
      </div>
    );
  }

  return <ReaderInner data={data} onClose={onClose} settings={loaded} />;
}

interface ReaderInnerProps {
  data: ArrayBuffer;
  onClose: () => void;
  settings: LoadedSettings;
}

function ReaderInner({ data, onClose, settings }: ReaderInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pausePerParagraph, setPausePerParagraph] = useState(settings.initialPausePerParagraph);
  const [speakingRate, setSpeakingRate] = useState(settings.initialSpeakingRate);
  const [lookup, setLookup] = useState<LookupState | null>(null);

  const { progress, currentPage, totalPages, currentCfi, goNext, goPrev, goToPage, title, isReady, fontSize, setFontSize, theme, setTheme, getPageText, getPageParagraphs, prepareHighlighting, highlightWord, clearHighlight, contentsRef, renditionRef } = useEpub({
    data,
    containerRef,
    initialCfi: settings.initialCfi,
    initialFontSize: settings.initialFontSize,
    initialTheme: settings.initialTheme,
  });

  const { audioState, togglePlayPause, seekBackward, seekForward } = useAudio({
    getPageText,
    getPageParagraphs,
    prepareHighlighting,
    highlightWord,
    clearHighlight,
    renditionRef,
    goNext,
    pausePerParagraph,
    fontSize,
    speakingRate,
  });

  const { selection, dismiss: dismissSelection, skipNext } = useTextSelection({
    contentsRef,
    containerRef,
    isReady,
  });

  const handleCopy = useCallback(() => {
    if (selection) {
      navigator.clipboard.writeText(selection.text);
    }
    skipNext();
    dismissSelection();
  }, [selection, dismissSelection, skipNext]);

  const handleLookup = useCallback((action: "meaning") => {
    if (!selection) return;
    skipNext();
    setLookup({ text: selection.text, action, x: selection.x, y: selection.y });
    dismissSelection();
  }, [selection, dismissSelection, skipNext]);

  // Keep a ref with the latest settings so we can save on unmount
  const latestSettingsRef = useRef({ currentCfi, fontSize, theme, speakingRate, pausePerParagraph, title });
  latestSettingsRef.current = { currentCfi, fontSize, theme, speakingRate, pausePerParagraph, title };

  // Save settings whenever they change
  useEffect(() => {
    if (!currentCfi) return;
    saveSettings(settings.bookKey, {
      cfi: currentCfi,
      fontSize,
      theme,
      speakingRate,
      pausePerParagraph,
      title,
    });
  }, [settings.bookKey, currentCfi, fontSize, theme, speakingRate, pausePerParagraph, title]);

  // Save on unmount to capture the very latest state
  useEffect(() => {
    return () => {
      const s = latestSettingsRef.current;
      if (s.currentCfi) {
        saveSettings(settings.bookKey, {
          cfi: s.currentCfi,
          fontSize: s.fontSize,
          theme: s.theme,
          speakingRate: s.speakingRate,
          pausePerParagraph: s.pausePerParagraph,
          title: s.title,
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.bookKey]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    },
    [goNext, goPrev]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`h-screen w-screen flex flex-col relative transition-colors ${
      theme === "dark" ? "bg-black" : "bg-[#faf5ee]"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button
          onClick={onClose}
          className={`text-sm transition-colors cursor-pointer ${
            theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-stone-400 hover:text-stone-600"
          }`}
        >
          &larr; Back
        </button>
        <span className={`text-sm truncate max-w-[60%] ${
          theme === "dark" ? "text-zinc-500" : "text-stone-400"
        }`}>{title}</span>
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={`text-sm transition-colors cursor-pointer ${
            theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Aa
        </button>
      </div>

      {settingsOpen && (
        <SettingsMenu
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          theme={theme}
          onThemeChange={setTheme}
          pausePerParagraph={pausePerParagraph}
          onPausePerParagraphChange={setPausePerParagraph}
          speakingRate={speakingRate}
          onSpeakingRateChange={setSpeakingRate}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Book container */}
      <div className="flex-1 relative min-h-0">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-500">Loading...</span>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Selection tooltip */}
      {selection && (
        <SelectionTooltip
          x={selection.x}
          y={selection.y}
          text={selection.text}
          theme={theme}
          onDict={() => handleLookup("meaning")}
          onCopy={handleCopy}
        />
      )}

      {/* Lookup result modal */}
      {lookup && (
        <LookupModal
          text={lookup.text}
          action={lookup.action}
          theme={theme}
          onClose={() => setLookup(null)}
          initialX={Math.min(lookup.x, window.innerWidth - 300)}
          initialY={Math.min(lookup.y + 10, window.innerHeight - 200)}
        />
      )}

      <ProgressBar
        progress={progress}
        currentPage={currentPage}
        totalPages={totalPages}
        onGoToPage={goToPage}
        theme={theme}
        audioState={audioState}
        onTogglePlayPause={togglePlayPause}
        onSeekBackward={seekBackward}
        onSeekForward={seekForward}
      />
    </div>
  );
}
