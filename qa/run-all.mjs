import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PULSE_QA_PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Invalid PULSE_QA_PORT");
const base = `http://127.0.0.1:${port}`;
const names = process.argv.slice(2);
if (names.some((name) => !["sweep", "clicks", "migration", "ia"].includes(name)))
  throw new Error("Unknown QA script");
let output = "";
let activeScript;
const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);
const exited = new Promise((resolve) => server.once("close", resolve));
const startup = new Promise((resolve, reject) => {
  const timer = setTimeout(
    () => reject(new Error("Preview did not become ready")),
    10000,
  );
  const finish = (error) => {
    clearTimeout(timer);
    error ? reject(error) : resolve();
  };
  server.stdout.on("data", (data) => {
    output += data;
    // Only our child's readiness announcement is evidence that preview started.
    if (output.replace(/\x1b\[[0-9;]*m/g, "").includes(base)) finish();
  });
  server.stderr.on("data", (data) => {
    output += data;
  });
  server.once("error", (error) => finish(error));
  server.once("exit", (code) =>
    finish(
      new Error(
        `Preview failed to start on port ${port} (exit ${code}). ${output.trim()}`,
      ),
    ),
  );
});
async function stop() {
  if (activeScript?.exitCode === null) activeScript.kill("SIGTERM");
  if (server.exitCode === null && server.pid) server.kill("SIGTERM");
  const timer = setTimeout(() => {
    if (server.exitCode === null && server.pid) server.kill("SIGKILL");
  }, 3000);
  await exited;
  clearTimeout(timer);
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await stop();
    process.exit(signal === "SIGINT" ? 130 : 143);
  });
try {
  await startup;
  const response = await fetch(base, { signal: AbortSignal.timeout(5000) });
  const html = await response.text();
  const built = await readFile(path.join(root, "dist/index.html"), "utf8");
  if (
    !response.ok ||
    html.includes("/@vite/client") ||
    html.trim() !== built.trim()
  )
    throw new Error("QA endpoint is not this project’s production build");
  console.log(`Verified owned production preview: ${base}`);
  for (const name of names) {
    const code = await new Promise((resolve, reject) => {
      activeScript = spawn(
        process.execPath,
        [path.join(root, `qa/${name}.mjs`)],
        {
          cwd: root,
          stdio: "inherit",
          env: { ...process.env, PULSE_QA_URL: base },
        },
      );
      activeScript.once("error", reject);
      activeScript.once("exit", resolve);
    });
    if (code !== 0) process.exitCode = 1;
    if (server.exitCode !== null)
      throw new Error("Owned preview exited during QA");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await stop();
  console.log("Owned preview stopped");
}
