# Pulse friction budget

Every change must respect these budgets while preserving safety, privacy, consent and doctor verification.

- Patient: ≤ 3 taps on a normal day, no mandatory typing, no daily questionnaire, at most one notification per medicine slot.
- Caregiver: 0 required actions; opens only for an urgent alert or the weekly digest.
- Doctor: ≤ 90 seconds per review and ≤ 3 taps to renew (PIN entry measured separately).
- Care team: queue only.

## Data facts

- Bands don't measure water. Hydration comes only from Health Connect hydration records that the user logs elsewhere.
- Band metrics are wellness-grade and never trigger alerts. Safety runs on glucose readings and typed or tapped symptoms.
- In this web prototype all band and Health Connect data is simulated and labelled **Demo**.

## Regression journeys

Count every click/tap, including navigation and each number key. Count typed fields separately; PIN entry is the sole explicit exception in the renewal budget. Fixture setup and login are excluded, not silently counted as zero-cost product actions.

- From Today or a medicine notification: mark the 9:30 PM slot taken in ≤ 2 taps.
- From the prescribed fasting-reading entry point: manual entry in ≤ 4 taps, including 1, 2, 8 and Save, with no typed fields. Automatic meter sync requires 0 user taps.
- After caregiver login from Launch: status is visible with 0 further taps.
- From doctor Today: renew Ramesh's prescription in ≤ 3 taps plus PIN.

`qa/friction-baseline.txt` is the initial before record. Friction gates are expected to fail until later F3–F7 workflow iterations; do not weaken thresholds or hide setup clicks to make them pass.
