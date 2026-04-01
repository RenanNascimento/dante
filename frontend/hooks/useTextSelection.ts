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
  selectMode: boolean;
}

export default function useTextSelection({ contentsRef, containerRef, contentsVersion, selectMode }: UseTextSelectionOptions) {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const skipNextRef = useRef(false);

  const dismiss = useCallback(() => {
    setSelection(null);
  }, []);

  const skipNext = useCallback(() => {
    skipNextRef.current = true;
  }, []);

  // Clear selection when select mode is toggled off
  useEffect(() => {
    if (!selectMode) {
      setSelection(null);
    }
  }, [selectMode]);

  useEffect(() => {
    if (!selectMode) return;

    const contents = contentsRef.current;
    const doc = contents?.document as Document | undefined;
    if (!doc) return;

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

    doc.addEventListener("dblclick", onDblClick);
    doc.addEventListener("mouseup", onMouseUp);
    doc.addEventListener("click", onClick);

    // iOS Safari: selectionchange doesn't fire on iframe documents,
    // and dblclick/mouseup don't fire on touch. Poll the iframe
    // selection instead. With overlays hidden in select mode the
    // native long-press works — we just need to detect when it settles.
    const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    let pollId: ReturnType<typeof setInterval> | undefined;
    if (isTouchDevice) {
      let lastText = "";
      pollId = setInterval(() => {
        if (skipNextRef.current) {
          skipNextRef.current = false;
          return;
        }
        const sel = doc.getSelection();
        const text = sel?.toString().trim() || "";

        if (text && text === lastText) {
          const pos = getTooltipPos();
          if (pos) {
            sel!.removeAllRanges();
            setSelection(pos);
          }
          lastText = "";
          return;
        }
        lastText = text;
      }, 300);
    }

    return () => {
      if (pollId) clearInterval(pollId);
      doc.removeEventListener("dblclick", onDblClick);
      doc.removeEventListener("mouseup", onMouseUp);
      doc.removeEventListener("click", onClick);
    };
  }, [contentsRef, containerRef, contentsVersion, selectMode]);

  return { selection, dismiss, skipNext };
}
