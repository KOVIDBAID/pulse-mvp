# 02 — Figma Make Prompts (the working prototype, in order)

> **Why Figma Make:** the case requires a prototype that *"must run and demonstrate the core idea live"* and *"at least one complete user journey end to end"* (§6, §8). Figma Make generates a running React app from prompts. These prompts build one app with four entry points (Patient, Caregiver, Doctor, Pulse team), a shared data store, a simulated 90-day clock, and an in-app self-test page — so every screen is **dynamic**: an action in one role changes what the other roles see.
>
> **Start only after T+0** (case §10: prototypes must be started from scratch during the hackathon). Declare Figma Make, Google Stitch, any libraries Make installs and any AI API in your README (case §10).

---

## How to run these prompts

1. **Create one Figma Make file.** Don't split roles across files — the shared store is what makes the demo work.
2. **Paste M0 into the project's guidelines file first** (Make keeps a `guidelines` file as always-on memory; create `guidelines.md` if your file doesn't have one). Every later prompt says "follow guidelines.md" instead of repeating rules.
3. **Run prompts in order. One prompt = one delta.** Wait for the preview, then run the **Done when** checks under each prompt before moving on. If a check fails, use the fix templates at the end — don't continue on a broken base.
4. **Attach Stitch frames** (if you made them) with *Add context → Designs*, **one or two frames per prompt**, and say "use as visual reference; keep the logic in this prompt".
5. **Checkpoint before big prompts** (M8, M19, M21, M24): use version history or duplicate the file.
6. **Model choice:** use Make's stronger model for M1–M3 and M21–M25; a lighter one is fine for copy/visual tweaks.
7. **If a prompt is too long for your Make version**, split it at the `---` lines inside the block and send the parts in order.
8. **Synthetic data only.** Never type a real patient's details, reports or photos into Make.

### Minimum viable path (if you have ~9 build hours)
M0 → M1 → M2 → M3 → M4 → M5 (login + quick demo login only) → M8 → M9 → M10 → M11 → M19 → M20 → M21 → M22 → M24 → M25 → M26.
Everything else adds depth; skip in this order if late: M18 → M14 → M12 → M17 (keep its delete-my-data part) → M23.

---

## M0 ★ Paste into `guidelines.md` (always-on rules)

```
# Pulse — project guidelines (apply to every change)

## Product in one paragraph
Pulse is a continuous-care app for adults (18+) with Type 2 diabetes on tablets in Kanpur, India. One app, four entry points: Patient (Ramesh, 56, Hindi-first, large type), Caregiver (Amit, son in Pune, English-first with Hindi toggle), Doctor (Dr. Anjali Verma, Kanpur, English, desktop-first but usable at 390px), Pulse team (internal care desk, myth review, impact console). The MVP hero is "Sugar Jasoos" — a 6-evening Sugar Sprint where the patient's own glucometer shows which habit lowers his sugar — inside a 90-day Care Cycle that ends with a lab HbA1c Proof Card. Tagline: "अपना मीटर, अपना सच".

## Non-negotiable rules
1. Software never diagnoses, prescribes, changes doses or counsels. Only a verified doctor creates prescriptions. AI is used only to read text from images (always confirmed by a person) and to draft doctor-facing summaries from numbers the code computed. Patient-facing text comes only from fixed templates in /content. No chatbot for patients.
2. Consent first (DPDP Act 2023 + DPDP Rules 2025): itemised consent per data type, each with its purpose; optional items default OFF; withdrawal must be as easy as giving consent; rights screens for access, correction, erasure, withdrawal, nominee and grievance, and a line that complaints can go to the Data Protection Board of India. Notice in Hindi and English. Nothing is processed for, or shown to, family until the patient consents on his own phone.
3. Mood data (PHQ answers, mood taps) is visible only to the patient, the Pulse care team (if mood consent is on) and the doctor only with a separate "share mood with doctor" consent. Never to caregivers, safety contacts or insurers. This is hard-coded, not a setting.
4. Sensitive record categories (psychiatric, sexual/reproductive health, HIV/infectious disease, substance use) are hidden from caregivers, even when a caregiver uploaded the file.
5. Banned words in any copy: cure, reverse, reversal, "जड़ से ख़त्म", "guaranteed results", "clinically proven". Outcome language: "measured change in HbA1c".
6. The safety engine (lib/safety) runs before anything else on every reading and every free-text input. Safety rules are never rate-limited or batched.
7. Caregivers whose city is not Kanpur never get a "Call 108/112" button. They get Call patient / Call local safety contact / Call clinic, plus the line "The person near him should call 112." The patient, the local safety contact and caregivers living in Kanpur get 112.
8. Wearable data (steps, sleep, heart rate, SpO2) is wellness-only: trends, no alerts, no diagnosis, labelled "स्वास्थ्य-रुझान के लिए — बीमारी की पहचान के लिए नहीं". Water is logged manually.
9. Telemedicine Practice Guidelines: show doctor name, qualification and registration number on the doctor profile, messages and prescriptions. Prescriptions use generic names, include all mandatory fields, are PIN-signed, go to the patient, and go to a pharmacy only with the patient's explicit consent. Follow-up medicines for a chronic condition require a recorded prior in-person consultation. Messages to the doctor are answered by the doctor or clinic team, never by AI. A caregiver acting for a patient needs the patient's approval (and relationship proof to book teleconsults).
10. Doctor-facing flags are rule-based and descriptive ("for your review"). No treatment suggestions, no AI risk scores.
11. Demo honesty: all data is synthetic. Metrics screens show "Synthetic demo data — illustrative". OTP is simulated (demo OTP 123456, shown only when demo mode is on).
12. Launch geography: Kanpur only (pincodes 208001–208027 count as Kanpur Nagar in this demo); everyone else joins a waitlist.

## Design tokens
Colours: neem700 #1F6F5C (primary), neem800 #17564A (pressed), neem50 #E8F3EF, haldi500 #E0A526 (accent; dark text only), haldi50 #FCF4E2, chai50 #FAF6EF (patient/caregiver background), surface #FFFFFF, ink900 #1E2329, ink600 #4A5560, line #E3DED4, danger700 #B3261E, danger50 #FCEDEC, warning700 #9A5B00, warning50 #FFF4E0, success700 #2E7D32, success50 #EAF5EA, info700 #2457A6, info50 #EAF1FB, plum700 #6B3FA0 and plum50 #F3EDFA (private/mind only). Role accents: caregiver indigo #3949AB, doctor slate #1F3A5F, team graphite #37474F. Doctor/team background #F6F7F9. Light theme only.
Type: Mukta (patient, caregiver); IBM Plex Sans + IBM Plex Sans Devanagari (doctor, team). Patient body 18/28 (setting: Large default, Extra large 20/30); caregiver body 16/24; doctor body 14–15. Headings 24/28/32. Tabular numerals for readings and money.
Shape: radius 12 cards/inputs, 999 pills; primary buttons 56px tall (64px on emergency screens); touch targets ≥48px; 4/8 spacing grid; subtle shadows only.
Icons: lucide icons, always with a visible text label. Never use colour alone — every status has icon + word.

## Architecture
- React + TypeScript + Tailwind. One central store (Zustand if available, else Context + reducer) persisted to localStorage key "pulse-demo-v1". "Reset demo" reloads the seed.
- Simulated clock: sim.day (0–120) and sim.time ("HH:mm"). Day 0 = Saturday 11 July 2026, Asia/Kolkata (so Sundays fall on days 1, 8, 15 … 85 and Day 90 = Friday 9 Oct 2026). Every record carries day and time. Views show only records with day < sim.day, or day = sim.day and time ≤ sim.time. New records are stamped with the current sim day/time. Never use the real clock for logic.
- Pure business logic lives in /lib: safety, sprint, privacy, cycle, notify, myth, rx, ocr, metrics. Each has cases on the in-app Self-test page (#/dev/tests).
- Caregiver, doctor and team screens read patient data only through privacy.view(viewerId, patientId, category). Every such read is appended to accessLog (viewer, category, day, time).
- Hash routes: #/ (launch), #/patient/*, #/caregiver/*, #/doctor/*, #/team/*, #/dev/tests. Back button and refresh keep you on the same screen.
- Every list: loading skeleton (simulated ≤600 ms), empty state, error state with retry. Every form: inline validation, submit disabled until valid, no double submit, input kept on error. Every destructive action: confirmation sheet.
- Demo "offline" toggle: new records get status "queued" with a "भेजना बाकी" badge and sync when online returns.
- i18n via t(key) with /content/hi.json and /content/en.json. Dates "9 अक्टूबर 2026" / "9 Oct 2026". Money "₹1,199". Large counts with Indian grouping (1,00,000).
- Accessibility: real buttons, aria-labels in the active language, visible focus, respects reduced motion.

## Shared constants
- IDs: patients PUL-KNP-0001…, caregivers CG-0001…, doctors DR-0001…, clinic code KNP-VERMA-01.
- Plans: Care Cycle ₹1,199 per 90 days (includes one home HbA1c test). Maintenance ₹1,499 per 180 days, offered when HbA1c is below the doctor's target (default < 7.0%) on two consecutive cycles. Guarantee: if HbA1c falls by less than 0.3 points AND the patient answered ≥ 8 of 13 weekly checks, the next cycle is free. After a failed payment, safety features continue for 30 days.
- Care desk staffed 08:00–22:00. Outside these hours: helplines + safety contact, callback at 08:00.
- Notification budget: medicine reminders exactly as the patient set them; other proactive nudges ≤ 2 per week outside a sprint and ≤ 3 per day during a sprint; quiet hours 22:00–07:00 (safety messages exempt). Caregivers get push-style notifications only for alerts and the weekly digest; everything else they are permitted to see sits in their in-app centre without a push.
- Mood: PHQ-2 every 14 days if mood consent is on; PHQ-2 ≥ 2 → offer PHQ-9; PHQ-9 ≥ 10 → care desk P1 (contact within 72 h); PHQ-9 item 9 > 0 or total ≥ 20 → rule S7. Use official PHQ wording; Hindi items are placeholders until the official Hindi translation is pasted.
- Sugar Jasoos: 6 evenings A,B,A,B,A,B (A = with habit). rise = 2h-after-dinner − before-dinner. Need ≥ 3 valid evenings per arm. effect = mean(B rises) − mean(A rises). Show a result only if effect ≥ 15 mg/dL, labelled "शुरुआती नतीजा"; "consistent" if every A rise < every B rise. Patients on a sulfonylurea also log next-morning fasting after A evenings.
- Metrics: Leading = Week-3 kept habit (habitDays ≥ 4 in the weekly check covering days 15–21). North Star = HbA1c down ≥ 0.5 points at Day 90, intention-to-treat. Business = Cycle-2 renewal or Maintenance within 14 days of the Proof Card.

## Safety rules (lib/safety) — prototype defaults; a clinician must confirm before real use
- S0 stale: reading measured > 30 min before it was entered → "How are you now? Please recheck" + clinic digest. No acute ladder.
- S1 very low: value < 54, meter "LO", or low symptom (shaking, sweating, confusion) with value < 70 → patient full-screen low card with 15-min timer; safety contact alerted at once; caregivers with "alerts" permission get an urgent alert; care desk P0 (staffed hours); clinic same-day digest.
- S2 low: 54–69 with no symptoms → amber card + recheck in 15 min. If the recheck is < 70 or there is no recheck within 20 min → run S1.
- S3 repeat low: a second reading < 70 within 24 h → S1 actions + clinic "for your review" the same day.
- S4 low fasting pattern: fasting < 80 on ≥ 2 days in the last 7 → patient info "please mention to Dr. Verma"; clinic "for your review" (note if on sulfonylurea).
- S5 high: > 300 or meter "HI" → symptom check. Any of vomiting, very drowsy, confused, breathless → 112 card + safety contact + caregivers + care desk P0. None → recheck in 2 h + clinic digest.
- S6 heart/stroke words in any free text (chest pain, arm/jaw pain, face drooping, slurred speech, one-side weakness — Hindi, Hinglish, English) → 112 card + safety contact + care desk P0 + caregiver FYI.
- S7 crisis: crisis words in a message or mood check, PHQ-9 item 9 > 0, or PHQ-9 ≥ 20 → crisis screen (Tele-MANAS 14416 / 1-800-891-4416, 112, "talk to my safety contact"); care desk P0 with 60-min callback in staffed hours (else 08:00). Safety contact only if the patient taps "मैं सुरक्षित नहीं हूँ" and pre-consented. Caregivers are never notified. Crisis words in PRIVATE notes → show the crisis screen and offer a call, but do not alert anyone automatically.
- S8 silence: no reading, weekly check or app activity for 7 days → one gentle message; still silent on day 10 → care desk P2.
- S9 fasting calendar: 7 days before a listed religious fast → "Will you fast? Ask Dr. Verma about your tablets." On fast days, readings < 90 prompt a recheck in 1 hour.
- W3 Week-3 support: weekly check for days 15–21 with habitDays < 4, OR feeling "low", OR PHQ-2 ≥ 2 in the last 14 days, OR 7 days of silence → patient "हल्का हफ़्ता" (one ask only) for 7 days; caregiver "Encourage" card with a positive script only; care desk P2 call within 48 h.
- Alerts go only to people with consent/permission for that category. Every alert has an owner, status (open, acknowledged, resolved) and a timeline.

## Privacy matrix (who sees what by default)
- Patient: everything about himself.
- Caregiver (patient-controlled "Parivaar Dial"): recommended preset ON = weekly summary, alerts, medicines (taken/missed), appointments & tests, sprint results, Day-90 proof; OFF = reading details, all lab reports, wellness/band, non-sensitive records, shared notes. NEVER (locked) = mood, private notes, sensitive records.
- Local safety contact: active emergencies only (S1, S3, S5 with symptoms, S6, and S7 if the patient chose that).
- Linked doctor (with "share with doctor" consent): readings, medicines, labs, records (including sensitive unless the patient hid them), sprint results, shared notes, appointments; wellness only if band consent; mood only with separate consent. Doctor private notes are visible only to that doctor.
- Care desk: minimum needed for open queue items; mood only if mood consent; every view logged.
- Impact console: aggregates of the synthetic cohort only, no names.

## Copy rules
- Patient Hindi: warm, simple, respectful ("रमेश जी"), short sentences. No blame, no "you missed again", no streaks, badges or points. Missed dose copy: "कोई बात नहीं" tone.
- Every screen that collects or shares data says who will see it.
- Emergency copy: short numbered steps, no panic words.
```
**Done when:** the file is saved as the project's guidelines file.

