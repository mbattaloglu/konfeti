import { afterEach, describe, expect, it } from "vitest";

import { DefaultInstance } from "../../src/api/DefaultInstance";
import { Konfeti, KonfetiFactory, KonfetiInstance } from "../../src/index";

afterEach(() => {
  Konfeti.reset();
});

describe("Konfeti (shared instance)", () => {
  it("creates the fullscreen instance lazily on first fire", () => {
    const before = DefaultInstance.peek();
    const handle = Konfeti.fire({ particleCount: 3 });

    expect(before === null || before instanceof KonfetiInstance).toBe(true);
    expect(DefaultInstance.peek()).toBeInstanceOf(KonfetiInstance);
    expect(handle.getParticleCount()).toBe(3);
    expect(Konfeti.getParticleCount()).toBeGreaterThanOrEqual(3);
  });

  it("resets the shared canvas", () => {
    Konfeti.fire({ particleCount: 5 });
    Konfeti.reset();

    expect(Konfeti.getParticleCount()).toBe(0);
  });

  it("fires from clicks and unsubscribes", () => {
    const target = document.createElement("div");
    const off = Konfeti.onClick(target, { particleCount: 2 });

    target.dispatchEvent(new MouseEvent("click", { clientX: 10, clientY: 10 }));
    expect(Konfeti.getParticleCount()).toBe(2);

    off();
    Konfeti.reset();
    target.dispatchEvent(new MouseEvent("click"));
    expect(Konfeti.getParticleCount()).toBe(0);
  });
});

describe("KonfetiFactory", () => {
  it("creates independent instances", () => {
    const canvas = document.createElement("canvas");
    const stage = KonfetiFactory.create(canvas, { maxParticles: 4 });

    expect(stage).toBeInstanceOf(KonfetiInstance);
    expect(stage.getCanvas()).toBe(canvas);
    expect(stage.fire({ particleCount: 10 }).getParticleCount()).toBe(4);
    stage.destroy();
  });
});
