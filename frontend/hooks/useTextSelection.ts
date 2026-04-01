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
  contentsVersion: number;
}

export default function useTextSelection({ contentsRef, containerRef, contentsVersion }: UseTextSelectionOptions) {
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

    const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const getTooltipPos = () => {
      const sel = doc.getSelection();
      if (!sel || sel.rangeCount === 0) return null;

      const text = sel.toString().trim();
      if (!text) return null;

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const container = containerRef.current;
      if (!container) return null;

      const iframe = container.querySelector("iframe");
      if (!iframe) return null;

      const iframeRect = iframe.getBoundingClientRect();

      return {
        text,
        x: iframeRect.left + rect.left + rect.width / 2,
        y: iframeRect.top + rect.bottom,
      };
    };

    // Desktop: double-click selects a word
    const onDblClick = () => {
      if (skipNextRef.current) {
        skipNextRef.current = false;
        return;
      }
      setTimeout(() => {
        const pos = getTooltipPos();
        if (pos) setSelection(pos);
        else setSelection(null);
      }, 10);
    };

    // Desktop: drag selection
    const onMouseUp = () => {
      if (skipNextRef.current) {
        skipNextRef.current = false;
        return;
      }
      setTimeout(() => {
        const sel = doc.getSelection();
        const text = sel?.toString().trim();
        // Only trigger for drag selections (multi-char), not single clicks
        if (!text || (text.split(/\s+/).length < 2 && text.length < 3)) return;
        const pos = getTooltipPos();
        if (pos) setSelection(pos);
      }, 10);
    };

    // Click elsewhere dismisses tooltip
    const onClick = () => {
      if (skipNextRef.current) return;
      const sel = doc.getSelection();
      const text = sel?.toString().trim();
      if (!text) {
        setSelection(null);
      }
    };

    // iOS: selectionchange fires on long-press selection (dblclick/mouseup don't)
    let selTimer: ReturnType<typeof setTimeout>;
    let programmaticClear = false;

    const onSelectionChange = () => {
      if (programmaticClear) {
        programmaticClear = false;
        return;
      }
      clearTimeout(selTimer);
      selTimer = setTimeout(() => {
        if (skipNextRef.current) {
          skipNextRef.current = false;
          return;
        }

        const pos = getTooltipPos();
        if (!pos) {
          setSelection(null);
          return;
        }

        // On touch devices, clear native selection to dismiss the iOS
        // context menu (Copy / Look Up / Translate). Our tooltip replaces it.
        if (isTouchDevice) {
          const sel = doc.getSelection();
          if (sel) {
            programmaticClear = true;
            sel.removeAllRanges();
          }
        }

        setSelection(pos);
      }, 300);
    };

    doc.addEventListener("dblclick", onDblClick);
    doc.addEventListener("mouseup", onMouseUp);
    doc.addEventListener("click", onClick);
    doc.addEventListener("selectionchange", onSelectionChange);

    return () => {
      clearTimeout(selTimer);
      doc.removeEventListener("dblclick", onDblClick);
      doc.removeEventListener("mouseup", onMouseUp);
      doc.removeEventListener("click", onClick);
      doc.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [contentsRef, containerRef, contentsVersion]);

  return { selection, dismiss, skipNext };
}
