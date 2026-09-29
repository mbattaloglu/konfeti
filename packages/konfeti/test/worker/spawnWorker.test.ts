import { afterEach, describe, expect, it, vi } from "vitest";

import { spawnWorker } from "../../src/worker/spawnWorker";
import { WorkerScriptLocation } from "../../src/worker/WorkerScriptLocation";

/**
 * Worker Double that Records the Script URL.
 */
class RecordingWorker {
  /**
   * Script URLs of Every Created Worker.
   */
  public static readonly urls: string[] = [];

  /**
   * Record Script URL.
   *
   * @param url - Worker Script URL
   */
  public constructor(url: string | URL) {
    RecordingWorker.urls.push(String(url));
  }

  /**
   * Accept Listener Registration (the blob URL cleanup).
   */
  public addEventListener(): void {
    // listeners are irrelevant for these tests
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  RecordingWorker.urls.length = 0;
});

describe("spawnWorker", () => {
  it("inlines the worker script as a blob by default", () => {
    vi.stubGlobal("Worker", RecordingWorker);
    spawnWorker();

    expect(RecordingWorker.urls[0]).toMatch(/^blob:/);
  });

  it("prefers an explicit URL, then the default location", () => {
    vi.stubGlobal("Worker", RecordingWorker);
    spawnWorker("/assets/konfeti.worker.js");
    WorkerScriptLocation.setDefault("https://cdn.example.com/konfeti/konfeti.worker.js");
    spawnWorker();

    expect(RecordingWorker.urls).toEqual([
      "/assets/konfeti.worker.js",
      "https://cdn.example.com/konfeti/konfeti.worker.js",
    ]);
  });
});