---

## M1 ★ Foundation: shell, store, clock, i18n, routing, components

**Attach:** Stitch S0 (design board), optional.
```
Follow guidelines.md. Build the foundation of "Pulse", a React + TypeScript + Tailwind app. Do not build feature screens yet.

1. Store: create a central store with these collections, all records carrying { id, day, time }: users, patients, doctors, caregivers, links, consents, dial, safetyContacts, medicines, doses, readings, labs, documents, prescriptions, testOrders, sprints, weeklyChecks, moodChecks, alerts, notifications, messages, appointments, notes, myths, mythChecks, payments, band, water, accessLog, waitlist. Plus sim { day, time, online, demoMode } and session { role, userId, activePatientId, lang, lastActiveAt }. Persist to localStorage "pulse-demo-v1" with a version number; if the version differs, reload the seed. Provide resetDemo().
2. Clock: helpers simDate(day) (Day 0 = Sat 11 Jul 2026), isVisible(record), now() returning { day, time }. All "today", "this week", cycle-day and SLA timers use the sim clock.
3. Routing: hash router with routes #/, #/patient/*, #/caregiver/*, #/doctor/*, #/team/*, #/dev/tests, and a 404 screen with "Go home". Route guards: a role's routes require session.role to match, else redirect to that role's login.
4. i18n: t(key, vars) with /content/hi.json and /content/en.json; a language toggle component; default language per role (patient hi, caregiver en, doctor en, team en).
5. Components (all accessible, using the design tokens): Button (primary, outline, danger, ghost; loading state), TextField (label, helper, error, prefix like +91), OtpInput (6 boxes, paste support), NumericKeypad, Chip / ChipGroup (single/multi), Toggle with label, Card, StatusPill (ok/attention/urgent with icon + word), PrivateChip (plum lock "सिर्फ़ आप"), VerifiedBadge (shows reg. no.), AppBar (hamburger, title, bell with count, optional red "मदद" pill), BottomNav (4 labelled items), Drawer, BottomSheet, Dialog/ConfirmSheet, Toast, EmptyState, Skeleton, OfflineBanner, Timer (countdown), Avatar with status ring (ring colour + icon + word), DataTable with pagination, Tabs, Stepper.
6. Layouts: MobileShell (max-width 420px centred, chai background) for patient and caregiver; DesktopShell (left nav + top bar, #F6F7F9) for doctor and team, collapsing to a drawer under 900px.
7. Demo controls: a floating "DEMO" pill (visible when sim.demoMode is true) that opens a panel titled "Demo controls — not part of the product" with: sim day number input, time input, an "Online" toggle, and "Reset demo". (More controls come in M25.)
8. Self-test page #/dev/tests: renders a list of test groups with pass/fail rows; for now include one passing test "clock: Day 90 = Fri 9 Oct 2026".
9. Placeholder screens for each role home with the correct shell, so navigation can be clicked end to end.
```
**Done when:** you can click #/ → each role's placeholder; refresh keeps the route; DEMO panel changes the day and the self-test shows "Day 90 = Fri 9 Oct 2026 ✓"; Reset restores defaults.

---

## M2 ★ Seed data: one coherent 90-day story

```
Follow guidelines.md. Create /data/seed.ts and load it on first run and on Reset. Everything is synthetic.

People:
- DR-0001 Dr. Anjali Verma, MD (Medicine), Uttar Pradesh Medical Council, Reg. UPMC/DEMO/48213, verified, clinic "Verma Diabetes & Family Clinic (demo)", Kanpur, code KNP-VERMA-01, replies within 48h, signing PIN 246810, last in-person visit with Ramesh on day 0.
- DR-0002 Dr. Rahul Saxena (demo), verification "pending" (to show the pending state).
- Dr. S. Khan (demo) exists only as the author of an old uploaded prescription (not a user).
- Psychiatrist reviewer Dr. R. Menon (demo) for weekly case review; care desk staff "Pooja (Pulse care team)"; impact viewer "Founder (demo)".
- PUL-KNP-0001 Ramesh Kumar, 56, male, Hindi, T2D 8 years, tablets: Metformin 500 mg 1-0-1 after breakfast (08:30) and after dinner (21:30), Glimepiride 1 mg 1-0-0 before breakfast (08:00), Atorvastatin 10 mg 0-0-1 before sleep (22:00); onSulfonylurea = true; doctor DR-0001; ABHA linked (demo); safety contact "Rajesh ji (neighbour)" in Kanpur; nominee Amit; plan Care Cycle 1 started day 0, paid by Amit.
- PUL-KNP-0002 Sushma Kumar, 52, female, T2D, Maintenance plan (HbA1c 6.8 and 6.7 on her last two cycles), doctor DR-0001, safety contact Rajesh ji.
- CG-0001 Amit Kumar (son, Pune), password "demo1234", linked and approved for both parents with the recommended preset; payer for both.
- CG-0002 Neha Kumar (daughter, Delhi), approved for Ramesh with alerts + weekly summary only; co-payer invite pending.
- 44 more Kanpur patients PUL-KNP-0003…0046 generated with a seeded random generator (seed 42): ages 45–68, mixed sexes, cycle days spread 1–90, baseline HbA1c 7.5–9.8, some on glimepiride, realistic fasting trends, a few safety flags. Include named examples used on the doctor home: Kamla Devi (two fasting readings 74 and 77 this week, on glimepiride), Farhan Ali (message awaiting reply, due in 6h), Geeta Mishra (shared mood with doctor; PHQ-9 13; care desk called on day 89).

Ramesh's timeline (day: event):
0 enrolment at clinic; itemised consents (required readings & medicines ON; labs, sprint, mood, family sharing, crisis contact, research ON; meal photos and band OFF); paper prescription photo uploaded by clinic assistant and confirmed with Amit; an older lab report (HbA1c 8.6, 7 months before day 0) and an older prescription by Dr. S. Khan dated March 2026 with Metformin, still marked active (shown as history and used for the duplicate-generic info note).
2 home HbA1c baseline 8.8% (lab "Demo Diagnostics, NABL").
4–9 Sugar Jasoos 1 "after-dinner 10-minute walk": evenings A,B,A,B,A,B with before/after readings giving rises A = 38, 45, 41 and B = 70, 78, 68 (effect 31, consistent); next-morning fasting after A evenings 92, 88, 84.
10 result accepted; habit = after-dinner walk.
weekly checks every Sunday (days 1, 8, 15, 22, … 85 — 13 in total, each covering the previous 7 days): habitDays mostly 4–6; the day-22 check (covering days 15–21) has habitDays 3 and feeling "tired" (triggers W3); missed tablets 1–2 times (Metformin evening) on the checks of days 22, 36, 57, 78, none otherwise; stock low once (day 50) → Amit nudged.
14 PHQ-2 = 3 → PHQ-9 = 12 (item 9 = 0) → care desk P1, called on day 15, Pooja logged "reached".
weekly fasting readings each Sunday trending 165 → 128 by day 85.
43 (Sunday) fasting 78 and 45 (an extra check because he felt shaky) fasting 76 → S4 "for your review"; Dr. Verma marked reviewed on day 46.
46–51 Sugar Jasoos 2 "sabzi and dal first, roti last": rises A = 52, 58, 49 and B = 70, 74, 69 (effect 18, not fully consistent, early).
52 Rasoi Card created from Sprint 2.
28, 42, 56, 70, 84 PHQ-2 (scores 2, 1, 1, 0, 0); day 28 PHQ-9 = 9.
30 myth check: "करेला जूस से डायबिटीज़ जड़ से ख़त्म, दवा बंद करो" → false.
85 home HbA1c booked for day 87 at 08:00; 87 sample collected; 88 result 8.1%; 88 PHQ-9 = 6.
90 in-clinic appointment with Dr. Verma at 11:30 (today in the default demo state).
Festival calendar (demo): "Sharad Navratri (demo date — replace with the official calendar)" starting day 92, so the S9 prompt appears on day 85.
Readings and alerts must be generated by running lib/safety over the seeded readings (M3), not hand-written, so they always agree.

Default demo state on first load: sim.day = 90, sim.time = "10:30", demoMode = true, online = true.
```
**Done when:** the DEMO panel's day input changes what exists (on day 3 there's no sprint yet; on day 90 there are 13 weekly checks); nothing from the future is visible.

