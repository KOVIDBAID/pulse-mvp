import fs from "node:fs";
import ts from "typescript";
const code = ts.transpileModule(
  fs.readFileSync(new URL("../src/app/routes.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  },
).outputText;
const features = ts.transpileModule(
  fs.readFileSync(new URL("../src/app/features.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  },
).outputText;
const moduleCode = code.replace(
  '"./features"',
  JSON.stringify(
    `data:text/javascript;base64,${Buffer.from(features).toString("base64")}`,
  ),
);
export const config = await import(
  `data:text/javascript;base64,${Buffer.from(moduleCode).toString("base64")}`
);

// Visible destinations for the default synthetic QA identities. Ramesh's
// subscription is paid by Amit, so Payments is absent from his drawer.
export function actualVisibleRoutes(role, patientId = "PUL-KNP-0001") {
  const routes = config
    .visibleRoutes(role)
    .filter(
      (path) =>
        role !== "patient" ||
        (patientId === "PUL-KNP-0001"
          ? path !== "/patient/billing"
          : path !== "/patient/sugar-detective"),
    );
  for (const group of config.ROUTES[role].drawer)
    for (const item of group.items)
      if (item.action === "switch") routes.push(`/${role}/${item.path}`);
  if (role === "doctor")
    for (const tab of config.PROFILE_TABS)
      routes.push(`/doctor/patient/PUL-KNP-0001/${tab.path}`);
  return [...new Set(routes)];
}
