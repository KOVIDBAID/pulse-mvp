import { chromium } from "playwright";
import assert from "node:assert/strict";
import { config } from "./config.mjs";
const base = process.env.PULSE_QA_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 412, height: 915 },
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
async function load(role, userId, path) {
  await page.goto(base);
  await page.waitForTimeout(300);
  await page.evaluate(
    ({ role, userId }) =>
      sessionStorage.setItem(
        "pulse-session-v1",
        JSON.stringify({ role, userId, patientId: "PUL-KNP-0001" }),
      ),
    { role, userId },
  );
  await page.goto(`${base}/#${path}`);
  await page.reload();
  await page.waitForTimeout(300);
}
try {
  await load("caregiver", "CG-0001", "/caregiver/billing");
  await page.getByText("₹699", { exact: true }).waitFor();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
    s.payments.push({
      id: "FREEZE-OLD",
      patientId: "PUL-KNP-0001",
      day: 90,
      time: "10:00",
      amount: 1199,
      status: "failed",
    });
    s.payments.push({
      id: "FREEZE-FREE",
      patientId: "PUL-KNP-0001",
      day: 90,
      time: "10:00",
      amount: 0,
      status: "failed",
    });
    localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
  });
  await page.reload();
  await page.waitForTimeout(350);
  const amounts = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pulse-demo-v1"))
      .payments.filter((p) => p.id.startsWith("FREEZE-"))
      .map((p) => p.amount),
  );
  assert.deepEqual(amounts, [699, 0]);
  console.log(
    "PASS subscription: ₹699; previous synthetic price normalized; free amount retained",
  );
  await load("doctor", "DR-0001", "/doctor/outcomes");
  for (const width of [1440, 1000, 412]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(150);
    const layout = await page
      .locator(".practice-outcomes .metric-chain > .m-card")
      .evaluateAll((cards) =>
        cards.map((c) => {
          const r = c.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }),
      );
    assert.equal(layout.length, 4);
    assert.ok(layout.every((c) => c.width > 200));
    assert.ok(
      Math.max(...layout.map((c) => c.width)) -
        Math.min(...layout.map((c) => c.width)) <
        2,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.screenshot({
      path: `qa/practice-outcomes-${width}.png`,
      fullPage: true,
    });
  }
  console.log(
    "PASS Practice Outcomes: equal-width aligned cards, no page overflow at 1440/1000/412px",
  );
  await page.setViewportSize({ width: 412, height: 915 });
  for (let run = 1; run <= 2; run++) {
    await page.getByRole("button", { name: "DEMO", exact: true }).click();
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Confirm action" })
      .getByRole("button", { name: "Confirm", exact: true })
      .click();
    await page.waitForURL("**/#/");
    await page.getByRole("button", { name: "DEMO", exact: true }).click();
    await page
      .getByRole("button", { name: "Start guided demo", exact: true })
      .click();
    for (let i = 0; i < config.GUIDE.length; i++) {
      const [label, role, path] = config.GUIDE[i];
      await page
        .locator(".guide b")
        .filter({ hasText: `${i + 1}/8 · ${label}` })
        .waitFor();
      await page.waitForTimeout(300);
      assert.equal(new URL(page.url()).hash, `#/${role}/${path}`);
      assert.doesNotMatch(
        await page.locator("body").innerText(),
        /Page not found|Unable to load this view|[\u0900-\u097f]/u,
      );
      if (i === 1) {
        await page
          .getByRole("heading", {
            name: "Your sugar is low — check again",
            exact: true,
          })
          .waitFor();
        assert.equal(
          await page.evaluate(() =>
            JSON.parse(localStorage.getItem("pulse-demo-v1")).alerts.some(
              (a) => a.rule === "S1" && a.value === 52 && a.status === "open",
            ),
          ),
          true,
        );
      }
      if (i === 2)
        await page
          .getByRole("button", { name: "I've spoken to him", exact: true })
          .click();
      if (i === 3)
        assert.equal(
          await page.evaluate(() =>
            JSON.parse(localStorage.getItem("pulse-demo-v1"))
              .alerts.filter((a) => ["S1", "S2", "S3"].includes(a.rule))
              .every((a) => a.status === "resolved"),
          ),
          true,
        );
      if (i === 4) {
        await page
          .getByRole("button", { name: "Open", exact: true })
          .first()
          .click();
        await page
          .getByRole("button", { name: "Renew same", exact: true })
          .waitFor();
      }
      if (i === 5) {
        await page.getByLabel("6-digit signing PIN").fill("246810");
        await page
          .getByRole("button", { name: "Sign & send to patient", exact: true })
          .click();
        await page.getByText("Signed & delivered", { exact: true }).waitFor();
      }
      if (i === 6) {
        await page
          .getByRole("button", {
            name: "Confirm new medicine reminders",
            exact: true,
          })
          .click();
        await page
          .locator(".guide")
          .getByRole("button", { name: "Next", exact: true })
          .click();
        await page.waitForURL("**/#/patient/proof");
      }
      if (i < 7)
        await page
          .locator(".guide")
          .getByRole("button", { name: "Next", exact: true })
          .click();
    }
    assert.equal(
      await page
        .locator(".guide")
        .getByRole("button", { name: "Next", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "End guided demo", exact: true })
      .click();
    console.log(
      `PASS guided demo ${run}/2: Reset demo → all eight steps, acknowledgement, resolution, PIN renewal, reminder confirmation and Proof Card`,
    );
  }
  assert.deepEqual(errors, []);
  console.log("PASS freeze: zero console/runtime errors");
} catch (e) {
  console.error(`FAIL freeze: ${e.stack}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
