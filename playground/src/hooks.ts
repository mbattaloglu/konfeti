import type { FireOptions } from "konfeti";

import type { ControlState } from "./controlTypes";
import { bool } from "./stateReaders";

/**
 * Lifecycle Callbacks Accepted by `fire()`.
 */
export type HookSet = Pick<
  FireOptions,
  "onStart" | "onParticleSpawn" | "onParticleUpdate" | "onParticleDeath" | "onComplete"
>;

/**
 * Live Hook Event Counters.
 */
export type HookCounters = {
  /**
   * `onStart` Calls.
   */
  started: number;
  /**
   * `onParticleSpawn` Calls.
   */
  spawned: number;
  /**
   * `onParticleUpdate` Calls.
   */
  updated: number;
  /**
   * `onParticleDeath` Calls.
   */
  died: number;
  /**
   * `onComplete` Calls.
   */
  completed: number;
};

/**
 * Hook Event Listener (burst-level events only).
 */
export type HookEventListener = (name: "onStart" | "onComplete") => void;

/**
 * Create Zeroed Counters.
 *
 * @returns Hook Counters
 */
export function createCounters(): HookCounters {
  return { started: 0, spawned: 0, updated: 0, died: 0, completed: 0 };
}

/**
 * Hue Degrees in a Full Turn.
 */
const FULL_HUE = 360;

/**
 * Build Hook Callbacks from the Hooks Section.
 *
 * @param state - Control State
 * @param counters - Counters to Increment
 * @param onEvent - Burst Event Listener
 * @returns Hook Set
 */
export function buildHooks(
  state: ControlState,
  counters: HookCounters,
  onEvent: HookEventListener,
): HookSet {
  const log = bool(state, "logEvents");
  const rainbow = bool(state, "rainbow");
  const hooks: { -readonly [K in keyof HookSet]: HookSet[K] } = {};

  if (bool(state, "hookStart")) {
    hooks.onStart = () => {
      counters.started++;
      onEvent("onStart");

      if (log) {
        console.log("[konfeti] onStart");
      }
    };
  }

  if (bool(state, "hookSpawn")) {
    hooks.onParticleSpawn = (particle) => {
      counters.spawned++;

      if (log) {
        console.log("[konfeti] onParticleSpawn", particle);
      }
    };
  }

  if (bool(state, "hookUpdate")) {
    hooks.onParticleUpdate = (particle) => {
      counters.updated++;

      if (rainbow) {
        const hue = Math.round((particle.age / particle.lifetime) * FULL_HUE);
        particle.frontColor = `hsl(${hue} 90% 60%)`;
      }
    };
  }

  if (bool(state, "hookDeath")) {
    hooks.onParticleDeath = (particle) => {
      counters.died++;

      if (log) {
        console.log("[konfeti] onParticleDeath", particle);
      }
    };
  }

  if (bool(state, "hookComplete")) {
    hooks.onComplete = () => {
      counters.completed++;
      onEvent("onComplete");

      if (log) {
        console.log("[konfeti] onComplete");
      }
    };
  }

  return hooks;
}
