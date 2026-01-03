# Dante - Shadow Reader

A shadow reading application where users read text while listening to audio, with real-time word highlighting synchronized to playback.

## Project Structure

```
dante/
├── pants.toml              # Pants build system configuration
├── BUILD                   # Root BUILD file
├── frontend/               # Next.js application
│   ├── BUILD
│   ├── package.json
│   └── src/
│       ├── app/
│       ├── components/
│       └── data/
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

- Node.js 18+
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
# Using npm directly
cd frontend && npm install
cd frontend && npm run dev

# Using Pants
pants run frontend:install   # Install dependencies
pants run frontend:dev       # Start dev server at http://localhost:3000
pants run frontend:build     # Build for production
pants run frontend:lint      # Run ESLint
```

### Backend (FastAPI)

```bash
# Using Pants
pants run backend/src/api:server   # Start API server at http://localhost:8000

# Using Python directly
cd backend
python -m uvicorn src.api.main:app --reload --port 8000
```

## Pants Commands

### General

```bash
pants list ::                # List all targets in the monorepo
pants list backend/::        # List all backend targets
pants list frontend/::       # List all frontend targets
```

### Python (Backend)

```bash
pants check backend/::       # Type check with MyPy
pants lint backend/::        # Lint with Black and isort
pants fmt backend/::         # Format code with Black and isort
pants test backend/::        # Run pytest tests
pants package backend/src/api:server   # Build PEX binary
```

### Lock Files

```bash
pants generate-lockfiles     # Regenerate Python lock file
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/content/{id}` | GET | Get reading content by ID |

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11, Pydantic
- **Build System**: Pants
