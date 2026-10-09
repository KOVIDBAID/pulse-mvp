import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.PULSE_QA_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const errors = [];
async function fresh(role, userId) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
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
  await page.reload();
  await page.waitForTimeout(300);
  return { context, page };
}
async function route(page, path) {
  await page.goto(`${base}/#${path}`);
  await page.waitForTimeout(300);
}
async function edit(page, fn) {
  await page.evaluate(fn);
  await page.reload();
  await page.waitForTimeout(300);
}
async function current(page, label) {
  await page
    .locator('[aria-current="page"]')
    .first()
    .waitFor({ state: "visible" });
  assert.equal(await page.locator('[aria-current="page"]').count(), 1);
  assert.equal(
    (await page.locator('[aria-current="page"]').innerText()).trim(),
    label,
  );
}
try {
  {
    const { context, page } = await fresh("caregiver", "CG-0001");
    await route(page, "/caregiver/home");
    await current(page, "Home");
    assert.deepEqual(await page.locator(".m-bottom button").allTextContents(), [
      "Home",
      "Updates",
      "Payments",
    ]);
    assert.match(
      await page.locator("main").innerText(),
      /Papa · (Steady|Needs attention)/,
    );
    assert.equal(
      await page
        .locator("main")
        .getByRole("button", { name: /Taken|Mark taken/ })
        .count(),
      0,
    );
    assert.doesNotMatch(
      await page.locator("main").innerText(),
      /PHQ|Private note|Low mood|Mood/,
    );
    await page.screenshot({ path: "qa/caregiver-calm-412x915.png" });
    await route(page, "/caregiver/updates");
    await current(page, "Updates");
    await page
      .getByRole("heading", { name: "This week", exact: true })
      .waitFor();
    assert.match(
      await page.locator("main").innerText(),
      /Payment due in 5 days/,
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("pulse-demo-v1"),
          ).notifications.filter((n) => n.audience === "CG-0001" && n.push)
            .length,
      ),
      0,
    );
    await edit(page, () => {
      const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
      s.links.find(
        (l) => l.viewer === "CG-0001" && l.patientId === "PUL-KNP-0001",
      ).permissions = { alerts: true };
      localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
    });
    await route(page, "/caregiver/home");
    assert.doesNotMatch(
      await page
        .locator("main .m-card")
        .filter({ has: page.getByRole("heading", { name: /Papa ·/ }) })
        .innerText(),
      /Fasting avg|walks \d|tests \d|Medicines:|doses not marked|Tablets run out/,
    );
    await context.close();
    const neha = await fresh("caregiver", "CG-0002");
    await route(neha.page, "/caregiver/home");
    assert.deepEqual(
      await neha.page.locator(".m-bottom button").allTextContents(),
      ["Home", "Updates"],
    );
    await neha.context.close();
    console.log(
      "PASS caregiver: consent-gated summaries, quiet Updates and payer-only navigation",
    );
  }
  {
    const { context, page } = await fresh("patient", "PUL-KNP-0001");
    await route(page, "/patient/home");
    await current(page, "Today");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    assert.equal(
      await page.evaluate(() =>
        document.querySelector(".m-drawer")?.contains(document.activeElement),
      ),
      true,
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".m-drawer").count(), 0);
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page.locator(".m-overlay").click({ position: { x: 10, y: 400 } });
    assert.equal(await page.locator(".m-drawer").count(), 0);
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page
      .locator(".m-drawer")
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    assert.equal(await page.locator(".m-drawer").count(), 0);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.waitForURL("**/#/patient/home");
    for (const path of [
      "home",
      "progress",
      "records",
      "doctor",
      "settings",
      "family",
      "safety",
    ]) {
      await route(page, `/patient/${path}`);
      const help = page.getByRole("button", { name: "Help", exact: true });
      assert.equal(await help.isVisible(), true);
      assert.ok((await help.boundingBox()).height >= 48);
      await help.click();
      const sheet = page.getByRole("dialog", { name: "Help now" });
      assert.equal(
        await sheet
          .getByRole("link", { name: "Call 112", exact: true })
          .getAttribute("href"),
        "tel:112",
      );
      assert.equal(
        await sheet
          .getByRole("link", {
            name: "Call Tele-MANAS 14416 (24×7, free)",
            exact: true,
          })
          .getAttribute("href"),
        "tel:14416",
      );
      assert.equal(await sheet.getByRole("link").count(), 3);
      await page.keyboard.press("Escape");
      await current(
        page,
        { progress: "Progress", records: "Records", doctor: "Doctor" }[path] ||
          "Today",
      );
    }
    await page.getByRole("button", { name: "DEMO", exact: true }).click();
    await page
      .getByRole("button", { name: "Meter auto-sync: 52", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "Your sugar is low — check again",
        exact: true,
      })
      .waitFor();
    assert.doesNotMatch(
      await page.locator("main").innerText(),
      /\b(?:S[0-8]|W3|P[012])\b|Demo notifications recorded|Unassigned/,
    );
    await page.evaluate(() =>
      sessionStorage.setItem(
        "pulse-session-v1",
        JSON.stringify({
          role: "caregiver",
          userId: "CG-0001",
          patientId: "PUL-KNP-0001",
        }),
      ),
    );
    await route(page, "/caregiver/home");
    await page.reload();
    await page.waitForTimeout(300);
    await page
      .getByRole("heading", { name: "Very low sugar · 52 mg/dL", exact: true })
      .waitFor();
    assert.equal(await page.locator("main .m-card").count(), 1);
    assert.doesNotMatch(
      await page.locator("main").innerText(),
      /Fasting avg|Medicines:|Weekly wellness|PHQ|\bS1\b/,
    );
    await page
      .getByRole("button", { name: "I've spoken to him", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("pulse-demo-v1")).alerts.find(
            (a) => a.rule === "S1",
          ).status,
      ),
      "acknowledged",
    );
    assert.equal(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("pulse-demo-v1")).notifications.some(
          (n) => n.audience === "CG-0001" && n.category === "alerts" && n.push,
        ),
      ),
      true,
    );
    await page.screenshot({ path: "qa/caregiver-urgent-412x915.png" });
    await context.close();
    console.log(
      "PASS navigation, Help links, plain alerts and urgent Home isolation",
    );
  }
  {
    const { context, page } = await fresh("doctor", "DR-0001");
    await route(page, "/doctor/home");
    await current(page, "Today");
    assert.deepEqual(
      await page.locator("main .m-card > h2").allTextContents(),
      ["Today's appointments", "Needs your review"],
    );
    assert.doesNotMatch(await page.locator(".m-top").innerText(), /Day 90/);
    await page.setViewportSize({ width: 1100, height: 915 });
    await current(page, "Today");
    await page
      .getByRole("button", { name: "Open", exact: true })
      .first()
      .click();
    await current(page, "Patients");
    assert.deepEqual(
      await page.locator(".m-tabs").first().locator("button").allTextContents(),
      ["Brief", "Charts", "Records", "Prescriptions", "Messages"],
    );
    assert.equal(
      await page.getByText("Mood (shared by patient)", { exact: true }).count(),
      0,
    );
    await page.getByRole("button", { name: "Renew same", exact: true }).click();
    assert.match(
      await page.locator(".renew-preview").innerText(),
      /Date: 9 Oct 2026/,
    );
    const pin = page.getByLabel("6-digit signing PIN"),
      send = page.getByRole("button", {
        name: "Sign & send to patient",
        exact: true,
      });
    for (let i = 0; i < 3; i++) {
      await pin.fill("000000");
      await send.click();
      await page.waitForTimeout(100);
    }
    assert.equal(await send.isDisabled(), true);
    await page.reload();
    await pin.fill("246810");
    assert.equal(await send.isDisabled(), true);
    await edit(page, () => {
      const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
      s.sim.time = "10:36";
      localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
    });
    await pin.fill("246810");
    await send.click();
    await page.getByText("Signed & delivered", { exact: true }).waitFor();
    const rx = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pulse-demo-v1")).prescriptions.at(-1),
    );
    assert.equal(rx.day, 90);
    assert.equal(rx.time, "10:36");
    assert.equal(rx.version, 2);
    assert.equal(rx.remindersConfirmed, false);
    const old = await page.evaluate(
      () => JSON.parse(localStorage.getItem("pulse-demo-v1")).prescriptions[0],
    );
    assert.deepEqual(rx.medicines, old.medicines);
    await route(page, "/doctor/notifications");
    assert.match(
      await page.locator("main").innerText(),
      /Ramesh HbA1c ready|Sushma: new unverified lab|Message reply due in 6 h/,
    );
    await edit(page, () => {
      const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
      s.alerts.push({
        id: "QA-REVIEW",
        patientId: "PUL-KNP-0001",
        day: 90,
        time: "10:30",
        rule: "S4",
        value: 77,
        status: "open",
        priority: "P2",
        delivery: "sent",
        timeline: [],
      });
      localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
    });
    await route(page, "/doctor/home");
    const review = page.locator('[data-review-id="QA-REVIEW"]');
    await review.getByRole("button", { name: "Reviewed", exact: true }).click();
    assert.equal(await review.count(), 0);
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("pulse-demo-v1")).alerts.find(
            (a) => a.id === "QA-REVIEW",
          ).reviewedBy,
      ),
      "DR-0001",
    );
    await route(page, "/doctor/patients");
    await page.getByLabel("Search name or Pulse ID").fill("Nobody123");
    await page
      .getByText("No patient matches 'Nobody123'. Did you mean Ramesh Kumar?", {
        exact: true,
      })
      .waitFor();
    await page.getByRole("button", { name: "Show", exact: true }).click();
    await page.getByRole("button", { name: /Ramesh Kumar/ }).waitFor();
    await context.close();
    console.log(
      "PASS doctor: five-tab Brief, private mood, renewal date, persistent PIN lock, unchanged medicines and logged review",
    );
  }
  {
    const { context, page } = await fresh("team", "TEAM");
    await route(page, "/team/impact");
    await current(page, "Care desk");
    await page.setViewportSize({ width: 1100, height: 915 });
    await current(page, "Care desk");
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log("PASS demo-critical: zero runtime errors");
} catch (e) {
  console.error(`FAIL demo-critical: ${e.stack}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
