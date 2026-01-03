"use client";

import { useState } from "react";
import ShadowReader from "@/components/ShadowReader";
import UploadContent from "@/components/UploadContent";
import { ReadingContent, mockContent } from "@/data/mockContent";

export default function Home() {
  const [content, setContent] = useState<ReadingContent | null>(null);
  const [useMock, setUseMock] = useState(false);

  const handleContentReady = (newContent: ReadingContent) => {
    setContent(newContent);
  };

  const handleBack = () => {
    setContent(null);
    setUseMock(false);
  };

  const handleUseMock = () => {
    setContent(mockContent);
    setUseMock(true);
  };

  if (content) {
    return (
      <div>
        <button
          onClick={handleBack}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Go back"
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
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <ShadowReader content={content} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <UploadContent onContentReady={handleContentReady} />
      <div className="mt-4 text-center">
        <span className="text-zinc-500 dark:text-zinc-400">or </span>
        <button
          onClick={handleUseMock}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          try with sample content
        </button>
      </div>
    </div>
  );
}
