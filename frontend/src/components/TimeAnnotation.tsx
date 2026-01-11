"use client";

import { useState, useRef, useEffect } from "react";
import { WordTiming } from "@/data/mockContent";

export default function TimeAnnotation() {
  const [annotations, setAnnotations] = useState<WordTiming[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempStartTime, setTempStartTime] = useState<number | null>(null);
  // Range selection: start and end word indices
  const [startWordIndex, setStartWordIndex] = useState<number | null>(null);
  const [endWordIndex, setEndWordIndex] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [text, setText] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Split text into words for display
  const textWords = text.split(/\s+/).filter((w) => w.length > 0);

  // Track which word index marks the start of unannotated words
  // Count total words covered by annotations
  const getNextUnannotatedIndex = (): number => {
    let totalWordsCovered = 0;
    for (const annotation of annotations) {
      const wordCount = annotation.word.split(/\s+/).filter((w) => w.length > 0).length;
      totalWordsCovered += wordCount;
    }
    return totalWordsCovered;
  };
  const nextUnannotatedIndex = getNextUnannotatedIndex();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const handleTextFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // Pause - set end time and save annotation
      audio.pause();
      setIsPlaying(false);

      if (tempStartTime !== null && startWordIndex !== null) {
        // Get the phrase from startWordIndex to endWordIndex (or just startWordIndex if no end selected)
        const actualEndIndex = endWordIndex !== null ? endWordIndex : startWordIndex;
        const phraseWords = textWords.slice(startWordIndex, actualEndIndex + 1);
        const phrase = phraseWords.join(" ");

        const newAnnotation: WordTiming = {
          word: phrase,
          startTime: tempStartTime,
          endTime: currentTime,
        };
        setAnnotations([...annotations, newAnnotation]);
        setTempStartTime(null);
        setCurrentIndex(annotations.length);

        // Reset selection and auto-select next unannotated word
        setStartWordIndex(null);
        setEndWordIndex(null);
      }
    } else {
      // Play - set start time
      if (startWordIndex !== null && tempStartTime === null) {
        setTempStartTime(currentTime);
      }
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleGoBack = () => {
    if (annotations.length === 0) return;
    const newIndex = currentIndex <= 0 ? annotations.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    seekToAnnotation(newIndex);
  };

  const handleSkip = () => {
    if (annotations.length === 0) return;
    const newIndex = currentIndex >= annotations.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    seekToAnnotation(newIndex);
  };

  const seekToAnnotation = (index: number) => {
    const audio = audioRef.current;
    if (!audio || index < 0 || index >= annotations.length) return;
    audio.currentTime = annotations[index].startTime;
    setCurrentTime(annotations[index].startTime);
  };

  const handlePlayCurrent = () => {
    const audio = audioRef.current;
    if (!audio || currentIndex < 0 || currentIndex >= annotations.length) return;

    const annotation = annotations[currentIndex];
    audio.currentTime = annotation.startTime;
    audio.play();
    setIsPlaying(true);

    // Stop at end time
    const checkEnd = () => {
      if (audio.currentTime >= annotation.endTime) {
        audio.pause();
        setIsPlaying(false);
        audio.removeEventListener("timeupdate", checkEnd);
      }
    };
    audio.addEventListener("timeupdate", checkEnd);
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleDeleteAnnotation = (index: number) => {
    const newAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(newAnnotations);
    if (currentIndex >= newAnnotations.length) {
      setCurrentIndex(newAnnotations.length - 1);
    }
  };

  const handleWordClick = (index: number) => {
    // Only allow selecting unannotated words (index >= nextUnannotatedIndex)
    if (index < nextUnannotatedIndex) return;

    if (startWordIndex === null) {
      // First click: set start of range
      setStartWordIndex(index);
      setEndWordIndex(null);
      setTempStartTime(null);
    } else if (endWordIndex === null) {
      // Second click: set end of range (must be >= start)
      if (index >= startWordIndex) {
        setEndWordIndex(index);
      } else {
        // If clicking before start, reset and use this as new start
        setStartWordIndex(index);
        setEndWordIndex(null);
      }
    } else {
      // Third click: reset and start new selection
      setStartWordIndex(index);
      setEndWordIndex(null);
      setTempStartTime(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = () => {
    const output = JSON.stringify(annotations, null, 2);
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 pb-48">
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 mt-12">Time Annotation</h1>

        {/* File uploads */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* Audio upload */}
          <div>
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,audio/*"
              onChange={handleAudioFileChange}
              className="hidden"
            />
            <button
              onClick={() => audioInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                />
              </svg>
              {audioUrl ? "Audio loaded" : "Upload audio"}
            </button>
          </div>

          {/* Text upload */}
          <div>
            <input
              ref={textInputRef}
              type="file"
              accept=".txt"
              onChange={handleTextFileChange}
              className="hidden"
            />
            <button
              onClick={() => textInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              {text ? `${textWords.length} words` : "Upload text (.txt)"}
            </button>
          </div>
        </div>

        {/* Current time display */}
        <div className="mb-4 text-center">
          <span className="text-3xl font-mono text-blue-600 dark:text-blue-400">
            {formatTime(currentTime)}
          </span>
          <span className="text-zinc-400 mx-2">/</span>
          <span className="text-xl font-mono text-zinc-500">
            {formatTime(duration)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Text display - click to select words */}
        {text && (
          <div className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 max-h-64 overflow-y-auto">
            <div className="flex flex-wrap gap-1 text-lg leading-relaxed">
              {textWords.map((word, index) => {
                const isAnnotated = index < nextUnannotatedIndex;
                const isInSelectedRange =
                  startWordIndex !== null &&
                  index >= startWordIndex &&
                  (endWordIndex !== null ? index <= endWordIndex : index === startWordIndex);
                const isSelectable = index >= nextUnannotatedIndex;

                return (
                  <span
                    key={index}
                    onClick={() => handleWordClick(index)}
                    className={`px-1 py-0.5 rounded transition-colors ${
                      isAnnotated
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                        : isInSelectedRange
                        ? "bg-blue-500 text-white cursor-pointer"
                        : isSelectable
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                        : "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Main controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {/* Go back */}
          <button
            onClick={handleGoBack}
            disabled={annotations.length === 0}
            className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous annotation"
            title="Previous annotation"
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

          {/* Play/Pause (for annotation) */}
          <button
            onClick={handlePlayPause}
            disabled={!audioUrl || startWordIndex === null}
            className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-full transition-colors"
            aria-label={isPlaying ? "Pause (set end time)" : "Play (set start time)"}
            title={isPlaying ? "Pause to set end time" : "Play to set start time"}
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

          {/* Skip forward */}
          <button
            onClick={handleSkip}
            disabled={annotations.length === 0}
            className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next annotation"
            title="Next annotation"
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
        </div>

        {/* Play current annotation button */}
        {currentIndex >= 0 && currentIndex < annotations.length && (
          <div className="text-center mb-6">
            <button
              onClick={handlePlayCurrent}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Play Current Annotation
            </button>
          </div>
        )}

        {/* Annotations list */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              Annotations ({annotations.length}) - Words: {nextUnannotatedIndex} / {textWords.length}
            </h2>
            {annotations.length > 0 && (
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Copy JSON
              </button>
            )}
          </div>

          {annotations.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
              No annotations yet. Click on the first word and press play.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {annotations.map((annotation, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                    index === currentIndex
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    seekToAnnotation(index);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-400 text-sm w-6">{index + 1}</span>
                    <span className="font-medium">{annotation.word}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                      {formatTime(annotation.startTime)} - {formatTime(annotation.endTime)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnnotation(index);
                      }}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      aria-label="Delete annotation"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* JSON Output */}
        {annotations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">JSON Output</h2>
            <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg overflow-x-auto text-sm max-h-64 overflow-y-auto">
              {JSON.stringify({ words: annotations }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
