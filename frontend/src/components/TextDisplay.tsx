"use client";

import { useState, useRef, useEffect } from "react";
import { WordTiming } from "@/data/mockContent";

interface TextDisplayProps {
  words: WordTiming[];
  currentTime: number;
}

export default function TextDisplay({ words, currentTime }: TextDisplayProps) {
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  // Find the active word based on current time
  const activeWordIdx = words.findIndex(
    (w) => currentTime >= w.startTime && currentTime < w.endTime
  );

  // Refs for each word
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (activeWordIdx !== -1 && wordRefs.current[activeWordIdx]) {
      wordRefs.current[activeWordIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }, [activeWordIdx]);

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

  const handleWordClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const word = words[index];
    if (word.translation) {
      setSelectedWordIndex(selectedWordIndex === index ? null : index);
    }
  };

  return (
    <div className="text-xl leading-relaxed md:text-2xl md:leading-loose">
      {words.map((w, idx) => {
        const isActive = idx === activeWordIdx;
        const isSelected = selectedWordIndex === idx;
        const hasTranslation = !!w.translation;

        return (
          <span
            key={idx}
            ref={el => { wordRefs.current[idx] = el; }}
            className="relative inline"
          >
            <span
              data-word-index={idx}
              onClick={(e) => handleWordClick(idx, e)}
              className={`transition-colors duration-150 ${
                isActive
                  ? "bg-yellow-300 dark:bg-yellow-500 dark:text-black rounded px-1"
                  : ""
              } ${hasTranslation ? 'cursor-pointer hover:underline decoration-dotted underline-offset-4' : ''} ${isSelected ? 'underline decoration-solid' : ''}`}
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
            {" "}
          </span>
        );
      })}
    </div>
  );
}
