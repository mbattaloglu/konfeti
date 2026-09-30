import { describe, expect, it } from "vitest";

import { QualityMonitor } from "../../src/core/QualityMonitor";

/**
 * Feed the Same Frame Several Times.
 *
 * @param monitor - Quality Monitor
 * @param frames - Frame Count
 * @param frameMs - Frame Time
 * @param workMs - konfeti's Work per Frame
 */
function feed(monitor: QualityMonitor, frames: number, frameMs: number, workMs: number): void {
  for (let frame = 0; frame < frames; frame++) {
    monitor.sample(frameMs, workMs);
  }
}

/**
 * Frames that Take One Second at a Given Frame Time.
 *
 * @param frameMs - Frame Time
 * @param seconds - Duration
 * @returns Frame Count
 */
function framesFor(frameMs: number, seconds: number): number {
  return Math.ceil((seconds * 1000) / frameMs);
}

describe("QualityMonitor", () => {
  it("ignores the warm-up frames", () => {
    const monitor = new QualityMonitor(3);
    feed(monitor, 10, 80, 60);

    expect(monitor.getLevel()).toBe(0);
  });

  it("steps down after half a second of slow frames that konfeti is drawing", () => {
    const monitor = new QualityMonitor(3);
    feed(monitor, 10, 40, 20);

    feed(monitor, framesFor(40, 0.45), 40, 20);
    expect(monitor.getLevel()).toBe(0);
    feed(monitor, framesFor(40, 0.1), 40, 20);
    expect(monitor.getLevel()).toBe(1);

    feed(monitor, framesFor(40, 5), 40, 20);
    // never past the lowest level it may reach
    expect(monitor.getLevel()).toBe(3);
  });

  it("does not blame konfeti for a busy page or a 30 Hz screen", () => {
    const monitor = new QualityMonitor(3);
    feed(monitor, framesFor(33, 5), 33.3, 2);

    expect(monitor.getLevel()).toBe(0);
  });

  it("steps back up after seconds of smooth frames", () => {
    const monitor = new QualityMonitor(3);
    feed(monitor, 10, 40, 20);
    feed(monitor, framesFor(40, 1.1), 40, 20);
    expect(monitor.getLevel()).toBe(2);

    // the smoothed frame time needs about half a second to settle, then 3 s of smooth frames per level
    feed(monitor, framesFor(16, 4), 16, 4);
    expect(monitor.getLevel()).toBe(1);
    feed(monitor, framesFor(16, 3.2), 16, 4);
    expect(monitor.getLevel()).toBe(0);
  });

  it("waits twice as long after a rise that did not hold", () => {
    const monitor = new QualityMonitor(3);
    feed(monitor, 10, 40, 20);
    feed(monitor, framesFor(40, 0.6), 40, 20);
    feed(monitor, framesFor(16, 4), 16, 4);
    expect(monitor.getLevel()).toBe(0);

    // slow again right after rising: back down, and the next rise needs 6 s of smooth frames
    feed(monitor, framesFor(40, 0.8), 40, 20);
    expect(monitor.getLevel()).toBe(1);
    feed(monitor, framesFor(16, 4), 16, 4);
    expect(monitor.getLevel()).toBe(1);
    feed(monitor, framesFor(16, 2.5), 16, 4);
    expect(monitor.getLevel()).toBe(0);
  });

  it("stops at the level it is given", () => {
    const monitor = new QualityMonitor(2);
    feed(monitor, 10, 40, 20);
    feed(monitor, framesFor(40, 5), 40, 20);

    expect(monitor.getLevel()).toBe(2);
  });
});
