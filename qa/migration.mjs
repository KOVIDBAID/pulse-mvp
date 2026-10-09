import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pulse-legacy-qa-"));
let browser;
try {
  const moduleFile = path.join(temp, "engine.mjs");
  fs.writeFileSync(
    moduleFile,
    ts.transpileModule(
      fs.readFileSync(new URL("../src/lib/engine.ts", import.meta.url), "utf8"),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
      },
    ).outputText,
  );
  const E = await import(pathToFileURL(moduleFile));
  const old = E.seed();
  old.version = 3;
  for (const row of [...old.patients, ...old.sprints]) {
    row.habit = E.habitLabel(row.habitId);
    delete row.habitId;
  }
  const text =
    "\u0906\u091c \u0905\u091a\u094d\u091b\u093e \u0932\u0917 \u0930\u0939\u093e \u0939\u0948";
  old.messages[0].text = text;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = process.env.PULSE_QA_URL || "http://127.0.0.1:5173";
  await page.goto(base);
  await page.waitForTimeout(400);
  await page.evaluate(
    ({ old, pid }) => {
      localStorage.setItem("pulse-demo-v1", JSON.stringify(old));
      sessionStorage.setItem(
        "pulse-session-v1",
        JSON.stringify({
          role: "patient",
          userId: pid,
          patientId: pid,
          lang: "hi",
        }),
      );
    },
    { old, pid: E.P },
  );
  await page.reload();
  await page.goto(`${base}/#/patient/messages`);
  await page
    .getByText(
      "Saved text needs English review. Original retained in your data export.",
      { exact: true },
    )
    .waitFor();
  assert.doesNotMatch(
    await page.locator("body").innerText(),
    /[\u0900-\u097f]/u,
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pulse-demo-v1")),
  );
  assert.equal(saved.version, 4);
  assert.equal(saved.messages[0]._legacyText.text, text);
  await page.goto(`${base}/#/patient/family`);
  await page
    .getByRole("button", { name: "Download my data", exact: true })
    .waitFor();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download my data", exact: true })
    .click();
  const download = await pending;
  const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  assert.equal(exported.messages[0]._legacyText.text, text);
  assert.deepEqual(errors, []);
  console.log(
    "PASS legacy UI: English notice, version-3 tab login, original text in patient export, no runtime errors",
  );
} finally {
  await browser?.close();
  fs.rmSync(temp, { recursive: true, force: true });
}
