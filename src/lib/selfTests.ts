import * as E from "./engine";
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
  test(
    "text",
    "Hindi crisis",
    true,
    () => E.scanText("जीने का मन नहीं करता").crisis,
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
  return results;
}
