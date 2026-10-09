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
