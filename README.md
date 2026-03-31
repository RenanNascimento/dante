# Dante - EPUB Reader

An EPUB reader application with text-to-speech playback and dictionary lookup, built with Next.js and epubjs.

## Project Structure

```
dante/
├── pants.toml              # Pants build system configuration
├── BUILD                   # Root BUILD file
├── frontend/               # Next.js EPUB reader application
│   ├── BUILD
│   ├── package.json
│   ├── app/                # Next.js app router pages & API routes
│   ├── components/         # React components
│   └── hooks/              # Custom React hooks
├── backend/                # FastAPI Python backend
│   ├── BUILD
│   ├── requirements.txt
│   ├── lock.txt
│   ├── pyproject.toml
│   └── src/api/
│       ├── BUILD
│       └── main.py
└── .gitignore
```

## Prerequisites

- Node.js 20+
- Python 3.11
- [Pants](https://www.pantsbuild.org/) build system

### Installing Pants

```bash
curl -sL https://static.pantsbuild.org/setup/get-pants.sh | bash
export PATH="$HOME/.local/bin:$PATH"
```

## Running the Applications

### Frontend (Next.js)

```bash
cd frontend && npm install
cp .env.example .env.local   # Then fill in your API keys
npm run dev                   # Start dev server at http://localhost:3000
```

### Backend (FastAPI)

```bash
# Using Pants
pants run backend/src/api:server   # Start API server at http://localhost:8000

# Using Python directly
cd backend
python -m uvicorn src.api.main:app --reload --port 8000
```

## Environment Variables

The frontend requires environment variables for full functionality. See `frontend/.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_TTS_API_KEY` | Yes | Google Cloud Text-to-Speech API key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GOOGLE_TTS_VOICE` | No | Override default TTS voice (default: `en-US-Neural2-D`) |

## API Routes (Frontend)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/tts` | POST | Text-to-speech synthesis via Google Cloud TTS |
| `/api/lookup` | GET | Dictionary word lookup |

## Deployment

### Vercel (Frontend)

The frontend deploys to Vercel automatically on push to `main`.

To set up:
1. Connect the repo to Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variables (`GOOGLE_TTS_API_KEY`, `GEMINI_API_KEY`)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, epubjs
- **Backend**: FastAPI, Python 3.11, Pydantic
- **Build System**: Pants
- **Deployment**: Vercel
