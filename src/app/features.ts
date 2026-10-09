/** Park UI entry points without deleting safety, consent or calculation rules. */
export const FEATURES: Readonly<
  Record<
    | "mealPhotos"
    | "manualWater"
    | "manualWeightBp"
    | "privateNotes"
    | "mythBuster"
    | "sugarDetective"
    | "weeklyQuestionnaire"
    | "wellnessBand"
    | "meterAutoSync"
    | "teamOutboundLog"
    | "healthMapDefault",
    boolean
  >
> = {
  mealPhotos: false,
  manualWater: false,
  manualWeightBp: true,
  privateNotes: true,
  mythBuster: true,
  sugarDetective: true,
  weeklyQuestionnaire: false,
  wellnessBand: true,
  meterAutoSync: true,
  teamOutboundLog: false,
  healthMapDefault: false,
};
export function featureVisible(path: string): boolean {
  return (
    (
      {
        weekly: FEATURES.weeklyQuestionnaire,
        notes: FEATURES.privateNotes,
        myth: FEATURES.mythBuster,
        "sugar-detective": FEATURES.sugarDetective,
        band: FEATURES.wellnessBand,
        outbound: FEATURES.teamOutboundLog,
      } as Record<string, boolean>
    )[path] ?? true
  );
}
