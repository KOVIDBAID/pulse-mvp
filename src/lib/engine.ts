import * as DS from "./dataSources";
export const HABITS = {
  walk_after_dinner: "10-minute walk after dinner",
  veg_dal_first: "Vegetables and dal first, roti last",
  one_less_roti: "One less roti, one more bowl of dal",
  early_dinner: "Dinner before 8:30 PM",
} as const;
export type HabitId = keyof typeof HABITS;
export const habitLabel = (id: HabitId | null | undefined) =>
  id ? HABITS[id] || "" : "";
export type Role = "patient" | "caregiver" | "doctor" | "team";
export type DataSource =
  | "band"
  | "meter-sync"
  | "meter-photo"
  | "typed"
  | "lab"
  | "health-connect";
export type Row = {
  id: string;
  day: number;
  time: string;
  patientId: string;
  status?: string;
  source?: DataSource | string;
  measuredAt?: number;
  [key: string]: any;
};
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type TestSlot =
  | "fasting"
  | "before-meal"
  | "2h-after-dinner"
  | "bedtime";
export type TestingPlan = {
  schedule: { slot: TestSlot; days: Weekday[] }[];
  experiment?: {
    habitId: HabitId;
    evenings: 6;
    approvedBy: string;
    approvedOn: number;
  };
  setBy: string;
  setOn: number;
  away?: boolean;
};
export const TEST_TIMES: Record<TestSlot, string> = {
  fasting: "07:30",
  "before-meal": "19:00",
  "2h-after-dinner": "21:30",
  bedtime: "22:00",
};
export const TEST_CONTEXT: Record<TestSlot, string> = {
  fasting: "fasting",
  "before-meal": "before",
  "2h-after-dinner": "after",
  bedtime: "bedtime",
};
export const TEST_LABEL: Record<TestSlot, string> = {
  fasting: "Fasting check",
  "before-meal": "Before-meal check",
  "2h-after-dinner": "2-hour after-dinner check",
  bedtime: "Bedtime check",
};
export function starterPlan(): TestingPlan {
  return {
    schedule: [{ slot: "fasting", days: [1, 3, 5] }],
    setBy: "starter",
    setOn: 0,
  };
}
export function seededPlan(): TestingPlan {
  return {
    ...starterPlan(),
    schedule: [
      { slot: "fasting", days: [1, 3, 5] },
      { slot: "2h-after-dinner", days: [0] },
    ],
    setBy: "DR-0001",
    setOn: 0,
    experiment: {
      habitId: "walk_after_dinner",
      evenings: 6,
      approvedBy: "DR-0001",
      approvedOn: 0,
    },
  };
}
export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: string;
  start: number;
  doctorId: string;
  inPerson: number | null;
  insulin: boolean;
  deleted: boolean;
  habitId: HabitId | null;
  testingPlan: TestingPlan;
  testingPlanEffectiveAt?: number;
  testingPlanHistory?: { plan: TestingPlan; from: number; until: number }[];
  bandOwned?: boolean;
  payerId?: string;
  largeText?: boolean;
  consents: Record<string, boolean>;
  target: number;
  mobile: string;
};
export type HealthPermission =
  | "steps"
  | "sleep"
  | "heartRate"
  | "oxygen"
  | "hydration"
  | "bloodGlucose";
