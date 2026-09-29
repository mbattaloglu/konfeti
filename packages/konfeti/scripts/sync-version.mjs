// Copies the package.json version into src/Version.ts (run after `changeset version`, which only bumps
// package.json). test/Package.test.ts fails when the two drift apart.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const { version } = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const file = `${root}src/Version.ts`;
const source = readFileSync(file, "utf8");
const updated = source.replace(
  /export const VERSION = "[^"]*";/,
  `export const VERSION = "${version}";`,
);

if (updated === source && !source.includes(`"${version}"`)) {
  throw new Error("sync-version: VERSION constant not found in src/Version.ts");
}

writeFileSync(file, updated);
console.log(`sync-version: VERSION = "${version}"`);
