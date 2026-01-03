"use client";

import { WordTiming } from "@/data/mockContent";

interface TextDisplayProps {
  words: WordTiming[];
  currentTime: number;
}

export default function TextDisplay({ words, currentTime }: TextDisplayProps) {
  return (
    <div className="text-xl leading-relaxed md:text-2xl md:leading-loose">
      {words.map((wordData, index) => {
        const isActive =
          currentTime >= wordData.startTime && currentTime < wordData.endTime;

        return (
          <span
            key={index}
            className={`transition-colors duration-150 ${
              isActive
                ? "bg-yellow-300 dark:bg-yellow-500 dark:text-black rounded px-0.5"
                : ""
            }`}
          >
            {wordData.word}{" "}
          </span>
        );
      })}
    </div>
  );
}