---

## M3 ★ Core logic modules + self-test page

```
Follow guidelines.md. Implement pure functions in /lib and add their cases to #/dev/tests (show group name, case, expected, actual, ✓/✗, and a total).

lib/safety: glucoseRule(reading, history) → "S0"|"S1"|"S2"|"S3"|"S4"|"S5"|null using measuredAt vs enteredAt (sim time), value or flag "LO"/"HI", symptoms, lows in the last 24h, fasting values in the last 7 days. scanText(text) → hits of type crisis | cardiac | hypo_symptom, normalising case, Unicode NFC and extra spaces, with phrase lists in Devanagari, Hinglish and English (crisis: आत्महत्या, खुदकुशी, ख़ुदकुशी, मरना चाहता, मरना चाहती, जीने का मन नहीं, जीना नहीं चाहता, ज़िंदगी खत्म, सब खत्म कर दूँ, खुद को नुकसान, khudkushi, aatmhatya, marna chahta, jeene ka mann nahi, zindagi khatam, suicide, kill myself, end my life, want to die, self harm; cardiac: सीने में दर्द, छाती में दर्द, seene me dard, chhati me dard, chest pain, मुँह टेढ़ा, बोलने में दिक्कत, face drooping, slurred speech, one side weak; hypo: चक्कर, पसीना, कांप, बेहोश, chakkar, pasina, kaanp, behosh, shaking, sweating). phqRule(instrument, answers) per guidelines. weekThreeRule(...) per W3. runSafety(event) creates alert records with recipients filtered by consent/permission and returns the patient-facing screen to show.
lib/sprint: sprintResult(evenings, onSulfonylurea) → need_more_evenings | no_clear_difference | result { effect, consistent, confidence, morningLows }.
lib/privacy: view(viewerId, patientId, category) → { allowed, reason } using role, link status, consents, dial, the NEVER list and sensitive-record rules; also logs to accessLog when allowed.
lib/cycle: cycleDay(patient), phase (onboarding, sprint1, week3, maintenance-weeks, day90-window, proof), proofReady, guaranteeEligible(deltaHbA1c, checksAnswered), maintenanceEligible(lastTwoHbA1c, target).
lib/notify: canSendNudge(patient, type, time) honouring budget and quiet hours (safety always allowed).
lib/myth: match(text) → { kbId, verdict } using keyword sets per knowledge-base entry; any text suggesting stopping/replacing diabetes medicine → "false" plus the medicine warning even without a KB match; non-health text → "not_health"; no match → "unverified".
lib/rx: validate(prescription, doctor, patient) → list of blocking errors (doctor not verified, missing mandatory field, follow-up chronic medicine without a recorded in-person consultation, invalid PIN) and info notes (same generic active in another prescription).
lib/ocr: mock extract(sampleId or file name) → typed result for meter (value or LO/HI, unit), lab (HbA1c %, date), prescription (medicine list) with confidence; unknown images return null fields → manual entry.
Seed wiring: make the seed loader run runSafety, weekThreeRule and phqRule over the seeded readings, weekly checks, texts and PHQ results in day/time order, so seeded alerts, care-desk items and notifications are produced by the same rules as live ones.

Required test cases (all must pass):
safety: 52 fresh → S1; "LO" → S1; 64 fresh no prior low → S2; 64 with a low 3h ago → S3; 52 measured 7h ago → S0; 320 fresh → S5; fasting 76 and 78 this week → S4; 120 with no history → null; "जीने का मन नहीं करता" → crisis; "seene me dard ho raha hai" → cardiac; "aaj garmi se pareshan hoon" → no crisis; PHQ-9 with item 9 = 1 → S7; PHQ-9 total 12 → P1; PHQ-2 total 2 → offer PHQ-9.
sprint: rises A 38,45,41 / B 70,78,68 → effect 31 consistent; A 52,58,49 / B 70,74,69 → effect 18 not consistent; only 2 A evenings → need_more_evenings; effect 9 → no_clear_difference.
privacy: Amit → Ramesh mood → denied (never); Amit → Ramesh alerts → allowed; Neha → Ramesh medicines → denied (not in her preset); Rajesh ji → readings → denied; Dr. Verma → Ramesh mood without doctor-mood consent → denied; sensitive document uploaded by Amit → Amit denied.
cycle: Ramesh day 90 → cycleDay 90; guarantee with delta −0.7 → not eligible (improved); Sushma 6.8 and 6.7 → maintenance eligible.
rx: unverified doctor → blocked; follow-up medicine with no in-person record → blocked; Metformin also in Dr. Khan's prescription → info note.
myth: karela + "dawa band" → false with medicine warning; "walk after dinner" → true; "cricket score" → not_health; unknown health claim → unverified.
```
**Done when:** #/dev/tests shows all green. Keep this page — it's a strong thing to show judges ("our safety rules have tests").

---

## M4 ★ Launch home, How it works, Privacy notice, quick demo login

**Attach:** Stitch S1.
```
Follow guidelines.md. Build #/ (Launch home), #/how-it-works and #/privacy-notice.
Launch home: wordmark "Pulse", tagline "अपना मीटर, अपना सच", language toggle (switches the whole launch screen). Three role cards (Patient, Caregiver with indigo accent, Doctor with slate accent) each with Login and Register buttons leading to that role's own routes. Link "न्योता कोड है?" → a sheet asking whether the code is from a doctor (patient registration with the clinic pre-filled) or from a family member (caregiver registration with the invite pre-filled). Emergency strip pinned at the bottom, usable without login, with tel: links for 112 and 14416. Footer: chip "कानपुर में शुरू", links to privacy notice, terms (simple page), grievance officer (name, email, phone, "we aim to reply within 7 days"), and a small "Staff sign-in" link to #/team/login. Fine print: "Pulse बीमारी की पहचान या दवा तय नहीं करता। फ़ैसला आपके डॉक्टर का।"
When demoMode is on, show a "Quick demo login" row: Ramesh (patient), Amit (caregiver), Dr. Verma (doctor), Pooja (care desk), Founder (impact) — each sets the session and opens that role's home.
How it works: 3-slide carousel with Skip/Next; last slide CTA "शुरू करें" → patient register.
Privacy notice: standalone, readable before any sign-up, Hindi/English toggle: itemised list of data with purpose for each (readings & medicines; lab results; Sugar Jasoos data; mood check-ins — optional, private; fitness band — optional; photos you upload; family sharing — optional; research — optional, de-identified), who sees what (from the privacy matrix, in plain words), rights (access, correction, erasure, withdraw as easily as you agreed, nominee, grievance, complaint to the Data Protection Board of India), retention ("deleted when you delete your account, except prescriptions your doctor must keep under medical-record rules"), contact. Button "PDF डाउनलोड" (generate a simple printable view).
```
**Done when:** every launch link leads somewhere real; emergency buttons are `tel:` links; quick login lands on each role's home.

---

## M5 Patient login + registration (6 steps) with eligibility

**Attach:** Stitch S2, S3 (one at a time if needed).
```
Follow guidelines.md. Build #/patient/login and #/patient/register (6-step wizard with a progress bar; Back keeps entered data; leaving mid-way and returning resumes the step).

Login: +91 mobile (10 digits starting 6–9) → "OTP भेजें" → 6-box OTP with 30s resend timer and "नंबर बदलें". Rules: wrong OTP shows remaining attempts (5 total); 5 wrong → locked 15 minutes (sim clock) with countdown and "केयर टीम को कॉल करें"; OTP expires after 5 minutes; unregistered number → "यह नंबर रजिस्टर नहीं है" + Register button; returning users can set a 4-digit PIN and use "PIN से खोलें". Demo OTP 123456 chip only in demo mode.

Registration:
Step 1 basics: name (2–60 letters, Hindi or English), date of birth (age < 18 → stop with the "not yet supported" screen), sex chips, mobile with OTP verification, language, pincode (208001–208027 → "कानपुर नगर"; other valid pincodes → waitlist screen that stores a waitlist record; invalid → error).
Step 2 diabetes: type (Type 2 / Type 1 / don't know), since year (≤ current year), insulin yes/no, pregnancy question only for female 18–50, glucometer yes/no, latest HbA1c value (4.0–15.0 %) with date or "don't know", prescription photo (uses lib/ocr mock; extracted medicines shown as "unconfirmed — a care-team member will confirm with you or your family") or "later". Outcome: Type 2 + no insulin + not pregnant + glucometer yes → eligible; insulin → "doctor-supervised mode" (sprints disabled, safety on); Type 1, pregnant or under 18 → not-yet-supported screen with waitlist and helplines; no glucometer → info "Pulse needs a glucometer — ask your doctor" with "continue anyway (limited)".
Step 3 doctor: clinic code (KNP-VERMA-01 valid; DR-0002's code shows "doctor verification pending — your request will wait"), QR scan (simulated), searchable list of verified Kanpur doctors showing name, qualification, reg. no. and Verified badge; "my doctor isn't on Pulse" → share invite text + "continue without doctor (limited: no prescriptions or doctor reports)". Optional ABHA: 14 digits or an address ending "@abdm" (validate format; "later" allowed).
Step 4 safety contact: name, phone (must differ from the patient's), relation, "lives in Kanpur?" yes/no; if no → amber warning and ask for a second, local contact (allowed to continue). Copy explains they get emergencies only. Toggle (default OFF, stored as consent "crisis_contact"): "अगर मैं कहूँ कि मैं सुरक्षित नहीं हूँ, तो इन्हें भी बताएँ".
Step 5 consent: itemised toggles from the privacy notice; required item locked ON with explanation; optional items default OFF; mood row in plum; nominee (optional, name + phone + relation). Button "चुनी हुई चीज़ों के लिए सहमति दें" stores one consent record per item with day/time and method "tap".
Step 6 family invite (optional): phone + relation + preset (recommended) with editable categories; NEVER list shown locked. Creates a link record with status "invited" and a 6-character code.
Finish → "आपके पहले 90 दिन" timeline → patient home. Create the patient record, cycle 1 starting today, and book the baseline HbA1c if none ≤ 30 days.
```
**Done when:** a 17-year-old, a Lucknow pincode and an insulin user each get the right screen; a full Kanpur Type 2 registration lands on a home that shows "दिन 0 / 90"; consents appear in the store item by item.

