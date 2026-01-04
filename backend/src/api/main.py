"""Shadow Reader API - FastAPI backend."""

import tempfile
import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pywhispercpp.model import Model as WhisperModel

app = FastAPI(
    title="Shadow Reader API",
    description="Backend API for the Shadow Reader application",
    version="0.1.0",
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    version: str


class WordTiming(BaseModel):
    word: str
    start_time: float
    end_time: float


class ReadingContent(BaseModel):
    id: str
    title: str
    audio_url: str
    words: list[WordTiming]


class TranscriptionResponse(BaseModel):
    words: list[WordTiming]


# Load Whisper model (lazy loading)
_whisper_model = None


def get_whisper_model() -> WhisperModel:
    """Load Whisper model on first use."""
    global _whisper_model
    if _whisper_model is None:
        # Use "base" model - will download automatically on first use
        _whisper_model = WhisperModel("base", n_threads=4)
    return _whisper_model


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="healthy", version="0.1.0")


@app.get("/api/content/{content_id}", response_model=ReadingContent)
async def get_content(content_id: str) -> ReadingContent:
    """Get reading content by ID."""
    # Mock data for now
    return ReadingContent(
        id=content_id,
        title="Sample Reading",
        audio_url="/audio/sample.mp3",
        words=[
            WordTiming(word="To", start_time=0.0, end_time=0.15),
            WordTiming(word="Sherlock", start_time=0.15, end_time=0.55),
            WordTiming(word="Holmes", start_time=0.55, end_time=0.95),
            WordTiming(word="she", start_time=0.95, end_time=1.1),
            WordTiming(word="is", start_time=1.1, end_time=1.25),
            WordTiming(word="always", start_time=1.25, end_time=1.6),
            WordTiming(word="the", start_time=1.6, end_time=1.75),
            WordTiming(word="woman.", start_time=1.75, end_time=2.2),
        ],
    )


@app.post("/api/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Query(default="fr", description="Language code (e.g., fr, en, es, de)"),
) -> TranscriptionResponse:
    """
    Transcribe audio file and return word-level timestamps.

    Accepts audio files (mp3, wav, m4a, etc.) and returns word timings.

    Args:
        audio: Audio file to transcribe
        language: Language code (e.g., "fr" for French, "en" for English)
    """
    # Validate file type
    allowed_types = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/m4a", "audio/x-m4a", "audio/mp4"]
    if audio.content_type and audio.content_type not in allowed_types:
        # Be lenient - some browsers send different content types
        pass

    # Save uploaded file to temp location
    suffix = os.path.splitext(audio.filename or "audio.mp3")[1] or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        content = await audio.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name

    try:
        # Load model and transcribe with token timestamps for word-level timing
        model = get_whisper_model()
        segments = model.transcribe(tmp_path, language=language, token_timestamps=True)

        # Extract word timings from segments
        # pywhispercpp returns segments with t0/t1 in centiseconds (1/100 sec)
        words: list[WordTiming] = []
        for segment in segments:
            # Split segment text into words and estimate timing
            segment_words = segment.text.strip().split()
            if not segment_words:
                continue

            # Convert centiseconds to seconds
            start_time = segment.t0 / 100.0
            end_time = segment.t1 / 100.0
            duration = end_time - start_time

            # Distribute time evenly across words (approximation)
            time_per_word = duration / len(segment_words) if segment_words else 0

            for i, word in enumerate(segment_words):
                word_start = start_time + (i * time_per_word)
                word_end = start_time + ((i + 1) * time_per_word)
                words.append(
                    WordTiming(
                        word=word.strip(),
                        start_time=round(word_start, 2),
                        end_time=round(word_end, 2),
                    )
                )

        return TranscriptionResponse(words=words)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
