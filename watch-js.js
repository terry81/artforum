/**
 * Dependency-free replacement for `onchange`.
 *
 * Watches assets/js/**\/*.js (ignoring the generated bundle) and re-runs
 * `npm run build:js` on change, debounced to coalesce rapid editor saves.
 *
 * Avoids the chokidar/braces/picomatch dependency chain, which currently has
 * an unpatched stack-exhaustion advisory (CVE-2026-93687).
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const WATCH_DIR = path.join(__dirname, "assets", "js");
const IGNORED = new Set([path.join(WATCH_DIR, "main.min.js")]);
const DEBOUNCE_MS = 150;
const POLL_MS = 1000;

const isWatchable = filePath =>
  filePath.endsWith(".js") && !IGNORED.has(filePath);

let timer = null;
let running = false;
let queued = false;

function build() {
  if (running) {
    queued = true;
    return;
  }

  running = true;
  console.log("[watch:js] change detected - running build:js");

  const child = spawn("npm", ["run", "build:js"], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  child.on("exit", code => {
    running = false;
    if (code !== 0) {
      console.error(`[watch:js] build:js exited with code ${code}`);
    }
    if (queued) {
      queued = false;
      build();
    }
  });

  child.on("error", err => {
    running = false;
    console.error("[watch:js] failed to start build:js:", err.message);
  });
}

function scheduleBuild(filePath) {
  if (!isWatchable(filePath)) return;
  clearTimeout(timer);
  timer = setTimeout(build, DEBOUNCE_MS);
}

/** Recursively collect watchable files and their mtimes. */
function snapshot(dir, acc = new Map()) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      snapshot(full, acc);
    } else if (isWatchable(full)) {
      try {
        acc.set(full, fs.statSync(full).mtimeMs);
      } catch {
        /* file vanished between readdir and stat */
      }
    }
  }
  return acc;
}

/** Fallback for platforms without recursive fs.watch (e.g. Linux on Node < 20). */
function startPolling() {
  console.log("[watch:js] recursive watch unavailable - falling back to polling");
  let previous = snapshot(WATCH_DIR);

  setInterval(() => {
    const current = snapshot(WATCH_DIR);
    let changed = false;

    for (const [file, mtime] of current) {
      if (previous.get(file) !== mtime) {
        changed = true;
        break;
      }
    }
    if (!changed) {
      for (const file of previous.keys()) {
        if (!current.has(file)) {
          changed = true;
          break;
        }
      }
    }

    previous = current;
    if (changed) scheduleBuild(path.join(WATCH_DIR, "poll.js"));
  }, POLL_MS).unref?.();
}

function start() {
  if (!fs.existsSync(WATCH_DIR)) {
    console.error(`[watch:js] directory not found: ${WATCH_DIR}`);
    process.exit(1);
  }

  console.log(`[watch:js] watching ${path.relative(__dirname, WATCH_DIR)} for changes`);

  try {
    const watcher = fs.watch(WATCH_DIR, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      scheduleBuild(path.join(WATCH_DIR, filename.toString()));
    });
    watcher.on("error", err => console.error("[watch:js]", err.message));
  } catch (err) {
    if (err.code === "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") {
      startPolling();
    } else {
      throw err;
    }
  }
}

start();