---

## M6 Caregiver login, registration, connecting, approval, patient chooser

**Attach:** Stitch S6, S7.
```
Follow guidelines.md (caregiver accent indigo, English first with Hindi toggle). Build #/caregiver/login, #/caregiver/register, #/caregiver/connect, #/caregiver/choose, and the patient-side approval sheet.

Login: mobile + password, then 6-box code (2-step). Errors: wrong password (generic "mobile or password is incorrect" — never reveal which), 5 failures → 15-min lock, forgot password → OTP → new password with rules (8+ chars, 1 number).
Register: name, mobile (OTP), email (optional, for invoices), city, password with live rule ticks, relationship, privacy-notice checkbox.
Connect (two tabs):
- "I have an invite code": valid code → link becomes "approved" with the categories the patient chose at invite time; expired (7 days) or used code → clear error.
- "Request access": patient's Pulse ID + last 4 digits of the patient's mobile + relationship + optional relationship-proof upload. Always show the same confirmation "If the details match, they'll get a request" (do not reveal whether the ID exists). Only if both match, create a link with status "pending" and a patient notification. Limits: 3 requests per day; one pending request per patient; expires after 7 days; "Send reminder" once per 24h; caregiver can cancel.
Patient approval: on the patient's home, a card/sheet "अमित (बेटा) आपकी देखभाल से जुड़ना चाहते हैं" with the recommended preset, "मंज़ूर करें", "बदलकर मंज़ूर करें" (category toggles; NEVER items locked off), "मना करें". Decline → caregiver sees a neutral "not approved" state; can request again after 7 days.
Chooser #/caregiver/choose: after login, if more than one approved patient, show avatars with status rings (ok / attention / urgent from open alerts; ring has icon + word), last update time, plan; with exactly one, skip to that home. "+ Connect another family member". Remember the last chosen patient.
Edge cases: a caregiver who is also a patient (same phone) logs in separately in each mode; revoked links disappear from the chooser with a one-time notice "Papa stopped sharing with you on 12 Aug".
```
**Done when:** Amit sees Papa and Mummy; Neha sees only Papa; a wrong Pulse ID shows the same message as a right one; approving as Ramesh makes the link appear for the caregiver without reload.

---

## M7 Doctor login, registration, verification, session lock

**Attach:** Stitch S8, S9.
```
Follow guidelines.md (doctor slate theme, desktop-first). Build #/doctor/login, #/doctor/register (4 steps with left stepper), #/doctor/verification.

Login: email or mobile + password → OTP. "Keep me signed in on this device" lasts 12 sim-hours. Session lock: after 15 minutes of no interaction (real time, so judges can see it) show a lock screen asking for the 6-digit PIN; 5 wrong PINs → full logout.
Register:
1 Identity: full name as on certificate, mobile (OTP), email, photo optional.
2 Registration & qualifications: council dropdown (Uttar Pradesh Medical Council, National Medical Commission, other State Medical Councils), registration number (required, 3–20 letters/numbers/slashes — don't over-validate formats), year (1960–current), qualifications multi-select, specialisation, NMR ID optional, HPR ID optional, uploads for registration certificate and degree (PDF/JPG/PNG up to 5 MB; show type/size errors; preview chips). Duplicate registration number + council → "This registration is already on Pulse — contact support".
3 Practice: clinic name, address, Kanpur pincode, auto-generated clinic code (KNP-<SURNAME>-NN, unique), consultation modes, weekly hours grid, reply commitment 24/48/72h, optional clinic assistant (name, mobile; permissions limited to uploading paper prescriptions and managing appointments).
4 Signature & declarations: draw/upload signature, set and confirm a 6-digit signing PIN (not 000000, 123456 or the same digit repeated), four declarations (details true; will verify patient identity for teleconsults; Pulse AI only drafts summaries and never prescribes or counsels; no referral commissions) — all required.
Verification: status pending → in demo mode a "Simulate approval / Simulate rejection" button. Pending doctors can edit their clinic profile but every patient screen shows "Patient data and prescribing unlock after verification", and patients who choose them get a "waiting for verification" state. Rejected shows the reason and "Fix and resubmit" returning to the right step with data kept.
```
**Done when:** Dr. Saxena (pending) can't open any patient; Dr. Verma can; leaving the tab idle 15 minutes shows the lock.

---

## M8 ★ Patient home "आज" + drawer + "दिन की घड़ी" reminders

**Attach:** Stitch S10, S11.
```
Follow guidelines.md (patient: Hindi, 18px, MobileShell). Build #/patient/home, the drawer, bottom nav (आज, दर्ज करें [centre +], प्रगति, रिपोर्ट) and #/patient/reminders.

Home (all values computed from the store at the sim day/time):
- App bar: hamburger, "नमस्ते, रमेश जी", bell with unread count, red "मदद" pill → help sheet with 112, Tele-MANAS 14416, "call my safety contact", "call Pulse care team" (staffed-hours aware). The "मदद" pill appears on every patient screen.
- Chip "दिन N / 90" from lib/cycle (Maintenance patients show "देखभाल योजना · दिन N / 180").
- "दिन की घड़ी": SVG 24-hour ring with today's dose slots, the weekly check (Sunday), sprint evening tasks and optional water/walk; done = tick, missed = hollow amber with "छूटी", upcoming = outline, next slot highlighted with "अगला: 9:30". Tapping a slot opens its action sheet.
- Context card chosen by lib/cycle phase: onboarding ("पहली रीडिंग दर्ज करें" / "HbA1c टेस्ट: <booked day and time from the store>"), sprint (tonight's task), week-3 support ("हल्का हफ़्ता"), regular (progress line), day-90 window (lab status → Proof Card).
- "आपकी प्रगति" mini card (fasting this week vs start; sprint result one-liner).
- Optional band card (if band consent OFF: "जोड़ें (वैकल्पिक)"; if ON: last sync and a "not for diagnosis" note).
- Tiles: डॉक्टर से पूछें, सच या झूठ?, मेरे नोट्स. Pending caregiver approval card appears here when a request exists.
Drawer: profile header with Pulse ID; मेरी प्रोफ़ाइल, परिवार और प्राइवेसी, भुगतान और बिल, सेटिंग्स, मदद और शिकायत, लॉगआउट (confirm). Footer disclaimer.

Reminders "दिन की घड़ी" screen:
- Ring + list grouped by routine anchors (नाश्ते से पहले, नाश्ते के बाद, सुबह की चाय के बाद, आरती के बाद, रात के खाने के बाद, सोने से पहले, or exact time). Each item: pill thumbnail (placeholder icon), generic name, dose, status.
- Reminder moment: when the sim clock reaches a slot (or via DEMO "fire next reminder"), show the full-screen reminder card: "ले ली ✓" (creates a taken dose), "30 मिनट बाद" (one snooze; second time it becomes "बाद में दर्ज करें"), "आज नहीं" with reasons (खत्म हो गई → asks "7 दिन से कम बची हैं?" and nudges the payer; तबीयत ठीक नहीं → offers symptom log; भूल गया; डॉक्टर ने बंद की → asks to upload the new prescription and pauses that reminder). If neither tapped within 2 hours → dose marked "missed" silently (no alarm). Missed card next morning uses "कोई बात नहीं" tone.
- Edit reminder: anchor chips or time, "अमित की आवाज़ में याद" (only if a caregiver recorded a 5-second clip AND Ramesh turns it on; play a placeholder sound), quiet hours (22:00–07:00; safety exempt; a dose inside quiet hours is allowed because the patient set it), "2 बार लगातार छूटने पर परिवार को बताएँ" (default OFF; needs caregiver medicines permission), व्रत मोड (S9).
- Footer: "इस हफ़्ते Pulse ने भेजे: आपकी N दवा-याद + M सुझाव" computed by lib/notify; "सीमा बदलें".
- New prescription from the doctor creates a "नई दवाएँ — याद सेट करें?" card; reminders change only after Ramesh confirms; stopped medicines stop reminding.
```
**Done when:** at day 90 10:30 the ring shows morning doses done and 21:30 upcoming; moving the clock to 23:45 without tapping marks the evening dose "missed"; the caregiver (with medicines permission) sees that miss in M16/M19.

---

## M9 ★ Logging + glucose capture + safety screens (live)

