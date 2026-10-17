# Centsability

*Understanding Your Sense of Cents.* A browser-based financial literacy game where you advise customers at a counter.

## Structure

- `frontend/` : Vite + React app (port 5173)
- `backend/` : Express API (port 3001)

The frontend calls the backend through a Vite dev proxy (`/api` -> `http://localhost:3001`). API keys live only in `backend/.env`, never in the frontend.

## Setup

Requires Node 20.6+ (22+ recommended).

```bash
# 1. Install everything (root, frontend, backend)
npm run install:all

# 2. Create your backend env file
cp backend/.env.example backend/.env      # PowerShell: Copy-Item backend/.env.example backend/.env
```

## Run

```bash
npm run dev
```

Then open http://localhost:5173. The footer shows "Server: online" when the proxy reaches the backend.

Run each side separately if you prefer:

```bash
npm run dev:backend    # http://localhost:3001/api/health
npm run dev:frontend   # http://localhost:5173
```

## Environment variables (`backend/.env`)

| Name | Purpose |
| --- | --- |
| `NESSIE_API_KEY` | Nessie (mock banking) API key. Not used yet. |
| `GEMINI_API_KEY` | Gemini API key. Not used yet. |
| `PORT` | Backend port (default `3001`). If you change it, update the proxy target in `frontend/vite.config.js`. |

## Art

Placeholder avatars are in `frontend/public/assets/avatars/`. Replace the files (or update `frontend/src/config/avatars.js`) to use real art.
