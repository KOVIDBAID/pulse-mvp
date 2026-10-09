import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const base = process.env.PULSE_QA_URL || "http://127.0.0.1:5173";
let failures = 0;
async function journey(name, role, start, budget, action) {
  const context = await browser.newContext();
  const page = await context.newPage();
  let clicks = 0,
    typedFields = 0,
    pinFields = 0;
  const meter = {
    click: async (l) => {
      await l.click({ timeout: 2500 });
      clicks++;
    },
    fill: async (l, v, pin = false) => {
      await l.fill(v, { timeout: 2500 });
      pin ? pinFields++ : typedFields++;
    },
  };
  try {
    await page.goto(base);
    await page.waitForTimeout(350);
    await page.evaluate((role) => {
      sessionStorage.setItem(
        "pulse-session-v1",
        JSON.stringify({
          role,
          userId: {
            patient: "PUL-KNP-0001",
            caregiver: "CG-0001",
            doctor: "DR-0001",
          }[role],
          patientId: "PUL-KNP-0001",
        }),
      );
      const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
      s.sim.time = "21:30";
      localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
    }, role);
    if (name.startsWith("prescribed fasting"))
      await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
        s.sim.time = "07:30";
        s.sim.day = 90;
        s.readings = s.readings.filter((r) => r.day !== 90);
        localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
      });
    if (name === "automatic meter reading")
      await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
        s.healthConnect = {
          ...(s.healthConnect || {}),
          ["PUL-KNP-0001"]: {
            connected: true,
            permissions: {
              steps: false,
              sleep: false,
              heartRate: false,
              oxygen: false,
              hydration: false,
              bloodGlucose: true,
            },
            lastSync: null,
          },
        };
        localStorage.setItem("pulse-demo-v1", JSON.stringify(s));
      });
    await page.reload();
    await page.goto(base + "/#" + start);
    await page.waitForTimeout(350);
    await action(page, meter);
    if (clicks > budget || typedFields > 0)
      throw new Error(`budget ${budget} taps / 0 typed fields exceeded`);
    console.log(
      `PASS ${name}: ${clicks} taps, ${typedFields} typed fields, ${pinFields} PIN fields (budget ${budget})`,
    );
  } catch (e) {
    failures++;
    console.log(
      `FAIL ${name}: ${clicks} taps, ${typedFields} typed fields, ${pinFields} PIN fields (budget ${budget}); ${e.message.split("\n")[0]}`,
    );
  } finally {
    await context.close();
  }
}
try {
  await journey(
    "9:30 PM medicine slot",
    "patient",
    "/patient/home",
    2,
    async (page, m) => {
      const card = page.locator('[data-next-action="medicine"]');
      if (!/9:30 PM/.test(await card.innerText()))
        throw new Error("9:30 PM slot not next");
      await m.click(card.getByRole("button", { name: /^Taken( all)?$/ }));
      const taken = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("pulse-demo-v1"));
        const rx = s.prescriptions
          .filter((r) => r.patientId === "PUL-KNP-0001")
          .at(-1);
        return rx.medicines
          .filter((m) => m.times.includes("21:30"))
          .every((m) =>
            s.doses.some(
              (d) =>
                d.id === `DOSE-PUL-KNP-0001-90-${m.generic}-21:30` &&
                d.status === "taken",
            ),
          );
      });
      if (!taken) throw new Error("Slot is not fully taken");
    },
  );
  await journey(
    "prescribed fasting reading by hand from due Today card",
    "patient",
    "/patient/home",
    4,
    async (page, m) => {
      await page.locator('[data-next-action="test"] .keypad').waitFor();
      for (const key of ["1", "2", "8"])
        await m.click(
          page
            .locator(".keypad")
            .getByRole("button", { name: key, exact: true }),
        );
      await m.click(
        page.getByRole("button", { name: "Save reading", exact: true }),
      );
      await page.getByText("Reading saved", { exact: true }).first().waitFor();
    },
  );
  await journey(
    "automatic meter reading",
    "patient",
    "/patient/home",
    0,
    async (page) => {
      await page.waitForTimeout(1500);
      const found = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("pulse-demo-v1")).readings.some(
          (r) =>
            r.source === "meter-sync" &&
            r.context === "fasting" &&
            r.value === 128,
        ),
      );
      if (!found)
        throw new Error(
          "No automatic fasting 128 reading; connector permissions must be set in an earlier setup workflow",
        );
    },
  );
  await journey(
    "caregiver status after launch login",
    "caregiver",
    "/caregiver/home",
    0,
    async (page) => {
      if (!/Ramesh/.test(await page.locator("main").innerText()))
        throw new Error("Status is not visible after login");
    },
  );
  await journey(
    "doctor renews Ramesh from Today",
    "doctor",
    "/doctor/home",
    3,
    async (page, m) => {
      await m.click(
        page
          .getByRole("button", { name: "New prescription", exact: true })
          .first(),
      );
      await m.fill(page.getByLabel("6-digit signing PIN"), "246810", true);
      const identity = page.getByText("I have confirmed patient identity", {
        exact: true,
      });
      if (await identity.count()) await m.click(identity);
      await m.click(
        page.getByRole("button", {
          name: "Sign & send to patient",
          exact: true,
        }),
      );
      await page
        .getByText("Signed & delivered", { exact: true })
        .waitFor({ timeout: 2500 });
    },
  );
  console.log(
    `Friction: ${failures} failing journeys (all clicks counted; PIN is the sole typing exception)`,
  );
  if (failures) process.exitCode = 1;
} finally {
  await browser.close();
}