**Attach:** Stitch S12, S13.
```
Follow guidelines.md. Build the "दर्ज करें" sheet and #/patient/log/glucose, plus the safety screens. Run lib/safety on every save.

Log sheet tiles: शुगर, दवा ली, पानी (+1 glass; daily total; no target shaming), खाने की फ़ोटो (only if meal-photo consent; otherwise explains and links to consent), BP (sys 70–250, dia 40–150), वज़न (25–250 kg), लक्षण (chips + free text → scanText), लैब रिपोर्ट (→ records upload).
Glucose entry: big number display with numeric keypad; unit toggle mg/dL | mmol/L (store mg/dL; mmol × 18); context chips (खाली पेट, खाने से पहले, खाने के 2 घंटे बाद, सोने से पहले, कभी भी); measured time "अभी" or edit (can't be in the future; > 30 min old triggers S0 path); "यह आपकी रीडिंग है?" हाँ / किसी और की (others are discarded with a thank-you, not stored); symptom chips. Validation: 20–600 mg/dL or "LO"/"HI" buttons; a value under 35 with a decimal → ask "क्या आपका मीटर mmol/L में है?"; duplicate (same value within 5 min) → "पहले ही दर्ज है — फिर भी जोड़ें?".
Meter photo: choose from 4 demo sample images (meter_142, meter_LO, meter_5_2_mmol, unclear) or upload; show "पढ़ रहे हैं…" 1s; lib/ocr result → "मैंने 142 mg/dL पढ़ा — सही है?" हाँ / बदलें. Unclear → "साफ़ नहीं दिखा — नंबर खुद लिखें". A value is never saved until the patient confirms.
After save:
- Normal → green card with a one-line context ("पिछले हफ़्ते से 6 कम") and back to home.
- S2 → amber "शुगर कम है" card with steps, 15-min timer, "15 मिनट बाद याद दिलाएँ", "मुझे मदद चाहिए". If the recheck is < 70 or no recheck in 20 sim-minutes → S1.
- S1/S3 → full-screen red-tinted card with numbered steps (3 चम्मच चीनी पानी में या 150 ml जूस; बैठ जाएँ; 15 मिनट बाद फिर जाँचें — labelled "डॉक्टर द्वारा मंज़ूर निर्देश (डेमो)"), countdown ring, "फिर जाँचा — दर्ज करें", "राजेश जी को कॉल करें", "112 कॉल करें", and a live status line of who has been notified ("राजेश जी और अमित को संदेश भेजा गया · 3:42"). "मैं ठीक हूँ" never closes the alert unless a recheck ≥ 70 is logged.
- S5 → symptom check; any symptom → 112 card + notifications; none → "2 घंटे बाद फिर जाँचें" reminder + clinic digest.
- S0 → "यह रीडिंग X घंटे पुरानी है — अभी कैसा महसूस कर रहे हैं? एक बार फिर जाँचें।"
- S4 → info card "डॉ. वर्मा को अगली बार बताएँ"; clinic "for your review".
Alert propagation (store): create alert records with owner and timeline; notify the safety contact (simulated SMS log visible in team console), caregivers with alerts permission, care desk (if staffed hours) and clinic digest — exactly per guidelines. Offline mode: the reading is queued, safety screens still show immediately (they run on the device), and notifications to others are sent when back online with a note "देर से भेजा गया".
```
**Done when:** logging 48 shows the red screen and, after switching to Amit, his home shows the urgent alert with Rajesh ji's status; logging 64 then nothing for 20 sim-minutes escalates to S1; a 7-hour-old 52 shows the S0 message, not the red screen.

---

## M10 ★ Sugar Jasoos (the MVP hero)

**Attach:** Stitch S14.
```
Follow guidelines.md. Build #/patient/jasoos (intro, plan, tonight, result, history).

Library (doctor-approved list, editable later by the clinical team): 1 "रात के खाने के बाद 10 मिनट टहलना"; 2 "पहले सब्ज़ी-दाल, फिर रोटी"; 3 "एक रोटी कम, एक कटोरी दाल ज़्यादा"; 4 "रात का खाना 8:30 से पहले". Nothing about medicines can ever be an experiment.
Intro: what, why, 3-step how, "लगभग 12 स्ट्रिप लगेंगी", "कभी भी रोक सकते हैं", consent check (sprint consent must be ON — otherwise link to turn it on), disabled for doctor-supervised (insulin) patients with an explanation.
Plan: choose a habit; schedule 6 consecutive evenings A,B,A,B,A,B starting tonight or tomorrow; show the 6 tiles with icons; strip estimate.
Tonight: checklist (before-dinner reading; do or don't do the habit; 2-hour-after reading with a timer that starts when the patient taps "खाना ख़त्म"); for sulfonylurea users after A evenings, add "कल सुबह खाली पेट जाँचें". Readings come from the glucose flow (M9) tagged with the evening; safety rules still run on each one.
Missed evening: it stays empty; the plan auto-extends by one evening of the same arm (max 2 extensions); if still < 3 valid per arm → "need_more_evenings" with options "दो शामें और" or "रोकें".
Result (lib/sprint): bars A vs B, headline "टहलने से आपकी शुगर औसतन 31 कम बढ़ी", label "शुरुआती नतीजा · 6 शामें · हर बार एक जैसा" (or without "हर बार एक जैसा" if not consistent). If morningLows > 0 → S4-style clinic note "after walking evenings, next-morning fasting under 80 — for your review". "no_clear_difference" → neutral card suggesting the next experiment. Buttons: "इसे अपनी आदत बनाएँ" (sets the habit asked about in weekly checks), "परिवार को बताएँ" (only if sprint-results sharing is ON for at least one caregiver; otherwise explain), "दोबारा जाँचें".
Food experiments create a Rasoi Card (family-wide swap) when the result exists, visible to caregivers with sprint-results permission and shareable as an image to the family cook.
History: past sprints with results; the doctor's patient profile reads these.
```
**Done when:** at day 10 Ramesh sees effect 31 "consistent"; at day 52 the food sprint shows 18 without "consistent"; deleting one A evening's readings in a fresh sprint triggers the extension logic.

---

## M11 ★ Weekly check, Week-3 support, mood check, crisis path

**Attach:** Stitch S15, S16.
```
Follow guidelines.md. Build #/patient/weekly, the Week-3 "हल्का हफ़्ता" mode, #/patient/mood, and #/patient/crisis.

Weekly check (Sundays; card appears from Sunday 07:00 until answered or the next Sunday): habit days 0–7 (only if a habit is set; otherwise "कौन-सी आदत?" link to Jasoos), missed tablets (नहीं / 1–2 / 3+ → then which, from the patient's medicine chips), stock < 7 days (हाँ → payer nudge if a caregiver has medicines permission, else a self-reminder), feeling (ठीक / थका हुआ / तबीयत ठीक नहीं / मन उदास). One submit creates one weeklyCheck. "तबीयत ठीक नहीं" offers the symptom log; "मन उदास" offers a mood check (only if mood consent is ON; otherwise a gentle line with Tele-MANAS 14416).
W3 rule (lib/safety.weekThreeRule) on the check covering days 15–21: create a care-desk P2 item (48 h), set the patient's home to "हल्का हफ़्ता" for 7 days (only one ask: the proven habit; all other nudges paused), and give caregivers with summary permission an "Encourage" card with a positive script ("Papa's walk evenings lowered his sugar by 31 — a call saying you noticed helps") — never "he skipped".
Mood check (only with mood consent): every 14 days a private card; plum styling; PHQ-2 with official wording (English items; Hindi items show placeholders "[PHQ-2 प्रश्न 1 — आधिकारिक हिंदी अनुवाद]" until pasted); score → PHQ-9 offer → PHQ-9 → result screen: < 10 "धन्यवाद" (nothing shared); 10–19 → choose a callback slot (care desk P1, 72 h) with "आपके परिवार को कुछ नहीं बताया जाएगा"; item 9 > 0 or ≥ 20 → crisis. Option "डॉ. वर्मा के साथ साझा करें" creates a separate consent.
Crisis screen (S7): calm copy from the templates, "क्या आप अभी सुरक्षित हैं?" with "हाँ, अभी सुरक्षित हूँ" / "मैं सुरक्षित नहीं हूँ"; big tel: buttons Tele-MANAS 14416, 112, "राजेश जी से बात करें" (only if he is a safety contact and the patient pre-consented to crisis contact); honest staffed-hours line; no chat box; the screen stays pinned on home for 24h as a small card. "मैं सुरक्षित नहीं हूँ" → notify the safety contact (if consented) + care desk P0. Caregivers are never notified.
Free-text scanning: run scanText on messages to the doctor, symptom notes, myth inputs and private notes. Messages/symptoms/myth inputs with crisis hits → S7 with a care-desk P0. Private notes → show the crisis screen and offer "Pulse केयर टीम से कॉल चाहिए?" without an automatic alert. Cardiac hits anywhere → S6.
Withdrawing mood consent stops future checks immediately and offers "पुराने जवाब भी हटाएँ".
```
**Done when:** the day-22 check (covering days 15–21) produces the care-desk item, the lighter week on Ramesh's home and the Encourage card on Amit's home; typing "जीने का मन नहीं करता" in a doctor message shows the crisis screen and a P0 item; the same words in a private note show the crisis screen but create no alert.

---

## M12 Progress dashboard, fitness band, water

**Attach:** Stitch S17.
```
Follow guidelines.md. Build #/patient/progress and #/patient/band.
Progress: "HbA1c का सफ़र" track (baseline → Day-90 test date; target band from the doctor, default < 7%; Day-90 value when available); weekly fasting chart (Recharts if available, else SVG; points with values; tap shows date); "आपके प्रयोग" list from sprints; "इस हफ़्ते" (habit days, missed tablets); "सबसे अच्छा हफ़्ता" (highest habit days). Empty states before data exists ("पहली रीडिंग के बाद यहाँ दिखेगा"). No streaks, badges or points anywhere.
Band (optional, needs band consent): states not-connected → "बैंड जोड़ें" (simulated connection flow: pick a demo band, grant per-type permissions for steps, sleep, heart rate, SpO2), connected (cards with 7-day trends, last sync time), stale (no sync for 3+ days → amber with "फिर से जोड़ें"), disconnected by user (data kept until the patient deletes it). Every card carries the wellness-only label. No alerts from band data. Water card with +1 / −1 and today's count (manual; not from the band). A note explains that a phone app is needed to read band data on Android and that this demo simulates it.
Doctor and caregiver see band data only per the privacy matrix.
```
**Done when:** before day 7 progress shows empty states; connecting the demo band fills 7 days; nothing on band screens creates an alert.

---

## M13 Records and prescriptions (patient side)

**Attach:** Stitch S18.
```
Follow guidelines.md. Build #/patient/records with tabs "रिपोर्ट" and "पर्चे".
List: cards with type icon, date, source (lab / doctor / आपने जोड़ा / परिवार ने जोड़ा), highlight values, verification chip, sensitive plum chip; filters; search; empty state.
Add: camera (simulated), gallery (demo samples: lab_hba1c_8_8, lab_lipid, rx_paper_verma, rx_old_khan, discharge_psychiatry_demo, blurry), PDF; type chips; date (not in the future); size ≤ 10 MB; unsupported type error.
Extraction: lib/ocr mock → rows with "सही ✓ / बदलें"; all values start "डॉक्टर की पुष्टि बाकी" and are never used by safety rules or charts as verified until the doctor verifies (charts may show them with a dashed outline and "अपुष्ट" label). Blurry → "साफ़ फ़ोटो लें".
Sensitive auto-classification: documents of type discharge_psychiatry_demo (and any marked sensitive) get the plum notice and are hidden from caregivers even if a caregiver uploaded them.
Viewer: zoomable image, details, "कौन देख सकता है" (doctor ✓; each caregiver toggle unless sensitive → locked), download, delete (confirm; also removes extracted values; doctor-issued prescriptions remain in the doctor's record with a note).
Prescriptions tab: active medicines (from the latest signed prescription or confirmed paper prescription), history with version and doctor (name, qualification, reg. no.), "पर्चा PDF देखें"; pharmacy sharing toggle per prescription ("दवा दुकान को भेजें" asks explicit consent each time).
Caregiver uploads (M19) appear here with "परिवार ने जोड़ा" and the patient can hide or delete them.
```
**Done when:** uploading the psychiatry demo document as Amit makes it invisible to Amit and visible to Ramesh and Dr. Verma; an unverified HbA1c never changes the North Star.

