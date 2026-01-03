export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export interface ReadingContent {
  id: string;
  title: string;
  audioUrl: string;
  words: WordTiming[];
}

// Base path for assets (handles GitHub Pages deployment)
const basePath = process.env.NODE_ENV === "production" ? "/dante" : "";

// Mock content with word timings
// Using local audio file for development
export const mockContent: ReadingContent = {
  id: "1",
  title: "Sample Reading",
  audioUrl: `${basePath}/audio/sample.mp3`,
  words: [
    { word: "To", startTime: 0.0, endTime: 0.15 },
    { word: "Sherlock", startTime: 0.15, endTime: 0.55 },
    { word: "Holmes", startTime: 0.55, endTime: 0.95 },
    { word: "she", startTime: 0.95, endTime: 1.1 },
    { word: "is", startTime: 1.1, endTime: 1.25 },
    { word: "always", startTime: 1.25, endTime: 1.6 },
    { word: "the", startTime: 1.6, endTime: 1.75 },
    { word: "woman.", startTime: 1.75, endTime: 2.2 },
    { word: "I", startTime: 2.2, endTime: 2.35 },
    { word: "have", startTime: 2.35, endTime: 2.5 },
    { word: "seldom", startTime: 2.5, endTime: 2.9 },
    { word: "heard", startTime: 2.9, endTime: 3.15 },
    { word: "him", startTime: 3.15, endTime: 3.35 },
    { word: "mention", startTime: 3.35, endTime: 3.7 },
    { word: "her", startTime: 3.7, endTime: 3.9 },
    { word: "under", startTime: 3.9, endTime: 4.15 },
    { word: "any", startTime: 4.15, endTime: 4.35 },
    { word: "other", startTime: 4.35, endTime: 4.6 },
    { word: "name.", startTime: 4.6, endTime: 5.0 },
    { word: "In", startTime: 5.0, endTime: 5.15 },
    { word: "his", startTime: 5.15, endTime: 5.3 },
    { word: "eyes", startTime: 5.3, endTime: 5.6 },
    { word: "she", startTime: 5.6, endTime: 5.8 },
    { word: "eclipses", startTime: 5.8, endTime: 6.3 },
    { word: "and", startTime: 6.3, endTime: 6.45 },
    { word: "predominates", startTime: 6.45, endTime: 7.1 },
    { word: "the", startTime: 7.1, endTime: 7.25 },
    { word: "whole", startTime: 7.25, endTime: 7.5 },
    { word: "of", startTime: 7.5, endTime: 7.6 },
    { word: "her", startTime: 7.6, endTime: 7.8 },
    { word: "sex.", startTime: 7.8, endTime: 8.2 },
  ],
};

export function getFullText(content: ReadingContent): string {
  return content.words.map((w) => w.word).join(" ");
}
