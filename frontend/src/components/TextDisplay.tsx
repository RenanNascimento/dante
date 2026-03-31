"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { WordTiming } from "@/data/mockContent";
import { HiddenWordsPercent } from "./AudioControls";
import { CloseIcon } from "@/assets/icons";

interface TextDisplayProps {
  words: WordTiming[];
  currentTime: number;
  blurText?: boolean;
  hiddenWordsPercent?: HiddenWordsPercent;
  hiddenWordsSeed?: number;
}

interface TooltipStyle {
  top: number;
  left: number;
  transform: string;
}

// Simple seeded random number generator for deterministic word hiding
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Compute which words should be hidden within a phrase
function getHiddenWordIndices(phrase: string, phraseIndex: number, percent: number, seed: number): Set<number> {
  if (percent === 0) return new Set();

  const wordTokens = phrase.split(/\s+/).filter(w => w.length > 0);
  const totalWords = wordTokens.length;
  const numToHide = Math.ceil(totalWords * (percent / 100));

  // Use phrase index + seed for randomization
  const random = seededRandom(phraseIndex * 1000 + seed + 42);

  // Create array of indices and shuffle using Fisher-Yates
  const indices = Array.from({ length: totalWords }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Take first numToHide indices
  return new Set(indices.slice(0, numToHide));
}

type WordResult = 'correct' | 'incorrect' | null;

export default function TextDisplay({ words, currentTime, blurText = false, hiddenWordsPercent = 0, hiddenWordsSeed = 0 }: TextDisplayProps) {
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  // State for typing hidden words
  const [activeHiddenWord, setActiveHiddenWord] = useState<{ phraseIdx: number; wordIdx: number } | null>(null);
  const [userInput, setUserInput] = useState('');
  const [wordResults, setWordResults] = useState<Map<string, WordResult>>(new Map());
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [showScore, setShowScore] = useState(false);

  // Compute hidden word indices for each phrase
  const hiddenIndicesPerPhrase = useMemo(() => {
    return words.map((w, idx) => getHiddenWordIndices(w.word, idx, hiddenWordsPercent, hiddenWordsSeed));
  }, [words, hiddenWordsPercent, hiddenWordsSeed]);

  // Close tooltip when hidden words is enabled
  useEffect(() => {
    if (hiddenWordsPercent > 0) {
      setSelectedWordIndex(null);
    }
  }, [hiddenWordsPercent]);

  // Reset word results when hidden words changes
  useEffect(() => {
    setWordResults(new Map());
    setActiveHiddenWord(null);
    setUserInput('');
    setShowScore(false);
  }, [hiddenWordsSeed, hiddenWordsPercent]);

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
    // Don't show translation when hidden words is enabled
    if (hiddenWordsPercent > 0) return;
    const word = words[index];
    if (word.translation) {
      setSelectedWordIndex(selectedWordIndex === index ? null : index);
    }
  };

  // Handle clicking on a hidden word to activate it for typing
  const handleHiddenWordClick = (phraseIdx: number, wordIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${phraseIdx}-${wordIdx}`;
    // Don't allow re-typing if already answered
    if (wordResults.has(key)) return;

    setActiveHiddenWord({ phraseIdx, wordIdx });
    setUserInput('');
    // Focus the hidden input
    setTimeout(() => hiddenInputRef.current?.focus(), 0);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  // Handle key press to check answer
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeHiddenWord) {
      checkAnswer();
    } else if (e.key === 'Escape') {
      setActiveHiddenWord(null);
      setUserInput('');
    }
  };

  // Check if the user's input matches the hidden word
  const checkAnswer = () => {
    if (!activeHiddenWord) return;

    const { phraseIdx, wordIdx } = activeHiddenWord;
    const phrase = words[phraseIdx].word;
    const wordTokens = phrase.split(/\s+/).filter(w => w.length > 0);
    const actualWord = wordTokens[wordIdx];

    // Normalize both strings for comparison (remove punctuation, lowercase)
    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:'"]/g, '');
    const isCorrect = normalize(userInput.trim()) === normalize(actualWord);

    const key = `${phraseIdx}-${wordIdx}`;
    setWordResults(prev => new Map(prev).set(key, isCorrect ? 'correct' : 'incorrect'));
    setActiveHiddenWord(null);
    setUserInput('');
  };

  const selectedWord = selectedWordIndex !== null ? words[selectedWordIndex] : null;

  // Calculate score
  const totalHiddenWords = useMemo(() => {
    return hiddenIndicesPerPhrase.reduce((sum, set) => sum + set.size, 0);
  }, [hiddenIndicesPerPhrase]);

  const answeredCount = wordResults.size;
  const correctCount = Array.from(wordResults.values()).filter(r => r === 'correct').length;
  const isComplete = hiddenWordsPercent > 0 && totalHiddenWords > 0 && answeredCount === totalHiddenWords;

  // Show score modal when complete
  useEffect(() => {
    if (isComplete) {
      setShowScore(true);
    }
  }, [isComplete]);

  return (
    <div className="text-xl leading-relaxed md:text-2xl md:leading-loose">
      {words.map((w, idx) => {
        const isActive = idx === activeWordIdx;
        const isSelected = selectedWordIndex === idx;
        const hasTranslation = !!w.translation && hiddenWordsPercent === 0;

        return (
          <span
            key={idx}
            ref={el => { wordRefs.current[idx] = el; }}
            className="relative inline"
          >
            <span
              data-word-index={idx}
              onClick={(e) => handleWordClick(idx, e)}
              className={`transition-all duration-150 ${
                isActive
                  ? "bg-yellow-300 dark:bg-yellow-500 dark:text-black rounded px-1"
                  : ""
              } ${hasTranslation ? 'cursor-pointer hover:underline decoration-dotted underline-offset-4' : ''} ${isSelected ? 'underline decoration-solid' : ''} ${blurText ? 'blur-[6px]' : ''}`}
            >
              {(() => {
                if (hiddenWordsPercent === 0) return w.word;

                // Split into words and spaces, preserving spaces
                const tokens = w.word.split(/(\s+)/);
                let wordCounter = 0;

                return tokens.map((token, tokenIdx) => {
                  // If it's whitespace or empty, return as-is
                  if (!token || /^\s+$/.test(token)) return token;

                  const currentWordIdx = wordCounter;
                  wordCounter++;

                  // Check if this word should be hidden
                  const shouldHide = hiddenIndicesPerPhrase[idx].has(currentWordIdx);

                  if (!shouldHide) return token;

                  const key = `${idx}-${currentWordIdx}`;
                  const result = wordResults.get(key);
                  const isActiveInput = activeHiddenWord?.phraseIdx === idx && activeHiddenWord?.wordIdx === currentWordIdx;

                  // If already answered, show the word with color
                  if (result) {
                    return (
                      <span
                        key={tokenIdx}
                        className={`font-semibold ${result === 'correct' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {token}
                      </span>
                    );
                  }

                  // If this is the active input, show input field
                  if (isActiveInput) {
                    return (
                      <span key={tokenIdx} className="inline-flex items-center">
                        <input
                          type="text"
                          value={userInput}
                          onChange={handleInputChange}
                          onKeyDown={handleInputKeyDown}
                          onBlur={() => {
                            if (userInput.trim()) checkAnswer();
                            else { setActiveHiddenWord(null); setUserInput(''); }
                          }}
                          ref={hiddenInputRef}
                          className="border-b-2 border-blue-500 bg-transparent outline-none text-center font-semibold min-w-[60px]"
                          style={{ width: `${Math.max(token.length, userInput.length + 1)}ch` }}
                          autoFocus
                        />
                      </span>
                    );
                  }

                  // Show underscores that are clickable
                  return (
                    <span
                      key={tokenIdx}
                      onClick={(e) => handleHiddenWordClick(idx, currentWordIdx, e)}
                      className="tracking-wider cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded px-0.5 transition-colors"
                    >
                      {'_'.repeat(token.length)}
                    </span>
                  );
                });
              })()}
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
          {/* Arrow pointing down */}
          <span
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-800 dark:border-t-zinc-200"
          />
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

      {/* Score display when complete */}
      {showScore && isComplete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowScore(false)}
        >
          <div
            className="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowScore(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" strokeWidth={2} />
            </button>
            <div className="text-6xl mb-4">
              {correctCount === totalHiddenWords ? '🎉' : correctCount >= totalHiddenWords / 2 ? '👍' : '📚'}
            </div>
            <h2 className="text-2xl font-bold mb-2">Complete!</h2>
            <p className="text-4xl font-bold mb-2">
              <span className="text-green-600 dark:text-green-400">{correctCount}</span>
              <span className="text-zinc-400 mx-1">/</span>
              <span>{totalHiddenWords}</span>
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {Math.round((correctCount / totalHiddenWords) * 100)}% correct
            </p>
            <button
              onClick={() => setShowScore(false)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
