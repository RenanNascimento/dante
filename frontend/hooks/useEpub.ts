"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseEpubOptions {
  data: ArrayBuffer;
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialCfi?: string;
  initialFontSize?: number;
  initialTheme?: Theme;
}

export type Theme = "dark" | "light";

export interface Paragraph {
  text: string;
  wordOffset: number;
}

interface UseEpubReturn {
  progress: number;
  currentPage: number;
  totalPages: number;
  currentCfi: string;
  goNext: () => void;
  goPrev: () => void;
  goToPage: (page: number) => void;
  title: string;
  isReady: boolean;
  fontSize: number;
  setFontSize: (size: number) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getPageText: () => string;
  getPageParagraphs: () => Paragraph[];
  prepareHighlighting: () => void;
  highlightWord: (index: number) => void;
  clearHighlight: () => void;
  contentsVersion: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentsRef: React.RefObject<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renditionRef: React.RefObject<any>;
}

export default function useEpub({ data, containerRef, initialCfi, initialFontSize = 100, initialTheme = "dark" }: UseEpubOptions): UseEpubReturn {
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentCfi, setCurrentCfi] = useState("");
  const [title, setTitle] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [contentsVersion, setContentsVersion] = useState(0);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const themeRef = useRef<Theme>(theme);
  themeRef.current = theme;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentsRef = useRef<any>(null);

  // Store the current location from the relocated event — provides
  // start/end CFIs that mark the exact boundaries of visible content.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locationRef = useRef<any>(null);

  const goNext = useCallback(() => {
    return renditionRef.current?.next();
  }, []);

  const goPrev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  const goToPage = useCallback((page: number) => {
    const book = bookRef.current;
    if (!book || !book.locations || totalPages === 0) return;
    const clamped = Math.max(1, Math.min(page, totalPages));
    const cfi = book.locations.cfiFromPercentage((clamped - 1) / totalPages);
    renditionRef.current?.display(cfi);
  }, [totalPages]);

  const wordRangesRef = useRef<Range[]>([]);

  const BLOCK_TAGS = new Set([
    "P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6",
    "LI", "BLOCKQUOTE", "SECTION", "ARTICLE", "TD", "TH",
    "DT", "DD", "FIGCAPTION", "PRE",
  ]);

  const getBlockAncestor = useCallback((node: Node): Element => {
    let el = node.parentElement;
    while (el && !BLOCK_TAGS.has(el.tagName)) {
      el = el.parentElement;
    }
    return el || node.ownerDocument!.body;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Core visibility function: returns a Range for every WORD on the
   * current page, along with its parent text node.
   *
   * Checks each word individually because a single text node can span
   * multiple CSS columns (pages). The outer container's scrollLeft +
   * clientWidth defines the visible horizontal band.
   */
  const getVisibleWords = useCallback((): { range: Range; word: string; node: Text }[] => {
    const contents = contentsRef.current;
    const doc = contents?.document as Document | undefined;
    if (!doc?.body) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manager = (renditionRef.current as any)?.manager;
    const container = manager?.container as HTMLElement | undefined;
    if (!container) return [];

    const scrollLeft = container.scrollLeft;
    const pageWidth = container.clientWidth;

    const words: { range: Range; word: string; node: Text }[] = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let node: Text | null;

    while ((node = walker.nextNode() as Text | null)) {
      if (!node.textContent || !/\S/.test(node.textContent)) continue;
      const text = node.textContent;
      const regex = /\S+/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const r = doc.createRange();
        r.setStart(node, match.index);
        r.setEnd(node, match.index + match[0].length);
        const rect = r.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.right > scrollLeft && rect.left < scrollLeft + pageWidth) {
          words.push({ range: r, word: match[0], node });
        }
      }
    }

    return words;
  }, []);

  const getPageText = useCallback(() => {
    return getVisibleWords().map((w) => w.word).join(" ");
  }, [getVisibleWords]);

  const getPageParagraphs = useCallback((): Paragraph[] => {
    const words = getVisibleWords();
    if (words.length === 0) return [];

    // Group words by block-level ancestor
    const groups: { block: Element; words: string[] }[] = [];
    let currentBlock: Element | null = null;

    for (const { word, node } of words) {
      const block = getBlockAncestor(node);
      if (block !== currentBlock) {
        groups.push({ block, words: [] });
        currentBlock = block;
      }
      groups[groups.length - 1].words.push(word);
    }

    const paragraphs: Paragraph[] = [];
    let wordOffset = 0;

    for (const group of groups) {
      const text = group.words.join(" ");
      if (!text) continue;
      paragraphs.push({ text, wordOffset });
      wordOffset += group.words.length;
    }

    return paragraphs;
  }, [getVisibleWords, getBlockAncestor]);

  /**
   * Get the iframe document (for theme injection etc.)
   */
  const getCurrentDoc = useCallback((): Document | null => {
    return contentsRef.current?.document ?? null;
  }, []);

  /**
   * Build word Ranges for the visible page — NO DOM mutation.
   * Highlighting uses the CSS Highlight API.
   */
  const prepareHighlighting = useCallback(() => {
    const doc = getCurrentDoc();
    if (!doc?.body) return;

    // Inject highlight CSS once
    if (!doc.getElementById("tts-highlight-style")) {
      const style = doc.createElement("style");
      style.id = "tts-highlight-style";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iframeWin = doc.defaultView as any;
      if (iframeWin?.Highlight) {
        style.textContent = `::highlight(tts-word) { background-color: rgba(59, 130, 246, 0.35); }`;
      } else {
        style.textContent = "";
      }
      doc.head.appendChild(style);
    }

    const words = getVisibleWords();
    wordRangesRef.current = words.map((w) => w.range);
  }, [getVisibleWords, getCurrentDoc]);

  const highlightWord = useCallback((index: number) => {
    const ranges = wordRangesRef.current;
    const contents = contentsRef.current;
    const doc = contents?.document as Document | undefined;
    if (!doc) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iframeWin = doc.defaultView as any;
    if (iframeWin?.Highlight && index >= 0 && index < ranges.length) {
      const h = new iframeWin.Highlight(ranges[index]);
      iframeWin.CSS.highlights.set("tts-word", h);
    }
  }, []);

  const clearHighlight = useCallback(() => {
    const contents = contentsRef.current;
    const doc = contents?.document as Document | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iframeWin = doc?.defaultView as any;
    if (iframeWin?.CSS?.highlights) {
      iframeWin.CSS.highlights.delete("tts-word");
    }
    wordRangesRef.current = [];
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data) return;

    let destroyed = false;

    async function init() {
      const ePub = (await import("epubjs")).default;

      if (destroyed) return;

      const book = ePub(data);
      bookRef.current = book;

      const rendition = book.renderTo(container!, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "none",
      });

      renditionRef.current = rendition;

      // Base styles shared by all themes
      rendition.themes.default({
        "body, body *": {
          "font-family": "'Literata', Georgia, serif !important",
        },
        body: {
          "line-height": "1.8 !important",
          "padding": "0 !important",
          "margin": "0 !important",
        },
        "img": {
          "max-width": "100% !important",
          "height": "auto !important",
        },
      });

      // Theme styles are injected via the content hook and the theme useEffect
      // (not via epub.js register/select, which injects competing stylesheets)

      // Inject Literata font + forward key events from iframe
      rendition.hooks.content.register((contents: { addStylesheet: (url: string) => void; document: Document }) => {
        contentsRef.current = contents;
        setContentsVersion((v) => v + 1);
        contents.addStylesheet(
          "https://fonts.googleapis.com/css2?family=Literata:ital,wght@0,200..900;1,200..900&display=swap"
        );
        contents.document.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "ArrowRight") rendition.next();
          if (e.key === "ArrowLeft") rendition.prev();
        });

        // Inject initial theme styles
        const t = themeRef.current;
        const css = t === "dark"
          ? `body, body * { color: #e4e4e7 !important; background-color: transparent !important; }
             body { background-color: #000000 !important; }
             a, a * { color: #a1a1aa !important; }`
          : `body, body * { color: #1c1917 !important; background-color: transparent !important; }
             body { background-color: #faf5ee !important; }
             a, a * { color: #78716c !important; }`;
        const styleEl = contents.document.createElement("style");
        styleEl.id = "b-reader-theme";
        styleEl.textContent = css;
        contents.document.head.appendChild(styleEl);
      });

      // Apply saved font size before first render
      if (initialFontSize !== 100) {
        rendition.themes.fontSize(`${initialFontSize}%`);
      }

      await rendition.display(initialCfi || undefined);

      // Get title
      const metadata = await book.loaded.metadata;
      if (!destroyed) {
        setTitle(metadata.title || "Untitled");
      }

      // Generate locations for progress tracking
      await book.locations.generate(1024);

      const total = book.locations.length();
      if (!destroyed) {
        setTotalPages(total);
        setIsReady(true);
      }

      // Track progress and store location for visible text detection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rendition.on("relocated", (location: any) => {
        if (destroyed) return;
        locationRef.current = location;
        const cfi = location.start.cfi;
        const percent = book.locations.percentageFromCfi(cfi);
        setProgress(Math.round(percent * 100));
        setCurrentPage(Math.floor(percent * total) + 1);
        setCurrentCfi(cfi);
      });

      // Trigger relocated manually so page stats populate immediately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentLocation = rendition.currentLocation() as any;
      if (!destroyed && currentLocation?.start?.cfi) {
        locationRef.current = currentLocation;
        const percent = book.locations.percentageFromCfi(currentLocation.start.cfi);
        setProgress(Math.round(percent * 100));
        setCurrentPage(Math.floor(percent * total) + 1);
        setCurrentCfi(currentLocation.start.cfi);
      }
    }

    init();

    return () => {
      destroyed = true;
      if (bookRef.current) {
        bookRef.current.destroy();
        bookRef.current = null;
        renditionRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, containerRef]);

  // Apply theme by replacing a single stylesheet in the iframe
  useEffect(() => {
    const doc = getCurrentDoc();
    if (!doc?.head) return;

    const css = theme === "dark"
      ? `body, body * { color: #e4e4e7 !important; background-color: transparent !important; }
         body { background-color: #000000 !important; }
         a, a * { color: #a1a1aa !important; }`
      : `body, body * { color: #1c1917 !important; background-color: transparent !important; }
         body { background-color: #faf5ee !important; }
         a, a * { color: #78716c !important; }`;

    let styleEl = doc.getElementById("b-reader-theme") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = "b-reader-theme";
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }, [theme, getCurrentDoc]);

  // Apply font size changes
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (renditionRef.current && container) {
        renditionRef.current.resize(container.clientWidth, container.clientHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [containerRef]);

  return { progress, currentPage, totalPages, currentCfi, goNext, goPrev, goToPage, title, isReady, fontSize, setFontSize, theme, setTheme, getPageText, getPageParagraphs, prepareHighlighting, highlightWord, clearHighlight, contentsVersion, contentsRef, renditionRef };
}
