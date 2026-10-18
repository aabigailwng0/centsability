# Centsability

*Understanding Your Sense of Cents.* A browser-based financial literacy game where you advise customers at a counter.

## Structure

- `frontend/` : Vite + React app (port 5173)
- `backend/` : Express API (port 3001)

The frontend calls the backend through a Vite dev proxy (`/api` -> `http://localhost:3001`). API keys live only in `backend/.env`, never in the frontend.

One day has 2 customers. Each customer is budgeting, saving, or debt, and the player works through 4 stages worth 25 stars each. The corner total updates after the customer is finished. The last screen shows which of the two topics went better, with the stars for that visit and three short notes.

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
| `NESSIE_API_KEY` | Nessie mock-banking key. Scenario numbers come from Nessie when it responds, otherwise from the hardcoded fallback. |
| `NESSIE_BASE_URL` | Nessie base URL. |
| `GEMINI_API_KEY` | Gemini key. Used to grade the typed answers and to rephrase the end-of-day notes. |
| `GEMINI_MODEL` | Gemini model name. The code reads this variable and does not hardcode a model. |
| `PORT` | Backend port (default `3001`). If you change it, update the proxy target in `frontend/vite.config.js`. |

## Deploy on Vercel

Two Vercel projects from this one repo:

- **Backend**: Root Directory `backend`. Add `NESSIE_API_KEY`, `NESSIE_BASE_URL`, `GEMINI_API_KEY`, and `GEMINI_MODEL` under Project Settings, Environment Variables. The `.env` file is not uploaded.
- **Frontend**: Root Directory `frontend`, Framework Preset Vite. `frontend/vercel.json` rewrites `/api/*` to the backend URL, so the browser only ever calls its own domain. If the backend URL changes, update the `destination` there.

Push to GitHub to redeploy both. Test the backend alone at `<backend-url>/api/health`.

## Art

Stage photos live in `frontend/public/assets/`. Customer animals are the bear, bunny, and fox. The player's avatar is the cat, cow, or dog. Avatar choices are listed in `frontend/src/config/avatars.js`.
