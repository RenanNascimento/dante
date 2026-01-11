"use client";

import { useState } from "react";
import ShadowReader from "@/components/ShadowReader";
import UploadContent from "@/components/UploadContent";
import Sidebar from "@/components/Sidebar";
import TimeAnnotation from "@/components/TimeAnnotation";
import { ReadingContent, mockContent } from "@/data/mockContent";

type View = "home" | "reader" | "annotation";

export default function Home() {
  const [content, setContent] = useState<ReadingContent | null>(null);
  const [currentView, setCurrentView] = useState<View>("home");

  const handleContentReady = (newContent: ReadingContent) => {
    setContent(newContent);
    setCurrentView("reader");
  };

  const handleNavigateHome = () => {
    setCurrentView("home");
  };

  const handleNavigateReader = () => {
    if (content) {
      setCurrentView("reader");
    }
  };

  const handleNavigateAnnotation = () => {
    setCurrentView("annotation");
  };

  const handleUseMock = () => {
    setContent(mockContent);
    setCurrentView("reader");
  };

  return (
    <div>
      <Sidebar
        currentView={currentView}
        readingTitle={content?.title}
        onNavigateHome={handleNavigateHome}
        onNavigateReader={handleNavigateReader}
        onNavigateAnnotation={handleNavigateAnnotation}
        hasContent={!!content}
      />

      {currentView === "reader" && content ? (
        <ShadowReader content={content} />
      ) : currentView === "annotation" ? (
        <TimeAnnotation />
      ) : (
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
      )}
    </div>
  );
}
