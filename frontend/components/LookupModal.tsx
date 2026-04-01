"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import type { Theme } from "@/hooks/useEpub";

interface LookupModalProps {
  text: string;
  action: "meaning";
  theme: Theme;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
}

export default function LookupModal({
  text,
  action,
  theme,
  onClose,
  initialX = 100,
  initialY = 100,
}: LookupModalProps) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, action }),
        });
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        setResult(data.result);
      } catch {
        setError(true);
      }
    })();
  }, [text, action]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const bg = theme === "dark" ? "bg-zinc-900" : "bg-white";
  const border = theme === "dark" ? "border-zinc-700" : "border-stone-200";
  const textColor = theme === "dark" ? "text-zinc-200" : "text-stone-800";
  const mutedColor = theme === "dark" ? "text-zinc-400" : "text-stone-500";
  const headerBg = theme === "dark" ? "bg-zinc-800" : "bg-stone-50";

  const label = "Meaning";

  return (
    <div
      className={`fixed z-50 w-72 rounded-lg shadow-xl border ${bg} ${border} overflow-hidden`}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Draggable header */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`flex items-center justify-between px-3 py-2 cursor-move select-none touch-none ${headerBg} border-b ${border}`}
      >
        <span className={`text-xs font-medium ${mutedColor}`}>{label}</span>
        <button
          onClick={onClose}
          className={`text-sm ${mutedColor} hover:${textColor} cursor-pointer leading-none`}
        >
          ×
        </button>
      </div>

      <div className="p-3">
        <p className={`text-xs ${mutedColor} mb-2 italic truncate`}>"{text}"</p>
        {error ? (
          <p className={`text-xs text-red-400`}>Failed to fetch result.</p>
        ) : result === null ? (
          <p className={`text-xs ${mutedColor} animate-pulse`}>Loading...</p>
        ) : (
          <div className={`text-sm ${textColor} leading-relaxed whitespace-pre-line`}>{result}</div>
        )}
      </div>
    </div>
  );
}
