"use client";

import { useState, useRef, useEffect } from "react";
import { WordTiming } from "@/data/mockContent";

interface TextDisplayProps {
  words: WordTiming[];
  currentTime: number;
}

export default function TextDisplay({ words, currentTime }: TextDisplayProps) {
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  // Group words into phrases (split by . ! ?)
  const phrases: { words: WordTiming[]; startTime: number; endTime: number; startIndex: number }[] = [];
  let currentPhrase: WordTiming[] = [];
  let phraseStartIndex = 0;
  const punctRegex = /[.!?]/;

  words.forEach((w, i) => {
    if (currentPhrase.length === 0) {
      phraseStartIndex = i;
    }
    currentPhrase.push(w);
    if (punctRegex.test(w.word) || punctRegex.test(w.word.slice(-1)) || i === words.length - 1) {
      if (currentPhrase.length > 0) {
        phrases.push({
          words: [...currentPhrase],
          startTime: currentPhrase[0].startTime,
          endTime: currentPhrase[currentPhrase.length - 1].endTime,
          startIndex: phraseStartIndex,
        });
        currentPhrase = [];
      }
    }
  });

  // Find the active phrase
  const activePhraseIdx = phrases.findIndex(
    (p) => currentTime >= p.startTime && currentTime < p.endTime
  );

  // Refs for each phrase
  const phraseRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (
      activePhraseIdx !== -1 &&
      phraseRefs.current[activePhraseIdx]
    ) {
      phraseRefs.current[activePhraseIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }, [activePhraseIdx]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-word-index]') && !target.closest('[data-tooltip]')) {
        setSelectedWordIndex(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleWordClick = (globalIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const word = words[globalIndex];
    if (word.translation) {
      setSelectedWordIndex(selectedWordIndex === globalIndex ? null : globalIndex);
    }
  };

  return (
    <div className="text-xl leading-relaxed md:text-2xl md:leading-loose">
      {phrases.map((phrase, idx) => (
        <span
          key={idx}
          ref={el => { phraseRefs.current[idx] = el; }}
          className={`transition-colors duration-150 ${
            idx === activePhraseIdx
              ? "bg-yellow-300 dark:bg-yellow-500 dark:text-black rounded px-1"
              : ""
          }`}
        >
          {phrase.words.map((w, wi) => {
            const globalIndex = phrase.startIndex + wi;
            const isSelected = selectedWordIndex === globalIndex;
            const hasTranslation = !!w.translation;

            return (
              <span
                key={wi}
                className="relative inline"
              >
                <span
                  data-word-index={globalIndex}
                  onClick={(e) => handleWordClick(globalIndex, e)}
                  className={`${hasTranslation ? 'cursor-pointer hover:underline decoration-dotted underline-offset-4' : ''} ${isSelected ? 'underline decoration-solid' : ''}`}
                >
                  {w.word}
                </span>
                {isSelected && w.translation && (
                  <span
                    data-tooltip
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 text-sm rounded-lg shadow-lg whitespace-nowrap z-50 animate-fade-in"
                  >
                    {w.translation}
                    <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-800 dark:border-t-zinc-200" />
                  </span>
                )}
                {wi < phrase.words.length - 1 ? " " : ""}
              </span>
            );
          })}
          {" "}
        </span>
      ))}
    </div>
  );
}
