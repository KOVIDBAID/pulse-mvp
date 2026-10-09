# Pulse — hackathon MVP

A working synthetic-data prototype built from the supplied Figma Make export. Patient, caregiver, doctor and care-team workflows now use one persisted store and the same safety, privacy, sprint and cycle calculations.

This implements the core MVP journey. The larger prompt set also contains extended product requirements; `REQUIREMENTS_AUDIT.md` identifies those that remain simplified or incomplete. It is not a claim that every M0–M26 acceptance criterion has been met.

## Run immediately

The ZIP includes a production build. With Python 3 installed:

```sh
python3 serve.py
```

Open **http://127.0.0.1:5173/**. If that port is busy, use `python3 serve.py --port 5174`.

Do not open `dist/index.html` directly as a file; the app needs an HTTP server. Internet access is optional for Google Fonts; system fonts are the fallback.

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
2. Open **Sugar Jasoos** from the menu. Choose the walking experiment in History: six evenings yield a computed **31 mg/dL** lower post-dinner rise.
3. **DEMO → Low 52**, then switch to **Amit**. Show the alert, simulated local-contact notification and acknowledgement. Switch to **Neha** to show shared ownership and her restricted medicines access.
4. Return to **Ramesh → Log glucose** and save a fresh **100 mg/dL** recheck; the low alert resolves.
5. **Doctor → message**: enter the synthetic phrase `जीने का मन नहीं करता`. It opens private support and creates a care-team callback item. Switch to **Pooja** to show the queue. Caregivers receive no mood notification.
6. Switch to **Dr. Verma**: open the patient profile, Health Map and prescription composer. The demo signing PIN is **246810**. Sign, then return to Ramesh to confirm the new reminder schedule.
7. Open Ramesh's Day-90 Proof Card, switch to **Amit → Payments**, and approve the **mock UPI** renewal. No money moves.
8. **Pooja → Impact**: change the clinic and cohort filters. Show **DEMO → Self-test**.

The guided mode supplies 14 navigation steps with Next/Back. Actions such as typing a message, injecting a reading, signing and approving UPI are performed by the presenter.

## Demo controls and accounts

- OTP: `123456`; caregiver/doctor login password: `demo1234`; signing PIN: `246810`.
- Ramesh, Amit, Neha, Dr. Verma, pending Dr. Saxena, Pooja and Founder are synthetic identities.
- Day 0 is **11 July 2026**; Day 90 is **9 October 2026**, using the supplied simulation calendar.
- Shared records use `localStorage["pulse-demo-v1"]`; each tab's login uses `sessionStorage["pulse-session-v1"]`. Changes propagate between tabs on the same origin. Different devices are not synchronized.
- Moving the simulated clock backward hides future rows without deleting them. Optional consent and family permissions can be changed from the patient's menu.
- Offline readings run local safety rules immediately; simulated outbound messages and remote views wait for reconnection.
- Use synthetic information only. Client-side role guards demonstrate the privacy workflow; they are not production authentication or server-side authorization.

## Tools and simulation boundaries

Original design: Figma Make. Implementation completion: Codex. Libraries: React 19, TypeScript, Vite, Tailwind CSS v4, lucide-react, Prettier, Google Fonts (Mukta / IBM Plex Sans).

OTP, payments, SMS, doctor verification, meter/document OCR, home collection and band sync are explicitly simulated. Unknown uploads do not undergo live OCR, and uploaded binary files are not retained as a document vault. No live AI API, payment gateway or messaging service is connected. Patient-facing safety copy uses fixed demo templates and the supplied rules.

English PHQ items are included; an official Hindi translation remains outstanding. Questionnaire reference: [University of Washington AIMS Center](https://aims.uw.edu/resource/phq-9-depression-scale/).

See `QA_REPORT.md` for verification and `REQUIREMENTS_AUDIT.md` for the detailed scope comparison.
