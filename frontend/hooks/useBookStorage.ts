import type { Theme } from "./useEpub";

export interface SavedSettings {
  cfi: string;
  fontSize: number;
  theme: Theme;
  speakingRate: number;
  pausePerParagraph: boolean;
  showStats: boolean;
  title: string;
}

export async function generateBookKey(data: ArrayBuffer): Promise<string> {
  const slice = data.slice(0, 10240);
  const hashBuffer = await crypto.subtle.digest("SHA-256", slice);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `b-reader:${hex.slice(0, 16)}`;
}

export function loadSettings(key: string): SavedSettings | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSettings;
  } catch {
    return null;
  }
}

export function saveSettings(key: string, settings: SavedSettings): void {
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable
  }
}
