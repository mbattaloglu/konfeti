// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { KonfetiPresets } from "../src/presets/KonfetiPresets";
import { BUILTIN_SHAPES } from "../src/shapes/handlers/BuiltinShapes";

/**
 * Package Folder.
 */
const PACKAGE_DIR = fileURLToPath(new URL("../", import.meta.url));

/**
 * Skill Folder (its name must match the skill's `name`).
 */
const SKILL_DIR = `${PACKAGE_DIR}skills/konfeti/`;

const skill = readFileSync(`${SKILL_DIR}SKILL.md`, "utf8");

/**
 * Read a Frontmatter Field of the Skill.
 *
 * @param key - Field Name
 * @returns Field Value, Empty When Missing
 */
function frontmatter(key: string): string {
  const header = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? "";
  return new RegExp(`^${key}: (.*)$`, "m").exec(header)?.[1]?.trim() ?? "";
}

/**
 * List the Backticked First-Column Entries of the Table Under a Heading.
 *
 * @param heading - Section Heading Text
 * @returns Entries
 */
function tableEntries(heading: string): string[] {
  const section = skill.split(`\n## ${heading}\n`)[1]?.split("\n## ")[0] ?? "";
  return [...section.matchAll(/^\| `([^`]+)`/gm)].map((match) => match[1] ?? "");
}

/**
 * Type-Check Code Samples Against the Library Source.
 *
 * @param samples - TypeScript Code Samples
 * @returns Error Messages, Each Prefixed with Its Sample Number
 */
function typeCheck(samples: readonly string[]): string[] {
  const files = new Map(
    samples.map((code, index) => [`${SKILL_DIR}sample${String(index)}.ts`, code]),
  );
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    moduleDetection: ts.ModuleDetectionKind.Force,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    types: [],
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    verbatimModuleSyntax: true,
    skipLibCheck: true,
    noEmit: true,
    // a user's project resolves these to the published package; here they are the sources
    paths: {
      konfeti: [`${PACKAGE_DIR}src/index.ts`],
      "konfeti/lite": [`${PACKAGE_DIR}src/lite.ts`],
      "konfeti/worker": [`${PACKAGE_DIR}src/workerEntry.ts`],
    },
  };
  const base = ts.createCompilerHost(options);
  const host: ts.CompilerHost = {
    ...base,
    fileExists: (name) => files.has(name) || base.fileExists(name),
    readFile: (name) => files.get(name) ?? base.readFile(name),
    getSourceFile: (name, version, onError) => {
      const code = files.get(name);
      return code === undefined
        ? base.getSourceFile(name, version, onError)
        : ts.createSourceFile(name, code, version, true);
    },
  };
  const program = ts.createProgram([...files.keys()], options, host);

  return [...files.keys()].flatMap((name, index) => {
    const source = program.getSourceFile(name);

    if (source === undefined) {
      return [`sample ${String(index)}: not compiled`];
    }

    return [
      ...program.getSyntacticDiagnostics(source),
      ...program.getSemanticDiagnostics(source),
    ].map((diagnostic) => {
      const line = source.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1;
      const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      return `sample ${String(index)}, line ${String(line)}: ${text}`;
    });
  });
}

describe("agent skill (skills/konfeti/SKILL.md)", () => {
  it("has the frontmatter agents need to find it", () => {
    const name = frontmatter("name");
    const description = frontmatter("description");

    expect(name).toBe("konfeti");
    expect(SKILL_DIR.endsWith(`/${name}/`)).toBe(true);
    expect(name).toMatch(/^[a-z0-9-]{1,64}$/);
    expect(description.length).toBeGreaterThan(100);
    expect(description.length).toBeLessThanOrEqual(1024);
  });

  it("lists every preset, and only those", () => {
    expect(tableEntries("Presets").sort()).toEqual(Object.keys(KonfetiPresets).sort());
  });

  it("lists every built-in shape, and only those", () => {
    const shapes = ["paper", ...BUILTIN_SHAPES.map((handler) => handler.type)];
    expect(tableEntries("Shapes").sort()).toEqual(shapes.sort());
  });

  it("has TypeScript samples that compile against the library", () => {
    const samples = [...skill.matchAll(/^```ts\n([\s\S]*?)^```$/gm)].map((match) => match[1] ?? "");

    expect(samples.length).toBeGreaterThan(5);
    expect(typeCheck(samples)).toEqual([]);
  }, 60_000);

  it("ships in the npm package", () => {
    const manifest: unknown = JSON.parse(readFileSync(`${PACKAGE_DIR}package.json`, "utf8"));
    const files: unknown =
      typeof manifest === "object" && manifest !== null ? Reflect.get(manifest, "files") : null;

    expect(files).toContain("skills");
  });
});
