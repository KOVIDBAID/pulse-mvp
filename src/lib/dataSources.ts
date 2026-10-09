import type { State, Row, DataSource } from "./engine";
export type Metric =
  | "steps"
  | "sleep"
  | "heartRate"
  | "spo2"
  | "hydration"
  | "activity"
  | "glucose"
  | "weight"
  | "bp";
/** Priority chooses collection methods; newer clinical readings are never hidden. */
export const SOURCE_PRIORITY: Record<Metric, readonly DataSource[]> = {
  steps: ["band"],
  sleep: ["band"],
  heartRate: ["band"],
  spo2: ["band"],
  hydration: ["band"],
  activity: ["band", "typed"],
  glucose: ["meter-sync", "meter-photo", "typed"],
  weight: ["health-connect", "typed"],
  bp: ["health-connect", "typed"],
};
const at = (s: State) =>
  s.sim.day * 1440 +
  Number(s.sim.time.slice(0, 2)) * 60 +
  Number(s.sim.time.slice(3));
const measured = (r: Row) =>
  r.measuredAt ??
  r.day * 1440 + Number(r.time.slice(0, 2)) * 60 + Number(r.time.slice(3));
export function choose(
  metric: Metric,
  rows: Row[],
  current = Infinity,
): Row | undefined {
  const order = SOURCE_PRIORITY[metric];
  const candidates = rows.filter(
    (r) =>
      measured(r) <= current &&
      order.includes((r.source || "typed") as DataSource),
  );
  return candidates.sort((a, b) =>
    metric === "glucose"
      ? measured(b) - measured(a) ||
        order.indexOf(a.source as DataSource) -
          order.indexOf(b.source as DataSource)
      : order.indexOf(a.source as DataSource) -
          order.indexOf(b.source as DataSource) || measured(b) - measured(a),
  )[0];
}
export function hasBand(s: State, pid = s.session.patientId) {
  const p = s.patients.find((p) => p.id === pid),
    c = s.healthConnect?.[pid];
  return (
    p?.bandOwned !== false &&
    !!p?.consents.band &&
    !!c &&
    Object.entries(c.permissions).some(([k, v]) => k !== "bloodGlucose" && v)
  );
}
export function hasBandWalks(s: State, pid = s.session.patientId) {
  return hasBand(s, pid) && !!s.healthConnect[pid]?.permissions.steps;
}
export function value(
  s: State,
  metric: Metric,
  pid = s.session.patientId,
  day?: number,
): Row | undefined {
  if (metric === "glucose")
    return choose(
      metric,
      s.readings.filter(
        (r) => r.patientId === pid && (day == null || r.day === day),
      ),
      at(s),
    );
  if (metric === "weight" || metric === "bp")
    return choose(
      metric,
      (s.metrics || []).filter(
        (r) => r.patientId === pid && r.metric === metric,
      ),
      at(s),
    );
  const field = {
    steps: "steps",
    sleep: "sleepMinutes",
    heartRate: "restingHr",
    spo2: "spo2Min",
    hydration: "hydrationMl",
    activity: "stepsAfterDinner",
  }[metric];
  const permission = {
    steps: "steps",
    sleep: "sleep",
    heartRate: "heartRate",
    spo2: "oxygen",
    hydration: "hydration",
    activity: "steps",
  }[metric];
  const c = s.healthConnect?.[pid];
  const rows =
    hasBand(s, pid) && c?.permissions[permission as keyof typeof c.permissions]
      ? s.wellness
          .filter(
            (r) =>
              r.patientId === pid &&
              r.imported &&
              (day == null || r.day === day) &&
              r[field] != null,
          )
          .map((r) => ({ ...r, value: r[field] }))
      : [];
  if (metric === "activity")
    rows.push(
      ...((s.walks || []).filter(
        (r) => r.patientId === pid && (day == null || r.day === day),
      ) as any),
    );
  return choose(metric, rows, at(s));
}
export function walk(
  s: State,
  pid: string,
  day: number,
  from?: number,
  until?: number,
) {
  const r = value(s, "activity", pid, day);
  return {
    done:
      !!r &&
      (r.source === "band"
        ? r.value >= 1500 &&
          (from == null ||
            (r.activityStart >= from && r.activityEnd <= (until ?? at(s))))
        : r.value === 1 &&
          (from == null ||
            (measured(r) >= from && measured(r) <= (until ?? at(s))))),
    source: r?.source as DataSource | undefined,
    row: r,
  };
}
export function week(s: State, pid = s.session.patientId, end = s.sim.day) {
  const days = Array.from({ length: 7 }, (_, i) => end - i).filter(
    (d) => d >= 0,
  );
  return {
    walks: days.filter((d) => walk(s, pid, d).done).length,
    bandDays: days.filter((d) =>
      s.wellness.some(
        (r) =>
          r.patientId === pid &&
          r.day === d &&
          r.imported &&
          measured(r) <= at(s),
      ),
    ).length,
    source: hasBandWalks(s, pid) ? ("band" as const) : ("typed" as const),
  };
}
export function summary(s: State, pid = s.session.patientId) {
  if (!hasBand(s, pid)) return null;
  const sleep = value(s, "sleep", pid),
    steps = value(s, "steps", pid),
    activity = value(s, "activity", pid),
    water = value(s, "hydration", pid);
  const parts = [];
  if (sleep)
    parts.push(`Sleep ${Math.floor(sleep.value / 60)} h ${sleep.value % 60} m`);
  if (steps) parts.push(`${steps.value.toLocaleString("en-IN")} steps`);
  if (activity)
    parts.push(`walk after dinner ${activity.value >= 1500 ? "✓" : "—"}`);
  if (water) parts.push(`${water.value} ml hydration`);
  return parts.length ? parts.join(" · ") : null;
}
