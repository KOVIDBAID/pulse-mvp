import * as E from "./engine";
export const PERMISSIONS: [E.HealthPermission, string][] = [
  ["steps", "Steps"],
  ["sleep", "Sleep"],
  ["heartRate", "Heart rate"],
  ["oxygen", "Oxygen saturation"],
  ["hydration", "Hydration"],
  ["bloodGlucose", "Blood glucose"],
];
export const emptyPermissions = (): E.HealthPermissions =>
  Object.fromEntries(
    PERMISSIONS.map(([key]) => [key, false]),
  ) as E.HealthPermissions;
/** With no state, prepare the all-OFF permission sheet; applying it is explicit. */
export function connect(): E.HealthPermissions;
export function connect(
  s: E.State,
  permissions: E.HealthPermissions,
  pid?: string,
): void;
export function connect(
  s?: E.State,
  permissions?: E.HealthPermissions,
  pid = s?.session.patientId || E.P,
) {
  if (!s || !permissions) return emptyPermissions();
  E.normalizeDeviceState(s);
  s.healthConnect[pid] = {
    connected: true,
    permissions: { ...permissions },
    lastSync: null,
  };
  s.consentLog.push({
    id: E.uid("HC-CONSENT"),
    patientId: pid,
    ...E.stamp(s),
    action: "Health Connect permissions allowed (Demo)",
    permissions: { ...permissions },
  });
  sync(s, pid);
}
export function wellness(
  s: E.State,
  pid = s.session.patientId,
): E.WellnessDay[] {
  const c = s.healthConnect?.[pid];
  if (!E.patient(s, pid)?.consents.band || !c) return [];
  return (s.wellness || [])
    .filter(
      (r) => r.patientId === pid && r.imported && r.measuredAt <= E.now(s),
    )
    .sort((a, b) => a.measuredAt - b.measuredAt)
    .map((row) => permittedRow(row, c.permissions));
}
/** Band metrics have no route into recordReading, scanText or alert. */
export function recordWellness(s: E.State, row: E.WellnessDay) {
  const i = s.wellness.findIndex((r) => r.id === row.id);
  if (i < 0) s.wellness.push({ ...row, source: "band" });
  else s.wellness[i] = { ...row, source: "band" };
}
export function ingestMeter(
  s: E.State,
  input: {
    id: string;
    value: number;
    measuredAt: number;
    context?: string;
    symptoms?: string;
    severe?: boolean;
  },
  pid = s.session.patientId,
) {
  const c = s.healthConnect?.[pid];
  if (
    !c?.connected ||
    !c.permissions.bloodGlucose ||
    !s.sim.online ||
    E.patient(s, pid)?.deleted
  )
    return null;
  if (input.measuredAt > E.now(s)) return null;
  return E.recordReading(
    s,
    { ...input, source: "meter-sync", context: input.context || "fasting" },
    pid,
  );
}
export function sync(
  s: E.State,
  pid = s.session.patientId,
  meterEnabled = true,
) {
  E.normalizeDeviceState(s);
  const c = s.healthConnect[pid];
  if (
    !c?.connected ||
    !s.sim.online ||
    E.patient(s, pid)?.deleted ||
    (c.syncGapUntil ?? -1) > E.now(s)
  )
    return;
  const hasBand = PERMISSIONS.some(
    ([key]) => key !== "bloodGlucose" && c.permissions[key],
  );
  if (E.patient(s, pid).consents.band && hasBand) {
    const seedById = new Map(E.seedWellness(pid).map((r) => [r.id, r]));
    if (!s.wellness.some((r) => r.patientId === pid))
      s.wellness.push(...E.seedWellness(pid));
    for (const row of s.wellness.filter(
      (r) =>
        r.patientId === pid &&
        r.measuredAt <= E.now(s) &&
        ![59, 60, 61].includes(r.day),
    ))
      recordWellness(
        s,
        permittedRow(
          {
            ...seedById.get(row.id)!,
            ...row,
            steps: seedById.get(row.id)?.steps ?? row.steps,
            stepsAfterDinner:
              seedById.get(row.id)?.stepsAfterDinner ?? row.stepsAfterDinner,
            sleepMinutes: row.demoPoorSleep
              ? 240
              : (seedById.get(row.id)?.sleepMinutes ?? row.sleepMinutes),
            restingHr: seedById.get(row.id)?.restingHr ?? row.restingHr,
            spo2Min: seedById.get(row.id)?.spo2Min ?? row.spo2Min,
            hydrationMl: seedById.get(row.id)?.hydrationMl ?? null,
            imported: true,
            lastSync: E.now(s),
          },
          c.permissions,
        ),
      );
  }
  if (meterEnabled && c.permissions.bloodGlucose && pid === E.P) {
    const day =
      E.now(s) >= E.minutes(s.sim.day, "07:30") ? s.sim.day : s.sim.day - 1;
    if (day >= 0)
      ingestMeter(
        s,
        {
          id: `HC-M-${pid}-${day}`,
          value: 128,
          measuredAt: E.minutes(day, "07:30"),
          context: "fasting",
        },
        pid,
      );
  }
  c.lastSync = E.now(s);
}
export function disconnect(
  s: E.State,
  removePast = false,
  pid = s.session.patientId,
) {
  const c = s.healthConnect?.[pid];
  if (c) c.connected = false;
  if (removePast) {
    s.wellness = s.wellness.filter((r) => r.patientId !== pid);
    s.band = s.band.filter((r) => r.patientId !== pid);
  }
  s.consentLog.push({
    id: E.uid("HC-DISCONNECT"),
    patientId: pid,
    ...E.stamp(s),
    action: removePast
      ? "Health Connect disconnected; band history deleted"
      : "Health Connect disconnected; history kept",
  });
  // Clinical meter readings remain in Records and retain their safety history.
}
export function poorSleep(s: E.State, pid = E.P) {
  const days = [s.sim.day - 3, s.sim.day - 2, s.sim.day - 1].filter(
    (d) => d >= 0,
  );
  for (const day of days) {
    const existing =
      s.wellness.find((r) => r.patientId === pid && r.day === day) ||
      E.seedWellness(pid).find((r) => r.day === day);
    if (existing)
      recordWellness(s, {
        ...existing,
        sleepMinutes: 240,
        demoPoorSleep: true,
        imported: true,
        lastSync: E.now(s),
      });
  }
}
export function syncGap(s: E.State, pid = E.P) {
  const c = s.healthConnect[pid];
  if (!c) return;
  c.lastSync = E.now(s) - 3 * 1440;
  c.syncGapUntil = E.now(s) + 1440;
  for (const r of s.wellness.filter((r) => r.patientId === pid)) {
    r.lastSync = c.lastSync;
    if (r.measuredAt > c.lastSync) r.imported = false;
  }
}
export function freshness(s: E.State, lastSync: number | null | undefined) {
  if (lastSync == null) return { text: "not synced yet", stale: false };
  const age = Math.max(0, E.now(s) - lastSync);
  return {
    text:
      age >= 4320
        ? `not synced for ${Math.floor(age / 1440)} days`
        : age < 60
          ? `synced ${Math.floor(age)} min ago`
          : `synced ${Math.floor(age / 60)} h ago`,
    stale: age >= 4320,
  };
}

function permittedRow(
  row: E.WellnessDay,
  p: E.HealthPermissions,
): E.WellnessDay {
  return {
    ...row,
    steps: p.steps ? row.steps : null,
    stepsAfterDinner: p.steps ? row.stepsAfterDinner : null,
    sleepMinutes: p.sleep ? row.sleepMinutes : null,
    restingHr: p.heartRate ? row.restingHr : null,
    spo2Min: p.oxygen ? row.spo2Min : null,
    hydrationMl: p.hydration ? row.hydrationMl : null,
  };
}
