import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
import { config, actualVisibleRoutes } from "./config.mjs";
const routes = JSON.parse(
  fs.readFileSync(new URL("./routes.json", import.meta.url), "utf8"),
);
for (const group of routes)
  assert.deepEqual(
    group.routes,
    actualVisibleRoutes(group.session.role, group.session.patientId),
    "qa/routes.json must match src/app/routes.ts",
  );
const browser = await chromium.launch({ headless: true });
let failures = 0;
try {
  for (const group of routes) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const base = process.env.PULSE_QA_URL || "http://127.0.0.1:5173";
    await page.goto(base);
    await page.waitForTimeout(400);
    await page.evaluate(
      (session) =>
        sessionStorage.setItem("pulse-session-v1", JSON.stringify(session)),
      group.session,
    );
    await page.reload();
    await page.waitForTimeout(400);
    for (const route of group.routes) {
      await page.goto(`${base}/#${route}`);
      await page.waitForTimeout(400);
      const text = await page.locator("body").innerText();
      let ok = true;
      if (/[\u0900-\u097f]/u.test(text)) {
        console.log(`Devanagari: ${route}`);
        failures++;
        ok = false;
      }
      if (/Page not found|Unable to load this view/.test(text)) {
        console.log(`FAIL route: ${route}`);
        failures++;
        ok = false;
      }
      if (errors.length) {
        console.log(`FAIL runtime ${route}: ${errors.splice(0).join("; ")}`);
        failures++;
        ok = false;
      }
      if (ok) console.log(`PASS route: ${route}`);
    }
    const icon = await context.request.get(`${base}/favicon.svg`);
    if (!icon.ok() || !(await icon.text()).includes("<svg")) {
      console.log("FAIL favicon");
      failures++;
    } else console.log("PASS favicon");
    await context.close();
  }
  console.log(`Sweep: ${failures} failures`);
  if (failures) process.exitCode = 1;
} finally {
  await browser.close();
}
