"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SelectionState {
  text: string;
  x: number;
  y: number;
}

interface UseTextSelectionOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentsRef: React.RefObject<any>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isReady: boolean;
}

export default function useTextSelection({ contentsRef, containerRef, isReady }: UseTextSelectionOptions) {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const skipNextRef = useRef(false);

  const dismiss = useCallback(() => {
    setSelection(null);
  }, []);

  const skipNext = useCallback(() => {
    skipNextRef.current = true;
  }, []);

  useEffect(() => {
    const contents = contentsRef.current;
    const doc = contents?.document as Document | undefined;
    if (!doc) return;

    // selectionchange fires on all platforms: desktop dblclick/drag AND
    // iOS long-press. Debounce so the tooltip only appears once the
    // selection stabilises.
    let timer: ReturnType<typeof setTimeout>;
    let programmaticClear = false;
    const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const onSelectionChange = () => {
      if (programmaticClear) {
        programmaticClear = false;
        return;
      }

      clearTimeout(timer);
      timer = setTimeout(() => {
        if (skipNextRef.current) {
          skipNextRef.current = false;
          return;
        }

        const sel = doc.getSelection();
        if (!sel || sel.rangeCount === 0) {
          setSelection(null);
          return;
        }

        const text = sel.toString().trim();
        if (!text) {
          setSelection(null);
          return;
        }

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const container = containerRef.current;
        if (!container) return;

        const iframe = container.querySelector("iframe");
        if (!iframe) return;

        const iframeRect = iframe.getBoundingClientRect();

        // On touch devices, clear native selection to dismiss the iOS
        // context menu (Copy / Look Up / Translate). Our tooltip replaces it.
        if (isTouchDevice) {
          programmaticClear = true;
          sel.removeAllRanges();
        }

        setSelection({
          text,
          x: iframeRect.left + rect.left + rect.width / 2,
          y: iframeRect.top + rect.bottom,
        });
      }, 300);
    };

    doc.addEventListener("selectionchange", onSelectionChange);
    return () => {
      clearTimeout(timer);
      doc.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [contentsRef, containerRef, isReady]);

  return { selection, dismiss, skipNext };
}
