import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
async function run(port) {
  const child = spawn(process.execPath, ["qa/run-all.mjs"], {
    cwd: root,
    env: { ...process.env, PULSE_QA_PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  const [code] = await once(child, "close");
  return { code, output };
}
test("A 200 response from an occupied port never counts as preview readiness", async () => {
  const occupied = http.createServer((req, res) =>
    res.end('<script src="/@vite/client"></script>'),
  );
  occupied.listen(0, "127.0.0.1");
  await once(occupied, "listening");
  try {
    const port = occupied.address().port;
    const result = await run(port);
    assert.equal(result.code, 1);
    assert.match(result.output, /Preview failed to start/);
    assert.doesNotMatch(result.output, /Verified owned production preview/);
    assert.equal((await fetch(`http://127.0.0.1:${port}`)).status, 200); // the unrelated server remains running
  } finally {
    await new Promise((r) => occupied.close(r));
  }
});
test("A free port serves the built HTML and is released before QA returns", async () => {
  const reservation = net.createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((r) => reservation.close(r));
  const result = await run(port);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /Verified owned production preview/);
  assert.match(result.output, /Owned preview stopped/);
  await assert.rejects(fetch(`http://127.0.0.1:${port}`));
});
