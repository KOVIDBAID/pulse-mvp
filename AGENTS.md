# Pulse exported prototype

Read README.md and REQUIREMENTS_AUDIT.md before changing scope. This repository is a portable React/TypeScript/Vite hackathon MVP completed from a Figma Make export.

## Main files

- src/App.tsx: React screens, shared-state context, local persistence, routing and demo controls.
- src/lib/engine.ts: pure safety/privacy/sprint/cycle/prescription/cohort calculations and seed.
- src/lib/selfTests.ts + tests/run.mjs: executable rule checks, also visible at #/dev/tests.
- src/Launch.tsx: minimal English role entry and emergency links.
- src/RxPreview.tsx: printable A4 synthetic prescription.
- src/content: English labels only.
- src/mvp.css: active workflow layouts; index.css/extended.css retain export styles.

Run pnpm typecheck, pnpm test and pnpm build for relevant code changes. pnpm format uses Prettier. The dev server is started with pnpm dev on port 5173; it is not assumed to be running. serve.py serves the included dist build with Python only.

Use synthetic data. Preserve caregiver exclusion of mood, private notes and sensitive documents; keep patient consent and physician verification checks. Avoid real messaging, payments or medical advice. The browser store is a demo, not production authentication. Keep the audit honest when adding or leaving incomplete extended features.

## English-only invariants

Keep the UI English-only with no language selector; the official Hindi PHQ translation is not needed for this version. Local @fontsource Noto Sans (400/600/700) is for patient/caregiver; IBM Plex Sans (400/600) is for doctor/team. Do not introduce Google Fonts or Mukta.

Store habitId, never display text as a logic key: walk_after_dinner, veg_dal_first, one_less_roti, early_dinner. Derive labels through HABITS/habitLabel. The Kitchen card is keyed on veg_dal_first. Version-3 saves migrate to version 4. Keep pulse-session-v1 and the load → sessionStorage write → reload QA login contract. Hindi input safety/myth matching and Hindi tests must remain inside @allow-devanagari / @end-allow-devanagari comments.

Run pnpm typecheck, pnpm test, pnpm build, pnpm qa:static and pnpm qa after relevant refactors. qa/run-all.mjs owns its preview server on port 5173. qa/baseline.txt is an immutable before record.

For migrated non-English saved input, preserve `_legacyText` on the same record for the patient export; display an English review notice and never invent a medicine translation. `storedText` supplies the original symptoms to safety rules. Keep migration idempotent for versions 3 and 4. QA must verify readiness from its own preview process and the built HTML, fail on occupied ports, and await cleanup. `PULSE_QA_PORT` is an explicit override (default 5173).

## Navigation invariants

Use src/app/routes.ts as the single source for role navigation, drawers, floating actions, hidden routes, redirects, scenarios and the guide. Regenerate qa/routes.json with node qa/sync-routes.mjs. Keep old hash routes redirecting, including query-selected merged tabs. Family/privacy/data rights, doctor messages/appointments/tests, caregiver notes/report upload and care desk tabs are merged features, not removed features.

Doctor navigation uses a bottom bar below 900px and the same sidebar items at 900px and above. The six patient-profile tabs have no mood tab; the plum Overview mood card requires separate doctorMood consent. Preserve upload exclusions for caregivers. Run node qa/run-all.mjs ia for redirects, scenario destinations, responsive layout, consent and the 14-step guided journey, alongside the existing gates.

Every change must respect docs/FRICTION.md. The friction pack takes precedence over the earlier navigation checkpoint. Feature flags in src/app/features.ts park UI only; keep the rules and tests.

Health Connect in src/lib/healthConnect.ts is simulated. Keep sensor permissions OFF by default and separate from existing optional Pulse wellness consent. Glucose ingestion must call recordReading with source meter-sync and the device measuredAt (simulation minutes since Day 0). Band metrics and hydration never invoke safety rules. Preserve no-band single-card behavior and source/freshness labels; manualWater stays false. Stored version-4 state backfills provenance and connector fields without inventing permission grants. Test with node qa/run-all.mjs health-connect. Friction failures remain real failures until later workflow iterations; never relax their tap budgets.


The current friction checkpoints require every journey to pass. Keep the due fasting keypad directly on Today (Friday 07:30 in QA); count all three digit taps and Save. Bundle medicines by time slot, retain missed-dose records without separate missed notifications, and retain testing-plan signature/verification gates. Use testingPlan.experiment for Sugar Detective availability, never the removed sugarDetectivePrescribed boolean. Use dataSources for provenance and passive walks; band metrics never invoke clinical alerts. No-band invitations appear only in Connected devices. Run `node qa/run-all.mjs calm` for 412×915 placement, including the complete Progress teaser above the bottom bar in the morning keypad state.
