import fs from "node:fs";
import { config, actualVisibleRoutes } from "./config.mjs";
const identities = {
  patient: "PUL-KNP-0001",
  caregiver: "CG-0001",
  doctor: "DR-0001",
  team: "TEAM",
};
const routes = Object.keys(config.ROUTES).map((role) => ({
  session: { role, userId: identities[role], patientId: "PUL-KNP-0001" },
  routes: actualVisibleRoutes(role),
}));
// Sushma pays for herself and has no prescribed experiment: cover that visible drawer too.
routes.push({
  session: {
    role: "patient",
    userId: "PUL-KNP-0002",
    patientId: "PUL-KNP-0002",
  },
  routes: actualVisibleRoutes("patient", "PUL-KNP-0002"),
});
fs.writeFileSync(
  new URL("./routes.json", import.meta.url),
  JSON.stringify(routes, null, 2) + "\n",
);
