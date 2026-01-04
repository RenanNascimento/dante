"use client";


import { WordTiming } from "@/data/mockContent";


interface TextDisplayProps {
  words: WordTiming[];
  currentTime: number;
}

import { useRef, useEffect } from "react";

export default function TextDisplay({ words, currentTime }: TextDisplayProps) {
  // Group words into phrases (split by . ! ?)
  const phrases: { words: WordTiming[]; startTime: number; endTime: number }[] = [];
  let currentPhrase: WordTiming[] = [];
  const punctRegex = /[.!?]/;
  words.forEach((w, i) => {
    currentPhrase.push(w);
    if (punctRegex.test(w.word) || punctRegex.test(w.word.slice(-1)) || i === words.length - 1) {
      if (currentPhrase.length > 0) {
        phrases.push({
          words: [...currentPhrase],
          startTime: currentPhrase[0].startTime,
          endTime: currentPhrase[currentPhrase.length - 1].endTime,
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

  return (
    <div className="text-xl leading-relaxed md:text-2xl md:leading-loose">
      {phrases.map((phrase, idx) => (
        <span
          key={idx}
          ref={el => (phraseRefs.current[idx] = el)}
          className={`transition-colors duration-150 ${
            idx === activePhraseIdx
              ? "bg-yellow-300 dark:bg-yellow-500 dark:text-black rounded px-1"
              : ""
          }`}
        >
          {phrase.words.map((w, wi) => w.word + (wi < phrase.words.length - 1 ? " " : ""))}
          {" "}
        </span>
      ))}
    </div>
  );
}
