import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const base = process.env.PULSE_QA_URL || "http://127.0.0.1:5173";
const errors = [];
async function fresh(pid = "PUL-KNP-0001") {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(base);
  await page.waitForTimeout(350);
  await page.evaluate(
    (pid) =>
      sessionStorage.setItem(
        "pulse-session-v1",
        JSON.stringify({ role: "patient", userId: pid, patientId: pid }),
      ),
    pid,
  );
  await page.reload();
  await page.goto(base + "/#/patient/progress");
  await page.waitForTimeout(350);
  return { context, page };
}
async function stored(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("pulse-demo-v1")));
}
try {
  for (const pid of ["PUL-KNP-0001", "PUL-KNP-0002"]) {
    const { context, page } = await fresh(pid);
    assert.equal(await page.locator("[data-band-card]").count(), 1);
    assert.match(
      await page.locator("[data-band-card]").innerText(),
      /Connect a band \(optional\) — Pulse works fully without one/,
    );
    assert.doesNotMatch(
      await page.locator("main").innerText(),
      /glasses today|logged elsewhere|Sleep · Demo/,
    );
    await page.goto(base + "/#/patient/log/glucose");
    await page.waitForTimeout(250);
    assert.equal((await page.locator(".keypad button").count()) > 0, true);
    assert.equal(
      await page.getByLabel("Demo meter photo (simulated OCR)").count(),
      1,
    );
    await context.close();
  }
  console.log(
    "PASS no-band paths: exactly one optional card; keypad/photo available; no water prompt",
  );
  const { context, page } = await fresh();
  await page
    .getByRole("button", { name: "Connect Health Connect", exact: true })
    .click();
  const sheet = page.getByRole("dialog", {
    name: "Health Connect permissions",
  });
  assert.equal(await sheet.getByRole("checkbox").count(), 7);
  for (const box of await sheet.getByRole("checkbox").all())
    assert.equal(await box.isChecked(), false);
  await sheet.getByRole("button", { name: "Allow all", exact: true }).click();
  const consent = sheet.getByRole("checkbox", {
    name: /Optional Pulse wellness consent/,
  });
  assert.equal(await consent.isChecked(), false);
  await consent.check();
  await sheet
    .getByRole("button", { name: "Allow selected", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Sleep · Demo", exact: true })
    .waitFor();
  let s = await stored(page);
  assert.equal(s.healthConnect["PUL-KNP-0001"].connected, true);
  assert.equal(
    s.readings.some((r) => r.source === "meter-sync" && r.measuredAt != null),
    true,
  );
  assert.equal(
    s.wellness
      .filter((r) => r.imported)
      .every((r) => r.measuredAt <= s.sim.day * 1440 + 630),
    true,
  );
  assert.equal(
    await page
      .getByRole("heading", {
        name: "Hydration logged elsewhere · Demo",
        exact: true,
      })
      .count(),
    1,
  );
  for (const card of await page.locator("[data-band-card]").all())
    assert.match(
      await card.innerText(),
      /For wellness trends — not for diagnosis\./,
    );
  await page
    .getByRole("button", {
      name: "Review Health Connect permissions",
      exact: true,
    })
    .click();
  for (const name of [
    "Steps",
    "Sleep",
    "Heart rate",
    "Oxygen saturation",
    "Hydration",
    "Blood glucose",
  ])
    assert.equal(
      await sheet
        .getByRole("checkbox", { name: new RegExp("^" + name) })
        .isChecked(),
      false,
    );
  await sheet.getByRole("checkbox", { name: /^Steps/ }).check();
  await sheet
    .getByRole("button", { name: "Allow selected", exact: true })
    .click();
  await page.waitForTimeout(300);
  assert.equal(
    await page
      .getByRole("heading", {
        name: "Hydration logged elsewhere · Demo",
        exact: true,
      })
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Sleep · Demo", exact: true })
      .count(),
    0,
  );
  console.log(
    "PASS permission sheet defaults off; Allow all preserves separate consent; revoked metrics are hidden",
  );
  await page.getByRole("button", { name: "DEMO", exact: true }).click();
  await page
    .getByRole("button", { name: "Band: sync gap 3 days", exact: true })
    .click();
  await page.waitForTimeout(400);

  await page.locator(".freshness.stale").waitFor({ timeout: 3000 });
  assert.match(
    await page.locator(".freshness.stale").innerText(),
    /not synced for 3 days/,
  );
  await page
    .getByRole("button", { name: "Disconnect Health Connect", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  s = await stored(page);
  assert.equal(s.healthConnect["PUL-KNP-0001"].connected, false);
  assert.equal(
    s.wellness.some((r) => r.patientId === "PUL-KNP-0001" && r.imported),
    true,
  );
  await page
    .getByRole("button", { name: "Delete band history", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  s = await stored(page);
  assert.equal(
    s.wellness.some((r) => r.patientId === "PUL-KNP-0001"),
    false,
  );
  await context.close();
  console.log(
    "PASS stale amber freshness, disconnect with retained history, and explicit history deletion",
  );
  const low = await fresh();
  await low.page.getByRole("button", { name: "DEMO", exact: true }).click();
  await low.page
    .getByRole("button", { name: "Meter auto-sync: 52", exact: true })
    .click();
  await low.page
    .getByRole("heading", {
      name: "Your sugar is low — check again",
      exact: true,
    })
    .waitFor();
  s = await stored(low.page);
  const r = s.readings.at(-1);
  assert.equal(r.source, "meter-sync");
  assert.equal(r.rule, "S1");
  assert.equal(r.measuredAt, s.sim.day * 1440 + 630);
  await low.context.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS meter-sync 52 reaches S1 support with device timestamp; zero console/runtime errors",
  );
} catch (e) {
  console.error("FAIL Health Connect: " + e.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
}
