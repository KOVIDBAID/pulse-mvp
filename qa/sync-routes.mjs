import fs from "node:fs";
import { config } from "./config.mjs";
const identities = {
  patient: "PUL-KNP-0001",
  caregiver: "CG-0001",
  doctor: "DR-0001",
  team: "TEAM",
};
const routes = Object.keys(config.ROUTES).map((role) => ({
  session: { role, userId: identities[role], patientId: "PUL-KNP-0001" },
  routes: config.visibleRoutes(role),
}));
fs.writeFileSync(
  new URL("./routes.json", import.meta.url),
  JSON.stringify(routes, null, 2) + "\n",
);
