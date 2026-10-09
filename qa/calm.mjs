import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.PULSE_QA_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 412, height: 915 },
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
async function setup({
  band = false,
  time = "21:30",
  pid = "PUL-KNP-0001",
  gap = false,
} = {}) {
  await page.goto(base);
  await page.waitForTimeout(300);
  await page.evaluate(
    ({ band, time, pid, gap }) => {
      const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
      s.sim.time = time;
      s.sim.day = 90;
      const p = s.patients.find((p) => p.id === pid);
      p.bandOwned = band;
      p.consents.band = band;
      s.healthConnect[pid] = {
        connected: band,
        permissions: {
          steps: band,
          sleep: band,
          heartRate: band,
          oxygen: band,
          hydration: band,
          bloodGlucose: false,
        },
        lastSync: gap ? 90 * 1440 - 4320 : null,
        ...(gap ? { syncGapUntil: 94 * 1440 } : {}),
      };
      s.readings = s.readings.filter((r) => r.day !== 90);
      s.notifications = s.notifications.filter(
        (n) => !n.id.startsWith("BAND-STALE-"),
      );
      s.doses = s.doses.filter((d) => d.day !== 90);
      localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
      sessionStorage.setItem(
        "pulse-session-v1",
        JSON.stringify({ role: "patient", userId: pid, patientId: pid }),
      );
    },
    { band, time, pid, gap },
  );
  await page.reload();
  await page.goto(base + "/#/patient/home");
  await page.waitForTimeout(400);
}
try {
  await setup({ band: true });
  const headings = await page.locator(".calm-today h2").allTextContents();
  assert.match(headings[0], /9:30 PM.*Metformin/);
  assert.deepEqual(headings.slice(1), ["Your day", "Progress"]);
  for (const h of await page.locator(".calm-today h2").all()) {
    const box = await h.boundingBox();
    assert.ok(
      box.y + box.height < 844,
      `Above-fold card outside 412×915: ${await h.innerText()}`,
    );
  }
  const below = await page.locator(".today-more").boundingBox();
  assert.ok(below.y >= 915, "Extra Today content above fold");
  assert.equal(await page.getByLabel(/^(Steps|Sleep|Water)/).count(), 0);
  await page.screenshot({ path: "qa/patient-today-412x915.png" });
  await page.goto(base + "/#/patient/progress");
  await page.waitForTimeout(250);
  assert.deepEqual(
    await page.locator(".m-content > .m-card > h2").allTextContents(),
    ["Your sugar", "Your habits", "Your 90 days"],
  );
  await page
    .getByRole("button", { name: "See band details", exact: true })
    .click();
  assert.ok(
    await page
      .getByRole("heading", { name: "Sleep · Demo", exact: true })
      .count(),
  );
  console.log(
    "PASS calm 412×915: three primary cards above fold, extras below fold; three Progress cards; passive band detail",
  );
  await setup({ band: true, time: "07:30" });
  assert.equal(
    await page.locator('[data-next-action="test"] .keypad').count(),
    1,
  );
  const progress = await page
    .getByRole("heading", { name: "Progress", exact: true })
    .boundingBox();
  await page.screenshot({ path: "qa/patient-morning-412x915.png" });
  assert.ok(
    (await page.locator(".calm-today > .m-card").last().boundingBox()).y +
      (await page.locator(".calm-today > .m-card").last().boundingBox())
        .height <=
      (await page.locator(".m-bottom").boundingBox()).y,
    "Morning Progress teaser outside viewport",
  );
  await setup({ pid: "PUL-KNP-0002" });
  assert.equal(await page.locator("[data-band-card]").count(), 0);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Sugar Detective", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator("[data-band-card]").count(), 1);
  await page.getByRole("button", { name: "+ Log", exact: true }).click();
  await page.waitForTimeout(250);
  assert.equal(
    await page.getByRole("button", { name: "Water", exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByRole("button", { name: "Meal photo", exact: true }).count(),
    0,
  );
  await page
    .getByRole("button", { name: "Sugar reading", exact: true })
    .click();
  for (const k of ["1", "2", "8"])
    await page
      .locator(".keypad")
      .getByRole("button", { name: k, exact: true })
      .click();
  assert.equal(
    await page.getByText("Is this your reading?", { exact: true }).count(),
    0,
  );
  console.log(
    "PASS no-band path: one Settings invitation, no unprescribed experiment, no water/meal prompts, normal reading needs no ownership question",
  );
  await setup({ band: true, gap: true });
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await page.waitForTimeout(250);
  let count = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("pulse-demo-v1")).notifications.filter(
        (n) => n.id.startsWith("BAND-STALE-"),
      ).length,
  );
  assert.equal(count, 1);
  await page.reload();
  await page.waitForTimeout(300);
  count = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("pulse-demo-v1")).notifications.filter(
        (n) => n.id.startsWith("BAND-STALE-"),
      ).length,
  );
  assert.equal(count, 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS 72-hour band outage: exactly one gentle notification across reloads; zero runtime errors",
  );
} catch (e) {
  console.error("FAIL calm: " + e.stack);
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
