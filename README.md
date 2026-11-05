# Song Forge — AI music generator

Generate original songs from a text prompt using the [sunoapi.org](https://sunoapi.org) API.

- **Simple mode** — describe the song; lyrics are written for you.
- **Custom mode** — set title, style, your own lyrics, vocals, negative tags, style adherence and weirdness.
- Instrumental toggle and model picker (V6, V6 Mini, V6 Wild, V5, V4.5 family).
- Tracks stream as soon as they're ready, then become downloadable MP3s. Your library is saved in the browser.
- Remaining API credits shown in the header.

## Stack

- `public/` — static HTML/CSS/JS, no build step.
- `netlify/functions/` — serverless proxy so the API key never reaches the browser:
  - `POST /api/generate` → `POST /api/v1/generate`
  - `GET  /api/status?taskId=` → `GET /api/v1/generate/record-info`
  - `GET  /api/credits` → `GET /api/v1/generate/credit`
  - `POST /api/callback` — required `callBackUrl` target (the app polls for results).

## Deploy on Netlify

1. **Add new site → Import an existing project** and pick this repo. Build settings come from `netlify.toml` (no build command, publish `public`).
2. **Site configuration → Environment variables** → add `SUNO_API_KEY` = your sunoapi.org key.
3. Deploy (or **Trigger deploy** if you added the variable after the first deploy).

> Never commit your API key. It belongs only in Netlify's environment variables.

## Run locally

```bash
npm i -g netlify-cli
SUNO_API_KEY=your_key netlify dev
```
