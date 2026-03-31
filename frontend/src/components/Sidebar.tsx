"use client";

import { useState } from "react";
import { MenuIcon, CloseIcon, HomeIcon, BookIcon, ClockIcon } from "@/assets/icons";

interface SidebarProps {
  currentView: "home" | "reader" | "annotation";
  readingTitle?: string;
  onNavigateHome: () => void;
  onNavigateReader: () => void;
  onNavigateAnnotation: () => void;
  hasContent: boolean;
}

export default function Sidebar({
  currentView,
  readingTitle,
  onNavigateHome,
  onNavigateReader,
  onNavigateAnnotation,
  hasContent,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Open menu"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-zinc-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Shadow Reader</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {/* Home button */}
          <button
            onClick={() => {
              onNavigateHome();
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === "home"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>

          {/* Current reading button - only shown if there's content */}
          {hasContent && (
            <button
              onClick={() => {
                onNavigateReader();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === "reader"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <BookIcon className="w-5 h-5" />
              <div className="text-left min-w-0">
                <span className="font-medium block truncate">
                  {readingTitle || "Current Reading"}
                </span>
              </div>
            </button>
          )}

          {/* Time Annotation button */}
          <button
            onClick={() => {
              onNavigateAnnotation();
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === "annotation"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <ClockIcon className="w-5 h-5" />
            <span className="font-medium">Time Annotation</span>
          </button>
        </nav>
      </div>
    </>
  );
}