---

## M14 Doctor connect, appointments, patient self-notes

**Attach:** Stitch S19.
```
Follow guidelines.md. Build #/patient/doctor (messages + appointments) and #/patient/notes.
Doctor card: name, qualification, reg. no., Verified badge, reply commitment ("आमतौर पर 48 घंटे में जवाब"). Amber banner "आपात स्थिति के लिए नहीं — 112 या टेली-मानस 14416".
Messages: thread with the linked doctor; text, voice note (record + playback placeholder), attach a reading or a report; each message runs scanText first (S6/S7 behaviour from M11). Doctor replies are labelled with the doctor's name; system line "जवाब डॉक्टर या उनकी क्लिनिक टीम देती है — कोई AI नहीं". If the reply is overdue (past commitment), show "जवाब में देर — क्लिनिक को कॉल करें" with the clinic number. Not linked to a doctor → empty state with "डॉक्टर जोड़ें".
Questions for next visit: list built from notes/messages marked "अगली मुलाक़ात"; the doctor's overview shows them.
Appointments: book (mode chips in-clinic / video / phone; slots from the doctor's hours; reason chips; video first-time note about showing ID), statuses requested → confirmed → completed / cancelled / no-show; reschedule and cancel (reason); reminders 1 day and 2 hours before (within budget). Double booking the same slot is impossible; past slots are disabled.
Self-notes: quick text or voice note with tags (लक्षण, खाना, नींद, मन, डॉक्टर से सवाल); private by default (plum "सिर्फ़ आप"); per-note toggles "डॉक्टर के साथ साझा करें" and "अगली मुलाक़ात के सवालों में जोड़ें"; edit, delete; search by tag. Private-note crisis behaviour per M11.
```
**Done when:** a booked slot disappears for other patients; a message with "seene me dard" shows the 112 card; a note shared with the doctor appears in Dr. Verma's "Shared with me" tab.

---

## M15 ★ "सच या झूठ?" Myth Buster (patient and caregiver)

**Attach:** Stitch S20.
```
Follow guidelines.md. Build one MythBuster feature used at #/patient/myth and #/caregiver/myth (language follows the role).
Knowledge base /content/myths.json (synthetic demo content, each with verdict, Hindi + English explanation, sources, reviewer "Demo reviewer", reviewed day): K1 karela juice cures diabetes / stop medicine → false (+ medicine warning); K2 stop metformin because it damages kidneys → false; K3 insulin is addictive → false; K4 methi water cures diabetes → misleading; K5 jaggery/honey are safe instead of sugar → misleading; K6 sugar-free sweets can be eaten freely → misleading; K7 a 10-minute walk after meals helps lower post-meal sugar → true (source: Reynolds et al., Diabetologia 2016); K8 eating vegetables and dal before roti/rice lowers post-meal sugar → true (source: Shukla et al., Diabetes Care 2015); K9 all fruits are banned in diabetes → misleading; K10 fasting cures diabetes → misleading with "ask your doctor before fasting on tablets"; K11 cinnamon replaces tablets → false; K12 diabetes is caused only by eating sugar → misleading.
Input: paste text, upload screenshot (demo samples with known text), or voice (simulated). Run scanText first. lib/myth.match → verdict screen with icon + word (सच / झूठ / आधा सच / जाँच नहीं हुई), the claim quoted, short reason, sources, reviewer and date, buttons "परिवार के ग्रुप में भेजें" (share an image card: verdict + reason + "Pulse डॉक्टर-समीक्षक द्वारा जाँचा", no sender name, no patient data; use the Web Share API with a download fallback) and "डॉक्टर से पूछें" (adds to next-visit questions). Any claim about stopping or changing medicines shows the red banner "दवा बंद या बदलनी हो तो सिर्फ़ डॉक्टर से". "not_health" → "यह सेहत से जुड़ा दावा नहीं लगता". "unverified" → adds to the team's myth review queue and says "डॉक्टर-समीक्षक को भेजा — जवाब आने पर बताएँगे"; when the team publishes a verdict (M23) the user gets a notification.
Home of the feature: "कानपुर में इस हफ़्ते सबसे ज़्यादा पूछा गया" top 3 by count (synthetic counts), and "मेरी जाँचें" history. Shares are counted for the impact console.
The doctor's patient overview lists myths the patient checked (only those with verdict false or misleading).
```
**Done when:** pasting the karela forward shows "झूठ" with the medicine banner; an unknown claim appears in the team queue; the share card contains no name.

---

## M16 Notification centres + notification budget

```
Follow guidelines.md. Build one notifications engine and two centres: #/patient/notifications and #/caregiver/notifications.
Engine: notifications are created from store events (dose missed, reminder due, sprint evening, weekly check, lab booked/collected/resulted, doctor reply, appointment status, alert created/acknowledged/resolved, payment due/failed, link requests, myth verdict published, consent changes, security notices). Each has category (alert, missed, upcoming, update, message), priority, deep link, read state and day/time. lib/notify blocks non-safety nudges beyond the budget or inside quiet hours and moves them to the next allowed time; safety alerts always go through. Caregiver notifications are created only when privacy.view allows that category for that caregiver.
Patient centre tabs: आज, छूटा, आने वाला, संदेश; grouped by day; unread dots; "सब पढ़ा हुआ करें"; deep links open the right screen; if the target no longer exists → toast "यह अब उपलब्ध नहीं" instead of a broken page; empty state "आज कुछ नया नहीं — अच्छी बात है".
Caregiver centre tabs: All, Alerts, Missed, Upcoming, Updates; each item shows which family member it is about (avatar) when the caregiver has more than one; filter by family member.
Weekly digest for caregivers every Sunday 19:00 (sim): one notification summarising permitted categories only.
A "Pulse ने इस हफ़्ते क्या भेजा" panel in patient settings shows counts by type so the budget is visible.
```
**Done when:** a missed evening dose appears in Ramesh's "छूटा" tab and in Amit's "Missed" tab but not in Neha's; moving the clock into quiet hours delays a water nudge to 07:00 but a low-sugar alert still appears instantly.

---

## M17 Privacy dial, access log, data rights

**Attach:** Stitch S21.
```
Follow guidelines.md. Build #/patient/privacy, #/patient/privacy/log and #/patient/my-data. Also build the remaining drawer pages: #/patient/profile (name, date of birth, phone — changing it needs OTP on the new number and re-confirming consents, ABHA, doctor, safety contacts with edit, nominee), #/patient/settings (language, text size Large/Extra large with live preview, voice instructions toggle playing a placeholder audio, quiet hours, reminder budget view, units, fasting mode, band, demo-OTP toggle) and #/patient/help (FAQs, care-team call with staffed hours, grievance officer, complaint form with ticket number).
Parivaar Dial: one card per person (each caregiver, the safety contact, the doctor): category toggles from the privacy matrix with one-line explanations; NEVER items shown locked in plum; master toggle "सारा साझा करना रोकें" (pauses all family sharing except emergency alerts to the safety contact; caregivers then see "Papa has paused sharing"); remove a caregiver (confirm; they lose access immediately and get a neutral notice). Every change creates a consent/dial record with day/time and appears in the access log.
Access log: rows from accessLog ("अमित ने हफ़्ते का सार देखा · 3 Oct, 9:12 pm"), filter by person.
My data: download (generate a JSON + readable summary of everything about the patient), correct a value (opens the item with an edit form; corrections are logged and flagged to the doctor if clinical), withdraw a consent (same effort as giving it; explains what stops), nominee (add/change; DPDP right to nominate), grievance (form → ticket number, status, "we aim to reply within 7 days", line about complaining to the Data Protection Board of India), delete account (two-step confirm with typed "हटाएँ"; explains: Pulse data deleted, caregivers and safety contact lose access, doctor keeps prescriptions they issued as medical rules require; after deletion log out and show a confirmation receipt).
```
**Done when:** pausing sharing turns Amit's home into the paused state within one refresh; deleting the demo account removes Ramesh from Amit's chooser and from the doctor's search (with "access withdrawn" if the doctor had him open).

---

## M18 Payments and billing (patient and caregiver)

**Attach:** Stitch S22, S26.
```
Follow guidelines.md. Build billing at #/patient/billing and #/caregiver/billing.
Plans per patient: Care Cycle ₹1,199 / 90 days (includes one home HbA1c); Maintenance ₹1,499 / 180 days (only offered when lib/cycle.maintenanceEligible). Show payer, cycle progress, next renewal day, guarantee status (computed, e.g. "रविवार की जाँच 13/13") and terms.
Pay (mock UPI): enter UPI ID (name@bank format) or pick "UPI app"; states: waiting (approve in your UPI app), success (receipt with invoice number, GST shown as "as applicable — demo"), failure (retry; "Safety alerts continue for 30 days" banner; grace countdown), pending > 10 min → "still waiting — check your UPI app". Prevent double payment.
Renewal: offered at the Proof Card moment (M19/M8), never auto-renewed by default (toggle available, OFF); reminder at day 85.
Guarantee: when Day-90 HbA1c delta > −0.3 and weekly checks answered ≥ 8, the next cycle shows ₹0 with "गारंटी के तहत मुफ़्त".
Split with sibling (caregiver): invite by phone; both see the bill; 50/50 or custom; if the sibling declines or doesn't pay in 7 days, the original payer is asked to cover the rest.
Lapsed: after the 30-day grace, sprints and digests stop; safety rules, crisis screens and data rights keep working.
Invoices list with downloadable printable view. Refund request form (reason) → status.
Patient billing is read-only when someone else pays ("भुगतानकर्ता: अमित"), with an option to pay himself.
```
**Done when:** a failed payment shows the grace banner and safety still fires; Sushma shows Maintenance; Ramesh's Day-90 delta of −0.7 does not trigger the guarantee.

---

## M19 ★ Caregiver app (home, switcher, alerts, upcoming, notes, Rasoi, permissions, proof, growth loops)

