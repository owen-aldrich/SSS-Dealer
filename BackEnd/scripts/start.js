const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { ROOT_DIR, loadEnv, getPort, requireJwtSecret } = require("../src/config/env");

loadEnv();
requireJwtSecret();
const watch = process.argv.includes("--watch");
const services = [
  { name: "backend", file: "BackEnd/src/server.js", port: getPort("BACKEND", 3001) },
  { name: "frontend", file: "FrontEnd/src/server.js", port: getPort("FRONTEND", 3000) },
];
if (new Set(services.map(service => service.port)).size !== services.length) {
  throw new Error("Each application must use a different port.");
}

const watchers = [];
let stopping = false;
let exitCode = 0;
let restartTimer;
const pendingRestarts = new Set();

function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
  if (child.connected) {
    child.send({ type: "shutdown" }, err => { if (err) child.kill(); });
  } else {
    child.kill();
  }
}

function stop(code) {
  if (stopping) return;
  stopping = true;
  exitCode = code;
  clearTimeout(restartTimer);
  watchers.forEach(watcher => watcher.close());
  services.forEach(service => stopChild(service.child));
  const deadline = setTimeout(() => {
    for (const { child } of services) {
      if (child.exitCode === null && child.signalCode === null && child.pid) {
        child.kill("SIGKILL");
      }
    }
    process.exit(exitCode);
  }, 12000);
  deadline.unref();
}

function launch(service) {
  const child = spawn(process.execPath, [path.join(ROOT_DIR, service.file)], {
    cwd: ROOT_DIR,
    stdio: ["inherit", "inherit", "inherit", "ipc"],
    env: process.env,
    windowsHide: true,
  });
  service.child = child;
  child.once("error", err => {
    console.error(`${service.name} could not start: ${err.message}`);
    stop(1);
  });
  child.once("exit", (code, signal) => {
    if (service.restarting && !stopping) {
      service.restarting = false;
      launch(service);
      return;
    }
    if (!stopping) {
      console.error(`${service.name} exited (${signal || code}); stopping the local stack.`);
      stop(code || 1);
    }
    if (services.every(({ child: item }) => !item || item.exitCode !== null || item.signalCode !== null || !item.pid)) {
      process.exit(exitCode);
    }
  });
}

services.forEach(launch);

if (watch) {
  function queueRestart(selected) {
    selected.forEach(service => pendingRestarts.add(service));
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
      if (stopping) return;
      for (const service of pendingRestarts) {
        if (service.restarting) continue;
        service.restarting = true;
        console.log(`Restarting ${service.name} after a source change.`);
        stopChild(service.child);
      }
      pendingRestarts.clear();
    }, 200);
  }
  for (const service of services) {
    watchers.push(fs.watch(path.dirname(path.join(ROOT_DIR, service.file)), { recursive: true }, (_event, filename) => {
      if (filename && /\.(js|json)$/.test(String(filename))) queueRestart([service]);
    }));
  }
}

process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));
if (process.send) {
  process.on("message", message => { if (message?.type === "shutdown") stop(0); });
  process.once("disconnect", () => stop(0));
}
