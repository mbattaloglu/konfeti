import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Canonical Site URL (mbattaloglu.com/tools/konfeti serves the same build).
 */
export const SITE_URL = "https://konfeti.mbattaloglu.com/";

/**
 * Source Repository URL.
 */
export const REPO_URL = "https://github.com/mbattaloglu/konfeti";

/**
 * Agent Skill Path, the Same in the Package and on the Site.
 */
export const SKILL_PATH = "skills/konfeti/SKILL.md";

/**
 * Library Facts the Site Build Writes into Pages and Crawler Files.
 */
export type PackageInfo = {
  /**
   * Package Version.
   */
  readonly version: string;
  /**
   * One-Line Package Description.
   */
  readonly description: string;
  /**
   * English README (the guide).
   */
  readonly readme: string;
  /**
   * Turkish README.
   */
  readonly readmeTr: string;
  /**
   * Agent Skill (`skills/konfeti/SKILL.md`, shipped in the npm package too).
   */
  readonly skill: string;
};

/**
 * Read String Field of Parsed JSON.
 *
 * @param json - Parsed JSON
 * @param key - Field Name
 * @returns Field Value
 */
function stringField(json: unknown, key: string): string {
  const value: unknown =
    typeof json === "object" && json !== null ? Reflect.get(json, key) : undefined;

  if (typeof value !== "string") {
    throw new Error(`konfeti site: package.json has no "${key}" string`);
  }

  return value;
}

/**
 * Read Library Package Facts from Its Folder.
 *
 * @param packageDir - Library Package Folder
 * @returns Package Facts
 */
export function readPackageInfo(packageDir: string): PackageInfo {
  const json: unknown = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));

  return {
    version: stringField(json, "version"),
    description: stringField(json, "description"),
    readme: readFileSync(join(packageDir, "README.md"), "utf8"),
    readmeTr: readFileSync(join(packageDir, "README.tr.md"), "utf8"),
    skill: readFileSync(join(packageDir, SKILL_PATH), "utf8"),
  };
}
