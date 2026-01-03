"use client";

import { useState, useRef } from "react";
import { ReadingContent, WordTiming } from "@/data/mockContent";

interface UploadContentProps {
  onContentReady: (content: ReadingContent) => void;
}

function generateWordTimings(text: string): WordTiming[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const timings: WordTiming[] = [];
  let currentTime = 0;

  for (const word of words) {
    // Estimate duration based on word length (roughly 0.1s per character, min 0.2s)
    const duration = Math.max(0.2, word.length * 0.08);
    timings.push({
      word,
      startTime: currentTime,
      endTime: currentTime + duration,
    });
    currentTime += duration + 0.1; // Add small gap between words
  }

  return timings;
}

export default function UploadContent({ onContentReady }: UploadContentProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("My Reading");
  const [error, setError] = useState<string>("");

  const textInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleTextFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      setError("Please upload a .txt file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTextContent(text);
      setError("");
    };
    reader.onerror = () => {
      setError("Failed to read text file");
    };
    reader.readAsText(file);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please upload an audio file (mp3, wav, etc.)");
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setError("");
  };

  const handleSubmit = () => {
    if (!textContent.trim()) {
      setError("Please upload a text file");
      return;
    }

    if (!audioUrl) {
      setError("Please upload an audio file");
      return;
    }

    const words = generateWordTimings(textContent);

    const content: ReadingContent = {
      id: Date.now().toString(),
      title,
      audioUrl,
      words,
    };

    onContentReady(content);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Shadow Reader</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">
          Upload your text and audio to start reading
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Title input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a title for your reading"
          />
        </div>

        {/* Text file upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Text File (.txt)</label>
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
            {textContent ? "Text uploaded" : "Choose text file"}
          </button>
          {textContent && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {textContent.split(/\s+/).length} words loaded
            </p>
          )}
        </div>

        {/* Audio file upload */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Audio File</label>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
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
            {audioFile ? audioFile.name : "Choose audio file"}
          </button>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!textContent || !audioUrl}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          Start Reading
        </button>
      </div>
    </div>
  );
}
