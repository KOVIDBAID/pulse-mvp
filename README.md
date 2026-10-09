# Pulse — hackathon MVP

A working synthetic-data prototype built from the supplied Figma Make export. Patient, caregiver, doctor and care-team workflows now use one persisted store and the same safety, privacy, sprint and cycle calculations.

This implements the core MVP journey. The larger prompt set also contains extended product requirements; `REQUIREMENTS_AUDIT.md` identifies those that remain simplified or incomplete. It is not a claim that every M0–M26 acceptance criterion has been met.

## Run immediately

The ZIP includes a production build. With Python 3 installed:

```sh
python3 serve.py
```

Open **http://127.0.0.1:5173/**. If that port is busy, use `python3 serve.py --port 5174`.

Do not open `dist/index.html` directly as a file; the app needs an HTTP server. Fonts are bundled locally; no Google Fonts request is made.

## Develop

Node.js 22.12+ and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm typecheck
pnpm test
pnpm build
```

`pnpm format` uses Prettier. The original export's obsolete formatter is no longer used.

## Four-minute presentation

1. Open **DEMO → Reset demo → Confirm**. Select **Ramesh**.
2. Open **Sugar Detective** from the menu. Choose the walking experiment in History: six evenings yield a computed **31 mg/dL** lower post-dinner rise.
3. **DEMO → Low 52**, then switch to **Amit**. Show the alert, simulated local-contact notification and acknowledgement. Switch to **Neha** to show shared ownership and her restricted medicines access.
4. Return to **Ramesh → Log glucose** and save a fresh **100 mg/dL** recheck; the low alert resolves.
5. **Doctor → message**: enter the synthetic phrase `I don't feel like living anymore`. It opens private support and creates a care-team callback item. Switch to **Pooja** to show the queue. Caregivers receive no mood notification.
6. Switch to **Dr. Verma**: open the patient profile, Health Map and prescription composer. The demo signing PIN is **246810**. Sign, then return to Ramesh to confirm the new reminder schedule.
7. Open Ramesh's Day-90 Proof Card, switch to **Amit → Payments**, and approve the **mock UPI** renewal. No money moves.
8. **Pooja → Impact**: change the clinic and cohort filters. Show **DEMO → Self-test**.

The guided mode supplies 14 navigation steps with Next/Back. Actions such as typing a message, injecting a reading, signing and approving UPI are performed by the presenter.

## Demo controls and accounts

- OTP: `123456`; caregiver/doctor login password: `demo1234`; signing PIN: `246810`.
- Ramesh, Amit, Neha, Dr. Verma, pending Dr. Saxena and Pooja are synthetic identities.
- Day 0 is **11 July 2026**; Day 90 is **9 October 2026**, using the supplied simulation calendar.
- Shared records use `localStorage["pulse-demo-v1"]`; each tab's login uses `sessionStorage["pulse-session-v1"]`. Changes propagate between tabs on the same origin. Different devices are not synchronized.
- Moving the simulated clock backward hides future rows without deleting them. Optional consent and family permissions can be changed from the patient's menu.
- Offline readings run local safety rules immediately; simulated outbound messages and remote views wait for reconnection.
- Use synthetic information only. Client-side role guards demonstrate the privacy workflow; they are not production authentication or server-side authorization.

## Tools and simulation boundaries

Original design: Figma Make. Implementation completion: Codex. Libraries: React 19, TypeScript, Vite, Tailwind CSS v4, lucide-react, Prettier, local @fontsource fonts (Noto Sans / IBM Plex Sans).

OTP, payments, SMS, doctor verification, meter/document OCR, home collection and band sync are explicitly simulated. Unknown uploads do not undergo live OCR, and uploaded binary files are not retained as a document vault. No live AI API, payment gateway or messaging service is connected. Patient-facing safety copy uses fixed demo templates and the supplied rules.

English PHQ items are included; this English-only version does not need an official Hindi translation. Questionnaire reference: [University of Washington AIMS Center](https://aims.uw.edu/resource/phq-9-depression-scale/).

See `QA_REPORT.md` for verification and `REQUIREMENTS_AUDIT.md` for the detailed scope comparison.

## English-only UI and regression gates

The UI is English-only with no language toggle. Patient/caregiver screens use local Noto Sans (400/600/700); doctor/team screens use local IBM Plex Sans (400/600). Hindi input remains recognized by the safety and myth rules.

Version 4 migrates version-3 built-in medicine instructions, seeded conversation text, and habits. Habit identity uses `walk_after_dinner`, `veg_dal_first`, `one_less_roti`, and `early_dinner`; English labels derive from `HABITS`. The Kitchen card uses `veg_dal_first`, independent of its label. Shared storage remains `pulse-demo-v1`, and per-tab login remains `pulse-session-v1`.

```sh
pnpm exec playwright install chromium
pnpm qa:static
pnpm qa
pnpm qa:all
```

The runner starts Vite preview on 127.0.0.1:5173 and stops it afterward. That port must be free. The sweep loads first, writes the session to `pulse-session-v1`, and reloads. `qa/baseline.txt` records the before state. In this managed workspace Chromium is installed at `/tmp/pulse-playwright-browsers`; set `PLAYWRIGHT_BROWSERS_PATH=/tmp/pulse-playwright-browsers` when running QA here. On other machines the default Playwright installation location works.

Unknown saved text containing Devanagari is shown as an English review notice; the original stays on the same record under `_legacyText` and is included in the patient's JSON export. Unknown medicine instructions explicitly require clinician review. Safety rules evaluate the original symptoms. Version-4 saves are normalized too, covering saves from the earlier partial conversion. This is a display safeguard, not automatic translation of clinical or personal text.

QA now waits for its own preview process, verifies its response against `dist/index.html`, and awaits shutdown. A busy port fails immediately. Keep the default port 5173 free, or explicitly run `PULSE_QA_PORT=5175 pnpm qa:all`. Runner regression checks: `node --test qa/runner.test.mjs`. Legacy UI/export check: `node qa/run-all.mjs migration` (with the same port/browser environment variables if needed).

## Minimal navigation checkpoint

`src/app/routes.ts` owns role navigation, grouped drawers, hidden destinations, redirects, demo scenarios and the 14-step guide. Run `node qa/sync-routes.mjs` after changing visible destinations; the sweep rejects a stale `qa/routes.json`.

Patient: Today, Progress, Records, Doctor, with a floating + Log. Family & privacy combines sharing, consent and data rights. Doctor contains Messages, Appointments and Tests. Settings includes the band connection. Progress includes the Day-90 proof section and connected band data.

Caregiver: Home, Alerts, Notes, Payments. Switch family member opens a sheet; Add a report lives in Notes and retains sensitive-document restrictions. Doctor: Today, Patients, Messages, Appointments; the same navigation becomes a sidebar at 900px. Patient profiles have six tabs, with separately consented mood inside Overview. Team: Care desk, Myth review, Impact; the desk contains Queue, Case review and Messages sent.

Legacy hash links redirect to their canonical destination, preserving query parameters. These are screen merges; existing actions and safety/consent checks remain available. Launch offers three role cards, four quick demo identities and fixed emergency phone links. Demo controls expose six identities and eight scenarios; each scenario switches identity and opens its effect.

Run the additional Playwright checks with `node qa/run-all.mjs ia`. They cover legacy redirects, merged screens, consented mood visibility, mobile/desktop doctor navigation, all eight scenarios and all fourteen guided steps with console-error checks. Use the same Chromium and port variables described above. Results are in `qa/ia-checks.txt` and `qa/ia-sweep.txt`.
