// Publishes konfeti when its version is not on npm yet, then tags the commit and creates the GitHub release.
// Run by .github/workflows/release.yml after the "Version Packages" PR is merged. Authentication is npm
// trusted publishing (OIDC) — no token; provenance is attached automatically.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pkgDir = `${root}packages/konfeti/`;
const { name, version } = JSON.parse(readFileSync(`${pkgDir}package.json`, "utf8"));
const tag = `v${version}`;

/**
 * Run a command and return its trimmed output.
 *
 * @param {string} command - Executable
 * @param {string[]} args - Arguments
 * @param {string} [cwd] - Working directory
 * @returns {string} Output
 */
function run(command, args, cwd = root) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

/**
 * Check Whether This Version Is Already on npm.
 *
 * @returns {boolean} Published flag
 */
function isPublished() {
  try {
    return run("npm", ["view", `${name}@${version}`, "version"]) === version;
  } catch {
    return false;
  }
}

/**
 * Return This Version's Section of the Changelog.
 *
 * @returns {string} Release notes
 */
function releaseNotes() {
  const changelog = readFileSync(`${pkgDir}CHANGELOG.md`, "utf8");
  const start = changelog.indexOf(`## ${version}`);

  if (start === -1) {
    return `See the [changelog](https://github.com/mbattaloglu/konfeti/blob/main/packages/konfeti/CHANGELOG.md).`;
  }

  const next = changelog.indexOf("\n## ", start + 1);
  return changelog
    .slice(start, next === -1 ? undefined : next)
    .replace(/^## .*\n/, "")
    .trim();
}

if (isPublished()) {
  console.log(`release: ${name}@${version} is already on npm — nothing to do`);
  process.exit(0);
}

// prepublishOnly builds the package first
execFileSync("npm", ["publish", "--access", "public"], { cwd: pkgDir, stdio: "inherit" });
console.log(`release: published ${name}@${version}`);

run("git", ["tag", "-a", tag, "-m", `${name} ${version}`]);
run("git", ["push", "origin", tag]);

const notesFile = `${root}.release-notes.md`;
writeFileSync(notesFile, releaseNotes());
run("gh", [
  "release",
  "create",
  tag,
  "--title",
  `${name} ${version}`,
  "--notes-file",
  notesFile,
  "--latest",
]);
console.log(`release: created GitHub release ${tag}`);
