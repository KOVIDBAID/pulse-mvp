# Pulse exported prototype

Read README.md and REQUIREMENTS_AUDIT.md before changing scope. This repository is a portable React/TypeScript/Vite hackathon MVP completed from a Figma Make export.

## Main files

- src/App.tsx: React screens, shared-state context, local persistence, routing and demo controls.
- src/lib/engine.ts: pure safety/privacy/sprint/cycle/prescription/cohort calculations and seed.
- src/lib/selfTests.ts + tests/run.mjs: executable rule checks, also visible at #/dev/tests.
- src/Launch.tsx: original Figma landing visual.
- src/RxPreview.tsx: printable A4 synthetic prescription.
- src/content: fixed Hindi/English labels.
- src/mvp.css: active workflow layouts; index.css/extended.css retain export styles.

Run pnpm typecheck, pnpm test and pnpm build for relevant code changes. pnpm format uses Prettier. The dev server is started with pnpm dev on port 5173; it is not assumed to be running. serve.py serves the included dist build with Python only.

Use synthetic data. Preserve caregiver exclusion of mood, private notes and sensitive documents; keep patient consent and physician verification checks. Avoid real messaging, payments or medical advice. The browser store is a demo, not production authentication. Keep the audit honest when adding or leaving incomplete extended features.
