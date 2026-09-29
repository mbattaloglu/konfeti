import { afterEach, describe, expect, it } from "vitest";

import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import { extendPreset } from "../../src/presets/extendPreset";
import { KonfetiPresets } from "../../src/presets/KonfetiPresets";
import type { KonfetiPresetName } from "../../src/presets/KonfetiPresets";
import type { KonfetiHandle } from "../../src/types/KonfetiHandle";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

/**
 * Create Test Instance with Manual Scheduler.
 *
 * @returns Instance and Scheduler
 */
function setup(): { konfeti: KonfetiInstance; scheduler: ManualScheduler } {
  const scheduler = new ManualScheduler();
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler });
  instances.push(konfeti);
  return { konfeti, scheduler };
}

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
});

describe("presets", () => {
  it.each(Object.keys(KonfetiPresets) as KonfetiPresetName[])("%s fires and finishes", (name) => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire(KonfetiPresets[name]);

    // longest preset: snow streams 6s + particles live up to 9s
    scheduler.step(1000, 20);
    expect(handle.isFinished()).toBe(true);
  });

  it("merges overrides into every burst without touching the preset", () => {
    const input = extendPreset(KonfetiPresets.SIDE_SHOTS, {
      particleCount: 5,
      paper: { colors: "red" },
    });
    expect(KonfetiPresets.SIDE_SHOTS[0].particleCount).toBe(70);

    expect(Array.isArray(input)).toBe(true);
    for (const burst of input as readonly {
      particleCount?: number;
      paper?: { colors?: unknown };
    }[]) {
      expect(burst.particleCount).toBe(5);
      expect(burst.paper?.colors).toBe("red");
    }
  });
});

describe("onClick", () => {
  it("fires at the click position and unsubscribes", () => {
    const { konfeti } = setup();
    const target = document.createElement("div");
    const handles: KonfetiHandle[] = [];
    const off = konfeti.onClick(target, (event) => ({
      particleCount: 2,
      startVelocity: 0,
      origin: event,
    }));
    const original = konfeti.fire.bind(konfeti);
    konfeti.fire = (input) => {
      const handle = original(input);
      handles.push(handle);
      return handle;
    };

    target.dispatchEvent(new MouseEvent("click", { clientX: 120, clientY: 80 }));
    const particles = (handles[0] as Burst).getParticles();
    expect(particles).toHaveLength(2);
    expect(particles.every((particle) => particle.x === 120 && particle.y === 80)).toBe(true);

    off();
    target.dispatchEvent(new MouseEvent("click", { clientX: 1, clientY: 1 }));
    expect(handles).toHaveLength(1);
  });

  it("removes every click listener on destroy", () => {
    const { konfeti } = setup();
    const target = document.createElement("div");
    konfeti.onClick(target, { particleCount: 1 });
    konfeti.destroy();

    expect(() => {
      target.dispatchEvent(new MouseEvent("click"));
    }).not.toThrow();
  });
});

describe("all shape kinds render", () => {
  it("draws every shape type without throwing", () => {
    const { konfeti, scheduler } = setup();
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 16;

    konfeti.fire({
      particleCount: 200,
      paper: {
        form: ["rect", "square", "circle", "strip", "leaf"],
        cornerRadius: 2,
        shine: 0.5,
        gradient: { colors: ["red", "blue"] },
      },
      shapes: [
        { type: "paper" },
        { type: "star", stroke: { color: "white" } },
        { type: "triangle" },
        { type: "polygon" },
        { type: "heart", shadow: {} },
        { type: "ribbon" },
        { type: "path", path: "M0 0L24 0L12 24Z" },
        { type: "emoji", emoji: "🎉" },
        { type: "text", text: "YAY" },
        { type: "image", src: canvas },
        { type: "spritesheet", src: canvas, frames: { cols: 4, rows: 1 } },
      ],
    });

    expect(() => {
      scheduler.step(10);
    }).not.toThrow();
    expect(konfeti.getParticleCount()).toBe(200);
  });
});
