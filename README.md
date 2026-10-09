# Pulse — hackathon MVP

A working synthetic-data prototype built from the supplied Figma Make export. Patient, caregiver, doctor and care-team workflows now use one persisted store and the same safety, privacy, sprint and cycle calculations.

This implements the core MVP journey. The larger prompt set also contains extended product requirements; `REQUIREMENTS_AUDIT.md` identifies those that remain simplified or incomplete. It is not a claim that every M0–M26 acceptance criterion has been met.

## Run immediately

The ZIP includes a production build. With Python 3 installed:

```sh
python3 serve.py
```

After `pnpm build`, either `pnpm preview` or `python3 serve.py` runs the production prototype with one command.

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

1. Ramesh Today.
2. Meter sync 52 opens the safety screen.
3. Amit's urgent Home: “I've spoken to him”.
4. Ramesh logs a fresh 100; the low alert resolves.
5. Dr. Verma Today: Open Ramesh's Brief.
6. Renew same; review today's prescription and sign with PIN **246810**.
7. Ramesh confirms new medicine reminders, then views the Proof Card.
8. Pooja Impact.

Guided mode follows these eight steps. It injects the two synthetic glucose examples; acknowledgement, signing and reminder confirmation remain real presenter actions. Next requires a signed renewal before proceeding and confirmed reminders before showing Proof.

## Demo controls and accounts

- OTP: `123456`; caregiver/doctor login password: `demo1234`; signing PIN: `246810`.
- Ramesh, Amit, Neha, Dr. Verma, pending Dr. Saxena and Pooja are synthetic identities.
- Day 0 is **11 July 2026**; Day 90 is **9 October 2026**, using the supplied simulation calendar.
- Shared records use `localStorage["pulse-demo-v1"]`; each tab's login uses `sessionStorage["pulse-session-v1"]`. Changes propagate between tabs on the same origin. Different devices are not synchronized.
- Moving the simulated clock backward hides future rows without deleting them. Optional consent and family permissions can be changed from the patient's menu.
- Offline readings run local safety rules immediately; simulated outbound messages and remote views wait for reconnection.
- Use synthetic information only. Client-side role guards demonstrate the privacy workflow; they are not production authentication or server-side authorization.

## What's simulated

Original design: Figma Make. Implementation completion: Codex. Libraries: React 19, TypeScript, Vite, Tailwind CSS v4, lucide-react, Prettier, local @fontsource fonts (Noto Sans / IBM Plex Sans).

Band data and Android Health Connect, meter auto-sync, OTP, SMS, payments, meter/document OCR, doctor verification and home collection are explicitly simulated. Unknown uploads do not undergo live OCR, and uploaded binary files are not retained as a document vault. No live AI API, payment gateway or messaging service is connected. Patient-facing safety copy uses fixed demo templates and the supplied rules.

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

`src/app/routes.ts` owns role navigation, grouped drawers, hidden destinations, redirects, demo scenarios and the 8-step guide. Run `node qa/sync-routes.mjs` after changing visible destinations; the sweep rejects a stale `qa/routes.json`.

Patient: Today, Progress, Records, Doctor, with a floating + Log. Family & privacy combines sharing, consent and data rights. Doctor contains Messages, Appointments and Tests. Settings includes the band connection. Progress includes the Day-90 proof section and connected band data.

Caregiver: Home, Updates, Payments (payer only). Switch family member opens a sheet; Add a report lives in Notes and retains sensitive-document restrictions. Doctor: Today, Patients, Messages, Appointments; the same navigation becomes a sidebar at 900px. Patient profiles have five tabs: Brief, Charts, Records, Prescriptions, Messages. Health map opens from Records; Brief mood requires separate consent. Team: Care desk, Myth review, Impact; the desk contains Queue, Case review and Messages sent.

Legacy hash links redirect to their canonical destination, preserving query parameters. These are screen merges; existing actions and safety/consent checks remain available. Launch offers three role cards, four quick demo identities and fixed emergency phone links. Demo controls expose six identities and twelve scenarios; each scenario switches identity and opens its effect.

Run the additional Playwright checks with `node qa/run-all.mjs ia`. They cover legacy redirects, merged screens, consented mood visibility, mobile/desktop doctor navigation, all twelve scenarios and all eight guided steps with console-error checks. Use the same Chromium and port variables described above. Results are in `qa/ia-checks.txt` and `qa/ia-sweep.txt`.

## Friction and Health Connect iteration

Every change must respect [docs/FRICTION.md](docs/FRICTION.md). Typed boolean flags in `src/app/features.ts` hide parked UI while retaining the engine rules. Manual water, meal photos, the weekly questionnaire and team outbound navigation are parked. Weight remains under Log → More. The care-team workspace is queue only. A fresh synthetic Ramesh has a prescribed Sugar Detective experiment; unprescribed patients are not offered a new experiment, and past result links still work.

The web connector is **Demo**, not an Android integration. Its Health Connect sheet starts all six sensor permissions OFF and offers Allow all followed by an explicit Allow selected action. Optional Pulse wellness consent is separate and stays off until the patient chooses it. Blood glucose can sync independently of a band. Every saved glucose reading goes through the unchanged glucose/symptom safety engine with a source and device `measuredAt`. Band metrics never enter that engine.

