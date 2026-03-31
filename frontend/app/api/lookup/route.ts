import { NextRequest, NextResponse } from "next/server";

const DICTIONARY_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

export async function POST(request: NextRequest) {
  const { text, action } = await request.json();
  if (!text || typeof text !== "string" || !["meaning"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Clean up: take only the first word for dictionary lookup
  const word = text.split(/\s+/)[0].replace(/[^a-zA-Z'-]/g, "").toLowerCase();
  if (!word) {
    return NextResponse.json({ error: "No valid word found" }, { status: 400 });
  }

  try {
    const response = await fetch(`${DICTIONARY_URL}/${encodeURIComponent(word)}`);

    if (!response.ok) {
      return NextResponse.json({ result: `No definition found for "${word}".` });
    }

    const data = await response.json();
    const entry = data[0];
    const lines: string[] = [];

    // Phonetic
    if (entry.phonetic) {
      lines.push(entry.phonetic);
    }

    // Definitions (max 3)
    let count = 0;
    for (const meaning of entry.meanings || []) {
      for (const def of meaning.definitions || []) {
        if (count >= 3) break;
        lines.push(`(${meaning.partOfSpeech}) ${def.definition}`);
        count++;
      }
      if (count >= 3) break;
    }

    const result = lines.join("\n");
    return NextResponse.json({ result: result || `No definition found for "${word}".` });
  } catch (err) {
    return NextResponse.json(
      { error: "Dictionary API error", details: String(err) },
      { status: 500 }
    );
  }
}
