# Pulse demo-v1 — final freeze, 9 October 2026

This report supersedes earlier checkpoint reports. No features were added. The two requested product changes are paid subscriptions at ₹699 and doctor Practice Outcomes formatting. Existing safety, privacy, consent, verification and PIN-lock rules remain covered by the unchanged rule suite.

## Release gates

| Check | Result | Evidence |
|---|---|---|
| Actual visible routes synchronized before the initial sweep | Pass | `qa/routes.json`, `qa/freeze-initial-sweep.txt` |
| `pnpm typecheck` | Pass | `qa/freeze-gates.txt` |
| `pnpm test` | 107/107 pass | `qa/freeze-gates.txt` |
| `pnpm build` | Pass; rebuilt `dist/` included in release | `qa/freeze-gates.txt` |
| `pnpm qa:static` | No Devanagari outside the allowlist | `qa/freeze-gates.txt` |
| `pnpm qa` | Zero failures, including console/runtime errors, not-found routes, visible Devanagari and favicon | `qa/freeze-gates.txt` |
| Eight-step guided demo twice from Reset demo | Both pass; zero console/runtime errors | `qa/freeze-browser.txt` |
| ₹699 subscription and saved demo payments | Pass; free amount remains ₹0 | `qa/freeze-browser.txt` |
| Doctor Practice Outcomes, 1440/1000/412px | Equal-width cards, no horizontal page overflow | `qa/freeze-browser.txt`, `qa/practice-outcomes-*.png` |

The final sweep covers **37 distinct destinations across 48 route visits**. It includes all current bottom-nav/sidebar and drawer destinations, the family switcher, and all five doctor patient-profile tabs. Conditional patient drawers are covered with both Ramesh (Amit pays; prescribed Sugar Detective) and Sushma (self-payer; no prescribed experiment). Hidden or parked routes were not added to the product to satisfy an obsolete list.

QA uses an owned production preview on port **5176**, verifies the built HTML, and stops that preview after each run. One earlier attempt found port 5175 occupied; it failed safely and was rerun on 5176. This was an environment startup failure, not an application failure. The original baseline records remain unchanged.

## Guided demo actually exercised

Each run starts with **DEMO → Reset demo → Confirm**, then **Start guided demo**:

1. Ramesh Today.
2. Meter sync 52 opens safety; the very-low-sugar alert is checked.
3. Amit acknowledges the urgent alert with “I've spoken to him”.
4. Ramesh's fresh 100 recheck resolves the low alerts.
5. Dr. Verma opens Ramesh's Brief from Today.
6. Renew same is signed with PIN 246810 and delivered.
7. Ramesh confirms medicine reminders and opens the Proof Card.
8. Pooja Impact.

The guide supplies the two synthetic meter/recheck examples. Playwright performs acknowledgement, signing and reminder confirmation through the same controls used by the presenter.

## Known issues retained

- The freeze has no remaining failures in the requested executable gates. It is not a full accessibility, performance or clinical certification.
- Team Impact still uses the original exported metric-chain styling; narrow desktop metric columns remain outside the explicitly requested doctor-only formatting cleanup. No team layout changes were made.
- Default synthetic glucose history does not fill every prescribed testing slot, so testing adherence can show 0 completed slots. Existing data and calculations were retained.
- First-time onboarding remains longer than the friction target; shortening it is Phase 2.
- Different devices do not synchronize. Same-origin browser tabs share local synthetic state. Production authentication, server authorization and secure document storage are not implemented.
- Band/Health Connect, meter sync, OTP, SMS, payments, OCR and doctor verification are simulated. No real messaging, medical-device connector or payment gateway is used; uploaded document binaries are not retained.

Extended scope limitations remain in `REQUIREMENTS_AUDIT.md`. The original prompt reference is historical and its older prices are superseded by the ₹699 freeze.
