"""Shadow Reader API - FastAPI backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
