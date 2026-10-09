import { chromium } from "playwright";
import assert from "node:assert/strict";
import { config } from "./config.mjs";
const base = process.env.PULSE_QA_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const errors = [];
async function fresh(role, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(base);
  await page.waitForTimeout(350);
  if (role) {
    await page.evaluate(
      (role) =>
        sessionStorage.setItem(
          "pulse-session-v1",
          JSON.stringify({
            role,
            userId: {
              patient: "PUL-KNP-0001",
              caregiver: "CG-0001",
              doctor: "DR-0001",
              team: "TEAM",
            }[role],
            patientId: "PUL-KNP-0001",
          }),
        ),
      role,
    );
    await page.reload();
    await page.waitForTimeout(350);
  }
  return { context, page };
}
async function route(page, path) {
  await page.goto(`${base}/#${path}`);
  await page.waitForTimeout(350);
  assert.equal(new URL(page.url()).hash, `#${config.resolveRoute(path)}`);
  assert.doesNotMatch(
    await page.locator("body").innerText(),
    /Page not found|[\u0900-\u097f]/u,
  );
}
try {
  let count = 0;
  for (const [role, settings] of Object.entries(config.ROUTES)) {
    const { context, page } = await fresh(role);
    for (const old of Object.keys(settings.redirects)) {
      await route(page, `/${role}/${old}`);
      count++;
    }
    if (role === "caregiver") {
      await route(page, "/caregiver/choose");
      await page
        .getByRole("heading", { name: "Switch family member" })
        .waitFor();
      await route(page, "/caregiver/notes");
      await page
        .getByRole("button", { name: "Add a report", exact: true })
        .click();
      assert.equal(await page.locator("input[type=file]").count(), 1);
    }
    if (role === "patient") {
      await route(page, "/patient/family");
      assert.match(await page.locator("main").innerText(), /Download my data/);
      await route(page, "/patient/doctor");
      assert.deepEqual(await page.getByRole("tab").allTextContents(), [
        "Messages",
        "Appointments",
        "Tests",
      ]);
      for (const name of ["Appointments", "Tests", "Messages"])
        await page.getByRole("tab", { name, exact: true }).click();
      await route(page, "/patient/progress");
      assert.match(await page.locator("main").innerText(), /Proof/);
      assert.equal(
        await page
          .getByRole("button", { name: "Pay / renew in demo", exact: true })
          .count(),
        0,
      );
      assert.equal(await page.locator(".m-bottom button").count(), 4);
      assert.equal(
        await page.getByRole("button", { name: "+ Log", exact: true }).count(),
        1,
      );
    }
    if (role === "doctor") {
      for (const old of ["reports", "tests", "notes", "mood"]) {
        await route(page, `/doctor/patient/PUL-KNP-0001/${old}`);
        count++;
      }
      await route(page, "/doctor/patient/PUL-KNP-0001/overview");
      assert.deepEqual(
        await page
          .locator(".m-tabs")
          .first()
          .locator("button")
          .allTextContents(),
        config.PROFILE_TABS.map((t) => t.label),
      );
      assert.equal(
        await page
          .getByText("Mood (shared by patient)", { exact: true })
          .count(),
        0,
      );
      await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
        s.patients.find((p) => p.id === "PUL-KNP-0001").consents.doctorMood =
          true;
        localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
      });
      await page.reload();
      await page
        .getByText("Mood (shared by patient)", { exact: true })
        .waitFor();
      await route(page, "/doctor/patient/PUL-KNP-0001/records");
      assert.equal(
        await page
          .getByText("Mood (shared by patient)", { exact: true })
          .count(),
        0,
      );
      assert.equal(await page.locator(".m-sidebar").isVisible(), false);
      assert.equal(await page.locator(".doctor-bottom").isVisible(), true);
      await page.setViewportSize({ width: 1000, height: 800 });
      assert.equal(await page.locator(".m-sidebar").isVisible(), true);
      assert.equal(await page.locator(".doctor-bottom").isVisible(), false);
    }
    if (role === "team") {
      await page.setViewportSize({ width: 1000, height: 800 });
      await route(page, "/team/desk");
      assert.equal(await page.getByRole("tab").count(), 0);
      assert.equal(
        await page
          .locator(".m-sidebar")
          .getByRole("button", { name: "Care desk", exact: true })
          .count(),
        1,
      );
    }
    await context.close();
  }
  console.log(
    `PASS ${count} legacy redirects, merged screens, doctor mood consent and responsive navigation`,
  );
  for (const [label, target] of Object.entries(config.SCENARIOS)) {
    const { context, page } = await fresh();
    await page.getByRole("button", { name: "DEMO", exact: true }).click();
    assert.equal(
      await page.locator(".demo-drawer .day-chips button").count(),
      8,
    );
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(400);
    assert.equal(new URL(page.url()).hash, `#/${target.role}/${target.path}`);
    assert.doesNotMatch(
      await page.locator("body").innerText(),
      /[\u0900-\u097f]/u,
    );
    const session = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("pulse-session-v1")),
    );
    assert.equal(session.userId, target.userId);
    await context.close();
  }
  console.log(
    `PASS all ${Object.keys(config.SCENARIOS).length} scenarios switch identity and open their destination`,
  );
  const { context, page } = await fresh();
  await page.getByRole("button", { name: "DEMO", exact: true }).click();
  await page
    .getByRole("button", { name: "Start guided demo", exact: true })
    .click();
  for (let i = 0; i < config.GUIDE.length; i++) {
    const [label, role, path] = config.GUIDE[i];
    await page
      .locator(".guide b")
      .filter({ hasText: `${i + 1}/${config.GUIDE.length} · ${label}` })
      .waitFor();
    await page.waitForTimeout(350);
    assert.equal(new URL(page.url()).hash, `#/${role}/${path}`);
    assert.doesNotMatch(
      await page.locator("body").innerText(),
      /Page not found|[\u0900-\u097f]/u,
    );
    if (i === 2)
      await page
        .getByRole("button", { name: "I've spoken to him", exact: true })
        .click();
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
    if (i < config.GUIDE.length - 1)
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
  await context.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS guided demo: 8/8 canonical steps; zero console or runtime errors",
  );
} catch (error) {
  console.error(`FAIL IA: ${error.stack}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
