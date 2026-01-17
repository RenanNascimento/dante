"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { WordTiming } from "@/data/mockContent";

interface TextDisplayProps {
  words: WordTiming[];
  currentTime: number;
}

interface TooltipStyle {
  top: number;
  left: number;
  transform: string;
}

export default function TextDisplay({ words, currentTime }: TextDisplayProps) {
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

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

  // Position tooltip near word but keep it on screen
  const positionTooltip = useCallback(() => {
    if (selectedWordIndex === null) {
      setTooltipStyle(null);
      return;
    }

    const wordEl = wordRefs.current[selectedWordIndex];
    const tooltipEl = tooltipRef.current;
    if (!wordEl || !tooltipEl) return;

    const wordRect = wordEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const padding = 8;

    // Position above the word
    let top = wordRect.top - tooltipRect.height - 8;
    let left = wordRect.left + wordRect.width / 2;
    let transform = "translateX(-50%)";

    // If tooltip would go off the left edge
    const tooltipHalfWidth = tooltipRect.width / 2;
    if (left - tooltipHalfWidth < padding) {
      left = padding;
      transform = "translateX(0)";
    }
    // If tooltip would go off the right edge
    else if (left + tooltipHalfWidth > window.innerWidth - padding) {
      left = window.innerWidth - padding;
      transform = "translateX(-100%)";
    }

    // If tooltip would go off the top, show below the word instead
    if (top < padding) {
      top = wordRect.bottom + 8;
    }

    setTooltipStyle({ top, left, transform });
  }, [selectedWordIndex]);

  useEffect(() => {
    positionTooltip();
  }, [positionTooltip]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (selectedWordIndex === null) return;

    window.addEventListener("scroll", positionTooltip, true);
    window.addEventListener("resize", positionTooltip);
    return () => {
      window.removeEventListener("scroll", positionTooltip, true);
      window.removeEventListener("resize", positionTooltip);
    };
  }, [selectedWordIndex, positionTooltip]);

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

  const selectedWord = selectedWordIndex !== null ? words[selectedWordIndex] : null;

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
            {" "}
          </span>
        );
      })}

      {/* Tooltip rendered outside the word spans to avoid layout issues */}
      {selectedWord?.translation && tooltipStyle && (
        <span
          ref={tooltipRef}
          data-tooltip
          className="fixed px-3 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 text-sm rounded-lg shadow-lg z-50 animate-fade-in max-w-[80vw]"
          style={{
            top: tooltipStyle.top,
            left: tooltipStyle.left,
            transform: tooltipStyle.transform,
          }}
        >
          {selectedWord.translation}
        </span>
      )}

      {/* Hidden tooltip for measuring */}
      {selectedWord?.translation && !tooltipStyle && (
        <span
          ref={tooltipRef}
          className="fixed px-3 py-1.5 text-sm max-w-[80vw] invisible"
          style={{ top: 0, left: 0 }}
        >
          {selectedWord.translation}
        </span>
      )}
    </div>
  );
}