Ramesh has a 90-day synthetic wellness fixture, with five poor-sleep nights, a three-day sync gap around Day 60 and most after-dinner walks after Day 10. Permissioned sync imports elapsed days only. Sushma starts with no band fixture. Skipping a band suppresses further requests; the one optional connection card is in Settings → Connected devices. An explicit later connection can create a Demo series. Keypad/photo glucose entry always remains available. Hydration appears only when permissioned Health Connect records supply it. A band does not sense water or glucose.

Source badges distinguish Band, Meter, You and Lab. Sync age turns amber after 72 hours. Disconnect stops ingestion, with an explicit keep/delete choice for band history; clinical glucose readings remain in Records. Reconnecting can import the synthetic history again. No real Health Connect API or background OS service is connected.

Additional scenarios: Band: 3 poor-sleep nights; Band: sync gap 3 days; Meter auto-sync: 52; Meter auto-sync: 128 fasting. The two meter scenarios use device timestamps; 52 opens the existing very-low-sugar support screen.

`pnpm qa:friction` measures actual clicks and typed fields; first-time setup/login is excluded. Its initial immutable before record is `qa/friction-baseline.txt`. The automatic-meter journey uses a fixture representing previously granted glucose permission; it counts all subsequent daily actions. `qa/friction-current.txt` records the current result. The current prescribed-check fixture starts on Today at Friday 7:30 AM, where the keypad is already the next action. Its four taps include 1, 2, 8 and Save, with no entry-navigation exemption. All current journeys pass: medicine slot 1 tap, manual reading 4, meter sync 0, caregiver 0, renewal 3 plus PIN.

Connector checks: `node qa/run-all.mjs health-connect`. Pure and browser evidence: `qa/health-connect-gates.txt` and `qa/health-connect-results.txt`, using the same browser-path and port environment variables as above.


## Band primary, prescribed testing and calm Today

`src/lib/dataSources.ts` is the collection policy: band-only steps/sleep/HR/SpO2/hydration, band-first walks with one optional walk tap when disconnected, meter-sync → meter-photo → typed glucose, and connected scale/cuff → typed values under More. Clinical charts retain all readings, and a newer typed low is never hidden behind an older meter reading.

After onboarding consent, Connect band is recommended; I don't have a band records `bandOwned=false`. Sensor permissions and optional Pulse wellness consent remain separate. Device changes retain clinical history. A 24-hour band outage adds one amber line; 72 hours creates one gentle notice per outage. Band data is wellness-only and labelled Demo.

Testing plans contain weekday/slot schedules and optionally a signed six-evening experiment with a stable habit ID. Starter patients get fasting Mon/Wed/Fri. Ramesh has that schedule plus Sunday after-dinner, prescribed by Dr. Verma on 11 July. The composer signs schedule and experiment together, rebuilds reminders, and preserves off-plan safety. Testing adherence counts elapsed prescribed slots only, using plan history so signing a new schedule never retroactively penalizes off-plan days. Doctor/caregiver views use consent-gated aggregates; caregiver mood/private notes remain excluded. Week-3 walks come from band steps or walk taps; low adherence queues wellness support without a clinical band alert.

Today leads with a bundled medicine slot or the due prescribed check, followed by automatic Your day and a progress link. Each medicine slot has one reminder, Taken/Taken all and Snooze 30 min. Missed records remain for adherence, with a gentle next-morning line and no missed-dose notification. Refill appears only at seven stock days or fewer. + Log is in the Today header to avoid covering the summary; elsewhere it remains floating. Photo entry is first, the keypad second; plan context is prefilled, and ownership is asked only for a large change or an away plan. The optional Sunday feeling and fortnightly private mood offer sit below the fold. Progress has three cards, with band details behind a link. Patients aged 55+ start with extra-large text and can change it.

Run `node qa/run-all.mjs calm` for the 412×915 morning/evening layouts, no-band path, prescribed experiment visibility and single outage notice. `qa/calm-gates.txt` records all final gates; `qa/patient-today-412x915.png` and `qa/patient-morning-412x915.png` show the two primary states. `qa/baseline.txt` and `qa/friction-baseline.txt` remain immutable before records.

Caregiver Home shows shared family status, with urgent alerts taking the whole screen. Routine Updates never push. Doctor Today shows appointments and at most five review items; Reviewed records the clinician action without resolving the safety event. Renew same previews today’s date and uses the unchanged validation and PIN lock. Every patient screen offers fixed Help phone links. QA: `node qa/run-all.mjs demo-critical ia friction` checks these flows.

## Final freeze — demo-v1

Paid Care Cycle and Maintenance subscriptions are **₹699**. A qualifying guaranteed next cycle remains free. Previous synthetic payment amounts are normalized to ₹699 on load. The original supplied prompt reference is historical; this freeze supersedes its subscription figures.

Open DEMO → Reset demo → Confirm, then DEMO → Start guided demo. The eight-step script above starts at Ramesh Today and ends at Pooja Impact. OTP is **123456**, caregiver/doctor password **demo1234**, and signing PIN **246810**.

`qa/routes.json` lists the actual default identities' visible destinations, including all five doctor patient-profile tabs and the family switcher; Payments is absent from Ramesh’s drawer because Amit is his payer; a second patient fixture covers self-paying Sushma’s Payments and hides her unprescribed Sugar Detective. Final results and known issues are in [QA_REPORT.md](QA_REPORT.md).

## Phase 2

- Server sync and server-side access control for multi-device use.
- A native Android app reading permissioned Health Connect records.
- Shorter onboarding.
