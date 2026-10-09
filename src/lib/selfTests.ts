import * as E from "./engine";
import * as HC from "./healthConnect";
export function selfTests() {
  const results: {
    group: string;
    name: string;
    expected: any;
    actual: any;
    pass: boolean;
  }[] = [];
  function test(group: string, name: string, expected: any, f: () => any) {
    let actual: any;
    try {
      actual = f();
    } catch (e) {
      actual = String(e);
    }
    results.push({
      group,
      name,
      expected,
      actual,
      pass: JSON.stringify(expected) === JSON.stringify(actual),
    });
  }
  const base = {
    id: "R",
    patientId: E.P,
    day: 90,
    time: "10:30",
    value: 120,
    context: "any",
  };
  test("clock", "Day 90 = 9 Oct 2026", "9 Oct 2026", () => E.date(90));
  test("safety", "52 fresh", "S1", () =>
    E.glucoseRule({ ...base, value: 52 }, []),
  );
  test("safety", "Meter LO", "S1", () =>
    E.glucoseRule({ ...base, flag: "LO" }, []),
  );
  test("safety", "64 fresh", "S2", () =>
    E.glucoseRule({ ...base, value: 64 }, []),
  );
  test("safety", "Repeat low in 24h", "S3", () =>
    E.glucoseRule({ ...base, value: 64 }, [
      { ...base, id: "OLD", time: "07:30", value: 64 },
    ]),
  );
  test("safety", "Stale 52 measured 7h ago", "S0", () =>
    E.glucoseRule(
      { ...base, value: 52, measuredAt: E.minutes(90, "03:30") },
      [],
    ),
  );
  test("safety", "High 320", "S5", () =>
    E.glucoseRule({ ...base, value: 320 }, []),
  );
  test("safety", "Two fasting readings under 80", "S4", () =>
    E.glucoseRule({ ...base, value: 76, context: "fasting" }, [
      { ...base, id: "OLD", day: 89, value: 78, context: "fasting" },
    ]),
  );
  test("safety", "Normal 120", null, () => E.glucoseRule(base, []));
  // @allow-devanagari
  test(
    "text",
    "Hindi crisis",
    true,
    () => E.scanText("जीने का मन नहीं करता").crisis,
  );
  // @end-allow-devanagari
  test(
    "text",
    "English first-person crisis",
    true,
    () => E.scanText("I don't want to live anymore").crisis,
  );
  // @allow-devanagari
  test(
    "text",
    "Female Hindi crisis",
    true,
    () => E.scanText("अब जीना नहीं चाहती").crisis,
  );
  // @end-allow-devanagari
  test(
    "text",
    "Female Hinglish crisis",
    true,
    () => E.scanText("marna chahti hoon").crisis,
  );
  test(
    "text",
    "Mosquito statement is not a crisis",
    false,
    () => E.scanText("the mosquitoes should die").crisis,
  );
  test(
    "text",
    "Hinglish cardiac",
    true,
    () => E.scanText("seene me dard ho raha hai").cardiac,
  );
  test(
    "text",
    "No crisis for ordinary heat complaint",
    false,
    () => E.scanText("aaj garmi se pareshan hoon").crisis,
  );
  test("mood", "PHQ-9 item 9 positive", "S7", () =>
    E.phqRule([0, 0, 0, 0, 0, 0, 0, 0, 1]),
  );
  test("mood", "PHQ-9 total 12", "P1", () =>
    E.phqRule([2, 2, 2, 2, 2, 2, 0, 0, 0]),
  );
  test("mood", "PHQ-2 total 2", "PHQ9", () => E.phqRule([1, 1]));
  const ev = (a: number[], b: number[]) => [
    ...a.map((v) => ({ arm: "A", before: 100, after: 100 + v })),
    ...b.map((v) => ({ arm: "B", before: 100, after: 100 + v })),
  ];
  test("sprint", "Walk effect and consistency", [31, true], () => {
    const r = E.sprintResult(ev([38, 45, 41], [70, 78, 68]));
    return [r.effect, r.consistent];
  });
  test(
    "sprint",
    "Food effect computed from data",
    18,
    () => E.sprintResult(ev([52, 58, 49], [70, 74, 69])).effect,
  );
  test(
    "sprint",
    "Insufficient A evenings",
    "need_more_evenings",
    () => E.sprintResult(ev([38, 45], [70, 78, 68])).status,
  );
  test(
    "sprint",
    "Effect below 15",
    "no_clear_difference",
    () => E.sprintResult(ev([40, 40, 40], [49, 49, 49])).status,
  );
  for (const [user, category, expected] of [
    ["CG-0001", "mood", false],
    ["CG-0001", "alerts", true],
    ["CG-0002", "medicines", false],
    ["LOCAL", "readings", false],
    ["DR-0001", "mood", false],
    ["DR-0002", "readings", false],
  ] as [string, string, boolean][])
    test("privacy", `${user} → ${category}`, expected, () =>
      E.allow(E.seed(), user, E.P, category),
    );
  test("privacy", "Sensitive upload hidden from uploader", false, () => {
    const s = E.seed();
    s.links[0].permissions.records = true;
    return E.allow(s, "CG-0001", E.P, "records", { ...base, sensitive: true });
  });
  test("privacy", "Caregiver receives no forbidden records", [], () => {
    const s = E.seed();
    return E.view(s, "CG-0001", E.P, "mood", s.moodChecks);
  });
  test("privacy", "Revocation takes immediate effect", false, () => {
    const s = E.seed();
    s.links[0].status = "revoked";
    return E.allow(s, "CG-0001", E.P, "alerts");
  });
  test("privacy", "Deleted patient inaccessible", false, () => {
    const s = E.seed();
    E.patient(s).deleted = true;
    return E.allow(s, "DR-0001", E.P, "readings");
  });
  test("cycle", "Guarantee excludes −0.7 change", false, () =>
    E.guaranteeEligible(-0.7, 13),
  );
  test("cycle", "Guarantee for weak change with 8 checks", true, () =>
    E.guaranteeEligible(-0.2, 8),
  );
  test("cycle", "Sushma qualifies for Maintenance", true, () =>
    E.maintenanceEligible([6.8, 6.7]),
  );
  test("cycle", "No future follow-up lab at day 3", false, () => {
    const s = E.seed();
    s.sim.day = 3;
    return E.proof(s, E.P).ready;
  });
  test(
    "cycle",
    "13 weekly checks at day 90",
    13,
    () => E.seed().weeklyChecks.filter((w) => w.patientId === E.P).length,
  );
  test("cycle", "Unverified lab excluded", 8.1, () => {
    const s = E.seed();
    s.labs.push({ ...base, id: "FAKE", value: 5, verified: false });
    return E.proof(s, E.P).latest!.value;
  });
  test("rx", "Unverified doctor blocked", true, () => {
    const s = E.seed();
    return (
      E.validateRx(
        {
          diagnosis: "T2D",
          followup: "2026-11-09",
          mode: "in-clinic",
          medicines: E.medicines.map((m) => ({ ...m, duration: 90 })),
        },
        s.doctors["DR-0002"],
        E.patient(s),
      ).length > 0
    );
  });
  test("rx", "Audio chronic follow-up needs prior in-person", true, () => {
    const s = E.seed();
    E.patient(s).inPerson = null;
    return E.validateRx(
      {
        diagnosis: "T2D",
        followup: "2026-11-09",
        mode: "audio",
        medicines: E.medicines.map((m) => ({ ...m, duration: 90 })),
      },
      s.doctors["DR-0001"],
      E.patient(s),
    ).some((e) => e.includes("in-person"));
  });
  test("myth", "Stop medicine claim", "false", () =>
    E.mythMatch("karela juice dawa band"),
  );
  test("myth", "Walk after dinner", "true", () =>
    E.mythMatch("walk after dinner"),
  );
  test("myth", "Cricket", "not_health", () => E.mythMatch("cricket score"));
  test("myth", "Unknown health claim", "unverified", () =>
    E.mythMatch("new herbal powder for glucose"),
  );
  test("injector", "Low notifies permitted caregivers", 2, () => {
    const s = E.seed();
    E.recordReading(s, { value: 52 });
    return s.notifications.filter(
      (n) => n.audience.startsWith("CG") && n.category === "alerts",
    ).length;
  });
  test("injector", "Crisis excludes caregiver recipients", 0, () => {
    const s = E.seed(),
      n = s.notifications.length;
    E.textEvent(s, "kill myself");
    return s.notifications.slice(n).filter((n) => n.audience.startsWith("CG"))
      .length;
  });
  test("injector", "Private crisis sends no alerts", 0, () => {
    const s = E.seed(),
      n = s.alerts.length;
    E.textEvent(s, "kill myself", true);
    return s.alerts.length - n;
  });
  test(
    "injector",
    "Offline low runs safety and queues SMS",
    ["S1", "queued"],
    () => {
      const s = E.seed();
      s.sim.online = false;
      const r = E.recordReading(s, { value: 52 });
      return [r.rule, s.outbound.at(-1)?.status];
    },
  );
  test("injector", "Offline contact sends on reconnect", "sent", () => {
    const s = E.seed();
    s.sim.online = false;
    E.recordReading(s, { value: 52 });
    E.sync(s);
    return s.outbound.at(-1)?.status;
  });
  test("injector", "No recheck after 20 sim-minutes escalates", true, () => {
    const s = E.seed();
    E.recordReading(s, { value: 64 });
    E.advance(s, 90, "10:51");
    return s.alerts.some((a) => a.rule === "S1");
  });
  test("injector", "Fresh normal recheck resolves low", "resolved", () => {
    const s = E.seed();
    E.recordReading(s, { value: 52 });
    s.sim.time = "10:45";
    E.recordReading(s, { value: 100 });
    return s.alerts.filter((a) => a.rule === "S1").at(-1)?.status;
  });
  test("injector", "Time advance is idempotent", true, () => {
    const s = E.seed();
    E.advance(s, 90, "23:59");
    const n = s.doses.length + s.notifications.length;
    E.advance(s, 90, "23:59");
    return n === s.doses.length + s.notifications.length;
  });
  test(
    "injector",
    "Time travel preserves records but hides future",
    true,
    () => {
      const s = E.seed();
      E.advance(s, 90, "23:59");
      const n = s.readings.length;
      E.advance(s, 21, "10:30");
      return (
        n === s.readings.length &&
        s.labs.filter((l) => l.patientId === E.P && E.visible(l, s)).length ===
          1
      );
    },
  );
  test("notify", "Quiet hours blocks proactive nudge", false, () => {
    const s = E.seed();
    s.sim.time = "23:00";
    return E.canNudge(s, E.P, "water");
  });
  test("notify", "Safety bypasses quiet hours", true, () => {
    const s = E.seed();
    s.sim.time = "23:00";
    return E.canNudge(s, E.P, "safety");
  });
  test("metrics", "Numerator cannot exceed denominator", true, () => {
    const r = E.cohort();
    return r.filter((x) => x.improved).length <= r.length;
  });
  test(
    "metrics",
    "Seeded cohort is deterministic",
    true,
    () => JSON.stringify(E.cohort()) === JSON.stringify(E.cohort()),
  );
  test("privacy", "Weekly summary has no mood feeling", false, () => {
    const s = E.seed();
    return E.view(s, "CG-0001", E.P, "summary", s.weeklyChecks).some(
      (r) => "feeling" in r,
    );
  });
  test(
    "privacy",
    "Caregiver alert projection excludes mood and clinic-only flags",
    true,
    () => {
      const s = E.seed();
      return E.view(s, "CG-0001", E.P, "alerts", s.alerts).every(
        (r) => !r.private && ["S1", "S3", "S5", "S6"].includes(r.rule),
      );
    },
  );
  test(
    "offline",
    "Remote caregiver cannot see an undelivered offline low",
    0,
    () => {
      const s = E.seed();
      s.sim.online = false;
      E.recordReading(s, { value: 52 });
      return E.view(s, "CG-0001", E.P, "alerts", s.alerts).length;
    },
  );
  test(
    "offline",
    "Reconnection makes the low available to caregiver",
    1,
    () => {
      const s = E.seed();
      s.sim.online = false;
      E.recordReading(s, { value: 52 });
      E.sync(s);
      return E.view(s, "CG-0001", E.P, "alerts", s.alerts).length;
    },
  );
  test("privacy", "Future family approval is hidden", false, () => {
    const s = E.seed();
    s.links[0].day = 100;
    return E.allow(s, "CG-0001", E.P, "alerts");
  });
  test("rx", "Negative medicine duration is blocked", true, () => {
    const s = E.seed();
    return (
      E.validateRx(
        {
          diagnosis: "T2D",
          followup: "2026-11-09",
          mode: "in-clinic",
          medicines: [{ ...E.medicines[0], duration: -1 }],
        },
        s.doctors["DR-0001"],
        E.patient(s),
      ).length > 0
    );
  });
  test("sprint", "Missed plan extends by at most two evenings", 2, () => {
    const s = E.seed();
    s.sprints.push({
      id: "NEW",
      patientId: E.P,
      day: 90,
      time: "10:00",
      start: 90,
      status: "active",
      evenings: [],
      extensions: 0,
    });
    E.advance(s, 100, "10:30");
    return s.sprints.at(-1)!.extensions;
  });
  test("metrics", "All clinics exist in each monthly cohort", true, () =>
    [1, 2, 3].every(
      (month) =>
        new Set(
          E.cohort()
            .filter((r) => r.month === month)
            .map((r) => r.clinic),
        ).size === 12,
    ),
  );
  test(
    "migration",
    "Version 3 preserves safety, consent and habit calculations",
    true,
    () => {
      const legacy: any = E.seed();
      legacy.version = 3;
      legacy.session.lang = "hi";
      const habits = [
        "\u0930\u093e\u0924 \u0915\u0947 \u0916\u093e\u0928\u0947 \u0915\u0947 \u092c\u093e\u0926 10 \u092e\u093f\u0928\u091f \u091f\u0939\u0932\u0928\u093e",
        "\u092a\u0939\u0932\u0947 \u0938\u092c\u094d\u091c\u093c\u0940-\u0926\u093e\u0932, \u092b\u093f\u0930 \u0930\u094b\u091f\u0940",
        "\u090f\u0915 \u0930\u094b\u091f\u0940 \u0915\u092e, \u090f\u0915 \u0915\u091f\u094b\u0930\u0940 \u0926\u093e\u0932 \u091c\u093c\u094d\u092f\u093e\u0926\u093e",
        "\u0930\u093e\u0924 \u0915\u093e \u0916\u093e\u0928\u093e 8:30 \u0938\u0947 \u092a\u0939\u0932\u0947",
      ];
      for (const [i, row] of legacy.sprints.entries()) {
        row.habit = habits[i];
        delete row.habitId;
      }
      for (const row of legacy.patients) {
        row.habit = row.habitId ? habits[0] : "";
        delete row.habitId;
      }
      const before = JSON.stringify({
        alerts: legacy.alerts,
        links: legacy.links,
        consents: legacy.patients.map((p: any) => p.consents),
      });
      const migrated = E.migrateState(legacy);
      return (
        migrated.version === 4 &&
        !("lang" in migrated.session) &&
        migrated.sprints[0].habitId === "walk_after_dinner" &&
        migrated.sprints[1].habitId === "veg_dal_first" &&
        E.patient(migrated).habitId === "walk_after_dinner" &&
        E.sprintResult(migrated.sprints[0].evenings).effect === 31 &&
        before ===
          JSON.stringify({
            alerts: migrated.alerts,
            links: migrated.links,
            consents: migrated.patients.map((p) => p.consents),
          }) &&
        legacy.version === 3
      );
    },
  );
  test(
    "migration",
    "All four medicine instructions migrate, including drafts",
    ["After food", "Before food", "Morning, empty stomach", "At bedtime"],
    () => {
      const legacy: any = E.seed();
      legacy.version = 3;
      legacy.rxDraft = {
        medicines: [
          "\u0916\u093e\u0928\u0947 \u0915\u0947 \u092c\u093e\u0926",
          "\u0916\u093e\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947",
          "\u0938\u0941\u092c\u0939 \u0916\u093e\u0932\u0940 \u092a\u0947\u091f",
          "\u0930\u093e\u0924 \u0915\u094b \u0938\u094b\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947",
        ].map((instruction) => ({ instruction })),
      };
      return E.migrateState(legacy).rxDraft.medicines.map(
        (m: any) => m.instruction,
      );
    },
  );
  test("migration", "Version 4 migration is idempotent", true, () => {
    const s = E.seed();
    return (
      JSON.stringify(E.migrateState(E.migrateState(s))) === JSON.stringify(s)
    );
  });
  test(
    "migration",
    "Unsupported save version reseeds",
    4,
    () => E.migrateState({ version: 2 }).version,
  );
  test(
    "session",
    "Legacy tab login keeps role while dropping language",
    { role: "caregiver", userId: "CG-0001", patientId: E.P },
    () =>
      E.sessionFromStorage({
        role: "caregiver",
        userId: "CG-0001",
        patientId: E.P,
        lang: "hi",
      }),
  );
  test(
    "migration",
    "Unlisted legacy text stays available in export but is not displayed",
    true,
    () => {
      const old: any = E.seed();
      old.version = 3;
      const text =
        "\u0906\u091c \u0905\u091a\u094d\u091b\u093e \u0932\u0917 \u0930\u0939\u093e \u0939\u0948";
      old.messages[0].text = text;
      old.notes.push({
        id: "PRIVATE-OLD",
        patientId: E.P,
        day: 90,
        time: "10:30",
        text,
        private: true,
        owner: E.P,
      });
      const result = E.migrateState(old);
      return (
        !/[\u0900-\u097f]/u.test(result.messages[0].text) &&
        result.messages[0]._legacyText.text === text &&
        result.notes.at(-1)!._legacyText.text === text &&
        E.view(result, "CG-0001", E.P, "privateNotes", result.notes).length ===
          0 &&
        JSON.stringify(E.migrateState(result)) === JSON.stringify(result) &&
        old.messages[0].text === text
      );
    },
  );
  test(
    "migration",
    "Archived symptoms still trigger the original low-sugar rule",
    "S1",
    () => {
      const old: any = E.seed();
      old.version = 3;
      old.readings.push({
        ...base,
        value: 64,
        symptoms: "\u091a\u0915\u094d\u0915\u0930",
        measuredAt: E.minutes(90, "10:30"),
      });
      const migrated = E.migrateState(old);
      return E.glucoseRule(migrated.readings.at(-1)!, []);
    },
  );
  test(
    "migration",
    "Existing version 4 saves also normalize unknown old text",
    true,
    () => {
      const s = E.seed();
      s.messages[0].text = "\u0906\u091c";
      const result = E.migrateState(s);
      return (
        result.messages[0].text.includes("English review") &&
        result.messages[0]._legacyText.text === s.messages[0].text
      );
    },
  );
  test(
    "migration",
    "Unknown prescription instructions require review rather than an invented translation",
    true,
    () => {
      const old: any = E.seed();
      old.version = 3;
      old.prescriptions[0].medicines[0].instruction =
        "\u0905\u091c\u094d\u091e\u093e\u0924 \u0928\u093f\u0930\u094d\u0926\u0947\u0936";
      const result = E.migrateState(old);
      const m = result.prescriptions[0].medicines[0];
      return (
        m.instruction.startsWith("Instruction needs clinician review") &&
        m._legacyText.instruction ===
          old.prescriptions[0].medicines[0].instruction
      );
    },
  );

  test("Health Connect", "Permission sheet defaults all off", true, () =>
    Object.values(HC.connect()).every((v) => v === false),
  );
  test(
    "Health Connect",
    "Extreme band SpO2 and HR never create alerts",
    0,
    () => {
      const s = E.seed();
      const before = s.alerts.length;
      HC.recordWellness(s, {
        ...E.seedWellness(E.P)[0],
        spo2Min: 82,
        restingHr: 140,
        imported: true,
      });
      return s.alerts.length - before;
    },
  );
  test("Health Connect", "Meter-sync 52 creates S1", "S1", () => {
    const s = E.seed();
    s.healthConnect[E.P] = {
      connected: true,
      permissions: { ...HC.emptyPermissions(), bloodGlucose: true },
      lastSync: null,
    };
    return HC.ingestMeter(s, {
      id: "TEST-METER-LOW",
      value: 52,
      measuredAt: E.now(s),
    })?.rule;
  });
  test(
    "Health Connect",
    "Stale meter-sync uses device time and follows S0",
    "S0",
    () => {
      const s = E.seed();
      s.healthConnect[E.P] = {
        connected: true,
        permissions: { ...HC.emptyPermissions(), bloodGlucose: true },
        lastSync: null,
      };
      return HC.ingestMeter(s, {
        id: "TEST-METER-OLD",
        value: 52,
        measuredAt: E.now(s) - 420,
      })?.rule;
    },
  );
  test(
    "Health Connect",
    "Denied glucose and disconnected devices cannot ingest",
    true,
    () => {
      const s = E.seed();
      const n = s.readings.length;
      HC.connect(s, HC.emptyPermissions());
      HC.ingestMeter(s, { id: "DENIED", value: 52, measuredAt: E.now(s) });
      HC.disconnect(s);
      HC.ingestMeter(s, { id: "STOPPED", value: 52, measuredAt: E.now(s) });
      return s.readings.length === n;
    },
  );
  test(
    "Health Connect",
    "Ramesh has 90 varied synthetic days, Sushma none",
    true,
    () => {
      const s = E.seed(),
        w = s.wellness;
      return (
        w.length === 90 &&
        !w.some((r) => r.patientId === "PUL-KNP-0002") &&
        w.filter((r) => (r.sleepMinutes ?? 999) < 300).length === 5
      );
    },
  );
  test(
    "Health Connect",
    "Sync imports only elapsed days and leaves three-day gap",
    true,
    () => {
      const s = E.seed();
      s.sim.day = 60;
      E.patient(s).consents.band = true;
      HC.connect(s, { ...HC.emptyPermissions(), steps: true, sleep: true });
      return HC.wellness(s).every(
        (r) => r.measuredAt <= E.now(s) && ![59, 60, 61].includes(r.day),
      );
    },
  );
  test(
    "Health Connect",
    "Repeated sync does not duplicate meter readings",
    true,
    () => {
      const s = E.seed();
      HC.connect(s, { ...HC.emptyPermissions(), bloodGlucose: true });
      const n = s.readings.length;
      HC.sync(s);
      HC.sync(s);
      return s.readings.length === n;
    },
  );
  test(
    "Health Connect",
    "Disconnect stops importing; delete removes wellness history",
    true,
    () => {
      const s = E.seed();
      E.patient(s).consents.band = true;
      HC.connect(s, { ...HC.emptyPermissions(), steps: true });
      HC.disconnect(s, true);
      HC.sync(s);
      return (
        !s.healthConnect[E.P].connected &&
        !s.wellness.some((r) => r.patientId === E.P)
      );
    },
  );
  test(
    "Health Connect",
    "Wellness consent remains off when sensor permissions are granted",
    true,
    () => {
      const s = E.seed();
      HC.connect(s, { ...HC.emptyPermissions(), steps: true });
      return !E.patient(s).consents.band && HC.wellness(s).length === 0;
    },
  );
  test("Health Connect", "Freshness becomes amber at 72 hours", true, () => {
    const s = E.seed();
    return (
      HC.freshness(s, E.now(s) - 4320).stale &&
      !HC.freshness(s, E.now(s) - 4319).stale
    );
  });
  test(
    "Health Connect",
    "Denied hydration and HR stay absent from imported data",
    true,
    () => {
      const s = E.seed();
      E.patient(s).consents.band = true;
      HC.connect(s, { ...HC.emptyPermissions(), steps: true });
      return HC.wellness(s).every(
        (r) =>
          r.hydrationMl === null &&
          r.restingHr === null &&
          r.sleepMinutes === null,
      );
    },
  );
  test(
    "Health Connect",
    "Reconnecting after deletion imports permitted synthetic history",
    true,
    () => {
      const s = E.seed();
      E.patient(s).consents.band = true;
      HC.connect(s, { ...HC.emptyPermissions(), steps: true });
      HC.disconnect(s, true);
      HC.connect(s, { ...HC.emptyPermissions(), sleep: true });
      return (
        HC.wellness(s).length > 0 &&
        HC.wellness(s).every((r) => r.steps === null && r.sleepMinutes !== null)
      );
    },
  );
  test(
    "features",
    "Only Ramesh has the seeded prescribed experiment",
    true,
    () => {
      const s = E.seed();
      return (
        E.patient(s, E.P).sugarDetectivePrescribed === true &&
        !E.patient(s, "PUL-KNP-0002").sugarDetectivePrescribed
      );
    },
  );
  return results;
}
