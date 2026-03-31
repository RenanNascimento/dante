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

    // Double-click: select word and show tooltip
    const onDblClick = () => {
      if (skipNextRef.current) {
        skipNextRef.current = false;
        return;
      }

      setTimeout(() => {
        const sel = doc.getSelection();
        if (!sel || sel.rangeCount === 0) return;

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

        setSelection({
          text,
          x: iframeRect.left + rect.left + rect.width / 2,
          y: iframeRect.top + rect.top,
        });
      }, 10);
    };

    // Drag selection: show tooltip on mouseup if text is selected
    const onMouseUp = () => {
      if (skipNextRef.current) {
        skipNextRef.current = false;
        return;
      }

      setTimeout(() => {
        const sel = doc.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const text = sel.toString().trim();
        // Only trigger for drag selections (multi-char), not single clicks
        if (!text || text.split(/\s+/).length < 2 && text.length < 3) {
          return;
        }

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const container = containerRef.current;
        if (!container) return;

        const iframe = container.querySelector("iframe");
        if (!iframe) return;

        const iframeRect = iframe.getBoundingClientRect();

        setSelection({
          text,
          x: iframeRect.left + rect.left + rect.width / 2,
          y: iframeRect.top + rect.top,
        });
      }, 10);
    };

    // Single click elsewhere dismisses tooltip
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
    return () => {
      doc.removeEventListener("dblclick", onDblClick);
      doc.removeEventListener("mouseup", onMouseUp);
      doc.removeEventListener("click", onClick);
    };
  }, [contentsRef, containerRef, isReady]);

  return { selection, dismiss, skipNext };
}
