# CEO GPS — LifeOS1 Dashboard

## Overview
Local-first personal command dashboard. Stack: Vite + React + Electron, backend = Cloudflare Worker (Hono), Firebase (auth) + Supabase (data persistence). Runs locally; also previewable here on port 3000 via supervisor `frontend` program (bridged through /app/frontend launcher -> `yarn --cwd /app dev`).

## Environment Setup (important)
- Real source lives in /app/src (restored from user's src.zip on 2026-07-10; the git root had a flattened/incomplete upload).
- index.html entry -> /src/main.jsx ; vite.config server: host 0.0.0.0, port 3000, allowedHosts true.
- /app/.env holds VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY/PUBLISHABLE_KEY (fallback public keys) — required or app crashes with "supabaseKey is required".
- Theme tokens + global classes (.liquid-glass, .lo-panel, sidebar, header) in /app/src/index.css. Target theme: crimson (#ff000d), black bg, dark-gray accents, glassmorphic modules, subtle hover.

## Done
- 2026-07-10: Restored folder structure, installed deps (yarn --ignore-engines), fixed Supabase crash, app running live.
- 2026-07-10: HOME page — moved Time & Weather into row 1 (4 modules; spans rebalanced to 3/3/3/3, row2 This Week span7 + Notes span5). Removed blue box-shadow highlight behind modules (index.css .liquid-glass & .lo-panel).

## Backlog / Next (one page at a time)
- HOME: shrink YouTube / Financials / Credit / Life Hacks modules to make room for more; migrate remaining hardcoded inline CSS -> index.css.
- Theme sweep across ALL panels for crimson/black/glass consistency (remove leftover teal #00c896 / blue #4ab3f4 #6aaedd in header/sidebar footer classes).
- Erebus autonomous agent: verify working end-to-end.
- Kranos: connect to open-source Hermes agent running Qwen 3.6.
- CreatorOS1 panel: image, video, doc, sheet, music creation (+ File/media storage integration via Worker).
- Integrations queued: File & media storage (Emergent object store via Worker), Twilio SMS (needs user creds). Google sign-in already present via Firebase (keep for Electron).

## Integrations status
- File/media storage: playbook retrieved, EMERGENT_LLM_KEY available. NOT yet wired.
- Twilio SMS: playbook retrieved; awaiting ACCOUNT_SID/AUTH_TOKEN/phone number.
- Auth: Firebase Google auth (existing) — recommended for Electron.

## Bug Fixes
- 2026-07-10: Task Orchestration panel crash — tasks added via Dashboard write to `tasks_queue` without a `priority`, and TaskCard called `task.priority.toUpperCase()` on undefined (ErrorBoundary blanked the app). Fixed with defensive defaults in TaskCard + task normalization on load in TaskOrchestrationPanel.jsx.

## Session 2026-07-10 (persistence + data loss fixes)
- VITE_WORKER_URL=https://lifeos1.ceogps.workers.dev set — deployed CF Worker is LIVE (/api/llm/invoke, /api/kv/*, /api/upload R2, /api/profile all 200; Groq configured server-side). This unblocks agents/LLM/emails/socials which previously defaulted to a dead api.lifeos1.ceogps.com.
- Dashboard "Add task" now writes full task object {priority, module, done} (consistency with Task panel).
- PERSISTENCE FIX (root cause of logout data loss):
  - Banner + Logo: were saved via uid-scoped saveApiKey AND truncated to 50KB (substring(0,51200)) which corrupted images. Now stored full-size in global Worker KV (banner_pic/logo_pic) + localStorage mirror.
  - Music (MusicHub): audio was stored as multi-MB data URLs in localStorage → blew ~5MB quota → silently saved nothing. Now uploads files to R2 (/api/upload) storing only URL; tracks/playlists persist+hydrate via Worker KV. Also fixed Music AI (was hitting deprecated /api/ai/generate → now /api/llm/invoke).
  - Media (MediaPanel): (1) source file was TRUNCATED at 59679 bytes in both the zip AND the GitHub repo (main branch) — ImageCard + FileRow component definitions were missing, causing a crash. Reconstructed both in matching style. (2) uploads now go to R2 + files/albums persist+hydrate via Worker KV.
- Fixed vite ELOOP watcher (server.watch.followSymlinks:false + ignored frontend/node_modules/.git).

## Verified
- Media Studio + Music Hub render with no page errors. KV (persistent memory) + R2 upload + LLM invoke confirmed 200 on live worker.

## Next (user priorities)
- Emails + Socials: verify data flows now that worker URL is set (may need OAuth keys user will provide).
- Messages: DEFER — user will overhaul.
- Theme sweep: teal (#00c896)/blue accents -> crimson across panels (Media buttons still teal).
- Kranos + Hermes/Qwen 3.6 agent (user sent qwen.zip: qwen/QWEN.md + qwen/creator.js) and Erebus verification. CreatorOS1.
