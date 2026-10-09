import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pulse-tests-"));
try {
  for (const name of ["engine", "dataSources", "healthConnect", "selfTests"]) {
    let source = fs
      .readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8")
      .replace(
        /(["'])\.\/(engine|healthConnect|dataSources)\1/g,
        (_, q, name) => `"./${name}.mjs"`,
      );
    fs.writeFileSync(
      path.join(temp, `${name}.mjs`),
      ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
      }).outputText,
    );
  }
  const { selfTests } = await import(
    pathToFileURL(path.join(temp, "selfTests.mjs"))
  );
  const results = selfTests();
  const failures = results.filter((t) => !t.pass);
  results.forEach((t) =>
    console.log(
      `${t.pass ? "PASS" : "FAIL"} ${t.group}: ${t.name}${
        t.pass
          ? ""
          : ` expected ${JSON.stringify(t.expected)}, got ${JSON.stringify(t.actual)}`
      }`,
    ),
  );
  console.log(
    `\n${results.length - failures.length}/${results.length} checks passed`,
  );
  if (failures.length) process.exitCode = 1;
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
