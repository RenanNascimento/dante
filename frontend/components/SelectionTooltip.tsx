"use client";

import type { Theme } from "@/hooks/useEpub";

interface SelectionTooltipProps {
  x: number;
  y: number;
  text: string;
  theme: Theme;
  onDict: () => void;
  onCopy: () => void;
}

export default function SelectionTooltip({
  x,
  y,
  theme,
  onDict,
  onCopy,
}: SelectionTooltipProps) {
  const bg = theme === "dark" ? "bg-zinc-800" : "bg-white";
  const border = theme === "dark" ? "border-zinc-700" : "border-stone-200";
  const text = theme === "dark" ? "text-zinc-200" : "text-stone-700";
  const hover = theme === "dark" ? "hover:bg-zinc-700" : "hover:bg-stone-100";

  return (
    <div
      className={`fixed z-50 flex rounded-lg shadow-lg border ${bg} ${border} overflow-hidden`}
      style={{
        left: x,
        top: y + 4,
        transform: "translateX(-50%)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        onPointerDown={(e) => { e.stopPropagation(); onDict(); }}
        className={`px-3 py-1.5 text-xs ${text} ${hover} transition-colors cursor-pointer`}
      >
        Dict
      </button>
      <button
        onPointerDown={(e) => { e.stopPropagation(); onCopy(); }}
        className={`px-3 py-1.5 text-xs ${text} ${hover} transition-colors cursor-pointer border-l ${border}`}
      >
        Copy
      </button>
    </div>
  );
}
