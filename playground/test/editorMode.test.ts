import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeUrl } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ControlValue } from "../src/controlTypes";
import { CONTROL_INDEX, initialBurst, initialGlobals } from "../src/editor/burstState";
import {
  countHiddenAdvanced,
  DEFAULT_EDITOR_MODE,
  MODE_STORAGE_KEY,
  readEditorMode,
  writeEditorMode,
} from "../src/editor/editorMode";

/**
 * Count the Hidden Values of One Burst with Some Values Changed.
 *
 * @param changes - Changed Burst Values
 * @param globals - Changed Global Values
 * @returns Badge Count
 */
function hiddenIn(
  changes: Readonly<Record<string, ControlValue>>,
  globals: Readonly<Record<string, ControlValue>> = {},
): number {
  return countHiddenAdvanced(
    [{ ...initialBurst(), ...changes }],
    { ...initialGlobals(), ...globals },
    CONTROL_INDEX,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("countHiddenAdvanced", () => {
  it("counts nothing for a fresh editor", () => {
    expect(hiddenIn({})).toBe(0);
  });

  it("counts a changed advanced value that is active", () => {
    expect(hiddenIn({ delay: 500 })).toBe(1);
    expect(hiddenIn({ useSeed: true, seed: 7 })).toBe(2);
  });

  it("skips advanced values that are inactive", () => {
    // the seed only counts while Use Seed is on
    expect(hiddenIn({ seed: 7 })).toBe(0);
    // a card's controls only count while the card is on
    expect(hiddenIn({ "star.innerRatio": 0.3 })).toBe(0);
    expect(hiddenIn({ "star.enabled": true, "star.innerRatio": 0.3 })).toBe(1);
  });

  it("skips changed basic values", () => {
    expect(hiddenIn({ particleCount: 5, gravity: [1, 2], "star.enabled": true })).toBe(0);
  });

  it("counts changed hooks and every burst after the first", () => {
    expect(hiddenIn({}, { hookUpdate: true })).toBe(1);
    expect(hiddenIn({}, { hookUpdate: true, rainbow: true })).toBe(2);
    // the rainbow recolor only runs inside On Particle Update
    expect(hiddenIn({}, { rainbow: true })).toBe(0);
    expect(
      countHiddenAdvanced(
        [initialBurst(), { ...initialBurst(), delay: 100 }],
        initialGlobals(),
        CONTROL_INDEX,
      ),
    ).toBe(2);
  });
});

describe("editor mode storage", () => {
  it("remembers the mode", () => {
    expect(readEditorMode()).toBe(DEFAULT_EDITOR_MODE);
    writeEditorMode("advanced");
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe("advanced");
    expect(readEditorMode()).toBe("advanced");
  });

  it("falls back to Basic for an unknown stored value", () => {
    localStorage.setItem(MODE_STORAGE_KEY, "expert");
    expect(readEditorMode()).toBe("basic");
  });

  it("is read by the page's inline script with the same key and values", () => {
    // index.html applies the remembered mode before the first paint, before any module runs
    // node's URL: the test environment's own URL class is not a file URL to node:fs
    const page = readFileSync(fileURLToPath(new NodeUrl("../index.html", import.meta.url)), "utf8");

    expect(page).toContain(`localStorage.getItem("${MODE_STORAGE_KEY}") === "advanced"`);
    expect(page).toContain(`let mode = "${DEFAULT_EDITOR_MODE}";`);
  });

  it("falls back to Basic when storage is blocked", () => {
    const blocked = (): never => {
      throw new Error("storage is blocked");
    };

    vi.stubGlobal("localStorage", { getItem: blocked, setItem: blocked });

    expect(() => {
      writeEditorMode("advanced");
    }).not.toThrow();
    expect(readEditorMode()).toBe("basic");
  });
});
