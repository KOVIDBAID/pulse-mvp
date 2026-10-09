# Validation record — 9 October 2026

## Automated checks

- TypeScript: `tsc --noEmit` passed.
- Executable rule suite: **62/62 passed** using `tests/run.mjs`; the same suite appears at `#/dev/tests`.
- Vite production build passed. Source and built assets are included in this delivery.

Rule coverage includes low/high/LO readings, stale versus fresh readings, repeated low escalation, fasting pattern, Hindi/Hinglish text safety, PHQ routing, sprint effect/sample count, caregiver forbidden-category projection, revoked/deleted/future links, unverified lab exclusion, guarantee/Maintenance, prescribing restrictions/duration validation, anonymous cohort calculations, offline delivery and idempotent time travel.

## Browser checks performed

- Patient routes: home, log, progress, records, weekly, mood, notes, privacy, data rights, billing, doctor messaging, appointments, tests, myths, notifications, band, profile and help rendered without runtime failures.
- Caregiver routes: home/care, chooser, connect, permissions, alerts, billing, records, notes, myth, notifications, profile and help; unauthorized privacy/mood deep links were blocked. No seeded PHQ scores/identifiers appeared in caregiver screens.
- Verified-doctor routes: home, registry, appointments, messages, outcomes and all nine patient-profile sections plus prescription composer rendered. Pending Dr. Saxena was blocked from the patient profile.
- Team routes: care desk, case review, myth review, impact, outbound log, notifications, profile and help rendered.
- Changing impact clinic from all clinics (240 enrolled) to Clinic 1 (20) changed all four headline metrics consistently.
- Prescription preview displayed patient/doctor identity, registration, date/time, mode, diagnosis, generic medicines, strength, pattern, instruction, duration, follow-up and unsigned/signed demo status.
- Both **14-step guided navigation runs** completed after Reset with no browser console errors.
- Mobile at **360×800**, including extra-large text: no horizontal page overflow observed on patient home/Sugar Jasoos.

## Core journey verified interactively

1. Ramesh saved 52 mg/dL → local low-sugar card and simulated local-contact notification.
2. Amit saw the alert and acknowledged it; Neha saw Amit's ownership and her medicines remained unshared.
3. Ramesh saved a fresh 100 mg/dL recheck → low alert resolved.
4. Synthetic Hindi crisis message → private support and care-desk P0 with 60-minute staffed-hours SLA; no caregiver mood notification.
5. Dr. Verma signed using 246810 → updated patient/caregiver prescription state, with patient confirmation before reminders changed.
6. Day-90 verified Proof Card → Amit approved synthetic UPI → paid receipt without duplicate payment.

## QA repairs

- Replaced static read paths and hard-coded results with shared calculations.
- Removed caregiver mood/private alert fields from data projections and blocked role-prefix deep-link bypasses.
- Hid undelivered offline readings/alerts from remote-role views; reconnection flushes queued records.
- Preserved signing-PIN failure lock across route changes.
- Kept medicine-reminder changes behind patient confirmation.
- Replaced native confirm/prompt dialogs with accessible in-app sheets.
- Kept per-tab login sessions separate from shared patient records, fixing a cross-tab guided-demo logout race.
- Replaced the export's obsolete formatter after detecting its TypeScript corruption.
- Avoided the initial interactive-frame/loading race, and retained query-bearing registry routes on refresh.
- Fixed the skip link so it focuses content without changing the hash route.
- Seeded coherent dose history so time travel does not mark every historical medicine as missed.

This is targeted hackathon QA, not a production clinical, privacy or accessibility certification. Extended acceptance gaps are listed in `REQUIREMENTS_AUDIT.md`.
