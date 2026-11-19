// Builds share generated files (public/og, src/assets/generated, src/data/generated.json),
// so no two may run at once: every test build takes this lock (a directory, created
// atomically) for its whole run. Temporary build output lives on the workspace
// filesystem (.test-builds/), never in the system temp directory.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BUILDS = path.join(ROOT, '.test-builds');
const LOCK = path.join(BUILDS, '.lock');
const STALE_MS = 10 * 60_000;

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Run fn (synchronous) while holding the build lock. */
export function withBuildLock(fn) {
  fs.mkdirSync(BUILDS, { recursive: true });
  const deadline = Date.now() + STALE_MS;
  for (;;) {
    try {
      fs.mkdirSync(LOCK);
      fs.writeFileSync(path.join(LOCK, 'owner'), `${process.pid}\n`);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try {
        // a holder that died long ago left it behind
        if (Date.now() - fs.statSync(LOCK).mtimeMs > STALE_MS) fs.rmSync(LOCK, { recursive: true, force: true });
      } catch {}
      if (Date.now() > deadline) throw new Error(`build lock held too long: ${LOCK}`);
      sleep(200);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmSync(LOCK, { recursive: true, force: true });
  }
}

/** A fresh directory for one build's output, under .test-builds/. */
export function buildDir(prefix) {
  fs.mkdirSync(BUILDS, { recursive: true });
  return fs.mkdtempSync(path.join(BUILDS, `${prefix}-`));
}