**Attach:** Stitch S23, S24 (then S25, S26 in a follow-up if needed).
```
Follow guidelines.md (caregiver: indigo accent, English first, MobileShell). Build #/caregiver/home and its sub-screens. Every patient datum must come from privacy.view for the active patient.

Header: hamburger, bell with unread count, avatar row (Instagram-style switcher) for approved family members with status rings (icon + word), "+ Add". Long-press or tap the active avatar → bottom sheet switcher with name, relation, last update, plan. Switching changes every card instantly.
Cards (each hidden or replaced by "Papa hasn't shared this" with "Ask Papa to share" — once per 30 days — when not permitted):
- Status hero: "Papa's week: steady / needs attention / urgent" from open alerts and the last weekly check, last update time, "Day N of 90".
- Sugar alerts: latest alert or "No alerts this week". Tapping opens the live alert screen: reading, measured vs received time, live timeline (patient saw steps, safety contact notified/acknowledged, recheck due/result), buttons Call Papa, Call [safety contact], Call clinic, "I've spoken to him" (acknowledges; first caregiver to acknowledge becomes owner and others see "Neha is handling this"). For caregivers outside Kanpur: info "You're not in Kanpur — the person near him should call 112" and no 108/112 button; caregivers living in Kanpur also get a 112 button (guidelines rule 7).
- Medicines today (taken / due / missed) — needs medicines permission.
- Upcoming: tests, lab collections, appointments (with status chips); "Book home collection" asks Papa's approval first (creates a patient approval request).
- Encourage card (only during W3 or after a new sprint result): positive script + Call Papa.
- Rasoi card (needs sprint-results permission): this week's family-wide swap, why line from Papa's own sprint, festival tips (S9: "ask Dr. Verma about tablets before fasting"), "We tried it this week", "Send to the family cook" (share image, no medical data). No calorie targets.
- Day-90 Proof (needs proof permission): certificate card + renew / Maintenance info.
- Tiles: Myth buster (M15), My notes.
Notes: list/composer (text, voice, photo) with tags; toggle "Share with Dr. Verma" with the notice "Papa will also see any note you share with his doctor" (shared notes appear for the patient and doctor); private caregiver notes are visible only to that caregiver. Caregiver document upload goes to Papa's records with "uploaded by Amit" and follows sensitive-record rules.
Permissions view: read-only list of what each family member shares, NEVER list in plum, "Ask to share more".
Drawer: profile, family members & permissions, payments & billing (M18), notification settings (alert sound, digest day), language, privacy & data (caregiver's own data: download/delete own account), help, log out.
Growth loops: "Invite a sibling to co-care" (needs the patient's approval for the new caregiver); "Share Papa's progress" (card with only what Papa allowed; numbers hidden unless Papa allows); "Join the family prevention waitlist" (for the caregiver themself; stores a waitlist record; no risk score or diagnosis). Count invites and shares for the impact console.
Revoked access mid-session → next action shows "Papa stopped sharing" and returns to the chooser.
```
**Done when:** Amit switching between Papa and Mummy changes everything; Neha sees alerts but not medicines; acknowledging an alert as Amit shows "Amit is handling this" for Neha; no caregiver screen ever renders a mood value or a sensitive document.

---

## M20 ★ Doctor home, menu, patient search with pagination, weekly report

**Attach:** Stitch S27, S28.
```
Follow guidelines.md (doctor: slate theme, DesktopShell, English). Build #/doctor/home, #/doctor/patients, #/doctor/weekly and the drawer.
Header: hamburger, global search (Pulse ID or name; results dropdown; Enter → patients page with the query), bell, avatar with name, qualification, reg. no. and Verified badge (pending doctors see the verification banner and no patient data).
Home:
- "Today, <weekday date>" appointments for the sim day (time, patient, mode icon, reason, status) with Open, Start (in-clinic marks "arrived"; video shows a simulated call screen with "Patient identity confirmed?" checkbox required before notes/prescription for a first teleconsult), Mark no-show.
- "Needs your review": rule-based descriptive items from alerts and events (S3/S4 patterns, Day-90 results ready, unverified uploads, messages near/over the reply commitment, mood shared by the patient, care-desk escalations), each with time, source rule, Open patient and Mark reviewed (records who and when). Never show recommendations.
- "This week" tiles computed for the last 7 sim days: active patients, patients who sent readings, safety events, sprints completed, Day-90 tests due next 7 days; link to the weekly report.
- Quick actions: New prescription (pick patient), Recommend tests, Invite patient (share clinic code/QR).
Drawer: My profile & verification, Clinic & hours, Appointments, Messages, Prescription templates, Practice outcomes, Invite a colleague / clinic QR (downloadable poster with code KNP-VERMA-01), Clinic assistant access, Notifications, Data & privacy (this doctor's own access log), Help, Legal, Settings, Log out. Every item opens a working page: profile (view/edit; changing registration details sends the doctor back to "pending"), clinic & hours (editing the hours grid changes bookable slots), prescription templates (save a medicine set and apply it in the composer), clinic assistant (add/remove; can only upload paper prescriptions and manage appointments), notifications (digest time), settings (session lock 5/10/15 min, signing-PIN reset needing the old PIN, reply commitment, auto-accept link requests), help and legal pages. Practice outcomes is built in M24.
Patients page: only patients linked to this doctor with share-with-doctor consent; search by ID (exact or prefix) and name (case/diacritic-insensitive, typo-tolerant suggestions "Did you mean…"); filters (Needs review, Stable, Day 80–90, Sprint active, HbA1c ≥ 9, Last visit > 90 days); sort (name, cycle day, last HbA1c, last visit); table with sparkline; pagination 10/25 per page, "Showing 11–20 of 46", first/prev/next/last; changing a filter or page size resets to page 1; empty and no-results states; keyboard navigation; the URL keeps query, filters and page.
Weekly report: last 7 sim days — tiles, table of patients needing attention with reasons, Day-90 tests next week, sprint completions, care-desk calls; Export (printable view). Footer "Descriptive summary of patient-reported and lab data."
```
**Done when:** searching "Rmesh" suggests Ramesh; page 5 at size 10 shows 41–46; switching to size 25 jumps to page 1; Dr. Saxena sees no patients.

---

## M21 ★ Doctor patient profile: overview, Health Map, charts, reports, notes, mood, messages

**Attach:** Stitch S29 (then S30 in a follow-up if needed).
```
Follow guidelines.md. Build #/doctor/patient/:id/(overview|map|charts|reports|prescriptions|tests|notes|mood|messages). All data via privacy.view; a revoked or deleted patient shows "Access withdrawn by the patient" and nothing else.
Header: name, age/sex, Pulse ID, condition and duration, cycle day, ABHA badge, active medicines, safety contact (masked number, reveal on click with logging), chips of what the patient shares with this doctor.
Overview "Since last visit (<last in-person date> → today, N days)": computed, not hand-written — HbA1c baseline → latest with delta and "lab-verified"/"unverified"; weekly fasting mean first 2 weeks vs last 2 weeks with n; "What worked — patient's own experiments" from sprints (effect, evenings, consistent/early); adherence ("missed 1–2 evening tablets in X of Y weeks — Metformin evening"); safety events list with dates and rules; life context from notes/profile; patient's questions; myths checked (false/misleading only); mood line only if consented ("PHQ-9 12 → 6; care team supported"), else a plum "Not shared by patient". The narrative bullets are generated from these computed numbers (LLM if available, otherwise a template) and must not contain dose or treatment advice — run a filter that blocks words like increase/decrease/stop/start + medicine names and falls back to the template. Footer "Auto-summary … Descriptive only — verify before acting." Buttons: Print 1-page brief (A4 printable), New prescription, Recommend tests, Add note.
Health Map: deterministic radial SVG graph (no physics) with the patient at the centre; node types with distinct shape + icon + label — conditions, medicines, lab results, habits (from sprints), documents, doctors (Dr. Verma, Dr. S. Khan), events (S4 on days 43–45); labelled edges (treats, monitors, prescribed by, source of, lowers post-dinner rise by 31). Unverified nodes dashed. Click a node → side panel with details, source document thumbnail, Verify / Reject for extracted facts (updates records everywhere). Filters by type, "since last visit" toggle, legend, and "View as list" (accessible table of the same data). Mood nodes only with consent; sensitive documents shown to the doctor with a plum tag.
Charts: HbA1c by cycle with target band; weekly fasting with points; sprint paired bars; missed-tablet weeks; safety-event timeline; wellness (steps/sleep) only if shared, labelled "not for diagnosis". Range 30/90/180/since last visit; n and source on each; empty states.
Reports: table with filters; verify screen with document left, extracted fields right (evidence text, Verify/Edit/Reject); "Unverified values are never used for alerts".
Notes: "My private notes" (only this doctor; pin, edit, delete, search, timestamps) and "Shared with me" (patient and caregiver notes, author labelled).
Mood tab: PHQ trend only with consent, else locked explanation.
Messages tab: same thread as the patient sees; replies show the doctor's identity; quick-reply templates; "Convert to appointment"; system banner when a patient message triggered S6/S7.
```
**Done when:** the overview numbers change if you move the sim day back to 45; verifying a node in the Health Map flips its dashed outline everywhere; the overview never contains dose advice even if you edit a note to say "increase metformin".

---

## M22 ★ Prescriptions, test recommendations, appointment management (doctor)

**Attach:** Stitch S31, S32.
```
Follow guidelines.md. Build the doctor's Prescriptions tab (history, active list, Renew, Upload paper prescription photo) and the composer, Tests tab, and #/doctor/appointments.
Composer: header auto-filled (doctor name, qualification, reg. no., clinic, date; patient name, age, sex, Pulse ID). Consultation mode (in-clinic, video, audio, text). Provisional diagnosis (doctor's free text). Medicine rows: generic-name search from a demo list (Metformin, Glimepiride, Gliclazide, Sitagliptin, Vildagliptin, Dapagliflozin, Empagliflozin, Pioglitazone, Atorvastatin, Rosuvastatin, Telmisartan, Amlodipine), strength, dose pattern chips (1-0-1 etc.), food timing, duration, Hindi instruction from preset phrases only (खाने के बाद, खाने से पहले, सुबह खाली पेट, रात को सोने से पहले). Advice, follow-up date, linked tests. Autosave draft every change ("Draft saved 10:42"); leaving with unsaved changes asks to confirm.
Validation (lib/rx): unverified doctor → blocked; missing mandatory fields → inline errors; mode video/audio/text with a follow-up chronic medicine and no recorded in-person consultation → blocked with explanation; same generic active in another prescription → info note (not a block); Schedule-X / narcotic items aren't in the list at all.
Preview: A4 printable with all fields and signature; enter the 6-digit signing PIN (3 wrong → wait 5 minutes); checkbox "Also send to patient's pharmacy" disabled unless the patient has given pharmacy consent for this prescription. Sign → version number increments; previous prescription marked "superseded"; patient gets a notification and the "set reminders for new medicines?" card (M8); caregivers with medicines permission see the updated list.
Paper prescription upload (doctor or clinic assistant): image → lib/ocr → doctor confirms each medicine → becomes the active list with source "paper".
Tests: checklist with "last done N days ago" hints computed from labs; reason; due date; collection option; send → patient notification and an Upcoming item for caregivers with tests permission; status pipeline Recommended → Booked → Collected → Result uploaded → Verified; overdue highlighted.
Appointments: calendar/list for the doctor, slot setup from clinic hours, confirm/reschedule/cancel with reason (patient notified), no-show; teleconsult start requires "patient identity confirmed" on the first video consult.
```
**Done when:** an audio-mode prescription with Metformin for a patient without an in-person record is blocked; signing Ramesh's renewal updates his active medicines, his reminders card and Amit's medicines list.

