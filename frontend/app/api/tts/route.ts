import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const MAX_SSML_BYTES = 4800;

interface Timepoint {
  markName: string;
  timeSeconds: number;
}

interface WordTimepoint {
  word: string;
  timeSeconds: number;
}

function textToSsmlChunks(text: string, maxBytes: number): { ssml: string; words: string[] }[] {
  const encoder = new TextEncoder();
  const allWords = text.split(/\s+/).filter(Boolean);
  const chunks: { ssml: string; words: string[] }[] = [];

  let i = 0;
  while (i < allWords.length) {
    let ssml = "<speak>";
    const chunkWords: string[] = [];

    while (i < allWords.length) {
      const word = allWords[i];
      const mark = `<mark name="w${chunkWords.length}"/>${word} `;
      const candidate = ssml + mark + "</speak>";
      if (encoder.encode(candidate).length > maxBytes && chunkWords.length > 0) break;
      ssml += mark;
      chunkWords.push(word);
      i++;
    }

    ssml += "</speak>";
    chunks.push({ ssml, words: chunkWords });
  }

  return chunks;
}

async function synthesizeChunk(
  ssml: string,
  apiKey: string,
  voiceName: string,
  languageCode: string,
  speakingRate: number
): Promise<{ audioContent: string; timepoints: Timepoint[] }> {
  const response = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { ssml },
      voice: { languageCode, name: voiceName },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate,
        pitch: -1.0,
        effectsProfileId: ["large-home-entertainment-class-device"],
      },
      enableTimePointing: ["SSML_MARK"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const data = await response.json();
  return {
    audioContent: data.audioContent,
    timepoints: data.timepoints || [],
  };
}

function getAudioDuration(base64: string): number {
  // Estimate MP3 duration from buffer size (128kbps default for Google TTS)
  const bytes = Buffer.from(base64, "base64").length;
  return (bytes * 8) / (128 * 1000);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_TTS_API_KEY not configured" }, { status: 500 });
  }

  const { text, speakingRate } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  const rate = typeof speakingRate === "number" ? Math.max(0.25, Math.min(4.0, speakingRate)) : 0.75;

  const voiceName = process.env.GOOGLE_TTS_VOICE || "en-US-Neural2-C";
  const languageCode = voiceName.split("-").slice(0, 2).join("-");

  try {
    const chunks = textToSsmlChunks(text, MAX_SSML_BYTES);
    const results = await Promise.all(
      chunks.map((chunk) => synthesizeChunk(chunk.ssml, apiKey, voiceName, languageCode, rate))
    );

    // Merge audio and timepoints across chunks
    const audioBuffers: Buffer[] = [];
    const allTimepoints: WordTimepoint[] = [];
    let timeOffset = 0;
    let globalWordIndex = 0;

    for (let c = 0; c < results.length; c++) {
      const { audioContent, timepoints } = results[c];
      const words = chunks[c].words;
      const buf = Buffer.from(audioContent, "base64");
      audioBuffers.push(buf);

      // Map timepoints back to words with time offset
      for (const tp of timepoints) {
        const localIndex = parseInt(tp.markName.replace("w", ""), 10);
        if (localIndex < words.length) {
          allTimepoints.push({
            word: words[localIndex],
            timeSeconds: tp.timeSeconds + timeOffset,
          });
        }
        globalWordIndex++;
      }

      // Fill in words that didn't get timepoints
      const timepointedIndices = new Set(timepoints.map((tp) => parseInt(tp.markName.replace("w", ""), 10)));
      for (let w = 0; w < words.length; w++) {
        if (!timepointedIndices.has(w)) {
          // Interpolate: find nearest timepoints before and after
          const before = timepoints.filter((tp) => parseInt(tp.markName.replace("w", ""), 10) < w).pop();
          const after = timepoints.find((tp) => parseInt(tp.markName.replace("w", ""), 10) > w);
          const t = before ? before.timeSeconds : after ? after.timeSeconds * (w / parseInt(after.markName.replace("w", ""), 10)) : 0;
          allTimepoints.push({
            word: words[w],
            timeSeconds: t + timeOffset,
          });
        }
      }

      timeOffset += getAudioDuration(audioContent);
    }

    // Sort timepoints by time
    allTimepoints.sort((a, b) => a.timeSeconds - b.timeSeconds);

    const combinedAudio = Buffer.concat(audioBuffers).toString("base64");

    return NextResponse.json({
      audio: combinedAudio,
      timepoints: allTimepoints,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Google TTS API error", details: String(err) },
      { status: 500 }
    );
  }
}
