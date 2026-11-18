require("./helpers");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { setTimeout: delay } = require("node:timers/promises");

const root = path.resolve(__dirname, "../..");

async function reservePorts(count) {
  const servers = await Promise.all(Array.from({ length: count }, async () => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    return server;
  }));
  return {
    ports: servers.map(server => server.address().port),
    close: () => Promise.all(servers.map(server => new Promise(resolve => server.close(resolve)))),
  };
}

function isolatedEnv(ports) {
  const [frontend, backend, database] = ports;
  return {
    ...process.env,
    NODE_ENV: "production",
    FRONTEND_PORT: String(frontend),
    BACKEND_PORT: String(backend),
    BACKEND_URL: `http://127.0.0.1:${backend}`,
    DB_HOST: "127.0.0.1",
    DB_PORT: String(database),
    DB_USER: "unused_test_user",
    DB_PASSWORD: "unused_test_password",
    DB_NAME: "unused_test_database",
    DB_SSL: "false",
    DB_CONNECT_TIMEOUT_MS: "200",
    CLOUDINARY_CLOUD_NAME: "unused-test-cloud",
    CLOUDINARY_API_KEY: "unused-test-key",
    CLOUDINARY_API_SECRET: "unused-test-secret",
  };
}

function startProcess(t, filename, cwd, env, args = []) {
  const child = spawn(process.execPath, [filename, ...args], { cwd, env, stdio: ["ignore", "pipe", "pipe", "ipc"], windowsHide: true });
  let output = "";
  child.stdout.on("data", data => { output = (output + data).slice(-8000); });
  child.stderr.on("data", data => { output = (output + data).slice(-8000); });
  const exited = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      if (child.connected) child.send({ type: "shutdown" });
      else child.kill();
    }
    await exited;
  });
  return { child, exited, output: () => output };
}

async function waitForHealth(process, url, name) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (process.child.exitCode !== null || process.child.signalCode !== null) {
      assert.fail(`${name} exited before becoming healthy: ${process.output()}`);
    }
    try {
      const response = await fetch(url + "/health", { signal: AbortSignal.timeout(500) });
      if (response.ok) {
        assert.equal((await response.json()).service, name);
        return;
      }
    } catch { /* Listener may still be starting. */ }
    await delay(40);
  }
  assert.fail(`${name} did not become healthy: ${process.output()}`);
}

test("frontend and backend run independently from their own folders", { timeout: 20000 }, async t => {
  const reservation = await reservePorts(3);
  const env = isolatedEnv(reservation.ports);
  await reservation.close();
  const definitions = [
    ["frontend", "FrontEnd"], ["backend", "BackEnd"],
  ];
  const processes = definitions.map(([name, directory], index) => {
    const process = startProcess(t, "src/server.js", path.join(root, directory), env);
    return { ...process, name, url: `http://127.0.0.1:${reservation.ports[index]}` };
  });
  await Promise.all(processes.map(process => waitForHealth(process, process.url, process.name)));
  const [frontend, backend] = processes;
  const page = await fetch(frontend.url + "/cars.html");
  assert.equal(page.status, 200);
  await page.text();
  const ready = await fetch(backend.url + "/ready");
  assert.equal(ready.status, 503);
  await ready.json();

  const cars = await fetch(frontend.url + "/api/cars/by-ids");
  assert.equal(cars.status, 200);
  assert.deepEqual((await cars.json()).data, []);
  backend.child.send({ type: "shutdown" });
  await backend.exited;
  const failedApi = await fetch(frontend.url + "/api/auth/signin", { method: "POST" });
  assert.equal(failedApi.status, 502);
  assert.equal((await failedApi.json()).status, "error");
  assert.equal(frontend.child.exitCode, null, frontend.output());
  assert.equal(frontend.child.signalCode, null, frontend.output());
});

test("the local launcher reports a startup failure and stops the other process", { timeout: 20000 }, async t => {
  const reservation = await reservePorts(3);
  const env = isolatedEnv(reservation.ports);
  await reservation.close();
  const occupied = net.createServer();
  occupied.listen(Number(env.BACKEND_PORT), "127.0.0.1");
  await once(occupied, "listening");
  t.after(() => new Promise(resolve => occupied.close(resolve)));
  const launcher = startProcess(t, "BackEnd/scripts/start.js", root, env);
  const result = await launcher.exited;
  assert.equal(result.code, 1, launcher.output());
  assert.match(launcher.output(), /backend failed to start:.*EADDRINUSE/);
  await assert.rejects(fetch(`http://127.0.0.1:${env.FRONTEND_PORT}/health`, { signal: AbortSignal.timeout(500) }));
});

test("development reloads the backend and shuts down both processes without leaving listeners", { timeout: 20000 }, async t => {
  const reservation = await reservePorts(3);
  const env = isolatedEnv(reservation.ports);
  await reservation.close();
  // Trigger a real source-directory watch event without editing an application file.
  const watchFile = path.join(root, "BackEnd/src", `watch-test-${randomUUID()}.js`);
  await fs.writeFile(watchFile, "// Temporary watch test.\n", { flag: "wx" });
  const launcher = startProcess(t, "BackEnd/scripts/start.js", root, env, ["--watch"]);
  t.after(() => fs.rm(watchFile, { force: true }));
  const names = ["frontend", "backend"];
  await Promise.all(names.map((name, index) => waitForHealth(launcher, `http://127.0.0.1:${reservation.ports[index]}`, name)));
  await fs.appendFile(watchFile, "// Source changed.\n");
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline && (launcher.output().match(/backend listening at/g) || []).length < 2) {
    await delay(40);
  }
  assert.equal((launcher.output().match(/backend listening at/g) || []).length, 2, launcher.output());
  for (const name of names.filter(name => name !== "backend")) {
    assert.equal((launcher.output().match(new RegExp(`${name} listening at`, "g")) || []).length, 1, launcher.output());
  }
  await waitForHealth(launcher, `http://127.0.0.1:${env.BACKEND_PORT}`, "backend");
  launcher.child.send({ type: "shutdown" });
  assert.equal((await launcher.exited).code, 0, launcher.output());
  for (const port of reservation.ports.slice(0, 2)) {
    await assert.rejects(fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(500) }));
  }
});