---

## M23 Pulse team: care desk, psychiatrist case review, myth review

**Attach:** Stitch S34.
```
Follow guidelines.md (team: graphite accent, DesktopShell). Build #/team/login (demo staff only), #/team/desk, #/team/case-review, #/team/myths.
Care desk: staffed-hours banner (08:00–22:00; outside → "Night protocol: helplines + safety contact; callbacks start 08:00"). Queue sorted by severity (P0 → P2) then SLA due time, with live countdowns from the sim clock and an "Overdue" state. Item types: S1/S3 with no recheck, S5 with symptoms, S6, S7 crisis (60-min callback), PHQ-9 ≥ 10 (72 h), W3 (48 h), S8 silence day 10, unconfirmed medicine lists. Detail pane: minimum necessary patient info, what the patient saw, contacts (masked; reveal logs access), call script per type, outcome buttons (Reached, No answer → retry timer, Declined call → logged and respected), escalate (to the doctor via clinic digest, to psychiatrist case review, "advise 112"), free-text note, resolve. Every open/reveal/resolve writes to accessLog. Care-desk staff cannot see doctor private notes and see mood only when mood consent is on.
Case review: weekly list of PHQ-9 ≥ 10 patients for Dr. R. Menon (demo) with trend and care-desk notes; reviewer adds a recommendation for the care team (not for the patient directly) and can flag "needs in-person referral".
Myth review: queue of unverified claims (count, first seen, sample text); editor for verdict, Hindi/English explanation, sources, reviewer; Publish → updates the knowledge base and notifies every user who asked.
Simulated outbound log: a tab "Messages sent" showing safety-contact SMS and caregiver alerts with timestamps (shows the system working without real SMS).
```
**Done when:** the crisis P0 from M11 shows a 60-minute countdown at 14:00 and a "callback at 08:00" note at 23:00; publishing a verdict notifies the user in M15.

---

## M24 ★ Impact console (case §7: metrics chain, loops, partner)

**Attach:** Stitch S35.
```
Follow guidelines.md. Build #/team/impact with tabs Metrics chain, Growth loops, Safety counter-metrics, Partner (insurer), Proof plan. Banner on every tab: "Synthetic demo cohort — illustrative, not real results".
Synthetic cohort (lib/metrics, seeded random, seed 7): 240 enrolled patients across 12 Kanpur clinics in 3 monthly cohorts; Week-3 kept habit with probability 0.5; dropout 12% (counted as not improved — intention-to-treat); P(HbA1c down ≥ 0.5 | kept habit) = 0.62, | not kept = 0.22; usual-care comparator group of 120 with P = 0.17; P(renew or Maintenance | improved) = 0.72, | not improved = 0.38; hypo events, crisis callbacks, PHQ-9 ≥ 10 contacts, sharing opt-outs, proof-card shares, sibling invites, myth-card forwards generated with plausible rates. Everything shown is computed from this cohort, not typed.
Also build the doctor's #/doctor/outcomes ("Practice outcomes") from the same lib/metrics, filtered to clinic KNP-VERMA-01: North Star, leading metric, low-sugar counter-metric, comparison with the Pulse average, and patients who joined via the clinic QR this month — same synthetic banner, aggregates only.
Metrics chain: four connected tiles left to right — Leading (Week-3 kept habit vs target 45%), North Star (HbA1c down ≥ 0.5 at Day 90, ITT, vs target 35% and vs comparator), Business (Cycle-2 renewal or Maintenance within 14 days vs target 50%, split improvers vs non-improvers), Partner value. Under the arrows show the conditional rates that make the chain causal. Filters: clinic, cohort month. A grey box: "Not success metrics here: downloads, sign-ups, app opens."
Growth loops: four loop diagrams (Clinic loop: new patients per clinic per month; Proof-card loop: shares → new families; Sibling co-care: co-payers per family; Myth-card loop: forwards → sign-ups) each with one live number and its definition; cohort funnel enrolled → Week-3 → Day-90 tested → improved → renewed.
Safety counter-metrics: low-sugar events per 100 patient-months (vs first 14 days), crisis callbacks within 60 minutes (staffed hours), PHQ-9 ≥ 10 contacted within 72 h, family-sharing opt-outs within 30 days, notifications per patient per week.
Partner (insurer): de-identified table (no names), calculator with inputs (members; insurer's own annual diabetes-complication claims per member in ₹) and mean HbA1c reduction from the cohort → estimated relative risk reduction using 21% per 1-point reduction (UKPDS 35, any diabetes-related endpoint), scaled linearly, labelled "linear approximation of an observational association — illustrative". No personal data on this tab.
Proof plan: intention-to-treat, fresh baseline within 30 days, stepped-wedge rollout across clinics as comparator, pre-registered analysis, independent analysis partner, report at Day 90/180/360, claims only on measured HbA1c change.
```
**Done when:** changing the clinic filter changes every number consistently; the North Star numerator never exceeds the denominator; the banner is on every tab.

---

## M25 ★ Time Machine, scenario injector, guided demo

**Attach:** Stitch S36.
```
Follow guidelines.md. Complete the DEMO panel:
- Day slider 0–120 and chips 0, 1, 3, 10, 14, 22, 30, 45, 52, 85, 88, 90; time picker; moving backwards hides later records (never deletes them); moving forwards runs scheduled logic for each skipped day in order (missed doses, weekly check windows, S8 silence, digest, notifications) without duplicating records (idempotent).
- Inject (each creates real records through the same functions the UI uses, stamped now): Low 52 for Ramesh; Meter LO; High 320 + vomiting; Stale low (measured 7h ago); Crisis message to doctor; 3 missed tablets this week; Fasting 74 + 77 (S4); Band disconnected; Payment failed; Caregiver access request (from "Vikas, nephew"); Unknown myth; Doctor reply to Ramesh; Lab result HbA1c custom value; Patient revokes Neha.
- Role switcher (Ramesh, Amit, Neha, Dr. Verma, Dr. Saxena, Pooja, Founder) that keeps the current route type when possible.
- "Guided demo" mode: a small step card with Next/Back that walks the 4-minute journey: Launch → Ramesh day 0 consent → day 10 Jasoos result → Amit home (Encourage) → day 22 weekly check + care desk → typed crisis message → day 45 S4 in Dr. Verma's review list → inject Low 52 → Amit live alert → day 90 Dr. Verma overview + Health Map + sign prescription → Ramesh Proof Card → Amit renews → Impact console. Each step sets the role, day and route.
- Offline toggle (from M1) and "Reset demo" with confirmation. The DEMO pill can be hidden with a long-press on the wordmark.
```
**Done when:** the guided demo runs start to finish twice in a row after Reset without errors; jumping 0 → 90 → 21 leaves the store consistent (re-check #/dev/tests).

---

## M26 ★ QA hardening pass

```
Follow guidelines.md. Do a full QA pass and fix everything found, without adding features:
1. States: every list/screen has loading, empty, error and offline behaviour; no blank screens; no spinner > 1s in demo.
2. Forms: validation messages in the active language; submit disabled until valid; no double submit; Back keeps input; destructive actions confirmed.
3. Privacy leak test: for each caregiver, render every caregiver route and assert (on #/dev/tests) that no mood value, PHQ score, private note or sensitive document title appears in the DOM or in any data the screen received. Same for safety-contact views.
4. Safety test: add #/dev/tests cases for the injector scenarios in M25 (each produces the expected alert, recipients and screens).
5. Consistency: the same number (cycle day, HbA1c, sprint effect, missed weeks, counts) is identical on patient, caregiver, doctor and team screens for the same sim day.
6. Copy audit: search all strings for banned words (cure, reverse, reversal, जड़ से ख़त्म, guaranteed results, clinically proven); every "Demo"/"Synthetic"/"not for diagnosis" label present; no "you missed again"; no streak or badge language.
7. Accessibility: contrast AA, focus visible, aria-labels, 48px targets, text size Extra large doesn't break layouts at 360px, Hindi text doesn't overflow buttons.
8. Navigation: every screen reachable and has a way back; deep links survive refresh; 404 works; session lock (doctor) and logout clear state correctly.
9. Performance: lazy-load charts and the Health Map; images compressed; app usable on a throttled "slow 3G" preview.
Report the list of fixes at the end.
```
**Done when:** #/dev/tests is all green, including the new privacy-leak and injector groups.

---

## Optional prompts (only if time remains)

### M-OPT-1 Multi-device demo with Supabase
```
Follow guidelines.md. Connect Supabase so three phones can run the demo at once (patient, caregiver, doctor). Mirror the store's collections into Supabase's key-value storage per demo room (room code shown in the DEMO panel), subscribe to changes, and keep localStorage as the offline fallback. Use synthetic data only. Do not add real authentication or real patient data. Show a "Synced" / "Offline — will sync" indicator.
```

### M-OPT-2 Real image reading for synthetic demo photos
```
Follow guidelines.md. Add an optional real vision-model call for lib/ocr behind a toggle "Use live AI reading (demo images only)", using a server-side secret (never in the client). Send only the image; ask for strict JSON matching the existing types; validate; on any error or low confidence fall back to manual entry. Keep echo-confirm before saving. Log nothing except the extracted fields.
```

---

## Fix-it templates (paste when something breaks)

| Symptom | Prompt |
|---|---|
| A caregiver screen shows something it shouldn't | `Caregiver screen <route> shows <item>. All caregiver data must come from privacy.view(viewerId, patientId, category). Fix the read path and add a #/dev/tests case that fails if this ever renders again.` |
| Numbers differ between roles | `Cycle day / <metric> shows X on <screen A> and Y on <screen B> at the same sim day. Compute both from the same selector in lib/cycle (or lib/metrics) and add a test.` |
| Future data visible | `Records after the current sim day/time are visible on <screen>. Apply isVisible() to this query and add a test for day 3.` |
| Alert didn't reach someone | `Injecting <scenario> didn't notify <person>. Trace runSafety recipients against consents and dial; fix and add a test for this recipient.` |
| Make rewrote unrelated screens | `Undo changes outside <folder/route>. Only modify <files>. Keep guidelines.md rules.` |
| Layout broken at 360px / Extra large text | `At 360px with Extra large text, <screen> overflows. Make it one column, wrap Hindi text, keep primary action visible, no horizontal scroll.` |
| Hindi garbled | Fix the string directly in /content/hi.json (don't re-prompt). |
