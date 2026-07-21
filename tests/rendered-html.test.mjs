import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("production bundle contains the PulihkanAku public experience", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  const app = await readFile(new URL("../app/pulihkan-aku-app.tsx", import.meta.url), "utf8");
  assert.match(app, /PulihkanAku/);
  assert.match(app, /Dapatkan penghasilan dari pekerjaan yang/);
  assert.match(app, /Pekerjaan nyata di dekatmu/);
  assert.match(app, /melamar selalu gratis/i);
  assert.doesNotMatch(app, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships Indonesian metadata and a social preview", async () => {
  const [page, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /pulihkanaku\.com/);
  assert.match(layout, /lang="id"/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /--primary:#ed5f50/);
});