export type HealthPermissions = Record<HealthPermission, boolean>;
export type HealthConnection = {
  connected: boolean;
  permissions: HealthPermissions;
  lastSync: number | null;
  syncGapUntil?: number;
  devices?: { scale: boolean; bpCuff: boolean };
};
export type WellnessDay = Row & {
  source: "band";
  measuredAt: number;
  steps: number | null;
  stepsAfterDinner: number | null;
  sleepMinutes: number | null;
  restingHr: number | null;
  spo2Min: number | null;
  hydrationMl: number | null;
  lastSync: number | null;
  imported: boolean;
};
export function seedWellness(
  pid: string,
  explicitlyConnected = false,
): WellnessDay[] {
  if (pid !== P && !explicitlyConnected) return [];
  return Array.from({ length: 90 }, (_, day) => ({
    id: `HC-W-${pid}-${day}`,
    patientId: pid,
    day,
    time: "23:00",
    source: "band",
    measuredAt: minutes(day, "23:00"),
    steps: 3100 + ((day * 137) % 3600),
    activityStart: minutes(day, "19:30"),
    activityEnd: minutes(day, "19:50"),
    stepsAfterDinner:
      day >= 10 && day % 7 !== 2
        ? 1500 + ((day * 73) % 850)
        : 120 + ((day * 13) % 220),
    sleepMinutes: [8, 23, 41, 67, 81].includes(day)
      ? 255 + (day % 35)
      : 405 + ((day * 17) % 90),
    restingHr: 62 + ((day * 7) % 14),
    spo2Min: 95 + (day % 4),
    hydrationMl: day % 4 === 0 ? null : 1400 + (day % 5) * 150,
    lastSync: null,
    imported: false,
  }));
}
export type State = {
  version: number;
  sim: { day: number; time: string; online: boolean; demoMode: boolean };
  session: {
    role: Role | null;
    userId: string;
    patientId: string;
  };
  patients: Patient[];
  links: Row[];
  readings: Row[];
  labs: Row[];
  sprints: Row[];
  weeklyChecks: Row[];
  moodChecks: Row[];
  notes: Row[];
  documents: Row[];
  prescriptions: Row[];
  appointments: Row[];
  testOrders: Row[];
  messages: Row[];
  alerts: Row[];
  notifications: Row[];
  payments: Row[];
  myths: Row[];
  accessLog: Row[];
  consentLog: Row[];
  doses: Row[];
  water: Row[];
  supportTasks: Row[];
  metrics: Row[];
  walks: Row[];
  band: Row[];
  wellness: WellnessDay[];
  healthConnect: Record<string, HealthConnection>;
  waitlist: Row[];
  grievances: Row[];
  outbound: Row[];
  scheduled: string[];
  rxDraft: any;
  settings: { large: boolean; lockMinutes: number; replyHours: number };
  users: Record<string, { name: string; city: string }>;
  doctors: Record<
    string,
    {
      name: string;
      verified: boolean;
      pin: string;
      failures?: number;
      lockedUntil?: number;
      registration?: string;
      qualification?: string;
    }
  >;
};
export const P = "PUL-KNP-0001";
export const categories = [
  "summary",
  "alerts",
  "medicines",
  "tests",
  "sprint",
  "proof",
  "readings",
  "labs",
  "wellness",
  "records",
  "sharedNotes",
];
export const medicines = [
  {
    generic: "Metformin",
    strength: "500 mg",
    pattern: "1-0-1",
    instruction: "After food",
    times: ["08:30", "21:30"],
  },
  {
    generic: "Glimepiride",
    strength: "1 mg",
    pattern: "1-0-0",
    instruction: "Before food",
    times: ["08:00"],
  },
  {
    generic: "Atorvastatin",
    strength: "10 mg",
    pattern: "0-0-1",
    instruction: "At bedtime",
    times: ["22:00"],
  },
];
export const genericNames = [
  "Metformin",
  "Glimepiride",
  "Gliclazide",
  "Sitagliptin",
  "Vildagliptin",
  "Dapagliflozin",
  "Empagliflozin",
  "Pioglitazone",
  "Atorvastatin",
  "Rosuvastatin",
  "Telmisartan",
  "Amlodipine",
];
export const stamp = (s: State) => ({ day: s.sim.day, time: s.sim.time });
let counter = 0;
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${++counter}`;
export const minutes = (day: number, time: string) =>
  day * 1440 + Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const now = (s: State) => minutes(s.sim.day, s.sim.time);
export const visible = (r: Row, s: State) => minutes(r.day, r.time) <= now(s);
export const date = (day: number) =>
  new Date(Date.UTC(2026, 6, 11 + day)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
export const timeAt = (n: number) => ({
  day: Math.floor(n / 1440),
  time:
    `${Math.floor((n % 1440) / 60)}`.padStart(2, "0") +
    ":" +
    `${n % 60}`.padStart(2, "0"),
});
export const patient = (s: State, id = s.session.patientId) =>
  s.patients.find((p) => p.id === id)!;
export function safetyContact(s: State, pid = s.session.patientId) {
  return (
    (patient(s, pid) as any)?.safetyContact || {
      name: "Rajesh ji",
      phone: "9876500001",
      local: true,
    }
  );
}
export function scanText(text: string) {
  const t = text.normalize("NFC").toLowerCase().replace(/\s+/g, " ");
  // @allow-devanagari
  const crisis = [
    "आत्महत्या",
    "खुदकुशी",
    "ख़ुदकुशी",
    "मरना चाहता",
    "मरना चाहती",
    "जीने का मन नहीं",
    "जीना नहीं चाहता",
    "ज़िंदगी खत्म",
    "सब खत्म कर दूँ",
    "खुद को नुकसान",
    "khudkushi",
    "aatmhatya",
    "marna chahta",
    "jeene ka mann nahi",
    "jeene ka man nahi",
    "zindagi khatam",
    "suicide",
    "kill myself",
    "end my life",
    "want to die",
    "self harm",
    "जीना नहीं चाहती",
    "जीना नहीं चाहते",
    "मरना चाहते",
    "मर जाना चाहता",
    "मर जाना चाहती",
    "marna chahti",
    "marna chahte",
    "jeena nahi chahta",
    "jeena nahi chahti",
    "don't want to live",
    "dont want to live",
    "don't feel like living",
    "no reason to live",
    "better off dead",
    "hurt myself",
    "harm myself",
    "end it all",
  ];
  const cardiac = [
    "सीने में दर्द",
    "छाती में दर्द",
    "seene me dard",
    "seene mein dard",
    "chhati me dard",
    "chest pain",
    "arm pain",
    "jaw pain",
    "मुँह टेढ़ा",
    "बोलने में दिक्कत",
    "face drooping",
    "slurred speech",
    "one side weak",
    "one-side weak",
  ];
  return {
    crisis: crisis.some((x) => t.includes(x)),
    cardiac: cardiac.some((x) => t.includes(x)),
    hypo: [
      "चक्कर",
      "पसीना",
      "कांप",
      "बेहोश",
      "chakkar",
      "pasina",
      "kaanp",
      "behosh",
      "shaking",
      "sweating",
      "confusion",
    ].some((x) => t.includes(x)),
  };
  // @end-allow-devanagari
}
export function glucoseRule(r: Row, history: Row[]) {
  const at = minutes(r.day, r.time);
  if (at - (r.measuredAt ?? at) > 30) return "S0";
  const v = r.flag === "LO" ? 30 : r.flag === "HI" ? 601 : r.value;
  if (
    v < 70 &&
    history.some(
      (h) =>
        h.id !== r.id &&
        h.value < 70 &&
        at - minutes(h.day, h.time) >= 0 &&
        at - minutes(h.day, h.time) <= 1440,
    )
  )
    return "S3";
  if (v < 54 || (v < 70 && scanText(storedText(r, "symptoms")).hypo))
    return "S1";
  if (v < 70) return "S2";
  if (v > 300) return "S5";
  if (
    r.context === "fasting" &&
    v < 80 &&
    history.some(
      (h) =>
        h.context === "fasting" &&
        h.value < 80 &&
        h.day !== r.day &&
        r.day - h.day >= 0 &&
        r.day - h.day < 7,
    )
  )
    return "S4";
  return null;
}
export function phqRule(answers: number[]) {
  const total = answers.reduce((a, b) => a + b, 0);
  return answers.length === 2
    ? total >= 2
      ? "PHQ9"
      : null
    : answers[8] > 0 || total >= 20
      ? "S7"
      : total >= 10
        ? "P1"
        : null;
}
export function sprintResult(evenings: any[]) {
  const valid = evenings.filter(
    (e) =>
      Number.isFinite(e.before) &&
      Number.isFinite(e.after) &&
      e.valid !== false,
  );
  const a = valid.filter((e) => e.arm === "A").map((e) => e.after - e.before),
    b = valid.filter((e) => e.arm === "B").map((e) => e.after - e.before);
  if (a.length < 3 || b.length < 3)
    return { status: "need_more_evenings", a: a.length, b: b.length };
  const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
  const effect = Math.round(mean(b) - mean(a));
  return {
    status: effect >= 15 ? "result" : "no_clear_difference",
    effect,
    meanA: Math.round(mean(a)),
    meanB: Math.round(mean(b)),
    consistent: Math.max(...a) < Math.min(...b),
    morningLows: valid.filter(
      (e) => e.arm === "A" && e.fasting != null && e.fasting < 80,
    ).length,
  };
}
export function allow(
  s: State,
  userId: string,
  pid: string,
  category: string,
  record?: Row,
) {
  const p = patient(s, pid);
  if (!p || p.deleted) return false;
  if (userId === pid) return true;
  if (userId.startsWith("CG")) {
    if (
      ["mood", "privateNotes", "sensitive"].includes(category) ||
      record?.sensitive
    )
      return false;
    const l = s.links.find(
      (l) =>
        l.viewer === userId &&
        l.patientId === pid &&
        l.status === "approved" &&
        visible(l, s),
    );
    return !!l && p.consents.family && l.permissions[category] === true;
  }
  if (userId === "LOCAL") return category === "alerts";
  if (userId.startsWith("DR"))
    return (
      !!s.doctors[userId]?.verified &&
      p.doctorId === userId &&
      p.consents.doctor &&
      category !== "privateNotes" &&
      (category !== "mood" || p.consents.doctorMood) &&
      (category !== "wellness" || p.consents.band)
    );
  if (userId === "TEAM")
    return (
      category !== "privateNotes" && (category !== "mood" || p.consents.mood)
    );
  return false;
}
export function connected(s: State, user: string, pid: string) {
  const p = patient(s, pid);
  return (
    !!p &&
    !p.deleted &&
    p.consents.family &&
    s.links.some(
      (l) =>
        l.viewer === user &&
        l.patientId === pid &&
        l.status === "approved" &&
        visible(l, s),
    )
  );
}
export function view(
  s: State,
  user: string,
  pid: string,
  category: string,
  collection: Row[],
): Row[] {
  if (!allow(s, user, pid, category)) return [];
  const rows = collection.filter(
    (r) =>
      r.patientId === pid &&
      visible(r, s) &&
      (user === pid || (r.status !== "queued" && r.delivery !== "queued")) &&
      allow(s, user, pid, category, r),
  );
  if (user.startsWith("CG")) {
    if (category === "alerts")
      return rows.filter(
        (r) =>
          !r.private &&
          (["S1", "S3", "S6"].includes(r.rule) ||
            (r.rule === "S5" && r.severe)),
      );
    if (category === "summary")
      return rows.map((r) => ({
        id: r.id,
        patientId: r.patientId,
        day: r.day,
        time: r.time,
        habitDays: r.habitDays,
      }));
  }
  return rows;
}
export function readLog(s: State, user: string, pid: string, category: string) {
  if (!allow(s, user, pid, category)) return;
  const id = `ACCESS-${user}-${pid}-${category}-${s.sim.day}-${s.sim.time}`;
  if (!s.accessLog.some((r) => r.id === id))
    s.accessLog.push({
      id,
      patientId: pid,
      ...stamp(s),
      viewer: user,
      category,
    });
}
export const guaranteeEligible = (delta: number, checks: number) =>
  delta > -0.3 && checks >= 8;
export const maintenanceEligible = (values: number[], target = 7) =>
  values.length >= 2 && values.slice(-2).every((v) => v < target);
export function canNudge(s: State, pid: string, type: string, sprint = false) {
  if (type === "safety" || type === "medicine") return true;
  const h = Number(s.sim.time.slice(0, 2));
  if (h >= 22 || h < 7) return false;
  const prior = s.notifications.filter(
    (n) =>
      n.patientId === pid &&
      n.proactive &&
      visible(n, s) &&
      n.day >= (sprint ? s.sim.day : s.sim.day - 6),
  );
  return prior.length < (sprint ? 3 : 2);
}
export const RULE_LABELS: Record<string, string> = {
  S0: "Check once more",
  S8: "Follow-up check",
  S1: "Very low sugar",
  S2: "Low sugar",
  S3: "Repeat low",
  S4: "Low fasting pattern",
  S5: "Very high sugar",
  S6: "Possible heart or stroke warning",
  S7: "Crisis support",
  W3: "Week-3 support call",
  P0: "Urgent",
  P1: "Within 72 h",
  P2: "Routine",
};
export const ruleLabel = (rule: string) => RULE_LABELS[rule] || rule;
export const displayText = (text: string) =>
  text
    .replace(/\b(?:S[0-8]|W3|P[012])\b/g, ruleLabel)
    .replace("No future results are shown.", "")
    .replace("Clinic: for your review", "")
    .replace("Demo notifications recorded", "");
export function notify(
  s: State,
  pid: string,
  audience: string,
  category: string,
  title: string,
  body: string,
  id = uid("N"),
  link = "home",
) {
  if (s.notifications.some((n) => n.id === id)) return;
  const queued = !s.sim.online;
  s.notifications.push({
    id,
    patientId: pid,
    ...stamp(s),
    audience,
    category,
    title,
    body,
    read: false,
    link,
    status: queued ? "queued" : "sent",
    push: audience.startsWith("CG") ? category === "alerts" : true,
  });
}
export function alert(
  s: State,
  pid: string,
  rule: string,
  source: Row,
  privateOnly = false,
) {
  const id = `AL-${rule}-${source.id}`;
  if (s.alerts.some((a) => a.id === id) || privateOnly) return;
  const crisis = rule === "S7";
  const urgent =
    ["S1", "S3", "S6", "S7"].includes(rule) || (rule === "S5" && source.severe);
  const priority = urgent ? "P0" : rule === "P1" ? "P1" : "P2";
  const staffed = s.sim.time >= "08:00" && s.sim.time < "22:00";
  const due = urgent
    ? staffed
      ? now(s) + 60
      : Math.floor(now(s) / 1440 + 1) * 1440 + 480
    : now(s) + (rule === "P1" ? 4320 : 2880);
  const a: Row = {
    id,
    patientId: pid,
    ...stamp(s),
    rule,
    source: source.id,
    value: source.value,
    private: crisis || rule === "P1",
    delivery: s.sim.online ? "sent" : "queued",
    status: "open",
    owner: "Unassigned",
    priority,
    due,
    staffed,
    timeline: [
      {
        ...stamp(s),
        text: `${ruleLabel(rule)} · safety steps shown`,
      },
    ],
    severe: source.severe,
  };
  s.alerts.push(a);
  notify(
    s,
    pid,
    pid,
    "alerts",
    ruleLabel(rule),
    "Please open the safety card",
    `N-${id}-P`,
    "safety",
  );
  if (crisis) {
    notify(
      s,
      pid,
      "TEAM",
      "mood",
      "Private callback requested",
      `Crisis support · ${staffed ? "callback within 60 minutes" : "callback at 08:00"}`,
      `N-${id}-T`,
    );
    return;
  }
  if (["S1", "S3", "S6"].includes(rule) || (rule === "S5" && source.severe)) {
    s.outbound.push({
      id: `SMS-${id}`,
      patientId: pid,
      ...stamp(s),
      recipient: `${safetyContact(s, pid).name} (local contact)`,
      body: ruleLabel(rule),
      status: s.sim.online ? "sent" : "queued",
    });
    a.timeline.push({
      ...stamp(s),
      text: s.sim.online
        ? "Local safety contact notified (simulated SMS)"
        : "Local notification queued — device is offline",
    });
    for (const l of s.links.filter((l) => l.patientId === pid))
      if (allow(s, l.viewer, pid, "alerts"))
        notify(
          s,
          pid,
          l.viewer,
          "alerts",
          ruleLabel(rule),
          `${source.value ?? "Symptoms reported"} · call the patient or local contact`,
          `${id}-${l.viewer}`,
          "alerts",
        );
  }
  if (rule !== "S0" && rule !== "S2")
    notify(
      s,
      pid,
      "TEAM",
      rule === "P1" ? "mood" : "alerts",
      `${ruleLabel(priority)} · ${ruleLabel(rule)}`,
      "For care-team review",
      `N-${id}-T`,
    );
}
export function recordReading(s: State, input: any, pid = s.session.patientId) {
  const r: Row = {
    id: input.id || uid("R"),
    patientId: pid,
    ...stamp(s),
    context: "any",
    symptoms: "",
    source: "typed",
    measuredAt: now(s),
    ...input,
    status: s.sim.online ? "synced" : "queued",
  };
  if (s.readings.some((x) => x.id === r.id)) return r;
  s.readings.push(r);
  const history = s.readings.filter(
    (h) => h.patientId === pid && visible(h, s),
  );
  const hits = scanText(storedText(r, "symptoms"));
  const textRule = hits.cardiac ? "S6" : hits.crisis ? "S7" : null;
  const rule =
    textRule ||
    glucoseRule(
      r,
      history.filter((h) => h.id !== r.id),
    );
  r.rule = rule;
  if (rule) alert(s, pid, rule, r);
  if (r.value >= 70 && !["S0", "S5"].includes(rule || "")) {
    for (const a of s.alerts.filter(
      (a) =>
        a.patientId === pid &&
        ["S1", "S2", "S3"].includes(a.rule) &&
        a.status !== "resolved" &&
        visible(a, s),
    )) {
      a.status = "resolved";
      a.timeline.push({
        ...stamp(s),
        text: `Recheck ${r.value} mg/dL — alert resolved`,
      });
    }
  }
  return r;
}
export function textEvent(
  s: State,
  text: string,
  privateNote = false,
  pid = s.session.patientId,
) {
  const hits = scanText(text);
  if (hits.cardiac) {
    const source = { id: uid("TXT"), patientId: pid, ...stamp(s) };
    alert(s, pid, "S6", source);
    return "S6";
  }
  if (hits.crisis) {
    alert(
      s,
      pid,
      "S7",
      { id: uid("TXT"), patientId: pid, ...stamp(s) },
      privateNote,
    );
    return "S7";
  }
  return null;
}
export function weekly(s: State, input: any, pid = s.session.patientId) {
  const window = Math.floor((s.sim.day - 1) / 7);
  const id = `W-${pid}-${window}`;
  const old = s.weeklyChecks.find((r) => r.id === id);
  if (old) return old;
  const r = { id, patientId: pid, ...stamp(s), ...input, window };
  s.weeklyChecks.push(r);
  if (
    s.sim.day >= 22 &&
    s.sim.day < 29 &&
    (input.habitDays < 4 || ["low", "tired"].includes(input.feeling))
  )
    alert(s, pid, "W3", r);
  return r;
}
export function validateRx(draft: any, doctor: any, p: Patient) {
  const errors: string[] = [];
  if (!doctor?.verified) errors.push("Doctor verification required");
  if (!draft.diagnosis?.trim() || !draft.followup || !draft.medicines?.length)
    errors.push("Diagnosis, follow-up and at least one medicine are required");
  if (
    draft.medicines?.some(
      (m: any) =>
        !genericNames.includes(m.generic) ||
        !m.strength?.trim() ||
        !Number.isFinite(Number(m.duration)) ||
        Number(m.duration) < 1 ||
        Number(m.duration) > 180 ||
        !m.pattern ||
        !m.instruction,
    )
  )
    errors.push("Complete every medicine row");
  if (
    draft.testingPlan &&
    draft.testingPlan.schedule.some(
      (x: any) =>
        !(x.slot in TEST_TIMES) ||
        !x.days.length ||
        x.days.some((d: number) => d < 0 || d > 6),
    )
  )
    errors.push("Choose a valid testing slot and at least one day");
  if (draft.mode !== "in-clinic" && p.inPerson === null)
    errors.push(
      "A recorded prior in-person consultation is required for chronic follow-up medicines",
    );
  return errors;
}
// @allow-devanagari
export function mythMatch(text: string) {
  const t = text.toLowerCase();
  if (
    /(stop|band|बंद|replace|बदल).*(medicine|tablets|metformin|दवा)|(?:medicine|tablets|metformin|दवा|dawa).*(stop|band|बंद|replace)/.test(
      t,
    ) ||
    /cinnamon|karela|करेला/.test(t)
  )
    return "false";
  if (/walk|टहल|vegetable|सब्ज़ी|dal first/.test(t)) return "true";
  if (
    /honey|jaggery|गुड़|methi|fruit|fasting|insulin.*addict|sugar.free/.test(t)
  )
    return "misleading";
  if (/cricket|football|weather/.test(t)) return "not_health";
  return "unverified";
}
// @end-allow-devanagari

export function activeRx(s: State, pid: string) {
  return s.prescriptions
    .filter((r) => r.patientId === pid && visible(r, s) && r.signed)
    .sort(
      (a, b) =>
        minutes(b.day, b.time) - minutes(a.day, a.time) ||
        b.version - a.version,
    )[0];
}
export function proof(s: State, pid: string) {
  const labs = s.labs
    .filter((l) => l.patientId === pid && l.verified && visible(l, s))
    .sort((a, b) => minutes(a.day, a.time) - minutes(b.day, b.time));
  const checks = s.weeklyChecks.filter(
    (w) => w.patientId === pid && visible(w, s),
  ).length;
  const baseline = labs[0],
    latest = labs.at(-1);
  const ready =
    !!baseline &&
    !!latest &&
    latest.id !== baseline.id &&
    s.sim.day - patient(s, pid).start >= 88;
  const delta = ready
    ? Math.round((latest!.value - baseline!.value) * 10) / 10
    : 0;
  return {
    baseline,
    latest,
    ready,
    delta,
    checks,
    guarantee: ready && guaranteeEligible(delta, checks),
    maintenance: maintenanceEligible(
      labs.map((l) => l.value),
      patient(s, pid).target,
    ),
  };
}
export function planSlots(s: State, pid: string, from: number, to: number) {
  const p = patient(s, pid),
    plan = p.testingPlan || starterPlan(),
    effective = p.testingPlanEffectiveAt ?? minutes(plan.setOn, "00:00");
  const versions = [
    ...(p.testingPlanHistory || []),
    { plan, from: effective, until: Infinity },
  ];
  const rows: {
    day: number;
    time: string;
    slot: TestSlot;
    done: boolean;
    current: boolean;
  }[] = [];
  for (let d = Math.max(p.start, from); d <= to; d++)
    for (const version of versions)
      for (const item of version.plan.schedule) {
        const time = TEST_TIMES[item.slot],
          at = minutes(d, time);
        if (
          at < version.from ||
          at >= version.until ||
          !item.days.includes(((d + 6) % 7) as Weekday)
        )
          continue;
        rows.push({
          day: d,
          time,
          slot: item.slot,
          current: version.until === Infinity,
          done: s.readings.some(
            (r) =>
              r.patientId === pid &&
              Math.floor((r.measuredAt ?? minutes(r.day, r.time)) / 1440) ===
                d &&
              r.context === TEST_CONTEXT[item.slot] &&
              visible(r, s),
          ),
        });
      }
  return rows.sort((a, b) => minutes(a.day, a.time) - minutes(b.day, b.time));
}
export function nextTest(s: State, pid = s.session.patientId) {
  return planSlots(s, pid, s.sim.day, s.sim.day + 7).find(
    (r) =>
      r.current &&
      !r.done &&
      (r.day > s.sim.day || minutes(r.day, r.time) >= now(s) - 120),
  );
}
export function testingAdherence(
  s: State,
  pid = s.session.patientId,
  end = s.sim.day,
) {
  const start = end - ((end + 6) % 7); // Sunday to Saturday, elapsed prescribed slots only.
  const slots = planSlots(s, pid, start, end).filter(
    (r) => minutes(r.day, r.time) <= now(s),
  );
  return { done: slots.filter((r) => r.done).length, due: slots.length };
}
export function rebuildTestReminders(s: State, pid: string) {
  s.notifications = s.notifications.filter(
    (n) =>
      !(
        n.patientId === pid &&
        n.id.startsWith("TEST-PLAN-") &&
        minutes(n.day, n.time) >= now(s)
      ),
  );
  for (const r of planSlots(s, pid, s.sim.day, s.sim.day + 7))
    if (!r.done && minutes(r.day, r.time) >= now(s)) {
      const prev = s.sim;
      s.sim = { ...prev, day: r.day, time: r.time };
      notify(
        s,
        pid,
        pid,
        "tests",
        TEST_LABEL[r.slot],
        "Your prescribed check is due",
        `TEST-PLAN-${pid}-${r.day}-${r.slot}`,
        "home",
      );
      s.sim = prev;
    }
}
export function setTestingPlan(
  s: State,
  pid: string,
  plan: TestingPlan,
  doctorId: string,
) {
  if (!s.doctors[doctorId]?.verified)
    throw new Error("Verified doctor required");
  if (
    plan.schedule.some(
      (x) =>
        !(x.slot in TEST_TIMES) ||
        !x.days.length ||
        x.days.some((d) => d < 0 || d > 6),
    )
  )
    throw new Error("Invalid testing schedule");
  const p = patient(s, pid),
    previous = p.testingPlan;
  p.testingPlanHistory ||= [];
  p.testingPlanHistory.push({
    plan: structuredClone(previous),
    from: p.testingPlanEffectiveAt ?? minutes(previous.setOn, "00:00"),
    until: now(s),
  });
  p.testingPlanEffectiveAt = now(s);
  patient(s, pid).testingPlan = {
    ...structuredClone(plan),
    setBy: doctorId,
    setOn: s.sim.day,
    experiment: plan.experiment
      ? { ...plan.experiment, approvedBy: doctorId, approvedOn: s.sim.day }
      : undefined,
  };
  for (const n of s.notifications)
    if (n.patientId === pid && n.id.startsWith("TEST-PLAN-") && !n.read)
      n.archived = true;
  rebuildTestReminders(s, pid);
}
export function planLabel(p: Patient) {
  return p.testingPlan.schedule
    .map(
      (x) =>
        `${TEST_LABEL[x.slot]} · ${x.days.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join("/")}`,
    )
    .join("; ");
}
export function medicineSlots(
  s: State,
  pid = s.session.patientId,
  day = s.sim.day,
) {
  const rx = activeRx(
    {
      ...s,
      prescriptions: s.prescriptions.filter(
        (r) => r.remindersConfirmed !== false,
      ),
    },
    pid,
  );
  const groups = new Map<string, any[]>();
  for (const m of rx?.medicines || [])
    for (const time of m.times || patternTimes(m.pattern)) {
      if (day > rx!.day + Number(m.duration || 90)) continue;
      const row = { ...m, doseId: `DOSE-${pid}-${day}-${m.generic}-${time}` };
      groups.set(time, [...(groups.get(time) || []), row]);
    }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, medicines]) => ({
      id: `SLOT-${pid}-${day}-${time}`,
      patientId: pid,
      day,
      time,
      medicines,
      taken: medicines.every((m) =>
        s.doses.some((d) => d.id === m.doseId && d.status === "taken"),
      ),
      snoozedUntil: s.notifications.find(
        (n) => n.id === `REMIND-SLOT-${pid}-${day}-${time}`,
      )?.snoozedUntil,
    }));
}
export function takeSlot(s: State, pid: string, day: number, time: string) {
  const slot = medicineSlots(s, pid, day).find((x) => x.time === time);
  if (!slot) return;
  for (const m of slot.medicines) {
    const old = s.doses.find((d) => d.id === m.doseId);
    if (old) {
      old.status = "taken";
      old.takenAt = now(s);
    } else
      s.doses.push({
        id: m.doseId,
        patientId: pid,
        day,
        time,
        generic: m.generic,
        status: "taken",
        scheduledTime: time,
        takenAt: now(s),
      });
  }
  const n = s.notifications.find((n) => n.id === `REMIND-${slot.id}`);
  if (n) {
    n.read = true;
    n.completed = true;
  }
}
export function snoozeSlot(s: State, pid: string, day: number, time: string) {
  const id = `REMIND-SLOT-${pid}-${day}-${time}`;
  if (!s.notifications.some((n) => n.id === id))
    notify(s, pid, pid, "medicines", "Medicine reminder", time, id, "home");
  const n = s.notifications.find((n) => n.id === id)!;
  n.snoozedUntil = now(s) + 30;
  n.read = true;
}
export function stockDays(s: State, pid = s.session.patientId) {
  const rx = activeRx(s, pid);
  return rx
    ? Math.min(
        ...rx.medicines.map(
          (m: any) => rx.day + Number(m.duration || 90) - s.sim.day,
        ),
      )
    : Infinity;
}
export function advance(s: State, day: number, time: string) {
  const target = minutes(day, time);
  for (const sp of s.sprints.filter(
    (sp) => sp.status === "active" && sp.start <= day,
  )) {
    sp.plan ||= Array.from({ length: 6 }, (_, i) => ({
      day: sp.start + i,
      arm: i % 2 ? "B" : "A",
    }));
    for (const evening of [...sp.plan]) {
      if (
        evening.day < day &&
        !sp.evenings.some((e: any) => e.day === evening.day) &&
        !evening.extended &&
        (sp.extensions || 0) < 2
      ) {
        evening.extended = true;
        sp.extensions = (sp.extensions || 0) + 1;
        sp.plan.push({
          day: Math.max(...sp.plan.map((e: any) => e.day)) + 1,
          arm: evening.arm,
        });
      }
    }
  }
  for (const a of s.alerts.filter(
    (a) => a.rule === "S2" && a.status !== "resolved",
  ))
    if (
      target - minutes(a.day, a.time) >= 20 &&
      !s.alerts.some((x) => x.id === `AL-S1-${a.id}`)
    ) {
      const previous = s.sim;
      s.sim = { ...previous, ...timeAt(minutes(a.day, a.time) + 20) };
      alert(s, a.patientId, "S1", {
        id: a.id,
        patientId: a.patientId,
        ...stamp(s),
        value: a.value,
      });
      s.sim = previous;
    }
  s.sim.day = day;
  s.sim.time = time;
  for (const p of s.patients.filter((p) => !p.deleted))
    for (let d = Math.max(0, p.start); d <= day; d++) {
      const rx = activeRx(
        {
          ...s,
          prescriptions: s.prescriptions.filter(
            (r) => r.remindersConfirmed !== false,
          ),
          sim: { ...s.sim, day: d, time: d === day ? time : "23:59" },
        },
        p.id,
      );
      for (const slot of medicineSlots(
        { ...s, sim: { ...s.sim, day: d } },
        p.id,
        d,
      )) {
        const at = minutes(d, slot.time),
          id = `REMIND-${slot.id}`;
        if (at <= target && d >= day - 6 && !slot.taken) {
          const prev = s.sim;
          s.sim = { ...prev, day: d, time: slot.time };
          notify(
            s,
            p.id,
            p.id,
            "medicines",
            "Medicine reminder",
            `${slot.time} · ${slot.medicines.map((m) => m.generic + " " + m.strength).join(" + ")}`,
            id,
            "home",
          );
          s.sim = prev;
          const n = s.notifications.find((n) => n.id === id);
          if (n?.snoozedUntil && n.snoozedUntil <= target) {
            n.read = false;
            delete n.snoozedUntil;
          }
        }
        if (at + 120 <= target)
          for (const m of slot.medicines)
            if (!s.doses.some((dose) => dose.id === m.doseId))
              s.doses.push({
                id: m.doseId,
                patientId: p.id,
                day: d,
                time: slot.time,
                generic: m.generic,
                status: "missed",
              });
      }
      for (const r of planSlots(s, p.id, d, d))
        if (d >= day - 6 && !r.done && minutes(d, r.time) <= target) {
          const prev = s.sim;
          s.sim = { ...prev, day: d, time: r.time };
          notify(
            s,
            p.id,
            p.id,
            "tests",
            TEST_LABEL[r.slot],
            "Your prescribed check is due",
            `TEST-PLAN-${p.id}-${d}-${r.slot}`,
            "home",
          );
          s.sim = prev;
        }
      const key = `DIGEST-${p.id}-${d}`;
      if (
        d % 7 === 1 &&
        minutes(d, "19:00") <= target &&
        !s.scheduled.includes(key)
      ) {
        s.scheduled.push(key);
        for (const l of s.links.filter((l) => l.patientId === p.id))
          if (allow(s, l.viewer, p.id, "summary")) {
            const prev = s.sim;
            s.sim = { ...prev, day: d, time: "19:00" };
            notify(
              s,
              p.id,
              l.viewer,
              "summary",
              "Weekly digest",
              "Your family member’s permitted weekly summary is ready",
              `${key}-${l.viewer}`,
              "home",
            );
            s.sim = prev;
          }
      }
    }
  for (const p of s.patients.filter((p) => !p.deleted)) {
    if (
      day >= p.start + 22 &&
      day < p.start + 29 &&
      p.habitId === "walk_after_dinner"
    ) {
      const w = DS.week(s, p.id, p.start + 20),
        id = `PASSIVE-W3-${p.id}`;
      if (w.walks < 4 && !s.scheduled.includes(id)) {
        s.scheduled.push(id);
        s.supportTasks.push({
          id,
          patientId: p.id,
          ...stamp(s),
          type: "W3",
          status: "open",
          title: "Lighter-week support",
          reason: "Fewer than four walks in Week 3",
          habitDays: w.walks,
          source: w.source,
          owner: "Care team",
        });
      }
    }
    const activity = [...s.readings, ...s.weeklyChecks, ...s.messages].filter(
      (r) => r.patientId === p.id && visible(r, s),
    );
    const last = Math.max(p.start, ...activity.map((r) => r.day));
    if (day - last >= 10)
      alert(s, p.id, "S8", {
        id: `SILENCE-${p.id}-${last}`,
        patientId: p.id,
        ...stamp(s),
      });
  }
}
export function patternTimes(pattern: string) {
  return pattern
    .split("-")
    .flatMap((v, i) => (Number(v) > 0 ? ["08:30", "13:30", "21:30"][i] : []));
}
export function sync(s: State) {
  s.sim.online = true;
  for (const key of [
    "readings",
    "notifications",
    "outbound",
    "documents",
    "messages",
    "weeklyChecks",
    "moodChecks",
    "notes",
    "payments",
  ] as const)
    for (const r of s[key])
      if (r.status === "queued") {
        r.status = key === "readings" ? "synced" : "sent";
        r.delayed = true;
      }
  for (const a of s.alerts) {
    if (a.delivery === "queued") a.delivery = "sent";
  }
  for (const a of s.alerts.filter((a) => a.status !== "resolved"))
    if (a.timeline.some((t: any) => t.text.includes("offline")))
      a.timeline.push({
        ...stamp(s),
        text: "Queued contact notification sent after reconnection (simulated)",
      });
}
export function seed(): State {
  const s: State = {
    version: 4,
    sim: { day: 90, time: "10:30", online: true, demoMode: true },
    session: { role: null, userId: "", patientId: P },
    patients: [],
    links: [],
    readings: [],
    labs: [],
    sprints: [],
    weeklyChecks: [],
    moodChecks: [],
    notes: [],
    documents: [],
    prescriptions: [],
    appointments: [],
    testOrders: [],
    messages: [],
    alerts: [],
    notifications: [],
    payments: [],
    myths: [],
    accessLog: [],
    consentLog: [],
    doses: [],
    water: [],
    supportTasks: [],
    metrics: [],
    walks: [],
    band: [],
    wellness: seedWellness(P),
    healthConnect: {},
    waitlist: [],
    grievances: [],
    outbound: [],
    scheduled: [],
    rxDraft: null,
    settings: { large: false, lockMinutes: 15, replyHours: 48 },
    users: {
      "CG-0001": { name: "Amit", city: "Pune" },
      "CG-0002": { name: "Neha", city: "Delhi" },
    },
    doctors: {
      "DR-0001": {
        name: "Dr. Anjali Verma",
        registration: "UPMC/DEMO/48213",
        qualification: "MD (Medicine)",
        verified: true,
        pin: "246810",
      },
      "DR-0002": {
        name: "Dr. Rahul Saxena",
        registration: "UPMC/DEMO/48214",
        qualification: "MD (Medicine)",
        verified: false,
        pin: "246810",
      },
    },
  };
  let random = 42;
  const rand = () => {
    random = (random * 1664525 + 1013904223) >>> 0;
    return random / 4294967296;
  };
  for (let i = 1; i <= 46; i++) {
    const id = `PUL-KNP-${String(i).padStart(4, "0")}`;
    s.patients.push({
      id,
      name:
        i === 1
          ? "Ramesh Kumar"
          : i === 2
            ? "Sushma Kumar"
            : i === 3
              ? "Kamla Devi"
              : i === 4
                ? "Farhan Ali"
                : i === 5
                  ? "Geeta Mishra"
                  : `Demo patient ${String(i).padStart(2, "0")}`,
      age: i === 1 ? 56 : 45 + Math.floor(rand() * 24),
      sex: i % 2 ? "male" : "female",
      start: i <= 2 ? 0 : Math.floor(rand() * 89),
      doctorId: "DR-0001",
      inPerson: 0,
      insulin: false,
      deleted: false,
      testingPlan: i === 1 ? seededPlan() : starterPlan(),
      bandOwned: i === 1 ? true : false,
      payerId: i === 1 ? "CG-0001" : id,
      habitId: i === 1 ? "walk_after_dinner" : null,
      target: 7,
      mobile: i === 1 ? "9876543210" : `987654${String(i).padStart(4, "0")}`,
      consents: {
        readings: true,
        medicines: true,
        labs: true,
        sprint: true,
        mood: true,
        family: true,
        doctor: true,
        doctorMood: i === 5,
        crisisContact: true,
        band: false,
        meal: false,
        research: false,
      },
    });
    if (i > 2) {
      s.labs.push({
        id: `L-${id}`,
        patientId: id,
        day: Math.min(89, s.patients.at(-1)!.start + 2),
        time: "09:00",
        value: Math.round((7.5 + rand() * 2.3) * 10) / 10,
        verified: true,
      });
    }
  }
  for (const [viewer, pids, perms] of [
    [
      "CG-0001",
      [P, "PUL-KNP-0002"],
      ["summary", "alerts", "medicines", "tests", "sprint", "proof"],
    ],
    ["CG-0002", [P], ["summary", "alerts"]],
  ] as [string, string[], string[]][]) {
    for (const pid of pids)
      s.links.push({
        id: `LINK-${viewer}-${pid}`,
        patientId: pid,
        day: 0,
        time: "10:00",
        viewer,
        status: "approved",
        permissions: Object.fromEntries(
          categories.map((c) => [c, perms.includes(c)]),
        ),
      });
  }
  s.labs.push(
    {
      id: "BASE",
      patientId: P,
      day: 2,
      time: "08:00",
      value: 8.8,
      verified: true,
      source: "Demo Diagnostics",
    },
    {
      id: "END",
      patientId: P,
      day: 88,
      time: "08:00",
      value: 8.1,
      verified: true,
      source: "Demo Diagnostics",
    },
    {
      id: "SU-1",
      patientId: "PUL-KNP-0002",
      day: 0,
      time: "08:00",
      value: 6.8,
      verified: true,
    },
    {
      id: "SU-2",
      patientId: "PUL-KNP-0002",
      day: 88,
      time: "08:00",
      value: 6.7,
      verified: true,
    },
  );
  s.prescriptions.push({
    id: "RX-SEED",
    patientId: P,
    day: 0,
    time: "10:00",
    signed: true,
    version: 1,
    doctorId: "DR-0001",
    mode: "in-clinic",
    diagnosis: "Type 2 diabetes — synthetic demo",
    followup: date(90),
    medicines: medicines.map((m) => ({ ...m, duration: 90 })),
    source: "Confirmed paper prescription",
  });
  s.prescriptions.push({
    ...s.prescriptions[0],
    id: "RX-SUSHMA",
    patientId: "PUL-KNP-0002",
  });
  for (let i = 0; i < 13; i++) {
    const day = 1 + i * 7;
    s.sim.day = day;
    s.sim.time = "07:40";
    recordReading(
      s,
      {
        id: `FAST-${day}`,
        value: Math.round(165 - (i * 37) / 12),
        context: "fasting",
      },
      P,
    );
    s.sim.time = "19:00";
    weekly(
      s,
      {
        habitDays: day === 22 ? 3 : 5,
        missed: [22, 36, 57, 78].includes(day) ? 2 : 0,
        feeling: day === 22 ? "tired" : "okay",
      },
      P,
    );
  }
  for (const day of [43, 45]) {
    s.sim.day = day;
    s.sim.time = "07:45";
    recordReading(
      s,
      { id: `LOWPAT-${day}`, value: day === 43 ? 78 : 76, context: "fasting" },
      P,
    );
  }
  for (const [start, habitId, rises] of [
    [4, "walk_after_dinner", [38, 70, 45, 78, 41, 68]],
    [46, "veg_dal_first", [52, 70, 58, 74, 49, 69]],
  ] as [number, string, number[]][]) {
    s.sprints.push({
      id: `SPRINT-${start}`,
      patientId: P,
      day: start,
      time: "18:00",
      habitId,
      start,
      status: "complete",
      accepted: start === 4,
      evenings: rises.map((rise, i) => ({
        day: start + i,
        arm: i % 2 ? "B" : "A",
        before: [115, 128, 139, 121, 145, 133][i],
        after: [115, 128, 139, 121, 145, 133][i] + rise,
        fasting: i % 2 ? null : [92, 88, 84][Math.floor(i / 2)],
      })),
    });
  }
  s.appointments.push({
    id: "APT-1",
    patientId: P,
    day: 85,
    time: "10:00",
    slotDay: 90,
    slot: "11:30",
    mode: "in-clinic",
    status: "confirmed",
    reason: "Day-90 review",
    identity: false,
  });
  s.testOrders.push({
    id: "TEST-1",
    patientId: P,
    day: 85,
    time: "08:00",
    test: "HbA1c",
    due: 87,
    status: "Verified",
  });
  s.messages.push(
    {
      id: "M1",
      patientId: P,
      day: 89,
      time: "18:20",
      from: P,
      text: "Doctor, my report has come. What should I bring to the visit?",
    },
    {
      id: "M2",
      patientId: P,
      day: 90,
      time: "08:15",
      from: "DR-0001",
      text: "Hello Ramesh. Please bring your meter and your old prescriptions.",
    },
  );
  s.moodChecks.push(
    {
      id: "MOOD1",
      patientId: P,
      day: 14,
      time: "14:00",
      answers: [2, 1, 2, 2, 1, 2, 1, 1, 0],
      score: 12,
      instrument: "PHQ-9",
    },
    {
      id: "MOOD2",
      patientId: P,
      day: 88,
      time: "14:00",
      answers: [1, 1, 1, 1, 0, 1, 1, 0, 0],
      score: 6,
      instrument: "PHQ-9",
    },
  );
  s.myths.push({
    id: "MY1",
    patientId: P,
    day: 88,
    time: "14:20",
    claim: "Jamun seed powder replaces tablets",
    verdict: "unverified",
    status: "waiting",
  });
  s.sim = { day: 14, time: "14:00", online: true, demoMode: true };
  alert(s, P, "P1", s.moodChecks[0]);
  const moodAlert = s.alerts.at(-1)!;
  moodAlert.status = "resolved";
  moodAlert.owner = "Pooja";
  moodAlert.timeline.push({
    day: 15,
    time: "10:00",
    text: "Reached by Pooja — support logged",
  });
  s.sim = { day: 90, time: "10:30", online: true, demoMode: true };
  for (const pid of [P, "PUL-KNP-0002"])
    for (let day = 0; day <= 90; day++)
      for (const m of medicines)
        for (const t of m.times) {
          if (day === 90 && t > "10:30") continue;
          const missed =
            pid === P &&
            m.generic === "Metformin" &&
            t === "21:30" &&
            [21, 35, 56, 77].includes(day);
          s.doses.push({
            id: `DOSE-${pid}-${day}-${m.generic}-${t}`,
            patientId: pid,
            day,
            time: t,
            generic: m.generic,
            status: missed ? "missed" : "taken",
          });
        }
  for (const key of [
    "readings",
    "labs",
    "weeklyChecks",
    "messages",
    "moodChecks",
  ] as const)
    s[key].sort((a, b) => minutes(a.day, a.time) - minutes(b.day, b.time));
  s.labs.push({
    id: "LAB-SUSHMA-PENDING",
    patientId: "PUL-KNP-0002",
    day: 90,
    time: "09:15",
    value: 6.8,
    verified: false,
    source: "lab",
    provider: "Demo Diagnostics",
  });
  const updates = [
    [
      "CG-0001",
      "summary",
      "Your family's weekly summary",
      "A shared update is ready",
      "updates",
      P,
    ],
    [
      "CG-0001",
      "proof",
      "Day-90 result ready",
      "Ramesh's shared Proof Card is ready",
      "home",
      P,
    ],
    [
      "CG-0001",
      "billing",
      "Payment due in 5 days",
      "Your next care payment is due in 5 days",
      "billing",
      P,
    ],
    [
      "CG-0001",
      "medicines",
      "Medicines: on track",
      "Shared weekly medicine update",
      "updates",
      P,
    ],
    [
      "DR-0001",
      "labs",
      "Ramesh HbA1c ready",
      "Verified lab ready for your review",
      `patient/${P}/overview`,
      P,
    ],
    [
      "DR-0001",
      "labs",
      "Sushma: new unverified lab",
      "Please review the uploaded report",
      "patient/PUL-KNP-0002/records",
      "PUL-KNP-0002",
    ],
    [
      "DR-0001",
      "message",
      "Message reply due in 6 h",
      "Ramesh has a question for your review",
      `patient/${P}/messages`,
      P,
    ],
    [
      "DR-0001",
      "tests",
      "Ramesh's testing summary",
      "Testing adherence versus the prescribed plan",
      `patient/${P}/overview`,
      P,
    ],
  ];
  updates.forEach(([audience, category, title, body, link, pid], i) =>
    notify(s, pid, audience, category, title, body, `DEMO-UPDATE-${i}`, link),
  );
  return normalizeDeviceState(s);
}
export function cohort(s?: State) {
  let n = 7;
  const rand = () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
  return Array.from({ length: 240 }, (_, i) => {
    const adherenceProbability = rand(),
      fromBand = i % 4 !== 0;
    const syntheticWalks = Array.from({ length: 7 }, (_, d) => {
      const done = ((i * 13 + d * 17) % 100) / 100 < adherenceProbability;
      return fromBand
        ? { source: "band", stepsAfterDinner: done ? 1800 : 450 }
        : { source: "typed", walked: done };
    });
    const p = s?.patients[i];
    const passive = p && s ? DS.week(s, p.id, p.start + 20) : null;
    const habitDays =
      passive?.walks ??
      syntheticWalks.filter((r) =>
        r.source === "band" ? r.stepsAfterDinner! >= 1500 : r.walked,
      ).length;
    const habitSource = passive?.source ?? (fromBand ? "band" : "typed");
    const kept = habitDays >= 4,
      dropout = rand() < 0.12,
      improved = !dropout && rand() < (kept ? 0.62 : 0.22),
      renewed = rand() < (improved ? 0.72 : 0.38);
    return {
      id: i + 1,
      clinic: (i % 12) + 1,
      month: Math.floor(i / 80) + 1,
      kept,
      habitDays,
      habitSource,
      dropout,
      improved,
      renewed,
      delta: dropout ? 0 : improved ? 0.5 + rand() * 0.8 : rand() * 0.4,
      hypo: rand() < 0.08,
      shared: rand() < 0.25,
      invite: rand() < 0.16,
      forward: rand() < 0.3,
      callback: rand() < 0.97,
    };
  });
}

export function comparator() {
  let n = 7;
  return Array.from({ length: 120 }, (_, i) => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return { id: i + 1, improved: n / 4294967296 < 0.17 };
  });
}

const LEGACY_HABITS: Record<string, HabitId> = {
  "\u0930\u093e\u0924 \u0915\u0947 \u0916\u093e\u0928\u0947 \u0915\u0947 \u092c\u093e\u0926 10 \u092e\u093f\u0928\u091f \u091f\u0939\u0932\u0928\u093e":
    "walk_after_dinner",
  "\u092a\u0939\u0932\u0947 \u0938\u092c\u094d\u091c\u093c\u0940-\u0926\u093e\u0932, \u092b\u093f\u0930 \u0930\u094b\u091f\u0940":
    "veg_dal_first",
  "\u090f\u0915 \u0930\u094b\u091f\u0940 \u0915\u092e, \u090f\u0915 \u0915\u091f\u094b\u0930\u0940 \u0926\u093e\u0932 \u091c\u093c\u094d\u092f\u093e\u0926\u093e":
    "one_less_roti",
  "\u0930\u093e\u0924 \u0915\u093e \u0916\u093e\u0928\u093e 8:30 \u0938\u0947 \u092a\u0939\u0932\u0947":
    "early_dinner",
};
const LEGACY_COPY: Record<string, string> = {
  "\u0916\u093e\u0928\u0947 \u0915\u0947 \u092c\u093e\u0926": "After food",
  "\u0916\u093e\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947":
    "Before food",
  "\u0938\u0941\u092c\u0939 \u0916\u093e\u0932\u0940 \u092a\u0947\u091f":
    "Morning, empty stomach",
  "\u0930\u093e\u0924 \u0915\u094b \u0938\u094b\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947":
    "At bedtime",
  "\u0915\u094b\u0908 \u092c\u093e\u0924 \u0928\u0939\u0940\u0902 \u00b7 recorded as missed":
    "No problem \u00b7 recorded as missed",
  "\u0921\u0949\u0915\u094d\u091f\u0930 \u0938\u093e\u0939\u093f\u092c\u093e, \u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0906 \u0917\u0908 \u0939\u0948\u0964 \u092e\u0941\u0932\u093e\u0915\u093c\u093e\u0924 \u092e\u0947\u0902 \u0915\u094d\u092f\u093e \u0932\u0947\u0915\u0930 \u0906\u0928\u093e \u0939\u0948?":
    "Doctor, my report has come. What should I bring to the visit?",
  "\u0928\u092e\u0938\u094d\u0924\u0947 \u0930\u092e\u0947\u0936 \u091c\u0940\u0964 \u0915\u0943\u092a\u092f\u093e \u0905\u092a\u0928\u093e \u092e\u0940\u091f\u0930 \u0914\u0930 \u092a\u093f\u091b\u0932\u0947 \u092a\u0930\u094d\u091a\u0947 \u0938\u093e\u0925 \u0932\u0947 \u0906\u0907\u090f\u0964":
    "Hello Ramesh. Please bring your meter and your old prescriptions.",
  "\u091c\u0940\u0928\u0947 \u0915\u093e \u092e\u0928 \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u093e":
    "I don't feel like living anymore",
};
export function sessionFromStorage(value: any): State["session"] {
  const { lang: _legacyLanguage, ...session } = value || seed().session;
  return session;
}
// Preserve original saved input for rule evaluation and patient data exports.
export function storedText(row: Row, field: string): string {
  return row._legacyText?.[field] ?? row[field] ?? "";
}
const hasDevanagari = (text: string) => /[\u0900-\u097f]/u.test(text);
function englishSavedText(value: any, original: any = value): any {
  if (Array.isArray(value))
    return value.map((item, i) => englishSavedText(item, original?.[i]));
  if (value && typeof value === "object") {
    const result: any = {};
    const originals = { ...value._legacyText };
    for (const [key, item] of Object.entries(value)) {
      if (key === "_legacyText") continue;
      if (typeof item === "string" && hasDevanagari(item)) {
        originals[key] = original?.[key] ?? item;
        result[key] =
          key === "instruction"
            ? "Instruction needs clinician review. Original retained in your data export."
            : "Saved text needs English review. Original retained in your data export.";
      } else {
        if (
          Array.isArray(item) &&
          item.some((x) => typeof x === "string" && hasDevanagari(x))
        )
          originals[key] = structuredClone(original?.[key] ?? item);
        result[key] = englishSavedText(item, original?.[key]);
      }
    }
    if (Object.keys(originals).length) result._legacyText = originals;
    return result;
  }
  // Handle historical arrays of strings as well as normal record fields.
  if (typeof value === "string" && hasDevanagari(value))
    return "Saved text needs English review. Original retained in your data export.";
  return value;
}
export function migrateState(value: any): State {
  if (!value || ![3, 4].includes(value.version)) return seed();
  const result = structuredClone(value);
  result.session = sessionFromStorage(result.session);
  if (result.version === 3) {
    for (const row of [...result.patients, ...result.sprints]) {
      row.habitId =
        LEGACY_HABITS[row.habit] ||
        (Object.keys(HABITS).find(
          (id) => HABITS[id as HabitId] === row.habit,
        ) ??
          null);
      delete row.habit;
    }
    const translate = (v: any): any => {
      if (typeof v === "string") {
        let text = v;
        const copy = {
          ...LEGACY_COPY,
          ...Object.fromEntries(
            Object.entries(LEGACY_HABITS).map(([old, id]) => [old, HABITS[id]]),
          ),
          "Sugar Jasoos": "Sugar Detective",
          "Rasoi Card": "Kitchen card",
          "Parivaar Dial": "Family sharing",
        };
        for (const [old, english] of Object.entries(copy).sort(
          ([a], [b]) => b.length - a.length,
        ))
          text = text.split(old).join(english);
        return text;
      }
      if (Array.isArray(v)) return v.map(translate);
      if (v && typeof v === "object")
        return Object.fromEntries(
          Object.entries(v).map(([k, x]) => [k, translate(x)]),
        );
      return v;
    };
    const translated = translate(result);
    translated.version = 4;
    return normalizeDeviceState(englishSavedText(translated, result));
  }
  return normalizeDeviceState(englishSavedText(result));
}

/** Backfill provenance without changing rules, consent or saved values. */
export function normalizeDeviceState(s: State): State {
  s.healthConnect ||= {};
  for (const n of s.notifications)
    if (n.audience?.startsWith("CG"))
      n.push =
        n.category === "alerts" &&
        view(s, n.audience, n.patientId, "alerts", s.alerts).some(
          (a) => a.priority === "P0" && n.id.includes(a.id),
        );
  for (const n of s.notifications)
    if (
      n.category === "medicines" &&
      (n.id.startsWith("REMIND-DOSE-") ||
        ((n.title.includes("medicine update") ||
          n.title === "Medicine update") &&
          /missed/.test(n.body)))
    )
      n.archived = true;
  s.supportTasks ||= [];
  s.metrics ||= [];
  s.walks ||= [];
  s.wellness ||= seedWellness(P);
  for (const p of s.patients) {
    p.testingPlan ||= p.id === P ? seededPlan() : starterPlan();
    delete (p as any).sugarDetectivePrescribed;
    p.largeText ??= p.age >= 55;
  }
  for (const r of s.readings) {
    r.source ||= "typed";
    r.measuredAt ??= minutes(r.day, r.time);
  }
  for (const r of s.labs) {
    if (r.source && r.source !== "lab") r.provider ||= r.source;
    r.source = "lab";
    r.measuredAt ??= minutes(r.day, r.time);
  }
  for (const r of s.water) {
    r.source ||= "typed";
    r.measuredAt ??= minutes(r.day, r.time);
  }
  for (const r of s.band) {
    r.source ||= "band";
    r.measuredAt ??= minutes(r.day, r.time);
  }
  return s;
}
